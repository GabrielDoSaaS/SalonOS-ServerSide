const express = require('express');
const { setAvailability, getAvailability } = require('../controllers/availabilityController');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/availability', authenticateToken, setAvailability);
router.get('/availability/:employeeId', getAvailability);

module.exports = router;