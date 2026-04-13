// src/pages/Marketplace.jsx
import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CATS = ['All','Smartphones','Laptops','Tablets','TVs','Cameras','Audio','Gaming','Other'];
const CONDITIONS = ['Like New','Good','Fair','For Parts'];
const CITIES = ['Delhi','Mumbai','Bangalore','Pune','Hyderabad','Chennai','Meerut','Noida','Gurgaon','Lucknow'];
const COND_COLORS = { 'Like New':'#10d97e', 'Good':'#7c6fef', 'Fair':'#f5b731', 'For Parts':'#f04060' };

const BRAND_MODELS = {
  Smartphones: {
    'Samsung':  ['Galaxy S24 Ultra','Galaxy S24+','Galaxy S23','Galaxy A55','Galaxy A35','Galaxy M34'],
    'Apple':    ['iPhone 16 Pro Max','iPhone 16 Pro','iPhone 16','iPhone 15','iPhone 14','iPhone 13','iPhone 12'],
    'OnePlus':  ['OnePlus 12','OnePlus 12R','OnePlus Nord 4','OnePlus Nord CE 4','OnePlus 11'],
    'Xiaomi':   ['Redmi Note 13 Pro+','Redmi Note 13','Poco X6 Pro','Poco F6','Poco M6 Pro'],
    'Realme':   ['Realme GT 6','Realme 13 Pro+','Realme 13 Pro','Realme Narzo 70 Pro'],
    'Vivo':     ['Vivo X100 Pro','Vivo V30 Pro','Vivo V30','Vivo T3 Pro'],
    'OPPO':     ['OPPO Find X7','Reno 12 Pro','Reno 12','OPPO F27 Pro'],
    'Google':   ['Pixel 8 Pro','Pixel 8','Pixel 7a','Pixel 7'],
    'Motorola': ['Edge 50 Pro','Edge 50 Fusion','G85','G64','G54'],
    'Other':    ['Other / Not Listed'],
  },
  Laptops: {
    'Dell':    ['XPS 15','XPS 13','Inspiron 15 3520','Latitude 5540','G15 Gaming'],
    'HP':      ['Spectre x360','Envy 15','Pavilion 15','EliteBook 840','Omen 16'],
    'Lenovo':  ['ThinkPad X1 Carbon','ThinkPad E14','IdeaPad Slim 5','Legion 5i','Yoga 7i'],
    'Apple':   ['MacBook Pro 16" M3','MacBook Pro 14" M3','MacBook Air 15" M3','MacBook Air 13" M2'],
    'Asus':    ['ZenBook 14','VivoBook 15','ROG Strix G15','TUF Gaming A15'],
    'Acer':    ['Swift X','Aspire 5','Nitro V 15','Predator Helios 16'],
    'Other':   ['Other / Not Listed'],
  },
  Tablets: {
    'Apple':   ['iPad Pro 13" M4','iPad Pro 11" M4','iPad Air 13" M2','iPad Air 11" M2','iPad mini 7','iPad 10th Gen'],
    'Samsung': ['Galaxy Tab S9 Ultra','Galaxy Tab S9+','Galaxy Tab S9','Galaxy Tab A9+'],
    'Xiaomi':  ['Pad 6 Pro','Pad 6','Redmi Pad SE'],
    'Realme':  ['Realme Pad 2','Realme Pad X'],
    'Lenovo':  ['Tab P12 Pro','Tab P11 Pro Gen 2','Tab M10 Plus'],
    'Other':   ['Other / Not Listed'],
  },
  TVs: {
    'Samsung': ['Neo QLED 8K','Neo QLED 4K QN90D','OLED S95D','Crystal 4K CU8000','The Frame'],
    'LG':      ['OLED C4','OLED G4','QNED86','UT80 4K UHD'],
    'Sony':    ['Bravia 9 QLED','Bravia 7','X90L 4K','X80L 4K'],
    'TCL':     ['C845 QD-Mini LED','P745 4K','P635 4K'],
    'Xiaomi':  ['Xiaomi TV A 55"','Xiaomi TV X 43"','Xiaomi TV 5X'],
    'OnePlus': ['OnePlus TV Q2 Pro','OnePlus TV 65 Y1S Pro'],
    'Other':   ['Other / Not Listed'],
  },
  Cameras: {
    'Canon':    ['EOS R8','EOS R50','EOS 90D','PowerShot G7 X III'],
    'Nikon':    ['Z30','Z50 II','Z5 II','D7500','Coolpix P950'],
    'Sony':     ['Alpha ZV-E10 II','Alpha A7 IV','Alpha A6700','ZV-1 II'],
    'Fujifilm': ['X-T50','X-S20','X-E4','Instax Mini 12'],
    'GoPro':    ['GoPro Hero 13','Hero 12','Hero 11'],
    'Other':    ['Other / Not Listed'],
  },
  Audio: {
    'Sony':        ['WH-1000XM5','WF-1000XM5','LinkBuds S','SRS-XB43'],
    'Bose':        ['QuietComfort 45','QC Earbuds II','SoundLink Flex'],
    'JBL':         ['Flip 6','Charge 5','Xtreme 3','Tune 770NC'],
    'Samsung':     ['Galaxy Buds3 Pro','Galaxy Buds3','Galaxy Buds FE'],
    'Apple':       ['AirPods Pro 2','AirPods 4','AirPods Max'],
    'boAt':        ['Airdopes 141','Rockerz 450','Stone 650'],
    'Noise':       ['Buds Connect 2','Shots X5 Pro','Twist Go'],
    'Other':       ['Other / Not Listed'],
  },
  Gaming: {
    'Sony':      ['PlayStation 5','PlayStation 5 Slim','PlayStation 4 Pro','PlayStation 4 Slim'],
    'Microsoft': ['Xbox Series X','Xbox Series S','Xbox One X','Xbox One S'],
    'Nintendo':  ['Switch OLED','Switch Lite','Nintendo Switch'],
    'Valve':     ['Steam Deck OLED','Steam Deck 512GB'],
    'Other':     ['Other / Not Listed'],
  },
};

