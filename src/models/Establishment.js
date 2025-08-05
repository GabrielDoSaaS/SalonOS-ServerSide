const mongoose = require('mongoose');

const EstablishmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    description: { type: String },
    publicLink: { type: String, unique: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

EstablishmentSchema.pre('save', async function(next) {
    if (this.isNew) {
        this.publicLink = `/${this._id.toString()}`;
    }
    next();
});

const Establishment = mongoose.model('Establishment', EstablishmentSchema);
module.exports = Establishment;