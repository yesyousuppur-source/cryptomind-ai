import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const COINS = [
  "BTC","ETH","SOL","BNB","XRP","ADA","AVAX","DOGE","LINK","DOT",
  "APT","SUI","INJ","ARB","OP","NEAR","TON","UNI","PEPE","TRX",
  "MATIC","LTC","ATOM","FTM","HBAR","XLM","FIL","VET","SAND","GALA",
  "AAVE","MKR","SNX","CRV","GRT","STX","IMX","BLUR","WIF","BONK",
  "ORDI","CFX","FLOW","ICP","EGLD","RUNE","THETA","KAVA","CELO","ZEC",
  "1INCH","SUSHI","CAKE","GMT","CHZ","ENJ","MANA","AXS","ALICE","ROSE",
  "SKL","OCEAN","BAND","REN","ANKR","STORJ","LOOM","CELR","CKB","DENT",
  "WIN","HOT","MTL","BNX","POLS","SUPER","TLM","ACH","REEF","LINA",
  "JASMY","CLV","DODO","POND","HARD","CTSI","KNC","LRC","PERP","BAKE",
  "BEL","OGN","DF","MBL","QI","DAR","ALPHA","VIDT","FIDA","SFP",
  "FORTH","PUNDIX","ARPA","BURGER","PROS","QUICK","BETA","CHESS","UNFI","OXT",
  "STPT","BAT","ZRX","IOTA","LSK","NANO","ONT","QTUM","ZEN","WAVES",
];

const NAMES={
  BTC:"Bitcoin",ETH:"Ethereum",SOL:"Solana",BNB:"BNB",XRP:"XRP",
  ADA:"Cardano",AVAX:"Avalanche",DOGE:"Dogecoin",LINK:"Chainlink",DOT:"Polkadot",
  APT:"Aptos",SUI:"Sui",INJ:"Injective",ARB:"Arbitrum",OP:"Optimism",
  NEAR:"NEAR",TON:"Toncoin",UNI:"Uniswap",PEPE:"PEPE",TRX:"TRON",
  MATIC:"Polygon",LTC:"Litecoin",ATOM:"Cosmos",FTM:"Fantom",HBAR:"Hedera",
  XLM:"Stellar",FIL:"Filecoin",VET:"VeChain",SAND:"Sandbox",GALA:"Gala",
  AAVE:"Aave",MKR:"Maker",GRT:"The Graph",STX:"Stacks",IMX:"Immutable",
  WIF:"dogwifhat",BONK:"Bonk",ORDI:"Ordinals",RUNE:"THORChain",THETA:"Theta",
  ICP:"Internet Computer",EGLD:"MultiversX",CAKE:"PancakeSwap",CHZ:"Chiliz",
  MANA:"Decentraland",AXS:"Axie Infinity",ENJ:"Enjin",BAT:"Basic Attention",
};

const fmt=(n)=>n>=1?"$"+n.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}):"$"+n.toPrecision(4);

// ── Indicators ──────────────────────────────────────────────────────────────

function calcRSI(closes){
  if(closes.length<15)return 50;
  let ag=0,al=0;
  for(let i=1;i<=14;i++){const d=closes[i]-closes[i-1];d>0?ag+=d:al+=Math.abs(d);}
  ag/=14;al/=14;
  for(let i=15;i<closes.length;i++){const d=closes[i]-closes[i-1];ag=(ag*13+(d>0?d:0))/14;al=(al*13+(d<0?Math.abs(d):0))/14;}
  return al===0?100:Math.round(100-100/(1+ag/al));
}

function calcMA(closes, n){
  if(closes.length<n)return closes[closes.length-1]||0;
  return closes.slice(-n).reduce((a,b)=>a+b,0)/n;
}

function calcEMA(closes, n){
  if(closes.length===0)return 0;
  const k=2/(n+1);
  let ema=closes[0];
  for(let i=1;i<closes.length;i++) ema=closes[i]*k+ema*(1-k);
  return ema;
}

function calcMACD(closes){
  if(closes.length<26)return{macd:0,signal:0,hist:0};
  const ema12=calcEMA(closes.slice(-26),12);
  const ema26=calcEMA(closes.slice(-26),26);
  const macd=ema12-ema26;
  // Signal = 9-period EMA of MACD (simplified)
  const signal=macd*0.9;
  return{macd,signal,hist:macd-signal};
}

function calcBB(closes, n=20){
  const ma=calcMA(closes,n);
  if(closes.length<n)return{upper:ma*1.02,lower:ma*0.98,ma,pct:50};
  const std=Math.sqrt(closes.slice(-n).reduce((s,v)=>s+Math.pow(v-ma,2),0)/n);
  const upper=ma+std*2, lower=ma-std*2;
  const price=closes[closes.length-1];
  const pct=std>0?Math.round((price-lower)/(upper-lower)*100):50;
  return{upper,lower,ma,pct:Math.max(0,Math.min(100,pct))};
}

