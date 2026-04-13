// src/pages/Login.jsx
import { useState } from 'react';
import { signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth, provider } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [role,    setRole]    = useState('');
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');
  const nav = useNavigate();

  const ROLES = [
    { key:'user',     icon:'👤', name:'Customer',  color:'var(--grn)',  cls:'su', desc:'Book pickups, earn rewards, download certificates' },
    { key:'recycler', icon:'🏭', name:'Recycler',  color:'#93c5fd',    cls:'sr', desc:'View assigned pickups, update collection status' },
    { key:'admin',    icon:'⚙️', name:'Admin',     color:'var(--pur2)',cls:'sa', desc:'Full dashboard, manage all bookings & analytics' },
  ];

  const signIn = async () => {
    if (!role) { setErr('Please select a role first'); return; }
    setLoading(true); setErr('');
    // Store intended role so AuthContext can verify it
    sessionStorage.setItem('ev_role', role);
    try {
      await signInWithPopup(auth, provider);
      nav('/');
    } catch (e) {
      if (e.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, provider);
        return;
      }
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        setErr('Sign-in cancelled. Please try again.');
      } else {
        setErr(e.message || 'Sign-in failed.');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth:700,margin:'0 auto',padding:'28px 0' }}>
      {/* Logo */}
      <div style={{ textAlign:'center',marginBottom:28 }}>
        <div style={{ width:64,height:64,borderRadius:16,margin:'0 auto 14px',boxShadow:'0 0 30px rgba(16,217,126,.4)',overflow:'hidden' }}>
          <img src="/logo.png" alt="EcoVault" style={{ width:'100%',height:'100%',objectFit:'cover',objectPosition:'center' }} />
        </div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:26,fontWeight:800,marginBottom:6 }}>Welcome to EcoVault</div>
        <div style={{ color:'var(--t3)',fontSize:13 }}>India's Trusted E-Waste Recycling Platform — Choose your role to continue</div>
      </div>

      {/* Role grid */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24 }}>
        {ROLES.map(r => (
          <div key={r.key}
            onClick={() => { setRole(r.key); setErr(''); }}
            style={{
              background: role === r.key ? `${r.color}08` : 'rgba(13,27,42,.7)',
              border: `2px solid ${role === r.key ? (r.color === 'var(--grn)' ? '#10d97e' : r.color === '#93c5fd' ? '#3b82f6' : '#7c6fef') : 'var(--brd)'}`,
              borderRadius:18, padding:'22px 14px', textAlign:'center', cursor:'pointer', transition:'all .2s',
              boxShadow: role === r.key ? `0 0 28px ${r.color}22` : 'none',
            }}>
            <div style={{ fontSize:40,marginBottom:10 }}>{r.icon}</div>
            <div style={{ fontWeight:800,fontSize:14,marginBottom:4,color:r.color }}>{r.name}</div>
            <div style={{ color:'var(--t3)',fontSize:11,lineHeight:1.5 }}>{r.desc}</div>
          </div>
        ))}
      </div>

      {/* Sign-in box */}
      {role && (
        <div style={{ maxWidth:360,margin:'0 auto' }}>
          <div style={{ textAlign:'center',marginBottom:14,color:'var(--t2)',fontSize:13 }}>
            {{ user:'Sign in as a Customer', recycler:'Sign in as a Recycler — contact admin if not registered.', admin:'Admin access — only authorised Gmail allowed.' }[role]}
          </div>

          <button
            onClick={signIn} disabled={loading}
            style={{ background:'#fff',color:'#1f1f1f',border:'1.5px solid #dde0e3',borderRadius:'var(--radius)',padding:'13px 20px',fontWeight:700,fontSize:14,width:'100%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10,transition:'all .2s',boxShadow:'0 2px 8px rgba(0,0,0,.12)',fontFamily:"'DM Sans',sans-serif",opacity:loading?.5:1 }}>
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {loading ? 'Signing in…' : 'Sign in with Google'}
          </button>

          {err && (
            <div style={{ marginTop:10,background:'rgba(240,64,96,.08)',border:'1px solid rgba(240,64,96,.25)',borderRadius:10,padding:'10px 13px',color:'var(--red)',fontSize:12,lineHeight:1.5 }}>
              ⚠️ {err}
            </div>
          )}
          <p style={{ textAlign:'center',color:'var(--t4)',fontSize:11,marginTop:14,lineHeight:1.7 }}>
            🔒 100% Free · Powered by Firebase Google Auth<br/>No SMS cost · Your data stays private
          </p>
        </div>
      )}
    </div>
  );
}
