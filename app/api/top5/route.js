import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ── INDICATORS ────────────────────────────────────────────────────────────────
function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let ag = 0, al = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i-1];
    d > 0 ? ag += d : al += Math.abs(d);
  }
  ag /= period; al /= period;
  for (let i = period+1; i < closes.length; i++) {
    const d = closes[i] - closes[i-1];
    ag = (ag*(period-1) + (d>0?d:0)) / period;
    al = (al*(period-1) + (d<0?Math.abs(d):0)) / period;
  }
  return al === 0 ? 100 : 100 - 100/(1+ag/al);
}

function calcEMA(closes, period) {
  if (closes.length < period) return null;
  const k = 2/(period+1);
  let ema = closes.slice(0, period).reduce((a,b)=>a+b,0)/period;
  for (let i = period; i < closes.length; i++) ema = closes[i]*k + ema*(1-k);
  return ema;
}

function calcMA(closes, n) {
  if (closes.length < n) return null;
  return closes.slice(-n).reduce((a,b)=>a+b,0)/n;
}

function calcMACD(closes) {
  if (closes.length < 26) return null;
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  if (!ema12||!ema26) return null;
  const macdLine = ema12 - ema26;
  // Signal line = 9 EMA of MACD
  const macdValues = [];
  for (let i = 25; i < closes.length; i++) {
    const e12 = calcEMA(closes.slice(0, i+1), 12);
    const e26 = calcEMA(closes.slice(0, i+1), 26);
    if (e12&&e26) macdValues.push(e12-e26);
  }
  const signal = macdValues.length >= 9 ? calcEMA(macdValues, 9) : null;
  const histogram = signal ? macdLine - signal : null;
  return { macdLine, signal, histogram };
}

function calcBollingerBands(closes, period=20, mult=2) {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  const mid   = slice.reduce((a,b)=>a+b,0)/period;
  const std   = Math.sqrt(slice.reduce((s,v)=>s+Math.pow(v-mid,2),0)/period);
  return { upper: mid+mult*std, mid, lower: mid-mult*std, std, bandwidth: (mult*2*std)/mid*100 };
}

function calcATR(highs, lows, closes, period=14) {
  if (closes.length < period+1) return null;
  const trs = [];
  for (let i = 1; i < closes.length; i++) {
    trs.push(Math.max(
      highs[i]-lows[i],
      Math.abs(highs[i]-closes[i-1]),
      Math.abs(lows[i]-closes[i-1])
    ));
  }
  return trs.slice(-period).reduce((a,b)=>a+b,0)/period;
}

function detectSupportResistance(closes, period=20) {
  const slice = closes.slice(-period);
  const sorted = [...slice].sort((a,b)=>a-b);
  const support    = sorted[Math.floor(period*0.15)]; // 15th percentile
  const resistance = sorted[Math.floor(period*0.85)]; // 85th percentile
  return { support, resistance };
}

function calcVolumeScore(volumes) {
  if (volumes.length < 10) return 0;
  const recent  = volumes.slice(-3).reduce((a,b)=>a+b,0)/3;
  const average = volumes.slice(-20,-3).reduce((a,b)=>a+b,0)/17;
  const ratio   = recent/average;
  if (ratio > 2.5) return 30;  // Huge volume spike
  if (ratio > 1.8) return 20;  // Strong volume
  if (ratio > 1.3) return 10;  // Moderate volume
  if (ratio < 0.5) return -10; // Very low volume
  return 0;
}

