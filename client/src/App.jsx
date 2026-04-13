// src/App.jsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar         from './components/Navbar';
import Toast          from './components/Toast';
import Loader         from './components/Loader';
import ErrorBoundary  from './components/ErrorBoundary';
import Home           from './pages/Home';
import Login          from './pages/Login';
import BookingFlow    from './pages/BookingFlow';
import Dashboard      from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import RecyclerPanel  from './pages/RecyclerPanel';
import AIChat         from './pages/AIChat';
import Marketplace       from './pages/Marketplace';
import GamificationPage from './pages/GamificationPage';
import InstallBanner from './components/InstallBanner';
import './styles/global.css';

// ── Role access logic ──────────────────────────────────────────────────────
function RequireAuth({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader text="Checking auth…" />;
  if (!user)   return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppInner() {
  const { loading } = useAuth();
  const [toast, setToast] = useState({ msg:'', type:'' });
  const showToast = (msg, type='ok') => setToast({ msg, type });

  if (loading) {
    return (
      <div style={{ position:'fixed',inset:0,background:'var(--bg)',zIndex:9999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16 }}>
        <img src="/logo.png" alt="EcoVault" style={{ width:72,height:72,borderRadius:16,objectFit:'cover',boxShadow:'0 0 32px rgba(16,217,126,.35)' }} />
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:24,fontWeight:900,letterSpacing:'-0.5px' }}>Eco<span style={{color:'var(--grn)'}}>Vault</span></div>
        <div className="spin" />
        <p style={{ color:'var(--t3)',fontSize:13 }}>Loading platform…</p>
      </div>
    );
  }

  return (
    <div style={{ position:'relative',minHeight:'100vh' }}>
      <div className="bg-mesh">
        <div className="grid-bg" />
        <div className="m1" />
        <div className="m2" />
      </div>

      {/* Navbar always renders outside error boundaries */}
      <ErrorBoundary>
        <Navbar />
      </ErrorBoundary>

      {toast.msg && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg:'', type:'' })} />
      )}

      <InstallBanner />
      <div id="app" style={{ paddingLeft:'14px', paddingRight:'14px', paddingTop:'var(--nav-h)', paddingBottom:'80px', maxWidth:960, margin:'0 auto', position:'relative' }}>
        <Routes>
          {/* Public routes */}
          <Route path="/"       element={<ErrorBoundary><Home /></ErrorBoundary>} />
          <Route path="/login"  element={<ErrorBoundary><Login /></ErrorBoundary>} />
          <Route path="/market" element={<ErrorBoundary><Marketplace toast={showToast} /></ErrorBoundary>} />
          <Route path="/eco"    element={<ErrorBoundary><GamificationPage toast={showToast} /></ErrorBoundary>} />
          <Route path="/ai"     element={<ErrorBoundary><AIChat /></ErrorBoundary>} />

          {/* Authenticated routes — each in its own boundary so one crash never blanks the site */}
          <Route path="/book" element={
            <RequireAuth>
              <ErrorBoundary><BookingFlow toast={showToast} /></ErrorBoundary>
            </RequireAuth>
          } />
          <Route path="/dash" element={
            <RequireAuth>
              <ErrorBoundary><Dashboard toast={showToast} /></ErrorBoundary>
            </RequireAuth>
          } />
          <Route path="/recycler" element={
            <RequireAuth>
              <ErrorBoundary><RecyclerPanel toast={showToast} /></ErrorBoundary>
            </RequireAuth>
          } />

          {/* Admin only */}
          <Route path="/admin" element={
            <RequireAuth adminOnly>
              <ErrorBoundary><AdminDashboard toast={showToast} /></ErrorBoundary>
            </RequireAuth>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  );
}
