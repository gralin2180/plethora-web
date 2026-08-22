/**
 * Browser helper: every AI feature talks to /api/chat the same way.
 * Attaches the selected free model + any connected key.
 */

import { loadSelectedChatModel } from "./free-models";

export const AI_EXHAUSTED_EVENT = "plethora:ai-exhausted";

export type PlatformAiResult = {
  ok: boolean;
  reply: string;
  code?: string;
  exhausted: boolean;
  usedPremium?: boolean;
};

export function notifyAiExhausted() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AI_EXHAUSTED_EVENT));
}

export async function collectChatAuth(): Promise<{
  byokKey?: string;
  byokBaseUrl?: string;
  byokModel?: string;
  codexAccessToken?: string;
  codexAccountId?: string;
  copilotSessionToken?: string;
  preferredModel?: string;
  preferredSource?: "zen" | "openrouter";
}> {
  let byokKey: string | undefined;
  let byokBaseUrl: string | undefined;
  let byokModel: string | undefined;
  let codexAccessToken: string | undefined;
  let codexAccountId: string | undefined;
  let copilotSessionToken: string | undefined;
  let preferredModel: string | undefined;
  let preferredSource: "zen" | "openrouter" | undefined;
  let usedConnected = false;

  try {
    const { resolveConnectedChatAuth, loadConnectedAi } = await import("./connected-ai");
    const selected = loadSelectedChatModel();
    const store = loadConnectedAi();
    const zenAcc = store.accounts["opencode-zen"];

    if (selected.kind === "zen") {
      preferredModel = selected.id;
      preferredSource = "zen";
      if (zenAcc?.apiKey) {
        byokKey = zenAcc.apiKey;
        byokBaseUrl = zenAcc.baseUrl;
        byokModel = selected.id;
        usedConnected = true;
      }
    } else if (selected.kind === "openrouter") {
      preferredModel = selected.id;
      preferredSource = "openrouter";
      const orAcc = store.accounts["openrouter"];
      if (orAcc?.apiKey) {
        byokKey = orAcc.apiKey;
        byokBaseUrl = orAcc.baseUrl;
        byokModel = selected.id;
        usedConnected = true;
      }
    } else {
      preferredModel = selected.kind === "connected" ? undefined : undefined;
      preferredSource = "zen";
      const connected = await resolveConnectedChatAuth();
      if (connected.codex) {
        codexAccessToken = connected.codex.accessToken;
        codexAccountId = connected.codex.accountId;
        usedConnected = true;
        preferredSource = undefined;
      }
      if (connected.copilot?.sessionToken) {
        copilotSessionToken = connected.copilot.sessionToken;
        usedConnected = true;
        preferredSource = undefined;
      }
      if (connected.byok?.apiKey) {
        byokKey = connected.byok.apiKey;
        byokBaseUrl = connected.byok.baseUrl;
        byokModel = connected.byok.model;
        usedConnected = true;
        preferredSource = undefined;
      }
    }

    if (!usedConnected && !preferredSource) {
      preferredSource = "zen";
    }
  } catch {
    preferredSource = "zen";
  }

  if (!usedConnected && !byokKey) {
    try {
      const { loadByok } = await import("./byok");
      const b = loadByok();
      if (b?.apiKey) {
        byokKey = b.apiKey;
        byokBaseUrl = b.baseUrl;
        byokModel = b.model;
      }
    } catch {
      /* */
    }
  }

  return {
    byokKey,
    byokBaseUrl,
    byokModel,
    codexAccessToken,
    codexAccountId,
    copilotSessionToken,
    preferredModel,
    preferredSource: preferredSource ?? "zen",
  };
}

export async function runPlatformAi(
  message: string,
  opts?: { history?: { role: "user" | "assistant"; content: string }[]; adultConsent?: boolean }
): Promise<PlatformAiResult> {
  const auth = await collectChatAuth();
  let adultConsent = Boolean(opts?.adultConsent);
  if (!adultConsent) {
    try {
      const { loadAdultSession } = await import("./chat-personality");
      adultConsent = loadAdultSession();
    } catch {
      /* */
    }
  }
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: opts?.history ?? [],
      adultConsent,
      ...auth,
    }),
  });
  const data = (await res.json()) as {
    reply?: string;
    ok?: boolean;
    code?: string;
    usedPremium?: boolean;
  };
  const exhausted =
    data.code === "pool_exhausted" ||
    data.code === "quota" ||
    data.code === "guest_quota" ||
    data.code === "global_daily" ||
    data.code === "global_rate" ||
    data.code === "busy";
  if (exhausted) notifyAiExhausted();
  return {
    ok: Boolean(data.ok && data.reply),
    reply: data.reply || "",
    code: data.code,
    exhausted,
    usedPremium: data.usedPremium,
  };
}
