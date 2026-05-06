"use client";
import { useState } from "react";
import Link from "next/link";

const T = {
  green:"#10b981", greenDk:"#059669",
  page:"#f0fdf8", card:"#ffffff", border:"#e2e8f0",
  text:"#0f172a", text2:"#475569", text3:"#94a3b8",
  shadow:"0 4px 20px rgba(0,0,0,.05)",
};

const TABS = [
  { id:"iq",        icon:"🧠", label:"IQ Test"       },
  { id:"health",    icon:"🏥", label:"Health Check"   },
  { id:"portfolio", icon:"💼", label:"Portfolio"      },
  { id:"streak",    icon:"🔥", label:"Daily Streak"   },
  { id:"desi",      icon:"🌍", label:"Desi Network"   },
  { id:"tax",       icon:"🧾", label:"Tax Calc"       },
];

// ── IQ TEST QUESTIONS ─────────────────────────────────────────────────────────
const IQ_QUESTIONS = [
  // Knowledge
  { id:1, type:"knowledge", round:"📚 Round 1: Knowledge",
    q:"Bitcoin ka maximum supply kitna hai?",
    options:["21 Million","100 Million","Unlimited","50 Million"],
    correct:0, behaviorFlag:null },
  { id:2, type:"knowledge", round:"📚 Round 1: Knowledge",
    q:"RSI 30 se neeche aane ka matlab kya hai?",
    options:["Overbought — sell karo","Oversold — buy opportunity","Neutral zone","Market band hai"],
    correct:1, behaviorFlag:null },
  { id:3, type:"knowledge", round:"📚 Round 1: Knowledge",
    q:"DCA ka matlab kya hai?",
    options:["Daily Crypto Analysis","Dollar Cost Averaging","Decentralized Capital Assets","Digital Currency Account"],
    correct:1, behaviorFlag:null },
  // Behavior traps
  { id:4, type:"behavior", round:"🎭 Round 2: Behavior",
    q:"Ek coin aaj 300% pump hua. Kya tum abhi buy karoge?",
    options:["Haan! Miss nahi kar sakta","Thoda wait karunga","Nahi — already late hai","Research karunga pehle"],
    correct:null, behaviorFlag:"FOMO_DETECTOR" },
  { id:5, type:"behavior", round:"🎭 Round 2: Behavior",
    q:"Tumhara coin 40% gira. Tumne kya kiya?",
    options:["Aur kharida (DCA)","Ghabra ke sab bech diya","Hold rakha","Social media pe advice maanga"],
    correct:null, behaviorFlag:"PANIC_DETECTOR" },
  { id:6, type:"behavior", round:"🎭 Round 2: Behavior",
    q:"WhatsApp group mein kisi ne kaha '100x coin' — tumhara reaction?",
    options:["Turant invest kiya","Research kiya","Ignore kar diya","Dosto ko forward kiya"],
    correct:null, behaviorFlag:"FOMO_GROUP" },
  // Scenario
  { id:7, type:"scenario", round:"🎯 Round 3: Scenario",
    q:"Tumhara ₹50,000 ka portfolio ₹35,000 ho gaya. Next move?",
    options:["Sab nikal lo — aur loss nahi karni","Hold — fundamentals check karo","Aur daalo — cheap prices hain","Expert se puchho"],
    correct:null, behaviorFlag:"LOSS_BEHAVIOR" },
  { id:8, type:"scenario", round:"🎯 Round 3: Scenario",
    q:"Market ATH pe hai. Tumhara coin 3x ho gaya. Tum kya karoge?",
    options:["Aur hold — 10x tak wait","Half profit book karo","Sab nikal lo","Kuch nahi — dekhte rehte hain"],
    correct:null, behaviorFlag:"GREED_DETECTOR" },
];

// ── BUDDY SYSTEM DATA ─────────────────────────────────────────────────────────
const BUDDY_PROFILES = [
  { name:"Rahul M.", city:"Mumbai", exp:"2 years", style:"DCA Expert", rating:4.9, helped:23, available:true, badge:"🏆" },
  { name:"Priya S.", city:"Bangalore", exp:"3 years", style:"Technical Analysis", rating:4.8, helped:18, available:true, badge:"⭐" },
  { name:"Dev K.", city:"Delhi", exp:"1 year", style:"Long-term HODLer", rating:4.7, helped:9, available:false, badge:"🌱" },
  { name:"Anita R.", city:"Pune", exp:"4 years", style:"Risk Management", rating:5.0, helped:31, available:true, badge:"👑" },
  { name:"Vikram P.", city:"Hyderabad", exp:"2 years", style:"Altcoin Research", rating:4.6, helped:15, available:true, badge:"🔬" },
];

const DESI_COINS = ["BTC","ETH","SOL","BNB","XRP","MATIC","DOGE"];

