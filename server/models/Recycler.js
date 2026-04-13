const mongoose = require('mongoose');

const recyclerSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  city:  { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  rating:   { type: Number, default: 4.5 },
  pickups:  { type: Number, default: 0 },
  certified:{ type: Boolean, default: true },
}, { timestamps: true });

recyclerSchema.index({ city: 1 });

module.exports = mongoose.model('Recycler', recyclerSchema);
