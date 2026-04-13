const express  = require('express');
const router   = express.Router();
const Booking  = require('../models/Booking');
const Recycler = require('../models/Recycler');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { sendBookingConfirmed, sendStatusUpdate } = require('../services/email');

const assignRecycler = async (city) => {
  const recycler = await Recycler.findOne({ city });
  return recycler ? recycler.name : 'Assigning…';
};

// GET /api/bookings  (admin: all | user: own)
router.get('/', verifyToken, async (req, res) => {
  try {
    const isAdmin = req.user.email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase();
    const query   = isAdmin ? {} : { uid: req.user.uid };
    const bookings = await Booking.find(query).sort({ createdAt: -1 }).lean();
    res.json(bookings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/bookings/stats  (admin only)
router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [total, pending, confirmed, pickedUp, recycled, cancelled, paid] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'Pending' }),
      Booking.countDocuments({ status: 'Confirmed' }),
      Booking.countDocuments({ status: 'Picked Up' }),
      Booking.countDocuments({ status: 'Recycled' }),
      Booking.countDocuments({ status: 'Cancelled' }),
      Booking.countDocuments({ paymentStatus: 'Paid' }),
    ]);
    const rewardAgg   = await Booking.aggregate([{ $group: { _id: null, total: { $sum: '$reward' } } }]);
    const totalReward = rewardAgg[0]?.total || 0;

    const cityData = await Booking.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 6 },
    ]);
    const deviceData = await Booking.aggregate([
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 6 },
    ]);

    // Fill all 14 days including zeros
    const start = new Date();
    start.setDate(start.getDate() - 13);
    start.setHours(0,0,0,0);
    const rawDaily = await Booking.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    // Build full 14-day array with zeros for missing days
    const dailyMap = {};
    rawDaily.forEach(d => { dailyMap[d._id] = d.count; });
    const dailyData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyData.push({ _id: key, count: dailyMap[key] || 0 });
    }

    res.json({ total, pending, confirmed, pickedUp, recycled, cancelled, paid, totalReward, cityData, deviceData, dailyData });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/bookings/recycler
router.get('/recycler', verifyToken, async (req, res) => {
  try {
    const recycler = await Recycler.findOne({ email: req.user.email.toLowerCase() });
    if (!recycler) return res.status(403).json({ error: 'Not a registered recycler' });
    const bookings = await Booking.find({ recycler: recycler.name }).sort({ createdAt: -1 }).lean();
    res.json({ bookings, recycler });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/bookings  (create)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { device, condition, qty, city, pincode, address, date, slot, reward, user, phone, email, upi } = req.body;
    if (!device || !condition || !city || !pincode || !date || !slot || !user || !phone || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const recyclerName = await assignRecycler(city);
    const booking = await Booking.create({
      device, condition, qty: qty || 1,
      city, pincode, address: address || '', date, slot,
      reward: reward || 0,
      user, phone, email, upi: upi || '',
      recycler: recyclerName,
      status: 'Confirmed',
      uid: req.user.uid,
      history: [{ status: 'Confirmed', ts: new Date() }],
    });
    sendBookingConfirmed(booking).catch(e => {
      console.error('[Email] BOOKING CONFIRMED failed:', e.message, '| code:', e.code, '| response:', e.responseCode);
    });
    res.status(201).json(booking);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/bookings/:id/status
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Confirmed','Picked Up','Recycled','Cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: { status }, $push: { history: { status, ts: new Date() } } },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    sendStatusUpdate(booking, status).catch(e => {
      console.error(`[Email] STATUS UPDATE (${status}) failed:`, e.message, '| code:', e.code, '| response:', e.responseCode);
    });
    res.json(booking);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/bookings/:id/payment  (admin only)
router.patch('/:id/payment', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { razorpayPaymentId } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { $set: { paymentStatus: 'Paid', razorpayPaymentId: razorpayPaymentId || 'MANUAL', paidAt: new Date() } },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    sendStatusUpdate(booking, 'Paid').catch(e => {
      console.error('[Email] PAYMENT STATUS failed:', e.message, '| code:', e.code, '| response:', e.responseCode);
    });
    res.json(booking);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/bookings/:id  (admin only — or user cancels their own Pending)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const isAdmin = req.user.email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase();
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!isAdmin) {
      if (booking.uid !== req.user.uid) return res.status(403).json({ error: 'Not your booking' });
      if (!['Pending','Confirmed'].includes(booking.status)) {
        return res.status(400).json({ error: 'Cannot cancel after pickup' });
      }
    }
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
