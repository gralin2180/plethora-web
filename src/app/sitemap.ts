import type { MetadataRoute } from "next";
import { PLATFORM_TOOLS } from "@/lib/tools-registry";

/** Public site origin — set in Vercel when domain is live */
export function getSiteUrl(): string {
  const fromEnv =
    process.env.PLETHORA_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (fromEnv) {
    const raw = fromEnv.startsWith("http") ? fromEnv : `https://${fromEnv}`;
    return raw.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

const CORE: { path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/tools", changeFrequency: "daily", priority: 0.95 },
  { path: "/learn", changeFrequency: "weekly", priority: 0.9 },
  { path: "/get-started", changeFrequency: "weekly", priority: 0.9 },
  { path: "/ai-finder", changeFrequency: "weekly", priority: 0.85 },
  { path: "/prompt-assistant", changeFrequency: "weekly", priority: 0.85 },
  { path: "/game-director", changeFrequency: "weekly", priority: 0.9 },
  { path: "/local-llms", changeFrequency: "weekly", priority: 0.92 },
  { path: "/spicy", changeFrequency: "weekly", priority: 0.88 },
  { path: "/bots", changeFrequency: "weekly", priority: 0.88 },
  { path: "/office", changeFrequency: "weekly", priority: 0.9 },
  { path: "/install", changeFrequency: "weekly", priority: 0.75 },
  { path: "/mcp", changeFrequency: "weekly", priority: 0.75 },
  { path: "/infra", changeFrequency: "weekly", priority: 0.75 },
  { path: "/hardcore", changeFrequency: "monthly", priority: 0.5 },
];

/** Never put internal strategy pages in the sitemap */
const NOINDEX_SLUGS = new Set(["growth"]);

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const coreEntries: MetadataRoute.Sitemap = CORE.map((c) => ({
    url: `${base}${c.path}`,
    lastModified: now,
    changeFrequency: c.changeFrequency,
    priority: c.priority,
  }));

  const toolEntries: MetadataRoute.Sitemap = PLATFORM_TOOLS.filter(
    (t) => !NOINDEX_SLUGS.has(t.slug)
  ).map((t) => {
      // App pages with own routes
      if (t.slug === "prompt-assistant") {
        return {
          url: `${base}/prompt-assistant`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.85,
        };
      }
      if (t.slug === "ai-finder") {
        return {
          url: `${base}/ai-finder`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.85,
        };
      }
      if (t.slug === "chat") {
        return {
          url: `${base}/chat`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.85,
        };
      }
      if (t.slug === "game-engine") {
        return {
          url: `${base}/game-director`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.9,
        };
      }
      if (t.slug === "local-llms") {
        return {
          url: `${base}/local-llms`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.9,
        };
      }
      if (t.slug === "spicy-chat") {
        return {
          url: `${base}/spicy`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.85,
        };
      }
      if (t.slug === "office-suite") {
        return {
          url: `${base}/office`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.9,
        };
      }
      if (t.slug === "office-infra") {
        return {
          url: `${base}/infra`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.75,
        };
      }
      if (t.slug === "mcp-setup") {
        return {
          url: `${base}/mcp`,
          lastModified: now,
          changeFrequency: "weekly" as const,
          priority: 0.75,
        };
      }
      return {
        url: `${base}/tools/${t.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: t.category === "Free Utilities" ? 0.9 : 0.75,
      };
    });

  // Dedupe by URL
  const seen = new Set<string>();
  const all = [...coreEntries, ...toolEntries].filter((e) => {
    if (seen.has(e.url)) return false;
    seen.add(e.url);
    return true;
  });

  return all;
}
