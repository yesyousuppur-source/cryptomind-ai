export const INPUT_MAP = {
  btc:"BTC",bitcoin:"BTC", eth:"ETH",ethereum:"ETH",
  apt:"APT",aptos:"APT",   sol:"SOL",solana:"SOL",
  bnb:"BNB",binance:"BNB", xrp:"XRP",ripple:"XRP",
  ada:"ADA",cardano:"ADA", doge:"DOGE",dogecoin:"DOGE",
  matic:"MATIC",polygon:"MATIC", dot:"DOT",polkadot:"DOT",
  link:"LINK",chainlink:"LINK",  avax:"AVAX",avalanche:"AVAX",
  ltc:"LTC",litecoin:"LTC",      shib:"SHIB",
  sui:"SUI", ton:"TON", trx:"TRX",tron:"TRX", pepe:"PEPE",
  uni:"UNI",uniswap:"UNI", aave:"AAVE",
  inj:"INJ",injective:"INJ", arb:"ARB",arbitrum:"ARB",
  op:"OP",optimism:"OP", sei:"SEI",
};

export const FULL_NAME = {
  BTC:"Bitcoin",ETH:"Ethereum",APT:"Aptos",SOL:"Solana",BNB:"BNB",
  XRP:"XRP",ADA:"Cardano",DOGE:"Dogecoin",MATIC:"Polygon",DOT:"Polkadot",
  LINK:"Chainlink",AVAX:"Avalanche",LTC:"Litecoin",SHIB:"Shiba Inu",
  SUI:"Sui",TON:"Toncoin",TRX:"TRON",PEPE:"Pepe",UNI:"Uniswap",
  AAVE:"Aave",INJ:"Injective",ARB:"Arbitrum",OP:"Optimism",SEI:"Sei",
};

// ── Light-theme decision boxes ─────────────────────────────────────────────
export const DECISION_CONFIG = {
  BUY:  { bg:"#f0fdf4", border:"#10b981", text:"#065f46", glow:"0 4px 24px rgba(16,185,129,.18)",  label:"🟢 BUY"  },
  SELL: { bg:"#fef2f2", border:"#ef4444", text:"#991b1b", glow:"0 4px 24px rgba(239,68,68,.18)",   label:"🔴 SELL" },
  HOLD: { bg:"#eef2ff", border:"#6366f1", text:"#3730a3", glow:"0 4px 24px rgba(99,102,241,.18)",  label:"🔵 HOLD" },
  WAIT: { bg:"#fffbeb", border:"#f59e0b", text:"#92400e", glow:"0 4px 24px rgba(245,158,11,.18)",  label:"🟡 WAIT" },
};

export const MOOD_CONFIG = {
  Bullish: { emoji:"📈", color:"#059669" },
  Fear:    { emoji:"😨", color:"#dc2626" },
  Neutral: { emoji:"⚖️", color:"#d97706" },
};

export const fmt = (n) =>
  n >= 1
    ? "$" + n.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })
    : "$" + n.toPrecision(4);

export const fmtBig = (n) =>
  n >= 1e9 ? `$${(n/1e9).toFixed(2)}B`
  : n >= 1e6 ? `$${(n/1e6).toFixed(2)}M`
  : `$${n.toLocaleString()}`;
