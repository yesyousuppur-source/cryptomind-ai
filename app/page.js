"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { calcRSI, calcMA, buildDecision } from "../lib/indicators";
import { INPUT_MAP, FULL_NAME, DECISION_CONFIG, MOOD_CONFIG, fmt, fmtBig } from "../lib/constants";

// ── HELPERS ───────────────────────────────────────────────────────────────────
function detectScam({ ch24, ch7d, volume, marketCap, rsi }) {
  let pts = 0; const flags = [];
  if (ch24 > 50)    { pts+=3; flags.push(`Extreme 24h pump (+${ch24.toFixed(0)}%)`); }
  else if (ch24>30) { pts+=2; flags.push(`Suspicious surge (+${ch24.toFixed(0)}%)`); }
  if (ch7d > 200)   { pts+=3; flags.push(`Massive 7d pump (+${ch7d.toFixed(0)}%)`); }
  else if (ch7d>80) { pts+=2; flags.push(`Very high 7d gain (+${ch7d.toFixed(0)}%)`); }
  if (marketCap>0 && marketCap<50_000_000 && volume>marketCap*0.4)
    { pts+=3; flags.push("Volume >> Market Cap"); }
  if (rsi && parseFloat(rsi)>88) { pts+=2; flags.push(`RSI extremely overbought (${rsi})`); }
  if (marketCap>0 && marketCap<1_000_000) { pts+=2; flags.push("Very low market cap"); }
  let verdict,color,emoji,bg,border;
  if      (pts>=5){verdict="HIGH RISK";  color="#dc2626";emoji="🚨";bg="linear-gradient(135deg,#fff1f2,#fee2e2)";border="#fca5a5";}
  else if (pts>=3){verdict="SUSPICIOUS"; color="#d97706";emoji="⚠️";bg="linear-gradient(135deg,#fffbeb,#fef3c7)";border="#fde68a";}
  else            {verdict="Looks Safe"; color="#059669";emoji="✅";bg="linear-gradient(135deg,#f0fdf4,#dcfce7)";border="#86efac";}
  return { verdict,color,emoji,flags,pts,bg,border };
}

const FG_CFG = [
  {max:25,label:"Extreme Fear",color:"#dc2626",emoji:"😱",bg:"#fef2f2"},
  {max:45,label:"Fear",        color:"#f87171",emoji:"😨",bg:"#fff1f2"},
  {max:55,label:"Neutral",     color:"#d97706",emoji:"⚖️",bg:"#fffbeb"},
  {max:75,label:"Greed",       color:"#059669",emoji:"😏",bg:"#f0fdf4"},
  {max:100,label:"Extreme Greed",color:"#10b981",emoji:"🤑",bg:"#ecfdf5"},
];
const getFG = (v) => FG_CFG.find(c=>v<=c.max)||FG_CFG[4];

const DC_P = {
  BUY:  {bg:"linear-gradient(135deg,#ecfdf5,#d1fae5)",border:"#10b981",text:"#065f46",glow:"0 8px 32px rgba(16,185,129,.25)",label:"🟢 BUY", accent:"#10b981"},
  SELL: {bg:"linear-gradient(135deg,#fff1f2,#fee2e2)",border:"#ef4444",text:"#991b1b",glow:"0 8px 32px rgba(239,68,68,.2)", label:"🔴 SELL",accent:"#ef4444"},
  HOLD: {bg:"linear-gradient(135deg,#eef2ff,#e0e7ff)",border:"#6366f1",text:"#3730a3",glow:"0 8px 32px rgba(99,102,241,.2)",label:"🔵 HOLD",accent:"#6366f1"},
  WAIT: {bg:"linear-gradient(135deg,#fffbeb,#fef3c7)",border:"#f59e0b",text:"#92400e",glow:"0 8px 32px rgba(245,158,11,.2)", label:"🟡 WAIT",accent:"#f59e0b"},
};

// ── TAB CONFIG ────────────────────────────────────────────────────────────────
const TABS = [
  {id:"analyze", icon:"🔍", label:"Analyze"},
  {id:"explain", icon:"🤖", label:"Explain"},
  {id:"scam",    icon:"🛡️", label:"Scam Check"},
  {id:"news",    icon:"📰", label:"News Impact"},
];

// ── SECTION HEADER ────────────────────────────────────────────────────────────
const SH = ({icon,title,subtitle,color="#10b981",bg="linear-gradient(135deg,#ecfdf5,#d1fae5)",br="#6ee7b7"}) => (
  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
    <div style={{width:42,height:42,background:bg,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,border:`1px solid ${br}`,flexShrink:0}}>{icon}</div>
    <div>
      <div style={{fontWeight:800,fontSize:15,color:"#0f172a"}}>{title}</div>
      <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{subtitle}</div>
    </div>
  </div>
);

