import { NextResponse } from "next/server";

// MUST be dynamic — never static generate this route
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ── INDICATORS ────────────────────────────────────────────────────────────────
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
  if (al === 0) return 100;
  return 100 - 100 / (1 + ag / al);
}

function calcMA(prices, n) {
  if (prices.length < n) return null;
  return prices.slice(-n).reduce((a, b) => a + b, 0) / n;
}

function scoreCoin({ rsi, price, ma50, ma200, ch24, ch7d }) {
  let score = 50;
  if (rsi !== null) {
    if      (rsi < 30) score += 22;
    else if (rsi < 45) score += 12;
    else if (rsi > 70) score -= 18;
    else if (rsi > 60) score -= 8;
  }
  if (ma50  !== null) score += price > ma50  ? 12 : -12;
  if (ma200 !== null) score += price > ma200 ? 10 : -10;
  if (ch24 > 3)    score += 5;
  else if (ch24 < -4) score -= 8;
  if (ch7d > 8)    score += 6;
  else if (ch7d < -12) score -= 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

const fmt = (n) =>
  n >= 1
    ? "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "$" + n.toPrecision(4);

const SCAN_LIST = [
  "BTC","ETH","SOL","BNB","XRP","ADA","AVAX","DOT","LINK","MATIC",
  "APT","SUI","INJ","ARB","OP","NEAR","ATOM","UNI","LTC","DOGE",
  "TRX","TON","AAVE","MKR","FTM",
];

const FULL_NAME = {
  BTC:"Bitcoin",ETH:"Ethereum",SOL:"Solana",BNB:"BNB",XRP:"XRP",
  ADA:"Cardano",AVAX:"Avalanche",DOT:"Polkadot",LINK:"Chainlink",MATIC:"Polygon",
  APT:"Aptos",SUI:"Sui",INJ:"Injective",ARB:"Arbitrum",OP:"Optimism",
  NEAR:"NEAR",ATOM:"Cosmos",UNI:"Uniswap",LTC:"Litecoin",DOGE:"Dogecoin",
  TRX:"TRON",TON:"Toncoin",AAVE:"Aave",MKR:"Maker",FTM:"Fantom",
};

// 10-minute cache
let cache = { data: null, ts: 0 };

export async function GET() {
  const now = Date.now();
  if (cache.data && now - cache.ts < 10 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  try {
    // Fetch all 24h tickers
    const tickRes = await fetch("https://api.binance.com/api/v3/ticker/24hr", {
      headers: { "Accept": "application/json" },
    });

    if (!tickRes.ok) {
      // Return empty gracefully — do NOT throw
      return NextResponse.json({ coins: [], updatedAt: new Date().toISOString() });
    }

    const allTickers = await tickRes.json();

    // Build map
    const tickerMap = {};
    for (const t of allTickers) {
      if (t.symbol.endsWith("USDT")) {
        tickerMap[t.symbol.replace("USDT", "")] = t;
      }
    }

    // Fetch klines for scan list in parallel
    const klineResults = await Promise.allSettled(
      SCAN_LIST.map((sym) =>
        fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=1d&limit=210`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [])
      )
    );

    const scored = [];

    for (let i = 0; i < SCAN_LIST.length; i++) {
      const sym    = SCAN_LIST[i];
      const ticker = tickerMap[sym];
      if (!ticker) continue;

      const klines = klineResults[i].status === "fulfilled" ? klineResults[i].value : [];
      const closes = Array.isArray(klines) ? klines.map((k) => parseFloat(k[4])) : [];

      const price = parseFloat(ticker.lastPrice);
      const ch24  = parseFloat(ticker.priceChangePercent);
      const vol   = parseFloat(ticker.quoteVolume);

      const ch7d = closes.length >= 8
        ? ((closes[closes.length - 1] - closes[closes.length - 8]) / closes[closes.length - 8]) * 100
        : ch24;

      const rsi   = closes.length > 15  ? calcRSI(closes)     : null;
      const ma50  = closes.length >= 50  ? calcMA(closes, 50)  : null;
      const ma200 = closes.length >= 200 ? calcMA(closes, 200) : null;

      const score = scoreCoin({ rsi, price, ma50, ma200, ch24, ch7d });
      if (score < 55) continue;

      const risk = Math.abs(ch7d) > 20 ? "High" : Math.abs(ch7d) > 10 ? "Medium" : "Low";

      scored.push({
        symbol: sym,
        name:   FULL_NAME[sym] || sym,
        price:  fmt(price),
        ch24:   ch24.toFixed(2),
        ch7d:   ch7d.toFixed(2),
        score,
        risk,
        rsi:    rsi ? rsi.toFixed(1) : "—",
        volume: vol,
        image:  `https://assets.coincap.io/assets/icons/${sym.toLowerCase()}@2x.png`,
        signal:      score >= 72 ? "STRONG BUY" : score >= 62 ? "BUY" : "WATCH",
        signalColor: score >= 72 ? "#059669"     : score >= 62 ? "#10b981" : "#d97706",
        signalBg:    score >= 72 ? "#ecfdf5"     : score >= 62 ? "#f0fdf4" : "#fffbeb",
      });
    }

    scored.sort((a, b) => b.score - a.score);
    const top5 = scored.slice(0, 5);
    const result = { coins: top5, updatedAt: new Date().toISOString() };

    cache = { data: result, ts: now };
    return NextResponse.json(result);

  } catch (err) {
    console.error("Top5 error:", err);
    // Always return valid JSON — never crash build
    return NextResponse.json({ coins: [], updatedAt: new Date().toISOString() });
  }
}
