// server/services/email.js — EmailJS HTTP API
// Render blocks all SMTP ports. EmailJS uses HTTPS (port 443) — always works.
// Env vars needed in Render server env vars:
//   EMAILJS_SERVICE_ID  (copy from VITE_EJS_SVC)
//   EMAILJS_TEMPLATE_ID (copy from VITE_EJS_TMPL)
//   EMAILJS_PUBLIC_KEY  (copy from VITE_EJS_PUB)
//   EMAILJS_PRIVATE_KEY (from emailjs.com → Account → Security → Private Key)

const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send';

async function sendViaEmailJS(templateParams, attempts = 2) {
  const serviceId  = (process.env.EMAILJS_SERVICE_ID  || '').trim();
  const templateId = (process.env.EMAILJS_TEMPLATE_ID || '').trim();
  const publicKey  = (process.env.EMAILJS_PUBLIC_KEY  || '').trim();
  const privateKey = (process.env.EMAILJS_PRIVATE_KEY || '').trim();

  if (!serviceId || !templateId || !publicKey) {
    throw new Error(
      `EmailJS not configured. Add to Render server env vars:\n` +
      `  EMAILJS_SERVICE_ID  = ${serviceId  || '❌ MISSING'}\n` +
      `  EMAILJS_TEMPLATE_ID = ${templateId || '❌ MISSING'}\n` +
      `  EMAILJS_PUBLIC_KEY  = ${publicKey  || '❌ MISSING'}\n` +
      `  EMAILJS_PRIVATE_KEY = ${privateKey ? '✅ set' : '❌ MISSING (optional but recommended)'}`
    );
  }

  const payload = {
    service_id:      serviceId,
    template_id:     templateId,
    user_id:         publicKey,
    ...(privateKey ? { accessToken: privateKey } : {}),
    template_params: templateParams,
  };

  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(EMAILJS_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  AbortSignal.timeout(15000),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`EmailJS API error ${res.status}: ${text}`);
      console.log(`[Email] Sent OK via EmailJS template ${templateId}`);
      return;
    } catch (err) {
      lastErr = err;
      console.error(`[Email] Attempt ${i}/${attempts} failed: ${err.message}`);
      if (i < attempts) await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw lastErr;
}

// ── Safely extract booking fields (works with Mongoose doc or plain object) ──
function extract(booking) {
  // Support both Mongoose documents and plain objects
  const b = booking?.toObject ? booking.toObject() : (booking || {});
  const id      = (b._id || '').toString();
  const shortId = id.slice(-8).toUpperCase() || 'N/A';
  return {
    shortId,
    fullId:        id,
    to_email:      (b.email       || '').trim(),
    to_name:       (b.user        || 'Customer').trim(),
    device:        b.device       || '—',
    condition:     b.condition    || '—',
    qty:           b.qty          || 1,
    city:          b.city         || '—',
    pincode:       b.pincode      || '—',
    address:       b.address      || '—',
    date:          b.date         || '—',
    slot:          b.slot         || '—',
    recycler:      b.recycler     || 'Being assigned',
    reward:        b.reward       || 0,
    upi:           b.upi          || 'Not provided',
    status:        b.status       || '—',
    paymentStatus: b.paymentStatus || 'Pending',
    phone:         b.phone        || '—',
  };
}

// ── Build params that populate EVERY variable your EmailJS template uses ──
function buildParams(booking, subject, statusLine, extraMessage = '') {
  const f = extract(booking);
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim();

  // Rich text block for {{message}} — this is the main body shown in the email
  const messageLines = [
    `Hi ${f.to_name},`,
    '',
    statusLine,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '         BOOKING DETAILS',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `Booking ID     : #${f.shortId}`,
    `Device         : ${f.device} (Qty: ${f.qty})`,
    `Condition      : ${f.condition}`,
    `Pickup Date    : ${f.date}`,
    `Time Slot      : ${f.slot}`,
    `City           : ${f.city}`,
    `Pincode        : ${f.pincode}`,
    `Address        : ${f.address}`,
    `Recycler       : ${f.recycler}`,
    `Est. Reward    : Rs. ${f.reward}`,
    `UPI ID         : ${f.upi}`,
    `Status         : ${f.status}`,
    `Payment Status : ${f.paymentStatus}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ...(extraMessage ? ['', extraMessage, ''] : ['']),
    'Thank you for recycling responsibly with EcoVault!',
    '— Team EcoVault 🌿',
  ];

  return {
    // ── Core template vars — match {{variable}} in your EmailJS template ──
    to_email:      f.to_email,
    to_name:       f.to_name,
    from_name:     'EcoVault Team',
    reply_to:      adminEmail || 'noreply@ecovault.in',
    subject,
    message:       messageLines.join('\n'),

    // ── Named vars — add these directly to your template for richer layout ──
    booking_id:     `#${f.shortId}`,
    order_id:       `#${f.shortId}`,          // alias for templates using {{order_id}}
    customer_name:  f.to_name,
    device:         `${f.device} (Qty: ${f.qty})`,
    condition:      f.condition,
    pickup_date:    f.date,
    pickup_slot:    f.slot,
    city:           f.city,
    pincode:        f.pincode,
    address:        f.address,
    recycler:       f.recycler,
    reward:         `Rs. ${f.reward}`,
    upi:            f.upi,
    // status as plain text string — NEVER an emoji or empty
    status:         String(f.status || 'Confirmed'),
    status_text:    String(f.status || 'Confirmed'),   // alias
    order_status:   String(f.status || 'Confirmed'),   // alias
    payment_status: String(f.paymentStatus || 'Pending'),
    phone:          f.phone,
    update_type:    String(f.status || 'Confirmed'),
    admin_email:    adminEmail,
  };
}

