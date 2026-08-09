import { NextResponse } from "next/server";
import { parsePublicHttpUrl } from "@/lib/network-ssrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * HTTP latency "ping" — browsers cannot send ICMP; we measure TLS + HTTP RTT instead.
 */
export async function POST(req: Request) {
  let body: { target?: string; count?: number } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const url = parsePublicHttpUrl(body.target || "https://www.cloudflare.com");
  if (!url) {
    return NextResponse.json(
      { error: "Enter a public hostname or URL (private/local targets are blocked)." },
      { status: 400 }
    );
  }

  const count = Math.min(10, Math.max(1, Number(body.count) || 4));
  const samples: { ms: number; status: number; ok: boolean; error?: string }[] = [];

  for (let i = 0; i < count; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const start = performance.now();
    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        redirect: "follow",
        cache: "no-store",
        signal: ctrl.signal,
        headers: {
          "User-Agent": "PlethoraPing/1.0 (+https://plethora-ten.vercel.app)",
          Accept: "*/*",
        },
      });
      // Drain lightly so close can complete
      await res.arrayBuffer().catch(() => undefined);
      const ms = Math.round((performance.now() - start) * 10) / 10;
      samples.push({ ms, status: res.status, ok: res.ok || res.status < 500 });
    } catch (e) {
      const ms = Math.round((performance.now() - start) * 10) / 10;
      samples.push({
        ms,
        status: 0,
        ok: false,
        error: e instanceof Error ? e.message : "request failed",
      });
    } finally {
      clearTimeout(timer);
    }
  }

  const okSamples = samples.filter((s) => s.ok).map((s) => s.ms);
  const stats =
    okSamples.length === 0
      ? null
      : {
          min: Math.min(...okSamples),
          max: Math.max(...okSamples),
          avg: Math.round((okSamples.reduce((a, b) => a + b, 0) / okSamples.length) * 10) / 10,
          lossPct: Math.round(((count - okSamples.length) / count) * 100),
        };

  return NextResponse.json({
    target: url.hostname,
    url: url.origin,
    method: "http",
    note: "This is HTTP/HTTPS latency from Plethora’s server, not classic ICMP ping.",
    samples,
    stats,
  });
}