export default function Home() {
  const [activeTab, setActiveTab] = useState("analyze");

  // analyze tab
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
  const [top5,setTop5]             = useState(null);
  const [top5Load,setTop5Load]     = useState(false);
  const [top5Fetched,setTop5Fetched] = useState(false);
  const [ssFile,setSsFile]         = useState(null);
  const [ssPreview,setSsPreview]   = useState(null);
  const [ssText,setSsText]         = useState("");
  const [ssLoad,setSsLoad]         = useState(false);
  const [situation,setSituation]   = useState("");
  const [adviceText,setAdviceText] = useState("");
  const [adviceLoad,setAdviceLoad] = useState(false);

  // explain tab
  const [explainQuery,setExplainQuery] = useState("");
  const [explainText,setExplainText]   = useState("");
  const [explainLoad,setExplainLoad]   = useState(false);

  // scam check tab
  const [scamQuery,setScamQuery]     = useState("");
  const [scamResult,setScamResult]   = useState(null);
  const [scamAiText,setScamAiText]   = useState("");
  const [scamTabLoad,setScamTabLoad] = useState(false);
  const [scamTabErr,setScamTabErr]   = useState(null);

  // news tab
  const [newsQuery,setNewsQuery]     = useState("");
  const [newsData,setNewsData]       = useState(null);
  const [newsAiText,setNewsAiText]   = useState("");
  const [newsLoad,setNewsLoad]       = useState(false);
  const [newsAiLoad,setNewsAiLoad]   = useState(false);

  const cache   = useRef({});
  const fileRef = useRef(null);

  useEffect(()=>{
    fetch("/api/feargreed").then(r=>r.json()).then(setFg).catch(()=>setFg({value:50}));
  },[]);

  // ── ANALYZE ────────────────────────────────────────────────────────────────
  const analyze = async () => {
    const raw=query.trim().toLowerCase(); if(!raw) return;
    const sym=INPUT_MAP[raw]||raw.toUpperCase();
    setError(null);setAiText("");setResult(null);setScamInfo(null);setScamText("");
    const now=Date.now();
    if(cache.current[sym]&&now-cache.current[sym].ts<60000){
      const d=cache.current[sym].data; setResult(d);setScamInfo(detectScam(d));callAI(d); return;
    }
    setLoading(true);
    try{
      const [tickR,klinesR]=await Promise.all([
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`),
        fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=1d&limit=200`),
      ]);
      if(!tickR.ok) throw new Error(`"${sym}" not found. Try: BTC, ETH, SOL, APT…`);
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
      setResult(data);setScamInfo(scam);setLoading(false);
      callAI(data); if(scam.pts>=3) callScamAI(data,scam.flags);
    }catch(e){setError(e.message||"Failed.");setLoading(false);}
  };

  const callAI=async(d)=>{
    setAiLoading(true);
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"analysis",name:d.name,symbol:d.symbol,price:d.price,
          rsi:d.rsi,ma50:d.ma50,ma200:d.ma200,ch24:d.ch24,ch7d:d.ch7d,decision:d.decision,confidence:d.confidence,risk:d.risk})});
      const j=await r.json(); setAiText(j.text||"Analysis complete.");
    }catch(_){setAiText("📊 Indicators calculated.\n⚠️ Invest carefully.");}
    setAiLoading(false);
  };

  const callScamAI=async(d,flags)=>{
    setScamLoad(true);
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"scam",name:d.name,symbol:d.symbol,ch24:d.ch24,ch7d:d.ch7d,rsi:d.rsi,scamFlags:flags})});
      const j=await r.json(); setScamText(j.text||"");
    }catch(_){}
    setScamLoad(false);
  };

  const callBudgetAI=async()=>{
    if(!budgetAmt||parseFloat(budgetAmt)<=0) return;
    setBudgetLoad(true);setBudgetText("");
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"budget",budgetAmount:budgetAmt,budgetCurrency:budgetCur})});
      const j=await r.json(); setBudgetText(j.text||"");
    }catch(_){setBudgetText("Unable to generate. Please try again.");}
    setBudgetLoad(false);
  };

  const fetchTop5=async()=>{
    setTop5Load(true);setTop5Fetched(true);
    try{const r=await fetch("/api/top5");const j=await r.json();setTop5(j);}
    catch(_){setTop5({coins:[],updatedAt:new Date().toISOString()});}
    setTop5Load(false);
  };

  const handleFileChange=(e)=>{
    const file=e.target.files[0]; if(!file) return;
    setSsFile(file);setSsText("");
    const reader=new FileReader();
    reader.onload=ev=>setSsPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const analyzeScreenshot=async()=>{
    if(!ssFile) return;
    setSsLoad(true);setSsText("");
    try{
      const compressImage=(file)=>new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=(ev)=>{
          const img=new Image();
          img.onload=()=>{
            const canvas=document.createElement("canvas");
            const maxW=800; const scale=img.width>maxW?maxW/img.width:1;
            canvas.width=Math.round(img.width*scale); canvas.height=Math.round(img.height*scale);
            canvas.getContext("2d").drawImage(img,0,0,canvas.width,canvas.height);
            const dataUrl=canvas.toDataURL("image/jpeg",.7);
            resolve({base64:dataUrl.split(",")[1],mimeType:"image/jpeg"});
          };
          img.onerror=reject; img.src=ev.target.result;
        };
        reader.onerror=reject; reader.readAsDataURL(file);
      });
      const {base64,mimeType}=await compressImage(ssFile);
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"screenshot",imageBase64:base64,imageType:mimeType})});
      const j=await r.json(); setSsText(j.text||"Could not analyze.");
      setSsLoad(false);
    }catch(_){setSsText("Analysis failed. Please try again.");setSsLoad(false);}
  };

  const getPersonalAdvice=async()=>{
    if(!situation.trim()) return;
    setAdviceLoad(true);setAdviceText("");
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"personal",userSituation:situation})});
      const j=await r.json(); setAdviceText(j.text||"");
    }catch(_){setAdviceText("Unable to generate advice. Please try again.");}
    setAdviceLoad(false);
  };

  // ── EXPLAIN TAB ────────────────────────────────────────────────────────────
  const explainCoin=async()=>{
    const coin=explainQuery.trim(); if(!coin) return;
    setExplainLoad(true);setExplainText("");
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"explain",coinName:coin})});
      const j=await r.json(); setExplainText(j.text||"");
    }catch(_){setExplainText("Unable to explain. Please try again.");}
    setExplainLoad(false);
  };

  // ── SCAM CHECK TAB ─────────────────────────────────────────────────────────
  const checkScam=async()=>{
    const raw=scamQuery.trim().toLowerCase(); if(!raw) return;
    const sym=INPUT_MAP[raw]||raw.toUpperCase();
    setScamTabLoad(true);setScamResult(null);setScamAiText("");setScamTabErr(null);
    try{
      const [tickR,klinesR]=await Promise.all([
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`),
        fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=1d&limit=60`),
      ]);
      if(!tickR.ok) throw new Error(`"${sym}" not found on Binance.`);
      const tick=await tickR.json(); const klines=klinesR.ok?await klinesR.json():[];
      const price=parseFloat(tick.lastPrice),ch24=parseFloat(tick.priceChangePercent),volume=parseFloat(tick.quoteVolume);
      const closes=klines.map(k=>parseFloat(k[4]));
      const ch7d=closes.length>=8?((closes[closes.length-1]-closes[closes.length-8])/closes[closes.length-8])*100:ch24;
      const rsi=closes.length>15?calcRSI(closes):null;
      let marketCap=0;
      try{const ccR=await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${sym}&tsyms=USD`);
        if(ccR.ok){const cc=await ccR.json();marketCap=cc?.RAW?.[sym]?.USD?.MKTCAP||0;}}catch(_){}

      // Calculate scam signals
      const volMcapRatio=marketCap>0?(volume/marketCap).toFixed(2):"N/A";
      const flags=[];
      if(ch24>50) flags.push(`Extreme 24h pump (+${ch24.toFixed(0)}%)`);
      else if(ch24>25) flags.push(`High 24h pump (+${ch24.toFixed(0)}%)`);
      if(ch7d>100) flags.push(`Massive 7d pump (+${ch7d.toFixed(0)}%)`);
      if(marketCap>0&&marketCap<10_000_000) flags.push("Very low market cap (<$10M)");
      if(marketCap>0&&volume>marketCap*0.5) flags.push("Suspicious volume/market cap ratio");
      if(rsi&&parseFloat(rsi)>85) flags.push(`Extremely overbought RSI (${parseFloat(rsi).toFixed(1)})`);
      if(ch24<-30) flags.push("Sharp 24h dump — possible rug pull");

      const scamData={
        name:FULL_NAME[sym]||sym,symbol:sym,price:fmt(price),
        marketCap:marketCap>0?fmtBig(marketCap):"Unknown",
        ch24:ch24.toFixed(2),ch7d:ch7d.toFixed(2),
        volume:fmtBig(volume),volMcapRatio,
        rsi:rsi?rsi.toFixed(1):"—",flags,
      };
      setScamResult(scamData);
      setScamTabLoad(false);

      // Call AI for detailed analysis
      const r2=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"scam_ai",scamData})});
      const j=await r2.json(); setScamAiText(j.text||"");
    }catch(e){setScamTabErr(e.message||"Failed.");setScamTabLoad(false);}
  };

  // ── NEWS TAB ───────────────────────────────────────────────────────────────
  const fetchNews=async()=>{
    const coin=newsQuery.trim(); setNewsLoad(true);setNewsData(null);setNewsAiText("");
    try{
      const url=coin?`/api/news?coin=${coin.toUpperCase()}`:`/api/news?coin=general`;
      const r=await fetch(url); const j=await r.json();
      setNewsData(j); setNewsLoad(false);
      if(j.headlines){
        setNewsAiLoad(true);
        const r2=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({mode:"news_impact",newsHeadlines:j.headlines,coinName:coin||""})});
        const j2=await r2.json(); setNewsAiText(j2.text||"");
        setNewsAiLoad(false);
      }
    }catch(_){setNewsLoad(false);setNewsAiLoad(false);}
  };

  // ── UI HELPERS ─────────────────────────────────────────────────────────────
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

  const dc=result?DC_P[result.decision]:null;
  const mood=result?MOOD_CONFIG[result.mood]:null;
  const fgInfo=fg?getFG(fg.value):null;

  const CARD={background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,padding:"20px",marginBottom:12,boxShadow:"0 4px 20px rgba(0,0,0,.05)"};
  const INP={background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"11px 14px",fontSize:13,color:"#0f172a",width:"100%",transition:"border-color .2s",fontFamily:"'JetBrains Mono',monospace"};
  const RES={fontSize:13,color:"#166534",lineHeight:1.75,whiteSpace:"pre-line",fontWeight:500};

  const AiBox=({text,loading:isLoad,bg="linear-gradient(135deg,#ecfdf5,#f0fdf4)",border="1px solid #6ee7b7"})=>(
    <div style={{background:bg,border,borderRadius:14,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#10b981,#6ee7b7,#10b981)",backgroundSize:"200% auto",animation:"gradmove 3s linear infinite"}}/>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <div style={{background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:6,padding:"2px 8px",fontWeight:800,fontSize:11,color:"#fff"}}>YYP</div>
        <span style={{fontSize:10,color:"#059669",fontWeight:700,letterSpacing:1}}>YES YOU PRO AI</span>
        {isLoad&&<div style={{marginLeft:"auto",display:"flex",gap:3}}>{[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:"#10b981",animation:`blink 1.2s ${i*.2}s infinite`}}/>)}</div>}
      </div>
      {isLoad
        ?<div style={{height:56,background:"rgba(16,185,129,.08)",borderRadius:10,animation:"shimmer 1.5s infinite"}}/>
        :<p style={RES}>{text}</p>}
    </div>
  );

  return (
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f0fdf8",minHeight:"100vh",color:"#0f172a"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.9}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes gradmove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        .fadein{animation:fadein .4s cubic-bezier(.16,1,.3,1)}
        .mono{font-family:'JetBrains Mono',monospace}
        .float{animation:float 3s ease-in-out infinite}
        .pulse{animation:pulse 2s ease-in-out infinite}
        input,select,textarea{color:#0f172a;font-family:'JetBrains Mono',monospace}
        input::placeholder,textarea::placeholder{color:#94a3b8}
        input:focus,select:focus,textarea:focus{outline:none}
        button:active{transform:scale(.97)}
        .chip{transition:all .15s ease;cursor:pointer}
        .chip:hover{background:linear-gradient(135deg,#f0fdf4,#dcfce7)!important;border-color:#10b981!important;color:#059669!important;transform:translateY(-2px)!important}
        .hov{transition:transform .2s,box-shadow .2s}
        .hov:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(16,185,129,.12)!important}
        .btn{background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;border-radius:12px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 16px rgba(16,185,129,.35);font-family:'Inter',sans-serif}
        .btn:hover{box-shadow:0 8px 28px rgba(16,185,129,.5);transform:translateY(-1px)}
        .btn:disabled{background:#e2e8f0!important;color:#94a3b8!important;box-shadow:none!important;cursor:not-allowed!important;transform:none!important}
        .upload-zone{border:2px dashed #6ee7b7;border-radius:16px;padding:24px;text-align:center;cursor:pointer;transition:all .2s;background:linear-gradient(135deg,#f0fdf4,#ecfdf5)}
        .upload-zone:hover{border-color:#10b981;background:linear-gradient(135deg,#dcfce7,#d1fae5)}
        .tab-btn{border:none;background:transparent;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 6px;border-radius:12px;flex:1}
        .tab-btn:hover{background:rgba(16,185,129,.08)}
        .news-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;margin-bottom:8px;transition:all .15s}
        .news-card:hover{border-color:#6ee7b7;background:#f0fdf4}
      `}</style>

      {/* BG */}
      <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:-200,right:-200,width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(16,185,129,.08),transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:-100,left:-100,width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,.05),transparent 70%)"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(16,185,129,.09) 1px,transparent 1px)",backgroundSize:"32px 32px",opacity:.4}}/>
      </div>

      <div style={{maxWidth:700,margin:"0 auto",padding:"28px 16px 56px",position:"relative",zIndex:1}}>

        {/* ── HEADER ── */}
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#ecfdf5,#d1fae5)",border:"1px solid #6ee7b7",borderRadius:40,padding:"5px 16px",marginBottom:14}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#10b981",boxShadow:"0 0 10px #10b981",animation:"blink 2s infinite"}}/>
            <span className="mono" style={{fontSize:10,color:"#059669",fontWeight:600,letterSpacing:2}}>LIVE · BINANCE · AI POWERED</span>
          </div>
          <h1 style={{fontSize:36,fontWeight:900,letterSpacing:-2,lineHeight:1,marginBottom:6}}>
            <span style={{background:"linear-gradient(135deg,#0f172a,#1e293b 50%,#10b981)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>CryptoMind</span>
            <span style={{background:"linear-gradient(135deg,#10b981,#059669)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}> AI</span>
          </h1>
          <p style={{fontSize:14,color:"#64748b",fontWeight:500}}>
            👉 <strong style={{color:"#0f172a"}}>Abhi kya karna chahiye?</strong> — Real-time AI Analysis
          </p>
        </div>

        {/* ── TAB BAR ── */}
        <div style={{background:"#fff",borderRadius:16,padding:"6px",marginBottom:20,boxShadow:"0 4px 20px rgba(0,0,0,.06)",border:"1px solid #e2e8f0",display:"flex",gap:2}}>
          {TABS.map(t=>(
            <button key={t.id} className="tab-btn" onClick={()=>setActiveTab(t.id)}
              style={{color: activeTab===t.id?"#059669":"#94a3b8",background:activeTab===t.id?"linear-gradient(135deg,#ecfdf5,#d1fae5)":"transparent",border:activeTab===t.id?"1px solid #6ee7b7":"1px solid transparent"}}>
              <span style={{fontSize:18}}>{t.icon}</span>
              <span style={{fontSize:11}}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: ANALYZE                                                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab==="analyze" && (
          <div className="fadein">
            {/* Fear & Greed */}
            {fgInfo&&fg&&(
              <div className="hov" style={{...CARD}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:fgInfo.color}}/>
                  <span className="mono" style={{fontSize:10,color:"#94a3b8",letterSpacing:2,fontWeight:600}}>INDIA CRYPTO FEAR & GREED INDEX</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div className="float" style={{fontSize:40}}>{fgInfo.emoji}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:8}}>
                      <div><div style={{fontSize:18,fontWeight:800,color:fgInfo.color}}>{fgInfo.label}</div><div style={{fontSize:11,color:"#94a3b8"}}>Market sentiment</div></div>
                      <div style={{textAlign:"right"}}><div className="mono" style={{fontSize:28,fontWeight:900,color:fgInfo.color,lineHeight:1}}>{fg.value}</div><div style={{fontSize:10,color:"#94a3b8"}}>/100</div></div>
                    </div>
                    <div style={{height:10,borderRadius:6,background:"linear-gradient(90deg,#dc2626,#f59e0b 35%,#fbbf24 50%,#34d399 70%,#10b981)",position:"relative"}}>
                      <div style={{position:"absolute",top:-4,left:`${Math.min(96,Math.max(4,fg.value))}%`,transform:"translateX(-50%)",width:18,height:18,borderRadius:"50%",background:"#fff",border:`3px solid ${fgInfo.color}`,boxShadow:`0 2px 10px ${fgInfo.color}66`,transition:"left .8s ease"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                      <span style={{fontSize:9,color:"#dc2626",fontWeight:600}}>😱 FEAR</span>
                      <span style={{fontSize:9,color:"#10b981",fontWeight:600}}>GREED 🤑</span>
                    </div>
                  </div>
                </div>
                <div style={{marginTop:10,background:fgInfo.bg,borderRadius:10,padding:"8px 12px",fontSize:12,color:"#475569",fontWeight:500}}>
                  {fg.value<30&&"📉 Market mein bahut darr — historically yeh buying opportunity hoti hai"}
                  {fg.value>=30&&fg.value<50&&"😨 Investors careful hain — accumulation zone ho sakta hai"}
                  {fg.value>=50&&fg.value<70&&"⚖️ Market neutral — wait karo strong signal ke liye"}
                  {fg.value>=70&&fg.value<85&&"📈 Greed badh rahi — correction possible, careful raho"}
                  {fg.value>=85&&"🚨 Extreme greed — possible market top, zyada risk"}
                </div>
              </div>
            )}

            {/* Top 5 */}
            <div className="hov" style={{...CARD,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#f59e0b,#10b981,#6366f1)",backgroundSize:"200% auto",animation:"gradmove 3s linear infinite"}}/>
              <SH icon="🏆" title="Daily Top 5 Picks" subtitle="Real-time AI — strongest buy signals today"/>
              {!top5Fetched?(
                <div style={{textAlign:"center"}}>
                  <p style={{fontSize:13,color:"#64748b",marginBottom:12}}>25 coins scan → RSI + MA50 + MA200 real analysis</p>
                  <button className="btn" onClick={fetchTop5} style={{padding:"11px 24px",fontSize:13,borderRadius:12}}>🔍 Scan Top Coins Now</button>
                </div>
              ):top5Load?(
                <div style={{textAlign:"center",padding:"16px 0"}}>
                  <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:10}}>
                    {[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:"#10b981",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
                  </div>
                  <p style={{fontSize:12,color:"#64748b"}}>Scanning 25 coins…</p>
                </div>
              ):top5?.coins?.length>0?(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                    <span style={{fontSize:11,color:"#94a3b8"}}>Updated: {new Date(top5.updatedAt).toLocaleTimeString("en-IN")}</span>
                    <button onClick={fetchTop5} style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:20,padding:"3px 12px",fontSize:11,color:"#059669",fontWeight:600,cursor:"pointer"}}>🔄 Refresh</button>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {top5.coins.map((coin,i)=>(
                      <div key={coin.symbol} style={{background:`linear-gradient(135deg,${coin.signalBg},#fff)`,border:"1px solid #e2e8f0",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                        <div style={{width:30,height:30,borderRadius:"50%",background:i===0?"linear-gradient(135deg,#fbbf24,#f59e0b)":i===1?"linear-gradient(135deg,#94a3b8,#64748b)":i===2?"linear-gradient(135deg,#cd7c32,#b45309)":"linear-gradient(135deg,#e2e8f0,#cbd5e1)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:13,color:i<3?"#fff":"#64748b",flexShrink:0}}>{i+1}</div>
                        <img src={coin.image} alt="" onError={e=>e.target.style.display="none"} style={{width:34,height:34,borderRadius:"50%",border:"2px solid #e2e8f0",flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:14}}>{coin.name}</div>
                          <div className="mono" style={{fontSize:10,color:"#94a3b8"}}>{coin.symbol} · Score: {coin.score}/100</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div className="mono" style={{fontSize:13,fontWeight:700}}>{coin.price}</div>
                          <div style={{fontSize:11,color:parseFloat(coin.ch24)>=0?"#059669":"#dc2626",fontWeight:600}}>{parseFloat(coin.ch24)>=0?"▲":"▼"}{Math.abs(parseFloat(coin.ch24)).toFixed(1)}%</div>
                        </div>
                        <div style={{background:coin.signalBg,border:`1px solid ${coin.signalColor}44`,borderRadius:20,padding:"3px 10px",fontSize:10,color:coin.signalColor,fontWeight:800,whiteSpace:"nowrap"}}>{coin.signal}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ):(
                <div style={{textAlign:"center",color:"#94a3b8",fontSize:13,padding:"8px 0"}}>
                  No strong signals right now. <button onClick={fetchTop5} style={{color:"#059669",fontWeight:600,background:"none",border:"none",cursor:"pointer",fontSize:13}}>Try Again</button>
                </div>
              )}
            </div>

            {/* Search */}
            <div style={{...CARD}}>
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                <div style={{flex:1,position:"relative"}}>
                  <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:15}}>🔍</span>
                  <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&analyze()}
                    placeholder="Search: BTC, ETH, SOL, APT, DOGE…"
                    style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"12px 14px 12px 38px",fontSize:14,color:"#0f172a",transition:"border-color .2s"}}
                    onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                </div>
                <button onClick={analyze} disabled={loading} className="btn" style={{padding:"12px 22px",fontSize:14,borderRadius:12,whiteSpace:"nowrap"}}>
                  {loading?<span style={{display:"inline-block",animation:"spin .8s linear infinite"}}>⟳</span>:"⚡ Analyze"}
                </button>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["BTC","ETH","SOL","APT","BNB","DOGE","XRP","SUI","PEPE","INJ"].map(c=>(
                  <button key={c} onClick={()=>setQuery(c)} className="chip mono"
                    style={{background:"#f8fafc",border:"1px solid #e2e8f0",color:"#64748b",padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:500}}>{c}</button>
                ))}
              </div>
            </div>

            {error&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,padding:"12px 16px",color:"#dc2626",marginBottom:12,fontSize:13,display:"flex",gap:8}}><span>⚠️</span><span className="mono">{error}</span></div>}

            {loading&&(
              <div style={{textAlign:"center",padding:"48px 0"}}>
                <div style={{position:"relative",width:56,height:56,margin:"0 auto 16px"}}>
                  <div style={{position:"absolute",inset:0,border:"3px solid #e2e8f0",borderTopColor:"#10b981",borderRadius:"50%",animation:"spin .9s linear infinite"}}/>
                  <div style={{position:"absolute",inset:8,border:"2px solid #e2e8f0",borderTopColor:"#6ee7b7",borderRadius:"50%",animation:"spin 1.4s linear infinite reverse"}}/>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>₿</div>
                </div>
                <p style={{color:"#64748b",fontSize:13,fontWeight:500}}>Fetching real-time data from Binance…</p>
              </div>
            )}

            {result&&!loading&&(
              <div className="fadein">
                {/* Coin header */}
                <div className="hov" style={{...CARD,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{position:"relative"}}>
                      <img src={result.image} alt="" onError={e=>e.target.style.display="none"} style={{width:48,height:48,borderRadius:"50%",border:"2px solid #e2e8f0"}}/>
                      <div style={{position:"absolute",bottom:0,right:0,width:13,height:13,borderRadius:"50%",background:result.ch24>=0?"#10b981":"#ef4444",border:"2px solid #fff"}}/>
                    </div>
                    <div><div style={{fontWeight:800,fontSize:19}}>{result.name}</div><div className="mono" style={{color:"#94a3b8",fontSize:11}}>{result.symbol} · Binance</div></div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div className="mono" style={{fontSize:24,fontWeight:900}}>{fmt(result.price)}</div>
                    <div style={{display:"flex",gap:6,marginTop:4,justifyContent:"flex-end"}}>
                      <span style={{background:result.ch24>=0?"#f0fdf4":"#fef2f2",color:result.ch24>=0?"#059669":"#dc2626",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700}}>{result.ch24>=0?"▲":"▼"}{Math.abs(result.ch24).toFixed(2)}% 24h</span>
                      <span style={{background:result.ch7d>=0?"#f0fdf4":"#fef2f2",color:result.ch7d>=0?"#059669":"#dc2626",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700}}>{result.ch7d>=0?"▲":"▼"}{Math.abs(result.ch7d).toFixed(2)}% 7d</span>
                    </div>
                  </div>
                </div>

                {/* Scam banner */}
                {scamInfo&&(
                  <div style={{background:scamInfo.bg,border:`1px solid ${scamInfo.border}`,borderRadius:14,padding:"12px 16px",marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:scamInfo.flags.length?8:0}}>
                      <span style={{fontSize:16}}>{scamInfo.emoji}</span>
                      <span className="mono" style={{fontSize:10,letterSpacing:2,color:scamInfo.color}}>SCAM DETECTOR</span>
                      <span style={{marginLeft:"auto",borderRadius:20,padding:"2px 10px",fontSize:11,color:scamInfo.color,fontWeight:700,background:"rgba(255,255,255,.6)",border:`1px solid ${scamInfo.border}`}}>{scamInfo.verdict}</span>
                    </div>
                    {scamInfo.flags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:scamText?8:0}}>{scamInfo.flags.map((f,i)=><span key={i} className="mono" style={{background:"rgba(255,255,255,.6)",border:`1px solid ${scamInfo.border}`,borderRadius:20,padding:"2px 9px",fontSize:10,color:scamInfo.color}}>{f}</span>)}</div>}
                    {scamLoad&&<div style={{height:28,background:"rgba(255,255,255,.5)",borderRadius:8,animation:"shimmer 1.5s infinite"}}/>}
                    {scamText&&<p style={{fontSize:12,color:"#475569",lineHeight:1.6,whiteSpace:"pre-line",marginTop:6,padding:"8px 10px",background:"rgba(255,255,255,.6)",borderRadius:8}}>{scamText}</p>}
                  </div>
                )}

                {/* Decision */}
                <div style={{background:dc.bg,border:`2px solid ${dc.border}`,borderRadius:20,padding:"28px 20px",marginBottom:12,textAlign:"center",boxShadow:dc.glow,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:`linear-gradient(90deg,transparent,${dc.accent},transparent)`}}/>
                  <div className="mono" style={{fontSize:10,color:"#94a3b8",letterSpacing:3,marginBottom:12,fontWeight:600}}>AI RECOMMENDATION</div>
                  <div className="pulse" style={{fontSize:48,fontWeight:900,color:dc.text,letterSpacing:-3,lineHeight:1}}>{dc.label}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,margin:"14px 0"}}>
                    <div style={{flex:1,maxWidth:170}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:11,color:"#94a3b8",fontWeight:500}}>Confidence</span>
                        <span className="mono" style={{fontSize:12,fontWeight:700,color:dc.text}}>{result.confidence}%</span>
                      </div>
                      <div style={{height:7,background:"rgba(0,0,0,.08)",borderRadius:4,overflow:"hidden"}}>
                        <div style={{width:`${result.confidence}%`,height:"100%",background:`linear-gradient(90deg,${dc.accent}88,${dc.accent})`,borderRadius:4}}/>
                      </div>
                    </div>
                    <div style={{background:"rgba(255,255,255,.6)",borderRadius:10,padding:"5px 12px",border:`1px solid ${dc.border}`}}>
                      <span style={{fontSize:12,color:dc.text,fontWeight:700}}>Risk: <span style={{color:result.risk==="High"?"#dc2626":result.risk==="Medium"?"#d97706":"#059669"}}>{result.risk}</span></span>
                    </div>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,justifyContent:"center"}}>
                    {result.factors.slice(0,4).map((f,i)=><span key={i} className="mono" style={{background:"rgba(255,255,255,.6)",border:"1px solid rgba(0,0,0,.08)",borderRadius:20,padding:"3px 10px",fontSize:10,color:"#475569"}}>{f}</span>)}
                  </div>
                </div>

                {/* Indicators */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                  {[
                    {label:"RSI (14)",val:result.rsi,sub:parseFloat(result.rsi)<30?"🔥 Oversold":parseFloat(result.rsi)>70?"❗ Overbought":"✓ Neutral",sc:parseFloat(result.rsi)<30?"#059669":parseFloat(result.rsi)>70?"#dc2626":"#64748b",bg:parseFloat(result.rsi)<30?"#f0fdf4":parseFloat(result.rsi)>70?"#fef2f2":"#f8fafc"},
                    {label:"MA 50",val:result.ma50!=="—"?fmt(parseFloat(result.ma50)):result.ma50,sub:result.ma50!=="—"&&result.price>parseFloat(result.ma50)?"↑ Bullish":"↓ Bearish",sc:result.ma50!=="—"&&result.price>parseFloat(result.ma50)?"#059669":"#dc2626",bg:result.ma50!=="—"&&result.price>parseFloat(result.ma50)?"#f0fdf4":"#fef2f2"},
                    {label:"MA 200",val:result.ma200!=="—"?fmt(parseFloat(result.ma200)):result.ma200,sub:result.ma200!=="—"&&result.price>parseFloat(result.ma200)?"↑ Long Bull":"↓ Long Bear",sc:result.ma200!=="—"&&result.price>parseFloat(result.ma200)?"#059669":"#dc2626",bg:result.ma200!=="—"&&result.price>parseFloat(result.ma200)?"#f0fdf4":"#fef2f2"},
                  ].map((s,i)=>(
                    <div key={i} style={{background:s.bg,border:"1px solid #e2e8f0",borderRadius:14,padding:"12px",textAlign:"center"}}>
                      <div style={{fontSize:10,color:"#94a3b8",marginBottom:5,fontWeight:600}}>{s.label}</div>
                      <div className="mono" style={{fontSize:12,fontWeight:800,color:"#0f172a",marginBottom:3}}>{s.val}</div>
                      <div style={{fontSize:10,color:s.sc,fontWeight:700,background:"rgba(255,255,255,.6)",borderRadius:20,padding:"1px 6px",display:"inline-block"}}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Health + Mood */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                  <div className="hov" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"14px"}}>
                    <div style={{fontSize:10,color:"#94a3b8",marginBottom:10,fontWeight:600,letterSpacing:.5}}>COIN HEALTH</div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{position:"relative",width:48,height:48}}>
                        <svg viewBox="0 0 52 52" style={{transform:"rotate(-90deg)"}}>
                          <circle cx="26" cy="26" r="22" fill="none" stroke="#e2e8f0" strokeWidth="4"/>
                          <circle cx="26" cy="26" r="22" fill="none" stroke={result.healthScore>=80?"#10b981":result.healthScore>=50?"#f59e0b":"#ef4444"} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(result.healthScore/100)*138.2} 138.2`} style={{transition:"stroke-dasharray .8s"}}/>
                        </svg>
                        <div className="mono" style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:result.healthScore>=80?"#059669":result.healthScore>=50?"#d97706":"#dc2626"}}>{result.healthScore}</div>
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13,color:result.healthScore>=80?"#059669":result.healthScore>=50?"#d97706":"#dc2626"}}>{result.healthScore>=80?"💪 Strong":result.healthScore>=50?"⚖️ Neutral":"⚠️ Weak"}</div>
                        <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>Overall score</div>
                      </div>
                    </div>
                  </div>
                  <div className="hov" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"14px"}}>
                    <div style={{fontSize:10,color:"#94a3b8",marginBottom:10,fontWeight:600,letterSpacing:.5}}>MARKET MOOD</div>
                    <div className="float" style={{fontSize:32,marginBottom:4}}>{mood.emoji}</div>
                    <div style={{fontWeight:800,fontSize:16,color:mood.color}}>{result.mood}</div>
                  </div>
                </div>

                {/* Entry/Exit/Stop */}
                <div className="hov" style={{...CARD}}>
                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:12,fontWeight:600,letterSpacing:.5}}>📍 SMART ENTRY / EXIT ZONES</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    <div style={{background:"linear-gradient(135deg,#ecfdf5,#d1fae5)",borderRadius:12,padding:"12px 8px",textAlign:"center",border:"1px solid #6ee7b7"}}>
                      <div style={{fontSize:11,color:"#059669",fontWeight:700,marginBottom:6}}>📥 ENTRY</div>
                      <div className="mono" style={{fontSize:11,color:"#065f46",fontWeight:700}}>{fmt(result.entryLow)}</div>
                      <div style={{fontSize:9,color:"#94a3b8",margin:"2px 0"}}>to</div>
                      <div className="mono" style={{fontSize:11,color:"#065f46",fontWeight:700}}>{fmt(result.entryHigh)}</div>
                    </div>
                    <div style={{background:"linear-gradient(135deg,#fffbeb,#fef3c7)",borderRadius:12,padding:"12px 8px",textAlign:"center",border:"1px solid #fde68a"}}>
                      <div style={{fontSize:11,color:"#d97706",fontWeight:700,marginBottom:6}}>📤 EXIT</div>
                      <div className="mono" style={{fontSize:14,color:"#92400e",fontWeight:900}}>{fmt(result.exitTarget)}</div>
                      <div style={{fontSize:10,color:"#d97706",fontWeight:700,marginTop:4}}>+{(((result.exitTarget/result.price)-1)*100).toFixed(1)}%</div>
                    </div>
                    <div style={{background:"linear-gradient(135deg,#fff1f2,#fee2e2)",borderRadius:12,padding:"12px 8px",textAlign:"center",border:"1px solid #fca5a5"}}>
                      <div style={{fontSize:11,color:"#dc2626",fontWeight:700,marginBottom:6}}>🛑 STOP</div>
                      <div className="mono" style={{fontSize:14,color:"#991b1b",fontWeight:900}}>{fmt(result.stopLoss)}</div>
                      <div style={{fontSize:10,color:"#dc2626",fontWeight:700,marginTop:4}}>−6%</div>
                    </div>
                  </div>
                </div>

                {/* AI Analysis */}
                <AiBox text={aiText} loading={aiLoading}/>

                {/* Market Stats */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                  {[{l:"24h Volume",v:fmtBig(result.volume),icon:"📊"},{l:"Market Cap",v:result.marketCap>0?fmtBig(result.marketCap):"—",icon:"💰"}].map((s,i)=>(
                    <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"12px 14px"}}>
                      <div style={{fontSize:10,color:"#94a3b8",marginBottom:4,fontWeight:600}}>{s.icon} {s.l}</div>
                      <div className="mono" style={{fontSize:15,fontWeight:800}}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ✨ NEW FEATURES BANNER */}
            <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",borderRadius:20,padding:"18px 20px",marginBottom:12,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"radial-gradient(circle,rgba(16,185,129,.15),transparent)"}}/>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:6,padding:"2px 8px",fontWeight:800,fontSize:11,color:"#fff"}}>NEW</span>
                <span style={{fontSize:12,color:"#6ee7b7",fontWeight:700,letterSpacing:.5}}>EXCLUSIVE FEATURES</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {[
                  {icon:"🧠",label:"Crypto IQ Test",desc:"Test your knowledge + behavior"},
                  {icon:"🏥",label:"Health Checkup",desc:"Portfolio doctor report"},
                  {icon:"🤝",label:"Buddy System",desc:"Find your crypto mentor"},
                  {icon:"🌍",label:"Desi Network",desc:"NRI + India patterns"},
                ].map((f,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,.06)",borderRadius:12,padding:"10px 12px",border:"1px solid rgba(16,185,129,.2)"}}>
                    <span style={{fontSize:16}}>{f.icon}</span>
                    <div style={{fontWeight:700,fontSize:12,color:"#e2e8f0",marginTop:4}}>{f.label}</div>
                    <div style={{fontSize:10,color:"#6ee7b7",marginTop:2}}>{f.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <Link href="/features" style={{flex:1,background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",textDecoration:"none",borderRadius:12,padding:"11px",fontWeight:700,fontSize:13,textAlign:"center",boxShadow:"0 4px 16px rgba(16,185,129,.4)"}}>
                  ✨ Open Features
                </Link>
                <Link href="/arena" style={{flex:1,background:"rgba(255,255,255,.1)",color:"#e2e8f0",textDecoration:"none",borderRadius:12,padding:"11px",fontWeight:700,fontSize:13,textAlign:"center",border:"1px solid rgba(255,255,255,.15)"}}>
                  🏟️ Trading Arena
                </Link>
              </div>
            </div>

            {/* TOOLS divider */}
            <div style={{position:"relative",margin:"8px 0 16px"}}>
              <div style={{borderTop:"2px dashed #6ee7b7"}}/>
              <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#f0fdf8",padding:"0 14px"}}>
                <span style={{background:"linear-gradient(135deg,#10b981,#059669)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:900,fontSize:13}}>✦ TOOLS ✦</span>
              </div>
            </div>

            {/* Screenshot Analysis */}
            <div className="hov" style={{...CARD}}>
              <SH icon="📸" title="Screenshot Analysis" subtitle="Upload exchange screenshot — AI analyzes your portfolio"/>
              <div className="upload-zone" onClick={()=>fileRef.current?.click()}>
                {ssPreview?(
                  <div><img src={ssPreview} alt="" style={{maxHeight:160,borderRadius:10,marginBottom:8,maxWidth:"100%"}}/><p style={{fontSize:12,color:"#059669",fontWeight:600}}>✓ Image ready — click Analyze</p></div>
                ):(
                  <div><div style={{fontSize:36,marginBottom:8}}>📷</div><p style={{fontSize:13,color:"#059669",fontWeight:700,marginBottom:3}}>Upload Screenshot</p><p style={{fontSize:11,color:"#64748b"}}>WazirX, CoinDCX, Binance — any exchange</p></div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{display:"none"}}/>
              {ssFile&&(
                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <button className="btn" onClick={analyzeScreenshot} disabled={ssLoad} style={{flex:1,padding:"11px",fontSize:13,borderRadius:12}}>
                    {ssLoad?<span style={{display:"inline-block",animation:"spin .8s linear infinite"}}>⟳ Analyzing…</span>:"🔍 Analyze Screenshot"}
                  </button>
                  <button onClick={()=>{setSsFile(null);setSsPreview(null);setSsText("");if(fileRef.current)fileRef.current.value="";}}
                    style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,color:"#64748b"}}>✕</button>
                </div>
              )}
              {ssLoad&&<div style={{height:80,background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:12,animation:"shimmer 1.5s infinite",marginTop:12}}/>}
              {ssText&&<div style={{marginTop:12}}><AiBox text={ssText} loading={false}/></div>}
            </div>

            {/* Mujhe Bata */}
            <div className="hov" style={{...CARD}}>
              <SH icon="🎯" title="Mujhe Bata — Personal Advisor" subtitle="Apni situation likho — personalized advice milega"/>
              <textarea value={situation} onChange={e=>setSituation(e.target.value)}
                placeholder={'Example: "Maine ₹10,000 DOGE mein lagaye hain, 40% loss mein hoon, kya karu?"'}
                rows={3}
                style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"11px 14px",fontSize:13,resize:"vertical",lineHeight:1.6,marginBottom:10,transition:"border-color .2s"}}
                onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
              <button className="btn" onClick={getPersonalAdvice} disabled={adviceLoad||!situation.trim()} style={{width:"100%",padding:"12px",fontSize:13,borderRadius:12}}>
                {adviceLoad?<span style={{display:"inline-block",animation:"spin .8s linear infinite"}}>⟳ Thinking…</span>:"🤖 Get Personal Advice"}
              </button>
              {adviceLoad&&<div style={{height:100,background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:12,animation:"shimmer 1.5s infinite",marginTop:12}}/>}
              {adviceText&&<div style={{marginTop:12}}><AiBox text={adviceText} loading={false}/></div>}
            </div>

            {/* Mera Budget */}
            <div className="hov" style={{...CARD}}>
              <SH icon="💰" title="Mera Budget" subtitle="Budget daalo — AI best coins suggest karega" bg="linear-gradient(135deg,#fffbeb,#fef3c7)" br="#fde68a"/>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <select value={budgetCur} onChange={e=>setBudgetCur(e.target.value)} style={{background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"10px 12px",fontSize:13,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",color:"#0f172a",fontWeight:600}}>
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                </select>
                <input value={budgetAmt} onChange={e=>setBudgetAmt(e.target.value)} placeholder={`Amount (e.g. ${budgetCur==="INR"?"5000":"100"})`} type="number"
                  style={{flex:1,...INP}} onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                <button className="btn" onClick={callBudgetAI} disabled={budgetLoad||!budgetAmt} style={{padding:"10px 18px",fontSize:13,borderRadius:12,whiteSpace:"nowrap"}}>
                  {budgetLoad?"⟳":"Ask AI"}
                </button>
              </div>
              {budgetLoad&&<div style={{height:80,background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:12,animation:"shimmer 1.5s infinite"}}/>}
              {budgetText&&<AiBox text={budgetText} loading={false}/>}
            </div>

            {/* What-If */}
            {result&&(
              <div className="hov" style={{...CARD}}>
                <SH icon="💡" title="What-If Simulator" subtitle="Profit & loss scenarios" bg="linear-gradient(135deg,#eef2ff,#e0e7ff)" br="#c7d2fe"/>
                <input value={investAmt} onChange={e=>setInvestAmt(e.target.value)} placeholder="Investment in $ (e.g. 500)" type="number"
                  style={{...INP,marginBottom:10}} onFocus={e=>e.target.style.borderColor="#6366f1"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                {whatIf&&(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
                    {whatIf.map((r,i)=>(
                      <div key={i} style={{background:r.c2,border:`1px solid ${r.c3}`,borderRadius:10,padding:"10px 4px",textAlign:"center"}}>
                        <div className="mono" style={{fontSize:11,color:r.c1,fontWeight:800}}>{r.label}</div>
                        <div className="mono" style={{fontSize:11,color:"#0f172a",marginTop:3,fontWeight:700}}>${r.val}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Loss Recovery */}
            <div className="hov" style={{...CARD}}>
              <SH icon="🩹" title="Loss Recovery Planner" subtitle="Recovery plan calculate karo" bg="linear-gradient(135deg,#fff1f2,#fee2e2)" br="#fca5a5"/>
              <input value={lossAmt} onChange={e=>setLossAmt(e.target.value)} placeholder="Your loss % (e.g. 30 = lost 30%)" type="number"
                style={{...INP,marginBottom:10}} onFocus={e=>e.target.style.borderColor="#ef4444"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
              {lossRec&&(
                <div>
                  <div style={{background:"linear-gradient(135deg,#fff1f2,#fee2e2)",border:"1px solid #fca5a5",borderRadius:12,padding:"12px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:22}}>📉</span>
                    <div><div style={{fontSize:12,color:"#dc2626",fontWeight:500}}>To break even from {lossAmt}% loss:</div><div className="mono" style={{fontSize:17,fontWeight:900,color:"#991b1b"}}>Need +{lossRec.req}% gain</div></div>
                  </div>
                  {[{icon:"🐢",name:"Safe",plan:lossRec.safe,c:"#059669",bg:"linear-gradient(135deg,#f0fdf4,#dcfce7)",br:"#86efac"},
                    {icon:"⚖️",name:"Moderate",plan:lossRec.mod,c:"#d97706",bg:"linear-gradient(135deg,#fffbeb,#fef3c7)",br:"#fde68a"},
                    {icon:"🎲",name:"Aggressive",plan:lossRec.agg,c:"#dc2626",bg:"linear-gradient(135deg,#fff1f2,#fee2e2)",br:"#fca5a5"}].map((p,i)=>(
                    <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",background:p.bg,border:`1px solid ${p.br}`,borderRadius:12,padding:"10px 12px",marginBottom:7}}>
                      <span style={{fontSize:18,flexShrink:0}}>{p.icon}</span>
                      <div><span style={{fontSize:12,color:p.c,fontWeight:800}}>{p.name}: </span><span style={{fontSize:12,color:"#475569"}}>{p.plan}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: EXPLAIN COIN                                                  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab==="explain" && (
          <div className="fadein">
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:40,marginBottom:8}}>🤖</div>
              <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-1,marginBottom:6}}>AI Explain This Coin</h2>
              <p style={{fontSize:13,color:"#64748b"}}>Koi bhi coin ka naam likho — AI simple language mein samjhayega</p>
            </div>

            <div style={{...CARD}}>
              <div style={{display:"flex",gap:10,marginBottom:14}}>
                <input value={explainQuery} onChange={e=>setExplainQuery(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&explainCoin()}
                  placeholder="Coin name: Bitcoin, Ethereum, Aptos, Arbitrum…"
                  style={{flex:1,background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"12px 14px",fontSize:14,color:"#0f172a",transition:"border-color .2s"}}
                  onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                <button className="btn" onClick={explainCoin} disabled={explainLoad||!explainQuery.trim()} style={{padding:"12px 20px",fontSize:13,borderRadius:12,whiteSpace:"nowrap"}}>
                  {explainLoad?<span style={{display:"inline-block",animation:"spin .8s linear infinite"}}>⟳</span>:"Explain 🤖"}
                </button>
              </div>
              {/* Quick coin chips */}
              <div style={{marginBottom:explainText?14:0}}>
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:8,fontWeight:600}}>POPULAR COINS:</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {["Bitcoin","Ethereum","Solana","Aptos","Arbitrum","Polygon","Chainlink","Avalanche","Injective","Sui"].map(c=>(
                    <button key={c} onClick={()=>{setExplainQuery(c);}}
                      className="chip" style={{background:"#f8fafc",border:"1px solid #e2e8f0",color:"#64748b",padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:500}}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {explainLoad&&(
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{fontSize:36,marginBottom:10,animation:"float 2s ease-in-out infinite"}}>🤖</div>
                <p style={{color:"#64748b",fontSize:13,fontWeight:500}}>AI researching {explainQuery}…</p>
                <p className="mono" style={{color:"#94a3b8",fontSize:11,marginTop:4}}>Preparing simple explanation…</p>
              </div>
            )}

            {explainText&&!explainLoad&&(
              <div className="fadein">
                <div style={{background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)",border:"1px solid #6ee7b7",borderRadius:20,padding:"20px",boxShadow:"0 4px 20px rgba(16,185,129,.1)",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#10b981,#6ee7b7,#10b981)",backgroundSize:"200% auto",animation:"gradmove 3s linear infinite"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                    <div style={{background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:8,padding:"4px 10px",fontWeight:800,fontSize:12,color:"#fff"}}>YYP</div>
                    <span style={{fontWeight:800,fontSize:14,color:"#065f46"}}>Simple Explanation — {explainQuery}</span>
                  </div>
                  <p style={{fontSize:14,color:"#166534",lineHeight:1.85,whiteSpace:"pre-line",fontWeight:500}}>{explainText}</p>
                  <div className="mono" style={{fontSize:9,color:"#94a3b8",marginTop:12,textAlign:"right"}}>YES YOU PRO AI · yesyoupro.com</div>
                </div>
              </div>
            )}

            {!explainText&&!explainLoad&&(
              <div style={{textAlign:"center",padding:"32px 16px",color:"#94a3b8"}}>
                <div style={{fontSize:48,marginBottom:10}}>💬</div>
                <p style={{fontSize:13,fontWeight:500}}>Koi bhi coin ka naam likho upar</p>
                <p style={{fontSize:11,marginTop:4}}>Example: "Arbitrum kya karta hai?" ya "Bitcoin explain karo"</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: SCAM CHECK                                                    */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab==="scam" && (
          <div className="fadein">
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:40,marginBottom:8}}>🛡️</div>
              <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-1,marginBottom:6}}>Scam Check</h2>
              <p style={{fontSize:13,color:"#64748b"}}>Koi bhi coin ka naam daalo — AI scam risk analyze karega</p>
            </div>

            <div style={{...CARD}}>
              <div style={{display:"flex",gap:10,marginBottom:10}}>
                <input value={scamQuery} onChange={e=>setScamQuery(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&checkScam()}
                  placeholder="Coin name or symbol: BTC, ETH, PEPE…"
                  style={{flex:1,background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"12px 14px",fontSize:14,color:"#0f172a",transition:"border-color .2s"}}
                  onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                <button className="btn" onClick={checkScam} disabled={scamTabLoad||!scamQuery.trim()} style={{padding:"12px 20px",fontSize:13,borderRadius:12,whiteSpace:"nowrap"}}>
                  {scamTabLoad?<span style={{display:"inline-block",animation:"spin .8s linear infinite"}}>⟳</span>:"🔍 Check"}
                </button>
              </div>
              <div style={{background:"linear-gradient(135deg,#fffbeb,#fef3c7)",borderRadius:10,padding:"10px 12px",fontSize:12,color:"#92400e",fontWeight:500}}>
                ⚠️ Yeh tool market data + AI analysis use karta hai. 100% accurate nahi — hamesha DYOR karo.
              </div>
            </div>

            {scamTabErr&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,padding:"12px 16px",color:"#dc2626",marginBottom:12,fontSize:13}} className="mono">⚠️ {scamTabErr}</div>}

            {scamTabLoad&&(
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{fontSize:36,marginBottom:10,animation:"float 2s ease-in-out infinite"}}>🔍</div>
                <p style={{color:"#64748b",fontSize:13,fontWeight:500}}>Analyzing {scamQuery.toUpperCase()} for scam signals…</p>
                <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:10,flexWrap:"wrap"}}>
                  {["Volume analysis","Price patterns","Market cap check","RSI signals"].map((s,i)=>(
                    <span key={i} style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:20,padding:"3px 10px",fontSize:10,color:"#059669",fontWeight:500}}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {scamResult&&!scamTabLoad&&(
              <div className="fadein">
                {/* Coin data summary */}
                <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"16px",marginBottom:12}}>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:"#0f172a"}}>📊 Token Data</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[
                      {label:"Price",      val:scamResult.price},
                      {label:"Market Cap", val:scamResult.marketCap},
                      {label:"24h Volume", val:scamResult.volume},
                      {label:"Vol/MCap",   val:scamResult.volMcapRatio},
                      {label:"24h Change", val:`${scamResult.ch24}%`, color:parseFloat(scamResult.ch24)>=0?"#059669":"#dc2626"},
                      {label:"RSI (14)",   val:scamResult.rsi},
                    ].map((d,i)=>(
                      <div key={i} style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px"}}>
                        <div style={{fontSize:10,color:"#94a3b8",marginBottom:3,fontWeight:600}}>{d.label}</div>
                        <div className="mono" style={{fontSize:13,fontWeight:700,color:d.color||"#0f172a"}}>{d.val}</div>
                      </div>
                    ))}
                  </div>
                  {scamResult.flags.length>0&&(
                    <div style={{marginTop:12}}>
                      <div style={{fontSize:11,color:"#dc2626",fontWeight:700,marginBottom:6}}>🚩 Red Flags Detected:</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                        {scamResult.flags.map((f,i)=>(
                          <span key={i} className="mono" style={{background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:20,padding:"3px 10px",fontSize:10,color:"#dc2626"}}>{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {scamResult.flags.length===0&&(
                    <div style={{marginTop:10,background:"#f0fdf4",borderRadius:10,padding:"8px 12px",fontSize:12,color:"#059669",fontWeight:600}}>✅ No major red flags detected in data</div>
                  )}
                </div>

                {/* AI Scam Analysis */}
                {scamAiText?(
                  <div style={{background:"linear-gradient(135deg,#fff1f2,#fef2f2)",border:"1px solid #fca5a5",borderRadius:20,padding:"18px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#ef4444,#f87171,#ef4444)",backgroundSize:"200% auto",animation:"gradmove 3s linear infinite"}}/>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                      <div style={{background:"linear-gradient(135deg,#ef4444,#dc2626)",borderRadius:8,padding:"4px 10px",fontWeight:800,fontSize:12,color:"#fff"}}>YYP</div>
                      <span style={{fontWeight:800,fontSize:14,color:"#991b1b"}}>AI Scam Risk Assessment</span>
                    </div>
                    <p style={{fontSize:13,color:"#7f1d1d",lineHeight:1.8,whiteSpace:"pre-line",fontWeight:500}}>{scamAiText}</p>
                    <div className="mono" style={{fontSize:9,color:"#94a3b8",marginTop:12,textAlign:"right"}}>YES YOU PRO AI · yesyoupro.com</div>
                  </div>
                ):(
                  <div style={{height:80,background:"linear-gradient(135deg,#fff1f2,#fee2e2)",borderRadius:12,animation:"shimmer 1.5s infinite"}}/>
                )}
              </div>
            )}

            {!scamResult&&!scamTabLoad&&!scamTabErr&&(
              <div style={{textAlign:"center",padding:"32px 16px",color:"#94a3b8"}}>
                <div style={{fontSize:48,marginBottom:10}}>🛡️</div>
                <p style={{fontSize:13,fontWeight:500}}>Coin ka naam daalo — scam check karo</p>
                <p style={{fontSize:11,marginTop:4}}>Volume manipulation · Price pump · Market cap risk</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: NEWS IMPACT                                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab==="news" && (
          <div className="fadein">
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:40,marginBottom:8}}>📰</div>
              <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-1,marginBottom:6}}>News Impact Engine</h2>
              <p style={{fontSize:13,color:"#64748b"}}>Latest crypto news + AI batayega market pe kya asar hoga</p>
            </div>

            <div style={{...CARD}}>
              <div style={{display:"flex",gap:10,marginBottom:10}}>
                <input value={newsQuery} onChange={e=>setNewsQuery(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&fetchNews()}
                  placeholder="Coin name (optional): BTC, ETH… ya khali chhoddo"
                  style={{flex:1,background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"12px 14px",fontSize:13,color:"#0f172a",transition:"border-color .2s"}}
                  onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                <button className="btn" onClick={fetchNews} disabled={newsLoad||newsAiLoad} style={{padding:"12px 20px",fontSize:13,borderRadius:12,whiteSpace:"nowrap"}}>
                  {newsLoad?<span style={{display:"inline-block",animation:"spin .8s linear infinite"}}>⟳</span>:"📰 Get News"}
                </button>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["General","BTC","ETH","SOL","BNB","XRP"].map(c=>(
                  <button key={c} onClick={()=>setNewsQuery(c==="General"?"":c)}
                    className="chip" style={{background:"#f8fafc",border:"1px solid #e2e8f0",color:"#64748b",padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:500}}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {newsLoad&&(
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{fontSize:36,marginBottom:10,animation:"float 2s ease-in-out infinite"}}>📡</div>
                <p style={{color:"#64748b",fontSize:13,fontWeight:500}}>Fetching latest crypto news…</p>
              </div>
            )}

            {newsData&&!newsLoad&&(
              <div className="fadein">
                {/* News List */}
                {newsData.articles.length>0&&(
                  <div style={{...CARD}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:"#0f172a"}}>
                      📡 Latest News {newsData.coin!=="general"?`— ${newsData.coin}`:"— Crypto Market"}
                      <span style={{fontSize:11,color:"#94a3b8",fontWeight:400,marginLeft:8}}>({new Date(newsData.updatedAt).toLocaleTimeString("en-IN")})</span>
                    </div>
                    <div>
                      {newsData.articles.map((a,i)=>(
                        <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none"}}
                          className="news-card" style={{display:"block",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"12px 14px",marginBottom:8,textDecoration:"none",transition:"all .15s"}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor="#6ee7b7";e.currentTarget.style.background="#f0fdf4"}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.background="#f8fafc"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:600,fontSize:13,color:"#0f172a",lineHeight:1.4,marginBottom:4}}>{a.title}</div>
                              <div style={{fontSize:10,color:"#94a3b8",fontWeight:500}}>{a.source} · {new Date(a.time*1000).toLocaleDateString("en-IN")}</div>
                            </div>
                            <span style={{fontSize:12,color:"#059669",flexShrink:0}}>↗</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Impact Analysis */}
                <div style={{background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)",border:"1px solid #6ee7b7",borderRadius:20,padding:"18px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#10b981,#6ee7b7,#10b981)",backgroundSize:"200% auto",animation:"gradmove 3s linear infinite"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                    <div style={{background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:8,padding:"4px 10px",fontWeight:800,fontSize:12,color:"#fff"}}>YYP</div>
                    <span style={{fontWeight:800,fontSize:14,color:"#065f46"}}>News Impact Analysis</span>
                    {newsAiLoad&&<div style={{marginLeft:"auto",display:"flex",gap:3}}>{[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:"#10b981",animation:`blink 1.2s ${i*.2}s infinite`}}/>)}</div>}
                  </div>
                  {newsAiLoad
                    ?<div style={{height:80,background:"rgba(16,185,129,.08)",borderRadius:10,animation:"shimmer 1.5s infinite"}}/>
                    :<p style={{fontSize:13,color:"#166534",lineHeight:1.8,whiteSpace:"pre-line",fontWeight:500}}>{newsAiText}</p>}
                  <div className="mono" style={{fontSize:9,color:"#94a3b8",marginTop:12,textAlign:"right"}}>YES YOU PRO AI · yesyoupro.com</div>
                </div>
              </div>
            )}

            {!newsData&&!newsLoad&&(
              <div style={{textAlign:"center",padding:"32px 16px",color:"#94a3b8"}}>
                <div style={{fontSize:48,marginBottom:10}}>📡</div>
                <p style={{fontSize:13,fontWeight:500}}>News fetch karo — AI batayega kya asar hoga market pe</p>
                <p style={{fontSize:11,marginTop:4}}>Bullish ya bearish · Short-term · Long-term · Affected coins</p>
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div style={{marginTop:20}}>
          <div style={{background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)",border:"1px solid #6ee7b7",borderRadius:14,padding:"14px 18px",textAlign:"center",marginBottom:12}}>
            <div style={{fontSize:11,color:"#059669",fontWeight:700,marginBottom:4}}>⚠️ Disclaimer</div>
            <div className="mono" style={{fontSize:10,color:"#64748b",lineHeight:1.7}}>
              AI-based analysis only — not financial advice. Crypto is highly volatile. Always DYOR.<br/>
              <span style={{color:"#059669",fontWeight:600}}>Data: Binance · Alternative.me · CryptoCompare · AI: YesYouPro</span>
            </div>
          </div>
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"16px 20px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:12}}>
              <div style={{background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:8,padding:"4px 10px",fontWeight:900,fontSize:12,color:"#fff"}}>YYP</div>
              <span style={{fontWeight:800,fontSize:14}}>CryptoMind AI</span>
              <span style={{fontSize:11,color:"#94a3b8"}}>by YesYouPro</span>
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {[{label:"🏠 Home",href:"/"},{label:"👋 About",href:"/about"},{label:"✨ Features",href:"/features"},{label:"🏟️ Arena",href:"/arena"},{label:"🔒 Privacy",href:"/privacy"},{label:"💬 Contact",href:"/contact"}].map((l,i)=>(
                <Link key={i} href={l.href} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:20,padding:"5px 14px",fontSize:12,color:"#475569",fontWeight:600,textDecoration:"none"}}>
                  {l.label}
                </Link>
              ))}
            </div>
            <div style={{borderTop:"1px dashed #e2e8f0",paddingTop:10,textAlign:"center"}}>
              <div className="mono" style={{fontSize:10,color:"#94a3b8",lineHeight:1.7}}>
                © {new Date().getFullYear()} YesYouPro · <a href="https://yesyoupro.com" target="_blank" rel="noopener noreferrer" style={{color:"#059669",textDecoration:"none",fontWeight:600}}>yesyoupro.com</a>
                {" · "}<a href="mailto:Yesyousuppur@gmail.com" style={{color:"#059669",textDecoration:"none",fontWeight:600}}>Yesyousuppur@gmail.com</a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
