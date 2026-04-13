// src/pages/Dashboard.jsx — with EcoWallet, withdrawal, transaction history
import { useState, useEffect } from 'react';
import { getMyBookings, deleteBooking, requestWithdrawal } from '../services/api';
import BookingCard   from '../components/BookingCard';
import TrackingModal from '../components/modals/TrackingModal';
import Loader        from '../components/Loader';
import { makeCert }  from '../services/certificate';
import { useAuth }   from '../context/AuthContext';

const STATUS_FILTERS = ['All','Confirmed','Picked Up','Recycled','Cancelled'];

// ── Withdrawal Modal ──────────────────────────────────────────────────────
function WithdrawModal({ bookings, onClose, toast }) {
  const eligible = bookings.filter(b => b.status === 'Recycled' && b.paymentStatus !== 'Paid');
  const maxAmount = eligible.reduce((a, b) => a + (b.reward || 0), 0);
  const [upi,    setUpi]    = useState(eligible[0]?.upi || '');
  const [amount, setAmount] = useState(maxAmount);
  const [loading,setLoading]= useState(false);
  const [done,   setDone]   = useState('');

  const submit = async () => {
    if (!upi.trim()) { toast('Enter your UPI ID', 'err'); return; }
    if (amount < 1 || amount > maxAmount) { toast(`Amount must be ₹1–₹${maxAmount}`, 'err'); return; }
    setLoading(true);
    try {
      const { data } = await requestWithdrawal({
        upi:        upi.trim(),
        amount,
        bookingIds: eligible.map(b => b._id),
      });
      setDone(data.message);
      toast('✅ Withdrawal request submitted!');
    } catch (e) {
      toast('Failed: ' + (e.response?.data?.error || e.message), 'err');
    }
    setLoading(false);
  };

  return (
    <div className="overlay">
      <div className="modal">
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:18,marginBottom:4 }}>💸 Withdraw Earnings</div>
        <div style={{ color:'var(--t3)',fontSize:12,marginBottom:16 }}>Transfer your EcoWallet balance to UPI</div>

        {done ? (
          <div>
            <div style={{ textAlign:'center',padding:'24px 0' }}>
              <div style={{ fontSize:48,marginBottom:12 }}>✅</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:16,color:'var(--grn)',marginBottom:8 }}>Request Submitted!</div>
              <div style={{ color:'var(--t3)',fontSize:13,lineHeight:1.6 }}>{done}</div>
            </div>
            <button className="bp bfull" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            {/* Available balance */}
            <div style={{ background:'rgba(16,217,126,.07)',border:'1px solid rgba(16,217,126,.2)',borderRadius:14,padding:'16px',marginBottom:16,textAlign:'center' }}>
              <div style={{ color:'var(--t3)',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:4 }}>Available to withdraw</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:34,fontWeight:900,color:'var(--grn)' }}>₹{maxAmount}</div>
              <div style={{ color:'var(--t3)',fontSize:11,marginTop:2 }}>{eligible.length} recycled booking{eligible.length !== 1 ? 's' : ''}</div>
            </div>

            {eligible.length === 0 ? (
              <div className="empty">No pending earnings yet.<br/>Complete a recycling to earn rewards.</div>
            ) : (
              <>
                <label className="lbl">UPI ID</label>
                <input value={upi} onChange={e=>setUpi(e.target.value)} placeholder="yourname@upi / phone@paytm" />

                <label className="lbl mt">Amount (₹)</label>
                <input type="number" value={amount} min={1} max={maxAmount}
                  onChange={e=>setAmount(Math.min(Number(e.target.value), maxAmount))} />
                <div style={{ fontSize:11,color:'var(--t3)',marginTop:4 }}>Max: ₹{maxAmount}</div>

                {/* Breakdown */}
                <div className="sumbox" style={{ marginTop:14 }}>
                  {eligible.slice(0,4).map(b => (
                    <div key={b._id} className="sumrow">
                      <span className="sk">📦 {b.device} · #{b._id.slice(-6)}</span>
                      <span className="sv2" style={{ color:'var(--grn)' }}>₹{b.reward}</span>
                    </div>
                  ))}
                  {eligible.length > 4 && (
                    <div className="sumrow">
                      <span className="sk">+{eligible.length - 4} more</span>
                      <span className="sv2" style={{ color:'var(--grn)' }}>₹{eligible.slice(4).reduce((a,b)=>a+(b.reward||0),0)}</span>
                    </div>
                  )}
                </div>

                <div style={{ background:'rgba(59,130,246,.06)',border:'1px solid rgba(59,130,246,.2)',borderRadius:10,padding:'10px 13px',color:'var(--t3)',fontSize:12,margin:'12px 0',lineHeight:1.6 }}>
                  ℹ️ Admin will process your transfer within 2–3 working days. You'll receive an email confirmation.
                </div>

                <div className="btnrow">
                  <button className="bs bfull" onClick={onClose} disabled={loading}>Cancel</button>
                  <button className="bp bfull" onClick={submit} disabled={loading || eligible.length === 0}>
                    {loading ? '⏳ Submitting…' : '💸 Request Withdrawal'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Transaction history row ───────────────────────────────────────────────
function TxRow({ booking }) {
  const statusColor = {
    'Recycled':  'var(--grn)',
    'Picked Up': 'var(--ylw)',
    'Confirmed': 'var(--pur2)',
    'Cancelled': 'var(--red)',
  }[booking.status] || 'var(--t3)';

  const isPaid = booking.paymentStatus === 'Paid';
  return (
    <div style={{ display:'flex',alignItems:'center',gap:12,padding:'11px 0',borderBottom:'1px solid rgba(30,58,95,.25)' }}>
      <div style={{ width:36,height:36,borderRadius:10,background:`rgba(16,217,126,.1)`,border:'1px solid rgba(16,217,126,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>
        {booking.status==='Recycled'?'♻️':booking.status==='Picked Up'?'🚐':booking.status==='Confirmed'?'✅':'📦'}
      </div>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:13,fontWeight:700,color:'var(--txt)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{booking.device}</div>
        <div style={{ fontSize:11,color:'var(--t3)',marginTop:1 }}>
          {new Date(booking.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}
          &nbsp;·&nbsp;
          <span style={{ color: statusColor }}>{booking.status}</span>
        </div>
      </div>
      <div style={{ textAlign:'right',flexShrink:0 }}>
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:14,color: isPaid ? 'var(--grn)' : booking.status==='Recycled' ? 'var(--ylw)' : 'var(--t3)' }}>
          {booking.status==='Cancelled' ? '—' : `₹${booking.reward}`}
        </div>
        <div style={{ fontSize:10,color:'var(--t4)',marginTop:1 }}>
          {isPaid ? '✅ Paid' : booking.status==='Recycled' ? '⏳ Pending' : ''}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────
export default function Dashboard({ toast }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter,   setFilter]   = useState('All');
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('bookings'); // bookings | wallet
  const [modal,    setModal]    = useState({ type:null, booking:null });

  const load = async () => {
    try {
      const { data } = await getMyBookings();
      setBookings(data || []);
    } catch (e) { toast('Failed to load: ' + (e.response?.data?.error || e.message), 'err'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Wallet calculations
  const totalEarned   = bookings.filter(b => b.status === 'Recycled').reduce((a,b) => a+(b.reward||0), 0);
  const totalPaid     = bookings.filter(b => b.paymentStatus === 'Paid').reduce((a,b) => a+(b.reward||0), 0);
  const pendingPayout = totalEarned - totalPaid;
  const activeCount   = bookings.filter(b => ['Confirmed','Picked Up'].includes(b.status)).length;

  const shown = filter === 'All' ? bookings : bookings.filter(b => b.status === filter);

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel and remove this booking?')) return;
    try {
      await deleteBooking(id);
      toast('Booking removed');
      load();
    } catch(e) { toast('Failed: ' + (e.response?.data?.error || e.message), 'err'); }
  };

  if (loading) return (
    <div style={{ paddingTop:24 }}>
      {/* Skeleton — stat cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10,marginBottom:20 }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="skel-stat">
            <div className="skeleton skel-stat-val" />
            <div className="skeleton skel-stat-lbl" />
          </div>
        ))}
      </div>
      {/* Skeleton — filter row */}
      <div style={{ display:'flex',gap:8,marginBottom:16 }}>
        {[80,70,90,65].map((w,i) => (
          <div key={i} className="skeleton" style={{ height:32,width:w,borderRadius:20 }} />
        ))}
      </div>
      {/* Skeleton — booking cards */}
      {[1,2,3].map(i => (
        <div key={i} className="skel-card" style={{ marginBottom:10 }}>
          <div className="skel-row">
            <div className="skeleton skel-thumb" />
            <div className="skel-lines">
              <div className="skeleton skel-line w80" />
              <div className="skeleton skel-line w60" />
              <div className="skeleton skel-line w40" />
            </div>
            <div className="skeleton skel-line tall" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ paddingTop:24 }}>
      {modal.type==='track'    && <TrackingModal booking={modal.booking} onClose={()=>setModal({type:null})} />}
      {modal.type==='withdraw' && <WithdrawModal bookings={bookings} onClose={()=>{ setModal({type:null}); load(); }} toast={toast} />}

      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18,flexWrap:'wrap',gap:10 }}>
        <div>
          <h2 className="ptitle" style={{ marginBottom:2 }}>
            {user?.photo && <img src={user.photo} alt="" style={{ width:28,height:28,borderRadius:'50%',verticalAlign:'middle',marginRight:8 }} />}
            {(user?.name || 'My').split(' ')[0]}'s Dashboard
          </h2>
          <div style={{ color:'var(--t3)',fontSize:12 }}>{user?.email}</div>
        </div>
        {activeCount > 0 && (
          <div style={{ background:'rgba(124,111,239,.1)',border:'1px solid rgba(124,111,239,.3)',borderRadius:20,padding:'6px 14px',fontSize:12,color:'var(--pur2)',fontWeight:700 }}>
            ⏳ {activeCount} active pickup{activeCount>1?'s':''}
          </div>
        )}
      </div>

      {/* Wallet summary cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20 }}>
        {[
          { icon:'♻️', val:`₹${totalEarned}`,   label:'Total Earned',  color:'var(--grn)' },
          { icon:'💸', val:`₹${pendingPayout}`, label:'Pending Payout',color: pendingPayout>0?'var(--ylw)':'var(--t3)' },
          { icon:'✅', val:`₹${totalPaid}`,      label:'Total Paid',    color:'var(--pur2)' },
        ].map(c => (
          <div key={c.label} style={{ background:'rgba(13,27,42,.8)',border:'1px solid var(--brd)',borderRadius:14,padding:'12px 10px',textAlign:'center' }}>
            <div style={{ fontSize:20 }}>{c.icon}</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:900,fontSize:18,color:c.color,margin:'4px 0 2px' }}>{c.val}</div>
            <div style={{ color:'var(--t4)',fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Withdraw CTA */}
      {pendingPayout > 0 && (
        <div style={{ background:'linear-gradient(135deg,rgba(16,217,126,.08),rgba(5,150,105,.05))',border:'1px solid rgba(16,217,126,.25)',borderRadius:16,padding:'14px 16px',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
          <div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:15,color:'var(--grn)' }}>₹{pendingPayout} ready to withdraw!</div>
            <div style={{ color:'var(--t3)',fontSize:12,marginTop:2 }}>Transfer to your UPI in 2–3 working days</div>
          </div>
          <button className="bp" style={{ padding:'10px 18px',fontSize:13,flexShrink:0 }}
            onClick={() => setModal({ type:'withdraw' })}>
            💸 Withdraw Now
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom:16 }}>
        {[['bookings','📦 Bookings'],['wallet','💰 Wallet & History']].map(([k,l]) => (
          <button key={k} className={`tabbt ${tab===k?'on':''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {/* Bookings tab */}
      {tab === 'bookings' && (
        <>
          <div className="filters">
            {STATUS_FILTERS.map(f => (
              <button key={f} className={`fbtn ${filter===f?'on':''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>

          {shown.length === 0 ? (
            <div className="empty">
              {filter==='All' ? '📦 No bookings yet — book your first free pickup!' : `No ${filter} bookings.`}
            </div>
          ) : shown.map(b => (
            <BookingCard key={b._id} booking={b} role="user"
              onRefresh={load}
              onTrackClick={bk => setModal({ type:'track', booking:bk })}
              onCertClick={bk => { makeCert(bk); toast('📄 Certificate downloaded!'); }}
              onDeleteClick={['Pending','Confirmed'].includes(b.status) ? handleDelete : undefined}
            />
          ))}
        </>
      )}

      {/* Wallet tab */}
      {tab === 'wallet' && (
        <div>
          {/* UPI info */}
          {bookings[0]?.upi && (
            <div style={{ background:'rgba(13,27,42,.7)',border:'1px solid var(--brd)',borderRadius:14,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:11,color:'var(--t3)',fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:4 }}>Linked UPI</div>
                <div style={{ fontFamily:'monospace',fontSize:14,fontWeight:700,color:'var(--grn)' }}>{bookings[0].upi}</div>
              </div>
              <div style={{ fontSize:11,color:'var(--t3)' }}>Update UPI when booking</div>
            </div>
          )}

          {/* Transaction history */}
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:14,color:'var(--txt)',marginBottom:12 }}>
            📋 Transaction History
          </div>

          {bookings.length === 0 ? (
            <div className="empty">No transactions yet.</div>
          ) : (
            <div style={{ background:'rgba(13,27,42,.7)',border:'1px solid var(--brd)',borderRadius:14,padding:'0 14px' }}>
              {bookings.map(b => <TxRow key={b._id} booking={b} />)}
            </div>
          )}

          {/* Withdraw button at bottom */}
          {pendingPayout > 0 && (
            <button className="bp bfull" style={{ marginTop:16 }}
              onClick={() => setModal({ type:'withdraw' })}>
              💸 Withdraw ₹{pendingPayout}
            </button>
          )}

          {pendingPayout === 0 && totalEarned === 0 && (
            <div className="ibox" style={{ marginTop:12,textAlign:'center' }}>
              💡 Book a pickup to start earning rewards. Working devices earn ₹300–₹3,000.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
