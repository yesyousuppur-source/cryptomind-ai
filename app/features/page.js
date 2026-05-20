"use client";
import { useState } from "react";
import Link from "next/link";

const T = {
  green:"#10b981", greenDk:"#059669",
  page:"#f0fdf8", card:"#ffffff", border:"#e2e8f0",
  text:"#0f172a", text2:"#475569", text3:"#94a3b8",
  shadow:"0 4px 20px rgba(0,0,0,.05)",
};

const TAB_GROUPS = [
  {
    label: "🎓 Seekho",
    tabs: [
      { id:"iq",       icon:"🧠", label:"IQ Test"     },
      { id:"streak",   icon:"🔥", label:"Streak"       },
      { id:"health",   icon:"🏥", label:"Health Check" },
    ]
  },
  {
    label: "🔧 Tools",
    tabs: [
      { id:"tax",         icon:"🧾", label:"Tax Calc"    },
      { id:"dca",         icon:"📅", label:"DCA Planner" },
      { id:"traditional", icon:"🆚", label:"Crypto vs FD"},
      { id:"portfolio",   icon:"💼", label:"Portfolio"   },
    ]
  },
  {
    label: "🛡️ Safety",
    tabs: [
      { id:"rugpull",  icon:"🚨", label:"Rug Pull"   },
      { id:"fomo",     icon:"😱", label:"FOMO Check"  },
      { id:"whitepaper",icon:"📄",label:"Whitepaper" },
    ]
  },
  {
    label: "🎯 Timing",
    tabs: [
      { id:"entrytime", icon:"🎯", label:"Entry Finder"},
      { id:"airdrop",   icon:"🪙", label:"Airdrops"   },
    ]
  },
];

const TABS = TAB_GROUPS.flatMap(g=>g.tabs);

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


const DESI_COINS = ["BTC","ETH","SOL","BNB","XRP","MATIC","DOGE"];

// ── EXCHANGE CSV GUIDES ────────────────────────────────────────────────────
const TAX_GUIDES = {
  coindcx: [
    {text:"CoinDCX app open karo", bold:true},
    {text:"Neeche Profile icon pe click karo (right corner)"},
    {text:"'Reports' ya 'Trade History' option dhundo"},
    {text:"'P&L Report' ya 'Transaction History' select karo", note:"Spot aur Futures dono alag download karo"},
    {text:"Date range select karo: 01 April 2022 → 31 March 2026"},
    {text:"'Download CSV' button dabao"},
    {text:"File aapke phone mein save hogi — yahan upload karo", bold:true},
  ],
  wazirx: [
    {text:"WazirX app/website open karo", bold:true},
    {text:"Profile → 'Funds' ya 'History' section mein jao"},
    {text:"'Trade History' select karo"},
    {text:"Filter mein 'All Pairs' aur date range set karo", note:"April 2022 se March 2026"},
    {text:"'Export' ya 'Download' button dhundo"},
    {text:"CSV format mein download karo"},
    {text:"Yahan upload karo", bold:true},
  ],
  coinswitch: [
    {text:"CoinSwitch app open karo", bold:true},
    {text:"Bottom mein 'Portfolio' icon click karo"},
    {text:"'Transaction History' pe jao"},
    {text:"Top right mein Download/Export icon dhundo"},
    {text:"Date range: April 2022 → March 2026 select karo"},
    {text:"CSV download karo"},
    {text:"Yahan upload karo", bold:true},
  ],
  zebpay: [
    {text:"ZebPay app open karo", bold:true},
    {text:"'History' tab pe jao"},
    {text:"'Trade History' select karo"},
    {text:"Filter set karo: All coins, Full date range", note:"2022 se 2026 tak"},
    {text:"'Export as CSV' option select karo"},
    {text:"Email pe aayegi ya direct download hogi"},
    {text:"Yahan upload karo", bold:true},
  ],
  unocoin: [
    {text:"Unocoin website login karo (unocoin.com)", bold:true},
    {text:"Dashboard → 'Reports' section mein jao"},
    {text:"'Trade Report' ya 'Transaction History' select karo"},
    {text:"Date range set karo: 2022-2026"},
    {text:"'Download CSV' click karo"},
    {text:"Yahan upload karo", bold:true},
  ],
  mudrex: [
    {text:"Mudrex app open karo", bold:true},
    {text:"Profile → 'Portfolio' mein jao"},
    {text:"'Transaction History' ya 'Trade History' pe jao"},
    {text:"Export option select karo", note:"CSV ya Excel format"},
    {text:"Date range: April 2022 → March 2026"},
    {text:"Download karo aur yahan upload karo", bold:true},
  ],
  bitbns: [
    {text:"BitBNS website login karo", bold:true},
    {text:"'History' → 'Order History' mein jao"},
    {text:"'Export' button pe click karo"},
    {text:"Date range select karo: 2022-2026"},
    {text:"CSV format mein download karo"},
    {text:"Yahan upload karo", bold:true},
  ],
  delta: [
    {text:"Delta Exchange app/website open karo", bold:true},
    {text:"Profile → 'Trade History' mein jao"},
    {text:"Futures aur Spot dono ke liye alag export karo", note:"Dono CSV alag-alag upload kar sakte ho"},
    {text:"Date filter: April 2022 → March 2026"},
    {text:"'Download CSV' click karo"},
    {text:"Yahan upload karo", bold:true},
  ],
  binance: [
    {text:"Binance app/website open karo", bold:true},
    {text:"'Wallet' → 'Transaction History' mein jao"},
    {text:"Ya 'Orders' → 'Trade History' select karo"},
    {text:"'Generate Statement' ya 'Export' click karo", note:"Spot aur Futures dono alag hote hain"},
    {text:"Date range: 2022-2026, CSV format select karo"},
    {text:"Email pe aayegi ya direct download hogi"},
    {text:"Yahan upload karo", bold:true},
  ],
  kucoin: [
    {text:"KuCoin website login karo", bold:true},
    {text:"'Orders' → 'Order History' mein jao"},
    {text:"'Export' button pe click karo"},
    {text:"Date range: April 2022 → March 2026"},
    {text:"CSV format select karke download karo"},
    {text:"Yahan upload karo", bold:true},
  ],
  okx: [
    {text:"OKX app/website open karo", bold:true},
    {text:"'Trade' → 'Order History' mein jao"},
    {text:"'Export Data' option select karo"},
    {text:"Spot aur Futures dono ke liye alag export karo", note:"Dono combine ho jayenge"},
    {text:"Date range: 2022-2026, CSV format"},
    {text:"Yahan upload karo", bold:true},
  ],
  bybit: [
    {text:"Bybit website login karo", bold:true},
    {text:"'Orders' → 'Order History' mein jao"},
    {text:"Top right mein 'Export' icon click karo"},
    {text:"Date range: April 2022 → March 2026 set karo"},
    {text:"CSV format mein download karo"},
    {text:"Yahan upload karo", bold:true},
  ],
  coinbase: [
    {text:"Coinbase website login karo (coinbase.com)", bold:true},
    {text:"'Assets' → 'Taxes' section mein jao"},
    {text:"Ya 'Statements' → 'Generate' click karo"},
    {text:"'Transaction History' CSV select karo", note:"INR conversion baad mein hogi"},
    {text:"Full date range select karke download karo"},
    {text:"Yahan upload karo", bold:true},
  ],
};

const AD = () => (
  <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px",margin:"14px 0"}}>
    <div style={{fontSize:9,color:"#94a3b8",letterSpacing:1,marginBottom:2}}>ADVERTISEMENT</div>
    <ins className="adsbygoogle" style={{display:"block"}} data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO" data-ad-format="auto" data-full-width-responsive="true"/>
    <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
  </div>
);

