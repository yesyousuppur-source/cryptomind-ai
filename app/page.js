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
  {id:"whale",   icon:"🐋", label:"Whale Alert"},
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
    // Auto scan on page load
    setTimeout(()=>fetchTop5(), 800);
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

  // ── HEATMAP FETCH ──────────────────────────────────────────────────────────
  const HEATMAP_COINS = ["BTC","ETH","SOL","BNB","XRP","ADA","DOGE","AVAX","LINK","APT","SUI","INJ","MATIC","TRX","ARB"];
  const fetchHeatmap=async()=>{
    setHeatLoad(true);setHeatFetched(true);
    try{
      const syms=HEATMAP_COINS.map(c=>`"${c}USDT"`).join(",");
      const r=await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${syms}]`);
      const data=await r.json();
      const map={};
      for(const t of data){
        const sym=t.symbol.replace("USDT","");
        map[sym]={price:parseFloat(t.lastPrice),ch24:parseFloat(t.priceChangePercent),vol:parseFloat(t.quoteVolume)};
      }
      setHeatData(map);
    }catch(_){}
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



        {/* ✨ EXCLUSIVE FEATURES BANNER — always visible below tabs */}
        <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",borderRadius:20,padding:"16px 18px",marginBottom:16,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"radial-gradient(circle,rgba(16,185,129,.15),transparent)"}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:6,padding:"2px 8px",fontWeight:800,fontSize:10,color:"#fff"}}>NEW</span>
            <span style={{fontSize:11,color:"#6ee7b7",fontWeight:700,letterSpacing:1}}>EXCLUSIVE FEATURES</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:12}}>
            {[
              {icon:"🧠",label:"IQ Test"},
              {icon:"🏥",label:"Health Check"},
              {icon:"🤝",label:"Buddy System"},
              {icon:"🌍",label:"Desi Network"},
            ].map((f,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,.06)",borderRadius:10,padding:"8px 4px",textAlign:"center",border:"1px solid rgba(16,185,129,.2)"}}>
                <div style={{fontSize:18,marginBottom:3}}>{f.icon}</div>
                <div style={{fontWeight:600,fontSize:9,color:"#e2e8f0",lineHeight:1.3}}>{f.label}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <Link href="/features" style={{flex:1,background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",textDecoration:"none",borderRadius:12,padding:"10px",fontWeight:700,fontSize:12,textAlign:"center",boxShadow:"0 4px 14px rgba(16,185,129,.4)"}}>
              ✨ Open Features
            </Link>
            <Link href="/arena" style={{flex:1,background:"rgba(255,255,255,.08)",color:"#e2e8f0",textDecoration:"none",borderRadius:12,padding:"10px",fontWeight:700,fontSize:12,textAlign:"center",border:"1px solid rgba(255,255,255,.15)"}}>
              🏟️ Trading Arena
            </Link>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Link href="/sikho" style={{flex:1,background:"rgba(99,102,241,.2)",color:"#a5b4fc",textDecoration:"none",borderRadius:12,padding:"10px",fontWeight:700,fontSize:12,textAlign:"center",border:"1px solid rgba(99,102,241,.3)"}}>
              📚 Crypto Sikho
            </Link>
            <Link href="/market" style={{flex:1,background:"rgba(245,158,11,.15)",color:"#fbbf24",textDecoration:"none",borderRadius:12,padding:"10px",fontWeight:700,fontSize:12,textAlign:"center",border:"1px solid rgba(245,158,11,.3)"}}>
              📊 Live Market
            </Link>
          </div>
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <Link href="/radar" style={{flex:1,background:"rgba(239,68,68,.15)",color:"#fca5a5",textDecoration:"none",borderRadius:12,padding:"10px",fontWeight:700,fontSize:12,textAlign:"center",border:"1px solid rgba(239,68,68,.3)"}}>
              🚨 Pump Radar
            </Link>
            <Link href="/trade" style={{flex:1,background:"rgba(16,185,129,.15)",color:"#6ee7b7",textDecoration:"none",borderRadius:12,padding:"10px",fontWeight:700,fontSize:12,textAlign:"center",border:"1px solid rgba(16,185,129,.3)"}}>
              📈 Trade Manager
            </Link>
          </div>
          {/* Whitepaper teaser */}
          <Link href="/features?tab=whitepaper" style={{display:"block",textDecoration:"none",marginTop:8,background:"linear-gradient(135deg,rgba(16,185,129,.15),rgba(16,185,129,.05))",border:"1px solid rgba(16,185,129,.3)",borderRadius:12,padding:"10px 14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:20}}>⏱️</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:12,color:"#10b981"}}>Whitepaper AI — 2-3 Ghante Bachao!</div>
                <div style={{fontSize:10,color:"#64748b",marginTop:2}}>50-100 page whitepaper → 2 min summary → Smart decision</div>
              </div>
              <span style={{color:"#10b981",fontSize:14}}>→</span>
            </div>
          </Link>
        </div>
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

            {/* ── MARKET HEATMAP (compact) ── */}
            <div className="hov" style={{...CARD,padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>🌡️</span>
                  <div>
                    <div style={{fontWeight:800,fontSize:13}}>Market Heatmap</div>
                    <div style={{fontSize:10,color:"#94a3b8"}}>15 coins — live 24h performance</div>
                  </div>
                </div>
                <button onClick={()=>{if(!heatFetched)fetchHeatmap();else fetchHeatmap();}}
                  style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:20,padding:"4px 12px",fontSize:11,color:"#059669",fontWeight:600,cursor:"pointer"}}>
                  {heatLoad?"⟳":heatFetched?"🔄":"📊 Load"}
                </button>
              </div>
              {!heatFetched&&(
                <div style={{textAlign:"center",padding:"8px 0",fontSize:12,color:"#94a3b8"}}>
                  Load dabao — 15 coins ka live heatmap dikhega 🌡️
                </div>
              )}
              {heatLoad&&<div style={{height:40,background:"#f0fdf4",borderRadius:10,animation:"shimmer 1.5s infinite"}}/>}
              {heatData&&!heatLoad&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4}}>
                  {HEATMAP_COINS.map(c=>{
                    const d=heatData[c]; if(!d) return null;
                    const ch=d.ch24;
                    const bg=ch>=5?"#059669":ch>=2?"#10b981":ch>=0?"#34d399":ch>=-2?"#f87171":ch>=-5?"#ef4444":"#dc2626";
                    const textC=Math.abs(ch)>=2?"#fff":"#fff";
                    return(
                      <div key={c} onClick={()=>{setQuery(c);setActiveTab("analyze");}}
                        style={{background:bg,borderRadius:8,padding:"6px 3px",textAlign:"center",cursor:"pointer",transition:"transform .15s"}}
                        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"}
                        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                        <div className="mono" style={{fontSize:9,fontWeight:800,color:textC}}>{c}</div>
                        <div style={{fontSize:9,color:textC,fontWeight:700,marginTop:2}}>{ch>=0?"+":""}{ch.toFixed(1)}%</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {heatData&&!heatLoad&&(
                <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                  {[{c:"#059669",l:">+5%"},{c:"#10b981",l:"+2-5%"},{c:"#34d399",l:"0-2%"},{c:"#f87171",l:"0-2%↓"},{c:"#dc2626",l:">-5%"}].map((item,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:3}}>
                      <div style={{width:8,height:8,borderRadius:2,background:item.c}}/>
                      <span style={{fontSize:9,color:"#94a3b8"}}>{item.l}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SMART SIGNAL FINDER */}
            <div className="hov" style={{...CARD,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#f59e0b,#10b981,#6366f1)",backgroundSize:"200% auto",animation:"gradmove 3s linear infinite"}}/>
<div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px",margin:"14px 0"}}>
            {/* Ad */}
            <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px",margin:"12px 0"}}>
              <div style={{fontSize:9,color:"#94a3b8",letterSpacing:1,marginBottom:2}}>ADVERTISEMENT</div>
              <ins className="adsbygoogle" style={{display:"block"}} data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO" data-ad-format="auto" data-full-width-responsive="true"/>
              <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
            </div>
              <SH icon="🏆" title="Expert Choice" subtitle="30 coins scan → AI analysis → Top 5 expert picks"/>

              {/* Color legend */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                {[
                  {label:"VERY STRONG",color:"#059669",bg:"#ecfdf5",score:"80+"},
                  {label:"STRONG",color:"#10b981",bg:"#f0fdf4",score:"65+"},
                  {label:"WATCH",color:"#d97706",bg:"#fffbeb",score:"48+"},
                  {label:"WEAK",color:"#dc2626",bg:"#fef2f2",score:"<48"},
                ].map(s=>(
                  <div key={s.label} style={{background:s.bg,border:`1px solid ${s.color}44`,borderRadius:20,padding:"3px 10px",fontSize:9,color:s.color,fontWeight:700}}>
                    {s.label} ({s.score})
                  </div>
                ))}
              </div>

              {!top5Fetched?(
                <div style={{textAlign:"center",padding:"16px 0"}}>
                  <div style={{fontSize:32,marginBottom:8}}>🎯</div>
                  <p style={{fontSize:12,color:"#64748b",marginBottom:12}}>30 coins scan karke best signals dhundega</p>
                  <button className="btn" onClick={fetchTop5} style={{padding:"11px 28px",fontSize:13,borderRadius:12}}>🔍 Scan Karo</button>
                </div>
              ):top5Load?(
                <div style={{textAlign:"center",padding:"16px 0"}}>
                  <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:10}}>
                    {[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:"#10b981",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
                  </div>
                  <p style={{fontSize:12,color:"#64748b"}}>Scanning 30 coins...</p>
                </div>
              ):top5?.coins?.length>0?(
                <div className="fadein">
                  {/* Weak market warning */}
                  {top5?.isWeakMarket&&(
                    <div style={{background:"linear-gradient(135deg,#fffbeb,#fef3c7)",border:"2px solid #fde68a",borderRadius:14,padding:"10px 14px",marginBottom:12}}>
                      <div style={{fontWeight:700,fontSize:12,color:"#92400e",marginBottom:2}}>⚠️ Weak Market — Cautious Signals</div>
                      <div style={{fontSize:11,color:"#78350f"}}>Chhota position lo, tight stop loss lagao.</div>
                    </div>
                  )}
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {top5.coins.map((coin,i)=>{
                      const signalColors = {
                        "VERY STRONG":{color:"#059669",bg:"#ecfdf5",border:"#6ee7b7",badge:"🔥 VERY STRONG"},
                        "STRONG BUY":  {color:"#059669",bg:"#ecfdf5",border:"#6ee7b7",badge:"✅ STRONG BUY"},
                        "BUY":         {color:"#10b981",bg:"#f0fdf4",border:"#a7f3d0",badge:"🟢 BUY"},
                        "WATCH":       {color:"#d97706",bg:"#fffbeb",border:"#fde68a",badge:"👀 WATCH"},
                        "CAUTION":     {color:"#dc2626",bg:"#fef2f2",border:"#fca5a5",badge:"⚠️ WEAK"},
                      };
                      const sc = signalColors[coin.signal] || signalColors["WATCH"];
                      return(
                        <div key={coin.symbol} style={{background:"#fff",border:`2px solid ${sc.border}`,borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.04)"}}>
                          {/* Top bar */}
                          <div style={{background:`linear-gradient(135deg,${sc.bg},#fff)`,padding:"11px 14px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid #f1f5f9"}}>
                            <img src={coin.image} alt="" onError={e=>e.target.style.display="none"} style={{width:32,height:32,borderRadius:"50%",border:"2px solid #e2e8f0",flexShrink:0}}/>
                            <div style={{flex:1}}>
                              <div style={{fontWeight:800,fontSize:14,color:"#0f172a"}}>{coin.name}</div>
                              <div className="mono" style={{fontSize:10,color:"#94a3b8"}}>{coin.symbol}</div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div className="mono" style={{fontSize:14,fontWeight:800}}>{coin.price}</div>
                              <div style={{fontSize:11,color:parseFloat(coin.ch24)>=0?"#059669":"#dc2626",fontWeight:600}}>{parseFloat(coin.ch24)>=0?"▲":"▼"}{Math.abs(parseFloat(coin.ch24)).toFixed(1)}%</div>
                            </div>
                          </div>
                          {/* Signal + details */}
                          <div style={{padding:"10px 14px"}}>
                            <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
                              <span style={{background:sc.bg,border:`1px solid ${sc.border}`,borderRadius:20,padding:"4px 12px",fontSize:11,color:sc.color,fontWeight:800}}>{sc.badge}</span>
                              <span style={{fontSize:10,color:"#94a3b8",background:"#f8fafc",padding:"2px 8px",borderRadius:20}}>RSI: {coin.rsi}</span>
                              <span style={{fontSize:10,color:"#6366f1",background:"#eef2ff",padding:"2px 8px",borderRadius:20,fontWeight:700}}>R:R 1:{coin.rrRatio}</span>
                              <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,
                                background:coin.score>=72?"#ecfdf5":coin.score>=60?"#f0fdf4":coin.score>=48?"#fffbeb":"#fef2f2",
                                color:coin.score>=72?"#059669":coin.score>=60?"#10b981":coin.score>=48?"#d97706":"#dc2626"}}>
                                Score: {coin.score}/100
                              </span>
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
                              <div style={{background:"#fef2f2",borderRadius:10,padding:"7px 5px",textAlign:"center",border:"1px solid #fca5a5"}}>
                                <div style={{fontSize:8,color:"#dc2626",fontWeight:700,marginBottom:2}}>🛑 SL</div>
                                <div className="mono" style={{fontSize:9,fontWeight:800,color:"#991b1b"}}>{coin.stopLoss}</div>
                                <div style={{fontSize:8,color:"#dc2626"}}>{coin.slPct}%</div>
                              </div>
                              <div style={{background:"#f0fdf4",borderRadius:10,padding:"7px 5px",textAlign:"center",border:"1px solid #86efac"}}>
                                <div style={{fontSize:8,color:"#059669",fontWeight:700,marginBottom:2}}>🎯 TP1</div>
                                <div className="mono" style={{fontSize:9,fontWeight:800,color:"#065f46"}}>{coin.tp1}</div>
                                <div style={{fontSize:8,color:"#059669"}}>+{coin.tp1Pct}%</div>
                              </div>
                              <div style={{background:"#f0fdf4",borderRadius:10,padding:"7px 5px",textAlign:"center",border:"1px solid #4ade80"}}>
                                <div style={{fontSize:8,color:"#059669",fontWeight:700,marginBottom:2}}>🚀 TP2</div>
                                <div className="mono" style={{fontSize:9,fontWeight:800,color:"#065f46"}}>{coin.tp2}</div>
                                <div style={{fontSize:8,color:"#059669"}}>+{coin.tp2Pct}%</div>
                              </div>
                              <div style={{background:"#eff6ff",borderRadius:10,padding:"7px 5px",textAlign:"center",border:"1px solid #93c5fd"}}>
                                <div style={{fontSize:8,color:"#1d4ed8",fontWeight:700,marginBottom:2}}>💎 TP3</div>
                                <div className="mono" style={{fontSize:9,fontWeight:800,color:"#1e3a8a"}}>{coin.tp3}</div>
                                <div style={{fontSize:8,color:"#2563eb"}}>+{coin.tp3Pct}%</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
                    <div style={{fontSize:10,color:"#94a3b8"}}>📡 {top5.scanned} coins scanned · {new Date(top5.updatedAt).toLocaleTimeString("en-IN")}</div>
                    <button onClick={fetchTop5} style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:20,padding:"4px 14px",fontSize:11,color:"#059669",fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>🔄 Refresh</button>
                  </div>
                </div>
              ):(
                <div style={{textAlign:"center",padding:"16px 0"}}>
                  <div style={{fontSize:32,marginBottom:8}}>🔍</div>
                  <p style={{fontSize:12,color:"#64748b",marginBottom:12}}>Koi signal nahi mila abhi</p>
                  <button onClick={fetchTop5} style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:12,padding:"10px 24px",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>🔄 Dobara Scan Karo</button>
                </div>
              )}
            </div>

                        {/* TOOLS divider */}
            <div style={{position:"relative",margin:"8px 0 16px"}}>
              <div style={{borderTop:"2px dashed #6ee7b7"}}/>
              <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#f0fdf8",padding:"0 14px"}}>
                <span style={{background:"linear-gradient(135deg,#10b981,#059669)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",fontWeight:900,fontSize:13}}>✦ TOOLS ✦</span>
              </div>
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


              </div>
            {/* ── COMPARE COINS TOOL ── */}
            <div className="hov" style={{...CARD}}>
              <SH icon="⚔️" title="Coin vs Coin Compare" subtitle="2-4 coins compare karo — winner AI batayega" bg="linear-gradient(135deg,#f5f3ff,#ede9fe)" br="#c4b5fd"/>

              {/* Coin inputs */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                {compareList.map((coin,i)=>(
                  <div key={i} style={{position:"relative"}}>
                    <input
                      value={coin}
                      onChange={e=>{const n=[...compareList];n[i]=e.target.value.toUpperCase();setCompareList(n);}}
                      placeholder={i<2?`Coin ${i+1} *`:`Coin ${i+1} (optional)`}
                      style={{width:"100%",background:"#f8fafc",border:`2px solid ${coin?"#6366f1":"#e2e8f0"}`,borderRadius:12,padding:"10px 12px",fontSize:13,color:"#0f172a",boxSizing:"border-box"}}
                      onFocus={e=>e.target.style.borderColor="#6366f1"} onBlur={e=>e.target.style.borderColor=coin?"#6366f1":"#e2e8f0"}/>
                    {coin&&<div style={{position:"absolute",top:"50%",right:10,transform:"translateY(-50%)",fontSize:10,fontWeight:700,color:"#6366f1"}}>{coin}</div>}
                  </div>
                ))}
              </div>

              {/* Quick presets */}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,width:"100%",marginBottom:2}}>Quick Compare:</div>
                {[["BTC","ETH"],["ETH","SOL"],["BTC","ETH","SOL"],["SOL","APT","INJ","SUI"]].map((preset,i)=>(
                  <button key={i} onClick={()=>setCompareList([...preset,...Array(4-preset.length).fill("")])}
                    style={{background:"#f5f3ff",border:"1px solid #c4b5fd",borderRadius:20,padding:"4px 10px",fontSize:10,color:"#6366f1",fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                    {preset.join(" vs ")}
                  </button>
                ))}
              </div>

              <button className="btn" onClick={compareCoins}
                disabled={compareLoad||compareList.filter(Boolean).length<2}
                style={{width:"100%",padding:"12px",borderRadius:12,fontSize:13,
                  background:compareLoad?"#64748b":"linear-gradient(135deg,#7c3aed,#6366f1)",
                  boxShadow:"0 4px 14px rgba(99,102,241,.4)"}}>
                {compareLoad?"⟳ Data Fetch Ho Raha Hai...":"⚔️ Compare Karo"}
              </button>

              {/* Loading skeleton */}
              {compareLoad&&(
                <div className="fadein" style={{marginTop:14}}>
                  <div style={{background:"#f5f3ff",borderRadius:14,padding:"16px",marginBottom:10}}>
                    <div style={{fontWeight:700,fontSize:12,color:"#6366f1",marginBottom:10}}>⏳ Analyzing...</div>
                    {compareList.filter(Boolean).map((coin,i)=>(
                      <div key={i} style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontWeight:700,fontSize:12,color:"#4f46e5"}}>{coin}</span>
                          <span style={{fontSize:10,color:"#94a3b8"}}>fetching...</span>
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          {["Price","Volume","Market Cap","Score"].map(l=>(
                            <div key={l} style={{flex:1,background:"linear-gradient(90deg,#e2e8f0,#f1f5f9,#e2e8f0)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite",borderRadius:8,height:36,display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <span style={{fontSize:9,color:"#94a3b8"}}>{l}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div style={{marginTop:8,fontSize:11,color:"#6366f1",textAlign:"center",fontWeight:600}}>
                      {["🔍 Binance se price fetch...","📊 RSI calculate kar raha hai...","📅 Historical data...","🤖 AI verdict bana raha hai..."][Math.floor(Date.now()/1000)%4]}
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              {compareData&&(
                <div className="fadein" style={{marginTop:14}}>

                  {/* 0. PRICE / VOLUME / MARKET CAP */}
                  <div style={{overflowX:"auto",marginBottom:10}}>
                    <div style={{display:"grid",gridTemplateColumns:`repeat(${compareData.results.length},1fr)`,gap:8,minWidth:compareData.results.length*140}}>
                      {compareData.results.map((r,i)=>(
                        <div key={r.coin} style={{background:i===0?"linear-gradient(135deg,#f5f3ff,#ede9fe)":"#fff",
                          border:`2px solid ${i===0?"#6366f1":"#e2e8f0"}`,borderRadius:16,padding:"12px 10px",textAlign:"center"}}>
                          {i===0&&<div style={{fontSize:9,color:"#6366f1",fontWeight:800,marginBottom:4}}>🏆 BEST SCORE</div>}
                          <div className="mono" style={{fontSize:16,fontWeight:900,color:i===0?"#4f46e5":"#0f172a",marginBottom:6}}>{r.coin}</div>
                          {/* Current Price */}
                          <div style={{background:"#f8fafc",borderRadius:10,padding:"6px 4px",marginBottom:6}}>
                            <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,marginBottom:2}}>💰 PRICE</div>
                            <div className="mono" style={{fontSize:12,fontWeight:800,color:"#0f172a"}}>
                              ${r.price>=1?r.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):r.price.toPrecision(4)}
                            </div>
                            <div style={{fontSize:10,fontWeight:700,color:parseFloat(r.ch24)>=0?"#059669":"#dc2626"}}>
                              {parseFloat(r.ch24)>=0?"▲":"▼"}{Math.abs(parseFloat(r.ch24)).toFixed(1)}% 24h
                            </div>
                          </div>
                          {/* Volume */}
                          <div style={{background:"#f8fafc",borderRadius:10,padding:"6px 4px",marginBottom:6}}>
                            <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,marginBottom:2}}>📊 VOLUME 24h</div>
                            <div className="mono" style={{fontSize:11,fontWeight:700,color:"#2563eb"}}>
                              ${r.vol>=1e9?(r.vol/1e9).toFixed(2)+"B":r.vol>=1e6?(r.vol/1e6).toFixed(1)+"M":(r.vol/1e3).toFixed(0)+"K"}
                            </div>
                          </div>
                          {/* Market Cap */}
                          <div style={{background:"#f8fafc",borderRadius:10,padding:"6px 4px",marginBottom:6}}>
                            <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,marginBottom:2}}>🏦 MARKET CAP</div>
                            <div className="mono" style={{fontSize:11,fontWeight:700,color:"#7c3aed"}}>
                              {r.marketCap?`$${r.marketCap>=1e9?(r.marketCap/1e9).toFixed(1)+"B":(r.marketCap/1e6).toFixed(0)+"M"}`:"N/A"}
                            </div>
                            {r.mcapRank&&<div style={{fontSize:9,color:"#94a3b8"}}>Rank #{r.mcapRank}</div>}
                          </div>
                          {/* Score */}
                          <div style={{background:i===0?"rgba(99,102,241,.15)":"#f8fafc",borderRadius:10,padding:"6px 4px"}}>
                            <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,marginBottom:2}}>🎯 SCORE</div>
                            <div style={{fontSize:20,fontWeight:900,color:r.score>=65?"#059669":r.score>=50?"#d97706":"#dc2626"}}>{r.score}</div>
                            <div style={{fontSize:9,color:"#94a3b8"}}>/100</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 1. VISUAL BAR CHART */}
                  <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"14px",marginBottom:10}}>
                    <div style={{fontWeight:700,fontSize:12,color:"#4f46e5",marginBottom:10}}>📊 Score Comparison</div>
                    {compareData.results.map((r,i)=>(
                      <div key={r.coin} style={{marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <span style={{fontWeight:700,fontSize:12,color:i===0?"#4f46e5":"#0f172a"}}>{i===0?"🏆 ":""}{r.coin}</span>
                          <span style={{fontWeight:800,fontSize:12,color:r.score>=65?"#059669":r.score>=50?"#d97706":"#dc2626"}}>{r.score}/100</span>
                        </div>
                        <div style={{background:"#f1f5f9",borderRadius:100,height:10,overflow:"hidden"}}>
                          <div style={{height:"100%",borderRadius:100,
                            width:`${r.score}%`,
                            background:i===0?"linear-gradient(90deg,#6366f1,#4f46e5)":
                              r.score>=65?"linear-gradient(90deg,#10b981,#059669)":
                              r.score>=50?"linear-gradient(90deg,#f59e0b,#d97706)":"linear-gradient(90deg,#ef4444,#dc2626)",
                            transition:"width 1s ease"}}/>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 2. CATEGORY STARS */}
                  <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"14px",marginBottom:10,overflowX:"auto"}}>
                    <div style={{fontWeight:700,fontSize:12,color:"#4f46e5",marginBottom:10}}>⭐ Category Comparison</div>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <thead>
                        <tr style={{borderBottom:"2px solid #f1f5f9"}}>
                          <td style={{padding:"4px 6px",color:"#94a3b8",fontWeight:600}}>Category</td>
                          {compareData.results.map(r=><td key={r.coin} style={{padding:"4px 6px",textAlign:"center",fontWeight:800,color:"#4f46e5"}}>{r.coin}</td>)}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          {label:"🛡️ Safety",key:"safetyScore"},
                          {label:"🚀 Potential",key:"potentialScore"},
                          {label:"💧 Liquidity",key:"liquidityScore"},
                          {label:"📈 Trend",key:"trendScore"},
                        ].map(cat=>(
                          <tr key={cat.key} style={{borderBottom:"1px solid #f8fafc"}}>
                            <td style={{padding:"6px 6px",color:"#475569",fontWeight:600}}>{cat.label}</td>
                            {compareData.results.map(r=>(
                              <td key={r.coin} style={{padding:"6px 6px",textAlign:"center"}}>
                                {"⭐".repeat(r[cat.key])}{"☆".repeat(5-r[cat.key])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 3. RISK LEVEL METER */}
                  <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"14px",marginBottom:10}}>
                    <div style={{fontWeight:700,fontSize:12,color:"#4f46e5",marginBottom:10}}>⚠️ Risk Level</div>
                    {compareData.results.map(r=>{
                      const riskColors=["","#10b981","#f59e0b","#ef4444","#dc2626"];
                      const riskLabels=["","LOW RISK","MEDIUM","HIGH","VERY HIGH"];
                      const riskEmoji=["","🟢","🟡","🟠","🔴"];
                      return(
                        <div key={r.coin} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                          <div style={{width:40,fontWeight:700,fontSize:11}}>{r.coin}</div>
                          <div style={{flex:1,display:"flex",gap:3}}>
                            {[1,2,3,4].map(n=>(
                              <div key={n} style={{flex:1,height:8,borderRadius:4,
                                background:n<=r.riskLevel?riskColors[r.riskLevel]:"#f1f5f9"}}/>
                            ))}
                          </div>
                          <div style={{fontSize:10,fontWeight:700,color:riskColors[r.riskLevel],width:70,textAlign:"right"}}>
                            {riskEmoji[r.riskLevel]} {riskLabels[r.riskLevel]}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 4. ₹10,000 SIMULATOR */}
                  <div style={{background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)",border:"1px solid #6ee7b7",borderRadius:16,padding:"14px",marginBottom:10}}>
                    <div style={{fontWeight:700,fontSize:12,color:"#059669",marginBottom:4}}>💰 ₹10,000 Aaj Invest Karo</div>
                    <div style={{fontSize:10,color:"#94a3b8",marginBottom:10}}>30 din ke momentum ke basis pe estimate</div>
                    {compareData.results.map((r,i)=>(
                      <div key={r.coin} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                        background:i===0?"rgba(16,185,129,.1)":"transparent",
                        borderRadius:8,padding:"6px 8px",marginBottom:4}}>
                        <div style={{fontWeight:700,fontSize:12}}>{i===0?"🏆 ":""}{r.coin}</div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontWeight:800,fontSize:13,
                            color:r.projected10k>=10000?"#059669":"#dc2626"}}>
                            ₹{r.projected10k.toLocaleString("en-IN")}
                          </div>
                          <div style={{fontSize:9,color:r.projected10k>=10000?"#10b981":"#ef4444"}}>
                            {r.projected10k>=10000?"+":""}{((r.projected10k-10000)/100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{fontSize:9,color:"#94a3b8",marginTop:6}}>⚠️ Estimate only — not financial advice</div>
                  </div>

                  {/* 5. HISTORICAL COMPARISON */}
                  <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"14px",marginBottom:10}}>
                    <div style={{fontWeight:700,fontSize:12,color:"#4f46e5",marginBottom:10}}>📅 ₹10,000 Pehle Lagaya Hota To</div>
                    {compareData.results.map((r,i)=>(
                      <div key={r.coin} style={{marginBottom:8,padding:"8px",background:i===0?"#f5f3ff":"#f8fafc",borderRadius:10}}>
                        <div style={{fontWeight:700,fontSize:12,marginBottom:4}}>{i===0?"🏆 ":""}{r.coin}</div>
                        <div style={{display:"flex",gap:8}}>
                          {r.hist90d&&(
                            <div style={{flex:1,textAlign:"center",background:"#fff",borderRadius:8,padding:"5px"}}>
                              <div style={{fontSize:9,color:"#94a3b8"}}>90 din pehle</div>
                              <div style={{fontWeight:800,fontSize:12,color:r.hist90d>=10000?"#059669":"#dc2626"}}>
                                ₹{r.hist90d.toLocaleString("en-IN")}
                              </div>
                            </div>
                          )}
                          {r.hist1y&&(
                            <div style={{flex:1,textAlign:"center",background:"#fff",borderRadius:8,padding:"5px"}}>
                              <div style={{fontSize:9,color:"#94a3b8"}}>1 saal pehle</div>
                              <div style={{fontWeight:800,fontSize:12,color:r.hist1y>=10000?"#059669":"#dc2626"}}>
                                ₹{r.hist1y.toLocaleString("en-IN")}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 6. AI VERDICT + KAUNSA KHAREEDON */}
                  {compareData.verdict&&(
                    <div style={{background:"linear-gradient(135deg,#f5f3ff,#ede9fe)",border:"2px solid #6366f1",borderRadius:16,padding:"16px",marginBottom:10}}>
                      <div style={{fontWeight:800,fontSize:14,color:"#4f46e5",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                        🤖 AI Verdict — <span style={{fontSize:11,fontWeight:400,color:"#7c3aed"}}>Poora Analysis</span>
                      </div>
                      {compareData.verdict.split("\n").filter(Boolean).map((line,i)=>{
                        const isImportant = line.startsWith("🏆")||line.startsWith("🎯")||line.startsWith("🚀")||line.startsWith("💪");
                        return(
                          <div key={i} style={{
                            fontSize:isImportant?13:12,
                            color:"#1e1b4b",
                            lineHeight:1.8,
                            marginBottom:isImportant?8:4,
                            fontWeight:isImportant?700:400,
                            background:isImportant?"rgba(99,102,241,.08)":"transparent",
                            borderRadius:isImportant?8:0,
                            padding:isImportant?"6px 10px":"0 2px",
                            borderLeft:isImportant?"3px solid #6366f1":"none",
                          }}>
                            {line}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Share */}
                  <button onClick={()=>{
                    const winner=compareData.results[0];
                    const coins=compareData.results.map(r=>`${r.coin}(${r.score}/100)`).join(" vs ");
                    const msg=`⚔️ Crypto Battle — YES YOU PRO\n\n${coins}\n\n🏆 Winner: ${winner.coin}\n\n${compareData.verdict.slice(0,250)}\n\nyesyoupro.com`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
                  }} style={{width:"100%",background:"#25D366",color:"#fff",border:"none",borderRadius:12,padding:"12px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                    📱 Dosto Ko Battle Share Karo
                  </button>
                </div>
              )}
            </div>

            {/* Content Card — Platform Info */}
            <div style={{background:"#fff",borderRadius:16,padding:"18px",
              boxShadow:"0 2px 12px rgba(0,0,0,.06)",border:"1px solid #e2e8f0"}}>
              <h3 style={{fontSize:15,fontWeight:900,color:"#0f172a",marginBottom:10,letterSpacing:-.3}}>
                🚀 YES YOU PRO — Sab Ek Jagah Free
              </h3>
              <p style={{fontSize:13,color:"#475569",lineHeight:1.85,marginBottom:10}}>
                India ka pehla free AI-powered crypto platform. Koi subscription nahi,
                koi signup nahi — bas open karo aur use karo. Bitcoin se lekar latest
                altcoins tak — 120+ coins ka real-time analysis milta hai.
              </p>
              <p style={{fontSize:13,color:"#475569",lineHeight:1.85,marginBottom:10}}>
                <strong style={{color:"#059669"}}>Expert Choice</strong> feature daily
                best 5 coins dhundhta hai — entry price, stop loss aur 3 targets ke saath.
                <strong style={{color:"#6366f1"}}> Pump Radar</strong> se pump hone se
                pehle alert milta hai. <strong style={{color:"#d97706"}}> Tax Calculator
                </strong> se instant tax calculation hoti hai.
              </p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <Link href="/blog" style={{display:"inline-flex",alignItems:"center",gap:5,
                  background:"#f0fdf4",border:"1px solid #6ee7b7",color:"#059669",
                  borderRadius:20,padding:"6px 14px",fontSize:11,fontWeight:700,
                  textDecoration:"none"}}>
                  📚 Crypto Sikho Blog →
                </Link>
                <Link href="/features" style={{display:"inline-flex",alignItems:"center",gap:5,
                  background:"#f5f3ff",border:"1px solid #c4b5fd",color:"#6366f1",
                  borderRadius:20,padding:"6px 14px",fontSize:11,fontWeight:700,
                  textDecoration:"none"}}>
                  ✨ All Features →
                </Link>
                <Link href="/trade" style={{display:"inline-flex",alignItems:"center",gap:5,
                  background:"#f0fdf4",border:"1px solid #10b981",color:"#10b981",
                  borderRadius:20,padding:"6px 14px",fontSize:11,fontWeight:700,
                  textDecoration:"none"}}>
                  📈 Trade Manager →
                </Link>
              </div>
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

        {/* TAB: EXPLAIN COIN                                                  */}
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
          <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px",margin:"14px 0"}}>
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

          <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px",margin:"14px 0"}}>
            {/* Ad */}
            <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px",margin:"12px 0"}}>
              <div style={{fontSize:9,color:"#94a3b8",letterSpacing:1,marginBottom:2}}>ADVERTISEMENT</div>
              <ins className="adsbygoogle" style={{display:"block"}} data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO" data-ad-format="auto" data-full-width-responsive="true"/>
              <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
            </div>
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

        <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px",margin:"14px 0"}}>
            {/* Ad */}
            <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px",margin:"12px 0"}}>
              <div style={{fontSize:9,color:"#94a3b8",letterSpacing:1,marginBottom:2}}>ADVERTISEMENT</div>
              <ins className="adsbygoogle" style={{display:"block"}} data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO" data-ad-format="auto" data-full-width-responsive="true"/>
              <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
            </div>
        {/* FOOTER */}
        <div style={{marginTop:20}}>

              style={{display:"block"}}
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
              {[{label:"🏠 Home",href:"/"},{label:"👋 About",href:"/about"},{label:"📚 Blog",href:"/blog"},{label:"✨ Features",href:"/features"},{label:"🏟️ Arena",href:"/arena"},{label:"🔒 Privacy",href:"/privacy"},{label:"💬 Contact",href:"/contact"}].map((l,i)=>(
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
