"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const fmt = (n) => n >= 1
  ? "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  : "$" + n.toPrecision(4);

const fmtB = (n) => {
  if (!n) return "N/A";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  return "$" + n.toFixed(0);
};

export default function RadarPage() {
  const [coins,       setCoins]       = useState([]);
  const [trending,    setTrending]    = useState([]);
  const [cmcTrend,    setCmcTrend]    = useState([]);
  const [signals,     setSignals]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpd,     setLastUpd]     = useState("");
  const [search,      setSearch]      = useState("");
  const [filter,      setFilter]      = useState("all"); // all | pump | trending | volume
  const [countdown,   setCountdown]   = useState(60);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // ── 1. CoinGecko Top 120 ─────────────────────────────────────────────
      const [geckoRes, trendRes, binanceRes] = await Promise.allSettled([
        fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=120&page=1&sparkline=false&price_change_percentage=1h,24h,7d")
          .then(r => r.ok ? r.json() : []),
        fetch("https://api.coingecko.com/api/v3/search/trending")
          .then(r => r.ok ? r.json() : {}),
        fetch("https://api.binance.com/api/v3/ticker/24hr")
          .then(r => r.ok ? r.json() : []),
      ]);

      const geckoCoins = geckoRes.status === "fulfilled" ? geckoRes.value : [];
      const trendData  = trendRes.status === "fulfilled" ? trendRes.value : {};
      const binanceTickers = binanceRes.status === "fulfilled" ? binanceRes.value : [];

      // ── 2. CoinGecko Trending Coins ───────────────────────────────────────
      const geckoTrendingSymbols = (trendData?.coins || [])
        .map(c => c.item?.symbol?.toUpperCase());
      setTrending(geckoTrendingSymbols);

      // ── 3. CMC Trending (public endpoint) ────────────────────────────────
      let cmcSymbols = [];
      try {
        const cmcR = await fetch("https://api.coinmarketcap.com/data-api/v3/topsearch/rank",
          { headers: { "User-Agent": "Mozilla/5.0" } });
        if (cmcR.ok) {
          const cmcJ = await cmcR.json();
          cmcSymbols = (cmcJ?.data?.cryptoTopSearchRanks || [])
            .map(c => c.symbol?.toUpperCase()).slice(0, 20);
        }
      } catch(_) {}
      setCmcTrend(cmcSymbols);

      // ── 4. Binance Volume Map ─────────────────────────────────────────────
      const volMap = {};
      if (Array.isArray(binanceTickers)) {
        for (const t of binanceTickers) {
          if (t.symbol.endsWith("USDT")) {
            const sym = t.symbol.replace("USDT", "");
            volMap[sym] = {
              vol24: parseFloat(t.quoteVolume),
              ch24:  parseFloat(t.priceChangePercent),
              price: parseFloat(t.lastPrice),
            };
          }
        }
      }

      // ── 5. Calculate Binance avg volume from top 50 for comparison ────────
      const vols = Object.values(volMap).map(v => v.vol24).sort((a,b) => b-a);
      const medianVol = vols[60] || 1e8;

      // ── 6. Build Coin List with Signals ──────────────────────────────────
      const coinList = geckoCoins.map(g => {
        const sym = g.symbol?.toUpperCase();
        const bin = volMap[sym] || {};
        const volRatio = bin.vol24 && g.total_volume
          ? bin.vol24 / (g.total_volume || 1)
          : 1;

        const isGeckoTrending = geckoTrendingSymbols.includes(sym);
        const isCmcTrending   = cmcSymbols.includes(sym);
        const volSpike        = bin.vol24 > medianVol * 3;
        const priceSpike      = Math.abs(g.price_change_percentage_1h_in_currency || 0) > 3;

        // Pump Score 0-100
        let pumpScore = 0;
        if (isGeckoTrending) pumpScore += 30;
        if (isCmcTrending)   pumpScore += 30;
        if (volSpike)         pumpScore += 25;
        if (priceSpike)       pumpScore += 15;
        if ((g.price_change_percentage_24h || 0) > 5)  pumpScore += 10;
        if ((g.price_change_percentage_7d_in_currency || 0) > 10) pumpScore += 10;
        pumpScore = Math.min(100, pumpScore);

        return {
          rank:       g.market_cap_rank,
          symbol:     sym,
          name:       g.name,
          image:      g.image,
          price:      g.current_price,
          ch1h:       g.price_change_percentage_1h_in_currency || 0,
          ch24:       g.price_change_percentage_24h || 0,
          ch7d:       g.price_change_percentage_7d_in_currency || 0,
          marketCap:  g.market_cap,
          vol24:      g.total_volume,
          binVol:     bin.vol24,
          isGeckoTrending,
          isCmcTrending,
          volSpike,
          priceSpike,
          pumpScore,
        };
      });

      // Sort pump signals by score
      const pumpSignals = [...coinList]
        .filter(c => c.pumpScore >= 30)
        .sort((a, b) => b.pumpScore - a.pumpScore);
      setSignals(pumpSignals);
      setCoins(coinList);
      setLastUpd(new Date().toLocaleTimeString("en-IN"));
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(p => p <= 1 ? 60 : p - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpd]);

  const filtered = coins.filter(c => {
    const matchSearch = c.symbol.includes(search.toUpperCase()) || c.name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "pump")     return c.pumpScore >= 50;
    if (filter === "trending") return c.isGeckoTrending || c.isCmcTrending;
    if (filter === "volume")   return c.volSpike;
    return true;
  });

  return (
    <main style={{ fontFamily:"'Inter',sans-serif", background:"#0f172a", minHeight:"100vh", paddingBottom:40 }}>
      <style>{`
        @keyframes fadein{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.4)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0)}}
        .fadein{animation:fadein .3s ease}
        .mono{font-family:'JetBrains Mono',monospace}
        .row:hover{background:rgba(255,255,255,.05)!important}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:#374151;border-radius:3px}
      `}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0f172a,#1e293b)", padding:"16px", borderBottom:"1px solid #1e293b" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <Link href="/" style={{ color:"#6ee7b7", fontSize:12, textDecoration:"none", fontWeight:600 }}>← Home</Link>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#ef4444", animation:"pulse 2s infinite" }}/>
            <span style={{ fontSize:10, color:"#ef4444", fontWeight:700 }}>LIVE</span>
            <span style={{ fontSize:10, color:"#475569", marginLeft:4 }}>· {lastUpd}</span>
            <span style={{ fontSize:10, color:"#6ee7b7", marginLeft:4, fontWeight:700 }}>🔄 {countdown}s</span>
          </div>
        </div>

        <h1 style={{ fontSize:24, fontWeight:900, color:"white", marginBottom:4, letterSpacing:-1 }}>
          🚨 Pump Radar
        </h1>
        <p style={{ fontSize:12, color:"#64748b", marginBottom:14 }}>
          CMC + CoinGecko Top 120 — Pump hone se pehle detect karo
        </p>

        {/* Search */}
        <div style={{ position:"relative", marginBottom:12 }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Coin search karo: BTC, APT, SOL..."
            style={{ width:"100%", background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)",
              borderRadius:12, padding:"10px 12px 10px 36px", fontSize:13, color:"white",
              boxSizing:"border-box", fontFamily:"'Inter',sans-serif" }}/>
        </div>

        {/* Filter tabs */}
        <div style={{ display:"flex", gap:6 }}>
          {[
            { id:"all",      label:"📊 All 120" },
            { id:"pump",     label:"🔥 Pump Signal" },
            { id:"trending", label:"📈 Trending" },
            { id:"volume",   label:"⚡ Vol Spike" },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ flex:1, background: filter===f.id?"linear-gradient(135deg,#ef4444,#dc2626)":"rgba(255,255,255,.06)",
                color: filter===f.id?"#fff":"#94a3b8", border:"none", borderRadius:20,
                padding:"6px 4px", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pump Signals Banner */}
      {signals.length > 0 && filter === "all" && (
        <div style={{ background:"linear-gradient(135deg,#450a0a,#7f1d1d)", padding:"12px 16px", borderBottom:"1px solid #991b1b" }}>
          <div style={{ fontSize:11, color:"#fca5a5", fontWeight:700, marginBottom:8 }}>
            🚨 PUMP SIGNALS DETECTED — {signals.length} coins
          </div>
          <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
            {signals.slice(0, 6).map(c => (
              <div key={c.symbol} style={{ flexShrink:0, background:"rgba(239,68,68,.2)", border:"1px solid #ef4444",
                borderRadius:12, padding:"8px 12px", textAlign:"center", minWidth:70 }}>
                <div style={{ fontWeight:800, fontSize:12, color:"#fca5a5" }}>{c.symbol}</div>
                <div style={{ fontSize:16, fontWeight:900, color:"#ef4444" }}>{c.pumpScore}</div>
                <div style={{ fontSize:8, color:"#94a3b8" }}>score</div>
                <div style={{ display:"flex", gap:3, justifyContent:"center", marginTop:3, flexWrap:"wrap" }}>
                  {c.isGeckoTrending && <span style={{ fontSize:7, background:"#065f46", color:"#6ee7b7", borderRadius:4, padding:"1px 4px" }}>GCK</span>}
                  {c.isCmcTrending   && <span style={{ fontSize:7, background:"#1e3a8a", color:"#93c5fd", borderRadius:4, padding:"1px 4px" }}>CMC</span>}
                  {c.volSpike        && <span style={{ fontSize:7, background:"#7c2d12", color:"#fdba74", borderRadius:4, padding:"1px 4px" }}>VOL</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div style={{ background:"#111827", padding:"10px 16px", display:"flex", gap:20, overflowX:"auto", borderBottom:"1px solid #1f2937" }}>
        {[
          { l:"Total Coins",    v:coins.length,                               c:"#e2e8f0" },
          { l:"Pump Signals 🔥", v:signals.length,                            c:"#ef4444" },
          { l:"CMC Trending",   v:cmcTrend.length,                            c:"#60a5fa" },
          { l:"GCK Trending",   v:trending.length,                            c:"#34d399" },
          { l:"Vol Spikes ⚡",  v:coins.filter(c=>c.volSpike).length,         c:"#f59e0b" },
        ].map((s, i) => (
          <div key={i} style={{ flexShrink:0, textAlign:"center" }}>
            <div style={{ fontSize:9, color:"#64748b", fontWeight:600, marginBottom:2 }}>{s.l}</div>
            <div style={{ fontSize:18, fontWeight:800, color:s.c }}>{loading ? "—" : s.v}</div>
          </div>
        ))}
      </div>

      {/* AD — below stats bar */}
      <div style={{ background:"#111827", padding:"4px 12px", borderBottom:"1px solid #1f2937", textAlign:"center" }}>
        <div style={{ fontSize:9, color:"#374151", marginBottom:2, letterSpacing:1 }}>ADVERTISEMENT</div>
        <ins className="adsbygoogle" style={{display:"block"}}
          data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO"
          data-ad-format="auto" data-full-width-responsive="true"/>
        <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
      </div>

      {/* Coin List */}
      <div style={{ padding:"10px 12px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:"48px 0" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📡</div>
            <div style={{ color:"#64748b", fontSize:14, marginBottom:8 }}>CMC + CoinGecko data fetch ho raha hai...</div>
            <div style={{ display:"flex", justifyContent:"center", gap:8 }}>
              {["CoinGecko","CoinMarketCap","Binance"].map(s => (
                <div key={s} style={{ fontSize:10, color:"#10b981", background:"rgba(16,185,129,.1)", borderRadius:20, padding:"3px 10px" }}>
                  ⟳ {s}
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"32px", color:"#64748b" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🔍</div>
            <p>Koi coin nahi mila</p>
          </div>
        ) : (
          <div className="fadein">
            {filtered.map((coin, i) => {
              const pumpColor = coin.pumpScore >= 60 ? "#ef4444" : coin.pumpScore >= 30 ? "#f59e0b" : "#374151";
              return (
                <div key={coin.symbol}>
                  {/* AD after every 30 coins */}
                  {i > 0 && i % 30 === 0 && (
                    <div style={{ margin:"10px 0", borderRadius:10, overflow:"hidden", textAlign:"center", background:"#111827", border:"1px solid #1f2937", padding:"4px" }}>
                      <div style={{ fontSize:8, color:"#374151", marginBottom:2, letterSpacing:1 }}>ADVERTISEMENT</div>
                      <ins className="adsbygoogle" style={{display:"block"}}
                        data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO"
                        data-ad-format="auto" data-full-width-responsive="true"/>
                      <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
                    </div>
                  )}
                <div className="row"
                  style={{ background: coin.pumpScore >= 60 ? "rgba(239,68,68,.05)" : coin.pumpScore >= 30 ? "rgba(245,158,11,.03)" : "transparent",
                    border: `1px solid ${coin.pumpScore >= 60 ? "rgba(239,68,68,.3)" : coin.pumpScore >= 30 ? "rgba(245,158,11,.2)" : "#1f2937"}`,
                    borderRadius:14, marginBottom:6, padding:"10px 12px",
                    display:"flex", alignItems:"center", gap:8, transition:"all .15s" }}>

                  {/* Rank */}
                  <div style={{ width:22, textAlign:"center", fontSize:10, color:"#475569", fontWeight:600, flexShrink:0 }}>
                    {coin.rank}
                  </div>

                  {/* Logo */}
                  <img src={coin.image} alt="" onError={e => e.target.style.display="none"}
                    style={{ width:32, height:32, borderRadius:"50%", flexShrink:0 }}/>

                  {/* Name + badges */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap" }}>
                      <span style={{ fontWeight:800, fontSize:13, color:"#f1f5f9" }}>{coin.symbol}</span>
                      {coin.isGeckoTrending && (
                        <span style={{ fontSize:8, background:"#065f46", color:"#6ee7b7", borderRadius:4, padding:"1px 5px", fontWeight:700 }}>
                          🦎 GCK
                        </span>
                      )}
                      {coin.isCmcTrending && (
                        <span style={{ fontSize:8, background:"#1e3a8a", color:"#93c5fd", borderRadius:4, padding:"1px 5px", fontWeight:700 }}>
                          📊 CMC
                        </span>
                      )}
                      {coin.volSpike && (
                        <span style={{ fontSize:8, background:"#7c2d12", color:"#fdba74", borderRadius:4, padding:"1px 5px", fontWeight:700 }}>
                          ⚡ VOL
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{fmtB(coin.marketCap)} mcap</div>
                    {/* Volume bar */}
                    <div style={{ marginTop:4, background:"#1f2937", borderRadius:100, height:3, overflow:"hidden", width:"80%" }}>
                      <div style={{ height:"100%", borderRadius:100,
                        width:`${Math.min(100, (coin.vol24 / (filtered[0]?.vol24 || 1)) * 100)}%`,
                        background: coin.volSpike ? "#f59e0b" : "#374151" }}/>
                    </div>
                  </div>

                  {/* Price + changes */}
                  <div style={{ textAlign:"center", flexShrink:0 }}>
                    <div className="mono" style={{ fontSize:11, fontWeight:700, color:"#f1f5f9" }}>
                      {fmt(coin.price)}
                    </div>
                    <div style={{ fontSize:9, color: coin.ch1h >= 0 ? "#34d399" : "#f87171", fontWeight:600 }}>
                      {coin.ch1h >= 0 ? "▲" : "▼"}{Math.abs(coin.ch1h).toFixed(1)}% 1h
                    </div>
                    <div style={{ fontSize:9, color: coin.ch24 >= 0 ? "#34d399" : "#f87171" }}>
                      {coin.ch24 >= 0 ? "▲" : "▼"}{Math.abs(coin.ch24).toFixed(1)}% 24h
                    </div>
                  </div>

                  {/* Pump Score */}
                  <div style={{ flexShrink:0, textAlign:"center", width:50 }}>
                    <div style={{ width:40, height:40, borderRadius:"50%", margin:"0 auto",
                      background: coin.pumpScore >= 60 ? "linear-gradient(135deg,#ef4444,#dc2626)"
                        : coin.pumpScore >= 30 ? "linear-gradient(135deg,#f59e0b,#d97706)"
                        : "#1f2937",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      boxShadow: coin.pumpScore >= 60 ? "0 0 12px rgba(239,68,68,.5)" : "none",
                      animation: coin.pumpScore >= 60 ? "pulse 2s infinite" : "none" }}>
                      <div>
                        <div style={{ fontSize:11, fontWeight:900, color:"#fff", lineHeight:1 }}>{coin.pumpScore}</div>
                        <div style={{ fontSize:7, color:"rgba(255,255,255,.7)" }}>pump</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AD — before footer */}
      <div style={{ margin:"0 12px 12px", borderRadius:12, overflow:"hidden", textAlign:"center", background:"#111827", border:"1px solid #1f2937", padding:"4px" }}>
        <div style={{ fontSize:9, color:"#374151", marginBottom:2, letterSpacing:1 }}>ADVERTISEMENT</div>
        <ins className="adsbygoogle" style={{display:"block"}}
          data-ad-client="ca-pub-9884021055437527" data-ad-slot="AUTO"
          data-ad-format="auto" data-full-width-responsive="true"/>
        <script dangerouslySetInnerHTML={{__html:"(adsbygoogle=window.adsbygoogle||[]).push({});"}}/>
      </div>

      {/* Footer */}
      <div style={{ textAlign:"center", padding:"16px", fontSize:10, color:"#374151" }}>
        Data: CoinGecko + CoinMarketCap + Binance · Har 60 sec update<br/>
        <span style={{ color:"#dc2626" }}>⚠️ Not financial advice — DYOR always</span>
        <div style={{ marginTop:8 }}>
          <Link href="/" style={{ color:"#6ee7b7", textDecoration:"none" }}>← YES YOU PRO</Link>
        </div>
      </div>
    </main>
  );
}
