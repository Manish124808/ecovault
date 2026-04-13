// src/pages/RecyclerPanel.jsx
import { useState, useEffect } from 'react';
import { getRecyclerPickups } from '../services/api';
import BookingCard   from '../components/BookingCard';
import TrackingModal from '../components/modals/TrackingModal';
import Loader from '../components/Loader';
import { makeCert } from '../services/certificate';
import { useAuth } from '../context/AuthContext';

const PANEL_IMG = 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&q=70&auto=format&fit=crop';

export default function RecyclerPanel({ toast }) {
  const { user } = useAuth();
  const [bookings,  setBookings]  = useState([]);
  const [recycler,  setRecycler]  = useState(null);
  const [filter,    setFilter]    = useState('All');
  const [loading,   setLoading]   = useState(true);
  const [trackBook, setTrackBook] = useState(null);
  const [notRecycler, setNotRecycler] = useState(false);

  const load = async () => {
    try {
      const { data } = await getRecyclerPickups();
      setBookings(data.bookings || []);
      setRecycler(data.recycler);
    } catch(e) {
      const status = e.response?.status;
      if (status === 403) {
        // User is logged in but not a registered recycler — show friendly message
        setNotRecycler(true);
      } else {
        toast('Failed to load: ' + (e.response?.data?.error || e.message), 'err');
      }
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const stats = [
    { icon:'📦', val:bookings.length,                                  lbl:'Assigned'  },
    { icon:'⏳', val:bookings.filter(b=>b.status==='Confirmed').length, lbl:'To Pick Up'},
    { icon:'🚐', val:bookings.filter(b=>b.status==='Picked Up').length, lbl:'In Hand'  },
    { icon:'♻️', val:bookings.filter(b=>b.status==='Recycled').length,  lbl:'Recycled' },
  ];
  const shown = filter==='All' ? bookings : bookings.filter(b=>b.status===filter);

  if (loading) return <Loader text="Loading recycler panel…" />;

  // Not a registered recycler — show friendly error instead of crashing
  if (notRecycler) {
    return (
      <div style={{ paddingTop:60,textAlign:'center' }}>
        <div style={{ fontSize:48,marginBottom:16 }}>🚫</div>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:22,color:'var(--txt)',marginBottom:8 }}>
          Recycler Access Only
        </div>
        <div style={{ color:'var(--t3)',fontSize:14,maxWidth:340,margin:'0 auto',lineHeight:1.7 }}>
          Your account <b style={{color:'var(--txt)'}}>{user?.email}</b> is not registered as a recycler.
          <br/>Contact the admin to get recycler access.
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop:28 }}>
      {trackBook && <TrackingModal booking={trackBook} onClose={()=>setTrackBook(null)} />}

      {/* Header banner with image */}
      <div style={{ position:'relative',borderRadius:20,overflow:'hidden',marginBottom:24,height:130 }}>
        <img src={PANEL_IMG} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',filter:'brightness(.35)' }} />
        <div style={{ position:'absolute',inset:0,padding:'20px 24px',display:'flex',flexDirection:'column',justifyContent:'flex-end' }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:22,color:'#fff',letterSpacing:'-0.5px' }}>
            🚐 Recycler Panel
          </div>
          {recycler && (
            <div style={{ color:'rgba(255,255,255,.6)',fontSize:13,marginTop:2 }}>
              {recycler.name} · {recycler.city}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20 }}>
        {stats.map(s => (
          <div key={s.lbl} style={{ background:'rgba(13,27,42,.8)',border:'1px solid var(--brd)',borderRadius:14,padding:'12px 10px',textAlign:'center' }}>
            <div style={{ fontSize:20 }}>{s.icon}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:22,color:'var(--txt)',margin:'4px 0 2px' }}>{s.val}</div>
            <div style={{ color:'var(--t3)',fontSize:10,fontWeight:600,textTransform:'uppercase',letterSpacing:.5 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex',gap:8,marginBottom:16,flexWrap:'wrap' }}>
        {['All','Confirmed','Picked Up','Recycled'].map(f => (
          <button key={f} onClick={()=>setFilter(f)}
            style={{ padding:'6px 14px',borderRadius:20,border:`1px solid ${filter===f?'var(--grn)':'var(--brd)'}`,
              background:filter===f?'rgba(16,217,126,.1)':'rgba(13,27,42,.5)',
              color:filter===f?'var(--grn)':'var(--t3)',fontSize:12,fontWeight:600,cursor:'pointer' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {shown.length === 0 ? (
        <div style={{ textAlign:'center',padding:'50px 0',color:'var(--t3)' }}>
          <div style={{ fontSize:36,marginBottom:12 }}>📭</div>
          <div>No {filter === 'All' ? '' : filter + ' '}pickups assigned yet</div>
        </div>
      ) : (
        shown.map(b => (
          <BookingCard
            key={b._id}
            booking={b}
            onTrack={()=>setTrackBook(b)}
            onCert={()=>makeCert(b)}
            isRecycler
          />
        ))
      )}
    </div>
  );
}
