/**
 * Per-browser (per user) connected AI accounts — OpenCode-style.
 * OAuth tokens / keys stay in this device only.
 */

import { hasCodexSubscription } from "./subscription-tokens";

export type ConnectedAiId =
  | "chatgpt"
  | "github-copilot"
  | "perplexity"
  | "gemini"
  | "groq"
  | "grok"
  | "claude"
  | "openrouter";

export type ConnectedAiAccount = {
  id: ConnectedAiId;
  kind: "oauth" | "api-key";
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  label?: string;
  connectedAt: number;
};

export type ConnectedAiStore = {
  preferred: ConnectedAiId | null;
  accounts: Partial<Record<ConnectedAiId, ConnectedAiAccount>>;
};

export const CONNECTED_AI_STORAGE_KEY = "plethora.connected-ai.v1";
export const COPILOT_STORAGE_KEY = "plethora.copilot.oauth.v1";

export type StoredCopilotAuth = {
  githubToken: string;
  sessionToken?: string;
  sessionExpiresAt?: number;
  connectedAt: number;
};

export type AiProviderDef = {
  id: ConnectedAiId;
  name: string;
  tagline: string;
  method: "oauth" | "api-key";
  loginUrl: string;
  keyUrl?: string;
  baseUrl?: string;
  defaultModel?: string;
  placeholder?: string;
  freeNote: string;
  oauthBlocked?: boolean;
};

export const AI_PROVIDERS: AiProviderDef[] = [
  {
    id: "chatgpt",
    name: "ChatGPT (Plus / Pro / Free)",
    tagline: "Log in with your OpenAI account — same idea as OpenCode.",
    method: "oauth",
    loginUrl: "https://chatgpt.com",
    freeNote:
      "Works best with Plus/Pro. Free ChatGPT logins may be limited by OpenAI.",
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    tagline: "Log in with GitHub — Free, Pro, or Business Copilot.",
    method: "oauth",
    loginUrl: "https://github.com/login/device",
    freeNote: "Copilot Free is enough for many coding tasks.",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    tagline: "Sign in on Perplexity, then paste your API key.",
    method: "api-key",
    loginUrl: "https://www.perplexity.ai",
    keyUrl: "https://www.perplexity.ai/settings/api",
    baseUrl: "https://api.perplexity.ai",
    defaultModel: "sonar",
    placeholder: "pplx-…",
    freeNote:
      "Create a Perplexity account (free). API usage is billed to you, not Plethora.",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    tagline: "Google login → AI Studio key (free quota).",
    method: "api-key",
    loginUrl: "https://aistudio.google.com",
    keyUrl: "https://aistudio.google.com/apikey",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.0-flash",
    placeholder: "AIza…",
    freeNote: "Google account + free Gemini API quota in AI Studio.",
  },
  {
    id: "groq",
    name: "Groq",
    tagline: "Free-tier Llama after you sign up.",
    method: "api-key",
    loginUrl: "https://console.groq.com",
    keyUrl: "https://console.groq.com/keys",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-8b-instant",
    placeholder: "gsk_…",
    freeNote: "Generous free rate limits after login.",
  },
  {
    id: "grok",
    name: "xAI Grok",
    tagline: "Sign in at xAI console, then paste a key.",
    method: "api-key",
    loginUrl: "https://console.x.ai",
    keyUrl: "https://console.x.ai",
    baseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-2-latest",
    placeholder: "xai-…",
    freeNote: "Billed to your xAI account.",
  },
  {
    id: "claude",
    name: "Claude (Anthropic)",
    tagline: "Claude.ai Pro login is blocked for third-party apps.",
    method: "api-key",
    loginUrl: "https://console.anthropic.com",
    keyUrl: "https://console.anthropic.com/settings/keys",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-sonnet-4-20250514",
    placeholder: "sk-ant-…",
    oauthBlocked: true,
    freeNote:
      "Use an Anthropic API key or OpenRouter. Claude.ai subscription OAuth is not available.",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    tagline: "One login, many models (including free ones).",
    method: "api-key",
    loginUrl: "https://openrouter.ai",
    keyUrl: "https://openrouter.ai/keys",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openrouter/free",
    placeholder: "sk-or-v1-…",
    freeNote: "Sign up free. Pick :free models so you aren’t billed.",
  },
];

export function getProvider(id: ConnectedAiId): AiProviderDef {
  return AI_PROVIDERS.find((p) => p.id === id) || AI_PROVIDERS[0];
}

export function loadConnectedAi(): ConnectedAiStore {
  if (typeof window === "undefined") return { preferred: null, accounts: {} };
  try {
    const raw = localStorage.getItem(CONNECTED_AI_STORAGE_KEY);
    if (!raw) return { preferred: null, accounts: {} };
    const parsed = JSON.parse(raw) as ConnectedAiStore;
    return {
      preferred: parsed.preferred ?? null,
      accounts: parsed.accounts || {},
    };
  } catch {
    return { preferred: null, accounts: {} };
  }
}

