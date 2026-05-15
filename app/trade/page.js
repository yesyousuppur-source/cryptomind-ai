"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const USD_INR = 83.5;

const AD = () => (
  <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#1f2937",
    border:"1px solid #374151",padding:"4px",margin:"10px 0"}}>
    <div style={{fontSize:9,color:"#4b5563",letterSpacing:1}}>ADVERTISEMENT</div>
    <ins className="adsbygoogle" style={{display:"block"}}
      data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO"
      data-ad-format="auto" data-full-width-responsive="true"/>
    <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
  </div>
);

// Exchange logos as SVG components
const ExLogo = ({ex, size=36}) => {
  const logos = {
    binance: (
      <svg width={size*0.6} height={size*0.6} viewBox="0 0 24 24" fill={ex.fg}>
        <path d="M12 3l2.5 2.5L10 10l-2.5-2.5L12 3zm5 5l2.5 2.5-5 5-2.5-2.5 5-5zM7 8l2.5 2.5-5 5L2 13l5-5zm10 5l2.5 2.5-2.5 2.5-2.5-2.5 2.5-2.5zM12 14l2.5 2.5L12 19l-2.5-2.5L12 14z"/>
      </svg>
    ),
    bybit: <span style={{fontSize:size*0.28,fontWeight:900,color:ex.fg,letterSpacing:-0.5}}>BYBIT</span>,
    okx:   <span style={{fontSize:size*0.28,fontWeight:900,color:ex.fg}}>OKX</span>,
    mexc:  <span style={{fontSize:size*0.28,fontWeight:900,color:ex.fg}}>MEXC</span>,
    gate:  <span style={{fontSize:size*0.28,fontWeight:900,color:ex.fg}}>Gate</span>,
    bitget:<span style={{fontSize:size*0.28,fontWeight:900,color:ex.fg}}>BG</span>,
    kucoin:(
      <svg width={size*0.6} height={size*0.6} viewBox="0 0 24 24" fill={ex.fg}>
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>
      </svg>
    ),
    htx:    <span style={{fontSize:size*0.28,fontWeight:900,color:ex.fg}}>HTX</span>,
    kraken: <span style={{fontSize:size*0.28,fontWeight:900,color:ex.fg}}>KRK</span>,
    coinbase:(
      <svg width={size*0.6} height={size*0.6} viewBox="0 0 24 24" fill={ex.fg}>
        <circle cx="12" cy="12" r="9" fill="none" stroke={ex.fg} strokeWidth="2"/>
        <circle cx="12" cy="12" r="4"/>
      </svg>
    ),
    wazirx: <span style={{fontSize:size*0.28,fontWeight:900,color:ex.fg}}>WRX</span>,
    coindcx:<span style={{fontSize:size*0.28,fontWeight:900,color:ex.fg}}>DCX</span>,
    coinswitch:<span style={{fontSize:size*0.22,fontWeight:900,color:ex.fg}}>CSK</span>,
  };
  return (
    <div style={{width:size,height:size,borderRadius:size*0.22,background:ex.bg,
      display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
      boxShadow:ex.shadow||"none"}}>
      {logos[ex.id]||<span style={{fontSize:size*0.28,fontWeight:900,color:ex.fg}}>{ex.name.slice(0,3)}</span>}
    </div>
  );
};

const EXCHANGES = [
  {id:"binance",    name:"Binance",     bg:"#F0B90B",fg:"#000",shadow:"0 0 8px rgba(240,185,11,.3)"},
  {id:"bybit",      name:"Bybit",       bg:"#1C1C2E",fg:"#F7A600",shadow:"0 0 8px rgba(247,166,0,.2)"},
  {id:"okx",        name:"OKX",         bg:"#000",   fg:"#fff",  shadow:"0 0 8px rgba(255,255,255,.1)"},
  {id:"mexc",       name:"MEXC",        bg:"#23C088",fg:"#fff"},
  {id:"gate",       name:"Gate.io",     bg:"#2354E6",fg:"#fff"},
  {id:"bitget",     name:"Bitget",      bg:"#00CDD1",fg:"#000"},
  {id:"kucoin",     name:"KuCoin",      bg:"#26A17B",fg:"#fff"},
  {id:"htx",        name:"HTX",         bg:"#1565C0",fg:"#fff"},
  {id:"kraken",     name:"Kraken",      bg:"#5741D9",fg:"#fff"},
  {id:"coinbase",   name:"Coinbase",    bg:"#1652F0",fg:"#fff"},
  {id:"wazirx",     name:"WazirX",      bg:"#1A3A5F",fg:"#F0B90B",inr:true},
  {id:"coindcx",    name:"CoinDCX",     bg:"#0033FF",fg:"#fff",  inr:true},
  {id:"coinswitch", name:"CoinSwitch",  bg:"#7C3AED",fg:"#fff",  inr:true},
];

