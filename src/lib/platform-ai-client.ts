/**
 * Browser helper: every AI feature talks to /api/chat the same way.
 * Attaches any connected key; the server auto-picks a free model.
 */

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
    const store = loadConnectedAi();
    const connected = await resolveConnectedChatAuth();
    if (connected.codex) {
      codexAccessToken = connected.codex.accessToken;
      codexAccountId = connected.codex.accountId;
      usedConnected = true;
    }
    if (connected.copilot?.sessionToken) {
      copilotSessionToken = connected.copilot.sessionToken;
      usedConnected = true;
    }
    if (connected.byok?.apiKey) {
      byokKey = connected.byok.apiKey;
      byokBaseUrl = connected.byok.baseUrl;
      byokModel = connected.byok.model;
      usedConnected = true;
    }
    if (!usedConnected) {
      const zenAcc = store.accounts["opencode-zen"];
      const orAcc = store.accounts["openrouter"];
      if (orAcc?.apiKey) {
        byokKey = orAcc.apiKey;
        byokBaseUrl = orAcc.baseUrl;
        usedConnected = true;
      } else if (zenAcc?.apiKey) {
        byokKey = zenAcc.apiKey;
        byokBaseUrl = zenAcc.baseUrl;
        usedConnected = true;
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
      const { loadSelectedChatModel } = await import("./free-models");
      const sel = loadSelectedChatModel();
      if (sel.kind === "connected") {
        /* resolveConnectedChatAuth handles connected path above */
      } else if (sel.kind === "zen") {
        preferredModel = sel.id;
        preferredSource = "zen";
      } else if (sel.kind === "openrouter") {
        preferredModel = sel.id;
        preferredSource = "openrouter";
      }
    } catch {
      /* */
    }
  }

  if (!usedConnected && !byokKey && !preferredModel) {
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
  opts?: {
    history?: { role: "user" | "assistant"; content: string }[];
    adultConsent?: boolean;
    toolJob?: boolean;
    maxTokens?: number;
    timeoutMs?: number;
    customSystem?: string;
    qualitySmooth?: number;
  }
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
      toolJob: Boolean(opts?.toolJob),
      maxTokens: opts?.maxTokens,
      timeoutMs: opts?.timeoutMs,
      customSystem: opts?.customSystem,
      qualitySmooth:
        opts?.qualitySmooth ?? (await import("./chat-quality")).loadSmoothQuality(),
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
