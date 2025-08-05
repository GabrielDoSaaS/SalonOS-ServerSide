const express = require('express');
const { addService, getEstablishmentServices, updateService, deleteService } = require('../controllers/serviceController');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/services', authenticateToken, addService);
router.get('/services/:establishmentId', authenticateToken, getEstablishmentServices);
router.put('/services/:id', authenticateToken, updateService);
router.delete('/services/:id', authenticateToken, deleteService);

module.exports = router;