const CAT_IMGS = {
  Smartphones: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=80&q=60&auto=format&fit=crop',
  Laptops:     'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=80&q=60&auto=format&fit=crop',
  Tablets:     'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=80&q=60&auto=format&fit=crop',
  TVs:         'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=80&q=60&auto=format&fit=crop',
  Cameras:     'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=80&q=60&auto=format&fit=crop',
  Audio:       'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=60&auto=format&fit=crop',
  Gaming:      'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=80&q=60&auto=format&fit=crop',
  Other:       'https://images.unsplash.com/photo-1518770660439-4636190af475?w=80&q=60&auto=format&fit=crop',
};

const BANNER_IMG = 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=900&q=70&auto=format&fit=crop';

const LISTINGS = [
  { _id:'1', title:'Samsung Galaxy S21 5G', cat:'Smartphones', price:8500,  condition:'Good',    city:'Delhi',     desc:'Minor scratches on back glass, battery 87%, all accessories included. IMEI clean.', seller:'Rahul M.', icon:'📱', ts:Date.now()-86400000*2, brand:'Samsung', model:'Galaxy S21' },
  { _id:'2', title:'Dell Latitude 5520',    cat:'Laptops',     price:22000, condition:'Like New', city:'Bangalore', desc:'i5 11th gen, 16GB RAM, 512GB SSD. Used 3 months, warranty valid till Dec 25.',    seller:'Priya S.', icon:'💻', ts:Date.now()-86400000*1, brand:'Dell',    model:'Latitude 5520' },
  { _id:'3', title:'Sony Bravia 43" LED',   cat:'TVs',         price:12000, condition:'Good',    city:'Mumbai',    desc:'Full HD, 2 HDMI, 2 USB. Remote included. Works perfectly, bought 2021.',           seller:'Amit K.',  icon:'📺', ts:Date.now()-86400000*3 },
  { _id:'4', title:'Canon EOS 200D Kit',    cat:'Cameras',     price:18500, condition:'Like New', city:'Pune',     desc:'18-55mm lens, 2 batteries, charger, original bag. Barely used.',                   seller:'Neha R.',  icon:'📷', ts:Date.now()-86400000*5 },
  { _id:'5', title:'JBL Flip 5 Speaker',    cat:'Audio',       price:2800,  condition:'Good',    city:'Hyderabad', desc:'Minor scratch on bottom, sounds perfect, charges fully.',                          seller:'Vikram D.',icon:'🔊', ts:Date.now()-86400000*4 },
  { _id:'6', title:'iPad Air 4th Gen 64GB', cat:'Tablets',     price:35000, condition:'Like New', city:'Chennai',  desc:'WiFi only, Space Grey. Used 6 months, original box, Apple Pencil compatible.',     seller:'Sneha P.', icon:'📱', ts:Date.now()-86400000*1 },
  { _id:'7', title:'PlayStation 4 Slim',    cat:'Gaming',      price:9500,  condition:'Fair',    city:'Noida',     desc:'500GB, 2 controllers, 5 games. Some scratches on shell.',                          seller:'Arjun T.', icon:'🎮', ts:Date.now()-86400000*6 },
  { _id:'8', title:'ThinkPad X1 Carbon',    cat:'Laptops',     price:31000, condition:'Good',    city:'Gurgaon',   desc:'i7 8th gen, 16GB, 256GB SSD. Business laptop, great condition, no dents.',          seller:'Manish G.',icon:'💻', ts:Date.now()-86400000*2 },
  { _id:'9', title:'OnePlus 9 Pro',          cat:'Smartphones', price:14000, condition:'Good',   city:'Meerut',    desc:'8GB/128GB, Hasselblad camera. Minor use marks, original charger included.',          seller:'Ravi P.',  icon:'📱', ts:Date.now()-86400000*3 },
];

