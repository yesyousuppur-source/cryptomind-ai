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

function calcRSI(closes) {
  if(closes.length<15)return 50;
  let ag=0,al=0;
  for(let i=1;i<=14;i++){const d=closes[i]-closes[i-1];d>0?ag+=d:al+=Math.abs(d);}
  ag/=14;al/=14;
  for(let i=15;i<closes.length;i++){const d=closes[i]-closes[i-1];ag=(ag*13+(d>0?d:0))/14;al=(al*13+(d<0?Math.abs(d):0))/14;}
  return al===0?100:Math.round(100-100/(1+ag/al));
}
function calcMA(cl,n){if(cl.length<n)return cl[cl.length-1]||0;return cl.slice(-n).reduce((a,b)=>a+b,0)/n;}
function fmtP(n){if(!n&&n!==0)return"—";return n>=1?"$"+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):"$"+n.toPrecision(5);}

const TFS=[
  {tf:"5m",label:"5 Min",interval:"5m"},
  {tf:"15m",label:"15 Min",interval:"15m"},
  {tf:"30m",label:"30 Min",interval:"30m"},
  {tf:"1h",label:"1 Hour",interval:"1h"},
  {tf:"2h",label:"2 Hour",interval:"2h"},
  {tf:"4h",label:"4 Hour",interval:"4h"},
];

