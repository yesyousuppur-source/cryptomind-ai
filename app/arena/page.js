"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const COINS = ["BTC","ETH","SOL","BNB","XRP","ADA","DOGE","MATIC","AVAX","LINK","APT","SUI"];
const STARTING_CASH = 100000; // ₹1,00,000

const fmt  = (n) => n >= 1 ? "₹" + n.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}) : "₹" + n.toPrecision(4);
const fmtN = (n) => n.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2});

const T = {
  green:"#10b981", greenDk:"#059669",
  page:"#f0fdf8", card:"#ffffff", border:"#e2e8f0",
  text:"#0f172a", text2:"#475569", text3:"#94a3b8",
  shadow:"0 4px 20px rgba(0,0,0,.05)",
};

const LEADERBOARD = [
  { name:"Rahul_Mumbai",    pnl:"+47.3%", badge:"🥇" },
  { name:"Priya_BLR",       pnl:"+31.8%", badge:"🥈" },
  { name:"CryptoKing_DEL",  pnl:"+28.4%", badge:"🥉" },
  { name:"SOL_Maxx",        pnl:"+19.2%", badge:"🏅" },
  { name:"DCA_Master",      pnl:"+14.7%", badge:"🏅" },
];

export default function ArenaPage() {
  const [prices, setPrices]       = useState({});
  const [priceLoad, setPriceLoad] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Portfolio stored in state (no localStorage to avoid hydration issues)
  const [cash, setCash]           = useState(STARTING_CASH);
  const [holdings, setHoldings]   = useState({});
  const [trades, setTrades]       = useState([]);
  const [started, setStarted]     = useState(false);

  // Trade form
  const [selCoin, setSelCoin]     = useState("BTC");
  const [tradeAmt, setTradeAmt]   = useState("");
  const [tradeType, setTradeType] = useState("buy");
  const [tradeMsg, setTradeMsg]   = useState(null); // {type,text}
  const [activeTab, setActiveTab] = useState("trade"); // trade|portfolio|leaderboard

  const intervalRef = useRef(null);

  const fetchPrices = async () => {
    try {
      const r = await fetch("/api/arena");
      const j = await r.json();
      if (j.prices && Object.keys(j.prices).length) {
        setPrices(j.prices);
        setLastUpdate(new Date().toLocaleTimeString("en-IN"));
      }
    } catch (_) {}
    setPriceLoad(false);
  };

  useEffect(() => {
    fetchPrices();
    intervalRef.current = setInterval(fetchPrices, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // ── PORTFOLIO VALUE ──────────────────────────────────────────────────────
  const portfolioValue = Object.entries(holdings).reduce((sum, [coin, qty]) => {
    const p = prices[coin]?.price || 0;
    return sum + qty * p;
  }, 0);
  const totalValue = cash + portfolioValue;
  const totalPnL   = totalValue - STARTING_CASH;
  const pnlPct     = ((totalPnL / STARTING_CASH) * 100).toFixed(2);

  // ── EXECUTE TRADE ─────────────────────────────────────────────────────────
  const executeTrade = () => {
    const amt = parseFloat(tradeAmt);
    if (!amt || amt <= 0 || !prices[selCoin]) {
      setTradeMsg({ type:"error", text:"Valid amount daalo." }); return;
    }
    const coinPrice = prices[selCoin].price;

    if (tradeType === "buy") {
      if (amt > cash) {
        setTradeMsg({ type:"error", text:`Insufficient cash! Available: ${fmt(cash)}` }); return;
      }
      const qty = amt / coinPrice;
      setCash(p => p - amt);
      setHoldings(p => ({ ...p, [selCoin]: (p[selCoin] || 0) + qty }));
      setTrades(p => [{
        type:"BUY", coin:selCoin, amt, qty, price:coinPrice,
        time: new Date().toLocaleTimeString("en-IN"), id: Date.now()
      }, ...p]);
      setTradeMsg({ type:"success", text:`✅ Bought ${qty.toFixed(6)} ${selCoin} at ${fmt(coinPrice)}` });
    } else {
      const myQty = holdings[selCoin] || 0;
      const myVal = myQty * coinPrice;
      const sellAmt = Math.min(amt, myVal);
      if (myQty <= 0 || sellAmt <= 0) {
        setTradeMsg({ type:"error", text:`Tumhare paas ${selCoin} nahi hai!` }); return;
      }
      const sellQty = sellAmt / coinPrice;
      const newQty = myQty - sellQty;
      setCash(p => p + sellAmt);
      setHoldings(p => ({ ...p, [selCoin]: newQty < 0.000001 ? 0 : newQty }));
      setTrades(p => [{
        type:"SELL", coin:selCoin, amt:sellAmt, qty:sellQty, price:coinPrice,
        time: new Date().toLocaleTimeString("en-IN"), id: Date.now()
      }, ...p]);
      setTradeMsg({ type:"success", text:`✅ Sold ${sellQty.toFixed(6)} ${selCoin} for ${fmt(sellAmt)}` });
    }
    setTradeAmt("");
    setTimeout(() => setTradeMsg(null), 3000);
  };

  const resetArena = () => {
    setCash(STARTING_CASH); setHoldings({}); setTrades([]);
    setStarted(true); setTradeMsg({ type:"success", text:"🎮 Arena reset! Fresh ₹1,00,000 se shuru karo." });
    setTimeout(()=>setTradeMsg(null),3000);
  };

  const CARD = { background:"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:"18px", marginBottom:12, boxShadow:T.shadow };

  if (!started) {
    return (
      <main style={{ fontFamily:"'Inter',sans-serif", background:T.page, minHeight:"100vh", color:T.text }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
          *{box-sizing:border-box;margin:0;padding:0}
          @keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
          @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
          @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
          .fadein{animation:fadein .4s ease-out}
          .mono{font-family:'JetBrains Mono',monospace}
        `}</style>
        <div style={{ position:"fixed",inset:0,backgroundImage:"radial-gradient(rgba(16,185,129,.07) 1px,transparent 1px)",backgroundSize:"30px 30px",opacity:.4,pointerEvents:"none" }}/>
        <div style={{ maxWidth:680, margin:"0 auto", padding:"36px 16px 56px" }}>
          <Link href="/features" style={{ display:"inline-flex",alignItems:"center",gap:6,color:T.greenDk,textDecoration:"none",fontSize:13,fontWeight:600,marginBottom:28,background:"#fff",border:`1px solid ${T.border}`,borderRadius:20,padding:"6px 14px" }}>
            ← Back to Features
          </Link>
          <div className="fadein" style={{ textAlign:"center" }}>
            <div style={{ fontSize:64, marginBottom:12, animation:"float 3s ease-in-out infinite" }}>🏟️</div>
            <h1 style={{ fontSize:32, fontWeight:900, letterSpacing:-1.5, marginBottom:10, background:"linear-gradient(135deg,#0f172a,#10b981)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Virtual Trading Arena
            </h1>
            <p style={{ fontSize:14, color:T.text2, lineHeight:1.7, maxWidth:420, margin:"0 auto 24px" }}>
              Real market prices. Virtual ₹1,00,000. Zero real risk.<br/>
              <strong style={{ color:T.text }}>Sikho, practice karo, leaderboard pe jao!</strong>
            </p>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, maxWidth:400, margin:"0 auto 28px" }}>
              {[
                {icon:"💰",label:"Starting Cash",val:"₹1,00,000"},
                {icon:"📊",label:"Real Prices",val:"Binance Live"},
                {icon:"🏆",label:"Leaderboard",val:"Top 100"},
                {icon:"🎓",label:"Learn By Doing",val:"Zero Risk"},
              ].map((f,i)=>(
                <div key={i} style={{ background:"#fff", border:`1px solid ${T.border}`, borderRadius:14, padding:"14px", textAlign:"center" }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>{f.icon}</div>
                  <div style={{ fontSize:11, color:T.text3, marginBottom:3 }}>{f.label}</div>
                  <div style={{ fontWeight:700, fontSize:13, color:T.text }}>{f.val}</div>
                </div>
              ))}
            </div>

            <div style={{ background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1px solid #fde68a", borderRadius:14, padding:"14px 18px", maxWidth:420, margin:"0 auto 24px", fontSize:12, color:"#92400e", lineHeight:1.7 }}>
              ⚠️ Yeh virtual trading hai — real money nahi lagti.<br/>
              Real crypto mein invest karne se pehle yahaan practice karo.
            </div>

            <button onClick={()=>{ setStarted(true); fetchPrices(); }}
              style={{ background:"linear-gradient(135deg,#10b981,#059669)", color:"#fff", border:"none", borderRadius:16, padding:"16px 40px", fontWeight:800, fontSize:16, cursor:"pointer", fontFamily:"'Inter',sans-serif", boxShadow:"0 4px 24px rgba(16,185,129,.4)" }}>
              🚀 Enter the Arena — Start with ₹1,00,000
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ fontFamily:"'Inter',sans-serif", background:T.page, minHeight:"100vh", color:T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadein{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.9}}
        @keyframes gradmove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        .fadein{animation:fadein .35s ease-out}
        .mono{font-family:'JetBrains Mono',monospace}
        input,select{color:#0f172a;font-family:'JetBrains Mono',monospace}
        input::placeholder{color:#94a3b8}
        input:focus,select:focus{outline:none;border-color:#10b981!important}
        button:active{transform:scale(.97)}
        .hov{transition:transform .2s,box-shadow .2s}
        .hov:hover{transform:translateY(-2px)}
      `}</style>

      <div style={{ position:"fixed",inset:0,backgroundImage:"radial-gradient(rgba(16,185,129,.07) 1px,transparent 1px)",backgroundSize:"30px 30px",opacity:.4,pointerEvents:"none" }}/>

      <div style={{ maxWidth:700, margin:"0 auto", padding:"20px 16px 56px", position:"relative" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <Link href="/features" style={{ fontSize:13, color:T.greenDk, textDecoration:"none", fontWeight:600, background:"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:"5px 12px" }}>
            ← Features
          </Link>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontWeight:900, fontSize:16, letterSpacing:-.5 }}>🏟️ Trading Arena</div>
            {lastUpdate && <div className="mono" style={{ fontSize:9, color:T.text3 }}>Updated: {lastUpdate}</div>}
          </div>
          <button onClick={resetArena} style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:"5px 12px", cursor:"pointer", fontSize:12, color:"#dc2626", fontWeight:600, fontFamily:"'Inter',sans-serif" }}>
            Reset
          </button>
        </div>

        {/* Portfolio Summary */}
        <div style={{ background: totalPnL >= 0 ? "linear-gradient(135deg,#ecfdf5,#d1fae5)" : "linear-gradient(135deg,#fff1f2,#fee2e2)", border:`1px solid ${totalPnL>=0?"#6ee7b7":"#fca5a5"}`, borderRadius:20, padding:"18px", marginBottom:14, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${totalPnL>=0?"#10b981,#6ee7b7":"#ef4444,#f87171"},transparent)` }}/>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, textAlign:"center" }}>
            <div>
              <div style={{ fontSize:10, color:T.text3, fontWeight:600, marginBottom:4 }}>PORTFOLIO VALUE</div>
              <div className="mono" style={{ fontSize:18, fontWeight:900, color:T.text }}>{fmt(totalValue)}</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:T.text3, fontWeight:600, marginBottom:4 }}>TOTAL P&L</div>
              <div className="mono" style={{ fontSize:18, fontWeight:900, color: totalPnL>=0?T.greenDk:"#dc2626" }}>
                {totalPnL>=0?"+":""}{fmt(Math.abs(totalPnL))}
              </div>
              <div style={{ fontSize:11, color: totalPnL>=0?T.greenDk:"#dc2626", fontWeight:700 }}>
                {totalPnL>=0?"+":""}{pnlPct}%
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:T.text3, fontWeight:600, marginBottom:4 }}>CASH LEFT</div>
              <div className="mono" style={{ fontSize:18, fontWeight:900, color:T.text }}>{fmt(cash)}</div>
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ background:"#fff", borderRadius:14, padding:"5px", marginBottom:14, display:"flex", gap:2, border:`1px solid ${T.border}` }}>
          {[{id:"trade",label:"📈 Trade"},{id:"portfolio",label:"💼 Portfolio"},{id:"leaderboard",label:"🏆 Leaders"}].map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{ flex:1, background: activeTab===t.id?"linear-gradient(135deg,#ecfdf5,#d1fae5)":"transparent", color: activeTab===t.id?T.greenDk:T.text3, border: activeTab===t.id?"1px solid #6ee7b7":"1px solid transparent", borderRadius:10, padding:"9px 4px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Inter',sans-serif", transition:"all .2s" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TRADE TAB ── */}
        {activeTab==="trade" && (
          <div className="fadein">
            {/* Trade form */}
            <div style={{ ...CARD }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>⚡ Execute Trade</div>

              {/* Buy/Sell toggle */}
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <button onClick={()=>setTradeType("buy")}
                  style={{ flex:1, background: tradeType==="buy"?"linear-gradient(135deg,#ecfdf5,#d1fae5)":"#f8fafc", color: tradeType==="buy"?T.greenDk:T.text3, border: tradeType==="buy"?"1px solid #6ee7b7":`1px solid ${T.border}`, borderRadius:12, padding:"10px", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"'Inter',sans-serif", transition:"all .2s" }}>
                  📥 BUY
                </button>
                <button onClick={()=>setTradeType("sell")}
                  style={{ flex:1, background: tradeType==="sell"?"linear-gradient(135deg,#fff1f2,#fee2e2)":"#f8fafc", color: tradeType==="sell"?"#dc2626":T.text3, border: tradeType==="sell"?"1px solid #fca5a5":`1px solid ${T.border}`, borderRadius:12, padding:"10px", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"'Inter',sans-serif", transition:"all .2s" }}>
                  📤 SELL
                </button>
              </div>

              {/* Coin select */}
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, color:T.text3, fontWeight:600, marginBottom:6, letterSpacing:.5 }}>SELECT COIN</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {COINS.map(c=>(
                    <button key={c} onClick={()=>setSelCoin(c)}
                      style={{ background: selCoin===c?"linear-gradient(135deg,#10b981,#059669)":"#f8fafc", color: selCoin===c?"#fff":T.text2, border: selCoin===c?"none":`1px solid ${T.border}`, borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", transition:"all .15s" }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price display */}
              {prices[selCoin] && (
                <div style={{ background:"#f8fafc", borderRadius:12, padding:"10px 14px", marginBottom:10, display:"flex", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:10, color:T.text3, fontWeight:600 }}>LIVE PRICE</div>
                    <div className="mono" style={{ fontSize:16, fontWeight:800 }}>${prices[selCoin].price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:11, color: prices[selCoin].ch24>=0?T.greenDk:"#dc2626", fontWeight:700 }}>
                      {prices[selCoin].ch24>=0?"▲":"▼"}{Math.abs(prices[selCoin].ch24).toFixed(2)}% 24h
                    </div>
                    {holdings[selCoin]>0 && (
                      <div className="mono" style={{ fontSize:10, color:T.text3, marginTop:2 }}>
                        You hold: {holdings[selCoin].toFixed(6)} {selCoin}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Amount input */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, color:T.text3, fontWeight:600, marginBottom:6, letterSpacing:.5 }}>
                  AMOUNT IN ₹ {tradeType==="buy"?`(Available: ${fmt(cash)})`:holdings[selCoin]>0?`(Holdings: ${fmt((holdings[selCoin]||0)*(prices[selCoin]?.price||0))})`:""} 
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <input value={tradeAmt} onChange={e=>setTradeAmt(e.target.value)}
                    placeholder="₹ amount to invest"
                    type="number"
                    style={{ flex:1, background:"#f8fafc", border:"2px solid #e2e8f0", borderRadius:12, padding:"11px 14px", fontSize:14, color:T.text, transition:"border-color .2s" }}
                    onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                </div>
                {/* Quick amounts */}
                <div style={{ display:"flex", gap:6, marginTop:8 }}>
                  {[1000,5000,10000,25000].map(a=>(
                    <button key={a} onClick={()=>setTradeAmt(String(a))}
                      style={{ flex:1, background:"#f0fdf4", border:"1px solid #6ee7b7", borderRadius:10, padding:"5px", fontSize:11, color:T.greenDk, fontWeight:600, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace" }}>
                      ₹{a>=1000?`${a/1000}K`:a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {tradeAmt && prices[selCoin] && (
                <div style={{ background: tradeType==="buy"?"#f0fdf4":"#fef2f2", border:`1px solid ${tradeType==="buy"?"#6ee7b7":"#fecaca"}`, borderRadius:10, padding:"10px 12px", marginBottom:12, fontSize:12, color: tradeType==="buy"?T.greenDk:"#dc2626", fontWeight:600 }}>
                  {tradeType==="buy"
                    ? `You'll get: ~${(parseFloat(tradeAmt||0)/prices[selCoin].price).toFixed(6)} ${selCoin}`
                    : `You'll get: ~${fmt(Math.min(parseFloat(tradeAmt||0),(holdings[selCoin]||0)*prices[selCoin].price))}`}
                </div>
              )}

              {tradeMsg && (
                <div style={{ background: tradeMsg.type==="success"?"#ecfdf5":"#fef2f2", border:`1px solid ${tradeMsg.type==="success"?"#6ee7b7":"#fecaca"}`, borderRadius:10, padding:"10px 12px", marginBottom:10, fontSize:12, color: tradeMsg.type==="success"?T.greenDk:"#dc2626", fontWeight:600 }}>
                  {tradeMsg.text}
                </div>
              )}

              <button onClick={executeTrade}
                style={{ width:"100%", background: tradeType==="buy"?"linear-gradient(135deg,#10b981,#059669)":"linear-gradient(135deg,#ef4444,#dc2626)", color:"#fff", border:"none", borderRadius:12, padding:"14px", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"'Inter',sans-serif", boxShadow:`0 4px 16px ${tradeType==="buy"?"rgba(16,185,129,.35)":"rgba(239,68,68,.35)"}` }}>
                {tradeType==="buy" ? `📥 Buy ${selCoin}` : `📤 Sell ${selCoin}`}
              </button>
            </div>

            {/* Live prices */}
            <div style={{ ...CARD }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>📊 Live Market</div>
                <button onClick={fetchPrices} style={{ background:"#f0fdf4", border:"1px solid #6ee7b7", borderRadius:20, padding:"3px 12px", fontSize:11, color:T.greenDk, fontWeight:600, cursor:"pointer" }}>🔄</button>
              </div>
              {priceLoad ? (
                <div style={{ height:60, background:"#f0fdf4", borderRadius:10, animation:"shimmer 1.5s infinite" }}/>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:6 }}>
                  {COINS.slice(0,8).map(coin => prices[coin] && (
                    <div key={coin} onClick={()=>setSelCoin(coin)}
                      style={{ background: selCoin===coin?"linear-gradient(135deg,#ecfdf5,#d1fae5)":T.page, border:`1px solid ${selCoin===coin?"#6ee7b7":T.border}`, borderRadius:10, padding:"8px 10px", cursor:"pointer", transition:"all .15s" }}>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span className="mono" style={{ fontSize:11, fontWeight:700 }}>{coin}</span>
                        <span style={{ fontSize:10, color: prices[coin].ch24>=0?T.greenDk:"#dc2626", fontWeight:700 }}>
                          {prices[coin].ch24>=0?"▲":"▼"}{Math.abs(prices[coin].ch24).toFixed(1)}%
                        </span>
                      </div>
                      <div className="mono" style={{ fontSize:12, fontWeight:800, color:T.text, marginTop:2 }}>
                        ${prices[coin].price >= 1 ? prices[coin].price.toLocaleString(undefined,{maximumFractionDigits:2}) : prices[coin].price.toPrecision(4)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent trades */}
            {trades.length > 0 && (
              <div style={{ ...CARD }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>📋 Recent Trades</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {trades.slice(0,5).map(t=>(
                    <div key={t.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:t.type==="BUY"?"#f0fdf4":"#fff1f2", border:`1px solid ${t.type==="BUY"?"#6ee7b7":"#fca5a5"}`, borderRadius:10, padding:"8px 12px" }}>
                      <div>
                        <span style={{ fontWeight:700, fontSize:12, color:t.type==="BUY"?T.greenDk:"#dc2626", marginRight:6 }}>{t.type}</span>
                        <span className="mono" style={{ fontSize:12, fontWeight:700 }}>{t.coin}</span>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div className="mono" style={{ fontSize:12, fontWeight:700 }}>{fmt(t.amt)}</div>
                        <div className="mono" style={{ fontSize:9, color:T.text3 }}>{t.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PORTFOLIO TAB ── */}
        {activeTab==="portfolio" && (
          <div className="fadein">
            <div style={{ ...CARD }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>💼 My Holdings</div>
              {Object.entries(holdings).filter(([,qty])=>qty>0.000001).length === 0 ? (
                <div style={{ textAlign:"center", padding:"24px 0", color:T.text3 }}>
                  <div style={{ fontSize:36, marginBottom:8 }}>📭</div>
                  <p style={{ fontSize:13 }}>Koi holdings nahi abhi. Trade tab pe jao aur buy karo!</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {Object.entries(holdings).filter(([,qty])=>qty>0.000001).map(([coin, qty]) => {
                    const p = prices[coin]?.price || 0;
                    const val = qty * p;
                    const pct = (val / totalValue * 100).toFixed(1);
                    return (
                      <div key={coin} style={{ background:"#f8fafc", border:`1px solid ${T.border}`, borderRadius:12, padding:"12px 14px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <div>
                            <span className="mono" style={{ fontWeight:800, fontSize:15 }}>{coin}</span>
                            <span className="mono" style={{ fontSize:10, color:T.text3, marginLeft:8 }}>{qty.toFixed(6)} units</span>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <div className="mono" style={{ fontWeight:700, fontSize:14 }}>{fmt(val)}</div>
                            <div style={{ fontSize:10, color:T.text3 }}>{pct}% of portfolio</div>
                          </div>
                        </div>
                        <div style={{ height:4, background:T.border, borderRadius:2 }}>
                          <div style={{ width:`${pct}%`, height:"100%", background:"linear-gradient(90deg,#10b981,#059669)", borderRadius:2 }}/>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ background:"#f0fdf4", border:"1px solid #6ee7b7", borderRadius:12, padding:"12px 14px", display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontWeight:700, fontSize:13, color:T.greenDk }}>💵 Cash Balance</span>
                    <span className="mono" style={{ fontWeight:800, fontSize:14, color:T.greenDk }}>{fmt(cash)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* AI Portfolio Analysis */}
            <div style={{ ...CARD }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>🤖 Arena Stats</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
                {[
                  { label:"Total Trades", val:String(trades.length), icon:"📊" },
                  { label:"Buy Trades",   val:String(trades.filter(t=>t.type==="BUY").length), icon:"📥" },
                  { label:"Sell Trades",  val:String(trades.filter(t=>t.type==="SELL").length), icon:"📤" },
                  { label:"Return",       val:`${parseFloat(pnlPct)>=0?"+":""}${pnlPct}%`, icon:parseFloat(pnlPct)>=0?"📈":"📉" },
                ].map((s,i)=>(
                  <div key={i} style={{ background:T.page, borderRadius:12, padding:"10px 12px" }}>
                    <div style={{ fontSize:10, color:T.text3, marginBottom:4, fontWeight:600 }}>{s.icon} {s.label}</div>
                    <div className="mono" style={{ fontSize:16, fontWeight:800, color:T.text }}>{s.val}</div>
                  </div>
                ))}
              </div>
              {trades.length >= 3 && (
                <div style={{ marginTop:12, background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1px solid #fde68a", borderRadius:12, padding:"12px 14px", fontSize:12, color:"#92400e", lineHeight:1.7 }}>
                  💡 <strong>Pattern detected:</strong> {trades.filter(t=>t.type==="BUY").length > trades.filter(t=>t.type==="SELL").length
                    ? "Tum zyada buy kar rahe ho — profit booking bhi zaroori hai!"
                    : "Tum zyada sell kar rahe ho — long-term holding try karo!"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── LEADERBOARD TAB ── */}
        {activeTab==="leaderboard" && (
          <div className="fadein">
            <div style={{ ...CARD }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>🏆 Arena Leaderboard</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {LEADERBOARD.map((p,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:i===0?"linear-gradient(135deg,#fffbeb,#fef3c7)":i===1?"linear-gradient(135deg,#f8fafc,#f1f5f9)":T.page, border:`1px solid ${i===0?"#fde68a":T.border}`, borderRadius:12, padding:"12px 14px" }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:i===0?"linear-gradient(135deg,#fbbf24,#f59e0b)":i===1?"linear-gradient(135deg,#94a3b8,#64748b)":i===2?"linear-gradient(135deg,#cd7c32,#b45309)":"#e2e8f0", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:14, color:i<3?"#fff":"#64748b", flexShrink:0 }}>
                      {p.badge}
                    </div>
                    <div style={{ flex:1 }}>
                      <div className="mono" style={{ fontWeight:700, fontSize:14 }}>{p.name}</div>
                      <div style={{ fontSize:10, color:T.text3, marginTop:1 }}>Virtual Portfolio</div>
                    </div>
                    <div className="mono" style={{ fontSize:16, fontWeight:800, color:T.greenDk }}>{p.pnl}</div>
                  </div>
                ))}
                {/* User's position */}
                <div style={{ borderTop:`2px dashed ${T.border}`, paddingTop:8, marginTop:4 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, background:"linear-gradient(135deg,#ecfdf5,#d1fae5)", border:"2px solid #6ee7b7", borderRadius:12, padding:"12px 14px" }}>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#10b981,#059669)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:14, color:"#fff", flexShrink:0 }}>
                      You
                    </div>
                    <div style={{ flex:1 }}>
                      <div className="mono" style={{ fontWeight:700, fontSize:14 }}>YourUsername</div>
                      <div style={{ fontSize:10, color:T.text3, marginTop:1 }}>{trades.length} trades made</div>
                    </div>
                    <div className="mono" style={{ fontSize:16, fontWeight:800, color: parseFloat(pnlPct)>=0?T.greenDk:"#dc2626" }}>
                      {parseFloat(pnlPct)>=0?"+":""}{pnlPct}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)", border:"1px solid #6ee7b7", borderRadius:16, padding:"16px 18px" }}>
              <div style={{ fontWeight:700, fontSize:13, color:"#065f46", marginBottom:10 }}>💡 Arena Tips</div>
              {[
                "📊 Real traders apna portfolio 2x/day check karte hain — zyada nahi",
                "🎯 Ek trade mein max 10-15% lagao — diversify karo",
                "⏳ Best traders long-term hold karte hain — daily trading nahi",
                "📈 BTC/ETH sabse stable — beginners ke liye best",
                "🛑 Stop loss mental rakhna seekho — 6-8% neeche aaye toh reconsider",
              ].map((t,i)=>(
                <div key={i} style={{ fontSize:12, color:"#166534", lineHeight:1.7, padding:"4px 0", borderBottom:i<4?"1px dashed #6ee7b7":"none" }}>{t}</div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