export default function FeaturesPage() {
  const [tab, setTab] = useState("iq");

  // IQ Test state
  const [iqScreen, setIqScreen]     = useState("intro"); // intro | quiz | result
  const [currentQ, setCurrentQ]     = useState(0);       // 0-7 question index
  const [iqAnswers, setIqAnswers]   = useState([]);
  const [iqResult, setIqResult]     = useState("");
  const [iqLoading, setIqLoading]   = useState(false);
  const [transitioning, setTransitioning] = useState(false); // prevent double click

  // Health state
  const [coins, setCoins]           = useState([{ coin:"", amount:"", currency:"INR" }]);
  const [checkFreq, setCheckFreq]   = useState("5");
  const [healthResult, setHealthResult] = useState("");
  const [healthLoad, setHealthLoad] = useState(false);

  // Portfolio Tracker state
  const [pfCoins, setPfCoins]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("yyp_portfolio")||"[]"); } catch { return []; }
  });
  const [pfForm, setPfForm]         = useState({ coin:"", qty:"", buyPrice:"", currency:"INR" });
  const [pfPrices, setPfPrices]     = useState({});
  const [pfLoad, setPfLoad]         = useState(false);

  // Daily Streak state
  const [streak, setStreak]         = useState(() => {
    try { return parseInt(localStorage.getItem("yyp_streak")||"0"); } catch { return 0; }
  });
  const [lastVisit, setLastVisit]   = useState(() => {
    try { return localStorage.getItem("yyp_last_visit")||""; } catch { return ""; }
  });
  const [streakMsg, setStreakMsg]   = useState("");

  // Desi state
  const [desiCoin, setDesiCoin]     = useState("BTC");
  const [desiResult, setDesiResult] = useState("");
  const [desiLoad, setDesiLoad]     = useState(false);

  // Tax Calculator state
  const [taxBuyPrice, setTaxBuyPrice]   = useState("");
  const [taxSellPrice, setTaxSellPrice] = useState("");
  const [taxQty, setTaxQty]             = useState("");
  const [taxCur, setTaxCur]             = useState("INR");
  const [taxResult, setTaxResult]       = useState(null);

  // Trader Badge state — localStorage based
  const [badges, setBadges] = useState([]);

  // ── IQ TEST ──────────────────────────────────────────────────────────────
  const handleAnswer = async (ansIdx) => {
    if (transitioning) return;
    setTransitioning(true);
    const q = IQ_QUESTIONS[currentQ];
    const newAnswers = [...iqAnswers, {
      question: q.q,
      answer: q.options[ansIdx],
      correct: q.correct !== null ? (ansIdx === q.correct ? "Yes" : "No") : "N/A",
      behaviorFlag: q.behaviorFlag || "none",
    }];
    setIqAnswers(newAnswers);
    const isLast = currentQ === IQ_QUESTIONS.length - 1;
    if (!isLast) {
      setTimeout(() => {
        setCurrentQ(prev => prev + 1);
        setTransitioning(false);
      }, 300);
    } else {
      setIqScreen("result");
      setIqLoading(true);
      setTransitioning(false);
      try {
        const r = await fetch("/api/ai", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ mode:"iq_test", iqAnswers: newAnswers }),
        });
        const j = await r.json();
        setIqResult(j.text || "");
      } catch { setIqResult("Score calculate nahi ho saka. Please try again."); }
      setIqLoading(false);
    }
  };

  const resetIQ = () => {
    setIqScreen("intro"); setCurrentQ(0);
    setIqAnswers([]); setIqResult(""); setTransitioning(false);
  };

  // ── HEALTH CHECKUP ────────────────────────────────────────────────────────
  const addCoin = () => setCoins(p => [...p, { coin:"", amount:"", currency:"INR" }]);
  const updateCoin = (i, field, val) => setCoins(p => p.map((c,idx) => idx===i ? {...c,[field]:val} : c));
  const removeCoin = (i) => setCoins(p => p.filter((_,idx) => idx!==i));

  const runHealthCheck = async () => {
    const valid = coins.filter(c => c.coin && c.amount);
    if (!valid.length) return;
    setHealthLoad(true); setHealthResult("");
    try {
      const r = await fetch("/api/ai", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ mode:"health_checkup", portfolio: valid.map(c=>({...c,checkFreq})) }),
      });
      const j = await r.json();
      setHealthResult(j.text || "");
    } catch { setHealthResult("Could not generate report. Please try again."); }
    setHealthLoad(false);
  };

  // ── PORTFOLIO TRACKER ────────────────────────────────────────────────────
  const addCoinToPortfolio = () => {
    if (!pfForm.coin || !pfForm.qty || !pfForm.buyPrice) return;
    const newCoin = { ...pfForm, id: Date.now() };
    const updated = [...pfCoins, newCoin];
    setPfCoins(updated);
    try { localStorage.setItem("yyp_portfolio", JSON.stringify(updated)); } catch {}
    setPfForm({ coin:"", qty:"", buyPrice:"", currency:"INR" });
  };

  const removeCoinFromPortfolio = (id) => {
    const updated = pfCoins.filter(c => c.id !== id);
    setPfCoins(updated);
    try { localStorage.setItem("yyp_portfolio", JSON.stringify(updated)); } catch {}
  };

  const fetchPortfolioPrices = async () => {
    if (!pfCoins.length) return;
    setPfLoad(true);
    try {
      const syms = [...new Set(pfCoins.map(c => c.coin.toUpperCase()))];
      const results = await Promise.allSettled(
        syms.map(s => fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${s}USDT`).then(r=>r.json()))
      );
      const prices = {};
      results.forEach((r, i) => {
        if (r.status==="fulfilled" && r.value?.price) prices[syms[i]] = parseFloat(r.value.price);
      });
      setPfPrices(prices);
    } catch {}
    setPfLoad(false);
  };

  // ── DAILY STREAK ─────────────────────────────────────────────────────────
  const checkStreak = () => {
    const today = new Date().toDateString();
    if (lastVisit === today) {
      setStreakMsg(`🔥 Aaj already check kiya! Streak: ${streak} days`);
      return;
    }
    const yesterday = new Date(Date.now()-86400000).toDateString();
    const newStreak = lastVisit === yesterday ? streak + 1 : 1;
    setStreak(newStreak);
    setLastVisit(today);
    try {
      localStorage.setItem("yyp_streak", String(newStreak));
      localStorage.setItem("yyp_last_visit", today);
    } catch {}
    setStreakMsg(newStreak === 1 ? "🎉 Streak shuru! Kal bhi aana!" : `🔥 ${newStreak} din ki streak! Keep going!`);
  };

  // ── DESI NETWORK ─────────────────────────────────────────────────────────
  const fetchDesiInsight = async () => {
    setDesiLoad(true); setDesiResult("");
    try {
      const tickR = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${desiCoin}USDT`);
      const tick = tickR.ok ? await tickR.json() : {};
      const marketData = `Price: $${parseFloat(tick.lastPrice||0).toFixed(2)} | 24h: ${parseFloat(tick.priceChangePercent||0).toFixed(2)}% | Volume: $${(parseFloat(tick.quoteVolume||0)/1e6).toFixed(1)}M`;
      const r = await fetch("/api/ai", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ mode:"desi_network", networkCoin:desiCoin, marketData }),
      });
      const j = await r.json(); setDesiResult(j.text || "");
    } catch { setDesiResult("Could not fetch insight. Please try again."); }
    setDesiLoad(false);
  };

  // ── TAX CALCULATOR ────────────────────────────────────────────────────────
  const calcTax = () => {
    const buy  = parseFloat(taxBuyPrice);
    const sell = parseFloat(taxSellPrice);
    const qty  = parseFloat(taxQty);
    if (!buy||!sell||!qty||buy<=0||sell<=0||qty<=0) return;
    const profit     = (sell - buy) * qty;
    const isProfit   = profit > 0;
    const tax30      = isProfit ? profit * 0.30 : 0;
    const tds1       = sell * qty * 0.01;
    const netProfit  = profit - tax30;
    const profitPct  = ((sell - buy) / buy * 100).toFixed(2);
    const sym        = taxCur === "INR" ? "₹" : "$";
    setTaxResult({ buy, sell, qty, profit, tax30, tds1, netProfit, profitPct, isProfit, sym });
  };

  // ── TRADER BADGES ─────────────────────────────────────────────────────────
  const ALL_BADGES = [
    { id:"curious",   icon:"🔍", name:"Curious Trader",    desc:"First time analysis kiya",        req:1  },
    { id:"watcher",   icon:"👀", name:"Market Watcher",    desc:"10 baar analysis kiya",            req:10 },
    { id:"analyst",   icon:"📊", name:"Crypto Analyst",   desc:"50 baar analysis kiya",            req:50 },
    { id:"diamond",   icon:"💎", name:"Diamond Hands",    desc:"100 baar analysis kiya",           req:100},
    { id:"iq_taker",  icon:"🧠", name:"IQ Champion",      desc:"Crypto IQ test diya",              req:0  },
    { id:"tax_guru",  icon:"🧾", name:"Tax Guru",         desc:"Tax calculator use kiya",          req:0  },
    { id:"whale_eye", icon:"🐋", name:"Whale Watcher",    desc:"Whale alert scan kiya",            req:0  },
    { id:"hodler",    icon:"🏆", name:"True HODLer",      desc:"Arena mein trade kiya",            req:0  },
  ];

  // Load badges from localStorage
  const [analysisCount, setAnalysisCount] = useState(0);
  const [earnedBadges, setEarnedBadges]   = useState([]);

  // ── SHARED STYLES ─────────────────────────────────────────────────────────
  const CARD = { background:"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:"20px", marginBottom:12, boxShadow:T.shadow };
  const BTN  = { background:`linear-gradient(135deg,${T.green},${T.greenDk})`, color:"#fff", border:"none", borderRadius:12, padding:"12px 20px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"'Inter',sans-serif", boxShadow:"0 4px 16px rgba(16,185,129,.35)", transition:"all .2s" };
  const INP  = { background:"#f8fafc", border:`2px solid ${T.border}`, borderRadius:12, padding:"10px 13px", fontSize:13, color:T.text, fontFamily:"'JetBrains Mono',monospace", width:"100%", transition:"border-color .2s" };

  const AiResult = ({ text, loading }) => (
    <div style={{ background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)", border:"1px solid #6ee7b7", borderRadius:16, padding:"18px", marginTop:12, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#10b981,#6ee7b7,#10b981)", backgroundSize:"200% auto", animation:"gradmove 3s linear infinite" }}/>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{ background:"linear-gradient(135deg,#10b981,#059669)", borderRadius:6, padding:"2px 8px", fontWeight:800, fontSize:11, color:"#fff" }}>YYP</div>
        <span style={{ fontWeight:700, fontSize:12, color:"#059669" }}>YES YOU PRO AI</span>
        {loading && <div style={{ display:"flex", gap:3, marginLeft:"auto" }}>{[0,1,2].map(i=><div key={i} style={{ width:4, height:4, borderRadius:"50%", background:"#10b981", animation:`blink 1.2s ${i*.2}s infinite` }}/>)}</div>}
      </div>
      {loading
        ? <div style={{ height:80, background:"rgba(16,185,129,.08)", borderRadius:10, animation:"shimmer 1.5s infinite" }}/>
        : <p style={{ fontSize:13, color:"#166534", lineHeight:1.8, whiteSpace:"pre-line", fontWeight:500 }}>{text}</p>}
    </div>
  );

  return (
    <main style={{ fontFamily:"'Inter',sans-serif", background:T.page, minHeight:"100vh", color:T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes shimmer{0%,100%{opacity:.4}50%{opacity:.9}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes gradmove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        .fadein{animation:fadein .4s cubic-bezier(.16,1,.3,1)}
        .mono{font-family:'JetBrains Mono',monospace}
        input,select,textarea{color:#0f172a;font-family:'JetBrains Mono',monospace}
        input::placeholder,textarea::placeholder{color:#94a3b8}
        input:focus,select:focus{outline:none;border-color:#10b981!important}
        button:active{transform:scale(.97)}
        .hov{transition:transform .2s,box-shadow .2s}
        .hov:hover{transform:translateY(-2px);box-shadow:0 12px 32px rgba(16,185,129,.12)!important}
        .ans-btn{width:100%;text-align:left;background:#f8fafc;border:2px solid #e2e8f0;borderRadius:12px;padding:12px 16px;fontSize:13px;cursor:pointer;transition:all .15s;font-family:'Inter',sans-serif;color:#0f172a;fontWeight:500}
        .ans-btn:hover{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-color:#10b981;color:#059669}
      `}</style>

      <div style={{ position:"fixed", inset:0, backgroundImage:"radial-gradient(rgba(16,185,129,.07) 1px,transparent 1px)", backgroundSize:"30px 30px", opacity:.4, pointerEvents:"none" }}/>

      <div style={{ maxWidth:700, margin:"0 auto", padding:"28px 16px 56px", position:"relative" }}>

        {/* Back */}
        <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:6, color:T.greenDk, textDecoration:"none", fontSize:13, fontWeight:600, marginBottom:24, background:"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:"6px 14px", boxShadow:T.shadow }}>
          ← Back to Home
        </Link>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#ecfdf5,#d1fae5)", border:"1px solid #6ee7b7", borderRadius:40, padding:"5px 16px", marginBottom:14 }}>
            <span style={{ fontSize:14 }}>✨</span>
            <span className="mono" style={{ fontSize:10, color:T.greenDk, fontWeight:600, letterSpacing:2 }}>EXCLUSIVE FEATURES</span>
          </div>
          <h1 style={{ fontSize:30, fontWeight:900, letterSpacing:-1.5, marginBottom:6, background:"linear-gradient(135deg,#0f172a,#10b981)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            YYP Special Tools
          </h1>
          <p style={{ fontSize:13, color:T.text3 }}>Duniya mein pehli baar — sirf YesYouPro pe</p>
        </div>

        {/* Tab Bar */}
        <div style={{ background:"#fff", borderRadius:16, padding:"6px", marginBottom:20, boxShadow:T.shadow, border:`1px solid ${T.border}`, display:"flex", gap:2 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ flex:1, border: tab===t.id?"1px solid #6ee7b7":"1px solid transparent", background: tab===t.id?"linear-gradient(135deg,#ecfdf5,#d1fae5)":"transparent", color: tab===t.id?T.greenDk:T.text3, borderRadius:12, padding:"10px 4px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, transition:"all .2s", fontFamily:"'Inter',sans-serif", fontWeight:600 }}>
              <span style={{ fontSize:18 }}>{t.icon}</span>
              <span style={{ fontSize:10 }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* IQ TEST                                                          */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {tab==="iq" && (
          <div className="fadein">

            {/* INTRO */}
            {iqScreen === "intro" && (
              <div style={{ ...CARD, textAlign:"center" }}>
                <div style={{ fontSize:56, marginBottom:12 }}>🧠</div>
                <h2 style={{ fontSize:22, fontWeight:900, letterSpacing:-1, marginBottom:8 }}>Crypto IQ Test</h2>
                <p style={{ fontSize:13, color:T.text2, lineHeight:1.7, marginBottom:16, maxWidth:380, margin:"0 auto 16px" }}>
                  World's first crypto knowledge + behavior test. 8 questions — trader personality, strengths, weaknesses aur perfect strategy milegi.
                </p>
                <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginBottom:20 }}>
                  {["📚 Knowledge","🎭 Behavior","🎯 Scenarios","🏆 Badge"].map((f,i)=>(
                    <span key={i} style={{ background:"#f0fdf4", border:"1px solid #6ee7b7", borderRadius:20, padding:"4px 12px", fontSize:11, color:T.greenDk, fontWeight:600 }}>{f}</span>
                  ))}
                </div>
                <div style={{ background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1px solid #fde68a", borderRadius:12, padding:"10px 14px", marginBottom:18, fontSize:12, color:"#92400e" }}>
                  ⏱️ 3-4 minutes · WhatsApp pe share kar sakte ho
                </div>
                <button style={{ ...BTN, padding:"14px 36px", fontSize:15, borderRadius:14 }}
                  onClick={()=>{ setIqScreen("quiz"); setCurrentQ(0); setIqAnswers([]); }}>
                  🚀 Start Test
                </button>
              </div>
            )}

            {/* QUIZ */}
            {iqScreen === "quiz" && (
              <div key={currentQ} className="fadein">
                {/* Progress bar */}
                <div style={{ background:"#fff", border:`1px solid ${T.border}`, borderRadius:12, padding:"12px 16px", marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:12, color:T.text3, fontWeight:600 }}>{IQ_QUESTIONS[currentQ].round}</span>
                    <span className="mono" style={{ fontSize:11, color:T.greenDk, fontWeight:700 }}>Q{currentQ+1}/8</span>
                  </div>
                  <div style={{ height:6, background:T.border, borderRadius:3, overflow:"hidden" }}>
                    <div style={{ width:`${((currentQ+1)/8)*100}%`, height:"100%", background:"linear-gradient(90deg,#10b981,#059669)", borderRadius:3, transition:"width .4s ease" }}/>
                  </div>
                </div>

                {/* Question Card */}
                <div style={{ ...CARD }}>
                  <div style={{ fontSize:11, color:T.text3, fontWeight:600, marginBottom:12, letterSpacing:.5 }}>
                    QUESTION {currentQ+1} OF 8
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:20, lineHeight:1.5 }}>
                    {IQ_QUESTIONS[currentQ].q}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {IQ_QUESTIONS[currentQ].options.map((opt, i) => (
                      <button key={`q${currentQ}_opt${i}`}
                        disabled={transitioning}
                        style={{ width:"100%", textAlign:"left", background: transitioning?"#f0fdf4":"#f8fafc", border: transitioning?"2px solid #6ee7b7":"2px solid #e2e8f0", borderRadius:12, padding:"12px 16px", fontSize:13, cursor: transitioning?"not-allowed":"pointer", transition:"all .15s", fontFamily:"'Inter',sans-serif", color:T.text, fontWeight:500, opacity: transitioning?0.7:1 }}
                        onMouseEnter={e=>{ if(!transitioning){e.currentTarget.style.background="linear-gradient(135deg,#f0fdf4,#dcfce7)";e.currentTarget.style.borderColor="#10b981";e.currentTarget.style.color="#059669";}}}
                        onMouseLeave={e=>{ if(!transitioning){e.currentTarget.style.background="#f8fafc";e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color=T.text;}}}
                        onClick={() => handleAnswer(i)}>
                        <span style={{ fontWeight:700, marginRight:10, color:T.greenDk }}>{String.fromCharCode(65+i)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                  {transitioning && (
                    <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:T.greenDk, fontWeight:600 }}>
                      ✅ Jawab save hua — agla sawaal aa raha hai...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RESULT */}
            {iqScreen === "result" && (
              <div className="fadein">
                <div style={{ ...CARD, textAlign:"center", marginBottom:12 }}>
                  <div style={{ fontSize:48, marginBottom:8 }}>{iqLoading ? "🔄" : "🎉"}</div>
                  <div style={{ fontWeight:800, fontSize:18, marginBottom:4 }}>
                    {iqLoading ? "AI analyze kar raha hai..." : "Test Complete!"}
                  </div>
                  <p style={{ fontSize:12, color:T.text3 }}>
                    {iqLoading ? "Knowledge + behavior patterns score ho rahe hain" : "Tumhara Crypto DNA decode ho gaya!"}
                  </p>
                </div>
                {(iqResult || iqLoading) && <AiResult text={iqResult} loading={iqLoading}/>}
                {!iqLoading && iqResult && (
                  <div style={{ display:"flex", gap:8, marginTop:12 }}>
                    <button style={{ ...BTN, flex:1, padding:"12px", fontSize:13 }} onClick={resetIQ}>🔄 Retake Test</button>
                    <button style={{ background:"#25D366", color:"#fff", border:"none", borderRadius:12, padding:"12px 16px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}
                      onClick={()=>window.open(`https://wa.me/?text=Maine YYP Crypto IQ Test liya! ${encodeURIComponent(iqResult?.split('\n')[0]||'')} — yesyoupro.com`)}>
                      📱 Share
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* HEALTH CHECKUP                                                   */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {tab==="health" && (
          <div className="fadein">
            <div style={{ textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🏥</div>
              <h2 style={{ fontSize:22, fontWeight:900, letterSpacing:-1, marginBottom:6 }}>Portfolio Health Checkup</h2>
              <p style={{ fontSize:13, color:T.text2 }}>Doctor-style report — tumhare portfolio ki full diagnosis</p>
            </div>

            <div style={{ ...CARD }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>💊 Apna Portfolio Batao</div>

              {coins.map((c, i) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
                  <input value={c.coin} onChange={e=>updateCoin(i,"coin",e.target.value)}
                    placeholder={`Coin ${i+1}: BTC, ETH, SOL…`}
                    style={{ flex:1, ...INP }}
                    onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                  <select value={c.currency} onChange={e=>updateCoin(i,"currency",e.target.value)}
                    style={{ background:"#f8fafc", border:"2px solid #e2e8f0", borderRadius:12, padding:"10px 10px", fontSize:13, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", color:T.text }}>
                    <option value="INR">₹</option>
                    <option value="USD">$</option>
                  </select>
                  <input value={c.amount} onChange={e=>updateCoin(i,"amount",e.target.value)}
                    placeholder="Amount" type="number"
                    style={{ width:110, ...INP }}
                    onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                  {coins.length > 1 && (
                    <button onClick={()=>removeCoin(i)} style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 12px", cursor:"pointer", color:"#dc2626", fontSize:14 }}>✕</button>
                  )}
                </div>
              ))}

              <button onClick={addCoin} style={{ background:"#f0fdf4", border:"1px dashed #6ee7b7", borderRadius:10, padding:"8px 16px", cursor:"pointer", color:T.greenDk, fontSize:12, fontWeight:600, marginBottom:14 }}>
                + Add Another Coin
              </button>

              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:T.text3, fontWeight:600, marginBottom:6, letterSpacing:.5 }}>DAILY PRICE CHECK FREQUENCY</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {["1","2","5","10","20+"].map(n=>(
                    <button key={n} onClick={()=>setCheckFreq(n)}
                      style={{ background: checkFreq===n?"linear-gradient(135deg,#10b981,#059669)":"#f8fafc", color: checkFreq===n?"#fff":T.text2, border: checkFreq===n?"none":`1px solid ${T.border}`, borderRadius:20, padding:"5px 14px", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'Inter',sans-serif" }}>
                      {n}x/day
                    </button>
                  ))}
                </div>
              </div>

              <button style={{ ...BTN, width:"100%", padding:"13px", fontSize:14, borderRadius:12 }}
                onClick={runHealthCheck} disabled={healthLoad||!coins.find(c=>c.coin&&c.amount)}>
                {healthLoad ? <span style={{ display:"inline-block", animation:"spin .8s linear infinite" }}>⟳</span> : "🏥 Get Health Report"}
              </button>
            </div>

            {healthLoad && (
              <div style={{ textAlign:"center", padding:"32px 0" }}>
                <div style={{ fontSize:36, marginBottom:10, animation:"float 2s ease-in-out infinite" }}>🩺</div>
                <p style={{ color:T.text2, fontSize:13 }}>Dr. YYP AI portfolio analyze kar raha hai…</p>
              </div>
            )}

            {healthResult && !healthLoad && (
              <div className="fadein" style={{ background:"linear-gradient(135deg,#ecfdf5,#f0fdf4)", border:"1px solid #6ee7b7", borderRadius:20, padding:"20px", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#10b981,#6ee7b7,#10b981)", backgroundSize:"200% auto", animation:"gradmove 3s linear infinite" }}/>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                  <div style={{ background:"linear-gradient(135deg,#10b981,#059669)", borderRadius:10, padding:"6px 12px", fontWeight:900, fontSize:13, color:"#fff" }}>YYP</div>
                  <div><div style={{ fontWeight:800, fontSize:14, color:"#065f46" }}>Dr. YYP AI</div><div className="mono" style={{ fontSize:9, color:T.greenDk }}>MD (Market Dynamics)</div></div>
                </div>
                <p style={{ fontSize:13, color:"#166534", lineHeight:1.85, whiteSpace:"pre-line", fontWeight:500 }}>{healthResult}</p>
                <div className="mono" style={{ fontSize:9, color:T.text3, marginTop:12, textAlign:"right" }}>YES YOU PRO AI · yesyoupro.com</div>
              </div>
            )}
          </div>
        )}


        {/* ════════════════════════════════════════════════════════════════ */}
        {/* PORTFOLIO TRACKER                                                */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {tab==="portfolio" && (
          <div className="fadein">
            <div style={{ textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>💼</div>
              <h2 style={{ fontSize:22, fontWeight:900, letterSpacing:-1, marginBottom:6 }}>Mera Portfolio</h2>
              <p style={{ fontSize:13, color:T.text2 }}>Apne coins add karo — live P&L dekho</p>
            </div>

            {/* Add Coin Form */}
            <div style={{ ...CARD }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>➕ Coin Add Karo</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:10, color:T.text3, fontWeight:600, marginBottom:4 }}>COIN</div>
                  <input value={pfForm.coin} onChange={e=>setPfForm(p=>({...p,coin:e.target.value.toUpperCase()}))}
                    placeholder="BTC, ETH, SOL…"
                    style={{ ...INP }} onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                </div>
                <div>
                  <div style={{ fontSize:10, color:T.text3, fontWeight:600, marginBottom:4 }}>QUANTITY</div>
                  <input value={pfForm.qty} onChange={e=>setPfForm(p=>({...p,qty:e.target.value}))}
                    placeholder="0.5" type="number"
                    style={{ ...INP }} onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:10, color:T.text3, fontWeight:600, marginBottom:4 }}>BUY PRICE ($)</div>
                  <input value={pfForm.buyPrice} onChange={e=>setPfForm(p=>({...p,buyPrice:e.target.value}))}
                    placeholder="e.g. 95000" type="number"
                    style={{ ...INP }} onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                </div>
                <div>
                  <div style={{ fontSize:10, color:T.text3, fontWeight:600, marginBottom:4 }}>CURRENCY</div>
                  <select value={pfForm.currency} onChange={e=>setPfForm(p=>({...p,currency:e.target.value}))}
                    style={{ background:"#f8fafc", border:"2px solid #e2e8f0", borderRadius:12, padding:"10px", fontSize:13, width:"100%", color:T.text, fontFamily:"'JetBrains Mono',monospace" }}>
                    <option value="INR">₹ INR</option>
                    <option value="USD">$ USD</option>
                  </select>
                </div>
              </div>
              <button style={{ ...BTN, width:"100%", padding:"12px", borderRadius:12 }} onClick={addCoinToPortfolio}>
                ➕ Add to Portfolio
              </button>
            </div>

            {/* Live Prices Button */}
            {pfCoins.length > 0 && (
              <button style={{ ...BTN, width:"100%", padding:"11px", borderRadius:12, marginBottom:12 }}
                onClick={fetchPortfolioPrices} disabled={pfLoad}>
                {pfLoad ? "⟳ Loading live prices…" : "🔄 Live Prices Update Karo"}
              </button>
            )}

            {/* Portfolio List */}
            {pfCoins.length === 0 ? (
              <div style={{ textAlign:"center", padding:"32px 0", color:T.text3 }}>
                <div style={{ fontSize:40, marginBottom:8 }}>📭</div>
                <p style={{ fontSize:13 }}>Koi coin nahi — upar se add karo!</p>
              </div>
            ) : (
              <div>
                {pfCoins.map(coin => {
                  const livePrice = pfPrices[coin.coin.toUpperCase()] || 0;
                  const invested = parseFloat(coin.qty) * parseFloat(coin.buyPrice);
                  const currentVal = livePrice > 0 ? parseFloat(coin.qty) * livePrice : 0;
                  const pnl = currentVal - invested;
                  const pnlPct = invested > 0 ? ((pnl/invested)*100).toFixed(2) : "—";
                  return (
                    <div key={coin.id} style={{ background:"#fff", border:`1px solid ${T.border}`, borderRadius:16, padding:"14px", marginBottom:8, boxShadow:T.shadow }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <div>
                          <span className="mono" style={{ fontWeight:800, fontSize:16 }}>{coin.coin.toUpperCase()}</span>
                          <span className="mono" style={{ fontSize:10, color:T.text3, marginLeft:8 }}>{coin.qty} units</span>
                        </div>
                        <button onClick={()=>removeCoinFromPortfolio(coin.id)}
                          style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:11, color:"#dc2626", fontWeight:600 }}>
                          Remove
                        </button>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                        <div style={{ background:"#f8fafc", borderRadius:10, padding:"8px", textAlign:"center" }}>
                          <div style={{ fontSize:9, color:T.text3, marginBottom:2 }}>BUY PRICE</div>
                          <div className="mono" style={{ fontSize:11, fontWeight:700 }}>${parseFloat(coin.buyPrice).toLocaleString()}</div>
                        </div>
                        <div style={{ background:"#f8fafc", borderRadius:10, padding:"8px", textAlign:"center" }}>
                          <div style={{ fontSize:9, color:T.text3, marginBottom:2 }}>LIVE PRICE</div>
                          <div className="mono" style={{ fontSize:11, fontWeight:700, color:"#10b981" }}>
                            {livePrice > 0 ? `$${livePrice.toLocaleString(undefined,{maximumFractionDigits:2})}` : "—"}
                          </div>
                        </div>
                        <div style={{ background: pnl >= 0 ? "#f0fdf4" : "#fef2f2", borderRadius:10, padding:"8px", textAlign:"center" }}>
                          <div style={{ fontSize:9, color:T.text3, marginBottom:2 }}>P&L</div>
                          <div className="mono" style={{ fontSize:11, fontWeight:700, color: pnl >= 0 ? "#059669" : "#dc2626" }}>
                            {livePrice > 0 ? `${pnl>=0?"+":""}${pnlPct}%` : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {/* Total */}
                {Object.keys(pfPrices).length > 0 && (
                  <div style={{ background:"linear-gradient(135deg,#ecfdf5,#d1fae5)", border:"1px solid #6ee7b7", borderRadius:14, padding:"14px", marginTop:8 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:"#065f46", marginBottom:6 }}>📊 Portfolio Summary</div>
                    {(() => {
                      const totalInvested = pfCoins.reduce((s,c) => s + parseFloat(c.qty)*parseFloat(c.buyPrice), 0);
                      const totalCurrent = pfCoins.reduce((s,c) => {
                        const lp = pfPrices[c.coin.toUpperCase()] || 0;
                        return s + (lp > 0 ? parseFloat(c.qty)*lp : parseFloat(c.qty)*parseFloat(c.buyPrice));
                      }, 0);
                      const totalPnl = totalCurrent - totalInvested;
                      const totalPct = ((totalPnl/totalInvested)*100).toFixed(2);
                      return (
                        <div style={{ display:"flex", justifyContent:"space-between" }}>
                          <div><div style={{ fontSize:10, color:T.text3 }}>Total Invested</div><div className="mono" style={{ fontWeight:700 }}>${totalInvested.toLocaleString(undefined,{maximumFractionDigits:0})}</div></div>
                          <div><div style={{ fontSize:10, color:T.text3 }}>Current Value</div><div className="mono" style={{ fontWeight:700 }}>${totalCurrent.toLocaleString(undefined,{maximumFractionDigits:0})}</div></div>
                          <div><div style={{ fontSize:10, color:T.text3 }}>Total P&L</div><div className="mono" style={{ fontWeight:800, color:totalPnl>=0?"#059669":"#dc2626" }}>{totalPnl>=0?"+":""}{totalPct}%</div></div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* DAILY STREAK                                                     */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {tab==="streak" && (
          <div className="fadein">
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:56, marginBottom:8 }}>🔥</div>
              <h2 style={{ fontSize:22, fontWeight:900, letterSpacing:-1, marginBottom:6 }}>Daily Streak</h2>
              <p style={{ fontSize:13, color:T.text2 }}>Roz check karo — streak badhao — trader bano</p>
            </div>

            {/* Streak counter */}
            <div style={{ background:"linear-gradient(135deg,#1a0800,#2d1200)", borderRadius:24, padding:"32px 20px", textAlign:"center", marginBottom:14, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"radial-gradient(ellipse at center, rgba(249,115,22,.15), transparent)", pointerEvents:"none" }}/>
              <div style={{ fontSize:80, fontWeight:900, color:"#f97316", lineHeight:1, marginBottom:8, textShadow:"0 0 40px rgba(249,115,22,.5)" }}>
                {streak}
              </div>
              <div style={{ fontSize:14, color:"#fbbf24", fontWeight:700, marginBottom:4 }}>Din ki Streak 🔥</div>
              <div style={{ fontSize:11, color:"#94a3b8" }}>
                {streak === 0 ? "Aaj pehla din — shuru karo!" :
                 streak < 7  ? "Achha! Ek hafte tak jaari rakho!" :
                 streak < 30 ? "Zabardast! Ek mahina poora karo!" :
                               "🏆 Legend! Tum pro trader ho!"}
              </div>
            </div>

            {/* Check in button */}
            <button style={{ ...BTN, width:"100%", padding:"16px", fontSize:16, borderRadius:14, marginBottom:14,
              background:"linear-gradient(135deg,#f97316,#ea580c)",
              boxShadow:"0 4px 20px rgba(249,115,22,.4)" }}
              onClick={checkStreak}>
              🔥 Aaj Ka Check-In
            </button>

            {streakMsg && (
              <div style={{ background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1px solid #fde68a", borderRadius:12, padding:"14px", textAlign:"center", marginBottom:14, fontSize:13, fontWeight:700, color:"#92400e" }}>
                {streakMsg}
              </div>
            )}

            {/* Streak milestones */}
            <div style={{ ...CARD }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>🏆 Streak Milestones</div>
              {[
                { days:1,  icon:"🌱", title:"Naya Trader",      reward:"Shuru kiya — badhai!" },
                { days:7,  icon:"⚡", title:"Week Warrior",     reward:"7 din — Ek hafte!!" },
                { days:14, icon:"💪", title:"Consistent",      reward:"14 din — Solid habit!" },
                { days:30, icon:"🎯", title:"Monthly Master",  reward:"30 din — Real trader!" },
                { days:60, icon:"💎", title:"Diamond Hands",   reward:"60 din — Pro level!" },
                { days:100,icon:"👑", title:"Crypto King",     reward:"100 din — Legend!" },
              ].map((m,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:i<5?"1px dashed #e2e8f0":"none" }}>
                  <div style={{ width:40, height:40, borderRadius:12, background: streak >= m.days ? "linear-gradient(135deg,#f97316,#ea580c)" : "#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                    {streak >= m.days ? m.icon : "🔒"}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:13, color: streak >= m.days ? T.text : T.text3 }}>{m.title}</div>
                    <div style={{ fontSize:11, color:T.text3, marginTop:1 }}>{m.reward}</div>
                  </div>
                  <div style={{ fontWeight:700, fontSize:12, color: streak >= m.days ? "#f97316" : T.text3 }}>
                    {streak >= m.days ? "✅ Done!" : `${m.days} days`}
                  </div>
                </div>
              ))}
            </div>

            {/* Share streak */}
            <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(`🔥 Meri YES YOU PRO Daily Streak: ${streak} din!\n\nMain roz crypto market analyze karta hoon.\nTum bhi try karo: yesyoupro.com`)}`)}
              style={{ width:"100%", background:"#25D366", color:"#fff", border:"none", borderRadius:12, padding:"12px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Inter',sans-serif", marginTop:12 }}>
              📱 Streak WhatsApp pe Share Karo
            </button>
          </div>
        )}


        {/* Footer */}
        <div style={{ textAlign:"center", marginTop:24 }}>
          <Link href="/arena" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#10b981,#059669)", color:"#fff", textDecoration:"none", borderRadius:14, padding:"13px 28px", fontWeight:700, fontSize:14, boxShadow:"0 4px 20px rgba(16,185,129,.4)", marginBottom:14 }}>
            🏟️ Virtual Trading Arena →
          </Link>
          <div style={{ display:"flex", justifyContent:"center", gap:14 }}>
            <Link href="/" style={{ fontSize:12, color:T.text3, textDecoration:"none" }}>← Home</Link>
            <span style={{ color:T.border }}>·</span>
            <Link href="/about" style={{ fontSize:12, color:T.text3, textDecoration:"none" }}>About</Link>
            <span style={{ color:T.border }}>·</span>
            <Link href="/contact" style={{ fontSize:12, color:T.text3, textDecoration:"none" }}>Contact</Link>
          </div>
        </div>

      </div>
    </main>
  );
}