// ── Shared Image Upload ───────────────────────────────────────────
function ImageUpload({ images, onChange, max = 4 }) {
  const inputRef = useRef(null);
  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const toAdd = files.slice(0, max - images.length).filter(f => f.type.startsWith('image/'));
    const readers = toAdd.map(file => new Promise(resolve => {
      const r = new FileReader();
      r.onload = ev => resolve({ url: ev.target.result, name: file.name });
      r.readAsDataURL(file);
    }));
    Promise.all(readers).then(newImgs => onChange([...images, ...newImgs]));
    e.target.value = '';
  };
  const remove = (idx) => onChange(images.filter((_,i) => i !== idx));
  return (
    <div style={{ marginBottom:12 }}>
      <label className="lbl">Photos (max {max}) <span style={{color:'var(--t3)',fontWeight:400}}>— helps sell faster!</span></label>
      <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginTop:6 }}>
        {images.map((img,i) => (
          <div key={i} style={{ position:'relative',width:68,height:68,borderRadius:10,overflow:'hidden',
            border:'1px solid var(--brd)',flexShrink:0 }}>
            <img src={img.url} alt={img.name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
            <button onClick={()=>remove(i)}
              style={{ position:'absolute',top:2,right:2,width:17,height:17,borderRadius:'50%',
                background:'rgba(240,64,96,.92)',color:'#fff',border:'none',fontSize:11,
                fontWeight:900,cursor:'pointer',padding:0,lineHeight:'17px',textAlign:'center' }}>×</button>
          </div>
        ))}
        {images.length < max && (
          <button onClick={()=>inputRef.current?.click()}
            style={{ width:68,height:68,borderRadius:10,border:'2px dashed var(--brd2)',
              background:'rgba(13,27,42,.5)',color:'var(--t3)',fontSize:10,fontWeight:600,
              cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',
              justifyContent:'center',gap:3,transition:'all .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--grn)';e.currentTarget.style.color='var(--grn)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--brd2)';e.currentTarget.style.color='var(--t3)';}}>
            <span style={{fontSize:22}}>📷</span><span>Photo</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={handleFiles} />
    </div>
  );
}

// ── Brand/Model Picker ────────────────────────────────────────────
function BrandModelPicker({ category, brand, model, onBrand, onModel }) {
  const brands = BRAND_MODELS[category] || {};
  const brandList = Object.keys(brands);
  if (!brandList.length) return null;
  const models = brand ? (brands[brand] || []) : [];
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:10}}>
      <div>
        <label className="lbl">Brand</label>
        <select value={brand} onChange={e=>{onBrand(e.target.value);onModel('');}}>
          <option value="">-- Brand --</option>
          {brandList.map(b=><option key={b}>{b}</option>)}
        </select>
      </div>
      <div>
        <label className="lbl">Model</label>
        <select value={model} onChange={e=>onModel(e.target.value)} disabled={!brand}>
          <option value="">-- Model --</option>
          {models.map(m=><option key={m}>{m}</option>)}
        </select>
      </div>
    </div>
  );
}

