const express = require('express');
const { getPublicEstablishmentDetails, getAvailableTimes, initiatePayment, getEstablishmentAppointments, updateAppointmentStatus } = require('../controllers/appointmentController');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/public/establishment/:establishmentId', getPublicEstablishmentDetails);
router.get('/public/available-times/:employeeId/:date', getAvailableTimes);
router.post('/public/appointments/initiate-payment', initiatePayment);
router.get('/appointments/:establishmentId', authenticateToken, getEstablishmentAppointments);
router.put('/appointments/:id/status', authenticateToken, updateAppointmentStatus);

module.exports = router;