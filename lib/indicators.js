export function calcRSI(prices, period = 14) {
  if (prices.length < period + 1) return null;
  let ag = 0,
    al = 0;
  for (let i = 1; i <= period; i++) {
    const d = prices[i] - prices[i - 1];
    if (d > 0) ag += d;
    else al += Math.abs(d);
  }
  ag /= period;
  al /= period;
  for (let i = period + 1; i < prices.length; i++) {
    const d = prices[i] - prices[i - 1];
    ag = (ag * (period - 1) + (d > 0 ? d : 0)) / period;
    al = (al * (period - 1) + (d < 0 ? Math.abs(d) : 0)) / period;
  }
  if (al === 0) return 100;
  return 100 - 100 / (1 + ag / al);
}

export function calcMA(prices, n) {
  if (prices.length < n) return null;
  return prices.slice(-n).reduce((a, b) => a + b, 0) / n;
}

export function buildDecision({ rsi, price, ma50, ma200, ch24, ch7d }) {
  let score = 50;
  const factors = [];

  if (rsi !== null) {
    if (rsi < 30)      { score += 22; factors.push(`RSI oversold (${rsi.toFixed(1)})`); }
    else if (rsi < 45) { score += 10; factors.push(`RSI leaning bullish (${rsi.toFixed(1)})`); }
    else if (rsi > 70) { score -= 22; factors.push(`RSI overbought (${rsi.toFixed(1)})`); }
    else if (rsi > 58) { score -= 8;  factors.push(`RSI slightly elevated (${rsi.toFixed(1)})`); }
    else               {              factors.push(`RSI neutral (${rsi.toFixed(1)})`); }
  }

  if (ma50 !== null) {
    if (price > ma50) { score += 10; factors.push("Above MA50 ↑"); }
    else              { score -= 10; factors.push("Below MA50 ↓"); }
  }
  if (ma200 !== null) {
    if (price > ma200) { score += 10; factors.push("Above MA200 (long-term bullish)"); }
    else               { score -= 10; factors.push("Below MA200 (long-term bearish)"); }
  }

  if (ch24 > 4)   { score += 6;  factors.push(`Strong 24h surge (+${ch24.toFixed(1)}%)`); }
  else if (ch24 < -5) { score -= 10; factors.push(`Sharp 24h drop (${ch24.toFixed(1)}%)`); }

  if (ch7d > 10)   { score += 6;  factors.push(`Bullish 7d trend (+${ch7d.toFixed(1)}%)`); }
  else if (ch7d < -15) { score -= 10; factors.push(`Weak 7d trend (${ch7d.toFixed(1)}%)`); }

  score = Math.max(0, Math.min(100, score));

  let decision, confidence;
  if      (score >= 70) { decision = "BUY";  confidence = Math.min(92, score); }
  else if (score >= 55) { decision = "HOLD"; confidence = score; }
  else if (score <= 35) { decision = "SELL"; confidence = Math.min(90, 100 - score); }
  else                  { decision = "WAIT"; confidence = 45 + Math.abs(score - 45); }

  const vol = Math.abs(ch7d);
  const risk =
    vol > 20 || (rsi && (rsi < 25 || rsi > 75)) ? "High" : vol > 10 ? "Medium" : "Low";

  let hs = 40;
  if (ma50  && price > ma50)  hs += 20;
  if (ma200 && price > ma200) hs += 20;
  if (rsi && rsi > 38 && rsi < 62) hs += 12;
  if (ch7d > 0) hs += 5;
  if (ch24 > 0) hs += 3;

  return {
    decision,
    confidence: Math.round(confidence),
    risk,
    score,
    factors,
    healthScore: Math.max(0, Math.min(100, Math.round(hs))),
    mood: score >= 65 ? "Bullish" : score <= 40 ? "Fear" : "Neutral",
    rsi:   rsi   !== null ? rsi.toFixed(1)   : "—",
    ma50:  ma50  !== null ? ma50.toFixed(4)  : "—",
    ma200: ma200 !== null ? ma200.toFixed(4) : "—",
    entryLow:   price * 0.97,
    entryHigh:  price * 0.99,
    exitTarget: price * (1.08 + (ch7d > 5 ? 0.05 : 0)),
    stopLoss:   price * 0.94,
  };
}