function calcATR(closes, n=14){
  if(closes.length<n+1)return closes[closes.length-1]*0.03;
  let atr=0;
  for(let i=closes.length-n;i<closes.length;i++) atr+=Math.abs(closes[i]-closes[i-1]);
  return atr/n;
}

function calcSupRes(closes){
  if(closes.length<20)return{sup:closes[closes.length-1]*0.95,res:closes[closes.length-1]*1.05};
  const recent=closes.slice(-20);
  return{
    sup:Math.min(...recent),
    res:Math.max(...recent),
  };
}

function calcVolumeScore(volumes){
  // Compare recent volume to average
  if(volumes.length<10)return 50;
  const avg=volumes.slice(-10).reduce((a,b)=>a+b,0)/10;
  const recent=volumes[volumes.length-1];
  if(avg===0)return 50;
  const ratio=recent/avg;
  if(ratio>2.0)return 90;   // Volume spike = strong signal
  if(ratio>1.5)return 75;
  if(ratio>1.2)return 60;
  if(ratio<0.5)return 20;
  return 50;
}

// ── Scoring Engine ──────────────────────────────────────────────────────────

function scoreCoın(sym, price, ch24, vol24h, closes, volumes){
  if(closes.length<15)return null;

  const rsi     = calcRSI(closes);
  const ma20    = calcMA(closes, 20);
  const ma50    = calcMA(closes, 50);
  const bb      = calcBB(closes);
  const macd    = calcMACD(closes);
  const atr     = calcATR(closes);
  const sr      = calcSupRes(closes);
  const volSc   = calcVolumeScore(volumes);
  const ch7d    = closes.length>=8 ? ((closes[closes.length-1]-closes[closes.length-8])/closes[closes.length-8]*100) : ch24;
  const ch30d   = closes.length>=31 ? ((closes[closes.length-1]-closes[closes.length-31])/closes[closes.length-31]*100) : ch7d;

  let score = 50;

  // 1. RSI (0-30 pts)
  if(rsi<25)score+=30;
  else if(rsi<30)score+=24;
  else if(rsi<35)score+=18;
  else if(rsi<40)score+=12;
  else if(rsi<50)score+=5;
  else if(rsi>80)score-=25;
  else if(rsi>70)score-=15;
  else if(rsi>65)score-=8;
  else if(rsi>60)score-=3;

  // 2. Trend (MA) (0-20 pts)
  if(price>ma20 && price>ma50)score+=20;
  else if(price>ma20)score+=12;
  else if(price>ma50)score+=6;
  else if(price<ma20 && price<ma50)score-=10;

  // 3. Bollinger Bands (0-15 pts)
  if(bb.pct<15)score+=15;       // Near lower band = strong buy zone
  else if(bb.pct<25)score+=10;
  else if(bb.pct<35)score+=5;
  else if(bb.pct>85)score-=12;  // Near upper band = overbought
  else if(bb.pct>75)score-=6;

  // 4. MACD (0-10 pts)
  if(macd.hist>0 && macd.macd<0)score+=10;  // Bullish crossover
  else if(macd.hist>0)score+=5;
  else if(macd.hist<0 && macd.macd>0)score-=8;  // Bearish crossover
  else if(macd.hist<0)score-=3;

  // 5. Volume (0-10 pts)
  if(volSc>80)score+=10;
  else if(volSc>65)score+=6;
  else if(volSc>50)score+=3;
  else if(volSc<25)score-=5;

  // 6. Support/Resistance proximity (0-10 pts)
  const distToSup=(price-sr.sup)/price*100;
  const distToRes=(sr.res-price)/price*100;
  if(distToSup<3)score+=10;   // Near support = bounce expected
  else if(distToSup<6)score+=5;
  if(distToRes<3)score-=8;    // Near resistance = reversal risk
  else if(distToRes<6)score-=3;

  // 7. Price action (ch24, ch7d)
  if(ch24>=-2 && ch24<=6)score+=5;  // Healthy small gain
  else if(ch24>20)score-=15;         // Pump = late entry risk
  else if(ch24<-15)score+=8;         // Big dip = opportunity
  if(ch7d>5 && ch7d<20)score+=5;
  if(ch7d<-15)score+=8;              // Weekly oversold = bounce
  if(ch30d<-30)score+=10;            // Monthly oversold = major opportunity

  score = Math.max(0, Math.min(100, Math.round(score)));

  // TP/SL based on ATR
  const sl   = +(price - atr*1.5).toPrecision(6);
  const tp1  = +(price + atr*1.5).toPrecision(6);
  const tp2  = +(price + atr*2.8).toPrecision(6);
  const tp3  = +(price + atr*4.5).toPrecision(6);
  const rrRatio = ((tp2-price)/(price-sl)).toFixed(1);

  // Signal label (hidden indicators, show only result)
  let signal, signalColor, signalBg, action, holdTime, description;
  if(score>=82){
    signal="VERY STRONG 🔥"; signalColor="#059669"; signalBg="#ecfdf5";
    action="Strong Buy"; holdTime="7-30 din";
    description="Bahut strong entry zone — indicators sab bullish hain";
  } else if(score>=68){
    signal="STRONG BUY ✅"; signalColor="#10b981"; signalBg="#f0fdf4";
    action="Buy"; holdTime="3-14 din";
    description="Achha entry opportunity — trend aur momentum align hain";
  } else if(score>=54){
    signal="WATCH 👀"; signalColor="#d97706"; signalBg="#fffbeb";
    action="Watch"; holdTime="Wait for signal";
    description="Setup ban raha hai — thoda wait karo confirm hone ka";
  } else if(score>=40){
    signal="NEUTRAL ⚖️"; signalColor="#6366f1"; signalBg="#eff6ff";
    action="Hold"; holdTime="—";
    description="Mixed signals — abhi koi clear direction nahi";
  } else{
    signal="CAUTION ⚠️"; signalColor="#ef4444"; signalBg="#fef2f2";
    action="Avoid"; holdTime="—";
    description="Weak setup — better opportunity ka wait karo";
  }

  return{
    symbol:sym,
    name:NAMES[sym]||sym,
    price:fmt(price), rawPrice:price,
    ch24:ch24.toFixed(2),
    ch7d:ch7d.toFixed(2),
    score,
    signal, signalColor, signalBg,
    action, holdTime, description,
    entry:`${fmt(price*0.99)} – ${fmt(price*1.005)}`,
    stopLoss:fmt(sl),
    slPct:((sl-price)/price*100).toFixed(1),
    tp1:fmt(tp1), tp1Pct:((tp1-price)/price*100).toFixed(1),
    tp2:fmt(tp2), tp2Pct:((tp2-price)/price*100).toFixed(1),
    tp3:fmt(tp3), tp3Pct:((tp3-price)/price*100).toFixed(1),
    rrRatio,
    // Indicators HIDDEN from user - only used internally
    _rsi:rsi, _bbPct:bb.pct, _volScore:volSc,
    _distToSup:distToSup.toFixed(1), _distToRes:distToRes.toFixed(1),
    image:`https://assets.coincap.io/assets/icons/${sym.toLowerCase()}@2x.png`,
  };
}

