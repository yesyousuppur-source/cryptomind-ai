"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { calcRSI, calcMA, buildDecision } from "../lib/indicators";
import { INPUT_MAP, FULL_NAME, DECISION_CONFIG, MOOD_CONFIG, fmt, fmtBig } from "../lib/constants";

// ── SCAM DETECTOR ─────────────────────────────────────────────────────────────
function detectScam({ ch24, ch7d, volume, marketCap, rsi }) {
  let pts = 0; const flags = [];
  if (ch24 > 50)   { pts+=3; flags.push(`Extreme 24h pump (+${ch24.toFixed(0)}%)`); }
  else if (ch24>30){ pts+=2; flags.push(`Suspicious surge (+${ch24.toFixed(0)}%)`); }
  if (ch7d > 200)  { pts+=3; flags.push(`Massive 7d pump (+${ch7d.toFixed(0)}%)`); }
  else if (ch7d>80){ pts+=2; flags.push(`Very high 7d gain (+${ch7d.toFixed(0)}%)`); }
  if (marketCap>0 && marketCap<50_000_000 && volume>marketCap*0.4)
    { pts+=3; flags.push("Volume >> Market Cap (manipulation risk)"); }
  if (rsi && parseFloat(rsi)>88) { pts+=2; flags.push(`RSI extremely overbought (${rsi})`); }
  if (marketCap>0 && marketCap<1_000_000) { pts+=2; flags.push("Very low market cap"); }
  let verdict,color,emoji;
  if      (pts>=5){verdict="HIGH RISK — Possible Scam";color="#dc2626";emoji="🚨";}
  else if (pts>=3){verdict="SUSPICIOUS — Be Careful";  color="#d97706";emoji="⚠️";}
  else            {verdict="Looks Normal";              color="#059669";emoji="✅";}
  return { verdict,color,emoji,flags,pts };
}

// ── FEAR & GREED ──────────────────────────────────────────────────────────────
const FG_CFG = [
  {max:25, label:"Extreme Fear",  color:"#dc2626", emoji:"😱"},
  {max:45, label:"Fear",          color:"#f87171", emoji:"😨"},
  {max:55, label:"Neutral",       color:"#d97706", emoji:"⚖️"},
  {max:75, label:"Greed",         color:"#059669", emoji:"😏"},
  {max:100,label:"Extreme Greed", color:"#10b981", emoji:"🤑"},
];
const getFG = (v) => FG_CFG.find((c)=>v<=c.max)||FG_CFG[4];

const LANGS = [
  {id:"english",  label:"EN 🇺🇸"},
  {id:"hindi",    label:"HI 🇮🇳"},
  {id:"hinglish", label:"😎 Mix"},
];

const T = {
  pageBg:"#f8fafc", cardBg:"#ffffff", cardBg2:"#f1f5f9",
  border:"#e2e8f0", border2:"#cbd5e1",
  text:"#0f172a",   text2:"#475569",  text3:"#94a3b8",
  green:"#10b981",  greenDk:"#059669",
  inputBg:"#f8fafc",
  shadow:"0 1px 4px rgba(0,0,0,.06)",
  shadowMd:"0 4px 16px rgba(0,0,0,.08)",
  navH: 60,
};

