const express = require('express');
const router  = express.Router();

// ── Per-IP rate limiter ───────────────────────────────────────────────────
const rateMap = new Map();
function checkRate(ip) {
  const now = Date.now(), key = ip || 'x', win = 60_000, limit = 10;
  const r = rateMap.get(key) || { n: 0, reset: now + win };
  if (now > r.reset) { rateMap.set(key, { n: 1, reset: now + win }); return true; }
  if (r.n >= limit)  return false;
  rateMap.set(key, { n: r.n + 1, reset: r.reset });
  return true;
}
setInterval(() => { const now = Date.now(); for (const [k,v] of rateMap) if (now > v.reset) rateMap.delete(k); }, 300_000);

// ── Carbon footprint data per device category ─────────────────────────────
const CARBON_DATA = {
  smartphone: { co2Saved: 55,  waterSaved: 13000,  energySaved: 180,  toxicPrevented: 0.20 },
  laptop:     { co2Saved: 320, waterSaved: 190000, energySaved: 1200, toxicPrevented: 1.80 },
  desktop:    { co2Saved: 480, waterSaved: 250000, energySaved: 1800, toxicPrevented: 2.50 },
  tablet:     { co2Saved: 85,  waterSaved: 25000,  energySaved: 280,  toxicPrevented: 0.45 },
  tv:         { co2Saved: 190, waterSaved: 80000,  energySaved: 700,  toxicPrevented: 1.20 },
  printer:    { co2Saved: 140, waterSaved: 55000,  energySaved: 500,  toxicPrevented: 0.90 },
  battery:    { co2Saved: 70,  waterSaved: 40000,  energySaved: 350,  toxicPrevented: 2.00 },
  monitor:    { co2Saved: 120, waterSaved: 60000,  energySaved: 420,  toxicPrevented: 0.80 },
  other:      { co2Saved: 50,  waterSaved: 20000,  energySaved: 200,  toxicPrevented: 0.50 },
};

function detectCategory(deviceStr) {
  const d = (deviceStr || '').toLowerCase();
  if (/iphone|samsung|oneplus|pixel|oppo|vivo|realme|redmi|poco|nokia|motorola|smartphone|mobile|phone/.test(d)) return 'smartphone';
  if (/macbook|thinkpad|dell.*laptop|hp.*laptop|lenovo|asus.*laptop|acer.*laptop|laptop/.test(d)) return 'laptop';
  if (/desktop|pc|tower|imac/.test(d)) return 'desktop';
  if (/tablet|ipad/.test(d)) return 'tablet';
  if (/\btv\b|television|led tv|smart tv/.test(d)) return 'tv';
  if (/printer/.test(d)) return 'printer';
  if (/battery|ups/.test(d)) return 'battery';
  if (/monitor|display/.test(d)) return 'monitor';
  return 'other';
}

// ── Gamification constants ────────────────────────────────────────────────
const POINTS_MAP = { booking_created: 50, booking_recycled: 200, first_booking: 100, five_bookings: 250, ten_bookings: 500 };
const BADGES_DEF = [
  { id:'first_recycler',  name:'First Recycler',  icon:'🌱', desc:'Completed your first recycling',       fn: s => s.recycled >= 1    },
  { id:'eco_warrior',     name:'Eco Warrior',      icon:'⚔️', desc:'Recycled 5 devices',                  fn: s => s.recycled >= 5    },
  { id:'green_champion',  name:'Green Champion',   icon:'🏆', desc:'Recycled 10 devices',                 fn: s => s.recycled >= 10   },
  { id:'carbon_crusher',  name:'Carbon Crusher',   icon:'💨', desc:'Saved 500 kg+ of CO2',                fn: s => s.co2Saved >= 500  },
  { id:'data_guardian',   name:'Data Guardian',    icon:'🔐', desc:'Safely wiped 3+ devices',             fn: s => s.recycled >= 3    },
  { id:'top_earner',      name:'Top Earner',        icon:'💰', desc:'Earned Rs.5000+ in rewards',         fn: s => s.totalReward >= 5000 },
  { id:'laptop_lord',     name:'Laptop Lord',      icon:'💻', desc:'Recycled a laptop',                   fn: s => s.hasLaptop        },
  { id:'streak_3',        name:'3-Month Streak',   icon:'🔥', desc:'Recycled across 3+ months',           fn: s => s.streak >= 3      },
];

