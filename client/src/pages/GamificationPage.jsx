// src/pages/GamificationPage.jsx — EcoPoints, Badges, Leaderboard, Carbon Calculator
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getGamification, getLeaderboard, calcCarbon } from '../services/api';
import Loader from '../components/Loader';

const DEVICE_TYPES = ['Smartphone','Laptop','Desktop','Tablet','TV','Printer','Battery','Monitor','Other'];

function ProgressBar({ value, max, color='var(--grn)' }) {
  const pct = max > 0 ? Math.min(100, (value/max)*100) : 0;
  return (
    <div style={{background:'rgba(255,255,255,.06)',borderRadius:99,height:8,overflow:'hidden',marginTop:6}}>
      <div style={{width:`${pct}%`,background:color,height:'100%',borderRadius:99,transition:'width .6s ease'}} />
    </div>
  );
}

function Badge({ badge, earned }) {
  return (
    <div style={{
      background: earned ? 'rgba(16,217,126,.08)' : 'rgba(255,255,255,.02)',
      border: `1px solid ${earned ? 'rgba(16,217,126,.3)' : 'rgba(255,255,255,.06)'}`,
      borderRadius:14, padding:'12px 10px', textAlign:'center',
      opacity: earned ? 1 : 0.4, transition:'all .2s',
    }}>
      <div style={{fontSize:28,marginBottom:6}}>{badge.icon}</div>
      <div style={{fontSize:12,fontWeight:800,color: earned ? 'var(--txt)' : 'var(--t3)',marginBottom:3}}>{badge.name}</div>
      <div style={{fontSize:10,color:'var(--t4)',lineHeight:1.4}}>{badge.desc}</div>
      {earned && <div style={{fontSize:9,color:'var(--grn)',marginTop:4,fontWeight:700}}>EARNED</div>}
    </div>
  );
}

const ALL_BADGES = [
  {id:'first_recycler',  name:'First Recycler',  icon:'🌱', desc:'Completed first recycling'},
  {id:'eco_warrior',     name:'Eco Warrior',      icon:'⚔️', desc:'Recycled 5 devices'},
  {id:'green_champion',  name:'Green Champion',   icon:'🏆', desc:'Recycled 10 devices'},
  {id:'carbon_crusher',  name:'Carbon Crusher',   icon:'💨', desc:'Saved 500 kg+ CO2'},
  {id:'data_guardian',   name:'Data Guardian',    icon:'🔐', desc:'Wiped data on 3+ devices'},
  {id:'top_earner',      name:'Top Earner',       icon:'💰', desc:'Earned Rs.5000+ in rewards'},
  {id:'laptop_lord',     name:'Laptop Lord',      icon:'💻', desc:'Recycled a laptop'},
  {id:'streak_3',        name:'3-Month Streak',   icon:'🔥', desc:'Recycled 3 consecutive months'},
];

