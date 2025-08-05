const express = require('express');
const { createEstablishment, getEstablishment, updateEstablishment } = require('../controllers/establishmentController');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/establishments', authenticateToken, createEstablishment);
router.get('/establishments/:id', authenticateToken, getEstablishment);
router.put('/establishments/:id', authenticateToken, updateEstablishment);

module.exports = router;