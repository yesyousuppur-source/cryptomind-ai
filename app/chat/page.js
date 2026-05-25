"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const SUGGESTIONS = [
  "BTC price abhi kya hai?",
  "ETH buy karein ya wait?",
  "SOL aur APT mein kaunsa better hai?",
  "Crypto tax India mein kaise lagta hai?",
  "DCA strategy kya hoti hai?",
  "Market abhi bull hai ya bear?",
  "PEPE safe hai invest karne ke liye?",
  "Stop loss kaise set karein?",
];

function TypingDots() {
  return (
    <div style={{display:"flex",gap:5,alignItems:"center",padding:"12px 16px",
      background:"#fff",borderRadius:"18px 18px 18px 4px",
      border:"1px solid #e2e8f0",width:"fit-content"}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{
          width:7,height:7,borderRadius:"50%",background:"#10b981",
          animation:`bounce 1.2s ${i*0.2}s infinite ease-in-out`}}/>
      ))}
      <style>{`
        @keyframes bounce{0%,80%,100%{transform:scale(0.8);opacity:.5}40%{transform:scale(1.2);opacity:1}}
      `}</style>
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display:"flex",
      justifyContent:isUser?"flex-end":"flex-start",
      marginBottom:12,
      alignItems:"flex-end",
      gap:8,
    }}>
      {!isUser && (
        <div style={{
          width:32,height:32,borderRadius:"50%",
          background:"linear-gradient(135deg,#10b981,#059669)",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:14,flexShrink:0,marginBottom:2,
          boxShadow:"0 2px 8px rgba(16,185,129,.3)"
        }}>
          🤖
        </div>
      )}
      <div style={{
        maxWidth:"80%",
        background:isUser?"linear-gradient(135deg,#10b981,#059669)":"#fff",
        color:isUser?"#fff":"#0f172a",
        borderRadius:isUser?"18px 18px 4px 18px":"18px 18px 18px 4px",
        padding:"12px 16px",
        fontSize:14,
        lineHeight:1.7,
        boxShadow:"0 2px 12px rgba(0,0,0,0.06)",
        border:isUser?"none":"1px solid #e2e8f0",
        whiteSpace:"pre-wrap",
        wordBreak:"break-word",
      }}>
        {msg.content}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Namaste! 🙏 Main YYP AI hoon — tumhara crypto research assistant.\n\nMere paas live Binance market data hai. Kuch bhi pucho:\n• Koi bhi coin ka live price\n• Market analysis\n• Crypto education\n• Investment strategy\n\nKya jaanna chahte ho? 👇"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveData, setLiveData] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");

    const newMessages = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await r.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      if (data.marketData) setLiveData(data.marketData);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, network issue aayi. Dobara try karo! 🙏"
      }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Namaste! 🙏 Main YYP AI hoon — tumhara crypto research assistant.\n\nMere paas live Binance market data hai. Kuch bhi pucho:\n• Koi bhi coin ka live price\n• Market analysis\n• Crypto education\n• Investment strategy\n\nKya jaanna chahte ho? 👇"
    }]);
    setLiveData(null);
  };

  return (
    <main style={{
      fontFamily:"'Inter',sans-serif",
      background:"#f0fdf8",
      minHeight:"100vh",
      display:"flex",
      flexDirection:"column",
      maxWidth:700,
      margin:"0 auto",
    }}>

      {/* Header */}
      <div style={{
        background:"linear-gradient(135deg,#0f172a,#1e3a2f)",
        padding:"14px 16px",
        borderBottom:"2px solid #10b981",
        position:"sticky",top:0,zIndex:10,
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Link href="/" style={{color:"#6ee7b7",fontSize:13,fontWeight:600,textDecoration:"none"}}>
              ← Home
            </Link>
            <div style={{width:1,height:16,background:"rgba(255,255,255,.2)"}}/>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{
                width:36,height:36,borderRadius:"50%",
                background:"linear-gradient(135deg,#10b981,#059669)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
              }}>🤖</div>
              <div>
                <div style={{fontWeight:800,fontSize:14,color:"#fff"}}>YYP AI Chat</div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:"#10b981"}}/>
                  <span style={{fontSize:10,color:"#6ee7b7",fontWeight:600}}>
                    Live Binance Data
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={clearChat} style={{
            background:"rgba(255,255,255,.08)",
            border:"1px solid rgba(255,255,255,.15)",
            borderRadius:20,padding:"5px 12px",
            fontSize:11,color:"rgba(255,255,255,.6)",
            cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600,
          }}>
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Live ticker strip */}
      {liveData && (
        <div style={{
          background:"#0f172a",padding:"6px 12px",
          display:"flex",gap:12,overflowX:"auto",
          scrollbarWidth:"none",
        }}>
          {liveData.slice(0,6).map(c=>(
            <div key={c.symbol} style={{
              display:"flex",alignItems:"center",gap:6,flexShrink:0,
              fontSize:10,fontFamily:"'JetBrains Mono',monospace",
            }}>
              <span style={{color:"#94a3b8",fontWeight:600}}>{c.symbol}</span>
              <span style={{color:"#fff",fontWeight:700}}>${c.price}</span>
              <span style={{color:parseFloat(c.ch24)>=0?"#10b981":"#ef4444",fontWeight:700}}>
                {parseFloat(c.ch24)>=0?"▲":"▼"}{Math.abs(parseFloat(c.ch24))}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        background:"#fffbeb",borderBottom:"1px solid #fde68a",
        padding:"7px 14px",fontSize:10,color:"#92400e",
        display:"flex",alignItems:"center",gap:6,
      }}>
        ⚠️ <span>Educational tool only — Not financial advice. DYOR before investing.</span>
      </div>

      {/* Chat messages */}
      <div style={{
        flex:1,padding:"16px",
        overflowY:"auto",
        minHeight:0,
        paddingBottom:140,
      }}>
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}
        {loading && (
          <div style={{display:"flex",alignItems:"flex-end",gap:8,marginBottom:12}}>
            <div style={{
              width:32,height:32,borderRadius:"50%",
              background:"linear-gradient(135deg,#10b981,#059669)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,
            }}>🤖</div>
            <TypingDots/>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Bottom input area */}
      <div style={{
        position:"fixed",bottom:60,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:700,
        background:"#f0fdf8",
        borderTop:"1px solid #e2e8f0",
        padding:"10px 12px",
        zIndex:10,
      }}>
        {/* Suggestions — show only at start */}
        {messages.length <= 2 && (
          <div style={{
            display:"flex",gap:6,overflowX:"auto",
            marginBottom:10,scrollbarWidth:"none",
            paddingBottom:2,
          }}>
            {SUGGESTIONS.slice(0,5).map((s,i) => (
              <button key={i} onClick={() => send(s)}
                style={{
                  background:"#fff",border:"1px solid #e2e8f0",
                  borderRadius:20,padding:"6px 12px",fontSize:11,
                  color:"#475569",cursor:"pointer",whiteSpace:"nowrap",
                  fontFamily:"'Inter',sans-serif",fontWeight:600,
                  flexShrink:0,
                }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input box */}
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{
              if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}
            }}
            placeholder="Kuch bhi pucho — BTC price, SOL analysis, DCA guide..."
            rows={1}
            style={{
              flex:1,
              background:"#fff",
              border:"2px solid #e2e8f0",
              borderRadius:14,
              padding:"12px 14px",
              fontSize:14,
              fontFamily:"'Inter',sans-serif",
              color:"#0f172a",
              resize:"none",
              outline:"none",
              lineHeight:1.5,
              maxHeight:120,
              overflowY:"auto",
              boxSizing:"border-box",
            }}
            onFocus={e=>e.target.style.borderColor="#10b981"}
            onBlur={e=>e.target.style.borderColor="#e2e8f0"}
          />
          <button
            onClick={()=>send()}
            disabled={!input.trim()||loading}
            style={{
              width:46,height:46,borderRadius:"50%",
              background:input.trim()&&!loading
                ?"linear-gradient(135deg,#10b981,#059669)"
                :"#e2e8f0",
              border:"none",cursor:input.trim()&&!loading?"pointer":"default",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:20,flexShrink:0,
              boxShadow:input.trim()&&!loading?"0 4px 12px rgba(16,185,129,.4)":"none",
              transition:"all .2s",
            }}>
            {loading ? "⟳" : "➤"}
          </button>
        </div>
        <div style={{fontSize:9,color:"#94a3b8",textAlign:"center",marginTop:5}}>
          Enter dabo ya button click karo • Shift+Enter = new line
        </div>
      </div>
    </main>
  );
}
