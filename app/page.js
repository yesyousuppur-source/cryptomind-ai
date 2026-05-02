"use client";

import { useState, useRef, useEffect } from "react";
import { calcRSI, calcMA, buildDecision } from "../lib/indicators";
import { INPUT_MAP, FULL_NAME, DECISION_CONFIG, MOOD_CONFIG, fmt, fmtBig } from "../lib/constants";

function detectScam({ ch24, ch7d, volume, marketCap, rsi }) {
  let pts = 0; const flags = [];
  if (ch24 > 50)    { pts+=3; flags.push(`Extreme 24h pump (+${ch24.toFixed(0)}%)`); }
  else if (ch24>30) { pts+=2; flags.push(`Suspicious surge (+${ch24.toFixed(0)}%)`); }
  if (ch7d > 200)   { pts+=3; flags.push(`Massive 7d pump (+${ch7d.toFixed(0)}%)`); }
  else if (ch7d>80) { pts+=2; flags.push(`Very high 7d gain (+${ch7d.toFixed(0)}%)`); }
  if (marketCap>0 && marketCap<50_000_000 && volume>marketCap*0.4)
    { pts+=3; flags.push("Volume >> Market Cap"); }
  if (rsi && parseFloat(rsi)>88) { pts+=2; flags.push(`RSI overbought (${rsi})`); }
  if (marketCap>0 && marketCap<1_000_000) { pts+=2; flags.push("Very low market cap"); }
  let verdict,color,emoji,bg,border;
  if      (pts>=5) { verdict="HIGH RISK"; color="#dc2626"; emoji="🚨"; bg="linear-gradient(135deg,#fff1f2,#fee2e2)"; border="#fca5a5"; }
  else if (pts>=3) { verdict="SUSPICIOUS"; color="#d97706"; emoji="⚠️"; bg="linear-gradient(135deg,#fffbeb,#fef3c7)"; border="#fde68a"; }
  else             { verdict="Looks Safe";  color="#059669"; emoji="✅"; bg="linear-gradient(135deg,#f0fdf4,#dcfce7)"; border="#86efac"; }
  return { verdict,color,emoji,flags,pts,bg,border };
}

const FG_CFG = [
  { max:25,  label:"Extreme Fear",  color:"#dc2626", emoji:"😱", bg:"#fef2f2" },
  { max:45,  label:"Fear",          color:"#f87171", emoji:"😨", bg:"#fff1f2" },
  { max:55,  label:"Neutral",       color:"#d97706", emoji:"⚖️", bg:"#fffbeb" },
  { max:75,  label:"Greed",         color:"#059669", emoji:"😏", bg:"#f0fdf4" },
  { max:100, label:"Extreme Greed", color:"#10b981", emoji:"🤑", bg:"#ecfdf5" },
];
const getFG = (v) => FG_CFG.find((c) => v <= c.max) || FG_CFG[4];

const DC_PREMIUM = {
  BUY:  { bg:"linear-gradient(135deg,#ecfdf5,#d1fae5)", border:"#10b981", text:"#065f46", glow:"0 8px 32px rgba(16,185,129,.25)", label:"🟢 BUY",  accent:"#10b981" },
  SELL: { bg:"linear-gradient(135deg,#fff1f2,#fee2e2)", border:"#ef4444", text:"#991b1b", glow:"0 8px 32px rgba(239,68,68,.2)",   label:"🔴 SELL", accent:"#ef4444" },
  HOLD: { bg:"linear-gradient(135deg,#eef2ff,#e0e7ff)", border:"#6366f1", text:"#3730a3", glow:"0 8px 32px rgba(99,102,241,.2)",  label:"🔵 HOLD", accent:"#6366f1" },
  WAIT: { bg:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"#f59e0b", text:"#92400e", glow:"0 8px 32px rgba(245,158,11,.2)",  label:"🟡 WAIT", accent:"#f59e0b" },
};

