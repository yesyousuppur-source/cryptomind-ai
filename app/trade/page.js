"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const USD_INR = 83.5;

const AD = () => (
  <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",
    border:"1px solid #1f2937",padding:"4px",margin:"10px 0"}}>
    <div style={{fontSize:9,color:"#4b5563",marginBottom:2,letterSpacing:1}}>ADVERTISEMENT</div>
    <ins className="adsbygoogle" style={{display:"block"}}
      data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO"
      data-ad-format="auto" data-full-width-responsive="true"/>
    <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
  </div>
);

const COINS = ["BTC","ETH","SOL","BNB","XRP","ADA","AVAX","DOGE","LINK","DOT",
  "APT","SUI","INJ","ARB","OP","NEAR","TON","UNI","PEPE","TRX",
  "MATIC","LTC","ATOM","FTM","HBAR","XLM","FIL","VET","SAND","GALA",
  "AAVE","GRT","STX","IMX","WIF","BONK","ORDI","CFX","RUNE","THETA"];

const EXCHANGES = [
  {id:"binance", name:"Binance",  flag:"🟡", cur:"USDT",
   fetch:async(s)=>{ const r=await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${s}USDT`,{signal:AbortSignal.timeout(5000)}); const j=await r.json(); return{price:+j.lastPrice,ch24:+j.priceChangePercent,high:+j.highPrice,low:+j.lowPrice,vol:+j.quoteVolume}; }},
  {id:"bybit",   name:"Bybit",   flag:"🟠", cur:"USDT",
   fetch:async(s)=>{ const r=await fetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${s}USDT`,{signal:AbortSignal.timeout(5000)}); const j=await r.json(); const t=j.result?.list?.[0]; return{price:+t.lastPrice,ch24:+t.price24hPcnt*100,high:+t.highPrice24h,low:+t.lowPrice24h,vol:+t.turnover24h}; }},
  {id:"okx",     name:"OKX",     flag:"⚫", cur:"USDT",
   fetch:async(s)=>{ const r=await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${s}-USDT`,{signal:AbortSignal.timeout(5000)}); const j=await r.json(); const t=j.data?.[0]; return{price:+t.last,ch24:(+t.last-+t.open24h)/+t.open24h*100,high:+t.high24h,low:+t.low24h,vol:+t.volCcy24h}; }},
  {id:"mexc",    name:"MEXC",    flag:"🔵", cur:"USDT",
   fetch:async(s)=>{ const r=await fetch(`https://api.mexc.com/api/v3/ticker/24hr?symbol=${s}USDT`,{signal:AbortSignal.timeout(5000)}); const j=await r.json(); return{price:+j.lastPrice,ch24:+j.priceChangePercent,high:+j.highPrice,low:+j.lowPrice,vol:+j.quoteVolume}; }},
  {id:"gate",    name:"Gate.io", flag:"🟢", cur:"USDT",
   fetch:async(s)=>{ const r=await fetch(`https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${s}_USDT`,{signal:AbortSignal.timeout(5000)}); const j=await r.json(); const t=j[0]; return{price:+t.last,ch24:+t.change_percentage,high:+t.high_24h,low:+t.low_24h,vol:+t.quote_volume}; }},
  {id:"wazirx",  name:"WazirX",  flag:"🇮🇳", cur:"INR",
   fetch:async(s)=>{ const r=await fetch(`https://api.wazirx.com/sapi/v1/ticker/24hr?symbol=${s.toLowerCase()}inr`,{signal:AbortSignal.timeout(5000)}); const j=await r.json(); return{price:+j.lastPrice,ch24:+j.priceChangePercent,high:+j.highPrice,low:+j.lowPrice,vol:+j.quoteVolume}; }},
  {id:"coindcx", name:"CoinDCX", flag:"🇮🇳", cur:"INR",
   fetch:async(s)=>{ const r=await fetch(`https://api.coindcx.com/exchange/ticker`,{signal:AbortSignal.timeout(5000)}); const j=await r.json(); const t=j.find(x=>x.market===`${s}INR`); if(!t)throw new Error("Not found"); return{price:+t.last_price,ch24:+t.change_24_hour||0,high:+t.high,low:+t.low,vol:+t.volume}; }},
  {id:"bitget",  name:"Bitget",  flag:"🩵", cur:"USDT",
   fetch:async(s)=>{ const r=await fetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${s}USDT`,{signal:AbortSignal.timeout(5000)}); const j=await r.json(); const t=j.data?.[0]; return{price:+t.lastPr,ch24:+t.change24h*100,high:+t.high24h,low:+t.low24h,vol:+t.usdtVolume}; }},
  {id:"kucoin",  name:"KuCoin",  flag:"🟢", cur:"USDT",
   fetch:async(s)=>{ const r=await fetch(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${s}-USDT`,{signal:AbortSignal.timeout(5000)}); const j=await r.json(); return{price:+j.data.price,ch24:0,high:0,low:0,vol:0}; }},
];

const TFS = [
  {tf:"5m",  label:"5 Min",  interval:"5m"},
  {tf:"15m", label:"15 Min", interval:"15m"},
  {tf:"1h",  label:"1 Hour", interval:"1h"},
  {tf:"4h",  label:"4 Hour", interval:"4h"},
];

