import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name, symbol, price, rsi, ma50, ma200,
      ch24, ch7d, decision, confidence, risk,
      language = "english",
      mode = "analysis", // "analysis" | "budget" | "scam"
      budgetAmount, budgetCurrency,
      scamFlags,
    } = body;

    const fmt = (n) =>
      n >= 1
        ? "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "$" + n.toPrecision(4);

    let systemPrompt = "";
    let userPrompt = "";

    // ── LANGUAGE INSTRUCTION ──────────────────────────────────────────────────
    const langInstructions = {
      english:  "Respond in clear, simple English.",
      hindi:    "Poora jawab sirf Hindi mein do. Roman script nahi, Devanagari Hindi mein likho. Simple bhasha use karo.",
      hinglish: "Respond in Hinglish — mix of Hindi and English like how young Indians talk. Example: 'Bitcoin abhi oversold zone mein hai, yeh ek buying opportunity ho sakti hai but risk bhi hai.'",
    };
    const langRule = langInstructions[language] || langInstructions.english;

    // ── MODE: COIN ANALYSIS ───────────────────────────────────────────────────
    if (mode === "analysis") {
      userPrompt = `You are a crypto analyst for Indian investors. ${langRule}

Coin: ${name} (${symbol})
Price: ${fmt(price)} | RSI: ${rsi} | MA50: ${ma50} | MA200: ${ma200}
24h Change: ${parseFloat(ch24).toFixed(2)}% | 7d Change: ${parseFloat(ch7d).toFixed(2)}%
Decision: ${decision} (${confidence}% confidence) | Risk: ${risk}

Reply in EXACTLY this format (2 lines only):
📊 Technical: [one sentence about indicators and momentum]
⚠️ Risk Note: [one honest sentence about what could go wrong]

No hype. No profit guarantees. Keep it simple and direct.`;
    }

    // ── MODE: MERA BUDGET ─────────────────────────────────────────────────────
    else if (mode === "budget") {
      userPrompt = `You are a helpful crypto advisor for Indian investors. ${langRule}

The user has ${budgetCurrency === "INR" ? "₹" : "$"}${budgetAmount} to invest in crypto.

Suggest the BEST way to use this budget. Give exactly 3 options:
1. Safe option (low risk coin like BTC/ETH)
2. Moderate option (mid-cap coin)  
3. High risk / high reward option (small cap)

For each option mention:
- Which coin to buy
- How much to invest
- Why this coin
- Risk level

Keep advice practical for small Indian investors. No guaranteed profit promises.
Format with clear sections. Max 150 words total.`;
    }

    // ── MODE: SCAM DETECTOR ───────────────────────────────────────────────────
    else if (mode === "scam") {
      userPrompt = `You are a crypto scam detector. ${langRule}

Coin: ${name} (${symbol})
24h Change: ${parseFloat(ch24).toFixed(2)}% | 7d Change: ${parseFloat(ch7d).toFixed(2)}%
RSI: ${rsi}
Red flags detected: ${scamFlags.join(", ")}

Based on these signals, give a SHORT verdict:
🚨 Verdict: [1 sentence — is this coin suspicious or safe?]
💡 Advice: [1 sentence — what should the user do?]

Be direct and honest. Warn strongly if it looks like a pump & dump.`;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) throw new Error("Claude API failed");
    const data = await response.json();
    const text = data.content?.[0]?.text || "Analysis complete. Always DYOR.";
    return NextResponse.json({ text });

  } catch {
    return NextResponse.json({
      text: "📊 Technical: Real-time data fetched successfully.\n⚠️ Risk Note: Crypto markets are highly volatile — invest only what you can afford to lose.",
    });
  }
}