// ── Listing Card ─────────────────────────────────────────────────
function ListingCard({ listing, onContact }) {
  const c = COND_COLORS[listing.condition] || '#5a7898';
  const daysAgo = Math.floor((Date.now()-listing.ts)/86400000);
  return (
    <div className="bcard mkt-card" style={{cursor:'default'}}>
      <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
        <div style={{width:60,height:60,borderRadius:12,overflow:'hidden',flexShrink:0,
          border:'1px solid var(--brd)',background:'rgba(13,27,42,.8)'}}>
          {listing.photos?.[0]
            ? <img src={listing.photos[0].url} alt="listing" style={{width:'100%',height:'100%',objectFit:'cover'}} />
            : CAT_IMGS[listing.cat]
              ? <img src={CAT_IMGS[listing.cat]} alt={listing.cat} style={{width:'100%',height:'100%',objectFit:'cover',opacity:.8}} />
              : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>{listing.icon}</div>
          }
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:14,color:'var(--txt)',marginBottom:2}}>{listing.title}</div>
          {(listing.brand||listing.model) && (
            <div style={{color:'var(--pur2)',fontSize:11,marginBottom:3,fontWeight:600}}>
              {[listing.brand,listing.model].filter(Boolean).join(' · ')}
            </div>
          )}
          <div style={{color:'var(--t3)',fontSize:11,marginBottom:6}}>
            📍 {listing.city} · {listing.cat} · {daysAgo===0?'Today':daysAgo+'d ago'}
          </div>
          <p style={{color:'var(--t2)',fontSize:12,lineHeight:1.5,margin:'0 0 8px',maxWidth:400}}>{listing.desc}</p>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span style={{fontSize:11,padding:'3px 9px',borderRadius:20,fontWeight:700,
              background:`${c}22`,color:c,border:`1px solid ${c}33`}}>{listing.condition}</span>
            <span style={{color:'var(--t4)',fontSize:11}}>👤 {listing.seller}</span>
            {listing.photos?.length > 0 && (
              <span style={{color:'var(--t3)',fontSize:11}}>📷 {listing.photos.length} photo{listing.photos.length>1?'s':''}</span>
            )}
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8,flexShrink:0}}>
          <div style={{color:'var(--grn)',fontWeight:900,fontSize:18,fontFamily:"'DM Sans',sans-serif",whiteSpace:'nowrap'}}>
            ₹{listing.price.toLocaleString('en-IN')}
          </div>
          <button className="bp" style={{padding:'7px 14px',fontSize:12}} onClick={()=>onContact(listing)}>
            Contact
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sell Modal ────────────────────────────────────────────────────
function SellModal({ onClose, toast }) {
  const [F, setF] = useState({ title:'', cat:'Smartphones', price:'', condition:'Good', city:'', desc:'', brand:'', model:'', photos:[] });
  const upd = (k,v) => setF(f=>({...f,[k]:v}));
  const submit = () => {
    if (!F.title||!F.price||!F.city||!F.desc) { toast('Please fill all required fields','err'); return; }
    toast('🎉 Listing posted successfully!');
    onClose();
  };
  return (
    <div className="overlay">
      <div className="modal" style={{maxWidth:520,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:18,marginBottom:4}}>📦 Post a Listing</div>
        <p style={{color:'var(--t3)',fontSize:12,marginBottom:14}}>Sell your used device to someone who needs it.</p>

        <label className="lbl">Title <span style={{color:'var(--red)'}}>*</span></label>
        <input placeholder="e.g. Samsung Galaxy S21 128GB Blue" value={F.title} onChange={e=>upd('title',e.target.value)} />

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:12}}>
          <div>
            <label className="lbl">Category</label>
            <select value={F.cat} onChange={e=>upd('cat',e.target.value)}>
              {CATS.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="lbl">Condition</label>
            <select value={F.condition} onChange={e=>upd('condition',e.target.value)}>
              {CONDITIONS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Brand/Model */}
        <BrandModelPicker
          category={F.cat}
          brand={F.brand} model={F.model}
          onBrand={v=>upd('brand',v)} onModel={v=>upd('model',v)}
        />
        {F.model==='Other / Not Listed' && (
          <input placeholder="Enter your model name" value={F.customModel||''} onChange={e=>upd('customModel',e.target.value)} style={{marginTop:8}} />
        )}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:12}}>
          <div>
            <label className="lbl">Price (₹) <span style={{color:'var(--red)'}}>*</span></label>
            <input type="number" min="1" placeholder="0" value={F.price} onChange={e=>upd('price',e.target.value)} />
          </div>
          <div>
            <label className="lbl">City <span style={{color:'var(--red)'}}>*</span></label>
            <select value={F.city} onChange={e=>upd('city',e.target.value)}>
              <option value="">Select city</option>
              {CITIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <label className="lbl mt">Description <span style={{color:'var(--red)'}}>*</span></label>
        <textarea style={{height:72}} placeholder="Describe condition, what's included, any defects…" value={F.desc} onChange={e=>upd('desc',e.target.value)} />

        {/* Image Upload */}
        <div style={{marginTop:12}}>
          <ImageUpload images={F.photos} onChange={v=>upd('photos',v)} max={4} />
        </div>

        <div className="ibox" style={{marginTop:6}}>
          💡 Honest listings sell faster. Mention battery health, scratches, missing accessories. Adding photos gets 3× more responses!
        </div>
        <div className="btnrow" style={{marginTop:14}}>
          <button className="bs bfull" onClick={onClose}>Cancel</button>
          <button className="bp bfull" onClick={submit}>📦 Post Listing</button>
        </div>
      </div>
    </div>
  );
}

