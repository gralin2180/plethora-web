import { NextResponse } from "next/server";
import {
  catalogAll,
  catalogByCategory,
  catalogGet,
  catalogSearch,
} from "@/lib/catalog";
import { PLATFORM_TOOLS } from "@/lib/tools-registry";

function siteUrl(req: Request): string {
  const env = process.env.PLETHORA_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return "https://plethora-ten.vercel.app";
}

/**
 * Machine-readable catalog for Plethora MCP and external agents.
 * GET /api/catalog?q=ping
 * GET /api/catalog?slug=speed-test
 * GET /api/catalog?category=Free%20Utilities
 * GET /api/catalog  → full list (compact)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const site = siteUrl(req);
  const q = url.searchParams.get("q");
  const slug = url.searchParams.get("slug");
  const category = url.searchParams.get("category");
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") || 20)));

  if (slug) {
    const item = catalogGet(slug, site);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ site, tool: item });
  }
  if (q) {
    return NextResponse.json({
      site,
      query: q,
      count: catalogSearch(q, site, limit).length,
      tools: catalogSearch(q, site, limit),
    });
  }
  if (category) {
    const tools = catalogByCategory(category, site);
    return NextResponse.json({ site, category, count: tools.length, tools });
  }

  const compact = catalogAll(site).map((t) => ({
    slug: t.slug,
    name: t.name,
    category: t.category,
    url: t.url,
    description: t.description.slice(0, 120),
  }));

  return NextResponse.json({
    site,
    total: PLATFORM_TOOLS.length,
    tools: compact,
    mcp: {
      name: "plethora-mcp",
      install: "npx -y @plethora/mcp",
      docs: `${site}/mcp`,
      env: { PLETHORA_API_BASE: site },
    },
  });
}