let cache={data:null,ts:0};

export async function GET(){
  try{
    const now=Date.now();
    if(cache.data && now-cache.ts<120000) return NextResponse.json(cache.data);

    // Step 1: Batch fetch tickers (single API call for all coins)
    const syms=JSON.stringify(COINS.map(c=>c+"USDT"));
    const tickR=await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${syms}`,
      {signal:AbortSignal.timeout(10000)}
    );
    if(!tickR.ok) throw new Error("Ticker fetch failed");
    const tickers=await tickR.json();
    const tMap={};
    for(const t of tickers) tMap[t.symbol.replace("USDT","")]=t;

    // Step 2: Fetch klines for ALL coins in parallel (daily + hourly)
    const klineResults=await Promise.allSettled(
      COINS.map(c=>
        fetch(`https://api.binance.com/api/v3/klines?symbol=${c}USDT&interval=1d&limit=60`,
          {signal:AbortSignal.timeout(6000)})
          .then(r=>r.ok?r.json():[])
          .catch(()=>[])
      )
    );

    // Step 3: Score all coins
    const scored=COINS.map((sym,i)=>{
      const t=tMap[sym];
      if(!t)return null;
      const price  = parseFloat(t.lastPrice);
      const ch24   = parseFloat(t.priceChangePercent);
      const vol24h = parseFloat(t.quoteVolume);
      const kl     = klineResults[i]?.status==="fulfilled" ? klineResults[i].value : [];
      const closes = Array.isArray(kl) ? kl.map(k=>parseFloat(k[4])) : [];
      const volumes= Array.isArray(kl) ? kl.map(k=>parseFloat(k[5])) : [];

      if(closes.length<10) return null;
      return scoreCoın(sym, price, ch24, vol24h, closes, volumes);
    }).filter(Boolean);

    // Step 4: Sort by score, always return top 5
    scored.sort((a,b)=>b.score-a.score);
    const top5=scored.slice(0,5);

    // Remove internal indicator values from response (hidden from user)
    const cleanTop5=top5.map(c=>{
      const{_rsi,_bbPct,_volScore,_distToSup,_distToRes,...clean}=c;
      return clean;
    });

    const result={
      coins:cleanTop5,
      scanned:scored.length,
      qualified:top5.length,
      topScore:top5[0]?.score||0,
      marketStrength: top5[0]?.score>=70?"Strong 🔥":top5[0]?.score>=55?"Moderate ⚖️":"Weak 📉",
      updatedAt:new Date().toISOString(),
    };

    cache={data:result,ts:now};
    return NextResponse.json(result);

  }catch(err){
    console.error("top5 error:",err.message);
    if(cache.data) return NextResponse.json(cache.data);
    return NextResponse.json({
      coins:[],qualified:0,scanned:0,
      error:err.message,
      updatedAt:new Date().toISOString()
    });
  }
}
