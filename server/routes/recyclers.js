const express  = require('express');
const router   = express.Router();
const Recycler = require('../models/Recycler');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// ── GET /api/recyclers  (admin only) ──
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const recyclers = await Recycler.find().sort({ createdAt: -1 }).lean();
    res.json(recyclers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/recyclers  (admin: register new recycler) ──
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, city, email, phone } = req.body;
    if (!name || !city || !email) return res.status(400).json({ error: 'Name, city, email required' });

    const exists = await Recycler.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ error: 'Recycler with this email already exists' });

    const recycler = await Recycler.create({ name, city, email: email.toLowerCase(), phone });
    res.status(201).json(recycler);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/recyclers/:id  (admin only) ──
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await Recycler.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recycler removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
