// src/components/modals/PriceEstimatorModal.jsx
import { useState } from 'react';
import { estimatePrice } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function PriceEstimatorModal({ onClose }) {
  const [form, setForm]     = useState({ brand:'', model:'', year:'2020', condition:'Working - Good condition' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const run = async () => {
    if (!form.brand || !form.model) { alert('Enter brand and model'); return; }
    setLoading(true);
    try {
      const { data } = await estimatePrice(form);
      setResult(data);
    } catch (e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="overlay">
      <div className="modal">
        <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:18,marginBottom:4 }}>🤖 AI Price Estimator</div>
        <p style={{ color:'var(--t3)',fontSize:13,marginBottom:16 }}>Get an AI-powered estimate for your device's recycling reward.</p>

        <label className="lbl">Device Brand</label>
        <input placeholder="e.g. Samsung, Apple, Dell" value={form.brand} onChange={upd('brand')} style={{ marginBottom:10 }} />
        <label className="lbl mt">Device Model</label>
        <input placeholder="e.g. iPhone 12, Galaxy S21" value={form.model} onChange={upd('model')} style={{ marginBottom:10 }} />
        <label className="lbl mt">Year of Purchase</label>
        <input type="number" min="2000" max="2025" value={form.year} onChange={upd('year')} style={{ marginBottom:10 }} />
        <label className="lbl mt">Condition</label>
        <select value={form.condition} onChange={upd('condition')} style={{ marginBottom:14 }}>
          <option>Working - Good condition</option>
          <option>Working - Minor damage</option>
          <option>Damaged - Cracked/broken</option>
          <option>Dead - Not turning on</option>
          <option>Scrap - For parts only</option>
        </select>

        <button className="bp bfull" onClick={run} disabled={loading} style={{ marginBottom:14 }}>
          {loading ? '⏳ Estimating…' : '🤖 Estimate with AI'}
        </button>

        {result && (
          <div style={{ background:'rgba(16,217,126,.06)',border:'1px solid rgba(16,217,126,.2)',borderRadius:14,padding:18,marginBottom:14 }}>
            <div style={{ fontSize:12,color:'var(--t3)',marginBottom:6,textTransform:'uppercase',letterSpacing:.5 }}>Estimated Reward</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:36,fontWeight:900,color:'var(--grn)',lineHeight:1 }}>₹{result.estimate}</div>
            <div style={{ color:'var(--t3)',fontSize:12,marginTop:4 }}>Range: ₹{result.min} – ₹{result.max}</div>
            <div style={{ color:'var(--t2)',fontSize:13,marginTop:12,lineHeight:1.6 }}>{result.reason}</div>
            {result.tips && (
              <div style={{ marginTop:10,background:'rgba(124,111,239,.08)',border:'1px solid rgba(124,111,239,.2)',borderRadius:10,padding:'10px 12px',color:'var(--t3)',fontSize:12,lineHeight:1.6 }}>
                💡 {result.tips}
              </div>
            )}
            <div style={{ marginTop:10,color:'var(--t4)',fontSize:11 }}>EcoVault Price Engine · India market rates</div>
          </div>
        )}

        <div className="btnrow" style={{ marginTop:0 }}>
          <button className="bs bfull" onClick={onClose}>Close</button>
          {result && (
            <button className="bp bfull" onClick={() => { onClose(); nav('/book'); }}>
              📦 Book Pickup →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
