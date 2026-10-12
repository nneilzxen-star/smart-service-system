const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../utils/db');
const { successResponse, errorResponse } = require('../utils/response');
const { createAuditLog } = require('../services/auditService');
const { withTransaction } = require('../utils/transaction');

const register = async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return errorResponse(res, 'Name, email, and password are required.', 400);
  }
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedName || normalizedName.length > 100 || normalizedEmail.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return errorResponse(res, 'Enter a valid name and email address.', 400);
  }
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return errorResponse(res, 'Password must be at least 8 characters and no more than 72 UTF-8 bytes.', 400);
  }
  const allowedRoles = ['customer', 'technician'];
  if (role !== undefined && !allowedRoles.includes(role)) return errorResponse(res, 'Invalid account role.', 400);
  const userRole = role || 'customer';
  if (phone != null && (typeof phone !== 'string' || phone.length > 20)) {
    return errorResponse(res, 'Phone number must be 20 characters or fewer.', 400);
  }

  try {
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length) return errorResponse(res, 'An account with this email already exists.', 409);

    const hash = await bcrypt.hash(password, 10);
    const userId = await withTransaction(async (connection) => {
      const [result] = await connection.execute(
        'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [normalizedName, normalizedEmail, phone || null, hash, userRole]
      );
      if (userRole === 'technician') {
        const specialization = typeof req.body.specialization === 'string' ? req.body.specialization.trim() : '';
        if (specialization.length > 100) {
          const error = new Error('Specialization must be 100 characters or fewer.');
          error.statusCode = 400;
          throw error;
        }
        await connection.execute(
          'INSERT INTO technicians (user_id, specialization) VALUES (?, ?)',
          [result.insertId, specialization || 'General']
        );
      }
      return result.insertId;
    });

    await createAuditLog({ userId, action: 'USER_REGISTERED', module: 'AUTH', recordId: userId, description: `New ${userRole} registered: ${normalizedName}`, ipAddress: req.ip });

    const token = jwt.sign({ id: userId, role: userRole }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    return successResponse(res, {
      token,
      user: {
        id: userId,
        name: normalizedName,
        email: normalizedEmail,
        role: userRole,
        ...(userRole === 'technician' ? { availability_status: 'available' } : {}),
      },
    }, 'Registration successful.', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return errorResponse(res, 'An account with this email already exists.', 409);
    if (err.statusCode === 400) return errorResponse(res, err.message, 400);
    console.error(err);
    return errorResponse(res, 'Registration failed. Please try again.', 500);
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password || Buffer.byteLength(password, 'utf8') > 72) {
    return errorResponse(res, 'Email and password are required.', 400);
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!rows.length) return errorResponse(res, 'Invalid email or password.', 401);
    const user = rows[0];
    if (user.status !== 'active') return errorResponse(res, 'Your account has been suspended. Please contact support.', 403);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return errorResponse(res, 'Invalid email or password.', 401);

    await createAuditLog({ userId: user.id, action: 'USER_LOGIN', module: 'AUTH', recordId: user.id, description: `${user.role} ${user.name} logged in`, ipAddress: req.ip });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    const { password_hash, ...safeUser } = user;
    if (user.role === 'technician') {
      const [technicians] = await pool.execute(
        'SELECT specialization, availability_status, experience, rating FROM technicians WHERE user_id = ?',
        [user.id]
      );
      Object.assign(safeUser, technicians[0] || {});
    }
    return successResponse(res, { token, user: safeUser }, 'Login successful.');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Login failed. Please try again.', 500);
  }
};

const getMe = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT u.id, u.name, u.email, u.phone, u.role, u.profile_image, u.status, u.created_at, t.specialization, t.availability_status, t.experience, t.rating FROM users u LEFT JOIN technicians t ON u.id = t.user_id WHERE u.id = ?',
      [req.user.id]
    );
    if (!rows.length) return errorResponse(res, 'User not found.', 404);
    return successResponse(res, { user: rows[0] });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch user.', 500);
  }
};

const updateProfile = async (req, res) => {
  const { name, phone, specialization } = req.body;
  try {
    await pool.execute('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, req.user.id]);
    if (req.user.role === 'technician' && specialization) {
      await pool.execute('UPDATE technicians SET specialization = ? WHERE user_id = ?', [specialization, req.user.id]);
    }
    await createAuditLog({ userId: req.user.id, action: 'USER_UPDATED', module: 'AUTH', recordId: req.user.id, description: `User ${req.user.name} updated profile`, ipAddress: req.ip });
    return successResponse(res, {}, 'Profile updated successfully.');
  } catch (err) {
    return errorResponse(res, 'Failed to update profile.', 500);
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
    return errorResponse(res, 'Current and new password are required.', 400);
  }
  if (newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
    return errorResponse(res, 'New password must be at least 8 characters and no more than 72 UTF-8 bytes.', 400);
  }
  try {
    const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) return errorResponse(res, 'Current password is incorrect.', 400);
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    return successResponse(res, {}, 'Password changed successfully.');
  } catch (err) {
    return errorResponse(res, 'Failed to change password.', 500);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