// ── Contact Modal ─────────────────────────────────────────────────
function ContactModal({ listing, onClose, toast }) {
  const { user } = useAuth();
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = listing.photos || [];
  return (
    <div className="overlay">
      <div className="modal" style={{maxWidth:420}}>
        <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:17,marginBottom:2}}>{listing.title}</div>
        <div style={{color:'var(--t3)',fontSize:12,marginBottom:14}}>Listed by {listing.seller} · 📍 {listing.city}</div>

        {/* Photos or fallback */}
        <div style={{height:130,borderRadius:14,overflow:'hidden',marginBottom:14,border:'1px solid var(--brd)',position:'relative'}}>
          {photos.length > 0 ? (
            <>
              <img src={photos[photoIdx].url} alt="listing"
                style={{width:'100%',height:'100%',objectFit:'cover'}} />
              {photos.length > 1 && (
                <div style={{position:'absolute',bottom:8,left:0,right:0,display:'flex',justifyContent:'center',gap:5}}>
                  {photos.map((_,i)=>(
                    <button key={i} onClick={()=>setPhotoIdx(i)}
                      style={{width:7,height:7,borderRadius:'50%',border:'none',cursor:'pointer',padding:0,
                        background:i===photoIdx?'var(--grn)':'rgba(255,255,255,.4)'}} />
                  ))}
                </div>
              )}
            </>
          ) : CAT_IMGS[listing.cat] ? (
            <img src={CAT_IMGS[listing.cat]} alt={listing.cat}
              style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(.7)'}} />
          ) : (
            <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,background:'var(--bg2)'}}>
              {listing.icon}
            </div>
          )}
        </div>

        <div style={{background:'rgba(16,217,126,.07)',border:'1px solid rgba(16,217,126,.2)',
          borderRadius:14,padding:14,marginBottom:14,textAlign:'center'}}>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:28,fontWeight:900,color:'var(--grn)'}}>
            ₹{listing.price.toLocaleString('en-IN')}
          </div>
          <div style={{color:'var(--t3)',fontSize:12,marginTop:2}}>{listing.condition} condition</div>
        </div>

        <div style={{fontSize:13,color:'var(--t2)',lineHeight:1.6,marginBottom:14}}>{listing.desc}</div>

        <div style={{background:'rgba(13,27,42,.8)',border:'1px solid var(--brd)',borderRadius:12,padding:'12px 14px',marginBottom:14}}>
          <div style={{fontSize:11,color:'var(--t3)',fontWeight:700,textTransform:'uppercase',letterSpacing:.5,marginBottom:6}}>Buying Tips</div>
          <div style={{fontSize:12,color:'var(--t2)',lineHeight:1.7}}>
            🤝 Meet in a public place for the handover.<br/>
            🔍 Inspect the device before paying.<br/>
            ✅ Ask for original invoice if available.
          </div>
        </div>

        {!user && (
          <div style={{background:'rgba(124,111,239,.08)',border:'1px solid rgba(124,111,239,.25)',
            borderRadius:10,padding:'10px 12px',fontSize:12,color:'var(--pur2)',marginBottom:12}}>
            🔐 Login to message this seller
          </div>
        )}
        <div style={{display:'flex',gap:8}}>
          <button className="bs bfull" onClick={onClose}>Close</button>
          {user && (
            <button className="bp bfull" onClick={()=>{toast('📧 Message sent to seller!');onClose();}}>
              📧 Message Seller
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Marketplace({ toast }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [cat, setCat]     = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showSell, setShowSell] = useState(false);
  const [contact, setContact]   = useState(null);
  const [listings, setListings] = useState(LISTINGS);

  const filtered = listings
    .filter(l => cat==='All' || l.cat===cat)
    .filter(l => !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.city.toLowerCase().includes(search.toLowerCase()) || l.cat.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => sortBy==='newest'?b.ts-a.ts : sortBy==='price_low'?a.price-b.price : b.price-a.price);

  return (
    <div style={{paddingTop:28}}>
      {showSell && <SellModal onClose={()=>setShowSell(false)} toast={toast} />}
      {contact  && <ContactModal listing={contact} onClose={()=>setContact(null)} toast={toast} />}

      {/* Hero */}
      <div style={{position:'relative',borderRadius:22,overflow:'hidden',marginBottom:28,height:160}}>
        <img src={BANNER_IMG} alt="Marketplace" style={{width:'100%',height:'100%',objectFit:'cover',filter:'brightness(.3) saturate(.6)'}} />
        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,rgba(2,9,23,.8),rgba(16,217,126,.06))',
          display:'flex',alignItems:'center',padding:'0 28px',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <h2 style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:'clamp(20px,4vw,28px)',margin:'0 0 6px',color:'var(--txt)'}}>🛒 Marketplace</h2>
            <p style={{color:'var(--t2)',fontSize:13,margin:0}}>Buy &amp; sell refurbished electronics — give devices a second life</p>
          </div>
          <button className="bp" style={{padding:'11px 22px',fontSize:13}} onClick={()=>user?setShowSell(true):nav('/login')}>
            + Sell Your Device
          </button>
        </div>
      </div>

      {/* Search + Sort */}
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <input placeholder="🔍 Search devices, brands or cities…" value={search}
          onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:180}} />
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{width:'auto',minWidth:150}}>
          <option value="newest">Newest First</option>
          <option value="price_low">Price: Low → High</option>
          <option value="price_high">Price: High → Low</option>
        </select>
      </div>

      {/* Category pills */}
      <div className="filters" style={{marginBottom:18}}>
        {CATS.map(c=>(
          <button key={c} className={`fbtn ${cat===c?'on':''}`} onClick={()=>setCat(c)}>{c}</button>
        ))}
      </div>

      {/* Stats */}
      <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:20}}>
        {[['📦',listings.length+'+','Active Listings'],['🏙️','10+','Cities'],['✅','100%','Verified Sellers'],['♻️','Eco','Circular Economy']].map(([ic,v,l])=>(
          <div key={l} style={{background:'rgba(13,27,42,.6)',border:'1px solid var(--brd)',borderRadius:12,
            padding:'10px 14px',display:'flex',alignItems:'center',gap:8,flex:1,minWidth:110}}>
            <span style={{fontSize:18}}>{ic}</span>
            <div>
              <div style={{color:'var(--grn)',fontWeight:800,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>{v}</div>
              <div style={{color:'var(--t3)',fontSize:10,textTransform:'uppercase',letterSpacing:.4}}>{l}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{color:'var(--t3)',fontSize:12,marginBottom:10}}>{filtered.length} listing{filtered.length!==1?'s':''} found</div>
      {filtered.length===0
        ? <div className="empty">No listings found. Try a different filter or search.</div>
        : filtered.map(l=><ListingCard key={l._id} listing={l} onContact={setContact} />)
      }

      <div style={{background:'linear-gradient(135deg,rgba(13,27,42,.9),rgba(26,39,68,.9))',
        border:'1px solid rgba(16,217,126,.18)',borderRadius:20,padding:'22px 24px',marginTop:24,
        display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
        <div style={{width:48,height:48,borderRadius:14,background:'rgba(16,217,126,.12)',
          border:'1px solid rgba(16,217,126,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26}}>♻️</div>
        <div style={{flex:1,minWidth:160}}>
          <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>Can't find a buyer?</div>
          <div style={{color:'var(--t3)',fontSize:13}}>We'll recycle it responsibly and still pay you a reward.</div>
        </div>
        <button className="bp" style={{padding:'11px 22px',fontSize:13,whiteSpace:'nowrap'}} onClick={()=>nav('/book')}>
          📦 Book Free Pickup
        </button>
      </div>
    </div>
  );
}
