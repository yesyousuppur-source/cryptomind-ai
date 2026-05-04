"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const COINS = ["BTC","ETH","SOL","BNB","XRP","ADA","DOGE","AVAX","LINK","APT"];
const START_CASH = 100000;

// Fallback prices in case all APIs fail
const FALLBACK = {
  BTC:95000, ETH:3200, SOL:150, BNB:580, XRP:0.55,
  ADA:0.45, DOGE:0.15, AVAX:35, LINK:14, APT:8,
};

const fmtINR = (n) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits:2, maximumFractionDigits:2 });
const fmtUSD = (n) => n >= 1
  ? "$" + n.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })
  : "$" + n.toPrecision(4);

const T = {
  green:"#10b981", greenDk:"#059669",
  page:"#f0fdf8", card:"#ffffff", border:"#e2e8f0",
  text:"#0f172a", text2:"#475569", text3:"#94a3b8",
  shadow:"0 4px 20px rgba(0,0,0,.05)",
};

const LEADERBOARD = [
  { name:"Rahul_Mumbai",   pnl:"+47.3%", badge:"🥇" },
  { name:"Priya_BLR",      pnl:"+31.8%", badge:"🥈" },
  { name:"CryptoKing_DEL", pnl:"+28.4%", badge:"🥉" },
  { name:"SOL_Maxx",       pnl:"+19.2%", badge:"🏅" },
  { name:"DCA_Master",     pnl:"+14.7%", badge:"🏅" },
];

