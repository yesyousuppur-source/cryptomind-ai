import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { mode = "analysis", name, symbol, price, rsi, ma50, ma200, ch24, ch7d,
      decision, confidence, risk, budgetAmount, budgetCurrency, scamFlags,
      imageBase64, imageType, userSituation, coinName, newsHeadlines, scamData,
      // new
      iqAnswers, portfolio, networkCoin, tradeDescription, desiMode, systemPrompt, coins } = body;

    const fmt = (n) => n >= 1
      ? "$" + n.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })
      : "$" + n.toPrecision(4);

    let messages = [];

    if (mode === "analysis") {
      messages = [{ role:"user", content:
        `You are a crypto analyst for Indian investors.
Coin: ${name} (${symbol}) | Price: ${fmt(price)} | RSI: ${rsi} | MA50: ${ma50} | MA200: ${ma200}
24h: ${parseFloat(ch24).toFixed(2)}% | 7d: ${parseFloat(ch7d).toFixed(2)}% | Decision: ${decision} (${confidence}% conf) | Risk: ${risk}
Reply EXACTLY:
📊 Technical: [one sentence on indicators and momentum]
⚠️ Risk Note: [one honest sentence on what could go wrong]
No hype. No profit guarantees.` }];
    }
    else if (mode === "budget") {
      messages = [{ role:"user", content:
        `Helpful crypto advisor for Indian investors.
User has ${budgetCurrency === "INR" ? "₹" : "$"}${budgetAmount} to invest.
Give exactly 3 options: 🐢 Safe · ⚖️ Moderate · 🎲 Aggressive
For each: coin, amount, why, risk. Max 150 words. No guaranteed profit.` }];
    }
    else if (mode === "scam") {
      messages = [{ role:"user", content:
        `Crypto scam detector.
Coin: ${name} (${symbol}) | 24h: ${parseFloat(ch24).toFixed(2)}% | 7d: ${parseFloat(ch7d).toFixed(2)}% | RSI: ${rsi} | Red flags: ${scamFlags.join(", ")}
🚨 Verdict: [1 sentence] 💡 Advice: [1 sentence]` }];
    }
    else if (mode === "screenshot") {
      messages = [{ role:"user", content: [
        { type:"image", source:{ type:"base64", media_type: imageType||"image/jpeg", data: imageBase64 } },
        { type:"text", text:`Expert crypto portfolio analyzer for Indian investors.
Format: 📊 Portfolio Summary: | ⚠️ Risk Assessment: | 💡 AI Recommendation: | 📈 Rebalancing Suggestion:
Be specific and honest.` }
      ]}];
    }
    else if (mode === "personal") {
      messages = [{ role:"user", content:
        `Personal crypto advisor for Indian investors.
User's situation: "${userSituation}"
Format: 🎯 Situation Analysis: | 💡 My Honest Advice: | ⚠️ Important Warning: | 📋 Action Steps: (3 numbered)
Warm, honest, practical. Max 200 words.` }];
    }
    else if (mode === "compare") {
      messages = [{ role:"user", content: systemPrompt ||
        `Compare these crypto coins for Indian investors and give honest verdict in Hinglish.
Give response in this EXACT format:
🏆 WINNER: [coin] — [one line reason]
📊 RANKING: [ranking with > between coins]
💪 STRONGEST: [coin] — [reason]
🚀 MOST POTENTIAL: [coin] — [reason]
⚠️ AVOID NOW: [coin if any] — [reason]  
💡 VERDICT: [2-3 lines honest advice in Hinglish]` }];
    }
    else if (mode === "explain" || mode === "explain_desi") {
      const isDesi = mode === "explain_desi" || desiMode;
      if (isDesi) {
        messages = [{ role:"user", content:
          `Tu ek desi crypto teacher hai jo concepts bahut funny aur relatable Hinglish mein samjhata hai.
"${coinName}" ko desi andaaz mein explain kar — auto, chai, biryani, cricket ya Bollywood se compare kar.
Format BILKUL aisa rakh:
🇮🇳 Desi Mein Kya Hai: [ek funny relatable line — jaise "yeh Bitcoin ka chhota bhai hai jo..."]
🍵 Simple Example: [chai/autowala/biryani/cricket se compare karke samjhao]
⚡ Kaise Kaam Karta Hai: [2-3 lines — bilkul aasaan bhasha mein]
💸 Paisa Lagana Chahiye?: [honest advice with risk warning in Hinglish]
🎯 Rating: [X/10 — ek funny line ke saath]
Under 200 words. Hinglish. Funny but honest.` }];
      } else {
        messages = [{ role:"user", content:
          `Crypto educator explaining to everyday Indian investors.
Explain "${coinName}" simply.
Format EXACTLY:
🪙 Kya Hai Yeh? [1-2 sentences plain language]
🎯 Problem Solve Karta Hai: [real-world problem]
⚡ Kaise Kaam Karta Hai: [2-3 lines simple]
💰 Investment Angle: [potential + risk honestly]
🌍 Kaun Use Karta Hai: [users/partnerships]
⭐ Rating: [X/10 with one honest line]
Under 200 words. No jargon. Friendly tone.` }];
      }
    }
    else if (mode === "fomo_detector") {
      messages = [{ role:"user", content:
        `You are a crypto trading psychology expert analyzing FOMO trades.
Trade description: "${tradeDescription}"
Respond ONLY in valid JSON, no extra text:
{"fomoScore":0-100,"verdict":"FOMO Trade or Smart Trade or Borderline","signs":["sign1","sign2","sign3"],"goodSigns":["good1"],"lesson":"1-2 line lesson in Hinglish","emoji":"single emoji"}
FOMO Score: 0=no fomo, 100=pure fomo. Be honest.` }];
    }
    else if (mode === "news_impact") {
      messages = [{ role:"user", content:
        `Crypto market analyst. Analyze news headlines for market impact.
Headlines: ${newsHeadlines}
${coinName ? `Focus on: ${coinName}` : "General market."}
Format: 📰 Top Impact News: | 📈 Market Sentiment: [Bullish/Bearish/Neutral] — Confidence: X% | ⚡ Short-term (24-72h): | 📅 Long-term (1-4 weeks): | 🪙 Coins Most Affected: | ⚠️ Risk Factor:
Max 200 words.` }];
    }
    else if (mode === "scam_ai") {
      const d = scamData;
      messages = [{ role:"user", content:
        `Crypto security expert. Analyze token for scam probability.
Token: ${d.name} (${d.symbol}) | Price: ${d.price} | MCap: ${d.marketCap}
24h: ${d.ch24}% | 7d: ${d.ch7d}% | Volume: ${d.volume} | Vol/MCap: ${d.volMcapRatio}
RSI: ${d.rsi} | Red Flags: ${d.flags.join(", ")||"None"}
Format: 🛡️ Scam Risk Score: [X/100] — [LOW/MEDIUM/HIGH/VERY HIGH] | 🔍 Risk Factors: | ✅ Positive Signals: | 🚨 Key Warning: | 💡 Verdict:
Max 180 words.` }];
    }

    // ── NEW: IQ TEST SCORING ──────────────────────────────────────────────────
    else if (mode === "iq_test") {
      const ans = iqAnswers;
      messages = [{ role:"user", content:
        `You are a crypto psychology expert analyzing a trader's quiz results.

Quiz Answers:
${ans.map((a,i)=>`Q${i+1}: "${a.question}" → User answered: "${a.answer}" (Correct: ${a.correct||"N/A"}, Behavior flag: ${a.behaviorFlag||"none"})`).join("\n")}

Analyze their knowledge AND behavior patterns. Give result in EXACTLY this format:

🧠 Crypto IQ Score: [X/100]
🎭 Trader Type: [Creative name like "Anxious Accumulator" or "FOMO Fighter" or "Diamond Hand Beginner"]
📊 Knowledge Level: [Beginner/Intermediate/Advanced]
🎯 Behavior Pattern: [1 sentence about their psychological trading tendency]

💪 Your Strengths:
- [strength 1]
- [strength 2]

⚠️ Your Weaknesses:
- [weakness 1]
- [weakness 2]

🎯 Perfect Strategy For YOU:
[3 specific personalized tips based on their answers]

🏆 Badge: "[Creative badge name]" [relevant emoji]

Compare: [Famous investor/trader with similar style]

Keep it fun, specific, and shareable. Max 250 words.` }];
    }

    // ── NEW: PORTFOLIO HEALTH CHECKUP ─────────────────────────────────────────
    else if (mode === "health_checkup") {
      messages = [{ role:"user", content:
        `You are Dr. YYP AI — a crypto portfolio doctor for Indian investors.

Patient's Portfolio:
${portfolio.map(p=>`${p.coin}: ${p.currency==="INR"?"₹":"$"}${p.amount} invested`).join("\n")}
Total invested: ${portfolio[0]?.currency==="INR"?"₹":"$"}${portfolio.reduce((s,p)=>s+parseFloat(p.amount||0),0).toLocaleString()}
Check frequency: ${portfolio[0]?.checkFreq||"Unknown"} times/day

Give a DOCTOR-STYLE health report in EXACTLY this format:

🏥 PORTFOLIO HEALTH REPORT
Patient: Anonymous Investor
Doctor: Dr. YYP AI, MD (Market Dynamics)
━━━━━━━━━━━━━━━━━━

✅ HEALTHY:
[List what's good]

⚠️ WARNING SIGNS:
[List moderate concerns]

🚨 CRITICAL:
[List serious issues if any]

💊 PRESCRIPTION:
1. [Action 1]
2. [Action 2]
3. [Action 3]

📊 OVERALL HEALTH GRADE: [A/B/C/D/F] — [tagline]

🔄 Next Checkup: [timeframe recommendation]
━━━━━━━━━━━━━━━━━━
Signed: Dr. YYP AI, MD

Be specific, honest, practical. Use Indian context. Max 300 words.` }];
    }

    // ── NEW: DESI NETWORK INSIGHT ─────────────────────────────────────────────
    else if (mode === "desi_network") {
      messages = [{ role:"user", content:
        `You are a crypto market analyst specializing in Indian and NRI investor behavior.

Current market data for ${networkCoin||"BTC"}:
${body.marketData||"No specific data"}

Analyze NRI and Indian crypto investment patterns for this coin.

Format EXACTLY:
🌍 GLOBAL DESI NETWORK ANALYSIS — ${networkCoin||"BTC"}

🇮🇳 India Pattern:
[What Indian investors are typically doing with this coin]

✈️ NRI Hotspots:
[USA/Dubai/UK NRI behavior patterns — based on typical patterns]

📊 Desi Volume Insight:
[When Indians typically buy/sell this — time patterns]

🔔 Current Signal:
[Based on typical patterns, what's the likely India sentiment]

💡 Insight For You:
[1-2 actionable insights based on Desi network patterns]

⚠️ Note: Based on historical patterns — not guaranteed.
Max 200 words. Keep it insightful and specific.` }];
    }

    // ── NEW: CUSTOM PROMPT (used by Time Saver + Trader tools) ────────────────
    else if (mode === "custom") {
      const { prompt } = body;
      if (!prompt || !prompt.trim()) {
        return NextResponse.json({ text: "⚠️ Prompt khaali hai. Kuch likho pehle." });
      }
      messages = [{ role:"user", content: prompt }];
    }

    if (messages.length === 0) {
      return NextResponse.json({ text: "📊 Analysis could not be completed.\n⚠️ Invalid request — mode not recognized." });
    }

    const maxTokens = {
      screenshot: 600, explain: 500, explain_desi: 500,
      news_impact: 500, scam_ai: 450,
      iq_test: 600, health_checkup: 600, desi_network: 400,
      compare: 800, fomo_detector: 600, custom: 900,
    }[mode] || 500;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: maxTokens,
        messages,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(()=>"");
      console.error("Anthropic API error:", response.status, errBody);
      throw new Error(`API failed: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json({ text: data.content?.[0]?.text || "Analysis complete.", reply: data.content?.[0]?.text || "Analysis complete." });

  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ text: "📊 Analysis could not be completed.\n⚠️ Please try again in a moment." });
  }
}