export default function Home() {
  const [query,setQuery]           = useState("");
  const [loading,setLoading]       = useState(false);
  const [error,setError]           = useState(null);
  const [result,setResult]         = useState(null);
  const [aiText,setAiText]         = useState("");
  const [aiLoading,setAiLoading]   = useState(false);
  const [lossAmt,setLossAmt]       = useState("");
  const [investAmt,setInvestAmt]   = useState("");
  const [fg,setFg]                 = useState(null);
  const [budgetAmt,setBudgetAmt]   = useState("");
  const [budgetCur,setBudgetCur]   = useState("INR");
  const [budgetText,setBudgetText] = useState("");
  const [budgetLoad,setBudgetLoad] = useState(false);
  const [scamInfo,setScamInfo]     = useState(null);
  const [scamText,setScamText]     = useState("");
  const [scamLoad,setScamLoad]     = useState(false);
  const cache = useRef({});

  useEffect(() => {
    fetch("/api/feargreed").then(r=>r.json()).then(setFg).catch(()=>setFg({value:50}));
  }, []);

  const analyze = async () => {
    const raw = query.trim().toLowerCase(); if(!raw) return;
    const sym = INPUT_MAP[raw] || raw.toUpperCase();
    setError(null); setAiText(""); setResult(null); setScamInfo(null); setScamText("");
    const now = Date.now();
    if(cache.current[sym] && now-cache.current[sym].ts<60000){
      const d=cache.current[sym].data; setResult(d); setScamInfo(detectScam(d)); callAI(d); return;
    }
    setLoading(true);
    try {
      const [tickR,klinesR] = await Promise.all([
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`),
        fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=1d&limit=200`),
      ]);
      if(!tickR.ok) throw new Error(`"${sym}" not found. Try: BTC, ETH, SOL, APT, DOGE…`);
      const tick=await tickR.json(); const klines=klinesR.ok?await klinesR.json():[];
      const price=parseFloat(tick.lastPrice), ch24=parseFloat(tick.priceChangePercent), volume=parseFloat(tick.quoteVolume);
      const closes=klines.map(k=>parseFloat(k[4]));
      const ch7d=closes.length>=8?((closes[closes.length-1]-closes[closes.length-8])/closes[closes.length-8])*100:ch24;
      const rsi=closes.length>15?calcRSI(closes):null;
      const ma50=closes.length>=50?calcMA(closes,50):null;
      const ma200=closes.length>=200?calcMA(closes,200):null;
      const dec=buildDecision({rsi,price,ma50,ma200,ch24,ch7d});
      let marketCap=0;
      try{const ccR=await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${sym}&tsyms=USD`);
        if(ccR.ok){const cc=await ccR.json();marketCap=cc?.RAW?.[sym]?.USD?.MKTCAP||0;}}catch(_){}
      const data={...dec,name:FULL_NAME[sym]||sym,symbol:sym,price,ch24,ch7d,volume,marketCap,
        image:`https://assets.coincap.io/assets/icons/${sym.toLowerCase()}@2x.png`};
      cache.current[sym]={data,ts:now};
      const scam=detectScam(data);
      setResult(data); setScamInfo(scam); setLoading(false);
      callAI(data); if(scam.pts>=3) callScamAI(data,scam.flags);
    } catch(e){ setError(e.message||"Failed."); setLoading(false); }
  };

  const callAI = async (d) => {
    setAiLoading(true);
    try {
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"analysis",language:"english",name:d.name,symbol:d.symbol,price:d.price,
          rsi:d.rsi,ma50:d.ma50,ma200:d.ma200,ch24:d.ch24,ch7d:d.ch7d,decision:d.decision,confidence:d.confidence,risk:d.risk})});
      const j=await r.json(); setAiText(j.text||"Analysis complete.");
    }catch(_){ setAiText("📊 Indicators calculated from real-time data.\n⚠️ Always invest carefully."); }
    setAiLoading(false);
  };

  const callScamAI = async (d,flags) => {
    setScamLoad(true);
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"scam",language:"english",name:d.name,symbol:d.symbol,ch24:d.ch24,ch7d:d.ch7d,rsi:d.rsi,scamFlags:flags})});
      const j=await r.json(); setScamText(j.text||"");
    }catch(_){}
    setScamLoad(false);
  };

  const callBudgetAI = async () => {
    if(!budgetAmt||parseFloat(budgetAmt)<=0) return;
    setBudgetLoad(true); setBudgetText("");
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"budget",language:"english",budgetAmount:budgetAmt,budgetCurrency:budgetCur})});
      const j=await r.json(); setBudgetText(j.text||"");
    }catch(_){ setBudgetText("Unable to generate. Please try again."); }
    setBudgetLoad(false);
  };

  const lossRec=(()=>{
    const p=parseFloat(lossAmt); if(!lossAmt||isNaN(p)||p<=0||p>=100) return null;
    const req=(p/(100-p))*100;
    return{req:req.toFixed(1),
      safe:`DCA every week for ${Math.ceil(req/5)} weeks (~5%/week target)`,
      mod:`Split: 40% now + 60% on next dip. Target ${(req*0.75).toFixed(0)}% in ~30 days`,
      agg:`Full position at support. Stop-loss at ${(p*0.35).toFixed(1)}% below entry`};
  })();

  const whatIf=(()=>{
    const inv=parseFloat(investAmt); if(!investAmt||isNaN(inv)||inv<=0||!result) return null;
    return [{label:"+50%",mult:1.5,c1:"#059669",c2:"#ecfdf5",c3:"#bbf7d0"},
            {label:"+20%",mult:1.2,c1:"#10b981",c2:"#f0fdf4",c3:"#bbf7d0"},
            {label:"+10%",mult:1.1,c1:"#34d399",c2:"#f0fdf4",c3:"#d1fae5"},
            {label:"-10%",mult:0.9,c1:"#f87171",c2:"#fff1f2",c3:"#fecaca"},
            {label:"-20%",mult:0.8,c1:"#dc2626",c2:"#fef2f2",c3:"#fecaca"}]
      .map(r=>({...r,val:(inv*r.mult).toLocaleString(undefined,{maximumFractionDigits:0})}));
  })();

  const dc     = result ? DC_PREMIUM[result.decision] : null;
  const mood   = result ? MOOD_CONFIG[result.mood] : null;
  const fgInfo = fg ? getFG(fg.value) : null;

  return (
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f0fdf8",minHeight:"100vh",color:"#0f172a"}}>
      <style>{`
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes fadein  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.9} }
        @keyframes pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
        @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes gradmove{ 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .fadein{animation:fadein .45s cubic-bezier(.16,1,.3,1)}
        .mono{font-family:'JetBrains Mono',monospace}
        .float{animation:float 3s ease-in-out infinite}
        input,select{color:#0f172a;font-family:'JetBrains Mono',monospace}
        input::placeholder{color:#94a3b8}
        input:focus,select:focus{outline:none}
        button:active{transform:scale(.97)}
        .chip{transition:all .15s ease;cursor:pointer}
        .chip:hover{background:linear-gradient(135deg,#f0fdf4,#dcfce7)!important;border-color:#10b981!important;color:#059669!important;transform:translateY(-2px)!important;box-shadow:0 4px 12px rgba(16,185,129,.2)!important}
        .hov{transition:transform .2s,box-shadow .2s}
        .hov:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(16,185,129,.12)!important}
        .btn-primary{background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;border-radius:14px;font-weight:700;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;box-shadow:0 4px 20px rgba(16,185,129,.4)}
        .btn-primary:hover{box-shadow:0 8px 30px rgba(16,185,129,.5);transform:translateY(-1px)}
        .btn-primary:disabled{background:#e2e8f0;color:#94a3b8;box-shadow:none;cursor:not-allowed;transform:none}
      `}</style>

      {/* Background decoration */}
      <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:-200,right:-200,width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(16,185,129,.08) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:-100,left:-100,width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,.05) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",top:"40%",left:"60%",width:300,height:300,borderRadius:"50%",background:"radial-gradient(circle,rgba(16,185,129,.04) 0%,transparent 70%)"}}/>
        {/* grid dots */}
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(16,185,129,.1) 1px,transparent 1px)",backgroundSize:"32px 32px",opacity:.5}}/>
      </div>

      <div style={{maxWidth:700,margin:"0 auto",padding:"36px 16px 56px",position:"relative",zIndex:1}}>

        {/* ── HEADER ── */}
        <div style={{textAlign:"center",marginBottom:32}}>
          {/* Logo badge */}
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#ecfdf5,#d1fae5)",border:"1px solid #6ee7b7",borderRadius:40,padding:"6px 16px",marginBottom:16}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#10b981",boxShadow:"0 0 12px #10b981",animation:"blink 2s infinite"}}/>
            <span className="mono" style={{fontSize:10,color:"#059669",fontWeight:600,letterSpacing:2}}>LIVE · BINANCE · AI</span>
          </div>

          {/* Title */}
          <h1 style={{fontSize:40,fontWeight:900,letterSpacing:-2,lineHeight:1,marginBottom:8}}>
            <span style={{background:"linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#10b981 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              CryptoMind
            </span>
            <span style={{background:"linear-gradient(135deg,#10b981,#059669)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}> AI</span>
          </h1>
          <p style={{fontSize:15,color:"#64748b",fontWeight:500,marginBottom:4}}>
            👉 <strong style={{color:"#0f172a"}}>Abhi kya karna chahiye?</strong>
          </p>
          <p className="mono" style={{fontSize:11,color:"#94a3b8"}}>Real-time BUY · SELL · HOLD · WAIT — powered by AI</p>

          {/* Stats pills */}
          <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:16,flexWrap:"wrap"}}>
            {[{label:"⚡ Real-time Data"},{label:"🤖 Claude AI"},{label:"🛡️ Scam Detector"},{label:"📊 RSI + MA"}].map((p,i)=>(
              <span key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:"4px 12px",fontSize:11,color:"#475569",fontWeight:500,boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                {p.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── FEAR & GREED ── */}
        {fgInfo && fg && (
          <div className="hov" style={{background:"#fff",borderRadius:20,padding:"20px",marginBottom:16,boxShadow:"0 4px 24px rgba(0,0,0,.06)",border:"1px solid #e2e8f0",overflow:"hidden",position:"relative"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${fgInfo.color},${fgInfo.color}88,transparent)`}}/>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:fgInfo.color}}/>
              <span className="mono" style={{fontSize:10,color:"#94a3b8",letterSpacing:2,fontWeight:600}}>INDIA CRYPTO FEAR & GREED INDEX</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <div className="float" style={{fontSize:44,lineHeight:1}}>{fgInfo.emoji}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:20,fontWeight:800,color:fgInfo.color}}>{fgInfo.label}</div>
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>Market sentiment today</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div className="mono" style={{fontSize:32,fontWeight:900,color:fgInfo.color,lineHeight:1}}>{fg.value}</div>
                    <div style={{fontSize:10,color:"#94a3b8"}}>/100</div>
                  </div>
                </div>
                {/* Gradient bar */}
                <div style={{height:12,borderRadius:8,background:"linear-gradient(90deg,#dc2626 0%,#f59e0b 35%,#fbbf24 50%,#34d399 70%,#10b981 100%)",position:"relative",boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}>
                  <div style={{position:"absolute",top:-4,left:`${Math.min(96,Math.max(4,fg.value))}%`,transform:"translateX(-50%)",width:20,height:20,borderRadius:"50%",background:"#fff",border:`3px solid ${fgInfo.color}`,boxShadow:`0 2px 12px ${fgInfo.color}66`,transition:"left .8s cubic-bezier(.16,1,.3,1)"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                  <span style={{fontSize:9,color:"#dc2626",fontWeight:600}}>😱 FEAR</span>
                  <span style={{fontSize:9,color:"#10b981",fontWeight:600}}>GREED 🤑</span>
                </div>
              </div>
            </div>
            <div style={{marginTop:12,background:fgInfo.bg||"#f0fdf4",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#475569",fontWeight:500}}>
              {fg.value < 30  && "📉 Market mein bahut darr hai — historically yeh buying opportunity hoti hai"}
              {fg.value>=30 && fg.value<50 && "😨 Investors careful hain — accumulation zone ho sakta hai"}
              {fg.value>=50 && fg.value<70 && "⚖️ Market neutral zone — wait karo strong signal ke liye"}
              {fg.value>=70 && fg.value<85 && "📈 Greed badh rahi — correction aa sakta hai, careful raho"}
              {fg.value >= 85 && "🚨 Extreme greed — possible market top, zyada risk hai"}
            </div>
          </div>
        )}

        {/* ── SEARCH ── */}
        <div style={{background:"#fff",borderRadius:20,padding:"20px",marginBottom:12,boxShadow:"0 4px 24px rgba(0,0,0,.06)",border:"1px solid #e2e8f0"}}>
          <div style={{display:"flex",gap:10,marginBottom:12}}>
            <div style={{flex:1,position:"relative"}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16}}>🔍</span>
              <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&analyze()}
                placeholder="Search coin: BTC, ETH, SOL, APT, DOGE, SUI…"
                style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"13px 16px 13px 42px",fontSize:14,transition:"all .2s"}}
                onFocus={e=>e.target.style.borderColor="#10b981"}
                onBlur={e=>e.target.style.borderColor="#e2e8f0"}
              />
            </div>
            <button onClick={analyze} disabled={loading} className="btn-primary"
              style={{padding:"13px 24px",fontSize:14,borderRadius:12,whiteSpace:"nowrap"}}>
              {loading ? <span style={{display:"inline-block",animation:"spin .8s linear infinite"}}>⟳</span> : "⚡ Analyze"}
            </button>
          </div>
          {/* Chips */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {["BTC","ETH","SOL","APT","BNB","DOGE","XRP","SUI","PEPE","INJ"].map(c=>(
              <button key={c} onClick={()=>setQuery(c)} className="chip mono"
                style={{background:"#f8fafc",border:"1px solid #e2e8f0",color:"#64748b",padding:"5px 13px",borderRadius:20,fontSize:11,fontWeight:500,boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{background:"linear-gradient(135deg,#fff1f2,#fee2e2)",border:"1px solid #fca5a5",borderRadius:14,padding:"14px 18px",color:"#dc2626",marginBottom:14,fontSize:13,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:18}}>⚠️</span>
            <span className="mono">{error}</span>
          </div>
        )}

        {loading && (
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <div style={{position:"relative",width:60,height:60,margin:"0 auto 20px"}}>
              <div style={{position:"absolute",inset:0,border:"3px solid #e2e8f0",borderTopColor:"#10b981",borderRadius:"50%",animation:"spin .9s linear infinite"}}/>
              <div style={{position:"absolute",inset:8,border:"2px solid #e2e8f0",borderTopColor:"#6ee7b7",borderRadius:"50%",animation:"spin 1.4s linear infinite reverse"}}/>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>₿</div>
            </div>
            <p style={{color:"#64748b",fontSize:13,fontWeight:500}}>Fetching real-time data from Binance…</p>
            <p className="mono" style={{color:"#94a3b8",fontSize:11,marginTop:4}}>Calculating RSI · MA50 · MA200</p>
          </div>
        )}

        {/* ══ RESULTS ══ */}
        {result && !loading && (
          <div className="fadein">

            {/* Coin Header */}
            <div className="hov" style={{background:"#fff",borderRadius:20,padding:"18px 20px",marginBottom:12,boxShadow:"0 4px 24px rgba(0,0,0,.06)",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{position:"relative"}}>
                  <img src={result.image} alt="" onError={e=>e.target.style.display="none"}
                    style={{width:50,height:50,borderRadius:"50%",border:"2px solid #e2e8f0",boxShadow:"0 4px 12px rgba(0,0,0,.08)"}}/>
                  <div style={{position:"absolute",bottom:0,right:0,width:14,height:14,borderRadius:"50%",background:result.ch24>=0?"#10b981":"#ef4444",border:"2px solid #fff"}}/>
                </div>
                <div>
                  <div style={{fontWeight:800,fontSize:20,letterSpacing:-.5}}>{result.name}</div>
                  <div className="mono" style={{color:"#94a3b8",fontSize:11,marginTop:1}}>{result.symbol} · Binance</div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div className="mono" style={{fontSize:26,fontWeight:900,letterSpacing:-1}}>{fmt(result.price)}</div>
                <div style={{display:"flex",gap:8,marginTop:4,justifyContent:"flex-end"}}>
                  <span style={{background:result.ch24>=0?"#f0fdf4":"#fef2f2",color:result.ch24>=0?"#059669":"#dc2626",padding:"2px 8px",borderRadius:20,fontSize:12,fontWeight:700}}>
                    {result.ch24>=0?"▲":"▼"}{Math.abs(result.ch24).toFixed(2)}% 24h
                  </span>
                  <span style={{background:result.ch7d>=0?"#f0fdf4":"#fef2f2",color:result.ch7d>=0?"#059669":"#dc2626",padding:"2px 8px",borderRadius:20,fontSize:12,fontWeight:700}}>
                    {result.ch7d>=0?"▲":"▼"}{Math.abs(result.ch7d).toFixed(2)}% 7d
                  </span>
                </div>
              </div>
            </div>

            {/* SCAM DETECTOR */}
            {scamInfo && (
              <div style={{background:scamInfo.bg,border:`1px solid ${scamInfo.border}`,borderRadius:16,padding:"14px 18px",marginBottom:12,boxShadow:"0 4px 16px rgba(0,0,0,.05)"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:scamInfo.flags.length?10:0}}>
                  <span style={{fontSize:20}}>{scamInfo.emoji}</span>
                  <div>
                    <div className="mono" style={{fontSize:10,color:"#94a3b8",letterSpacing:2}}>SCAM DETECTOR</div>
                    <div style={{fontWeight:700,fontSize:14,color:scamInfo.color}}>{scamInfo.verdict}</div>
                  </div>
                  <div style={{marginLeft:"auto",background:"rgba(255,255,255,.7)",backdropFilter:"blur(8px)",borderRadius:12,padding:"6px 14px",border:`1px solid ${scamInfo.border}`}}>
                    <span style={{fontSize:11,color:scamInfo.color,fontWeight:700}}>Risk Score: {scamInfo.pts}/10</span>
                  </div>
                </div>
                {scamInfo.flags.length>0&&(
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:scamText?8:0}}>
                    {scamInfo.flags.map((f,i)=>(
                      <span key={i} className="mono" style={{background:"rgba(255,255,255,.6)",border:`1px solid ${scamInfo.border}`,borderRadius:20,padding:"3px 10px",fontSize:10,color:scamInfo.color}}>{f}</span>
                    ))}
                  </div>
                )}
                {scamLoad&&<div style={{height:32,background:"rgba(255,255,255,.5)",borderRadius:8,animation:"shimmer 1.5s infinite",marginTop:8}}/>}
                {scamText&&<p style={{fontSize:12,color:"#475569",lineHeight:1.6,whiteSpace:"pre-line",marginTop:8,padding:"10px 12px",background:"rgba(255,255,255,.6)",borderRadius:10}}>{scamText}</p>}
              </div>
            )}

            {/* ★ BIG DECISION BOX ★ */}
            <div style={{background:dc.bg,border:`2px solid ${dc.border}`,borderRadius:24,padding:"32px 24px",marginBottom:12,textAlign:"center",boxShadow:dc.glow,position:"relative",overflow:"hidden"}}>
              {/* top bar */}
              <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:`linear-gradient(90deg,transparent,${dc.accent},transparent)`}}/>
              {/* bg circle */}
              <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,${dc.accent}15,transparent 70%)`}}/>

              <div className="mono" style={{fontSize:10,color:"#94a3b8",letterSpacing:3,marginBottom:14,fontWeight:600}}>AI RECOMMENDATION</div>

              {/* Decision */}
              <div className="pulse" style={{fontSize:52,fontWeight:900,color:dc.text,letterSpacing:-3,lineHeight:1,marginBottom:4}}>{dc.label}</div>

              {/* Confidence bar */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,margin:"16px 0"}}>
                <div style={{flex:1,maxWidth:180}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:"#94a3b8",fontWeight:500}}>Confidence</span>
                    <span className="mono" style={{fontSize:12,fontWeight:700,color:dc.text}}>{result.confidence}%</span>
                  </div>
                  <div style={{height:8,background:"rgba(0,0,0,.08)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{width:`${result.confidence}%`,height:"100%",background:`linear-gradient(90deg,${dc.accent}88,${dc.accent})`,borderRadius:4,transition:"width .8s ease"}}/>
                  </div>
                </div>
                <div style={{background:"rgba(255,255,255,.6)",backdropFilter:"blur(8px)",borderRadius:12,padding:"6px 14px",border:`1px solid ${dc.border}`}}>
                  <span style={{fontSize:12,color:dc.text,fontWeight:700}}>
                    Risk: <span style={{color:result.risk==="High"?"#dc2626":result.risk==="Medium"?"#d97706":"#059669"}}>{result.risk}</span>
                  </span>
                </div>
              </div>

              {/* Factor pills */}
              <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginTop:4}}>
                {result.factors.slice(0,4).map((f,i)=>(
                  <span key={i} className="mono" style={{background:"rgba(255,255,255,.6)",backdropFilter:"blur(8px)",border:`1px solid rgba(0,0,0,.08)`,borderRadius:20,padding:"4px 12px",fontSize:10,color:"#475569",fontWeight:500}}>{f}</span>
                ))}
              </div>
            </div>

            {/* Indicators row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:12}}>
              {[
                {label:"RSI (14)",val:result.rsi,
                  sub:parseFloat(result.rsi)<30?"🔥 Oversold":parseFloat(result.rsi)>70?"❗ Overbought":"✓ Neutral",
                  sc:parseFloat(result.rsi)<30?"#059669":parseFloat(result.rsi)>70?"#dc2626":"#64748b",
                  bg:parseFloat(result.rsi)<30?"#f0fdf4":parseFloat(result.rsi)>70?"#fef2f2":"#f8fafc"},
                {label:"MA 50",
                  val:result.ma50!=="—"?fmt(parseFloat(result.ma50)):result.ma50,
                  sub:result.ma50!=="—"&&result.price>parseFloat(result.ma50)?"↑ Bullish":"↓ Bearish",
                  sc:result.ma50!=="—"&&result.price>parseFloat(result.ma50)?"#059669":"#dc2626",
                  bg:result.ma50!=="—"&&result.price>parseFloat(result.ma50)?"#f0fdf4":"#fef2f2"},
                {label:"MA 200",
                  val:result.ma200!=="—"?fmt(parseFloat(result.ma200)):result.ma200,
                  sub:result.ma200!=="—"&&result.price>parseFloat(result.ma200)?"↑ Long Bull":"↓ Long Bear",
                  sc:result.ma200!=="—"&&result.price>parseFloat(result.ma200)?"#059669":"#dc2626",
                  bg:result.ma200!=="—"&&result.price>parseFloat(result.ma200)?"#f0fdf4":"#fef2f2"},
              ].map((s,i)=>(
                <div key={i} className="hov" style={{background:s.bg,border:"1px solid #e2e8f0",borderRadius:16,padding:"14px 12px",textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,.04)"}}>
                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:6,fontWeight:600,letterSpacing:.5}}>{s.label}</div>
                  <div className="mono" style={{fontSize:13,fontWeight:800,color:"#0f172a",marginBottom:4}}>{s.val}</div>
                  <div style={{fontSize:10,color:s.sc,fontWeight:700,background:"rgba(255,255,255,.6)",borderRadius:20,padding:"2px 8px",display:"inline-block"}}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Health + Mood */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div className="hov" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"16px",boxShadow:"0 2px 12px rgba(0,0,0,.04)"}}>
                <div style={{fontSize:10,color:"#94a3b8",marginBottom:12,fontWeight:600,letterSpacing:.5}}>COIN HEALTH</div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{position:"relative",width:52,height:52}}>
                    <svg viewBox="0 0 52 52" style={{transform:"rotate(-90deg)"}}>
                      <circle cx="26" cy="26" r="22" fill="none" stroke="#e2e8f0" strokeWidth="4"/>
                      <circle cx="26" cy="26" r="22" fill="none"
                        stroke={result.healthScore>=80?"#10b981":result.healthScore>=50?"#f59e0b":"#ef4444"}
                        strokeWidth="4" strokeLinecap="round"
                        strokeDasharray={`${(result.healthScore/100)*138.2} 138.2`}
                        style={{transition:"stroke-dasharray .8s ease"}}
                      />
                    </svg>
                    <div className="mono" style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:result.healthScore>=80?"#059669":result.healthScore>=50?"#d97706":"#dc2626"}}>{result.healthScore}</div>
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,color:result.healthScore>=80?"#059669":result.healthScore>=50?"#d97706":"#dc2626"}}>
                      {result.healthScore>=80?"💪 Strong":result.healthScore>=50?"⚖️ Neutral":"⚠️ Weak"}
                    </div>
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Overall score</div>
                  </div>
                </div>
              </div>
              <div className="hov" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"16px",boxShadow:"0 2px 12px rgba(0,0,0,.04)"}}>
                <div style={{fontSize:10,color:"#94a3b8",marginBottom:12,fontWeight:600,letterSpacing:.5}}>MARKET MOOD</div>
                <div className="float" style={{fontSize:36,marginBottom:4}}>{mood.emoji}</div>
                <div style={{fontWeight:800,fontSize:17,color:mood.color}}>{result.mood}</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Market sentiment</div>
              </div>
            </div>

            {/* Entry / Exit / Stop */}
            <div className="hov" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:"18px",marginBottom:12,boxShadow:"0 4px 24px rgba(0,0,0,.05)"}}>
              <div style={{fontSize:10,color:"#94a3b8",marginBottom:14,fontWeight:600,letterSpacing:.5}}>📍 SMART ENTRY / EXIT ZONES</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                <div style={{background:"linear-gradient(135deg,#ecfdf5,#d1fae5)",borderRadius:14,padding:"14px 10px",textAlign:"center",border:"1px solid #6ee7b7"}}>
                  <div style={{fontSize:11,color:"#059669",fontWeight:700,marginBottom:8}}>📥 ENTRY ZONE</div>
                  <div className="mono" style={{fontSize:12,color:"#065f46",fontWeight:700}}>{fmt(result.entryLow)}</div>
                  <div style={{fontSize:10,color:"#059669",margin:"3px 0"}}>to</div>
                  <div className="mono" style={{fontSize:12,color:"#065f46",fontWeight:700}}>{fmt(result.entryHigh)}</div>
                </div>
                <div style={{background:"linear-gradient(135deg,#fffbeb,#fef3c7)",borderRadius:14,padding:"14px 10px",textAlign:"center",border:"1px solid #fde68a"}}>
                  <div style={{fontSize:11,color:"#d97706",fontWeight:700,marginBottom:8}}>📤 EXIT TARGET</div>
                  <div className="mono" style={{fontSize:16,color:"#92400e",fontWeight:900}}>{fmt(result.exitTarget)}</div>
                  <div style={{fontSize:11,color:"#d97706",fontWeight:700,marginTop:4,background:"rgba(255,255,255,.5)",borderRadius:20,padding:"2px 6px"}}>+{(((result.exitTarget/result.price)-1)*100).toFixed(1)}% 🎯</div>
                </div>
                <div style={{background:"linear-gradient(135deg,#fff1f2,#fee2e2)",borderRadius:14,padding:"14px 10px",textAlign:"center",border:"1px solid #fca5a5"}}>
                  <div style={{fontSize:11,color:"#dc2626",fontWeight:700,marginBottom:8}}>🛑 STOP LOSS</div>
                  <div className="mono" style={{fontSize:16,color:"#991b1b",fontWeight:900}}>{fmt(result.stopLoss)}</div>
                  <div style={{fontSize:11,color:"#dc2626",fontWeight:700,marginTop:4,background:"rgba(255,255,255,.5)",borderRadius:20,padding:"2px 6px"}}>−6% limit</div>
                </div>
              </div>
            </div>

            {/* YES YOU PRO AI BOX */}
            <div className="hov" style={{background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)",border:"1px solid #6ee7b7",borderRadius:20,padding:"18px",marginBottom:12,boxShadow:"0 4px 24px rgba(16,185,129,.1)",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#10b981,#6ee7b7,#10b981)",backgroundSize:"200% auto",animation:"gradmove 3s linear infinite"}}/>
              <div style={{position:"absolute",bottom:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"radial-gradient(circle,rgba(16,185,129,.08),transparent)"}}/> 
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:10,padding:"6px 12px",fontWeight:900,fontSize:13,color:"#fff",letterSpacing:.5,boxShadow:"0 4px 12px rgba(16,185,129,.4)"}}>YYP</div>
                <div>
                  <div style={{fontWeight:800,fontSize:13,color:"#065f46"}}>YES YOU PRO</div>
                  <div className="mono" style={{fontSize:9,color:"#059669",letterSpacing:1}}>AI ANALYSIS</div>
                </div>
                {aiLoading && (
                  <div style={{marginLeft:"auto",display:"flex",gap:4,alignItems:"center"}}>
                    <span style={{fontSize:11,color:"#059669",marginRight:4}}>Analyzing</span>
                    {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#10b981",animation:`blink 1.2s ${i*.2}s infinite`}}/>)}
                  </div>
                )}
              </div>
              {aiText
                ? <p style={{fontSize:13,color:"#166534",lineHeight:1.7,whiteSpace:"pre-line",fontWeight:500}}>{aiText}</p>
                : <div style={{height:48,background:"rgba(16,185,129,.08)",borderRadius:10,animation:"shimmer 1.5s infinite"}}/>}
              <div className="mono" style={{fontSize:9,color:"#94a3b8",marginTop:12,textAlign:"right"}}>Powered by YesYouPro · yesyoupro.com</div>
            </div>

            {/* Market Stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {[{l:"24h Volume",v:fmtBig(result.volume),icon:"📊"},{l:"Market Cap",v:result.marketCap>0?fmtBig(result.marketCap):"—",icon:"💰"}].map((s,i)=>(
                <div key={i} className="hov" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"14px 16px",boxShadow:"0 2px 12px rgba(0,0,0,.04)"}}>
                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:6,fontWeight:600}}>{s.icon} {s.l}</div>
                  <div className="mono" style={{fontSize:16,fontWeight:800,color:"#0f172a"}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TOOLS SECTION ══ */}
        <div style={{position:"relative",margin:"8px 0 20px"}}>
          <div style={{borderTop:"2px dashed #d1fae5"}}/>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#f0fdf8",padding:"0 16px"}}>
            <span style={{background:"linear-gradient(135deg,#10b981,#059669)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:800,fontSize:13,letterSpacing:.5}}>✦ TOOLS ✦</span>
          </div>
        </div>

        {/* 🎯 MERA BUDGET */}
        <div className="hov" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:"20px",marginBottom:12,boxShadow:"0 4px 20px rgba(0,0,0,.05)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:38,height:38,background:"linear-gradient(135deg,#ecfdf5,#d1fae5)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:"1px solid #6ee7b7"}}>🎯</div>
            <div>
              <div style={{fontWeight:800,fontSize:15}}>Mera Budget</div>
              <div style={{fontSize:11,color:"#94a3b8"}}>AI will suggest best coins for your budget</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <select value={budgetCur} onChange={e=>setBudgetCur(e.target.value)}
              style={{background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"11px 12px",fontSize:13,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",color:"#0f172a",fontWeight:600}}>
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
            </select>
            <input value={budgetAmt} onChange={e=>setBudgetAmt(e.target.value)}
              placeholder={`Enter amount (e.g. ${budgetCur==="INR"?"5000":"100"})`} type="number"
              style={{flex:1,background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"11px 14px",fontSize:13,transition:"border-color .2s"}}
              onFocus={e=>e.target.style.borderColor="#10b981"}
              onBlur={e=>e.target.style.borderColor="#e2e8f0"}
            />
            <button onClick={callBudgetAI} disabled={budgetLoad||!budgetAmt} className="btn-primary"
              style={{padding:"11px 20px",fontSize:13,borderRadius:12,whiteSpace:"nowrap"}}>
              {budgetLoad?"⟳":"Ask AI 🤖"}
            </button>
          </div>
          {budgetLoad&&<div style={{height:90,background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:12,animation:"shimmer 1.5s infinite"}}/>}
          {budgetText&&(
            <div style={{background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)",border:"1px solid #6ee7b7",borderRadius:14,padding:"14px 16px"}}>
              <p style={{fontSize:13,color:"#166534",lineHeight:1.75,whiteSpace:"pre-line",fontWeight:500}}>{budgetText}</p>
            </div>
          )}
        </div>

        {/* 💡 WHAT-IF */}
        {result && (
          <div className="hov" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:"20px",marginBottom:12,boxShadow:"0 4px 20px rgba(0,0,0,.05)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <div style={{width:38,height:38,background:"linear-gradient(135deg,#eef2ff,#e0e7ff)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:"1px solid #c7d2fe"}}>💡</div>
              <div>
                <div style={{fontWeight:800,fontSize:15}}>What-If Simulator</div>
                <div style={{fontSize:11,color:"#94a3b8"}}>See potential profit & loss scenarios</div>
              </div>
            </div>
            <input value={investAmt} onChange={e=>setInvestAmt(e.target.value)}
              placeholder="Enter your investment amount in $ (e.g. 500)"
              type="number"
              style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"11px 14px",fontSize:13,marginBottom:12,transition:"border-color .2s"}}
              onFocus={e=>e.target.style.borderColor="#6366f1"}
              onBlur={e=>e.target.style.borderColor="#e2e8f0"}
            />
            {whatIf&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                {whatIf.map((r,i)=>(
                  <div key={i} style={{background:r.c2,border:`1px solid ${r.c3}`,borderRadius:12,padding:"12px 6px",textAlign:"center",transition:"transform .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                    <div className="mono" style={{fontSize:12,color:r.c1,fontWeight:800}}>{r.label}</div>
                    <div className="mono" style={{fontSize:12,color:"#0f172a",marginTop:4,fontWeight:700}}>${r.val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🩹 LOSS RECOVERY */}
        <div className="hov" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:"20px",marginBottom:24,boxShadow:"0 4px 20px rgba(0,0,0,.05)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:38,height:38,background:"linear-gradient(135deg,#fff1f2,#fee2e2)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,border:"1px solid #fca5a5"}}>🩹</div>
            <div>
              <div style={{fontWeight:800,fontSize:15}}>Loss Recovery Planner</div>
              <div style={{fontSize:11,color:"#94a3b8"}}>Calculate your recovery plan</div>
            </div>
          </div>
          <input value={lossAmt} onChange={e=>setLossAmt(e.target.value)}
            placeholder="Enter your loss % (e.g. 30 means you lost 30%)"
            type="number" min="1" max="99"
            style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"11px 14px",fontSize:13,marginBottom:12,transition:"border-color .2s"}}
            onFocus={e=>e.target.style.borderColor="#ef4444"}
            onBlur={e=>e.target.style.borderColor="#e2e8f0"}
          />
          {lossRec&&(
            <div>
              <div style={{background:"linear-gradient(135deg,#fff1f2,#fee2e2)",border:"1px solid #fca5a5",borderRadius:14,padding:"14px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:24}}>📉</span>
                <div>
                  <div style={{fontSize:12,color:"#dc2626",fontWeight:500}}>To break even from {lossAmt}% loss:</div>
                  <div className="mono" style={{fontSize:18,fontWeight:900,color:"#991b1b"}}>Need +{lossRec.req}% gain</div>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[
                  {icon:"🐢",name:"Safe",       plan:lossRec.safe,c:"#059669",bg:"linear-gradient(135deg,#f0fdf4,#dcfce7)",br:"#86efac"},
                  {icon:"⚖️",name:"Moderate",   plan:lossRec.mod, c:"#d97706",bg:"linear-gradient(135deg,#fffbeb,#fef3c7)",br:"#fde68a"},
                  {icon:"🎲",name:"Aggressive",  plan:lossRec.agg, c:"#dc2626",bg:"linear-gradient(135deg,#fff1f2,#fee2e2)",br:"#fca5a5"},
                ].map((p,i)=>(
                  <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",background:p.bg,border:`1px solid ${p.br}`,borderRadius:14,padding:"12px 14px"}}>
                    <span style={{fontSize:20,flexShrink:0}}>{p.icon}</span>
                    <div>
                      <span style={{fontSize:12,color:p.c,fontWeight:800}}>{p.name}: </span>
                      <span style={{fontSize:12,color:"#475569",fontWeight:500}}>{p.plan}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* DISCLAIMER */}
        <div style={{background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)",border:"1px solid #6ee7b7",borderRadius:16,padding:"14px 18px",textAlign:"center",boxShadow:"0 2px 12px rgba(16,185,129,.08)"}}>
          <div style={{fontSize:12,color:"#059669",fontWeight:600,marginBottom:4}}>⚠️ Disclaimer</div>
          <div className="mono" style={{fontSize:10,color:"#64748b",lineHeight:1.7}}>
            AI-based analysis only — not financial advice.<br/>
            Crypto is highly volatile. Always do your own research (DYOR).<br/>
            <span style={{color:"#059669",fontWeight:600}}>Data: Binance · Fear & Greed: Alternative.me · AI: YesYouPro</span>
          </div>
        </div>

      </div>
    </main>
  );
}
