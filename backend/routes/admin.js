const router = require('express').Router();
const { getDashboard, getBookingReport, getTechnicianReport, getAuditLogs, getUsers, updateUser, deleteUser, getBillingRecords, updatePaymentStatus } = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/dashboard', authenticate, authorize('admin'), getDashboard);
router.get('/reports/bookings', authenticate, authorize('admin'), getBookingReport);
router.get('/reports/technicians', authenticate, authorize('admin'), getTechnicianReport);
router.get('/audit-logs', authenticate, authorize('admin'), getAuditLogs);
router.get('/users', authenticate, authorize('admin'), getUsers);
router.put('/users/:id', authenticate, authorize('admin'), updateUser);
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
router.get('/billing', authenticate, authorize('admin'), getBillingRecords);
router.put('/billing/:id/payment', authenticate, authorize('admin'), updatePaymentStatus);

module.exports = router;