function computeUserStats(bookings) {
  const recycled    = bookings.filter(b => b.status === 'Recycled');
  const totalReward = recycled.reduce((a, b) => a + (b.reward || 0), 0);
  const total       = bookings.length;
  const totalPoints = recycled.length * POINTS_MAP.booking_recycled
                    + total           * POINTS_MAP.booking_created
                    + (total >= 1  ? POINTS_MAP.first_booking  : 0)
                    + (total >= 5  ? POINTS_MAP.five_bookings  : 0)
                    + (total >= 10 ? POINTS_MAP.ten_bookings   : 0);

  let co2Saved = 0, waterSaved = 0, energySaved = 0, toxicPrevented = 0;
  const hasLaptop = recycled.some(b => detectCategory(b.device) === 'laptop');
  recycled.forEach(b => {
    const d = CARBON_DATA[detectCategory(b.device)]; const q = b.qty || 1;
    co2Saved += d.co2Saved*q; waterSaved += d.waterSaved*q;
    energySaved += d.energySaved*q; toxicPrevented += d.toxicPrevented*q;
  });

  const now = new Date(); let streak = 0;
  for (let i = 0; i < 6; i++) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const hit = recycled.some(b => { const d=new Date(b.createdAt); return d.getFullYear()===m.getFullYear()&&d.getMonth()===m.getMonth(); });
    if (hit) streak++; else if (i > 0) break;
  }

  const stats = { recycled: recycled.length, total, totalReward, co2Saved: Math.round(co2Saved), waterSaved: Math.round(waterSaved), energySaved: Math.round(energySaved), toxicPrevented: +toxicPrevented.toFixed(2), hasLaptop, streak };
  const badges = BADGES_DEF.filter(b => b.fn(stats)).map(({id,name,icon,desc}) => ({id,name,icon,desc}));

  let level='Seedling', levelIcon='🌱', nextLevel='Sprout', pointsToNext=200-totalPoints;
  if      (totalPoints >= 5000) { level='EcoLegend';   levelIcon='🌍'; nextLevel=null;           pointsToNext=0; }
  else if (totalPoints >= 2000) { level='EcoMaster';   levelIcon='🏆'; nextLevel='EcoLegend';   pointsToNext=5000-totalPoints; }
  else if (totalPoints >= 1000) { level='EcoChampion'; levelIcon='⚔️'; nextLevel='EcoMaster';   pointsToNext=2000-totalPoints; }
  else if (totalPoints >= 500)  { level='EcoWarrior';  levelIcon='🛡️'; nextLevel='EcoChampion'; pointsToNext=1000-totalPoints; }
  else if (totalPoints >= 200)  { level='Sprout';      levelIcon='🌿'; nextLevel='EcoWarrior';  pointsToNext=500-totalPoints; }

  return { totalPoints, level, levelIcon, nextLevel, pointsToNext: Math.max(0, pointsToNext), badges, ...stats };
}