// ── MASTER SCORING FUNCTION ───────────────────────────────────────────────────
function masterScore(data) {
  const { closes, highs, lows, volumes, price, ch24, ch7d } = data;
  let score = 0;
  let signals = [];
  let warnings = [];
  let confluenceCount = 0;

  // ── 1. RSI ──────────────────────────────────────────────────────────────
  const rsi = calcRSI(closes);
  if (rsi !== null) {
    if (rsi < 25) { score += 28; confluenceCount++; signals.push(`RSI ${rsi.toFixed(0)} — Heavily oversold 🔥`); }
    else if (rsi < 35) { score += 20; confluenceCount++; signals.push(`RSI ${rsi.toFixed(0)} — Oversold zone`); }
    else if (rsi < 45) { score += 10; signals.push(`RSI ${rsi.toFixed(0)} — Below neutral`); }
    else if (rsi > 78) { score -= 30; warnings.push(`RSI ${rsi.toFixed(0)} — Overbought, don't chase`); }
    else if (rsi > 68) { score -= 15; warnings.push(`RSI ${rsi.toFixed(0)} — Getting overbought`); }
  }

  // ── 2. MACD ──────────────────────────────────────────────────────────────
  const macd = calcMACD(closes);
  if (macd) {
    if (macd.histogram > 0 && macd.macdLine < 0) {
      score += 22; confluenceCount++; signals.push("MACD bullish crossover below zero 💚");
    } else if (macd.histogram > 0 && macd.macdLine > 0) {
      score += 12; signals.push("MACD positive momentum");
    } else if (macd.histogram < 0 && macd.histogram > -0.01 * price) {
      score += 8; signals.push("MACD bearish momentum slowing");
    } else if (macd.histogram < -0.02 * price) {
      score -= 20; warnings.push("MACD strong bearish momentum");
    }
  }

  // ── 3. BOLLINGER BANDS ───────────────────────────────────────────────────
  const bb = calcBollingerBands(closes);
  if (bb) {
    const bbPos = (price - bb.lower) / (bb.upper - bb.lower);
    if (price < bb.lower) {
      score += 25; confluenceCount++; signals.push("Price below BB lower — oversold breakout zone 🎯");
    } else if (bbPos < 0.2) {
      score += 15; confluenceCount++; signals.push("Near BB lower band — strong buy zone");
    } else if (bbPos > 0.85) {
      score -= 20; warnings.push("Near BB upper — overbought");
    }
    if (bb.bandwidth < 3) {
      score += 10; signals.push("BB squeeze — big move incoming ⚡");
    }
  }

  // ── 4. MOVING AVERAGES ───────────────────────────────────────────────────
  const ma20  = calcMA(closes, 20);
  const ma50  = calcMA(closes, 50);
  const ma200 = calcMA(closes, 200);

  if (ma50) {
    if (price > ma50) { score += 12; signals.push("Above MA50 — uptrend"); }
    else if (price < ma50*0.92) { score += 8; signals.push("Well below MA50 — deep discount"); }
    else { score -= 5; }
  }
  if (ma200) {
    if (price > ma200) { score += 10; confluenceCount++; signals.push("Above MA200 — long-term bull"); }
    else { score -= 3; }
  }
  // Golden cross potential
  if (ma20 && ma50 && ma20 > ma50 * 0.99 && ma20 < ma50 * 1.01) {
    score += 8; signals.push("MA20 near MA50 — golden cross possible");
  }

  // ── 5. VOLUME ANALYSIS ───────────────────────────────────────────────────
  const volScore = calcVolumeScore(volumes);
  if (volScore > 0) { confluenceCount++; }
  score += volScore;
  if (volScore >= 20) signals.push("Volume surge — smart money entering 🐋");
  else if (volScore >= 10) signals.push("Above-average volume");

  // ── 6. PRICE ACTION ──────────────────────────────────────────────────────
  if (ch24 >= -3 && ch24 <= 5) { score += 8; }
  else if (ch24 > 20) { score -= 25; warnings.push(`Already +${ch24.toFixed(0)}% today — don't chase`); }
  else if (ch24 > 12) { score -= 15; warnings.push(`Up ${ch24.toFixed(0)}% — late entry risk`); }
  else if (ch24 < -12) { score += 6; signals.push("Sharp dip — potential bounce"); }

  if (ch7d >= -8 && ch7d <= 10) { score += 5; }
  else if (ch7d > 35) { score -= 20; warnings.push(`+${ch7d.toFixed(0)}% this week — overextended`); }
  else if (ch7d < -20) { score += 8; confluenceCount++; signals.push("Weekly dip — accumulation opportunity"); }

  // ── 7. SUPPORT/RESISTANCE ────────────────────────────────────────────────
  const sr = detectSupportResistance(closes);
  if (price < sr.support * 1.03) {
    score += 15; confluenceCount++; signals.push("Near strong support zone 🛡️");
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    confluenceCount,
    signals: signals.slice(0, 4),
    warnings: warnings.slice(0, 2),
    rsi: rsi ? rsi.toFixed(1) : "—",
    macd,
    bb,
    atr: calcATR(highs||[], lows||[], closes),
    ma50, ma200,
    support: sr.support,
    resistance: sr.resistance,
  };
}

