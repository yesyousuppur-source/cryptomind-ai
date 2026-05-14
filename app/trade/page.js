"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const AD = () => (
  <div style={{borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",
    border:"1px solid #e2e8f0",padding:"4px",margin:"12px 0"}}>
    <div style={{fontSize:9,color:"#94a3b8",marginBottom:2,letterSpacing:1}}>ADVERTISEMENT</div>
    <ins className="adsbygoogle" style={{display:"block"}}
      data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO"
      data-ad-format="auto" data-full-width-responsive="true"/>
    <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
  </div>
);

export default function TradePage() {
  // Form
  const [coin,setCoin]         = useState("APT");
  const [buyPrice,setBuyPrice] = useState("");
  const [amount,setAmount]     = useState("");
  const [currency,setCurrency] = useState("INR");
  const [leverage,setLeverage] = useState(1);
  const [active,setActive]     = useState(false);

  // Live data
  const [livePrice,setLivePrice]   = useState(null);
  const [prevPrice,setPrevPrice]   = useState(null);
  const [priceDir,setPriceDir]     = useState(null); // "up"|"down"
  const [volume,setVolume]         = useState(null);
  const [aiAdvice,setAiAdvice]     = useState(null);
  const [aiLoad,setAiLoad]         = useState(false);
  const [klines,setKlines]         = useState([]);
  const [lastUpd,setLastUpd]       = useState("");
  const [ticker,setTicker]         = useState(null);

  const intervalRef = useRef(null);
  const wsRef       = useRef(null);
  const USD_INR     = 83.5;

  // ── Fetch klines once on start ────────────────────────────────────────
  const fetchKlines = useCallback(async (sym) => {
    try {
      const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=1h&limit=50`);
      if(r.ok){ const j=await r.json(); setKlines(j.map(k=>parseFloat(k[4]))); }
    } catch(_){}
  }, []);

  // ── Live price via WebSocket (every ~1 sec) ───────────────────────────
  const startWS = useCallback((sym) => {
    if(wsRef.current) wsRef.current.close();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${sym.toLowerCase()}usdt@ticker`);
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      const price = parseFloat(d.c);
      const vol   = parseFloat(d.q);
      setLivePrice(prev => {
        if(prev !== null){
          setPriceDir(price > prev ? "up" : price < prev ? "down" : null);
          setPrevPrice(prev);
        }
        return price;
      });
      setVolume(vol);
      setLastUpd(new Date().toLocaleTimeString("en-IN"));
      setTicker({
        ch24: parseFloat(d.P),
        high: parseFloat(d.h),
        low:  parseFloat(d.l),
      });
    };
    ws.onerror = () => { ws.close(); startWS(sym); };
    wsRef.current = ws;
  }, []);

  // ── RSI calculate ─────────────────────────────────────────────────────
  const calcRSI = (closes) => {
    if(closes.length < 15) return 50;
    let ag=0,al=0;
    for(let i=1;i<=14;i++){const d=closes[i]-closes[i-1];d>0?ag+=d:al+=Math.abs(d);}
    ag/=14; al/=14;
    for(let i=15;i<closes.length;i++){const d=closes[i]-closes[i-1];ag=(ag*13+(d>0?d:0))/14;al=(al*13+(d<0?Math.abs(d):0))/14;}
    return al===0?100:Math.round(100-100/(1+ag/al));
  };

  // ── Fetch AI advice ───────────────────────────────────────────────────
  const fetchAI = useCallback(async (sym, entry, lev, cur, amt, rsi, price, vol24) => {
    setAiLoad(true);
    try {
      const entryUSD = cur==="INR" ? entry/USD_INR : entry;
      const amtUSD   = cur==="INR" ? amt/USD_INR   : amt;
      const pnlPct   = ((price - entryUSD)/entryUSD*100).toFixed(2);
      const lPnlPct  = (pnlPct * lev).toFixed(2);

      const prompt = `You are a crypto trading expert for Indian investors. Analyze this open trade:

Coin: ${sym}USDT
Entry Price: $${entryUSD.toFixed(4)}
Current Price: $${price.toFixed(4)}
P&L: ${pnlPct}% (${lPnlPct}% with ${lev}x leverage)
Investment: $${amtUSD.toFixed(0)}
Leverage: ${lev}x
RSI (1h): ${rsi}
24h Volume: $${(vol24/1e6).toFixed(0)}M

Respond in this EXACT format (Hinglish):
📊 RECOMMENDATION: [HOLD / PARTIAL SELL / SELL NOW / ADD MORE]
💡 REASON: [2 lines max — simple Hinglish]
🎯 TARGET 1: $[price] (+[%]%) — [when to take]
🎯 TARGET 2: $[price] (+[%]%)
🎯 TARGET 3: $[price] (+[%]%)
🛑 STOP LOSS: $[price] (-[%]%)
⏰ HOLD TIME: [e.g. "2-5 din" or "1-2 hafte"]
⚠️ RISK: [1 line max]`;

      const r = await fetch("/api/ai", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({mode:"compare", systemPrompt: prompt})
      });
      const j = await r.json();
      setAiAdvice(j.text || "");
    } catch(_){}
    setAiLoad(false);
  }, []);

  // ── Start tracking ────────────────────────────────────────────────────
  const startTracking = async () => {
    if(!coin || !buyPrice || !amount) return;
    const sym = coin.toUpperCase();
    setActive(true);
    setAiAdvice(null);
    await fetchKlines(sym);
    startWS(sym);
  };

  // ── AI advice when price loads ────────────────────────────────────────
  useEffect(() => {
    if(active && livePrice && klines.length > 0 && !aiAdvice && !aiLoad) {
      const rsi = calcRSI(klines);
      fetchAI(coin.toUpperCase(), parseFloat(buyPrice), leverage, currency, parseFloat(amount), rsi, livePrice, volume||0);
    }
  }, [active, livePrice, klines]);

  // ── Refresh AI every 3 min ────────────────────────────────────────────
  useEffect(() => {
    if(!active) return;
    const t = setInterval(() => {
      if(livePrice && klines.length > 0) {
        const rsi = calcRSI(klines);
        fetchAI(coin.toUpperCase(), parseFloat(buyPrice), leverage, currency, parseFloat(amount), rsi, livePrice, volume||0);
      }
    }, 180000);
    return () => clearInterval(t);
  }, [active, livePrice, klines]);

  // ── Cleanup ───────────────────────────────────────────────────────────
  useEffect(() => {
    return () => { if(wsRef.current) wsRef.current.close(); };
  }, []);

  // ── Calculations ──────────────────────────────────────────────────────
  const calc = (() => {
    if(!active || !livePrice || !buyPrice || !amount) return null;
    const entryUSD  = currency==="INR" ? parseFloat(buyPrice)/USD_INR : parseFloat(buyPrice);
    const amtUSD    = currency==="INR" ? parseFloat(amount)/USD_INR   : parseFloat(amount);
    const priceDiff = livePrice - entryUSD;
    const pnlPct    = (priceDiff/entryUSD*100);
    const lPnlPct   = pnlPct * leverage;
    const pnlUSD    = amtUSD * (lPnlPct/100);
    const pnlINR    = pnlUSD * USD_INR;
    const rsi       = calcRSI(klines);
    const liqPrice  = leverage > 1 ? entryUSD * (1 - 1/leverage * 0.9) : null;
    return { entryUSD, amtUSD, priceDiff, pnlPct, lPnlPct, pnlUSD, pnlINR, rsi, liqPrice };
  })();

  const fmtPrice = (n) => n >= 1 ? "$"+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : "$"+n?.toPrecision(5);
  const isGreen  = calc && calc.lPnlPct >= 0;

  return (
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f0fdf8",minHeight:"100vh",
      color:"#0f172a",overflowX:"hidden",paddingBottom:40}}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.4)}50%{box-shadow:0 0 0 8px rgba(16,185,129,0)}}
        @keyframes flash-green{0%,100%{color:#059669}50%{color:#34d399}}
        @keyframes flash-red{0%,100%{color:#dc2626}50%{color:#f87171}}
        .fadein{animation:fadein .3s ease}
        .mono{font-family:'JetBrains Mono',monospace}
        .price-up{animation:flash-green .3s ease}
        .price-down{animation:flash-red .3s ease}
      `}</style>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",padding:"16px",
        borderBottom:"2px solid #10b981"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <Link href="/" style={{color:"#6ee7b7",fontSize:12,textDecoration:"none",fontWeight:600}}>← Home</Link>
          {active && (
            <div style={{display:"flex",alignItems:"center",gap:5,background:"rgba(16,185,129,.15)",
              border:"1px solid rgba(16,185,129,.3)",borderRadius:20,padding:"3px 10px"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#10b981",animation:"pulse 1.5s infinite"}}/>
              <span style={{fontSize:9,color:"#6ee7b7",fontWeight:700}}>LIVE · {lastUpd}</span>
            </div>
          )}
        </div>
        <div style={{fontWeight:900,fontSize:22,color:"white",letterSpacing:-1}}>📈 Trade Manager</div>
        <div style={{fontSize:11,color:"#64748b"}}>Position track karo · AI batayega kab sell karo</div>
      </div>

      <div style={{padding:"14px"}}>

        {/* AD — top */}
        <AD/>

        {/* INPUT FORM */}
        {!active && (
          <div className="fadein" style={{background:"#fff",borderRadius:20,padding:"18px",
            boxShadow:"0 4px 20px rgba(0,0,0,.06)",border:"1px solid #e2e8f0",marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:20}}>💼</span> Apni Trade Enter Karo
            </div>

            {/* Coin */}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:5,letterSpacing:.5}}>COIN</div>
              <input value={coin} onChange={e=>setCoin(e.target.value.toUpperCase())}
                placeholder="BTC, ETH, APT, SOL..."
                style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                  padding:"12px 14px",fontSize:16,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",
                  color:"#0f172a",boxSizing:"border-box"}}
                onFocus={e=>e.target.style.borderColor="#10b981"}
                onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
            </div>

            {/* Buy Price */}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:5,letterSpacing:.5}}>BUY PRICE</div>
              <div style={{display:"flex",gap:8}}>
                <select value={currency} onChange={e=>setCurrency(e.target.value)}
                  style={{background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                    padding:"12px 10px",fontSize:13,color:"#0f172a",width:90,flexShrink:0}}>
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                </select>
                <input value={buyPrice} onChange={e=>setBuyPrice(e.target.value)}
                  placeholder={currency==="INR"?"e.g. 710":"e.g. 8.50"} type="number"
                  style={{flex:1,background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                    padding:"12px 14px",fontSize:14,fontWeight:700,color:"#0f172a",
                    fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box",minWidth:0}}
                  onFocus={e=>e.target.style.borderColor="#10b981"}
                  onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
              </div>
            </div>

            {/* Amount */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:5,letterSpacing:.5}}>INVEST KIYA AMOUNT</div>
              <input value={amount} onChange={e=>setAmount(e.target.value)}
                placeholder={currency==="INR"?"e.g. 5000 (₹)":"e.g. 60 ($)"} type="number"
                style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",borderRadius:12,
                  padding:"12px 14px",fontSize:14,fontWeight:700,color:"#0f172a",
                  fontFamily:"'JetBrains Mono',monospace",boxSizing:"border-box"}}
                onFocus={e=>e.target.style.borderColor="#10b981"}
                onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
            </div>

            {/* Leverage */}
            <div style={{marginBottom:18}}>
              <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,marginBottom:8,letterSpacing:.5}}>
                LEVERAGE: <span style={{color:leverage>1?"#ef4444":"#10b981",fontWeight:800}}>{leverage}x</span>
                {leverage>1&&<span style={{color:"#ef4444",fontSize:9,marginLeft:6}}>⚠️ High Risk</span>}
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[1,2,3,5,10,20,50].map(l=>(
                  <button key={l} onClick={()=>setLeverage(l)}
                    style={{background:leverage===l?l>5?"linear-gradient(135deg,#ef4444,#dc2626)":"linear-gradient(135deg,#10b981,#059669)":"#f8fafc",
                      color:leverage===l?"#fff":"#64748b",
                      border:leverage===l?"none":"1px solid #e2e8f0",
                      borderRadius:20,padding:"6px 14px",cursor:"pointer",
                      fontSize:12,fontWeight:700,fontFamily:"'Inter',sans-serif"}}>
                    {l}x
                  </button>
                ))}
              </div>
            </div>

            <button onClick={startTracking}
              disabled={!coin||!buyPrice||!amount}
              style={{width:"100%",background:"linear-gradient(135deg,#10b981,#059669)",
                color:"#fff",border:"none",borderRadius:14,padding:"14px",
                fontWeight:800,fontSize:15,cursor:"pointer",fontFamily:"'Inter',sans-serif",
                boxShadow:"0 4px 16px rgba(16,185,129,.4)",
                opacity:(!coin||!buyPrice||!amount)?0.5:1}}>
              🚀 Track Karo — Live Monitor Start
            </button>
          </div>
        )}

        {/* LIVE DASHBOARD */}
        {active && livePrice && calc && (
          <div className="fadein">

            {/* Price Card */}
            <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a2f)",borderRadius:20,
              padding:"18px",marginBottom:12,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,
                background:`linear-gradient(90deg,${isGreen?"#10b981,#34d399,#10b981":"#ef4444,#f87171,#ef4444"})`}}/>

              {/* Coin + Live */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div>
                  <div style={{fontWeight:900,fontSize:20,color:"white"}}>{coin.toUpperCase()}</div>
                  <div style={{fontSize:10,color:"#64748b"}}>{leverage}x leverage · {currency==="INR"?"₹":"$"}{parseFloat(amount).toLocaleString()} invested</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div className={`mono ${priceDir==="up"?"price-up":priceDir==="down"?"price-down":""}`}
                    style={{fontSize:22,fontWeight:900,
                      color:priceDir==="up"?"#34d399":priceDir==="down"?"#f87171":"#fff",
                      transition:"color .2s"}}>
                    {fmtPrice(livePrice)}
                  </div>
                  {ticker && (
                    <div style={{fontSize:11,color:ticker.ch24>=0?"#10b981":"#ef4444",fontWeight:700}}>
                      {ticker.ch24>=0?"▲":"▼"}{Math.abs(ticker.ch24).toFixed(2)}% 24h
                    </div>
                  )}
                </div>
              </div>

              {/* P&L Big Display */}
              <div style={{background:"rgba(255,255,255,.06)",borderRadius:14,padding:"14px",
                border:`1px solid ${isGreen?"rgba(16,185,129,.3)":"rgba(239,68,68,.3)"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:11,color:"#64748b",fontWeight:600}}>TOTAL P&L ({leverage}x)</div>
                  <div style={{fontSize:11,color:"#64748b"}}>RSI: <span style={{
                    color:calc.rsi<35?"#10b981":calc.rsi>65?"#ef4444":"#f59e0b",fontWeight:700
                  }}>{calc.rsi}</span></div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                  <div>
                    <div className="mono" style={{fontSize:28,fontWeight:900,
                      color:isGreen?"#34d399":"#f87171",lineHeight:1}}>
                      {isGreen?"+":""}{currency==="INR"?`₹${Math.abs(calc.pnlINR).toFixed(0)}`:`$${Math.abs(calc.pnlUSD).toFixed(2)}`}
                    </div>
                    <div style={{fontSize:12,color:isGreen?"#6ee7b7":"#fca5a5",marginTop:3}}>
                      {isGreen?"▲":"▼"}{Math.abs(calc.lPnlPct).toFixed(2)}% leveraged
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:10,color:"#64748b",marginBottom:2}}>Entry vs Now</div>
                    <div className="mono" style={{fontSize:11,color:"#94a3b8"}}>
                      {fmtPrice(calc.entryUSD)} → {fmtPrice(livePrice)}
                    </div>
                    <div style={{fontSize:10,color:isGreen?"#10b981":"#ef4444",fontWeight:600}}>
                      {isGreen?"+":""}{calc.pnlPct.toFixed(2)}% spot
                    </div>
                  </div>
                </div>

                {/* Liquidation warning */}
                {calc.liqPrice && leverage > 1 && (
                  <div style={{marginTop:10,background:"rgba(239,68,68,.15)",borderRadius:8,
                    padding:"6px 10px",display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:10,color:"#fca5a5",fontWeight:700}}>⚠️ Liquidation Price</span>
                    <span className="mono" style={{fontSize:10,color:"#fca5a5",fontWeight:800}}>
                      {fmtPrice(calc.liqPrice)}
                    </span>
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div style={{display:"flex",gap:8,marginTop:10}}>
                {[
                  {l:"24h High",v:ticker?fmtPrice(ticker.high):"—",c:"#34d399"},
                  {l:"24h Low",v:ticker?fmtPrice(ticker.low):"—",c:"#f87171"},
                  {l:"Volume",v:volume?`$${(volume/1e6).toFixed(0)}M`:"—",c:"#fbbf24"},
                ].map((s,i)=>(
                  <div key={i} style={{flex:1,background:"rgba(255,255,255,.04)",borderRadius:10,
                    padding:"7px",textAlign:"center"}}>
                    <div style={{fontSize:8,color:"#64748b",marginBottom:3}}>{s.l}</div>
                    <div className="mono" style={{fontSize:11,fontWeight:700,color:s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AD — between price and AI */}
            <AD/>

            {/* AI ADVICE */}
            <div style={{background:"#fff",borderRadius:20,padding:"18px",
              boxShadow:"0 4px 20px rgba(0,0,0,.06)",border:"1px solid #e2e8f0",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:20}}>🤖</span> AI Advice
                </div>
                <button onClick={()=>{
                  const rsi=calcRSI(klines);
                  fetchAI(coin.toUpperCase(),parseFloat(buyPrice),leverage,currency,parseFloat(amount),rsi,livePrice,volume||0);
                }} style={{background:"#f0fdf4",border:"1px solid #6ee7b7",borderRadius:20,
                  padding:"4px 12px",fontSize:11,color:"#059669",fontWeight:700,cursor:"pointer",
                  fontFamily:"'Inter',sans-serif"}}>
                  🔄 Refresh
                </button>
              </div>

              {aiLoad ? (
                <div style={{textAlign:"center",padding:"20px 0"}}>
                  <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:8}}>
                    {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",
                      background:"#10b981",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
                  </div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>AI analyze kar raha hai...</div>
                </div>
              ) : aiAdvice ? (
                <div className="fadein">
                  {aiAdvice.split("\n").filter(Boolean).map((line,i)=>{
                    const isKey = line.startsWith("📊")||line.startsWith("🎯")||line.startsWith("🛑")||line.startsWith("⏰");
                    const isRec = line.startsWith("📊");
                    return(
                      <div key={i} style={{
                        background:isRec?"linear-gradient(135deg,#f0fdf4,#ecfdf5)":isKey?"#f8fafc":"transparent",
                        border:isRec?"2px solid #6ee7b7":isKey?"1px solid #f1f5f9":"none",
                        borderRadius:isKey?10:0,
                        padding:isKey?"9px 12px":"2px 4px",
                        marginBottom:isKey?8:3,
                        fontSize:isRec?14:12,
                        fontWeight:isRec?800:isKey?600:400,
                        color:isRec?"#065f46":"#374151",
                        lineHeight:1.7,
                        borderLeft:isRec?"4px solid #10b981":"none",
                      }}>{line}</div>
                    );
                  })}
                  <div style={{fontSize:9,color:"#94a3b8",marginTop:8,textAlign:"right"}}>
                    ⏱️ Har 3 min mein update hoga
                  </div>
                </div>
              ) : (
                <div style={{textAlign:"center",padding:"16px",color:"#94a3b8",fontSize:12}}>
                  Price load hone ke baad AI advice aayegi...
                </div>
              )}
            </div>

            {/* AD — after AI advice */}
            <AD/>

            {/* Reset button */}
            <button onClick={()=>{
              setActive(false); setLivePrice(null); setAiAdvice(null);
              setKlines([]); setTicker(null); setVolume(null);
              if(wsRef.current) wsRef.current.close();
            }} style={{width:"100%",background:"#f8fafc",border:"2px solid #e2e8f0",
              borderRadius:14,padding:"12px",fontWeight:700,fontSize:13,cursor:"pointer",
              color:"#64748b",fontFamily:"'Inter',sans-serif",marginBottom:12}}>
              🔄 Nayi Trade Enter Karo
            </button>

          </div>
        )}

        {/* Loading state */}
        {active && !livePrice && (
          <div className="fadein" style={{background:"#fff",borderRadius:20,padding:"32px",
            textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,.06)"}}>
            <div style={{fontSize:40,marginBottom:12}}>📡</div>
            <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>Binance se connect ho raha hai...</div>
            <div style={{fontSize:11,color:"#94a3b8"}}>{coin.toUpperCase()} live price fetch ho rahi hai</div>
            <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:14}}>
              {[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:"50%",
                background:"#10b981",animation:`blink 1.2s ${i*.3}s infinite`}}/>)}
            </div>
          </div>
        )}

        {/* AD — footer */}
        <AD/>

        {/* Footer */}
        <div style={{textAlign:"center",fontSize:10,color:"#94a3b8",padding:"8px"}}>
          ⚠️ Not financial advice — DYOR always<br/>
          <Link href="/" style={{color:"#10b981",textDecoration:"none"}}>← YES YOU PRO</Link>
        </div>
      </div>
    </main>
  );
}
