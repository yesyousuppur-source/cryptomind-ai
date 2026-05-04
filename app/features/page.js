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
  { id:"iq",     icon:"🧠", label:"IQ Test"       },
  { id:"health", icon:"🏥", label:"Health Check"   },
  { id:"buddy",  icon:"🤝", label:"Buddy System"   },
  { id:"desi",   icon:"🌍", label:"Desi Network"   },
  { id:"tax",    icon:"🧾", label:"Tax Calc"       },
  { id:"badge",  icon:"🏅", label:"My Badges"      },
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

  // Buddy state
  const [buddyType, setBuddyType]   = useState("find"); // find | become
  const [buddyForm, setBuddyForm]   = useState({ exp:"", style:"", city:"", goal:"" });
  const [buddyMsg, setBuddyMsg]     = useState("");

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

  // ── BUDDY SYSTEM ──────────────────────────────────────────────────────────
  const submitBuddy = () => {
    if (!buddyForm.city || !buddyForm.exp) return;
    setBuddyMsg("✅ Tumhara profile registered! Hum suitable buddy dhundhenge aur 24 hours mein notify karenge.");
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
        {/* BUDDY SYSTEM                                                     */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {tab==="buddy" && (
          <div className="fadein">
            <div style={{ textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🤝</div>
              <h2 style={{ fontSize:22, fontWeight:900, letterSpacing:-1, marginBottom:6 }}>Crypto Buddy System</h2>
              <p style={{ fontSize:13, color:T.text2 }}>Experienced investor se sikho — safely aur free mein</p>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
              {[{label:"Active Mentors",val:"234",icon:"👨‍🏫"},{label:"Learners",val:"1.2K",icon:"📚"},{label:"Cities",val:"47",icon:"🏙️"}].map((s,i)=>(
                <div key={i} style={{ background:"#fff", border:`1px solid ${T.border}`, borderRadius:14, padding:"12px", textAlign:"center" }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{s.icon}</div>
                  <div className="mono" style={{ fontSize:16, fontWeight:800, color:T.text }}>{s.val}</div>
                  <div style={{ fontSize:10, color:T.text3, marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Toggle */}
            <div style={{ display:"flex", gap:8, marginBottom:14 }}>
              {[{id:"find",label:"🔍 Find a Mentor"},{id:"become",label:"🏆 Become a Mentor"},{id:"browse",label:"👥 Browse Mentors"}].map(b=>(
                <button key={b.id} onClick={()=>setBuddyType(b.id)}
                  style={{ flex:1, background: buddyType===b.id?"linear-gradient(135deg,#10b981,#059669)":"#fff", color: buddyType===b.id?"#fff":T.text2, border: buddyType===b.id?"none":`1px solid ${T.border}`, borderRadius:12, padding:"10px 6px", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"'Inter',sans-serif", transition:"all .2s" }}>
                  {b.label}
                </button>
              ))}
            </div>

            {/* Find Mentor Form */}
            {buddyType==="find" && (
              <div style={{ ...CARD }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>📋 Apna Profile Batao — Hum Match Karenge</div>
                {[
                  { label:"EXPERIENCE LEVEL", field:"exp", ph:"e.g. Beginner (3 months)", type:"text" },
                  { label:"TRADING STYLE", field:"style", ph:"e.g. Long-term, DCA, etc.", type:"text" },
                  { label:"YOUR CITY", field:"city", ph:"e.g. Mumbai, Delhi, Bangalore", type:"text" },
                  { label:"MAIN GOAL", field:"goal", ph:"e.g. Wealth building, learn trading", type:"text" },
                ].map((f,i)=>(
                  <div key={i} style={{ marginBottom:10 }}>
                    <div style={{ fontSize:10, color:T.text3, fontWeight:600, marginBottom:5, letterSpacing:.5 }}>{f.label}</div>
                    <input value={buddyForm[f.field]} onChange={e=>setBuddyForm(p=>({...p,[f.field]:e.target.value}))}
                      placeholder={f.ph} type={f.type}
                      style={{ ...INP }}
                      onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                  </div>
                ))}
                <div style={{ background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1px solid #fde68a", borderRadius:10, padding:"10px 12px", marginBottom:14, fontSize:11, color:"#92400e" }}>
                  ✅ Rules: Sirf strategies share karo · Koi money transfer mat karo · Koi guaranteed tips mat do
                </div>
                {buddyMsg
                  ? <div style={{ background:"linear-gradient(135deg,#ecfdf5,#d1fae5)", border:"1px solid #6ee7b7", borderRadius:12, padding:"14px", fontWeight:600, color:"#065f46", fontSize:13 }}>{buddyMsg}</div>
                  : <button style={{ ...BTN, width:"100%", padding:"12px", borderRadius:12 }} onClick={submitBuddy}>🤝 Find My Buddy</button>}
              </div>
            )}

            {/* Become Mentor */}
            {buddyType==="become" && (
              <div style={{ ...CARD }}>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>🏆 Mentor Registration</div>
                <div style={{ background:"linear-gradient(135deg,#ecfdf5,#d1fae5)", border:"1px solid #6ee7b7", borderRadius:12, padding:"14px", marginBottom:14 }}>
                  <div style={{ fontWeight:700, color:"#065f46", marginBottom:6 }}>Mentor Benefits:</div>
                  <div style={{ fontSize:12, color:"#166534", lineHeight:1.7 }}>
                    ✅ YYP Verified Mentor Badge<br/>
                    ✅ Community recognition<br/>
                    ✅ Help beginners avoid mistakes you made<br/>
                    ✅ Improve your own understanding
                  </div>
                </div>
                {[
                  { label:"YOUR EXPERIENCE", field:"exp", ph:"e.g. 3 years trading" },
                  { label:"EXPERTISE", field:"style", ph:"e.g. DCA, Technical Analysis, Risk Mgmt" },
                  { label:"YOUR CITY", field:"city", ph:"e.g. Mumbai" },
                ].map((f,i)=>(
                  <div key={i} style={{ marginBottom:10 }}>
                    <div style={{ fontSize:10, color:T.text3, fontWeight:600, marginBottom:5 }}>{f.label}</div>
                    <input value={buddyForm[f.field]} onChange={e=>setBuddyForm(p=>({...p,[f.field]:e.target.value}))}
                      placeholder={f.ph} style={{ ...INP }}
                      onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                  </div>
                ))}
                {buddyMsg
                  ? <div style={{ background:"linear-gradient(135deg,#ecfdf5,#d1fae5)", border:"1px solid #6ee7b7", borderRadius:12, padding:"14px", fontWeight:600, color:"#065f46", fontSize:13 }}>{buddyMsg}</div>
                  : <button style={{ ...BTN, width:"100%", padding:"12px", borderRadius:12 }} onClick={submitBuddy}>🏆 Register as Mentor</button>}
              </div>
            )}

            {/* Browse */}
            {buddyType==="browse" && (
              <div>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>👥 Available Mentors</div>
                {BUDDY_PROFILES.map((b,i)=>(
                  <div key={i} className="hov" style={{ background:"#fff", border:`1px solid ${T.border}`, borderRadius:16, padding:"14px 16px", marginBottom:8, boxShadow:T.shadow }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:44, height:44, background:`linear-gradient(135deg,${T.green},${T.greenDk})`, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{b.badge}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontWeight:700, fontSize:14 }}>{b.name}</span>
                          {b.available && <span style={{ background:"#f0fdf4", border:"1px solid #6ee7b7", borderRadius:20, padding:"1px 8px", fontSize:10, color:T.greenDk, fontWeight:600 }}>🟢 Available</span>}
                        </div>
                        <div style={{ fontSize:11, color:T.text3, marginTop:2 }}>{b.city} · {b.exp} · {b.style}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"#f59e0b" }}>⭐ {b.rating}</div>
                        <div style={{ fontSize:10, color:T.text3, marginTop:2 }}>Helped {b.helped}</div>
                      </div>
                    </div>
                    {b.available && (
                      <button style={{ marginTop:10, width:"100%", background:"#f0fdf4", border:"1px solid #6ee7b7", borderRadius:10, padding:"8px", cursor:"pointer", color:T.greenDk, fontSize:12, fontWeight:600, fontFamily:"'Inter',sans-serif" }}
                        onClick={()=>alert(`${b.name} ko request bheja gaya! Hum 24h mein connect karenge.`)}>
                        Connect with {b.name.split(" ")[0]} →
                      </button>
                    )}
                  </div>
                ))}
                <div style={{ textAlign:"center", padding:"10px 0", fontSize:11, color:T.text3 }}>
                  + 229 more mentors available
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* DESI NETWORK                                                     */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {tab==="desi" && (
          <div className="fadein">
            <div style={{ textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🌍</div>
              <h2 style={{ fontSize:22, fontWeight:900, letterSpacing:-1, marginBottom:6 }}>Global Desi Network</h2>
              <p style={{ fontSize:13, color:T.text2 }}>NRI aur Indian crypto patterns — duniya mein pehli baar</p>
            </div>

            {/* Live city stats */}
            <div style={{ ...CARD }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>🇮🇳 Indian Crypto Hubs (Estimated)</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { city:"Bangalore 💻", investors:"85K+", trend:"📈 Tech coins" },
                  { city:"Mumbai 💰",    investors:"72K+", trend:"📈 BTC heavy"  },
                  { city:"Delhi 🏛️",     investors:"58K+", trend:"📊 Mixed"     },
                  { city:"Pune 🎓",      investors:"34K+", trend:"📈 Altcoins"  },
                  { city:"Hyderabad 🔬", investors:"41K+", trend:"📈 Web3"      },
                  { city:"Chennai 🌊",   investors:"28K+", trend:"📊 BTC/ETH"   },
                ].map((c,i)=>(
                  <div key={i} style={{ background:"#f8fafc", borderRadius:12, padding:"10px 12px", border:`1px solid ${T.border}` }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{c.city}</div>
                    <div className="mono" style={{ fontSize:12, color:T.greenDk, fontWeight:700, marginTop:2 }}>{c.investors}</div>
                    <div style={{ fontSize:10, color:T.text3, marginTop:2 }}>{c.trend}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* NRI Hotspots */}
            <div style={{ ...CARD }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>✈️ NRI Crypto Hotspots</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { flag:"🇺🇸", country:"USA (NRI)", city:"Silicon Valley, NJ", pattern:"Tech tokens — early adopters", size:"$2.3B+ estimated" },
                  { flag:"🇦🇪", country:"UAE/Dubai",  city:"Dubai, Abu Dhabi",   pattern:"BTC & ETH — long-term hold", size:"$890M+ estimated" },
                  { flag:"🇬🇧", country:"UK (NRI)",   city:"London, Manchester", pattern:"DeFi & staking focus",       size:"$560M+ estimated" },
                  { flag:"🇨🇦", country:"Canada",     city:"Toronto, Vancouver", pattern:"Conservative — BTC focus",  size:"$340M+ estimated" },
                ].map((n,i)=>(
                  <div key={i} style={{ display:"flex", gap:12, alignItems:"center", background:"#f8fafc", borderRadius:12, padding:"12px 14px", border:`1px solid ${T.border}` }}>
                    <span style={{ fontSize:28, flexShrink:0 }}>{n.flag}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13 }}>{n.country} — {n.city}</div>
                      <div style={{ fontSize:11, color:T.text3, marginTop:2 }}>{n.pattern}</div>
                    </div>
                    <div className="mono" style={{ fontSize:10, color:T.greenDk, fontWeight:700, textAlign:"right", flexShrink:0 }}>{n.size}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Desi Insight */}
            <div style={{ ...CARD }}>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>🔮 AI Desi Network Insight</div>
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <select value={desiCoin} onChange={e=>setDesiCoin(e.target.value)}
                  style={{ flex:1, background:"#f8fafc", border:"2px solid #e2e8f0", borderRadius:12, padding:"10px 12px", fontSize:13, cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", color:T.text }}>
                  {DESI_COINS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <button style={{ ...BTN, padding:"10px 20px", fontSize:13, borderRadius:12, whiteSpace:"nowrap" }}
                  onClick={fetchDesiInsight} disabled={desiLoad}>
                  {desiLoad ? <span style={{ display:"inline-block", animation:"spin .8s linear infinite" }}>⟳</span> : "Get Insight 🌍"}
                </button>
              </div>
              {(desiResult || desiLoad) && <AiResult text={desiResult} loading={desiLoad}/>}
            </div>

            {/* Pattern Insight */}
            <div style={{ background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1px solid #fde68a", borderRadius:16, padding:"16px 18px" }}>
              <div style={{ fontWeight:700, fontSize:13, color:"#92400e", marginBottom:10 }}>💡 Known Desi Patterns</div>
              {[
                "🌙 Diwali effect: BTC historically +8-15% in Oct-Nov (Indian buying surge)",
                "💰 Salary time pattern: Month-end (28-31) mein Indian exchange volumes +30-40%",
                "🏦 Budget effect: Crypto dips 3-5 days before Indian budget, recovers after",
                "📱 Weekend pattern: Indian retail buying peaks Saturday 8PM-11PM IST",
                "🇺🇸 NRI signal: USA NRI buying often precedes India rally by 6-18 hours",
              ].map((p,i)=>(
                <div key={i} style={{ fontSize:12, color:"#78350f", lineHeight:1.7, padding:"4px 0", borderBottom:i<4?"1px dashed #fde68a":"none" }}>{p}</div>
              ))}
              <div style={{ fontSize:10, color:"#a16207", marginTop:8 }}>⚠️ Historical patterns — not guaranteed to repeat</div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TAX CALCULATOR                                                   */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {tab==="tax" && (
          <div className="fadein">
            <div style={{ textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🧾</div>
              <h2 style={{ fontSize:22, fontWeight:900, letterSpacing:-1, marginBottom:6 }}>Crypto Tax Calculator</h2>
              <p style={{ fontSize:13, color:T.text2 }}>India only — 30% tax + 1% TDS calculate karo</p>
            </div>

            <div style={{ ...CARD }}>
              <div style={{ background:"linear-gradient(135deg,#fef2f2,#fee2e2)", border:"1px solid #fca5a5", borderRadius:12, padding:"10px 14px", marginBottom:16, fontSize:12, color:"#991b1b", fontWeight:500, lineHeight:1.6 }}>
                📋 <strong>India Crypto Tax Rules:</strong><br/>
                • Profit pe 30% flat tax (koi exemption nahi)<br/>
                • Sell amount pe 1% TDS deduct hota hai<br/>
                • Loss ko kisi aur income se set-off nahi kar sakte<br/>
                • Schedule VDA mein file karna hota hai
              </div>

              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                {["INR","USD"].map(c=>(
                  <button key={c} onClick={()=>setTaxCur(c)}
                    style={{ flex:1, background:taxCur===c?"linear-gradient(135deg,#10b981,#059669)":"#f8fafc", color:taxCur===c?"#fff":T.text2, border:taxCur===c?"none":`1px solid ${T.border}`, borderRadius:10, padding:"8px", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"'Inter',sans-serif" }}>
                    {c==="INR"?"₹ INR":"$ USD"}
                  </button>
                ))}
              </div>

              {[
                { label:"BUY PRICE (per coin)", val:taxBuyPrice, set:setTaxBuyPrice, ph:`${taxCur==="INR"?"₹":"$"} Jis price pe kharida` },
                { label:"SELL PRICE (per coin)", val:taxSellPrice, set:setTaxSellPrice, ph:`${taxCur==="INR"?"₹":"$"} Jis price pe becha` },
                { label:"QUANTITY (coins)", val:taxQty, set:setTaxQty, ph:"Kitne coins bece (e.g. 0.5)" },
              ].map((f,i)=>(
                <div key={i} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:10, color:T.text3, fontWeight:600, marginBottom:5, letterSpacing:.5 }}>{f.label}</div>
                  <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} type="number"
                    style={{ ...INP }} onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                </div>
              ))}

              <button style={{ ...BTN, width:"100%", padding:"13px", borderRadius:12 }} onClick={calcTax}>
                🧾 Calculate Tax
              </button>
            </div>

            {taxResult && (
              <div className="fadein" style={{ ...CARD, background:"linear-gradient(135deg,#f8fafc,#f1f5f9)" }}>
                <div style={{ fontWeight:800, fontSize:16, marginBottom:16, color:T.text }}>
                  {taxResult.isProfit ? "📈 Profit — Tax Lagega" : "📉 Loss — Tax Nahi Lagega"}
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    { l:"Buy Price", v:`${taxResult.sym}${taxResult.buy.toLocaleString("en-IN")}`, c:T.text },
                    { l:"Sell Price", v:`${taxResult.sym}${taxResult.sell.toLocaleString("en-IN")}`, c:T.text },
                    { l:"Quantity", v:`${taxResult.qty} coins`, c:T.text },
                    { l:"Total Investment", v:`${taxResult.sym}${(taxResult.buy*taxResult.qty).toLocaleString("en-IN")}`, c:T.text },
                    { l:"Gross Profit/Loss", v:`${taxResult.isProfit?"+":""}${taxResult.sym}${taxResult.profit.toLocaleString("en-IN")} (${taxResult.isProfit?"+":""}${taxResult.profitPct}%)`, c:taxResult.isProfit?"#059669":"#dc2626" },
                  ].map((row,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 12px", background:"#fff", borderRadius:10, border:`1px solid ${T.border}` }}>
                      <span style={{ fontSize:12, color:T.text3, fontWeight:600 }}>{row.l}</span>
                      <span className="mono" style={{ fontSize:13, fontWeight:700, color:row.c }}>{row.v}</span>
                    </div>
                  ))}
                </div>

                {taxResult.isProfit && (
                  <div style={{ marginTop:12 }}>
                    <div style={{ fontSize:11, color:T.text3, fontWeight:700, marginBottom:8, letterSpacing:.5 }}>TAX BREAKDOWN</div>
                    {[
                      { l:"30% Income Tax on Profit", v:`− ${taxResult.sym}${taxResult.tax30.toLocaleString("en-IN")}`, c:"#dc2626", bg:"#fef2f2", br:"#fecaca" },
                      { l:"1% TDS on Sell Amount", v:`− ${taxResult.sym}${taxResult.tds1.toLocaleString("en-IN")}`, c:"#d97706", bg:"#fffbeb", br:"#fde68a" },
                      { l:"Net Profit (After Tax)", v:`${taxResult.sym}${taxResult.netProfit.toLocaleString("en-IN")}`, c:"#059669", bg:"#f0fdf4", br:"#6ee7b7" },
                    ].map((row,i)=>(
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 12px", background:row.bg, borderRadius:10, border:`1px solid ${row.br}`, marginBottom:6 }}>
                        <span style={{ fontSize:12, color:T.text2, fontWeight:600 }}>{row.l}</span>
                        <span className="mono" style={{ fontSize:13, fontWeight:800, color:row.c }}>{row.v}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop:12, background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1px solid #fde68a", borderRadius:10, padding:"10px 12px", fontSize:11, color:"#92400e", lineHeight:1.7 }}>
                  ⚠️ Yeh calculator sirf estimate deta hai. CA se consult karo actual filing ke liye.<br/>
                  📅 ITR filing deadline: July 31 (har saal)
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TRADER BADGES                                                    */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {tab==="badge" && (
          <div className="fadein">
            <div style={{ textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🏅</div>
              <h2 style={{ fontSize:22, fontWeight:900, letterSpacing:-1, marginBottom:6 }}>Trader Badges</h2>
              <p style={{ fontSize:13, color:T.text2 }}>Platform use karo — badges kamao — WhatsApp pe share karo!</p>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
              {[{i:"🏅",l:"Total Badges",v:"8"},{i:"🔓",l:"Earn Karo",v:"Use karo"},{i:"📱",l:"Share Karo",v:"WhatsApp"}].map((s,i)=>(
                <div key={i} style={{ background:"#fff", border:`1px solid ${T.border}`, borderRadius:14, padding:"12px 8px", textAlign:"center" }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>{s.i}</div>
                  <div style={{ fontSize:10, color:T.text3, marginBottom:2 }}>{s.l}</div>
                  <div style={{ fontWeight:700, fontSize:12 }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* All Badges */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {ALL_BADGES.map((b,i)=>{
                const isEarned = i < 3; // First 3 shown as examples — rest locked
                return (
                  <div key={b.id} style={{ background:isEarned?"linear-gradient(135deg,#fffbeb,#fef3c7)":"#fff", border:`1px solid ${isEarned?"#fde68a":T.border}`, borderRadius:16, padding:"14px 16px", opacity:isEarned?1:.7 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:50, height:50, background:isEarned?"linear-gradient(135deg,#fbbf24,#f59e0b)":"#f1f5f9", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0, border:`2px solid ${isEarned?"#fde68a":T.border}` }}>
                        {isEarned?b.icon:"🔒"}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{b.name}</div>
                        <div style={{ fontSize:11, color:T.text3, marginTop:2 }}>{b.desc}</div>
                        {b.req>0&&!isEarned&&<div style={{ fontSize:10, color:"#10b981", fontWeight:600, marginTop:3 }}>Unlock: {b.req} analyses karo</div>}
                      </div>
                      <div>
                        {isEarned ? (
                          <div style={{ background:"linear-gradient(135deg,#10b981,#059669)", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700, color:"#fff" }}>✅ Earned!</div>
                        ) : (
                          <div style={{ background:"#f1f5f9", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:600, color:"#94a3b8" }}>🔒 Locked</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Share */}
            <div style={{ marginTop:16, background:"linear-gradient(135deg,#0f172a,#1e3a2f)", borderRadius:16, padding:"16px 18px" }}>
              <div style={{ fontWeight:700, fontSize:13, color:"#6ee7b7", marginBottom:10 }}>📱 Badge Share Karo</div>
              <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent("🏅 Maine YesYouPro pe Crypto Trader Badges kamaye!\n\n🔍 Curious Trader\n👀 Market Watcher\n📊 Crypto Analyst\n\nTum bhi try karo: yesyoupro.com")}`)}
                style={{ width:"100%", background:"#25D366", color:"#fff", border:"none", borderRadius:12, padding:"12px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
                📤 WhatsApp pe Badges Share Karo
              </button>
            </div>
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
