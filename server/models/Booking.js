const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  status: String,
  ts:     { type: Date, default: Date.now },
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  // Device info
  device:    { type: String, required: true },
  condition: { type: String, required: true },
  qty:       { type: Number, default: 1 },
  reward:    { type: Number, default: 0 },

  // Pickup location
  city:    { type: String, required: true },
  pincode: { type: String, required: true },
  address: String,
  date:    { type: String, required: true },
  slot:    { type: String, required: true },

  // Customer
  user:  { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  upi:   { type: String, default: '' },
  uid:   { type: String, required: true },
  notes: { type: String, default: '' },

  // Operations
  recycler:          { type: String, default: 'Assigning…' },
  status:            { type: String, default: 'Confirmed', enum: ['Pending','Confirmed','Picked Up','Recycled','Cancelled'] },
  paymentStatus:     { type: String, default: 'Pending', enum: ['Pending','Paid'] },
  razorpayPaymentId: String,
  paidAt:            Date,
  history:           [historySchema],
}, { timestamps: true });

bookingSchema.index({ uid: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ recycler: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
