// src/components/BookingCard.jsx
import { updateStatus } from '../services/api';

const STATUS_COLOR = {
  Pending:    '#f5b731',
  Confirmed:  '#7c6fef',
  'Picked Up':'#10d97e',
  Recycled:   '#34d399',
  Cancelled:  '#f04060',
};
const NEXT = { Pending:'Confirmed', Confirmed:'Picked Up', 'Picked Up':'Recycled' };

export default function BookingCard({ booking, role, onRefresh, onEmailClick, onPayClick, onTrackClick, onCertClick, onDeleteClick }) {
  const b    = booking;
  const sc   = STATUS_COLOR[b.status] || '#5a7898';
  const next = NEXT[b.status];

  const handleStatus = async () => {
    if (!next) return;
    if (!confirm(`Move booking to "${next}"?`)) return;
    try {
      await updateStatus(b._id, next);
      onRefresh?.();
    } catch (e) {
      alert('Failed to update status: ' + e.message);
    }
  };

  return (
    <div className="bcard">
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8 }}>
        {/* Left: info */}
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ color:'var(--grn)',fontWeight:700,fontSize:11,fontFamily:'monospace',opacity:.7 }}>
            #{b._id?.slice(-10)}
          </div>
          <div style={{ fontWeight:700,fontSize:14,marginTop:3,wordBreak:'break-word' }}>{b.device}</div>
          <div style={{ color:'var(--t3)',fontSize:12,marginTop:2 }}>{b.user} · {b.phone}</div>
          <div style={{ color:'var(--t3)',fontSize:12,marginTop:1 }}>
            📍 {b.city} {b.pincode} · 📅 {b.date}
          </div>
          <div style={{ color:'var(--t3)',fontSize:12 }}>⏰ {b.slot}</div>
          {b.address && <div style={{ color:'var(--t4)',fontSize:11,marginTop:2 }}>🏠 {b.address}</div>}
          {b.recycler && <div style={{ color:'var(--t3)',fontSize:12,marginTop:1 }}>🏭 {b.recycler}</div>}
          {b.email  && role==='admin' && <div style={{ color:'var(--t3)',fontSize:12 }}>📧 {b.email}</div>}
          {b.upi    && role==='admin' && <div style={{ color:'var(--t3)',fontSize:12 }}>💳 {b.upi}</div>}
          {b.notes  && <div style={{ color:'var(--t4)',fontSize:11,fontStyle:'italic',marginTop:3 }}>📝 {b.notes}</div>}
          {b.paidAt && b.paymentStatus==='Paid' && (
            <div style={{ color:'#93c5fd',fontSize:11,marginTop:3 }}>
              ✅ Paid {new Date(b.paidAt).toLocaleDateString('en-IN')}
            </div>
          )}
        </div>

        {/* Right: badge + actions */}
        <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,minWidth:92,flexShrink:0 }}>
          <span style={{ fontSize:11,padding:'3px 10px',borderRadius:20,fontWeight:700,
            background:`${sc}22`,color:sc,border:`1px solid ${sc}33` }}>
            {b.status}
          </span>
          <div style={{ color:'var(--grn)',fontWeight:900,fontSize:15,fontFamily:"'DM Sans',sans-serif" }}>
            ₹{b.reward}
          </div>

          <div style={{ display:'flex',flexWrap:'wrap',gap:4,justifyContent:'flex-end' }}>
            {/* Advance status */}
            {(role==='recycler' || role==='admin') && next && (
              <button className="actbtn g" onClick={handleStatus} title={`Advance to ${next}`}>→ {next}</button>
            )}
            {/* Admin email */}
            {role==='admin' && (
              <button className="actbtn y" onClick={() => onEmailClick?.(b)} title="Send email">📧</button>
            )}
            {/* Admin pay */}
            {role==='admin' && b.status==='Recycled' && b.paymentStatus!=='Paid' && (
              <button className="actbtn b" onClick={() => onPayClick?.(b)} title="Mark payment">💸</button>
            )}
            {/* Certificate */}
            {b.status==='Recycled' && (
              <button className="actbtn p" onClick={() => onCertClick?.(b)} title="Download certificate">📄</button>
            )}
            {/* Track */}
            <button className="actbtn" onClick={() => onTrackClick?.(b)}
              style={{ borderColor:'rgba(90,120,152,.4)',color:'var(--t3)' }} title="Track pickup">📍</button>
            {/* Paid badge */}
            {b.paymentStatus==='Paid' && (
              <span style={{ fontSize:10,padding:'3px 8px',background:'rgba(59,130,246,.12)',color:'#93c5fd',
                border:'1px solid rgba(59,130,246,.3)',borderRadius:18,fontWeight:600 }}>
                💸 Paid
              </span>
            )}
            {/* Delete (pending only, user role) */}
            {onDeleteClick && b.status==='Pending' && (
              <button className="actbtn r" onClick={() => onDeleteClick(b._id)} title="Cancel booking">🗑️</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
