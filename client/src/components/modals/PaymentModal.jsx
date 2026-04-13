// src/components/modals/PaymentModal.jsx
import { useState } from 'react';
import { markPaymentPaid, createRazorpayOrder, verifyPayment, getRazorpayKey } from '../../services/api';

// Load Razorpay SDK dynamically — handles cases where CDN script didn't load
function loadRazorpaySDK() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.head.appendChild(script);
  });
}

export default function PaymentModal({ booking, onClose, onRefresh, toast }) {
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState('main'); // main | processing

  const openRazorpay = async () => {
    setLoading(true);
    setStep('processing');
    try {
      // Ensure minimum ₹1 for Razorpay (test mode rejects 0)
      const rewardAmount = Math.max(booking.reward || 1, 1);

      // Load SDK dynamically in case it wasn't available on page load
      const RazorpayClass = await loadRazorpaySDK();

      // Fetch key from backend (more secure than hardcoding in client)
      const keyRes = await getRazorpayKey();
      const keyId  = keyRes.data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

      // Create order on backend
      const { data } = await createRazorpayOrder(rewardAmount, booking._id);

      const options = {
        key:         keyId,
        amount:      data.amount,          // already in paise from backend
        currency:    data.currency || 'INR',
        name:        'EcoVault',
        description: `Reward — Booking #${booking._id?.slice(-8)}`,
        order_id:    data.orderId,
        prefill: {
          name:    booking.user  || '',
          email:   booking.email || '',
          contact: booking.phone || '',
        },
        notes:   { bookingId: booking._id },
        theme:   { color: '#10d97e' },
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            await markPaymentPaid(booking._id, response.razorpay_payment_id);
            toast('✅ Payment verified & booking marked paid!');
            onRefresh?.();
            onClose();
          } catch (e) {
            toast('Verification failed: ' + (e.response?.data?.error || e.message), 'err');
          }
        },
        modal: {
          ondismiss: () => {
            setStep('main');
            toast('Payment cancelled', 'info');
          },
          // Mobile-friendly: escape closes modal
          escape: true,
          // Prevent accidental back navigation on mobile
          handleback: true,
        },
      };

      new RazorpayClass(options).open();
    } catch (e) {
      console.error('[Razorpay]', e);
      const msg = e.response?.data?.error || e.message || 'Unknown error';
      // Give clear diagnosis for common Razorpay failures
      if (msg.includes('key') || msg.includes('configured')) {
        toast('Razorpay keys not set in server env vars (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)', 'err');
      } else if (msg.includes('Failed to load')) {
        toast('Razorpay SDK blocked — check your internet/adblocker', 'err');
      } else if (msg.includes('401') || msg.includes('403')) {
        toast('Razorpay auth failed — check your key_id and key_secret in Render env vars', 'err');
      } else {
        toast('Razorpay: ' + msg, 'err');
      }
      setStep('main');
    }
    setLoading(false);
  };

  const markManual = async () => {
    if (!window.confirm('Mark this reward as paid manually (after you have transferred via UPI)?')) return;
    try {
      await markPaymentPaid(booking._id, 'MANUAL_' + Date.now());
      toast('✅ Marked as Paid!');
      onRefresh?.();
      onClose();
    } catch (e) {
      toast('Failed: ' + (e.response?.data?.error || e.message), 'err');
    }
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:18,marginBottom:8 }}>💸 Reward Payment</div>
        <div style={{ marginBottom:14,color:'var(--t3)',fontSize:12 }}>
          #{booking._id?.slice(-10)} · {booking.user}
        </div>

        {/* Amount */}
        <div style={{ background:'rgba(16,217,126,.07)',border:'1px solid rgba(16,217,126,.2)',borderRadius:14,padding:16,marginBottom:14,textAlign:'center' }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:36,fontWeight:900,color:'var(--grn)' }}>₹{booking.reward}</div>
          <div style={{ color:'var(--t3)',fontSize:12,marginTop:2 }}>Reward to transfer</div>
        </div>

        {/* UPI */}
        <div style={{ fontSize:11,color:'var(--t3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.5,marginBottom:8 }}>Customer UPI ID</div>
        <div style={{ background:'rgba(10,22,40,.9)',border:'1px solid rgba(16,217,126,.28)',borderRadius:11,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
          <span style={{ fontFamily:'monospace',fontSize:14,fontWeight:700,color:'var(--grn)',wordBreak:'break-all' }}>
            {booking.upi || '⚠️ UPI not provided'}
          </span>
          {booking.upi && (
            <button className="actbtn g" style={{ flexShrink:0,marginLeft:8 }}
              onClick={() => { navigator.clipboard?.writeText(booking.upi); toast('UPI copied!'); }}>
              Copy
            </button>
          )}
        </div>

        {/* Manual UPI steps */}
        <div style={{ fontSize:11,color:'var(--t3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.5,marginBottom:8 }}>Pay via UPI App (Recommended)</div>
        {[
          `Open PhonePe / GPay / Paytm`,
          `Send ₹${booking.reward} to: ${booking.upi || '(UPI not provided)'}`,
          `Add note: EcoVault #${booking._id?.slice(-8)}`,
          `Click "Mark Paid" below after transfer`,
        ].map((step, i) => (
          <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:10,padding:'9px 0',borderBottom:'1px solid rgba(30,58,95,.3)' }}>
            <div style={{ width:22,height:22,borderRadius:'50%',background:'rgba(16,217,126,.1)',border:'1px solid rgba(16,217,126,.25)',color:'var(--grn)',fontWeight:800,fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>{i+1}</div>
            <div style={{ fontSize:12,color:'var(--t2)',lineHeight:1.5 }}>{step}</div>
          </div>
        ))}

        <div style={{ background:'rgba(240,64,96,.06)',border:'1px solid rgba(240,64,96,.15)',borderRadius:10,padding:'10px 13px',color:'var(--t3)',fontSize:12,margin:'12px 0',lineHeight:1.5 }}>
          ⚠️ Only click "Mark Paid" after completing the UPI transfer. This action is irreversible.
        </div>

        {/* Razorpay option */}
        <details style={{ marginBottom:12 }}>
          <summary style={{ fontSize:12,color:'var(--t3)',cursor:'pointer',padding:'8px 0',fontWeight:600 }}>
            💳 Pay via Razorpay (test mode) ›
          </summary>
          <button onClick={openRazorpay} disabled={loading || step==='processing'}
            style={{ width:'100%',marginTop:8,background:'linear-gradient(135deg,#072654,#146eb4)',color:'#fff',border:'none',borderRadius:11,padding:'12px',fontWeight:800,fontSize:13,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",minHeight:44 }}>
            {loading ? '⏳ Opening Razorpay…' : '💳 Open Razorpay Checkout'}
          </button>
          <div style={{ fontSize:10,color:'var(--t4)',marginTop:6,textAlign:'center' }}>
            Test mode: use card 4111 1111 1111 1111, any future expiry, any CVV
          </div>
        </details>

        <div className="btnrow">
          <button className="bs bfull" onClick={onClose}>Close</button>
          <button className="bp bfull" onClick={markManual}>✅ Mark Paid</button>
        </div>
      </div>
    </div>
  );
}
