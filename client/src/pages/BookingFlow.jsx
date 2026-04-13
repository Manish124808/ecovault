// src/pages/BookingFlow.jsx
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../services/api';

const DEVS = [
  {icon:'📱',label:'Smartphone'},{icon:'💻',label:'Laptop'},{icon:'🖥️',label:'Desktop'},
  {icon:'🖨️',label:'Printer'},{icon:'🔋',label:'Battery'},{icon:'📺',label:'TV'},
  {icon:'⌨️',label:'Peripherals'},{icon:'📷',label:'Camera'},
];
const CONDS = [
  {v:'working',label:'Working',min:200,max:800,color:'#10d97e'},
  {v:'damaged',label:'Damaged',min:50,max:200,color:'#f5b731'},
  {v:'dead',   label:'Scrap',  min:10,max:50, color:'#f04060'},
];
const CITIES = ['Delhi','Mumbai','Bangalore','Pune','Hyderabad','Chennai','Meerut','Noida','Gurgaon','Lucknow'];
const SLOTS  = ['9 AM – 11 AM','11 AM – 1 PM','2 PM – 4 PM','4 PM – 6 PM'];
const STEPS  = ['Device','Location','Contact','Review'];

// Brand → Model lineup lookup
const BRAND_MODELS = {
  Smartphone: {
    'Samsung':  ['Galaxy S24 Ultra','Galaxy S24+','Galaxy S24','Galaxy S23','Galaxy A55','Galaxy A35','Galaxy A15','Galaxy M34','Galaxy F55'],
    'Apple':    ['iPhone 16 Pro Max','iPhone 16 Pro','iPhone 16','iPhone 15','iPhone 14','iPhone 13','iPhone 12','iPhone SE (2022)'],
    'OnePlus':  ['OnePlus 12','OnePlus 12R','OnePlus Nord 4','OnePlus Nord CE 4','OnePlus Nord 3','OnePlus 11'],
    'Xiaomi':   ['Redmi Note 13 Pro+','Redmi Note 13 Pro','Redmi Note 13','Poco X6 Pro','Poco F6','Poco M6 Pro'],
    'Realme':   ['Realme GT 6','Realme 13 Pro+','Realme 13 Pro','Realme Narzo 70 Pro','Realme C67'],
    'Vivo':     ['Vivo X100 Pro','Vivo V30 Pro','Vivo V30','Vivo T3 Pro','Vivo Y200 Pro'],
    'OPPO':     ['OPPO Find X7','Reno 12 Pro','Reno 12','OPPO F27 Pro','OPPO A60'],
    'iQOO':     ['iQOO 12','iQOO Neo 9 Pro','iQOO Z9 Pro','iQOO Z9'],
    'Google':   ['Pixel 8 Pro','Pixel 8','Pixel 7a','Pixel 7'],
    'Motorola': ['Edge 50 Pro','Edge 50 Fusion','G85','G64','G54'],
    'Nokia':    ['Nokia G42','Nokia C32','Nokia G21'],
    'Other':    ['Other / Not Listed'],
  },
  Laptop: {
    'Dell':     ['XPS 15','XPS 13','Inspiron 15 3520','Inspiron 14','Latitude 5540','Vostro 3520','G15 Gaming'],
    'HP':       ['Spectre x360','Envy 15','Pavilion 15','EliteBook 840','Omen 16','Victus 15','Laptop 15s'],
    'Lenovo':   ['ThinkPad X1 Carbon','ThinkPad E14','IdeaPad Slim 5','IdeaPad Gaming 3','Legion 5i','Yoga 7i'],
    'Apple':    ['MacBook Pro 16" M3','MacBook Pro 14" M3','MacBook Air 15" M3','MacBook Air 13" M2'],
    'Asus':     ['ZenBook 14','VivoBook 15','ROG Strix G15','TUF Gaming A15','ProArt Studiobook'],
    'Acer':     ['Swift X','Aspire 5','Nitro V 15','Predator Helios 16','Extensa 15'],
    'MSI':      ['Stealth 16','Raider GE78','Cyborg 15','Modern 15'],
    'Samsung':  ['Galaxy Book4 Pro','Galaxy Book4 360','Galaxy Book3'],
    'Microsoft':['Surface Laptop 6','Surface Pro 10','Surface Book 3'],
    'Other':    ['Other / Not Listed'],
  },
  Desktop: {
    'Dell':     ['OptiPlex 7020','Inspiron 3030','XPS 8960','Alienware Aurora R16'],
    'HP':       ['EliteDesk 800 G9','Pavilion Desktop','Omen 45L','Victus 15L'],
    'Lenovo':   ['ThinkCentre M90q','IdeaCentre 5','Legion Tower 7i'],
    'Apple':    ['Mac Studio (M2 Ultra)','Mac Mini (M2)','iMac 24" (M3)','Mac Pro'],
    'Asus':     ['ExpertCenter D7','ROG Strix GT15','Mini PC PN64'],
    'Custom Built': ['Intel Core i9 Build','Intel Core i7 Build','AMD Ryzen 9 Build','AMD Ryzen 7 Build','AMD Ryzen 5 Build'],
    'Other':    ['Other / Not Listed'],
  },
  TV: {
    'Samsung':  ['Neo QLED 8K','Neo QLED 4K QN90D','OLED S95D','Crystal 4K CU8000','The Frame 2024'],
    'LG':       ['OLED C4','OLED G4','QNED86','UT80 4K UHD','NanoCell NANO77'],
    'Sony':     ['Bravia 9 QLED','Bravia 7 Mini LED','X90L 4K','X80L 4K'],
    'TCL':      ['C845 QD-Mini LED','P745 4K','P635 4K','C635 4K'],
    'Xiaomi':   ['Xiaomi TV A 55"','Xiaomi TV X 43"','Xiaomi TV 5X'],
    'Vu':       ['Vu Premium 4K','Vu GloLED','Vu Cinema TV'],
    'OnePlus':  ['OnePlus TV Q2 Pro','OnePlus TV 65 Y1S Pro'],
    'Other':    ['Other / Not Listed'],
  },
  Camera: {
    'Canon':    ['EOS R8','EOS R50','EOS R100','EOS 90D','PowerShot G7 X III'],
    'Nikon':    ['Z30','Z50 II','Z5 II','D3500','D7500','Coolpix P950'],
    'Sony':     ['Alpha ZV-E10 II','Alpha A7 IV','Alpha A6700','ZV-1 II','RX100 VII'],
    'Fujifilm': ['X-T50','X-S20','X-E4','Instax Mini 12'],
    'GoPro':    ['GoPro Hero 13','Hero 12','Hero 11 Mini'],
    'DJI':      ['Osmo Pocket 3','Action 4','Osmo Action 4'],
    'Other':    ['Other / Not Listed'],
  },
  Printer: {
    'HP':       ['HP DeskJet 2878','HP LaserJet MFP M236d','HP OfficeJet Pro 9010','HP Ink Tank 520'],
    'Canon':    ['Pixma G3020','Pixma MG3670','Canon SELPHY CP1500'],
    'Epson':    ['EcoTank L3250','EcoTank L5290','WorkForce WF-2930'],
    'Brother':  ['DCP-T420W','HL-L2321D','MFC-J1010DW'],
    'Samsung':  ['Xpress SL-M2021W','ProXpress M4072FD'],
    'Other':    ['Other / Not Listed'],
  },
  Battery: {
    'Laptop Battery':   ['Dell Battery','HP Battery','Lenovo Battery','Asus Battery','Apple Battery','Other Brand'],
    'Phone Battery':    ['Samsung Battery','Apple Battery','OnePlus Battery','Xiaomi Battery','Other Brand'],
    'Power Bank':       ['Anker','Mi Power Bank','Syska','Ambrane','Other Brand'],
    'UPS Battery':      ['APC','Luminous','Microtek','Genus','Su-Kam'],
    'E-Vehicle Battery':['Electric Scooter Battery','E-Bike Battery','Other'],
    'Other':            ['Other / Not Listed'],
  },
  Peripherals: {
    'Keyboard':  ['Logitech MX Keys','Keychron K2','HP Keyboard','Dell Keyboard','Other'],
    'Mouse':     ['Logitech MX Master 3','Logitech G502','Razer DeathAdder','HP Mouse','Other'],
    'Monitor':   ['Dell UltraSharp','LG UltraGear','Samsung Odyssey','BenQ PD','Asus ProArt'],
    'HDD/SSD':   ['Seagate','Western Digital','Samsung SSD','Kingston','SanDisk'],
    'Router':    ['TP-Link','Netgear','Asus','Tenda','D-Link'],
    'Webcam':    ['Logitech C920','Logitech StreamCam','Razer Kiyo','HP 960','Other'],
    'Other':     ['Other / Not Listed'],
  },
};

