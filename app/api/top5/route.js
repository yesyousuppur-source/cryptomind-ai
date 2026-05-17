import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const f = (n) => {
  if (!n) return "$0";
  return n >= 1
    ? "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "$" + n.toPrecision(4);
};

// Always-available fallback data
const FALLBACK = [
  { symbol:"BTC", name:"Bitcoin",    price:"$67,000", ch24:"1.5",  score:72, signal:"STRONG BUY ✅", sColor:"#10b981", sBg:"#f0fdf4", holdTime:"7-14 din", desc:"Market leader — strong uptrend", tp1:"$70,000", tp1Pct:"4.5", tp2:"$75,000", tp2Pct:"11.9", tp3:"$82,000", tp3Pct:"22.4", stopLoss:"$63,000", slPct:"-5.97", rrRatio:"2.1", image:"https://assets.coincap.io/assets/icons/btc@2x.png" },
  { symbol:"ETH", name:"Ethereum",   price:"$3,500",  ch24:"2.1",  score:68, signal:"STRONG BUY ✅", sColor:"#10b981", sBg:"#f0fdf4", holdTime:"5-14 din", desc:"Strong fundamentals — buy zone", tp1:"$3,800", tp1Pct:"8.6", tp2:"$4,200", tp2Pct:"20.0", tp3:"$5,000", tp3Pct:"42.9", stopLoss:"$3,200", slPct:"-8.57", rrRatio:"2.3", image:"https://assets.coincap.io/assets/icons/eth@2x.png" },
  { symbol:"SOL", name:"Solana",     price:"$180",    ch24:"3.2",  score:65, signal:"WATCH 👀",      sColor:"#d97706", sBg:"#fffbeb", holdTime:"3-7 din",  desc:"Volume spike — setup forming", tp1:"$200",   tp1Pct:"11.1", tp2:"$225", tp2Pct:"25.0", tp3:"$260", tp3Pct:"44.4", stopLoss:"$162", slPct:"-10.0", rrRatio:"1.9", image:"https://assets.coincap.io/assets/icons/sol@2x.png" },
  { symbol:"APT", name:"Aptos",      price:"$12",     ch24:"-1.2", score:60, signal:"WATCH 👀",      sColor:"#d97706", sBg:"#fffbeb", holdTime:"5-10 din", desc:"Near support — bounce possible", tp1:"$14",   tp1Pct:"16.7", tp2:"$17", tp2Pct:"41.7", tp3:"$20", tp3Pct:"66.7", stopLoss:"$10",  slPct:"-16.7", rrRatio:"2.5", image:"https://assets.coincap.io/assets/icons/apt@2x.png" },
  { symbol:"AVAX", name:"Avalanche", price:"$40",     ch24:"0.8",  score:58, signal:"WATCH 👀",      sColor:"#d97706", sBg:"#fffbeb", holdTime:"3-7 din",  desc:"Consolidating — watch for breakout", tp1:"$46", tp1Pct:"15.0", tp2:"$52", tp2Pct:"30.0", tp3:"$60", tp3Pct:"50.0", stopLoss:"$36", slPct:"-10.0", rrRatio:"2.0", image:"https://assets.coincap.io/assets/icons/avax@2x.png" },
];

let cache = { data: null, ts: 0 };

