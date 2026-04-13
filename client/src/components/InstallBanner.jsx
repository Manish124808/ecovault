// InstallBanner.jsx — PWA install prompt
// Android: beforeinstallprompt (Chrome/Edge/Samsung)
// iOS: manual Share → Add to Home Screen guide
import { useState, useEffect } from 'react';

// The beforeinstallprompt event fires BEFORE React mounts.
// Capture it at window level in index.html / main.jsx
// Here we read it from window.__installPrompt if set.
export default function InstallBanner() {
  const [prompt,    setPrompt]    = useState(null);
  const [showIOS,   setShowIOS]   = useState(false);
  const [dismissed, setDismissed] = useState(
    () => !!localStorage.getItem('pwa-dismissed')
  );
  const [installed, setInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
  );

  useEffect(() => {
    if (installed || dismissed) return;

    // Check if already captured by main.jsx
    if (window.__installPrompt) {
      setPrompt(window.__installPrompt);
      return;
    }

    // Listen for future events (in case React mounted first)
    const handler = (e) => {
      e.preventDefault();
      window.__installPrompt = e;
      setPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS detection
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIOS && isSafari && !window.navigator.standalone) {
      const t = setTimeout(() => setShowIOS(true), 3000);
      return () => { clearTimeout(t); window.removeEventListener('beforeinstallprompt', handler); };
    }

    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      window.__installPrompt = null;
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [installed, dismissed]);

  const dismiss = () => {
    localStorage.setItem('pwa-dismissed', Date.now());
    setDismissed(true);
    setShowIOS(false);
    setPrompt(null);
  };

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') { setInstalled(true); window.__installPrompt = null; }
    setPrompt(null);
  };

  if (installed || dismissed || (!prompt && !showIOS)) return null;

  const bannerStyle = {
    position: 'fixed',
    bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
    left: '50%', transform: 'translateX(-50%)',
    width: 'calc(100% - 32px)', maxWidth: 420,
    background: 'rgba(10,20,38,0.98)',
    border: '1px solid rgba(16,217,126,0.4)',
    borderRadius: 18, padding: '14px 16px',
    boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
    zIndex: 9998,
    animation: 'pwaSlide .35s cubic-bezier(.34,1.56,.64,1)',
  };

  if (prompt) return (
    <div style={bannerStyle}>
      <style>{`@keyframes pwaSlide{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,#10d97e,#059669)',
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0 }}>♻</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:14,color:'#f0f6ff' }}>
            Install EcoVault
          </div>
          <div style={{ fontSize:11,color:'#5a7898',marginTop:2 }}>
            Add to home screen · works offline
          </div>
        </div>
        <div style={{ display:'flex',gap:6,flexShrink:0 }}>
          <button onClick={dismiss}
            style={{ padding:'7px 10px',borderRadius:8,border:'1px solid #1e3a5f',background:'transparent',
              color:'#5a7898',fontSize:11,fontWeight:600,cursor:'pointer',minHeight:34 }}>
            Later
          </button>
          <button onClick={install}
            style={{ padding:'7px 14px',borderRadius:8,border:'none',
              background:'linear-gradient(135deg,#10d97e,#059669)',color:'#021a0e',
              fontSize:12,fontWeight:800,cursor:'pointer',minHeight:34 }}>
            Install ↓
          </button>
        </div>
      </div>
    </div>
  );

  // iOS guide
  return (
    <div style={bannerStyle}>
      <style>{`@keyframes pwaSlide{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#10d97e,#059669)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>♻</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:14,color:'#f0f6ff' }}>
            Add to Home Screen
          </div>
        </div>
        <button onClick={dismiss}
          style={{ background:'none',border:'none',color:'#5a7898',fontSize:20,cursor:'pointer',padding:0,lineHeight:1 }}>
          ×
        </button>
      </div>
      {[
        ['1', 'Tap the Share button', '⎋', 'at the bottom of Safari'],
        ['2', 'Tap', '⊕', '"Add to Home Screen"'],
        ['3', 'Tap', '✓', '"Add" to confirm'],
      ].map(([n, a, icon, b]) => (
        <div key={n} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:7,
          padding:'8px 10px',background:'rgba(13,27,42,0.8)',borderRadius:10,border:'1px solid #1e3a5f' }}>
          <div style={{ width:20,height:20,borderRadius:'50%',background:'rgba(16,217,126,.15)',
            border:'1px solid rgba(16,217,126,.3)',display:'flex',alignItems:'center',
            justifyContent:'center',fontSize:10,fontWeight:800,color:'#10d97e',flexShrink:0 }}>{n}</div>
          <div style={{ fontSize:12,color:'#8ba3c7' }}>
            {a} <span style={{ fontSize:15,color:'#10d97e' }}>{icon}</span> {b}
          </div>
        </div>
      ))}
    </div>
  );
}