const COINS = [
  "BTC","ETH","SOL","BNB","XRP","ADA","AVAX","DOGE","LINK","DOT",
  "APT","SUI","INJ","ARB","OP","NEAR","TON","UNI","PEPE","TRX",
  "MATIC","LTC","ATOM","FTM","HBAR","XLM","WIF","BONK","ORDI","RUNE",
  "AAVE","GRT","STX","IMX","CFX","THETA","GALA","SAND","MANA","ENJ",
];

const TFS=[
  {tf:"5m",label:"5 Min",interval:"5m"},
  {tf:"15m",label:"15 Min",interval:"15m"},
  {tf:"1h",label:"1 Hour",interval:"1h"},
  {tf:"4h",label:"4 Hour",interval:"4h"},
];

function calcRSI(cl){if(cl.length<15)return 50;let ag=0,al=0;for(let i=1;i<=14;i++){const d=cl[i]-cl[i-1];d>0?ag+=d:al+=Math.abs(d);}ag/=14;al/=14;for(let i=15;i<cl.length;i++){const d=cl[i]-cl[i-1];ag=(ag*13+(d>0?d:0))/14;al=(al*13+(d<0?Math.abs(d):0))/14;}return al===0?100:Math.round(100-100/(1+ag/al));}
function calcMA(cl,n){if(cl.length<n)return cl[cl.length-1]||0;return cl.slice(-n).reduce((a,b)=>a+b,0)/n;}
function calcBB(cl,n=20){const m=calcMA(cl,n);if(cl.length<n)return{u:m*1.02,l:m*0.98};const s=Math.sqrt(cl.slice(-n).reduce((v,c)=>v+Math.pow(c-m,2),0)/n);return{u:m+s*2,l:m-s*2};}

