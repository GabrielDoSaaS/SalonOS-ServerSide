const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['establishment', 'employee'], required: true },
    establishmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Establishment', default: null },
    planoAtivo: { type: Boolean, default: false },
    dataExpiracaoPlano: { type: Date, default: null }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;