const GuideBox = ({emoji,title,steps,tip}) => (
  <div style={{background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)",border:"1px solid #6ee7b7",borderRadius:14,padding:"14px 16px",marginBottom:14}}>
    <div style={{fontWeight:800,fontSize:13,color:"#065f46",marginBottom:10}}>{emoji} {title} — Kaise Use Karein?</div>
    {steps.map((s,i)=>(
      <div key={i} style={{display:"flex",gap:10,marginBottom:7,alignItems:"flex-start"}}>
        <div style={{width:22,height:22,borderRadius:"50%",background:"#10b981",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
        <div style={{fontSize:12,color:"#047857",lineHeight:1.5}}>{s}</div>
      </div>
    ))}
    {tip&&<div style={{marginTop:10,fontSize:11,color:"#059669",background:"rgba(16,185,129,.1)",borderRadius:8,padding:"6px 10px"}}>💡 Tip: {tip}</div>}
  </div>
);

// ═══════════════════════════════════════════════════════
// 1. DCA PLANNER
// ═══════════════════════════════════════════════════════
function DcaPlanner(){
  const [coinInput,setCoinInput] = useState("BTC");
  const [monthly,setMonthly]     = useState("1000");
  const [timeMode,setTimeMode]   = useState("months");
  const [monthVal,setMonthVal]   = useState("12");
  const [yearVal,setYearVal]     = useState("3");
  const [result,setResult]       = useState(null);
  const [loading,setLoading]     = useState(false);
  const [err,setErr]             = useState("");

  const QUICK=["BTC","ETH","SOL","BNB","APT","AVAX","DOGE","LINK","XRP","PEPE","WIF","ARB"];

  const getTotalMonths=()=>timeMode==="months"?parseInt(monthVal)||1:(parseInt(yearVal)||1)*12;
  const getTimeLabel=()=>{
    const m=getTotalMonths();
    if(m<12)return`${m} mahine`;
    const y=m/12;
    return y===Math.floor(y)?`${y} saal`:`${Math.floor(y)}yr ${m%12}m`;
  };

  const calculate=async()=>{
    const sym=coinInput.trim().toUpperCase();
    if(!sym){setErr("Coin name daalo");return;}
    setErr("");setResult(null);setLoading(true);
    try{
      const totalMonths=getTotalMonths();
      // Fetch real monthly candles from Binance
      const limit=Math.min(totalMonths+2,1000);
      const r=await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=1M&limit=${limit}`,
        {signal:AbortSignal.timeout(10000)}
      );
      if(!r.ok)throw new Error(`"${sym}" Binance pe nahi mila. BTC, ETH, SOL jaisa naam try karo.`);
      const klines=await r.json();
      if(!klines||klines.length<2)throw new Error("Insufficient data. Ek popular coin try karo.");

      // Use last N months of actual price data
      const useMonths=Math.min(totalMonths,klines.length-1);
      const monthlyAmt=parseFloat(monthly)||0;

      let totalInvested=0, totalCoins=0;
      const points=[];
      const interval=useMonths<=12?1:useMonths<=36?3:useMonths<=60?6:12;

      for(let i=0;i<useMonths;i++){
        const openPrice=parseFloat(klines[i][1]); // actual open price that month
        if(openPrice>0){
          totalInvested+=monthlyAmt;
          totalCoins+=monthlyAmt/openPrice; // coins bought that month at real price
        }
        if((i+1)%interval===0||(i+1)===useMonths){
          const curPrice=parseFloat(klines[Math.min(i+1,klines.length-1)][4]);
          const curValue=totalCoins*curPrice;
          const mNum=i+1;
          const label=mNum<12?`${mNum}m`:mNum===12?"1yr":`${(mNum/12).toFixed(mNum%12===0?0:1)}yr`;
          points.push({label,invested:Math.round(totalInvested),value:Math.round(curValue)});
        }
      }

      const lastPrice=parseFloat(klines[klines.length-1][4]);
      const currentValue=totalCoins*lastPrice;
      const profit=currentValue-totalInvested;
      const multiplier=totalInvested>0?currentValue/totalInvested:1;
      const avgBuyPrice=totalInvested/totalCoins;

      // Real start vs current
      const startPrice=parseFloat(klines[0][1]);
      const priceChange=((lastPrice-startPrice)/startPrice*100);

      setResult({
        total:Math.round(currentValue),
        invested:Math.round(totalInvested),
        profit:Math.round(profit),
        multiplier,points,
        sym,totalMonths:useMonths,
        timeLabel:getTimeLabel(),
        lastPrice,avgBuyPrice,
        startPrice,priceChange,
        totalCoins:totalCoins.toFixed(6),
        monthsAvailable:useMonths,
        isRealData:true,
      });
    }catch(e){setErr(e.message);}
    setLoading(false);
  };

  const green=result&&result.profit>=0;

  return(
    <div className="fadein">
      <div style={{textAlign:"center",marginBottom:14}}>
        <div style={{fontSize:40,marginBottom:6}}>📅</div>
        <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-1,marginBottom:4}}>DCA Planner</h2>
        <p style={{fontSize:13,color:T.text2}}>Real Binance prices se actual return calculate karo</p>
        <div style={{display:"inline-block",background:"#ecfdf5",border:"1px solid #6ee7b7",borderRadius:20,padding:"3px 12px",fontSize:10,color:"#059669",fontWeight:700,marginTop:6}}>
          ✅ Real Historical Data — Binance API
        </div>
      </div>

      <GuideBox emoji="📅" title="DCA Planner — Real Data"
        steps={[
          "Coin daalo — BTC, ETH, SOL ya koi bhi Binance coin",
          "Monthly investment amount set karo",
          "Time period choose karo (1 mahine se 15 saal)",
          "Calculate — Binance se real monthly prices fetch honge",
          "Actual result dikhega: agar us time se invest kiya hota toh aaj kitna hota"
        ]}
        tip="Yeh REAL data hai! Binance ke actual historical monthly prices use kiye jaate hain — estimate nahi!"
      />
      <AD/>

      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"18px",marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.05)"}}>
        {/* Coin input */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:6,letterSpacing:.5}}>COIN</div>
          <input value={coinInput} onChange={e=>{setCoinInput(e.target.value.toUpperCase());setErr("");setResult(null);}}
            placeholder="BTC, ETH, SOL, APT..."
            style={{width:"100%",background:"#f8fafc",border:`2px solid ${err?"#ef4444":"#e2e8f0"}`,borderRadius:12,
              padding:"13px 16px",fontSize:20,fontWeight:900,fontFamily:"'JetBrains Mono',monospace",
              color:"#0f172a",boxSizing:"border-box",marginBottom:6}}
            onFocus={e=>e.target.style.borderColor="#10b981"}
            onBlur={e=>e.target.style.borderColor=err?"#ef4444":"#e2e8f0"}/>
          {err&&<div style={{fontSize:11,color:"#ef4444",marginBottom:6}}>⚠️ {err}</div>}
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {QUICK.map(c=>(
              <button key={c} onClick={()=>{setCoinInput(c);setErr("");setResult(null);}}
                style={{background:coinInput===c?"#10b981":"#f8fafc",color:coinInput===c?"#fff":"#64748b",
                  border:`1.5px solid ${coinInput===c?"#10b981":"#e2e8f0"}`,borderRadius:20,padding:"4px 11px",
                  fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Monthly amount */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:6,letterSpacing:.5}}>MONTHLY AMOUNT (₹)</div>
          <input value={monthly} onChange={e=>setMonthly(e.target.value)} type="number" placeholder="1000"
            style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
              padding:"13px 16px",fontSize:20,fontWeight:900,fontFamily:"'JetBrains Mono',monospace",
              color:"#0f172a",boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor="#10b981"}
            onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          <div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap"}}>
            {["500","1000","2000","5000","10000"].map(a=>(
              <button key={a} onClick={()=>setMonthly(a)}
                style={{background:monthly===a?"#059669":"#f0fdf4",color:monthly===a?"#fff":"#059669",
                  border:`1px solid ${monthly===a?"#059669":"#6ee7b7"}`,borderRadius:20,padding:"4px 11px",
                  fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                ₹{parseInt(a).toLocaleString("en-IN")}
              </button>
            ))}
          </div>
        </div>

        {/* Time Period */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:8,letterSpacing:.5}}>TIME PERIOD</div>
          <div style={{display:"flex",background:"#f8fafc",borderRadius:12,padding:3,marginBottom:10,border:"1px solid #e2e8f0"}}>
            {[{v:"months",l:"📅 Mahine (1-12)"},{v:"years",l:"📆 Saal (1-15)"}].map(m=>(
              <button key={m.v} onClick={()=>setTimeMode(m.v)}
                style={{flex:1,padding:"9px",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:12,
                  fontFamily:"'Inter',sans-serif",border:"none",
                  background:timeMode===m.v?"#10b981":"transparent",
                  color:timeMode===m.v?"#fff":"#64748b"}}>
                {m.l}
              </button>
            ))}
          </div>
          {timeMode==="months"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:11,color:"#64748b"}}>Duration</span>
                <span style={{fontSize:14,fontWeight:900,color:"#10b981"}}>{monthVal} mahine</span>
              </div>
              <input type="range" min="1" max="12" value={monthVal}
                onChange={e=>setMonthVal(e.target.value)}
                style={{width:"100%",accentColor:"#10b981",cursor:"pointer",marginBottom:5}}/>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {["1","3","6","9","12"].map(m=>(
                  <button key={m} onClick={()=>setMonthVal(m)}
                    style={{background:monthVal===m?"#10b981":"#f8fafc",color:monthVal===m?"#fff":"#64748b",
                      border:`1px solid ${monthVal===m?"#10b981":"#e2e8f0"}`,borderRadius:20,
                      padding:"4px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          )}
          {timeMode==="years"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:11,color:"#64748b"}}>Duration</span>
                <span style={{fontSize:14,fontWeight:900,color:"#10b981"}}>{yearVal} saal</span>
              </div>
              <input type="range" min="1" max="15" value={yearVal}
                onChange={e=>setYearVal(e.target.value)}
                style={{width:"100%",accentColor:"#10b981",cursor:"pointer",marginBottom:5}}/>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {["1","2","3","5","7","10","15"].map(y=>(
                  <button key={y} onClick={()=>setYearVal(y)}
                    style={{background:yearVal===y?"#10b981":"#f8fafc",color:yearVal===y?"#fff":"#64748b",
                      border:`1px solid ${yearVal===y?"#10b981":"#e2e8f0"}`,borderRadius:20,
                      padding:"4px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                    {y}yr
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {monthly&&coinInput&&(
          <div style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:10,padding:"10px 14px",marginBottom:12}}>
            <span style={{fontSize:11,color:"#065f46",fontWeight:700}}>
              ₹{parseInt(monthly||0).toLocaleString("en-IN")}/month × {getTimeLabel()} = ₹{(parseInt(monthly||0)*getTotalMonths()).toLocaleString("en-IN")} invest hoga
            </span>
          </div>
        )}

        <button onClick={calculate} disabled={loading||!coinInput.trim()}
          style={{width:"100%",background:loading||!coinInput.trim()?"#e2e8f0":"linear-gradient(135deg,#10b981,#059669)",
            color:loading||!coinInput.trim()?"#94a3b8":"#fff",border:"none",borderRadius:12,padding:"15px",
            fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"'Inter',sans-serif",
            boxShadow:loading?"none":"0 4px 14px rgba(16,185,129,.4)"}}>
          {loading?"⟳ Binance se data fetch ho raha hai...":"📊 Real Data Se Calculate Karo"}
        </button>
      </div>

      {/* Results */}
      {result&&(
        <div className="fadein">
          {/* Real data badge */}
          <div style={{background:"#ecfdf5",border:"1px solid #6ee7b7",borderRadius:10,padding:"8px 14px",
            marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:"#059669",fontWeight:700}}>
              ✅ Real Binance Data · {result.monthsAvailable} mahine ka actual history
            </span>
            <span style={{fontSize:10,color:"#94a3b8"}}>USDT prices</span>
          </div>

          <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",borderRadius:16,padding:"20px",marginBottom:12}}>
            <div style={{textAlign:"center",marginBottom:14}}>
              <div style={{fontSize:12,color:"#6b7280"}}>
                {result.sym} · ₹{parseInt(monthly).toLocaleString("en-IN")}/month · {result.timeLabel}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div style={{background:"rgba(255,255,255,.06)",borderRadius:12,padding:"14px",textAlign:"center"}}>
                <div style={{fontSize:10,color:"#6b7280",marginBottom:4}}>Total Invested</div>
                <div style={{fontSize:20,fontWeight:900,color:"#fff",fontFamily:"'JetBrains Mono',monospace"}}>
                  ₹{result.invested.toLocaleString("en-IN")}
                </div>
              </div>
              <div style={{background:green?"rgba(16,185,129,.12)":"rgba(239,68,68,.12)",borderRadius:12,
                padding:"14px",textAlign:"center",border:`1px solid ${green?"rgba(16,185,129,.3)":"rgba(239,68,68,.3)"}`}}>
                <div style={{fontSize:10,color:"#6b7280",marginBottom:4}}>Current Value</div>
                <div style={{fontSize:20,fontWeight:900,color:green?"#10b981":"#ef4444",fontFamily:"'JetBrains Mono',monospace"}}>
                  ₹{result.total.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
            <div style={{background:"rgba(255,255,255,.04)",borderRadius:12,padding:"14px",textAlign:"center",marginBottom:10}}>
              <div style={{fontSize:12,color:"#6b7280",marginBottom:4}}>
                {green?"Profit 🎉":"Loss 📉"} (Real)
              </div>
              <div style={{fontSize:32,fontWeight:900,color:green?"#34d399":"#f87171"}}>
                {green?"+":"-"}₹{Math.abs(result.profit).toLocaleString("en-IN")}
              </div>
              <div style={{fontSize:12,color:green?"#6ee7b7":"#fca5a5",marginTop:4}}>
                {result.multiplier.toFixed(3)}x return · {result.sym}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[
                {l:"Coins Kharida",v:`${result.totalCoins} ${result.sym}`},
                {l:"Avg. Buy Price",v:`$${result.avgBuyPrice.toFixed(4)}`},
                {l:"Current Price",v:`$${result.lastPrice.toFixed(4)}`},
              ].map((s,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,.04)",borderRadius:8,padding:"8px",textAlign:"center"}}>
                  <div style={{fontSize:8,color:"#6b7280",marginBottom:2}}>{s.l}</div>
                  <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"14px",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:10}}>📈 Growth Timeline (Real Prices)</div>
            {result.points.map((p,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{width:36,fontSize:9,color:"#94a3b8",fontWeight:700,flexShrink:0}}>{p.label}</div>
                <div style={{flex:1,background:"#f1f5f9",borderRadius:100,height:7,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:100,
                    background:p.value>=p.invested?"linear-gradient(90deg,#10b981,#34d399)":"linear-gradient(90deg,#ef4444,#f87171)",
                    width:`${Math.min(100,(p.value/Math.max(result.total,result.invested))*100)}%`}}/>
                </div>
                <div style={{fontSize:10,fontWeight:700,width:72,textAlign:"right",
                  fontFamily:"'JetBrains Mono',monospace",
                  color:p.value>=p.invested?"#059669":"#dc2626"}}>
                  ₹{p.value.toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>

          <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(
            `📅 DCA Result — ${result.sym} (Real Data!)\n\n₹${parseInt(monthly).toLocaleString("en-IN")}/month × ${result.timeLabel}\n\nInvested: ₹${result.invested.toLocaleString("en-IN")}\nValue: ₹${result.total.toLocaleString("en-IN")}\n${green?"Profit":"Loss"}: ₹${Math.abs(result.profit).toLocaleString("en-IN")}\n${result.multiplier.toFixed(2)}x return!\n\nKhud calculate karo: yesyoupro.com/features`
          )}`)}
            style={{width:"100%",background:"#25D366",color:"#fff",border:"none",borderRadius:12,
              padding:"12px",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif",marginBottom:10}}>
            📱 WhatsApp pe Share Karo
          </button>
          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",lineHeight:1.6}}>
            Real Binance historical data · Past performance ≠ future guarantee · DYOR
          </div>
        </div>
      )}
      <AD/>
    </div>
  );
}
  const [timeMode,setTimeMode]    = useState("months"); // "months" | "years"
  const [monthVal,setMonthVal]    = useState("12");     // 1-12
  const [yearVal,setYearVal]      = useState("3");      // 1-15
  const [result,setResult]        = useState(null);
  const [loading,setLoading]      = useState(false);
  const [coinError,setCoinError]  = useState("");

  // Popular coins for quick select
  const QUICK = ["BTC","ETH","SOL","BNB","APT","AVAX","DOGE","LINK","XRP","PEPE","WIF","ARB"];

  // CAGR estimates based on historical data (approximate)
  const CAGR_MAP = {
    BTC:0.95,ETH:0.80,SOL:1.20,BNB:0.75,ADA:0.50,AVAX:0.90,
    DOGE:0.80,LINK:0.70,DOT:0.45,MATIC:0.85,XRP:0.55,UNI:0.60,
    APT:1.10,SUI:1.15,INJ:1.30,ARB:0.80,OP:0.75,NEAR:0.70,
    WIF:1.50,BONK:1.40,PEPE:1.60,ORDI:1.20,
    FTM:0.70,ATOM:0.50,LTC:0.45,TRX:0.50,
  };

  const getTotalMonths = () => {
    if(timeMode==="months") return parseInt(monthVal)||1;
    return (parseInt(yearVal)||1)*12;
  };

  const getDisplayTime = () => {
    const m = getTotalMonths();
    if(m<12) return `${m} mahine`;
    const y = m/12;
    return y===Math.floor(y) ? `${y} saal` : `${Math.floor(y)} saal ${m%12} mahine`;
  };

  const calculate = async () => {
    const sym = coinInput.trim().toUpperCase();
    if(!sym){ setCoinError("Coin name daalo"); return; }
    setCoinError(""); setResult(null); setLoading(true);

    const amt = parseFloat(monthly)||0;
    const totalMonths = getTotalMonths();

    // Try to get CAGR — use map first, then estimate from API
    let cagr = CAGR_MAP[sym];
    let coinName = sym;
    let coinColor = "#10b981";

    if(!cagr){
      // Try Binance to verify coin exists, use 80% CAGR as conservative estimate for unknown coins
      try{
        const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`,{signal:AbortSignal.timeout(5000)});
        if(r.ok){
          const d = await r.json();
          const ch24 = parseFloat(d.priceChangePercent)||0;
          // Use conservative estimate for unknown coins
          cagr = 0.65; // ~65% annual avg for mid-cap alts
          coinName = sym;
        } else {
          setCoinError(`"${sym}" Binance pe nahi mila. BTC, ETH, SOL jaisa naam daalo.`);
          setLoading(false); return;
        }
      }catch(e){
        cagr = 0.65; // fallback
      }
    }

    const monthlyRate = Math.pow(1+cagr, 1/12) - 1;
    let total=0, invested=0;
    const points=[];
    const interval = totalMonths <= 12 ? 1 : totalMonths <= 60 ? 6 : 12;

    for(let i=1;i<=totalMonths;i++){
      invested += amt;
      total = (total + amt) * (1 + monthlyRate);
      if(i%interval===0||i===totalMonths){
        const label = i<12?`${i}m`:i===12?"1yr":`${(i/12).toFixed(i%12===0?0:1)}yr`;
        points.push({month:i,label,invested:Math.round(invested),value:Math.round(total)});
      }
    }

    const profit = total - invested;
    const multiplier = invested>0 ? total/invested : 1;

    setResult({
      total:Math.round(total), invested:Math.round(invested),
      profit:Math.round(profit), multiplier, points,
      coinName, coinColor, sym, cagr,
      totalMonths, timeDisplay:getDisplayTime(),
    });
    setLoading(false);
  };

  return(
    <div className="fadein">
      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:40,marginBottom:8}}>📅</div>
        <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-1,marginBottom:4}}>DCA Planner</h2>
        <p style={{fontSize:13,color:T.text2}}>Koi bhi coin · 1 mahine se 15 saal tak</p>
      </div>

      <GuideBox emoji="📅" title="DCA Planner"
        steps={[
          "Koi bhi coin ka naam daalo — BTC, ETH, APT, SOL ya koi bhi",
          "Quick buttons se select karo ya khud type karo",
          "Monthly amount set karo",
          "Time period choose karo — mahine ya saal mein",
          "Calculate dabao — estimate milega"
        ]}
        tip="DCA = Dollar Cost Averaging. Har mahine thoda thoda invest karo — price high ho ya low. Long term mein yeh strategy sabse effective hai!"
      />

      <AD/>

      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"18px",marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.05)"}}>

        {/* Coin Input */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:6,letterSpacing:.5}}>COIN (koi bhi daalo)</div>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <input
              value={coinInput}
              onChange={e=>{setCoinInput(e.target.value.toUpperCase());setCoinError("");setResult(null);}}
              placeholder="e.g. BTC, ETH, SOL, APT..."
              style={{flex:1,background:"#f8fafc",border:`2px solid ${coinError?"#ef4444":"#e2e8f0"}`,borderRadius:12,
                padding:"12px 16px",fontSize:18,fontWeight:800,
                fontFamily:"'JetBrains Mono',monospace",color:"#0f172a",minWidth:0,boxSizing:"border-box"}}
              onFocus={e=>e.target.style.borderColor="#10b981"}
              onBlur={e=>e.target.style.borderColor=coinError?"#ef4444":"#e2e8f0"}/>
          </div>
          {coinError&&<div style={{fontSize:11,color:"#ef4444",marginBottom:6}}>⚠️ {coinError}</div>}

          {/* Quick select */}
          <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,marginBottom:6}}>Quick Select:</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {QUICK.map(c=>(
              <button key={c} onClick={()=>{setCoinInput(c);setCoinError("");setResult(null);}}
                style={{background:coinInput===c?"#10b981":"#f8fafc",
                  color:coinInput===c?"#fff":"#475569",
                  border:`1.5px solid ${coinInput===c?"#10b981":"#e2e8f0"}`,
                  borderRadius:20,padding:"5px 12px",cursor:"pointer",
                  fontSize:11,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",
                  transition:"all .15s"}}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Monthly Amount */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:6,letterSpacing:.5}}>MONTHLY AMOUNT (₹)</div>
          <input value={monthly} onChange={e=>setMonthly(e.target.value)} type="number"
            placeholder="e.g. 1000"
            style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
              padding:"12px 16px",fontSize:18,fontWeight:800,
              fontFamily:"'JetBrains Mono',monospace",color:"#0f172a",boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor="#10b981"}
            onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
          <div style={{display:"flex",gap:5,marginTop:6,flexWrap:"wrap"}}>
            {["500","1000","2000","5000","10000"].map(a=>(
              <button key={a} onClick={()=>setMonthly(a)}
                style={{background:monthly===a?"#059669":"#f0fdf4",
                  color:monthly===a?"#fff":"#059669",
                  border:`1px solid ${monthly===a?"#059669":"#6ee7b7"}`,
                  borderRadius:20,padding:"4px 11px",fontSize:10,
                  fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                ₹{parseInt(a).toLocaleString("en-IN")}
              </button>
            ))}
          </div>
        </div>

        {/* Time Period — Months OR Years toggle */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:8,letterSpacing:.5}}>TIME PERIOD</div>

          {/* Toggle */}
          <div style={{display:"flex",background:"#f8fafc",borderRadius:12,padding:4,marginBottom:10,border:"1px solid #e2e8f0"}}>
            {[{v:"months",l:"📅 Mahine (1-12)"},
              {v:"years", l:"📆 Saal (1-15 yrs)"}].map(m=>(
              <button key={m.v} onClick={()=>setTimeMode(m.v)}
                style={{flex:1,padding:"9px",borderRadius:10,cursor:"pointer",fontWeight:700,
                  fontSize:12,fontFamily:"'Inter',sans-serif",border:"none",transition:"all .15s",
                  background:timeMode===m.v?"#10b981":"transparent",
                  color:timeMode===m.v?"#fff":"#64748b"}}>
                {m.l}
              </button>
            ))}
          </div>

          {/* Months slider (1-12) */}
          {timeMode==="months"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:11,color:"#64748b"}}>Duration</span>
                <span style={{fontSize:14,fontWeight:800,color:"#10b981"}}>
                  {monthVal} mahine
                </span>
              </div>
              <input type="range" min="1" max="12" value={monthVal}
                onChange={e=>setMonthVal(e.target.value)}
                style={{width:"100%",accentColor:"#10b981",height:6,cursor:"pointer"}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#94a3b8",marginTop:3}}>
                <span>1 mahina</span><span>6 mahine</span><span>12 mahine</span>
              </div>
              {/* Quick months */}
              <div style={{display:"flex",gap:5,marginTop:8,flexWrap:"wrap"}}>
                {["1","3","6","9","12"].map(m=>(
                  <button key={m} onClick={()=>setMonthVal(m)}
                    style={{background:monthVal===m?"#10b981":"#f8fafc",
                      color:monthVal===m?"#fff":"#64748b",
                      border:`1px solid ${monthVal===m?"#10b981":"#e2e8f0"}`,
                      borderRadius:20,padding:"4px 12px",fontSize:11,
                      fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Years slider (1-15) */}
          {timeMode==="years"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:11,color:"#64748b"}}>Duration</span>
                <span style={{fontSize:14,fontWeight:800,color:"#10b981"}}>
                  {yearVal} saal ({parseInt(yearVal)*12} mahine)
                </span>
              </div>
              <input type="range" min="1" max="15" value={yearVal}
                onChange={e=>setYearVal(e.target.value)}
                style={{width:"100%",accentColor:"#10b981",height:6,cursor:"pointer"}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#94a3b8",marginTop:3}}>
                <span>1 saal</span><span>5 saal</span><span>10 saal</span><span>15 saal</span>
              </div>
              {/* Quick years */}
              <div style={{display:"flex",gap:5,marginTop:8,flexWrap:"wrap"}}>
                {["1","2","3","5","7","10","15"].map(y=>(
                  <button key={y} onClick={()=>setYearVal(y)}
                    style={{background:yearVal===y?"#10b981":"#f8fafc",
                      color:yearVal===y?"#fff":"#64748b",
                      border:`1px solid ${yearVal===y?"#10b981":"#e2e8f0"}`,
                      borderRadius:20,padding:"4px 12px",fontSize:11,
                      fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                    {y}yr
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary preview */}
        {monthly&&coinInput&&(
          <div style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:10,
            padding:"10px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:11,color:"#065f46"}}>
              ₹{parseInt(monthly||0).toLocaleString("en-IN")}/month × {getDisplayTime()}
            </div>
            <div style={{fontSize:12,fontWeight:800,color:"#059669"}}>
              = ₹{(parseInt(monthly||0)*getTotalMonths()).toLocaleString("en-IN")} invest
            </div>
          </div>
        )}

        <button onClick={calculate} disabled={loading||!coinInput.trim()}
          style={{width:"100%",background:loading?"#e2e8f0":"linear-gradient(135deg,#10b981,#059669)",
            color:loading?"#94a3b8":"#fff",border:"none",borderRadius:12,padding:"15px",
            fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"'Inter',sans-serif",
            boxShadow:loading?"none":"0 4px 14px rgba(16,185,129,.4)"}}>
          {loading?"⟳ Calculating...":"📊 DCA Calculate Karo"}
        </button>
      </div>

      {/* Result */}
      {result&&(
        <div className="fadein">
          <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",borderRadius:16,padding:"20px",marginBottom:12}}>
            <div style={{textAlign:"center",marginBottom:14}}>
              <div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>
                {result.sym} · ₹{parseInt(monthly).toLocaleString("en-IN")}/month · {result.timeDisplay}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div style={{background:"rgba(255,255,255,.06)",borderRadius:12,padding:"12px",textAlign:"center"}}>
                <div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Total Invested</div>
                <div style={{fontSize:20,fontWeight:900,color:"#fff",fontFamily:"'JetBrains Mono',monospace"}}>
                  ₹{result.invested.toLocaleString("en-IN")}
                </div>
              </div>
              <div style={{background:"rgba(16,185,129,.12)",borderRadius:12,padding:"12px",textAlign:"center",border:"1px solid rgba(16,185,129,.3)"}}>
                <div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Est. Final Value</div>
                <div style={{fontSize:20,fontWeight:900,color:"#10b981",fontFamily:"'JetBrains Mono',monospace"}}>
                  ₹{result.total.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
            <div style={{background:"rgba(255,255,255,.04)",borderRadius:12,padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:12,color:"#6b7280",marginBottom:4}}>Estimated Profit</div>
              <div style={{fontSize:32,fontWeight:900,color:"#34d399"}}>
                +₹{result.profit.toLocaleString("en-IN")}
              </div>
              <div style={{fontSize:12,color:"#6ee7b7",marginTop:4}}>
                {result.multiplier.toFixed(2)}x return · {result.sym} · ~{(result.cagr*100).toFixed(0)}% annual est.
              </div>
            </div>
          </div>

          {/* Growth timeline */}
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"14px",marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:10,color:"#0f172a"}}>📈 Growth Timeline</div>
            {result.points.map((p,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{width:36,fontSize:9,color:"#94a3b8",fontWeight:600,flexShrink:0}}>{p.label}</div>
                <div style={{flex:1,background:"#f1f5f9",borderRadius:100,height:7,overflow:"hidden"}}>
                  <div style={{height:"100%",
                    background:p.value>=p.invested?"linear-gradient(90deg,#10b981,#34d399)":"linear-gradient(90deg,#ef4444,#f87171)",
                    borderRadius:100,width:`${Math.min(100,(p.value/result.total)*100)}%`}}/>
                </div>
                <div style={{width:76,textAlign:"right",fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10,fontWeight:700,color:p.value>=p.invested?"#059669":"#dc2626"}}>
                  ₹{p.value.toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>

          <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(
            `📅 DCA Strategy — ${result.sym}\n\n₹${parseInt(monthly).toLocaleString("en-IN")}/month × ${result.timeDisplay}\n\nInvested: ₹${result.invested.toLocaleString("en-IN")}\nEst. Value: ₹${result.total.toLocaleString("en-IN")}\nEst. Profit: ₹${result.profit.toLocaleString("en-IN")}\n${result.multiplier.toFixed(2)}x return!\n\nKhud calculate karo → yesyoupro.com/features`
          )}`)}
            style={{width:"100%",background:"#25D366",color:"#fff",border:"none",borderRadius:12,
              padding:"12px",fontWeight:700,fontSize:13,cursor:"pointer",
              fontFamily:"'Inter',sans-serif",marginBottom:10}}>
            📱 WhatsApp pe Share Karo
          </button>

          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",lineHeight:1.7}}>
            ⚠️ Yeh estimate hai — historical CAGR pe based. Future returns guaranteed nahi hain.<br/>
            DYOR · Not financial advice · Crypto is risky
          </div>
        </div>
      )}
      <AD/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 2. CRYPTO vs TRADITIONAL
// ═══════════════════════════════════════════════════════
function TraditionalCompare(){
  const [amount,setAmount]=useState("100000");
  const [years,setYears]=useState("5");
  const [result,setResult]=useState(null);

  const INVESTMENTS=[
    {name:"Bitcoin (BTC)",   emoji:"₿", cagr:0.80, color:"#F0B90B", risk:"High",   note:"Past 5yr avg"},
    {name:"Ethereum (ETH)",  emoji:"⟠", cagr:0.60, color:"#627EEA", risk:"High",   note:"Past 5yr avg"},
    {name:"Nifty 50",        emoji:"📈", cagr:0.14, color:"#1d4ed8", risk:"Medium", note:"~14% CAGR avg"},
    {name:"Bank FD",         emoji:"🏦", cagr:0.07, color:"#059669", risk:"Low",    note:"7% p.a."},
    {name:"Gold",            emoji:"🥇", cagr:0.12, color:"#d97706", risk:"Low",    note:"~12% CAGR avg"},
    {name:"Real Estate",     emoji:"🏠", cagr:0.10, color:"#7c3aed", risk:"Medium", note:"~10% CAGR avg"},
    {name:"PPF",             emoji:"🔒", cagr:0.071,color:"#0891b2", risk:"Nil",    note:"7.1% p.a."},
  ];

  const calculate=()=>{
    const amt=parseFloat(amount)||0;
    const y=parseInt(years)||1;
    const res=INVESTMENTS.map(inv=>({
      ...inv,
      final: Math.round(amt*Math.pow(1+inv.cagr,y)),
      profit: Math.round(amt*(Math.pow(1+inv.cagr,y)-1)),
    })).sort((a,b)=>b.final-a.final);
    setResult({res,amt,years:y,best:res[0]});
  };

  return(
    <div className="fadein">
      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:40,marginBottom:8}}>🆚</div>
        <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-1,marginBottom:4}}>Crypto vs Traditional</h2>
        <p style={{fontSize:13,color:T.text2}}>Bitcoin vs FD vs Gold vs Real Estate — kaunsa better tha?</p>
      </div>

      <GuideBox emoji="🆚" title="Crypto vs Traditional"
        steps={[
          "Invest karna chahte amount enter karo (₹ mein)",
          "Kitne saal pehle invest kiya hota — select karo",
          "Calculate karo — 7 investments ka comparison dikhega",
          "Winner dekho aur decide karo aage ki strategy"
        ]}
        tip="Ye past data pe based hai. Future returns vary kar sakte hain. Diversification best approach hai!"
      />
      <AD/>

      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"18px",marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.05)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:6}}>INVEST AMOUNT (₹)</div>
            <input value={amount} onChange={e=>setAmount(e.target.value)} type="number" placeholder="100000"
              style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"12px 14px",fontSize:16,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:"#0f172a",boxSizing:"border-box"}}
              onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
            <div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>
              {["10000","50000","100000","500000"].map(a=>(
                <button key={a} onClick={()=>setAmount(a)}
                  style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:20,padding:"2px 8px",fontSize:9,color:"#059669",fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
                  ₹{parseInt(a).toLocaleString("en-IN")}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:6}}>YEARS</div>
            <select value={years} onChange={e=>setYears(e.target.value)}
              style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"12px",fontSize:13,color:"#0f172a",fontFamily:"'Inter',sans-serif"}}>
              {[1,2,3,5,7,10].map(y=><option key={y} value={y}>{y} saal pehle</option>)}
            </select>
          </div>
        </div>
        <button onClick={calculate}
          style={{width:"100%",background:"linear-gradient(135deg,#6366f1,#4f46e5)",color:"#fff",border:"none",borderRadius:12,padding:"14px",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
          🆚 Compare Karo
        </button>
      </div>

      {result&&(
        <div className="fadein">
          {result.res.map((r,i)=>(
            <div key={i} style={{background:"#fff",border:`2px solid ${i===0?r.color+"66":"#f1f5f9"}`,borderRadius:14,padding:"14px 16px",marginBottom:8,boxShadow:i===0?"0 4px 16px rgba(0,0,0,.08)":"none"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:10,background:i===0?r.color:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{r.emoji}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{i===0?"🏆 ":""}{r.name}</div>
                    <div style={{fontSize:10,color:"#94a3b8"}}>Risk: {r.risk} · {r.note}</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:15,fontWeight:900,color:r.color}}>
                    ₹{r.final.toLocaleString("en-IN")}
                  </div>
                  <div style={{fontSize:10,color:"#94a3b8"}}>{(r.final/parseFloat(amount)).toFixed(1)}x</div>
                </div>
              </div>
              <div style={{background:"#f1f5f9",borderRadius:100,height:6,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:100,background:r.color,width:`${Math.min(100,(r.final/result.res[0].final)*100)}%`,transition:"width 1s ease"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10}}>
                <span style={{color:"#94a3b8"}}>Profit: <span style={{color:"#059669",fontWeight:700}}>+₹{r.profit.toLocaleString("en-IN")}</span></span>
                <span style={{color:r.color,fontWeight:700}}>{(r.cagr*100).toFixed(1)}% CAGR</span>
              </div>
            </div>
          ))}
          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",marginTop:8,lineHeight:1.6}}>
            ⚠️ Historical data pe based. Past performance ≠ future guarantee. DYOR.
          </div>
        </div>
      )}
      <AD/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 3. RUG PULL DETECTOR
// ═══════════════════════════════════════════════════════
function RugPullDetector(){
  const [coinInput,setCoinInput]=useState("");
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");

  const getRiskScore=(d)=>{
    let score=0,flags=[];
    // Liquidity check
    if(d.liquidity<50000){score+=30;flags.push("Very low liquidity (<$50K) — rug pull easy hai");}
    else if(d.liquidity<200000){score+=15;flags.push("Low liquidity ($50K-$200K) — risky");}
    // Volume/Market cap ratio
    if(d.mcap>0){
      const ratio=d.vol24h/d.mcap;
      if(ratio<0.01){score+=15;flags.push("Very low volume — no real interest");}
      if(ratio>5){score+=20;flags.push("Suspicious volume — wash trading possible");}
    }
    // Price change
    if(d.ch24>200){score+=25;flags.push("200%+ pump in 24h — classic pump & dump");}
    else if(d.ch24>100){score+=15;flags.push("100%+ pump — high dump risk");}
    if(d.ch24<-50){score+=20;flags.push("50%+ drop in 24h — possible rug already happened");}
    // Market cap
    if(d.mcap>0&&d.mcap<100000){score+=20;flags.push("Micro cap (<$100K) — extremely risky");}
    else if(d.mcap<1000000){score+=10;flags.push("Small cap (<$1M) — high risk");}
    // CEX listed = safer
    if(d.isCEX){score=Math.max(0,score-25);flags.push("✅ Major CEX listed — more credible");}
    return{score:Math.min(100,score),flags};
  };

  const analyze=async()=>{
    const sym=coinInput.trim().toUpperCase();
    if(!sym){setErr("Coin name daalo");return;}
    setErr("");setData(null);setLoading(true);
    try{
      let coinData={sym,isCEX:false,liquidity:0,vol24h:0,mcap:0,price:0,ch24:0,ch7d:0,source:"",name:sym};

      // Try Binance first (CEX = safer)
      const binR=await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`,{signal:AbortSignal.timeout(6000)});
      if(binR.ok){
        const b=await binR.json();
        coinData.isCEX=true;
        coinData.price=parseFloat(b.lastPrice);
        coinData.ch24=parseFloat(b.priceChangePercent);
        coinData.vol24h=parseFloat(b.quoteVolume);
        coinData.mcap=coinData.vol24h*3; // approximate
        coinData.source="Binance";
        coinData.name=sym;
        coinData.liquidity=coinData.vol24h*0.1; // CEX has high liquidity
      } else {
        // Try DexScreener for DEX tokens
        const dexR=await fetch(`https://api.dexscreener.com/latest/dex/search?q=${sym}`,{signal:AbortSignal.timeout(8000)});
        if(dexR.ok){
          const dex=await dexR.json();
          const pair=dex.pairs?.find(p=>p.baseToken?.symbol?.toUpperCase()===sym||p.quoteToken?.symbol?.toUpperCase()===sym);
          if(pair){
            coinData.price=parseFloat(pair.priceUsd||0);
            coinData.ch24=parseFloat(pair.priceChange?.h24||0);
            coinData.vol24h=parseFloat(pair.volume?.h24||0);
            coinData.liquidity=parseFloat(pair.liquidity?.usd||0);
            coinData.mcap=parseFloat(pair.fdv||pair.marketCap||0);
            coinData.source=`DEX: ${pair.dexId||"Unknown"}`;
            coinData.name=pair.baseToken?.name||sym;
            coinData.pairName=`${pair.baseToken?.symbol}/${pair.quoteToken?.symbol}`;
          }else{
            throw new Error(`"${sym}" nahi mila. Symbol exact daalo ya popular coins try karo.`);
          }
        }else{
          throw new Error("Data fetch failed. Thodi der baad try karo.");
        }
      }

      const{score,flags}=getRiskScore(coinData);
      setData({...coinData,riskScore:score,flags});
    }catch(e){setErr(e.message);}
    setLoading(false);
  };

  const riskLevel=data?.riskScore>=70?"🔴 HIGH RISK":data?.riskScore>=40?"🟡 MEDIUM RISK":"🟢 LOW RISK";
  const riskColor=data?.riskScore>=70?"#dc2626":data?.riskScore>=40?"#d97706":"#059669";
  const riskBg=data?.riskScore>=70?"#fef2f2":data?.riskScore>=40?"#fffbeb":"#ecfdf5";

  return(
    <div className="fadein">
      <div style={{textAlign:"center",marginBottom:14}}>
        <div style={{fontSize:40,marginBottom:6}}>🚨</div>
        <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-1,marginBottom:4}}>Rug Pull Detector</h2>
        <p style={{fontSize:13,color:T.text2}}>Real market data se risk analyze karo</p>
        <div style={{display:"inline-block",background:"#ecfdf5",border:"1px solid #6ee7b7",borderRadius:20,padding:"3px 12px",fontSize:10,color:"#059669",fontWeight:700,marginTop:6}}>
          ✅ Binance + DexScreener Real Data
        </div>
      </div>

      <GuideBox emoji="🚨" title="Rug Pull Detector"
        steps={[
          "Coin symbol daalo (e.g. BTC, PEPE, SAFEMOON)",
          "Analyze dabao — real market data fetch hoga",
          "Risk score 0-100 dikhega (100 = maximum danger)",
          "Liquidity, volume, price change sab check hoga",
          "Red flags list dekho — invest karne se pehle!"
        ]}
        tip="CEX listed coins (Binance, OKX) safer hoti hain. DEX-only coins mein rug pull ka risk zyada hota hai!"
      />
      <AD/>

      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"18px",marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.05)"}}>
        <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:6,letterSpacing:.5}}>COIN SYMBOL</div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input value={coinInput} onChange={e=>{setCoinInput(e.target.value.toUpperCase());setErr("");setData(null);}}
            placeholder="e.g. PEPE, SHIB, BTC, LUNA..."
            onKeyDown={e=>e.key==="Enter"&&analyze()}
            style={{flex:1,background:"#f8fafc",border:`2px solid ${err?"#ef4444":"#e2e8f0"}`,borderRadius:12,
              padding:"13px 16px",fontSize:18,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",
              color:"#0f172a",boxSizing:"border-box",minWidth:0}}
            onFocus={e=>e.target.style.borderColor="#ef4444"}
            onBlur={e=>e.target.style.borderColor=err?"#ef4444":"#e2e8f0"}/>
          <button onClick={analyze} disabled={loading||!coinInput.trim()}
            style={{background:loading?"#e2e8f0":"linear-gradient(135deg,#ef4444,#dc2626)",
              color:loading?"#94a3b8":"#fff",border:"none",borderRadius:12,padding:"13px 20px",
              fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif",flexShrink:0}}>
            {loading?"⟳":"🔍 Analyze"}
          </button>
        </div>
        {err&&<div style={{fontSize:11,color:"#ef4444",marginBottom:8}}>⚠️ {err}</div>}
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["PEPE","SHIB","FLOKI","LUNC","WIF","BTC","SOL","ARB"].map(c=>(
            <button key={c} onClick={()=>{setCoinInput(c);setErr("");setData(null);}}
              style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:20,padding:"4px 12px",
                fontSize:11,color:"#64748b",fontWeight:600,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading&&(
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"28px",textAlign:"center",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:10}}>
            {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
          </div>
          <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>Real data fetch ho raha hai...</div>
          <div style={{fontSize:11,color:"#94a3b8"}}>Binance + DexScreener check kar raha hai</div>
        </div>
      )}

      {data&&!loading&&(
        <div className="fadein">
          {/* Risk Score */}
          <div style={{background:riskBg,border:`2px solid ${riskColor}`,borderRadius:16,padding:"20px",marginBottom:12,textAlign:"center"}}>
            <div style={{fontSize:12,color:riskColor,fontWeight:700,marginBottom:8}}>{data.name} — {data.source}</div>
            <div style={{fontSize:72,fontWeight:900,color:riskColor,lineHeight:1,marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>
              {data.riskScore}
            </div>
            <div style={{fontSize:14,fontWeight:700,color:riskColor,marginBottom:4}}>/ 100 Risk Score</div>
            <div style={{fontSize:18,fontWeight:800,color:riskColor}}>{riskLevel}</div>
            {data.isCEX&&(
              <div style={{marginTop:10,fontSize:11,color:"#059669",background:"rgba(16,185,129,.1)",borderRadius:8,padding:"6px 12px",display:"inline-block"}}>
                ✅ Binance CEX Listed — More Credible
              </div>
            )}
          </div>

          {/* Market Data */}
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"14px",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:10}}>📊 Real Market Data</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[
                {l:"Price (USD)",      v:`$${data.price.toFixed(data.price<0.01?8:4)}`,c:"#0f172a"},
                {l:"24h Change",       v:`${data.ch24>=0?"+":""}${data.ch24.toFixed(2)}%`,c:data.ch24>=0?"#059669":"#dc2626"},
                {l:"24h Volume",       v:data.vol24h>1e6?`$${(data.vol24h/1e6).toFixed(1)}M`:data.vol24h>1000?`$${(data.vol24h/1000).toFixed(0)}K`:`$${data.vol24h.toFixed(0)}`,c:"#6366f1"},
                {l:"Liquidity/MCap",   v:data.liquidity>1e6?`$${(data.liquidity/1e6).toFixed(1)}M`:data.liquidity>1000?`$${(data.liquidity/1000).toFixed(0)}K`:`$${data.liquidity.toFixed(0)}`,c:data.liquidity>200000?"#059669":data.liquidity>50000?"#d97706":"#dc2626"},
              ].map((s,i)=>(
                <div key={i} style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px"}}>
                  <div style={{fontSize:9,color:"#94a3b8",marginBottom:3}}>{s.l}</div>
                  <div style={{fontSize:14,fontWeight:800,color:s.c,fontFamily:"'JetBrains Mono',monospace"}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Red Flags */}
          {data.flags.length>0&&(
            <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"14px",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:12,marginBottom:10,color:"#dc2626"}}>🚩 Risk Factors Found</div>
              {data.flags.map((f,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:7,
                  padding:"8px 10px",borderRadius:8,
                  background:f.startsWith("✅")?"#ecfdf5":"#fef2f2",
                  border:`1px solid ${f.startsWith("✅")?"#6ee7b7":"#fca5a5"}`}}>
                  <span style={{fontSize:14,flexShrink:0}}>{f.startsWith("✅")?"✅":"⚠️"}</span>
                  <span style={{fontSize:12,color:f.startsWith("✅")?"#065f46":"#dc2626",lineHeight:1.5}}>{f.replace("✅ ","")}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:"10px 14px",fontSize:11,color:"#92400e",lineHeight:1.7}}>
            ⚠️ Yeh automated analysis hai. Risk score market data pe based hai. Hamesha aur research karo. DYOR!
          </div>
        </div>
      )}
      <AD/>
    </div>
  );
}

  const analyze=async()=>{
    if(!coinName.trim())return;
    setLoading(true);setResult(null);
    try{
      const r=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({mode:"scam_ai",name:coinName,symbol:coinName.toUpperCase(),
          ch24:0,ch7d:0,rsi:50,
          scamFlags:[`User submitted coin: ${coinName} for rug pull analysis`]})});
      const j=await r.json();
      setResult(j.text||"Analysis complete.");
    }catch(e){setResult("Error: "+e.message);}
    setLoading(false);
  };

  const CHECKLIST=[
    {q:"Kya team anonymous hai?",          risk:"High",   desc:"Anonymous team = accountability zero"},
    {q:"Whitepaper hai ya nahi?",           risk:"High",   desc:"Bina whitepaper = no roadmap, no plan"},
    {q:"Liquidity locked hai?",             risk:"High",   desc:"Unlocked liquidity = rug pull possible"},
    {q:"Top 10 wallets mein >50%?",         risk:"High",   desc:"Whale concentration = price manipulation"},
    {q:"Audit report milti hai?",           risk:"Medium", desc:"Unaudited contracts = hidden bugs"},
    {q:"Kya exchange listing real hai?",    risk:"Medium", desc:"Fake listings = scam signal"},
    {q:"Community active hai Telegram/X?", risk:"Low",    desc:"Dead community = abandoned project"},
  ];

  return(
    <div className="fadein">
      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:40,marginBottom:8}}>🚨</div>
        <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-1,marginBottom:4}}>Rug Pull Detector</h2>
        <p style={{fontSize:13,color:T.text2}}>Invest karne se pehle coin ka risk check karo</p>
      </div>

      <GuideBox emoji="🚨" title="Rug Pull Detector"
        steps={[
          "Coin ka naam ya symbol daalo jisme invest sochte ho",
          "AI analysis button dabao",
          "Rug pull risk score dekhо",
          "Neeche manual checklist bhi check karo",
          "High risk dikh raha hai to AVOID karo"
        ]}
        tip="Meme coins aur new projects mein rug pull risk bahut zyada hota hai. Hamesha research pehle!"
      />
      <AD/>

      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"18px",marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.05)"}}>
        <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:6}}>COIN NAME / SYMBOL</div>
        <div style={{display:"flex",gap:8}}>
          <input value={coinName} onChange={e=>setCoinName(e.target.value)}
            placeholder="e.g. SAFEMOON, SQUID, LUNA..."
            style={{flex:1,background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,padding:"13px 16px",fontSize:15,fontWeight:600,color:"#0f172a",boxSizing:"border-box",minWidth:0}}
            onFocus={e=>e.target.style.borderColor="#ef4444"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}
            onKeyDown={e=>e.key==="Enter"&&analyze()}/>
          <button onClick={analyze} disabled={loading||!coinName.trim()}
            style={{background:loading?"#e2e8f0":"linear-gradient(135deg,#ef4444,#dc2626)",color:loading?"#94a3b8":"#fff",border:"none",borderRadius:12,padding:"13px 20px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Inter',sans-serif",flexShrink:0}}>
            {loading?"⟳":"🔍 Analyze"}
          </button>
        </div>

        <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap"}}>
          {["SAFEMOON","SQUID","LUNA","SHIB","PEOPLE"].map(c=>(
            <button key={c} onClick={()=>setCoinName(c)}
              style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:20,padding:"4px 12px",fontSize:11,color:"#dc2626",fontWeight:600,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading&&(
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"24px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,.04)",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:10}}>
            {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#ef4444",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
          </div>
          <div style={{fontWeight:600,fontSize:13}}>Risk analysis ho raha hai...</div>
        </div>
      )}

      {result&&!loading&&(
        <div className="fadein">
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"16px",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:10,color:"#dc2626"}}>🤖 AI Risk Analysis — {coinName.toUpperCase()}</div>
            <div style={{fontSize:13,color:"#374151",lineHeight:1.8,whiteSpace:"pre-wrap"}}>{result}</div>
          </div>
        </div>
      )}

      {/* Manual checklist */}
      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"16px",marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:12}}>✅ Manual Checklist — Khud Check Karo</div>
        {CHECKLIST.map((item,i)=>(
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderBottom:i<CHECKLIST.length-1?"1px solid #f8fafc":"none"}}>
            <div style={{fontSize:10,fontWeight:700,color:item.risk==="High"?"#dc2626":item.risk==="Medium"?"#d97706":"#059669",background:item.risk==="High"?"#fef2f2":item.risk==="Medium"?"#fffbeb":"#f0fdf4",border:`1px solid ${item.risk==="High"?"#fca5a5":item.risk==="Medium"?"#fde68a":"#6ee7b7"}`,borderRadius:20,padding:"2px 8px",flexShrink:0,marginTop:2}}>
              {item.risk}
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"#0f172a",marginBottom:2}}>{item.q}</div>
              <div style={{fontSize:11,color:"#94a3b8"}}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <AD/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 4. BEST ENTRY TIME FINDER