// ── Image Upload Component ──────────────────────────────────────
function ImageUpload({ images, onChange, max = 3 }) {
  const inputRef = useRef(null);
  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = max - images.length;
    const toAdd = files.slice(0, remaining).filter(f => f.type.startsWith('image/'));
    const readers = toAdd.map(file => new Promise(resolve => {
      const r = new FileReader();
      r.onload = ev => resolve({ url: ev.target.result, name: file.name, size: file.size });
      r.readAsDataURL(file);
    }));
    Promise.all(readers).then(newImgs => onChange([...images, ...newImgs]));
    e.target.value = '';
  };
  const remove = (idx) => onChange(images.filter((_,i) => i !== idx));

  return (
    <div style={{ marginBottom: 16 }}>
      <label className="lbl">Device Photos (optional, max {max})</label>
      <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginTop:6 }}>
        {images.map((img, i) => (
          <div key={i} style={{ position:'relative',width:72,height:72,borderRadius:10,overflow:'hidden',
            border:'1px solid var(--brd)',flexShrink:0 }}>
            <img src={img.url} alt={img.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
            <button onClick={() => remove(i)}
              style={{ position:'absolute',top:2,right:2,width:18,height:18,borderRadius:'50%',
                background:'rgba(240,64,96,.9)',color:'#fff',border:'none',fontSize:11,
                fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',
                padding:0,cursor:'pointer',lineHeight:1 }}>×</button>
          </div>
        ))}
        {images.length < max && (
          <button onClick={() => inputRef.current?.click()}
            style={{ width:72,height:72,borderRadius:10,border:'2px dashed var(--brd2)',
              background:'rgba(13,27,42,.5)',color:'var(--t3)',fontSize:11,fontWeight:600,
              cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',
              justifyContent:'center',gap:3,transition:'all .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--grn)';e.currentTarget.style.color='var(--grn)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--brd2)';e.currentTarget.style.color='var(--t3)';}}>
            <span style={{ fontSize:20 }}>📷</span>
            <span>Add</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display:'none' }} onChange={handleFiles} />
      {images.length > 0 && (
        <div style={{ color:'var(--t3)',fontSize:11,marginTop:4 }}>
          {images.length}/{max} photo{images.length>1?'s':''} added
        </div>
      )}
    </div>
  );
}

