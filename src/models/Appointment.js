const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    establishmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Establishment', required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    serviceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }],
    clientName: { type: String, required: true },
    clientPhone: { type: String, required: true },
    appointmentDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    paymentId: { type: String, default: null },
    status: { type: String, enum: ['pending_payment', 'confirmed', 'completed', 'cancelled'], default: 'pending_payment' }
});

const Appointment = mongoose.model('Appointment', AppointmentSchema);
module.exports = Appointment;