"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const STABLE = ["USDT","USDC","BUSD","DAI","TUSD","USDP","USDD","GUSD","FRAX","LUSD"];

const fmt = (n) => {
  if (!n || isNaN(n)) return "$0";
  if (n >= 1) return "$" + n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  return "$" + n.toPrecision(4);
};
const fmtB = (n) => {
  if (n >= 1e9) return "$"+(n/1e9).toFixed(2)+"B";
  if (n >= 1e6) return "$"+(n/1e6).toFixed(1)+"M";
  return "$"+n.toFixed(0);
};

export default function MarketPage() {
  const [coins,  setCoins]     = useState([]);
  const [loading,setLoading]   = useState(true);
  const [search, setSearch]    = useState("");
  const [sort,   setSort]      = useState("volume");
  const [sortDir,setSortDir]   = useState("desc");
  const [lastUpd,setLastUpd]   = useState("");

  const fetchMarket = async () => {
    try {
      const r = await fetch("https://api.binance.com/api/v3/ticker/24hr");
      if (!r.ok) return;
      const data = await r.json();
      const filtered = data
        .filter(t => {
          const sym = t.symbol.replace("USDT","");
          return t.symbol.endsWith("USDT")
            && !STABLE.includes(sym)
            && parseFloat(t.quoteVolume) > 1_000_000;
        })
        .sort((a,b) => parseFloat(b.quoteVolume)-parseFloat(a.quoteVolume))
        .slice(0, 120)
        .map((t,i) => ({
          rank:    i+1,
          symbol:  t.symbol.replace("USDT",""),
          price:   parseFloat(t.lastPrice),
          ch24:    parseFloat(t.priceChangePercent),
          high:    parseFloat(t.highPrice),
          low:     parseFloat(t.lowPrice),
          volume:  parseFloat(t.quoteVolume),
          trades:  parseInt(t.count),
        }));
      setCoins(filtered);
      setLastUpd(new Date().toLocaleTimeString("en-IN"));
    } catch(_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchMarket();
    const interval = setInterval(fetchMarket, 1000);
    return () => clearInterval(interval);
  }, []);

  const sorted = [...coins]
    .filter(c => c.symbol.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      let va = a[sort], vb = b[sort];
      if (sort==="name") { va=a.symbol; vb=b.symbol; return sortDir==="asc"?va.localeCompare(vb):vb.localeCompare(va); }
      if (sort==="ch24") { va=Math.abs(a.ch24); vb=Math.abs(b.ch24); }
      return sortDir==="asc" ? va-vb : vb-va;
    });

  const toggleSort = (s) => {
    if (sort===s) setSortDir(d => d==="desc"?"asc":"desc");
    else { setSort(s); setSortDir("desc"); }
  };

  const SortBtn = ({id, label}) => (
    <button onClick={()=>toggleSort(id)}
      style={{background: sort===id?"linear-gradient(135deg,#10b981,#059669)":"#f8fafc",
        color: sort===id?"#fff":"#64748b", border:`1px solid ${sort===id?"#10b981":"#e2e8f0"}`,
        borderRadius:20, padding:"5px 12px", fontSize:11, fontWeight:700, cursor:"pointer",
        fontFamily:"'Inter',sans-serif", display:"flex", alignItems:"center", gap:3}}>
      {label} {sort===id && <span style={{fontSize:10}}>{sortDir==="desc"?"↓":"↑"}</span>}
    </button>
  );

  return (
    <main style={{fontFamily:"'Inter',sans-serif",background:"#f0fdf8",minHeight:"100vh",padding:"0 0 40px"}}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .fadein{animation:fadein .3s ease-out}
        .mono{font-family:'JetBrains Mono',monospace}
        .row:hover{background:#f0fdf4!important;cursor:pointer}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#f1f5f9}
        ::-webkit-scrollbar-thumb{background:#6ee7b7;border-radius:4px}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
      `}</style>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e293b)",padding:"16px 16px 20px",marginBottom:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <Link href="/" style={{color:"#6ee7b7",fontSize:12,textDecoration:"none",fontWeight:600}}>← Home</Link>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:"#10b981",boxShadow:"0 0 8px #10b981",animation:"blink 2s infinite"}}/>
            <span style={{fontSize:10,color:"#6ee7b7",fontWeight:600,fontFamily:"'JetBrains Mono',monospace"}}>LIVE · {lastUpd}</span>
          </div>
        </div>
        <h1 style={{fontSize:24,fontWeight:900,color:"white",letterSpacing:-1,marginBottom:4}}>📊 Live Market</h1>
        <p style={{fontSize:12,color:"#64748b",marginBottom:14}}>Top 120 coins — Binance se live data · Har 1 second update 🔴</p>

        {/* Search */}
        <div style={{position:"relative",marginBottom:12}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Coin search karo: BTC, ETH, SOL…"
            style={{width:"100%",background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",borderRadius:12,padding:"10px 12px 10px 36px",fontSize:13,color:"white",boxSizing:"border-box",fontFamily:"'Inter',sans-serif"}}/>
        </div>

        {/* Sort buttons */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <SortBtn id="volume" label="🔥 Volume"/>
          <SortBtn id="ch24"   label="📈 Change"/>
          <SortBtn id="price"  label="💰 Price"/>
          <SortBtn id="name"   label="🔤 Name"/>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"10px 16px",display:"flex",gap:16,overflowX:"auto"}}>
        {[
          {l:"Total Coins", v:coins.length},
          {l:"Gainers 🟢", v:coins.filter(c=>c.ch24>0).length, c:"#059669"},
          {l:"Losers 🔴",  v:coins.filter(c=>c.ch24<0).length, c:"#dc2626"},
          {l:"Showing",    v:sorted.length},
        ].map((s,i)=>(
          <div key={i} style={{flexShrink:0,textAlign:"center"}}>
            <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,marginBottom:2}}>{s.l}</div>
            <div style={{fontSize:16,fontWeight:800,color:s.c||"#0f172a"}}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* AD — BELOW STATS */}
      <div style={{margin:"12px 12px 0",borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px"}}>
        <div style={{fontSize:9,color:"#94a3b8",marginBottom:2,letterSpacing:1}}>ADVERTISEMENT</div>
        <ins className="adsbygoogle"
          style={{display:"block"}}
          data-ad-client="ca-pub-9884021055437527"
          data-ad-slot="AUTO"
          data-ad-format="auto"
          data-full-width-responsive="true"/>
        <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
      </div>

      {/* Market List */}
      <div style={{padding:"12px 12px"}}>
        {loading ? (
          <div style={{textAlign:"center",padding:"48px 0"}}>
            <div style={{fontSize:40,marginBottom:12}}>📊</div>
            <p style={{color:"#64748b",fontSize:14}}>120 coins load ho rahe hain…</p>
          </div>
        ) : (
          <div className="fadein">
            {sorted.map((coin,i) => {
              const isUp   = coin.ch24 >= 0;
              const chAbs  = Math.abs(coin.ch24);
              const bgColor = coin.ch24 > 5 ? "rgba(16,185,129,.06)"
                : coin.ch24 > 0 ? "rgba(16,185,129,.03)"
                : coin.ch24 < -5 ? "rgba(239,68,68,.06)"
                : "rgba(239,68,68,.02)";
              return (
                <div key={coin.symbol} className="row"
                  style={{background:"#fff",borderRadius:14,marginBottom:6,padding:"11px 14px",
                    border:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10,
                    transition:"all .15s",boxShadow:"0 1px 4px rgba(0,0,0,.03)"}}>

                  {/* Rank */}
                  <div style={{width:24,textAlign:"center",fontSize:11,color:"#94a3b8",fontWeight:700,flexShrink:0}}>
                    {coin.rank}
                  </div>

                  {/* Logo */}
                  <img src={`https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`}
                    alt="" onError={e=>{e.target.style.display="none"}}
                    style={{width:32,height:32,borderRadius:"50%",border:"1px solid #f1f5f9",flexShrink:0}}/>

                  {/* Name + volume */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:14,color:"#0f172a"}}>{coin.symbol}</div>
                    <div style={{fontSize:10,color:"#94a3b8"}}>{fmtB(coin.volume)}</div>
                  </div>

                  {/* 24h bar */}
                  <div style={{width:60,flexShrink:0}}>
                    <div style={{height:4,background:"#f1f5f9",borderRadius:100,overflow:"hidden",marginBottom:3}}>
                      <div style={{height:"100%",borderRadius:100,
                        width:`${Math.min(100,chAbs*8)}%`,
                        background:isUp?"#10b981":"#ef4444"}}/>
                    </div>
                    <div style={{fontSize:10,color:"#94a3b8",textAlign:"center"}}>{coin.ch24.toFixed(1)}%</div>
                  </div>

                  {/* Price + change */}
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div className="mono" style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{fmt(coin.price)}</div>
                    <div style={{fontSize:12,fontWeight:700,color:isUp?"#059669":"#dc2626"}}>
                      {isUp?"▲":"▼"}{chAbs.toFixed(2)}%
                    </div>
                  </div>

                  {/* Signal badge */}
                  <div style={{flexShrink:0}}>
                    <div style={{
                      background: coin.ch24>5?"#ecfdf5":coin.ch24>0?"#f0fdf4":coin.ch24<-5?"#fef2f2":"#fff1f2",
                      border:`1px solid ${coin.ch24>5?"#6ee7b7":coin.ch24>0?"#a7f3d0":coin.ch24<-5?"#fca5a5":"#fecaca"}`,
                      borderRadius:20,padding:"3px 8px",fontSize:9,fontWeight:700,
                      color:coin.ch24>5?"#059669":coin.ch24>0?"#10b981":coin.ch24<-5?"#dc2626":"#ef4444"}}>
                      {coin.ch24>5?"🚀 HOT":coin.ch24>0?"📈 UP":coin.ch24<-5?"📉 DIP":"🔴 DOWN"}
                    </div>
                  </div>
                </div>
              );
            })}

            {sorted.length === 0 && (
              <div style={{textAlign:"center",padding:"32px",color:"#94a3b8"}}>
                <div style={{fontSize:32,marginBottom:8}}>🔍</div>
                <p>"{search}" nahi mila</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{margin:"0 12px",borderRadius:12,overflow:"hidden",textAlign:"center",background:"#fff",border:"1px solid #e2e8f0",padding:"4px",marginBottom:12}}>
        <div style={{fontSize:9,color:"#94a3b8",marginBottom:2,letterSpacing:1}}>ADVERTISEMENT</div>
        <ins className="adsbygoogle"
          style={{display:"block"}}
          data-ad-client="ca-pub-9884021055437527"
          data-ad-slot="AUTO"
          data-ad-format="auto"
          data-full-width-responsive="true"/>
        <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
      </div>
      <div style={{textAlign:"center",padding:"16px",fontSize:11,color:"#94a3b8"}}>
        Data: Binance API · Har 30 sec update · <Link href="/" style={{color:"#10b981",textDecoration:"none"}}>← Home</Link>
      </div>
    </main>
  );
}