// ── Local KB fallback ─────────────────────────────────────────────────────
const KB = {
  greet:   /^(hi|hello|hey|namaste|good\s*(morning|evening|afternoon))/i,
  price:   /price|value|worth|cost|how much|kitna|rate|reward|estimate|paisa|rupee/i,
  phone:   /iphone|samsung|oneplus|pixel|oppo|vivo|realme|redmi|poco|nokia|motorola|smartphone|mobile/i,
  laptop:  /macbook|thinkpad|dell\s*laptop|hp\s*laptop|lenovo|asus\s*laptop|acer\s*laptop|\blaptop\b/i,
  desktop: /desktop|pc tower|imac|computer/i,
  tv:      /\btv\b|television|led\s*tv|smart\s*tv/i,
  data:    /data|wipe|erase|safe|security|privacy|secure/i,
  cert:    /certificate|cert|cpcb|certified|proof|document/i,
  track:   /track|status|where|progress|when.*pick/i,
  upi:     /upi|payment|paid|reward|transfer|gpay|paytm|phonepe/i,
  rules:   /e.?waste.*rule|ewaste.*law|2022|epr|compliance/i,
  book:    /book|pickup|schedule|collect|recycle.*device|appointment/i,
  how:     /how.*work|how.*recycle|process|steps/i,
  carbon:  /carbon|co2|footprint|environment|climate|green|emission/i,
  points:  /points|badge|level|leaderboard|gamif|rank/i,
};
function localReply(q) {
  const t = (q||'').toLowerCase();
  if (KB.greet.test(t))  return "Hi! I'm EcoBot - EcoVault's AI assistant.\n\nI can help with:\n- Device recycling values\n- Carbon footprint calculator\n- EcoPoints, badges & leaderboard\n- Data safety & DoD erasure\n- E-Waste Rules 2022 (India)\n- Booking pickup & tracking\n\nWhat would you like to know?";
  if (KB.carbon.test(t)) return "Carbon Impact of Recycling:\n\nSmartphone: ~55 kg CO2 saved\nLaptop: ~320 kg CO2 saved\nDesktop: ~480 kg CO2 saved\nTV: ~190 kg CO2 saved\n\nView your personal carbon dashboard in My Dashboard > Impact tab.\nEvery device recycled prevents toxic e-waste in Indian landfills.";
  if (KB.points.test(t)) return "EcoVault Gamification:\n\nPoints earned:\n- Book a pickup: +50 pts\n- Device recycled: +200 pts\n- First booking bonus: +100 pts\n- 5-booking milestone: +250 pts\n\nLevels: Seedling > Sprout > EcoWarrior > EcoChampion > EcoMaster > EcoLegend\n\nBadges: First Recycler, Eco Warrior, Carbon Crusher, Data Guardian & more!\nCheck your rank on the Leaderboard tab.";
  if (KB.rules.test(t))  return "E-Waste Management Rules 2022 (India):\n\n- Producers must meet EPR targets\n- Consumers must use authorised recyclers only\n- Dumping in municipal bins is illegal\n- CPCB-certified recyclers like EcoVault are authorised\n- You get a legal recycling certificate for EPR compliance";
  if (KB.data.test(t))   return "Data Safety at EcoVault:\n\nWe use DoD 5220.22-M 3-pass overwrite:\n- All sectors overwritten 3 times\n- Physical destruction for damaged drives\n- Certificate of data destruction provided\n- Zero data recovery possible";
  if (KB.cert.test(t))   return "CPCB Recycling Certificate:\n\n- CPCB-certified certificate issued instantly\n- Download as PDF from My Bookings\n- Legally valid for EPR compliance reporting\n- Includes device details, date & recycler info";
  if (KB.track.test(t))  return "Track Your Booking:\n\nGo to My Bookings > find booking > tap Track\n\nStages: Confirmed > Picked Up > Recycled\n\nYou'll get email updates at each stage.";
  if (KB.upi.test(t))    return "UPI Reward - How It Works:\n\n1. Book pickup & enter your UPI ID\n2. Recycler collects your device\n3. Device recycled at CPCB facility\n4. Reward credited to your UPI\n\nTimeline: 2-3 working days\nSupports: GPay, PhonePe, Paytm, BHIM, any UPI";
  if (KB.book.test(t))   return "How to Book Free Pickup:\n\n1. Click Book Free Pickup\n2. Select device type & condition\n3. Enter city, address & pickup date\n4. Add contact & UPI ID\n5. Confirm - done!\n\nCities: Delhi, Mumbai, Bangalore, Pune, Hyderabad, Chennai, Meerut, Noida, Gurgaon, Lucknow";
  if (KB.how.test(t))    return "How EcoVault Works:\n\n1. Book online\n2. Recycler arrives at your door\n3. Data wiped (DoD 5220.22-M)\n4. Recycled at CPCB-certified facility\n5. UPI reward within 2-3 days\n6. Download PDF certificate\n\nTotal: 3-7 days from booking to reward.";
  if (KB.phone.test(t) || (KB.price.test(t) && t.includes('phone'))) return "Smartphone Recycling Value:\n\n- Working good condition: Rs.300-Rs.900\n- Working with damage: Rs.80-Rs.300\n- Dead/not turning on: Rs.30-Rs.120\n\nFactory reset + original accessories = best price.";
  if (KB.laptop.test(t)) return "Laptop Recycling Value:\n\n- Working: Rs.1,200-Rs.3,000\n- Damaged screen/battery: Rs.400-Rs.1,200\n- Dead/scrap: Rs.100-Rs.400\n\nInclude charger (adds Rs.200-500).";
  if (KB.tv.test(t))     return "TV Recycling Value:\n\n- Working LED/Smart TV: Rs.300-Rs.1,200\n- Damaged display: Rs.100-Rs.500\n- Old CRT: Rs.50-Rs.150";
  if (KB.desktop.test(t))return "Desktop PC Recycling Value:\n\n- Working: Rs.800-Rs.2,000\n- Damaged: Rs.250-Rs.900\n- Scrap: Rs.80-Rs.350\n\nInclude GPU separately for best value.";
  if (KB.price.test(t))  return "EcoVault Recycling Rewards (India):\n\nSmartphone: Rs.30-Rs.900\nLaptop: Rs.100-Rs.3,000\nDesktop: Rs.80-Rs.2,000\nTV: Rs.50-Rs.1,200\nPrinter: Rs.100-Rs.500\n\nWorking devices earn 3-5x more than scrap.";
  const fb = ['EcoVault makes e-waste recycling easy! Book free pickup, earn EcoPoints, get CPCB certificates. What would you like to know?','I can help with device values, carbon footprint, EcoPoints & badges, or recycling certificates. What do you need?','Ask me about: device values, carbon impact, EcoPoints, how booking works, data safety, or E-Waste Rules 2022.'];
  return fb[Math.floor(Math.random()*fb.length)];
}

