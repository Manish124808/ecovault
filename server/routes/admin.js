// server/routes/admin.js
// Dedicated admin routes — all data fetched in one place with clear error messages
const express = require('express');
const router  = express.Router();
const Booking = require('../models/Booking');
const User    = require('../models/User');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(verifyToken, requireAdmin);

// ── GET /api/admin/stats ─────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
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

    // Build full 14-day array with zeros for missing days
    const start = new Date();
    start.setDate(start.getDate() - 13);
    start.setHours(0, 0, 0, 0);
    const rawDaily = await Booking.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
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
  } catch (err) {
    console.error('[admin/stats]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/bookings ──────────────────────────────────────────────
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find({}).sort({ createdAt: -1 }).lean();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/users ─────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/all ───────────────────────────────────────────────────
// Single endpoint that fetches everything the admin dashboard needs at once
// so 4 separate fetch calls can't independently fail with 403/401
router.get('/all', async (req, res) => {
  const result = { stats: null, bookings: [], users: [], errors: {} };

  await Promise.allSettled([
    (async () => {
      const [total, pending, confirmed, pickedUp, recycled, cancelled, paid] = await Promise.all([
        Booking.countDocuments(),
        Booking.countDocuments({ status: 'Pending' }),
        Booking.countDocuments({ status: 'Confirmed' }),
        Booking.countDocuments({ status: 'Picked Up' }),
        Booking.countDocuments({ status: 'Recycled' }),
        Booking.countDocuments({ status: 'Cancelled' }),
        Booking.countDocuments({ paymentStatus: 'Paid' }),
      ]);
      const rewardAgg = await Booking.aggregate([{ $group: { _id: null, total: { $sum: '$reward' } } }]);
      const cityData  = await Booking.aggregate([{ $group: { _id: '$city', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 6 }]);
      const deviceData= await Booking.aggregate([{ $group: { _id: '$device', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 6 }]);
      const start = new Date(); start.setDate(start.getDate() - 13); start.setHours(0,0,0,0);
      const rawDaily = await Booking.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $dateToString: { format:'%Y-%m-%d', date:'$createdAt' } }, count: { $sum:1 } } },
        { $sort: { _id: 1 } },
      ]);
      const dailyMap = {};
      rawDaily.forEach(d => { dailyMap[d._id] = d.count; });
      const dailyData = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dailyData.push({ _id: key, count: dailyMap[key] || 0 });
      }
      result.stats = { total, pending, confirmed, pickedUp, recycled, cancelled, paid,
        totalReward: rewardAgg[0]?.total || 0, cityData, deviceData, dailyData };
    })().catch(e => { result.errors.stats = e.message; }),

    Booking.find({}).sort({ createdAt: -1 }).lean()
      .then(d => { result.bookings = d; })
      .catch(e => { result.errors.bookings = e.message; }),

    User.find().sort({ createdAt: -1 }).lean()
      .then(d => { result.users = d; })
      .catch(e => { result.errors.users = e.message; }),
  ]);

  res.json(result);
});

module.exports = router;
