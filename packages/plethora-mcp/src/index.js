#!/usr/bin/env node
/**
 * Plethora MCP server — wire Claude Desktop / Cursor / local agents to the Plethora catalog & APIs.
 *
 * Env:
 *   PLETHORA_API_BASE  default https://plethora-ten.vercel.app
 *
 * Claude Desktop / Cursor config:
 * {
 *   "mcpServers": {
 *     "plethora": {
 *       "command": "npx",
 *       "args": ["-y", "@plethora/mcp"],
 *       "env": { "PLETHORA_API_BASE": "https://plethora-ten.vercel.app" }
 *     }
 *   }
 * }
 *
 * Until published to npm, run from this folder:
 *   node packages/plethora-mcp/src/index.js
 * or: npx -y tsx / path after npm i locally
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = (process.env.PLETHORA_API_BASE || "https://plethora-ten.vercel.app").replace(
  /\/$/,
  ""
);

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 4000) };
  }
  if (!res.ok) {
    throw new Error(data.error || data.message || `HTTP ${res.status}`);
  }
  return data;
}

function textResult(obj) {
  return {
    content: [
      {
        type: "text",
        text: typeof obj === "string" ? obj : JSON.stringify(obj, null, 2),
      },
    ],
  };
}

const server = new McpServer({
  name: "plethora",
  version: "0.1.0",
});

server.tool(
  "search_tools",
  "Search Plethora free utilities, AI tools, marketing, trading, and more. Returns names, slugs, URLs.",
  { query: z.string().describe("What the user needs, e.g. youtube captions, position size, ping") },
  async ({ query }) => {
    const data = await api(`/api/catalog?q=${encodeURIComponent(query)}&limit=15`);
    return textResult(data);
  }
);

server.tool(
  "list_tools",
  "List Plethora tools (compact). Optional category filter: Free Utilities, AI Tools, Marketing & Ads, Trading, etc.",
  {
    category: z.string().optional().describe("Exact category name or omit for all"),
  },
  async ({ category }) => {
    const path = category
      ? `/api/catalog?category=${encodeURIComponent(category)}`
      : `/api/catalog`;
    const data = await api(path);
    return textResult(data);
  }
);

server.tool(
  "get_tool",
  "Get one Plethora tool by slug with public URL.",
  { slug: z.string() },
  async ({ slug }) => {
    const data = await api(`/api/catalog?slug=${encodeURIComponent(slug)}`);
    return textResult(data);
  }
);

server.tool(
  "recommend_stack",
  "Recommend AI apps, Plethora tools, and MCP ideas for a natural-language task.",
  { task: z.string() },
  async ({ task }) => {
    const data = await api("/api/recommend", {
      method: "POST",
      body: JSON.stringify({ task }),
    });
    return textResult(data);
  }
);

server.tool(
  "polish_prompt",
  "Turn a messy goal into a stronger model prompt (Plethora polish API).",
  {
    task: z.string(),
    answers: z.record(z.string()).optional(),
  },
  async ({ task, answers }) => {
    const data = await api("/api/polish", {
      method: "POST",
      body: JSON.stringify({ task, answers: answers || {} }),
    });
    return textResult(data);
  }
);

server.tool(
  "youtube_captions",
  "Fetch public YouTube captions / transcript for a video id (11 chars).",
  {
    videoId: z.string().describe("11-character YouTube video id"),
    lang: z.string().optional().default("en"),
  },
  async ({ videoId, lang }) => {
    const data = await api("/api/youtube-captions", {
      method: "POST",
      body: JSON.stringify({ videoId, lang: lang || "en" }),
    });
    return textResult({
      title: data.title,
      language: data.language,
      plain: (data.plain || "").slice(0, 12000),
      note: data.note,
      srtPreview: (data.srt || "").slice(0, 2000),
    });
  }
);

server.tool(
  "http_ping",
  "HTTP/HTTPS latency probes to a public host (not ICMP). SSRF-safe via Plethora.",
  {
    target: z.string().describe("hostname or URL"),
    count: z.number().int().min(1).max(10).optional().default(4),
  },
  async ({ target, count }) => {
    const data = await api("/api/network/ping", {
      method: "POST",
      body: JSON.stringify({ target, count }),
    });
    return textResult(data);
  }
);

server.tool(
  "dns_lookup",
  "DNS lookup for a public hostname (A/AAAA/MX/TXT/NS…).",
  { host: z.string() },
  async ({ host }) => {
    const data = await api("/api/network/dns", {
      method: "POST",
      body: JSON.stringify({ host }),
    });
    return textResult(data);
  }
);

server.tool(
  "sitemap_find",
  "Discover sitemaps for a website (robots.txt + common paths).",
  { site: z.string().describe("https://example.com or example.com") },
  async ({ site }) => {
    const data = await api("/api/sitemap", {
      method: "POST",
      body: JSON.stringify({ action: "find", site }),
    });
    return textResult(data);
  }
);

server.tool(
  "position_size",
  "Calculate position size from account equity, risk %, entry, and stop (educational, not advice).",
  {
    account: z.number(),
    riskPct: z.number(),
    entry: z.number(),
    stop: z.number(),
  },
  async ({ account, riskPct, entry, stop }) => {
    const riskCash = account * (riskPct / 100);
    const perUnit = Math.abs(entry - stop);
    if (perUnit <= 0) return textResult({ error: "Entry and stop must differ" });
    const units = riskCash / perUnit;
    return textResult({
      riskCash: Math.round(riskCash * 100) / 100,
      units: Math.floor(units * 1000) / 1000,
      notional: Math.round(units * entry * 100) / 100,
      disclaimer: "Educational only — not financial advice.",
      toolUrl: `${BASE}/tools/position-size`,
    });
  }
);

server.tool(
  "open_in_plethora",
  "Return the best Plethora deep-link for a goal so the user can finish in the browser UI.",
  { goal: z.string() },
  async ({ goal }) => {
    const data = await api(`/api/catalog?q=${encodeURIComponent(goal)}&limit=5`);
    const top = data.tools?.[0];
    return textResult({
      suggestion: top || null,
      alternatives: data.tools || [],
      note: top
        ? `Open ${top.url} to run the full UI (uploads, downloads, GPU guides).`
        : "No match — try /tools or /ai-finder",
    });
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
