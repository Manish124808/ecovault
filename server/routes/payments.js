const express  = require('express');
const router   = express.Router();
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const { verifyToken } = require('../middleware/auth');

// Always create fresh — don't cache so env var changes take effect on redeploy
function getRazorpay() {
  const keyId     = process.env.RAZORPAY_KEY_ID     || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!keyId || keyId.includes('PASTE') || !keySecret || keySecret.includes('PASTE')) {
    throw new Error('Razorpay not configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Render env vars');
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// ── POST /api/payments/order ──
router.post('/order', verifyToken, async (req, res) => {
  try {
    const { amount, bookingId } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ error: 'Invalid amount' });
    const order = await getRazorpay().orders.create({
      amount:   Math.round(amount * 100),
      currency: 'INR',
      receipt:  `EV-${bookingId || Date.now()}`,
      notes:    { bookingId: bookingId || '' },
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error('[payments/order]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/payments/verify ──
router.post('/verify', verifyToken, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    if (!secret || secret.includes('PASTE')) {
      return res.status(500).json({ error: 'Razorpay not configured' });
    }
    const body     = razorpayOrderId + '|' + razorpayPaymentId;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (expected !== razorpaySignature) {
      return res.status(400).json({ error: 'Payment signature mismatch', valid: false });
    }
    res.json({ valid: true, paymentId: razorpayPaymentId });
  } catch (err) {
    console.error('[payments/verify]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/payments/key ──
router.get('/key', (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  if (!keyId || keyId.includes('PASTE')) {
    return res.status(500).json({ error: 'RAZORPAY_KEY_ID not set in server env vars' });
  }
  res.json({ keyId });
});

module.exports = router;