// ── SMART TP/SL CALCULATOR ────────────────────────────────────────────────────
function calcTPSL(price, atr, bb, support, resistance, rsi) {
  const atrVal = atr || price * 0.025;

  // Entry zone
  const entryLow  = Math.max(support * 0.99, price * 0.99);
  const entryHigh = price * 1.005;

  // Stop Loss — below support or 1.5x ATR
  const slByATR     = price - atrVal * 1.5;
  const slBySupport = support ? support * 0.97 : price * 0.93;
  const stopLoss    = Math.max(slByATR, slBySupport, price * 0.92); // max 8% loss

  // TP1 — 1:1.5 risk reward minimum
  const risk = price - stopLoss;
  const tp1  = price + risk * 1.5;
  const tp2  = bb ? Math.min(bb.upper * 0.98, price + risk * 2.5) : price + risk * 2.5;
  const tp3  = resistance ? Math.min(resistance * 0.99, price + risk * 4) : price + risk * 4;

  const slPct  = (((stopLoss-price)/price)*100).toFixed(1);
  const tp1Pct = (((tp1-price)/price)*100).toFixed(1);
  const tp2Pct = (((tp2-price)/price)*100).toFixed(1);
  const tp3Pct = (((tp3-price)/price)*100).toFixed(1);
  const rrRatio = (risk > 0 ? (tp2-price)/risk : 0).toFixed(1);

  return { entryLow, entryHigh, stopLoss, tp1, tp2, tp3, slPct, tp1Pct, tp2Pct, tp3Pct, rrRatio };
}

const fmt = (n) => n >= 1
  ? "$"+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})
  : "$"+n.toPrecision(4);

const FULL_NAME = {
  BTC:"Bitcoin",ETH:"Ethereum",SOL:"Solana",BNB:"BNB",XRP:"XRP",ADA:"Cardano",
  AVAX:"Avalanche",DOT:"Polkadot",LINK:"Chainlink",MATIC:"Polygon",APT:"Aptos",
  SUI:"Sui",INJ:"Injective",ARB:"Arbitrum",OP:"Optimism",NEAR:"NEAR",ATOM:"Cosmos",
  UNI:"Uniswap",LTC:"Litecoin",DOGE:"Dogecoin",TRX:"TRON",TON:"Toncoin",AAVE:"Aave",
  FTM:"Fantom",ALGO:"Algorand",VET:"VeChain",EOS:"EOS",XLM:"Stellar",THETA:"Theta",
  FIL:"Filecoin",HBAR:"Hedera",EGLD:"MultiversX",FLOW:"Flow",AXS:"Axie Infinity",
  GRT:"The Graph",SAND:"The Sandbox",MANA:"Decentraland",CHZ:"Chiliz",ENJ:"Enjin",
  ROSE:"Oasis",ZIL:"Zilliqa",ONE:"Harmony",HOT:"Holo",IOTA:"IOTA",QTUM:"Qtum",
  ZEC:"Zcash",XMR:"Monero",DASH:"Dash",ETC:"Ethereum Classic",BCH:"Bitcoin Cash",
};

// Top 300 coins by volume from Binance
async function getTopCoinsByVolume() {
  const r = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  if (!r.ok) throw new Error("Binance failed");
  const all = await r.json();
  return all
    .filter(t => t.symbol.endsWith("USDT") && parseFloat(t.quoteVolume) > 5_000_000)
    .sort((a,b) => parseFloat(b.quoteVolume)-parseFloat(a.quoteVolume))
    .slice(0, 120) // Top 120 by volume
    .map(t => ({ sym: t.symbol.replace("USDT",""), ticker: t }));
}

let cache = { data: null, ts: 0 };

