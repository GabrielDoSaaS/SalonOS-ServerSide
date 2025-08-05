require('dotenv').config();
const express = require('express');
const corsMiddleware = require('./middleware/corsMiddleware');
const connectDB = require('./config/db');
const checkExpiredSubscriptions = require('./utils/expiredSubscriptionsChecker');

const authRoutes = require('./routes/authRoutes');
const establishmentRoutes = require('./routes/establishmentRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const mercadopagoRoutes = require('./routes/mercadopagoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(corsMiddleware);
app.use(express.json());

connectDB();

app.use('/api', authRoutes);
app.use('/api', establishmentRoutes);
app.use('/api', employeeRoutes);
app.use('/api', serviceRoutes);
app.use('/api', availabilityRoutes);
app.use('/api', appointmentRoutes);
app.use('/api', mercadopagoRoutes);

setInterval(checkExpiredSubscriptions, 24 * 60 * 60 * 1000);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    checkExpiredSubscriptions();
});