// ── Carbon Calculator sub-component ──────────────────────────────────────
function CarbonCalc({ toast }) {
  const [rows, setRows] = useState([{device:'Smartphone',qty:1}]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const addRow = () => setRows(r => [...r, {device:'Smartphone',qty:1}]);
  const removeRow = i => setRows(r => r.filter((_,j)=>j!==i));
  const updateRow = (i, key, val) => setRows(r => r.map((row,j) => j===i ? {...row,[key]:val} : row));

  const calculate = async () => {
    setLoading(true);
    try {
      const { data } = await calcCarbon(rows);
      setResult(data);
    } catch(e) { toast('Calculation failed: '+(e.response?.data?.error||e.message),'err'); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:16,marginBottom:4,color:'var(--txt)'}}>
        🌍 Carbon Footprint Calculator
      </div>
      <div style={{color:'var(--t3)',fontSize:12,marginBottom:16}}>
        See how much CO2, water & energy your recycling saves
      </div>

      {/* Device rows */}
      {rows.map((row,i) => (
        <div key={i} style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
          <select value={row.device} onChange={e=>updateRow(i,'device',e.target.value)}
            style={{flex:1,margin:0}}>
            {DEVICE_TYPES.map(d=><option key={d}>{d}</option>)}
          </select>
          <input type="number" min={1} max={20} value={row.qty}
            onChange={e=>updateRow(i,'qty',Math.max(1,parseInt(e.target.value)||1))}
            style={{width:60,margin:0,textAlign:'center'}} />
          {rows.length > 1 && (
            <button onClick={()=>removeRow(i)}
              style={{background:'rgba(240,64,96,.1)',border:'1px solid rgba(240,64,96,.3)',color:'var(--red)',borderRadius:8,padding:'8px 10px',fontSize:13,minHeight:40,flexShrink:0}}>
              ✕
            </button>
          )}
        </div>
      ))}

      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <button onClick={addRow} className="bs" style={{flex:1,fontSize:13,padding:'9px 12px'}}>+ Add Device</button>
        <button onClick={calculate} className="bp" style={{flex:2,fontSize:13,padding:'9px 14px'}} disabled={loading}>
          {loading ? 'Calculating…' : '🌿 Calculate Impact'}
        </button>
      </div>

      {result && (
        <div style={{background:'rgba(16,217,126,.05)',border:'1px solid rgba(16,217,126,.2)',borderRadius:16,padding:16}}>
          {/* Big numbers */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:14}}>
            {[
              {icon:'💨',val:`${result.totalCo2Saved} kg`,  label:'CO2 Saved',           color:'var(--grn)'},
              {icon:'💧',val:`${(result.totalWaterSaved/1000).toFixed(0)}k L`, label:'Water Saved', color:'#38bdf8'},
              {icon:'⚡',val:`${result.totalEnergySaved} Wh`,label:'Energy Saved',         color:'var(--ylw)'},
              {icon:'☠️',val:`${result.totalToxicPrevented} kg`,label:'Toxic Prevented',  color:'var(--pur2)'},
            ].map(c=>(
              <div key={c.label} style={{background:'rgba(13,27,42,.8)',border:'1px solid var(--brd)',borderRadius:12,padding:'10px 12px',textAlign:'center'}}>
                <div style={{fontSize:18,marginBottom:4}}>{c.icon}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:900,fontSize:16,color:c.color}}>{c.val}</div>
                <div style={{color:'var(--t4)',fontSize:9,textTransform:'uppercase',letterSpacing:.4,marginTop:2}}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Equivalences */}
          <div style={{background:'rgba(13,27,42,.6)',borderRadius:12,padding:'10px 12px'}}>
            <div style={{fontSize:11,color:'var(--t3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.5,marginBottom:8}}>That's equivalent to…</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                <span style={{color:'var(--t2)'}}>🌳 Trees absorbing for</span>
                <span style={{fontWeight:700,color:'var(--grn)'}}>{result.equivalences.treeDays} days</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                <span style={{color:'var(--t2)'}}>🚗 Car not driven</span>
                <span style={{fontWeight:700,color:'var(--grn)'}}>{result.equivalences.carKm} km</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}>
                <span style={{color:'var(--t2)'}}>📱 Phones charged</span>
                <span style={{fontWeight:700,color:'var(--grn)'}}>{result.equivalences.phonesCharged.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Leaderboard sub-component ─────────────────────────────────────────────
function Leaderboard({ currentUid }) {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then(r => setBoard(r.data.leaderboard || [])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding:'8px 0' }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} className="skel-card" style={{ marginBottom:8,padding:'12px 14px' }}>
          <div className="skel-row" style={{ alignItems:'center' }}>
            <div className="skeleton" style={{ width:32,height:32,borderRadius:'50%',flexShrink:0 }} />
            <div className="skel-lines" style={{ gap:6 }}>
              <div className="skeleton skel-line w70" style={{ height:12 }} />
              <div className="skeleton skel-line w40" style={{ height:10 }} />
            </div>
            <div className="skeleton" style={{ width:50,height:24,borderRadius:8,flexShrink:0 }} />
          </div>
        </div>
      ))}
    </div>
  );
  if (!board.length) return <div className="empty">No data yet. Be the first to recycle!</div>;

  const rankColors = ['#f5b731','#94a3b8','#cd7f32'];
  const rankEmoji  = ['🥇','🥈','🥉'];

  return (
    <div>
      <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:16,marginBottom:4}}>🏆 Leaderboard</div>
      <div style={{color:'var(--t3)',fontSize:12,marginBottom:16}}>Top recyclers by EcoPoints this month</div>

      {board.map((entry,i) => {
        const isMe = entry.uid === currentUid;
        return (
          <div key={entry.uid} style={{
            background: isMe ? 'rgba(16,217,126,.08)' : 'rgba(13,27,42,.6)',
            border: `1px solid ${isMe ? 'rgba(16,217,126,.3)' : 'var(--brd)'}`,
            borderRadius:14, padding:'11px 14px', marginBottom:8,
            display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{width:30,textAlign:'center',flexShrink:0}}>
              {i < 3
                ? <span style={{fontSize:20}}>{rankEmoji[i]}</span>
                : <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,color:'var(--t3)',fontSize:13}}>#{entry.rank}</span>
              }
            </div>
            <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(16,217,126,.15)',border:`2px solid ${i<3?rankColors[i]:'var(--brd)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0,overflow:'hidden'}}>
              {entry.photo ? <img src={entry.photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : '👤'}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                <span style={{fontWeight:700,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{entry.name}</span>
                {isMe && <span style={{background:'rgba(16,217,126,.2)',color:'var(--grn)',fontSize:9,fontWeight:800,borderRadius:4,padding:'1px 5px'}}>YOU</span>}
              </div>
              <div style={{color:'var(--t3)',fontSize:11}}>
                <span style={{color:'var(--grn)',fontWeight:700}}>{entry.levelIcon} {entry.level}</span>
                &nbsp;·&nbsp;{entry.recycled} recycled&nbsp;·&nbsp;{entry.co2Saved}kg CO2
              </div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:900,fontSize:15,color: i===0?'#f5b731':i===1?'#94a3b8':i===2?'#cd7f32':'var(--pur2)'}}>{entry.points.toLocaleString()}</div>
              <div style={{color:'var(--t4)',fontSize:9,textTransform:'uppercase',letterSpacing:.4}}>pts</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function GamificationPage({ toast }) {
  const { user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState(user ? 'profile' : 'leaderboard'); // guests default to leaderboard

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getGamification(user.uid)
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Loader text="Loading EcoPoints…" />;

  return (
    <div style={{paddingTop:24}}>
      <h2 className="ptitle" style={{marginBottom:4}}>🌿 EcoVault Rewards</h2>
      <div style={{color:'var(--t3)',fontSize:13,marginBottom:20}}>
        Earn EcoPoints for every recycling. Climb levels. Unlock badges.
      </div>

      {/* Tab bar */}
      <div className="tabs" style={{marginBottom:20}}>
        {[['profile','🏅 My Profile'],['leaderboard','🏆 Leaderboard'],['carbon','🌍 Carbon Calc']].map(([k,l]) => (
          <button key={k} className={`tabbt ${tab===k?'on':''}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {/* Tab content — key triggers CSS re-animation on tab switch */}
      <div key={tab} className="tab-fade">

      {/* ── My Profile ── */}
      {tab === 'profile' && stats && (
        <div>
          {/* Level card */}
          <div style={{
            background:'linear-gradient(135deg,rgba(16,217,126,.1),rgba(124,111,239,.07))',
            border:'1px solid rgba(16,217,126,.25)', borderRadius:20, padding:'20px 18px', marginBottom:20,
          }}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div>
                <div style={{fontSize:11,color:'var(--t3)',fontWeight:600,textTransform:'uppercase',letterSpacing:.5,marginBottom:4}}>Current Level</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:900,fontSize:26,color:'var(--grn)',letterSpacing:'-1px'}}>
                  {stats.levelIcon} {stats.level}
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:900,fontSize:34,color:'var(--grn)'}}>{stats.totalPoints.toLocaleString()}</div>
                <div style={{color:'var(--t3)',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:.4}}>EcoPoints</div>
              </div>
            </div>

            {stats.nextLevel && (
              <>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--t3)',marginBottom:4}}>
                  <span>Progress to {stats.nextLevel}</span>
                  <span>{stats.pointsToNext} pts to go</span>
                </div>
                <ProgressBar value={stats.totalPoints} max={stats.totalPoints + stats.pointsToNext} />
              </>
            )}
            {!stats.nextLevel && <div style={{color:'var(--grn)',fontSize:12,fontWeight:700,textAlign:'center',marginTop:8}}>MAX LEVEL REACHED 🌍</div>}
          </div>

          {/* Stats grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
            {[
              {icon:'♻️', val:stats.recycled,                           label:'Recycled'},
              {icon:'💨', val:`${stats.co2Saved}kg`,                    label:'CO2 Saved'},
              {icon:'💰', val:`Rs.${stats.totalReward}`,                 label:'Earned'},
              {icon:'⚡', val:`${(stats.energySaved/1000).toFixed(1)}kWh`,label:'Energy Saved'},
              {icon:'💧', val:`${(stats.waterSaved/1000).toFixed(0)}kL`, label:'Water Saved'},
              {icon:'🔥', val:`${stats.streak}mo`,                       label:'Streak'},
            ].map(c=>(
              <div key={c.label} style={{background:'rgba(13,27,42,.8)',border:'1px solid var(--brd)',borderRadius:14,padding:'12px 10px',textAlign:'center'}}>
                <div style={{fontSize:18,marginBottom:4}}>{c.icon}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:900,fontSize:15,color:'var(--grn)'}}>{c.val}</div>
                <div style={{color:'var(--t4)',fontSize:9,textTransform:'uppercase',letterSpacing:.4,marginTop:2}}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Points breakdown */}
          <div style={{background:'rgba(13,27,42,.7)',border:'1px solid var(--brd)',borderRadius:16,padding:'14px 16px',marginBottom:20}}>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:14,marginBottom:12}}>📊 How to Earn More Points</div>
            {[
              {action:'Book a pickup',        pts:50,  icon:'📦'},
              {action:'Device recycled',      pts:200, icon:'♻️'},
              {action:'First booking bonus',  pts:100, icon:'🌱'},
              {action:'5-booking milestone',  pts:250, icon:'🎯'},
              {action:'10-booking milestone', pts:500, icon:'🏆'},
            ].map(r=>(
              <div key={r.action} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid rgba(30,58,95,.2)'}}>
                <span style={{color:'var(--t2)',fontSize:13}}>{r.icon} {r.action}</span>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:13,color:'var(--grn)'}}>+{r.pts} pts</span>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:14,marginBottom:12,color:'var(--txt)'}}>
            🏅 Badges ({stats.badges?.length || 0}/{ALL_BADGES.length})
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {ALL_BADGES.map(badge => (
              <Badge key={badge.id} badge={badge}
                earned={stats.badges?.some(b => b.id === badge.id)} />
            ))}
          </div>
        </div>
      )}

      {tab === 'profile' && !stats && (
        <div style={{textAlign:'center',padding:'40px 20px',background:'linear-gradient(135deg,rgba(16,217,126,.06),rgba(16,217,126,.02))',border:'1px solid rgba(16,217,126,.2)',borderRadius:20}}>
          <img src="/logo.png" alt="EcoVault" style={{width:64,height:64,borderRadius:14,objectFit:'cover',margin:'0 auto 16px',display:'block',boxShadow:'0 0 24px rgba(16,217,126,.3)'}} />
          <div style={{fontWeight:800,fontSize:18,color:'var(--txt)',marginBottom:8}}>Your EcoProfile Awaits</div>
          <div style={{color:'var(--t3)',fontSize:14,lineHeight:1.6,maxWidth:320,margin:'0 auto 20px'}}>Log in to track your EcoPoints, earn badges, and see your environmental impact.</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center',marginBottom:24}}>
            {["🌱 First Recycler","⚔️ Eco Warrior","🏆 Green Champion","💨 Carbon Crusher","🔐 Data Guardian","💰 Top Earner"].map(b=>(
              <span key={b} style={{fontSize:12,padding:'4px 10px',background:'rgba(16,217,126,.08)',border:'1px solid rgba(16,217,126,.2)',borderRadius:20,color:'var(--grn)',fontWeight:600}}>{b}</span>
            ))}
          </div>
          <a href="/login" style={{display:'inline-block',background:'var(--grn)',color:'#020917',fontWeight:800,fontSize:15,padding:'12px 28px',borderRadius:12,textDecoration:'none',boxShadow:'0 0 20px rgba(16,217,126,.35)'}}>Login to Earn Points →</a>
        </div>
      )}

      {/* ── Leaderboard ── */}
      {tab === 'leaderboard' && (
        <Leaderboard currentUid={user?.uid} />
      )}

      {/* ── Carbon Calculator ── */}
      {tab === 'carbon' && (
        <CarbonCalc toast={toast} />
      )}

      </div>{/* /tab-fade */}
    </div>
  );
}
