const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true },
    days: [{
        dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
        intervals: [{
            start: { type: String, required: true },
            end: { type: String, required: true }
        }]
    }]
});

const Availability = mongoose.model('Availability', AvailabilitySchema);
module.exports = Availability;