export function saveConnectedAi(store: ConnectedAiStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONNECTED_AI_STORAGE_KEY, JSON.stringify(store));
}

export function setPreferredAi(id: ConnectedAiId | null) {
  const store = loadConnectedAi();
  store.preferred = id;
  saveConnectedAi(store);
}

export function upsertApiKeyAccount(
  id: ConnectedAiId,
  data: { apiKey: string; baseUrl?: string; model?: string; label?: string }
) {
  const def = getProvider(id);
  const store = loadConnectedAi();
  store.accounts[id] = {
    id,
    kind: "api-key",
    apiKey: data.apiKey.trim(),
    baseUrl: (data.baseUrl || def.baseUrl || "").replace(/\/$/, ""),
    model: data.model || def.defaultModel,
    label: data.label,
    connectedAt: Date.now(),
  };
  if (!store.preferred) store.preferred = id;
  saveConnectedAi(store);
}

export function removeConnectedAccount(id: ConnectedAiId) {
  const store = loadConnectedAi();
  delete store.accounts[id];
  if (store.preferred === id) {
    store.preferred = (Object.keys(store.accounts)[0] as ConnectedAiId) || null;
  }
  saveConnectedAi(store);
}

export function loadCopilotAuth(): StoredCopilotAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COPILOT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCopilotAuth;
    if (!parsed?.githubToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCopilotAuth(auth: StoredCopilotAuth) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COPILOT_STORAGE_KEY, JSON.stringify(auth));
}

export function clearCopilotAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(COPILOT_STORAGE_KEY);
}

export async function getValidCopilotAuth(): Promise<StoredCopilotAuth | null> {
  const current = loadCopilotAuth();
  if (!current) return null;
  if (current.sessionToken && current.sessionExpiresAt && Date.now() < current.sessionExpiresAt) {
    return current;
  }
  try {
    const res = await fetch("/api/subscription/copilot/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ githubToken: current.githubToken }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      sessionToken?: string;
      expiresAt?: number;
    };
    if (!res.ok || !data.ok || !data.sessionToken) {
      if (res.status === 401) clearCopilotAuth();
      return current.githubToken ? current : null;
    }
    const next: StoredCopilotAuth = {
      ...current,
      sessionToken: data.sessionToken,
      sessionExpiresAt: data.expiresAt ?? Date.now() + 25 * 60 * 1000,
    };
    saveCopilotAuth(next);
    return next;
  } catch {
    return current;
  }
}

export function hasCopilotSubscription(): boolean {
  return Boolean(loadCopilotAuth()?.githubToken);
}

export function hasAnyConnectedAi(): boolean {
  if (hasCodexSubscription() || hasCopilotSubscription()) return true;
  const store = loadConnectedAi();
  return Object.values(store.accounts).some((a) => a?.apiKey || a?.kind === "oauth");
}

/** Credentials the current user wants chat to use this turn. */
export async function resolveConnectedChatAuth(): Promise<{
  preferred: ConnectedAiId | null;
  codex?: { accessToken: string; accountId?: string };
  copilot?: { sessionToken?: string; githubToken: string };
  byok?: { apiKey: string; baseUrl?: string; model?: string };
  label?: string;
}> {
  const store = loadConnectedAi();
  let preferred = store.preferred;

  if (!preferred) {
    if (hasCodexSubscription()) preferred = "chatgpt";
    else if (hasCopilotSubscription()) preferred = "github-copilot";
    else {
      const firstKey = Object.values(store.accounts).find((a) => a?.apiKey);
      if (firstKey) preferred = firstKey.id;
    }
  }

  if (preferred === "chatgpt") {
    try {
      const { getValidCodexAuth } = await import("./subscription-tokens");
      const c = await getValidCodexAuth();
      if (c?.accessToken) {
        return {
          preferred: "chatgpt",
          codex: { accessToken: c.accessToken, accountId: c.accountId },
          label: "ChatGPT",
        };
      }
    } catch {
      /* */
    }
  }

  if (preferred === "github-copilot") {
    const c = await getValidCopilotAuth();
    if (c?.githubToken) {
      return {
        preferred: "github-copilot",
        copilot: { sessionToken: c.sessionToken, githubToken: c.githubToken },
        label: "GitHub Copilot",
      };
    }
  }

  if (preferred) {
    const acc = store.accounts[preferred];
    if (acc?.apiKey) {
      return {
        preferred,
        byok: { apiKey: acc.apiKey, baseUrl: acc.baseUrl, model: acc.model },
        label: getProvider(preferred).name,
      };
    }
  }

  return { preferred: preferred ?? null };
}
