import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COINS = [
  "BTC","ETH","SOL","BNB","XRP","ADA","AVAX","DOGE","LINK","DOT",
  "APT","SUI","INJ","ARB","OP","NEAR","TON","UNI","PEPE","TRX",
  "MATIC","LTC","ATOM","FTM","HBAR","XLM","FIL","ALGO","VET","SAND",
];

const NAMES = {
  BTC:"Bitcoin",ETH:"Ethereum",SOL:"Solana",BNB:"BNB",XRP:"XRP",
  ADA:"Cardano",AVAX:"Avalanche",DOGE:"Dogecoin",LINK:"Chainlink",DOT:"Polkadot",
  APT:"Aptos",SUI:"Sui",INJ:"Injective",ARB:"Arbitrum",OP:"Optimism",
  NEAR:"NEAR",TON:"Toncoin",UNI:"Uniswap",PEPE:"PEPE",TRX:"TRON",
  MATIC:"Polygon",LTC:"Litecoin",ATOM:"Cosmos",FTM:"Fantom",HBAR:"Hedera",
  XLM:"Stellar",FIL:"Filecoin",ALGO:"Algorand",VET:"VeChain",SAND:"Sandbox",
};

const fmt = (n) => n >= 1
  ? "$" + n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})
  : "$" + n.toPrecision(4);

function calcRSI(closes) {
  if (closes.length < 15) return 50;
  let ag=0, al=0;
  for(let i=1;i<=14;i++){const d=closes[i]-closes[i-1];d>0?ag+=d:al+=Math.abs(d);}
  ag/=14; al/=14;
  for(let i=15;i<closes.length;i++){const d=closes[i]-closes[i-1];ag=(ag*13+(d>0?d:0))/14;al=(al*13+(d<0?Math.abs(d):0))/14;}
  return al===0 ? 100 : Math.round(100-100/(1+ag/al));
}

function calcMA(closes, n) {
  if (closes.length < n) return null;
  return closes.slice(-n).reduce((a,b)=>a+b,0)/n;
}

let cache = { data:null, ts:0 };

