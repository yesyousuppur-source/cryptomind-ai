import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, symbol, price, rsi, ma50, ma200, ch24, ch7d, decision, confidence, risk } = body;

    const fmt = (n) =>
      n >= 1
        ? "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "$" + n.toPrecision(4);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [
          {
            role: "user",
            content: `You are a crypto analyst. Give a 2-sentence honest assessment for ${name} (${symbol}).

Data: Price=${fmt(price)} | RSI=${rsi} | MA50=${ma50} | MA200=${ma200} | 24h=${parseFloat(ch24).toFixed(2)}% | 7d=${parseFloat(ch7d).toFixed(2)}% | Decision=${decision} (${confidence}% conf) | Risk=${risk}

Format EXACTLY:
📊 Technical: [one specific sentence on indicators and momentum]
⚠️ Risk Note: [one honest sentence on what could go wrong]

No hype. No profit guarantees.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Claude API failed");
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "Analysis complete. Always DYOR.";

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      {
        text: "📊 Technical: Indicators calculated from real-time Binance data.\n⚠️ Risk Note: Crypto markets are highly volatile — never invest more than you can afford to lose.",
      },
      { status: 200 }
    );
  }
}
