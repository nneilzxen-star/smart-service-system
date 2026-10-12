const { pool } = require('../utils/db');
const { successResponse, errorResponse } = require('../utils/response');
const { createAuditLog } = require('../services/auditService');
const { withTransaction } = require('../utils/transaction');

const getAvailableTechnicians = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT u.id, u.name, t.specialization, t.availability_status, t.experience, t.rating,
        (SELECT COUNT(*) FROM bookings WHERE technician_id = u.id AND status IN ('Assigned','Accepted','On the Way','In Progress')) AS active_jobs
      FROM users u
      JOIN technicians t ON u.id = t.user_id
      WHERE u.status = 'active'
      ORDER BY t.rating DESC
    `);
    return successResponse(res, { technicians: rows });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch technicians.', 500);
  }
};

const getTechnicianById = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
        t.specialization, t.availability_status, t.experience, t.rating
      FROM users u JOIN technicians t ON u.id = t.user_id WHERE u.id = ?
    `, [req.params.id]);
    if (!rows.length) return errorResponse(res, 'Technician not found.', 404);
    return successResponse(res, { technician: rows[0] });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch technician.', 500);
  }
};

const updateAvailability = async (req, res) => {
  const { availability_status } = req.body;
  const allowed = ['available', 'offline'];
  if (!allowed.includes(availability_status)) return errorResponse(res, 'Invalid availability status.', 400);
  try {
    const result = await withTransaction(async (connection) => {
      const [technicians] = await connection.execute(
        'SELECT user_id FROM technicians WHERE user_id = ? FOR UPDATE',
        [req.user.id]
      );
      if (!technicians.length) return { error: ['Technician profile not found.', 404] };
      const [[{ activeJobs }]] = await connection.execute(
        "SELECT COUNT(*) AS activeJobs FROM bookings WHERE technician_id = ? AND status IN ('Assigned','Accepted','On the Way','In Progress')",
        [req.user.id]
      );
      if (activeJobs > 0) return { error: ['Availability cannot be changed while you have an active job.', 409] };
      await connection.execute('UPDATE technicians SET availability_status = ? WHERE user_id = ?', [availability_status, req.user.id]);
      return { success: true };
    });
    if (result.error) return errorResponse(res, result.error[0], result.error[1]);
    return successResponse(res, {}, 'Availability updated.');
  } catch (err) {
    return errorResponse(res, 'Failed to update availability.', 500);
  }
};

const getTechnicianStats = async (req, res) => {
  const techId = req.user.id;
  try {
    const [total] = await pool.execute('SELECT COUNT(*) as count FROM bookings WHERE technician_id = ?', [techId]);
    const [completed] = await pool.execute("SELECT COUNT(*) as count FROM bookings WHERE technician_id = ? AND status = 'Completed'", [techId]);
    const [active] = await pool.execute("SELECT COUNT(*) as count FROM bookings WHERE technician_id = ? AND status IN ('Assigned','Accepted','On the Way','In Progress')", [techId]);
    const [earnings] = await pool.execute("SELECT COALESCE(SUM(final_cost), 0) as total FROM bookings WHERE technician_id = ? AND status = 'Completed'", [techId]);
    const [rating] = await pool.execute('SELECT rating FROM technicians WHERE user_id = ?', [techId]);
    return successResponse(res, {
      stats: {
        total_jobs: total[0].count,
        completed_jobs: completed[0].count,
        active_jobs: active[0].count,
        total_earnings: earnings[0].total,
        rating: rating[0]?.rating || 0,
      }
    });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch stats.', 500);
  }
};

const getAllTechnicians = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at,
        t.specialization, t.availability_status, t.experience, t.rating,
        (SELECT COUNT(*) FROM bookings WHERE technician_id = u.id AND status = 'Completed') AS completed_jobs
      FROM users u JOIN technicians t ON u.id = t.user_id
      ORDER BY u.name ASC
    `);
    return successResponse(res, { technicians: rows });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch technicians.', 500);
  }
};

const updateTechnician = async (req, res) => {
  const { specialization, experience, availability_status, status } = req.body;
  try {
    if (status) await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    await pool.execute('UPDATE technicians SET specialization=?, experience=?, availability_status=? WHERE user_id=?', [specialization, experience, availability_status, req.params.id]);
    await createAuditLog({ userId: req.user.id, action: 'USER_UPDATED', module: 'TECHNICIAN', recordId: req.params.id, description: `Technician (id: ${req.params.id}) updated`, ipAddress: req.ip });
    return successResponse(res, {}, 'Technician updated.');
  } catch (err) {
    return errorResponse(res, 'Failed to update technician.', 500);
  }
};

module.exports = { getAvailableTechnicians, getTechnicianById, updateAvailability, getTechnicianStats, getAllTechnicians, updateTechnician };
