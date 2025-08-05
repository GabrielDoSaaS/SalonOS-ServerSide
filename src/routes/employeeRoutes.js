const express = require('express');
const { addEmployee, getEstablishmentEmployees, updateEmployee, deleteEmployee } = require('../controllers/employeeController');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/employees', authenticateToken, addEmployee);
router.get('/employees/:establishmentId', authenticateToken, getEstablishmentEmployees);
router.put('/employees/:id', authenticateToken, updateEmployee);
router.delete('/employees/:id', authenticateToken, deleteEmployee);

module.exports = router;