function calcRSI(cl){if(cl.length<15)return 50;let ag=0,al=0;for(let i=1;i<=14;i++){const d=cl[i]-cl[i-1];d>0?ag+=d:al+=Math.abs(d);}ag/=14;al/=14;for(let i=15;i<cl.length;i++){const d=cl[i]-cl[i-1];ag=(ag*13+(d>0?d:0))/14;al=(al*13+(d<0?Math.abs(d):0))/14;}return al===0?100:Math.round(100-100/(1+ag/al));}
function calcMA(cl,n){if(cl.length<n)return cl[cl.length-1]||0;return cl.slice(-n).reduce((a,b)=>a+b,0)/n;}
function calcBB(cl,n=20){const ma=calcMA(cl,n);if(cl.length<n)return{upper:ma*1.02,lower:ma*0.98,ma};const std=Math.sqrt(cl.slice(-n).reduce((s,v)=>s+Math.pow(v-ma,2),0)/n);return{upper:ma+std*2,lower:ma-std*2,ma};}

export default function TradePage(){
  const [coin,setCoin]       = useState("APT");
  const [search,setSearch]   = useState("");
  const [showDD,setShowDD]   = useState(false);
  const [exId,setExId]       = useState("binance");
  const [direction,setDir]   = useState("long"); // long | short
  const [margin,setMargin]   = useState("");     // capital invested
  const [leverage,setLev]    = useState(10);
  const [entryPrice,setEntry]= useState("");
  const [dispCur,setDispCur] = useState("INR"); // display currency

  const [active,setActive]   = useState(false);
  const [livePrice,setLP]    = useState(null);
  const [priceDir,setPD]     = useState(null);
  const [ticker24,setT24]    = useState(null);
  const [lastUpd,setLU]      = useState("");
  const [tfData,setTF]       = useState({});
  const [aiAdvice,setAI]     = useState(null);
  const [aiLoad,setAIL]      = useState(false);
  const [saved,setSaved]     = useState([]);
  const [fetchErr,setFetchErr]= useState("");

  const ivRef   = useRef(null);
  const prevRef = useRef(null);
  const aiDone  = useRef(false);

  const ex = EXCHANGES.find(e=>e.id===exId)||EXCHANGES[0];
  const isINR = ex.cur==="INR";
  const filtered = COINS.filter(c=>c.includes(search.toUpperCase()));

  // Convert between currencies
  const toINR = (usd) => usd*USD_INR;
  const toUSD = (inr) => inr/USD_INR;

  // Format price in display currency
  const fmtPrice = useCallback((usdOrInrPrice)=>{
    if(!usdOrInrPrice&&usdOrInrPrice!==0)return"—";
    const rawINR = isINR ? usdOrInrPrice : usdOrInrPrice*USD_INR;
    if(dispCur==="INR"){
      return"₹"+rawINR.toLocaleString("en-IN",{maximumFractionDigits:rawINR>=100?2:4});
    } else {
      const usd = isINR ? usdOrInrPrice/USD_INR : usdOrInrPrice;
      return usd>=1?"$"+usd.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):"$"+usd.toPrecision(5);
    }
  },[isINR,dispCur]);

  // Position calculations
  const entryNum  = parseFloat(entryPrice||0);
  const marginNum = parseFloat(margin||0);
  // Convert margin to exchange's base currency for math
  const marginBase = isINR ? toUSD(marginNum) : (dispCur==="INR"?toUSD(marginNum):marginNum);
  const entryBase  = isINR ? entryNum : (dispCur==="INR"?toUSD(entryNum):entryNum);
  const size       = marginBase * leverage;       // position size in USD
  const qty        = entryBase>0 ? size/entryBase : 0;
  const liqPrice   = entryBase>0 ? (direction==="long" ? entryBase*(1-0.9/leverage) : entryBase*(1+0.9/leverage)) : 0;

  // Live P&L
  const getLivePnl = (lp) => {
    if(!lp||!entryBase||qty===0) return null;
    const lpBase = isINR ? lp : lp; // exchange price is in correct base
    const pnlBase = direction==="long" ? (lpBase-entryBase)*qty : (entryBase-lpBase)*qty;
    const pnlINR  = pnlBase*USD_INR;
    const pnlUSD  = pnlBase;
    const roe     = (pnlBase/marginBase)*100;
    const sizeVal = lpBase*qty*USD_INR;
    return{pnlUSD,pnlINR,roe,sizeVal};
  };
  const pnlData = livePrice ? getLivePnl(livePrice) : null;
  const green   = pnlData && pnlData.pnlUSD>=0;

  // localStorage
  useEffect(()=>{
    try{
      const s=localStorage.getItem("yyp_trades2");
      if(s){const arr=JSON.parse(s);setSaved(arr);}
    }catch(_){}
  },[]);

  const savePos=(data)=>{
    const prev=JSON.parse(localStorage.getItem("yyp_trades2")||"[]");
    const updated=[data,...prev.filter(p=>p.coin!==data.coin)].slice(0,5);
    localStorage.setItem("yyp_trades2",JSON.stringify(updated));
    setSaved(updated);
  };

  const delPos=(c)=>{
    const updated=saved.filter(p=>p.coin!==c);
    localStorage.setItem("yyp_trades2",JSON.stringify(updated));
    setSaved(updated);
  };

  // Price fetch
  const fetchPrice = useCallback(async()=>{
    try{
      setFetchErr("");
      const data = await ex.fetch(coin);
      const p = data.price;
      if(prevRef.current!==null) setPD(p>prevRef.current?"up":p<prevRef.current?"down":null);
      prevRef.current=p;
      setLP(p);
      setT24({ch24:data.ch24||0,high:data.high||0,low:data.low||0,vol:data.vol||0});
      setLU(new Date().toLocaleTimeString("en-IN"));
    }catch(e){setFetchErr(e.message);}
  },[coin,ex]);

  // Klines fetch
  const fetchTF = useCallback(async()=>{
    const res={};
    await Promise.allSettled(TFS.map(async({tf,interval})=>{
      try{const r=await fetch(`https://api.binance.com/api/v3/klines?symbol=${coin}USDT&interval=${interval}&limit=60`);
        if(r.ok){const j=await r.json();res[tf]=j.map(k=>+k[4]);}}catch(_){}
    }));
    setTF(res);
  },[coin]);

  const startTracking = async()=>{
    if(!margin||!entryPrice) return;
    setActive(true); setAI(null); aiDone.current=false;
    setFetchErr("");
    const pos={coin,exId,direction,margin,leverage,entryPrice,dispCur,ts:Date.now()};
    savePos(pos);
    await Promise.all([fetchTF(), fetchPrice()]);
  };

  // Poll price every 3 sec
  useEffect(()=>{
    if(!active)return;
    if(ivRef.current)clearInterval(ivRef.current);
    ivRef.current=setInterval(fetchPrice,3000);
    return()=>clearInterval(ivRef.current);
  },[active,fetchPrice]);

  // AI
  useEffect(()=>{
    if(!active||!livePrice||Object.keys(tfData).length===0||aiDone.current)return;
    aiDone.current=true; getAI();
  },[active,livePrice,tfData]);

  useEffect(()=>{
    if(!active)return;
    const t=setInterval(()=>{if(livePrice&&Object.keys(tfData).length>0)getAI();},180000);
    return()=>clearInterval(t);
  },[active,livePrice]);

  const getAI = async()=>{
    if(!livePrice)return;
    setAIL(true);
    try{
      const pnl=getLivePnl(livePrice);
      const tfS=TFS.map(({tf,label})=>{
        const cl=tfData[tf]||[];
        const rsi=calcRSI(cl);
        const ma20=calcMA(cl,20);
        const bb=calcBB(cl);
        const atr=cl.length>14?cl.slice(-14).reduce((s,v,i,a)=>s+(i>0?Math.abs(v-a[i-1]):0),0)/13:livePrice*0.02;
        const sup=cl.length>=20?Math.min(...cl.slice(-20)):livePrice*0.95;
        const res=cl.length>=20?Math.max(...cl.slice(-20)):livePrice*1.05;
        return `${label}: RSI=${rsi}, MA20=${ma20.toFixed(4)}, BB_pos=${bb.upper>0?Math.round((livePrice-bb.lower)/(bb.upper-bb.lower)*100):50}%, ATR=${atr.toFixed(4)}, Support=${sup.toFixed(4)}, Resist=${res.toFixed(4)}`;
      }).join("\n");

      const prompt=`Expert crypto trader analyzing open ${direction.toUpperCase()} position:

Coin: ${coin}/USDT | Exchange: ${ex.name}
Entry: ${entryBase.toFixed(4)} | Current LTP: ${livePrice.toFixed(4)}
Direction: ${direction.toUpperCase()} | Leverage: ${leverage}x
Qty: ${qty.toFixed(4)} ${coin} | Margin: ₹${marginNum.toLocaleString()}
Size: ₹${(size*USD_INR).toLocaleString("en-IN",{maximumFractionDigits:0})}
Active PNL: ₹${pnl?.pnlINR?.toFixed(0)||0} | ROE: ${pnl?.roe?.toFixed(2)||0}%
Liq. Price: ${liqPrice.toFixed(4)}

INDICATOR DATA:
${tfS}

Respond EXACTLY (Hinglish):
📊 DECISION: [HOLD / PARTIAL EXIT / EXIT NOW / ADD MORE]
💡 REASON: [2 lines max]

⏱️ 5 MIN: [HOLD/EXIT/WATCH] — [specific time: e.g. "2-3 min hold"] — [1 line reason]
⏱️ 15 MIN: [HOLD/EXIT/WATCH] — [e.g. "10-15 min hold"] — [reason]
⏱️ 1 HOUR: [HOLD/EXIT/WATCH] — [e.g. "45 min hold"] — [reason]
⏱️ 4 HOUR: [HOLD/EXIT/WATCH] — [e.g. "2-3 hr hold"] — [reason]

🎯 TARGET 1: [price] — P&L: ₹[amount]
🎯 TARGET 2: [price] — P&L: ₹[amount]
🛑 STOP LOSS: [price] — Max loss: ₹[amount]
⚠️ RISK: [liq price risk if close]
💰 STRATEGY: [e.g. T1 pe 50% exit, rest hold]`;

      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"compare",systemPrompt:prompt})});
      const j=await r.json();
      setAI(j.text||"");
    }catch(_){}
    setAIL(false);
  };

  const reset=()=>{
    setActive(false);setLP(null);setAI(null);setTF({});setT24(null);
    prevRef.current=null;aiDone.current=false;
    if(ivRef.current)clearInterval(ivRef.current);
  };

  return(
    <main style={{fontFamily:"'Inter',sans-serif",background:"#111827",minHeight:"100vh",
      color:"#f1f5f9",overflowX:"hidden",paddingBottom:40}}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes pg{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5)}50%{box-shadow:0 0 0 8px rgba(16,185,129,0)}}
        @keyframes flash{0%{transform:scale(1.04)}100%{transform:scale(1)}}
        .fadein{animation:fadein .3s ease}
        .mono{font-family:'JetBrains Mono',monospace}
        .pu{color:#10b981!important;animation:flash .3s ease}
        .pd{color:#ef4444!important;animation:flash .3s ease}
        input::-webkit-inner-spin-button{-webkit-appearance:none}
        input[type=range]{-webkit-appearance:none;width:100%;height:6px;border-radius:3px;
          background:linear-gradient(90deg,#10b981 var(--v,20%),#374151 var(--v,20%));outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;
          border-radius:50%;background:#10b981;cursor:pointer;box-shadow:0 0 8px rgba(16,185,129,.6)}
      `}</style>

      {/* Header */}
      <div style={{background:"#0f172a",borderBottom:"1px solid #1f2937",padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <Link href="/" style={{color:"#6ee7b7",fontSize:12,textDecoration:"none",fontWeight:600}}>← Home</Link>
          {active&&livePrice&&(
            <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(16,185,129,.1)",
              border:"1px solid rgba(16,185,129,.3)",borderRadius:20,padding:"3px 10px"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"#10b981",animation:"pg 1.5s infinite"}}/>
              <span style={{fontSize:9,color:"#6ee7b7",fontWeight:700}}>LIVE · {lastUpd}</span>
            </div>
          )}
        </div>
        <div style={{fontWeight:900,fontSize:20,color:"white",letterSpacing:-.5}}>📈 Trade Manager</div>
        <div style={{fontSize:10,color:"#6b7280"}}>Exchange-style position tracker · AI advice</div>
      </div>

      <div style={{padding:"12px"}}>
        <AD/>

        {/* Saved */}
        {!active&&saved.length>0&&(
          <div style={{background:"#1f2937",borderRadius:14,padding:"12px",marginBottom:10,border:"1px solid #374151"}}>
            <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:8,letterSpacing:.5}}>
              💾 SAVED POSITIONS
            </div>
            {saved.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",
                background:"#111827",borderRadius:10,marginBottom:5,cursor:"pointer",
                border:"1px solid #374151"}}
                onClick={()=>{
                  setCoin(s.coin);setExId(s.exId);setDir(s.direction);
                  setMargin(s.margin);setLev(s.leverage);setEntry(s.entryPrice);
                  setDispCur(s.dispCur||"INR");startTracking();
                }}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:13,color:"#f1f5f9"}}>
                    {s.coin} · {s.direction?.toUpperCase()} {s.leverage}x
                  </div>
                  <div style={{fontSize:10,color:"#6b7280"}}>
                    {EXCHANGES.find(e=>e.id===s.exId)?.name} · Entry: {s.entryPrice}
                  </div>
                </div>
                <div style={{background:"#10b981",borderRadius:8,padding:"4px 10px",fontSize:10,color:"#fff",fontWeight:700}}>Open</div>
                <div onClick={e=>{e.stopPropagation();delPos(s.coin);}}
                  style={{background:"#1f2937",borderRadius:8,padding:"4px 8px",fontSize:10,color:"#9ca3af",fontWeight:700,border:"1px solid #374151"}}>✕</div>
              </div>
            ))}
          </div>
        )}

        {/* FORM */}
        {!active&&(
          <div className="fadein" style={{background:"#1f2937",borderRadius:16,padding:"16px",
            border:"1px solid #374151",marginBottom:12}}>

            {/* Exchange Select */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6,letterSpacing:.5}}>EXCHANGE</div>
              <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
                {EXCHANGES.map(e=>(
                  <div key={e.id} onClick={()=>setExId(e.id)}
                    style={{flexShrink:0,background:exId===e.id?"#10b981":"#111827",
                      border:`1px solid ${exId===e.id?"#10b981":"#374151"}`,
                      borderRadius:10,padding:"7px 10px",cursor:"pointer",textAlign:"center",minWidth:62}}>
                    <div style={{fontSize:14,marginBottom:2}}>{e.flag}</div>
                    <div style={{fontSize:9,fontWeight:700,color:exId===e.id?"#fff":"#9ca3af"}}>{e.name}</div>
                    <div style={{fontSize:8,color:exId===e.id?"rgba(255,255,255,.6)":"#4b5563"}}>{e.cur}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coin */}
            <div style={{marginBottom:12,position:"relative"}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6,letterSpacing:.5}}>COIN</div>
              <div onClick={()=>setShowDD(!showDD)}
                style={{background:"#111827",border:"1px solid #374151",borderRadius:10,
                  padding:"12px 14px",display:"flex",justifyContent:"space-between",
                  alignItems:"center",cursor:"pointer"}}>
                <span style={{fontSize:18,fontWeight:900,fontFamily:"'JetBrains Mono',monospace"}}>{coin}/USDT</span>
                <span style={{fontSize:11,color:"#6b7280"}}>▼</span>
              </div>
              {showDD&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1f2937",
                  borderRadius:10,border:"1px solid #10b981",boxShadow:"0 8px 30px rgba(0,0,0,.4)",
                  zIndex:100,overflow:"hidden"}}>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="Search..." autoFocus
                    style={{width:"100%",padding:"10px 14px",background:"#111827",border:"none",
                      borderBottom:"1px solid #374151",fontSize:13,outline:"none",
                      color:"#f1f5f9",fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}/>
                  <div style={{maxHeight:160,overflowY:"auto"}}>
                    {filtered.map(c=>(
                      <div key={c} onClick={()=>{setCoin(c);setShowDD(false);setSearch("");}}
                        style={{padding:"10px 14px",cursor:"pointer",
                          background:c===coin?"rgba(16,185,129,.1)":"transparent",
                          fontSize:13,fontFamily:"'JetBrains Mono',monospace",
                          color:c===coin?"#10b981":"#d1d5db",
                          borderBottom:"1px solid #374151"}}>
                        {c}/USDT
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Long / Short */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6,letterSpacing:.5}}>DIRECTION</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <button onClick={()=>setDir("long")}
                  style={{padding:"12px",borderRadius:10,border:`2px solid ${direction==="long"?"#10b981":"#374151"}`,
                    background:direction==="long"?"rgba(16,185,129,.15)":"#111827",
                    color:direction==="long"?"#10b981":"#6b7280",
                    fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                  📈 Long
                </button>
                <button onClick={()=>setDir("short")}
                  style={{padding:"12px",borderRadius:10,border:`2px solid ${direction==="short"?"#ef4444":"#374151"}`,
                    background:direction==="short"?"rgba(239,68,68,.15)":"#111827",
                    color:direction==="short"?"#ef4444":"#6b7280",
                    fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                  📉 Short
                </button>
              </div>
            </div>

            {/* Display Currency */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6,letterSpacing:.5}}>DISPLAY IN</div>
              <div style={{display:"flex",gap:8}}>
                {["INR","USD"].map(c=>(
                  <button key={c} onClick={()=>setDispCur(c)}
                    style={{flex:1,padding:"9px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,
                      fontFamily:"'Inter',sans-serif",
                      background:dispCur===c?"#10b981":"#111827",
                      color:dispCur===c?"#fff":"#6b7280",
                      border:`1px solid ${dispCur===c?"#10b981":"#374151"}`}}>
                    {c==="INR"?"₹ INR":"$ USD"}
                  </button>
                ))}
              </div>
            </div>

            {/* Entry Price */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6,letterSpacing:.5}}>
                AVG. ENTRY ({ex.cur})
              </div>
              <div style={{background:"#111827",border:"1px solid #374151",borderRadius:10,
                padding:"12px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <input value={entryPrice} onChange={e=>setEntry(e.target.value)}
                  placeholder="e.g. 1.0423" type="number"
                  style={{background:"transparent",border:"none",outline:"none",fontSize:18,
                    fontWeight:700,color:"#f1f5f9",fontFamily:"'JetBrains Mono',monospace",
                    flex:1,minWidth:0}}/>
                <span style={{fontSize:12,color:"#6b7280",fontWeight:600,flexShrink:0}}>{ex.cur}</span>
              </div>
            </div>

            {/* Margin (Size) */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6,letterSpacing:.5}}>
                MARGIN ({dispCur==="INR"?"₹":"$"})
              </div>
              <div style={{background:"#111827",border:"1px solid #374151",borderRadius:10,
                padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <input value={margin} onChange={e=>setMargin(e.target.value)}
                    placeholder={dispCur==="INR"?"e.g. 6530":"e.g. 78"} type="number"
                    style={{background:"transparent",border:"none",outline:"none",fontSize:18,
                      fontWeight:700,color:"#f1f5f9",fontFamily:"'JetBrains Mono',monospace",
                      flex:1,minWidth:0}}/>
                  <span style={{fontSize:12,color:"#6b7280",fontWeight:600}}>{dispCur}</span>
                </div>
                {margin&&entryPrice&&(
                  <div style={{fontSize:11,color:"#10b981",fontWeight:600}}>
                    ≈ {qty.toFixed(4)} {coin} · Size: {dispCur==="INR"?`₹${(size*USD_INR).toLocaleString("en-IN",{maximumFractionDigits:0})}`:`$${size.toFixed(2)}`}
                  </div>
                )}
              </div>
            </div>

            {/* Leverage */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,letterSpacing:.5}}>LEVERAGE</div>
                <div style={{background:leverage>10?"#ef4444":leverage>1?"#f59e0b":"#10b981",
                  borderRadius:20,padding:"3px 12px",fontSize:14,fontWeight:900,color:"#fff",
                  fontFamily:"'JetBrains Mono',monospace"}}>{leverage}x</div>
              </div>
              <input type="range" min="1" max="100" value={leverage}
                onChange={e=>{const v=+e.target.value;setLev(v);e.target.style.setProperty("--v",`${(v-1)/99*100}%`);}}
                style={{"--v":`${(leverage-1)/99*100}%`}}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:9,color:"#6b7280",fontWeight:600}}>
                <span>1x</span><span style={{color:"#f59e0b"}}>10x</span>
                <span style={{color:"#ef4444"}}>50x</span><span style={{color:"#dc2626"}}>100x</span>
              </div>
            </div>

            {/* Est. details */}
            {margin&&entryPrice&&(
              <div style={{background:"#111827",borderRadius:10,padding:"12px",marginBottom:14,
                border:"1px solid #374151"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {l:"Available",v:dispCur==="INR"?`₹${parseFloat(margin).toLocaleString()}`:`$${margin}`},
                    {l:"Margin",v:dispCur==="INR"?`₹${parseFloat(margin).toLocaleString()}`:`$${margin}`},
                    {l:"Position Size",v:dispCur==="INR"?`₹${(size*USD_INR).toLocaleString("en-IN",{maximumFractionDigits:0})}`:`$${size.toFixed(2)}`},
                    {l:"Est. Liq. Price",v:`${liqPrice.toFixed(4)} ${ex.cur}`,c:"#ef4444"},
                  ].map((s,i)=>(
                    <div key={i}>
                      <div style={{fontSize:9,color:"#6b7280",marginBottom:2}}>{s.l}</div>
                      <div style={{fontSize:12,fontWeight:700,color:s.c||"#f1f5f9",fontFamily:"'JetBrains Mono',monospace"}}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={startTracking}
              disabled={!margin||!entryPrice}
              style={{width:"100%",background:(!margin||!entryPrice)?"#374151":"linear-gradient(135deg,#10b981,#059669)",
                color:"#fff",border:"none",borderRadius:12,padding:"14px",
                fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"'Inter',sans-serif",
                boxShadow:(!margin||!entryPrice)?"none":"0 4px 16px rgba(16,185,129,.4)"}}>
              🚀 Track Position
            </button>
          </div>
        )}

        {/* LOADING */}
        {active&&!livePrice&&(
          <div className="fadein" style={{background:"#1f2937",borderRadius:16,padding:"32px",
            textAlign:"center",border:"1px solid #374151"}}>
            <div style={{fontSize:36,marginBottom:12}}>📡</div>
            <div style={{fontWeight:700,fontSize:14,color:"#f1f5f9",marginBottom:4}}>{ex.name} se price fetch ho rahi hai...</div>
            <div style={{fontSize:11,color:"#6b7280",marginBottom:14}}>{coin}/USDT</div>
            <div style={{display:"flex",justifyContent:"center",gap:8}}>
              {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",
                background:"#10b981",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
            </div>
            {fetchErr&&<div style={{color:"#ef4444",fontSize:11,marginTop:10}}>⚠️ {fetchErr}</div>}
          </div>
        )}

        {/* ACTIVE POSITION */}
        {active&&livePrice&&pnlData&&(
          <div className="fadein">

            {/* Exchange-style Position Card */}
            <div style={{background:"#0f172a",borderRadius:16,overflow:"hidden",
              border:"1px solid #1f2937",marginBottom:12}}>

              {/* Title bar */}
              <div style={{background:"#1f2937",padding:"10px 14px",display:"flex",
                alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #374151"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontWeight:900,fontSize:15,color:"#f1f5f9"}}>{coin} • USDT</span>
                  <span style={{background:direction==="long"?"rgba(16,185,129,.2)":"rgba(239,68,68,.2)",
                    border:`1px solid ${direction==="long"?"#10b981":"#ef4444"}`,
                    color:direction==="long"?"#10b981":"#ef4444",
                    borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:800}}>
                    {direction==="long"?"Long":"Short"} {leverage}x
                  </span>
                  <span style={{background:"#1f2937",border:"1px solid #374151",
                    color:"#9ca3af",borderRadius:8,padding:"1px 7px",fontSize:9,fontWeight:600}}>
                    {ex.flag} {ex.name}
                  </span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:"#10b981",animation:"pg 1.5s infinite"}}/>
                  <span style={{fontSize:9,color:"#6ee7b7",fontWeight:700}}>{lastUpd}</span>
                </div>
              </div>

              {/* PNL */}
              <div style={{padding:"16px 14px",borderBottom:"1px solid #1f2937"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <div style={{fontSize:11,color:"#6b7280",fontWeight:600}}>Active PNL</div>
                  <div style={{fontSize:11,color:"#6b7280",fontWeight:600}}>ROE</div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div className={`mono ${priceDir==="up"?"pu":priceDir==="down"?"pd":""}`}
                    style={{fontSize:28,fontWeight:900,
                      color:green?"#10b981":"#ef4444",lineHeight:1}}>
                    {green?"+":"-"}₹{Math.abs(pnlData.pnlINR).toLocaleString("en-IN",{maximumFractionDigits:0})}
                  </div>
                  <div style={{fontSize:22,fontWeight:900,
                    color:green?"#10b981":"#ef4444",fontFamily:"'JetBrains Mono',monospace"}}>
                    {green?"+":""}{pnlData.roe.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",
                gap:0,borderBottom:"1px solid #1f2937"}}>
                {[
                  {l:"Qty ("+coin+")", v:qty.toFixed(4)},
                  {l:"Size", v:dispCur==="INR"?`₹${(livePrice*qty*USD_INR).toLocaleString("en-IN",{maximumFractionDigits:0})}`:`$${(livePrice*qty).toFixed(2)}`},
                  {l:"Margin", v:dispCur==="INR"?`₹${parseFloat(margin).toLocaleString()}`:`$${margin}`},
                ].map((s,i)=>(
                  <div key={i} style={{padding:"10px 12px",borderRight:i<2?"1px solid #1f2937":"none"}}>
                    <div style={{fontSize:9,color:"#6b7280",marginBottom:3}}>{s.l}</div>
                    <div className="mono" style={{fontSize:12,fontWeight:700,color:"#f1f5f9"}}>{s.v}</div>
                  </div>
                ))}
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:0}}>
                {[
                  {l:"Avg. Entry ("+ex.cur+")", v:entryNum.toFixed(4)},
                  {l:"LTP ("+ex.cur+")", v:livePrice.toFixed(4),
                    c:livePrice>=entryNum?"#10b981":"#ef4444"},
                  {l:"Liq. Price ("+ex.cur+")", v:liqPrice.toFixed(4),c:"#ef4444"},
                ].map((s,i)=>(
                  <div key={i} style={{padding:"10px 12px",borderRight:i<2?"1px solid #1f2937":"none"}}>
                    <div style={{fontSize:9,color:"#6b7280",marginBottom:3}}>{s.l}</div>
                    <div className="mono" style={{fontSize:12,fontWeight:700,color:s.c||"#f1f5f9"}}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            <AD/>

            {/* Timeframe Analysis */}
            <div style={{background:"#1f2937",borderRadius:16,padding:"16px",
              border:"1px solid #374151",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:4,color:"#f1f5f9",display:"flex",alignItems:"center",gap:8}}>
                <span>⏱️</span> Kab Tak Hold Karo?
              </div>
              <div style={{fontSize:10,color:"#6b7280",marginBottom:12}}>
                RSI + MACD + Bollinger Bands + ATR + Support/Resistance — background mein
              </div>
              {TFS.map(({tf,label})=>{
                const cl=tfData[tf]||[];
                const rsi=calcRSI(cl);
                const ma20=calcMA(cl,20);
                const ma50=calcMA(cl,50);
                const bb=calcBB(cl);
                const atr=cl.length>14?cl.slice(-14).reduce((s,v,i,a)=>s+(i>0?Math.abs(v-a[i-1]):0),0)/13:livePrice*0.02;
                const sup=cl.length>=20?Math.min(...cl.slice(-20)):livePrice*0.95;
                const res=cl.length>=20?Math.max(...cl.slice(-20)):livePrice*1.05;
                const curr=cl[cl.length-1]||livePrice;
                const bbPct=bb.upper>bb.lower?(curr-bb.lower)/(bb.upper-bb.lower)*100:50;
                const nearRes=(res-curr)/curr*100;
                const nearSup=(curr-sup)/curr*100;

                let score=0;
                if(direction==="long"){
                  if(rsi<35)score+=3;else if(rsi<45)score+=2;else if(rsi<55)score+=1;else if(rsi>70)score-=3;else if(rsi>62)score-=2;
                  if(curr>ma20)score+=1;if(curr>ma50)score+=1;
                  if(bbPct<25)score+=2;if(bbPct>80)score-=2;
                  if(nearRes<2)score-=1;if(nearSup<1.5)score+=1;
                }else{
                  if(rsi>65)score+=3;else if(rsi>55)score+=2;else if(rsi>45)score+=1;else if(rsi<30)score-=3;else if(rsi<38)score-=2;
                  if(curr<ma20)score+=1;if(curr<ma50)score+=1;
                  if(bbPct>75)score+=2;if(bbPct<20)score-=2;
                  if(nearSup<2)score-=1;if(nearRes<1.5)score+=1;
                }

                const pnl=pnlData;
                let dec,dc,db,time;
                if(score>=4){dec="🔥 HOLD STRONG";dc="#059669";db="rgba(5,150,105,.15)";time=`Strong hold — ${label} full`;}
                else if(score>=2){dec="✅ HOLD";dc="#10b981";db="rgba(16,185,129,.1)";time=`Hold karo ${label}`;}
                else if(score>=0&&pnl?.roe>10){dec="🎯 PARTIAL EXIT";dc="#f59e0b";db="rgba(245,158,11,.1)";time="50% exit karo";}
                else if(score<-2||(rsi>72&&direction==="long")||(rsi<28&&direction==="short")){
                  dec="🚨 EXIT NOW";dc="#ef4444";db="rgba(239,68,68,.15)";time="Abhi exit karo";}
                else if(score<0){dec="⚠️ WATCH";dc="#f59e0b";db="rgba(245,158,11,.1)";time="5 min wait karo";}
                else{dec="⏸️ WAIT";dc="#8b5cf6";db="rgba(139,92,246,.1)";time="Signal ka wait";}

                const str=Math.min(5,Math.max(1,Math.abs(score)+1));
                const isPos=score>=0;

                return(
                  <div key={tf} style={{display:"flex",alignItems:"center",gap:10,
                    padding:"12px",background:db,borderRadius:12,marginBottom:7,
                    border:`1px solid ${dc}22`,borderLeft:`4px solid ${dc}`}}>
                    <div style={{width:50,flexShrink:0,textAlign:"center",
                      background:"#0f172a",borderRadius:10,padding:"8px 4px"}}>
                      <div style={{fontSize:14,fontWeight:900,color:"#fff",lineHeight:1}}>{label.split(" ")[0]}</div>
                      <div style={{fontSize:8,color:"#6b7280",marginTop:1}}>{label.split(" ")[1]||""}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{background:"rgba(0,0,0,.3)",border:`1.5px solid ${dc}`,
                        borderRadius:20,padding:"5px 12px",display:"inline-block",
                        fontSize:12,fontWeight:800,color:dc,marginBottom:5}}>{dec}</div>
                      <div style={{fontSize:12,color:"#d1d5db",fontWeight:600}}>{time}</div>
                    </div>
                    <div style={{display:"flex",gap:2,flexShrink:0}}>
                      {[1,2,3,4,5].map(n=>(
                        <div key={n} style={{width:5,height:18,borderRadius:3,
                          background:n<=str?isPos?"#10b981":"#ef4444":"#374151"}}/>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Advice */}
            <div style={{background:"#1f2937",borderRadius:16,padding:"16px",
              border:"1px solid #374151",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:13,color:"#f1f5f9",display:"flex",alignItems:"center",gap:8}}>
                  <span>🤖</span> AI Full Analysis
                </div>
                <button onClick={()=>{aiDone.current=false;getAI();}}
                  style={{background:"transparent",border:"1px solid #374151",borderRadius:20,
                    padding:"4px 12px",fontSize:11,color:"#10b981",fontWeight:700,cursor:"pointer",
                    fontFamily:"'Inter',sans-serif"}}>🔄</button>
              </div>
              {aiLoad?(
                <div style={{textAlign:"center",padding:"16px 0"}}>
                  <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:8}}>
                    {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",
                      background:"#10b981",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
                  </div>
                  <div style={{fontSize:11,color:"#6b7280"}}>Analyzing 4 timeframes...</div>
                </div>
              ):aiAdvice?(
                <div className="fadein">
                  {aiAdvice.split("\n").filter(Boolean).map((line,i)=>{
                    const h=line.startsWith("📊");
                    const tf=line.startsWith("⏱️");
                    const tp=line.startsWith("🎯")||line.startsWith("🛑")||line.startsWith("💰");
                    const w=line.startsWith("⚠️");
                    return(<div key={i} style={{
                      background:h?"rgba(16,185,129,.1)":tf?"rgba(255,255,255,.03)":tp?"rgba(99,102,241,.08)":w?"rgba(239,68,68,.08)":"transparent",
                      border:h?"1px solid rgba(16,185,129,.3)":tf?"1px solid #1f2937":tp?"1px solid rgba(99,102,241,.2)":w?"1px solid rgba(239,68,68,.2)":"none",
                      borderLeft:h?"4px solid #10b981":tf?"3px solid #6366f1":"none",
                      borderRadius:h||tf||tp||w?10:0,
                      padding:h||tf||tp||w?"9px 12px":"2px 4px",
                      marginBottom:h||tf||tp?7:3,
                      fontSize:h?14:12,fontWeight:h?800:tf?600:400,
                      color:h?"#6ee7b7":w?"#fca5a5":"#d1d5db",lineHeight:1.7,
                    }}>{line}</div>);
                  })}
                  <div style={{fontSize:9,color:"#10b981",marginTop:8,textAlign:"right",fontWeight:600}}>
                    💾 Auto-saved · 🔄 Har 3 min update
                  </div>
                </div>
              ):(
                <div style={{textAlign:"center",padding:"16px",color:"#6b7280",fontSize:12}}>
                  Price load hone ke baad AI aayega...
                </div>
              )}
            </div>

            <AD/>

            <button onClick={reset}
              style={{width:"100%",background:"#1f2937",border:"1px solid #374151",
                borderRadius:12,padding:"13px",fontWeight:700,fontSize:13,cursor:"pointer",
                color:"#9ca3af",fontFamily:"'Inter',sans-serif",marginBottom:12}}>
              ← Nayi Position
            </button>
          </div>
        )}

        <AD/>
        <div style={{textAlign:"center",fontSize:10,color:"#4b5563",padding:"8px"}}>
          ⚠️ Not financial advice · DYOR always<br/>
          <Link href="/" style={{color:"#10b981",textDecoration:"none"}}>← YES YOU PRO</Link>
        </div>
      </div>
    </main>
  );
}
