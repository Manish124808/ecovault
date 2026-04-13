const admin = require('firebase-admin');

// ── Firebase Admin init ───────────────────────────────────────────────────
let firebaseReady = false;
try {
  // Render stores env vars as-is. The private key needs \n → actual newlines.
  const rawKey    = process.env.FIREBASE_PRIVATE_KEY || '';
  // Handle both formats: escaped \\n (from .env file) and literal \n (from Render dashboard)
  const privateKey = rawKey.replace(/\\n/g, '\n');
  const hasValidKey = privateKey.includes('BEGIN PRIVATE KEY') && !privateKey.includes('PASTE_YOUR');

  if (!admin.apps.length) {
    if (hasValidKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId:   process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
      firebaseReady = true;
      console.log('🔑 Firebase Admin: ✅ ready — real token verification enabled');
    } else {
      admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'ecovault-dev' });
      console.warn('⚠️  Firebase Admin: FIREBASE_PRIVATE_KEY not set or is placeholder');
      console.warn('   Admin panel will NOT work until you set a real Firebase private key.');
    }
  } else {
    firebaseReady = true;
  }
} catch (e) {
  console.error('Firebase Admin init error:', e.message);
}

/**
 * verifyToken — verify Bearer JWT from Firebase
 * Falls back to DEV bypass only if Firebase key is not configured.
 */
const verifyToken = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.split(' ')[1];

  if (firebaseReady) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      req.user = {
        uid:     decoded.uid,
        email:   (decoded.email || '').toLowerCase().trim(),   // ← normalize email
        name:    decoded.name    || decoded.display_name || '',
        picture: decoded.picture || '',
      };
      return next();
    } catch (err) {
      console.error('[verifyToken] Firebase verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  // ── DEV BYPASS — only when Firebase key is genuinely missing ─────────
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    req.user = {
      uid:     payload.user_id || payload.sub || 'dev-uid',
      email:   (payload.email || '').toLowerCase().trim(),   // ← normalize here too
      name:    payload.name    || '',
      picture: payload.picture || '',
    };
    console.warn(`[DEV bypass] user: ${req.user.email} — set FIREBASE_PRIVATE_KEY to enable real auth`);
    return next();
  } catch (_) {
    return res.status(401).json({ error: 'Malformed token' });
  }
};

/**
 * requireAdmin — checks decoded email against ADMIN_EMAIL env var
 * Both are lowercased+trimmed so casing differences don't cause false 403s
 */
const requireAdmin = (req, res, next) => {
  const userEmail  = (req.user?.email  || '').toLowerCase().trim();
  const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();

  if (!adminEmail) {
    console.error('[requireAdmin] ADMIN_EMAIL env var not set!');
    return res.status(403).json({ error: 'ADMIN_EMAIL not configured on server' });
  }
  if (userEmail !== adminEmail) {
    console.warn(`[requireAdmin] denied — got: "${userEmail}", expected: "${adminEmail}"`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { verifyToken, requireAdmin, admin };
