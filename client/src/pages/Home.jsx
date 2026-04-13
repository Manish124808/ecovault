// src/pages/Home.jsx — Light/Dark mode compatible, UX hierarchy improved
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBookingStats, getMyBookings } from '../services/api';
import PriceEstimatorModal from '../components/modals/PriceEstimatorModal';

const RECYCLE_IMG = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=70&auto=format&fit=crop';
const CITY_IMG    = 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=70&auto=format&fit=crop';
const CERT_IMG    = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=70&auto=format&fit=crop';

// SVG icons — consistent 2.2px stroke weight on all four
const IconPickup = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
    <rect x="2" y="18" width="30" height="16" rx="3" stroke="#10d97e" strokeWidth="2.2" fill="none"/>
    <path d="M32 24h8l5 6v4H32V24z" stroke="#10d97e" strokeWidth="2.2" fill="rgba(16,217,126,.1)"/>
    <circle cx="11" cy="38" r="4" stroke="#10d97e" strokeWidth="2.2" fill="rgba(16,217,126,.1)"/>
    <circle cx="36" cy="38" r="4" stroke="#10d97e" strokeWidth="2.2" fill="rgba(16,217,126,.1)"/>
    <path d="M8 18V10h16l6 8" stroke="#10d97e" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
  </svg>
);
const IconUPI = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
    <rect x="12" y="4" width="24" height="40" rx="4" stroke="#10d97e" strokeWidth="2.2" fill="rgba(16,217,126,.08)"/>
    <circle cx="24" cy="38" r="2" fill="#10d97e"/>
    <rect x="18" y="8" width="12" height="2" rx="1" fill="#10d97e" opacity=".5"/>
    <path d="M20 18l4 6 4-6M24 24v8" stroke="#10d97e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
    <path d="M24 4L6 12v12c0 10 8 18 18 20 10-2 18-10 18-20V12L24 4z" stroke="#10d97e" strokeWidth="2.2" fill="rgba(16,217,126,.08)"/>
    <path d="M16 24l5 5 11-11" stroke="#10d97e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconAI = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="36">
    <rect x="8" y="10" width="32" height="24" rx="5" stroke="#10d97e" strokeWidth="2.2" fill="rgba(16,217,126,.08)"/>
    <circle cx="18" cy="22" r="3" stroke="#10d97e" strokeWidth="2.2" fill="none"/>
    <circle cx="30" cy="22" r="3" stroke="#10d97e" strokeWidth="2.2" fill="none"/>
    <path d="M18 34v4M30 34v4M14 38h20" stroke="#10d97e" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M21 22h6" stroke="#10d97e" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="2 2"/>
  </svg>
);

