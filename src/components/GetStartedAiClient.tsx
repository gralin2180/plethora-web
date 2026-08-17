"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  LogOut,
  Plug,
  Sparkles,
  Star,
} from "lucide-react";
import { SubscriptionAiClient } from "@/components/SubscriptionAiClient";
import {
  AI_PROVIDERS,
  clearCopilotAuth,
  getProvider,
  hasAnyConnectedAi,
  hasCopilotSubscription,
  loadConnectedAi,
  loadCopilotAuth,
  removeConnectedAccount,
  saveCopilotAuth,
  setPreferredAi,
  upsertApiKeyAccount,
  type ConnectedAiId,
} from "@/lib/connected-ai";
import { hasCodexSubscription, loadCodexAuth, clearCodexAuth } from "@/lib/subscription-tokens";

type Tab = "get-started" | "connected";

export function GetStartedAiClient() {
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>("get-started");
  const [picked, setPicked] = useState<ConnectedAiId>("chatgpt");
  const [tick, setTick] = useState(0);
  const provider = useMemo(() => getProvider(picked), [picked]);

  useEffect(() => {
    const p = params.get("provider") as ConnectedAiId | null;
    if (p && AI_PROVIDERS.some((x) => x.id === p)) setPicked(p);
    if (params.get("tab") === "connected" || hasAnyConnectedAi()) setTab("connected");
  }, [params]);

  function refresh() {
    setTick((n) => n + 1);
  }

  const store = loadConnectedAi();
  const chatgptOn = hasCodexSubscription();
  const copilotOn = hasCopilotSubscription();
  const connectedList = AI_PROVIDERS.filter((p) => {
    if (p.id === "chatgpt") return chatgptOn;
    if (p.id === "github-copilot") return copilotOn;
    return Boolean(store.accounts[p.id]?.apiKey);
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12 sm:px-6" data-refresh={tick}>
      <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-500/15 to-transparent p-5">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-violet-300" />
          <h1 className="text-2xl font-bold text-white">
            {connectedList.length ? "Connected" : "Get started"}
          </h1>
        </div>
        <p className="mt-2 text-sm text-violet-100/90">
          Log in to the AI accounts you already have — ChatGPT, Copilot, Perplexity, Gemini, Groq,
          and more. <strong className="text-white">Each person uses their own login</strong> on this
          device. Plethora does not share or store your tokens on our servers.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
        <button
          type="button"
          onClick={() => setTab("get-started")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "get-started" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          Get started
        </button>
        <button
          type="button"
          onClick={() => setTab("connected")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
            tab === "connected" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          Connected{connectedList.length ? ` (${connectedList.length})` : ""}
        </button>
      </div>

      {tab === "get-started" ? (
        <section className="space-y-5">
          <p className="text-sm text-zinc-400">
            Pick a site, sign in there, and come back. Then chat in Plethora uses{" "}
            <em>your</em> quota — like OpenCode’s /connect.
          </p>
          <label className="block text-xs text-zinc-500">
            AI to connect
            <select
              value={picked}
              onChange={(e) => setPicked(e.target.value as ConnectedAiId)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="font-medium text-white">{provider.name}</p>
            <p className="mt-1 text-sm text-zinc-400">{provider.tagline}</p>
            <p className="mt-2 text-xs text-zinc-500">{provider.freeNote}</p>
          </div>

          {picked === "chatgpt" && <SubscriptionAiClient compact />}
          {picked === "github-copilot" && <CopilotConnectPanel onDone={refresh} />}
          {provider.method === "api-key" && (
            <ApiKeyConnectPanel
              id={picked}
              onDone={() => {
                refresh();
                setTab("connected");
              }}
            />
          )}
        </section>
      ) : (
        <section className="space-y-3">
          {connectedList.length === 0 ? (
            <p className="rounded-xl border border-white/10 p-4 text-sm text-zinc-400">
              Nothing connected on this device yet. Open{" "}
            <button
              type="button"
              className="text-violet-400 hover:underline"
              onClick={() => setTab("get-started")}
            >
              Get started
            </button>{" "}
              and pick an AI.
            </p>
          ) : (
            connectedList.map((p) => {
              const preferred = store.preferred === p.id ||
                (p.id === "chatgpt" && (store.preferred === "chatgpt" || (!store.preferred && chatgptOn)));
              const email =
                p.id === "chatgpt" ? loadCodexAuth()?.email : undefined;
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{p.name}</p>
                    <p className="text-xs text-zinc-500">
                      {email || "This browser only"}
                      {preferred ? " · in use for chat" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPreferredAi(p.id);
                        refresh();
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
                    >
                      <Star className={`h-3.5 w-3.5 ${preferred ? "fill-amber-400 text-amber-400" : ""}`} />
                      Use in chat
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (p.id === "chatgpt") {
                          clearCodexAuth();
                        } else if (p.id === "github-copilot") {
                          clearCopilotAuth();
                        } else {
                          removeConnectedAccount(p.id);
                        }
                        refresh();
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:text-red-300"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Disconnect
                    </button>
                  </div>
                </div>
              );
            })
          )}
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            <Sparkles className="h-4 w-4" />
            Open chat
          </Link>
        </section>
      )}
    </div>
  );
}

function CopilotConnectPanel({ onDone }: { onDone: () => void }) {
  const [status, setStatus] = useState<"idle" | "starting" | "waiting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [userCode, setUserCode] = useState("");
  const [verifyUrl, setVerifyUrl] = useState("https://github.com/login/device");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connected = Boolean(loadCopilotAuth());

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  async function start() {
    setError(null);
    setStatus("starting");
    try {
      const res = await fetch("/api/subscription/copilot/start", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        session?: { deviceCode: string; userCode: string; verificationUri: string; interval: number };
        error?: string;
      };
      if (!res.ok || !data.ok || !data.session) throw new Error(data.error || "Could not start");
      setUserCode(data.session.userCode);
      setVerifyUrl(data.session.verificationUri);
      setStatus("waiting");
      window.open(data.session.verificationUri, "_blank", "noopener");
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => void poll(data.session!.deviceCode), (data.session.interval || 5) * 1000);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function poll(deviceCode: string) {
    try {
      const res = await fetch("/api/subscription/copilot/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceCode }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        pending?: boolean;
        githubToken?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) throw new Error(data.error || "Poll failed");
      if (data.pending || !data.githubToken) return;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      saveCopilotAuth({ githubToken: data.githubToken, connectedAt: Date.now() });
      await fetch("/api/subscription/copilot/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubToken: data.githubToken }),
      })
        .then((r) => r.json())
        .then((t: { sessionToken?: string; expiresAt?: number }) => {
          if (t.sessionToken) {
            saveCopilotAuth({
              githubToken: data.githubToken!,
              sessionToken: t.sessionToken,
              sessionExpiresAt: t.expiresAt,
              connectedAt: Date.now(),
            });
          }
        })
        .catch(() => {
          /* session later */
        });
      setPreferredAi("github-copilot");
      setStatus("idle");
      onDone();
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed");
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }

  if (connected) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
        <div>
          <p className="font-medium text-white">GitHub Copilot connected</p>
          <p className="mt-1 text-sm text-zinc-400">This GitHub login is on this device only.</p>
          <button
            type="button"
            onClick={() => {
              clearCopilotAuth();
              onDone();
            }}
            className="mt-3 text-sm text-zinc-400 hover:text-white"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
      <p className="text-sm text-zinc-400">
        GitHub shows a code. Approve it, then Copilot (free or paid) powers Plethora chat.
      </p>
      {status === "waiting" && (
        <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-violet-300">Your code</p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-white">{userCode}</p>
          <a
            href={verifyUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm text-violet-300 hover:underline"
          >
            Open github.com/login/device
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Waiting for approval…
          </p>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      <button
        type="button"
        onClick={() => void start()}
        disabled={status === "starting" || status === "waiting"}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        {status === "starting" || status === "waiting" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plug className="h-4 w-4" />
        )}
        Connect GitHub Copilot
      </button>
    </div>
  );
}

function ApiKeyConnectPanel({
  id,
  onDone,
}: {
  id: ConnectedAiId;
  onDone: () => void;
}) {
  const def = getProvider(id);
  const existing = loadConnectedAi().accounts[id];
  const [apiKey, setApiKey] = useState(existing?.apiKey || "");
  const [model, setModel] = useState(existing?.model || def.defaultModel || "");

  function save() {
    if (!apiKey.trim()) return;
    upsertApiKeyAccount(id, { apiKey, model, baseUrl: def.baseUrl });
    setPreferredAi(id);
    onDone();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-5">
      {def.oauthBlocked && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Third-party Claude.ai login is blocked. Use an Anthropic/OpenRouter API key instead.
        </p>
      )}
      <p className="text-sm text-zinc-400">
        1.{" "}
        <a href={def.loginUrl} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">
          Sign in on {def.name}
        </a>
        {def.keyUrl && (
          <>
            {" "}
            → 2.{" "}
            <a href={def.keyUrl} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">
              create a key
            </a>
          </>
        )}
        . Keys stay in this browser.
      </p>
      <label className="block text-xs text-zinc-500">
        API key
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={def.placeholder}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
        />
      </label>
      <label className="block text-xs text-zinc-500">
        Model
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={def.defaultModel}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
        />
      </label>
      {id === "claude" && (
        <p className="text-xs text-zinc-600">
          Native Anthropic keys need OpenRouter (or a compatible proxy). Prefer the OpenRouter option
          in the dropdown for Claude models.
        </p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={!apiKey.trim()}
        className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40"
      >
        Save on this device
      </button>
    </div>
  );
}