// ── Gemini API ─────────────────────────────────────────────────────────────
// Free tier limits (per key): 15 RPM, 1M TPM, 1500 RPD on gemini-2.0-flash
// gemini-1.5-flash is the reliable fallback (also 15 RPM free)
// NEVER use -lite or -8b — near-zero quota on free tier
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];

// Per-key state: tracks cooldown and consecutive failures
const keyState = new Map();

// Clear expired cooldowns every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of keyState) {
    if (v.blockedUntil && now >= v.blockedUntil) {
      keyState.set(k, { blockedUntil: 0, failCount: 0 });
      console.log(`[Gemini] key ...${k.slice(-6)} cooldown expired, unblocked`);
    }
  }
}, 5 * 60 * 1000);

// Simple per-server throttle: max 12 req/min to stay under 15 RPM limit
const reqLog = []; // timestamps of recent requests
function isThrottled() {
  const now = Date.now();
  // Remove entries older than 60s
  while (reqLog.length && reqLog[0] < now - 60000) reqLog.shift();
  if (reqLog.length >= 12) return true; // throttle at 12/min
  reqLog.push(now);
  return false;
}

async function callGemini(apiKey, model, contents) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  let res;
  try {
    res = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: 400, temperature: 0.75, topP: 0.9 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
      signal: AbortSignal.timeout(18000),
    });
  } catch (fetchErr) {
    const e = new Error(`Network error: ${fetchErr.message}`);
    e.networkError = true;
    throw e;
  }

  let data;
  try { data = await res.json(); } catch (_) {
    throw new Error(`HTTP ${res.status} non-JSON`);
  }

  if (!res.ok || data.error) {
    const httpCode  = res.status;
    const apiCode   = data.error?.code;   // may be number or string like "RESOURCE_EXHAUSTED"
    const apiStatus = data.error?.status; // e.g. "RESOURCE_EXHAUSTED", "PERMISSION_DENIED"
    const msg       = data.error?.message || `HTTP ${httpCode}`;

    const e = new Error(msg);
    e.httpCode = httpCode;

    // ── Quota / rate limit detection ──
    // Gemini returns: HTTP 429, or code=429, or status="RESOURCE_EXHAUSTED"
    e.isQuota = (
      httpCode === 429 ||
      apiCode  === 429 ||
      String(apiCode).includes('429') ||
      String(apiStatus).includes('RESOURCE_EXHAUSTED') ||
      String(msg).toLowerCase().includes('quota') ||
      String(msg).toLowerCase().includes('rate limit') ||
      String(msg).toLowerCase().includes('resource exhausted')
    );

    // ── Auth / bad key ──
    e.isBadKey = (
      httpCode === 400 ||
      httpCode === 401 ||
      httpCode === 403 ||
      String(apiStatus).includes('PERMISSION_DENIED') ||
      String(apiStatus).includes('INVALID_ARGUMENT') ||
      String(msg).toLowerCase().includes('api key') ||
      String(msg).toLowerCase().includes('invalid key')
    );

    // ── Model not found ──
    e.isNotFound = (httpCode === 404 || String(apiStatus).includes('NOT_FOUND'));

    throw e;
  }

  const candidate = data.candidates?.[0];
  if (!candidate) {
    const reason = data.promptFeedback?.blockReason || 'safety_filter';
    console.warn(`[Gemini] ${model} blocked: ${reason}`);
    return null; // blocked by safety — not a quota issue
  }
  const text = candidate.content?.parts?.map(p => p.text || '').join('').trim();
  return text || null;
}

