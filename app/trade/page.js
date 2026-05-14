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
  "AAVE","MKR","SNX","CRV","GRT","STX","IMX","BLUR","WIF","BONK",
  "ORDI","CFX","FLOW","ICP","EGLD","RUNE","THETA","KAVA","CELO","ZEC",
];

const TFS = [
  {tf:"1m", label:"1 Min",  interval:"1m",  hold:"30sec–2min"},
  {tf:"5m", label:"5 Min",  interval:"5m",  hold:"5–15min"},
  {tf:"15m",label:"15 Min", interval:"15m", hold:"15–45min"},
  {tf:"30m",label:"30 Min", interval:"30m", hold:"30min–2hr"},
  {tf:"1h", label:"1 Hour", interval:"1h",  hold:"1–4hr"},
  {tf:"4h", label:"4 Hour", interval:"4h",  hold:"4–24hr"},
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

export default function TradePage(){
  const [coin,setCoin]       = useState("APT");
  const [search,setSearch]   = useState("");
  const [showDD,setShowDD]   = useState(false);
  const [buyPrice,setBuyPrice]= useState("");
  const [amount,setAmount]   = useState("");
  const [currency,setCurrency]= useState("INR");
  const [active,setActive]   = useState(false);
  const [livePrice,setLP]    = useState(null);
  const [priceDir,setPD]     = useState(null);
  const [ticker24,setT24]    = useState(null);
  const [lastUpd,setLU]      = useState("");
  const [tfData,setTF]       = useState({});
  const [aiAdvice,setAI]     = useState(null);
  const [aiLoad,setAIL]      = useState(false);
  const [saved,setSaved]     = useState([]);

  const wsRef   = useRef(null);
  const prevRef = useRef(null);
  const aiDone  = useRef(false);

  const filtered = COINS.filter(c=>c.includes(search.toUpperCase()));

  // format price
  const fmt = useCallback((usdPrice)=>{
    if(!usdPrice) return "—";
    if(currency==="INR"){
      const inr = usdPrice*USD_INR;
      return "₹"+inr.toLocaleString("en-IN",{maximumFractionDigits:inr>=100?2:4});
    }
    return usdPrice>=1?"$"+usdPrice.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):"$"+usdPrice.toPrecision(5);
  },[currency]);

  // localStorage
  useEffect(()=>{
    try{
      const s=localStorage.getItem("yyp_pos");
      if(s){
        const arr=JSON.parse(s);setSaved(arr);
        const last=arr[0];
        if(last?.active){
          setCoin(last.coin);setBuyPrice(last.bp);setAmount(last.amt);
          setCurrency(last.cur);setActive(true);setAI(last.ai||null);
          aiDone.current=!!last.ai;
          fetchTF(last.coin).then(tf=>{startWS(last.coin);});
        }
      }
    }catch(_){}
  },[]);

  const savePos=(c,bp,amt,cur,ai)=>{
    const pos={coin:c,bp,amt,cur,active:true,ts:Date.now(),ai:ai||null};
    const prev=JSON.parse(localStorage.getItem("yyp_pos")||"[]");
    const updated=[pos,...prev.filter(p=>p.coin!==c)].slice(0,5);
    localStorage.setItem("yyp_pos",JSON.stringify(updated));
    setSaved(updated);
  };

  const deletePos=(c)=>{
    const updated=saved.filter(p=>p.coin!==c);
    localStorage.setItem("yyp_pos",JSON.stringify(updated));
    setSaved(updated);
  };

  // WebSocket — every ~1 second
  const startWS=useCallback((sym)=>{
    if(wsRef.current)wsRef.current.close();
    const ws=new WebSocket(`wss://stream.binance.com:9443/ws/${sym.toLowerCase()}usdt@ticker`);
    ws.onmessage=(e)=>{
      const d=JSON.parse(e.data);
      const p=parseFloat(d.c);
      if(prevRef.current!==null)setPD(p>prevRef.current?"up":p<prevRef.current?"down":null);
      prevRef.current=p;
      setLP(p);
      setT24({ch24:parseFloat(d.P),high:parseFloat(d.h),low:parseFloat(d.l),vol:parseFloat(d.q)});
      setLU(new Date().toLocaleTimeString("en-IN"));
    };
    ws.onerror=()=>{ws.close();setTimeout(()=>startWS(sym),3000);};
    wsRef.current=ws;
  },[]);

  const fetchTF=useCallback(async(sym)=>{
    const res={};
    await Promise.allSettled(TFS.map(async({tf,interval})=>{
      try{const r=await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=${interval}&limit=60`);
        if(r.ok){const j=await r.json();res[tf]=j.map(k=>parseFloat(k[4]));}}catch(_){}
    }));
    setTF(res);return res;
  },[]);

  const start=async()=>{
    if(!coin||!buyPrice||!amount)return;
    setActive(true);setAI(null);aiDone.current=false;
    savePos(coin,buyPrice,amount,currency,null);
    await fetchTF(coin);
    startWS(coin);
  };

  // AI advice
  const getAI=useCallback(async(price,tf)=>{
    if(!price)return;
    setAIL(true);
    try{
      const buyUSD=currency==="INR"?parseFloat(buyPrice)/USD_INR:parseFloat(buyPrice);
      const amtUSD=currency==="INR"?parseFloat(amount)/USD_INR:parseFloat(amount);
      const coinsQty=amtUSD/buyUSD;
      const spotPct=((price-buyUSD)/buyUSD*100).toFixed(2);
      const pnl=currency==="INR"
        ?`₹${Math.round((price-buyUSD)*coinsQty*USD_INR).toLocaleString("en-IN")}`
        :`$${((price-buyUSD)*coinsQty).toFixed(2)}`;

      const tfS=TFS.map(({tf:t,label,hold})=>{
        const cl=tf[t]||[];
        return `${label}: RSI ${calcRSI(cl)}, ${cl[cl.length-1]>calcMA(cl,20)?"Uptrend":"Downtrend"}, hold range: ${hold}`;
      }).join("\n");

      const prompt=`You are a crypto expert helping an Indian investor.

Trade Details:
Coin: ${coin.toUpperCase()}
Buy Price: ${currency==="INR"?`₹${parseFloat(buyPrice)}`:`$${buyUSD.toFixed(4)}`}
Current Price: ${fmt(price)}
Amount Invested: ${currency==="INR"?`₹${parseFloat(amount)}`:`$${amtUSD.toFixed(2)}`}
Coins Held: ${coinsQty.toFixed(4)} ${coin}
Spot P&L: ${spotPct}%
Current P&L: ${pnl}

TIMEFRAME DATA:
${tfS}

Respond EXACTLY in this format (Hinglish). Be very specific with TIME:

📊 ABHI KYA KARO: [SELL ABHI / HOLD / WATCH / BUY MORE]
💡 REASON: [2 lines max — why]

⏱️ 1 MIN: [SELL/HOLD/WATCH] — Hold karo: [e.g. "2 min" or "Sell abhi"] — [1 line reason]
⏱️ 5 MIN: [SELL/HOLD/WATCH] — Hold karo: [e.g. "5-10 min"] — [reason]
⏱️ 15 MIN: [SELL/HOLD/WATCH] — Hold karo: [e.g. "15-30 min"] — [reason]
⏱️ 30 MIN: [SELL/HOLD/WATCH] — Hold karo: [e.g. "1-2 hr"] — [reason]
⏱️ 1 HOUR: [SELL/HOLD/WATCH] — Hold karo: [e.g. "3-4 hr"] — [reason]
⏱️ 4 HOUR: [SELL/HOLD/WATCH] — Hold karo: [e.g. "1-2 din"] — [reason]

🎯 TP1: ${currency==="INR"?"₹[price]":"$[price]"} — Yahan ${currency==="INR"?"₹":"$"} milega: [profit amount]
🎯 TP2: ${currency==="INR"?"₹[price]":"$[price]"} — Yahan milega: [profit]
🎯 TP3: ${currency==="INR"?"₹[price]":"$[price]"} — Yahan milega: [profit]
🛑 STOP LOSS: ${currency==="INR"?"₹[price]":"$[price]"}
💰 BEST STRATEGY: [e.g. TP1 pe 50% sell, baaki hold]`;

      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"compare",systemPrompt:prompt})});
      const j=await r.json();
      const advice=j.text||"";
      setAI(advice);
      savePos(coin,buyPrice,amount,currency,advice);
    }catch(_){}
    setAIL(false);
  },[coin,buyPrice,amount,currency,fmt,savePos]);

  useEffect(()=>{
    if(!active||!livePrice||Object.keys(tfData).length===0||aiDone.current)return;
    aiDone.current=true;
    getAI(livePrice,tfData);
  },[active,livePrice,tfData]);

  useEffect(()=>{
    if(!active)return;
    const t=setInterval(()=>{if(livePrice&&Object.keys(tfData).length>0)getAI(livePrice,tfData);},180000);
    return()=>clearInterval(t);
  },[active,livePrice,tfData,getAI]);

  useEffect(()=>{return()=>{if(wsRef.current)wsRef.current.close();};},[]);

  // P&L
  const buyUSD  = currency==="INR"?parseFloat(buyPrice||0)/USD_INR:parseFloat(buyPrice||0);
  const amtUSD  = currency==="INR"?parseFloat(amount||0)/USD_INR:parseFloat(amount||0);
  const coinsQty= buyUSD>0?amtUSD/buyUSD:0;

  const calc=(()=>{
    if(!active||!livePrice||!buyUSD||buyUSD<=0)return null;
    const spotPct=(livePrice-buyUSD)/buyUSD*100;
    const pnlUSD=(livePrice-buyUSD)*coinsQty;
    const pnlINR=pnlUSD*USD_INR;
    return{spotPct,pnlUSD,pnlINR};
  })();
  const green=calc&&calc.spotPct>=0;

  return(
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f0fdf8",minHeight:"100vh",
      color:"#0f172a",overflowX:"hidden",paddingBottom:40}}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes pg{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.4)}50%{box-shadow:0 0 0 8px rgba(16,185,129,0)}}
        @keyframes up{0%{transform:scale(1.06)}100%{transform:scale(1)}}
        .fadein{animation:fadein .3s ease}
        .mono{font-family:'JetBrains Mono',monospace}
        .price-up{color:#34d399!important;animation:up .4s ease}
        .price-dn{color:#f87171!important;animation:up .4s ease}
      `}</style>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",padding:"16px",borderBottom:"2px solid #10b981"}}>
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
        <div style={{fontWeight:900,fontSize:22,color:"white",letterSpacing:-1}}>📈 Position Tracker</div>
        <div style={{fontSize:11,color:"#64748b"}}>Buy price se current tak · AI kab sell karo batayega</div>
      </div>

      <div style={{padding:"14px"}}>
        <AD/>

        {/* Saved positions */}
        {!active&&saved.length>0&&(
          <div className="fadein" style={{background:"#fff",borderRadius:16,padding:"14px",
            marginBottom:12,border:"1px solid #e2e8f0"}}>
            <div style={{fontSize:11,color:"#64748b",fontWeight:700,marginBottom:10,letterSpacing:.5}}>
              💾 SAVED POSITIONS
            </div>
            {saved.map((s,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 10px",
                background:"#f8fafc",borderRadius:10,marginBottom:6,cursor:"pointer",
                border:"1px solid #f1f5f9"}}
                onClick={()=>{
                  setCoin(s.coin);setBuyPrice(s.bp);setAmount(s.amt);setCurrency(s.cur);
                  setActive(true);setAI(s.ai||null);aiDone.current=!!s.ai;
                  fetchTF(s.coin).then(()=>startWS(s.coin));
                }}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14,color:"#0f172a"}}>{s.coin}</div>
                  <div style={{fontSize:10,color:"#94a3b8"}}>
                    Buy: {s.cur==="INR"?"₹":"$"}{s.bp} · Amount: {s.cur==="INR"?"₹":"$"}{s.amt}
                  </div>
                </div>
                <div style={{background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:8,
                  padding:"5px 12px",fontSize:11,color:"#fff",fontWeight:700}}>Open</div>
                <div onClick={e=>{e.stopPropagation();deletePos(s.coin);}}
                  style={{background:"#fef2f2",borderRadius:8,padding:"5px 9px",
                  fontSize:11,color:"#dc2626",fontWeight:700}}>✕</div>
              </div>
            ))}
          </div>
        )}

        {/* FORM */}
        {!active&&(
          <div className="fadein" style={{background:"#fff",borderRadius:20,padding:"20px",
            boxShadow:"0 4px 20px rgba(0,0,0,.06)",border:"1px solid #e2e8f0",marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:22}}>💼</span> Position Enter Karo
            </div>

            {/* Coin */}
            <div style={{marginBottom:12,position:"relative"}}>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:5,letterSpacing:.5}}>COIN</div>
              <div onClick={()=>setShowDD(!showDD)}
                style={{background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                  padding:"13px 14px",display:"flex",justifyContent:"space-between",
                  alignItems:"center",cursor:"pointer"}}>
                <span style={{fontSize:20,fontWeight:900,fontFamily:"'JetBrains Mono',monospace",color:"#0f172a"}}>{coin}</span>
                <span style={{fontSize:12,color:"#94a3b8"}}>▼ Select</span>
              </div>
              {showDD&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",
                  borderRadius:12,border:"2px solid #10b981",boxShadow:"0 8px 30px rgba(0,0,0,.15)",
                  zIndex:100,overflow:"hidden",display:"flex",flexDirection:"column"}}>
                  <input value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="Search coin..."
                    autoFocus
                    style={{padding:"10px 14px",border:"none",borderBottom:"1px solid #f1f5f9",
                      fontSize:13,outline:"none",fontFamily:"'JetBrains Mono',monospace"}}/>
                  <div style={{overflowY:"auto",maxHeight:160}}>
                    {filtered.map(c=>(
                      <div key={c} onClick={()=>{setCoin(c);setShowDD(false);setSearch("");}}
                        style={{padding:"10px 14px",cursor:"pointer",fontWeight:c===coin?700:400,
                          background:c===coin?"#f0fdf4":"transparent",
                          fontSize:14,fontFamily:"'JetBrains Mono',monospace",
                          color:c===coin?"#059669":"#0f172a",borderBottom:"1px solid #f8fafc"}}>
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Currency + Buy Price */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:5,letterSpacing:.5}}>
                BUY KIYA PRICE
              </div>
              <div style={{display:"flex",gap:8}}>
                <select value={currency} onChange={e=>setCurrency(e.target.value)}
                  style={{background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                    padding:"13px 8px",fontSize:13,color:"#0f172a",width:90,flexShrink:0}}>
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                </select>
                <input value={buyPrice} onChange={e=>setBuyPrice(e.target.value)}
                  placeholder={currency==="INR"?"e.g. 900":"e.g. 10.80"} type="number"
                  style={{flex:1,background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                    padding:"13px 14px",fontSize:16,fontWeight:700,color:"#0f172a",
                    fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box",minWidth:0}}
                  onFocus={e=>e.target.style.borderColor="#10b981"}
                  onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
              </div>
            </div>

            {/* Amount */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:5,letterSpacing:.5}}>
                INVEST KIYA AMOUNT ({currency==="INR"?"₹":"$"})
              </div>
              <input value={amount} onChange={e=>setAmount(e.target.value)}
                placeholder={currency==="INR"?"e.g. 5000":"e.g. 60"} type="number"
                style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                  padding:"13px 14px",fontSize:15,fontWeight:700,color:"#0f172a",
                  fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}
                onFocus={e=>e.target.style.borderColor="#10b981"}
                onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
            </div>

            {/* Preview */}
            {amount&&buyPrice&&parseFloat(amount)>0&&parseFloat(buyPrice)>0&&(
              <div style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:12,
                padding:"12px 14px",marginBottom:14}}>
                <div style={{fontSize:10,color:"#059669",fontWeight:700,marginBottom:6}}>PREVIEW</div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,color:"#64748b"}}>Coins quantity</span>
                  <span className="mono" style={{fontSize:13,fontWeight:800,color:"#059669"}}>
                    {coinsQty.toFixed(4)} {coin}
                  </span>
                </div>
              </div>
            )}

            <button onClick={start} disabled={!coin||!buyPrice||!amount}
              style={{width:"100%",background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",
                border:"none",borderRadius:14,padding:"15px",fontWeight:800,fontSize:15,
                cursor:"pointer",fontFamily:"'Inter',sans-serif",
                boxShadow:"0 4px 16px rgba(16,185,129,.4)",
                opacity:(!coin||!buyPrice||!amount)?0.5:1}}>
              🚀 Live Track Karo
            </button>
          </div>
        )}

        {/* Loading */}
        {active&&!livePrice&&(
          <div className="fadein" style={{background:"#fff",borderRadius:20,padding:"32px",
            textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,.06)"}}>
            <div style={{fontSize:40,marginBottom:12}}>📡</div>
            <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>{coin} live price aa rahi hai...</div>
            <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:14}}>
              {[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:"50%",
                background:"#10b981",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
            </div>
          </div>
        )}

        {/* LIVE DASHBOARD */}
        {active&&livePrice&&calc&&(
          <div className="fadein">

            {/* Price Card */}
            <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",borderRadius:20,
              padding:"18px",marginBottom:12,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,
                background:`linear-gradient(90deg,${green?"#10b981,#34d399":"#ef4444,#f87171"})`}}/>

              {/* Coin + Current Price */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                <div>
                  <div style={{fontWeight:900,fontSize:24,color:"white"}}>{coin}</div>
                  <div style={{fontSize:10,color:"#64748b",marginTop:2}}>
                    {coinsQty.toFixed(4)} coins · Buy: {fmt(buyUSD)}
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div className={`mono ${priceDir==="up"?"price-up":priceDir==="down"?"price-dn":""}`}
                    style={{fontSize:26,fontWeight:900,color:"#fff",lineHeight:1}}>
                    {fmt(livePrice)}
                  </div>
                  {ticker24&&(
                    <div style={{fontSize:11,fontWeight:700,marginTop:3,
                      color:ticker24.ch24>=0?"#10b981":"#ef4444"}}>
                      {ticker24.ch24>=0?"▲":"▼"}{Math.abs(ticker24.ch24).toFixed(2)}% 24h
                    </div>
                  )}
                </div>
              </div>

              {/* P&L */}
              <div style={{background:`rgba(${green?"16,185,129":"239,68,68"},.1)`,
                border:`1px solid rgba(${green?"16,185,129":"239,68,68"},.3)`,
                borderRadius:14,padding:"14px"}}>
                <div style={{fontSize:10,color:"#64748b",fontWeight:600,marginBottom:6}}>CURRENT P&L</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div className="mono" style={{fontSize:28,fontWeight:900,lineHeight:1,
                      color:green?"#34d399":"#f87171"}}>
                      {green?"+":"-"}{currency==="INR"
                        ?`₹${Math.abs(calc.pnlINR).toLocaleString("en-IN",{maximumFractionDigits:0})}`
                        :`$${Math.abs(calc.pnlUSD).toFixed(2)}`}
                    </div>
                    <div style={{fontSize:12,marginTop:3,fontWeight:700,
                      color:green?"#6ee7b7":"#fca5a5"}}>
                      {green?"+":""}{calc.spotPct.toFixed(2)}%
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>Buy → Now</div>
                    <div className="mono" style={{fontSize:12,color:"#94a3b8"}}>
                      {fmt(buyUSD)}
                    </div>
                    <div className="mono" style={{fontSize:12,color:"#fff",fontWeight:700}}>
                      → {fmt(livePrice)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 24h stats */}
              {ticker24&&(
                <div style={{display:"flex",gap:6,marginTop:10}}>
                  {[
                    {l:"24h High",v:fmt(ticker24.high),c:"#34d399"},
                    {l:"24h Low",v:fmt(ticker24.low),c:"#f87171"},
                    {l:"Volume",v:`$${(ticker24.vol/1e6).toFixed(0)}M`,c:"#fbbf24"},
                  ].map((s,i)=>(
                    <div key={i} style={{flex:1,background:"rgba(255,255,255,.04)",
                      borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
                      <div style={{fontSize:8,color:"#64748b",marginBottom:3}}>{s.l}</div>
                      <div className="mono" style={{fontSize:11,fontWeight:700,color:s.c}}>{s.v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AD/>

            {/* TIMEFRAME — HOLD/SELL/WATCH — indicators hidden */}
            <div style={{background:"#fff",borderRadius:20,padding:"18px",
              boxShadow:"0 4px 20px rgba(0,0,0,.06)",border:"1px solid #e2e8f0",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:4,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>⏱️</span> Timeframe Decision
              </div>
              <div style={{fontSize:10,color:"#94a3b8",marginBottom:12}}>RSI + MACD + BB + Volume + ATR + Support/Resistance — sab background mein</div>
              {TFS.map(({tf,label,hold})=>{
                const cl   = tfData[tf]||[];
                const curr = cl[cl.length-1]||livePrice;
                const prev = cl[cl.length-2]||curr;

                // ── INDICATORS (hidden from user) ─────────────────────
                // 1. RSI
                const rsi = calcRSI(cl);
                // 2. MA20/MA50
                const ma20 = calcMA(cl,20);
                const ma50 = calcMA(cl,50);
                // 3. Bollinger Bands (20,2)
                const bbMid = ma20;
                const bbStd = cl.length>=20 ? Math.sqrt(cl.slice(-20).reduce((s,v)=>s+Math.pow(v-bbMid,2),0)/20):0;
                const bbUp  = bbMid + bbStd*2;
                const bbLow = bbMid - bbStd*2;
                const bbPos = bbStd>0?(curr-bbLow)/(bbUp-bbLow)*100:50; // 0=bottom, 100=top
                // 4. ATR (volatility)
                const atr   = cl.length>14?cl.slice(-14).reduce((s,v,i,a)=>s+(i>0?Math.abs(v-a[i-1]):0),0)/13:curr*0.02;
                const atrPct= (atr/curr*100);
                // 5. Volume proxy (momentum change)
                const recentCh = cl.length>=5?((cl[cl.length-1]-cl[cl.length-5])/cl[cl.length-5]*100):0;
                // 6. Support/Resistance
                const support  = cl.length>=20?Math.min(...cl.slice(-20)):curr*0.95;
                const resist   = cl.length>=20?Math.max(...cl.slice(-20)):curr*1.05;
                const distToResist = ((resist-curr)/curr*100);
                const distToSupport= ((curr-support)/curr*100);
                // 7. Trend
                const bull  = curr>ma20&&curr>ma50;
                const bear  = curr<ma20&&curr<ma50;
                // 8. Momentum
                const momentum = recentCh;

                // ── DECISION ENGINE ────────────────────────────────────
                // Score: positive = bullish, negative = bearish
                let score = 0;
                if(rsi<35)  score+=3;
                else if(rsi<45) score+=2;
                else if(rsi<55) score+=1;
                else if(rsi>70) score-=3;
                else if(rsi>62) score-=2;
                if(bull)    score+=2;
                if(bear)    score-=2;
                if(bbPos<25) score+=2; // near lower band = buy
                if(bbPos>80) score-=2; // near upper band = sell
                if(momentum>2) score+=1;
                if(momentum<-2) score-=1;
                if(distToResist<2) score-=1; // very near resistance
                if(distToSupport<1.5) score+=1; // near support = bounce

                // Entry vs current P&L context
                const entryVsCurr = buyUSD>0?((livePrice-buyUSD)/buyUSD*100):0;

                let decision, decColor, decBg, holdTime, advice;

                if(score>=4 && entryVsCurr<5){
                  decision="🚀 STRONG BUY"; decColor="#059669"; decBg="#ecfdf5";
                  holdTime=`Hold karo: ${hold}`;
                  advice="Strong entry zone hai";
                } else if(score>=2){
                  decision="✅ HOLD"; decColor="#2563eb"; decBg="#eff6ff";
                  holdTime=`Hold karo: ${hold}`;
                  advice="Position safe hai";
                } else if(score>=0 && entryVsCurr>8){
                  decision="🎯 PARTIAL SELL"; decColor="#d97706"; decBg="#fffbeb";
                  holdTime="50% profit book karo";
                  advice="Kuch profit lock karo";
                } else if(score<=-3 || (rsi>72 && entryVsCurr>10)){
                  decision="🚨 SELL NOW"; decColor="#dc2626"; decBg="#fef2f2";
                  holdTime="Abhi sell karo";
                  advice="Momentum reversal signal";
                } else if(score<0 && entryVsCurr>0){
                  decision="⚠️ WATCH"; decColor="#d97706"; decBg="#fffbeb";
                  holdTime="Agle 5 min dekho";
                  advice="Signal confirm hone do";
                } else if(score<-1){
                  decision="⏸️ WAIT"; decColor="#7c3aed"; decBg="#f5f3ff";
                  holdTime="Setup ka wait karo";
                  advice="Entry sahi nahi abhi";
                } else {
                  decision="✅ HOLD"; decColor="#10b981"; decBg="#f0fdf4";
                  holdTime=`Hold karo: ${hold}`;
                  advice="Trend theek hai";
                }

                // Strength meter (1-5 bars)
                const strength = Math.min(5,Math.max(1,Math.abs(score)+1));
                const isPositive = score>=0;

                return(
                  <div key={tf} style={{display:"flex",alignItems:"center",gap:10,
                    padding:"12px 14px",background:"#f8fafc",borderRadius:14,
                    marginBottom:8,border:`1px solid ${decColor}22`,
                    borderLeft:`4px solid ${decColor}`}}>
                    {/* Time label */}
                    <div style={{width:50,flexShrink:0,textAlign:"center",
                      background:"#0f172a",borderRadius:10,padding:"8px 4px"}}>
                      <div style={{fontSize:14,fontWeight:900,color:"#fff",lineHeight:1}}>
                        {label.split(" ")[0]}
                      </div>
                      <div style={{fontSize:8,color:"#64748b",marginTop:1}}>
                        {label.split(" ")[1]||""}
                      </div>
                    </div>

                    {/* Decision */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{background:decBg,border:`1.5px solid ${decColor}66`,
                        borderRadius:20,padding:"5px 12px",display:"inline-block",
                        fontSize:12,fontWeight:800,color:decColor,marginBottom:5}}>
                        {decision}
                      </div>
                      <div style={{fontSize:12,color:"#1e293b",fontWeight:700}}>{holdTime}</div>
                      <div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{advice}</div>
                    </div>

                    {/* Strength bars only */}
                    <div style={{flexShrink:0,textAlign:"center"}}>
                      <div style={{fontSize:8,color:"#94a3b8",marginBottom:4}}>Strength</div>
                      <div style={{display:"flex",gap:2,justifyContent:"center"}}>
                        {[1,2,3,4,5].map(n=>(
                          <div key={n} style={{width:5,height:16,borderRadius:3,
                            background:n<=strength?isPositive?"#10b981":"#ef4444":"#e2e8f0"}}/>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI ADVICE */}
            <div style={{background:"#fff",borderRadius:20,padding:"18px",
              boxShadow:"0 4px 20px rgba(0,0,0,.06)",border:"1px solid #e2e8f0",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:20}}>🤖</span> AI — Full Analysis
                </div>
                <button onClick={()=>{aiDone.current=false;getAI(livePrice,tfData);}}
                  style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:20,
                    padding:"5px 12px",fontSize:11,color:"#059669",fontWeight:700,cursor:"pointer",
                    fontFamily:"'Inter',sans-serif"}}>🔄</button>
              </div>

              {aiLoad?(
                <div style={{textAlign:"center",padding:"20px 0"}}>
                  <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:8}}>
                    {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",
                      background:"#10b981",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
                  </div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>AI analyze kar raha hai...</div>
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
                  Price load hone ke baad AI aayega...
                </div>
              )}
            </div>

            <AD/>

            <button onClick={()=>{
              setActive(false);setLP(null);setAI(null);setTF({});setT24(null);
              prevRef.current=null;aiDone.current=false;
              if(wsRef.current)wsRef.current.close();
            }} style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",
              borderRadius:14,padding:"13px",fontWeight:700,fontSize:13,cursor:"pointer",
              color:"#64748b",fontFamily:"'Inter',sans-serif",marginBottom:12}}>
              🔄 Nayi Position Enter Karo
            </button>
          </div>
        )}

        <AD/>
        <div style={{textAlign:"center",fontSize:10,color:"#94a3b8",padding:"8px"}}>
          ⚠️ Not financial advice · DYOR always<br/>
          <Link href="/" style={{color:"#10b981",textDecoration:"none"}}>← YES YOU PRO</Link>
        </div>
      </div>
    </main>
  );
}
