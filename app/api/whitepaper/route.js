import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

function extractText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 10000);
}

export async function POST(request) {
  try {
    const { url, pastedText } = await request.json();
    let content = "";
    let coinName = "";

    // ── Option 1: Pasted text ─────────────────────────────────────────────
    if (pastedText && pastedText.trim().length > 50) {
      content = pastedText.trim().slice(0, 10000);
    }

    // ── Option 2: URL fetch ───────────────────────────────────────────────
    else if (url && url.startsWith("http")) {
      // Extract coin name from URL
      coinName = url.split("/")[2]?.replace("www.","")?.split(".")[0] || "";

      try {
        const r = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,*/*",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(12000),
        });

        const contentType = r.headers.get("content-type") || "";

        if (contentType.includes("pdf")) {
          // PDF — AI ko URL se hi analyze karne denge
          content = `Whitepaper URL: ${url}\nCoin/Project: ${coinName}\nNote: PDF file hai, URL se analysis karo.`;
        } else {
          const html = await r.text();
          content = extractText(html);
          if (content.length < 200) {
            content = `Project website: ${url}\nCoin/Project: ${coinName}\nWebsite content limited hai.`;
          }
        }
      } catch {
        // URL fetch failed — AI ko URL se hi analyze karne denge
        content = `Whitepaper URL: ${url}\nCoin/Project: ${coinName}\nDirect access nahi mila but AI general analysis karega.`;
      }
    } else {
      return NextResponse.json({ error: "no_input", message: "URL ya text daalo." });
    }

    // ── AI Analysis ───────────────────────────────────────────────────────
    const prompt = `You are a crypto research expert helping Indian investors. Analyze this crypto project and give a detailed summary in Hinglish.

${content.length > 200 ? `WHITEPAPER/WEBSITE CONTENT:\n${content}` : `PROJECT URL: ${url || "N/A"}\nProject: ${coinName}`}

IMPORTANT: Even if content is limited, use your knowledge about this project to give a helpful analysis.

Give response in this EXACT format:

🪙 COIN KYA HAI:
[2-3 lines — simple language mein, desi analogy use karo]

⚡ REAL USE CASE:
[Kya problem solve karta hai? Real world example]

👥 TEAM & BACKING:
[Team info — founders, investors, partnerships]

💰 TOKENOMICS:
[Supply, distribution, any red flags]

📊 TECHNOLOGY:
[Blockchain, consensus mechanism, unique features]

🚨 TOP 3 RISKS:
[Honest risks — 1. 2. 3.]

✅ BUY KARNA CHAHIYE?
[Score: X/10 — honest one-line verdict]

⏱️ 2-3 ghante ki research → 2 minute mein complete!`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI API error:", errText);
      return NextResponse.json({ error: "ai_failed", message: "AI service error. Thodi der baad try karo." });
    }

    const aiData = await aiRes.json();
    const text = aiData.content?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: "empty", message: "AI ne response nahi diya. Dobara try karo." });
    }

    return NextResponse.json({ summary: text, charCount: content.length });

  } catch (err) {
    console.error("Whitepaper route error:", err);
    return NextResponse.json({ error: "server_error", message: "Server error. Thodi der baad try karo." });
  }
}
