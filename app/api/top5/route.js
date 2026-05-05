import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function calcRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;
  let ag = 0, al = 0;
  for (let i = 1; i <= period; i++) {
    const d = prices[i] - prices[i - 1];
    if (d > 0) ag += d; else al += Math.abs(d);
  }
  ag /= period; al /= period;
  for (let i = period + 1; i < prices.length; i++) {
    const d = prices[i] - prices[i - 1];
    ag = (ag * (period - 1) + (d > 0 ? d : 0)) / period;
    al = (al * (period - 1) + (d < 0 ? Math.abs(d) : 0)) / period;
  }
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
}

function calcMA(prices, n) {
  if (prices.length < n) return null;
  return prices.slice(-n).reduce((a, b) => a + b, 0) / n;
}

// ── STRICT SMART SCORING ──────────────────────────────────────────────────────
// Coin tabhi qualify karega jab genuinely strong buy signal ho
function smartScore({ rsi, price, ma50, ma200, ch24, ch7d }) {
  let score = 50;

  // RSI — sabse important
  if (rsi !== null) {
    const r = parseFloat(rsi);
    if      (r < 25) score += 30;  // Heavily oversold — best buy
    else if (r < 35) score += 20;  // Oversold — good buy
    else if (r < 45) score += 10;  // Below neutral — ok
    else if (r > 75) score -= 30;  // Overbought — avoid
    else if (r > 65) score -= 15;  // Getting overbought
  }

  // Trend confirmation
  if (ma50  !== null) score += price > ma50  ? 15 : -10;
  if (ma200 !== null) score += price > ma200 ? 12 : -5;

  // 24h — already pumped coins ko penalize karo
  if      (ch24 > 20)  score -= 25; // Already pumped — late entry
  else if (ch24 > 10)  score -= 15; // Pumping — risky
  else if (ch24 > 5)   score -= 5;  // Slight pump
  else if (ch24 >= -5) score += 8;  // Stable — good
  else if (ch24 < -10) score += 5;  // Dip — possible bounce

  // 7d trend
  if      (ch7d > 40)  score -= 20; // Weekly pump — avoid
  else if (ch7d > 20)  score -= 10; // Already ran
  else if (ch7d >= -5) score += 5;  // Healthy
  else if (ch7d < -15) score += 8;  // Weekly dip — opportunity

  return Math.max(0, Math.min(100, Math.round(score)));
}

const fmt = (n) =>
  n >= 1
    ? "$" + n.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })
    : "$" + n.toPrecision(4);

const SCAN_LIST = [
  "BTC","ETH","SOL","BNB","XRP","ADA","AVAX","DOT","LINK","MATIC",
  "APT","SUI","INJ","ARB","OP","NEAR","ATOM","UNI","LTC","DOGE",
  "TRX","TON","AAVE","FTM","ALGO",
];

const FULL_NAME = {
  BTC:"Bitcoin",ETH:"Ethereum",SOL:"Solana",BNB:"BNB",XRP:"XRP",
  ADA:"Cardano",AVAX:"Avalanche",DOT:"Polkadot",LINK:"Chainlink",MATIC:"Polygon",
  APT:"Aptos",SUI:"Sui",INJ:"Injective",ARB:"Arbitrum",OP:"Optimism",
  NEAR:"NEAR",ATOM:"Cosmos",UNI:"Uniswap",LTC:"Litecoin",DOGE:"Dogecoin",
  TRX:"TRON",TON:"Toncoin",AAVE:"Aave",FTM:"Fantom",ALGO:"Algorand",
};

// ── MINIMUM SCORE TO QUALIFY ──────────────────────────────────────────────────
// Sirf 65+ score wale coins dikhao — strict quality filter
const MIN_SCORE = 65;

let cache = { data: null, ts: 0 };

export async function GET() {
  const now = Date.now();
  if (cache.data && now - cache.ts < 10 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  try {
    const tickRes = await fetch("https://api.binance.com/api/v3/ticker/24hr");
    if (!tickRes.ok) {
      return NextResponse.json({ coins:[], message:"no_signal", updatedAt: new Date().toISOString() });
    }

    const allTickers = await tickRes.json();
    const tickerMap = {};
    for (const t of allTickers) {
      if (t.symbol.endsWith("USDT")) {
        tickerMap[t.symbol.replace("USDT","")] = t;
      }
    }

    const klineResults = await Promise.allSettled(
      SCAN_LIST.map(sym =>
        fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=1d&limit=210`)
          .then(r => r.ok ? r.json() : [])
          .catch(() => [])
      )
    );

    const scored = [];

    for (let i = 0; i < SCAN_LIST.length; i++) {
      const sym    = SCAN_LIST[i];
      const ticker = tickerMap[sym];
      if (!ticker) continue;

      const klines = klineResults[i].status === "fulfilled" ? klineResults[i].value : [];
      const closes = Array.isArray(klines) ? klines.map(k => parseFloat(k[4])) : [];

      const price = parseFloat(ticker.lastPrice);
      const ch24  = parseFloat(ticker.priceChangePercent);
      const vol   = parseFloat(ticker.quoteVolume);

      const ch7d = closes.length >= 8
        ? ((closes[closes.length-1] - closes[closes.length-8]) / closes[closes.length-8]) * 100
        : ch24;

      const rsi   = closes.length > 15  ? calcRSI(closes)    : null;
      const ma50  = closes.length >= 50  ? calcMA(closes, 50) : null;
      const ma200 = closes.length >= 200 ? calcMA(closes,200) : null;

      const score = smartScore({ rsi, price, ma50, ma200, ch24, ch7d });

      // STRICT FILTER — only genuinely good signals
      if (score < MIN_SCORE) continue;

      // Extra safety — avoid coins already pumped >15% in 24h
      if (ch24 > 15) continue;

      // Avoid extremely low RSI crash coins (below 20 = possible dump)
      if (rsi !== null && rsi < 18) continue;

      const risk = score >= 78 ? "Low" : score >= 68 ? "Medium" : "High";

      scored.push({
        symbol: sym,
        name:   FULL_NAME[sym] || sym,
        price:  fmt(price),
        ch24:   ch24.toFixed(2),
        ch7d:   ch7d.toFixed(2),
        score,
        risk,
        rsi:   rsi ? rsi.toFixed(1) : "—",
        volume: vol,
        image: `https://assets.coincap.io/assets/icons/${sym.toLowerCase()}@2x.png`,
        signal:      score >= 78 ? "STRONG BUY" : "BUY",
        signalColor: score >= 78 ? "#059669"     : "#10b981",
        signalBg:    score >= 78 ? "#ecfdf5"     : "#f0fdf4",
        // Why this coin
        reason: score >= 78
          ? `RSI ${rsi?.toFixed(0)||"—"} (oversold) + MA50/MA200 support — strong setup`
          : `RSI ${rsi?.toFixed(0)||"—"} + positive trend — moderate buy signal`,
      });
    }

    // Sort by score — best first
    scored.sort((a, b) => b.score - a.score);

    // Max 5 coins — but only if they passed strict filter
    const top = scored.slice(0, 5);

    const result = {
      coins: top,
      // Message for UI — honest communication
      message: top.length === 0
        ? "no_signal"
        : top.length < 3
        ? "few_signals"
        : "normal",
      updatedAt: new Date().toISOString(),
    };

    cache = { data: result, ts: now };
    return NextResponse.json(result);

  } catch (err) {
    console.error("Top5 error:", err);
    return NextResponse.json({ coins:[], message:"error", updatedAt: new Date().toISOString() });
  }
}
