require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const connectDB = require('./config/db');

const bookingRoutes  = require('./routes/bookings');
const userRoutes     = require('./routes/users');
const recyclerRoutes = require('./routes/recyclers');
const aiRoutes       = require('./routes/ai');
const paymentRoutes  = require('./routes/payments');
const adminRoutes    = require('./routes/admin');

const app = express();
connectDB();

// ── CORS ──────────────────────────────────────────────────────────────────
// Strategy: whitelist localhost for dev + all *.onrender.com for production
// CLIENT_URL is a fallback for custom domains
app.use(cors({
  origin: (origin, cb) => {
    // No origin = Postman / server-to-server / same-origin — always allow
    if (!origin) return cb(null, true);

    const clientUrl = (process.env.CLIENT_URL || '').trim();

    const allowed = [
      'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:3000',
    ];

    // Allow any *.onrender.com subdomain (covers all Render preview + production URLs)
    if (origin.endsWith('.onrender.com')) return cb(null, true);

    // Allow explicit CLIENT_URL (for custom domains)
    if (clientUrl && origin === clientUrl) return cb(null, true);

    // Allow localhost variants
    if (allowed.includes(origin)) return cb(null, true);

    console.warn(`[CORS] blocked origin: ${origin}`);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check — also prints env status for debugging ──
app.get('/api/health', (req, res) => {
  const geminiKeys = (process.env.GEMINI_API_KEY || '')
    .split(',').map(k => k.trim())
    .filter(k => k.length > 20 && !k.includes('PASTE') && !k.includes('YOUR'));

  res.json({
    status:      'EcoVault API 🟢',
    env:         process.env.NODE_ENV || 'development',
    time:        new Date(),
    checks: {
      mongodb:      !!process.env.MONGO_URI,
      firebase:     !!(process.env.FIREBASE_PRIVATE_KEY || '').includes('BEGIN PRIVATE KEY'),
      gemini:       geminiKeys.length > 0,
      geminiKeys:   geminiKeys.length,
      email:        !!(process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY),
      razorpay:     !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET,
      adminEmail:   process.env.ADMIN_EMAIL || '❌ NOT SET',
      clientUrl:    process.env.CLIENT_URL  || '(any .onrender.com allowed)',
    },
  });
});

// ── Email test endpoint — verifies EmailJS HTTP (not SMTP, which Render blocks) ──
app.get('/api/email/test', async (req, res) => {
  const serviceId  = (process.env.EMAILJS_SERVICE_ID  || '').trim();
  const templateId = (process.env.EMAILJS_TEMPLATE_ID || '').trim();
  const publicKey  = (process.env.EMAILJS_PUBLIC_KEY  || '').trim();
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim();

  const privateKey = (process.env.EMAILJS_PRIVATE_KEY || '').trim();
  const config = {
    EMAILJS_SERVICE_ID:  serviceId  || '❌ MISSING',
    EMAILJS_TEMPLATE_ID: templateId || '❌ MISSING',
    EMAILJS_PUBLIC_KEY:  publicKey  || '❌ MISSING',
    EMAILJS_PRIVATE_KEY: privateKey ? `set (${privateKey.length} chars)` : '❌ MISSING — get from emailjs.com → Account → Security',
    ADMIN_EMAIL:         adminEmail || '❌ MISSING',
  };

  if (!serviceId || !templateId || !publicKey || !adminEmail) {
    return res.status(500).json({ ok: false, config, error: 'Missing env vars — add them in Render dashboard (server side)' });
  }

  try {
    const payload = {
      service_id:  serviceId,
      template_id: templateId,
      user_id:     publicKey,
      ...(privateKey ? { accessToken: privateKey } : {}),
      template_params: {
        to_email:  adminEmail,
        to_name:   'Admin',
        subject:   'EcoVault Email Test — Working!',
        message:   `This confirms EmailJS HTTP is working on Render.

Sent at: ${new Date().toISOString()}`,
        reply_to:  adminEmail,
        from_name: 'EcoVault Team',
      },
    };
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`EmailJS API ${response.status}: ${text}`);
    console.log(`[Email/test] Test email sent to ${adminEmail} via EmailJS`);
    res.json({ ok: true, config, message: `Test email sent to ${adminEmail}` });
  } catch (err) {
    console.error(`[Email/test] Failed: ${err.message}`);
    res.status(500).json({ ok: false, config, error: err.message });
  }
});

// ── API Routes ──
app.use('/api/bookings',  bookingRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/recyclers', recyclerRoutes);
app.use('/api/ai',        aiRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/admin',     adminRoutes);

// ── 404 / error handlers ──
app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Email health check on startup — uses EmailJS HTTP (Render blocks SMTP) ──────
async function checkEmail() {
  const serviceId = (process.env.EMAILJS_SERVICE_ID  || '').trim();
  const tmplId    = (process.env.EMAILJS_TEMPLATE_ID || '').trim();
  const pubKey    = (process.env.EMAILJS_PUBLIC_KEY  || '').trim();
  if (!serviceId || !tmplId || !pubKey) {
    console.warn('   Email:       ❌ EMAILJS_SERVICE_ID / TEMPLATE_ID / PUBLIC_KEY not set in Render env vars');
    console.warn('   → Copy values from client env vars: VITE_EJS_SVC, VITE_EJS_TMPL, VITE_EJS_PUB');
    return;
  }
  // Just verify the keys look valid (non-empty, non-placeholder)
  console.log(`   Email:       ✅ EmailJS configured (svc=${serviceId})`);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  const geminiKeys = (process.env.GEMINI_API_KEY || '')
    .split(',').map(k => k.trim())
    .filter(k => k.length > 20 && !k.includes('PASTE') && !k.includes('YOUR'));

  console.log(`\n🚀 EcoVault Server on port ${PORT}`);
  console.log(`   Health:      http://localhost:${PORT}/api/health`);
  console.log(`   MongoDB:     ${process.env.MONGO_URI ? '✅' : '❌ MISSING'}`);
  console.log(`   Firebase:    ${(process.env.FIREBASE_PRIVATE_KEY||'').includes('BEGIN PRIVATE KEY') ? '✅' : '❌ MISSING — admin will fail'}`);
  console.log(`   Gemini:      ${geminiKeys.length > 0 ? `✅ ${geminiKeys.length} key(s)` : '❌ MISSING'}`);
  const _ejSvc = (process.env.EMAILJS_SERVICE_ID||'').trim();
  console.log(`   Email:       ${_ejSvc ? '✅ EmailJS (' + _ejSvc + ')' : '❌ EMAILJS_SERVICE_ID missing'}`);
  console.log(`   Razorpay:    ${process.env.RAZORPAY_KEY_ID ? '✅' : '❌ MISSING'}`);
  console.log(`   Admin email: ${process.env.ADMIN_EMAIL || '❌ NOT SET'}`);
  console.log(`   Client URL:  ${process.env.CLIENT_URL || '(any .onrender.com)'}\n`);

  // Verify email config on startup so we catch misconfigurations early
  checkEmail();
});
