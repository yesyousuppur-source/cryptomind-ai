"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const AD = () => (
  <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",
    border:"1px solid #e2e8f0",padding:"4px",margin:"10px 0"}}>
    <div style={{fontSize:9,color:"#94a3b8",marginBottom:2,letterSpacing:1}}>ADVERTISEMENT</div>
    <ins className="adsbygoogle" style={{display:"block"}}
      data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO"
      data-ad-format="auto" data-full-width-responsive="true"/>
    <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
  </div>
);

const USD_INR = 83.5;

const COINS = [
  "BTC","ETH","SOL","BNB","XRP","ADA","AVAX","DOGE","LINK","DOT",
  "APT","SUI","INJ","ARB","OP","NEAR","TON","UNI","PEPE","TRX",
  "MATIC","LTC","ATOM","FTM","HBAR","XLM","FIL","VET","SAND","GALA",
  "AAVE","MKR","SNX","CRV","1INCH","SUSHI","CAKE","GMT","PEOPLE","ZEC",
  "DASH","XMR","ETC","BCH","ZIL","ENJ","MANA","CHZ","BAT","ANKR",
  "STORJ","SKL","OCEAN","BAND","REN","KNC","ALICE","AXS","RUNE","THETA",
  "TFUEL","ONE","ZEN","KAVA","CELO","FLOW","ICP","EGLD","LUNA","FTT",
  "GMT","GRT","STX","IMX","BLUR","PYTH","JUP","WIF","BONK","BOME",
  "ORDI","SATS","RATS","NULS","CFX","ACH","CELR","CKB","OGN","PERP",
  "REEF","LINA","DODO","TLM","FOR","HARD","STPT","CTSI","DENT","WIN",
  "HOT","MTL","WRX","LOOM","BNX","MBL","POLS","SUPER","BETA","DF",
  "QUICK","BAKE","BEL","POND","ASR","ATM","BAR","CITY","JUV","PSG",
  "PORTO","ALPINE","OG","TLOS","CTXC","DATA","KP3R","NBS","FARM","TOWER",
];

const TFS = [
  {tf:"5m",label:"5 Min",interval:"5m"},
  {tf:"15m",label:"15 Min",interval:"15m"},
  {tf:"30m",label:"30 Min",interval:"30m"},
  {tf:"1h",label:"1 Hour",interval:"1h"},
  {tf:"2h",label:"2 Hour",interval:"2h"},
  {tf:"4h",label:"4 Hour",interval:"4h"},
];

function calcRSI(cl){
  if(cl.length<15)return 50;
  let ag=0,al=0;
  for(let i=1;i<=14;i++){const d=cl[i]-cl[i-1];d>0?ag+=d:al+=Math.abs(d);}
  ag/=14;al/=14;
  for(let i=15;i<cl.length;i++){const d=cl[i]-cl[i-1];ag=(ag*13+(d>0?d:0))/14;al=(al*13+(d<0?Math.abs(d):0))/14;}
  return al===0?100:Math.round(100-100/(1+ag/al));
}
function calcMA(cl,n){if(cl.length<n)return cl[cl.length-1]||0;return cl.slice(-n).reduce((a,b)=>a+b,0)/n;}
function fmtINR(n){return"₹"+Math.abs(n).toLocaleString("en-IN",{maximumFractionDigits:0});}
function fmtUSD(n){return n>=1?"$"+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):"$"+n.toPrecision(5);}

