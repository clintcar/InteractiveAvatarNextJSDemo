import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const apiKey = process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing HEYGEN_API_KEY" }, { status: 500 });
  }

  const res = await fetch("https://api.heygen.com/v1/streaming.create_token", {
    method: "POST",
    headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  const data = await res.json();
  if (!res.ok || !data?.data?.token) {
    return NextResponse.json({ error: data?.message || "Token fetch failed" }, { status: 500 });
  }

  return new NextResponse(data.data.token, { headers: { "Content-Type": "text/plain" } });
}