export default function Home() {
  const [query,setQuery]           = useState("");
  const [loading,setLoading]       = useState(false);
  const [error,setError]           = useState(null);
  const [result,setResult]         = useState(null);
  const [aiText,setAiText]         = useState("");
  const [aiLoading,setAiLoading]   = useState(false);
  const [lang,setLang]             = useState("english");
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
  const [mobileMenu,setMobileMenu] = useState(false);
  const cache = useRef({});

  // ── Fear & Greed on load ──
  useEffect(()=>{
    fetch("/api/feargreed")
      .then(r=>r.json())
      .then(setFg)
      .catch(()=>setFg({value:50,classification:"Neutral"}));
  },[]);

  // ── Re-run AI when language changes (if result already loaded) ──
  // This is the KEY FIX — language change triggers new AI call
  useEffect(()=>{
    if(result){
      setAiText("");
      callAI(result, lang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[lang]);

  // ── AI: Main Analysis ──────────────────────────────────────────────────────
  // Accept lang as param so it always uses latest value
  const callAI = async (d, langOverride) => {
    const useLang = langOverride || lang;
    setAiLoading(true);
    try {
      const r = await fetch("/api/ai",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          mode:"analysis", language:useLang,
          name:d.name, symbol:d.symbol, price:d.price,
          rsi:d.rsi, ma50:d.ma50, ma200:d.ma200,
          ch24:d.ch24, ch7d:d.ch7d,
          decision:d.decision, confidence:d.confidence, risk:d.risk,
        }),
      });
      const j = await r.json();
      setAiText(j.text || "Analysis complete.");
    } catch(_) {
      setAiText("📊 Technical: Real-time data fetched.\n⚠️ Risk Note: Invest carefully.");
    }
    setAiLoading(false);
  };

  // ── AI: Scam ───────────────────────────────────────────────────────────────
  const callScamAI = async (d, flags) => {
    setScamLoad(true);
    try {
      const r = await fetch("/api/ai",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"scam",language:lang,name:d.name,symbol:d.symbol,ch24:d.ch24,ch7d:d.ch7d,rsi:d.rsi,scamFlags:flags}),
      });
      const j = await r.json(); setScamText(j.text||"");
    } catch(_){}
    setScamLoad(false);
  };

  // ── AI: Budget ─────────────────────────────────────────────────────────────
  const callBudgetAI = async () => {
    if(!budgetAmt||parseFloat(budgetAmt)<=0)return;
    setBudgetLoad(true); setBudgetText("");
    try {
      const r = await fetch("/api/ai",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"budget",language:lang,budgetAmount:budgetAmt,budgetCurrency:budgetCur}),
      });
      const j = await r.json(); setBudgetText(j.text||"");
    } catch(_){ setBudgetText("Unable to generate suggestion. Please try again."); }
    setBudgetLoad(false);
  };

  // ── Analyze ────────────────────────────────────────────────────────────────
  const analyze = async () => {
    const raw=query.trim().toLowerCase(); if(!raw)return;
    const sym=INPUT_MAP[raw]||raw.toUpperCase();
    setError(null); setAiText(""); setResult(null); setScamInfo(null); setScamText("");
    const now=Date.now();
    if(cache.current[sym]&&now-cache.current[sym].ts<60000){
      const d=cache.current[sym].data;
      setResult(d); setScamInfo(detectScam(d)); callAI(d, lang); return;
    }
    setLoading(true);
    try{
      const [tickR,klinesR]=await Promise.all([
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`),
        fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=1d&limit=200`),
      ]);
      if(!tickR.ok)throw new Error(`"${sym}" not found. Try: BTC, ETH, SOL, APT, DOGE…`);
      const tick=await tickR.json(); const klines=klinesR.ok?await klinesR.json():[];
      const price=parseFloat(tick.lastPrice),ch24=parseFloat(tick.priceChangePercent),volume=parseFloat(tick.quoteVolume);
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
      callAI(data, lang);
      if(scam.pts>=3) callScamAI(data,scam.flags);
    }catch(e){setError(e.message||"Failed. Check coin name.");setLoading(false);}
  };

  // ── Tools helpers ──────────────────────────────────────────────────────────
  const lossRec=(()=>{
    const p=parseFloat(lossAmt);
    if(!lossAmt||isNaN(p)||p<=0||p>=100)return null;
    const req=(p/(100-p))*100;
    return{req:req.toFixed(1),
      safe:`DCA every week for ${Math.ceil(req/5)} weeks (~5%/week target)`,
      mod:`Split: 40% now + 60% on next dip. Target ${(req*0.75).toFixed(0)}% in ~30 days`,
      agg:`Full position at support. Stop-loss at ${(p*0.35).toFixed(1)}% below entry`};
  })();

  const whatIf=(()=>{
    const inv=parseFloat(investAmt);
    if(!investAmt||isNaN(inv)||inv<=0||!result)return null;
    return [{label:"+50%",mult:1.5,color:"#059669"},{label:"+20%",mult:1.2,color:"#10b981"},
      {label:"+10%",mult:1.1,color:"#34d399"},{label:"-10%",mult:0.9,color:"#f87171"},
      {label:"-20%",mult:0.8,color:"#dc2626"}]
      .map(r=>({...r,val:(inv*r.mult).toLocaleString(undefined,{maximumFractionDigits:0})}));
  })();

  const dc=result?DECISION_CONFIG[result.decision]:null;
  const mood=result?MOOD_CONFIG[result.mood]:null;
  const fgInfo=fg?getFG(fg.value):null;

  const inputSt={background:T.inputBg,border:`1px solid ${T.border2}`,borderRadius:8,padding:"10px 13px",fontSize:13,transition:"border-color .2s",color:T.text,width:"100%"};

  // ── Language Button component ──────────────────────────────────────────────
  const LangBtn = ({l}) => (
    <button
      onClick={()=>{ setLang(l.id); setMobileMenu(false); }}
      style={{
        background: lang===l.id ? `linear-gradient(135deg,${T.green},${T.greenDk})` : "#fff",
        color:      lang===l.id ? "#fff" : T.text2,
        border:     lang===l.id ? "none" : `1px solid ${T.border}`,
        borderRadius: 20,
        padding: "5px 14px",
        fontSize: 12,
        fontWeight: lang===l.id ? 700 : 500,
        cursor: "pointer",
        transition: "all .2s",
        fontFamily:"'Space Grotesk',sans-serif",
        boxShadow: lang===l.id ? `0 2px 8px rgba(16,185,129,.35)` : T.shadow,
        whiteSpace: "nowrap",
      }}
    >{l.label}</button>
  );

  return (
    <main style={{fontFamily:"'Space Grotesk','Segoe UI',sans-serif",background:T.pageBg,minHeight:"100vh",color:T.text}}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadein  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes shimmer { 0%,100%{opacity:.4} 50%{opacity:.8} }
        .fadein{animation:fadein .35s ease-out}
        .mono{font-family:'JetBrains Mono',monospace}
        input,select{color:#0f172a;font-family:'JetBrains Mono',monospace}
        input::placeholder{color:#cbd5e1}
        input:focus,select:focus{outline:none;border-color:#10b981!important}
        button:active{transform:scale(.97)}
        @media(max-width:520px){
          .nav-links{display:none}
          .menu-btn{display:flex!important}
        }
        @media(min-width:521px){
          .mobile-drawer{display:none!important}
          .menu-btn{display:none!important}
        }
      `}</style>

      {/* dot grid */}
      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(rgba(16,185,129,.07) 1px,transparent 1px)",backgroundSize:"28px 28px",pointerEvents:"none"}}/>
      <div style={{position:"fixed",top:-80,left:"50%",transform:"translateX(-50%)",width:600,height:260,background:"radial-gradient(ellipse,rgba(16,185,129,.1) 0%,transparent 70%)",pointerEvents:"none"}}/>

      {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:100,
        background:"rgba(255,255,255,.92)",
        backdropFilter:"blur(12px)",
        WebkitBackdropFilter:"blur(12px)",
        borderBottom:`1px solid ${T.border}`,
        boxShadow:"0 1px 12px rgba(0,0,0,.06)",
        height:T.navH,
        display:"flex",alignItems:"center",
        padding:"0 20px",
      }}>
        {/* LEFT — Logo */}
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
          <div style={{background:`linear-gradient(135deg,${T.green},${T.greenDk})`,borderRadius:8,padding:"4px 10px",fontWeight:800,fontSize:13,color:"#fff",fontFamily:"'Space Grotesk',sans-serif",letterSpacing:.5}}>
            YYP
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:15,letterSpacing:-.5,color:T.text,lineHeight:1}}>CryptoMind AI</div>
            <div className="mono" style={{fontSize:9,color:T.text3,letterSpacing:1}}>by YesYouPro</div>
          </div>
        </div>

        {/* CENTER — Nav links (desktop) */}
        <div className="nav-links" style={{display:"flex",alignItems:"center",gap:6,flex:1,justifyContent:"center"}}>
          {[
            {label:"📊 Analyze",  href:"#analyze"},
            {label:"😰 Fear & Greed", href:"#feargreed"},
            {label:"🎯 Budget",   href:"#budget"},
            {label:"🩹 Recovery", href:"#recovery"},
          ].map(n=>(
            <a key={n.label} href={n.href}
              style={{fontSize:12,color:T.text2,textDecoration:"none",padding:"5px 10px",borderRadius:20,fontWeight:500,transition:"all .15s",whiteSpace:"nowrap"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#f0fdf4";e.currentTarget.style.color=T.green}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.text2}}
            >{n.label}</a>
          ))}
        </div>

        {/* RIGHT — Language Toggle (desktop) */}
        <div className="nav-links" style={{display:"flex",alignItems:"center",gap:6,flex:1,justifyContent:"flex-end"}}>
          {LANGS.map(l=><LangBtn key={l.id} l={l}/>)}
        </div>

        {/* Mobile menu button */}
        <button className="menu-btn"
          onClick={()=>setMobileMenu(v=>!v)}
          style={{display:"none",background:"none",border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:18,color:T.text2,alignItems:"center",justifyContent:"center"}}>
          {mobileMenu?"✕":"☰"}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenu&&(
        <div className="mobile-drawer" style={{
          position:"fixed",top:T.navH,left:0,right:0,zIndex:99,
          background:"#fff",borderBottom:`1px solid ${T.border}`,
          padding:"16px 20px",boxShadow:T.shadowMd,
        }}>
          <div style={{marginBottom:14}}>
            <div className="mono" style={{fontSize:10,color:T.text3,marginBottom:8,letterSpacing:1}}>LANGUAGE</div>
            <div style={{display:"flex",gap:8}}>
              {LANGS.map(l=><LangBtn key={l.id} l={l}/>)}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {[
              {label:"📊 Analyze",  href:"#analyze"},
              {label:"😰 Fear & Greed", href:"#feargreed"},
              {label:"🎯 Mera Budget", href:"#budget"},
              {label:"🩹 Loss Recovery", href:"#recovery"},
            ].map(n=>(
              <a key={n.label} href={n.href} onClick={()=>setMobileMenu(false)}
                style={{fontSize:13,color:T.text2,textDecoration:"none",padding:"8px 10px",borderRadius:8,fontWeight:500,background:T.cardBg2}}>
                {n.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ══ PAGE CONTENT ════════════════════════════════════════════════════ */}
      <div style={{maxWidth:680,margin:"0 auto",padding:`${T.navH+22}px 16px 48px`,position:"relative"}}>

        {/* HERO */}
        <div id="analyze" style={{textAlign:"center",marginBottom:22}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:10}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:T.green,boxShadow:`0 0 10px ${T.green}`,animation:"blink 2s infinite"}}/>
            <span className="mono" style={{fontSize:10,color:T.green,letterSpacing:3}}>LIVE · BINANCE DATA · AI POWERED</span>
          </div>
          <h1 style={{fontSize:28,fontWeight:700,letterSpacing:-1.2,background:"linear-gradient(135deg,#0f172a 30%,#475569)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.1}}>
            Abhi Kya Karna Chahiye?
          </h1>
          <p className="mono" style={{fontSize:12,color:T.text3,marginTop:6}}>
            👉 Real-time BUY / SELL / HOLD / WAIT — powered by AI
          </p>

          {/* Language indicator pill (shows selected lang) */}
          <div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:10,background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:20,padding:"4px 12px"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:T.green,display:"inline-block"}}/>
            <span className="mono" style={{fontSize:10,color:"#059669",fontWeight:600}}>
              {lang==="english"?"🇺🇸 English Response"
              :lang==="hindi"?"🇮🇳 Hindi Response"
              :"😎 Hinglish Response"}
            </span>
          </div>
        </div>

        {/* SEARCH */}
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&analyze()}
            placeholder="Coin: BTC, ETH, SOL, APT, DOGE, SUI, XRP…"
            style={{flex:1,background:T.inputBg,border:`1px solid ${T.border2}`,borderRadius:10,padding:"13px 16px",fontSize:14,transition:"border-color .2s",color:T.text}}/>
          <button onClick={analyze} disabled={loading}
            style={{background:loading?"#e2e8f0":`linear-gradient(135deg,${T.green},${T.greenDk})`,color:loading?T.text3:"#fff",border:"none",borderRadius:10,padding:"13px 22px",fontWeight:700,fontSize:14,cursor:loading?"not-allowed":"pointer",whiteSpace:"nowrap",fontFamily:"'Space Grotesk',sans-serif",boxShadow:loading?"none":"0 4px 14px rgba(16,185,129,.35)"}}>
            {loading?"⟳":"⚡ Analyze"}
          </button>
        </div>

        {/* CHIPS */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:22}}>
          {["BTC","ETH","SOL","APT","BNB","DOGE","XRP","SUI","PEPE","INJ"].map(c=>(
            <button key={c} onClick={()=>setQuery(c)} className="mono"
              style={{background:"#fff",border:`1px solid ${T.border}`,color:T.text2,padding:"4px 12px",borderRadius:20,fontSize:11,cursor:"pointer",transition:"all .15s",boxShadow:T.shadow}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.green;e.currentTarget.style.color=T.green;e.currentTarget.style.background="#f0fdf4"}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.text2;e.currentTarget.style.background="#fff"}}
            >{c}</button>
          ))}
        </div>

        {error&&(
          <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"12px 16px",color:"#dc2626",marginBottom:14,fontSize:13}} className="mono">
            ⚠️ {error}
          </div>
        )}

        {loading&&(
          <div style={{textAlign:"center",padding:"52px 0"}}>
            <div style={{width:36,height:36,border:`2px solid ${T.border}`,borderTopColor:T.green,borderRadius:"50%",margin:"0 auto 14px",animation:"spin .9s linear infinite"}}/>
            <p className="mono" style={{color:T.text3,fontSize:12}}>Fetching from Binance…</p>
          </div>
        )}

        {/* ══ RESULTS ══ */}
        {result&&!loading&&(
          <div className="fadein">

            {/* Coin Header */}
            <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,boxShadow:T.shadow}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <img src={result.image} alt="" onError={e=>e.target.style.display="none"} style={{width:42,height:42,borderRadius:"50%",border:`2px solid ${T.border}`}}/>
                <div>
                  <div style={{fontWeight:700,fontSize:18}}>{result.name}</div>
                  <div className="mono" style={{color:T.text3,fontSize:11}}>{result.symbol} · Binance Live</div>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div className="mono" style={{fontSize:22,fontWeight:700}}>{fmt(result.price)}</div>
                <div className="mono" style={{fontSize:12}}>
                  <span style={{color:result.ch24>=0?"#059669":"#dc2626",fontWeight:600}}>{result.ch24>=0?"▲":"▼"}{Math.abs(result.ch24).toFixed(2)}% 24h</span>
                  {"  "}
                  <span style={{color:result.ch7d>=0?"#059669":"#dc2626",fontWeight:600}}>{result.ch7d>=0?"▲":"▼"}{Math.abs(result.ch7d).toFixed(2)}% 7d</span>
                </div>
              </div>
            </div>

            {/* SCAM DETECTOR */}
            {scamInfo&&(
              <div style={{background:scamInfo.pts>=5?"#fef2f2":scamInfo.pts>=3?"#fffbeb":"#f0fdf4",border:`1px solid ${scamInfo.pts>=5?"#fecaca":scamInfo.pts>=3?"#fde68a":"#bbf7d0"}`,borderRadius:10,padding:"12px 16px",marginBottom:10,boxShadow:T.shadow}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:scamInfo.flags.length?8:0}}>
                  <span style={{fontSize:16}}>{scamInfo.emoji}</span>
                  <span className="mono" style={{fontSize:10,letterSpacing:2,color:scamInfo.color}}>SCAM DETECTOR</span>
                  <span style={{marginLeft:"auto",borderRadius:20,padding:"2px 10px",fontSize:11,color:scamInfo.color,fontWeight:700,background:"rgba(0,0,0,.05)",border:`1px solid ${scamInfo.color}33`}}>{scamInfo.verdict}</span>
                </div>
                {scamInfo.flags.length>0&&(
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:scamText?8:0}}>
                    {scamInfo.flags.map((f,i)=>(
                      <span key={i} className="mono" style={{background:"#fee2e2",border:"1px solid #fecaca",borderRadius:20,padding:"2px 9px",fontSize:10,color:"#dc2626"}}>{f}</span>
                    ))}
                  </div>
                )}
                {scamLoad&&<div style={{height:28,background:T.border,borderRadius:6,animation:"shimmer 1.5s infinite"}}/>}
                {scamText&&<p style={{fontSize:12,color:T.text2,lineHeight:1.6,whiteSpace:"pre-line",marginTop:4}}>{scamText}</p>}
              </div>
            )}

            {/* BIG DECISION BOX */}
            <div style={{background:dc.bg,border:`2px solid ${dc.border}`,borderRadius:14,padding:"28px 20px",marginBottom:10,textAlign:"center",boxShadow:dc.glow,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${dc.border},transparent)`}}/>
              <div className="mono" style={{fontSize:10,color:T.text3,letterSpacing:3,marginBottom:10}}>AI RECOMMENDATION</div>
              <div style={{fontSize:46,fontWeight:800,color:dc.text,letterSpacing:-2,lineHeight:1}}>{dc.label}</div>
              <div className="mono" style={{fontSize:14,color:T.text2,marginTop:12}}>
                Confidence: <strong style={{color:T.text}}>{result.confidence}%</strong>
                {"  ·  "}
                Risk: <strong style={{color:result.risk==="High"?"#dc2626":result.risk==="Medium"?"#d97706":"#059669"}}>{result.risk}</strong>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",marginTop:14}}>
                {result.factors.slice(0,4).map((f,i)=>(
                  <span key={i} className="mono" style={{background:"rgba(0,0,0,.05)",border:`1px solid ${T.border}`,borderRadius:20,padding:"3px 10px",fontSize:10,color:T.text2}}>{f}</span>
                ))}
              </div>
            </div>

            {/* Indicators */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
              {[
                {label:"RSI (14)",val:result.rsi,sub:parseFloat(result.rsi)<30?"🔥 Oversold":parseFloat(result.rsi)>70?"❗ Overbought":"Neutral",sc:parseFloat(result.rsi)<30?"#059669":parseFloat(result.rsi)>70?"#dc2626":T.text3},
                {label:"MA 50",  val:result.ma50!=="—"?fmt(parseFloat(result.ma50)):result.ma50,   sub:result.ma50!=="—"&&result.price>parseFloat(result.ma50)?"Price above ↑":"Price below ↓",    sc:result.ma50!=="—"&&result.price>parseFloat(result.ma50)?"#059669":"#dc2626"},
                {label:"MA 200", val:result.ma200!=="—"?fmt(parseFloat(result.ma200)):result.ma200, sub:result.ma200!=="—"&&result.price>parseFloat(result.ma200)?"Long-term bull ↑":"Long-term bear ↓",sc:result.ma200!=="—"&&result.price>parseFloat(result.ma200)?"#059669":"#dc2626"},
              ].map((s,i)=>(
                <div key={i} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:"12px",textAlign:"center",boxShadow:T.shadow}}>
                  <div className="mono" style={{fontSize:10,color:T.text3,marginBottom:4}}>{s.label}</div>
                  <div className="mono" style={{fontSize:13,fontWeight:700,color:T.text}}>{s.val}</div>
                  <div style={{fontSize:10,color:s.sc,marginTop:3,fontWeight:600}}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Health + Mood */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:"14px",boxShadow:T.shadow}}>
                <div className="mono" style={{fontSize:10,color:T.text3,marginBottom:10,letterSpacing:1}}>COIN HEALTH</div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div className="mono" style={{fontSize:28,fontWeight:800,color:result.healthScore>=80?"#059669":result.healthScore>=50?"#d97706":"#dc2626"}}>{result.healthScore}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:result.healthScore>=80?"#059669":result.healthScore>=50?"#d97706":"#dc2626"}}>
                      {result.healthScore>=80?"💪 Strong":result.healthScore>=50?"⚖️ Neutral":"⚠️ Weak"}
                    </div>
                    <div style={{width:80,height:5,background:T.border,borderRadius:3,marginTop:6}}>
                      <div style={{width:`${result.healthScore}%`,height:"100%",background:result.healthScore>=80?"#10b981":result.healthScore>=50?"#f59e0b":"#ef4444",borderRadius:3,transition:"width .6s"}}/>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:"14px",boxShadow:T.shadow}}>
                <div className="mono" style={{fontSize:10,color:T.text3,marginBottom:8,letterSpacing:1}}>MARKET MOOD</div>
                <div style={{fontSize:28}}>{mood.emoji}</div>
                <div style={{fontWeight:700,fontSize:16,color:mood.color,marginTop:2}}>{result.mood}</div>
              </div>
            </div>

            {/* Entry / Exit / Stop */}
            <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px",marginBottom:10,boxShadow:T.shadow}}>
              <div className="mono" style={{fontSize:10,color:T.text3,marginBottom:12,letterSpacing:1}}>SMART ENTRY / EXIT ZONES</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,textAlign:"center"}}>
                <div style={{background:"#f0fdf4",borderRadius:8,padding:"12px 8px"}}>
                  <div style={{fontSize:11,color:"#059669",marginBottom:6,fontWeight:600}}>📥 ENTRY</div>
                  <div className="mono" style={{fontSize:12,color:"#059669",fontWeight:700}}>{fmt(result.entryLow)}</div>
                  <div style={{fontSize:10,color:T.text3,margin:"2px 0"}}>–</div>
                  <div className="mono" style={{fontSize:12,color:"#059669",fontWeight:700}}>{fmt(result.entryHigh)}</div>
                </div>
                <div style={{background:"#fffbeb",borderRadius:8,padding:"12px 8px"}}>
                  <div style={{fontSize:11,color:"#d97706",marginBottom:6,fontWeight:600}}>📤 EXIT TARGET</div>
                  <div className="mono" style={{fontSize:15,color:"#d97706",fontWeight:800}}>{fmt(result.exitTarget)}</div>
                  <div className="mono" style={{fontSize:10,color:T.text3,marginTop:4}}>+{(((result.exitTarget/result.price)-1)*100).toFixed(1)}%</div>
                </div>
                <div style={{background:"#fef2f2",borderRadius:8,padding:"12px 8px"}}>
                  <div style={{fontSize:11,color:"#dc2626",marginBottom:6,fontWeight:600}}>🛑 STOP LOSS</div>
                  <div className="mono" style={{fontSize:15,color:"#dc2626",fontWeight:800}}>{fmt(result.stopLoss)}</div>
                  <div className="mono" style={{fontSize:10,color:T.text3,marginTop:4}}>−6%</div>
                </div>
              </div>
            </div>

            {/* YES YOU PRO AI ANALYSIS */}
            <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:"14px 16px",marginBottom:10,boxShadow:T.shadow}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <div style={{background:`linear-gradient(135deg,${T.green},${T.greenDk})`,borderRadius:6,padding:"2px 8px",fontWeight:800,fontSize:11,color:"#fff",fontFamily:"'Space Grotesk',sans-serif",flexShrink:0}}>YYP</div>
                <span className="mono" style={{fontSize:10,color:"#059669",letterSpacing:2}}>YES YOU PRO AI ANALYSIS</span>
                <span style={{marginLeft:"auto",background:"#dcfce7",border:"1px solid #86efac",borderRadius:20,padding:"2px 8px",fontSize:10,color:"#059669",fontWeight:600}}>
                  {lang==="english"?"🇺🇸 EN":lang==="hindi"?"🇮🇳 HI":"😎 Mix"}
                </span>
                {aiLoading&&(
                  <div style={{display:"flex",gap:3}}>
                    {[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:T.green,animation:`blink 1.2s ${i*.2}s infinite`}}/>)}
                  </div>
                )}
              </div>
              {aiText
                ?<p style={{fontSize:13,color:"#166534",lineHeight:1.65,whiteSpace:"pre-line"}}>{aiText}</p>
                :<div style={{height:40,background:"#dcfce7",borderRadius:6,animation:"shimmer 1.5s infinite"}}/>}
              <div className="mono" style={{fontSize:9,color:T.text3,marginTop:10,textAlign:"right"}}>Powered by YesYouPro · yesyoupro.com</div>
            </div>

            {/* Market stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
              {[{l:"24h Volume (USDT)",v:fmtBig(result.volume)},{l:"Market Cap",v:result.marketCap>0?fmtBig(result.marketCap):"—"}].map((s,i)=>(
                <div key={i} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",boxShadow:T.shadow}}>
                  <div className="mono" style={{fontSize:10,color:T.text3,marginBottom:4}}>{s.l}</div>
                  <div className="mono" style={{fontSize:15,fontWeight:700}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ FEAR & GREED ══ */}
        {fgInfo&&fg&&(
          <div id="feargreed" style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:"16px",marginBottom:10,boxShadow:T.shadow}}>
            <div className="mono" style={{fontSize:10,color:T.text3,marginBottom:12,letterSpacing:1}}>😰 INDIA CRYPTO FEAR & GREED INDEX</div>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{fontSize:36}}>{fgInfo.emoji}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontWeight:700,fontSize:15,color:fgInfo.color}}>{fgInfo.label}</span>
                  <span className="mono" style={{fontSize:22,fontWeight:800,color:fgInfo.color}}>{fg.value}</span>
                </div>
                <div style={{height:10,borderRadius:5,background:"linear-gradient(90deg,#dc2626 0%,#f59e0b 40%,#fbbf24 55%,#34d399 75%,#10b981 100%)",position:"relative",boxShadow:"inset 0 1px 3px rgba(0,0,0,.1)"}}>
                  <div style={{position:"absolute",top:-3,left:`${Math.min(97,Math.max(3,fg.value))}%`,transform:"translateX(-50%)",width:16,height:16,borderRadius:"50%",background:"#fff",border:`2px solid ${fgInfo.color}`,boxShadow:`0 0 8px ${fgInfo.color}66`,transition:"left .6s ease"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                  <span className="mono" style={{fontSize:9,color:T.text3}}>0 · Extreme Fear</span>
                  <span className="mono" style={{fontSize:9,color:T.text3}}>100 · Extreme Greed</span>
                </div>
              </div>
            </div>
            <div className="mono" style={{fontSize:10,color:T.text3,marginTop:10,padding:"8px 10px",background:T.cardBg2,borderRadius:8}}>
              {fg.value<30 &&"📉 Market mein bahut darr — historically yeh buying opportunity hoti hai"}
              {fg.value>=30&&fg.value<50&&"😨 Investors careful hain — accumulation ka samay ho sakta hai"}
              {fg.value>=50&&fg.value<70&&"⚖️ Market neutral hai — wait karo confirmation ke liye"}
              {fg.value>=70&&fg.value<85&&"📈 Greed badh rahi hai — careful, correction aa sakta hai"}
              {fg.value>=85 &&"🚨 Extreme greed — market top ke kareeb, zyada risk"}
            </div>
          </div>
        )}

        {/* ══ TOOLS ══ */}
        <div style={{borderTop:`2px solid ${T.border}`,margin:"4px 0 16px",position:"relative"}}>
          <span className="mono" style={{position:"absolute",top:-9,left:"50%",transform:"translateX(-50%)",background:T.pageBg,padding:"0 14px",fontSize:10,color:T.text3}}>TOOLS</span>
        </div>

        {/* 🎯 MERA BUDGET */}
        <div id="budget" style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:"16px",marginBottom:10,boxShadow:T.shadow}}>
          <div className="mono" style={{fontSize:10,color:T.text3,marginBottom:12,letterSpacing:1}}>🎯 MERA BUDGET — AI COIN ADVISOR</div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <select value={budgetCur} onChange={e=>setBudgetCur(e.target.value)}
              style={{background:T.inputBg,border:`1px solid ${T.border2}`,borderRadius:8,padding:"10px 12px",fontSize:13,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
            </select>
            <input value={budgetAmt} onChange={e=>setBudgetAmt(e.target.value)}
              placeholder={`Amount (e.g. ${budgetCur==="INR"?"5000":"100"})`} type="number"
              style={{flex:1,background:T.inputBg,border:`1px solid ${T.border2}`,borderRadius:8,padding:"10px 12px",fontSize:13,color:T.text}}/>
            <button onClick={callBudgetAI} disabled={budgetLoad||!budgetAmt}
              style={{background:budgetLoad||!budgetAmt?"#e2e8f0":`linear-gradient(135deg,${T.green},${T.greenDk})`,color:budgetLoad||!budgetAmt?T.text3:"#fff",border:"none",borderRadius:8,padding:"10px 18px",fontWeight:700,fontSize:13,cursor:budgetLoad||!budgetAmt?"not-allowed":"pointer",fontFamily:"'Space Grotesk',sans-serif",whiteSpace:"nowrap",boxShadow:budgetLoad||!budgetAmt?"none":"0 4px 12px rgba(16,185,129,.3)"}}>
              {budgetLoad?"⟳":"Ask AI"}
            </button>
          </div>
          {budgetLoad&&<div style={{height:80,background:T.cardBg2,borderRadius:8,animation:"shimmer 1.5s infinite"}}/>}
          {budgetText&&(
            <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:8,padding:"12px"}}>
              <p style={{fontSize:13,color:"#166534",lineHeight:1.7,whiteSpace:"pre-line"}}>{budgetText}</p>
            </div>
          )}
        </div>

        {/* 💡 WHAT-IF */}
        {result&&(
          <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:"16px",marginBottom:10,boxShadow:T.shadow}}>
            <div className="mono" style={{fontSize:10,color:T.text3,marginBottom:10,letterSpacing:1}}>💡 WHAT-IF SIMULATOR</div>
            <input value={investAmt} onChange={e=>setInvestAmt(e.target.value)} placeholder="Investment in $ (e.g. 500)" type="number"
              style={{...inputSt,marginBottom:10}}/>
            {whatIf&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
                {whatIf.map((r,i)=>(
                  <div key={i} style={{background:i<3?"#f0fdf4":"#fef2f2",border:`1px solid ${i<3?"#bbf7d0":"#fecaca"}`,borderRadius:8,padding:"10px 4px",textAlign:"center"}}>
                    <div className="mono" style={{fontSize:11,color:r.color,fontWeight:700}}>{r.label}</div>
                    <div className="mono" style={{fontSize:11,color:T.text,marginTop:3,fontWeight:600}}>${r.val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 🩹 LOSS RECOVERY */}
        <div id="recovery" style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:"16px",marginBottom:20,boxShadow:T.shadow}}>
          <div className="mono" style={{fontSize:10,color:T.text3,marginBottom:10,letterSpacing:1}}>🩹 LOSS RECOVERY PLANNER</div>
          <input value={lossAmt} onChange={e=>setLossAmt(e.target.value)} placeholder="Your loss % (e.g. 30 = lost 30%)" type="number" min="1" max="99"
            style={{...inputSt,marginBottom:10}}/>
          {lossRec&&(
            <div>
              <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 12px",marginBottom:10}}>
                <span className="mono" style={{fontSize:12,color:"#dc2626"}}>
                  Lost {lossAmt}%? → Need <strong style={{color:"#991b1b"}}>{lossRec.req}% gain</strong> to break even
                </span>
              </div>
              {[
                {icon:"🐢",name:"Safe",       plan:lossRec.safe,c:"#059669",bg:"#f0fdf4",br:"#bbf7d0"},
                {icon:"⚖️",name:"Moderate",   plan:lossRec.mod, c:"#d97706",bg:"#fffbeb",br:"#fde68a"},
                {icon:"🎲",name:"Aggressive",  plan:lossRec.agg, c:"#dc2626",bg:"#fef2f2",br:"#fecaca"},
              ].map((p,i)=>(
                <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start",background:p.bg,border:`1px solid ${p.br}`,borderRadius:8,padding:"10px 12px"}}>
                  <span style={{fontSize:14,flexShrink:0}}>{p.icon}</span>
                  <div>
                    <span className="mono" style={{fontSize:11,color:p.c,fontWeight:700}}>{p.name}: </span>
                    <span style={{fontSize:12,color:T.text2}}>{p.plan}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mono" style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",fontSize:10,color:T.text3,textAlign:"center",lineHeight:1.6,boxShadow:T.shadow}}>
          ⚠️ AI-based analysis only — not financial advice. Crypto is highly volatile. Always DYOR.<br/>
          Data: Binance (real-time) · Fear & Greed: Alternative.me · AI: YesYouPro
        </div>
      </div>
    </main>
  );
}
