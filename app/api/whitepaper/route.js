import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

// Extract readable text from HTML
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
    .slice(0, 12000); // First 12K chars → enough for AI
}

export async function POST(request) {
  try {
    const { url, pastedText } = await request.json();

    let content = "";

    // ── Option 1: User pasted text directly ───────────────────────────────
    if (pastedText && pastedText.trim().length > 100) {
      content = pastedText.trim().slice(0, 12000);
    }

    // ── Option 2: Fetch from URL ───────────────────────────────────────────
    else if (url && url.startsWith("http")) {
      try {
        const r = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; YesYouPro/1.0)",
            "Accept": "text/html,application/xhtml+xml,application/pdf",
          },
          signal: AbortSignal.timeout(15000),
        });

        const contentType = r.headers.get("content-type") || "";

        if (contentType.includes("text/html")) {
          const html = await r.text();
          content = extractText(html);
        } else if (contentType.includes("pdf")) {
          // PDF ke liye hint dete hain
          return NextResponse.json({
            error: "pdf",
            message: "PDF file hai — neeche whitepaper ka text paste karo manually."
          });
        } else {
          const text = await r.text();
          content = text.slice(0, 12000);
        }
      } catch (fetchErr) {
        return NextResponse.json({
          error: "fetch_failed",
          message: "URL fetch nahi ho saka. Whitepaper ka text manually paste karo."
        });
      }
    } else {
      return NextResponse.json({ error: "no_input", message: "URL ya text daalo." });
    }

    if (content.length < 100) {
      return NextResponse.json({ error: "too_short", message: "Content bahut chhota hai. Text paste karo." });
    }

    // ── AI Summarization ──────────────────────────────────────────────────
    const prompt = `You are a crypto research analyst helping Indian investors understand crypto whitepapers quickly.

Analyze this whitepaper/document content and give a structured summary in Hinglish (Hindi + English mix):

CONTENT:
${content}

Give response in this EXACT format:

🪙 COIN KYA HAI:
[2-3 sentences — bilkul simple, auto/chai jaisi analogy use karo]

⚡ REAL USE CASE:
[Kya problem solve karta hai? Real world example do]

👥 TEAM:
[Team ke baare mein jo pata chala — anonymous hai ya named?]

💰 TOKENOMICS:
[Token distribution, total supply, koi red flags?]

📊 TECHNOLOGY:
[Kaunsi blockchain, consensus, koi unique tech?]

🚨 RISKS:
[Top 3 risks clearly batao]

✅ BUY KARNA CHAHIYE?
[Honest verdict — 1-10 score + ek line reason]

⏱️ Time saved: 2-3 ghante research → 2 minute mein!`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiData = await aiRes.json();
    const text = aiData.content?.[0]?.text || "Summary generate nahi ho saka.";

    return NextResponse.json({ summary: text, charCount: content.length });

  } catch (err) {
    console.error("Whitepaper error:", err);
    return NextResponse.json({ error: "server_error", message: "Kuch problem aayi. Dobara try karo." });
  }
}
