// src/components/modals/EmailModal.jsx
import { useState } from 'react';

const TEMPLATES = {
  status: (b) => ({
    subj: `EcoVault — Your Booking #${b?._id?.slice(-8)} is ${b?.status}`,
    msg:  `Dear ${b?.user || 'Customer'},\n\nYour EcoVault booking has been updated.\n\n📦 Device: ${b?.device}\n📍 Status: ${b?.status}\n📅 Date: ${b?.date} · ${b?.slot}\n🏭 Recycler: ${b?.recycler}\n💰 Reward: ₹${b?.reward}\n\nThank you for recycling responsibly!\n\n— Team EcoVault 🌱`,
  }),
  confirm: (b) => ({
    subj: `EcoVault — Pickup Confirmed for ${b?.date}`,
    msg:  `Dear ${b?.user || 'Customer'},\n\nGreat news! Your pickup has been confirmed.\n\n📦 Device: ${b?.device}\n📅 Date: ${b?.date}\n⏰ Slot: ${b?.slot}\n🏭 Recycler: ${b?.recycler}\n💰 Expected Reward: ₹${b?.reward}\n\nPlease keep your device ready.\n\n— Team EcoVault 🌱`,
  }),
  reminder: (b) => ({
    subj: `EcoVault — Pickup Reminder for Tomorrow`,
    msg:  `Dear ${b?.user || 'Customer'},\n\nReminder about your pickup tomorrow.\n\n📅 Date: ${b?.date}\n⏰ Slot: ${b?.slot}\n📦 Device: ${b?.device}\n\nPlease ensure:\n✅ Device is ready\n✅ Data is backed up\n✅ Someone is home\n\n— Team EcoVault 🌱`,
  }),
  payment: (b) => ({
    subj: `EcoVault — Reward of ₹${b?.reward} Sent to Your UPI`,
    msg:  `Dear ${b?.user || 'Customer'},\n\nYour reward has been processed!\n\n💰 Amount: ₹${b?.reward}\n💳 UPI: ${b?.upi || 'On file'}\n📦 Device: ${b?.device}\n\nDownload your recycling certificate from the app.\n\n— Team EcoVault 🌱`,
  }),
  custom: () => ({ subj: '', msg: '' }),
};

export default function EmailModal({ booking, onClose }) {
  const [tplKey,  setTplKey]  = useState('status');
  const init = TEMPLATES['status']?.(booking) || { subj:'', msg:'' };

  const [to,      setTo]      = useState(booking?.email || '');
  const [subj,    setSubj]    = useState(init.subj);
  const [msg,     setMsg]     = useState(init.msg);
  const [status,  setStatus]  = useState('');
  const [sending, setSending] = useState(false);

  const applyTemplate = (key) => {
    setTplKey(key);
    const t = TEMPLATES[key]?.(booking) || { subj:'', msg:'' };
    setSubj(t.subj);
    setMsg(t.msg);
  };

  const send = async () => {
    if (!to || !to.includes('@')) { setStatus('❌ Enter a valid email address'); return; }
    if (!subj.trim()) { setStatus('❌ Subject cannot be empty'); return; }
    if (!msg.trim())  { setStatus('❌ Message cannot be empty'); return; }

    // Check EmailJS is available and initialized
    const ejs = window.emailjs;
    if (!ejs) {
      setStatus('❌ EmailJS not loaded — refresh the page');
      return;
    }

    const svcId  = import.meta.env.VITE_EJS_SVC;
    const tmplId = import.meta.env.VITE_EJS_TMPL;
    const pubKey = import.meta.env.VITE_EJS_PUB;

    if (!svcId || !tmplId || !pubKey) {
      setStatus('❌ EmailJS env vars missing (VITE_EJS_SVC / VITE_EJS_TMPL / VITE_EJS_PUB)');
      return;
    }

    setSending(true);
    setStatus('⏳ Sending…');

    try {
      // Template params must EXACTLY match variable names in your EmailJS template.
      // In EmailJS dashboard your template should use: {{to_email}}, {{to_name}},
      // {{subject}}, {{message}}
      // The 4th argument (publicKey) ensures init even if main.jsx init was missed.
      await ejs.send(
        svcId,
        tmplId,
        {
          to_email:   to,
          to_name:    booking?.user || 'Customer',
          subject:    subj,
          message:    msg,
          from_name:  'EcoVault Team',
          reply_to:   import.meta.env.VITE_ADMIN_EMAIL || 'support@ecovault.in',
        },
        pubKey,   // passing pubKey here re-inits if needed (EmailJS v4 supports this)
      );
      setStatus('✅ Email sent successfully!');
      setTimeout(onClose, 1800);
    } catch (e) {
      // EmailJS errors have e.text for API errors, e.message for network errors
      const errDetail = e?.text || e?.message || 'Unknown error';
      console.error('[EmailJS] send failed:', e);
      setStatus(`❌ ${errDetail}`);
    }
    setSending(false);
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:18,marginBottom:4 }}>📧 Send Email</div>
        <div style={{ color:'var(--t3)',fontSize:12,marginBottom:14 }}>
          Booking #{booking?._id?.slice(-8)} · {booking?.user}
        </div>

        <label className="lbl">Template</label>
        <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:12 }}>
          {[['status','📋 Status'],['confirm','✅ Confirm'],['reminder','⏰ Reminder'],['payment','💸 Payment'],['custom','✍️ Custom']].map(([k,l]) => (
            <button key={k} onClick={() => applyTemplate(k)}
              style={{ padding:'5px 10px',borderRadius:8,border:`1px solid ${tplKey===k?'var(--grn)':'var(--brd)'}`,
                background:tplKey===k?'rgba(16,217,126,.1)':'rgba(13,27,42,.5)',
                color:tplKey===k?'var(--grn)':'var(--t3)',fontSize:11,fontWeight:600,cursor:'pointer' }}>
              {l}
            </button>
          ))}
        </div>

        <label className="lbl">To</label>
        <input type="email" value={to} onChange={e => setTo(e.target.value)} style={{ marginBottom:10 }} />

        <label className="lbl mt">Subject</label>
        <input value={subj} onChange={e => setSubj(e.target.value)} style={{ marginBottom:10 }} />

        <label className="lbl mt">Message</label>
        <textarea value={msg} onChange={e => setMsg(e.target.value)} style={{ height:130,marginBottom:12 }} />

        {status && (
          <div style={{ fontSize:12,marginBottom:10,padding:'8px 12px',borderRadius:8,
            background: status.startsWith('✅')?'rgba(16,217,126,.08)':status.startsWith('❌')?'rgba(240,64,96,.08)':'rgba(255,255,255,.04)',
            color: status.startsWith('✅')?'var(--grn)':status.startsWith('❌')?'var(--red)':'var(--t3)',
            border:`1px solid ${status.startsWith('✅')?'rgba(16,217,126,.2)':status.startsWith('❌')?'rgba(240,64,96,.2)':'transparent'}` }}>
            {status}
          </div>
        )}

        <div style={{ display:'flex',gap:8 }}>
          <button className="bs bfull" onClick={onClose}>Cancel</button>
          <button className="bp bfull" onClick={send} disabled={sending}>{sending ? 'Sending…' : '📧 Send Email'}</button>
        </div>
      </div>
    </div>
  );
}
