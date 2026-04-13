// src/components/Loader.jsx
export default function Loader({ text = 'Loading…' }) {
  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,minHeight:'40vh' }}>
      <div className="spin" />
      <p style={{ color:'var(--t3)',fontSize:13 }}>{text}</p>
    </div>
  );
}
