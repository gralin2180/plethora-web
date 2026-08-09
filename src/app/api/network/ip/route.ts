import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function firstIp(value: string | null): string | null {
  if (!value) return null;
  const part = value.split(",")[0]?.trim();
  return part || null;
}

export async function GET(req: Request) {
  const h = req.headers;
  const ip =
    firstIp(h.get("x-forwarded-for")) ||
    firstIp(h.get("x-real-ip")) ||
    firstIp(h.get("cf-connecting-ip")) ||
    firstIp(h.get("x-vercel-forwarded-for")) ||
    "unknown";

  return NextResponse.json({
    ip,
    country: h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || null,
    city: h.get("x-vercel-ip-city") || null,
    region: h.get("x-vercel-ip-country-region") || null,
    timezone: h.get("x-vercel-ip-timezone") || null,
    asOrganization: h.get("x-vercel-ip-as-organization") || null,
    protocol: h.get("x-forwarded-proto") || null,
    userAgent: h.get("user-agent"),
    acceptLanguage: h.get("accept-language"),
  });
}
