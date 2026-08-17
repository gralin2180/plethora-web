"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  LogOut,
  Sparkles,
  Unplug,
} from "lucide-react";
import {
  buildCodexAuthorizeUrl,
  CODEX_DEVICE_VERIFY_URL,
  CODEX_REDIRECT_URI,
  generateCodexPkce,
  parseCodexCallbackUrl,
  randomCodexState,
  type CodexTokenResponse,
} from "@/lib/codex-oauth";
import {
  clearCodexAuth,
  hasCodexSubscription,
  loadCodexAuth,
  loadPkceSession,
  saveCodexAuth,
  storePkceSession,
  tokensToStored,
  type StoredCodexAuth,
} from "@/lib/subscription-tokens";

type DeviceSession = {
  deviceAuthId: string;
  userCode: string;
  interval: number;
  verifyUrl: string;
};

export function SubscriptionAiClient() {
  const [connected, setConnected] = useState<StoredCodexAuth | null>(null);
  const [device, setDevice] = useState<DeviceSession | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<
    "idle" | "starting" | "waiting" | "done" | "error"
  >("idle");
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState("");
  const [browserBusy, setBrowserBusy] = useState(false);
  const [browserError, setBrowserError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setConnected(loadCodexAuth());
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const finishConnect = useCallback((tokens: CodexTokenResponse & { accountId?: string; email?: string }) => {
    const stored = tokensToStored(tokens);
    saveCodexAuth(stored);
    setConnected(stored);
    setDevice(null);
    setDeviceStatus("done");
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  async function startDeviceFlow() {
    setDeviceError(null);
    setDeviceStatus("starting");
    try {
      const res = await fetch("/api/subscription/codex/device/start", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        session?: DeviceSession;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.session) {
        throw new Error(data.error || "Could not start device login");
      }
      setDevice(data.session);
      setDeviceStatus("waiting");
      window.open(data.session.verifyUrl || CODEX_DEVICE_VERIFY_URL, "_blank", "noopener");

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        void pollDevice(data.session!);
      }, (data.session.interval || 5) * 1000);
    } catch (e) {
      setDeviceStatus("error");
      setDeviceError(e instanceof Error ? e.message : "Device login failed");
    }
  }

  async function pollDevice(session: DeviceSession) {
    try {
      const res = await fetch("/api/subscription/codex/device/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceAuthId: session.deviceAuthId,
          userCode: session.userCode,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        pending?: boolean;
        tokens?: CodexTokenResponse & { accountId?: string; email?: string };
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Poll failed");
      }
      if (data.pending) return;
      if (data.tokens) finishConnect(data.tokens);
    } catch (e) {
      setDeviceStatus("error");
      setDeviceError(e instanceof Error ? e.message : "Polling failed");
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }

  async function startBrowserFlow() {
    setBrowserError(null);
    setBrowserBusy(true);
    try {
      const pkce = await generateCodexPkce();
      const state = randomCodexState();
      storePkceSession({ verifier: pkce.verifier, state, redirectUri: CODEX_REDIRECT_URI });
      const url = buildCodexAuthorizeUrl(pkce, state);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      setBrowserError(e instanceof Error ? e.message : "Could not start browser login");
    } finally {
      setBrowserBusy(false);
    }
  }

  async function completeBrowserPaste() {
    setBrowserError(null);
    setBrowserBusy(true);
    try {
      const parsed = parseCodexCallbackUrl(callbackUrl);
      if (parsed.error) throw new Error(parsed.error);
      if (!parsed.code) throw new Error("No authorization code in URL");

      const session = loadPkceSession();
      if (!session?.verifier) {
        throw new Error("PKCE session expired — click “Browser login” again first");
      }
      if (parsed.state && parsed.state !== session.state) {
        throw new Error("State mismatch — try browser login again");
      }

      const res = await fetch("/api/subscription/codex/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: parsed.code,
          codeVerifier: session.verifier,
          redirectUri: session.redirectUri || CODEX_REDIRECT_URI,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        tokens?: CodexTokenResponse & { accountId?: string; email?: string };
        error?: string;
      };
      if (!res.ok || !data.ok || !data.tokens) {
        throw new Error(data.error || "Exchange failed");
      }
      finishConnect(data.tokens);
      setCallbackUrl("");
    } catch (e) {
      setBrowserError(e instanceof Error ? e.message : "Paste failed");
    } finally {
      setBrowserBusy(false);
    }
  }

  function disconnect() {
    clearCodexAuth();
    setConnected(null);
    setDevice(null);
    setDeviceStatus("idle");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 to-transparent p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-300" />
          <h1 className="text-2xl font-bold text-white">Subscription AI</h1>
        </div>
        <p className="mt-2 text-sm text-emerald-100/90">
          Connect your <strong className="text-white">ChatGPT Plus or Pro</strong> subscription —
          same idea as OpenCode. Your ChatGPT plan powers chat in Plethora; tokens stay in this
          browser only.
        </p>
      </div>

      {connected ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white">ChatGPT connected</p>
              <p className="mt-1 text-sm text-emerald-100/80">
                {connected.email ? connected.email : "Plus/Pro subscription active on this device"}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Chat uses your OpenAI subscription quota — not Plethora free/premium pools.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/chat"
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400"
                >
                  Open chat
                </Link>
                <button
                  type="button"
                  onClick={disconnect}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <h2 className="text-lg font-semibold text-white">Recommended: device code</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Works in the browser — no localhost callback needed. OpenAI shows a code; Plethora
              polls until you approve in ChatGPT.
            </p>
            {device && deviceStatus === "waiting" && (
              <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 text-center">
                <p className="text-xs uppercase tracking-wide text-violet-300">Your code</p>
                <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-white">
                  {device.userCode}
                </p>
                <a
                  href={device.verifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-violet-300 hover:underline"
                >
                  Open chatgpt.com/codex/device
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <p className="mt-3 flex items-center justify-center gap-2 text-xs text-zinc-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Waiting for approval…
                </p>
              </div>
            )}
            {deviceError && (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {deviceError}
              </p>
            )}
            <button
              type="button"
              onClick={() => void startDeviceFlow()}
              disabled={deviceStatus === "starting" || deviceStatus === "waiting"}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {deviceStatus === "starting" || deviceStatus === "waiting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unplug className="h-4 w-4" />
              )}
              Connect ChatGPT (device code)
            </button>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <h2 className="text-lg font-semibold text-white">Alternative: browser OAuth</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Opens OpenAI login. After redirect to{" "}
              <code className="text-zinc-300">localhost:1455</code>, copy the full URL from your
              browser bar and paste it below.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void startBrowserFlow()}
                disabled={browserBusy}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:bg-white/5 disabled:opacity-50"
              >
                Browser login
              </button>
            </div>
            <label className="mt-4 block text-xs text-zinc-500">
              Paste callback URL
              <input
                type="text"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                placeholder="http://localhost:1455/auth/callback?code=…&state=…"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
              />
            </label>
            <button
              type="button"
              onClick={() => void completeBrowserPaste()}
              disabled={!callbackUrl.trim() || browserBusy}
              className="mt-3 rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 disabled:opacity-40"
            >
              Complete connection
            </button>
            {browserError && (
              <p className="mt-3 text-sm text-red-300">{browserError}</p>
            )}
          </section>
        </>
      )}

      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
        <h2 className="text-sm font-semibold text-amber-200">Claude Pro / Max</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Anthropic restricted third-party Claude.ai subscription OAuth in early 2026. For Claude,
          use an{" "}
          <Link href="/settings/ai-keys" className="text-violet-400 hover:underline">
            Anthropic API key via BYOK
          </Link>{" "}
          or OpenRouter. Terminal tools like OpenCode may still offer other subscription paths.
        </p>
      </section>

      <p className="text-xs text-zinc-600">
        Personal/dev use with your own subscription. Plethora does not store OAuth tokens on our
        servers — only your browser sends them with chat requests.
      </p>
    </div>
  );
}