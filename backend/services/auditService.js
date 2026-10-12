const { pool } = require('../utils/db');

const createAuditLog = async ({ userId, action, module, recordId, description, ipAddress }) => {
  try {
    await pool.execute(
      'INSERT INTO audit_logs (user_id, action, module, record_id, description, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [userId || null, action, module || null, recordId || null, description || null, ipAddress || null]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { createAuditLog };
