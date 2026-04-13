const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { sendWithdrawalNotification } = require('../services/email');

// ── POST /api/users/sync ──
router.post('/sync', verifyToken, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { uid: req.user.uid },
      { uid: req.user.uid, name: req.user.name || req.body.name || '',
        email: req.user.email, photo: req.user.picture || req.body.photo || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/users ── (admin only)
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/users/role ──
router.get('/role', verifyToken, async (req, res) => {
  try {
    const isAdmin = req.user.email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (isAdmin) return res.json({ role: 'admin' });
    const Recycler = require('../models/Recycler');
    const recycler = await Recycler.findOne({ email: req.user.email.toLowerCase() });
    if (recycler) return res.json({ role: 'recycler', recyclerData: recycler });
    res.json({ role: 'user' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/users/withdraw ── (user requests payout)
router.post('/withdraw', verifyToken, async (req, res) => {
  try {
    const { upi, amount, bookingIds } = req.body;
    if (!upi || !amount || amount < 1) {
      return res.status(400).json({ error: 'UPI and amount required' });
    }
    // Send notification email to admin (non-fatal)
    try {
      await sendWithdrawalNotification({
        userName:   req.user.name || req.user.email,
        userEmail:  req.user.email,
        upi,
        amount,
        bookingIds: bookingIds || [],
      });
    } catch (emailErr) {
      console.error('[Email] WITHDRAWAL failed:', emailErr.message, '| code:', emailErr.code, '| response:', emailErr.responseCode);
    }
    res.json({
      success: true,
      message: `Withdrawal request for ₹${amount} to ${upi} submitted. Admin will process within 2–3 working days.`,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/users/withdrawals ── (admin: see all withdrawal requests)
router.get('/withdrawals', verifyToken, requireAdmin, async (req, res) => {
  // We don't persist withdrawals in DB — admin sees pending via Payments tab
  // This endpoint is a placeholder for future DB-backed withdrawal tracking
  res.json({ withdrawals: [] });
});

module.exports = router;