const GEMINI_SYSTEM = `You are EcoBot, the helpful AI assistant for EcoVault — India's leading certified e-waste recycling platform.
Answer ANY question the user asks. When relevant, use this EcoVault knowledge:
- Device recycling rewards (INR): Smartphone Rs.30-900, Laptop Rs.100-3000, Desktop Rs.80-2000, TV Rs.50-1200, Tablet Rs.30-1500, Battery Rs.40-200, Printer Rs.100-500
- Carbon savings per device: Smartphone ~55kg CO2, Laptop ~320kg, Desktop ~480kg, TV ~190kg
- Data safety: DoD 5220.22-M 3-pass certified erasure on every device, zero recovery possible
- EcoPoints: +50 per booking, +200 per recycled device. Levels: Seedling→Sprout→EcoWarrior→EcoChampion→EcoMaster→EcoLegend
- Service cities: Delhi, Mumbai, Bangalore, Pune, Hyderabad, Chennai, Meerut, Noida, Gurgaon, Lucknow
- Process: Book online → doorstep pickup → data wipe → CPCB-certified recycling → UPI reward in 2-3 days → download PDF certificate
Be concise (under 120 words), friendly, and conversational. Use bullet points when listing items.`;

function buildContents(messages) {
  // Drop the initial bot greeting — Gemini doesn't need it
  let msgs = (messages || []).filter((m, i) => !(i === 0 && m.role === 'assistant'));

  // Must start with a user turn
  if (!msgs.length || msgs[0].role !== 'user') {
    msgs = [{ role: 'user', content: 'Hello' }, ...msgs];
  }

  // Keep last 8 turns to stay within token budget
  if (msgs.length > 8) msgs = msgs.slice(-8);

  return msgs.map((m, i) => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: i === 0
      ? `[Instructions: ${GEMINI_SYSTEM}]\n\nUser: ${m.content || 'Hello'}`
      : (m.content || '') }],
  }));
}

