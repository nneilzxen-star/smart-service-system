const { pool } = require('../utils/db');
const { successResponse, errorResponse } = require('../utils/response');
const { createAuditLog } = require('../services/auditService');

const getDashboard = async (req, res) => {
  try {
    const [[totalBookings]] = await pool.execute('SELECT COUNT(*) as count FROM bookings');
    const [[pendingBookings]] = await pool.execute("SELECT COUNT(*) as count FROM bookings WHERE status = 'Pending'");
    const [[activeJobs]] = await pool.execute("SELECT COUNT(*) as count FROM bookings WHERE status IN ('Assigned','Accepted','On the Way','In Progress')");
    const [[completedJobs]] = await pool.execute("SELECT COUNT(*) as count FROM bookings WHERE status = 'Completed'");
    const [[availableTechs]] = await pool.execute("SELECT COUNT(*) as count FROM technicians WHERE availability_status = 'available'");
    const [[totalCustomers]] = await pool.execute("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
    const [[revenue]] = await pool.execute("SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE payment_status = 'Paid'");
    const [[avgRating]] = await pool.execute('SELECT COALESCE(AVG(rating), 0) as avg FROM reviews');

    const [recentBookings] = await pool.execute(`
      SELECT b.id, b.booking_reference, b.status, b.created_at, b.estimated_cost,
        u.name AS customer_name, s.name AS service_name
      FROM bookings b JOIN users u ON b.customer_id = u.id JOIN services s ON b.service_id = s.id
      ORDER BY b.created_at DESC LIMIT 10
    `);

    const [bookingTrend] = await pool.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM bookings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at) ORDER BY date ASC
    `);

    const [serviceStats] = await pool.execute(`
      SELECT s.name, s.category, COUNT(b.id) as booking_count
      FROM services s LEFT JOIN bookings b ON s.id = b.service_id
      GROUP BY s.id ORDER BY booking_count DESC LIMIT 8
    `);

    const [techPerformance] = await pool.execute(`
      SELECT u.name, t.rating, t.specialization,
        COUNT(b.id) as total_jobs,
        SUM(CASE WHEN b.status = 'Completed' THEN 1 ELSE 0 END) as completed
      FROM technicians t JOIN users u ON t.user_id = u.id
      LEFT JOIN bookings b ON u.id = b.technician_id
      GROUP BY u.id ORDER BY t.rating DESC LIMIT 5
    `);

    const [recentActivity] = await pool.execute(`
      SELECT al.*, u.name AS user_name, u.role AS user_role
      FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.timestamp DESC LIMIT 10
    `);

    return successResponse(res, {
      stats: {
        total_bookings: totalBookings.count,
        pending_bookings: pendingBookings.count,
        active_jobs: activeJobs.count,
        completed_jobs: completedJobs.count,
        available_technicians: availableTechs.count,
        total_customers: totalCustomers.count,
        revenue: revenue.total,
        avg_rating: parseFloat(avgRating.avg).toFixed(2),
      },
      recent_bookings: recentBookings,
      booking_trend: bookingTrend,
      service_stats: serviceStats,
      tech_performance: techPerformance,
      recent_activity: recentActivity,
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Failed to fetch dashboard data.', 500);
  }
};

const getBookingReport = async (req, res) => {
  const { from, to, status, service_id, technician_id } = req.query;
  try {
    let where = ' WHERE 1=1';
    const params = [];
    if (from) { where += ' AND DATE(b.created_at) >= ?'; params.push(from); }
    if (to) { where += ' AND DATE(b.created_at) <= ?'; params.push(to); }
    if (status) { where += ' AND b.status = ?'; params.push(status); }
    if (service_id) { where += ' AND b.service_id = ?'; params.push(service_id); }
    if (technician_id) { where += ' AND b.technician_id = ?'; params.push(technician_id); }

    const [rows] = await pool.execute(`
      SELECT b.*, u.name AS customer_name, s.name AS service_name, t.name AS technician_name
      FROM bookings b JOIN users u ON b.customer_id = u.id JOIN services s ON b.service_id = s.id
      LEFT JOIN users t ON b.technician_id = t.id${where} ORDER BY b.created_at DESC
    `, params);

    const [[summary]] = await pool.execute(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status='Cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status='Pending' THEN 1 ELSE 0 END) as pending,
        COALESCE(SUM(final_cost), 0) as revenue
      FROM bookings b${where}
    `, params);

    return successResponse(res, { bookings: rows, summary });
  } catch (err) {
    return errorResponse(res, 'Failed to generate report.', 500);
  }
};

