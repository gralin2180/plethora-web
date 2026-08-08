"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Plug } from "lucide-react";
import {
  MCP_CATEGORIES,
  MCP_CLIENTS,
  MCP_SERVERS,
  type McpServer,
} from "@/lib/mcp-registry";

export function McpHubPage() {
  const [category, setCategory] = useState<string>("all");
  const [client, setClient] = useState(MCP_CLIENTS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeClient = MCP_CLIENTS.find((c) => c.id === client) ?? MCP_CLIENTS[0];

  const servers = useMemo(() => {
    return MCP_SERVERS.filter((s) => category === "all" || s.category === category);
  }, [category]);

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
          <h1 className="text-3xl font-bold text-white">MCP Hub</h1>
          <p className="mt-1 text-zinc-500">
            Model Context Protocol servers for every serious AI surface — Claude Desktop & web,
            ChatGPT connectors, Cursor, terminal agents, and more. Tools should work{" "}
            <span className="text-zinc-300">automatically once connected</span> (approve when asked).
          </p>
        </div>
      </div>

      {/* Multi-client setup — Claude first */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-white">1. Pick where your AI lives</h2>
        <p className="mt-1 text-sm text-zinc-500">
          No Claude or ChatGPT yet? Start with Claude on the web (prompt only), then Claude Desktop
          for full MCP. We do not lock you to Cursor.
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
              Open download / app
            </a>
          </div>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
            {activeClient.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="mt-4 rounded-lg border border-emerald-500/20 bg-black/20 px-3 py-2 text-sm text-emerald-200/90">
            {activeClient.autoNote}
          </p>
          {activeClient.id === "claude-web" && (
            <p className="mt-3 text-sm text-zinc-500">
              Still zero apps installed? Go to{" "}
              <a href="https://claude.ai" className="text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">
                claude.ai
              </a>
              , sign up free, then return here when you want MCP tools via Desktop.
            </p>
          )}
        </div>
      </section>

      {/* Server catalog */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold text-white">2. Browse MCP servers</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {MCP_SERVERS.length}+ practical servers across automation, browser, data, design, and ops.
          Add what matches your work — not only coding.
        </p>
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

        <div className="mt-6 grid gap-4">
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
                <div className="flex items-center gap-2">
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
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {tool.configSnippet && (
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-zinc-600">Example config (Claude Desktop / Cursor)</span>
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
        </div>
      </section>

      <section className="mt-14 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="text-lg font-semibold text-white">How “automatic” MCP works</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          <li>
            1. You connect a server once (Desktop / Cursor / ChatGPT connectors when available).
          </li>
          <li>
            2. You paste a Plethora prompt or ask for a task. The model decides when a tool is needed.
          </li>
          <li>
            3. You approve the tool call. After that, multi-step runs feel automatic — email, browser,
            files, CRM — without you leaving the chat.
          </li>
          <li>
            4. Web-only Claude or ChatGPT still work without MCP: use our{" "}
            <Link href="/ai-finder" className="text-cyan-400 hover:underline">
              AI Finder
            </Link>{" "}
            ready prompts until you install Desktop.
          </li>
        </ul>
      </section>
    </div>
  );
}
