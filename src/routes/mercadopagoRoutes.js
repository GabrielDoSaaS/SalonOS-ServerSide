const express = require('express');
const { createMonthlySubscription, createAnnualSubscription, handleWebhook } = require('../controllers/mercadopagoController');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/subscriptions/monthly', authenticateToken, createMonthlySubscription);
router.post('/subscriptions/annual', authenticateToken, createAnnualSubscription);
router.post('/mercadopago/webhook', handleWebhook);

module.exports = router;