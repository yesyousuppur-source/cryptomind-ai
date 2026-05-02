import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      mode = "analysis",
      language = "english",
      // analysis fields
      name, symbol, price, rsi, ma50, ma200, ch24, ch7d, decision, confidence, risk,
      // budget fields
      budgetAmount, budgetCurrency,
      // scam fields
      scamFlags,
      // screenshot fields
      imageBase64, imageType,
      // personal advisor fields
      userSituation,
    } = body;

    const fmt = (n) =>
      n >= 1
        ? "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "$" + n.toPrecision(4);

    const langRule = {
      english:  "Respond in clear, simple English.",
      hindi:    "Sirf Hindi mein jawab do (Devanagari). Simple bhasha use karo.",
      hinglish: "Hinglish mein jawab do — Hindi + English mix, jaise Indian log bolte hain.",
    }[language] || "Respond in clear English.";

    let messages = [];

    // ── MODE: COIN ANALYSIS ──────────────────────────────────────────────────
    if (mode === "analysis") {
      messages = [{
        role: "user",
        content: `You are a crypto analyst for Indian investors. ${langRule}

Coin: ${name} (${symbol})
Price: ${fmt(price)} | RSI: ${rsi} | MA50: ${ma50} | MA200: ${ma200}
24h: ${parseFloat(ch24).toFixed(2)}% | 7d: ${parseFloat(ch7d).toFixed(2)}%
Decision: ${decision} (${confidence}% conf) | Risk: ${risk}

Reply EXACTLY:
📊 Technical: [one sentence on indicators and momentum]
⚠️ Risk Note: [one honest sentence on what could go wrong]

No hype. No profit guarantees.`,
      }];
    }

    // ── MODE: BUDGET ADVISOR ─────────────────────────────────────────────────
    else if (mode === "budget") {
      messages = [{
        role: "user",
        content: `You are a helpful crypto advisor for Indian investors. ${langRule}

User has ${budgetCurrency === "INR" ? "₹" : "$"}${budgetAmount} to invest.

Give exactly 3 investment options:
1. 🐢 Safe (low risk)
2. ⚖️ Moderate (medium risk)
3. 🎲 Aggressive (high risk/reward)

For each: coin name, how much to invest, why, risk level.
Keep it practical. Max 150 words. No guaranteed profit claims.`,
      }];
    }

    // ── MODE: SCAM DETECTOR ──────────────────────────────────────────────────
    else if (mode === "scam") {
      messages = [{
        role: "user",
        content: `You are a crypto scam detector. ${langRule}

Coin: ${name} (${symbol})
24h: ${parseFloat(ch24).toFixed(2)}% | 7d: ${parseFloat(ch7d).toFixed(2)}%
RSI: ${rsi} | Red flags: ${scamFlags.join(", ")}

Give verdict:
🚨 Verdict: [1 sentence — suspicious or safe?]
💡 Advice: [1 sentence — what should user do?]

Be direct and honest.`,
      }];
    }

    // ── MODE: SCREENSHOT ANALYSIS ────────────────────────────────────────────
    else if (mode === "screenshot") {
      messages = [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: imageType || "image/jpeg",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `You are an expert crypto portfolio analyzer for Indian investors. ${langRule}

Analyze this crypto exchange/portfolio screenshot carefully.

Provide analysis in this EXACT format:

📊 Portfolio Summary:
[List what coins/positions you can see]

⚠️ Risk Assessment:
[Over-concentration? Any risky positions?]

💡 AI Recommendation:
[Specific actionable advice — what to do, rebalance, cut losses, take profit etc.]

📈 Rebalancing Suggestion:
[Ideal allocation if they should change anything]

Be specific, practical, and honest. No guaranteed profit claims. If you cannot read the image clearly, say so.`,
          },
        ],
      }];
    }

    // ── MODE: PERSONAL ADVISOR ("Mujhe Bata") ───────────────────────────────
    else if (mode === "personal") {
      messages = [{
        role: "user",
        content: `You are a personal crypto advisor for Indian investors. ${langRule}

User's situation: "${userSituation}"

Give them honest, personalized advice. Be direct like a trusted friend who knows crypto.

Format:
🎯 Situation Analysis: [understand their problem in 1-2 sentences]
💡 My Honest Advice: [specific what-to-do advice, 2-3 sentences]
⚠️ Important Warning: [one key risk or thing to be careful about]
📋 Action Steps: [3 numbered specific steps they should take]

Be warm, honest, and practical. No false promises. Max 200 words.`,
      }];
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
        max_tokens: mode === "screenshot" ? 600 : mode === "personal" ? 500 : 400,
        messages,
      }),
    });

    if (!response.ok) throw new Error("Claude API failed");
    const data = await response.json();
    const text = data.content?.[0]?.text || "Analysis complete. Always DYOR.";
    return NextResponse.json({ text });

  } catch (err) {
    console.error(err);
    return NextResponse.json({
      text: "📊 Analysis could not be completed right now.\n⚠️ Please try again in a moment.",
    });
  }
}
