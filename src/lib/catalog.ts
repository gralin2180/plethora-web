/**
 * Public tool catalog helpers for MCP, agents, and sticky UX.
 */

import { PLATFORM_TOOLS, searchTools, getToolBySlug } from "./tools-registry";
import type { PlatformTool } from "./types";

export type CatalogEntry = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  url: string;
  runner?: string;
  isPro: boolean;
  tags: string[];
};

export function toolPublicUrl(slug: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, "");
  if (slug === "chat") return `${base}/chat`;
  if (slug === "prompt-assistant") return `${base}/prompt-assistant`;
  if (slug === "ai-finder") return `${base}/ai-finder`;
  if (slug === "mcp-setup") return `${base}/mcp`;
  return `${base}/tools/${slug}`;
}

export function toCatalogEntry(tool: PlatformTool, siteUrl: string): CatalogEntry {
  return {
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    category: tool.category,
    url: toolPublicUrl(tool.slug, siteUrl),
    runner: tool.runner,
    isPro: tool.isPro,
    tags: tool.tags,
  };
}

export function catalogAll(siteUrl: string): CatalogEntry[] {
  return PLATFORM_TOOLS.map((t) => toCatalogEntry(t, siteUrl));
}

export function catalogSearch(query: string, siteUrl: string, limit = 12): CatalogEntry[] {
  return searchTools(query)
    .slice(0, limit)
    .map((t) => toCatalogEntry(t, siteUrl));
}

export function catalogByCategory(category: string, siteUrl: string): CatalogEntry[] {
  return PLATFORM_TOOLS.filter((t) => t.category === category).map((t) =>
    toCatalogEntry(t, siteUrl)
  );
}

export function catalogGet(slug: string, siteUrl: string): CatalogEntry | null {
  const t = getToolBySlug(slug);
  return t ? toCatalogEntry(t, siteUrl) : null;
}

/** Sticky “better than GPT” pitch — Chat answers; we execute */
export const DIFFERENTIATORS = [
  {
    title: "Runs, not just replies",
    body: "PDF, captions, network checks, position size, planners — tools that finish the job in the browser or on your GPU.",
  },
  {
    title: "Works inside your AI (MCP)",
    body: "Plug the Plethora MCP into Claude Desktop, Cursor, or local agents so they call our tools instead of inventing broken steps.",
  },
  {
    title: "Local + private option",
    body: "Ollama, OpenClaw, Odysseus, LM Studio — keep data on your machine when you need to.",
  },
  {
    title: "One map of the AI wilderness",
    body: "Finder + installs + free utilities under one roof so you stop tab-hopping for every converter.",
  },
] as const;
