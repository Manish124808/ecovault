// src/pages/AIChat.jsx
import { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../services/api';
import PriceEstimatorModal from '../components/modals/PriceEstimatorModal';

const QUICK = [
  '📱 Old iPhone worth?',
  '🛡️ Is my data safe?',
  '📜 E-Waste Rules 2022?',
  '💻 Recycle or resell laptop?',
  '♻️ How recycling works?',
  '💰 How is reward calculated?',
];

export default function AIChat() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: "Hi! I'm EcoBot 🤖\n\nAsk me about:\n• Device recycling values in ₹\n• Data safety & erasure\n• India's E-Waste Rules 2022\n• Booking & tracking pickups\n• UPI reward queries\n\nHow can I help today?",
    source: 'local',
  }]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showEst, setShowEst] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState('unknown'); // 'ok' | 'fallback' | 'badkey'
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    inputRef.current?.focus();

    const newMsgs = [...messages, { role:'user', content:msg }];
    setMessages(newMsgs);
    setLoading(true);

    try {
      const { data } = await chatWithAI(newMsgs.map(m => ({ role:m.role, content:m.content })));
      if (data.source === 'gemini') {
        setGeminiStatus('ok');
      } else {
        // Only show bad-key warning if the error explicitly mentions key/auth issues
        const errMsg = (data.geminiError || '').toLowerCase();
        const isBadKey = errMsg.includes('invalid') || errMsg.includes('api key') || errMsg.includes('permission') || errMsg.includes('not configured');
        setGeminiStatus(isBadKey ? 'badkey' : 'fallback');
      }
      if (data.geminiError) console.warn('[EcoBot] Gemini reason:', data.geminiError);
      const content = data.reply || 'No response.';
      const suffix  = data.rateLimited ? '\n\n⏳ Too many requests — slow down a bit.' : '';
      setMessages(m => [...m, { role:'assistant', content: content + suffix, source: data.source }]);
    } catch(e) {
      const errMsg = e.response?.data?.error || e.message || 'Connection error';
      setGeminiStatus('fallback');
      setMessages(m => [...m, {
        role: 'assistant',
        content: `Couldn't reach the server right now.\n\nMake sure the EcoVault server is running.\n\nError: ${errMsg}`,
        source: 'error',
      }]);
    }
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([{ role:'assistant', content:'Chat cleared! Ask me anything about e-waste. 🌱', source:'local' }]);
    setGeminiStatus('unknown');
  };

  return (
    <div style={{ paddingTop:24 }}>
      {showEst && <PriceEstimatorModal onClose={()=>setShowEst(false)} />}

      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:12,flexWrap:'wrap' }}>
        <div style={{ width:48,height:48,background:'linear-gradient(135deg,#4285f4,#34a853)',borderRadius:14,
          display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,
          boxShadow:'0 0 20px rgba(66,133,244,.3)',flexShrink:0 }}>🤖</div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:18,color:'var(--txt)' }}>EcoBot AI</div>
          <div style={{ color:'var(--t3)',fontSize:12,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' }}>
            {geminiStatus === 'ok'
              ? <><span style={{width:6,height:6,borderRadius:'50%',background:'var(--grn)',display:'inline-block'}} />Powered by Gemini AI</>
              : geminiStatus === 'badkey'
              ? <><span style={{width:6,height:6,borderRadius:'50%',background:'var(--red)',display:'inline-block'}} />API key invalid — update GEMINI_API_KEY in Render</>
              : <><span style={{width:6,height:6,borderRadius:'50%',background:'var(--grn)',display:'inline-block',opacity:.5}} />EcoBot AI Ready</>
            }
          </div>
        </div>
        <div style={{ display:'flex',gap:8,flexShrink:0 }}>
          <button onClick={clearChat}
            style={{ background:'rgba(255,255,255,.06)',border:'1px solid var(--brd)',borderRadius:10,
              padding:'8px 12px',fontWeight:600,fontSize:12,color:'var(--t2)',cursor:'pointer',minHeight:36 }}>
            🗑️ Clear
          </button>
          <button onClick={()=>setShowEst(true)}
            style={{ background:'rgba(16,217,126,.1)',border:'1px solid rgba(16,217,126,.3)',borderRadius:10,
              padding:'8px 12px',fontWeight:700,fontSize:12,color:'var(--grn)',cursor:'pointer',minHeight:36 }}>
            💰 Estimate
          </button>
        </div>
      </div>

      {/* Only show banner when API key is actually invalid — not for normal quota rotation */}
      {geminiStatus === 'badkey' && (
        <div style={{ background:'rgba(240,64,96,.06)',border:'1px solid rgba(240,64,96,.25)',borderRadius:12,
          padding:'10px 14px',color:'var(--red)',fontSize:12,marginBottom:12,lineHeight:1.6 }}>
          ⚠️ Gemini API key is invalid. Go to Render dashboard → Environment → update <code style={{fontSize:10}}>GEMINI_API_KEY</code> with a valid key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{color:'var(--red)'}}>aistudio.google.com</a>.
        </div>
      )}

      <div style={{ background:'rgba(66,133,244,.06)',border:'1px solid rgba(66,133,244,.15)',borderRadius:12,
        padding:'10px 14px',color:'var(--t3)',fontSize:12,marginBottom:14,lineHeight:1.6 }}>
        💡 Ask about device values, data safety, E-Waste Rules 2022, booking or UPI rewards.
      </div>

      {/* Chat window */}
      <div style={{ background:'rgba(13,27,42,.8)',border:'1px solid var(--brd)',borderRadius:20,
        overflow:'hidden',display:'flex',flexDirection:'column' }}>

        {/* Messages */}
        <div style={{ height:360,overflowY:'auto',padding:'14px 12px',display:'flex',flexDirection:'column',gap:8 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              maxWidth:'84%',
              padding:'10px 14px',
              fontSize:14,
              lineHeight:1.65,
              whiteSpace:'pre-wrap',
              wordBreak:'break-word',
              alignSelf:  m.role==='user' ? 'flex-end' : 'flex-start',
              background: m.role==='user'
                ? 'linear-gradient(135deg,#10d97e,#059669)'
                : m.source==='error'
                  ? 'rgba(240,64,96,.08)'
                  : 'rgba(10,22,40,.9)',
              color:      m.role==='user' ? '#021a0e' : m.source==='error' ? 'var(--red)' : 'var(--txt)',
              fontWeight: m.role==='user' ? 600 : 400,
              border:     m.role==='user' ? 'none'
                : m.source==='error'
                  ? '1px solid rgba(240,64,96,.25)'
                  : '1px solid var(--brd)',
              borderRadius: m.role==='user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            }}>
              {m.content}
              {/* Local KB badge */}
              {m.role==='assistant' && m.source==='local' && i > 0 && (
                <div style={{ fontSize:9,color:'var(--t4)',marginTop:6,fontStyle:'italic' }}>
                  📚 local knowledge base
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display:'flex',gap:5,padding:'10px 14px',background:'rgba(10,22,40,.9)',
              border:'1px solid var(--brd)',borderRadius:'16px 16px 16px 4px',
              alignSelf:'flex-start',alignItems:'center' }}>
              {[0,1,2].map(i=>(
                <div key={i} style={{ width:7,height:7,borderRadius:'50%',background:'var(--grn)',
                  animation:`bn .9s ${i*.18}s infinite` }} />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick questions */}
        <div style={{ padding:'8px 10px',display:'flex',gap:6,flexWrap:'wrap',borderTop:'1px solid var(--brd)' }}>
          {QUICK.map(q=>(
            <button key={q} onClick={()=>send(q)} disabled={loading}
              style={{ fontSize:11,padding:'5px 10px',borderRadius:18,background:'rgba(10,22,40,.8)',
                border:'1px solid var(--brd)',color:'var(--t3)',cursor:'pointer',
                fontFamily:"'DM Sans',sans-serif",transition:'border-color .15s',minHeight:28,
                touchAction:'manipulation' }}>
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ display:'flex',gap:8,padding:'10px 12px',borderTop:'1px solid var(--brd)',alignItems:'center' }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
            placeholder="Ask EcoBot anything about e-waste…"
            style={{ flex:1,marginTop:0 }}
          />
          <button className="bp" style={{ padding:'10px 16px',fontSize:13,whiteSpace:'nowrap',flexShrink:0 }}
            onClick={()=>send()} disabled={loading||!input.trim()}>
            Send ↑
          </button>
        </div>
      </div>

      <style>{`@keyframes bn{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}