// ── sendBookingConfirmed ──────────────────────────────────────────────────
const sendBookingConfirmed = async (booking) => {
  const f = extract(booking);
  const subject = `EcoVault: Pickup Confirmed — #${f.shortId}`;
  const statusLine = [
    `Your e-waste pickup has been successfully booked! ✅`,
    ``,
    `Recycler ${f.recycler} will arrive on ${f.date} during the ${f.slot} slot.`,
    `Please keep your device ready. We will safely wipe all data (DoD 5220.22-M certified).`,
  ].join('\n');

  const params = buildParams(booking, subject, statusLine);
  await sendViaEmailJS(params);
  console.log(`[Email] Booking confirmed sent → ${f.to_email} (booking #${f.shortId})`);
};

// ── sendStatusUpdate ──────────────────────────────────────────────────────
const sendStatusUpdate = async (booking, type) => {
  const f = extract(booking);

  const STATUS_MAP = {
    'Confirmed': {
      subject:    `EcoVault: Booking Confirmed — #${f.shortId}`,
      statusLine: [
        `Your booking has been confirmed! ✅`,
        ``,
        `Recycler: ${f.recycler}`,
        `Pickup: ${f.date} during the ${f.slot} slot.`,
        `Keep your device ready — our recycler will arrive at your address.`,
      ].join('\n'),
    },
    'Picked Up': {
      subject:    `EcoVault: Device Picked Up — #${f.shortId}`,
      statusLine: [
        `Your device has been picked up by ${f.recycler}. 📦`,
        ``,
        `It is now being transported to our CPCB-certified recycling facility.`,
        `You will receive another update once recycling is complete.`,
      ].join('\n'),
    },
    'Recycled': {
      subject:    `EcoVault: Recycling Complete — #${f.shortId}`,
      statusLine: [
        `Your device has been safely recycled! ♻️`,
        ``,
        `Your reward of Rs. ${f.reward} will be transferred to UPI: ${f.upi} within 2–3 working days.`,
        `Your official CPCB recycling certificate is now ready — download it from My Bookings in the app.`,
      ].join('\n'),
    },
    'Paid': {
      subject:    `EcoVault: Reward Transferred — #${f.shortId}`,
      statusLine: [
        `Rs. ${f.reward} has been transferred to ${f.upi}. 💰`,
        ``,
        `Your CPCB recycling certificate is available to download from My Bookings.`,
        `Thank you for recycling responsibly!`,
      ].join('\n'),
    },
    'Cancelled': {
      subject:    `EcoVault: Booking Cancelled — #${f.shortId}`,
      statusLine: [
        `Your booking #${f.shortId} has been cancelled.`,
        ``,
        `If you would like to reschedule, you can create a new booking anytime from the app.`,
        `Need help? Reply to this email and we'll assist you.`,
      ].join('\n'),
    },
  };

  const info = STATUS_MAP[type] || {
    subject:    `EcoVault: Status Updated — #${f.shortId}`,
    statusLine: `Your booking status has been updated to: ${type}`,
  };

  // Inject the live type into params — override stale booking.status
  const params = buildParams(booking, info.subject, info.statusLine);
  params.update_type    = type;
  params.status         = type;        // the NEW status being applied
  params.status_text    = type;
  params.order_status   = type;
  // Also override the message block's status line to show the new status
  params.message = params.message.replace(
    `Status         : ${params.status || f.status}`,
    `Status         : ${type}`
  );

  await sendViaEmailJS(params);
  console.log(`[Email] Status update (${type}) sent → ${f.to_email} (booking #${f.shortId})`);
};

// ── sendWithdrawalNotification ────────────────────────────────────────────
const sendWithdrawalNotification = async ({ userName, userEmail, upi, amount, bookingIds }) => {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim();
  if (!adminEmail) throw new Error('[Email] ADMIN_EMAIL env var not set');

  const bookingList = (bookingIds || []).length
    ? bookingIds.map(id => `#${id.toString().slice(-8).toUpperCase()}`).join(', ')
    : 'All recycled bookings';

  const subject = `EcoVault: Withdrawal Request — Rs.${amount} from ${userEmail}`;
  const message = [
    `New withdrawal request received.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `    WITHDRAWAL REQUEST DETAILS`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `User Name  : ${userName}`,
    `User Email : ${userEmail}`,
    `UPI ID     : ${upi}`,
    `Amount     : Rs. ${amount}`,
    `Bookings   : ${bookingList}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `ACTION REQUIRED:`,
    `1. Process this UPI transfer manually (Rs. ${amount} → ${upi})`,
    `2. Mark the booking(s) as Paid in Admin Dashboard → Payments tab`,
    ``,
    `— EcoVault System`,
  ].join('\n');

  await sendViaEmailJS({
    to_email:      adminEmail,
    to_name:       'Admin',
    from_name:     'EcoVault System',
    reply_to:      userEmail,
    subject,
    message,
    // Named vars
    booking_id:    bookingList,
    order_id:      bookingList,
    customer_name: userName,
    device:        'Withdrawal Request',
    reward:        `Rs. ${amount}`,
    upi,
    status:        'Withdrawal Requested',
    payment_status:'Pending',
    pickup_date:   new Date().toLocaleDateString('en-IN'),
    pickup_slot:   '—',
    city:          '—',
    pincode:       '—',
    address:       '—',
    recycler:      '—',
    condition:     '—',
    phone:         '—',
    update_type:   'Withdrawal',
    admin_email:   adminEmail,
  });
  console.log(`[Email] Withdrawal notification sent → ${adminEmail}`);
};

module.exports = { sendBookingConfirmed, sendStatusUpdate, sendWithdrawalNotification };
