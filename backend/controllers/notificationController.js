const { pool } = require('../utils/db');
const { successResponse, errorResponse } = require('../utils/response');

const getNotifications = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const [unread] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    return successResponse(res, { notifications: rows, unread_count: unread[0].count });
  } catch (err) {
    return errorResponse(res, 'Failed to fetch notifications.', 500);
  }
};

const markAsRead = async (req, res) => {
  try {
    await pool.execute('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return successResponse(res, {}, 'Notification marked as read.');
  } catch (err) {
    return errorResponse(res, 'Failed to update notification.', 500);
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await pool.execute('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    return successResponse(res, {}, 'All notifications marked as read.');
  } catch (err) {
    return errorResponse(res, 'Failed to update notifications.', 500);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