const getTechnicianReport = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT u.id, u.name, t.specialization, t.rating, t.availability_status,
        COUNT(b.id) as total_jobs,
        SUM(CASE WHEN b.status='Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN b.status='Cancelled' THEN 1 ELSE 0 END) as cancelled,
        COALESCE(SUM(b.final_cost), 0) as revenue_generated
      FROM users u JOIN technicians t ON u.id = t.user_id
      LEFT JOIN bookings b ON u.id = b.technician_id
      WHERE u.status = 'active' GROUP BY u.id ORDER BY completed DESC
    `);
    return successResponse(res, { technicians: rows });
  } catch (err) {
    return errorResponse(res, 'Failed to generate technician report.', 500);
  }
};

const getAuditLogs = async (req, res) => {
  const { page = 1, limit = 50, action, module } = req.query;
  const offset = (page - 1) * limit;
  try {
    let where = ' WHERE 1=1';
    const params = [];
    if (action) { where += ' AND al.action = ?'; params.push(action); }
    if (module) { where += ' AND al.module = ?'; params.push(module); }

    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) as total FROM audit_logs al${where}`, params);
    const [rows] = await pool.execute(`
      SELECT al.*, u.name AS user_name, u.role AS user_role
      FROM audit_logs al LEFT JOIN users u ON al.user_id = u.id${where}
      ORDER BY al.timestamp DESC LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    return successResponse(res, { logs: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch audit logs.', 500);
  }
};

const getUsers = async (req, res) => {
  const { role, status } = req.query;
  try {
    let where = ' WHERE 1=1';
    const params = [];
    if (role) { where += ' AND role = ?'; params.push(role); }
    if (status) { where += ' AND status = ?'; params.push(status); }
    const [rows] = await pool.execute(`SELECT id, name, email, phone, role, status, created_at FROM users${where} ORDER BY created_at DESC`, params);
    return successResponse(res, { users: rows });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch users.', 500);
  }
};

const updateUser = async (req, res) => {
  const { name, phone, status, role } = req.body;
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId < 1) return errorResponse(res, 'Invalid user ID.', 400);
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    return errorResponse(res, 'Name is required and must be 100 characters or fewer.', 400);
  }
  if (phone != null && (typeof phone !== 'string' || phone.length > 20)) {
    return errorResponse(res, 'Phone number must be 20 characters or fewer.', 400);
  }
  if (!['customer', 'technician', 'admin'].includes(role)) return errorResponse(res, 'Invalid user role.', 400);
  if (!['active', 'inactive', 'suspended'].includes(status)) return errorResponse(res, 'Invalid user status.', 400);
  try {
    const [rows] = await pool.execute('SELECT id, role, status FROM users WHERE id = ?', [userId]);
    if (!rows.length) return errorResponse(res, 'User not found.', 404);
    const user = rows[0];
    if (userId === req.user.id && (role !== 'admin' || status !== 'active')) {
      return errorResponse(res, 'You cannot remove your own administrator access.', 400);
    }
    if (user.role === 'admin' && user.status === 'active' && (role !== 'admin' || status !== 'active')) {
      const [[{ activeAdmins }]] = await pool.execute(
        "SELECT COUNT(*) AS activeAdmins FROM users WHERE role = 'admin' AND status = 'active'"
      );
      if (activeAdmins <= 1) return errorResponse(res, 'The system must retain at least one active administrator.', 409);
    }
    await pool.execute('UPDATE users SET name=?, phone=?, status=?, role=? WHERE id=?', [name.trim(), phone || null, status, role, userId]);
    await createAuditLog({ userId: req.user.id, action: 'USER_UPDATED', module: 'USER', recordId: userId, description: `User (id: ${userId}) updated by admin`, ipAddress: req.ip });
    return successResponse(res, {}, 'User updated.');
  } catch (err) {
    return errorResponse(res, 'Failed to update user.', 500);
  }
};

const deleteUser = async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId < 1) return errorResponse(res, 'Invalid user ID.', 400);
  try {
    const [rows] = await pool.execute('SELECT id, role, status FROM users WHERE id = ?', [userId]);
    if (!rows.length) return errorResponse(res, 'User not found.', 404);
    const user = rows[0];
    if (userId === req.user.id) return errorResponse(res, 'You cannot deactivate your own administrator account.', 400);
    if (user.role === 'admin' && user.status === 'active') {
      const [[{ activeAdmins }]] = await pool.execute(
        "SELECT COUNT(*) AS activeAdmins FROM users WHERE role = 'admin' AND status = 'active'"
      );
      if (activeAdmins <= 1) return errorResponse(res, 'The system must retain at least one active administrator.', 409);
    }
    await pool.execute("UPDATE users SET status = 'inactive' WHERE id = ?", [userId]);
    await createAuditLog({ userId: req.user.id, action: 'USER_DELETED', module: 'USER', recordId: userId, description: `User (id: ${userId}) deactivated by admin`, ipAddress: req.ip });
    return successResponse(res, {}, 'User deactivated.');
  } catch (err) {
    return errorResponse(res, 'Failed to delete user.', 500);
  }
};

const getBillingRecords = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT i.*, b.booking_reference, b.status AS booking_status,
        u.name AS customer_name, s.name AS service_name
      FROM invoices i JOIN bookings b ON i.booking_id = b.id
      JOIN users u ON b.customer_id = u.id JOIN services s ON b.service_id = s.id
      ORDER BY i.created_at DESC
    `);
    return successResponse(res, { invoices: rows });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch billing records.', 500);
  }
};

const updatePaymentStatus = async (req, res) => {
  const { payment_status } = req.body;
  const allowed = ['Pending', 'Paid', 'Unpaid', 'Cancelled'];
  if (!allowed.includes(payment_status)) return errorResponse(res, 'Invalid payment status.', 400);
  try {
    await pool.execute('UPDATE invoices SET payment_status = ? WHERE id = ?', [payment_status, req.params.id]);
    await createAuditLog({ userId: req.user.id, action: 'INVOICE_UPDATED', module: 'BILLING', recordId: req.params.id, description: `Invoice payment status updated to ${payment_status}`, ipAddress: req.ip });
    return successResponse(res, {}, 'Payment status updated.');
  } catch (err) {
    return errorResponse(res, 'Failed to update payment status.', 500);
  }
};

module.exports = { getDashboard, getBookingReport, getTechnicianReport, getAuditLogs, getUsers, updateUser, deleteUser, getBillingRecords, updatePaymentStatus };
