import { NextResponse } from "next/server";

/**
 * Server-side sitemap/robots helpers (CORS-safe).
 * Used by free SEO traffic tools (SiteGPT-style growth).
 */

function normalizeSite(input: string): string | null {
  let u = input.trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const url = new URL(u);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

async function fetchText(url: string, ms = 12000): Promise<{ ok: boolean; status: number; text: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "PlethoraSitemapBot/1.0 (+https://localhost; research tool)" },
      redirect: "follow",
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text: text.slice(0, 2_000_000) };
  } catch {
    return { ok: false, status: 0, text: "" };
  } finally {
    clearTimeout(t);
  }
}

function extractSitemapsFromRobots(robots: string): string[] {
  const out: string[] = [];
  for (const line of robots.split(/\r?\n/)) {
    const m = line.match(/^\s*sitemap:\s*(.+)$/i);
    if (m?.[1]) out.push(m[1].trim());
  }
  return out;
}

function countLocTags(xml: string): number {
  const matches = xml.match(/<loc\b[^>]*>/gi);
  return matches?.length ?? 0;
}

function validateSitemapXml(xml: string): {
  valid: boolean;
  score: number;
  issues: string[];
  stats: { locCount: number; isIndex: boolean; hasUrlset: boolean };
} {
  const issues: string[] = [];
  const trimmed = xml.trim();
  if (!trimmed.startsWith("<") && !trimmed.includes("<?xml")) {
    issues.push("Does not look like XML.");
  }
  const isIndex = /<sitemapindex[\s>]/i.test(xml);
  const hasUrlset = /<urlset[\s>]/i.test(xml);
  if (!isIndex && !hasUrlset) {
    issues.push("Missing <urlset> or <sitemapindex> root — may not be a sitemap.");
  }
  const locCount = countLocTags(xml);
  if (locCount === 0) issues.push("No <loc> entries found.");
  if (locCount > 50000) issues.push("Over 50,000 URLs — split or use a sitemap index (Google limit guidance).");
  if (!/<urlset[^>]+xmlns=|<sitemapindex[^>]+xmlns=/i.test(xml) && (hasUrlset || isIndex)) {
    issues.push("Consider an explicit xmlns on the root element for best compliance.");
  }
  const broken = (xml.match(/<loc>\s*<\/loc>/gi) || []).length;
  if (broken) issues.push(`${broken} empty <loc> tags.`);

  let score = 100;
  score -= issues.length * 12;
  if (locCount === 0) score -= 40;
  score = Math.max(0, Math.min(100, score));

  return {
    valid: issues.length === 0 && locCount > 0,
    score,
    issues,
    stats: { locCount, isIndex, hasUrlset },
  };
}

function extractLocs(xml: string, limit = 500): string[] {
  const locs: string[] = [];
  const re = /<loc[^>]*>\s*([^<\s]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) && locs.length < limit) {
    locs.push(m[1].trim());
  }
  return locs;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action || "");

    if (action === "find") {
      const origin = normalizeSite(String(body.url || ""));
      if (!origin) {
        return NextResponse.json({ error: "Valid site URL required" }, { status: 400 });
      }
      const found: { url: string; status: number; locCount?: number; note?: string }[] = [];
      const robots = await fetchText(`${origin}/robots.txt`);
      const fromRobots = robots.ok ? extractSitemapsFromRobots(robots.text) : [];
      const candidates = [
        ...fromRobots,
        `${origin}/sitemap.xml`,
        `${origin}/sitemap_index.xml`,
        `${origin}/sitemap-index.xml`,
        `${origin}/wp-sitemap.xml`,
      ];
      const unique = [...new Set(candidates)];
      for (const sm of unique.slice(0, 12)) {
        const res = await fetchText(sm);
        if (res.ok && (res.text.includes("<loc") || res.text.includes("sitemap"))) {
          found.push({
            url: sm,
            status: res.status,
            locCount: countLocTags(res.text),
            note: fromRobots.includes(sm) ? "from robots.txt" : "common path",
          });
        }
      }
      return NextResponse.json({
        ok: true,
        origin,
        robotsOk: robots.ok,
        robotsStatus: robots.status,
        found,
        robotsSitemaps: fromRobots,
      });
    }

    if (action === "validate") {
      let xml = String(body.xml || "");
      const remote = String(body.url || "").trim();
      if (remote) {
        const res = await fetchText(remote);
        if (!res.ok) {
          return NextResponse.json(
            { error: `Could not fetch sitemap (${res.status || "network"})` },
            { status: 502 }
          );
        }
        xml = res.text;
      }
      if (!xml.trim()) {
        return NextResponse.json({ error: "Paste XML or provide a URL" }, { status: 400 });
      }
      const report = validateSitemapXml(xml);
      return NextResponse.json({ ok: true, ...report });
    }

    if (action === "extract") {
      let xml = String(body.xml || "");
      const remote = String(body.url || "").trim();
      if (remote) {
        const res = await fetchText(remote);
        if (!res.ok) {
          return NextResponse.json({ error: "Could not fetch sitemap" }, { status: 502 });
        }
        xml = res.text;
      }
      const locs = extractLocs(xml, Number(body.limit) || 500);
      return NextResponse.json({ ok: true, count: locs.length, urls: locs });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Sitemap request failed" }, { status: 500 });
  }
}
