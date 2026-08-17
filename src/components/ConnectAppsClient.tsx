"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  KeyRound,
  Link2,
  Plug,
  Search,
  Sparkles,
  Unplug,
  Workflow,
} from "lucide-react";
import {
  CONNECTED_APP_CATEGORIES,
  CONNECTED_APPS,
  searchApps,
  type ConnectedApp,
  type ConnectMethod,
} from "@/lib/connected-apps";
import {
  clearConnection,
  connectionSummary,
  loadConnections,
  setConnection,
  type AppConnectionState,
} from "@/lib/app-connections";

const METHOD_LABEL: Record<ConnectMethod, string> = {
  mcp: "MCP",
  zapier: "Zapier",
  api_key: "API key",
  oauth_guide: "OAuth / app",
  agent: "Agent paste",
};

export function ConnectAppsClient() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [map, setMap] = useState<Record<string, AppConnectionState>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [tokenDraft, setTokenDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    setMap(loadConnections());
  }, []);

  const list = useMemo(() => {
    let apps = q.trim() ? searchApps(q) : CONNECTED_APPS;
    if (cat !== "All") apps = apps.filter((a) => a.category === cat);
    return apps;
  }, [q, cat]);

  const summary = connectionSummary(map);
  const popular = CONNECTED_APPS.filter((a) => a.popular);

  function openDetail(app: ConnectedApp) {
    setOpenId(app.id);
    const st = map[app.id];
    setTokenDraft(st?.token || "");
    setNoteDraft(st?.note || "");
  }

  function markConnected(appId: string) {
    setMap(
      setConnection(appId, {
        connected: true,
        token: tokenDraft.trim() || undefined,
        note: noteDraft.trim() || undefined,
      })
    );
  }

  function markDisconnected(appId: string) {
    setMap(clearConnection(appId));
    if (openId === appId) {
      setTokenDraft("");
      setNoteDraft("");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
          Connect your apps
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">Wire Canva, Slack, Figma & more</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Plethora runs prompts and tools under one roof — then hands off to apps you already use.
          Full OAuth for every vendor needs your own developer apps (security you control). Here you
          can mark connections, stash personal tokens only in this browser, and follow MCP / Zapier
          bridges used by other products.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
            {summary.count} connected on this device
          </span>
          <Link
            href="/mcp"
            className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-zinc-400 hover:text-white"
          >
            <Plug className="h-3 w-3" /> MCP Hub
          </Link>
          <Link
            href="/settings/subscription-ai"
            className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200 hover:text-emerald-100"
          >
            <Sparkles className="h-3 w-3" /> ChatGPT sub
          </Link>
          <Link
            href="/settings/ai-keys"
            className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-zinc-400 hover:text-white"
          >
            <KeyRound className="h-3 w-3" /> AI keys
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h2 className="text-sm font-semibold text-white">Popular picks</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {popular.map((app) => {
            const on = map[app.id]?.connected;
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => openDetail(app)}
                className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                  on
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                    : "border-white/10 bg-black/30 text-zinc-300 hover:border-violet-500/40"
                }`}
              >
                {on && <Check className="mb-0.5 mr-1 inline h-3.5 w-3.5" />}
                {app.name}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Slack, Figma, Notion…"
            className="w-full rounded-xl border border-white/10 bg-black/40 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CONNECTED_APP_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`rounded-full px-3 py-1 text-xs ${
                cat === c
                  ? "bg-violet-600 text-white"
                  : "border border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((app) => {
          const on = Boolean(map[app.id]?.connected);
          return (
            <article
              key={app.id}
              className={`rounded-2xl border p-4 ${
                on ? "border-emerald-500/30 bg-emerald-500/[0.06]" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-white">{app.name}</h3>
                  <p className="mt-0.5 text-[11px] text-zinc-500">{app.category}</p>
                </div>
                {on ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                    <Check className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-600">Not linked</span>
                )}
              </div>
              <p className="mt-2 text-sm text-zinc-400">{app.blurb}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {app.methods.map((m) => (
                  <span
                    key={m}
                    className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-zinc-500"
                  >
                    {METHOD_LABEL[m]}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openDetail(app)}
                  className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  {on ? "Manage" : "Connect"}
                </button>
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Open app <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {list.length === 0 && (
        <p className="text-center text-sm text-zinc-500">No apps match that search.</p>
      )}

      {openId && (
        <AppDetailModal
          app={CONNECTED_APPS.find((a) => a.id === openId)!}
          connected={Boolean(map[openId]?.connected)}
          tokenDraft={tokenDraft}
          noteDraft={noteDraft}
          onToken={setTokenDraft}
          onNote={setNoteDraft}
          onConnect={() => markConnected(openId)}
          onDisconnect={() => markDisconnected(openId)}
          onClose={() => setOpenId(null)}
        />
      )}

      <section className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 text-sm text-zinc-400">
        <p className="font-medium text-zinc-200">How multi-app AI products usually work</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong className="text-zinc-300">OAuth per app</strong> — you (or Plethora as a
            product) register a Slack/Figma developer app; users click “Allow”.
          </li>
          <li>
            <strong className="text-zinc-300">Zapier / Make / n8n</strong> — one bridge unlocks
            thousands of end apps without OAuth for each.
          </li>
          <li>
            <strong className="text-zinc-300">MCP</strong> — Claude/Cursor call tools you configure
            once (see MCP Hub + Zapier MCP).
          </li>
          <li>
            <strong className="text-zinc-300">BYO tokens</strong> — stored here locally for agent
            recipes (never put production secrets in public repos).
          </li>
        </ul>
        <p className="mt-3">
          Need a custom OAuth product path?{" "}
          <Link href="/pricing#enterprise" className="text-violet-400 hover:underline">
            Enterprise
          </Link>{" "}
          or request via chat.
        </p>
      </section>
    </div>
  );
}

function AppDetailModal({
  app,
  connected,
  tokenDraft,
  noteDraft,
  onToken,
  onNote,
  onConnect,
  onDisconnect,
  onClose,
}: {
  app: ConnectedApp;
  connected: boolean;
  tokenDraft: string;
  noteDraft: string;
  onToken: (v: string) => void;
  onNote: (v: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#12121a] p-5 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-white">{app.name}</h2>
            <p className="mt-1 text-sm text-zinc-500">{app.category}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-white"
          >
            Close
          </button>
        </div>
        <p className="mt-3 text-sm text-zinc-400">{app.blurb}</p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{app.how}</p>
        {app.mcpNote && (
          <p className="mt-2 flex items-start gap-2 text-xs text-emerald-300/90">
            <Workflow className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {app.mcpNote}
          </p>
        )}

        {(app.methods.includes("api_key") || app.tokenLabel) && (
          <label className="mt-4 block text-xs text-zinc-500">
            {app.tokenLabel || "Personal token (optional, this browser only)"}
            <input
              type="password"
              value={tokenDraft}
              onChange={(e) => onToken(e.target.value)}
              placeholder="Paste only if you understand the risk"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>
        )}

        <label className="mt-3 block text-xs text-zinc-500">
          Note (workspace name, board URL…)
          <input
            value={noteDraft}
            onChange={(e) => onNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              onConnect();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            <Check className="h-4 w-4" />
            {connected ? "Update connection" : "Mark as connected"}
          </button>
          {connected && (
            <button
              type="button"
              onClick={() => {
                onDisconnect();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 px-4 py-2 text-sm text-rose-300 hover:bg-rose-500/10"
            >
              <Unplug className="h-4 w-4" />
              Disconnect
            </button>
          )}
          <a
            href={app.docsUrl || app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Docs <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {app.methods.includes("mcp") && (
            <Link
              href="/mcp"
              className="inline-flex items-center gap-1 rounded-xl border border-violet-500/30 px-4 py-2 text-sm text-violet-200 hover:bg-violet-500/10"
            >
              <Plug className="h-3.5 w-3.5" />
              MCP setup
            </Link>
          )}
        </div>
        <p className="mt-4 text-[11px] text-zinc-600">
          Tokens stay in localStorage on this device. Clearing site data removes them. Do not paste
          production root keys on shared computers.
        </p>
      </div>
    </div>
  );
}
