import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const COINS = [
  "BTC","ETH","SOL","BNB","XRP","ADA","AVAX","DOGE","LINK","DOT",
  "APT","SUI","INJ","ARB","OP","NEAR","TON","UNI","PEPE","TRX",
  "MATIC","LTC","ATOM","FTM","HBAR","XLM","FIL","VET","SAND","GALA",
];
const NAMES={BTC:"Bitcoin",ETH:"Ethereum",SOL:"Solana",BNB:"BNB",XRP:"XRP",ADA:"Cardano",AVAX:"Avalanche",DOGE:"Dogecoin",LINK:"Chainlink",DOT:"Polkadot",APT:"Aptos",SUI:"Sui",INJ:"Injective",ARB:"Arbitrum",OP:"Optimism",NEAR:"NEAR",TON:"Toncoin",UNI:"Uniswap",PEPE:"PEPE",TRX:"TRON",MATIC:"Polygon",LTC:"Litecoin",ATOM:"Cosmos",FTM:"Fantom",HBAR:"Hedera",XLM:"Stellar",FIL:"Filecoin",VET:"VeChain",SAND:"Sandbox",GALA:"Gala"};
const IMAGES={BTC:"https://assets.coincap.io/assets/icons/btc@2x.png",ETH:"https://assets.coincap.io/assets/icons/eth@2x.png",SOL:"https://assets.coincap.io/assets/icons/sol@2x.png",BNB:"https://assets.coincap.io/assets/icons/bnb@2x.png",XRP:"https://assets.coincap.io/assets/icons/xrp@2x.png",ADA:"https://assets.coincap.io/assets/icons/ada@2x.png",AVAX:"https://assets.coincap.io/assets/icons/avax@2x.png",DOGE:"https://assets.coincap.io/assets/icons/doge@2x.png",LINK:"https://assets.coincap.io/assets/icons/link@2x.png",DOT:"https://assets.coincap.io/assets/icons/dot@2x.png",APT:"https://assets.coincap.io/assets/icons/apt@2x.png",SUI:"https://assets.coincap.io/assets/icons/sui@2x.png",INJ:"https://assets.coincap.io/assets/icons/inj@2x.png",ARB:"https://assets.coincap.io/assets/icons/arb@2x.png",OP:"https://assets.coincap.io/assets/icons/op@2x.png",NEAR:"https://assets.coincap.io/assets/icons/near@2x.png",TON:"https://assets.coincap.io/assets/icons/ton@2x.png",UNI:"https://assets.coincap.io/assets/icons/uni@2x.png",PEPE:"https://assets.coincap.io/assets/icons/pepe@2x.png",TRX:"https://assets.coincap.io/assets/icons/trx@2x.png",MATIC:"https://assets.coincap.io/assets/icons/matic@2x.png",LTC:"https://assets.coincap.io/assets/icons/ltc@2x.png",ATOM:"https://assets.coincap.io/assets/icons/atom@2x.png",FTM:"https://assets.coincap.io/assets/icons/ftm@2x.png",HBAR:"https://assets.coincap.io/assets/icons/hbar@2x.png",XLM:"https://assets.coincap.io/assets/icons/xlm@2x.png",FIL:"https://assets.coincap.io/assets/icons/fil@2x.png",VET:"https://assets.coincap.io/assets/icons/vet@2x.png",SAND:"https://assets.coincap.io/assets/icons/sand@2x.png",GALA:"https://assets.coincap.io/assets/icons/gala@2x.png"};

const fmt=(n)=>n>=1?"$"+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):"$"+n.toPrecision(4);

function rsi(closes){
  if(closes.length<15)return 50;
  let ag=0,al=0;
  for(let i=1;i<=14;i++){const d=closes[i]-closes[i-1];d>0?ag+=d:al+=Math.abs(d);}
  ag/=14;al/=14;
  for(let i=15;i<closes.length;i++){const d=closes[i]-closes[i-1];ag=(ag*13+(d>0?d:0))/14;al=(al*13+(d<0?Math.abs(d):0))/14;}
  return al===0?100:Math.round(100-100/(1+ag/al));
}

let cache={data:null,ts:0};

