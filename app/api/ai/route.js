import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      mode = "analysis",
      language = "english",
      name, symbol, price, rsi, ma50, ma200, ch24, ch7d, decision, confidence, risk,
      budgetAmount, budgetCurrency,
      scamFlags,
      imageBase64, imageType,
      userSituation,
      // new modes
      coinName,           // for explain
      newsHeadlines,      // for news_impact
      scamData,           // for scam_ai
    } = body;

    const fmt = (n) =>
      n >= 1 ? "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
             : "$" + n.toPrecision(4);

    let messages = [];

    // ── ANALYSIS ──────────────────────────────────────────────────────────────
    if (mode === "analysis") {
      messages = [{ role:"user", content:
        `You are a crypto analyst for Indian investors. Respond in clear simple English.
Coin: ${name} (${symbol}) | Price: ${fmt(price)} | RSI: ${rsi} | MA50: ${ma50} | MA200: ${ma200}
24h: ${parseFloat(ch24).toFixed(2)}% | 7d: ${parseFloat(ch7d).toFixed(2)}% | Decision: ${decision} (${confidence}% conf) | Risk: ${risk}
Reply EXACTLY:
📊 Technical: [one sentence on indicators and momentum]
⚠️ Risk Note: [one honest sentence on what could go wrong]
No hype. No profit guarantees.` }];
    }

    // ── BUDGET ────────────────────────────────────────────────────────────────
    else if (mode === "budget") {
      messages = [{ role:"user", content:
        `You are a helpful crypto advisor for Indian investors. Respond in clear English.
User has ${budgetCurrency === "INR" ? "₹" : "$"}${budgetAmount} to invest.
Give exactly 3 options: 🐢 Safe · ⚖️ Moderate · 🎲 Aggressive
For each: coin, amount, why, risk. Max 150 words. No guaranteed profit.` }];
    }

    // ── SCAM (basic) ──────────────────────────────────────────────────────────
    else if (mode === "scam") {
      messages = [{ role:"user", content:
        `You are a crypto scam detector.
Coin: ${name} (${symbol}) | 24h: ${parseFloat(ch24).toFixed(2)}% | 7d: ${parseFloat(ch7d).toFixed(2)}% | RSI: ${rsi} | Red flags: ${scamFlags.join(", ")}
Reply:
🚨 Verdict: [1 sentence]
💡 Advice: [1 sentence]` }];
    }

    // ── SCREENSHOT ────────────────────────────────────────────────────────────
    else if (mode === "screenshot") {
      messages = [{ role:"user", content: [
        { type:"image", source:{ type:"base64", media_type: imageType||"image/jpeg", data: imageBase64 } },
        { type:"text", text:
          `You are an expert crypto portfolio analyzer for Indian investors.
Analyze this exchange/portfolio screenshot carefully.
Format EXACTLY:
📊 Portfolio Summary: [what coins/positions you see]
⚠️ Risk Assessment: [over-concentration? risky positions?]
💡 AI Recommendation: [specific actionable advice]
📈 Rebalancing Suggestion: [ideal allocation change if needed]
Be specific and honest. No profit guarantees.` }
      ]}];
    }

    // ── PERSONAL ADVISOR ──────────────────────────────────────────────────────
    else if (mode === "personal") {
      messages = [{ role:"user", content:
        `You are a personal crypto advisor for Indian investors.
User's situation: "${userSituation}"
Format:
🎯 Situation Analysis: [1-2 sentences understanding their problem]
💡 My Honest Advice: [2-3 sentences specific advice]
⚠️ Important Warning: [1 key risk]
📋 Action Steps: [3 numbered specific steps]
Warm, honest, practical. No false promises. Max 200 words.` }];
    }

    // ── NEW: EXPLAIN THIS COIN ────────────────────────────────────────────────
    else if (mode === "explain") {
      messages = [{ role:"user", content:
        `You are a crypto educator explaining coins to everyday Indian investors in simple language.

Explain "${coinName}" in a way that a non-technical person can understand easily.

Format EXACTLY (use emojis, keep it fun and simple):

🪙 Kya Hai Yeh?
[1-2 sentences: what this coin/project actually does in plain language — no jargon]

🎯 Problem Solve Karta Hai:
[What real-world problem it solves — relate to something Indians understand]

⚡ Kaise Kaam Karta Hai:
[Simple 2-3 line explanation, like explaining to a friend]

💰 Investment Angle:
[Why people invest — what's the potential and what's the risk — be honest]

🌍 Kaun Use Karta Hai:
[Who uses it, any big companies/partnerships, adoption]

⭐ Rating: [X/10 — with one honest line about overall quality]

Keep entire response under 200 words. No technical jargon. Friendly tone. Hindi words OK.` }];
    }

    // ── NEW: NEWS IMPACT ENGINE ───────────────────────────────────────────────
    else if (mode === "news_impact") {
      messages = [{ role:"user", content:
        `You are a crypto market analyst. Analyze these recent crypto news headlines and tell their market impact.

News Headlines:
${newsHeadlines}

${coinName ? `Focus especially on impact for: ${coinName}` : "Give general crypto market impact."}

Format EXACTLY:

📰 Top Impact News:
[Pick the 2-3 most market-moving news items briefly]

📈 Market Sentiment: [Bullish / Bearish / Neutral] — Confidence: [X%]

⚡ Short-term Impact (24-72 hours):
[What might happen in next few days]

📅 Long-term Impact (1-4 weeks):
[Broader trend implications]

🪙 Coins Most Affected:
[List 3-5 coins that would be most impacted and why]

⚠️ Risk Factor:
[One key risk to watch out for]

Be specific and data-driven. No hype. Max 200 words.` }];
    }

    // ── NEW: SCAM AI (detailed) ───────────────────────────────────────────────
    else if (mode === "scam_ai") {
      const d = scamData;
      messages = [{ role:"user", content:
        `You are a crypto security expert and scam detector. Analyze this token for scam probability.

Token: ${d.name} (${d.symbol})
Price: ${d.price} | Market Cap: ${d.marketCap}
24h Change: ${d.ch24}% | 7d Change: ${d.ch7d}%
24h Volume: ${d.volume} | Volume/MCap Ratio: ${d.volMcapRatio}
RSI: ${d.rsi} | Age: ${d.age || "Unknown"}
Red Flags Found: ${d.flags.join(", ") || "None detected"}

Based on these metrics, provide a scam risk assessment:

Format EXACTLY:

🛡️ Scam Risk Score: [X/100] — [LOW/MEDIUM/HIGH/VERY HIGH]

🔍 Risk Factors Found:
[List specific concerning patterns you see in the data]

✅ Positive Signals:
[List anything that looks legitimate]

🚨 Key Warning:
[Most important thing investor should know — 1 sentence]

💡 Verdict:
[Final honest recommendation — 1-2 sentences]

Be direct and honest. Warn strongly if suspicious. Max 180 words.` }];
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
        max_tokens: mode === "screenshot" ? 600 : mode === "explain" ? 500 : mode === "news_impact" ? 500 : mode === "scam_ai" ? 450 : 400,
        messages,
      }),
    });

    if (!response.ok) throw new Error("API failed");
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