// ── Brand/Model Selector ────────────────────────────────────────
function BrandModelSelector({ deviceType, value, onChange }) {
  const brands = BRAND_MODELS[deviceType] || {};
  const brandList = Object.keys(brands);
  const [selBrand, setSelBrand] = useState('');
  const [selModel, setSelModel] = useState('');
  const [custom, setCustom] = useState('');
  const models = selBrand ? (brands[selBrand] || []) : [];

  const handleBrand = (b) => {
    setSelBrand(b); setSelModel(''); setCustom('');
    onChange(b);
  };
  const handleModel = (m) => {
    setSelModel(m);
    const isOther = m === 'Other / Not Listed';
    if (!isOther) onChange(`${selBrand} ${m}`);
    else setCustom('');
  };
  const handleCustom = (v) => {
    setCustom(v);
    onChange(v ? `${selBrand} — ${v}` : selBrand);
  };

  if (!brandList.length) {
    return (
      <div>
        <label className="lbl">Brand / Model (optional)</label>
        <input placeholder="e.g. Samsung Galaxy S21" value={value||''} onChange={e=>onChange(e.target.value)} style={{marginBottom:16}} />
      </div>
    );
  }

  return (
    <div style={{ marginBottom:16 }}>
      <label className="lbl">Brand</label>
      <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginTop:6,marginBottom:10 }}>
        {brandList.map(b => (
          <button key={b} onClick={()=>handleBrand(b)}
            style={{ padding:'5px 12px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',
              border:`1px solid ${selBrand===b?'var(--grn)':'var(--brd)'}`,
              background:selBrand===b?'rgba(16,217,126,.12)':'rgba(13,27,42,.5)',
              color:selBrand===b?'var(--grn)':'var(--t2)',transition:'all .15s' }}>
            {b}
          </button>
        ))}
      </div>

      {selBrand && models.length > 0 && (
        <>
          <label className="lbl">Model</label>
          <select value={selModel} onChange={e=>handleModel(e.target.value)} style={{marginBottom:8}}>
            <option value="">-- Select model --</option>
            {models.map(m=><option key={m}>{m}</option>)}
          </select>
        </>
      )}

      {selModel === 'Other / Not Listed' && (
        <>
          <label className="lbl">Enter your model</label>
          <input placeholder={`e.g. ${selBrand} [model name]`} value={custom}
            onChange={e=>handleCustom(e.target.value)} style={{marginBottom:8}} />
        </>
      )}

      {value && (
        <div style={{ color:'var(--t3)',fontSize:11,marginTop:2 }}>
          Selected: <span style={{color:'var(--grn)',fontWeight:600}}>{value}</span>
          <button onClick={()=>{setSelBrand('');setSelModel('');setCustom('');onChange('');}}
            style={{background:'none',border:'none',color:'var(--t3)',fontSize:11,cursor:'pointer',marginLeft:8,textDecoration:'underline'}}>
            clear
          </button>
        </div>
      )}
    </div>
  );
}

