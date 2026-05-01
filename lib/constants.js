export const INPUT_MAP = {
  btc: "BTC", bitcoin: "BTC",
  eth: "ETH", ethereum: "ETH",
  apt: "APT", aptos: "APT",
  sol: "SOL", solana: "SOL",
  bnb: "BNB", binance: "BNB",
  xrp: "XRP", ripple: "XRP",
  ada: "ADA", cardano: "ADA",
  doge: "DOGE", dogecoin: "DOGE",
  matic: "MATIC", polygon: "MATIC",
  dot: "DOT", polkadot: "DOT",
  link: "LINK", chainlink: "LINK",
  avax: "AVAX", avalanche: "AVAX",
  ltc: "LTC", litecoin: "LTC",
  shib: "SHIB",
  sui: "SUI",
  ton: "TON",
  trx: "TRX", tron: "TRX",
  pepe: "PEPE",
  uni: "UNI", uniswap: "UNI",
  aave: "AAVE",
  inj: "INJ", injective: "INJ",
  arb: "ARB", arbitrum: "ARB",
  op: "OP", optimism: "OP",
  sei: "SEI",
};

export const FULL_NAME = {
  BTC: "Bitcoin", ETH: "Ethereum", APT: "Aptos", SOL: "Solana",
  BNB: "BNB", XRP: "XRP", ADA: "Cardano", DOGE: "Dogecoin",
  MATIC: "Polygon", DOT: "Polkadot", LINK: "Chainlink", AVAX: "Avalanche",
  LTC: "Litecoin", SHIB: "Shiba Inu", SUI: "Sui", TON: "Toncoin",
  TRX: "TRON", PEPE: "Pepe", UNI: "Uniswap", AAVE: "Aave",
  INJ: "Injective", ARB: "Arbitrum", OP: "Optimism", SEI: "Sei",
};

export const DECISION_CONFIG = {
  BUY:  { bg: "#030f08", border: "#10b981", text: "#10b981", glow: "0 0 32px rgba(16,185,129,.35)",  label: "🟢 BUY"  },
  SELL: { bg: "#100303", border: "#ef4444", text: "#ef4444", glow: "0 0 32px rgba(239,68,68,.35)",   label: "🔴 SELL" },
  HOLD: { bg: "#03050f", border: "#6366f1", text: "#818cf8", glow: "0 0 32px rgba(99,102,241,.35)",  label: "🔵 HOLD" },
  WAIT: { bg: "#0d0800", border: "#f59e0b", text: "#fbbf24", glow: "0 0 32px rgba(245,158,11,.35)",  label: "🟡 WAIT" },
};

export const MOOD_CONFIG = {
  Bullish: { emoji: "📈", color: "#10b981" },
  Fear:    { emoji: "😨", color: "#f87171" },
  Neutral: { emoji: "⚖️", color: "#fbbf24" },
};

export const fmt = (n) =>
  n >= 1
    ? "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "$" + n.toPrecision(4);

export const fmtBig = (n) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B`
  : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M`
  : `$${n.toLocaleString()}`;
