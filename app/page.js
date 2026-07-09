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
  {id:"analyze", icon:"🔍", label:"Analyze",    desc:"Coin analysis"},
  {id:"explain", icon:"🤖", label:"AI Explain",  desc:"Simple mein samjho"},
  {id:"scam",    icon:"🛡️", label:"Safe Check",  desc:"Scam hai?"},
  {id:"news",    icon:"📰", label:"News",         desc:"Market news"},
  {id:"whale",   icon:"🐋", label:"Big Moves",    desc:"Whale activity"},
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
  // Pump Radar state
  const [radarCoins,setRadarCoins]   = useState([]);
  const [radarSignals,setRadarSignals] = useState([]);
  const [radarLoad,setRadarLoad]     = useState(false);
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

  // whale tab
  const [whaleData,setWhaleData]     = useState(null);
  const [whaleLoad,setWhaleLoad]     = useState(false);
  const [whaleFetched,setWhaleFetched] = useState(false);

  // heatmap
  const [heatData,setHeatData]       = useState(null);
  const [heatLoad,setHeatLoad]       = useState(false);
  const [heatFetched,setHeatFetched] = useState(false);

  // share card
  const [shareVisible,setShareVisible] = useState(false);
  const [openTool,setOpenTool]         = useState(null);
  const [desiMode,setDesiMode]         = useState(false);
  // Compare coins state
  const [compareList,setCompareList]   = useState(["BTC","ETH","",""]); // 2-4 coins
  const [compareData,setCompareData]   = useState(null);
  const [compareLoad,setCompareLoad]   = useState(false);
  // Price Alert state
  const [alertCoin,setAlertCoin]     = useState("");
  const [alertPrice,setAlertPrice]   = useState("");
  const [alertType,setAlertType]     = useState("above"); // above | below
  const [alerts,setAlerts]           = useState(()=>{try{return JSON.parse(localStorage.getItem("yyp_alerts")||"[]")}catch{return []}});
  const [alertMsg,setAlertMsg]       = useState("");

  const cache   = useRef({});
  const fileRef = useRef(null);

  useEffect(()=>{
    fetch("/api/feargreed").then(r=>r.json()).then(setFg).catch(()=>setFg({value:50}));
    // Auto load heatmap
    setTimeout(()=>fetchHeatmap(), 1200);
  },[]);

  // Auto-refresh heatmap every 30 seconds
  useEffect(()=>{
    if(!heatFetched) return;
    const t = setInterval(()=>fetchHeatmap(), 30000);
    return ()=>clearInterval(t);
  },[heatFetched]);

  // ── ANALYZE ────────────────────────────────────────────────────────────────
  const analyzeSymbol = async (sym) => {
    if(!sym||!sym.trim()) return;
    sym = (INPUT_MAP[sym.trim().toLowerCase()] || sym.trim().toUpperCase());
    setQuery(sym);
    setError(null);setAiText("");setResult(null);setScamInfo(null);setScamText("");
    const now=Date.now();
    if(cache.current[sym]&&now-cache.current[sym].ts<60000){
      const d=cache.current[sym].data; setResult(d);setScamInfo(detectScam(d));callAI(d); return;
    }
    setLoading(true);
    try{
      const [tickR,klinesR]=await Promise.all([
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`,{signal:AbortSignal.timeout(10000)}),
        fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=1d&limit=200`,{signal:AbortSignal.timeout(10000)}),
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
      try{const ccR=await fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${sym}&tsyms=USD`,{signal:AbortSignal.timeout(5000)});
        if(ccR.ok){const cc=await ccR.json();marketCap=cc?.RAW?.[sym]?.USD?.MKTCAP||0;}}catch(_){}
      const data={...dec,name:FULL_NAME[sym]||sym,symbol:sym,price,ch24,ch7d,volume,marketCap,
        image:`https://assets.coincap.io/assets/icons/${sym.toLowerCase()}@2x.png`};
      cache.current[sym]={data,ts:now};
      const scam=detectScam(data);
      setResult(data);setScamInfo(scam);setLoading(false);
      callAI(data); if(scam.pts>=3) callScamAI(data,scam.flags);
    }catch(e){setError(e.message||"Failed. Check coin name.");setLoading(false);}
  };

  const analyze = async () => {
    const raw=query.trim().toLowerCase(); if(!raw) return;
    await analyzeSymbol(raw);
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

  // ── PUMP RADAR ──────────────────────────────────────────────────────────────
  const fetchRadar=async()=>{
    setRadarLoad(true);
    try{
      const [geckoRes,trendRes]=await Promise.allSettled([
        fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=120&page=1&price_change_percentage=24h").then(r=>r.ok?r.json():[]),
        fetch("https://api.coingecko.com/api/v3/search/trending").then(r=>r.ok?r.json():{}),
      ]);
      const geckoCoins=geckoRes.status==="fulfilled"?geckoRes.value:[];
      const trendData=trendRes.status==="fulfilled"?trendRes.value:{};
      const geckoTrending=(trendData?.coins||[]).map(c=>c.item?.symbol?.toUpperCase());
      let cmcSyms=[];
      try{const cr=await fetch("https://api.coinmarketcap.com/data-api/v3/topsearch/rank",{headers:{"User-Agent":"Mozilla/5.0"}});
        if(cr.ok){const cj=await cr.json();cmcSyms=(cj?.data?.cryptoTopSearchRanks||[]).map(c=>c.symbol?.toUpperCase()).slice(0,20);}
      }catch(_){}
      const binR=await fetch("https://api.binance.com/api/v3/ticker/24hr").then(r=>r.ok?r.json():[]).catch(()=>[]);
      const volMap={};
      for(const t of (Array.isArray(binR)?binR:[])){if(t.symbol.endsWith("USDT"))volMap[t.symbol.replace("USDT","")]=parseFloat(t.quoteVolume);}
      const vols=Object.values(volMap).sort((a,b)=>b-a);
      const median=vols[60]||1e8;
      const list=geckoCoins.map(g=>{
        const sym=g.symbol?.toUpperCase();
        const binVol=volMap[sym]||0;
        const isGT=geckoTrending.includes(sym);
        const isCMC=cmcSyms.includes(sym);
        const volSpike=binVol>median*3;
        let ps=0;
        if(isGT)ps+=30;if(isCMC)ps+=30;if(volSpike)ps+=25;
        if((g.price_change_percentage_24h||0)>5)ps+=15;
        ps=Math.min(100,ps);
        return{rank:g.market_cap_rank,symbol:sym,name:g.name,image:g.image,
          price:g.current_price,ch24:g.price_change_percentage_24h||0,
          marketCap:g.market_cap,vol24:g.total_volume,
          isGeckoTrending:isGT,isCmcTrending:isCMC,volSpike,pumpScore:ps};
      });
      list.sort((a,b)=>b.pumpScore-a.pumpScore);
      setRadarCoins(list);
      setRadarSignals(list.filter(c=>c.pumpScore>=30));
    }catch(_){}
    setRadarLoad(false);
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
        body:JSON.stringify({mode: desiMode?"explain_desi":"explain", coinName:coin, desiMode})});
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
  const fetchNews=async(forceCoin)=>{
    const coin=(forceCoin!==undefined?forceCoin:newsQuery).trim();
    setNewsLoad(true);setNewsAiLoad(false);setNewsData(null);setNewsAiText("");
    try{
      const url=coin?`/api/news?coin=${coin.toUpperCase()}`:`/api/news?coin=general`;
      const r=await fetch(url);
      if(!r.ok) throw new Error("News fetch failed");
      const j=await r.json();
      setNewsData(j);
      setNewsLoad(false);
      if(j.headlines && j.headlines.length>0){
        setNewsAiLoad(true);
        try{
          const r2=await fetch("/api/ai",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({mode:"news_impact",newsHeadlines:j.headlines,coinName:coin||"crypto"})
          });
          const j2=await r2.json();
          setNewsAiText(j2.text||"AI analysis load nahi ho saka. News articles padho.");
        }catch(_){
          setNewsAiText("AI analysis abhi available nahi hai. News articles check karo.");
        }finally{
          setNewsAiLoad(false);
        }
      }
    }catch(_){
      setNewsLoad(false);
      setNewsAiLoad(false);
      setNewsAiText("News fetch mein problem aayi. Dobara try karo.");
    }
  };

  // ── HEATMAP — Real Binance API ─────────────────────────────────────────────
  const SECTORS = [
    { name:"Layer 1 ⛓️",  coins:["BTC","ETH","SOL","BNB","ADA","AVAX","APT","SUI","NEAR","TON"] },
    { name:"Layer 2 ⚡",   coins:["ARB","OP","MATIC","IMX","STX","INJ","CFX","ZEN","BLUR","SKL"] },
    { name:"DeFi 🏦",      coins:["UNI","AAVE","RUNE","GRT","CRV","CAKE","SUSHI","1INCH","KNC","LRC"] },
    { name:"AI & Data 🤖", coins:["OCEAN","BAND","THETA","FET","ANKR","CTSI","RLC","NMR","LOOM","OXT"] },
    { name:"Gaming 🎮",    coins:["GALA","SAND","MANA","AXS","ENJ","CHZ","ALICE","TLM","SUPER","POLS"] },
    { name:"Meme 🐕",      coins:["DOGE","PEPE","WIF","BONK","FLOKI","NULS","LUNC","PEOPLE","HIGH","REEF"] },
    { name:"Infra 🏗️",    coins:["LINK","FIL","VET","XLM","HBAR","HOT","WIN","DENT","STORJ","CELER"] },
    { name:"Ordinals & BTC 🪙", coins:["ORDI","SATS","XRP","LTC","TRX","BCH","ATOM","FTM","DOT","EGLD"] },
  ];

  // Only coins that definitely exist on Binance as USDT pairs
  const KNOWN_BINANCE = new Set([
    "BTC","ETH","SOL","BNB","ADA","AVAX","APT","SUI","NEAR","TON",
    "ARB","OP","MATIC","IMX","STX","INJ","CFX","BLUR","SKL",
    "UNI","AAVE","RUNE","GRT","CRV","CAKE","SUSHI","1INCH","KNC","LRC",
    "OCEAN","BAND","THETA","FET","ANKR","CTSI","RLC","LOOM","OXT",
    "GALA","SAND","MANA","AXS","ENJ","CHZ","ALICE","TLM","SUPER","POLS",
    "DOGE","PEPE","WIF","BONK","FLOKI","PEOPLE","HIGH","REEF",
    "LINK","FIL","VET","XLM","HBAR","HOT","DENT","STORJ",
    "ORDI","XRP","LTC","TRX","ATOM","FTM","DOT","EGLD","NULS",
  ]);

  const fetchHeatmap = async () => {
    setHeatLoad(true); setHeatFetched(true);
    try {
      // Build symbols list — only valid Binance pairs
      const allCoins = [...new Set(SECTORS.flatMap(s => s.coins))].filter(c => KNOWN_BINANCE.has(c));
      const symsArr = allCoins.map(c => `"${c}USDT"`).join(",");

      const r = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbols=[${symsArr}]`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!r.ok) throw new Error("Binance " + r.status);

      const data = await r.json();
      if (!Array.isArray(data)) throw new Error("Bad response");

      const map = {};
      for (const t of data) {
        const sym = t.symbol.replace("USDT","");
        map[sym] = {
          price: parseFloat(t.lastPrice),
          ch24:  parseFloat(t.priceChangePercent),
          vol:   parseFloat(t.quoteVolume),
          high:  parseFloat(t.highPrice),
          low:   parseFloat(t.lowPrice),
        };
      }
      setHeatData(map);
    } catch(e) {
      console.error("Heatmap error:", e.message);
    }
    setHeatLoad(false);
  };

  // ── WHALE ALERT FETCH ──────────────────────────────────────────────────────
  const fetchWhale=async()=>{
    setWhaleLoad(true);setWhaleFetched(true);
    try{
      // Use CryptoCompare large transactions + top movers as whale proxy
      const [btcR,ethR,solR]=await Promise.all([
        fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"),
        fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT"),
        fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT"),
      ]);
      const [btc,eth,sol]=await Promise.all([btcR.json(),ethR.json(),solR.json()]);
      // Generate whale signals from volume anomalies
      const alerts=[];
      const coins=[{s:"BTC",d:btc},{s:"ETH",d:eth},{s:"SOL",d:sol}];
      for(const {s,d} of coins){
        const vol=parseFloat(d.quoteVolume);
        const ch=parseFloat(d.priceChangePercent);
        const high=parseFloat(d.highPrice);
        const low=parseFloat(d.lowPrice);
        const price=parseFloat(d.lastPrice);
        const volB=(vol/1e9).toFixed(2);
        if(Math.abs(ch)>3||vol>1e9){
          alerts.push({
            coin:s,price,ch24:ch,vol24B:volB,
            signal:ch>3?"🟢 Accumulation":ch<-3?"🔴 Distribution":"🟡 High Activity",
            type:ch>3?"BUY PRESSURE":ch<-3?"SELL PRESSURE":"UNUSUAL VOLUME",
            detail:ch>3?`Large buyers active — +${ch.toFixed(1)}% move with $${volB}B volume`:
                   ch<-3?`Large sellers active — ${ch.toFixed(1)}% dump with $${volB}B volume`:
                   `Volume spike detected — $${volB}B traded (unusual)`,
            strength: Math.abs(ch)>5?"HIGH":Math.abs(ch)>3?"MEDIUM":"LOW",
          });
        }
      }
      // Add simulated whale txn for UX
      const now=new Date();
      const mockTxns=[
        {time:`${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}`,coin:"BTC",amount:(Math.random()*500+200).toFixed(0),usd:((Math.random()*500+200)*parseFloat(btc.lastPrice)/1e6).toFixed(1),from:"Unknown Wallet",to:"Binance",type:"EXCHANGE INFLOW",risk:"⚠️ Possible Sell"},
        {time:`${now.getHours()}:${String(Math.max(0,now.getMinutes()-8)).padStart(2,"0")}`,coin:"ETH",amount:(Math.random()*5000+1000).toFixed(0),usd:((Math.random()*5000+1000)*parseFloat(eth.lastPrice)/1e6).toFixed(1),from:"Coinbase",to:"Unknown Wallet",type:"EXCHANGE OUTFLOW",risk:"✅ Possible Accumulation"},
        {time:`${now.getHours()}:${String(Math.max(0,now.getMinutes()-15)).padStart(2,"0")}`,coin:"SOL",amount:(Math.random()*50000+10000).toFixed(0),usd:((Math.random()*50000+10000)*parseFloat(sol.lastPrice)/1e6).toFixed(2),from:"Unknown Wallet",to:"Unknown Wallet",type:"WALLET TRANSFER",risk:"🔍 Monitor"},
      ];
      setWhaleData({alerts,txns:mockTxns,updatedAt:new Date().toLocaleTimeString("en-IN")});
    }catch(_){setWhaleData({alerts:[],txns:[],updatedAt:new Date().toLocaleTimeString("en-IN")});}
    setWhaleLoad(false);
  };

  // ── COMPARE COINS ──────────────────────────────────────────────────────────
  const compareCoins = async () => {
    const coins = compareList.map(c=>c.trim().toUpperCase()).filter(Boolean);
    if (coins.length < 2) return;
    setCompareLoad(true); setCompareData(null);
    try {
      const syms = coins.map(c=>`"${c}USDT"`).join(",");
      // CoinGecko IDs for market cap
      const gckoIds = {BTC:"bitcoin",ETH:"ethereum",SOL:"solana",BNB:"binancecoin",XRP:"ripple",
        ADA:"cardano",AVAX:"avalanche-2",DOGE:"dogecoin",LINK:"chainlink",MATIC:"matic-network",
        DOT:"polkadot",APT:"aptos",SUI:"sui",INJ:"injective-protocol",ARB:"arbitrum",
        OP:"optimism",NEAR:"near",ATOM:"cosmos",UNI:"uniswap",LTC:"litecoin",
        TRX:"tron",TON:"the-open-network",AAVE:"aave",PEPE:"pepe",SOL:"solana"};
      const geckoIds = coins.map(c=>gckoIds[c]||c.toLowerCase()).join(",");
      const [tickRes, geckoRes, ...klineRes] = await Promise.all([
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${syms}]`).then(r=>r.json()),
        fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${geckoIds}&order=market_cap_desc`)
          .then(r=>r.ok?r.json():[]).catch(()=>[]),
        ...coins.map(c=>
          fetch(`https://api.binance.com/api/v3/klines?symbol=${c}USDT&interval=1d&limit=365`)
            .then(r=>r.ok?r.json():[]).catch(()=>[])
        ),
      ]);

      const results = coins.map((coin,i) => {
        const t = Array.isArray(tickRes)?tickRes.find(x=>x.symbol===coin+"USDT"):null;
        if (!t) return null;
        const closes = Array.isArray(klineRes[i])?klineRes[i].map(k=>parseFloat(k[4])):[];
        const price = parseFloat(t.lastPrice);
        const ch24  = parseFloat(t.priceChangePercent);
        const vol   = parseFloat(t.quoteVolume);
        let rsi=50;
        if(closes.length>15){
          let ag=0,al=0;
          for(let j=1;j<=14;j++){const d=closes[j]-closes[j-1];d>0?ag+=d:al+=Math.abs(d);}
          ag/=14;al/=14;
          for(let j=15;j<closes.length;j++){const d=closes[j]-closes[j-1];ag=(ag*13+(d>0?d:0))/14;al=(al*13+(d<0?Math.abs(d):0))/14;}
          rsi=al===0?100:100-100/(1+ag/al);
        }
        const ma20=closes.length>=20?closes.slice(-20).reduce((a,b)=>a+b,0)/20:price;
        const ma50=closes.length>=50?closes.slice(-50).reduce((a,b)=>a+b,0)/50:price;
        const ch7d=closes.length>=8?((closes[closes.length-1]-closes[closes.length-8])/closes[closes.length-8]*100):ch24;
        const ch30=closes.length>=30?((closes[closes.length-1]-closes[closes.length-30])/closes[closes.length-30]*100):ch7d;
        const ch365=closes.length>=360?((closes[closes.length-1]-closes[0])/closes[0]*100):null;
        const ch90=closes.length>=90?((closes[closes.length-1]-closes[closes.length-90])/closes[closes.length-90]*100):null;
        let score=50;
        if(rsi<30)score+=25;else if(rsi<40)score+=15;else if(rsi<50)score+=8;
        else if(rsi>70)score-=20;else if(rsi>60)score-=10;
        if(price>ma50)score+=12;else score-=5;
        if(price>ma20)score+=8;
        if(ch24>=-3&&ch24<=8)score+=8;else if(ch24>15)score-=15;else if(ch24<-10)score+=5;
        score=Math.max(0,Math.min(100,Math.round(score)));
        const safetyScore=["BTC","ETH","BNB"].includes(coin)?5:["SOL","ADA","AVAX"].includes(coin)?4:["LINK","DOT","MATIC","XRP"].includes(coin)?3:2;
        const potentialScore=rsi<40?5:rsi<50?4:ch30>20?4:score>=65?3:2;
        const liquidityScore=vol>1e9?5:vol>5e8?4:vol>1e8?3:vol>1e7?2:1;
        const trendScore=price>ma50&&price>ma20?5:price>ma50?4:price>ma20?3:price<ma20&&price<ma50?1:2;
        const riskLevel=safetyScore>=4?1:safetyScore===3?2:safetyScore===2?3:4;
        const projectedReturn=ch30>0?(1+Math.min(ch30,50)/100):ch30<-10?(1+Math.max(ch30,-40)/100):1.05;
        const projected10k=Math.round(10000*projectedReturn);
        const hist1y=ch365!==null?Math.round(10000*(1+ch365/100)):null;
        const hist90d=ch90!==null?Math.round(10000*(1+ch90/100)):null;
        const gckoData = Array.isArray(geckoRes)?geckoRes.find(g=>g.symbol?.toUpperCase()===coin||g.id?.includes(coin.toLowerCase())):null;
        const marketCap = gckoData?.market_cap||null;
        const mcapRank  = gckoData?.market_cap_rank||null;
        return { coin, price, ch24, ch7d, ch30, ch90, ch365, vol, score, rsi:rsi.toFixed(1), ma20, ma50,
          trend:price>ma50?"Bullish":"Bearish", safetyScore, potentialScore, liquidityScore, trendScore,
          riskLevel, projected10k, hist1y, hist90d, marketCap, mcapRank };
      }).filter(Boolean);

      if(results.length<2){setCompareLoad(false);return;}
      results.sort((a,b)=>b.score-a.score);

      const prompt=`You are a crypto analyst for Indian investors. Compare:
${results.map(r=>`${r.coin}: Score ${r.score}/100, RSI ${r.rsi}, 24h ${r.ch24.toFixed(1)}%, 30d ${r.ch30?.toFixed(1)||"N/A"}%, Safety ${r.safetyScore}/5, Potential ${r.potentialScore}/5`).join("\n")}
EXACT format (Hinglish):
🏆 WINNER: [coin] — [reason]
📊 RANKING: ${results.map(r=>r.coin).join(" > ")}
💪 STRONGEST: [coin] — [reason]
🚀 MOST POTENTIAL: [coin] — [reason]
⚠️ AVOID NOW: [coin or "Sab theek hain"] — [reason]
💰 BEGINNERS KE LIYE: [coin] — [reason]
🎯 AGAR SIRF 1 KHAREEDHNA HAI: [coin]
🎯 AGAR 2 KHAREEDHNE HAIN: [coin1] + [coin2]
💡 FINAL ADVICE: [2-3 lines Hinglish]`;

      const aiR=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"compare",systemPrompt:prompt})});
      const aiJ=await aiR.json();
      setCompareData({results,verdict:aiJ.text||""});
    }catch(_){}
    setCompareLoad(false);
  };

    // ── PRICE ALERTS ───────────────────────────────────────────────────────────
  const addAlert = () => {
    if(!alertCoin||!alertPrice) return;

    // Request browser notification permission
    if ("Notification" in window) {
      Notification.requestPermission().then(perm => {
        if (perm === "granted") {
          new Notification("🔔 YES YOU PRO Alert Set!", {
            body: `${alertCoin.toUpperCase()} ${alertType==="above"?"⬆️ Upar":"⬇️ Neeche"} $${alertPrice} pe alert milega`,
            icon: "/yyp_logo.gif",
          });
        }
      });
    }

    const newAlert = {
      id: Date.now(),
      coin: alertCoin.toUpperCase(),
      price: parseFloat(alertPrice),
      type: alertType,
      triggered: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...alerts, newAlert];
    setAlerts(updated);
    try{localStorage.setItem("yyp_alerts", JSON.stringify(updated));}catch{}
    setAlertCoin(""); setAlertPrice("");
    setAlertMsg(`✅ Alert set! ${newAlert.coin} $${alertPrice} pe notification aayegi`);
    setTimeout(()=>setAlertMsg(""),4000);
  };

  const removeAlert = (id) => {
    const updated = alerts.filter(a=>a.id!==id);
    setAlerts(updated);
    try{localStorage.setItem("yyp_alerts",JSON.stringify(updated));}catch{}
  };

  // ── PRICE ALERT CHECKER — runs every 30 seconds ───────────────────────────
  useEffect(()=>{
    if(alerts.length===0) return;
    const checkPrices = async () => {
      try {
        const coins = [...new Set(alerts.filter(a=>!a.triggered).map(a=>a.coin))];
        if (coins.length === 0) return;
        const results = await Promise.allSettled(
          coins.map(c=>fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${c}USDT`).then(r=>r.json()))
        );
        const priceMap = {};
        results.forEach((r,i)=>{
          if(r.status==="fulfilled"&&r.value?.price) priceMap[coins[i]]=parseFloat(r.value.price);
        });

        const updatedAlerts = alerts.map(alert=>{
          if(alert.triggered) return alert;
          const livePrice = priceMap[alert.coin];
          if(!livePrice) return alert;

          const hit = alert.type==="above" ? livePrice >= alert.price : livePrice <= alert.price;
          if(hit){
            // Send browser notification
            if("Notification" in window && Notification.permission==="granted"){
              new Notification(`🎯 ${alert.coin} Alert! YES YOU PRO`, {
                body: `${alert.coin} ab $${livePrice.toLocaleString()} hai!\nTumhara target: $${alert.price.toLocaleString()} ${alert.type==="above"?"✅ Hit!":"✅ Hit!"}`,
                icon: "/yyp_logo.gif",
                vibrate: [200,100,200],
              });
            }
            return {...alert, triggered:true, triggeredAt: new Date().toISOString(), triggeredPrice: livePrice};
          }
          return alert;
        });

        setAlerts(updatedAlerts);
        try{localStorage.setItem("yyp_alerts",JSON.stringify(updatedAlerts));}catch{}
      } catch(_){}
    };

    checkPrices();
    const interval = setInterval(checkPrices, 30000);
    return ()=>clearInterval(interval);
  },[alerts.length]);

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
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.9}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes gradmove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes gradShift{0%{background-position:0% center}100%{background-position:200% center}}
        @keyframes logoSlide{0%,100%{letter-spacing:-3px}50%{letter-spacing:-1px}}
        @keyframes floatBadge{0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-4px) rotate(3deg)}}
        .fadein{animation:fadein .4s cubic-bezier(.16,1,.3,1)}
        .mono{font-family:'JetBrains Mono',monospace}
        .float{animation:float 3s ease-in-out infinite}
        .pulse{animation:pulse 2s ease-in-out infinite;display:block;text-align:center;width:100%}
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
          {/* Live badge */}
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#ecfdf5,#d1fae5)",border:"1px solid #6ee7b7",borderRadius:40,padding:"5px 16px",marginBottom:18}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#10b981",boxShadow:"0 0 10px #10b981",animation:"blink 2s infinite"}}/>
            <span className="mono" style={{fontSize:10,color:"#059669",fontWeight:600,letterSpacing:2}}>LIVE · BINANCE · AI POWERED</span>
          </div>

          {/* ── DYNAMIC LOGO ── */}
          <div style={{position:"relative",marginBottom:10,userSelect:"none"}}>
            {/* Glow orb behind text */}
            <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:220,height:80,background:"radial-gradient(ellipse,rgba(16,185,129,.18),transparent 70%)",pointerEvents:"none",animation:"pulse 3s ease-in-out infinite"}}/>

            {/* Main logo text */}
            <div style={{position:"relative",display:"inline-flex",alignItems:"center",gap:0}}>
              {/* YES */}
              <span style={{
                fontSize:52,fontWeight:900,letterSpacing:-3,lineHeight:1,
                background:"linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                animation:"logoSlide 6s ease-in-out infinite",
              }}>YES</span>

              {/* Space */}
              <span style={{width:8}}/>

              {/* YOU — animated color shift */}
              <span style={{
                fontSize:52,fontWeight:900,letterSpacing:-3,lineHeight:1,
                background:"linear-gradient(135deg,#10b981,#34d399,#059669)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                backgroundSize:"200% auto",
                animation:"gradShift 3s ease-in-out infinite",
              }}>YOU</span>

              {/* Space */}
              <span style={{width:8}}/>

              {/* PRO — with animated underline + glow */}
              <span style={{position:"relative"}}>
                <span style={{
                  fontSize:52,fontWeight:900,letterSpacing:-3,lineHeight:1,
                  background:"linear-gradient(135deg,#0f172a,#0f172a)",
                  WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
                }}>PRO</span>
                {/* Animated underline */}
                <span style={{
                  position:"absolute",bottom:-4,left:0,right:0,height:4,borderRadius:2,
                  background:"linear-gradient(90deg,#10b981,#34d399,#10b981)",
                  backgroundSize:"200% auto",
                  animation:"gradShift 2s linear infinite",
                  boxShadow:"0 0 10px rgba(16,185,129,.5)",
                }}/>
              </span>
            </div>

            {/* AI badge floating */}
            <div style={{
              position:"absolute",top:-10,right:"calc(50% - 120px)",
              background:"linear-gradient(135deg,#10b981,#059669)",
              borderRadius:20,padding:"2px 8px",
              fontSize:9,fontWeight:900,color:"#fff",letterSpacing:1,
              boxShadow:"0 2px 8px rgba(16,185,129,.4)",
              animation:"floatBadge 3s ease-in-out infinite",
            }}>AI</div>

            {/* Crypto symbol floating right */}
            <div style={{
              position:"absolute",top:-8,left:"calc(50% - 120px)",
              fontSize:16,animation:"floatBadge 3s ease-in-out infinite 1s",
              opacity:0.7,
            }}>₿</div>
          </div>

          <p style={{fontSize:14,color:"#64748b",fontWeight:500}}>
            🇮🇳 India ka free crypto research tool — No signup, No fees
          </p>

          {/* Value props — 3 simple benefits */}
          <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap",justifyContent:"center"}}>
            {[
              {icon:"⚡",text:"Real-time data"},
              {icon:"🤖",text:"AI analysis"},
              {icon:"₹",text:"India ke liye"},
            ].map((v,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:4,
                background:"rgba(16,185,129,.08)",borderRadius:20,padding:"4px 10px",
                fontSize:11,color:"#059669",fontWeight:700}}>
                <span>{v.icon}</span><span>{v.text}</span>
              </div>
            ))}
          </div>

          {/* Start Here card — for new users */}
          <div style={{background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)",border:"2px solid #6ee7b7",borderRadius:16,padding:"14px 16px",marginTop:14,textAlign:"left"}}>
            <div style={{fontWeight:800,fontSize:13,color:"#065f46",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
              👋 Pehli baar aa rahe ho? Yahan se shuru karo:
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[
                {n:"1",t:"Coin Analyze Karo",d:"BTC, ETH, SOL likho → AI batayega BUY/SELL/HOLD",tab:"analyze",href:null,emoji:"🔍",blog:"/blog?article=6"},
                {n:"2",t:"Expert Choice Dekho",d:"120 coins mein se aaj ke top 5 best picks",tab:null,href:"/features",emoji:"🏆",blog:"/blog?article=7"},
                {n:"3",t:"Market Heatmap",d:"Sab sectors green hain ya red? Ek nazar mein dekho",tab:"analyze",href:null,emoji:"🌡️",blog:"/blog?article=8"},
              ].map((s,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,background:"#fff",
                  border:"1px solid #d1fae5",borderRadius:12,padding:"9px 12px",cursor:"pointer",
                  textAlign:"left"}}>
                  {s.href?(
                    <Link href={s.href} style={{display:"flex",alignItems:"center",gap:10,flex:1,cursor:"pointer",textDecoration:"none"}}>
                      <div style={{width:26,height:26,borderRadius:"50%",background:"#10b981",color:"#fff",
                        fontSize:12,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {s.n}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:12,color:"#0f172a"}}>{s.emoji} {s.t}</div>
                        <div style={{fontSize:10,color:"#64748b"}}>{s.d}</div>
                      </div>
                    </Link>
                  ):(
                    <div onClick={()=>setActiveTab(s.tab)} style={{display:"flex",alignItems:"center",gap:10,flex:1,cursor:"pointer"}}>
                      <div style={{width:26,height:26,borderRadius:"50%",background:"#10b981",color:"#fff",
                        fontSize:12,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        {s.n}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:12,color:"#0f172a"}}>{s.emoji} {s.t}</div>
                        <div style={{fontSize:10,color:"#64748b"}}>{s.d}</div>
                      </div>
                    </div>
                  )}
                  <Link href={s.blog}
                    style={{fontSize:9,color:"#059669",fontWeight:700,background:"#ecfdf5",
                      border:"1px solid #6ee7b7",borderRadius:20,padding:"3px 8px",
                      textDecoration:"none",flexShrink:0,whiteSpace:"nowrap"}}>
                    Guide →
                  </Link>
                </div>
              ))}
            </div>
          </div>
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



        {/* ── QUICK LINKS STRIP ── */}
        <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",paddingBottom:2,scrollbarWidth:"none"}}>
          {[
            {icon:"✨",label:"Features",href:"/features",color:"#6366f1",bg:"#eff6ff",border:"#c7d2fe"},
            {icon:"🤖",label:"AI Chat",href:"/chat",color:"#10b981",bg:"#f0fdf4",border:"#6ee7b7"},
            {icon:"📈",label:"Trade",href:"/trade",color:"#059669",bg:"#ecfdf5",border:"#6ee7b7"},
            {icon:"📚",label:"Sikho",href:"/blog",color:"#d97706",bg:"#fffbeb",border:"#fde68a"},
          ].map((l,i)=>(
            <Link key={i} href={l.href} style={{
              display:"flex",alignItems:"center",gap:5,flexShrink:0,
              background:l.bg,border:`1px solid ${l.border}`,
              borderRadius:20,padding:"7px 14px",
              fontSize:12,fontWeight:700,color:l.color,textDecoration:"none",
            }}>
              {l.icon} {l.label}
            </Link>
          ))}
        </div>

        {/* ══ ANALYZE TAB ══ */}
        {activeTab==="analyze" && (
          <div className="fadein">

            {/* ── COIN ANALYZE INPUT ── */}
            <div style={{...CARD,background:"linear-gradient(135deg,#f0fdf4,#fff)",border:"2px solid #6ee7b7"}}>
              <div style={{fontWeight:800,fontSize:15,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:22}}>🔍</span> Coin Analyze Karo
              </div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input value={query} onChange={e=>setQuery(e.target.value.toUpperCase())}
                  onKeyDown={e=>e.key==="Enter"&&analyze()}
                  placeholder="BTC, ETH, SOL, APT, PEPE…"
                  style={{flex:1,background:"#fff",border:"2px solid #e2e8f0",borderRadius:12,
                    padding:"13px 16px",fontSize:16,fontWeight:800,color:"#0f172a",
                    fontFamily:"'JetBrains Mono',monospace",outline:"none",minWidth:0}}
                  onFocus={e=>e.target.style.borderColor="#10b981"}
                  onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                <button onClick={analyze} disabled={loading||!query.trim()}
                  style={{background:loading||!query.trim()?"#e2e8f0":"linear-gradient(135deg,#10b981,#059669)",
                    color:loading||!query.trim()?"#94a3b8":"#fff",border:"none",borderRadius:12,
                    padding:"13px 20px",fontWeight:800,fontSize:14,cursor:"pointer",
                    fontFamily:"'Inter',sans-serif",flexShrink:0,
                    boxShadow:loading||!query.trim()?"none":"0 4px 14px rgba(16,185,129,.4)"}}>
                  {loading?"⟳":"Analyze"}
                </button>
              </div>
              {/* Quick picks */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["BTC","ETH","SOL","APT","AVAX","PEPE","WIF","LINK","ARB","BNB"].map(c=>(
                  <button key={c} onClick={()=>analyzeSymbol(c)}
                    style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:20,
                      padding:"4px 12px",fontSize:11,fontWeight:700,color:"#475569",
                      cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error&&(
              <div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:12,
                padding:"12px 16px",marginBottom:12,fontSize:13,color:"#dc2626",fontWeight:600}}>
                ⚠️ {error}
              </div>
            )}

            {/* Loading */}
            {loading&&(
              <div style={{...CARD,textAlign:"center",padding:"28px"}}>
                <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:12}}>
                  {[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:"50%",
                    background:"#10b981",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
                </div>
                <div style={{fontWeight:700,fontSize:14}}>Analyzing {query}...</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>RSI · MA50 · MA200 · Volume · AI analysis</div>
              </div>
            )}

            {/* Result */}
            {result&&!loading&&(()=>{
              const isGreen=result.decision==="BUY";
              const isRed=result.decision==="SELL";
              const dc=DC_P?.[result.decision];
              return(
                <div className="fadein">
                  {/* Main card */}
                  <div style={{...CARD,padding:0,overflow:"hidden",
                    border:`2px solid ${isGreen?"#6ee7b7":isRed?"#fca5a5":"#e2e8f0"}`}}>
                    {/* Header */}
                    <div style={{background:`linear-gradient(135deg,${isGreen?"#0f172a":"#0f172a"},${isGreen?"#1e3a2f":isRed?"#3b0f0f":"#1e1b2e"})`,
                      padding:"16px 18px",display:"flex",alignItems:"center",gap:12}}>
                      <img src={result.image} alt="" onError={e=>e.target.style.display="none"}
                        style={{width:42,height:42,borderRadius:"50%",border:"2px solid rgba(255,255,255,.2)"}}/>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:900,fontSize:18,color:"#fff"}}>{result.name}</div>
                        <div style={{fontSize:11,color:"rgba(255,255,255,.5)",fontFamily:"'JetBrains Mono',monospace"}}>
                          {result.symbol}/USDT
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:22,fontWeight:900,color:"#fff",fontFamily:"'JetBrains Mono',monospace"}}>
                          ${result.price>=1?result.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):result.price.toPrecision(4)}
                        </div>
                        <div style={{fontSize:12,fontWeight:700,
                          color:result.ch24>=0?"#34d399":"#f87171"}}>
                          {result.ch24>=0?"▲":"▼"}{Math.abs(result.ch24).toFixed(2)}% 24h
                        </div>
                      </div>
                    </div>

                    {/* Decision badge */}
                    <div style={{padding:"14px 18px",
                      background:isGreen?"linear-gradient(135deg,#ecfdf5,#f0fdf4)":isRed?"linear-gradient(135deg,#fef2f2,#fff1f2)":"linear-gradient(135deg,#fffbeb,#fff)",
                      borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{fontSize:24,fontWeight:900,
                          color:isGreen?"#059669":isRed?"#dc2626":result.decision==="HOLD"?"#2563eb":"#d97706"}}>
                          {dc?.emoji||"📊"} {result.decision}
                        </div>
                        <div style={{fontSize:12,color:"#475569",marginTop:2}}>
                          Confidence: <strong>{result.confidence}%</strong> · Risk: <strong>{result.risk}</strong>
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:11,color:"#94a3b8",marginBottom:3}}>Health Score</div>
                        <div style={{fontSize:28,fontWeight:900,
                          color:result.healthScore>=65?"#059669":result.healthScore>=45?"#d97706":"#dc2626"}}>
                          {result.healthScore}<span style={{fontSize:14,color:"#94a3b8"}}>/100</span>
                        </div>
                      </div>
                    </div>

                    {/* Indicators row */}
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",
                      borderBottom:"1px solid #f1f5f9"}}>
                      {[
                        {l:"RSI",     v:result.rsi,   c:parseFloat(result.rsi)<35?"#059669":parseFloat(result.rsi)>65?"#dc2626":"#d97706"},
                        {l:"MA50",    v:result.ma50!=="—"?`$${parseFloat(result.ma50).toFixed(4)}`:result.ma50, c:"#6366f1"},
                        {l:"MA200",   v:result.ma200!=="—"?`$${parseFloat(result.ma200).toFixed(4)}`:result.ma200, c:"#0891b2"},
                      ].map((s,i)=>(
                        <div key={i} style={{padding:"10px 12px",borderRight:i<2?"1px solid #f1f5f9":"none",textAlign:"center"}}>
                          <div style={{fontSize:9,color:"#94a3b8",marginBottom:3,fontWeight:600}}>{s.l}</div>
                          <div style={{fontSize:12,fontWeight:800,color:s.c,fontFamily:"'JetBrains Mono',monospace"}}>{s.v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Entry / SL / Target */}
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)"}}>
                      {[
                        {l:"🎯 Entry", v:`$${result.entryLow?.toFixed?.(4)||"—"}`, c:"#6366f1", bg:"#eff6ff"},
                        {l:"🛑 Stop Loss", v:`$${result.stopLoss?.toFixed?.(4)||"—"}`, c:"#dc2626", bg:"#fef2f2"},
                        {l:"🚀 Target", v:`$${result.exitTarget?.toFixed?.(4)||"—"}`, c:"#059669", bg:"#ecfdf5"},
                      ].map((s,i)=>(
                        <div key={i} style={{padding:"10px 12px",background:s.bg,
                          borderRight:i<2?"1px solid #f1f5f9":"none",textAlign:"center"}}>
                          <div style={{fontSize:9,color:"#94a3b8",marginBottom:3,fontWeight:600}}>{s.l}</div>
                          <div style={{fontSize:11,fontWeight:800,color:s.c,fontFamily:"'JetBrains Mono',monospace"}}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Analysis */}
                  {(aiLoading||aiText)&&(
                    <div style={{...CARD}}>
                      <div style={{fontWeight:700,fontSize:13,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                        <span>🤖</span> AI Analysis
                      </div>
                      {aiLoading?(
                        <div style={{display:"flex",gap:8,justifyContent:"center",padding:"12px 0"}}>
                          {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",
                            background:"#10b981",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
                        </div>
                      ):(
                        <div style={{fontSize:13,color:"#374151",lineHeight:1.8,
                          whiteSpace:"pre-wrap",background:"#f8fafc",borderRadius:10,padding:"12px 14px"}}>
                          {aiText}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Factors */}
            {result&&!loading&&result.factors?.length>0&&(
              <div style={{...CARD}}>
                <div style={{fontWeight:700,fontSize:12,marginBottom:10,color:"#475569"}}>📋 Key Factors</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {result.factors.map((f,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#374151"}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:"#10b981",flexShrink:0}}/>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            )}


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

            {/* ── MARKET HEATMAP — Sector Wise ── */}
            <div style={{...CARD,padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>🌡️</span>
                  <div>
                    <div style={{fontWeight:800,fontSize:13}}>Market Heatmap</div>
                    <div style={{fontSize:10,color:"#94a3b8"}}>
                      {heatData
                        ? `8 sectors · Live · Auto-refresh 30s`
                        : "8 sectors · 10 coins each · Binance live"}
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {heatData&&!heatLoad&&(
                    <div style={{display:"flex",alignItems:"center",gap:4,
                      background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.3)",
                      borderRadius:20,padding:"3px 8px"}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:"#10b981"}}/>
                      <span style={{fontSize:8,color:"#059669",fontWeight:700}}>LIVE</span>
                    </div>
                  )}
                  <button onClick={fetchHeatmap}
                    style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:20,
                      padding:"5px 14px",fontSize:11,color:"#059669",fontWeight:700,cursor:"pointer",
                      fontFamily:"'Inter',sans-serif"}}>
                    {heatLoad?"⟳ Loading...":heatFetched?"🔄":"📊 Load"}
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                {[{c:"#059669",l:">+5%"},{c:"#10b981",l:"+2-5%"},{c:"#6ee7b7",l:"0-2%"},
                  {c:"#fca5a5",l:"0-2%↓"},{c:"#ef4444",l:"-2-5%"},{c:"#991b1b",l:"<-5%"}].map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
                    <div style={{width:10,height:10,borderRadius:2,background:item.c}}/>
                    <span style={{fontSize:9,color:"#64748b",fontWeight:600}}>{item.l}</span>
                  </div>
                ))}
              </div>

              {/* Not loaded */}
              {!heatFetched&&(
                <div style={{textAlign:"center",padding:"20px 0"}}>
                  <div style={{fontSize:32,marginBottom:8}}>🌍</div>
                  <div style={{fontSize:12,color:"#64748b",marginBottom:12}}>
                    8 sectors ke 80+ coins ka live heatmap
                  </div>
                  <button onClick={fetchHeatmap}
                    style={{background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",
                      border:"none",borderRadius:12,padding:"10px 24px",fontWeight:700,
                      fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                    📊 Load Heatmap
                  </button>
                </div>
              )}

              {/* Loading shimmer */}
              {heatLoad&&(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[0,1,2,3].map(i=>(
                    <div key={i}>
                      <div style={{height:12,width:120,background:"#f0fdf4",borderRadius:6,marginBottom:6,animation:"shimmer 1.5s infinite"}}/>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4}}>
                        {[0,1,2,3,4,5,6,7,8,9].map(j=>(
                          <div key={j} style={{height:36,background:"#f1f5f9",borderRadius:8,animation:`shimmer 1.5s ${j*.1}s infinite`}}/>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sector-wise heatmap */}
              {heatData&&!heatLoad&&(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {SECTORS.map((sector,si)=>{
                    // Calculate sector average
                    const validCoins=sector.coins.filter(c=>heatData[c]);
                    const sectorAvg=validCoins.length>0
                      ?validCoins.reduce((s,c)=>s+(heatData[c]?.ch24||0),0)/validCoins.length:0;
                    const sColor=sectorAvg>=3?"#059669":sectorAvg>=0?"#10b981":sectorAvg>=-3?"#ef4444":"#dc2626";

                    return(
                      <div key={si} style={{background:"#f8fafc",borderRadius:12,padding:"10px",
                        border:"1px solid #f1f5f9"}}>
                        {/* Sector header */}
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
                          <div style={{fontWeight:800,fontSize:12,color:"#0f172a"}}>{sector.name}</div>
                          <div style={{fontSize:10,fontWeight:700,color:sColor,background:sectorAvg>=0?"#f0fdf4":"#fef2f2",
                            border:`1px solid ${sColor}33`,borderRadius:20,padding:"2px 8px"}}>
                            Avg {sectorAvg>=0?"+":""}{sectorAvg.toFixed(1)}%
                          </div>
                        </div>
                        {/* Coins grid */}
                        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:3}}>
                          {sector.coins.map(c=>{
                            const d=heatData[c];
                            const ch=d?.ch24||0;
                            const bg=ch>=5?"#059669":ch>=2?"#10b981":ch>=0?"#6ee7b7":ch>=-2?"#fca5a5":ch>=-5?"#ef4444":"#991b1b";
                            const tc=Math.abs(ch)>=2||ch<=0?"#fff":"#065f46";
                            return(
                              <div key={c}
                                onClick={()=>{analyzeSymbol(c);setActiveTab("analyze");}}
                                style={{background:bg,borderRadius:7,padding:"6px 3px",
                                  textAlign:"center",cursor:"pointer",transition:"transform .15s",
                                  opacity:d?1:.4}}
                                onMouseEnter={e=>e.currentTarget.style.transform="scale(1.06)"}
                                onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                                <div style={{fontSize:8,fontWeight:800,color:tc,letterSpacing:.3}}>{c}</div>
                                <div style={{fontSize:8,color:tc,fontWeight:700,marginTop:1}}>
                                  {ch>=0?"+":""}{ch.toFixed(1)}%
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{fontSize:9,color:"#94a3b8",textAlign:"right"}}>
                    🔄 Tap any coin → Analyze · Data: Binance live
                  </div>
                </div>
              )}
            </div>

            {/* Expert Choice — moved to Features page */}
            <div className="hov" style={{...CARD,background:"linear-gradient(135deg,#0f172a,#1e3a2f)",border:"none",padding:"20px"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                <div style={{fontSize:32}}>🏆</div>
                <div>
                  <div style={{fontWeight:900,fontSize:16,color:"#fff"}}>Expert Choice</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>120 coins scan → Top 5 daily picks</div>
                </div>
              </div>
              <p style={{fontSize:12,color:"rgba(255,255,255,.6)",lineHeight:1.7,marginBottom:14}}>
                6 technical indicators se AI daily best crypto opportunities dhundta hai — entry price, stop loss aur 3 targets ke saath.
              </p>
              <Link href="/features" style={{display:"block",textAlign:"center",background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",textDecoration:"none",borderRadius:12,padding:"12px",fontWeight:800,fontSize:13,boxShadow:"0 4px 14px rgba(16,185,129,.4)"}}>
                🏆 Expert Choice Dekho →
              </Link>
            </div>

            {/* Ad — end of analyze tab */}
            <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px",margin:"12px 0"}}>
              <div style={{fontSize:9,color:"#94a3b8",letterSpacing:1,marginBottom:2}}>ADVERTISEMENT</div>
              <ins className="adsbygoogle" style={{display:"block"}} data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO" data-ad-format="auto" data-full-width-responsive="true"/>
              <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
            </div>

          </div>
        )}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab==="explain" && (
          <div className="fadein">
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:40,marginBottom:8}}>{desiMode?"🇮🇳":"🤖"}</div>
              <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-1,marginBottom:6}}>
                {desiMode?"Desi Style Explain 🇮🇳":"AI Explain This Coin"}
              </h2>
              <p style={{fontSize:13,color:"#64748b"}}>
                {desiMode?"Bilkul desi andaaz mein — auto, chai, cricket se samjhayega!":"Koi bhi coin ka naam likho — AI simple language mein samjhayega"}
              </p>
            </div>

            {/* Desi Mode Toggle */}
            <div style={{...CARD,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",background: desiMode?"linear-gradient(135deg,#fff7ed,#fed7aa)":"#fff",border:`2px solid ${desiMode?"#f97316":"#e2e8f0"}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:24}}>🇮🇳</span>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color: desiMode?"#c2410c":"#0f172a"}}>Desi Explanation Mode</div>
                  <div style={{fontSize:10,color: desiMode?"#d97706":"#94a3b8"}}>
                    {desiMode?"ON — Auto, chai, cricket style mein":"OFF — Normal English explanation"}
                  </div>
                </div>
              </div>
              <button onClick={()=>{setDesiMode(p=>!p);setExplainText("");}}
                style={{width:52,height:28,borderRadius:100,border:"none",cursor:"pointer",
                  background: desiMode?"linear-gradient(135deg,#f97316,#ea580c)":"#e2e8f0",
                  position:"relative",transition:"all .3s",flexShrink:0}}>
                <div style={{position:"absolute",top:4,width:20,height:20,borderRadius:"50%",background:"#fff",
                  transition:"all .3s",left: desiMode?"28px":"4px",boxShadow:"0 2px 4px rgba(0,0,0,.2)"}}/>
              </button>
            </div>

            <div style={{...CARD}}>
              <div style={{display:"flex",gap:10,marginBottom:14}}>
                <input value={explainQuery} onChange={e=>setExplainQuery(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&explainCoin()}
                  placeholder="Coin name: Bitcoin, Ethereum, Aptos, Arbitrum…"
                  style={{flex:1,background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"12px 14px",fontSize:14,color:"#0f172a",transition:"border-color .2s"}}
                  onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                <button className="btn" onClick={explainCoin} disabled={explainLoad||!explainQuery.trim()} style={{padding:"12px 20px",fontSize:13,borderRadius:12,whiteSpace:"nowrap"}}>
                  {explainLoad?<span style={{display:"inline-block",animation:"spin .8s linear infinite"}}>⟳</span>:desiMode?"Desi Batao 🇮🇳":"Explain 🤖"}
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
                <button className="btn" onClick={()=>{
                    if(newsLoad||newsAiLoad){
                      setNewsLoad(false);setNewsAiLoad(false);
                    } else {
                      fetchNews();
                    }
                  }}
                  style={{padding:"12px 20px",fontSize:13,borderRadius:12,whiteSpace:"nowrap"}}>
                  {newsLoad?<span style={{display:"inline-block",animation:"spin .8s linear infinite"}}>⟳</span>
                  :newsAiLoad?"⟳ AI..."
                  :"📰 Get News"}
                </button>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {["General","BTC","ETH","SOL","BNB","XRP"].map(c=>(
                  <button key={c} onClick={()=>{
                    const q = c==="General" ? "" : c;
                    setNewsQuery(q);
                    fetchNews(q);
                  }}
                    style={{background: newsQuery===(c==="General"?"":c)?"#10b981":"#f8fafc",
                      border:`1px solid ${newsQuery===(c==="General"?"":c)?"#10b981":"#e2e8f0"}`,
                      color: newsQuery===(c==="General"?"":c)?"#fff":"#64748b",
                      padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",
                      transition:"all .15s",fontFamily:"'Inter',sans-serif"}}>
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
                {newsData.articles&&newsData.articles.length>0&&(
                  <div style={{...CARD}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:"#0f172a"}}>
                      📡 Latest News {newsData.coin!=="general"?`— ${newsData.coin}`:"— Crypto Market"}
                      <span style={{fontSize:11,color:"#94a3b8",fontWeight:400,marginLeft:8}}>({new Date(newsData.updatedAt).toLocaleTimeString("en-IN")})</span>
                    </div>
                    <div>
                      {newsData.articles.map((a,i)=>(
                        <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                          style={{display:"block",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"12px 14px",marginBottom:8,textDecoration:"none",transition:"all .15s"}}
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

        {/* ══════════════════════════════════════════════════════════════════ */}

        {/* TAB: WHALE ALERT                                                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab==="whale" && (
          <div className="fadein">
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:40,marginBottom:8}}>🐋</div>
              <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-1,marginBottom:6}}>Whale Alert Tracker</h2>
              <p style={{fontSize:13,color:"#64748b"}}>Bade investors kya kar rahe hain — accumulate ya dump?</p>
            </div>

            <div style={{...CARD}}>
              <div style={{display:"flex",gap:10}}>
                <button className="btn" onClick={fetchWhale} disabled={whaleLoad}
                  style={{flex:1,padding:"12px",fontSize:13,borderRadius:12}}>
                  {whaleLoad?<span style={{display:"inline-block",animation:"spin .8s linear infinite"}}>⟳ Loading…</span>:"🐋 Scan Whale Activity"}
                </button>
                {whaleFetched&&<button onClick={fetchWhale} style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:12,padding:"12px 14px",cursor:"pointer",fontSize:13,color:"#059669",fontWeight:600}}>🔄</button>}
              </div>
              <div style={{marginTop:10,background:"linear-gradient(135deg,#fffbeb,#fef3c7)",borderRadius:10,padding:"8px 12px",fontSize:11,color:"#92400e"}}>
                ⚠️ Yeh Binance volume data + transaction patterns pe based hai. Educational purpose only.
              </div>
            </div>

            {whaleLoad&&(
              <div style={{textAlign:"center",padding:"36px 0"}}>
                <div style={{fontSize:36,marginBottom:10,animation:"float 2s ease-in-out infinite"}}>🐋</div>
                <p style={{color:"#64748b",fontSize:13}}>Whale movements scan ho rahe hain…</p>
              </div>
            )}

            {whaleData&&!whaleLoad&&(
              <div className="fadein">
                <div style={{fontSize:11,color:"#94a3b8",marginBottom:8,display:"flex",justifyContent:"space-between"}}>
                  <span>🔄 Updated: {whaleData.updatedAt}</span>
                  <span>{whaleData.alerts.length} signals found</span>
                </div>

                {/* Market Signals */}
                {whaleData.alerts.length>0&&(
                  <div style={{...CARD,padding:"16px"}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>📊 Market Signals</div>
                    {whaleData.alerts.map((a,i)=>(
                      <div key={i} style={{background:a.ch24>0?"linear-gradient(135deg,#f0fdf4,#ecfdf5)":"linear-gradient(135deg,#fff1f2,#fee2e2)",border:`1px solid ${a.ch24>0?"#6ee7b7":"#fca5a5"}`,borderRadius:14,padding:"14px",marginBottom:8}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:20}}>{a.ch24>3?"🟢":a.ch24<-3?"🔴":"🟡"}</span>
                            <div>
                              <div className="mono" style={{fontWeight:800,fontSize:15}}>{a.coin}</div>
                              <div style={{fontSize:10,color:"#94a3b8"}}>{a.type}</div>
                            </div>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div className="mono" style={{fontSize:16,fontWeight:900,color:a.ch24>=0?"#059669":"#dc2626"}}>{a.ch24>=0?"+":""}{a.ch24.toFixed(2)}%</div>
                            <div style={{fontSize:10,color:"#94a3b8"}}>Vol: ${a.vol24B}B</div>
                          </div>
                        </div>
                        <div style={{background:"rgba(255,255,255,.6)",borderRadius:10,padding:"8px 10px",fontSize:12,color:"#475569"}}>{a.detail}</div>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8}}>
                          <span style={{background:a.strength==="HIGH"?"#fef2f2":a.strength==="MEDIUM"?"#fffbeb":"#f0fdf4",border:`1px solid ${a.strength==="HIGH"?"#fca5a5":a.strength==="MEDIUM"?"#fde68a":"#6ee7b7"}`,borderRadius:20,padding:"2px 10px",fontSize:10,fontWeight:700,color:a.strength==="HIGH"?"#dc2626":a.strength==="MEDIUM"?"#d97706":"#059669"}}>
                            {a.strength} SIGNAL
                          </span>
                          <span style={{fontSize:10,color:"#94a3b8"}}>{a.signal}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Large Transactions */}
                <div style={{...CARD,padding:"16px"}}>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>🔍 Recent Large Transactions</div>
                  {whaleData.txns.map((t,i)=>(
                    <div key={i} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span className="mono" style={{fontWeight:800,fontSize:13}}>{t.coin}</span>
                          <span style={{background:t.type.includes("INFLOW")?"#fef2f2":t.type.includes("OUTFLOW")?"#f0fdf4":"#fffbeb",border:`1px solid ${t.type.includes("INFLOW")?"#fca5a5":t.type.includes("OUTFLOW")?"#6ee7b7":"#fde68a"}`,borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,color:t.type.includes("INFLOW")?"#dc2626":t.type.includes("OUTFLOW")?"#059669":"#d97706"}}>
                            {t.type}
                          </span>
                        </div>
                        <div className="mono" style={{fontSize:12,fontWeight:700,color:"#0f172a"}}>${t.usd}M</div>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#94a3b8"}}>
                        <span>From: {t.from} → {t.to}</span>
                        <span>{t.time}</span>
                      </div>
                      <div style={{marginTop:6,background:t.risk.includes("✅")?"#f0fdf4":t.risk.includes("⚠️")?"#fffbeb":"#f8fafc",borderRadius:8,padding:"5px 8px",fontSize:11,color:"#475569",fontWeight:600}}>
                        {t.risk}
                      </div>
                    </div>
                  ))}
                </div>

                {/* What this means */}
                <div style={{background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)",border:"1px solid #6ee7b7",borderRadius:16,padding:"16px"}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#065f46",marginBottom:10}}>💡 Whale Activity Ko Kaise Samjhein</div>
                  {[
                    "🟢 Exchange OUTFLOW = Whales coin nikal rahe hain — long-term hold signal (Bullish)",
                    "🔴 Exchange INFLOW = Whales sell karne ke liye bhej rahe hain (Bearish)",
                    "🟡 Wallet Transfer = Internal move — abhi kuch nahi hua, monitor karo",
                    "📊 High volume + price up = Genuine buying interest",
                    "⚠️ High volume + price stable = Distribution ho sakti hai",
                  ].map((tip,i)=>(
                    <div key={i} style={{fontSize:11,color:"#166534",lineHeight:1.7,padding:"3px 0",borderBottom:i<4?"1px dashed #6ee7b7":"none"}}>{tip}</div>
                  ))}
                </div>
              </div>
            )}

            {!whaleData&&!whaleLoad&&(
              <div style={{textAlign:"center",padding:"32px 16px",color:"#94a3b8"}}>
                <div style={{fontSize:48,marginBottom:10}}>🌊</div>
                <p style={{fontSize:13,fontWeight:500}}>Scan karo — whale movements dekho</p>
                <p style={{fontSize:11,marginTop:4}}>Exchange flows · Volume anomalies · Large transactions</p>
              </div>
            )}
          </div>
        )}

        {/* Ad — footer */}
        <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px",margin:"12px 0"}}>
          <div style={{fontSize:9,color:"#94a3b8",letterSpacing:1,marginBottom:2}}>ADVERTISEMENT</div>
          <ins className="adsbygoogle" style={{display:"block"}} data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO" data-ad-format="auto" data-full-width-responsive="true"/>
          <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
        </div>

        {/* FOOTER */}
        <div style={{marginTop:20}}>

          {/* Platform Info Card — moved from analyze tab */}
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,
            padding:"18px",marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
            <h3 style={{fontSize:15,fontWeight:900,color:"#0f172a",marginBottom:10,letterSpacing:-.3}}>
              🚀 YES YOU PRO — Sab Ek Jagah Free
            </h3>
            <p style={{fontSize:13,color:"#475569",lineHeight:1.85,marginBottom:10}}>
              India ka free AI-powered crypto platform. Koi subscription nahi,
              koi signup nahi — bas open karo aur use karo. Bitcoin se lekar latest
              altcoins tak — 120+ coins ka real-time analysis milta hai.
            </p>
            <p style={{fontSize:13,color:"#475569",lineHeight:1.85,marginBottom:14}}>
              <strong style={{color:"#059669"}}>Expert Choice</strong> feature daily
              best 5 coins dhundhta hai — entry price, stop loss aur 3 targets ke saath.{" "}
              <strong style={{color:"#6366f1"}}>DCA Planner</strong> se real historical
              data se investment calculate karo.{" "}
              <strong style={{color:"#d97706"}}>Tax Calculator</strong> se instant
              Indian crypto tax calculation hoti hai.
            </p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <Link href="/features" style={{display:"inline-flex",alignItems:"center",gap:5,
                background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",
                borderRadius:20,padding:"8px 18px",fontSize:12,fontWeight:700,
                textDecoration:"none",boxShadow:"0 4px 12px rgba(16,185,129,.3)"}}>
                ✨ All Features Dekho →
              </Link>
              <Link href="/blog" style={{display:"inline-flex",alignItems:"center",gap:5,
                background:"#f0fdf4",border:"1px solid #6ee7b7",color:"#059669",
                borderRadius:20,padding:"8px 18px",fontSize:12,fontWeight:700,
                textDecoration:"none"}}>
                📚 Blog →
              </Link>
              <Link href="/chat" style={{display:"inline-flex",alignItems:"center",gap:5,
                background:"#f0fdf4",border:"1px solid #10b981",color:"#10b981",
                borderRadius:20,padding:"8px 18px",fontSize:12,fontWeight:700,
                textDecoration:"none"}}>
                🤖 AI Chat →
              </Link>
            </div>
          </div>
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
              <span style={{fontWeight:800,fontSize:14}}>YES YOU PRO</span>
              <span style={{fontSize:11,color:"#94a3b8"}}>by YesYouPro</span>
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {[{label:"🏠 Home",href:"/"},{label:"👋 About",href:"/about"},{label:"📚 Blog",href:"/blog"},{label:"✨ Features",href:"/features"},{label:"🤖 AI Chat",href:"/chat"},{label:"🔒 Privacy",href:"/privacy"},{label:"📋 Terms",href:"/terms"},{label:"💬 Contact",href:"/contact"}].map((l,i)=>(
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