function Step0({ F, upd, onNext }) {
  const calcR = () => F.cmin ? Math.floor((F.cmin + F.cmax) / 2) * (F.qty || 1) : 0;
  return (
    <div>
      <h2 className="ctitle">What are you recycling?</h2>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:16 }}>
        {DEVS.map(d => (
          <button key={d.label}
            onClick={() => { upd('dev', d.label); upd('icon', d.icon); upd('brandModel',''); }}
            style={{ display:'flex',flexDirection:'column',alignItems:'center',padding:'10px 4px',borderRadius:11,
              border:`2px solid ${F.dev===d.label?'var(--grn)':'var(--brd)'}`,
              background:F.dev===d.label?'rgba(16,217,126,.08)':'rgba(13,27,42,.5)',
              fontSize:10,color:F.dev===d.label?'var(--grn)':'var(--t2)',cursor:'pointer',fontWeight:600,
              transition:'all .15s',fontFamily:"'DM Sans',sans-serif" }}>
            <span style={{ fontSize:22,marginBottom:3 }}>{d.icon}</span>{d.label}
          </button>
        ))}
      </div>

      <label className="lbl">Condition</label>
      <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginBottom:14 }}>
        {CONDS.map(c => (
          <button key={c.v} onClick={() => upd('_cond', c)}
            style={{ flex:1,minWidth:80,padding:'11px 6px',borderRadius:11,
              border:`2px solid ${F.cv===c.v?c.color:'var(--brd)'}`,
              background:F.cv===c.v?c.color+'18':'rgba(13,27,42,.5)',
              cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:3,
              fontWeight:700,fontSize:13,fontFamily:"'DM Sans',sans-serif",transition:'all .15s' }}>
            <span style={{ color:c.color }}>{c.label}</span>
            <span style={{ color:'var(--t3)',fontSize:11 }}>₹{c.min}–{c.max}</span>
          </button>
        ))}
      </div>

      <label className="lbl">Quantity</label>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:16 }}>
        <button onClick={() => upd('qty', Math.max(1,(F.qty||1)-1))}
          style={{ width:34,height:34,borderRadius:10,background:'rgba(13,27,42,.8)',border:'1px solid var(--brd2)',color:'var(--t2)',fontSize:18,fontWeight:700,cursor:'pointer' }}>−</button>
        <span style={{ color:'var(--txt)',fontWeight:900,fontSize:20,minWidth:26,textAlign:'center',fontFamily:"'DM Sans',sans-serif" }}>{F.qty||1}</span>
        <button onClick={() => upd('qty', Math.min(10,(F.qty||1)+1))}
          style={{ width:34,height:34,borderRadius:10,background:'rgba(13,27,42,.8)',border:'1px solid var(--brd2)',color:'var(--t2)',fontSize:18,fontWeight:700,cursor:'pointer' }}>+</button>
        {F.cv && <span style={{ color:'var(--grn)',fontWeight:800,fontSize:14 }}>Est. ₹{calcR()}</span>}
      </div>

      {/* Smart Brand/Model Selector */}
      <BrandModelSelector
        deviceType={F.dev || ''}
        value={F.brandModel || ''}
        onChange={v => upd('brandModel', v)}
      />

      {/* Device Photos */}
      <ImageUpload images={F.photos||[]} onChange={v=>upd('photos',v)} max={3} />

      <button className="bp bfull" onClick={onNext} disabled={!F.dev || !F.cv}>Next: Location →</button>
    </div>
  );
}

