// src/pages/AdminDashboard.jsx
// Charts use react-chartjs-2 (already in package.json) — no raw canvas lifecycle issues
import { useState, useEffect, useCallback } from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, LineElement,
         CategoryScale, LinearScale, Tooltip, Legend, PointElement, Filler } from 'chart.js';
import { getAdminAll, getRecyclers, addRecycler, deleteRecycler, deleteBooking } from '../services/api';
import BookingCard   from '../components/BookingCard';
import EmailModal    from '../components/modals/EmailModal';
import PaymentModal  from '../components/modals/PaymentModal';
import TrackingModal from '../components/modals/TrackingModal';
import Loader        from '../components/Loader';
import { makeCert }  from '../services/certificate';

ChartJS.register(ArcElement, BarElement, LineElement, CategoryScale,
                 LinearScale, Tooltip, Legend, PointElement, Filler);

// ── Shared chart defaults ─────────────────────────────────────────────────
const CHART_OPTS_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 500 },
  plugins: { legend: { display: false } },
};

const tickStyle = { color: '#5a7898', font: { size: 9 } };
const gridColor = 'rgba(30,58,95,.25)';

// ── Chart wrappers ────────────────────────────────────────────────────────
function ChartBox({ title, height = 200, children }) {
  return (
    <div style={{ background:'rgba(13,27,42,.7)',border:'1px solid var(--brd)',borderRadius:16,padding:'16px 14px' }}>
      <div style={{ fontWeight:700,fontSize:11,color:'var(--t2)',marginBottom:12,
        textTransform:'uppercase',letterSpacing:.5 }}>{title}</div>
      <div style={{ position:'relative', height }}>
        {children}
      </div>
    </div>
  );
}

function DonutChart({ labels, data, colors }) {
  return (
    <Doughnut
      data={{
        labels,
        datasets: [{ data, backgroundColor: colors, borderColor: '#0d1b2a', borderWidth: 2, hoverOffset: 4 }],
      }}
      options={{
        ...CHART_OPTS_BASE,
        cutout: '62%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: '#8ba3c7', font: { size: 9 }, padding: 8, boxWidth: 10 },
          },
        },
      }}
    />
  );
}

function BarChart({ labels, data, color = '#10d97e', horizontal = false }) {
  return (
    <Bar
      data={{
        labels,
        datasets: [{
          data,
          backgroundColor: Array.isArray(color) ? color : color,
          borderRadius: 4,
          borderSkipped: false,
        }],
      }}
      options={{
        ...CHART_OPTS_BASE,
        indexAxis: horizontal ? 'y' : 'x',
        scales: {
          x: { ticks: tickStyle, grid: { color: horizontal ? gridColor : 'transparent' } },
          y: { ticks: tickStyle, grid: { color: horizontal ? 'transparent' : gridColor }, beginAtZero: true },
        },
      }}
    />
  );
}