export async function GET() {
  const now = Date.now();
  if (cache.data && now - cache.ts < 10*60*1000) {
    return NextResponse.json(cache.data);
  }

  try {
    const topCoins = await getTopCoinsByVolume();
    
    // Fetch daily klines for all coins in parallel
    const klineResults = await Promise.allSettled(
      topCoins.map(({ sym }) =>
        fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=1d&limit=210`)
          .then(r => r.ok ? r.json() : [])
          .catch(() => [])
      )
    );

    const scored = [];

    for (let i = 0; i < topCoins.length; i++) {
      const { sym, ticker } = topCoins[i];
      const klines = klineResults[i].status === "fulfilled" ? klineResults[i].value : [];
      if (!Array.isArray(klines) || klines.length < 50) continue;

      const closes  = klines.map(k => parseFloat(k[4]));
      const highs   = klines.map(k => parseFloat(k[2]));
      const lows    = klines.map(k => parseFloat(k[3]));
      const volumes = klines.map(k => parseFloat(k[5]));

      const price  = parseFloat(ticker.lastPrice);
      const ch24   = parseFloat(ticker.priceChangePercent);
      const vol24  = parseFloat(ticker.quoteVolume);

      const ch7d = closes.length >= 8
        ? ((closes[closes.length-1] - closes[closes.length-8]) / closes[closes.length-8]) * 100
        : ch24;

      const analysis = masterScore({ closes, highs, lows, volumes, price, ch24, ch7d });

      // STRICT FILTERS — minimum requirements for signal
      if (analysis.score < 62) continue;           // Must score 62+
      if (analysis.confluenceCount < 3) continue;  // Min 3 indicators agree
      if (ch24 > 15) continue;                     // Not already pumped
      if (analysis.rsi !== "—" && parseFloat(analysis.rsi) > 72) continue; // Not overbought

      const tpsl = calcTPSL(price, analysis.atr, analysis.bb, analysis.support, analysis.ma50, parseFloat(analysis.rsi||50));

      // Risk/Reward must be at least 1.5
      if (parseFloat(tpsl.rrRatio) < 1.5) continue;

      const risk = analysis.score >= 80 ? "Low" : analysis.score >= 70 ? "Medium" : "High";
      const signalLabel = analysis.score >= 80 ? "STRONG BUY" : analysis.score >= 70 ? "BUY" : "WATCH";

      scored.push({
        symbol: sym,
        name:   FULL_NAME[sym] || sym,
        price:  fmt(price),
        rawPrice: price,
        ch24:   ch24.toFixed(2),
        ch7d:   ch7d.toFixed(2),
        score:  analysis.score,
        confluenceCount: analysis.confluenceCount,
        risk,
        rsi:    analysis.rsi,
        signals: analysis.signals,
        warnings: analysis.warnings,
        volume: vol24,
        image: `https://assets.coincap.io/assets/icons/${sym.toLowerCase()}@2x.png`,
        signal: signalLabel,
        signalColor: analysis.score>=80?"#059669":analysis.score>=70?"#10b981":"#d97706",
        signalBg:    analysis.score>=80?"#ecfdf5":analysis.score>=70?"#f0fdf4":"#fffbeb",
        // TP/SL data
        entry:   `${fmt(tpsl.entryLow)} – ${fmt(tpsl.entryHigh)}`,
        stopLoss: fmt(tpsl.stopLoss),
        tp1:     fmt(tpsl.tp1),
        tp2:     fmt(tpsl.tp2),
        tp3:     fmt(tpsl.tp3),
        slPct:   tpsl.slPct,
        tp1Pct:  tpsl.tp1Pct,
        tp2Pct:  tpsl.tp2Pct,
        tp3Pct:  tpsl.tp3Pct,
        rrRatio: tpsl.rrRatio,
      });
    }

    // Sort by score → take top 5
    scored.sort((a,b) => b.score - a.score);
    const top = scored.slice(0, 5);

    const result = {
      coins: top,
      scanned: topCoins.length,
      qualified: scored.length,
      message: top.length === 0 ? "no_signal" : top.length < 3 ? "few_signals" : "normal",
      updatedAt: new Date().toISOString(),
    };

    cache = { data: result, ts: now };
    return NextResponse.json(result);

  } catch (err) {
    console.error("Top5 error:", err);
    return NextResponse.json({ coins:[], message:"error", scanned:0, qualified:0, updatedAt: new Date().toISOString() });
  }
}
