import { NextResponse } from "next/server";

// Cache news for 15 minutes
let cache = {};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const coin = searchParams.get("coin") || "general";
  const cacheKey = coin.toLowerCase();
  const now = Date.now();

  if (cache[cacheKey] && now - cache[cacheKey].ts < 15 * 60 * 1000) {
    return NextResponse.json(cache[cacheKey].data);
  }

  try {
    // CryptoCompare News API - completely free, no key needed
    const categories = coin === "general"
      ? "BTC,ETH,Altcoin,Trading,Market"
      : coin.toUpperCase();

    const url = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${categories}&sortOrder=latest&extraParams=CryptoMindAI`;

    const r = await fetch(url, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 900 },
    });

    if (!r.ok) throw new Error("News fetch failed");
    const raw = await r.json();

    // Pick top 8 news, extract only what we need
    const articles = (raw.Data || []).slice(0, 8).map(a => ({
      title:    a.title,
      source:   a.source_info?.name || a.source || "Unknown",
      url:      a.url,
      time:     a.published_on,
      body:     a.body?.slice(0, 200) || "",
      tags:     a.categories || "",
    }));

    // Build headline string for AI
    const headlines = articles
      .map((a, i) => `${i + 1}. [${a.source}] ${a.title}`)
      .join("\n");

    const result = { articles, headlines, coin, updatedAt: new Date().toISOString() };
    cache[cacheKey] = { data: result, ts: now };

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ articles: [], headlines: "", coin, updatedAt: new Date().toISOString() });
  }
}
