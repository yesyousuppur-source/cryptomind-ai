import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

// ── Fetch live Binance data ─────────────────────────────────────────────────
async function getLiveData(symbols = ["BTC","ETH","SOL","BNB","XRP"]) {
  try {
    const syms = JSON.stringify(symbols.map(s => s + "USDT"));
    const r = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${syms}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!r.ok) return null;
    const data = await r.json();
    return data.map(t => ({
      symbol: t.symbol.replace("USDT",""),
      price:  parseFloat(t.lastPrice).toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:6}),
      ch24:   parseFloat(t.priceChangePercent).toFixed(2),
      vol:    (parseFloat(t.quoteVolume)/1e6).toFixed(1) + "M",
      high:   parseFloat(t.highPrice).toFixed(4),
      low:    parseFloat(t.lowPrice).toFixed(4),
    }));
  } catch { return null; }
}

// ── Extract coin symbols from user message ──────────────────────────────────
function extractCoins(msg) {
  const known = ["BTC","ETH","SOL","BNB","XRP","ADA","AVAX","DOGE","LINK","DOT",
    "APT","SUI","INJ","ARB","OP","NEAR","TON","UNI","PEPE","TRX","MATIC","LTC",
    "ATOM","WIF","BONK","ORDI","RUNE","GRT","AAVE","FIL","VET","XLM","HBAR",
    "THETA","GALA","SAND","CHZ","FTM","EGLD","CAKE","STX","IMX"];
  const upper = msg.toUpperCase();
  const found = known.filter(c => upper.includes(c));
  // Always include BTC ETH for market context
  const coins = [...new Set([...found, "BTC", "ETH"])].slice(0, 8);
  return coins;
}

// ── Fear & Greed ────────────────────────────────────────────────────────────
async function getFearGreed() {
  try {
    const r = await fetch("https://api.alternative.me/fng/?limit=1", {signal: AbortSignal.timeout(4000)});
    const d = await r.json();
    return d.data?.[0] || null;
  } catch { return null; }
}

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1]?.content || "";

    // Fetch relevant live data
    const coins = extractCoins(lastMsg);
    const [liveData, fg] = await Promise.all([
      getLiveData(coins),
      getFearGreed(),
    ]);

    // Build market context
    let marketContext = "";
    if (liveData) {
      marketContext = "\n\n📊 LIVE MARKET DATA (Binance, abhi ka):\n";
      liveData.forEach(c => {
        marketContext += `${c.symbol}: $${c.price} | 24h: ${c.ch24>=0?"+":""}${c.ch24}% | Vol: $${c.vol} | H: $${c.high} | L: $${c.low}\n`;
      });
    }
    if (fg) {
      marketContext += `\n😰 Fear & Greed Index: ${fg.value}/100 — ${fg.value_classification}\n`;
    }
    marketContext += `\n🕐 Data time: ${new Date().toLocaleString("en-IN", {timeZone:"Asia/Kolkata"})} IST\n`;

    // System prompt
    const systemPrompt = `Tum YES YOU PRO ka AI crypto assistant ho — India ke investors ke liye.

Tumhara naam: YYP AI
Personality: Smart, friendly, honest. Hinglish mein baat karo (Hindi + English mix).

TUMHARE PAAS HAI:
${marketContext}

RULES:
1. Real market data use karo jo tumhe diya gaya hai — koi bhi price/data likhne se pehle upar ka data dekho
2. Hamesha current prices cite karo jab baat karo
3. Technical analysis karo — RSI, support, resistance explain karo
4. FINANCIAL ADVICE MAT DO — hamesha "DYOR" aur "invest karne se pehle research karo" kaho
5. Agar koi puchhe "buy karein?" → analysis do lekin final decision unka khud ka hai
6. Crypto ke baare mein accurate, educational information do
7. Agar data available nahi toh clearly batao
8. Response concise rakho — max 200 words normally, 400 only for deep analysis
9. Use emojis appropriately

TOPICS JO COVER KAR SAKTE HO:
- Live prices, 24h change, volume
- Technical analysis (RSI, MA, MACD concepts)
- Crypto education (DeFi, NFT, blockchain, etc.)
- Market sentiment (Fear & Greed)
- DCA strategy, risk management
- Tax implications India mein
- Coin comparison
- Airdrop, staking basics

HAMESHA DISCLAIMER: "Yeh financial advice nahi hai. DYOR."`;

    // Call Anthropic API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error("AI error: " + err);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "Sorry, kuch problem aayi. Dobara try karo.";

    return NextResponse.json({
      reply: text,
      marketData: liveData,
      fearGreed: fg,
    });

  } catch (err) {
    console.error("Chat error:", err.message);
    return NextResponse.json({
      reply: "Sorry yaar, abhi server busy hai. Thodi der mein dobara try karo! 🙏",
      error: err.message,
    });
  }
}