export default function Home() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [stats,   setStats]   = useState({ total: 0, totalReward: 0 });
  const [wallet,  setWallet]  = useState(0);
  const [showEst, setShowEst] = useState(false);

  useEffect(() => {
    getBookingStats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      getMyBookings().then(r => {
        const w = (r.data || []).filter(b => b.status === 'Recycled').reduce((a, b) => a + (b.reward || 0), 0);
        setWallet(w);
      }).catch(() => {});
    }
  }, [user]);

  const rewardDisplay = (stats.totalReward || 0) >= 1000
    ? '₹' + ((stats.totalReward || 0) / 1000).toFixed(1) + 'L+'
    : '₹' + (stats.totalReward || 0);

  return (
    <div style={{ position: 'relative' }}>
      {showEst && <PriceEstimatorModal onClose={() => setShowEst(false)} />}

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <div className="home-hero">
        {/* Subtle background image — very low opacity */}
        <div className="home-hero-bg" aria-hidden="true" />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Platform badge */}
          <div className="hbadge" style={{ marginBottom: 20, display: 'inline-flex' }}>
            <div className="hpulse" />🌱 India's #1 E-Waste Recycling Platform
          </div>

          {/* Headline */}
          <h1 className="home-h1">
            Recycle Your Devices.<br/>
            <span style={{ color: 'var(--grn)' }}>Earn Real Rewards.</span>
          </h1>

          <p className="home-sub">
            Free doorstep pickup · Instant UPI cashback · CPCB-certified · Data wiped safely
          </p>

          {/* ── CTA buttons — clear 3-tier hierarchy ── */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 44 }}>
            {/* PRIMARY — solid green fill */}
            <button className="bp home-cta-primary" onClick={() => user ? nav('/book') : nav('/login')}>
              📦 Book Free Pickup
            </button>
            {/* SECONDARY — green ghost */}
            <button className="home-cta-secondary" onClick={() => setShowEst(true)}>
              🤖 Estimate Price
            </button>
            {/* TERTIARY — neutral ghost */}
            <button className="home-cta-tertiary" onClick={() => nav('/market')}>
              🛒 Marketplace
            </button>
          </div>

          {/* ── Stats row — white cards with shadow in light, glass in dark ── */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[
              { val: (stats.total || 0) + '+', lbl: 'Pickups',     icon: '♻️' },
              { val: rewardDisplay,              lbl: 'Rewards Paid', icon: '💰' },
              { val: '38+',                      lbl: 'Cities',      icon: '🏙️' },
              { val: '100%',                     lbl: 'CPCB Cert',   icon: '✅' },
            ].map(s => (
              <div key={s.lbl} className="home-stat-card">
                <span style={{ fontSize: 22 }}>{s.icon}</span>
                <span className="home-stat-val">{s.val}</span>
                <span className="home-stat-lbl">{s.lbl}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ WHY ECOVAULT — Feature cards ═══════════════════════════════ */}
      <div className="sec-lbl"><h3>Why Choose EcoVault?</h3></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(195px,1fr))', gap: 14, marginBottom: 32 }}>
        {[
          { Icon: IconPickup, title: 'Free Pickup',   desc: 'Doorstep collection — zero hassle, zero cost.' },
          { Icon: IconUPI,    title: 'Instant UPI',   desc: 'Reward transferred to your UPI ID same day.' },
          { Icon: IconShield, title: 'Data Wiped',    desc: 'DoD 5220.22-M certified erasure on every device.' },
          { Icon: IconAI,     title: 'AI Pricing',    desc: 'Gemini AI instantly estimates fair device value.' },
          { icon: '📍', title: 'Live Tracking',  desc: 'Real-time pickup progress updates.' },
          { icon: '📄', title: 'Certificate',    desc: 'Official CPCB recycling certificate PDF.' },
          { icon: '🛒', title: 'Marketplace',    desc: 'Buy & sell refurbished electronics safely.' },
        ].map(f => (
          <div key={f.title} className="home-feature-card"
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
            <div style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
              {f.Icon ? <f.Icon /> : <span style={{ fontSize: 30 }}>{f.icon}</span>}
            </div>
            <b style={{ color: 'var(--txt)', fontSize: 14, fontWeight: 700 }}>{f.title}</b>
            <p style={{ color: 'var(--t3)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* ══ VISUAL BANNER ROW ═════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { img: RECYCLE_IMG, title: 'CPCB Certified Recycling', desc: "Every device processed at authorised e-waste facilities following India's E-Waste Management Rules 2022.", badge: '🏅 CPCB Registered' },
          { img: CITY_IMG,    title: 'Serving 38+ Cities',       desc: 'From metro to tier-2 cities — our network of certified recyclers covers all major Indian cities.', badge: '🏙️ Pan-India Network' },
          { img: CERT_IMG,    title: 'Official Certificate',     desc: 'Download a verified recycling certificate after every pickup — useful for corporate ESG reports.', badge: '📄 PDF Certificate' },
        ].map(c => (
          <div key={c.title} className="home-banner-card">
            <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
              <img src={c.img} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.6) saturate(.7)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 35%,rgba(10,16,28,.95))' }} />
              <span className="home-banner-badge">{c.badge}</span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'var(--txt)' }}>{c.title}</div>
              <p style={{ color: 'var(--t3)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════ */}
      <div className="sec-lbl"><h3>How It Works</h3></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12, marginBottom: 32 }}>
        {[
          { icon: '📝', step: 'Step 1', title: 'Book Online',    desc: 'Fill device details, pick date & slot — 2 minutes.' },
          { icon: '🚐', step: 'Step 2', title: 'We Pick Up',     desc: 'Certified recycler arrives on time at your door.' },
          { icon: '♻️', step: 'Step 3', title: 'Safe Recycling', desc: 'Device processed at CPCB-certified facility.' },
          { icon: '💰', step: 'Step 4', title: 'Get Reward',     desc: 'UPI reward transferred to your account instantly.' },
        ].map((s, i) => (
          <div key={s.step} className="home-step-card">
            <div className="home-step-num">{i + 1}</div>
            <div style={{ fontSize: 34, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--grn)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .7 }}>{s.step}</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5, color: 'var(--txt)' }}>{s.title}</div>
            <div style={{ color: 'var(--t3)', fontSize: 12, lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* ══ ECOPOINTS TEASER ══════════════════════════════════════════ */}
      <div className="home-promo-card home-promo-green" style={{ marginBottom: 16 }}>
        <div className="home-promo-icon" style={{ background: 'rgba(16,217,126,.15)', border: '1px solid rgba(16,217,126,.3)' }}>🌿</div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--txt)', marginBottom: 3 }}>EcoPoints &amp; Badges</div>
          <div style={{ color: 'var(--t3)', fontSize: 13 }}>Earn points for every pickup · Unlock badges · Climb the leaderboard</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {['🌱 First Recycler', '⚔️ Eco Warrior', '🏆 Green Champion', '💨 Carbon Crusher'].map(b => (
              <span key={b} className="home-badge-pill">{b}</span>
            ))}
          </div>
        </div>
        <button className="bp" style={{ padding: '11px 22px', fontSize: 13, flexShrink: 0 }} onClick={() => nav('/eco')}>
          View EcoPoints →
        </button>
      </div>

      {/* ══ WALLET BANNER (logged-in users only) ══════════════════════ */}
      {user && (
        <div className="home-promo-card" style={{ marginBottom: 16 }}>
          <div className="home-promo-icon" style={{ background: 'rgba(16,217,126,.1)', border: '1px solid rgba(16,217,126,.2)' }}>👛</div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--t2)', marginBottom: 2 }}>Your EcoWallet</div>
            <div style={{ color: 'var(--grn)', fontSize: 28, fontWeight: 900, fontFamily: "'DM Sans',sans-serif", lineHeight: 1 }}>₹{wallet}</div>
            <div style={{ color: 'var(--t3)', fontSize: 11, marginTop: 3 }}>Total rewards earned from recycling</div>
          </div>
          <button className="bp" style={{ padding: '11px 22px', fontSize: 13, flexShrink: 0 }} onClick={() => nav('/dash')}>
            My Bookings →
          </button>
        </div>
      )}

      {/* ══ MARKETPLACE BANNER ════════════════════════════════════════ */}
      <div className="home-promo-card home-promo-yellow">
        <div className="home-promo-icon" style={{ background: 'rgba(245,183,49,.12)', border: '1px solid rgba(245,183,49,.3)' }}>🛒</div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt)', marginBottom: 3 }}>EcoVault Marketplace</div>
          <div style={{ color: 'var(--t3)', fontSize: 13 }}>Buy &amp; sell refurbished electronics — give devices a second life</div>
        </div>
        <button className="home-mkt-btn" onClick={() => nav('/market')}>
          Browse Listings →
        </button>
      </div>
    </div>
  );
}
