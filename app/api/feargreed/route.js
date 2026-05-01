import { NextResponse } from "next/server";

export async function GET() {
  try {
    const r = await fetch("https://api.alternative.me/fng/?limit=1", {
      next: { revalidate: 3600 },
    });
    const data = await r.json();
    const item = data.data[0];
    return NextResponse.json({
      value: parseInt(item.value),
      classification: item.value_classification,
    });
  } catch {
    return NextResponse.json({ value: 50, classification: "Neutral" });
  }
}
