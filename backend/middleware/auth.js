const jwt = require('jsonwebtoken');
const { pool } = require('../utils/db');
const { errorResponse } = require('../utils/response');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Access denied. No token provided.', 401);
  }
  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return errorResponse(res, 'Invalid or expired token.', 401);
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email, role, status FROM users WHERE id = ? AND status = 'active'",
      [decoded.id]
    );
    if (!rows.length) return errorResponse(res, 'User not found or inactive.', 401);
    req.user = rows[0];
    next();
  } catch (error) {
    next(error);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return errorResponse(res, 'Access denied. Insufficient permissions.', 403);
  }
  next();
};

module.exports = { authenticate, authorize };
