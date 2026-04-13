// src/components/modals/TrackingModal.jsx
export default function TrackingModal({ booking, onClose }) {
  const stages = [
    { key: 'Confirmed',  icon: '📋', label: 'Booking Confirmed',  desc: 'Recycler assigned and booking processed' },
    { key: 'Picked Up',  icon: '🚐', label: 'Device Picked Up',   desc: 'Recycler collected your device' },
    { key: 'Recycled',   icon: '✅', label: 'Recycling Complete',  desc: 'Device recycled. Reward being processed.' },
  ];
  const order   = ['Confirmed', 'Picked Up', 'Recycled'];
  const curIdx  = order.indexOf(booking.status);

  return (
    <div className="overlay">
      <div className="modal">
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:18,marginBottom:4 }}>📍 Live Tracking</div>
        <div style={{ marginBottom:16 }}>
          <div style={{ color:'var(--t3)',fontSize:12 }}>Booking: <b style={{ color:'var(--txt)' }}>#{booking._id?.slice(-10)}</b></div>
          <div style={{ color:'var(--t3)',fontSize:12 }}>Device: <b style={{ color:'var(--txt)' }}>{booking.device}</b></div>
          <div style={{ color:'var(--t3)',fontSize:12 }}>Recycler: <b style={{ color:'var(--txt)' }}>{booking.recycler}</b></div>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:0,position:'relative',paddingLeft:28 }}>
          {stages.map((st, i) => {
            const done   = curIdx >= order.indexOf(st.key) && order.indexOf(st.key) >= 0;
            const active = booking.status === st.key;
            return (
              <div key={st.key} style={{ position:'relative',paddingBottom:i < stages.length-1 ? 20 : 0 }}>
                {i < stages.length-1 && (
                  <div style={{ position:'absolute',left:-19,top:22,bottom:0,width:2,background:done ? 'var(--grn)':'var(--brd)' }} />
                )}
                <div style={{ position:'absolute',left:-28,top:2,width:20,height:20,borderRadius:'50%',border:`2px solid ${done?'var(--grn)':'var(--brd2)'}`,background:active?'var(--ylw)':done?'var(--grn)':'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#021a0e',fontWeight:700,zIndex:1,boxShadow:active?'0 0 0 4px rgba(245,183,49,.3)':'none' }}>
                  {done ? '✓' : i+1}
                </div>
                <div>
                  <div style={{ fontWeight:700,fontSize:13,color:done?'var(--txt)':'var(--t3)' }}>
                    {st.icon} {st.label}
                    {active && <span style={{ color:'var(--ylw)',fontSize:10,marginLeft:6 }}>← Current</span>}
                  </div>
                  <div style={{ color:'var(--t3)',fontSize:12,marginTop:2 }}>{st.desc}</div>
                  {done && booking.date && <div style={{ color:'var(--t4)',fontSize:11,marginTop:2 }}>{booking.date}{active ? ' · ' + booking.slot : ''}</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background:'rgba(16,217,126,.06)',border:'1px solid rgba(16,217,126,.18)',borderRadius:12,padding:'12px 14px',marginTop:16 }}>
          <div style={{ fontWeight:700,fontSize:13,marginBottom:6 }}>📍 Est. Reward: <span style={{ color:'var(--grn)' }}>₹{booking.reward}</span></div>
          <div style={{ color:'var(--t3)',fontSize:12 }}>UPI: {booking.upi || 'Not provided'}</div>
          {booking.paymentStatus === 'Paid' && <div style={{ color:'var(--grn)',fontSize:12,marginTop:4 }}>💸 Reward Paid ✅</div>}
        </div>

        <button className="bs bfull" onClick={onClose} style={{ marginTop:14 }}>Close</button>
      </div>
    </div>
  );
}
