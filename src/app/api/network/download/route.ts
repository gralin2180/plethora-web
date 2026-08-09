import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = 2 * 1024 * 1024; // 2 MB — plenty for browser speed estimates

/** Random bytes (hard to compress) for download speed tests. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requested = Number(searchParams.get("bytes") || 250_000);
  const size = Number.isFinite(requested)
    ? Math.min(MAX, Math.max(0, Math.floor(requested)))
    : 250_000;

  const buf = new Uint8Array(size);
  // Chunked PRNG fill — faster than getRandomValues for 2MB
  let seed = (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
  for (let i = 0; i < size; i++) {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    buf[i] = seed & 0xff;
  }

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(size),
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
