"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const USD_INR = 83.5;

const AD = () => (
  <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#1f2937",
    border:"1px solid #374151",padding:"4px",margin:"10px 0"}}>
    <div style={{fontSize:9,color:"#4b5563",marginBottom:2,letterSpacing:1}}>ADVERTISEMENT</div>
    <ins className="adsbygoogle" style={{display:"block"}}
      data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO"
      data-ad-format="auto" data-full-width-responsive="true"/>
    <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
  </div>
);

const COINS = [
  "BTC","ETH","SOL","BNB","XRP","ADA","AVAX","DOGE","LINK","DOT",
  "APT","SUI","INJ","ARB","OP","NEAR","TON","UNI","PEPE","TRX",
  "MATIC","LTC","ATOM","FTM","HBAR","XLM","WIF","BONK","ORDI","RUNE",
  "AAVE","GRT","STX","IMX","CFX","THETA","GALA","SAND","MANA","ENJ",
];

// Real exchange data with brand colors
const EXCHANGES = [
  {
    id:"binance", name:"Binance", abbr:"BNB", cur:"USDT",
    bg:"#F0B90B", fg:"#000", textBg:"#181a20",
    logo: ({size=28})=>(
      <div style={{width:size,height:size,borderRadius:6,background:"#F0B90B",
        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <svg width={size*0.65} height={size*0.65} viewBox="0 0 32 32" fill="#000">
          <path d="M16 4L19.5 7.5L13 14L9.5 10.5L16 4ZM22.5 10.5L26 14L16 24L6 14L9.5 10.5L16 17.5L22.5 10.5ZM22.5 17.5L26 21L22.5 24.5L19 21L22.5 17.5ZM9.5 17.5L13 21L9.5 24.5L6 21L9.5 17.5Z"/>
        </svg>
      </div>
    ),
    useWS: true,
    fetch: async(s)=>{
      const r=await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${s}USDT`,{signal:AbortSignal.timeout(4000)});
      const j=await r.json();
      return{price:+j.lastPrice,ch24:+j.priceChangePercent,high:+j.highPrice,low:+j.lowPrice,vol:+j.quoteVolume};
    }
  },
  {
    id:"bybit", name:"Bybit", abbr:"BBT", cur:"USDT",
    bg:"#F7A600", fg:"#000", textBg:"#1a1a2e",
    logo: ({size=28})=>(
      <div style={{width:size,height:size,borderRadius:6,background:"#F7A600",
        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:size*0.38,fontWeight:900,color:"#000",letterSpacing:-1}}>BB</span>
      </div>
    ),
    fetch: async(s)=>{
      const r=await fetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${s}USDT`,{signal:AbortSignal.timeout(4000)});
      const j=await r.json();const t=j.result?.list?.[0];if(!t)throw new Error("No data");
      return{price:+t.lastPrice,ch24:+t.price24hPcnt*100,high:+t.highPrice24h,low:+t.lowPrice24h,vol:+t.turnover24h};
    }
  },
  {
    id:"okx", name:"OKX", abbr:"OKX", cur:"USDT",
    bg:"#000", fg:"#fff", textBg:"#0d0d0d",
    logo: ({size=28})=>(
      <div style={{width:size,height:size,borderRadius:6,background:"#000",border:"1px solid #333",
        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:size*0.32,fontWeight:900,color:"#fff",letterSpacing:-0.5}}>OKX</span>
      </div>
    ),
    fetch: async(s)=>{
      const r=await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${s}-USDT`,{signal:AbortSignal.timeout(4000)});
      const j=await r.json();const t=j.data?.[0];if(!t)throw new Error("No data");
      return{price:+t.last,ch24:(+t.last-+t.open24h)/+t.open24h*100,high:+t.high24h,low:+t.low24h,vol:+t.volCcy24h};
    }
  },
  {
    id:"mexc", name:"MEXC", abbr:"MXC", cur:"USDT",
    bg:"#23C088", fg:"#fff", textBg:"#0a1628",
    logo: ({size=28})=>(
      <div style={{width:size,height:size,borderRadius:6,background:"#23C088",
        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:size*0.32,fontWeight:900,color:"#fff"}}>MX</span>
      </div>
    ),
    fetch: async(s)=>{
      const r=await fetch(`https://api.mexc.com/api/v3/ticker/24hr?symbol=${s}USDT`,{signal:AbortSignal.timeout(4000)});
      const j=await r.json();
      return{price:+j.lastPrice,ch24:+j.priceChangePercent,high:+j.highPrice,low:+j.lowPrice,vol:+j.quoteVolume};
    }
  },
  {
    id:"gate", name:"Gate.io", abbr:"GT", cur:"USDT",
    bg:"#2354E6", fg:"#fff", textBg:"#0a0f2e",
    logo: ({size=28})=>(
      <div style={{width:size,height:size,borderRadius:6,background:"#2354E6",
        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:size*0.32,fontWeight:900,color:"#fff"}}>GT</span>
      </div>
    ),
    fetch: async(s)=>{
      const r=await fetch(`https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${s}_USDT`,{signal:AbortSignal.timeout(4000)});
      const j=await r.json();const t=j[0];if(!t)throw new Error("No data");
      return{price:+t.last,ch24:+t.change_percentage,high:+t.high_24h,low:+t.low_24h,vol:+t.quote_volume};
    }
  },
  {
    id:"wazirx", name:"WazirX", abbr:"WRX", cur:"INR",
    bg:"#1A3A5F", fg:"#fff", textBg:"#0d1f33",
    logo: ({size=28})=>(
      <div style={{width:size,height:size,borderRadius:6,background:"linear-gradient(135deg,#1A3A5F,#2563eb)",
        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:size*0.32,fontWeight:900,color:"#fff"}}>WX</span>
      </div>
    ),
    fetch: async(s)=>{
      const r=await fetch(`https://api.wazirx.com/sapi/v1/ticker/24hr?symbol=${s.toLowerCase()}inr`,{signal:AbortSignal.timeout(4000)});
      const j=await r.json();
      return{price:+j.lastPrice,ch24:+j.priceChangePercent,high:+j.highPrice,low:+j.lowPrice,vol:+j.quoteVolume};
    }
  },
  {
    id:"coindcx", name:"CoinDCX", abbr:"DCX", cur:"INR",
    bg:"#0033FF", fg:"#fff", textBg:"#00003f",
    logo: ({size=28})=>(
      <div style={{width:size,height:size,borderRadius:6,background:"#0033FF",
        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:size*0.3,fontWeight:900,color:"#fff"}}>DCX</span>
      </div>
    ),
    fetch: async(s)=>{
      const r=await fetch(`https://api.coindcx.com/exchange/ticker`,{signal:AbortSignal.timeout(4000)});
      const j=await r.json();const t=j.find(x=>x.market===`${s}INR`);if(!t)throw new Error("Not found");
      return{price:+t.last_price,ch24:+t.change_24_hour||0,high:+t.high,low:+t.low,vol:+t.volume};
    }
  },
  {
    id:"bitget", name:"Bitget", abbr:"BG", cur:"USDT",
    bg:"#00CDD1", fg:"#000", textBg:"#001f20",
    logo: ({size=28})=>(
      <div style={{width:size,height:size,borderRadius:6,background:"#00CDD1",
        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:size*0.32,fontWeight:900,color:"#000"}}>BG</span>
      </div>
    ),
    fetch: async(s)=>{
      const r=await fetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${s}USDT`,{signal:AbortSignal.timeout(4000)});
      const j=await r.json();const t=j.data?.[0];if(!t)throw new Error("No data");
      return{price:+t.lastPr,ch24:+t.change24h*100,high:+t.high24h,low:+t.low24h,vol:+t.usdtVolume};
    }
  },
  {
    id:"kucoin", name:"KuCoin", abbr:"KC", cur:"USDT",
    bg:"#26A17B", fg:"#fff", textBg:"#001a14",
    logo: ({size=28})=>(
      <div style={{width:size,height:size,borderRadius:6,background:"#26A17B",
        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:size*0.32,fontWeight:900,color:"#fff"}}>KC</span>
      </div>
    ),
    fetch: async(s)=>{
      const r=await fetch(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${s}-USDT`,{signal:AbortSignal.timeout(4000)});
      const j=await r.json();
      return{price:+j.data.price,ch24:0,high:0,low:0,vol:0};
    }
  },
  {
    id:"htx", name:"HTX", abbr:"HTX", cur:"USDT",
    bg:"#1565C0", fg:"#fff", textBg:"#001133",
    logo: ({size=28})=>(
      <div style={{width:size,height:size,borderRadius:6,background:"linear-gradient(135deg,#1565C0,#0288D1)",
        display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:size*0.3,fontWeight:900,color:"#fff"}}>HTX</span>
      </div>
    ),
    fetch: async(s)=>{
      const r=await fetch(`https://api.huobi.pro/market/detail/merged?symbol=${s.toLowerCase()}usdt`,{signal:AbortSignal.timeout(4000)});
      const j=await r.json();const t=j.tick;
      return{price:+t.close,ch24:(+t.close-+t.open)/+t.open*100,high:+t.high,low:+t.low,vol:+t.amount};
    }
  },
];