export default function TradePage(){
  const [coin,setCoin]=useState("APT");
  const [srch,setSrch]=useState("");
  const [showDD,setDD]=useState(false);
  const [exId,setExId]=useState("binance");
  const [dir,setDir]=useState("long");
  const [entryInp,setEntryInp]=useState(""); // in selected currency
  const [investInp,setInvestInp]=useState(""); // in selected currency
  const [dispCur,setDispCur]=useState("INR");

  const [active,setActive]=useState(false);
  const [liveP,setLiveP]=useState(null);
  const [prDir,setPrDir]=useState(null);
  const [t24,setT24]=useState(null);
  const [lastT,setLastT]=useState("");
  const [tfd,setTfd]=useState({});
  const [aiTxt,setAiTxt]=useState(null);
  const [aiLoad,setAiLoad]=useState(false);
  const [saved,setSaved]=useState([]);

  const wsRef=useRef(null);
  const prevP=useRef(null);
  const aiDone=useRef(false);
  const tfTimer=useRef(null);

  const ex=EXCHANGES.find(e=>e.id===exId)||EXCHANGES[0];
  const filtered=COINS.filter(c=>c.includes(srch.toUpperCase()));

  // Convert entry & invest to USD
  const entryUSD = dispCur==="INR" ? (+entryInp||0)/USD_INR : (+entryInp||0);
  const investUSD= dispCur==="INR" ? (+investInp||0)/USD_INR : (+investInp||0);
  const qty      = entryUSD>0 ? investUSD/entryUSD : 0;

  const fmtINR=(v)=>"₹"+Math.abs(v).toLocaleString("en-IN",{maximumFractionDigits:v>=100?2:4});
  const fmtUSD=(v)=>v>=1?"$"+v.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):"$"+v.toPrecision(5);
  const fmt=(usdP)=>{if(!usdP&&usdP!==0)return"—";return dispCur==="INR"?fmtINR(usdP*USD_INR):fmtUSD(usdP);};

  const calcPnl=useCallback((p)=>{
    if(!p||!entryUSD||qty===0)return null;
    const pUSD=dir==="long"?(p-entryUSD)*qty:(entryUSD-p)*qty;
    return{pUSD,pINR:pUSD*USD_INR,roe:investUSD>0?(pUSD/investUSD)*100:0};
  },[entryUSD,qty,investUSD,dir]);

  // localStorage
  useEffect(()=>{
    try{const s=localStorage.getItem("yyp_tm4");if(s)setSaved(JSON.parse(s));}catch(_){}
  },[]);
  const saveData=useCallback((d)=>{
    const p=JSON.parse(localStorage.getItem("yyp_tm4")||"[]");
    const u=[d,...p.filter(x=>x.coin!==d.coin)].slice(0,5);
    localStorage.setItem("yyp_tm4",JSON.stringify(u));setSaved(u);
  },[]);
  const delData=(c)=>{const u=saved.filter(p=>p.coin!==c);localStorage.setItem("yyp_tm4",JSON.stringify(u));setSaved(u);};

  // WebSocket
  const startWS=useCallback((sym)=>{
    if(wsRef.current){wsRef.current.onclose=null;wsRef.current.close();}
    const ws=new WebSocket(`wss://stream.binance.com:9443/ws/${sym.toLowerCase()}usdt@ticker`);
    ws.onmessage=(e)=>{
      const d=JSON.parse(e.data);const p=parseFloat(d.c);if(isNaN(p))return;
      if(prevP.current!==null)setPrDir(p>prevP.current?"up":p<prevP.current?"down":null);
      prevP.current=p;setLiveP(p);
      setT24({ch24:+d.P,high:+d.h,low:+d.l,vol:+d.q});
      setLastT(new Date().toLocaleTimeString("en-IN"));
    };
    ws.onerror=()=>{};
    ws.onclose=()=>{setTimeout(()=>startWS(sym),2000);};
    wsRef.current=ws;
  },[]);

  const fetchTF=useCallback(async(sym)=>{
    const res={};
    await Promise.allSettled(TFS.map(async({tf,interval})=>{
      try{const r=await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=${interval}&limit=60`,{signal:AbortSignal.timeout(8000)});
        if(r.ok){const j=await r.json();res[tf]=j.map(k=>parseFloat(k[4]));}}catch(_){}
    }));
    setTfd(res);return res;
  },[]);

  const startTracking=useCallback(async()=>{
    if(!entryInp||!investInp||!coin)return;
    setActive(true);setAiTxt(null);aiDone.current=false;prevP.current=null;setLiveP(null);setTfd({});
    saveData({coin,exId,dir,entry:entryInp,invest:investInp,cur:dispCur,ts:Date.now()});
    startWS(coin);
    const tf=await fetchTF(coin);
    if(tfTimer.current)clearInterval(tfTimer.current);
    tfTimer.current=setInterval(()=>fetchTF(coin),300000);
  },[coin,exId,dir,entryInp,investInp,dispCur,saveData,startWS,fetchTF]);

  useEffect(()=>{
    if(!active||!liveP||Object.keys(tfd).length===0||aiDone.current)return;
    aiDone.current=true;getAI(liveP,tfd);
  },[active,liveP,tfd]);

  useEffect(()=>{
    if(!active)return;
    const t=setInterval(()=>{if(liveP&&Object.keys(tfd).length>0)getAI(liveP,tfd);},180000);
    return()=>clearInterval(t);
  },[active,liveP]);

  useEffect(()=>()=>{
    if(wsRef.current){wsRef.current.onclose=null;wsRef.current.close();}
    if(tfTimer.current)clearInterval(tfTimer.current);
  },[]);

  const getAI=async(price,tf)=>{
    if(!price||!tf)return;
    setAiLoad(true);
    try{
      const p=calcPnl(price);
      const tfS=TFS.map(({tf:t,label})=>{
        const cl=tf[t]||[];if(cl.length===0)return`${label}: No data`;
        const r=calcRSI(cl);const m20=calcMA(cl,20);const b=calcBB(cl);
        const sup=cl.length>=20?Math.min(...cl.slice(-20)):price*0.95;
        const res=cl.length>=20?Math.max(...cl.slice(-20)):price*1.05;
        return`${label}: RSI=${r}, Trend=${price>m20?"UP":"DOWN"}, BB=${b.u>b.l?Math.round((price-b.l)/(b.u-b.l)*100):50}%, Sup=$${sup.toFixed(4)}, Res=$${res.toFixed(4)}`;
      }).join("\n");
      const eDisp=dispCur==="INR"?`₹${+entryInp}`:`$${+entryInp}`;
      const iDisp=dispCur==="INR"?`₹${+investInp}`:`$${+investInp}`;
      const prompt=`Crypto position analysis:
${coin}/USDT | Exchange: ${ex.name} | Direction: ${dir.toUpperCase()}
Entry: ${eDisp} | Current: ${fmt(price)}
Invested: ${iDisp} | Qty: ${qty.toFixed(4)} ${coin}
PNL: ₹${p?.pINR?.toFixed(0)||0} | ROE: ${p?.roe?.toFixed(2)||0}%

INDICATORS:
${tfS}

EXACT FORMAT (Hinglish):
📊 DECISION: [HOLD / PARTIAL SELL / SELL NOW / BUY MORE]
💡 REASON: [2 lines]
⏱️ 5 MIN: [action] — [exact time e.g. "3-5 min"] — [reason]
⏱️ 15 MIN: [action] — [e.g. "10-15 min"] — [reason]
⏱️ 1 HOUR: [action] — [e.g. "30-45 min"] — [reason]
⏱️ 4 HOUR: [action] — [e.g. "2-3 hr"] — [reason]
🎯 TP1: ${dispCur==="INR"?"₹":"$"}[price] — P&L: ${dispCur==="INR"?"₹":"$"}[amount]
🎯 TP2: ${dispCur==="INR"?"₹":"$"}[price] — P&L: ${dispCur==="INR"?"₹":"$"}[amount]
🛑 SL: ${dispCur==="INR"?"₹":"$"}[price]
💰 STRATEGY: [exit plan]`;
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"compare",systemPrompt:prompt})});
      const j=await r.json();setAiTxt(j.text||"");
    }catch(e){}
    setAiLoad(false);
  };

  const reset=()=>{
    if(wsRef.current){wsRef.current.onclose=null;wsRef.current.close();}
    if(tfTimer.current)clearInterval(tfTimer.current);
    setActive(false);setLiveP(null);setAiTxt(null);setTfd({});setT24(null);
    prevP.current=null;aiDone.current=false;
  };

  const livePnl=liveP?calcPnl(liveP):null;
  const green=livePnl&&livePnl.pUSD>=0;

  return(
    <main style={{fontFamily:"'Inter',sans-serif",background:"#111827",minHeight:"100vh",
      color:"#f1f5f9",overflowX:"hidden",paddingBottom:40}}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5)}50%{box-shadow:0 0 0 6px rgba(16,185,129,0)}}
        @keyframes tick{0%{transform:scale(1.06)}100%{transform:scale(1)}}
        .fadein{animation:fadein .3s ease}
        .mono{font-family:'JetBrains Mono',monospace}
        .pu{color:#10b981!important;animation:tick .3s ease}
        .pd{color:#ef4444!important;animation:tick .3s ease}
        ::-webkit-scrollbar{height:3px}::-webkit-scrollbar-thumb{background:#374151;border-radius:3px}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
      `}</style>

      {/* Header */}
      <div style={{background:"#0f172a",borderBottom:"1px solid #1f2937",padding:"14px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <Link href="/" style={{color:"#6ee7b7",fontSize:12,textDecoration:"none",fontWeight:600}}>← Home</Link>
          {active&&liveP&&(
            <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(16,185,129,.1)",
              border:"1px solid rgba(16,185,129,.3)",borderRadius:20,padding:"4px 12px"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"#10b981",animation:"pulse 1.5s infinite"}}/>
              <span style={{fontSize:9,color:"#6ee7b7",fontWeight:700}}>LIVE · {lastT}</span>
            </div>
          )}
        </div>
        <div style={{fontWeight:900,fontSize:20,color:"#fff",marginBottom:2}}>📈 Trade Manager</div>
        <div style={{fontSize:10,color:"#6b7280"}}>Position tracker · Real-time P&L · AI timeframe advice</div>
      </div>

      <div style={{padding:"12px"}}>
        <AD/>

        {/* Saved */}
        {!active&&saved.length>0&&(
          <div style={{background:"#1f2937",borderRadius:14,padding:"12px",marginBottom:10,border:"1px solid #374151"}}>
            <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:8,letterSpacing:.5}}>💾 SAVED POSITIONS</div>
            {saved.map((s,i)=>{
              const sEx=EXCHANGES.find(e=>e.id===s.exId)||EXCHANGES[0];
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 10px",
                  background:"#111827",borderRadius:10,marginBottom:5,cursor:"pointer",
                  border:"1px solid #374151"}}
                  onClick={()=>{
                    setCoin(s.coin);setExId(s.exId);setDir(s.dir);
                    setEntryInp(s.entry);setInvestInp(s.invest);setDispCur(s.cur||"INR");
                    setTimeout(startTracking,100);
                  }}>
                  <ExLogo ex={sEx} size={32}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:13}}>{s.coin} · {s.dir?.toUpperCase()}</div>
                    <div style={{fontSize:10,color:"#6b7280"}}>{sEx.name} · {s.cur==="INR"?"₹":"$"}{s.entry} entry</div>
                  </div>
                  <div style={{background:"#10b981",borderRadius:8,padding:"5px 12px",fontSize:11,color:"#fff",fontWeight:700}}>Open</div>
                  <div onClick={e=>{e.stopPropagation();delData(s.coin);}}
                    style={{padding:"5px 8px",fontSize:12,color:"#6b7280",cursor:"pointer"}}>✕</div>
                </div>
              );
            })}
          </div>
        )}

        {/* FORM */}
        {!active&&(
          <div className="fadein" style={{background:"#1f2937",borderRadius:16,padding:"18px",
            border:"1px solid #374151",marginBottom:12}}>

            {/* Exchange grid */}
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:10,letterSpacing:.5}}>
                EXCHANGE SELECT KARO
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {EXCHANGES.map(e=>(
                  <button key={e.id} onClick={()=>setExId(e.id)}
                    style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,
                      padding:"10px 4px",borderRadius:12,cursor:"pointer",
                      background:exId===e.id?"rgba(16,185,129,.1)":"#111827",
                      border:`2px solid ${exId===e.id?"#10b981":"#374151"}`,
                      fontFamily:"'Inter',sans-serif",transition:"all .15s"}}>
                    <ExLogo ex={e} size={36}/>
                    <span style={{fontSize:9,fontWeight:700,textAlign:"center",lineHeight:1.2,
                      color:exId===e.id?"#10b981":"#6b7280"}}>
                      {e.name}
                    </span>
                    {e.inr&&<span style={{fontSize:7,color:"#f59e0b",background:"rgba(245,158,11,.1)",
                      borderRadius:4,padding:"1px 4px"}}>INR</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Coin */}
            <div style={{marginBottom:14,position:"relative"}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6,letterSpacing:.5}}>COIN</div>
              <div onClick={()=>setDD(!showDD)}
                style={{background:"#111827",border:`2px solid ${showDD?"#10b981":"#374151"}`,
                  borderRadius:12,padding:"14px 16px",display:"flex",
                  justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
                <span style={{fontSize:20,fontWeight:900,fontFamily:"'JetBrains Mono',monospace"}}>{coin}</span>
                <span style={{fontSize:11,color:"#6b7280"}}>▼ Select</span>
              </div>
              {showDD&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:100,
                  background:"#1f2937",borderRadius:12,border:"2px solid #10b981",
                  boxShadow:"0 8px 32px rgba(0,0,0,.7)",overflow:"hidden"}}>
                  <input value={srch} onChange={e=>setSrch(e.target.value)}
                    placeholder="🔍 BTC, APT, SOL..." autoFocus
                    style={{width:"100%",padding:"12px 16px",background:"#111827",border:"none",
                      borderBottom:"1px solid #374151",fontSize:14,outline:"none",
                      color:"#f1f5f9",boxSizing:"border-box"}}/>
                  <div style={{maxHeight:180,overflowY:"auto"}}>
                    {filtered.map(c=>(
                      <div key={c} onClick={()=>{setCoin(c);setDD(false);setSrch("");}}
                        style={{padding:"12px 16px",cursor:"pointer",fontWeight:c===coin?700:400,
                          background:c===coin?"rgba(16,185,129,.1)":"transparent",
                          fontSize:14,fontFamily:"'JetBrains Mono',monospace",
                          color:c===coin?"#10b981":"#d1d5db",
                          borderBottom:"1px solid #1f2937"}}>
                        {c}<span style={{fontSize:11,color:"#6b7280"}}>/USDT</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Direction */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6,letterSpacing:.5}}>DIRECTION</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[{v:"long",l:"📈 Long (Buy)",c:"#10b981"},{v:"short",l:"📉 Short (Sell)",c:"#ef4444"}].map(b=>(
                  <button key={b.v} onClick={()=>setDir(b.v)}
                    style={{padding:"14px",borderRadius:12,cursor:"pointer",fontWeight:800,fontSize:14,
                      fontFamily:"'Inter',sans-serif",transition:"all .15s",
                      border:`2px solid ${dir===b.v?b.c:"#374151"}`,
                      background:dir===b.v?`rgba(${b.v==="long"?"16,185,129":"239,68,68"},.12)`:"#111827",
                      color:dir===b.v?b.c:"#6b7280"}}>
                    {b.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6,letterSpacing:.5}}>CURRENCY</div>
              <div style={{display:"flex",gap:8}}>
                {["INR","USD"].map(c=>(
                  <button key={c} onClick={()=>setDispCur(c)}
                    style={{flex:1,padding:"12px",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:14,
                      fontFamily:"'Inter',sans-serif",
                      background:dispCur===c?"#10b981":"#111827",
                      color:dispCur===c?"#fff":"#6b7280",
                      border:`2px solid ${dispCur===c?"#10b981":"#374151"}`}}>
                    {c==="INR"?"₹ INR":"$ USD"}
                  </button>
                ))}
              </div>
            </div>

            {/* Entry Price */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6,letterSpacing:.5}}>
                ENTRY PRICE — Jis price pe kharida ({dispCur})
              </div>
              <div style={{background:"#111827",border:"2px solid #374151",borderRadius:12,
                padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:16,color:"#6b7280",fontWeight:700}}>{dispCur==="INR"?"₹":"$"}</span>
                <input value={entryInp} onChange={e=>setEntryInp(e.target.value)}
                  placeholder={dispCur==="INR"?"100":"1.20"} type="number"
                  style={{background:"transparent",border:"none",outline:"none",fontSize:22,
                    fontWeight:900,color:"#f1f5f9",fontFamily:"'JetBrains Mono',monospace",
                    flex:1,minWidth:0,width:"100%"}}/>
                <span style={{fontSize:12,color:"#6b7280",flexShrink:0}}>{dispCur}</span>
              </div>
            </div>

            {/* Invest Amount */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6,letterSpacing:.5}}>
                INVEST KIYA ({dispCur}) — Total lagaya hua paisa
              </div>
              <div style={{background:"#111827",border:"2px solid #374151",borderRadius:12,
                padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:16,color:"#6b7280",fontWeight:700}}>{dispCur==="INR"?"₹":"$"}</span>
                  <input value={investInp} onChange={e=>setInvestInp(e.target.value)}
                    placeholder={dispCur==="INR"?"1000":"12"} type="number"
                    style={{background:"transparent",border:"none",outline:"none",fontSize:22,
                      fontWeight:900,color:"#f1f5f9",fontFamily:"'JetBrains Mono',monospace",
                      flex:1,minWidth:0,width:"100%"}}/>
                  <span style={{fontSize:12,color:"#6b7280",flexShrink:0}}>{dispCur}</span>
                </div>
                {/* Live qty preview */}
                {entryInp&&investInp&&qty>0&&(
                  <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #374151",
                    display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,color:"#6b7280"}}>Quantity</span>
                    <span style={{fontSize:16,fontWeight:900,color:"#10b981",fontFamily:"'JetBrains Mono',monospace"}}>
                      {qty.toFixed(4)} {coin}
                    </span>
                  </div>
                )}
              </div>
              <div style={{fontSize:10,color:"#6b7280",marginTop:5}}>
                💡 Formula: {dispCur==="INR"?"₹":"$"}{investInp||"1000"} ÷ {dispCur==="INR"?"₹":"$"}{entryInp||"100"} = {qty>0?qty.toFixed(4):"?"} {coin}
              </div>
            </div>

            <button onClick={startTracking} disabled={!entryInp||!investInp||!coin}
              style={{width:"100%",padding:"16px",borderRadius:12,fontWeight:900,fontSize:16,
                cursor:"pointer",fontFamily:"'Inter',sans-serif",border:"none",color:"#fff",
                background:(!entryInp||!investInp)?"#374151":"linear-gradient(135deg,#10b981,#059669)",
                boxShadow:(!entryInp||!investInp)?"none":"0 4px 20px rgba(16,185,129,.4)"}}>
              🚀 Track Position
            </button>
          </div>
        )}

        {/* LOADING */}
        {active&&!liveP&&(
          <div className="fadein" style={{background:"#1f2937",borderRadius:16,padding:"40px 20px",
            textAlign:"center",border:"1px solid #374151"}}>
            <div style={{marginBottom:14,display:"flex",justifyContent:"center"}}>
              <ExLogo ex={ex} size={52}/>
            </div>
            <div style={{fontWeight:700,fontSize:16,marginBottom:6}}>{coin}/USDT</div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:16}}>Price fetch ho rahi hai...</div>
            <div style={{display:"flex",justifyContent:"center",gap:10}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{width:10,height:10,borderRadius:"50%",background:"#10b981",
                  animation:`blink 1.2s ${i*.3}s infinite`}}/>
              ))}
            </div>
          </div>
        )}

        {/* LIVE DASHBOARD */}
        {active&&liveP&&livePnl&&(
          <div className="fadein">

            {/* Main Card */}
            <div style={{background:"#0f172a",borderRadius:16,overflow:"hidden",
              border:"1px solid #1f2937",marginBottom:12}}>

              {/* Top bar */}
              <div style={{background:"#1f2937",padding:"10px 14px",display:"flex",
                alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #374151"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <ExLogo ex={ex} size={28}/>
                  <div>
                    <div style={{fontWeight:900,fontSize:15}}>{coin}/USDT</div>
                    <div style={{fontSize:9,color:"#6b7280"}}>{ex.name}</div>
                  </div>
                  <div style={{
                    background:dir==="long"?"rgba(16,185,129,.2)":"rgba(239,68,68,.2)",
                    border:`1px solid ${dir==="long"?"#10b981":"#ef4444"}`,
                    color:dir==="long"?"#10b981":"#ef4444",
                    borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:800}}>
                    {dir==="long"?"Long ▲":"Short ▼"}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:"#10b981",animation:"pulse 1.5s infinite"}}/>
                  <span style={{fontSize:9,color:"#6ee7b7",fontWeight:700}}>{lastT}</span>
                </div>
              </div>

              {/* Current Price */}
              <div style={{padding:"16px",borderBottom:"1px solid #1f2937",
                display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:10,color:"#6b7280",marginBottom:4}}>Current Price (LTP)</div>
                  <div className={`mono ${prDir==="up"?"pu":prDir==="down"?"pd":""}`}
                    style={{fontSize:28,fontWeight:900,
                      color:liveP>=entryUSD?"#10b981":"#ef4444"}}>
                    {fmt(liveP)}
                  </div>
                  {t24&&<div style={{fontSize:11,color:t24.ch24>=0?"#10b981":"#ef4444",fontWeight:700,marginTop:3}}>
                    {t24.ch24>=0?"▲":"▼"}{Math.abs(t24.ch24).toFixed(2)}% 24h
                  </div>}
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:"#6b7280",marginBottom:4}}>Entry Price</div>
                  <div className="mono" style={{fontSize:16,fontWeight:700,color:"#94a3b8"}}>
                    {dispCur==="INR"?`₹${+entryInp}`:`$${entryInp}`}
                  </div>
                </div>
              </div>

              {/* P&L */}
              <div style={{padding:"16px",borderBottom:"1px solid #1f2937",
                background:`linear-gradient(135deg,rgba(${green?"16,185,129":"239,68,68"},.05),transparent)`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:11,color:"#6b7280",fontWeight:600}}>Active P&L</span>
                  <span style={{fontSize:11,color:"#6b7280",fontWeight:600}}>ROE %</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div className="mono" style={{fontSize:32,fontWeight:900,lineHeight:1,
                    color:green?"#10b981":"#ef4444"}}>
                    {green?"+":"-"}₹{Math.abs(livePnl.pINR).toLocaleString("en-IN",{maximumFractionDigits:0})}
                  </div>
                  <div className="mono" style={{fontSize:24,fontWeight:900,
                    color:green?"#10b981":"#ef4444"}}>
                    {green?"+":""}{livePnl.roe.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Qty + Invest + Value */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",
                borderBottom:"1px solid #1f2937"}}>
                {[
                  {l:`Qty (${coin})`, v:qty.toFixed(4)},
                  {l:"Invested", v:dispCur==="INR"?`₹${(+investInp).toLocaleString()}`:`$${investInp}`},
                  {l:"Current Value", v:fmt(liveP*qty)},
                ].map((s,i)=>(
                  <div key={i} style={{padding:"10px 10px",
                    borderRight:i<2?"1px solid #1f2937":"none"}}>
                    <div style={{fontSize:9,color:"#6b7280",marginBottom:3}}>{s.l}</div>
                    <div className="mono" style={{fontSize:11,fontWeight:700}}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* 24h stats */}
              {t24&&t24.high>0&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
                  {[
                    {l:"24h High",v:fmt(t24.high),c:"#10b981"},
                    {l:"24h Low",v:fmt(t24.low),c:"#ef4444"},
                    {l:"Volume",v:`$${(t24.vol/1e6).toFixed(0)}M`,c:"#fbbf24"},
                  ].map((s,i)=>(
                    <div key={i} style={{padding:"8px 10px",textAlign:"center",
                      borderRight:i<2?"1px solid #1f2937":"none",background:"rgba(255,255,255,.02)"}}>
                      <div style={{fontSize:8,color:"#6b7280",marginBottom:2}}>{s.l}</div>
                      <div className="mono" style={{fontSize:10,fontWeight:700,color:s.c}}>{s.v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AD/>

            {/* Timeframe */}
            <div style={{background:"#1f2937",borderRadius:16,padding:"16px",
              border:"1px solid #374151",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:4,
                display:"flex",alignItems:"center",gap:8}}>
                ⏱️ Kab Tak Hold Karo?
              </div>
              <div style={{fontSize:10,color:"#6b7280",marginBottom:14}}>
                RSI · Bollinger Bands · ATR · Support/Resistance — background analysis
              </div>
              {TFS.map(({tf,label})=>{
                const cl=tfd[tf]||[];
                const r=calcRSI(cl);const m20=calcMA(cl,20);const m50=calcMA(cl,50);
                const b=calcBB(cl);const curr=cl[cl.length-1]||liveP;
                const bPct=b.u>b.l?(curr-b.l)/(b.u-b.l)*100:50;
                const sup=cl.length>=20?Math.min(...cl.slice(-20)):liveP*0.95;
                const res=cl.length>=20?Math.max(...cl.slice(-20)):liveP*1.05;
                const nRes=(res-curr)/curr*100;const nSup=(curr-sup)/curr*100;
                let sc=0;
                if(dir==="long"){
                  if(r<35)sc+=3;else if(r<45)sc+=2;else if(r<55)sc+=1;else if(r>70)sc-=3;else if(r>62)sc-=2;
                  if(curr>m20)sc+=1;if(curr>m50)sc+=1;
                  if(bPct<25)sc+=2;else if(bPct>80)sc-=2;
                  if(nRes<1.5)sc-=1;if(nSup<1.5)sc+=1;
                }else{
                  if(r>65)sc+=3;else if(r>55)sc+=2;else if(r>45)sc+=1;else if(r<30)sc-=3;else if(r<38)sc-=2;
                  if(curr<m20)sc+=1;if(curr<m50)sc+=1;
                  if(bPct>75)sc+=2;else if(bPct<20)sc-=2;
                  if(nSup<1.5)sc-=1;if(nRes<1.5)sc+=1;
                }
                const roe=livePnl?.roe||0;
                let dec,dc,db,holdT;
                if(sc>=4){dec="🔥 STRONG HOLD";dc="#059669";db="rgba(5,150,105,.12)";holdT=`${label} full hold`;}
                else if(sc>=2){dec="✅ HOLD";dc="#10b981";db="rgba(16,185,129,.08)";holdT=`Hold karo: ${label}`;}
                else if(sc>=0&&roe>8){dec="🎯 PARTIAL SELL";dc="#f59e0b";db="rgba(245,158,11,.08)";holdT="50% profit book karo";}
                else if(sc<=-3||(r>72&&dir==="long")||(r<28&&dir==="short")){dec="🚨 EXIT NOW";dc="#ef4444";db="rgba(239,68,68,.12)";holdT="Abhi exit karo";}
                else if(sc<0){dec="⚠️ WATCH";dc="#f59e0b";db="rgba(245,158,11,.08)";holdT="Thoda wait karo";}
                else{dec="⏸️ WAIT";dc="#8b5cf6";db="rgba(139,92,246,.08)";holdT="Signal confirm hone do";}
                const str=Math.min(5,Math.max(1,Math.abs(sc)+1));
                return(
                  <div key={tf} style={{display:"flex",alignItems:"center",gap:10,
                    padding:"12px 14px",background:db,borderRadius:12,marginBottom:7,
                    border:`1px solid ${dc}22`,borderLeft:`4px solid ${dc}`}}>
                    <div style={{width:52,flexShrink:0,textAlign:"center",
                      background:"#0f172a",borderRadius:10,padding:"8px 4px"}}>
                      <div style={{fontSize:14,fontWeight:900,lineHeight:1}}>{label.split(" ")[0]}</div>
                      <div style={{fontSize:8,color:"#6b7280",marginTop:1}}>{label.split(" ")[1]||""}</div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"inline-block",background:"rgba(0,0,0,.3)",
                        border:`1.5px solid ${dc}`,borderRadius:20,
                        padding:"5px 12px",fontSize:12,fontWeight:800,color:dc,marginBottom:5}}>
                        {dec}
                      </div>
                      <div style={{fontSize:12,color:"#d1d5db",fontWeight:600}}>{holdT}</div>
                    </div>
                    <div style={{display:"flex",gap:2,flexShrink:0}}>
                      {[1,2,3,4,5].map(n=>(
                        <div key={n} style={{width:4,height:20,borderRadius:3,
                          background:n<=str?sc>=0?"#10b981":"#ef4444":"#374151"}}/>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI */}
            <div style={{background:"#1f2937",borderRadius:16,padding:"16px",
              border:"1px solid #374151",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:8}}>
                  🤖 AI Full Analysis
                </div>
                <button onClick={()=>{aiDone.current=false;getAI(liveP,tfd);}}
                  style={{background:"transparent",border:"1px solid #374151",borderRadius:20,
                    padding:"5px 14px",fontSize:11,color:"#10b981",fontWeight:700,
                    cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>🔄 Refresh</button>
              </div>
              {aiLoad?(
                <div style={{textAlign:"center",padding:"20px 0"}}>
                  <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:10}}>
                    {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",
                      background:"#10b981",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
                  </div>
                  <div style={{fontSize:12,color:"#6b7280"}}>4 timeframes analyze ho rahe hain...</div>
                </div>
              ):aiTxt?(
                <div className="fadein">
                  {aiTxt.split("\n").filter(Boolean).map((line,i)=>{
                    const h=line.startsWith("📊");const tf=line.startsWith("⏱️");
                    const tp=line.startsWith("🎯")||line.startsWith("🛑")||line.startsWith("💰");
                    const w=line.startsWith("⚠️");
                    return(<div key={i} style={{
                      background:h?"rgba(16,185,129,.1)":tf?"rgba(255,255,255,.03)":tp?"rgba(99,102,241,.08)":w?"rgba(239,68,68,.08)":"transparent",
                      border:h?"1px solid rgba(16,185,129,.3)":tf?"1px solid #374151":tp?"1px solid rgba(99,102,241,.2)":w?"1px solid rgba(239,68,68,.2)":"none",
                      borderLeft:h?"4px solid #10b981":tf?"3px solid #6366f1":"none",
                      borderRadius:h||tf||tp||w?10:0,padding:h||tf||tp||w?"10px 12px":"2px 4px",
                      marginBottom:h||tf||tp?7:3,fontSize:h?14:12,fontWeight:h?800:tf?600:400,
                      color:h?"#6ee7b7":w?"#fca5a5":"#d1d5db",lineHeight:1.75,
                    }}>{line}</div>);
                  })}
                  <div style={{fontSize:9,color:"#10b981",marginTop:10,textAlign:"right",fontWeight:600}}>
                    💾 Auto-saved · 🔄 Har 3 min update
                  </div>
                </div>
              ):(
                <div style={{textAlign:"center",padding:"20px",color:"#6b7280",fontSize:12}}>
                  Price load hone ke baad AI aayega...
                </div>
              )}
            </div>

            <AD/>

            <button onClick={reset}
              style={{width:"100%",background:"#1f2937",border:"1px solid #374151",
                borderRadius:12,padding:"14px",fontWeight:700,fontSize:14,cursor:"pointer",
                color:"#9ca3af",fontFamily:"'Inter',sans-serif",marginBottom:12}}>
              ← Nayi Position Enter Karo
            </button>
          </div>
        )}

        <AD/>
        <div style={{textAlign:"center",fontSize:10,color:"#4b5563",padding:"10px"}}>
          ⚠️ Not financial advice · DYOR always<br/>
          <Link href="/" style={{color:"#10b981",textDecoration:"none"}}>← YES YOU PRO</Link>
        </div>
      </div>
    </main>
  );
}