export async function GET(){
  try{
    const now=Date.now();
    if(cache.data&&now-cache.ts<120000)return NextResponse.json(cache.data);

    // Step 1: Fetch all tickers at once
    const syms=JSON.stringify(COINS.map(c=>c+"USDT"));
    const tickR=await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${syms}`,{signal:AbortSignal.timeout(8000)});
    if(!tickR.ok)throw new Error("ticker fail");
    const tickers=await tickR.json();
    const tMap={};
    for(const t of tickers)tMap[t.symbol.replace("USDT","")]=t;

    // Step 2: Fetch klines for all coins
    const klineResults=await Promise.allSettled(
      COINS.map(c=>fetch(`https://api.binance.com/api/v3/klines?symbol=${c}USDT&interval=1d&limit=60`,{signal:AbortSignal.timeout(5000)}).then(r=>r.ok?r.json():[]).catch(()=>[]))
    );

    // Step 3: Score every coin
    const scored=COINS.map((sym,i)=>{
      const t=tMap[sym];
      if(!t)return null;
      const price=parseFloat(t.lastPrice);
      const ch24=parseFloat(t.priceChangePercent);
      const vol=parseFloat(t.quoteVolume);
      const kl=klineResults[i]?.status==="fulfilled"?klineResults[i].value:[];
      const closes=Array.isArray(kl)?kl.map(k=>parseFloat(k[4])):[];

      const r=rsi(closes);
      const ma20=closes.length>=20?closes.slice(-20).reduce((a,b)=>a+b,0)/20:price;
      const ma50=closes.length>=50?closes.slice(-50).reduce((a,b)=>a+b,0)/50:price;
      const ch7d=closes.length>=8?((closes[closes.length-1]-closes[closes.length-8])/closes[closes.length-8]*100):ch24;

      // Score 0-100
      let score=50;
      if(r<25)score+=28;
      else if(r<35)score+=20;
      else if(r<45)score+=12;
      else if(r<55)score+=5;
      else if(r>75)score-=18;
      else if(r>65)score-=8;
      if(price>ma50)score+=12;else score-=5;
      if(price>ma20)score+=8;
      if(ch24>=-3&&ch24<=8)score+=8;
      else if(ch24>15)score-=12;
      else if(ch24<-15)score+=5;
      if(ch7d>5)score+=5;
      if(ch7d<-10)score+=8;
      score=Math.max(0,Math.min(100,Math.round(score)));

      // Signal
      let signal,signalColor,signalBg;
      if(score>=80){signal="VERY STRONG";signalColor="#059669";signalBg="#ecfdf5";}
      else if(score>=65){signal="STRONG BUY";signalColor="#10b981";signalBg="#f0fdf4";}
      else if(score>=48){signal="WATCH";signalColor="#d97706";signalBg="#fffbeb";}
      else{signal="CAUTION";signalColor="#dc2626";signalBg="#fef2f2";}

      // SL/TP using ATR
      const atr=closes.length>5?closes.slice(-14).reduce((s,v,i,a)=>s+(i>0?Math.abs(v-a[i-1]):0),0)/13:price*0.03;
      const sl=+(price-atr*1.5).toPrecision(6);
      const tp1=+(price+atr*1.5).toPrecision(6);
      const tp2=+(price+atr*2.5).toPrecision(6);
      const tp3=+(price+atr*4.0).toPrecision(6);
      const slPct=(((sl-price)/price)*100).toFixed(1);
      const tp1Pct=(((tp1-price)/price)*100).toFixed(1);
      const tp2Pct=(((tp2-price)/price)*100).toFixed(1);
      const tp3Pct=(((tp3-price)/price)*100).toFixed(1);
      const rrRatio=((tp2-price)/(price-sl)).toFixed(1);

      return{
        symbol:sym,name:NAMES[sym]||sym,
        price:fmt(price),rawPrice:price,
        ch24:ch24.toFixed(2),ch7d:ch7d.toFixed(2),
        score,signal,signalColor,signalBg,
        rsi:r.toString(),vol,
        image:IMAGES[sym]||`https://assets.coincap.io/assets/icons/${sym.toLowerCase()}@2x.png`,
        entry:`${fmt(price*0.99)} – ${fmt(price*1.005)}`,
        stopLoss:fmt(sl),tp1:fmt(tp1),tp2:fmt(tp2),tp3:fmt(tp3),
        slPct,tp1Pct,tp2Pct,tp3Pct,rrRatio,
        signals:[
          r<35?`RSI ${r} — Oversold 🔥`:r>65?`RSI ${r} — Overbought ⚠️`:`RSI ${r} — Neutral`,
          price>ma50?"Above MA50 — Uptrend ✅":"Below MA50 — Downtrend",
          ch24>=0?`+${ch24.toFixed(1)}% aaj`:`${ch24.toFixed(1)}% aaj`,
        ],
        warnings:[
          ...(ch24>15?[`+${ch24.toFixed(0)}% already — late entry risk`]:[]),
          ...(r>72?["RSI overbought — wait for dip"]:[]),
        ],
      };
    }).filter(Boolean);

    // ALWAYS return top 5 — sorted by score (no cutoff filter)
    scored.sort((a,b)=>b.score-a.score);
    const top5=scored.slice(0,5);
    const avgScore=top5.reduce((s,c)=>s+c.score,0)/top5.length;

    const result={
      coins:top5,
      scanned:scored.length,
      qualified:top5.length,
      isWeakMarket:avgScore<52,
      updatedAt:new Date().toISOString(),
    };
    cache={data:result,ts:now};
    return NextResponse.json(result);

  }catch(err){
    console.error("top5 error:",err.message);
    if(cache.data)return NextResponse.json(cache.data);
    // Fallback — return basic data
    return NextResponse.json({
      coins:[],qualified:0,scanned:0,
      error:err.message,
      updatedAt:new Date().toISOString()
    });
  }
}
