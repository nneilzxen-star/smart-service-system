const router = require('express').Router();
const {
  getBookings, getBookingById, createBooking, updateBooking, cancelBooking,
  assignTechnician, acceptBooking, rejectBooking, updateStatus, submitReview
} = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, getBookings);
router.post('/', authenticate, authorize('customer', 'admin'), createBooking);
router.get('/:id', authenticate, getBookingById);
router.put('/:id', authenticate, authorize('customer', 'admin'), updateBooking);
router.delete('/:id', authenticate, authorize('customer', 'admin'), cancelBooking);
router.post('/:id/assign', authenticate, authorize('admin'), assignTechnician);
router.post('/:id/accept', authenticate, authorize('technician'), acceptBooking);
router.post('/:id/reject', authenticate, authorize('technician'), rejectBooking);
router.post('/:id/status', authenticate, authorize('technician', 'admin'), updateStatus);
router.post('/:id/review', authenticate, authorize('customer'), submitReview);

module.exports = router;
