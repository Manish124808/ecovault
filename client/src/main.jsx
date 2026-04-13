import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// ── Capture PWA install prompt BEFORE React mounts ────────────
// beforeinstallprompt fires early — must be caught at window level
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__installPrompt = e;   // InstallBanner reads this
});

// ── Initialize EmailJS ────────────────────────────────────────
const initEmailJS = () => {
  const key = import.meta.env.VITE_EJS_PUB;
  if (key && window.emailjs) window.emailjs.init(key);
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEmailJS);
} else {
  initEmailJS();
}

// ── Register Service Worker ───────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(r => console.log('[SW] registered:', r.scope))
      .catch(e => console.warn('[SW] failed:', e.message));
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