export default function TradePage(){
  const [coin,setCoin]=useState("APT");
  const [buyPrice,setBuyPrice]=useState("");
  const [amount,setAmount]=useState("");
  const [currency,setCurrency]=useState("INR");
  const [leverage,setLeverage]=useState(1);
  const [active,setActive]=useState(false);
  const [livePrice,setLivePrice]=useState(null);
  const [priceDir,setPriceDir]=useState(null);
  const [ticker24,setTicker24]=useState(null);
  const [lastUpd,setLastUpd]=useState("");
  const [tfData,setTfData]=useState({});
  const [aiAdvice,setAiAdvice]=useState(null);
  const [aiLoad,setAiLoad]=useState(false);
  const wsRef=useRef(null);
  const prevRef=useRef(null);
  const aiDoneRef=useRef(false);

  const startWS=useCallback((sym)=>{
    if(wsRef.current)wsRef.current.close();
    const ws=new WebSocket(`wss://stream.binance.com:9443/ws/${sym.toLowerCase()}usdt@ticker`);
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

  const fetchAllTF=useCallback(async(sym)=>{
    const res={};
    await Promise.allSettled(TFS.map(async({tf,interval})=>{
      try{const r=await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=${interval}&limit=60`);
        if(r.ok){const j=await r.json();res[tf]=j.map(k=>parseFloat(k[4]));}}catch(_){}
    }));
    setTfData(res);return res;
  },[]);

  const startTracking=async()=>{
    if(!coin||!buyPrice||!amount)return;
    const sym=coin.toUpperCase();
    setActive(true);setAiAdvice(null);aiDoneRef.current=false;
    await fetchAllTF(sym);
    startWS(sym);
  };

  const fetchAI=useCallback(async(price,tf)=>{
    if(!price)return;
    setAiLoad(true);
    try{
      const eUSD=currency==="INR"?parseFloat(buyPrice)/USD_INR:parseFloat(buyPrice);
      const aUSD=currency==="INR"?parseFloat(amount)/USD_INR:parseFloat(amount);
      const pnl=((price-eUSD)/eUSD*100).toFixed(2);
      const lpnl=(parseFloat(pnl)*leverage).toFixed(2);
      const tfS=TFS.map(({tf:t,label})=>{
        const cl=tf[t]||[];
        return `${label}: RSI ${calcRSI(cl)}, ${cl[cl.length-1]>calcMA(cl,20)?"Uptrend":"Downtrend"}`;
      }).join("\n");
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"compare",systemPrompt:`Crypto trade analysis for Indian investor:
Coin: ${coin.toUpperCase()}
Entry: $${eUSD.toFixed(6)} | Current: $${price.toFixed(6)}
Spot P&L: ${pnl}% | Leveraged P&L: ${lpnl}% (${leverage}x)
Investment: ${currency==="INR"?"₹"+parseFloat(amount).toLocaleString():"$"+aUSD.toFixed(0)}

TIMEFRAMES:
${tfS}

EXACT format (Hinglish):
📊 OVERALL: [HOLD / PARTIAL SELL / SELL / ADD MORE]
💡 REASON: [2 lines]

⏱️ 5 MIN: [action] — [reason]
⏱️ 15 MIN: [action] — [reason]
⏱️ 30 MIN: [action] — [reason]
⏱️ 1 HOUR: [action] — [reason]
⏱️ 2 HOUR: [action] — [reason]
⏱️ 4 HOUR: [action] — [reason]

🎯 TP1: $[price] (+[%]%) — [% book karo]
🎯 TP2: $[price] (+[%]%) — [% book karo]
🎯 TP3: $[price] (+[%]%) — [% book karo]
🛑 STOP LOSS: $[price] (-[%]%)
💰 PROFIT BOOKING: [advice]
⚠️ RISK: [1 line]`})});
      const j=await r.json();
      setAiAdvice(j.text||"");
    }catch(_){}
    setAiLoad(false);
  },[coin,buyPrice,amount,currency,leverage]);

  useEffect(()=>{
    if(!active||!livePrice||Object.keys(tfData).length===0||aiDoneRef.current)return;
    aiDoneRef.current=true;
    fetchAI(livePrice,tfData);
  },[active,livePrice,tfData]);

  useEffect(()=>{
    if(!active)return;
    const t=setInterval(()=>{if(livePrice&&Object.keys(tfData).length>0)fetchAI(livePrice,tfData);},180000);
    return()=>clearInterval(t);
  },[active,livePrice,tfData,fetchAI]);

  useEffect(()=>{return()=>{if(wsRef.current)wsRef.current.close();};},[]);

  const calc=(()=>{
    if(!active||!livePrice||!buyPrice||!amount)return null;
    const eUSD=currency==="INR"?parseFloat(buyPrice)/USD_INR:parseFloat(buyPrice);
    const aUSD=currency==="INR"?parseFloat(amount)/USD_INR:parseFloat(amount);
    if(isNaN(eUSD)||eUSD<=0)return null;
    const pPct=(livePrice-eUSD)/eUSD*100;
    const lPct=pPct*leverage;
    const pUSD=aUSD*lPct/100;
    const pINR=pUSD*USD_INR;
    const liq=leverage>1?eUSD*(1-0.9/leverage):null;
    return{eUSD,aUSD,pPct,lPct,pUSD,pINR,liq};
  })();
  const green=calc&&calc.lPct>=0;

  return(
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f0fdf8",minHeight:"100vh",
      color:"#0f172a",overflowX:"hidden",paddingBottom:40}}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes pg{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.4)}50%{box-shadow:0 0 0 8px rgba(16,185,129,0)}}
        @keyframes up{0%{color:#34d399;transform:scale(1.05)}100%{color:#fff;transform:scale(1)}}
        @keyframes dn{0%{color:#f87171;transform:scale(1.05)}100%{color:#fff;transform:scale(1)}}
        .fadein{animation:fadein .3s ease}
        .mono{font-family:'JetBrains Mono',monospace}
        .up{animation:up .5s ease}
        .dn{animation:dn .5s ease}
        input[type=range]{-webkit-appearance:none;width:100%;height:8px;border-radius:4px;
          background:linear-gradient(90deg,#10b981 0%,#10b981 var(--v,2%),#e2e8f0 var(--v,2%));outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;
          border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);cursor:pointer;
          box-shadow:0 2px 10px rgba(16,185,129,.5);border:2px solid #fff}
      `}</style>

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
        <div style={{fontSize:11,color:"#64748b"}}>Position track · 6 Timeframe AI advice</div>
      </div>

      <div style={{padding:"14px"}}>
        <AD/>

        {/* FORM */}
        {!active&&(
          <div className="fadein" style={{background:"#fff",borderRadius:20,padding:"20px",
            boxShadow:"0 4px 20px rgba(0,0,0,.06)",border:"1px solid #e2e8f0",marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:22}}>💼</span> Apni Trade Enter Karo
            </div>

            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:5,letterSpacing:.5}}>COIN</div>
              <input value={coin} onChange={e=>setCoin(e.target.value.toUpperCase())}
                placeholder="BTC, ETH, APT, SOL..."
                style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                  padding:"13px 14px",fontSize:18,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",
                  color:"#0f172a",boxSizing:"border-box"}}
                onFocus={e=>e.target.style.borderColor="#10b981"}
                onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
            </div>

            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:5,letterSpacing:.5}}>BUY KIYA PRICE</div>
              <div style={{display:"flex",gap:8}}>
                <select value={currency} onChange={e=>setCurrency(e.target.value)}
                  style={{background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                    padding:"13px 8px",fontSize:13,color:"#0f172a",width:85,flexShrink:0}}>
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                </select>
                <input value={buyPrice} onChange={e=>setBuyPrice(e.target.value)}
                  placeholder={currency==="INR"?"Jis price pe kharida e.g. 710":"e.g. 8.50"} type="number"
                  style={{flex:1,background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                    padding:"13px 14px",fontSize:14,fontWeight:700,color:"#0f172a",
                    fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box",minWidth:0}}
                  onFocus={e=>e.target.style.borderColor="#10b981"}
                  onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:5,letterSpacing:.5}}>INVEST KIYA AMOUNT</div>
              <input value={amount} onChange={e=>setAmount(e.target.value)}
                placeholder={currency==="INR"?"₹ e.g. 5000":"$ e.g. 60"} type="number"
                style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                  padding:"13px 14px",fontSize:14,fontWeight:700,color:"#0f172a",
                  fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}
                onFocus={e=>e.target.style.borderColor="#10b981"}
                onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
            </div>

            {/* LEVERAGE SLIDER */}
            <div style={{marginBottom:20}}>
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
              {leverage>1&&(
                <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",
                  borderRadius:10,padding:"8px 12px",marginTop:8,fontSize:11,color:"#dc2626",fontWeight:600}}>
                  ⚠️ {leverage}x = Profit bhi {leverage}x • Loss bhi {leverage}x
                </div>
              )}
            </div>

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
            <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>{coin.toUpperCase()} price fetch ho rahi hai...</div>
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

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontWeight:900,fontSize:22,color:"white"}}>{coin.toUpperCase()}/USDT</div>
                  <div style={{fontSize:10,color:"#64748b"}}>{leverage}x leverage · {currency==="INR"?"₹":"$"}{parseFloat(amount).toLocaleString()}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div className={`mono ${priceDir==="up"?"up":priceDir==="down"?"dn":""}`}
                    style={{fontSize:24,fontWeight:900,
                      color:priceDir==="up"?"#34d399":priceDir==="down"?"#f87171":"#fff"}}>
                    {fmtP(livePrice)}
                  </div>
                  {ticker24&&<div style={{fontSize:11,color:ticker24.ch24>=0?"#10b981":"#ef4444",fontWeight:700}}>
                    {ticker24.ch24>=0?"▲":"▼"}{Math.abs(ticker24.ch24).toFixed(2)}% 24h
                  </div>}
                </div>
              </div>

              {/* P&L */}
              <div style={{background:"rgba(255,255,255,.07)",borderRadius:14,padding:"14px",
                border:`1px solid ${green?"rgba(16,185,129,.3)":"rgba(239,68,68,.3)"}`}}>
                <div style={{fontSize:10,color:"#64748b",fontWeight:600,marginBottom:8}}>
                  TOTAL P&L ({leverage}x leverage)
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                  <div>
                    <div className="mono" style={{fontSize:30,fontWeight:900,lineHeight:1,
                      color:green?"#34d399":"#f87171"}}>
                      {green?"+":"-"}{currency==="INR"
                        ?`₹${Math.abs(calc.pINR).toLocaleString("en-IN",{maximumFractionDigits:0})}`
                        :`$${Math.abs(calc.pUSD).toFixed(2)}`}
                    </div>
                    <div style={{fontSize:12,marginTop:3,fontWeight:700,
                      color:green?"#6ee7b7":"#fca5a5"}}>
                      {green?"+":""}{calc.lPct.toFixed(2)}% leveraged
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>Entry → Current</div>
                    <div className="mono" style={{fontSize:11,color:"#94a3b8"}}>
                      {fmtP(calc.eUSD)} → {fmtP(livePrice)}
                    </div>
                    <div style={{fontSize:10,fontWeight:600,color:green?"#10b981":"#ef4444"}}>
                      {green?"+":""}{calc.pPct.toFixed(2)}% spot
                    </div>
                  </div>
                </div>
                {calc.liq&&leverage>1&&(
                  <div style={{marginTop:10,background:"rgba(239,68,68,.15)",borderRadius:8,
                    padding:"7px 10px",display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:10,color:"#fca5a5",fontWeight:700}}>⚠️ Liquidation Price</span>
                    <span className="mono" style={{fontSize:11,color:"#fca5a5",fontWeight:800}}>{fmtP(calc.liq)}</span>
                  </div>
                )}
              </div>

              <div style={{display:"flex",gap:6,marginTop:10}}>
                {[
                  {l:"24h High",v:ticker24?fmtP(ticker24.high):"—",c:"#34d399"},
                  {l:"24h Low",v:ticker24?fmtP(ticker24.low):"—",c:"#f87171"},
                  {l:"Volume",v:ticker24?`$${(ticker24.vol/1e6).toFixed(0)}M`:"—",c:"#fbbf24"},
                ].map((s,i)=>(
                  <div key={i} style={{flex:1,background:"rgba(255,255,255,.04)",borderRadius:10,
                    padding:"8px 6px",textAlign:"center"}}>
                    <div style={{fontSize:8,color:"#64748b",marginBottom:3}}>{s.l}</div>
                    <div className="mono" style={{fontSize:11,fontWeight:700,color:s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>
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
                const price=cl[cl.length-1]||livePrice;
                const ch=cl.length>=2?((cl[cl.length-1]-cl[cl.length-2])/cl[cl.length-2]*100):0;
                const bull=price>ma20;
                let rec,rc,rb;
                if(rsi<35&&bull){rec="STRONG BUY 🔥";rc="#059669";rb="#ecfdf5";}
                else if(rsi<45&&bull){rec="HOLD / ADD 📈";rc="#10b981";rb="#f0fdf4";}
                else if(rsi>=45&&rsi<=60&&bull){rec="HOLD ✅";rc="#2563eb";rb="#eff6ff";}
                else if(rsi>60&&rsi<70){rec="PARTIAL SELL 🎯";rc="#d97706";rb="#fffbeb";}
                else if(rsi>=70){rec="SELL / BOOK 🚨";rc="#dc2626";rb="#fef2f2";}
                else{rec="WATCH 👀";rc="#d97706";rb="#fffbeb";}
                return(
                  <div key={tf} style={{display:"flex",alignItems:"center",gap:10,
                    padding:"10px 12px",background:"#f8fafc",borderRadius:12,marginBottom:7,
                    border:"1px solid #f1f5f9"}}>
                    <div style={{width:48,flexShrink:0,textAlign:"center",background:"#0f172a",
                      borderRadius:8,padding:"6px 4px"}}>
                      <div style={{fontSize:12,fontWeight:800,color:"#fff"}}>{label.split(" ")[0]}</div>
                      <div style={{fontSize:8,color:"#64748b"}}>{label.split(" ")[1]||"Min"}</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{background:rb,border:`1px solid ${rc}44`,borderRadius:20,
                        padding:"4px 12px",display:"inline-block",fontSize:11,fontWeight:700,color:rc}}>
                        {rec}
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:10,fontWeight:700,
                        color:rsi<35?"#059669":rsi>65?"#ef4444":"#f59e0b"}}>RSI {rsi}</div>
                      <div style={{fontSize:9,color:ch>=0?"#10b981":"#ef4444"}}>
                        {ch>=0?"+":""}{ch.toFixed(2)}%
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
                  <span style={{fontSize:20}}>🤖</span> AI Full Advice
                </div>
                <button onClick={()=>fetchAI(livePrice,tfData)}
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
                  <div style={{fontSize:9,color:"#94a3b8",marginTop:8,textAlign:"right"}}>🔄 Har 3 min mein auto-update</div>
                </div>
              ):(
                <div style={{textAlign:"center",padding:"16px",color:"#94a3b8",fontSize:12}}>
                  Live price aane ke baad AI advice aayegi...
                </div>
              )}
            </div>

            <AD/>

            <button onClick={()=>{setActive(false);setLivePrice(null);setAiAdvice(null);
              setTfData({});setTicker24(null);prevRef.current=null;aiDoneRef.current=false;
              if(wsRef.current)wsRef.current.close();}}
              style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:14,
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
