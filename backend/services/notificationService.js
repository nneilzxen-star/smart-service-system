const { pool } = require('../utils/db');

const createNotification = async ({ userId, bookingId, title, message, type }) => {
  try {
    await pool.execute(
      'INSERT INTO notifications (user_id, booking_id, title, message, notification_type) VALUES (?, ?, ?, ?, ?)',
      [userId, bookingId || null, title, message, type || 'general']
    );
    console.log(`📬 Notification sent to user ${userId}: ${title}`);
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

const notifyAdmins = async ({ bookingId, title, message, type }) => {
  try {
    const [admins] = await pool.execute("SELECT id FROM users WHERE role = 'admin' AND status = 'active'");
    for (const admin of admins) {
      await createNotification({ userId: admin.id, bookingId, title, message, type });
    }
  } catch (err) {
    console.error('Admin notification error:', err.message);
  }
};

module.exports = { createNotification, notifyAdmins };