function Step1({ F, upd, onNext, onBack, toast }) {
  const today = new Date().toISOString().split('T')[0];
  return (
    <div>
      <h2 className="ctitle">Pickup Location & Time</h2>
      <label className="lbl">City</label>
      <select value={F.city||''} onChange={e => upd('city', e.target.value)}>
        <option value="">-- Select city --</option>
        {CITIES.map(c => <option key={c}>{c}</option>)}
      </select>
      <label className="lbl mt">Pincode</label>
      <input type="tel" maxLength={6} placeholder="6-digit pincode"
        value={F.pin||''}
        onChange={e => upd('pin', e.target.value.replace(/\D/g,'').slice(0,6))}
      />
      <label className="lbl mt">Full Address</label>
      <textarea style={{ height:64 }} placeholder="House no, street, area, landmark…"
        value={F.addr||''}
        onChange={e => upd('addr', e.target.value)}
      />
      <label className="lbl mt">Pickup Date</label>
      <input type="date" value={F.date||''} min={today}
        onChange={e => upd('date', e.target.value)}
      />
      <label className="lbl mt">Time Slot</label>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16 }}>
        {SLOTS.map(s => (
          <button key={s} onClick={() => upd('slot', s)}
            style={{ padding:'10px 6px',borderRadius:10,
              border:`2px solid ${F.slot===s?'var(--pur)':'var(--brd)'}`,
              background:F.slot===s?'rgba(124,111,239,.12)':'rgba(13,27,42,.5)',
              color:F.slot===s?'var(--pur2)':'var(--t3)',fontSize:11,fontWeight:600,
              cursor:'pointer',fontFamily:"'DM Sans',sans-serif",transition:'all .15s' }}>
            {s}
          </button>
        ))}
      </div>
      <div style={{ display:'flex',gap:8 }}>
        <button className="bs bfull" onClick={onBack}>← Back</button>
        <button className="bp bfull" onClick={() => {
          if (!F.city) { toast('Please select a city','err'); return; }
          if (!F.pin || F.pin.length < 6) { toast('Enter valid 6-digit pincode','err'); return; }
          if (!F.date) { toast('Please select a pickup date','err'); return; }
          if (!F.slot) { toast('Please select a time slot','err'); return; }
          onNext();
        }}>Next: Contact →</button>
      </div>
    </div>
  );
}

function Step2({ F, upd, onNext, onBack, toast }) {
  return (
    <div>
      <h2 className="ctitle">Contact & Reward Details</h2>
      <label className="lbl">Your Name</label>
      <input placeholder="Full name" value={F.name||''} onChange={e => upd('name', e.target.value)} />
      <label className="lbl mt">Phone Number</label>
      <input type="tel" maxLength={10} placeholder="10-digit mobile"
        value={F.phone||''}
        onChange={e => upd('phone', e.target.value.replace(/\D/g,'').slice(0,10))}
      />
      <label className="lbl mt">Email <span style={{ color:'var(--red)' }}>★ Required</span></label>
      <input type="email" placeholder="your@gmail.com" value={F.email||''} onChange={e => upd('email', e.target.value)} />
      <label className="lbl mt">UPI ID (reward payout)</label>
      <input placeholder="name@upi or phone@paytm" value={F.upi||''} onChange={e => upd('upi', e.target.value)} />
      <label className="lbl mt">Special Instructions (optional)</label>
      <textarea style={{ height:56 }} placeholder="Leave at gate, call before arriving, fragile item…"
        value={F.notes||''} onChange={e => upd('notes', e.target.value)}
      />
      <div className="ibox">
        🛡️ <b style={{ color:'var(--pur2)' }}>Data Wipe Guaranteed</b> — DoD 5220.22-M certified.<br/>
        💸 Reward sent to your UPI after recycling.<br/>
        📧 Email confirmation sent immediately.
      </div>
      <div style={{ display:'flex',gap:8,marginTop:14 }}>
        <button className="bs bfull" onClick={onBack}>← Back</button>
        <button className="bp bfull" onClick={() => {
          if (!F.name) { toast('Enter your name','err'); return; }
          if (!F.phone || F.phone.length < 10) { toast('Enter valid 10-digit phone','err'); return; }
          if (!F.email || !F.email.includes('@')) { toast('Enter valid email address','err'); return; }
          onNext();
        }}>Review →</button>
      </div>
    </div>
  );
}