export default function TradePage(){
  const [coin,setCoin]         = useState("AVAX");
  const [coinSearch,setCoinSearch] = useState("");
  const [showDropdown,setShowDropdown] = useState(false);
  const [buyPrice,setBuyPrice] = useState("");
  const [amount,setAmount]     = useState("");
  const [currency,setCurrency] = useState("INR");
  const [leverage,setLeverage] = useState(1);
  const [active,setActive]     = useState(false);
  const [livePrice,setLivePrice] = useState(null);
  const [priceDir,setPriceDir]   = useState(null);
  const [ticker24,setTicker24]   = useState(null);
  const [lastUpd,setLastUpd]     = useState("");
  const [tfData,setTfData]       = useState({});
  const [aiAdvice,setAiAdvice]   = useState(null);
  const [aiLoad,setAiLoad]       = useState(false);
  const [savedTrades,setSavedTrades] = useState([]);

  const wsRef    = useRef(null);
  const prevRef  = useRef(null);
  const aiDone   = useRef(false);

  const filteredCoins = COINS.filter(c=>c.includes(coinSearch.toUpperCase()));

  // ── Load saved trades from localStorage ─────────────────────────────
  useEffect(()=>{
    try{
      const saved = localStorage.getItem("yyp_trades");
      if(saved){
        const trades = JSON.parse(saved);
        setSavedTrades(trades);
        // Restore last active trade
        const last = trades[0];
        if(last&&last.active){
          setCoin(last.coin);setBuyPrice(last.buyPrice);
          setAmount(last.amount);setCurrency(last.currency);
          setLeverage(last.leverage);
          setActive(true);
          startTracking_internal(last.coin,last.buyPrice,last.amount,last.currency,last.leverage);
        }
      }
    }catch(_){}
  },[]);

  // ── Save trade to localStorage ───────────────────────────────────────
  const saveTrade = useCallback((c,bp,amt,cur,lev,advice)=>{
    const trade = {
      coin:c,buyPrice:bp,amount:amt,currency:cur,leverage:lev,
      active:true,savedAt:new Date().toISOString(),
      aiAdvice:advice||null,
    };
    const existing = JSON.parse(localStorage.getItem("yyp_trades")||"[]");
    // Remove same coin if exists
    const filtered = existing.filter(t=>t.coin!==c);
    const updated = [trade,...filtered].slice(0,5); // max 5 trades
    localStorage.setItem("yyp_trades",JSON.stringify(updated));
    setSavedTrades(updated);
  },[]);

  const deleteSavedTrade = (coinName)=>{
    const updated = savedTrades.filter(t=>t.coin!==coinName);
    localStorage.setItem("yyp_trades",JSON.stringify(updated));
    setSavedTrades(updated);
  };

  // ── WebSocket ─────────────────────────────────────────────────────────
  const startWS = useCallback((sym)=>{
    if(wsRef.current)wsRef.current.close();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${sym.toLowerCase()}usdt@ticker`);
    ws.onmessage=(e)=>{
      const d=JSON.parse(e.data);
      const p=parseFloat(d.c);
      if(prevRef.current!==null)setPriceDir(p>prevRef.current?"up":p<prevRef.current?"down":null);
      prevRef.current=p;
      setLivePrice(p);
      setTicker24({ch24:parseFloat(d.P),high:parseFloat(d.h),low:parseFloat(d.l),vol:parseFloat(d.q)});
      setLastUpd(new Date().toLocaleTimeString("en-IN"));
    };
    ws.onerror=()=>{ws.close();setTimeout(()=>startWS(sym),3000);};
    wsRef.current=ws;
  },[]);

  // ── Fetch TF klines ───────────────────────────────────────────────────
  const fetchTF = useCallback(async(sym)=>{
    const res={};
    await Promise.allSettled(TFS.map(async({tf,interval})=>{
      try{const r=await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=${interval}&limit=60`);
        if(r.ok){const j=await r.json();res[tf]=j.map(k=>parseFloat(k[4]));}}catch(_){}
    }));
    setTfData(res);return res;
  },[]);

  const startTracking_internal = async(c,bp,amt,cur,lev)=>{
    const sym=(c||coin).toUpperCase();
    aiDone.current=false;
    const tf=await fetchTF(sym);
    startWS(sym);
    return tf;
  };

  const startTracking = async()=>{
    if(!coin||!buyPrice||!amount)return;
    setActive(true);setAiAdvice(null);
    saveTrade(coin,buyPrice,amount,currency,leverage,null);
    await startTracking_internal(coin,buyPrice,amount,currency,leverage);
  };

  // ── AI Advice ─────────────────────────────────────────────────────────
  const fetchAI = useCallback(async(price,tf)=>{
    if(!price)return;
    setAiLoad(true);
    try{
      const buyUSD = currency==="INR"?parseFloat(buyPrice)/USD_INR:parseFloat(buyPrice);
      const amtUSD = currency==="INR"?parseFloat(amount)/USD_INR:parseFloat(amount);
      const positionUSD = amtUSD*leverage;
      const coinsQty = positionUSD/buyUSD;
      const spotPct = ((price-buyUSD)/buyUSD*100);
      const levPct  = spotPct*leverage;
      const pnlUSD  = amtUSD*(levPct/100);

      const tfS=TFS.map(({tf:t,label})=>{
        const cl=tf[t]||[];
        return `${label}: RSI ${calcRSI(cl)}, ${cl[cl.length-1]>calcMA(cl,20)?"Uptrend":"Downtrend"}`;
      }).join("\n");

      const prompt=`Crypto trade for Indian investor:
Coin: ${coin.toUpperCase()}
Entry: ${currency==="INR"?"₹"+parseFloat(buyPrice):"$"+buyUSD.toFixed(4)} | Current: ${currency==="INR"?fmtINR(price*USD_INR):fmtUSD(price)}
Investment: ${currency==="INR"?fmtINR(parseFloat(amount)):fmtUSD(amtUSD)} | Leverage: ${leverage}x
Total Position: ${currency==="INR"?fmtINR(parseFloat(amount)*leverage):fmtUSD(positionUSD)}
Coins: ${coinsQty.toFixed(4)} ${coin.toUpperCase()}
Spot P&L: ${spotPct.toFixed(2)}% | Leveraged P&L: ${levPct.toFixed(2)}%
Current P&L: ${pnlUSD>=0?"+":""}${currency==="INR"?fmtINR(pnlUSD*USD_INR):fmtUSD(pnlUSD)}

TIMEFRAMES:
${tfS}

Respond EXACTLY (Hinglish):
📊 ABHI KYA KARO: [HOLD / PARTIAL SELL / SELL NOW / ADD MORE]
💡 REASON: [2 lines]

⏱️ 5 MIN: [action] — [reason]
⏱️ 15 MIN: [action] — [reason]
⏱️ 30 MIN: [action] — [reason]
⏱️ 1 HOUR: [action] — [reason]
⏱️ 2 HOUR: [action] — [reason]
⏱️ 4 HOUR: [action] — [reason]

🎯 TP1: ${currency==="INR"?"₹[price]":"$[price]"} (+[%]%) — [% sell karo]
🎯 TP2: ${currency==="INR"?"₹[price]":"$[price]"} (+[%]%)
🎯 TP3: ${currency==="INR"?"₹[price]":"$[price]"} (+[%]%)
🛑 STOP LOSS: ${currency==="INR"?"₹[price]":"$[price]"} (-[%]%)
💰 PROFIT PLAN: [e.g. TP1 pe 30% exit, TP2 pe 40%, TP3 pe 30%]
⚠️ RISK: [1 line about leverage risk]`;

      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"compare",systemPrompt:prompt})});
      const j=await r.json();
      const advice=j.text||"";
      setAiAdvice(advice);
      // Save advice to localStorage
      saveTrade(coin,buyPrice,amount,currency,leverage,advice);
    }catch(_){}
    setAiLoad(false);
  },[coin,buyPrice,amount,currency,leverage,saveTrade]);

  useEffect(()=>{
    if(!active||!livePrice||Object.keys(tfData).length===0||aiDone.current)return;
    aiDone.current=true;
    fetchAI(livePrice,tfData);
  },[active,livePrice,tfData]);

  useEffect(()=>{
    if(!active)return;
    const t=setInterval(()=>{if(livePrice&&Object.keys(tfData).length>0)fetchAI(livePrice,tfData);},180000);
    return()=>clearInterval(t);
  },[active,livePrice,tfData,fetchAI]);

  useEffect(()=>{return()=>{if(wsRef.current)wsRef.current.close();};},[]);

  // ── Correct P&L Math ──────────────────────────────────────────────────
  // Entry in USD
  const entryUSD = currency==="INR"?parseFloat(buyPrice||0)/USD_INR:parseFloat(buyPrice||0);
  const amtUSD   = currency==="INR"?parseFloat(amount||0)/USD_INR:parseFloat(amount||0);
  // Total position size with leverage
  const positionUSD = amtUSD*leverage;
  // Coins quantity = position / entry price
  const coinsQty = entryUSD>0?positionUSD/entryUSD:0;

  const calc=(()=>{
    if(!active||!livePrice||!entryUSD||entryUSD<=0)return null;
    const spotPct   = (livePrice-entryUSD)/entryUSD*100;
    const levPct    = spotPct*leverage;
    const pnlUSD    = amtUSD*(levPct/100);
    const pnlINR    = pnlUSD*USD_INR;
    const liqPrice  = leverage>1?entryUSD*(1-0.9/leverage):null;
    const curValUSD = amtUSD+pnlUSD;
    return{spotPct,levPct,pnlUSD,pnlINR,liqPrice,curValUSD};
  })();
  const green=calc&&calc.levPct>=0;

  return(
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f0fdf8",minHeight:"100vh",
      color:"#0f172a",overflowX:"hidden",paddingBottom:40}}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes pg{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.4)}50%{box-shadow:0 0 0 8px rgba(16,185,129,0)}}
        @keyframes up{0%{color:#34d399;transform:scale(1.04)}100%{color:#fff;transform:scale(1)}}
        @keyframes dn{0%{color:#f87171;transform:scale(1.04)}100%{color:#fff;transform:scale(1)}}
        .fadein{animation:fadein .3s ease}
        .mono{font-family:'JetBrains Mono',monospace}
        .up{animation:up .5s ease}
        .dn{animation:dn .5s ease}
        input[type=range]{-webkit-appearance:none;width:100%;height:8px;border-radius:4px;
          background:linear-gradient(90deg,#10b981 0%,#10b981 var(--v,2%),#e2e8f0 var(--v,2%));outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:28px;height:28px;
          border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);cursor:pointer;
          box-shadow:0 2px 10px rgba(16,185,129,.5);border:2px solid #fff}
      `}</style>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",padding:"16px",
        borderBottom:"2px solid #10b981"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <Link href="/" style={{color:"#6ee7b7",fontSize:12,textDecoration:"none",fontWeight:600}}>← Home</Link>
          {active&&livePrice&&(
            <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(16,185,129,.15)",
              border:"1px solid rgba(16,185,129,.3)",borderRadius:20,padding:"4px 12px"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#10b981",animation:"pg 1.5s infinite"}}/>
              <span style={{fontSize:9,color:"#6ee7b7",fontWeight:700}}>LIVE · {lastUpd}</span>
            </div>
          )}
        </div>
        <div style={{fontWeight:900,fontSize:22,color:"white",letterSpacing:-1}}>📈 Trade Manager</div>
        <div style={{fontSize:11,color:"#64748b"}}>Position track · 6 Timeframe AI · Auto-save</div>
      </div>

      <div style={{padding:"14px"}}>
        <AD/>

        {/* Saved trades restore */}
        {!active&&savedTrades.length>0&&(
          <div className="fadein" style={{background:"#fff",borderRadius:16,padding:"14px",
            marginBottom:12,border:"1px solid #e2e8f0",boxShadow:"0 2px 12px rgba(0,0,0,.04)"}}>
            <div style={{fontSize:11,color:"#64748b",fontWeight:700,marginBottom:10,letterSpacing:.5}}>
              💾 SAVED TRADES — DOBARA DEKHO
            </div>
            {savedTrades.map((t,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",
                background:"#f8fafc",borderRadius:10,marginBottom:6,cursor:"pointer",
                border:"1px solid #f1f5f9"}}
                onClick={()=>{
                  setCoin(t.coin);setBuyPrice(t.buyPrice);setAmount(t.amount);
                  setCurrency(t.currency);setLeverage(t.leverage);
                  setActive(true);setAiAdvice(t.aiAdvice||null);
                  aiDone.current=!!t.aiAdvice;
                  startTracking_internal(t.coin,t.buyPrice,t.amount,t.currency,t.leverage);
                }}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:13,color:"#0f172a"}}>{t.coin}</div>
                  <div style={{fontSize:10,color:"#94a3b8"}}>
                    {t.currency==="INR"?"₹":"$"}{t.buyPrice} · {t.currency==="INR"?"₹":"$"}{t.amount} · {t.leverage}x
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <div style={{background:"#10b981",borderRadius:8,padding:"4px 10px",
                    fontSize:10,color:"#fff",fontWeight:700}}>Restore</div>
                  <div onClick={e=>{e.stopPropagation();deleteSavedTrade(t.coin);}}
                    style={{background:"#fef2f2",borderRadius:8,padding:"4px 8px",
                    fontSize:10,color:"#dc2626",fontWeight:700}}>✕</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FORM */}
        {!active&&(
          <div className="fadein" style={{background:"#fff",borderRadius:20,padding:"20px",
            boxShadow:"0 4px 20px rgba(0,0,0,.06)",border:"1px solid #e2e8f0",marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:22}}>💼</span> Trade Enter Karo
            </div>

            {/* Coin Dropdown */}
            <div style={{marginBottom:12,position:"relative"}}>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:5,letterSpacing:.5}}>COIN SELECT KARO</div>
              <div onClick={()=>setShowDropdown(!showDropdown)}
                style={{background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                  padding:"13px 14px",display:"flex",justifyContent:"space-between",
                  alignItems:"center",cursor:"pointer"}}>
                <span style={{fontSize:18,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:"#0f172a"}}>{coin}</span>
                <span style={{fontSize:12,color:"#94a3b8"}}>▼</span>
              </div>
              {showDropdown&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",
                  borderRadius:12,border:"2px solid #10b981",boxShadow:"0 8px 30px rgba(0,0,0,.12)",
                  zIndex:100,maxHeight:200,overflow:"hidden",display:"flex",flexDirection:"column"}}>
                  <input value={coinSearch} onChange={e=>setCoinSearch(e.target.value)}
                    placeholder="Search: BTC, ETH, SOL..."
                    autoFocus
                    style={{padding:"10px 14px",border:"none",borderBottom:"1px solid #f1f5f9",
                      fontSize:13,outline:"none",fontFamily:"'JetBrains Mono',monospace"}}/>
                  <div style={{overflowY:"auto",maxHeight:150}}>
                    {filteredCoins.map(c=>(
                      <div key={c} onClick={()=>{setCoin(c);setShowDropdown(false);setCoinSearch("");}}
                        style={{padding:"10px 14px",cursor:"pointer",fontWeight:c===coin?700:400,
                          background:c===coin?"#f0fdf4":"transparent",
                          fontSize:13,fontFamily:"'JetBrains Mono',monospace",
                          color:c===coin?"#059669":"#0f172a",
                          borderBottom:"1px solid #f8fafc"}}
                        onMouseEnter={e=>e.target.style.background="#f8fafc"}
                        onMouseLeave={e=>e.target.style.background=c===coin?"#f0fdf4":"transparent"}>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Amount */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:5,letterSpacing:.5}}>INVEST KIYA AMOUNT</div>
              <div style={{display:"flex",gap:8}}>
                <select value={currency} onChange={e=>setCurrency(e.target.value)}
                  style={{background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                    padding:"13px 8px",fontSize:13,color:"#0f172a",width:85,flexShrink:0}}>
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                </select>
                <input value={amount} onChange={e=>setAmount(e.target.value)}
                  placeholder="e.g. 5000" type="number"
                  style={{flex:1,background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                    padding:"13px 14px",fontSize:15,fontWeight:700,color:"#0f172a",
                    fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box",minWidth:0}}
                  onFocus={e=>e.target.style.borderColor="#10b981"}
                  onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
              </div>
            </div>

            {/* Buy Price */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:5,letterSpacing:.5}}>
                AVERAGE BUYING PRICE ({currency==="INR"?"₹":"$"})
              </div>
              <input value={buyPrice} onChange={e=>setBuyPrice(e.target.value)}
                placeholder={currency==="INR"?"Jis price pe kharida e.g. 900":"e.g. 10.80"} type="number"
                style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                  padding:"13px 14px",fontSize:15,fontWeight:700,color:"#0f172a",
                  fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}
                onFocus={e=>e.target.style.borderColor="#10b981"}
                onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
            </div>

            {/* Leverage Slider */}
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,letterSpacing:.5}}>LEVERAGE</div>
                <div style={{background:leverage>10?"linear-gradient(135deg,#ef4444,#dc2626)":
                  leverage>1?"linear-gradient(135deg,#f59e0b,#d97706)":"linear-gradient(135deg,#10b981,#059669)",
                  borderRadius:20,padding:"5px 16px"}}>
                  <span style={{fontWeight:900,fontSize:20,color:"#fff",fontFamily:"'JetBrains Mono',monospace"}}>{leverage}x</span>
                </div>
              </div>
              <input type="range" min="1" max="50" value={leverage}
                onChange={e=>{const v=parseInt(e.target.value);setLeverage(v);
                  e.target.style.setProperty("--v",`${(v-1)/49*100}%`);}}
                style={{"--v":`${(leverage-1)/49*100}%`}}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                <span style={{fontSize:9,color:"#10b981",fontWeight:700}}>1x</span>
                <span style={{fontSize:9,color:"#f59e0b",fontWeight:700}}>10x</span>
                <span style={{fontSize:9,color:"#ef4444",fontWeight:700}}>25x</span>
                <span style={{fontSize:9,color:"#dc2626",fontWeight:700}}>50x ⚠️</span>
              </div>
            </div>

            {/* Preview calculation */}
            {amount&&buyPrice&&parseFloat(amount)>0&&parseFloat(buyPrice)>0&&(
              <div style={{background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)",
                border:"1px solid #6ee7b7",borderRadius:12,padding:"12px 14px",marginBottom:16}}>
                <div style={{fontSize:10,color:"#059669",fontWeight:700,marginBottom:8}}>📊 CALCULATION PREVIEW</div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:11,color:"#64748b"}}>Investment</span>
                  <span style={{fontSize:12,fontWeight:700,color:"#0f172a",fontFamily:"'JetBrains Mono',monospace"}}>
                    {currency==="INR"?`₹${parseFloat(amount).toLocaleString()}`:`$${parseFloat(amount)}`}
                  </span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:11,color:"#64748b"}}>× {leverage}x Leverage</span>
                  <span style={{fontSize:12,fontWeight:700,color:"#10b981",fontFamily:"'JetBrains Mono',monospace"}}>
                    = {currency==="INR"?`₹${(parseFloat(amount)*leverage).toLocaleString()}`:`$${(parseFloat(amount)*leverage)}`}
                  </span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:11,color:"#64748b"}}>÷ Buy Price</span>
                  <span style={{fontSize:12,fontWeight:700,color:"#6366f1",fontFamily:"'JetBrains Mono',monospace"}}>
                    {currency==="INR"?`₹${parseFloat(buyPrice)}`:`$${parseFloat(buyPrice)}`}
                  </span>
                </div>
                <div style={{borderTop:"1px solid #6ee7b7",paddingTop:6,display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,color:"#059669",fontWeight:700}}>= Coins Quantity</span>
                  <span style={{fontSize:13,fontWeight:900,color:"#059669",fontFamily:"'JetBrains Mono',monospace"}}>
                    {coinsQty>0?coinsQty.toFixed(4):"-"} {coin}
                  </span>
                </div>
              </div>
            )}

            <button onClick={startTracking} disabled={!coin||!buyPrice||!amount}
              style={{width:"100%",background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",
                border:"none",borderRadius:14,padding:"15px",fontWeight:800,fontSize:15,
                cursor:"pointer",fontFamily:"'Inter',sans-serif",boxShadow:"0 4px 16px rgba(16,185,129,.4)",
                opacity:(!coin||!buyPrice||!amount)?0.5:1}}>
              🚀 Live Track Karo
            </button>
          </div>
        )}

        {/* LOADING */}
        {active&&!livePrice&&(
          <div className="fadein" style={{background:"#fff",borderRadius:20,padding:"32px",
            textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,.06)"}}>
            <div style={{fontSize:40,marginBottom:12}}>📡</div>
            <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>{coin} price fetch ho rahi hai...</div>
            <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:14}}>
              {[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:"50%",
                background:"#10b981",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
            </div>
          </div>
        )}

        {/* LIVE DASHBOARD */}
        {active&&livePrice&&calc&&(
          <div className="fadein">
            {/* Main price card */}
            <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",borderRadius:20,
              padding:"18px",marginBottom:12,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,
                background:`linear-gradient(90deg,${green?"#10b981,#34d399":"#ef4444,#f87171"})`}}/>

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div>
                  <div style={{fontWeight:900,fontSize:22,color:"white"}}>{coin}/USDT</div>
                  <div style={{fontSize:10,color:"#64748b"}}>{leverage}x · {coinsQty.toFixed(4)} coins</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div className={`mono ${priceDir==="up"?"up":priceDir==="down"?"dn":""}`}
                    style={{fontSize:22,fontWeight:900,
                      color:priceDir==="up"?"#34d399":priceDir==="down"?"#f87171":"#fff"}}>
                    {currency==="INR"?fmtINR(livePrice*USD_INR):fmtUSD(livePrice)}
                  </div>
                  {ticker24&&<div style={{fontSize:11,color:ticker24.ch24>=0?"#10b981":"#ef4444",fontWeight:700}}>
                    {ticker24.ch24>=0?"▲":"▼"}{Math.abs(ticker24.ch24).toFixed(2)}% 24h
                  </div>}
                </div>
              </div>

              {/* Key numbers */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                <div style={{background:"rgba(255,255,255,.05)",borderRadius:10,padding:"10px"}}>
                  <div style={{fontSize:9,color:"#64748b",marginBottom:3}}>CURRENT P&L ({leverage}x)</div>
                  <div className="mono" style={{fontSize:20,fontWeight:900,
                    color:green?"#34d399":"#f87171",lineHeight:1}}>
                    {green?"+":"-"}{currency==="INR"?fmtINR(Math.abs(calc.pnlINR)):fmtUSD(Math.abs(calc.pnlUSD))}
                  </div>
                  <div style={{fontSize:11,color:green?"#6ee7b7":"#fca5a5",fontWeight:700,marginTop:2}}>
                    {green?"+":""}{calc.levPct.toFixed(2)}% leveraged
                  </div>
                </div>
                <div style={{background:"rgba(255,255,255,.05)",borderRadius:10,padding:"10px"}}>
                  <div style={{fontSize:9,color:"#64748b",marginBottom:3}}>POSITION VALUE</div>
                  <div className="mono" style={{fontSize:16,fontWeight:800,color:"#fff",lineHeight:1}}>
                    {currency==="INR"?fmtINR(calc.curValUSD*USD_INR):fmtUSD(calc.curValUSD)}
                  </div>
                  <div style={{fontSize:10,color:"#94a3b8",marginTop:3}}>
                    Entry: {currency==="INR"?`₹${parseFloat(buyPrice)}`:`$${parseFloat(buyPrice)}`}
                    → Now: {currency==="INR"?`₹${Math.round(livePrice*USD_INR)}`:`$${livePrice.toFixed(4)}`}
                  </div>
                </div>
              </div>

              {/* Spot vs Leveraged */}
              <div style={{background:"rgba(255,255,255,.04)",borderRadius:10,padding:"10px 12px",
                display:"flex",justifyContent:"space-between",marginBottom:calc.liq?8:0}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#64748b",marginBottom:2}}>Spot P&L</div>
                  <div style={{fontSize:13,fontWeight:700,color:green?"#10b981":"#ef4444"}}>
                    {green?"+":""}{calc.spotPct.toFixed(2)}%
                  </div>
                </div>
                <div style={{width:1,background:"rgba(255,255,255,.1)"}}/>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#64748b",marginBottom:2}}>× {leverage}x Leveraged</div>
                  <div style={{fontSize:13,fontWeight:700,color:green?"#34d399":"#f87171"}}>
                    {green?"+":""}{calc.levPct.toFixed(2)}%
                  </div>
                </div>
                <div style={{width:1,background:"rgba(255,255,255,.1)"}}/>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#64748b",marginBottom:2}}>RSI 1h</div>
                  <div style={{fontSize:13,fontWeight:700,
                    color:calcRSI(tfData["1h"]||[])<35?"#34d399":calcRSI(tfData["1h"]||[])>65?"#f87171":"#fbbf24"}}>
                    {calcRSI(tfData["1h"]||[])}
                  </div>
                </div>
              </div>

              {calc.liq&&leverage>1&&(
                <div style={{background:"rgba(239,68,68,.2)",borderRadius:8,padding:"7px 10px",
                  display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:10,color:"#fca5a5",fontWeight:700}}>⚠️ Liquidation Price</span>
                  <span className="mono" style={{fontSize:11,color:"#fca5a5",fontWeight:800}}>
                    {currency==="INR"?fmtINR(calc.liq*USD_INR):fmtUSD(calc.liq)}
                  </span>
                </div>
              )}
            </div>

            <AD/>

            {/* TIMEFRAMES */}
            <div style={{background:"#fff",borderRadius:20,padding:"18px",
              boxShadow:"0 4px 20px rgba(0,0,0,.06)",border:"1px solid #e2e8f0",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>⏱️</span> Timeframe Analysis
              </div>
              {TFS.map(({tf,label})=>{
                const cl=tfData[tf]||[];
                const rsi=calcRSI(cl);
                const ma20=calcMA(cl,20);
                const ma50=calcMA(cl,50);
                const price=cl[cl.length-1]||livePrice;
                const ch=cl.length>=2?((cl[cl.length-1]-cl[cl.length-2])/cl[cl.length-2]*100):0;
                const bull=price>ma20;
                let rec,rc,rb,advice;
                if(rsi<35&&bull){rec="🔥 STRONG BUY";rc="#059669";rb="#ecfdf5";advice="Abhi add karo";}
                else if(rsi<45&&bull){rec="📈 BUY / ADD";rc="#10b981";rb="#f0fdf4";advice="Hold ya thoda add karo";}
                else if(rsi>=45&&rsi<=58&&bull){rec="✅ HOLD";rc="#2563eb";rb="#eff6ff";advice="Position hold rakho";}
                else if(rsi>58&&rsi<68){rec="🎯 PARTIAL SELL";rc="#d97706";rb="#fffbeb";advice="50% profit book karo";}
                else if(rsi>=68){rec="🚨 SELL / BOOK";rc="#dc2626";rb="#fef2f2";advice="Profit book karo";}
                else{rec="👀 WATCH";rc="#d97706";rb="#fffbeb";advice="Wait karo";}
                return(
                  <div key={tf} style={{display:"flex",alignItems:"center",gap:10,
                    padding:"10px 12px",background:"#f8fafc",borderRadius:12,marginBottom:7,
                    border:"1px solid #f1f5f9"}}>
                    <div style={{width:52,flexShrink:0,textAlign:"center",background:"#0f172a",
                      borderRadius:8,padding:"7px 4px"}}>
                      <div style={{fontSize:13,fontWeight:800,color:"#fff"}}>{label.split(" ")[0]}</div>
                      <div style={{fontSize:8,color:"#64748b"}}>{label.split(" ")[1]||""}</div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{background:rb,border:`1px solid ${rc}44`,borderRadius:20,
                        padding:"4px 10px",display:"inline-block",fontSize:11,fontWeight:700,color:rc,
                        marginBottom:3}}>
                        {rec}
                      </div>
                      <div style={{fontSize:10,color:"#64748b"}}>{advice}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:11,fontWeight:800,
                        color:rsi<40?"#059669":rsi>65?"#ef4444":"#f59e0b"}}>RSI {rsi}</div>
                      <div style={{fontSize:9,color:ch>=0?"#10b981":"#ef4444",fontWeight:600}}>
                        {ch>=0?"+":""}{ch.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI FULL ADVICE */}
            <div style={{background:"#fff",borderRadius:20,padding:"18px",
              boxShadow:"0 4px 20px rgba(0,0,0,.06)",border:"1px solid #e2e8f0",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:20}}>🤖</span> AI Full Advice
                </div>
                <button onClick={()=>{aiDone.current=false;fetchAI(livePrice,tfData);}}
                  style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:20,
                    padding:"5px 12px",fontSize:11,color:"#059669",fontWeight:700,cursor:"pointer",
                    fontFamily:"'Inter',sans-serif"}}>🔄 Refresh</button>
              </div>
              {aiLoad?(
                <div style={{textAlign:"center",padding:"20px 0"}}>
                  <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:8}}>
                    {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",
                      background:"#10b981",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
                  </div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>6 timeframes analyze ho rahe hain...</div>
                </div>
              ):aiAdvice?(
                <div className="fadein">
                  {aiAdvice.split("\n").filter(Boolean).map((line,i)=>{
                    const h=line.startsWith("📊");
                    const tf=line.startsWith("⏱️");
                    const tp=line.startsWith("🎯")||line.startsWith("🛑")||line.startsWith("💰");
                    const w=line.startsWith("⚠️");
                    return(<div key={i} style={{
                      background:h?"linear-gradient(135deg,#f0fdf4,#ecfdf5)":tf?"#f8fafc":tp?"#f0f9ff":w?"#fef2f2":"transparent",
                      border:h?"2px solid #6ee7b7":tf?"1px solid #e2e8f0":tp?"1px solid #bae6fd":w?"1px solid #fecaca":"none",
                      borderLeft:h?"4px solid #10b981":tf?"3px solid #6366f1":"none",
                      borderRadius:h||tf||tp||w?10:0,
                      padding:h||tf||tp||w?"9px 12px":"2px 4px",
                      marginBottom:h||tf||tp?7:3,
                      fontSize:h?14:12,fontWeight:h?800:tf?600:400,
                      color:h?"#065f46":w?"#dc2626":"#374151",lineHeight:1.7,
                    }}>{line}</div>);
                  })}
                  <div style={{fontSize:9,color:"#10b981",marginTop:8,textAlign:"right",fontWeight:600}}>
                    💾 Auto-saved · 🔄 Har 3 min update
                  </div>
                </div>
              ):(
                <div style={{textAlign:"center",padding:"16px",color:"#94a3b8",fontSize:12}}>
                  Price aane ke baad AI advice aayegi...
                </div>
              )}
            </div>

            <AD/>

            <button onClick={()=>{
              setActive(false);setLivePrice(null);setAiAdvice(null);
              setTfData({});setTicker24(null);prevRef.current=null;aiDone.current=false;
              if(wsRef.current)wsRef.current.close();
            }} style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:14,
              padding:"13px",fontWeight:700,fontSize:13,cursor:"pointer",color:"#64748b",
              fontFamily:"'Inter',sans-serif",marginBottom:12}}>
              🔄 Nayi Trade Enter Karo
            </button>
          </div>
        )}

        <AD/>
        <div style={{textAlign:"center",fontSize:10,color:"#94a3b8",padding:"8px"}}>
          ⚠️ Not financial advice — DYOR always<br/>
          <Link href="/" style={{color:"#10b981",textDecoration:"none"}}>← YES YOU PRO</Link>
        </div>
      </div>
    </main>
  );
}