function LineChart({ labels, data }) {
  return (
    <Line
      data={{
        labels,
        datasets: [{
          label: 'Bookings', data,
          borderColor: '#10d97e', backgroundColor: 'rgba(16,217,126,.12)',
          tension: .4, fill: true, pointBackgroundColor: '#10d97e', pointRadius: 3, pointHoverRadius: 5,
        }],
      }}
      options={{
        ...CHART_OPTS_BASE,
        scales: {
          x: { ticks: { ...tickStyle, maxRotation: 45 }, grid: { color: gridColor } },
          y: { ticks: tickStyle, beginAtZero: true, grid: { color: gridColor } },
        },
      }}
    />
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────
const KPI = ({ icon, val, lbl, color = 'var(--grn)' }) => (
  <div style={{ background:'rgba(13,27,42,.7)',border:'1px solid var(--brd)',borderRadius:14,
    padding:'14px 12px',minWidth:0,display:'flex',flexDirection:'column',gap:4 }}>
    <div style={{ fontSize:18 }}>{icon}</div>
    <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:20,fontWeight:900,color,
      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{val}</div>
    <div style={{ color:'var(--t3)',fontSize:10,textTransform:'uppercase',letterSpacing:.4,lineHeight:1.3 }}>{lbl}</div>
  </div>
);

const CITIES = ['Delhi','Mumbai','Bangalore','Pune','Hyderabad','Chennai','Meerut','Noida','Gurgaon','Lucknow'];

export default function AdminDashboard({ toast }) {
  const [tab,        setTab]        = useState('overview');
  const [bookings,   setBookings]   = useState([]);
  const [stats,      setStats]      = useState(null);
  const [recyclers,  setRecyclers]  = useState([]);
  const [users,      setUsers]      = useState([]);
  const [bFilter,    setBFilter]    = useState('All');
  const [loading,    setLoading]    = useState(true);
  const [errors,     setErrors]     = useState({});
  const [modal,      setModal]      = useState({ type: null, booking: null });
  const [newRec,     setNewRec]     = useState({ name:'', city:'', email:'', phone:'' });
  const [showAddRec, setShowAddRec] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [saving,     setSaving]     = useState(false);

  const showToast = useCallback((msg, type = 'ok') => {
    if (typeof toast === 'function') toast(msg, type);
  }, [toast]);

  const load = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const [adminRes, recRes] = await Promise.allSettled([
      getAdminAll(),
      getRecyclers(),
    ]);
    const errs = {};
    if (adminRes.status === 'fulfilled') {
      const d = adminRes.value?.data || {};
      setBookings(d.bookings || []);
      setStats(d.stats   || null);
      setUsers(d.users   || []);
      if (d.errors?.stats)    errs.stats    = d.errors.stats;
      if (d.errors?.bookings) errs.bookings = d.errors.bookings;
      if (d.errors?.users)    errs.users    = d.errors.users;
    } else {
      const status = adminRes.reason?.response?.status;
      const msg    = adminRes.reason?.response?.data?.error || adminRes.reason?.message || 'Unknown error';
      errs.auth = status === 401 || status === 403
        ? `Admin access denied (${status}). Make sure ADMIN_EMAIL in server/.env matches your login email.`
        : msg;
      showToast('⚠️ Admin data load failed: ' + msg, 'err');
    }
    if (recRes.status === 'fulfilled') setRecyclers(recRes.value?.data || []);
    else errs.recyclers = recRes.reason?.response?.data?.error || recRes.reason?.message;
    if (Object.keys(errs).length) setErrors(errs);
    setLoading(false);
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleAddRecycler = async () => {
    if (!newRec.name.trim() || !newRec.city || !newRec.email.trim()) {
      showToast('Name, city and email are required', 'err'); return;
    }
    setSaving(true);
    try {
      await addRecycler(newRec);
      showToast('✅ Recycler registered: ' + newRec.email);
      setShowAddRec(false);
      setNewRec({ name:'', city:'', email:'', phone:'' });
      load();
    } catch (e) { showToast(e.response?.data?.error || e.message, 'err'); }
    setSaving(false);
  };

  const handleDelRecycler = async (id) => {
    if (!confirm('Remove this recycler?')) return;
    try { await deleteRecycler(id); showToast('Recycler removed'); load(); }
    catch (e) { showToast(e.message, 'err'); }
  };

  const handleDelBooking = async (id) => {
    if (!confirm('Delete this booking permanently?')) return;
    try { await deleteBooking(id); showToast('Booking deleted'); load(); }
    catch (e) { showToast(e.response?.data?.error || e.message, 'err'); }
  };

  if (loading) return (
    <div style={{ paddingTop:24 }}>
      {/* Skeleton — KPI cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:20 }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="skel-stat">
            <div className="skeleton" style={{ height:28,width:'45%',borderRadius:6,marginBottom:8 }} />
            <div className="skeleton skel-stat-val" />
            <div className="skeleton skel-stat-lbl" />
          </div>
        ))}
      </div>
      {/* Skeleton — chart placeholder */}
      <div className="skeleton" style={{ height:180,borderRadius:14,marginBottom:20 }} />
      {/* Skeleton — table rows */}
      {[1,2,3,4].map(i => (
        <div key={i} className="skel-card" style={{ marginBottom:8 }}>
          <div className="skel-row">
            <div className="skel-lines">
              <div className="skeleton skel-line w80" />
              <div className="skeleton skel-line w60" />
            </div>
            <div className="skeleton skel-line" style={{ width:80,height:28,borderRadius:8 }} />
          </div>
        </div>
      ))}
    </div>
  );

  if (errors.auth) {
    return (
      <div style={{ paddingTop:30 }}>
        <h2 className="ptitle">⚙️ Admin Dashboard</h2>
        <div style={{ background:'rgba(240,64,96,.08)',border:'1px solid rgba(240,64,96,.3)',
          borderRadius:16,padding:'20px 18px',lineHeight:1.8 }}>
          <div style={{ fontWeight:700,fontSize:16,color:'var(--red)',marginBottom:8 }}>🔒 Admin Access Error</div>
          <div style={{ color:'var(--t2)',fontSize:13,marginBottom:12 }}>{errors.auth}</div>
          <div style={{ color:'var(--t3)',fontSize:12,marginBottom:16 }}>
            <strong>To fix:</strong><br/>
            1. Open <code>server/.env</code><br/>
            2. Set <code>ADMIN_EMAIL=your-google-email@gmail.com</code><br/>
            3. Set the real <code>FIREBASE_PRIVATE_KEY</code> from Firebase Console<br/>
            4. Restart the server
          </div>
          <button className="bp" onClick={load} style={{ padding:'9px 20px',fontSize:13 }}>↻ Retry</button>
        </div>
      </div>
    );
  }

  const shownB = bFilter === 'All' ? bookings : bookings.filter(b => b.status === bFilter);
  const filteredUsers = userSearch
    ? users.filter(u =>
        (u.name||'').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email||'').toLowerCase().includes(userSearch.toLowerCase()))
    : users;

  return (
    <div style={{ paddingTop:20 }}>
      {modal.type==='email' && <EmailModal booking={modal.booking} onClose={()=>setModal({type:null})} />}
      {modal.type==='pay'   && <PaymentModal booking={modal.booking} onClose={()=>setModal({type:null})} onRefresh={load} toast={showToast} />}
      {modal.type==='track' && <TrackingModal booking={modal.booking} onClose={()=>setModal({type:null})} />}

      {showAddRec && (
        <div className="overlay">
          <div className="modal">
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:18,marginBottom:4 }}>🏭 Register Recycler</div>
            <p style={{ color:'var(--t3)',fontSize:12,marginBottom:14,lineHeight:1.6 }}>
              Their Gmail is their login. They sign in via Login page, select "Recycler" role.
            </p>
            <label className="lbl">Company / Name <span style={{color:'var(--red)'}}>*</span></label>
            <input placeholder="e.g. GreenTech Recyclers Delhi" value={newRec.name}
              onChange={e=>setNewRec(r=>({...r,name:e.target.value}))} />
            <label className="lbl mt">City <span style={{color:'var(--red)'}}>*</span></label>
            <select value={newRec.city} onChange={e=>setNewRec(r=>({...r,city:e.target.value}))}>
              <option value="">Select city</option>
              {CITIES.map(c=><option key={c}>{c}</option>)}
            </select>
            <label className="lbl mt">Gmail Address <span style={{color:'var(--red)'}}>*</span></label>
            <input type="email" placeholder="recycler@gmail.com" value={newRec.email}
              onChange={e=>setNewRec(r=>({...r,email:e.target.value}))} />
            <label className="lbl mt">Phone (optional)</label>
            <input type="tel" placeholder="10-digit mobile" maxLength={10} value={newRec.phone}
              onChange={e=>setNewRec(r=>({...r,phone:e.target.value.replace(/\D/g,'').slice(0,10)}))} />
            <div className="ibox" style={{marginTop:12}}>ℹ️ After registering, recycler logs in with this Gmail and selects Recycler role.</div>
            <div className="btnrow">
              <button className="bs bfull" onClick={()=>setShowAddRec(false)}>Cancel</button>
              <button className="bp bfull" onClick={handleAddRecycler} disabled={saving}>{saving?'Registering…':'✅ Register'}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,marginBottom:18 }}>
        <h2 className="ptitle" style={{marginBottom:0}}>⚙️ Admin Dashboard</h2>
        <button className="bs" style={{padding:'8px 16px',fontSize:12}} onClick={load}>↻ Refresh</button>
      </div>

      <div style={{ overflowX:'auto',paddingBottom:4,marginBottom:18,scrollbarWidth:'none' }}>
        <div style={{ display:'flex',gap:7,minWidth:'max-content' }}>
          {[['overview','📊 Overview'],['bookings','📦 Bookings'],['recyclers','🏭 Recyclers'],
            ['users','👥 Users'],['payments','💸 Payments']].map(([key,label])=>(
            <button key={key} className={`tabbt ${tab===key?'on':''}`} onClick={()=>setTab(key)}>{label}</button>
          ))}
        </div>
      </div>

      {/* ══════════ OVERVIEW ══════════ */}
      {tab==='overview' && (
        <>
          {errors.stats && (
            <div style={{ background:'rgba(240,64,96,.08)',border:'1px solid rgba(240,64,96,.25)',
              borderRadius:12,padding:'12px 16px',color:'var(--red)',fontSize:13,marginBottom:16 }}>
              ⚠️ Stats failed: {errors.stats}
            </div>
          )}

          {stats ? (
            <>
              {/* KPI Grid */}
              <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20 }}>
                <KPI icon="📦" val={stats.total||0}               lbl="Total Bookings"  color="var(--grn)"  />
                <KPI icon="💰" val={'₹'+(stats.totalReward||0)}   lbl="Total Rewards"   color="var(--ylw)"  />
                <KPI icon="♻️" val={stats.recycled||0}            lbl="Recycled"        color="#34d399"     />
                <KPI icon="⏳" val={(stats.pending||0)+(stats.confirmed||0)} lbl="Active" color="var(--pur2)"/>
                <KPI icon="💸" val={stats.paid||0}                lbl="Paid Rewards"    color="#93c5fd"     />
                <KPI icon="❌" val={stats.cancelled||0}           lbl="Cancelled"       color="var(--red)"  />
              </div>

              {/* Charts Grid — react-chartjs-2 handles all canvas lifecycle */}
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14,marginBottom:24 }}>

                <ChartBox title="📊 Bookings by Status" height={260}>
                  {stats.total > 0 ? (
                    <DonutChart
                      labels={['Pending','Confirmed','Picked Up','Recycled','Cancelled']}
                      data={[stats.pending||0,stats.confirmed||0,stats.pickedUp||0,stats.recycled||0,stats.cancelled||0]}
                      colors={['#f5b731','#7c6fef','#3b82f6','#34d399','#f04060']}
                    />
                  ) : (
                    <div style={{ height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t4)',fontSize:13 }}>No bookings yet</div>
                  )}
                </ChartBox>

                <ChartBox title="📈 Daily Bookings (14 days)" height={180}>
                  {stats.dailyData?.some(d=>d.count>0) ? (
                    <LineChart
                      labels={stats.dailyData.map(d=>d._id.slice(5))}
                      data={stats.dailyData.map(d=>d.count)}
                    />
                  ) : (
                    <div style={{ height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t4)',fontSize:13 }}>No bookings in last 14 days</div>
                  )}
                </ChartBox>

                <ChartBox title="🏙️ Top Cities" height={180}>
                  {stats.cityData?.length > 0 ? (
                    <BarChart
                      labels={stats.cityData.map(c=>c._id||'Unknown')}
                      data={stats.cityData.map(c=>c.count)}
                      color={['#10d97e','#7c6fef','#f5b731','#3b82f6','#f04060','#a5b4fc']}
                    />
                  ) : (
                    <div style={{ height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t4)',fontSize:13 }}>No city data yet</div>
                  )}
                </ChartBox>

                <ChartBox title="📱 Device Types" height={180}>
                  {stats.deviceData?.length > 0 ? (
                    <BarChart
                      labels={stats.deviceData.map(d=>(d._id||'Other').split(' ').slice(-1)[0])}
                      data={stats.deviceData.map(d=>d.count)}
                      color="rgba(124,111,239,.75)"
                      horizontal
                    />
                  ) : (
                    <div style={{ height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t4)',fontSize:13 }}>No device data yet</div>
                  )}
                </ChartBox>
              </div>
            </>
          ) : !errors.stats ? (
            <div className="empty" style={{marginBottom:24}}>No stats available yet.</div>
          ) : null}

          <div className="sec-lbl"><h3>Recent Bookings</h3></div>
          {errors.bookings ? (
            <div className="empty">Could not load bookings: {errors.bookings}</div>
          ) : bookings.length===0 ? (
            <div className="empty">No bookings yet.</div>
          ) : bookings.slice(0,5).map(b=>(
            <BookingCard key={b._id} booking={b} role="admin" toast={showToast} onRefresh={load}
              onEmailClick={bk=>setModal({type:'email',booking:bk})}
              onPayClick={bk=>setModal({type:'pay',booking:bk})}
              onTrackClick={bk=>setModal({type:'track',booking:bk})}
              onCertClick={bk=>{makeCert(bk);showToast('📄 Downloaded!');}}
              onDeleteClick={handleDelBooking}
            />
          ))}
        </>
      )}

      {/* ══════════ BOOKINGS ══════════ */}
      {tab==='bookings' && (
        <>
          <div style={{ overflowX:'auto',paddingBottom:4,marginBottom:12,scrollbarWidth:'none' }}>
            <div style={{ display:'flex',gap:7,minWidth:'max-content' }}>
              {['All','Pending','Confirmed','Picked Up','Recycled','Cancelled'].map(f=>(
                <button key={f} className={`fbtn ${bFilter===f?'on':''}`} onClick={()=>setBFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
          <div style={{ color:'var(--t4)',fontSize:12,marginBottom:10 }}>
            {shownB.length} booking{shownB.length!==1?'s':''}{bFilter!=='All'?` · ${bFilter}`:''}
          </div>
          {errors.bookings
            ? <div className="empty">Could not load: {errors.bookings}</div>
            : shownB.length===0
              ? <div className="empty">No {bFilter!=='All'?bFilter+' ':''}bookings.</div>
              : shownB.map(b=>(
                  <BookingCard key={b._id} booking={b} role="admin" toast={showToast} onRefresh={load}
                    onEmailClick={bk=>setModal({type:'email',booking:bk})}
                    onPayClick={bk=>setModal({type:'pay',booking:bk})}
                    onTrackClick={bk=>setModal({type:'track',booking:bk})}
                    onCertClick={bk=>{makeCert(bk);showToast('📄 Downloaded!');}}
                    onDeleteClick={handleDelBooking}
                  />
                ))
          }
        </>
      )}

      {/* ══════════ RECYCLERS ══════════ */}
      {tab==='recyclers' && (
        <>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10,marginBottom:16 }}>
            <div style={{ color:'var(--t3)',fontSize:13 }}>{recyclers.length} registered</div>
            <button className="bp" style={{padding:'9px 18px',fontSize:13}} onClick={()=>setShowAddRec(true)}>+ Register Recycler</button>
          </div>
          {errors.recyclers && <div className="empty" style={{marginBottom:12}}>Error: {errors.recyclers}</div>}
          {recyclers.length===0 ? (
            <div className="empty">No recyclers yet. Register one to start assigning pickups.</div>
          ) : recyclers.map(r=>(
            <div key={r._id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'12px 14px',background:'rgba(10,22,40,.5)',border:'1px solid var(--brd)',
              borderRadius:12,marginBottom:8,flexWrap:'wrap',gap:8 }}>
              <div style={{ display:'flex',alignItems:'center',gap:10,minWidth:0 }}>
                <div style={{ width:38,height:38,borderRadius:10,background:'rgba(59,130,246,.15)',
                  border:'1px solid rgba(59,130,246,.3)',display:'flex',alignItems:'center',
                  justifyContent:'center',fontSize:18,flexShrink:0 }}>🏭</div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:700,fontSize:14 }}>{r.name}</div>
                  <div style={{ color:'var(--t3)',fontSize:11,marginTop:1 }}>📍 {r.city} · 📧 {r.email}</div>
                  {r.phone && <div style={{ color:'var(--t3)',fontSize:11 }}>📱 {r.phone}</div>}
                </div>
              </div>
              <div style={{ display:'flex',gap:8,alignItems:'center',flexShrink:0 }}>
                <span className="rbadge recycler">Active</span>
                <span style={{ color:'var(--t4)',fontSize:11 }}>{bookings.filter(b=>b.recycler===r.name).length} pickups</span>
                <button className="actbtn r" onClick={()=>handleDelRecycler(r._id)}>Remove</button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ══════════ USERS ══════════ */}
      {tab==='users' && (
        <>
          <input placeholder="🔍 Search by name or email…" value={userSearch}
            onChange={e=>setUserSearch(e.target.value)} style={{marginBottom:12}} />
          <div style={{ color:'var(--t4)',fontSize:12,marginBottom:10 }}>
            {filteredUsers.length} of {users.length} users
          </div>
          {errors.users && <div className="empty" style={{marginBottom:12}}>Error: {errors.users}</div>}
          {filteredUsers.length===0 ? (
            <div className="empty">No users found.</div>
          ) : filteredUsers.map(u=>{
            const uBookings = bookings.filter(b=>b.uid===u.uid);
            const uRecycled = uBookings.filter(b=>b.status==='Recycled').length;
            return (
              <div key={u._id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',
                padding:'11px 14px',background:'rgba(10,22,40,.5)',border:'1px solid var(--brd)',
                borderRadius:11,marginBottom:8,flexWrap:'wrap',gap:8 }}>
                <div style={{ display:'flex',alignItems:'center',gap:10,minWidth:0,flex:1 }}>
                  {u.photo
                    ? <img src={u.photo} alt="" style={{ width:32,height:32,borderRadius:'50%',objectFit:'cover',flexShrink:0 }} />
                    : <div style={{ width:32,height:32,borderRadius:'50%',background:'rgba(16,217,126,.15)',
                        display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0 }}>👤</div>
                  }
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:600,fontSize:13,color:'var(--txt)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{u.name||'—'}</div>
                    <div style={{ color:'var(--t3)',fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{u.email}</div>
                  </div>
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
                  <span className={`rbadge ${u.role||'user'}`}>{u.role||'user'}</span>
                  <span style={{ color:'var(--grn)',fontWeight:700,fontSize:12 }}>{uBookings.length} 📦</span>
                  <span style={{ color:'#34d399',fontWeight:700,fontSize:12 }}>{uRecycled} ♻️</span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ══════════ PAYMENTS ══════════ */}
      {tab==='payments' && (()=>{
        const payable    = bookings.filter(b=>b.status==='Recycled');
        const paid       = payable.filter(b=>b.paymentStatus==='Paid');
        const unpaid     = payable.filter(b=>b.paymentStatus!=='Paid');
        const pendingAmt = unpaid.reduce((a,b)=>a+(b.reward||0),0);
        return (
          <>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:20 }}>
              {[['💸',unpaid.length,'To Pay','var(--ylw)'],
                ['✅',paid.length,'Paid','var(--grn)'],
                ['💰','₹'+pendingAmt,'Pending Amount','#93c5fd'],
                ['📦',payable.length,'Total Recycled','var(--t2)']].map(([ic,v,l,c])=>(
                <div key={l} style={{ background:'rgba(13,27,42,.7)',border:'1px solid var(--brd)',borderRadius:14,
                  padding:'14px 12px',display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
                  <span style={{fontSize:18}}>{ic}</span>
                  <span style={{ color:c,fontWeight:900,fontSize:18,fontFamily:"'DM Sans',sans-serif" }}>{v}</span>
                  <span style={{ color:'var(--t4)',fontSize:10,textTransform:'uppercase',letterSpacing:.4,textAlign:'center' }}>{l}</span>
                </div>
              ))}
            </div>
            {unpaid.length>0 && (<>
              <div style={{ color:'var(--t3)',fontSize:11,fontWeight:700,textTransform:'uppercase',
                letterSpacing:.6,marginBottom:10,paddingBottom:6,borderBottom:'1px solid var(--brd)' }}>
                Unpaid Rewards ({unpaid.length})
              </div>
              {unpaid.map(b=>(
                <BookingCard key={b._id} booking={b} role="admin" toast={showToast} onRefresh={load}
                  onPayClick={bk=>setModal({type:'pay',booking:bk})}
                  onTrackClick={bk=>setModal({type:'track',booking:bk})}
                  onEmailClick={bk=>setModal({type:'email',booking:bk})}
                  onDeleteClick={handleDelBooking}
                />
              ))}
            </>)}
            {paid.length>0 && (<>
              <div style={{ color:'var(--t3)',fontSize:11,fontWeight:700,textTransform:'uppercase',
                letterSpacing:.6,margin:'18px 0 10px',paddingBottom:6,borderBottom:'1px solid var(--brd)' }}>
                Paid Rewards ({paid.length})
              </div>
              {paid.map(b=>(
                <BookingCard key={b._id} booking={b} role="admin" toast={showToast} onRefresh={load}
                  onTrackClick={bk=>setModal({type:'track',booking:bk})}
                  onCertClick={bk=>{makeCert(bk);showToast('📄 Downloaded!');}}
                />
              ))}
            </>)}
            {payable.length===0 && <div className="empty">No recycled bookings yet.</div>}
          </>
        );
      })()}
    </div>
  );
}