async function tryGemini(messages) {
  const rawKeys = (process.env.GEMINI_API_KEY || '')
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 20);

  if (!rawKeys.length) throw new Error('GEMINI_API_KEY not configured');

  // Server-level throttle check (prevents burning quota from rapid requests)
  if (isThrottled()) throw new Error('Server rate throttled — try again in a moment');

  const contents = buildContents(messages);
  const now = Date.now();
  const tried = [];

  for (const key of rawKeys) {
    const state = keyState.get(key) || { blockedUntil: 0, failCount: 0 };

    if (state.blockedUntil > now) {
      const mins = Math.ceil((state.blockedUntil - now) / 60000);
      tried.push(`key...${key.slice(-6)}: cooling ${mins}min`);
      continue;
    }

    for (const model of GEMINI_MODELS) {
      try {
        console.log(`[Gemini] → ${model} key...${key.slice(-6)}`);
        const reply = await callGemini(key, model, contents);

        if (reply) {
          keyState.set(key, { blockedUntil: 0, failCount: 0 });
          console.log(`[Gemini] ✓ ${model} (${reply.length} chars)`);
          return reply;
        }

        console.warn(`[Gemini] ${model} empty reply, trying next model`);

      } catch (err) {
        console.warn(`[Gemini] ${model} key...${key.slice(-6)}: ${err.message}`);
        tried.push(`${model}: ${err.message}`);

        if (err.isQuota) {
          // Rate limited — 3 minute cooldown, try next key immediately
          keyState.set(key, { blockedUntil: now + 3 * 60 * 1000, failCount: state.failCount + 1 });
          console.warn(`[Gemini] key...${key.slice(-6)} quota hit → 3min cooldown`);
          break; // skip remaining models for this key
        }

        if (err.isBadKey) {
          // Invalid key — long cooldown (won't help until key is changed)
          keyState.set(key, { blockedUntil: now + 12 * 60 * 60 * 1000, failCount: 99 });
          console.error(`[Gemini] key...${key.slice(-6)} is INVALID — update GEMINI_API_KEY in Render`);
          break;
        }

        if (err.isNotFound) {
          // Model doesn't exist for this key tier — try next model
          continue;
        }

        if (err.networkError) {
          // DNS/timeout — don't penalise key
          throw new Error('Gemini unreachable (network error)');
        }

        // Unknown error — try next model
      }
    }
  }

  throw new Error(`Gemini unavailable: ${tried.slice(0, 2).join(' | ')}`);
}

// Compat alias (used by /status and /quota-cache routes)
const keyQuotaCache = {
  get size() { return keyState.size; },
  clear() { keyState.clear(); },
};

// ── GET /api/ai/ping-gemini — test your Gemini key directly ──────────────
router.get('/ping-gemini', async (req, res) => {
  const rawKeys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(k => k.length > 20);
  if (!rawKeys.length) {
    return res.status(500).json({ ok: false, error: 'GEMINI_API_KEY not set in Render environment variables.' });
  }
  const testContents = [{ role: 'user', parts: [{ text: 'Say exactly: ECOVAULT_OK' }] }];
  const results = [];
  for (const key of rawKeys) {
    let keyOk = false;
    for (const model of GEMINI_MODELS) {
      try {
        const reply = await callGemini(key, model, testContents);
        results.push({ key: `...${key.slice(-6)}`, model, ok: true, reply: reply?.slice(0, 60) || '(empty)' });
        keyOk = true;
        break;
      } catch (err) {
        results.push({ key: `...${key.slice(-6)}`, model, ok: false, error: err.message, is429: err.is429, is403: err.is403 });
        if (err.is403 || err.networkError) break; // bad key or network — no point trying other models
      }
    }
    if (keyOk) break; // found a working key
  }
  const anyOk = results.some(r => r.ok);
  res.status(anyOk ? 200 : 500).json({
    ok: anyOk,
    results,
    tip: anyOk ? '✅ Gemini is working!' : '❌ All keys failed. Common fixes: (1) Verify key at aistudio.google.com, (2) Enable Gemini API in Google Cloud Console, (3) Check billing/quota.',
  });
});

// ── POST /api/ai/chat ─────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: 'messages array required' });
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
    if (!checkRate(ip)) {
      const last = [...messages].reverse().find(m => m.role === 'user');
      return res.json({ reply: localReply(last?.content), source: 'local', rateLimited: true });
    }
    let reply, source, geminiError = null;
    try {
      reply  = await tryGemini(messages);
      source = 'gemini';
    } catch (e) {
      geminiError = e.message;
      console.warn('[AI chat] Gemini failed, falling back to local KB:', e.message);
      const last    = [...messages].reverse().find(m => m.role === 'user');
      const local   = localReply(last?.content);
      const generic = local.includes('EcoVault makes e-waste') || local.includes('I can help with device') || local.includes('Ask me about:');
      reply  = generic
        ? `I'm having trouble reaching Gemini AI right now (${e.message}). For EcoVault questions (device values, bookings, carbon footprint, EcoPoints) I can still help! Ask me anything.`
        : local;
      source = 'local';
    }
    res.json({ reply, source, ...(geminiError ? { geminiError } : {}) });
  } catch (err) {
    console.error('[AI chat] error:', err.message);
    const last = [...(req.body?.messages || [])].reverse().find(m => m.role === 'user');
    res.json({ reply: localReply(last?.content), source: 'local', geminiError: err.message });
  }
});