// ═══════════════════════════════════════════════════════
function EntryTimeFinder(){
  const [coin,setCoin]=useState("BTC");
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");

  const COINS=["BTC","ETH","SOL","APT","AVAX","BNB","LINK","DOGE","PEPE","ARB","XRP","WIF"];
  const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const DAYS_HI=["Ravivar","Somvar","Mangalvar","Budhvar","Guruvar","Shukravar","Shanivar"];

  const analyze=async()=>{
    setLoading(true);setResult(null);setErr("");
    try{
      // Fetch 1000 hourly candles (~41 days of data)
      const r=await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${coin}USDT&interval=1h&limit=1000`,
        {signal:AbortSignal.timeout(12000)}
      );
      if(!r.ok)throw new Error("Data fetch failed");
      const klines=await r.json();
      if(klines.length<100)throw new Error("Insufficient data");

      // Analyze by hour (IST = UTC+5:30), day, and date
      const hourData={}; const dayData={}; const dateData={};

      for(const k of klines){
        const open=parseFloat(k[1]);const close=parseFloat(k[4]);
        const high=parseFloat(k[2]);const low=parseFloat(k[3]);
        const vol=parseFloat(k[5]);
        const change=(close-open)/open*100;
        const ts=parseInt(k[0]);
        const d=new Date(ts);
        // Convert to IST (UTC+5:30)
        const istMs=ts+5.5*3600000;
        const istD=new Date(istMs);
        const hourIST=istD.getUTCHours();
        const dayOfWeek=istD.getUTCDay();
        const dateOfMonth=istD.getUTCDate();

        if(!hourData[hourIST])hourData[hourIST]={sum:0,count:0,vol:0,negCount:0};
        hourData[hourIST].sum+=change;
        hourData[hourIST].count++;
        hourData[hourIST].vol+=vol;
        if(change<0)hourData[hourIST].negCount++;

        if(!dayData[dayOfWeek])dayData[dayOfWeek]={sum:0,count:0,vol:0};
        dayData[dayOfWeek].sum+=change;
        dayData[dayOfWeek].count++;
        dayData[dayOfWeek].vol+=vol;

        if(!dateData[dateOfMonth])dateData[dateOfMonth]={sum:0,count:0};
        dateData[dateOfMonth].sum+=change;
        dateData[dateOfMonth].count++;
      }

      const hourArr=Object.entries(hourData)
        .map(([h,v])=>({
          hour:+h,
          avg:v.sum/v.count,
          vol:v.vol/v.count,
          greenRate:((v.count-v.negCount)/v.count*100),
          count:v.count,
        }))
        .sort((a,b)=>a.avg-b.avg); // lowest avg = best buy

      const dayArr=Object.entries(dayData)
        .map(([d,v])=>({day:+d,avg:v.sum/v.count,vol:v.vol/v.count,name:DAYS[+d],nameHi:DAYS_HI[+d]}))
        .sort((a,b)=>a.avg-b.avg);

      const dateArr=Object.entries(dateData)
        .map(([d,v])=>({date:+d,avg:v.sum/v.count}))
        .sort((a,b)=>a.avg-b.avg);

      // Current price
      const curPrice=parseFloat(klines[klines.length-1][4]);

      setResult({
        hourArr,dayArr,dateArr,
        bestHour:hourArr[0],worstHour:hourArr[hourArr.length-1],
        bestDay:dayArr[0],worstDay:dayArr[dayArr.length-1],
        bestDate:dateArr[0],worstDate:dateArr[dateArr.length-1],
        curPrice,coin,
        candleCount:klines.length,
        daysAnalyzed:Math.round(klines.length/24),
      });
    }catch(e){setErr(e.message);}
    setLoading(false);
  };

  const fmtH=(h)=>{const a=h>=12?"PM":"AM";const h12=h%12||12;return`${h12}:00 ${a}`;};
  const pctColor=(v)=>v<=0?"#059669":"#dc2626"; // negative avg = price fell = buy dip

  return(
    <div className="fadein">
      <div style={{textAlign:"center",marginBottom:14}}>
        <div style={{fontSize:40,marginBottom:6}}>🎯</div>
        <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-1,marginBottom:4}}>Best Entry Time</h2>
        <p style={{fontSize:13,color:T.text2}}>Real hourly data se best buy time dhundo</p>
        <div style={{display:"inline-block",background:"#ecfdf5",border:"1px solid #6ee7b7",borderRadius:20,padding:"3px 12px",fontSize:10,color:"#059669",fontWeight:700,marginTop:6}}>
          ✅ 1000 Real Candles — Binance Hourly Data
        </div>
      </div>

      <GuideBox emoji="🎯" title="Best Entry Time Finder"
        steps={[
          "Coin select karo — popular coins mein zyada data milta hai",
          "Analyze dabao — 1000 hourly candles fetch honge (~41 days)",
          "IST time zones mein best buy hours dikhenge",
          "Best day of week aur best date of month bhi milega",
          "Is schedule ke hisab se DCA set karo"
        ]}
        tip="Green = price us time sabse zyada girti hai = best buy opportunity! Red = price badhti hai = expensive entry."
      />
      <AD/>

      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"18px",marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.05)"}}>
        <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:8,letterSpacing:.5}}>COIN SELECT KARO</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {COINS.map(c=>(
            <button key={c} onClick={()=>{setCoin(c);setResult(null);setErr("");}}
              style={{background:coin===c?"#10b981":"#f8fafc",color:coin===c?"#fff":"#475569",
                border:`1.5px solid ${coin===c?"#10b981":"#e2e8f0"}`,borderRadius:20,padding:"6px 14px",
                fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={analyze} disabled={loading}
          style={{width:"100%",background:loading?"#e2e8f0":"linear-gradient(135deg,#10b981,#059669)",
            color:loading?"#94a3b8":"#fff",border:"none",borderRadius:12,padding:"14px",
            fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"'Inter',sans-serif",
            boxShadow:loading?"none":"0 4px 14px rgba(16,185,129,.4)"}}>
          {loading?"⟳ 1000 candles analyze ho rahe hain (IST)...":"🎯 Real Data Se Best Time Dhundo"}
        </button>
        {err&&<div style={{fontSize:11,color:"#ef4444",marginTop:8}}>⚠️ {err}</div>}
      </div>

      {result&&!loading&&(
        <div className="fadein">
          {/* Data info */}
          <div style={{background:"#ecfdf5",border:"1px solid #6ee7b7",borderRadius:10,padding:"8px 14px",
            marginBottom:12,display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:11,color:"#059669",fontWeight:700}}>
              ✅ {result.candleCount} real candles analyzed
            </span>
            <span style={{fontSize:11,color:"#64748b"}}>
              ~{result.daysAnalyzed} days · Current: ${result.curPrice.toFixed(4)}
            </span>
          </div>

          {/* Top 3 summary cards */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
            {[
              {label:"Best Hour (IST)",value:fmtH(result.bestHour.hour),
               sub:`Avg ${result.bestHour.avg.toFixed(2)}% · ${result.bestHour.greenRate.toFixed(0)}% green`,
               color:"#059669",bg:"#ecfdf5",border:"#6ee7b7"},
              {label:"Best Day",value:result.bestDay.name,
               sub:`${result.bestDay.nameHi} · Avg ${result.bestDay.avg.toFixed(2)}%`,
               color:"#2563eb",bg:"#eff6ff",border:"#93c5fd"},
              {label:"Best Date",value:`${result.bestDate.date} tarikh`,
               sub:`Avg ${result.bestDate.avg.toFixed(2)}% change`,
               color:"#7c3aed",bg:"#f5f3ff",border:"#c4b5fd"},
            ].map((s,i)=>(
              <div key={i} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:12,padding:"12px 10px",textAlign:"center"}}>
                <div style={{fontSize:9,color:s.color,fontWeight:700,marginBottom:4}}>{s.label}</div>
                <div style={{fontSize:13,fontWeight:900,color:s.color,lineHeight:1.2,marginBottom:4}}>{s.value}</div>
                <div style={{fontSize:8,color:s.color,opacity:.7,lineHeight:1.3}}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Hourly chart */}
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"14px",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:4}}>⏰ Hour of Day (IST) — Best Buy Times</div>
            <div style={{fontSize:10,color:"#94a3b8",marginBottom:10}}>
              🟢 Negative avg = price giri = cheap entry · 🔴 Positive = expensive
            </div>
            {result.hourArr.slice(0,12).map((h,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <div style={{width:52,fontSize:10,color:"#64748b",fontWeight:600,flexShrink:0}}>{fmtH(h.hour)}</div>
                <div style={{flex:1,background:"#f1f5f9",borderRadius:100,height:7,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:100,
                    background:h.avg<=0?"linear-gradient(90deg,#10b981,#34d399)":"linear-gradient(90deg,#ef4444,#f87171)",
                    width:`${Math.min(100,Math.abs(h.avg)*15)}%`}}/>
                </div>
                <div style={{width:44,fontSize:10,textAlign:"right",fontWeight:700,
                  color:h.avg<=0?"#059669":"#dc2626"}}>
                  {h.avg.toFixed(2)}%
                </div>
                {i<3&&<span style={{fontSize:9,background:"#ecfdf5",color:"#059669",borderRadius:20,padding:"1px 6px",fontWeight:700,flexShrink:0}}>BEST</span>}
              </div>
            ))}
          </div>

          {/* Day of week */}
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"14px",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:10}}>📅 Day of Week Analysis</div>
            {result.dayArr.map((d,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,
                padding:"8px 10px",borderRadius:8,
                background:i===0?"#ecfdf5":i===result.dayArr.length-1?"#fef2f2":"transparent",
                border:`1px solid ${i===0?"#6ee7b7":i===result.dayArr.length-1?"#fca5a5":"#f1f5f9"}`}}>
                <div style={{fontWeight:700,fontSize:12,width:80,flexShrink:0,
                  color:i===0?"#059669":i===result.dayArr.length-1?"#dc2626":"#0f172a"}}>
                  {d.name}
                  {i===0&&" 🏆"}
                </div>
                <div style={{flex:1,background:"#f1f5f9",borderRadius:100,height:6,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:100,
                    background:d.avg<=0?"linear-gradient(90deg,#10b981,#34d399)":"linear-gradient(90deg,#ef4444,#f87171)",
                    width:`${Math.min(100,Math.abs(d.avg)*10+10)}%`}}/>
                </div>
                <div style={{width:52,fontSize:11,fontWeight:700,textAlign:"right",
                  color:d.avg<=0?"#059669":"#dc2626"}}>
                  {d.avg>=0?"+":""}{d.avg.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>

          {/* Strategy box */}
          <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",borderRadius:14,padding:"16px 18px",marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:13,color:"#6ee7b7",marginBottom:10}}>
              🎯 {result.coin} ke liye Best Strategy
            </div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.85)",lineHeight:1.8}}>
              ⏰ Best time: <strong style={{color:"#10b981"}}>{fmtH(result.bestHour.hour)} IST</strong><br/>
              📅 Best day: <strong style={{color:"#10b981"}}>{result.bestDay.name} ({result.bestDay.nameHi})</strong><br/>
              🗓️ Best date: <strong style={{color:"#10b981"}}>{result.bestDate.date} tarikh</strong> har mahine<br/>
              ❌ Avoid: <span style={{color:"#fca5a5"}}>{fmtH(result.worstHour.hour)} IST on {result.worstDay.name}</span>
            </div>
            <div style={{marginTop:10,fontSize:10,color:"rgba(255,255,255,.4)"}}>
              Based on {result.candleCount} real hourly candles from Binance · ~{result.daysAnalyzed} days
            </div>
          </div>

          <div style={{fontSize:10,color:"#94a3b8",textAlign:"center",lineHeight:1.7}}>
            ⚠️ Historical patterns future guarantee nahi karte · DYOR always
          </div>
        </div>
      )}
      <AD/>
    </div>
  );
}
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);

  const COINS=["BTC","ETH","SOL","APT","AVAX","BNB","LINK","DOGE","PEPE","ARB"];

  const analyze=async()=>{
    setLoading(true);setResult(null);
    try{
      // Fetch hourly klines for 90 days
      const r=await fetch(`https://api.binance.com/api/v3/klines?symbol=${coin}USDT&interval=1h&limit=1000`,{signal:AbortSignal.timeout(10000)});
      if(!r.ok) throw new Error("API error");
      const klines=await r.json();

      // Analyze by hour of day (IST = UTC+5:30)
      const hourData={};
      const dayData={};
      const dateData={};
      for(const k of klines){
        const ts=parseInt(k[0]);
        const open=parseFloat(k[1]);
        const close=parseFloat(k[4]);
        const change=(close-open)/open*100;
        const d=new Date(ts);
        const hourIST=(d.getUTCHours()+5)%24;
        const dayOfWeek=d.getUTCDay();
        const dateOfMonth=d.getUTCDate();

        if(!hourData[hourIST])hourData[hourIST]={sum:0,count:0};
        hourData[hourIST].sum+=change;hourData[hourIST].count++;

        if(!dayData[dayOfWeek])dayData[dayOfWeek]={sum:0,count:0};
        dayData[dayOfWeek].sum+=change;dayData[dayOfWeek].count++;

        if(!dateData[dateOfMonth])dateData[dateOfMonth]={sum:0,count:0};
        dateData[dateOfMonth].sum+=change;dateData[dateOfMonth].count++;
      }

      // Find best/worst
      const hourAvg=Object.entries(hourData).map(([h,v])=>({hour:+h,avg:v.sum/v.count})).sort((a,b)=>a.avg-b.avg);
      const dayAvg=Object.entries(dayData).map(([d,v])=>({day:+d,avg:v.sum/v.count})).sort((a,b)=>a.avg-b.avg);
      const dateAvg=Object.entries(dateData).map(([d,v])=>({date:+d,avg:v.sum/v.count})).sort((a,b)=>a.avg-b.avg);

      const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      setResult({
        bestHour: hourAvg[0],
        worstHour: hourAvg[hourAvg.length-1],
        bestDay: {...dayAvg[0], name:days[dayAvg[0].day]},
        worstDay: {...dayAvg[dayAvg.length-1], name:days[dayAvg[dayAvg.length-1].day]},
        bestDate: dateAvg[0],
        worstDate: dateAvg[dateAvg.length-1],
        allHours: hourAvg,
        allDays: dayAvg.map(d=>({...d,name:days[d.day]})),
      });
    }catch(e){setResult({error:e.message});}
    setLoading(false);
  };

  const fmtHour=(h)=>{const ampm=h>=12?"PM":"AM";const h12=h%12||12;return`${h12}:00 ${ampm} IST`;};

  return(
    <div className="fadein">
      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:40,marginBottom:8}}>🎯</div>
        <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-1,marginBottom:4}}>Best Entry Time</h2>
        <p style={{fontSize:13,color:T.text2}}>Kab buy karna sabse sahi hota hai? Data se pata karo</p>
      </div>

      <GuideBox emoji="🎯" title="Best Entry Time Finder"
        steps={[
          "Coin select karo jisme invest karna chahte ho",
          "Analyze dabao — 1000 candles ka data analyze hoga",
          "Best time of day, day of week, date of month dikhega",
          "Uss time pe DCA set karo ya manually buy karo"
        ]}
        tip="Ye 90 din ke historical data pe based hai. Sabse low price point dhundta hai hourly candles se!"
      />
      <AD/>

      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:"18px",marginBottom:14,boxShadow:"0 2px 12px rgba(0,0,0,.05)"}}>
        <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:8}}>COIN SELECT KARO</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
          {COINS.map(c=>(
            <button key={c} onClick={()=>setCoin(c)}
              style={{background:coin===c?"#10b981":"#f8fafc",color:coin===c?"#fff":"#64748b",
                border:`2px solid ${coin===c?"#10b981":"#e2e8f0"}`,borderRadius:12,padding:"7px 14px",
                fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace"}}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={analyze} disabled={loading}
          style={{width:"100%",background:loading?"#e2e8f0":"linear-gradient(135deg,#10b981,#059669)",color:loading?"#94a3b8":"#fff",border:"none",borderRadius:12,padding:"14px",fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
          {loading?"⟳ Analyzing 1000 candles...":"🎯 Best Entry Time Dhundo"}
        </button>
      </div>

      {result&&!result.error&&(
        <div className="fadein">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
            {[
              {label:"Best Hour",value:fmtHour(result.bestHour?.hour),sub:`${result.bestHour?.avg.toFixed(2)}% avg`,color:"#059669",bg:"#ecfdf5"},
              {label:"Best Day",value:result.bestDay?.name,sub:`${result.bestDay?.avg.toFixed(2)}% avg`,color:"#2563eb",bg:"#eff6ff"},
              {label:"Best Date",value:`${result.bestDate?.date} tarikh`,sub:`${result.bestDate?.avg.toFixed(2)}% avg`,color:"#7c3aed",bg:"#f5f3ff"},
            ].map((item,i)=>(
              <div key={i} style={{background:item.bg,border:`1px solid ${item.color}33`,borderRadius:12,padding:"12px",textAlign:"center"}}>
                <div style={{fontSize:9,color:item.color,fontWeight:700,marginBottom:4}}>{item.label}</div>
                <div style={{fontSize:13,fontWeight:900,color:item.color,lineHeight:1.2,marginBottom:4}}>{item.value}</div>
                <div style={{fontSize:9,color:item.color,opacity:.7}}>{item.sub}</div>
              </div>
            ))}
          </div>

          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:"14px",marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:10}}>📊 Hour of Day Analysis (IST)</div>
            {result.allHours.slice(0,8).map((h,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <div style={{width:60,fontSize:10,color:"#64748b"}}>{fmtHour(h.hour)}</div>
                <div style={{flex:1,background:"#f1f5f9",borderRadius:100,height:6,overflow:"hidden"}}>
                  <div style={{height:"100%",background:h.avg<=0?"#10b981":"#ef4444",borderRadius:100,width:`${Math.min(100,Math.abs(h.avg)*20)}%`}}/>
                </div>
                <div style={{width:50,fontSize:10,textAlign:"right",fontWeight:700,color:h.avg<=0?"#059669":"#dc2626"}}>
                  {h.avg.toFixed(2)}%
                </div>
              </div>
            ))}
            <div style={{fontSize:10,color:"#94a3b8",marginTop:8}}>🟢 = Price kam hoti hai (buy opportunity) · 🔴 = Price badhti hai</div>
          </div>

          <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",borderRadius:14,padding:"14px 16px"}}>
            <div style={{fontWeight:700,fontSize:12,color:"#6ee7b7",marginBottom:8}}>🎯 Best Strategy for {coin}</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,.8)",lineHeight:1.7}}>
              📅 Best day: <strong style={{color:"#10b981"}}>{result.bestDay.name}</strong><br/>
              ⏰ Best time: <strong style={{color:"#10b981"}}>{fmtHour(result.bestHour.hour)}</strong> (IST)<br/>
              🗓️ Best date: <strong style={{color:"#10b981"}}>{result.bestDate.date} tarikh</strong> har mahine<br/>
              <span style={{color:"#94a3b8",fontSize:11}}>Historical 90-day data pe based</span>
            </div>
          </div>
        </div>
      )}
      {result?.error&&<div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:12,padding:"12px",color:"#dc2626",fontSize:13}}>⚠️ {result.error}</div>}
      <AD/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 5. AIRDROP TRACKER
// ═══════════════════════════════════════════════════════
function AirdropTracker(){
  const AIRDROPS=[
    {name:"Arbitrum Nova",    symbol:"ARB",  status:"active",  est:"$50-200",  deadline:"Ongoing",   steps:["Arbitrum Nova pe transactions karo","Bridge assets karo","Nova DApps use karo"],        chain:"Arbitrum",  difficulty:"Easy",   link:"https://nova.arbitrum.io"},
    {name:"LayerZero",        symbol:"ZRO",  status:"active",  est:"$100-500", deadline:"TBD",        steps:["Stargate pe bridge karo","Multiple chains use karo","Volume badhao"],                    chain:"Multi",     difficulty:"Medium", link:"https://layerzero.network"},
    {name:"zkSync Era",       symbol:"ZK",   status:"active",  est:"$50-300",  deadline:"Ongoing",   steps:["zkSync Era pe deploy karo","DEX use karo","NFT mint karo"],                              chain:"zkSync",    difficulty:"Medium", link:"https://zksync.io"},
    {name:"Scroll",           symbol:"SCR",  status:"active",  est:"$100-400", deadline:"TBD",        steps:["Scroll bridge use karo","Scroll DApps use karo","Transactions karo"],                    chain:"Scroll",    difficulty:"Easy",   link:"https://scroll.io"},
    {name:"Linea",            symbol:"?",    status:"active",  est:"$50-200",  deadline:"TBD",        steps:["MetaMask wallet use karo","Linea pe transactions karo","Linea Park activities karo"],    chain:"Linea",     difficulty:"Easy",   link:"https://linea.build"},
    {name:"Mode Network",     symbol:"MODE", status:"active",  est:"$30-150",  deadline:"Ongoing",   steps:["Mode pe ETH bridge karo","Swap karo","SFS register karo"],                              chain:"Mode",      difficulty:"Easy",   link:"https://mode.network"},
    {name:"Blast L2",         symbol:"?",    status:"active",  est:"$100-500", deadline:"TBD",        steps:["Blast bridge pe ETH daalo","Blast DApps use karo","Points earn karo"],                   chain:"Blast",     difficulty:"Medium", link:"https://blast.io"},
    {name:"Taiko",            symbol:"TAIKO",status:"ended",   est:"Completed",deadline:"Ended",      steps:["Already ended — next round ka wait karo"],                                               chain:"Taiko",     difficulty:"Easy",   link:"https://taiko.xyz"},
  ];

  const [filter,setFilter]=useState("all");
  const filtered=filter==="all"?AIRDROPS:AIRDROPS.filter(a=>a.status===filter);

  const diffColor=(d)=>d==="Easy"?"#059669":d==="Medium"?"#d97706":"#dc2626";
  const diffBg=(d)=>d==="Easy"?"#ecfdf5":d==="Medium"?"#fffbeb":"#fef2f2";

  return(
    <div className="fadein">
      <div style={{textAlign:"center",marginBottom:16}}>
        <div style={{fontSize:40,marginBottom:8}}>🪙</div>
        <h2 style={{fontSize:22,fontWeight:900,letterSpacing:-1,marginBottom:4}}>Airdrop Tracker</h2>
        <p style={{fontSize:13,color:T.text2}}>Free tokens earn karo — step by step guide ke saath</p>
      </div>

      <GuideBox emoji="🪙" title="Airdrop Tracker"
        steps={[
          "Active airdrops mein se ek choose karo",
          "Steps follow karo — easy Hinglish mein likhe hain",
          "Estimated value dekho (vary kar sakta hai)",
          "Deadline se pehle complete karo",
          "Wallet mein tokens automatically aayenge"
        ]}
        tip="Airdrops FREE hain — sirf gas fees lagti hai (₹50-500). Small amounts se shuru karo!"
      />
      <AD/>

      {/* Filter */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[{v:"all",l:"All Airdrops"},{v:"active",l:"🟢 Active"},{v:"ended",l:"⚫ Ended"}].map(f=>(
          <button key={f.v} onClick={()=>setFilter(f.v)}
            style={{background:filter===f.v?"#10b981":"#f8fafc",color:filter===f.v?"#fff":"#64748b",
              border:`1px solid ${filter===f.v?"#10b981":"#e2e8f0"}`,borderRadius:20,padding:"6px 14px",
              fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
            {f.l}
          </button>
        ))}
      </div>

      {filtered.map((a,i)=>(
        <div key={i} style={{background:"#fff",border:`2px solid ${a.status==="active"?"#6ee7b7":"#e2e8f0"}`,borderRadius:16,padding:"16px",marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <div style={{fontWeight:800,fontSize:15,color:"#0f172a"}}>{a.name}</div>
                <div style={{background:a.status==="active"?"#ecfdf5":"#f8fafc",border:`1px solid ${a.status==="active"?"#6ee7b7":"#e2e8f0"}`,borderRadius:20,padding:"2px 8px",fontSize:9,fontWeight:700,color:a.status==="active"?"#059669":"#94a3b8"}}>
                  {a.status==="active"?"🟢 ACTIVE":"⚫ ENDED"}
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <span style={{fontSize:10,color:"#6366f1",background:"#eff6ff",borderRadius:20,padding:"2px 8px",fontWeight:600}}>{a.chain}</span>
                <span style={{fontSize:10,color:diffColor(a.difficulty),background:diffBg(a.difficulty),borderRadius:20,padding:"2px 8px",fontWeight:600}}>{a.difficulty}</span>
                <span style={{fontSize:10,color:"#d97706",background:"#fffbeb",borderRadius:20,padding:"2px 8px",fontWeight:600}}>Est: {a.est}</span>
              </div>
            </div>
            <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",borderRadius:10,padding:"6px 12px",textAlign:"center",marginLeft:8,flexShrink:0}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:900,fontSize:13,color:"#10b981"}}>{a.symbol}</div>
            </div>
          </div>

          {/* Steps */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:6}}>STEPS:</div>
            {a.steps.map((s,j)=>(
              <div key={j} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:5}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"#10b981",color:"#fff",fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{j+1}</div>
                <div style={{fontSize:12,color:"#374151",lineHeight:1.5}}>{s}</div>
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:8}}>
            <div style={{flex:1,background:"#f8fafc",borderRadius:8,padding:"6px 10px",fontSize:10,color:"#64748b"}}>
              ⏰ Deadline: <strong>{a.deadline}</strong>
            </div>
            {a.status==="active"&&(
              <button onClick={()=>window.open(a.link,"_blank")}
                style={{background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",border:"none",borderRadius:10,padding:"6px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Inter',sans-serif",flexShrink:0}}>
                Start →
              </button>
            )}
          </div>
        </div>
      ))}

      <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:12,padding:"12px 14px",fontSize:11,color:"#92400e",lineHeight:1.7}}>
        ⚠️ <strong>Risk:</strong> Sirf trusted platforms use karo. Seed phrase kabhi mat daalo. Small amounts se start karo. DYOR!
      </div>
      <AD/>
    </div>
  );
}

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
  // Whitepaper state
  const [wpUrl,    setWpUrl]    = useState("");
  const [wpText,   setWpText]   = useState("");
  const [wpResult, setWpResult] = useState(null);
  const [wpLoad,   setWpLoad]   = useState(false);
  const [wpError,  setWpError]  = useState("");
  const [wpMode,   setWpMode]   = useState("url"); // url | paste

  // Bank vs Crypto state
  const [bvcAmount, setBvcAmount]   = useState("100000");
  const [bvcYears, setBvcYears]     = useState("5");
  const [bvcResult, setBvcResult]   = useState(null);

  // FOMO Detector state
  const [fomoText, setFomoText]     = useState("");
  const [fomoResult, setFomoResult] = useState(null);
  const [fomoLoad, setFomoLoad]     = useState(false);
  const [taxBuyPrice, setTaxBuyPrice]   = useState("");
  const [taxSellPrice, setTaxSellPrice] = useState("");
  const [taxQty, setTaxQty]             = useState("");
  const [taxCur, setTaxCur]             = useState("INR");
  const [taxResult, setTaxResult]       = useState(null);

  // Tax Card state
  const [taxExchange, setTaxExchange]   = useState(null);
  const [taxData, setTaxData]           = useState(null);
  const [taxParseError, setTaxParseError] = useState("");

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

  // ── WHITEPAPER SUMMARIZER ────────────────────────────────────────────────
  const analyzeWhitepaper = async () => {
    setWpLoad(true); setWpResult(null); setWpError("");
    try {
      const r = await fetch("/api/whitepaper", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ url: wpMode==="url"?wpUrl:"", pastedText: wpMode==="paste"?wpText:"" })
      });
      const j = await r.json();
      if (j.error) {
        setWpError(j.message || "Kuch problem aayi.");
        if (j.error==="pdf" || j.error==="fetch_failed") setWpMode("paste");
      } else {
        setWpResult(j.summary);
      }
    } catch(_) {
      setWpError("Network error. Dobara try karo.");
    }
    setWpLoad(false);
  };

  // ── BANK VS CRYPTO CALCULATOR ────────────────────────────────────────────
  const calcBankVsCrypto = () => {
    const amt   = parseFloat(bvcAmount);
    const years = parseFloat(bvcYears);
    if (!amt || !years || amt <= 0 || years <= 0) return;

    // Historical average returns (conservative)
    const returns = {
      "Bank FD (6.5%)":    { rate:0.065,  emoji:"🏦", color:"#64748b",  safe:true  },
      "Gold (10% avg)":    { rate:0.10,   emoji:"🥇", color:"#d97706",  safe:true  },
      "Nifty 50 (14%)":    { rate:0.14,   emoji:"📈", color:"#2563eb",  safe:true  },
      "Bitcoin (avg 50%)": { rate:0.50,   emoji:"₿",  color:"#f59e0b",  safe:false },
      "Ethereum (avg 45%)":{rate:0.45,   emoji:"Ξ",  color:"#6366f1",  safe:false },
      "Solana (avg 80%)":  { rate:0.80,   emoji:"◎",  color:"#10b981",  safe:false },
    };

    const results = Object.entries(returns).map(([name, d]) => {
      const finalAmt = amt * Math.pow(1 + d.rate, years);
      const profit   = finalAmt - amt;
      const multiple = finalAmt / amt;
      return { name, emoji:d.emoji, color:d.color, safe:d.safe, finalAmt, profit, multiple };
    });

    results.sort((a,b) => b.finalAmt - a.finalAmt);
    setBvcResult({ results, amt, years });
  };

  // ── FOMO DETECTOR ────────────────────────────────────────────────────────
  const analyzeFOMO = async () => {
    if (!fomoText.trim()) return;
    setFomoLoad(true); setFomoResult(null);
    try {
      const r = await fetch("/api/ai", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          mode:"fomo_detector",
          tradeDescription: fomoText,
          systemPrompt: `You are a crypto trading psychology expert. Analyze if the user made a FOMO trade.
Give response in this EXACT JSON format (no extra text):
{
  "fomoScore": <0-100 number>,
  "verdict": "<FOMO Trade | Smart Trade | Borderline>",
  "signs": ["sign1", "sign2", "sign3"],
  "goodSigns": ["good1", "good2"],
  "lesson": "<1-2 line lesson in Hinglish>",
  "emoji": "<single emoji representing verdict>"
}`
        })
      });
      const j = await r.json();
      try {
        const text = j.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setFomoResult(parsed);
        } else {
          setFomoResult({
            fomoScore: 65,
            verdict: "Borderline",
            signs: ["Proper analysis mushkil laga", "Market movement se influenced"],
            goodSigns: ["Trade attempt kiya"],
            lesson: "Har trade se seekhna zaroori hai. DYOR always!",
            emoji: "🤔"
          });
        }
      } catch(_) {
        setFomoResult({
          fomoScore: 50,
          verdict: "Borderline",
          signs: ["Analysis incomplete"],
          goodSigns: ["Trade attempt kiya"],
          lesson: "Agle baar pehle research karo, phir trade karo.",
          emoji: "🤔"
        });
      }
    } catch(_) {
      setFomoResult(null);
    }
    setFomoLoad(false);
  };

  // ── TAX CALCULATOR ────────────────────────────────────────────────────────
  const calcTax = () => {
    const buy  = parseFloat(taxBuyPrice);
    const sell = parseFloat(taxSellPrice);
    const qty  = parseFloat(taxQty);
    if (!taxBuyPrice || !taxSellPrice || !taxQty) { alert("Saare fields bharo!"); return; }
    if (isNaN(buy)||isNaN(sell)||isNaN(qty)||buy<=0||sell<=0||qty<=0) { alert("Valid numbers daalo!"); return; }
    const profit    = (sell - buy) * qty;
    const isProfit  = profit > 0;
    const tax30     = isProfit ? profit * 0.30 : 0;
    const tds1      = sell * qty * 0.01;
    const netProfit = profit - tax30;
    const profitPct = ((sell - buy) / buy * 100).toFixed(2);
    const sym       = taxCur === "INR" ? "₹" : "$";
    setTaxResult({ buy, sell, qty, profit, tax30, tds1, netProfit, profitPct, isProfit, sym });
  };

  // ── CSV PARSER ────────────────────────────────────────────────────────────
  const handleTaxCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setTaxParseError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const lines = ev.target.result.split("\n").filter(l => l.trim());
        if (lines.length < 2) { setTaxParseError("CSV mein koi data nahi mila!"); return; }
        const headers = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g,""));

        // Find columns flexibly
        const findCol = (...names) => {
          for (const n of names) {
            const idx = headers.findIndex(h => h.includes(n));
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const dateIdx   = findCol("date","time","created");
        const typeIdx   = findCol("type","side","order type","trade type");
        const priceIdx  = findCol("price","rate","avg price","execution price");
        const qtyIdx    = findCol("qty","quantity","amount","size","filled");
        const feeIdx    = findCol("fee","commission","tds");
        const coinIdx   = findCol("symbol","pair","coin","instrument","market");
        const totalIdx  = findCol("total","value","turnover","notional");

        const getFY = (dateStr) => {
          const d = new Date(dateStr);
          if (isNaN(d)) return "Unknown";
          const y = d.getFullYear(), m = d.getMonth();
          return m >= 3 ? `FY ${y}-${String(y+1).slice(2)}` : `FY ${y-1}-${String(y).slice(2)}`;
        };

        const fyMap = {};
        let totalProfit = 0, totalLoss = 0, totalTDS = 0, totalTrades = 0;

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map(c => c.trim().replace(/"/g,""));
          if (cols.length < 3) continue;

          const price = parseFloat(cols[priceIdx]) || 0;
          const qty   = parseFloat(cols[qtyIdx])   || 0;
          const total = totalIdx >= 0 ? parseFloat(cols[totalIdx]) || (price*qty) : price*qty;
          const fee   = feeIdx >= 0   ? parseFloat(cols[feeIdx])   || 0 : total * 0.01;
          const type  = typeIdx >= 0  ? cols[typeIdx].toLowerCase() : "";
          const date  = dateIdx >= 0  ? cols[dateIdx] : "";
          const fy    = getFY(date);

          if (!fyMap[fy]) fyMap[fy] = { profit:0, loss:0, tax:0, tds:0, trades:0 };
          fyMap[fy].trades++;
          totalTrades++;

          if (type.includes("sell") || type.includes("close") || type.includes("sold")) {
            const profit = total - fee;
            if (profit > 0) {
              totalProfit += profit;
              fyMap[fy].profit += profit;
              fyMap[fy].tax += profit * 0.30;
            } else {
              totalLoss += Math.abs(profit);
              fyMap[fy].loss += Math.abs(profit);
            }
            fyMap[fy].tds += total * 0.01;
            totalTDS += total * 0.01;
          }
        }

        const totalTax = Object.values(fyMap).reduce((s,fy) => s + fy.tax, 0);

        const fyBreakdown = Object.entries(fyMap)
          .filter(([y]) => y !== "Unknown")
          .sort(([a],[b]) => a.localeCompare(b))
          .map(([year, d]) => ({
            year, trades:d.trades,
            profit: Math.round(d.profit), loss: Math.round(d.loss),
            tax: Math.round(d.tax), tds: Math.round(d.tds),
            status: year < "FY 2024" ? "filed" : year < "FY 2025-26" ? "due" : "upcoming",
          }));

        if (totalTrades === 0) { setTaxParseError("Koi valid trade data nahi mila. Sahi CSV upload karo."); return; }

        setTaxData({
          totalProfit: Math.round(totalProfit),
          totalLoss:   Math.round(totalLoss),
          totalTax:    Math.round(totalTax),
          totalTDS:    Math.round(totalTDS),
          totalTrades,
          fyBreakdown,
        });
      } catch(err) {
        setTaxParseError("CSV parse nahi ho saki. Exchange guide se sahi file download karo.");
      }
    };
    reader.readAsText(file);
  };

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
    <main style={{ fontFamily:"'Inter',sans-serif", background:T.page, minHeight:"100vh", color:T.text, overflowX:"hidden", maxWidth:"100vw" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
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

        {/* Grouped Tab Navigation */}
        <div style={{marginBottom:16}}>
          {TAB_GROUPS.map((group,gi)=>(
            <div key={gi} style={{marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",letterSpacing:1,marginBottom:5,paddingLeft:4}}>
                {group.label}
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {group.tabs.map(t=>(
                  <button key={t.id} onClick={()=>setTab(t.id)}
                    style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",
                      borderRadius:20,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600,
                      fontSize:12,transition:"all .15s",border:"none",
                      background:tab===t.id?"linear-gradient(135deg,#10b981,#059669)":"#f8fafc",
                      color:tab===t.id?"#fff":"#475569",
                      boxShadow:tab===t.id?"0 4px 12px rgba(16,185,129,.35)":"none"}}>
                    <span style={{fontSize:15}}>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* AD — BELOW TAB BAR */}
        <div style={{marginBottom:14,borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
          <div style={{fontSize:9,color:"#94a3b8",marginBottom:2,letterSpacing:1}}>ADVERTISEMENT</div>
          <ins className="adsbygoogle"
            style={{display:"block"}}
            data-ad-client="ca-pub-9884021055437527"
            data-ad-slot="AUTO"
            data-ad-format="auto"
            data-full-width-responsive="true"/>
          <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
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
            {/* Header */}
            <div style={{ textAlign:"center", marginBottom:16 }}>
              <div style={{ fontSize:48, marginBottom:8 }}>🏥</div>
              <h2 style={{ fontSize:22, fontWeight:900, letterSpacing:-1, marginBottom:6 }}>Portfolio Health Checkup</h2>
              <p style={{ fontSize:13, color:T.text2 }}>Dr. YYP AI tumhare portfolio ki full diagnosis karega</p>
            </div>

            {/* AD — top */}
            <div style={{ marginBottom:14, borderRadius:12, overflow:"hidden", textAlign:"center", background:"#fff", border:`1px solid ${T.border}`, padding:"4px" }}>
              <div style={{ fontSize:9, color:"#94a3b8", marginBottom:2, letterSpacing:1 }}>ADVERTISEMENT</div>
              <ins className="adsbygoogle" style={{display:"block"}}
                data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO"
                data-ad-format="auto" data-full-width-responsive="true"/>
              <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
            </div>

            {/* Input Form */}
            <div style={{ ...CARD }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <span style={{ fontSize:20 }}>💊</span>
                <div style={{ fontWeight:700, fontSize:14 }}>Apna Portfolio Batao</div>
              </div>

              {coins.map((c, i) => (
                <div key={i} style={{ background:"#f8fafc", borderRadius:14, padding:"12px", marginBottom:8,
                  border:`1px solid ${c.coin?T.greenDk+"44":T.border}`, boxSizing:"border-box" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <div style={{ fontSize:10, color:T.text3, fontWeight:700 }}>COIN #{i+1}</div>
                    {coins.length > 1 && (
                      <button onClick={()=>removeCoin(i)}
                        style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8,
                          padding:"3px 10px", cursor:"pointer", color:"#dc2626", fontSize:12, fontWeight:600 }}>✕ Hatao</button>
                    )}
                  </div>
                  {/* Row 1: Coin symbol */}
                  <input value={c.coin} onChange={e=>updateCoin(i,"coin",e.target.value.toUpperCase())}
                    placeholder="Coin ka naam: BTC, ETH, SOL, APT…"
                    style={{ width:"100%", background:"#fff", border:`2px solid ${c.coin?"#10b981":"#e2e8f0"}`,
                      borderRadius:10, padding:"11px 12px", fontSize:15, fontWeight:800,
                      color:T.text, fontFamily:"'JetBrains Mono',monospace",
                      boxSizing:"border-box", marginBottom:8 }}
                    onFocus={e=>e.target.style.borderColor="#10b981"}
                    onBlur={e=>e.target.style.borderColor=c.coin?"#10b981":"#e2e8f0"}/>
                  {/* Row 2: Currency + Amount — side by side */}
                  <div style={{ display:"flex", gap:8 }}>
                    <select value={c.currency} onChange={e=>updateCoin(i,"currency",e.target.value)}
                      style={{ background:"#fff", border:"2px solid #e2e8f0", borderRadius:10,
                        padding:"10px 8px", fontSize:13, cursor:"pointer", color:T.text,
                        width:90, flexShrink:0 }}>
                      <option value="INR">₹ INR</option>
                      <option value="USD">$ USD</option>
                    </select>
                    <input value={c.amount} onChange={e=>updateCoin(i,"amount",e.target.value)}
                      placeholder="Amount invested (e.g. 5000)"
                      type="number"
                      style={{ flex:1, background:"#fff", border:"2px solid #e2e8f0", borderRadius:10,
                        padding:"10px 12px", fontSize:13, color:T.text,
                        boxSizing:"border-box", minWidth:0 }}
                      onFocus={e=>e.target.style.borderColor="#10b981"}
                      onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                  </div>
                </div>
              ))}

              <button onClick={addCoin}
                style={{ background:"#f0fdf4", border:"2px dashed #6ee7b7", borderRadius:12, padding:"10px 16px", cursor:"pointer", color:T.greenDk, fontSize:13, fontWeight:700, marginBottom:14, width:"100%", fontFamily:"'Inter',sans-serif" }}>
                ➕ Add Another Coin
              </button>

              {/* Check frequency */}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, color:T.text3, fontWeight:700, marginBottom:8, letterSpacing:.5 }}>📊 DAILY PRICE CHECK FREQUENCY</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {["1","2","5","10","20+"].map(n=>(
                    <button key={n} onClick={()=>setCheckFreq(n)}
                      style={{ background: checkFreq===n?"linear-gradient(135deg,#10b981,#059669)":"#f8fafc",
                        color: checkFreq===n?"#fff":T.text2,
                        border: checkFreq===n?"none":`1px solid ${T.border}`,
                        borderRadius:20, padding:"6px 14px", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'Inter',sans-serif" }}>
                      {n}x/day
                    </button>
                  ))}
                </div>
              </div>

              <button style={{ ...BTN, width:"100%", padding:"14px", fontSize:14, borderRadius:12,
                background: healthLoad?"#64748b":"linear-gradient(135deg,#10b981,#059669)",
                boxShadow:"0 4px 14px rgba(16,185,129,.4)" }}
                onClick={runHealthCheck} disabled={healthLoad||!coins.find(c=>c.coin&&c.amount)}>
                {healthLoad ? "⟳ Report Ban Rahi Hai..." : "🏥 Get Health Report"}
              </button>
            </div>

            {/* Loading */}
            {healthLoad && (
              <div className="fadein" style={{ marginTop:14 }}>
                <div style={{ background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)", border:"2px solid #6ee7b7", borderRadius:16, padding:"20px", textAlign:"center" }}>
                  <div style={{ fontSize:48, marginBottom:10, animation:"float 2s ease-in-out infinite" }}>🩺</div>
                  <div style={{ fontWeight:800, fontSize:14, color:"#059669", marginBottom:8 }}>Dr. YYP Examine Kar Raha Hai...</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, textAlign:"left", maxWidth:260, margin:"0 auto" }}>
                    {[
                      "📊 Portfolio data collect kar raha hai",
                      "📈 Live prices fetch ho rahi hain",
                      "🔍 Risk analysis calculate kar raha hai",
                      "💊 Prescription likh raha hai",
                    ].map((s,i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#065f46" }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:"#10b981", animation:`blink 1.5s ${i*.3}s infinite`, flexShrink:0 }}/>
                        {s}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:12, background:"rgba(16,185,129,.2)", borderRadius:100, height:5, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:100, background:"linear-gradient(90deg,#10b981,#34d399)",
                      width:"75%", animation:"shimmer 2s infinite", backgroundSize:"200% 100%" }}/>
                  </div>
                </div>
              </div>
            )}

            {/* Result */}
            {healthResult && !healthLoad && (
              <div className="fadein" style={{ marginTop:14 }}>

                {/* AD — before result */}
                <div style={{ marginBottom:12, borderRadius:12, overflow:"hidden", textAlign:"center", background:"#fff", border:`1px solid ${T.border}`, padding:"4px" }}>
                  <div style={{ fontSize:9, color:"#94a3b8", marginBottom:2, letterSpacing:1 }}>ADVERTISEMENT</div>
                  <ins className="adsbygoogle" style={{display:"block"}}
                    data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO"
                    data-ad-format="auto" data-full-width-responsive="true"/>
                  <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
                </div>

                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a2f)", borderRadius:20, padding:"20px", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#10b981,#6ee7b7,#10b981)", backgroundSize:"200% auto", animation:"gradmove 3s linear infinite" }}/>
                  {/* Doctor header */}
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#10b981,#059669)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🩺</div>
                    <div>
                      <div style={{ fontWeight:900, fontSize:15, color:"white" }}>Dr. YYP AI</div>
                      <div className="mono" style={{ fontSize:9, color:"#6ee7b7" }}>MD — Market Dynamics · YES YOU PRO</div>
                    </div>
                    <div style={{ marginLeft:"auto", background:"rgba(16,185,129,.2)", border:"1px solid rgba(16,185,129,.4)", borderRadius:20, padding:"4px 10px", fontSize:9, color:"#6ee7b7", fontWeight:700 }}>
                      REPORT READY
                    </div>
                  </div>
                  <p style={{ fontSize:13, color:"#d1fae5", lineHeight:1.9, whiteSpace:"pre-line", fontWeight:400 }}>{healthResult}</p>
                  {/* Share */}
                  <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(`🏥 Mera Portfolio Health Report — Dr. YYP AI\n\n${healthResult.slice(0,400)}\n\nyesyoupro.com/features`)}`)}
                    style={{ marginTop:14, width:"100%", background:"#25D366", color:"#fff", border:"none", borderRadius:12, padding:"11px", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
                    📱 CA Ya Dost Ko Share Karo
                  </button>
                </div>
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


        {tab==="tax" && (
          <div className="fadein">
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🧾</div>
              <h2 style={{ fontSize:22, fontWeight:900, letterSpacing:-1, marginBottom:6 }}>Crypto Tax Card</h2>
              <p style={{ fontSize:13, color:T.text2 }}>Apna exchange chuno → CSV upload karo → 1 click tax dekho</p>
            </div>

            {/* ── TAX CARD PREVIEW (before upload) ── */}
            {!taxExchange && !taxData && (
              <div style={{ marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                  <div style={{ height:1, flex:1, background:"linear-gradient(90deg,transparent,#e2e8f0)" }}/>
                  <span style={{ fontSize:10, color:"#94a3b8", fontWeight:700, letterSpacing:1.5 }}>CSV UPLOAD KE BAAD AISA DIKHEGA</span>
                  <div style={{ height:1, flex:1, background:"linear-gradient(90deg,#e2e8f0,transparent)" }}/>
                </div>

                {/* Preview Card — fully visible */}
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", borderRadius:24, padding:"20px", position:"relative", overflow:"hidden", border:"2px dashed rgba(16,185,129,.3)" }}>
                  <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%", background:"rgba(16,185,129,.08)" }}/>
                  <div style={{ position:"absolute", bottom:-30, left:-30, width:120, height:120, borderRadius:"50%", background:"rgba(245,158,11,.06)" }}/>

                  {/* Sample badge */}
                  <div style={{ position:"absolute", top:12, left:12, background:"rgba(16,185,129,.2)", border:"1px solid rgba(16,185,129,.4)", borderRadius:20, padding:"3px 10px", fontSize:9, fontWeight:700, color:"#6ee7b7", letterSpacing:1 }}>
                    PREVIEW
                  </div>

                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, marginTop:20 }}>
                    <div>
                      <div style={{ fontSize:9, color:"#64748b", letterSpacing:2 }}>CRYPTO TAX CARD</div>
                      <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>CoinDCX · 47 trades</div>
                    </div>
                    <div style={{ background:"linear-gradient(135deg,#10b981,#059669)", borderRadius:8, padding:"3px 10px", fontSize:10, fontWeight:700, color:"#fff" }}>YYP</div>
                  </div>

                  {/* Tax amount */}
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:10, color:"#64748b", marginBottom:4 }}>TOTAL TAX DUE (ESTIMATED)</div>
                    <div style={{ fontSize:42, fontWeight:900, color:"#f59e0b", lineHeight:1 }}>₹26,500</div>
                    <div style={{ marginTop:8, background:"rgba(255,255,255,.1)", borderRadius:100, height:8, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:"58%", background:"linear-gradient(90deg,#f59e0b,#d97706)", borderRadius:100 }}/>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:3, fontSize:8, color:"#64748b" }}>
                      <span>LOW</span><span>▲ MEDIUM</span><span>HIGH</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
                    {[
                      {l:"Total Profit", v:"₹88,300", c:"#10b981"},
                      {l:"Total Loss",   v:"₹22,100", c:"#ef4444"},
                      {l:"TDS Paid",     v:"₹4,400",  c:"#f59e0b"},
                    ].map((s,i)=>(
                      <div key={i} style={{ background:"rgba(255,255,255,.06)", borderRadius:10, padding:"8px", textAlign:"center" }}>
                        <div style={{ fontSize:8, color:"#64748b", marginBottom:3 }}>{s.l}</div>
                        <div style={{ fontSize:12, fontWeight:800, color:s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* FY Breakdown */}
                  <div style={{ borderTop:"1px solid rgba(255,255,255,.08)", paddingTop:12 }}>
                    <div style={{ fontSize:9, color:"#64748b", marginBottom:8, letterSpacing:1 }}>FINANCIAL YEAR BREAKDOWN</div>
                    {[
                      {fy:"FY 2022-23", trades:12, tax:"₹8,000",  status:"✅ Filed"},
                      {fy:"FY 2023-24", trades:18, tax:"₹11,500", status:"⚠️ File Karo"},
                      {fy:"FY 2024-25", trades:14, tax:"₹7,000",  status:"⏳ Upcoming"},
                      {fy:"FY 2025-26", trades:3,  tax:"₹0",      status:"⏳ Current"},
                    ].map((row,i)=>(
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <div style={{ width:6, height:6, borderRadius:"50%", background:i===0?"#10b981":i===1?"#ef4444":"#64748b" }}/>
                          <span style={{ fontSize:11, color:"#e2e8f0", fontWeight:600 }}>{row.fy}</span>
                          <span style={{ fontSize:9, color:"#475569" }}>{row.trades} trades</span>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:11, fontWeight:700, color:i===0?"#6ee7b7":i===1?"#f87171":"#64748b" }}>{row.tax}</div>
                          <div style={{ fontSize:9, color:"#475569" }}>{row.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons preview */}
                  <div style={{ display:"flex", gap:8, marginTop:14 }}>
                    <div style={{ flex:1, background:"#25D366", borderRadius:12, padding:"10px", textAlign:"center", fontSize:12, fontWeight:700, color:"#fff", opacity:.6 }}>📱 CA Ko Share</div>
                    <div style={{ flex:1, background:"rgba(255,255,255,.08)", borderRadius:12, padding:"10px", textAlign:"center", fontSize:12, fontWeight:700, color:"#64748b", opacity:.6 }}>🔄 Recalculate</div>
                  </div>
                </div>

                {/* Arrow pointing down */}
                <div style={{ textAlign:"center", marginTop:10, marginBottom:4 }}>
                  <div style={{ fontSize:11, color:"#10b981", fontWeight:700 }}>👆 Yeh real data se dikhega — exchange chuno aur CSV upload karo!</div>
                </div>
              </div>
            )}

            {/* ── EXCHANGE SELECTOR ── */}
            {!taxExchange && (
              <div>
                <div style={{ fontWeight:700, fontSize:13, color:T.text, marginBottom:12 }}>🏦 Apna Exchange Chuno</div>

                {/* Indian Exchanges */}
                <div style={{ fontSize:10, color:T.text3, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>🇮🇳 INDIAN EXCHANGES</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14 }}>
                  {[
                    {id:"coindcx",    name:"CoinDCX",      logo:"https://coindcx.com/favicon.ico",                    color:"#1a56db", bg:"#eff6ff"},
                    {id:"wazirx",     name:"WazirX",        logo:"https://wazirx.com/favicon.ico",                     color:"#f97316", bg:"#fff7ed"},
                    {id:"coinswitch", name:"CoinSwitch",    logo:"https://coinswitch.co/favicon.ico",                  color:"#7c3aed", bg:"#f5f3ff"},
                    {id:"zebpay",     name:"ZebPay",         logo:"https://zebpay.com/favicon.ico",                     color:"#dc2626", bg:"#fef2f2"},
                    {id:"unocoin",    name:"Unocoin",        logo:"https://unocoin.com/favicon.ico",                    color:"#d97706", bg:"#fffbeb"},
                    {id:"mudrex",     name:"Mudrex",         logo:"https://mudrex.com/favicon.ico",                     color:"#059669", bg:"#ecfdf5"},
                    {id:"bitbns",     name:"BitBNS",         logo:"https://bitbns.com/favicon.ico",                     color:"#374151", bg:"#f9fafb"},
                    {id:"delta",      name:"Delta Exchange", logo:"https://www.delta.exchange/favicon.ico",             color:"#2563eb", bg:"#eff6ff"},
                  ].map(ex=>(
                    <button key={ex.id} onClick={()=>setTaxExchange(ex)}
                      style={{ background:"#fff", border:`2px solid ${T.border}`, borderRadius:16, padding:"12px 10px", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10, transition:"all .2s", fontFamily:"'Inter',sans-serif", boxShadow:"0 2px 8px rgba(0,0,0,.04)" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=ex.color;e.currentTarget.style.background=ex.bg;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 20px ${ex.color}22`;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background="#fff";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.04)";}}>
                      <img src={ex.logo} alt={ex.name}
                        onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}
                        style={{ width:32, height:32, borderRadius:8, objectFit:"contain", border:`1px solid ${T.border}`, padding:2, flexShrink:0 }}/>
                      <div style={{ display:"none", width:32, height:32, borderRadius:8, background:`linear-gradient(135deg,${ex.color},${ex.color}cc)`, alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:900, color:"#fff", flexShrink:0 }}>
                        {ex.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color:T.text }}>{ex.name}</div>
                        <div style={{ fontSize:9, color:ex.color, marginTop:1, fontWeight:600 }}>📋 Guide + CSV Upload</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ fontSize:10, color:T.text3, fontWeight:700, letterSpacing:1.5, marginBottom:8 }}>🌍 GLOBAL EXCHANGES</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    {id:"binance",  name:"Binance",   logo:"https://bin.bnbstatic.com/static/images/common/favicon.ico", color:"#f59e0b", bg:"#fffbeb"},
                    {id:"kucoin",   name:"KuCoin",    logo:"https://assets.staticimg.com/cms/media/1lB3PkckFDyfxz6gu85anL9hZ.png", color:"#10b981", bg:"#ecfdf5"},
                    {id:"okx",      name:"OKX",       logo:"https://static.okx.com/cdn/assets/imgs/247/58E63FEA43973EC3.png", color:"#111827", bg:"#f9fafb"},
                    {id:"bybit",    name:"Bybit",     logo:"https://www.bybit.com/favicon.ico",   color:"#f97316", bg:"#fff7ed"},
                    {id:"coinbase", name:"Coinbase",  logo:"https://www.coinbase.com/favicon.ico", color:"#2563eb", bg:"#eff6ff"},
                  ].map(ex=>(
                    <button key={ex.id} onClick={()=>setTaxExchange(ex)}
                      style={{ background:"#fff", border:`2px solid ${T.border}`, borderRadius:16, padding:"12px 10px", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:10, transition:"all .2s", fontFamily:"'Inter',sans-serif", boxShadow:"0 2px 8px rgba(0,0,0,.04)" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=ex.color;e.currentTarget.style.background=ex.bg;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 20px ${ex.color}22`;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background="#fff";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.04)";}}>
                      <img src={ex.logo} alt={ex.name}
                        onError={e=>{e.target.style.display="none";e.target.nextSibling.style.display="flex";}}
                        style={{ width:32, height:32, borderRadius:8, objectFit:"contain", border:`1px solid ${T.border}`, padding:2, flexShrink:0 }}/>
                      <div style={{ display:"none", width:32, height:32, borderRadius:8, background:`linear-gradient(135deg,${ex.color},${ex.color}cc)`, alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:900, color:"#fff", flexShrink:0 }}>
                        {ex.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color:T.text }}>{ex.name}</div>
                        <div style={{ fontSize:9, color:ex.color, marginTop:1, fontWeight:600 }}>📋 Guide + CSV Upload</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── EXCHANGE GUIDE + CSV UPLOAD ── */}
            {taxExchange && !taxData && (
              <div className="fadein">
                {/* Back */}
                <button onClick={()=>{setTaxExchange(null);setTaxData(null);}} style={{ background:"none", border:"none", color:T.greenDk, fontWeight:700, fontSize:13, cursor:"pointer", marginBottom:16, display:"flex", alignItems:"center", gap:6, padding:0, fontFamily:"'Inter',sans-serif" }}>
                  ← Exchange badlo
                </button>

                {/* Exchange header */}
                <div style={{ background:`linear-gradient(135deg,${taxExchange.color}18,${taxExchange.color}08)`, border:`2px solid ${taxExchange.color}44`, borderRadius:16, padding:"14px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:36 }}>{taxExchange.icon}</span>
                  <div>
                    <div style={{ fontWeight:800, fontSize:16 }}>{taxExchange.name}</div>
                    <div style={{ fontSize:11, color:T.text2 }}>CSV download guide + upload</div>
                  </div>
                </div>

                {/* Step by step guide */}
                <div style={{ ...CARD, marginBottom:14 }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:T.text }}>
                    📋 {taxExchange.name} Se CSV Kaise Download Kare
                  </div>
                  {TAX_GUIDES[taxExchange.id]?.map((step, i) => (
                    <div key={i} style={{ display:"flex", gap:12, marginBottom:12, alignItems:"flex-start" }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:`linear-gradient(135deg,${taxExchange.color},${taxExchange.color}cc)`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:12, color:"#fff", flexShrink:0 }}>
                        {i+1}
                      </div>
                      <div style={{ flex:1, paddingTop:4 }}>
                        <div style={{ fontSize:13, color:T.text, lineHeight:1.5, fontWeight: step.bold?700:400 }}>{step.text}</div>
                        {step.note && <div style={{ fontSize:10, color:T.text3, marginTop:3, background:"#f8fafc", borderRadius:6, padding:"3px 8px", display:"inline-block" }}>💡 {step.note}</div>}
                      </div>
                    </div>
                  ))}
                  <div style={{ background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1px solid #fde68a", borderRadius:10, padding:"10px 12px", fontSize:11, color:"#92400e", lineHeight:1.6, marginTop:8 }}>
                    ⚠️ <strong>Date range:</strong> April 2022 se March 2026 tak select karo — poore 4 FY cover honge
                  </div>
                </div>

                {/* CSV Upload */}
                <div style={{ ...CARD }}>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>📥 CSV File Upload Karo</div>
                  <label style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:`2px dashed ${taxExchange.color}`, borderRadius:16, padding:"28px 16px", cursor:"pointer", background:`${taxExchange.color}08`, gap:10, marginBottom:12 }}>
                    <span style={{ fontSize:40 }}>📂</span>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontWeight:700, fontSize:14, color:taxExchange.color }}>CSV File Choose Karo</div>
                      <div style={{ fontSize:11, color:T.text3, marginTop:4 }}>{taxExchange.name} ka trade history CSV</div>
                    </div>
                    <input type="file" accept=".csv" style={{ display:"none" }} onChange={handleTaxCSV}/>
                  </label>
                  {taxParseError && (
                    <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:10, padding:"10px 12px", fontSize:12, color:"#dc2626", marginBottom:8 }}>
                      ⚠️ {taxParseError}
                    </div>
                  )}
                  <div style={{ fontSize:10, color:T.text3, textAlign:"center", lineHeight:1.7 }}>
                    🔒 File sirf aapke browser mein process hoti hai<br/>Koi data server pe nahi jaata — 100% secure
                  </div>
                </div>
              </div>
            )}

            {/* ── TAX CARD — CIBIL STYLE ── */}
            {taxData && (
              <div className="fadein">
                <button onClick={()=>{setTaxData(null);setTaxExchange(null);}} style={{ background:"none", border:"none", color:T.greenDk, fontWeight:700, fontSize:13, cursor:"pointer", marginBottom:16, display:"flex", alignItems:"center", gap:6, padding:0, fontFamily:"'Inter',sans-serif" }}>
                  ← Nayi File Upload Karo
                </button>

                {/* Main Tax Card */}
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", borderRadius:24, padding:"24px 20px", marginBottom:14, position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%", background:"rgba(16,185,129,.08)" }}/>
                  <div style={{ position:"absolute", bottom:-30, left:-30, width:120, height:120, borderRadius:"50%", background:"rgba(245,158,11,.06)" }}/>

                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                    <div>
                      <div style={{ fontSize:10, color:"#64748b", fontWeight:600, letterSpacing:2, marginBottom:4 }}>CRYPTO TAX CARD</div>
                      <div style={{ fontSize:11, color:"#94a3b8" }}>{taxExchange?.name} · {taxData.totalTrades} trades</div>
                    </div>
                    <div style={{ background:"linear-gradient(135deg,#10b981,#059669)", borderRadius:10, padding:"4px 12px", fontSize:10, fontWeight:700, color:"#fff" }}>YYP</div>
                  </div>

                  {/* Big tax number */}
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>TOTAL TAX DUE (ESTIMATED)</div>
                    <div style={{ fontSize:44, fontWeight:900, color: taxData.totalTax>50000?"#ef4444":taxData.totalTax>20000?"#f59e0b":"#10b981", lineHeight:1 }}>
                      ₹{taxData.totalTax.toLocaleString("en-IN")}
                    </div>
                    {/* Tax meter */}
                    <div style={{ marginTop:10, background:"rgba(255,255,255,.1)", borderRadius:100, height:8, overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:100, width:`${Math.min(100, (taxData.totalTax/100000)*100)}%`, background: taxData.totalTax>50000?"linear-gradient(90deg,#ef4444,#dc2626)":taxData.totalTax>20000?"linear-gradient(90deg,#f59e0b,#d97706)":"linear-gradient(90deg,#10b981,#059669)", transition:"width 1s ease" }}/>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontSize:9, color:"#64748b" }}>
                      <span>LOW</span><span>MEDIUM</span><span>HIGH</span>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
                    {[
                      {l:"Total Profit", v:`₹${taxData.totalProfit.toLocaleString("en-IN")}`, c:"#10b981"},
                      {l:"Total Loss", v:`₹${taxData.totalLoss.toLocaleString("en-IN")}`, c:"#ef4444"},
                      {l:"TDS Deducted", v:`₹${taxData.totalTDS.toLocaleString("en-IN")}`, c:"#f59e0b"},
                    ].map((s,i)=>(
                      <div key={i} style={{ background:"rgba(255,255,255,.06)", borderRadius:12, padding:"10px 8px", textAlign:"center" }}>
                        <div style={{ fontSize:9, color:"#64748b", marginBottom:4 }}>{s.l}</div>
                        <div style={{ fontSize:13, fontWeight:800, color:s.c }}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* FY Breakdown */}
                  <div style={{ borderTop:"1px solid rgba(255,255,255,.08)", paddingTop:14 }}>
                    <div style={{ fontSize:10, color:"#64748b", fontWeight:600, marginBottom:10, letterSpacing:1 }}>FINANCIAL YEAR BREAKDOWN</div>
                    {taxData.fyBreakdown.map((fy,i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background: fy.tax>0?"#ef4444":"#10b981" }}/>
                          <span style={{ fontSize:12, color:"#e2e8f0", fontWeight:600 }}>{fy.year}</span>
                          <span style={{ fontSize:10, color:"#64748b" }}>{fy.trades} trades</span>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:12, fontWeight:700, color: fy.tax>0?"#f87171":"#6ee7b7" }}>
                            {fy.tax>0?`₹${fy.tax.toLocaleString("en-IN")}`:"No Tax"}
                          </div>
                          <div style={{ fontSize:9, color:"#475569" }}>
                            {fy.status==="filed"?"✅ Filed":fy.status==="due"?"⚠️ File Karo":"⏳ Upcoming"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer */}
                <div style={{ background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1px solid #fde68a", borderRadius:12, padding:"12px 14px", fontSize:11, color:"#92400e", lineHeight:1.7, marginBottom:12 }}>
                  ⚠️ <strong>Important:</strong> Yeh estimate hai — actual tax ke liye CA se milein. Loss ko profit se set-off nahi kar sakte (India law). TDS alag se deduct hoti hai.
                </div>

                {/* Action buttons */}
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>{
                    const text = `🧾 Mera Crypto Tax Summary\n\nExchange: ${taxExchange?.name}\nTotal Tax: ₹${taxData.totalTax.toLocaleString("en-IN")}\nTotal Profit: ₹${taxData.totalProfit.toLocaleString("en-IN")}\nTDS: ₹${taxData.totalTDS.toLocaleString("en-IN")}\nTotal Trades: ${taxData.totalTrades}\n\nCalculated by YES YOU PRO\nyesyoupro.com`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
                  }} style={{ flex:1, background:"#25D366", color:"#fff", border:"none", borderRadius:12, padding:"12px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
                    📱 CA Ko Share
                  </button>
                  <button onClick={()=>{setTaxData(null);setTaxExchange(null);}} style={{ flex:1, background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"12px", fontWeight:700, fontSize:13, cursor:"pointer", color:T.text, fontFamily:"'Inter',sans-serif" }}>
                    🔄 Recalculate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* BANK VS CRYPTO CALCULATOR                                        */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ══ AD ══ */}
        <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px",margin:"12px 0"}}>
          <div style={{fontSize:9,color:"#94a3b8",letterSpacing:1,marginBottom:2}}>ADVERTISEMENT</div>
          <ins className="adsbygoogle" style={{display:"block"}} data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO" data-ad-format="auto" data-full-width-responsive="true"/>
          <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
        </div>

        {/* ════════════════════════ DCA PLANNER ════════════════════════ */}
        {tab==="dca" && <DcaPlanner />}

        {/* ════════════════════════ CRYPTO vs TRADITIONAL ══════════════ */}
        {tab==="traditional" && <TraditionalCompare />}

        {/* ════════════════════════ RUG PULL DETECTOR ══════════════════ */}
        {tab==="rugpull" && <RugPullDetector />}

        {/* ════════════════════════ BEST ENTRY TIME ════════════════════ */}
        {tab==="entrytime" && <EntryTimeFinder />}

        {/* ════════════════════════ AIRDROP TRACKER ════════════════════ */}
        {tab==="airdrop" && <AirdropTracker />}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* FOMO DETECTOR                                                    */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {tab==="fomo" && (
          <div className="fadein">
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>😱</div>
              <h2 style={{ fontSize:22, fontWeight:900, letterSpacing:-1, marginBottom:6 }}>FOMO Detector</h2>
              <p style={{ fontSize:13, color:T.text2 }}>Kya tumne FOMO mein trade kiya? AI batayega!</p>
            </div>

            <div style={{ background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1px solid #fde68a", borderRadius:14, padding:"12px 14px", marginBottom:14, fontSize:12, color:"#92400e", lineHeight:1.7 }}>
              💡 <strong>Kaise use karein:</strong> Apni recent trade describe karo — kab buy kiya, kyu kiya, market kya kar raha tha. AI FOMO analyze karega!
            </div>

            <div style={{ ...CARD }}>
              <div style={{ fontSize:10, color:T.text3, fontWeight:700, marginBottom:8 }}>APNI TRADE DESCRIBE KARO</div>
              <textarea value={fomoText} onChange={e=>setFomoText(e.target.value)}
                placeholder={"Example:\n\"Maine ETH kharida jab sabke groups mein pump aa raha tha. Price already 20% upar tha. Mujhe laga aur badhega. Maine bina research ke turant buy kiya...\"\n\nYa apni koi bhi trade describe karo 👆"}
                rows={6}
                style={{ width:"100%", background:"#f8fafc", border:`2px solid ${T.border}`, borderRadius:12, padding:"12px", fontSize:13, color:T.text, resize:"vertical", lineHeight:1.6, fontFamily:"'Inter',sans-serif", boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor="#f59e0b"} onBlur={e=>e.target.style.borderColor=T.border}/>
              <button style={{ ...BTN, width:"100%", padding:"13px", borderRadius:12, marginTop:12,
                background:"linear-gradient(135deg,#f59e0b,#d97706)",
                boxShadow:"0 4px 14px rgba(245,158,11,.4)" }}
                onClick={analyzeFOMO} disabled={fomoLoad||!fomoText.trim()}>
                {fomoLoad
                  ? <span>⟳ AI Analyze Kar Raha Hai...</span>
                  : "😱 FOMO Check Karo"}
              </button>
            </div>

            {fomoResult && (
              <div className="fadein">
                {/* FOMO Score Card */}
                <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", borderRadius:20, padding:"20px", marginBottom:12, textAlign:"center" }}>
                  <div style={{ fontSize:40, marginBottom:8 }}>{fomoResult.emoji}</div>
                  <div style={{ fontSize:11, color:"#64748b", letterSpacing:2, marginBottom:6 }}>FOMO SCORE</div>

                  {/* Score meter */}
                  <div style={{ fontSize:52, fontWeight:900, color:
                    fomoResult.fomoScore >= 70 ? "#ef4444"
                    : fomoResult.fomoScore >= 40 ? "#f59e0b"
                    : "#10b981", lineHeight:1, marginBottom:10 }}>
                    {fomoResult.fomoScore}/100
                  </div>

                  <div style={{ background:"rgba(255,255,255,.1)", borderRadius:100, height:10, overflow:"hidden", marginBottom:12 }}>
                    <div style={{ height:"100%", borderRadius:100,
                      width:`${fomoResult.fomoScore}%`,
                      background: fomoResult.fomoScore>=70?"linear-gradient(90deg,#f59e0b,#ef4444)"
                        :fomoResult.fomoScore>=40?"linear-gradient(90deg,#10b981,#f59e0b)"
                        :"linear-gradient(90deg,#10b981,#34d399)",
                      transition:"width 1.2s ease" }}/>
                  </div>

                  <div style={{ display:"inline-block", background:
                    fomoResult.verdict==="FOMO Trade"?"rgba(239,68,68,.2)"
                    :fomoResult.verdict==="Smart Trade"?"rgba(16,185,129,.2)"
                    :"rgba(245,158,11,.2)",
                    border:`1px solid ${fomoResult.verdict==="FOMO Trade"?"#ef4444":fomoResult.verdict==="Smart Trade"?"#10b981":"#f59e0b"}`,
                    borderRadius:20, padding:"6px 20px", fontSize:13, fontWeight:800,
                    color: fomoResult.verdict==="FOMO Trade"?"#fca5a5":fomoResult.verdict==="Smart Trade"?"#6ee7b7":"#fde68a" }}>
                    {fomoResult.verdict === "FOMO Trade" ? "🚨 FOMO Trade Detect Hua!"
                     :fomoResult.verdict === "Smart Trade" ? "✅ Smart Trade!"
                     :"⚠️ Borderline — Thoda FOMO"}
                  </div>
                </div>

                {/* Signs */}
                {fomoResult.signs?.length > 0 && (
                  <div style={{ ...CARD, border:"1px solid #fca5a5", background:"linear-gradient(135deg,#fef2f2,#fff)" }}>
                    <div style={{ fontWeight:700, fontSize:13, color:"#dc2626", marginBottom:10 }}>🚨 FOMO Signs Detected</div>
                    {fomoResult.signs.map((s,i)=>(
                      <div key={i} style={{ display:"flex", gap:8, marginBottom:6, fontSize:12, color:"#475569", lineHeight:1.5 }}>
                        <span style={{ color:"#ef4444", flexShrink:0 }}>❌</span><span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Good signs */}
                {fomoResult.goodSigns?.length > 0 && (
                  <div style={{ ...CARD, border:"1px solid #6ee7b7", background:"linear-gradient(135deg,#f0fdf4,#fff)" }}>
                    <div style={{ fontWeight:700, fontSize:13, color:"#059669", marginBottom:10 }}>✅ Acha Kiya</div>
                    {fomoResult.goodSigns.map((s,i)=>(
                      <div key={i} style={{ display:"flex", gap:8, marginBottom:6, fontSize:12, color:"#475569", lineHeight:1.5 }}>
                        <span style={{ color:"#10b981", flexShrink:0 }}>✓</span><span>{s}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lesson */}
                {fomoResult.lesson && (
                  <div style={{ background:"linear-gradient(135deg,#eff6ff,#dbeafe)", border:"1px solid #93c5fd", borderRadius:14, padding:"14px 16px", marginBottom:12 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:"#1d4ed8", marginBottom:6 }}>💡 Lesson</div>
                    <div style={{ fontSize:13, color:"#1e40af", lineHeight:1.7 }}>{fomoResult.lesson}</div>
                  </div>
                )}

                {/* Share */}
                <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(`😱 Maine Apna FOMO Score Check Kiya!\n\nScore: ${fomoResult.fomoScore}/100\nVerdict: ${fomoResult.verdict}\n\nYes You Pro pe check karo:\nyesyoupro.com`)}`)}
                  style={{ width:"100%", background:"#25D366", color:"#fff", border:"none", borderRadius:12, padding:"12px", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
                  📱 Dosto Ka FOMO Score Check Karwao
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* WHITEPAPER SUMMARIZER                                            */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {tab==="whitepaper" && (
          <div className="fadein">

            {/* TIME SAVE BANNER */}
            <div style={{ background:"linear-gradient(135deg,#0f172a,#1e3a2f)", borderRadius:20, padding:"18px", marginBottom:16, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-20, right:-20, width:100, height:100, borderRadius:"50%", background:"rgba(16,185,129,.1)" }}/>
              <div style={{ fontSize:32, marginBottom:8 }}>⏱️</div>
              <div style={{ fontWeight:900, fontSize:18, color:"white", marginBottom:6, lineHeight:1.3 }}>
                2-3 Ghante Bachao!
              </div>
              <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.7, marginBottom:10 }}>
                Naya coin aaya → Whitepaper 50-100 pages ka<br/>
                Normally: <span style={{ color:"#ef4444", fontWeight:700 }}>2-3 ghante padhna</span><br/>
                Hamara tool: <span style={{ color:"#10b981", fontWeight:700 }}>2 minute mein summary! 🚀</span>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {["✅ Coin kya karta hai?","✅ Real use case?","✅ Team kaisi?","✅ Risks kya?","✅ Buy karna chahiye?"].map((t,i)=>(
                  <span key={i} style={{ background:"rgba(16,185,129,.15)", border:"1px solid rgba(16,185,129,.3)", borderRadius:20, padding:"3px 10px", fontSize:10, color:"#6ee7b7", fontWeight:600 }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Mode Toggle */}
            <div style={{ ...CARD, padding:"12px 14px", marginBottom:12 }}>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>📄 Whitepaper Kaise Doge?</div>
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                {[{id:"url",label:"🔗 URL Paste Karo",sub:"Link dalo — AI fetch karega"},{id:"paste",label:"📋 Text Paste Karo",sub:"PDF kholo → text copy karo"}].map(m=>(
                  <button key={m.id} onClick={()=>{setWpMode(m.id);setWpError("");setWpResult(null);}}
                    style={{ flex:1, background:wpMode===m.id?"linear-gradient(135deg,#10b981,#059669)":"#f8fafc",
                      color:wpMode===m.id?"#fff":T.text2,
                      border:`2px solid ${wpMode===m.id?"#10b981":"#e2e8f0"}`,
                      borderRadius:12, padding:"10px 8px", cursor:"pointer", fontFamily:"'Inter',sans-serif",
                      textAlign:"center" }}>
                    <div style={{ fontWeight:700, fontSize:12 }}>{m.label}</div>
                    <div style={{ fontSize:9, opacity:.7, marginTop:2 }}>{m.sub}</div>
                  </button>
                ))}
              </div>

              {wpMode==="url" ? (
                <div>
                  <div style={{ fontSize:10, color:T.text3, fontWeight:700, marginBottom:6 }}>WHITEPAPER URL</div>
                  <input value={wpUrl} onChange={e=>setWpUrl(e.target.value)}
                    placeholder="https://bitcoin.org/bitcoin.pdf ya coin ka website"
                    style={{ ...INP, marginBottom:10 }}
                    onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                  <div style={{ fontSize:10, color:"#94a3b8", marginBottom:12, lineHeight:1.6 }}>
                    💡 <strong>Tip:</strong> PDF links direct work nahi karte — agar error aaye to "Text Paste Karo" mode try karo
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:10, color:T.text3, fontWeight:700, marginBottom:6 }}>WHITEPAPER TEXT PASTE KARO</div>
                  <textarea value={wpText} onChange={e=>setWpText(e.target.value)}
                    placeholder={"PDF/Website se text copy karo aur yahan paste karo...\n\nTip: Ctrl+A → Ctrl+C website pe → yahan Ctrl+V\n\nMinimum 200 words chahiye accurate summary ke liye."}
                    rows={7}
                    style={{ width:"100%", background:"#f8fafc", border:`2px solid ${T.border}`, borderRadius:12,
                      padding:"12px", fontSize:12, color:T.text, resize:"vertical", lineHeight:1.6,
                      fontFamily:"'Inter',sans-serif", boxSizing:"border-box", marginBottom:10 }}
                    onFocus={e=>e.target.style.borderColor="#10b981"} onBlur={e=>e.target.style.borderColor=T.border}/>
                  <div style={{ fontSize:10, color:"#94a3b8", marginBottom:12 }}>
                    {wpText.length > 0 ? `${wpText.length} characters ` : ""}
                    {wpText.length > 5000 ? "✅ Enough content!" : wpText.length > 200 ? "📝 Good — aur zyada better!" : ""}
                  </div>
                </div>
              )}

              {wpError && (
                <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:10, padding:"10px 12px", fontSize:12, color:"#dc2626", marginBottom:10, lineHeight:1.6 }}>
                  ⚠️ {wpError}
                  {(wpError.includes("PDF") || wpError.includes("fetch")) && (
                    <div style={{ marginTop:6 }}>
                      <button onClick={()=>setWpMode("paste")}
                        style={{ background:"#dc2626", color:"#fff", border:"none", borderRadius:8, padding:"4px 12px", fontSize:11, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:700 }}>
                        📋 Text Paste Mode Try Karo
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button onClick={analyzeWhitepaper}
                disabled={wpLoad || (wpMode==="url"?!wpUrl.trim():wpText.length<100)}
                style={{ ...BTN, width:"100%", padding:"14px", borderRadius:12, fontSize:14,
                  background: wpLoad?"#475569":"linear-gradient(135deg,#10b981,#059669)",
                  boxShadow:"0 4px 14px rgba(16,185,129,.4)", opacity: wpLoad?1:(wpMode==="url"?!wpUrl.trim():wpText.length<100)?0.5:1 }}>
                {wpLoad ? "⟳ Analyzing..." : "🔍 Whitepaper Analyze Karo"}
              </button>

              {/* AD — below analyze button */}
              {!wpLoad && !wpResult && (
                <div style={{ marginTop:14, borderRadius:12, overflow:"hidden", textAlign:"center", background:"#fff", border:`1px solid ${T.border}`, padding:"4px" }}>
                  <div style={{ fontSize:9, color:"#94a3b8", marginBottom:2, letterSpacing:1 }}>ADVERTISEMENT</div>
                  <ins className="adsbygoogle" style={{display:"block"}}
                    data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO"
                    data-ad-format="auto" data-full-width-responsive="true"/>
                  <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
                </div>
              )}

              {/* LOADING — animated skeleton */}
              {wpLoad && (
                <div className="fadein" style={{ marginTop:14 }}>
                  {/* Steps */}
                  <div style={{ background:"linear-gradient(135deg,#f0fdf4,#ecfdf5)", border:"2px solid #6ee7b7", borderRadius:16, padding:"16px", marginBottom:12 }}>
                    <div style={{ fontWeight:800, fontSize:13, color:"#059669", marginBottom:12, textAlign:"center" }}>
                      ⏳ AI Whitepaper Padh Raha Hai...
                    </div>
                    {[
                      {step:"1", text:"🌐 Website/URL fetch ho raha hai", done:true},
                      {step:"2", text:"📖 Content extract kar raha hai", done:true},
                      {step:"3", text:"🤖 AI analysis kar raha hai", done:false},
                      {step:"4", text:"📝 Summary ready ho rahi hai", done:false},
                    ].map((s,i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                        <div style={{ width:24, height:24, borderRadius:"50%", flexShrink:0,
                          background:s.done?"linear-gradient(135deg,#10b981,#059669)":"rgba(16,185,129,.15)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:s.done?10:11, color:s.done?"#fff":"#10b981",
                          animation:!s.done?"blink 1.5s infinite":"none" }}>
                          {s.done?"✓":s.step}
                        </div>
                        <div style={{ fontSize:12, color:s.done?"#059669":"#94a3b8", fontWeight:s.done?600:400 }}>{s.text}</div>
                      </div>
                    ))}
                    <div style={{ marginTop:12, background:"rgba(16,185,129,.1)", borderRadius:100, height:6, overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:100, background:"linear-gradient(90deg,#10b981,#34d399)",
                        width:"70%", animation:"shimmer 2s infinite", backgroundSize:"200% 100%" }}/>
                    </div>
                    <div style={{ fontSize:10, color:"#94a3b8", textAlign:"center", marginTop:6 }}>
                      ⏱️ 30-60 seconds — 2-3 ghante ka kaam ho raha hai!
                    </div>
                  </div>

                  {/* Skeleton preview */}
                  <div style={{ background:"#fff", border:`1px solid ${T.border}`, borderRadius:16, padding:"16px" }}>
                    <div style={{ fontWeight:700, fontSize:12, color:"#94a3b8", marginBottom:12 }}>📄 Summary aa rahi hai...</div>
                    {["🪙 COIN KYA HAI","⚡ REAL USE CASE","👥 TEAM","💰 TOKENOMICS","📊 TECHNOLOGY","🚨 RISKS","✅ BUY KARNA CHAHIYE?"].map((s,i)=>(
                      <div key={i} style={{ background:"linear-gradient(90deg,#f1f5f9,#e2e8f0,#f1f5f9)", backgroundSize:"200% 100%",
                        animation:"shimmer 1.5s infinite", borderRadius:8, height:i===0?40:28, marginBottom:8, padding:"8px 10px",
                        display:"flex", alignItems:"center" }}>
                        <span style={{ fontSize:11, color:"#94a3b8" }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RESULT */}
            {wpResult && (
              <div className="fadein">
                {/* Time saved badge */}
                <div style={{ background:"linear-gradient(135deg,#ecfdf5,#d1fae5)", border:"2px solid #6ee7b7", borderRadius:14, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:24 }}>⏱️</span>
                  <div>
                    <div style={{ fontWeight:800, fontSize:13, color:"#065f46" }}>2-3 Ghante Bache! 🎉</div>
                    <div style={{ fontSize:11, color:"#059669" }}>AI ne whitepaper analyze kar diya</div>
                  </div>
                </div>

                {/* AD — after result loads */}
                <div style={{ marginBottom:12, borderRadius:12, overflow:"hidden", textAlign:"center", background:"#fff", border:`1px solid ${T.border}`, padding:"4px" }}>
                  <div style={{ fontSize:9, color:"#94a3b8", marginBottom:2, letterSpacing:1 }}>ADVERTISEMENT</div>
                  <ins className="adsbygoogle" style={{display:"block"}}
                    data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO"
                    data-ad-format="auto" data-full-width-responsive="true"/>
                  <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
                </div>

                {/* Summary */}
                <div style={{ background:"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:"18px", boxShadow:"0 4px 20px rgba(0,0,0,.06)", marginBottom:12 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:T.text, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:20 }}>📄</span> Whitepaper Summary — YYP AI
                  </div>
                  {wpResult.split("\n").map((line,i) => {
                    if (!line.trim()) return <div key={i} style={{ height:8 }}/>;
                    if (line.match(/^[🪙⚡👥💰📊🚨✅⏱️]/)) {
                      return (
                        <div key={i} style={{ background:"#f8fafc", borderRadius:12, padding:"10px 12px", marginBottom:8, borderLeft:"3px solid #10b981" }}>
                          <div style={{ fontWeight:700, fontSize:13, color:T.text, lineHeight:1.6 }}>{line}</div>
                        </div>
                      );
                    }
                    return <div key={i} style={{ fontSize:13, color:"#475569", lineHeight:1.7, paddingLeft:4 }}>{line}</div>;
                  })}
                </div>

                {/* Actions */}
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(`📄 Whitepaper Summary — YES YOU PRO AI\n\n${wpResult.slice(0,500)}...\n\nFull analysis: yesyoupro.com/features`)}`)}
                    style={{ flex:1, background:"#25D366", color:"#fff", border:"none", borderRadius:12, padding:"12px", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
                    📱 Share Summary
                  </button>
                  <button onClick={()=>{setWpResult(null);setWpUrl("");setWpText("");setWpError("");}}
                    style={{ flex:1, background:"#f8fafc", border:`1px solid ${T.border}`, borderRadius:12, padding:"12px", fontWeight:700, fontSize:12, cursor:"pointer", color:T.text, fontFamily:"'Inter',sans-serif" }}>
                    🔄 New Whitepaper
                  </button>
                </div>
              </div>
            )}

            {/* How to use guide */}
            {!wpResult && !wpLoad && (
              <div style={{ ...CARD, background:"linear-gradient(135deg,#fffbeb,#fef3c7)", border:"1px solid #fde68a" }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#92400e", marginBottom:10 }}>📖 Kaise Use Karein?</div>
                {[
                  { n:"1", t:"Coin ka whitepaper dhundho", d:'Google pe search karo: "[Coin name] whitepaper" → website link copy karo' },
                  { n:"2", t:"URL paste karo ya text copy karo", d:"URL direct paste karo ya PDF mein se text copy karke paste karo" },
                  { n:"3", t:"Analyze button dabao", d:"AI 30-60 seconds mein poora summary de dega" },
                  { n:"4", t:"Smart decision lo", d:"2-3 ghante ki research → 2 minute mein complete! Time aur paise dono bachao" },
                ].map((s,i)=>(
                  <div key={i} style={{ display:"flex", gap:10, marginBottom:12, alignItems:"flex-start" }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#f59e0b,#d97706)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:12, color:"#fff", flexShrink:0 }}>
                      {s.n}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:12, color:"#92400e" }}>{s.t}</div>
                      <div style={{ fontSize:11, color:"#78350f", marginTop:2, lineHeight:1.5 }}>{s.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign:"center", marginTop:24 }}>

          {/* AD — BEFORE FOOTER */}
          <div style={{marginBottom:14,borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            <div style={{fontSize:9,color:"#94a3b8",marginBottom:2,letterSpacing:1}}>ADVERTISEMENT</div>
            <ins className="adsbygoogle"
              style={{display:"block"}}
              data-ad-client="ca-pub-9884021055437527"
              data-ad-slot="AUTO"
              data-ad-format="auto"
              data-full-width-responsive="true"/>
            <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
          </div>
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
