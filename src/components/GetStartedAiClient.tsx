"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  LogOut,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { SubscriptionAiClient } from "@/components/SubscriptionAiClient";
import {
  AI_PROVIDERS,
  clearCopilotAuth,
  getProvider,
  hasCopilotSubscription,
  loadConnectedAi,
  loadCopilotAuth,
  removeConnectedAccount,
  saveCopilotAuth,
  setPreferredAi,
  upsertApiKeyAccount,
  type AiLoginMethod,
  type ConnectedAiId,
} from "@/lib/connected-ai";
import { hasCodexSubscription, loadCodexAuth, clearCodexAuth } from "@/lib/subscription-tokens";

type Screen = "list" | "methods" | "connect" | "connected";

export function GetStartedAiClient() {
  const params = useSearchParams();
  const [screen, setScreen] = useState<Screen>("list");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<ConnectedAiId | null>(null);
  const [method, setMethod] = useState<AiLoginMethod | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const p = params.get("provider") as ConnectedAiId | null;
    if (p && AI_PROVIDERS.some((x) => x.id === p)) {
      const def = getProvider(p);
      setPicked(p);
      if (def.methods.length === 1) {
        setMethod(def.methods[0]);
        setScreen("connect");
      } else {
        setScreen("methods");
      }
    }
    if (params.get("tab") === "connected") {
      setScreen("connected");
    }
  }, [params]);

  const provider = picked ? getProvider(picked) : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? AI_PROVIDERS
      : AI_PROVIDERS.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.tagline.toLowerCase().includes(q) ||
            p.id.includes(q)
        );
    return {
      popular: list.filter((p) => p.group === "popular"),
      other: list.filter((p) => p.group === "other"),
    };
  }, [query]);

  const store = loadConnectedAi();
  const chatgptOn = hasCodexSubscription();
  const copilotOn = hasCopilotSubscription();
  const connectedList = AI_PROVIDERS.filter((p) => {
    if (p.id === "chatgpt") return chatgptOn;
    if (p.id === "github-copilot") return copilotOn;
    return Boolean(store.accounts[p.id]?.apiKey);
  });

  function refresh() {
    setTick((n) => n + 1);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6" data-refresh={tick}>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#161616] shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          {screen === "methods" || screen === "connect" ? (
            <button
              type="button"
              onClick={() => {
                if (screen === "connect") setScreen("methods");
                else {
                  setScreen("list");
                  setPicked(null);
                  setMethod(null);
                }
              }}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <span className="w-7" />
          )}
          <h1 className="text-sm font-semibold text-white">
            {screen === "connected"
              ? "Connected"
              : screen === "methods" || screen === "connect"
                ? `Connect ${provider?.name ?? ""}`
                : "Connect provider"}
          </h1>
          <Link
            href="/chat"
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>

        {screen === "list" && (
          <div className="p-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search providers"
                className="w-full rounded-lg border border-sky-500/70 bg-black/40 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-sky-400 focus:outline-none"
              />
            </label>
            <div className="mt-1 max-h-[min(68vh,560px)] overflow-y-auto">
            <ProviderGroup
              title="Popular"
              items={filtered.popular}
              onPick={(id) => {
                const p = getProvider(id);
                setPicked(id);
                if (p.methods.length === 1) {
                  setMethod(p.methods[0]);
                  setScreen("connect");
                } else {
                  setMethod(null);
                  setScreen("methods");
                }
              }}
            />
            <ProviderGroup
              title="Other"
              items={filtered.other}
              onPick={(id) => {
                const p = getProvider(id);
                setPicked(id);
                if (p.methods.length === 1) {
                  setMethod(p.methods[0]);
                  setScreen("connect");
                } else {
                  setMethod(null);
                  setScreen("methods");
                }
              }}
            />
            </div>
            {connectedList.length > 0 && (
              <button
                type="button"
                onClick={() => setScreen("connected")}
                className="mt-3 w-full rounded-lg py-2 text-center text-xs text-zinc-500 hover:text-white"
              >
                {connectedList.length} already connected →
              </button>
            )}
          </div>
        )}

        {screen === "methods" && provider && (
          <div className="p-5">
            <p className="text-sm font-medium text-white">Connect {provider.name}</p>
            <p className="mt-1 text-sm text-zinc-500">Select login method for {provider.name}.</p>
            <ul className="mt-4 space-y-1">
              {provider.methods.map((m) => (
                <li key={`${m.id}-${m.sub}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setMethod(m);
                      setScreen("connect");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-white/[0.06]"
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded border border-zinc-600" />
                    <span className="text-white">{m.title}</span>
                    <span className="text-zinc-500">{m.sub}</span>
                  </button>
                </li>
              ))}
            </ul>
            {provider.oauthBlocked && (
              <p className="mt-4 text-xs text-zinc-500">{provider.freeNote}</p>
            )}
          </div>
        )}

        {screen === "connect" && provider && method && (
          <div className="p-4">
            {provider.id === "chatgpt" && method.id !== "api-key" && (
              <SubscriptionAiClient
                compact
                forceFlow={method.id === "browser" ? "browser" : "device"}
              />
            )}
            {provider.id === "github-copilot" && (
              <CopilotConnectPanel onDone={refresh} />
            )}
            {(method.id === "api-key" ||
              (provider.method === "api-key" && provider.id !== "github-copilot")) &&
              provider.id !== "github-copilot" && (
                <ApiKeyConnectPanel
                  id={provider.id}
                  onDone={() => {
                    refresh();
                    setScreen("connected");
                  }}
                />
              )}
          </div>
        )}

        {screen === "connected" && (
          <div className="space-y-3 p-4">
            {connectedList.length === 0 ? (
              <p className="text-sm text-zinc-400">
                Nothing connected.{" "}
                <button
                  type="button"
                  className="text-violet-400 hover:underline"
                  onClick={() => setScreen("list")}
                >
                  Connect a provider
                </button>
              </p>
            ) : (
              connectedList.map((p) => {
                const preferred = store.preferred === p.id;
                const email = p.id === "chatgpt" ? loadCodexAuth()?.email : undefined;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2"
                  >
                    <div>
                      <p className="text-sm text-white">{p.name}</p>
                      <p className="text-xs text-zinc-500">
                        {email || "This device"}
                        {preferred ? " · in use" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPreferredAi(p.id);
                          refresh();
                        }}
                        className="rounded-md p-1.5 text-zinc-400 hover:text-amber-300"
                        aria-label="Use in chat"
                      >
                        <Star className={`h-4 w-4 ${preferred ? "fill-amber-400 text-amber-400" : ""}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (p.id === "chatgpt") clearCodexAuth();
                          else if (p.id === "github-copilot") clearCopilotAuth();
                          else removeConnectedAccount(p.id);
                          refresh();
                        }}
                        className="rounded-md p-1.5 text-zinc-500 hover:text-red-300"
                        aria-label="Disconnect"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScreen("list")}
                className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Add another
              </button>
              <Link
                href="/chat"
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white py-2 text-sm font-medium text-black hover:bg-zinc-200"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Chat
              </Link>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-zinc-600">
        Your login stays on this device. Each person uses their own AI.
      </p>
    </div>
  );
}

function ProviderGroup({
  title,
  items,
  onPick,
}: {
  title: string;
  items: typeof AI_PROVIDERS;
  onPick: (id: ConnectedAiId) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <p className="px-2 pb-1 text-[11px] font-medium text-zinc-500">{title}</p>
      <ul>
        {items.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onPick(p.id)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/[0.06]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-[10px] font-semibold text-zinc-300">
                {p.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-white">{p.name}</span>
                {p.tagline && (
                  <span className="block truncate text-[11px] text-zinc-500">{p.tagline}</span>
                )}
              </span>
              {p.recommended && (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-400">
                  Recommended
                </span>
              )}
              {p.id === "opencode-zen" && (
                <span className="rounded border border-zinc-600 px-1.5 py-px text-[10px] text-zinc-400">
                  Free
                </span>
              )}
              {p.custom && (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-zinc-400">
                  Custom
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
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

  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current);
    },
    []
  );

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
      pollRef.current = setInterval(
        () => void poll(data.session!.deviceCode),
        (data.session.interval || 5) * 1000
      );
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
      <div className="flex items-start gap-3 p-2">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
        <div>
          <p className="text-sm text-white">GitHub Copilot connected</p>
          <button
            type="button"
            onClick={() => {
              clearCopilotAuth();
              onDone();
            }}
            className="mt-2 text-sm text-zinc-500 hover:text-white"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      {status === "waiting" && (
        <div className="mb-4 text-center">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Your code</p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-white">{userCode}</p>
          <a
            href={verifyUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
          >
            Open github.com/login/device
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Waiting…
          </p>
        </div>
      )}
      {error && <p className="mb-2 text-sm text-red-300">{error}</p>}
      <button
        type="button"
        onClick={() => void start()}
        disabled={status === "starting" || status === "waiting"}
        className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
      >
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
  const [apiKey, setApiKey] = useState(existing?.apiKey || (id === "ollama" ? "ollama" : ""));
  const [model, setModel] = useState(existing?.model || def.defaultModel || "");
  const [baseUrl, setBaseUrl] = useState(existing?.baseUrl || def.baseUrl || "");

  function save() {
    if (!apiKey.trim()) return;
    upsertApiKeyAccount(id, { apiKey, model, baseUrl });
    setPreferredAi(id);
    onDone();
  }

  return (
    <div className="space-y-3">
      {def.oauthBlocked && (
        <p className="text-sm text-zinc-400">{def.freeNote}</p>
      )}
      <p className="text-sm text-zinc-500">
        {id === "opencode-zen" ? (
          <>
            Free models already work in Chat with no key. Optional: sign in at{" "}
            <a href={def.keyUrl || def.loginUrl} target="_blank" rel="noreferrer" className="text-white underline">
              opencode.ai/auth
            </a>{" "}
            if you want paid Zen models on your own balance.
          </>
        ) : (
          <>
            Sign in at{" "}
            <a href={def.keyUrl || def.loginUrl} target="_blank" rel="noreferrer" className="text-white underline">
              {def.name}
            </a>
            , then paste your key. It stays in this browser.
          </>
        )}
      </p>
      {id === "custom" && (
        <label className="block text-xs text-zinc-500">
          Base URL
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
      )}
      <label className="block text-xs text-zinc-500">
        API key
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={def.placeholder}
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </label>
      {id !== "opencode-zen" && (
      <label className="block text-xs text-zinc-500">
        Model
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </label>
      )}
      <button
        type="button"
        onClick={save}
        disabled={!apiKey.trim()}
        className="w-full rounded-lg bg-white py-2.5 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-40"
      >
        Save
      </button>
    </div>
  );
}