// ── POST /api/ai/estimate ─────────────────────────────────────────────────
router.post('/estimate', (req, res) => {
  const { brand='', model='', year='2020', condition='Working - Good condition' } = req.body||{};
  if (!brand||!model) return res.status(400).json({error:'Brand and model required'});
  const bv=`${brand} ${model}`.toLowerCase(), age=new Date().getFullYear()-(parseInt(year)||2020);
  const isWorking=condition.toLowerCase().includes('working'), isDamaged=/damaged|cracked/.test(condition.toLowerCase());
  let base,min,max,reason,tips,category;
  if (/iphone|samsung|oneplus|pixel|oppo|vivo|realme|redmi|poco|nokia|motorola|phone|mobile/.test(bv)) { [base,min,max]=isWorking?[500,300,900]:isDamaged?[180,80,300]:[70,30,120]; reason='Smartphones have excellent metal & component recovery value.'; tips='Factory reset before handover.'; category='smartphone'; }
  else if (/macbook|thinkpad|dell|hp|lenovo|asus|acer|laptop/.test(bv)) { [base,min,max]=isWorking?[1800,1200,3000]:isDamaged?[700,400,1200]:[250,100,400]; reason='Laptops contain valuable copper, aluminium and rare-earth materials.'; tips='Include charger.'; category='laptop'; }
  else if (/desktop|pc|tower|imac/.test(bv)) { [base,min,max]=isWorking?[1200,800,2000]:isDamaged?[500,250,900]:[200,80,350]; reason='Desktop PCs have high copper and aluminium content.'; tips='Include GPU separately.'; category='desktop'; }
  else if (/tv|television|led|lcd|monitor/.test(bv)) { [base,min,max]=isWorking?[600,300,1200]:isDamaged?[250,100,500]:[100,40,200]; reason='TVs contain valuable circuit boards.'; tips='Larger screens get better rates.'; category='tv'; }
  else if (/battery|ups/.test(bv)) { [base,min,max]=[100,40,200]; reason='Lithium-ion batteries are in high demand.'; tips='Hand over safely.'; category='battery'; }
  else if (/printer/.test(bv)) { [base,min,max]=[250,100,500]; reason='Printers have moderate metal content.'; tips='Remove ink cartridges.'; category='printer'; }
  else if (/tablet|ipad/.test(bv)) { [base,min,max]=isWorking?[800,500,1500]:isDamaged?[250,100,500]:[80,30,150]; reason='Tablets have good component recovery value.'; tips='Include charger.'; category='tablet'; }
  else { [base,min,max]=isWorking?[400,200,800]:isDamaged?[150,60,300]:[60,20,120]; reason='Standard e-waste recycling rates.'; tips='Working condition gets 3-5x more than scrap.'; category='other'; }
  if (isWorking&&age>5)  { base=Math.round(base*.7); min=Math.round(min*.7); max=Math.round(max*.7); }
  if (isWorking&&age<=2) { base=Math.round(base*1.2); min=Math.round(min*1.2); max=Math.round(max*1.2); }
  res.json({estimate:base,min,max,reason,tips,carbon:CARBON_DATA[category]||CARBON_DATA.other});
});

