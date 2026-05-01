"use client";

import { useState, useRef } from "react";
import { calcRSI, calcMA, buildDecision } from "../lib/indicators";
import {
  INPUT_MAP, FULL_NAME, DECISION_CONFIG, MOOD_CONFIG, fmt, fmtBig,
} from "../lib/constants";

export default function Home() {
  const [query, setQuery]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [result, setResult]       = useState(null);
  const [aiText, setAiText]       = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [lossAmt, setLossAmt]     = useState("");
  const [investAmt, setInvestAmt] = useState("");
  const cache = useRef({});

  const analyze = async () => {
    const raw = query.trim().toLowerCase();
    if (!raw) return;
    const sym = INPUT_MAP[raw] || raw.toUpperCase();
    setError(null); setAiText(""); setResult(null);

    const now = Date.now();
    if (cache.current[sym] && now - cache.current[sym].ts < 60000) {
      setResult(cache.current[sym].data);
      callAI(cache.current[sym].data);
      return;
    }

    setLoading(true);
    try {
      const [tickR, klinesR] = await Promise.all([
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`),
        fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=1d&limit=200`),
      ]);

      if (!tickR.ok) throw new Error(`"${sym}" not found. Try: BTC, ETH, SOL, APT, DOGE…`);

      const tick   = await tickR.json();
      const klines = klinesR.ok ? await klinesR.json() : [];

      const price  = parseFloat(tick.lastPrice);
      const ch24   = parseFloat(tick.priceChangePercent);
      const volume = parseFloat(tick.quoteVolume);
      const closes = klines.map((k) => parseFloat(k[4]));
      const ch7d   =
        closes.length >= 8
          ? ((closes[closes.length - 1] - closes[closes.length - 8]) /
              closes[closes.length - 8]) * 100
          : ch24;

      const rsi   = closes.length > 15  ? calcRSI(closes)      : null;
      const ma50  = closes.length >= 50  ? calcMA(closes, 50)   : null;
      const ma200 = closes.length >= 200 ? calcMA(closes, 200)  : null;

      const dec = buildDecision({ rsi, price, ma50, ma200, ch24, ch7d });

      let marketCap = 0;
      try {
        const ccR = await fetch(
          `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${sym}&tsyms=USD`
        );
        if (ccR.ok) {
          const cc = await ccR.json();
          marketCap = cc?.RAW?.[sym]?.USD?.MKTCAP || 0;
        }
      } catch (_) {}

      const data = {
        ...dec,
        name: FULL_NAME[sym] || sym,
        symbol: sym,
        price, ch24, ch7d, volume, marketCap,
        image: `https://assets.coincap.io/assets/icons/${sym.toLowerCase()}@2x.png`,
      };

      cache.current[sym] = { data, ts: now };
      setResult(data);
      setLoading(false);
      callAI(data);
    } catch (e) {
      setError(e.message || "Failed to fetch. Check coin name.");
      setLoading(false);
    }
  };

  const callAI = async (d) => {
    setAiLoading(true);
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: d.name, symbol: d.symbol, price: d.price,
          rsi: d.rsi, ma50: d.ma50, ma200: d.ma200,
          ch24: d.ch24, ch7d: d.ch7d,
          decision: d.decision, confidence: d.confidence, risk: d.risk,
        }),
      });
      const j = await r.json();
      setAiText(j.text || "Analysis complete. Always DYOR.");
    } catch (_) {
      setAiText(
        "📊 Technical: Indicators calculated from real-time Binance data.\n⚠️ Risk Note: Crypto is highly volatile — never invest more than you can afford to lose."
      );
    }
    setAiLoading(false);
  };

  const lossRec = (() => {
    const p = parseFloat(lossAmt);
    if (!lossAmt || isNaN(p) || p <= 0 || p >= 100) return null;
    const req = (p / (100 - p)) * 100;
    return {
      req: req.toFixed(1),
      safe: `DCA every week for ${Math.ceil(req / 5)} weeks (~5% gain/week target)`,
      mod:  `Split: 40% now + 60% on next dip. Target ${(req * 0.75).toFixed(0)}% in ~30 days`,
      agg:  `Full position at support. Stop-loss at ${(p * 0.35).toFixed(1)}% below entry`,
    };
  })();

  const whatIf = (() => {
    const inv = parseFloat(investAmt);
    if (!investAmt || isNaN(inv) || inv <= 0 || !result) return null;
    return [
      { label: "+50%", mult: 1.5,  color: "#10b981" },
      { label: "+20%", mult: 1.2,  color: "#34d399" },
      { label: "+10%", mult: 1.1,  color: "#6ee7b7" },
      { label: "-10%", mult: 0.9,  color: "#fca5a5" },
      { label: "-20%", mult: 0.8,  color: "#ef4444" },
    ].map((r) => ({
      ...r,
      val: (inv * r.mult).toLocaleString(undefined, { maximumFractionDigits: 0 }),
    }));
  })();

  const dc   = result ? DECISION_CONFIG[result.decision] : null;
  const mood = result ? MOOD_CONFIG[result.mood] : null;

  return (
    <main style={{ fontFamily: "'Space Grotesk','Segoe UI',sans-serif", background: "#04080e", minHeight: "100vh", color: "#e2e8f0" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(rgba(16,185,129,.035) 1px,transparent 1px)", backgroundSize: "26px 26px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: -100, left: "50%", transform: "translateX(-50%)", width: 500, height: 280, background: "radial-gradient(ellipse,rgba(16,185,129,.08) 0%,transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "22px 16px 48px", position: "relative" }}>

        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981", animation: "blink 2s infinite" }} />
            <span className="mono" style={{ fontSize: 10, color: "#10b981", letterSpacing: 3 }}>LIVE · BINANCE DATA · AI POWERED</span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: -1.5, background: "linear-gradient(135deg,#f1f5f9 30%,#64748b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>
            CryptoMind AI
          </h1>
          <p className="mono" style={{ fontSize: 12, color: "#334155", marginTop: 6 }}>
            👉 Abhi kya karna chahiye? → BUY / SELL / HOLD / WAIT
          </p>
        </div>

        {/* SEARCH */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && analyze()}
            placeholder="Coin: BTC, ETH, SOL, APT, DOGE, SUI, XRP…"
            style={{ flex: 1, background: "#080f18", border: "1px solid #1a2f3e", borderRadius: 10, padding: "13px 16px", fontSize: 14, transition: "border-color .2s" }}
          />
          <button
            onClick={analyze}
            disabled={loading}
            style={{ background: loading ? "#0d1a24" : "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", borderRadius: 10, padding: "13px 22px", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap", fontFamily: "'Space Grotesk',sans-serif" }}
          >
            {loading ? "⟳" : "⚡ Analyze"}
          </button>
        </div>

        {/* CHIPS */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 22 }}>
          {["BTC", "ETH", "SOL", "APT", "BNB", "DOGE", "XRP", "SUI", "PEPE", "INJ"].map((c) => (
            <button key={c} onClick={() => setQuery(c)} className="mono"
              style={{ background: "#080f18", border: "1px solid #1a2f3e", color: "#334155", padding: "4px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.color = "#10b981"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1a2f3e"; e.currentTarget.style.color = "#334155"; }}
            >{c}</button>
          ))}
        </div>

        {error && (
          <div style={{ background: "#0e0505", border: "1px solid #450a0a", borderRadius: 10, padding: "12px 16px", color: "#f87171", marginBottom: 14, fontSize: 13 }} className="mono">
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "52px 0" }}>
            <div style={{ width: 36, height: 36, border: "2px solid #1a2f3e", borderTopColor: "#10b981", borderRadius: "50%", margin: "0 auto 14px", animation: "spin .9s linear infinite" }} />
            <p className="mono" style={{ color: "#334155", fontSize: 12 }}>Fetching from Binance…</p>
          </div>
        )}

        {result && !loading && (
          <div className="fadein">

            {/* Coin header */}
            <div style={{ background: "#080f18", border: "1px solid #1a2f3e", borderRadius: 12, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img src={result.image} alt="" onError={(e) => (e.target.style.display = "none")} style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid #1a2f3e" }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{result.name}</div>
                  <div className="mono" style={{ color: "#334155", fontSize: 11 }}>{result.symbol} · Binance Live</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{fmt(result.price)}</div>
                <div className="mono" style={{ fontSize: 12 }}>
                  <span style={{ color: result.ch24 >= 0 ? "#10b981" : "#f87171" }}>{result.ch24 >= 0 ? "▲" : "▼"}{Math.abs(result.ch24).toFixed(2)}% 24h</span>
                  {"  "}
                  <span style={{ color: result.ch7d >= 0 ? "#10b981" : "#f87171" }}>{result.ch7d >= 0 ? "▲" : "▼"}{Math.abs(result.ch7d).toFixed(2)}% 7d</span>
                </div>
              </div>
            </div>

            {/* BIG DECISION BOX */}
            <div style={{ background: dc.bg, border: `2px solid ${dc.border}`, borderRadius: 14, padding: "26px 20px", marginBottom: 10, textAlign: "center", boxShadow: dc.glow, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${dc.border},transparent)` }} />
              <div className="mono" style={{ fontSize: 10, color: "#334155", letterSpacing: 3, marginBottom: 10 }}>AI RECOMMENDATION</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: dc.text, letterSpacing: -2, lineHeight: 1 }}>{dc.label}</div>
              <div className="mono" style={{ fontSize: 14, color: "#475569", marginTop: 10 }}>
                Confidence: <strong style={{ color: "#e2e8f0" }}>{result.confidence}%</strong>
                {"  ·  "}
                Risk: <strong style={{ color: result.risk === "High" ? "#f87171" : result.risk === "Medium" ? "#fbbf24" : "#34d399" }}>{result.risk}</strong>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: 14 }}>
                {result.factors.slice(0, 4).map((f, i) => (
                  <span key={i} className="mono" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 20, padding: "3px 10px", fontSize: 10, color: "#64748b" }}>{f}</span>
                ))}
              </div>
            </div>

            {/* Indicators */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 10 }}>
              {[
                { label: "RSI (14)", val: result.rsi, sub: parseFloat(result.rsi) < 30 ? "🔥 Oversold" : parseFloat(result.rsi) > 70 ? "❗ Overbought" : "Neutral", sc: parseFloat(result.rsi) < 30 ? "#10b981" : parseFloat(result.rsi) > 70 ? "#f87171" : "#64748b" },
                { label: "MA 50",   val: result.ma50  !== "—" ? fmt(parseFloat(result.ma50))  : result.ma50,  sub: result.ma50  !== "—" && result.price > parseFloat(result.ma50)  ? "Price above ↑" : "Price below ↓", sc: result.ma50  !== "—" && result.price > parseFloat(result.ma50)  ? "#10b981" : "#f87171" },
                { label: "MA 200",  val: result.ma200 !== "—" ? fmt(parseFloat(result.ma200)) : result.ma200, sub: result.ma200 !== "—" && result.price > parseFloat(result.ma200) ? "Long-term bull ↑" : "Long-term bear ↓", sc: result.ma200 !== "—" && result.price > parseFloat(result.ma200) ? "#10b981" : "#f87171" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#080f18", border: "1px solid #1a2f3e", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: 10, color: "#334155", marginBottom: 4 }}>{s.label}</div>
                  <div className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: s.sc, marginTop: 3 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Health + Mood */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div style={{ background: "#080f18", border: "1px solid #1a2f3e", borderRadius: 10, padding: "14px" }}>
                <div className="mono" style={{ fontSize: 10, color: "#334155", marginBottom: 10, letterSpacing: 1 }}>COIN HEALTH</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: result.healthScore >= 80 ? "#10b981" : result.healthScore >= 50 ? "#fbbf24" : "#f87171" }}>{result.healthScore}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: result.healthScore >= 80 ? "#10b981" : result.healthScore >= 50 ? "#fbbf24" : "#f87171" }}>
                      {result.healthScore >= 80 ? "💪 Strong" : result.healthScore >= 50 ? "⚖️ Neutral" : "⚠️ Weak"}
                    </div>
                    <div style={{ width: 76, height: 4, background: "#1a2f3e", borderRadius: 2, marginTop: 5 }}>
                      <div style={{ width: `${result.healthScore}%`, height: "100%", background: result.healthScore >= 80 ? "#10b981" : result.healthScore >= 50 ? "#fbbf24" : "#f87171", borderRadius: 2, transition: "width .6s" }} />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ background: "#080f18", border: "1px solid #1a2f3e", borderRadius: 10, padding: "14px" }}>
                <div className="mono" style={{ fontSize: 10, color: "#334155", marginBottom: 8, letterSpacing: 1 }}>MARKET MOOD</div>
                <div style={{ fontSize: 28 }}>{mood.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: mood.color, marginTop: 2 }}>{result.mood}</div>
              </div>
            </div>

            {/* Entry / Exit / Stop */}
            <div style={{ background: "#080f18", border: "1px solid #1a2f3e", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
              <div className="mono" style={{ fontSize: 10, color: "#334155", marginBottom: 12, letterSpacing: 1 }}>SMART ENTRY / EXIT ZONES</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#10b981", marginBottom: 6 }}>📥 ENTRY</div>
                  <div className="mono" style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>{fmt(result.entryLow)}</div>
                  <div style={{ fontSize: 10, color: "#334155", margin: "2px 0" }}>–</div>
                  <div className="mono" style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>{fmt(result.entryHigh)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#fbbf24", marginBottom: 6 }}>📤 EXIT TARGET</div>
                  <div className="mono" style={{ fontSize: 15, color: "#fbbf24", fontWeight: 700 }}>{fmt(result.exitTarget)}</div>
                  <div className="mono" style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>+{(((result.exitTarget / result.price) - 1) * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#f87171", marginBottom: 6 }}>🛑 STOP LOSS</div>
                  <div className="mono" style={{ fontSize: 15, color: "#f87171", fontWeight: 700 }}>{fmt(result.stopLoss)}</div>
                  <div className="mono" style={{ fontSize: 10, color: "#334155", marginTop: 4 }}>−6%</div>
                </div>
              </div>
            </div>

            {/* ✅ YES YOU PRO AI ANALYSIS BOX */}
            <div style={{ background: "#04080e", border: "1px solid #10b98130", borderRadius: 10, padding: "14px 16px", marginBottom: 10, position: "relative", overflow: "hidden" }}>
              {/* top shimmer line */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,#10b981,transparent)" }} />

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {/* YYP Badge */}
                <div style={{ background: "linear-gradient(135deg,#10b981,#059669)", borderRadius: 6, padding: "2px 8px", fontWeight: 800, fontSize: 11, color: "#fff", fontFamily: "'Space Grotesk',sans-serif", letterSpacing: 0.5, flexShrink: 0 }}>
                  YYP
                </div>
                <span className="mono" style={{ fontSize: 10, color: "#10b981", letterSpacing: 2 }}>
                  YES YOU PRO AI ANALYSIS
                </span>
                {aiLoading && (
                  <div style={{ display: "flex", gap: 3, marginLeft: "auto" }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#10b981", animation: `blink 1.2s ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                )}
              </div>

              {aiText
                ? <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.65, whiteSpace: "pre-line" }}>{aiText}</p>
                : <div style={{ height: 40, background: "#080f18", borderRadius: 6, animation: "shimmer 1.5s infinite" }} />
              }

              <div className="mono" style={{ fontSize: 9, color: "#1e3a4a", marginTop: 10, textAlign: "right" }}>
                Powered by YesYouPro · yesyoupro.com
              </div>
            </div>

            {/* Market stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                { l: "24h Volume (USDT)", v: fmtBig(result.volume) },
                { l: "Market Cap",        v: result.marketCap > 0 ? fmtBig(result.marketCap) : "—" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#080f18", border: "1px solid #1a2f3e", borderRadius: 10, padding: "12px 14px" }}>
                  <div className="mono" style={{ fontSize: 10, color: "#334155", marginBottom: 4 }}>{s.l}</div>
                  <div className="mono" style={{ fontSize: 15, fontWeight: 600 }}>{s.v}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: "1px solid #1a2f3e", margin: "4px 0 14px", position: "relative" }}>
              <span className="mono" style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", background: "#04080e", padding: "0 14px", fontSize: 10, color: "#1e3a4a" }}>TOOLS</span>
            </div>

            {/* What-If */}
            <div style={{ background: "#080f18", border: "1px solid #1a2f3e", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
              <div className="mono" style={{ fontSize: 10, color: "#334155", marginBottom: 10, letterSpacing: 1 }}>💡 WHAT-IF SIMULATOR</div>
              <input value={investAmt} onChange={(e) => setInvestAmt(e.target.value)} placeholder="Investment amount in $ (e.g. 500)" type="number"
                style={{ width: "100%", background: "#04080e", border: "1px solid #1a2f3e", borderRadius: 8, padding: "9px 12px", fontSize: 13, marginBottom: 10, transition: "border-color .2s" }} />
              {whatIf && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
                  {whatIf.map((r, i) => (
                    <div key={i} style={{ background: "#04080e", borderRadius: 8, padding: "8px 4px", textAlign: "center", border: `1px solid ${i < 3 ? "#10b98120" : "#ef444420"}` }}>
                      <div className="mono" style={{ fontSize: 11, color: r.color, fontWeight: 600 }}>{r.label}</div>
                      <div className="mono" style={{ fontSize: 11, color: "#e2e8f0", marginTop: 3 }}>${r.val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Loss Recovery */}
            <div style={{ background: "#080f18", border: "1px solid #1a2f3e", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
              <div className="mono" style={{ fontSize: 10, color: "#334155", marginBottom: 10, letterSpacing: 1 }}>🩹 LOSS RECOVERY PLANNER</div>
              <input value={lossAmt} onChange={(e) => setLossAmt(e.target.value)} placeholder="Your loss % (e.g. 30 = lost 30%)" type="number" min="1" max="99"
                style={{ width: "100%", background: "#04080e", border: "1px solid #1a2f3e", borderRadius: 8, padding: "9px 12px", fontSize: 13, marginBottom: 10, transition: "border-color .2s" }} />
              {lossRec && (
                <div>
                  <div style={{ background: "#0e0308", border: "1px solid #4c0519", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                    <span className="mono" style={{ fontSize: 12, color: "#f87171" }}>
                      Lost {lossAmt}%? → Need <strong style={{ color: "#fca5a5" }}>{lossRec.req}% gain</strong> to break even
                    </span>
                  </div>
                  {[
                    { icon: "🐢", name: "Safe",       plan: lossRec.safe, c: "#10b981" },
                    { icon: "⚖️", name: "Moderate",   plan: lossRec.mod,  c: "#fbbf24" },
                    { icon: "🎲", name: "Aggressive",  plan: lossRec.agg,  c: "#f87171" },
                  ].map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{p.icon}</span>
                      <div>
                        <span className="mono" style={{ fontSize: 11, color: p.c, fontWeight: 600 }}>{p.name}: </span>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{p.plan}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mono" style={{ background: "#04080e", border: "1px solid #0f1e26", borderRadius: 8, padding: "10px 14px", fontSize: 10, color: "#1e3a4a", textAlign: "center", lineHeight: 1.6 }}>
          ⚠️ AI-based analysis only — not financial advice. Crypto is highly volatile. Always DYOR.<br />
          Data: Binance (real-time) · Indicators: RSI(14) · MA50 · MA200 · YesYouPro AI
        </div>

      </div>
    </main>
  );
}
