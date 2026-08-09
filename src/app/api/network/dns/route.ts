import { NextResponse } from "next/server";
import dns from "node:dns/promises";
import { sanitizeHostname } from "@/lib/network-ssrf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { host?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const host = sanitizeHostname(body.host || "");
  if (!host) {
    return NextResponse.json(
      { error: "Enter a public hostname (e.g. google.com)." },
      { status: 400 }
    );
  }

  const result: Record<string, unknown> = { host };

  try {
    result.addresses = await dns.lookup(host, { all: true, verbatim: true });
  } catch (e) {
    result.lookupError = e instanceof Error ? e.message : "lookup failed";
  }

  const types = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA"] as const;
  const records: Record<string, unknown> = {};
  await Promise.all(
    types.map(async (type) => {
      try {
        records[type] = await dns.resolve(host, type);
      } catch {
        records[type] = null;
      }
    })
  );
  result.records = records;

  return NextResponse.json(result);
}