export async function GET() {
  // Return cache if fresh (2 min)
  const now = Date.now();
  if (cache.data && now - cache.ts < 120000) {
    return NextResponse.json(cache.data);
  }

  try {
    // Single CoinGecko call - rich data, no rate limit for basic use
    const url = "https://api.coingecko.com/api/v3/coins/markets" +
      "?vs_currency=usd&order=market_cap_desc&per_page=100&page=1" +
      "&price_change_percentage=24h,7d,30d&sparkline=false";

    const resp = await fetch(url, {
      headers: { "Accept": "application/json" },
      signal: AbortSignal.timeout(12000),
    });

    if (!resp.ok) throw new Error("CoinGecko " + resp.status);

    const coins = await resp.json();
    if (!Array.isArray(coins) || coins.length === 0) throw new Error("Empty response");

    // Score each coin using available data
    const scored = coins.map(c => {
      const price  = c.current_price || 0;
      const ch24   = c.price_change_percentage_24h || 0;
      const ch7d   = c.price_change_percentage_7d_in_currency || 0;
      const ch30d  = c.price_change_percentage_30d_in_currency || 0;
      const vol    = c.total_volume || 0;
      const mcap   = c.market_cap || 0;
      const high52 = c.ath || price;
      const low52  = c.atl || price * 0.1;
      const athPct = c.ath_change_percentage || 0; // negative = below ATH

      if (!price) return null;

      // Scoring based on available data
      let sc = 50;

      // 1. Price vs ATH (oversold from ATH = buying opportunity)
      if (athPct < -80) sc += 25;       // 80%+ below ATH = major opportunity
      else if (athPct < -60) sc += 18;
      else if (athPct < -40) sc += 12;
      else if (athPct < -20) sc += 6;
      else if (athPct > -10) sc -= 5;   // Near ATH = risky entry

      // 2. 24h momentum (not too hot, not too cold)
      if (ch24 >= -3 && ch24 <= 5) sc += 12;   // Stable = good entry
      else if (ch24 >= -8 && ch24 < -3) sc += 8; // Small dip = opportunity
      else if (ch24 < -15) sc += 15;             // Big dip = major buy
      else if (ch24 > 20) sc -= 20;              // Pump = late entry risk
      else if (ch24 > 12) sc -= 10;

      // 3. 7-day trend
      if (ch7d >= -5 && ch7d <= 15) sc += 10;   // Healthy weekly
      else if (ch7d < -20) sc += 12;             // Weekly oversold
      else if (ch7d > 30) sc -= 12;

      // 4. 30-day recovery signal
      if (ch30d < -40) sc += 15;  // Monthly oversold = major opportunity
      else if (ch30d < -20) sc += 8;
      else if (ch30d > 50) sc -= 8;

      // 5. Volume (high volume = real interest)
      const volMcapRatio = mcap > 0 ? vol / mcap : 0;
      if (volMcapRatio > 0.3) sc += 10;
      else if (volMcapRatio > 0.15) sc += 5;
      else if (volMcapRatio < 0.03) sc -= 5;

      // Cap and floor
      sc = Math.max(0, Math.min(100, Math.round(sc)));

      // Signal labels
      let signal, sColor, sBg, holdTime, desc;
      if (sc >= 85) {
        signal = "VERY STRONG 🔥🔥"; sColor = "#059669"; sBg = "#ecfdf5";
        holdTime = "7-30 din"; desc = `${c.name} bahut oversold hai — strong recovery expected`;
      } else if (sc >= 72) {
        signal = "STRONG BUY ✅"; sColor = "#10b981"; sBg = "#f0fdf4";
        holdTime = "5-14 din"; desc = `${c.name} ka setup strong hai — good entry zone`;
      } else if (sc >= 60) {
        signal = "WATCH 👀"; sColor = "#d97706"; sBg = "#fffbeb";
        holdTime = "3-7 din"; desc = `${c.name} mein momentum build ho raha hai`;
      } else if (sc >= 48) {
        signal = "NEUTRAL ⚖️"; sColor = "#6366f1"; sBg = "#eff6ff";
        holdTime = "—"; desc = "Mixed signals — better entry ka wait karo";
      } else {
        signal = "CAUTION ⚠️"; sColor = "#ef4444"; sBg = "#fef2f2";
        holdTime = "—"; desc = "Abhi entry risky hai — wait karo";
      }

      // TP/SL based on ATH distance and volatility
      const atr = price * 0.04; // approximate
      const sl  = price - atr * 1.5;
      const tp1 = price + atr * 1.5;
      const tp2 = price + atr * 3;
      const tp3 = price + atr * 5;

      return {
        symbol: c.symbol?.toUpperCase(),
        name:   c.name,
        price:  f(price),
        rawPrice: price,
        ch24:   ch24.toFixed(2),
        ch7d:   ch7d.toFixed(1),
        score:  sc,
        signal, sColor, sBg, holdTime, desc,
        tp1: f(tp1), tp1Pct: ((tp1-price)/price*100).toFixed(1),
        tp2: f(tp2), tp2Pct: ((tp2-price)/price*100).toFixed(1),
        tp3: f(tp3), tp3Pct: ((tp3-price)/price*100).toFixed(1),
        stopLoss: f(sl),
        slPct: ((sl-price)/price*100).toFixed(1),
        rrRatio: ((tp2-price)/(price-sl)).toFixed(1),
        image: c.image || `https://assets.coincap.io/assets/icons/${c.symbol?.toLowerCase()}@2x.png`,
      };
    }).filter(Boolean);

    // Sort by score, return top 5
    scored.sort((a, b) => b.score - a.score);
    const top5 = scored.slice(0, 5);

    const result = {
      coins: top5,
      scanned: scored.length,
      topScore: top5[0]?.score || 0,
      marketStrength: top5[0]?.score >= 75 ? "Strong 🔥"
        : top5[0]?.score >= 55 ? "Moderate ⚖️" : "Cautious 📉",
      updatedAt: new Date().toISOString(),
    };

    cache = { data: result, ts: now };
    return NextResponse.json(result);

  } catch (err) {
    console.error("top5 error:", err.message);

    // Return cached data if available
    if (cache.data) return NextResponse.json(cache.data);

    // Return fallback so UI never shows empty
    return NextResponse.json({
      coins: FALLBACK,
      scanned: 5,
      topScore: 72,
      marketStrength: "Moderate ⚖️",
      isFallback: true,
      updatedAt: new Date().toISOString(),
    });
  }
}
