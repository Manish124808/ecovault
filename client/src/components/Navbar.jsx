// src/components/Navbar.jsx — Fixed dropdown z-index, mobile hamburger
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [showPortal,  setShowPortal]  = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  // Close all menus on outside click
  useEffect(() => {
    const handler = (e) => {
      // Check if click is inside nav element
      const navEl = document.getElementById('ev-navbar');
      if (navEl && !navEl.contains(e.target)) {
        setShowPortal(false);
        setShowProfile(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  // Close all menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setShowPortal(false);
    setShowProfile(false);
  }, [loc.pathname]);

  // Theme
  const [theme, setTheme] = useState(() => localStorage.getItem('ev-theme') || 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ev-theme', theme);
  }, [theme]);

  const coreLinks = [
    { to: '/',       label: 'How it Works' },
    { to: '/book',   label: 'Bookings'     },
    { to: '/market', label: 'Marketplace'  },
    { to: '/eco',    label: '🌿 EcoPoints'  },
  ];

  const portalLinks = [
    { to: '/admin',    label: '⚙️ Admin Dashboard', roles: ['admin'] },
    { to: '/recycler', label: '🏭 Recycler Panel',   roles: ['admin','recycler'] },
    { to: '/dash',     label: '📊 My Bookings',      roles: ['admin','user','recycler'] },
    { to: '/ai',       label: '🤖 AI Assistant',     roles: ['admin','user','recycler'] },
  ];

  const visiblePortal = user ? portalLinks.filter(l => l.roles.includes(user.role)) : [];
  const userName    = user ? (user.name || user.email || 'User').split(' ')[0] : '';
  const userInitial = userName[0]?.toUpperCase() || '?';

  const go = (to) => {
    nav(to);
    setMenuOpen(false);
    setShowPortal(false);
    setShowProfile(false);
  };

  // ── Dropdown styles — position:fixed so they escape ALL stacking contexts ──
  // This is the ONLY reliable way to render above hero sections, modals, etc.
  const dropdownStyle = {
    position: 'fixed',
    top: 'var(--nav-h)',
    zIndex: 2147483647, // max possible z-index
    background: theme === 'light' ? 'rgba(255,255,255,.99)' : 'rgba(8,18,32,.99)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid var(--brd)',
    borderRadius: 16,
    padding: '6px 0',
    boxShadow: '0 20px 60px rgba(0,0,0,.7)',
    overflow: 'hidden',
    minWidth: 220,
    maxWidth: 'calc(100vw - 28px)',
  };

  const DDBtn = ({ label, onClick, active, danger }) => (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        background: active ? 'rgba(16,217,126,.1)' : 'transparent',
        color: danger ? 'var(--red)' : active ? 'var(--grn)' : 'var(--t2)',
        border: 'none', padding: '12px 18px', fontSize: 14,
        fontWeight: 600, cursor: 'pointer', transition: 'background .1s',
        fontFamily: "'DM Sans', sans-serif",
        lineHeight: 1.4,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? 'rgba(240,64,96,.08)' : 'rgba(16,217,126,.08)';
        e.currentTarget.style.color = danger ? 'var(--red)' : 'var(--txt)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = active ? 'rgba(16,217,126,.1)' : 'transparent';
        e.currentTarget.style.color = danger ? 'var(--red)' : active ? 'var(--grn)' : 'var(--t2)';
      }}
    >
      {label}
    </button>
  );

  return (
    <nav
      id="ev-navbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: 'var(--nav-h)',
        background: theme === 'light' ? 'rgba(255,255,255,.97)' : 'rgba(8,18,32,.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--brd)',
        position: 'sticky',
        top: 0,
        // Nav itself at high z-index so sticky stacks correctly
        zIndex: 1000,
        width: '100%',
        maxWidth: '100vw',
        boxSizing: 'border-box',
        // CRITICAL: do not set overflow here — it would clip fixed children
      }}
    >
      {/* ── Logo ── */}
      <div
        onClick={() => go('/')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}
      >
        <img src="/logo.png" alt="EcoVault" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 16, whiteSpace: 'nowrap', color: 'var(--txt)' }}>
          Eco<span style={{ color: 'var(--grn)' }}>Vault</span>
        </span>
      </div>

      {/* ── Desktop links (≥641px) ── */}
      <div className="nav-desktop-links" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, paddingLeft: 8 }}>
        {coreLinks.map(({ to, label }) => (
          <button
            key={to}
            onClick={() => go(to)}
            className={`nb${loc.pathname === to ? ' on' : ''}`}
            style={{ fontSize: 13 }}
          >
            {label}
          </button>
        ))}

        {/* Portal dropdown — desktop */}
        {visiblePortal.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              className={`nb${showPortal ? ' on' : ''}`}
              onClick={() => { setShowPortal(v => !v); setShowProfile(false); }}
              style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Portal {showPortal ? '▴' : '▾'}
            </button>
            {showPortal && (
              <div style={{ ...dropdownStyle, left: 0, right: 'auto' }}>
                {visiblePortal.map(({ to, label }) => (
                  <DDBtn key={to} label={label} active={loc.pathname === to} onClick={() => go(to)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right cluster ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: '1px solid var(--brd)',
            background: 'transparent',
            fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all .2s',
          }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* ── Desktop: Profile avatar / Login ── */}
        <div className="nav-desktop-links">
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setShowProfile(v => !v); setShowPortal(false); }}
                style={{
                  width: 34, height: 34, borderRadius: '50%', overflow: 'hidden',
                  border: `2px solid ${showProfile ? 'var(--grn)' : 'rgba(16,217,126,.35)'}`,
                  background: 'rgba(16,217,126,.1)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0,
                  transition: 'border-color .2s', boxShadow: showProfile ? '0 0 14px rgba(16,217,126,.3)' : 'none',
                }}
              >
                {user.photo
                  ? <img src={user.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: 'var(--grn)', fontWeight: 800, fontSize: 13 }}>{userInitial}</span>}
              </button>

              {showProfile && (
                <div style={{ ...dropdownStyle, right: 0, left: 'auto' }}>
                  <div style={{ padding: '8px 18px 12px', borderBottom: '1px solid var(--brd)', marginBottom: 4 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--txt)', marginBottom: 2 }}>{userName}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>{user.email}</div>
                    <span style={{
                      display: 'inline-block', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .6,
                      padding: '2px 8px', borderRadius: 20,
                      background: user.role==='admin' ? 'rgba(245,183,49,.15)' : user.role==='recycler' ? 'rgba(124,111,239,.15)' : 'rgba(16,217,126,.12)',
                      color: user.role==='admin' ? 'var(--ylw)' : user.role==='recycler' ? 'var(--pur2)' : 'var(--grn)',
                      border: `1px solid ${user.role==='admin' ? 'rgba(245,183,49,.3)' : user.role==='recycler' ? 'rgba(124,111,239,.3)' : 'rgba(16,217,126,.3)'}`,
                    }}>{user.role}</span>
                  </div>
                  <DDBtn label="📊 My Bookings" active={loc.pathname==='/dash'} onClick={() => go('/dash')} />
                  <DDBtn label="🌿 EcoPoints"   active={loc.pathname==='/eco'}  onClick={() => go('/eco')} />
                  <DDBtn label="🤖 AI Assistant" active={loc.pathname==='/ai'}  onClick={() => go('/ai')} />
                  {visiblePortal.filter(l => ['/admin','/recycler'].includes(l.to)).map(({ to, label }) => (
                    <DDBtn key={to} label={label} active={loc.pathname===to} onClick={() => go(to)} />
                  ))}
                  <div style={{ borderTop: '1px solid var(--brd)', marginTop: 4, paddingTop: 4 }}>
                    <DDBtn label="🚪 Sign Out" danger onClick={() => { logout(); setShowProfile(false); }} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => go('/login')}
              style={{
                border: '1px solid var(--grn)', color: 'var(--grn)',
                background: 'rgba(16,217,126,.07)', padding: '6px 16px',
                borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                transition: 'all .2s', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,217,126,.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,217,126,.07)'}
            >
              Login
            </button>
          )}
        </div>

        {/* ── Mobile: Hamburger button (≤640px) ── */}
        <button
          className="nav-mobile-only"
          onClick={() => { setMenuOpen(v => !v); setShowPortal(false); setShowProfile(false); }}
          aria-label="Menu"
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: `1px solid ${menuOpen ? 'var(--grn)' : 'var(--brd)'}`,
            background: menuOpen ? 'rgba(16,217,126,.1)' : 'transparent',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 5, cursor: 'pointer', padding: 0,
            transition: 'all .15s', flexShrink: 0,
          }}
        >
          <span style={{ display: 'block', width: 18, height: 2, borderRadius: 2, background: menuOpen ? 'var(--grn)' : 'var(--t2)', transition: 'all .2s', transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
          <span style={{ display: 'block', width: 18, height: 2, borderRadius: 2, background: menuOpen ? 'var(--grn)' : 'var(--t2)', transition: 'all .2s', transform: menuOpen ? 'scaleX(0)' : 'none' }} />
          <span style={{ display: 'block', width: 18, height: 2, borderRadius: 2, background: menuOpen ? 'var(--grn)' : 'var(--t2)', transition: 'all .2s', transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
        </button>
      </div>

      {/* ── Mobile full menu — position:fixed, max z-index ── */}
      {menuOpen && (
        <div
          className="nav-mobile-only"
          style={{
            position: 'fixed',
            top: 'var(--nav-h)',
            left: 0,
            right: 0,
            zIndex: 2147483647,
            flexDirection: 'column',
            alignItems: 'stretch',
            background: theme === 'light' ? 'rgba(255,255,255,.99)' : 'rgba(8,18,32,.99)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid var(--brd)',
            boxShadow: '0 20px 60px rgba(0,0,0,.7)',
            maxHeight: 'calc(100vh - var(--nav-h))',
            overflowY: 'auto',
            padding: '8px 0 16px',
          }}
        >
          {/* User card if logged in */}
          {user && (
            <div style={{ margin: '4px 12px 8px', padding: '12px 14px', background: 'rgba(16,217,126,.06)', border: '1px solid rgba(16,217,126,.15)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(16,217,126,.4)', background: 'rgba(16,217,126,.1)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user.photo ? <img src={user.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'var(--grn)', fontWeight: 800, fontSize: 15 }}>{userInitial}</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                </div>
              </div>
            </div>
          )}

          {/* Section label */}
          <div style={{ padding: '4px 18px 2px', fontSize: 10, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: .7 }}>Navigation</div>

          {coreLinks.map(({ to, label }) => (
            <DDBtn key={to} label={label} active={loc.pathname === to} onClick={() => go(to)} />
          ))}

          {visiblePortal.length > 0 && (
            <>
              <div style={{ height: 1, background: 'var(--brd)', margin: '6px 0' }} />
              <div style={{ padding: '4px 18px 2px', fontSize: 10, fontWeight: 700, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: .7 }}>My Portal</div>
              {visiblePortal.map(({ to, label }) => (
                <DDBtn key={to} label={label} active={loc.pathname === to} onClick={() => go(to)} />
              ))}
            </>
          )}

          <div style={{ height: 1, background: 'var(--brd)', margin: '6px 0' }} />

          {user
            ? <DDBtn label="🚪 Sign Out" danger onClick={() => { logout(); setMenuOpen(false); }} />
            : <DDBtn label="🔑 Login / Sign Up" onClick={() => go('/login')} />
          }
        </div>
      )}
    </nav>
  );
}