// ── POST /api/ai/carbon ── Carbon calculator ──────────────────────────────
router.post('/carbon', (req, res) => {
  try {
    const { devices } = req.body;
    if (!Array.isArray(devices)||!devices.length) return res.status(400).json({error:'devices array required'});
    let totalCo2=0,totalWater=0,totalEnergy=0,totalToxic=0;
    const breakdown = devices.map(({device,qty=1}) => {
      const cat=detectCategory(device), d=CARBON_DATA[cat];
      totalCo2+=d.co2Saved*qty; totalWater+=d.waterSaved*qty;
      totalEnergy+=d.energySaved*qty; totalToxic+=d.toxicPrevented*qty;
      return {device,category:cat,qty,co2Total:d.co2Saved*qty,waterTotal:d.waterSaved*qty,energyTotal:d.energySaved*qty,toxicTotal:d.toxicPrevented*qty};
    });
    res.json({
      totalCo2Saved:Math.round(totalCo2), totalWaterSaved:Math.round(totalWater),
      totalEnergySaved:Math.round(totalEnergy), totalToxicPrevented:+totalToxic.toFixed(2),
      equivalences:{ treeDays:Math.round(totalCo2/0.021), carKm:Math.round(totalCo2/0.12), phonesCharged:Math.round(totalEnergy/0.018) },
      breakdown,
    });
  } catch (err) { res.status(500).json({error:err.message}); }
});

// ── GET /api/ai/gamification/:uid ─────────────────────────────────────────
router.get('/gamification/:uid', async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({uid:req.params.uid}).lean();
    res.json(computeUserStats(bookings));
  } catch (err) { res.status(500).json({error:err.message}); }
});

// ── GET /api/ai/leaderboard ───────────────────────────────────────────────
router.get('/leaderboard', async (req, res) => {
  try {
    const Booking=require('../models/Booking'), User=require('../models/User');
    const agg = await Booking.aggregate([
      {$match:{status:'Recycled'}},
      {$group:{_id:'$uid',recycled:{$sum:1},totalReward:{$sum:'$reward'},totalQty:{$sum:'$qty'},devices:{$push:'$device'},totalBookings:{$sum:1}}},
      {$sort:{recycled:-1}},{$limit:20},
    ]);
    const uids=agg.map(a=>a._id);
    const users=await User.find({uid:{$in:uids}}).select('uid name photo').lean();
    const uMap={}; users.forEach(u=>{uMap[u.uid]=u;});
    const leaderboard = agg.map((a,i) => {
      const u=uMap[a._id]||{};
      const points=a.recycled*POINTS_MAP.booking_recycled+a.totalBookings*POINTS_MAP.booking_created+(a.totalBookings>=1?POINTS_MAP.first_booking:0)+(a.totalBookings>=5?POINTS_MAP.five_bookings:0)+(a.totalBookings>=10?POINTS_MAP.ten_bookings:0);
      let co2=0; a.devices.forEach(d=>{co2+=CARBON_DATA[detectCategory(d)].co2Saved;});
      let level='Seedling',levelIcon='🌱';
      if(points>=5000){level='EcoLegend';levelIcon='🌍';}else if(points>=2000){level='EcoMaster';levelIcon='🏆';}else if(points>=1000){level='EcoChampion';levelIcon='⚔️';}else if(points>=500){level='EcoWarrior';levelIcon='🛡️';}else if(points>=200){level='Sprout';levelIcon='🌿';}
      return {rank:i+1,uid:a._id,name:u.name||'EcoUser',photo:u.photo||'',points,level,levelIcon,recycled:a.recycled,co2Saved:Math.round(co2),totalReward:a.totalReward};
    });
    res.json({leaderboard});
  } catch (err) { res.status(500).json({error:err.message}); }
});

// ── GET /api/ai/status ────────────────────────────────────────────────────
router.get('/status', (req, res) => {
  const rawKeys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(k => k.length > 20);
  const now = Date.now();
  res.json({
    keys: rawKeys.map(k => {
      const s = keyState.get(k) || { blockedUntil: 0, failCount: 0 };
      return { suffix: `...${k.slice(-6)}`, active: now >= s.blockedUntil, failCount: s.failCount, blockedUntil: s.blockedUntil ? new Date(s.blockedUntil).toISOString() : null };
    }),
    models: GEMINI_MODELS,
    keyCount: rawKeys.length,
  });
});

// ── DELETE /api/ai/quota-cache ────────────────────────────────────────────
router.delete('/quota-cache', (req, res) => {
  const size = keyState.size;
  keyState.clear();
  res.json({ cleared: size, message: 'All key cooldowns cleared — keys will be retried immediately' });
});

module.exports = router;