const TFS=[
  {tf:"5m",label:"5 Min",interval:"5m"},
  {tf:"15m",label:"15 Min",interval:"15m"},
  {tf:"1h",label:"1 Hour",interval:"1h"},
  {tf:"4h",label:"4 Hour",interval:"4h"},
];

function rsi(cl){if(cl.length<15)return 50;let ag=0,al=0;for(let i=1;i<=14;i++){const d=cl[i]-cl[i-1];d>0?ag+=d:al+=Math.abs(d);}ag/=14;al/=14;for(let i=15;i<cl.length;i++){const d=cl[i]-cl[i-1];ag=(ag*13+(d>0?d:0))/14;al=(al*13+(d<0?Math.abs(d):0))/14;}return al===0?100:Math.round(100-100/(1+ag/al));}
function ma(cl,n){if(cl.length<n)return cl[cl.length-1]||0;return cl.slice(-n).reduce((a,b)=>a+b,0)/n;}
function bb(cl,n=20){const m=ma(cl,n);if(cl.length<n)return{u:m*1.02,l:m*0.98,m};const s=Math.sqrt(cl.slice(-n).reduce((v,c)=>v+Math.pow(c-m,2),0)/n);return{u:m+s*2,l:m-s*2,m};}

export default function TradePage(){
  const [coin,setCoin]=useState("APT");
  const [srch,setSrch]=useState("");
  const [showDD,setDD]=useState(false);
  const [exId,setEx]=useState("binance");
  const [dir,setDir]=useState("long");
  const [margin,setMargin]=useState("");
  const [entry,setEntry]=useState("");
  const [dispCur,setDisp]=useState("INR");
  const [active,setActive]=useState(false);
  const [lp,setLP]=useState(null);
  const [pd,setPD]=useState(null);
  const [t24,setT24]=useState(null);
  const [lu,setLU]=useState("");
  const [tfd,setTFD]=useState({});
  const [ai,setAI]=useState(null);
  const [ail,setAIL]=useState(false);
  const [saved,setSaved]=useState([]);
  const [err,setErr]=useState("");
  const ivRef=useRef(null);
  const wsRef=useRef(null);
  const prevRef=useRef(null);
  const aiDone=useRef(false);

  const ex=EXCHANGES.find(e=>e.id===exId)||EXCHANGES[0];
  const isINR=ex.cur==="INR";
  const filtered=COINS.filter(c=>c.includes(srch.toUpperCase()));

  // No leverage — simple math
  const entryN=+entry||0;
  const marginN=+margin||0;
  const entryUSD=isINR?entryN:(dispCur==="INR"?entryN/USD_INR:entryN);
  const marginUSD=dispCur==="INR"?marginN/USD_INR:marginN;
  const qty=entryUSD>0?marginUSD/entryUSD:0;

  const fmtP=useCallback((usdPrice)=>{
    if(!usdPrice&&usdPrice!==0)return"—";
    const inrP=isINR?usdPrice:usdPrice*USD_INR;
    if(dispCur==="INR")return"₹"+inrP.toLocaleString("en-IN",{maximumFractionDigits:inrP>=100?2:4});
    const usdP=isINR?usdPrice/USD_INR:usdPrice;
    return usdP>=1?"$"+usdP.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):"$"+usdP.toPrecision(5);
  },[isINR,dispCur]);

  const pnl=useCallback((livePr)=>{
    if(!livePr||!entryUSD||qty===0)return null;
    const lpBase=isINR?livePr:livePr;
    const epBase=entryUSD;
    const pUSD=dir==="long"?(lpBase-epBase)*qty:(epBase-lpBase)*qty;
    const pINR=pUSD*USD_INR;
    const roe=(pUSD/marginUSD)*100;
    return{pUSD,pINR,roe};
  },[entryUSD,qty,marginUSD,dir,isINR]);

  // localStorage
  useEffect(()=>{
    try{const s=localStorage.getItem("yyp_t3");if(s){const a=JSON.parse(s);setSaved(a);}}catch(_){}
  },[]);

  const save=useCallback((d)=>{
    const p=JSON.parse(localStorage.getItem("yyp_t3")||"[]");
    const u=[d,...p.filter(x=>x.coin!==d.coin)].slice(0,5);
    localStorage.setItem("yyp_t3",JSON.stringify(u));setSaved(u);
  },[]);

  const del=(c)=>{const u=saved.filter(p=>p.coin!==c);localStorage.setItem("yyp_t3",JSON.stringify(u));setSaved(u);};

  // Price fetch
  const fetchPrice=useCallback(async()=>{
    try{
      setErr("");
      const d=await ex.fetch(coin);
      const p=d.price;
      if(prevRef.current!==null)setPD(p>prevRef.current?"up":p<prevRef.current?"down":null);
      prevRef.current=p;
      setLP(p);setT24(d);setLU(new Date().toLocaleTimeString("en-IN"));
    }catch(e){setErr(e.message);}
  },[coin,ex]);

  // Binance WebSocket for 1-second updates
  const startWS=useCallback((sym)=>{
    if(wsRef.current)wsRef.current.close();
    const ws=new WebSocket(`wss://stream.binance.com:9443/ws/${sym.toLowerCase()}usdt@ticker`);
    ws.onmessage=(e)=>{
      const d=JSON.parse(e.data);const p=+d.c;
      if(prevRef.current!==null)setPD(p>prevRef.current?"up":p<prevRef.current?"down":null);
      prevRef.current=p;setLP(p);
      setT24({price:p,ch24:+d.P,high:+d.h,low:+d.l,vol:+d.q});
      setLU(new Date().toLocaleTimeString("en-IN"));
    };
    ws.onerror=()=>{ws.close();setTimeout(()=>startWS(sym),3000);};
    wsRef.current=ws;
  },[]);

  const fetchTF=useCallback(async()=>{
    const res={};
    await Promise.allSettled(TFS.map(async({tf,interval})=>{
      try{const r=await fetch(`https://api.binance.com/api/v3/klines?symbol=${coin}USDT&interval=${interval}&limit=60`);
        if(r.ok){const j=await r.json();res[tf]=j.map(k=>+k[4]);}}catch(_){}
    }));
    setTFD(res);
  },[coin]);

  const startTracking=async()=>{
    if(!margin||!entry)return;
    setActive(true);setAI(null);aiDone.current=false;setErr("");
    save({coin,exId,dir,margin,entry,dispCur,ts:Date.now()});
    await Promise.all([fetchTF(),
      exId==="binance" ? (startWS(coin), Promise.resolve()) : fetchPrice()
    ]);
    if(exId!=="binance"){
      if(ivRef.current)clearInterval(ivRef.current);
      ivRef.current=setInterval(fetchPrice,1500); // 1.5s for non-Binance
    }
  };

  useEffect(()=>{
    if(!active)return;
    return()=>{
      if(ivRef.current)clearInterval(ivRef.current);
      if(wsRef.current)wsRef.current.close();
    };
  },[active]);

  // AI trigger
  useEffect(()=>{
    if(!active||!lp||Object.keys(tfd).length===0||aiDone.current)return;
    aiDone.current=true;getAI();
  },[active,lp,tfd]);

  useEffect(()=>{
    if(!active)return;
    const t=setInterval(()=>{if(lp&&Object.keys(tfd).length>0)getAI();},180000);
    return()=>clearInterval(t);
  },[active,lp]);

  const getAI=async()=>{
    if(!lp)return;
    setAIL(true);
    try{
      const p=pnl(lp);
      const tfS=TFS.map(({tf,label})=>{
        const cl=tfd[tf]||[];
        const r=rsi(cl);const m20=ma(cl,20);const m50=ma(cl,50);
        const b=bb(cl);
        const atr=cl.length>14?cl.slice(-14).reduce((s,v,i,a)=>s+(i>0?Math.abs(v-a[i-1]):0),0)/13:lp*0.02;
        const sup=cl.length>=20?Math.min(...cl.slice(-20)):lp*0.95;
        const res=cl.length>=20?Math.max(...cl.slice(-20)):lp*1.05;
        return `${label}: RSI=${r}, Above_MA20=${cl[cl.length-1]>m20}, BB_pos=${b.u>b.l?Math.round((lp-b.l)/(b.u-b.l)*100):50}%, ATR=${atr.toFixed(4)}, Support=${sup.toFixed(4)}, Resistance=${res.toFixed(4)}`;
      }).join("\n");
      const prompt=`Expert crypto trader. Open ${dir.toUpperCase()} position (NO leverage):
Coin: ${coin} | Exchange: ${ex.name} | Entry: ${entryN} ${ex.cur}
Current LTP: ${lp.toFixed(4)} ${ex.cur}
Investment: ${dispCur==="INR"?`₹${marginN.toLocaleString()}`:`$${marginN}`}
Qty: ${qty.toFixed(4)} ${coin}
PNL: ₹${p?.pINR?.toFixed(0)||0} | ROE: ${p?.roe?.toFixed(2)||0}%

INDICATORS (4 TFs):
${tfS}

EXACT FORMAT (Hinglish):
📊 DECISION: [HOLD / PARTIAL SELL / SELL NOW / BUY MORE]
💡 REASON: [2 lines]
⏱️ 5 MIN: [HOLD/SELL/WATCH] — [exact time: e.g. 3 min] — [reason]
⏱️ 15 MIN: [HOLD/SELL/WATCH] — [e.g. 10-15 min] — [reason]
⏱️ 1 HOUR: [HOLD/SELL/WATCH] — [e.g. 45 min] — [reason]
⏱️ 4 HOUR: [HOLD/SELL/WATCH] — [e.g. 2-3 hr] — [reason]
🎯 TP1: [${ex.cur} price] — Profit: ₹[amount]
🎯 TP2: [${ex.cur} price] — Profit: ₹[amount]
🛑 SL: [${ex.cur} price] — Loss: ₹[amount]
💰 STRATEGY: [% sell at each target]`;
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"compare",systemPrompt:prompt})});
      const j=await r.json();setAI(j.text||"");
    }catch(_){}
    setAIL(false);
  };

  const reset=()=>{
    setActive(false);setLP(null);setAI(null);setTFD({});setT24(null);
    prevRef.current=null;aiDone.current=false;
    if(ivRef.current)clearInterval(ivRef.current);
    if(wsRef.current)wsRef.current.close();
  };

  const livePnl=lp?pnl(lp):null;
  const green=livePnl&&livePnl.pUSD>=0;
  const Logo=ex.logo;

  return(
    <main style={{fontFamily:"'Inter',sans-serif",background:"#111827",minHeight:"100vh",
      color:"#f1f5f9",overflowX:"hidden",paddingBottom:40}}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes pg{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5)}50%{box-shadow:0 0 0 8px rgba(16,185,129,0)}}
        @keyframes flash{0%{transform:scale(1.05)}100%{transform:scale(1)}}
        .fadein{animation:fadein .3s ease}
        .mono{font-family:'JetBrains Mono',monospace}
        .pu{color:#10b981!important;animation:flash .3s ease}
        .pd{color:#ef4444!important;animation:flash .3s ease}
        input::-webkit-inner-spin-button{-webkit-appearance:none}
        ::-webkit-scrollbar{height:3px}::-webkit-scrollbar-thumb{background:#374151;border-radius:3px}
      `}</style>

      {/* Header */}
      <div style={{background:"#0f172a",borderBottom:"1px solid #1f2937",padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <Link href="/" style={{color:"#6ee7b7",fontSize:12,textDecoration:"none",fontWeight:600}}>← Home</Link>
          {active&&lp&&(
            <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(16,185,129,.1)",
              border:"1px solid rgba(16,185,129,.3)",borderRadius:20,padding:"3px 10px"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:"#10b981",animation:"pg 1.5s infinite"}}/>
              <span style={{fontSize:9,color:"#6ee7b7",fontWeight:700}}>LIVE · {lu}</span>
            </div>
          )}
        </div>
        <div style={{fontWeight:900,fontSize:20,color:"white"}}>📈 Trade Manager</div>
        <div style={{fontSize:10,color:"#6b7280"}}>No leverage · Real exchange prices · AI advice</div>
      </div>

      <div style={{padding:"12px"}}>
        <AD/>

        {/* Saved positions */}
        {!active&&saved.length>0&&(
          <div style={{background:"#1f2937",borderRadius:14,padding:"12px",marginBottom:10,border:"1px solid #374151"}}>
            <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:8,letterSpacing:.5}}>💾 SAVED</div>
            {saved.map((s,i)=>{
              const sEx=EXCHANGES.find(e=>e.id===s.exId)||EXCHANGES[0];
              const SLogo=sEx.logo;
              return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",
                background:"#111827",borderRadius:10,marginBottom:5,cursor:"pointer",
                border:"1px solid #374151"}}
                onClick={()=>{setCoin(s.coin);setEx(s.exId);setDir(s.dir);
                  setMargin(s.margin);setEntry(s.entry);setDisp(s.dispCur||"INR");
                  setTimeout(startTracking,100);}}>
                <SLogo size={28}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:13,color:"#f1f5f9"}}>{s.coin} · {s.dir?.toUpperCase()}</div>
                  <div style={{fontSize:10,color:"#6b7280"}}>{sEx.name} · Entry: {s.entry}</div>
                </div>
                <div style={{background:"#10b981",borderRadius:8,padding:"4px 10px",fontSize:10,color:"#fff",fontWeight:700}}>Open</div>
                <div onClick={e=>{e.stopPropagation();del(s.coin);}}
                  style={{background:"transparent",borderRadius:8,padding:"4px 8px",fontSize:12,color:"#6b7280",border:"1px solid #374151"}}>✕</div>
              </div>
              );
            })}
          </div>
        )}

        {/* FORM */}
        {!active&&(
          <div className="fadein" style={{background:"#1f2937",borderRadius:16,padding:"16px",
            border:"1px solid #374151",marginBottom:12}}>

            {/* Exchange selector with real logos */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:8,letterSpacing:.5}}>EXCHANGE</div>
              <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
                {EXCHANGES.map(e=>{
                  const EL=e.logo;
                  return(
                  <div key={e.id} onClick={()=>setEx(e.id)}
                    style={{flexShrink:0,cursor:"pointer",display:"flex",flexDirection:"column",
                      alignItems:"center",gap:4,padding:"8px 6px",borderRadius:12,
                      background:exId===e.id?"rgba(16,185,129,.1)":"#111827",
                      border:`2px solid ${exId===e.id?"#10b981":"#374151"}`,
                      minWidth:60,transition:"all .15s"}}>
                    <EL size={32}/>
                    <span style={{fontSize:9,fontWeight:700,
                      color:exId===e.id?"#10b981":"#6b7280",textAlign:"center",lineHeight:1.2}}>
                      {e.name}
                    </span>
                    <span style={{fontSize:8,color:"#4b5563"}}>{e.cur}</span>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Coin */}
            <div style={{marginBottom:12,position:"relative"}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6,letterSpacing:.5}}>COIN</div>
              <div onClick={()=>setDD(!showDD)}
                style={{background:"#111827",border:`1px solid ${showDD?"#10b981":"#374151"}`,borderRadius:10,
                  padding:"13px 14px",display:"flex",justifyContent:"space-between",
                  alignItems:"center",cursor:"pointer"}}>
                <span style={{fontSize:18,fontWeight:900,fontFamily:"'JetBrains Mono',monospace",color:"#f1f5f9"}}>{coin}/USDT</span>
                <span style={{fontSize:12,color:"#6b7280"}}>▼</span>
              </div>
              {showDD&&(
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1f2937",
                  borderRadius:10,border:"1px solid #10b981",boxShadow:"0 8px 30px rgba(0,0,0,.5)",
                  zIndex:100,overflow:"hidden"}}>
                  <input value={srch} onChange={e=>setSrch(e.target.value)}
                    placeholder="Search coin..." autoFocus
                    style={{width:"100%",padding:"10px 14px",background:"#111827",border:"none",
                      borderBottom:"1px solid #374151",fontSize:13,outline:"none",
                      color:"#f1f5f9",fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}/>
                  <div style={{maxHeight:160,overflowY:"auto"}}>
                    {filtered.map(c=>(
                      <div key={c} onClick={()=>{setCoin(c);setDD(false);setSrch("");}}
                        style={{padding:"10px 14px",cursor:"pointer",
                          background:c===coin?"rgba(16,185,129,.1)":"transparent",
                          fontSize:13,fontFamily:"'JetBrains Mono',monospace",
                          color:c===coin?"#10b981":"#d1d5db",borderBottom:"1px solid #1f2937"}}>
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
                {[{v:"long",label:"📈 Long",ac:"#10b981"},{v:"short",label:"📉 Short",ac:"#ef4444"}].map(b=>(
                  <button key={b.v} onClick={()=>setDir(b.v)}
                    style={{padding:"13px",borderRadius:10,
                      border:`2px solid ${dir===b.v?b.ac:"#374151"}`,
                      background:dir===b.v?`rgba(${b.v==="long"?"16,185,129":"239,68,68"},.12)`:"#111827",
                      color:dir===b.v?b.ac:"#6b7280",fontWeight:800,fontSize:14,
                      cursor:"pointer",fontFamily:"'Inter',sans-serif",transition:"all .15s"}}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Currency */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6,letterSpacing:.5}}>DISPLAY IN</div>
              <div style={{display:"flex",gap:8}}>
                {["INR","USD"].map(c=>(
                  <button key={c} onClick={()=>setDisp(c)}
                    style={{flex:1,padding:"10px",borderRadius:10,cursor:"pointer",
                      fontWeight:700,fontSize:13,fontFamily:"'Inter',sans-serif",
                      background:dispCur===c?"#10b981":"#111827",
                      color:dispCur===c?"#fff":"#6b7280",
                      border:`1px solid ${dispCur===c?"#10b981":"#374151"}`}}>
                    {c==="INR"?"₹ INR":"$ USD"}
                  </button>
                ))}
              </div>
            </div>

            {/* Entry */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6,letterSpacing:.5}}>
                AVG. ENTRY ({ex.cur})
              </div>
              <div style={{background:"#111827",border:"1px solid #374151",borderRadius:10,
                padding:"12px 14px",display:"flex",alignItems:"center",gap:8}}>
                <input value={entry} onChange={e=>setEntry(e.target.value)}
                  placeholder={isINR?"e.g. 900 (₹)":"e.g. 10.80 (USDT)"} type="number"
                  style={{background:"transparent",border:"none",outline:"none",fontSize:18,
                    fontWeight:700,color:"#f1f5f9",fontFamily:"'JetBrains Mono',monospace",flex:1,minWidth:0}}/>
                <span style={{fontSize:12,color:"#6b7280",fontWeight:600,flexShrink:0}}>{ex.cur}</span>
              </div>
            </div>

            {/* Margin */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:6,letterSpacing:.5}}>
                INVEST KIYA ({dispCur==="INR"?"₹":"$"})
              </div>
              <div style={{background:"#111827",border:"1px solid #374151",borderRadius:10,padding:"12px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:entry?6:0}}>
                  <input value={margin} onChange={e=>setMargin(e.target.value)}
                    placeholder={dispCur==="INR"?"e.g. 5000":"e.g. 60"} type="number"
                    style={{background:"transparent",border:"none",outline:"none",fontSize:18,
                      fontWeight:700,color:"#f1f5f9",fontFamily:"'JetBrains Mono',monospace",flex:1,minWidth:0}}/>
                  <span style={{fontSize:12,color:"#6b7280",fontWeight:600}}>{dispCur}</span>
                </div>
                {margin&&entry&&qty>0&&(
                  <div style={{fontSize:11,color:"#10b981",fontWeight:600}}>
                    ≈ {qty.toFixed(4)} {coin} · Position: {dispCur==="INR"?`₹${marginN.toLocaleString()}`:`$${marginN}`}
                  </div>
                )}
              </div>
            </div>

            <button onClick={startTracking} disabled={!margin||!entry}
              style={{width:"100%",background:(!margin||!entry)?"#374151":"linear-gradient(135deg,#10b981,#059669)",
                color:"#fff",border:"none",borderRadius:12,padding:"15px",fontWeight:800,fontSize:15,
                cursor:"pointer",fontFamily:"'Inter',sans-serif",
                boxShadow:(!margin||!entry)?"none":"0 4px 16px rgba(16,185,129,.4)"}}>
              🚀 Track Position
            </button>
          </div>
        )}

        {/* Loading */}
        {active&&!lp&&(
          <div className="fadein" style={{background:"#1f2937",borderRadius:16,padding:"32px",
            textAlign:"center",border:"1px solid #374151"}}>
            <Logo size={40}/>
            <div style={{fontWeight:700,fontSize:14,color:"#f1f5f9",marginTop:12,marginBottom:4}}>
              {ex.name} se price fetch...
            </div>
            <div style={{fontSize:11,color:"#6b7280",marginBottom:14}}>{coin}/{ex.cur}</div>
            <div style={{display:"flex",justifyContent:"center",gap:8}}>
              {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",
                background:"#10b981",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
            </div>
            {err&&<div style={{color:"#ef4444",fontSize:11,marginTop:10}}>⚠️ {err}</div>}
          </div>
        )}

        {/* ACTIVE POSITION */}
        {active&&lp&&livePnl&&(
          <div className="fadein">
            {/* Exchange-style card */}
            <div style={{background:"#0f172a",borderRadius:16,overflow:"hidden",
              border:"1px solid #1f2937",marginBottom:12}}>

              {/* Title */}
              <div style={{background:"#1f2937",padding:"10px 14px",display:"flex",
                alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #374151"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Logo size={22}/>
                  <span style={{fontWeight:900,fontSize:14,color:"#f1f5f9"}}>{coin}/USDT</span>
                  <span style={{background:dir==="long"?"rgba(16,185,129,.2)":"rgba(239,68,68,.2)",
                    border:`1px solid ${dir==="long"?"#10b981":"#ef4444"}`,
                    color:dir==="long"?"#10b981":"#ef4444",
                    borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:800}}>
                    {dir==="long"?"Long ▲":"Short ▼"}
                  </span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:"#10b981",animation:"pg 1.5s infinite"}}/>
                  <span style={{fontSize:9,color:"#6ee7b7",fontWeight:700}}>{lu}</span>
                </div>
              </div>

              {/* PNL */}
              <div style={{padding:"16px 14px",borderBottom:"1px solid #1f2937"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,color:"#6b7280"}}>Active PNL</span>
                  <span style={{fontSize:11,color:"#6b7280"}}>ROE%</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div className={`mono ${pd==="up"?"pu":pd==="down"?"pd":""}`}
                    style={{fontSize:28,fontWeight:900,lineHeight:1,color:green?"#10b981":"#ef4444"}}>
                    {green?"+":"-"}₹{Math.abs(livePnl.pnlINR).toLocaleString("en-IN",{maximumFractionDigits:0})}
                  </div>
                  <div className="mono" style={{fontSize:22,fontWeight:900,color:green?"#10b981":"#ef4444"}}>
                    {green?"+":""}{livePnl.roe.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Grid details */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",borderBottom:"1px solid #1f2937"}}>
                {[
                  {l:`Qty (${coin})`,v:qty.toFixed(4)},
                  {l:"Size",v:dispCur==="INR"?`₹${marginN.toLocaleString()}`:`$${marginN}`},
                  {l:"Margin",v:dispCur==="INR"?`₹${marginN.toLocaleString()}`:`$${marginN}`},
                ].map((s,i)=>(
                  <div key={i} style={{padding:"10px 10px",borderRight:i<2?"1px solid #1f2937":"none"}}>
                    <div style={{fontSize:9,color:"#6b7280",marginBottom:3}}>{s.l}</div>
                    <div className="mono" style={{fontSize:11,fontWeight:700,color:"#f1f5f9"}}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
                {[
                  {l:`Avg. Entry (${ex.cur})`,v:entryN.toFixed(isINR?2:4)},
                  {l:`LTP (${ex.cur})`,v:lp.toFixed(isINR?2:4),c:lp>=entryN?"#10b981":"#ef4444"},
                ].map((s,i)=>(
                  <div key={i} style={{padding:"10px 10px",borderRight:i<1?"1px solid #1f2937":"none"}}>
                    <div style={{fontSize:9,color:"#6b7280",marginBottom:3}}>{s.l}</div>
                    <div className="mono" style={{fontSize:12,fontWeight:700,color:s.c||"#f1f5f9"}}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* 24h stats */}
              {t24&&t24.high>0&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",
                  borderTop:"1px solid #1f2937",background:"rgba(255,255,255,.02)"}}>
                  {[
                    {l:"24h High",v:t24.high?.toFixed?.(4)||"—",c:"#10b981"},
                    {l:"24h Low",v:t24.low?.toFixed?.(4)||"—",c:"#ef4444"},
                    {l:"24h %",v:`${t24.ch24>=0?"+":""}${t24.ch24?.toFixed?.(2)||0}%`,c:t24.ch24>=0?"#10b981":"#ef4444"},
                  ].map((s,i)=>(
                    <div key={i} style={{padding:"8px 10px",borderRight:i<2?"1px solid #1f2937":"none",textAlign:"center"}}>
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
              <div style={{fontWeight:700,fontSize:13,color:"#f1f5f9",marginBottom:4,display:"flex",alignItems:"center",gap:8}}>
                ⏱️ Kab Tak Hold Karo?
              </div>
              <div style={{fontSize:10,color:"#6b7280",marginBottom:12}}>RSI + Bollinger Bands + ATR + Support/Resistance — background mein</div>
              {TFS.map(({tf,label})=>{
                const cl=tfd[tf]||[];
                const r=rsi(cl);const m20=ma(cl,20);const m50=ma(cl,50);
                const b=bb(cl);
                const cur=cl[cl.length-1]||lp;
                const bPct=b.u>b.l?(cur-b.l)/(b.u-b.l)*100:50;
                const sup=cl.length>=20?Math.min(...cl.slice(-20)):lp*0.95;
                const res=cl.length>=20?Math.max(...cl.slice(-20)):lp*1.05;
                const nRes=(res-cur)/cur*100;
                const nSup=(cur-sup)/cur*100;
                let sc=0;
                if(dir==="long"){
                  if(r<35)sc+=3;else if(r<45)sc+=2;else if(r<55)sc+=1;else if(r>70)sc-=3;else if(r>62)sc-=2;
                  if(cur>m20)sc+=1;if(cur>m50)sc+=1;
                  if(bPct<25)sc+=2;if(bPct>80)sc-=2;
                  if(nRes<1.5)sc-=1;if(nSup<1.5)sc+=1;
                }else{
                  if(r>65)sc+=3;else if(r>55)sc+=2;else if(r>45)sc+=1;else if(r<30)sc-=3;else if(r<38)sc-=2;
                  if(cur<m20)sc+=1;if(cur<m50)sc+=1;
                  if(bPct>75)sc+=2;if(bPct<20)sc-=2;
                  if(nSup<1.5)sc-=1;if(nRes<1.5)sc+=1;
                }
                const roe=livePnl?.roe||0;
                let dec,dc,db,time;
                if(sc>=4){dec="🔥 HOLD STRONG";dc="#059669";db="rgba(5,150,105,.12)";time=`Strong — ${label} full hold`;}
                else if(sc>=2){dec="✅ HOLD";dc="#10b981";db="rgba(16,185,129,.08)";time=`Hold karo — ${label}`;}
                else if(sc>=0&&roe>8){dec="🎯 PARTIAL SELL";dc="#f59e0b";db="rgba(245,158,11,.08)";time="50% profit book karo";}
                else if(sc<-2||(r>72&&dir==="long")||(r<28&&dir==="short")){dec="🚨 SELL NOW";dc="#ef4444";db="rgba(239,68,68,.12)";time="Abhi exit karo";}
                else if(sc<0){dec="⚠️ WATCH";dc="#f59e0b";db="rgba(245,158,11,.08)";time="Agle 5 min dekho";}
                else{dec="⏸️ WAIT";dc="#8b5cf6";db="rgba(139,92,246,.08)";time="Signal ka intezaar";}
                const str=Math.min(5,Math.max(1,Math.abs(sc)+1));
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
                        fontSize:12,fontWeight:800,color:dc,marginBottom:4}}>{dec}</div>
                      <div style={{fontSize:12,color:"#d1d5db",fontWeight:600}}>{time}</div>
                    </div>
                    <div style={{display:"flex",gap:2,flexShrink:0}}>
                      {[1,2,3,4,5].map(n=>(
                        <div key={n} style={{width:4,height:18,borderRadius:3,
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
                <div style={{fontWeight:700,fontSize:13,color:"#f1f5f9",display:"flex",alignItems:"center",gap:8}}>
                  🤖 AI Full Analysis
                </div>
                <button onClick={()=>{aiDone.current=false;getAI();}}
                  style={{background:"transparent",border:"1px solid #374151",borderRadius:20,
                    padding:"4px 12px",fontSize:11,color:"#10b981",fontWeight:700,cursor:"pointer",
                    fontFamily:"'Inter',sans-serif"}}>🔄</button>
              </div>
              {ail?(
                <div style={{textAlign:"center",padding:"16px 0"}}>
                  <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:8}}>
                    {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",
                      background:"#10b981",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
                  </div>
                  <div style={{fontSize:11,color:"#6b7280"}}>4 timeframes analyze ho rahe hain...</div>
                </div>
              ):ai?(
                <div className="fadein">
                  {ai.split("\n").filter(Boolean).map((line,i)=>{
                    const h=line.startsWith("📊");const tf=line.startsWith("⏱️");
                    const tp=line.startsWith("🎯")||line.startsWith("🛑")||line.startsWith("💰");
                    const w=line.startsWith("⚠️");
                    return(<div key={i} style={{
                      background:h?"rgba(16,185,129,.1)":tf?"rgba(255,255,255,.03)":tp?"rgba(99,102,241,.08)":w?"rgba(239,68,68,.08)":"transparent",
                      border:h?"1px solid rgba(16,185,129,.3)":tf?"1px solid #1f2937":tp?"1px solid rgba(99,102,241,.2)":w?"1px solid rgba(239,68,68,.2)":"none",
                      borderLeft:h?"4px solid #10b981":tf?"3px solid #6366f1":"none",
                      borderRadius:h||tf||tp||w?10:0,padding:h||tf||tp||w?"9px 12px":"2px 4px",
                      marginBottom:h||tf||tp?7:3,fontSize:h?14:12,fontWeight:h?800:tf?600:400,
                      color:h?"#6ee7b7":w?"#fca5a5":"#d1d5db",lineHeight:1.7,
                    }}>{line}</div>);
                  })}
                  <div style={{fontSize:9,color:"#10b981",marginTop:8,textAlign:"right",fontWeight:600}}>
                    💾 Saved · 🔄 3 min auto-update
                  </div>
                </div>
              ):(
                <div style={{textAlign:"center",padding:"16px",color:"#6b7280",fontSize:12}}>
                  Price aane ke baad AI analysis aayega...
                </div>
              )}
            </div>

            <AD/>

            <button onClick={reset}
              style={{width:"100%",background:"#1f2937",border:"1px solid #374151",
                borderRadius:12,padding:"13px",fontWeight:700,fontSize:13,cursor:"pointer",
                color:"#9ca3af",fontFamily:"'Inter',sans-serif",marginBottom:12}}>
              ← Nayi Position Enter Karo
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
