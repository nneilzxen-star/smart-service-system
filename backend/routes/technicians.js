const router = require('express').Router();
const { getAvailableTechnicians, getTechnicianById, updateAvailability, getTechnicianStats, getAllTechnicians, updateTechnician } = require('../controllers/technicianController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/available', authenticate, authorize('admin'), getAvailableTechnicians);
router.get('/stats', authenticate, authorize('technician'), getTechnicianStats);
router.get('/all', authenticate, authorize('admin'), getAllTechnicians);
router.put('/availability', authenticate, authorize('technician'), updateAvailability);
router.get('/:id', authenticate, authorize('admin'), getTechnicianById);
router.put('/:id', authenticate, authorize('admin'), updateTechnician);

module.exports = router;