function Step3({ F, onBack, onSubmit, busy }) {
  const calcR = () => F.cmin ? Math.floor((F.cmin + F.cmax) / 2) * (F.qty || 1) : 0;
  const rows = [
    ['Device',     `${F.icon} ${F.dev}${F.brandModel?' — '+F.brandModel:''} × ${F.qty||1}`],
    ['Condition',  F.clabel, F.cc],
    ['Est. Reward','₹' + calcR(), 'var(--grn)'],
    ['City',       F.city],['Pincode', F.pin],
    ['Address',    F.addr || '—'],
    ['Date',       F.date],['Slot',    F.slot],
    ['Name',       F.name],['Phone',   F.phone],
    ['Email',      F.email || '⚠️ Not set'],
    ['UPI',        F.upi   || 'Not provided'],
    ...(F.notes ? [['Notes', F.notes]] : []),
    ...((F.photos||[]).length ? [[`Photos`, `${F.photos.length} image(s) attached`]] : []),
  ];
  return (
    <div>
      <h2 className="ctitle">Review & Confirm</h2>
      {/* Photo preview */}
      {(F.photos||[]).length > 0 && (
        <div style={{ display:'flex',gap:8,marginBottom:14,flexWrap:'wrap' }}>
          {F.photos.map((p,i) => (
            <img key={i} src={p.url} alt={p.name}
              style={{ width:60,height:60,borderRadius:10,objectFit:'cover',border:'1px solid var(--brd)' }} />
          ))}
        </div>
      )}
      <div className="sumbox">
        {rows.map(([k,v,c]) => (
          <div key={k} className="sumrow">
            <span className="sk">{k}</span>
            <span className="sv2" style={{ color:c||'var(--txt)',maxWidth:200,textAlign:'right',wordBreak:'break-word' }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex',gap:8 }}>
        <button className="bs bfull" onClick={onBack}>← Edit</button>
        <button className="bp bfull" onClick={onSubmit} disabled={busy}>{busy?'Saving…':'✅ Confirm Pickup'}</button>
      </div>
    </div>
  );
}

function Stepper({ step }) {
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <div key={s} style={{ display:'flex',alignItems:'center' }}>
          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
            <div className={`sdot ${i < step ? 'done' : i === step ? 'act' : ''}`}>
              {i < step ? '✓' : i+1}
            </div>
            <div style={{ fontSize:10,color:i===step?'var(--grn)':'var(--t3)',fontWeight:600,marginTop:3 }}>{s}</div>
          </div>
          {i < STEPS.length-1 && <div className={`sline ${i < step ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  );
}

export default function BookingFlow({ toast }) {
  const { user } = useAuth();
  const nav      = useNavigate();
  const [step, setStep] = useState(0);
  const [F,    setF]    = useState({ qty:1, name:user?.name||'', email:user?.email||'', photos:[] });
  const [busy, setBusy] = useState(false);

  const upd = useCallback((key, val) => {
    if (key === '_cond') {
      setF(f => ({ ...f, cv:val.v, clabel:val.label, cmin:val.min, cmax:val.max, cc:val.color }));
    } else {
      setF(f => ({ ...f, [key]: val }));
    }
  }, []);

  const calcR = () => F.cmin ? Math.floor((F.cmin + F.cmax) / 2) * (F.qty || 1) : 0;

  const submit = async () => {
    setBusy(true);
    try {
      await createBooking({
        device:    `${F.icon} ${F.dev}${F.brandModel?' — '+F.brandModel:''}`,
        condition: F.clabel, qty: F.qty||1,
        city: F.city, pincode: F.pin, address: F.addr||'',
        date: F.date, slot: F.slot,
        reward: calcR(),
        user: F.name, phone: F.phone,
        email: F.email || user?.email,
        upi: F.upi||'', notes: F.notes||'',
      });
      toast('🎉 Pickup booked successfully!');
      nav('/dash');
    } catch(e) {
      toast('Booking failed: '+(e.response?.data?.error||e.message), 'err');
    }
    setBusy(false);
  };

  return (
    <div style={{ paddingTop:28 }}>
      <Stepper step={step} />
      <div className="card" style={{ maxWidth:520 }}>
        {step===0 && <Step0 F={F} upd={upd} onNext={()=>setStep(1)} />}
        {step===1 && <Step1 F={F} upd={upd} onNext={()=>setStep(2)} onBack={()=>setStep(0)} toast={toast} />}
        {step===2 && <Step2 F={F} upd={upd} onNext={()=>setStep(3)} onBack={()=>setStep(1)} toast={toast} />}
        {step===3 && <Step3 F={F} onBack={()=>setStep(2)} onSubmit={submit} busy={busy} />}
      </div>
    </div>
  );
}