export default function ArenaPage() {
  const [prices, setPrices]           = useState(FALLBACK);
  const [priceStatus, setPriceStatus] = useState("loading");
  const [lastUpdate, setLastUpdate]   = useState(null);
  const [cash, setCash]               = useState(START_CASH);
  const [holdings, setHoldings]       = useState({});
  const [trades, setTrades]           = useState([]);
  const [started, setStarted]         = useState(false);
  const [selCoin, setSelCoin]         = useState("BTC");
  const [tradeAmt, setTradeAmt]       = useState("");
  const [tradeType, setTradeType]     = useState("buy");
  const [tradeMsg, setTradeMsg]       = useState(null);
  const [activeTab, setActiveTab]     = useState("trade");
  const [hydrated, setHydrated]       = useState(false);

  // ── LOAD from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("arena_data");
      if (saved) {
        const d = JSON.parse(saved);
        if (d.cash !== undefined) setCash(d.cash);
        if (d.holdings)           setHoldings(d.holdings);
        if (d.trades)             setTrades(d.trades);
        if (d.started)            setStarted(true);
      }
    } catch(_) {}
    setHydrated(true);
  }, []);

  // ── SAVE to localStorage whenever data changes ────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("arena_data", JSON.stringify({ cash, holdings, trades, started: true }));
    } catch(_) {}
  }, [cash, holdings, trades, hydrated]);
  const intervalRef = useRef(null);

  // ── FETCH PRICES ──────────────────────────────────────────────────────────
  const fetchPrices = async () => {
    // Method 1: Binance batch
    try {
      const syms = COINS.map(c=>`"${c}USDT"`).join(",");
      const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=[${syms}]`, { cache:"no-store" });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data) && data.length > 0) {
          const p = {};
          data.forEach(t => {
            const sym = t.symbol.replace("USDT","");
            p[sym] = { price: parseFloat(t.lastPrice), ch24: parseFloat(t.priceChangePercent) };
          });
          setPrices(prev => ({...prev, ...p}));
          setPriceStatus("live");
          setLastUpdate(new Date().toLocaleTimeString("en-IN"));
          return;
        }
      }
    } catch(_) {}

    // Method 2: Binance one by one
    try {
      const results = await Promise.allSettled(
        COINS.map(c => fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${c}USDT`).then(r=>r.json()))
      );
      const p = {};
      results.forEach((r,i) => {
        if (r.status==="fulfilled" && r.value?.price) {
          p[COINS[i]] = { price: parseFloat(r.value.price), ch24: 0 };
        }
      });
      if (Object.keys(p).length >= 3) {
        setPrices(prev => ({...prev, ...p}));
        setPriceStatus("live");
        setLastUpdate(new Date().toLocaleTimeString("en-IN"));
        return;
      }
    } catch(_) {}

    // Method 3: CryptoCompare
    try {
      const fsyms = COINS.join(",");
      const r = await fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${fsyms}&tsyms=USD`);
      if (r.ok) {
        const data = await r.json();
        const p = {};
        COINS.forEach(c => {
          if (data[c]?.USD) p[c] = { price: data[c].USD, ch24: 0 };
        });
        if (Object.keys(p).length >= 3) {
          setPrices(prev => ({...prev, ...p}));
          setPriceStatus("live");
          setLastUpdate(new Date().toLocaleTimeString("en-IN"));
          return;
        }
      }
    } catch(_) {}

    // All failed — use fallback
    setPriceStatus("fallback");
    setLastUpdate("Approximate prices");
  };

  useEffect(() => {
    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // ── PORTFOLIO ─────────────────────────────────────────────────────────────
  const portfolioValue = Object.entries(holdings).reduce((sum, [coin, qty]) => {
    return sum + qty * (prices[coin]?.price || FALLBACK[coin] || 0);
  }, 0);
  const totalValue = cash + portfolioValue;
  const totalPnL   = totalValue - START_CASH;
  const pnlPct     = ((totalPnL / START_CASH) * 100).toFixed(2);

  // ── EXECUTE TRADE ─────────────────────────────────────────────────────────
  const executeTrade = () => {
    const amt = parseFloat(tradeAmt);
    if (isNaN(amt) || amt <= 0) {
      setTradeMsg({ type:"error", text:"Amount daalo — 0 se zyada hona chahiye." }); return;
    }
    const coinData = prices[selCoin] || { price: FALLBACK[selCoin] };
    const coinPrice = coinData.price;
    if (!coinPrice || coinPrice <= 0) {
      setTradeMsg({ type:"error", text:"Price unavailable. Thoda wait karo." }); return;
    }

    if (tradeType === "buy") {
      if (amt > cash) {
        setTradeMsg({ type:"error", text:`Cash km hai! Available: ${fmtINR(cash)}` }); return;
      }
      const qty = amt / coinPrice;
      setCash(p => p - amt);
      setHoldings(p => ({ ...p, [selCoin]: (p[selCoin]||0) + qty }));
      setTrades(p => [{ type:"BUY", coin:selCoin, amt, qty, price:coinPrice,
        time:new Date().toLocaleTimeString("en-IN"), id:Date.now(),
        currentValue: amt  // will update with live price
      }, ...p]);
      setTradeMsg({ type:"success", text:`✅ ${qty.toFixed(6)} ${selCoin} kharida!\n💰 Invest kiya: ${fmtINR(amt)} @ ${fmtUSD(coinPrice)}` });
    } else {
      const myQty = holdings[selCoin] || 0;
      if (myQty <= 0.000001) {
        setTradeMsg({ type:"error", text:`Tumhare paas ${selCoin} nahi hai!` }); return;
      }
      const maxSell = myQty * coinPrice;
      const sellAmt = Math.min(amt, maxSell);
      const sellQty = sellAmt / coinPrice;
      setCash(p => p + sellAmt);
      setHoldings(p => ({ ...p, [selCoin]: Math.max(0, (p[selCoin]||0) - sellQty) }));
      setTrades(p => [{ type:"SELL", coin:selCoin, amt:sellAmt, qty:sellQty, price:coinPrice,
        time:new Date().toLocaleTimeString("en-IN"), id:Date.now() }, ...p]);
      setTradeMsg({ type:"success", text:`✅ ${sellQty.toFixed(6)} ${selCoin} becha ${fmtINR(sellAmt)} mein!` });
    }
    setTradeAmt("");
    setTimeout(() => setTradeMsg(null), 4000);
  };

  const resetArena = () => {
    setCash(START_CASH); setHoldings({}); setTrades([]);
    try { localStorage.removeItem("arena_data"); } catch(_) {}
    setTradeMsg({ type:"success", text:"🎮 Reset! Fresh ₹1,00,000 se shuru karo." });
    setTimeout(()=>setTradeMsg(null),3000);
  };

  const coinPrice = prices[selCoin]?.price || FALLBACK[selCoin] || 0;

  if (!started) {
    return (
      <main style={{ fontFamily:"'Inter',sans-serif", background:T.page, minHeight:"100vh", color:T.text }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
          *{box-sizing:border-box;margin:0;padding:0}
          @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
          @keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
          .fadein{animation:fadein .4s ease-out}
          .mono{font-family:'JetBrains Mono',monospace}
        `}</style>
        <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(rgba(16,185,129,.07) 1px,transparent 1px)",backgroundSize:"30px 30px",opacity:.4,pointerEvents:"none"}}/>
        <div style={{maxWidth:680,margin:"0 auto",padding:"36px 16px 56px"}}>
          <Link href="/features" style={{display:"inline-flex",alignItems:"center",gap:6,color:T.greenDk,textDecoration:"none",fontSize:13,fontWeight:600,marginBottom:28,background:"#fff",border:`1px solid ${T.border}`,borderRadius:20,padding:"6px 14px"}}>
            ← Back to Features
          </Link>
          <div className="fadein" style={{textAlign:"center"}}>
            <div style={{fontSize:64,marginBottom:12,animation:"float 3s ease-in-out infinite"}}>🏟️</div>
            <h1 style={{fontSize:32,fontWeight:900,letterSpacing:-1.5,marginBottom:10,background:"linear-gradient(135deg,#0f172a,#10b981)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
              Virtual Trading Arena
            </h1>
            <p style={{fontSize:14,color:T.text2,lineHeight:1.7,maxWidth:420,margin:"0 auto 24px"}}>
              Real market prices. Virtual ₹1,00,000. Zero real risk.<br/>
              <strong style={{color:T.text}}>Sikho, practice karo, leaderboard pe jao!</strong>
            </p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,maxWidth:400,margin:"0 auto 28px"}}>
              {[{icon:"💰",l:"Starting Cash",v:"₹1,00,000"},{icon:"📊",l:"Real Prices",v:"Live Market"},
                {icon:"🏆",l:"Leaderboard",v:"Top Players"},{icon:"🎓",l:"Learn By Doing",v:"Zero Risk"}].map((f,i)=>(
                <div key={i} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:14,padding:"14px",textAlign:"center"}}>
                  <div style={{fontSize:24,marginBottom:6}}>{f.icon}</div>
                  <div style={{fontSize:11,color:T.text3,marginBottom:3}}>{f.l}</div>
                  <div style={{fontWeight:700,fontSize:13}}>{f.v}</div>
                </div>
              ))}
            </div>
            <div style={{background:"linear-gradient(135deg,#fffbeb,#fef3c7)",border:"1px solid #fde68a",borderRadius:14,padding:"14px 18px",maxWidth:420,margin:"0 auto 24px",fontSize:12,color:"#92400e",lineHeight:1.7}}>
              ⚠️ Yeh virtual trading hai — real money nahi lagti.<br/>
              Real crypto mein invest karne se pehle yahaan practice karo.
            </div>
            <button onClick={()=>{ setStarted(true); try{localStorage.setItem("arena_data", JSON.stringify({cash:START_CASH,holdings:{},trades:[],started:true}));}catch(_){} }}
              style={{background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",border:"none",borderRadius:16,padding:"16px 40px",fontWeight:800,fontSize:16,cursor:"pointer",fontFamily:"'Inter',sans-serif",boxShadow:"0 4px 24px rgba(16,185,129,.4)"}}>
              🚀 Enter Arena — Start with ₹1,00,000
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{fontFamily:"'Inter',sans-serif",background:T.page,minHeight:"100vh",color:T.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        .fadein{animation:fadein .35s ease-out}
        .mono{font-family:'JetBrains Mono',monospace}
        input,select{color:#0f172a;font-family:'JetBrains Mono',monospace}
        input::placeholder{color:#94a3b8}
        input:focus{outline:none;border-color:#10b981!important}
        button:active{transform:scale(.97)}
        .hov{transition:transform .2s,box-shadow .2s}
        .hov:hover{transform:translateY(-2px)}
      `}</style>
      <div style={{position:"fixed",inset:0,backgroundImage:"radial-gradient(rgba(16,185,129,.07) 1px,transparent 1px)",backgroundSize:"30px 30px",opacity:.4,pointerEvents:"none"}}/>

      <div style={{maxWidth:700,margin:"0 auto",padding:"18px 16px 56px",position:"relative"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <Link href="/features" style={{fontSize:12,color:T.greenDk,textDecoration:"none",fontWeight:600,background:"#fff",border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 12px"}}>
            ← Features
          </Link>
          <div style={{textAlign:"center"}}>
            <div style={{fontWeight:900,fontSize:15,letterSpacing:-.5}}>🏟️ Trading Arena</div>
            <div className="mono" style={{fontSize:9,color:priceStatus==="live"?"#10b981":"#f59e0b"}}>
              {priceStatus==="live"?`🟢 Live · ${lastUpdate||""}`:priceStatus==="loading"?"🔄 Loading prices...":"🟡 Approximate prices"}
            </div>
          </div>
          <button onClick={resetArena} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,padding:"5px 12px",cursor:"pointer",fontSize:11,color:"#dc2626",fontWeight:600,fontFamily:"'Inter',sans-serif"}}>
            Reset
          </button>
        </div>

        {/* Portfolio Summary */}
        <div style={{background:totalPnL>=0?"linear-gradient(135deg,#ecfdf5,#d1fae5)":"linear-gradient(135deg,#fff1f2,#fee2e2)",border:`1px solid ${totalPnL>=0?"#6ee7b7":"#fca5a5"}`,borderRadius:20,padding:"16px",marginBottom:12,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${totalPnL>=0?"#10b981,#6ee7b7":"#ef4444,#f87171"},transparent)`}}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,textAlign:"center"}}>
            <div>
              <div style={{fontSize:9,color:T.text3,fontWeight:600,marginBottom:4,letterSpacing:.5}}>PORTFOLIO</div>
              <div className="mono" style={{fontSize:14,fontWeight:900}}>{fmtINR(totalValue)}</div>
            </div>
            <div>
              <div style={{fontSize:9,color:T.text3,fontWeight:600,marginBottom:4,letterSpacing:.5}}>TOTAL P&L</div>
              <div className="mono" style={{fontSize:14,fontWeight:900,color:totalPnL>=0?T.greenDk:"#dc2626"}}>
                {totalPnL>=0?"+":""}{fmtINR(Math.abs(totalPnL))}
              </div>
              <div style={{fontSize:11,color:totalPnL>=0?T.greenDk:"#dc2626",fontWeight:700}}>{totalPnL>=0?"+":""}{pnlPct}%</div>
            </div>
            <div>
              <div style={{fontSize:9,color:T.text3,fontWeight:600,marginBottom:4,letterSpacing:.5}}>CASH</div>
              <div className="mono" style={{fontSize:14,fontWeight:900}}>{fmtINR(cash)}</div>
            </div>
          </div>
        </div>

        {/* Tab Nav */}
        <div style={{background:"#fff",borderRadius:14,padding:"5px",marginBottom:12,display:"flex",gap:2,border:`1px solid ${T.border}`}}>
          {[{id:"trade",l:"📈 Trade"},{id:"portfolio",l:"💼 Portfolio"},{id:"leaderboard",l:"🏆 Leaders"}].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{flex:1,background:activeTab===t.id?"linear-gradient(135deg,#ecfdf5,#d1fae5)":"transparent",color:activeTab===t.id?T.greenDk:T.text3,border:activeTab===t.id?"1px solid #6ee7b7":"1px solid transparent",borderRadius:10,padding:"9px 4px",cursor:"pointer",fontSize:11,fontWeight:700,fontFamily:"'Inter',sans-serif",transition:"all .2s"}}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ── TRADE TAB ── */}
        {activeTab==="trade" && (
          <div className="fadein">
            <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:20,padding:"18px",marginBottom:10,boxShadow:T.shadow}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>⚡ Execute Trade</div>

              {/* Buy/Sell */}
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                <button onClick={()=>setTradeType("buy")}
                  style={{flex:1,background:tradeType==="buy"?"linear-gradient(135deg,#ecfdf5,#d1fae5)":"#f8fafc",color:tradeType==="buy"?T.greenDk:T.text3,border:tradeType==="buy"?"1px solid #6ee7b7":`1px solid ${T.border}`,borderRadius:12,padding:"11px",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"'Inter',sans-serif"}}>
                  📥 BUY
                </button>
                <button onClick={()=>setTradeType("sell")}
                  style={{flex:1,background:tradeType==="sell"?"linear-gradient(135deg,#fff1f2,#fee2e2)":"#f8fafc",color:tradeType==="sell"?"#dc2626":T.text3,border:tradeType==="sell"?"1px solid #fca5a5":`1px solid ${T.border}`,borderRadius:12,padding:"11px",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"'Inter',sans-serif"}}>
                  📤 SELL
                </button>
              </div>

              {/* Coin Select */}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,color:T.text3,fontWeight:600,marginBottom:8,letterSpacing:.5}}>SELECT COIN</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {COINS.map(c=>(
                    <button key={c} onClick={()=>setSelCoin(c)}
                      style={{background:selCoin===c?"linear-gradient(135deg,#10b981,#059669)":"#f8fafc",color:selCoin===c?"#fff":T.text2,border:selCoin===c?"none":`1px solid ${T.border}`,borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",transition:"all .15s"}}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Price Display */}
              <div style={{background:coinPrice>0?"#f0fdf4":"#f8fafc",borderRadius:12,padding:"10px 14px",marginBottom:12,border:`1px solid ${coinPrice>0?"#6ee7b7":T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:9,color:T.text3,fontWeight:600,marginBottom:2}}>{selCoin} PRICE {priceStatus==="live"?"🟢 LIVE":"🟡 EST."}</div>
                  <div className="mono" style={{fontSize:18,fontWeight:900,color:T.text}}>{fmtUSD(coinPrice)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  {prices[selCoin]?.ch24 !== undefined && (
                    <div style={{fontSize:12,color:prices[selCoin].ch24>=0?T.greenDk:"#dc2626",fontWeight:700,background:prices[selCoin].ch24>=0?"#f0fdf4":"#fef2f2",padding:"3px 8px",borderRadius:20}}>
                      {prices[selCoin].ch24>=0?"▲":"▼"}{Math.abs(prices[selCoin].ch24).toFixed(2)}%
                    </div>
                  )}
                  {holdings[selCoin]>0 && (
                    <div className="mono" style={{fontSize:9,color:T.text3,marginTop:4}}>
                      Holding: {holdings[selCoin].toFixed(6)}
                    </div>
                  )}
                </div>
              </div>

              {/* Amount */}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:10,color:T.text3,fontWeight:600,marginBottom:6,letterSpacing:.5}}>
                  {tradeType==="buy"?`AMOUNT (Cash: ${fmtINR(cash)})`:`AMOUNT (Holdings: ${fmtINR((holdings[selCoin]||0)*coinPrice)})`}
                </div>
                <input value={tradeAmt} onChange={e=>setTradeAmt(e.target.value)}
                  placeholder="₹ amount (jaise 5000)"
                  type="number" min="1"
                  style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"13px 14px",fontSize:15,color:T.text,transition:"border-color .2s"}}
                  onFocus={e=>e.target.style.borderColor="#10b981"}
                  onBlur={e=>e.target.style.borderColor="#e2e8f0"}
                />
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  {[1000,5000,10000,25000].map(a=>(
                    <button key={a} onClick={()=>setTradeAmt(String(a))}
                      style={{flex:1,background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:10,padding:"7px 4px",fontSize:11,color:T.greenDk,fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>
                      ₹{a>=1000?`${a/1000}K`:a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {tradeAmt && coinPrice > 0 && (
                <div style={{background:tradeType==="buy"?"#f0fdf4":"#fef2f2",border:`1px solid ${tradeType==="buy"?"#6ee7b7":"#fecaca"}`,borderRadius:10,padding:"10px 12px",marginBottom:12,fontSize:12,color:tradeType==="buy"?T.greenDk:"#dc2626",fontWeight:600}}>
                  {tradeType==="buy"
                    ?`📥 Milega: ~${(parseFloat(tradeAmt||0)/coinPrice).toFixed(6)} ${selCoin}`
                    :`📤 Milega: ~${fmtINR(Math.min(parseFloat(tradeAmt||0),(holdings[selCoin]||0)*coinPrice))}`}
                </div>
              )}

              {/* Message */}
              {tradeMsg && (
                <div style={{background:tradeMsg.type==="success"?"#ecfdf5":"#fef2f2",border:`1px solid ${tradeMsg.type==="success"?"#6ee7b7":"#fecaca"}`,borderRadius:10,padding:"10px 12px",marginBottom:10,fontSize:12,color:tradeMsg.type==="success"?T.greenDk:"#dc2626",fontWeight:600}}>
                  {tradeMsg.text}
                </div>
              )}

              <button onClick={executeTrade}
                style={{width:"100%",background:tradeType==="buy"?"linear-gradient(135deg,#10b981,#059669)":"linear-gradient(135deg,#ef4444,#dc2626)",color:"#fff",border:"none",borderRadius:12,padding:"15px",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"'Inter',sans-serif",boxShadow:`0 4px 16px ${tradeType==="buy"?"rgba(16,185,129,.35)":"rgba(239,68,68,.35)"}`}}>
                {tradeType==="buy"?`📥 Buy ${selCoin}`:`📤 Sell ${selCoin}`}
              </button>
            </div>

            {/* Live Market Grid */}
            <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:16,padding:"16px",marginBottom:10,boxShadow:T.shadow}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,alignItems:"center"}}>
                <div style={{fontWeight:700,fontSize:13}}>📊 Live Market</div>
                <button onClick={fetchPrices} style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:20,padding:"4px 12px",fontSize:11,color:T.greenDk,fontWeight:600,cursor:"pointer"}}>🔄 Refresh</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                {COINS.slice(0,8).map(coin=>(
                  <div key={coin} onClick={()=>setSelCoin(coin)}
                    style={{background:selCoin===coin?"linear-gradient(135deg,#ecfdf5,#d1fae5)":T.page,border:`1px solid ${selCoin===coin?"#6ee7b7":T.border}`,borderRadius:10,padding:"10px",cursor:"pointer",transition:"all .15s"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span className="mono" style={{fontSize:12,fontWeight:800,color:T.text}}>{coin}</span>
                      {prices[coin]?.ch24!==undefined&&(
                        <span style={{fontSize:10,color:prices[coin].ch24>=0?T.greenDk:"#dc2626",fontWeight:700}}>
                          {prices[coin].ch24>=0?"▲":"▼"}{Math.abs(prices[coin].ch24).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <div className="mono" style={{fontSize:13,fontWeight:700,color:T.text,marginTop:3}}>
                      {fmtUSD(prices[coin]?.price||FALLBACK[coin]||0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent trades */}
            {trades.length>0&&(
              <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:16,padding:"14px",boxShadow:T.shadow}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>📋 Recent Trades</div>
                {trades.slice(0,5).map(t=>(
                  <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:t.type==="BUY"?"#f0fdf4":"#fff1f2",border:`1px solid ${t.type==="BUY"?"#6ee7b7":"#fca5a5"}`,borderRadius:10,padding:"8px 12px",marginBottom:6}}>
                    <div><span style={{fontWeight:700,fontSize:11,color:t.type==="BUY"?T.greenDk:"#dc2626",marginRight:6}}>{t.type}</span><span className="mono" style={{fontSize:11,fontWeight:700}}>{t.coin}</span></div>
                    <div style={{textAlign:"right"}}><div className="mono" style={{fontSize:11,fontWeight:700}}>{fmtINR(t.amt)}</div><div className="mono" style={{fontSize:9,color:T.text3}}>{t.time}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PORTFOLIO TAB ── */}
        {activeTab==="portfolio" && (
          <div className="fadein">
            <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:20,padding:"18px",marginBottom:10,boxShadow:T.shadow}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>💼 My Holdings</div>
              {Object.entries(holdings).filter(([,qty])=>qty>0.000001).length===0?(
                <div style={{textAlign:"center",padding:"24px 0",color:T.text3}}>
                  <div style={{fontSize:36,marginBottom:8}}>📭</div>
                  <p style={{fontSize:13}}>Koi holdings nahi. Trade tab pe jao!</p>
                </div>
              ):(
                <div>
                  {Object.entries(holdings).filter(([,qty])=>qty>0.000001).map(([coin,qty])=>{
                    const livePrice = prices[coin]?.price || FALLBACK[coin] || 0;
                    const currentVal = qty * livePrice;
                    // Calculate cost basis from BUY trades
                    const buys = trades.filter(t=>t.type==="BUY"&&t.coin===coin);
                    const totalCost = buys.reduce((s,t)=>s+t.amt,0);
                    const pnl = currentVal - totalCost;
                    const pnlPctCoin = totalCost > 0 ? ((pnl/totalCost)*100).toFixed(2) : "0.00";
                    const pct = totalValue>0?(currentVal/totalValue*100).toFixed(1):"0";
                    return(
                      <div key={coin} style={{background:"#f8fafc",border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                          <div>
                            <span className="mono" style={{fontWeight:800,fontSize:15}}>{coin}</span>
                            <span className="mono" style={{fontSize:9,color:T.text3,marginLeft:8}}>{qty.toFixed(6)} units</span>
                          </div>
                          <div style={{textAlign:"right"}}>
                            <div className="mono" style={{fontWeight:700,fontSize:14}}>{fmtINR(currentVal)}</div>
                            <div style={{fontSize:10,color:T.text3}}>{pct}% of portfolio</div>
                          </div>
                        </div>
                        {/* P&L Row */}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:pnl>=0?"#f0fdf4":"#fef2f2",borderRadius:8,padding:"6px 10px"}}>
                          <div style={{fontSize:11,color:T.text3}}>Cost: {fmtINR(totalCost)}</div>
                          <div style={{fontSize:12,fontWeight:700,color:pnl>=0?T.greenDk:"#dc2626"}}>
                            {pnl>=0?"▲ +":"-"}{fmtINR(Math.abs(pnl))} ({pnl>=0?"+":""}{pnlPctCoin}%)
                          </div>
                        </div>
                        <div style={{height:4,background:T.border,borderRadius:2,marginTop:8}}>
                          <div style={{width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,#10b981,#059669)",borderRadius:2}}/>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:12,padding:"12px 14px",display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontWeight:700,fontSize:13,color:T.greenDk}}>💵 Cash</span>
                    <span className="mono" style={{fontWeight:800,fontSize:14,color:T.greenDk}}>{fmtINR(cash)}</span>
                  </div>
                </div>
              )}
            </div>
            <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:16,padding:"14px",boxShadow:T.shadow}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>📊 Stats</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[{l:"Total Trades",v:String(trades.length),i:"📊"},{l:"Buys",v:String(trades.filter(t=>t.type==="BUY").length),i:"📥"},
                  {l:"Sells",v:String(trades.filter(t=>t.type==="SELL").length),i:"📤"},{l:"Return",v:`${parseFloat(pnlPct)>=0?"+":""}${pnlPct}%`,i:parseFloat(pnlPct)>=0?"📈":"📉"}].map((s,i)=>(
                  <div key={i} style={{background:T.page,borderRadius:12,padding:"10px 12px"}}>
                    <div style={{fontSize:10,color:T.text3,marginBottom:4,fontWeight:600}}>{s.i} {s.l}</div>
                    <div className="mono" style={{fontSize:16,fontWeight:800}}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {activeTab==="leaderboard" && (
          <div className="fadein">
            <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:20,padding:"18px",marginBottom:10,boxShadow:T.shadow}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>🏆 Arena Leaderboard</div>
              {LEADERBOARD.map((p,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:i===0?"linear-gradient(135deg,#fffbeb,#fef3c7)":T.page,border:`1px solid ${i===0?"#fde68a":T.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:i===0?"linear-gradient(135deg,#fbbf24,#f59e0b)":i===1?"linear-gradient(135deg,#94a3b8,#64748b)":i===2?"linear-gradient(135deg,#cd7c32,#b45309)":"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,color:i<3?"#fff":"#64748b",flexShrink:0}}>{p.badge}</div>
                  <div style={{flex:1}}><div className="mono" style={{fontWeight:700,fontSize:14}}>{p.name}</div></div>
                  <div className="mono" style={{fontSize:16,fontWeight:800,color:T.greenDk}}>{p.pnl}</div>
                </div>
              ))}
              <div style={{borderTop:`2px dashed ${T.border}`,paddingTop:10,marginTop:4}}>
                <div style={{display:"flex",alignItems:"center",gap:12,background:"linear-gradient(135deg,#ecfdf5,#d1fae5)",border:"2px solid #6ee7b7",borderRadius:12,padding:"12px 14px"}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:12,color:"#fff",flexShrink:0}}>You</div>
                  <div style={{flex:1}}><div className="mono" style={{fontWeight:700,fontSize:13}}>Aap</div><div style={{fontSize:10,color:T.text3}}>{trades.length} trades</div></div>
                  <div className="mono" style={{fontSize:15,fontWeight:800,color:parseFloat(pnlPct)>=0?T.greenDk:"#dc2626"}}>{parseFloat(pnlPct)>=0?"+":""}{pnlPct}%</div>
                </div>
              </div>
            </div>
            <div style={{background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)",border:"1px solid #6ee7b7",borderRadius:16,padding:"14px 16px"}}>
              <div style={{fontWeight:700,fontSize:12,color:"#065f46",marginBottom:10}}>💡 Arena Tips</div>
              {["📊 Real traders portfolio 2x/day check karte hain — zyada nahi",
                "🎯 Ek trade mein max 10-15% lagao — diversify karo",
                "⏳ Best traders long-term hold karte hain",
                "📈 BTC/ETH sabse stable — beginners ke liye best",
                "🛑 Stop loss mental rakhna seekho — 6-8% neeche aaye toh exit"].map((tip,i)=>(
                <div key={i} style={{fontSize:11,color:"#166534",lineHeight:1.7,padding:"4px 0",borderBottom:i<4?"1px dashed #6ee7b7":"none"}}>{tip}</div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
