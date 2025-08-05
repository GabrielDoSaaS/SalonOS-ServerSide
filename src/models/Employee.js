const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true },
    phone: { type: String },
    establishmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Establishment', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

const Employee = mongoose.model('Employee', EmployeeSchema);
module.exports = Employee;