export async function GET() {
  try {
    const now = Date.now();
    if (cache.data && now-cache.ts < 2*60*1000) {
      return NextResponse.json(cache.data);
    }

    // Fetch all tickers in one call
    const syms = JSON.stringify(COINS.map(c=>c+"USDT"));
    const tickRes = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${syms}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!tickRes.ok) throw new Error("Binance ticker failed");
    const tickers = await tickRes.json();

    const tickMap = {};
    for(const t of tickers) tickMap[t.symbol.replace("USDT","")] = t;

    // Fetch klines for all coins in parallel
    const klines = await Promise.allSettled(
      COINS.map(c =>
        fetch(`https://api.binance.com/api/v3/klines?symbol=${c}USDT&interval=1d&limit=60`, { signal:AbortSignal.timeout(6000) })
          .then(r=>r.ok?r.json():[]).catch(()=>[])
      )
    );

    const scored = COINS.map((sym,i) => {
      const t = tickMap[sym];
      if (!t) return null;

      const price = parseFloat(t.lastPrice);
      const ch24  = parseFloat(t.priceChangePercent);
      const vol   = parseFloat(t.quoteVolume);
      const kl    = klines[i]?.status==="fulfilled" ? klines[i].value : [];
      const closes = Array.isArray(kl) ? kl.map(k=>parseFloat(k[4])) : [];

      const rsi  = calcRSI(closes);
      const ma20 = calcMA(closes, 20);
      const ma50 = calcMA(closes, 50);
      const ch7d = closes.length>=8 ? ((closes[closes.length-1]-closes[closes.length-8])/closes[closes.length-8]*100) : ch24;

      // Score
      let score = 50;
      if(rsi < 25)       score += 28;
      else if(rsi < 35)  score += 20;
      else if(rsi < 45)  score += 12;
      else if(rsi < 55)  score += 5;
      else if(rsi > 75)  score -= 18;
      else if(rsi > 65)  score -= 8;

      if(ma50  && price > ma50)  score += 12;
      if(ma50  && price < ma50)  score -= 5;
      if(ma20  && price > ma20)  score += 8;

      if(ch24 >= -5  && ch24 <= 8)  score += 8;
      else if(ch24 > 15)            score -= 12;
      else if(ch24 < -15)           score += 5;

      if(ch7d > 5)   score += 5;
      if(ch7d < -10) score += 8; // oversold 7d

      score = Math.max(0, Math.min(100, Math.round(score)));

      // Signal label
      let signal, signalColor, signalBg;
      if      (score >= 80) { signal="VERY STRONG"; signalColor="#059669"; signalBg="#ecfdf5"; }
      else if (score >= 65) { signal="STRONG BUY";  signalColor="#10b981"; signalBg="#f0fdf4"; }
      else if (score >= 48) { signal="WATCH";        signalColor="#d97706"; signalBg="#fffbeb"; }
      else                  { signal="CAUTION";      signalColor="#dc2626"; signalBg="#fef2f2"; }

      // TP/SL
      const atr = closes.length > 5
        ? closes.slice(-14).reduce((s,v,i,a)=>s+(i>0?Math.abs(v-a[i-1]):0),0)/13
        : price * 0.03;

      const sl      = +(price - atr*1.5).toPrecision(6);
      const tp1     = +(price + atr*1.5).toPrecision(6);
      const tp2     = +(price + atr*2.5).toPrecision(6);
      const tp3     = +(price + atr*4.0).toPrecision(6);
      const slPct   = (((sl-price)/price)*100).toFixed(1);
      const tp1Pct  = (((tp1-price)/price)*100).toFixed(1);
      const tp2Pct  = (((tp2-price)/price)*100).toFixed(1);
      const tp3Pct  = (((tp3-price)/price)*100).toFixed(1);
      const rrRatio = ((tp2-price)/(price-sl)).toFixed(1);

      return {
        symbol: sym, name: NAMES[sym]||sym,
        price:  fmt(price), rawPrice: price,
        ch24:   ch24.toFixed(2), ch7d: ch7d.toFixed(2),
        score, signal, signalColor, signalBg,
        rsi:    rsi.toString(), vol,
        image:  `https://assets.coincap.io/assets/icons/${sym.toLowerCase()}@2x.png`,
        entry:  `${fmt(price*0.99)} – ${fmt(price*1.005)}`,
        stopLoss: fmt(sl), tp1: fmt(tp1), tp2: fmt(tp2), tp3: fmt(tp3),
        slPct, tp1Pct, tp2Pct, tp3Pct, rrRatio,
        signals: [
          rsi < 35 ? `RSI ${rsi} — Oversold 🔥` : rsi > 65 ? `RSI ${rsi} — Overbought ⚠️` : `RSI ${rsi} — Neutral`,
          ma50 && price > ma50 ? "Above MA50 — Uptrend ✅" : "Below MA50 — Downtrend",
          ch24 >= 0 ? `+${ch24.toFixed(1)}% today` : `${ch24.toFixed(1)}% today`,
        ],
        warnings: [
          ...(ch24 > 15 ? [`Already +${ch24.toFixed(0)}% — late entry risk`]:[]),
          ...(rsi > 72  ? [`RSI overbought — wait for pullback`]:[]),
        ],
      };
    }).filter(Boolean);

    // Always return top 5 — sorted by score
    scored.sort((a,b) => b.score-a.score);
    const top5 = scored.slice(0,5);

    const avgScore = top5.reduce((s,c)=>s+c.score,0) / top5.length;

    const result = {
      coins: top5,
      scanned: COINS.length,
      qualified: top5.length,
      isWeakMarket: avgScore < 55,
      message: "normal",
      updatedAt: new Date().toISOString(),
    };

    cache = { data:result, ts:now };
    return NextResponse.json(result);

  } catch(err) {
    if (cache.data) return NextResponse.json(cache.data);
    return NextResponse.json({ coins:[], message:"error", scanned:0, qualified:0, updatedAt:new Date().toISOString() });
  }
}
