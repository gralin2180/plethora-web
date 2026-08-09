"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Plug, Search } from "lucide-react";
import {
  MCP_CATEGORIES,
  MCP_CLIENTS,
  MCP_SERVERS,
  type McpServer,
} from "@/lib/mcp-registry";
import { McpBuilderLab } from "@/components/InstallAndMcpHelpers";

const PLETHORA_MCP_CONFIG = `{
  "mcpServers": {
    "plethora": {
      "command": "node",
      "args": ["PATH/TO/plethora/packages/plethora-mcp/src/index.js"],
      "env": {
        "PLETHORA_API_BASE": "https://plethora-ten.vercel.app"
      }
    }
  }
}`;

const PLETHORA_MCP_NPX = `{
  "mcpServers": {
    "plethora": {
      "command": "npx",
      "args": ["-y", "@plethora/mcp"],
      "env": {
        "PLETHORA_API_BASE": "https://plethora-ten.vercel.app"
      }
    }
  }
}`;

export function McpHubPage() {
  const [category, setCategory] = useState<string>("all");
  const [client, setClient] = useState(MCP_CLIENTS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const activeClient = MCP_CLIENTS.find((c) => c.id === client) ?? MCP_CLIENTS[0];

  const servers = useMemo(() => {
    const base = MCP_SERVERS.filter((s) => category === "all" || s.category === category);
    if (!q.trim()) return base;
    const qq = q.trim().toLowerCase();
    return base.filter((s) =>
      `${s.name} ${s.description} ${s.whyUse} ${s.tags.join(" ")} ${s.taskKeywords.join(" ")}`
        .toLowerCase()
        .includes(qq)
    );
  }, [category, q]);

  async function copySnippet(server: McpServer) {
    if (!server.configSnippet) return;
    await navigator.clipboard.writeText(server.configSnippet);
    setCopiedId(server.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3">
        <Plug className="h-8 w-8 text-emerald-400" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">MCP Hub</h1>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            Model Context Protocol (MCP) lets AI clients call external tools. Plethora provides a{" "}
            <span className="text-zinc-200">first-party MCP</span>, a catalog of third-party
            servers, host setup guides, and a builder for your own local MCP.
          </p>
        </div>
      </div>

      {/* Create first so it is never missed — compact so hosts stay in first fold */}
      <section id="create-mcp" className="mt-8 scroll-mt-24">
        <McpBuilderLab compact />
      </section>

      <section
        id="plethora-mcp"
        className="mt-8 scroll-mt-24 rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/15 to-emerald-500/5 p-6 sm:p-8"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-violet-300">
          Official · sticky
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Plethora MCP</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Plug Claude Desktop, Cursor, Cline, Continue, or any MCP host into the full Plethora
          catalog — search tools, polish prompts, YouTube captions, ping/DNS, sitemaps, recommend
          stacks, open deep links. Your AI stops guessing and starts using tools that actually
          exist here.
        </p>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-zinc-400">
          <li>
            Local package: <code className="text-zinc-300">packages/plethora-mcp</code> inside the
            web repo → <code className="text-zinc-300">npm install && node src/index.js</code>
          </li>
          <li>Paste config into Claude Desktop / Cursor MCP settings (point args to that file).</li>
          <li>
            Set <code className="text-zinc-300">PLETHORA_API_BASE</code> to your live site URL.
          </li>
          <li>
            Ask the host: “Search Plethora for youtube captions” or “Position size on $10k risk 1%”.
          </li>
        </ol>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Local path config</span>
              <button
                type="button"
                className="text-xs text-violet-300"
                onClick={() => void navigator.clipboard.writeText(PLETHORA_MCP_CONFIG)}
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-black/50 p-3 text-[11px] text-zinc-400">
              {PLETHORA_MCP_CONFIG}
            </pre>
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Future npx (after npm publish)</span>
              <button
                type="button"
                className="text-xs text-violet-300"
                onClick={() => void navigator.clipboard.writeText(PLETHORA_MCP_NPX)}
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-black/50 p-3 text-[11px] text-zinc-400">
              {PLETHORA_MCP_NPX}
            </pre>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-600">
          Example:{" "}
          <code className="text-zinc-500">
            …/plethora-web/packages/plethora-mcp/src/index.js
          </code>
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-white">1. Choose an MCP host</h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">
          Pick any host you already use or want to install. Each option shows what Plethora provides
          for that surface — setup steps, download link, and how tools load. Support for MCP varies
          by product and plan; we document known paths rather than locking you to one vendor.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {MCP_CLIENTS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setClient(c.id)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                client === c.id
                  ? "bg-emerald-600 text-white"
                  : "border border-white/10 text-zinc-400 hover:border-white/20"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Setup: {activeClient.name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{activeClient.summary}</p>
            </div>
            <a
              href={activeClient.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Official site / download
            </a>
          </div>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-zinc-400">
            {activeClient.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="mt-4 rounded-lg border border-emerald-500/20 bg-black/20 px-3 py-2 text-sm text-emerald-200/90">
            {activeClient.autoNote}
          </p>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold text-white">2. Browse MCP servers</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {MCP_SERVERS.length} servers across automation, browser, data, design, and ops. Copy
          config snippets into your host where supported.
        </p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search servers — GitHub, browser, Gmail, Zapier…"
            className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-emerald-500/40"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {MCP_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs capitalize transition ${
                category === cat
                  ? "bg-white text-black"
                  : "border border-white/10 text-zinc-400 hover:border-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-zinc-600">
          {servers.length} result{servers.length === 1 ? "" : "s"}
          {q.trim() ? ` for “${q.trim()}”` : ""}
        </p>

        <div className="mt-4 grid gap-4">
          {servers.map((tool) => (
            <article
              key={tool.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-white">{tool.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{tool.description}</p>
                </div>
                {tool.url && (
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 hover:text-white"
                    title="Docs / site"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <p className="mt-3 text-sm text-zinc-300">
                <span className="text-emerald-400/90">Why use it:</span> {tool.whyUse}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                <span className="text-zinc-400">How to add:</span> {tool.installHint}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-500">
                  {tool.pricing}
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] capitalize text-zinc-500">
                  {tool.skillLevel}
                </span>
                {tool.worksWith.slice(0, 5).map((w) => (
                  <span
                    key={w}
                    className="rounded-full border border-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400/80"
                  >
                    {w}
                  </span>
                ))}
              </div>
              {tool.configSnippet && (
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-zinc-600">Example host config</span>
                    <button
                      type="button"
                      onClick={() => copySnippet(tool)}
                      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
                    >
                      {copiedId === tool.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copiedId === tool.id ? "Copied" : "Copy JSON"}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 text-[11px] text-zinc-400">
                    {tool.configSnippet}
                  </pre>
                </div>
              )}
            </article>
          ))}
          {servers.length === 0 && (
            <p className="rounded-xl border border-white/10 px-4 py-6 text-center text-sm text-zinc-500">
              No servers match that search. Try another keyword or category.
            </p>
          )}
        </div>
      </section>

      <p className="mt-10 text-center text-sm text-zinc-600">
        Need a different host path?{" "}
        <Link href="/chat" className="text-violet-400 hover:underline">
          Ask Chat
        </Link>{" "}
        or browse{" "}
        <Link href="/install" className="text-violet-400 hover:underline">
          Install Hub
        </Link>
        .
      </p>
    </div>
  );
}
