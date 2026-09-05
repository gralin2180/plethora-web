/**
 * Per-browser (per user) connected AI accounts — OpenCode-style.
 * OAuth tokens / keys stay in this device only.
 */

import { hasCodexSubscription } from "./subscription-tokens";

export type ConnectedAiId = string;

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

export type AiLoginMethod = {
  id: "browser" | "headless" | "api-key";
  title: string;
  sub: string;
};

export type AiProviderDef = {
  id: ConnectedAiId;
  name: string;
  tagline: string;
  group: "popular" | "other";
  recommended?: boolean;
  custom?: boolean;
  method: "oauth" | "api-key";
  methods: AiLoginMethod[];
  loginUrl: string;
  keyUrl?: string;
  baseUrl?: string;
  defaultModel?: string;
  placeholder?: string;
  freeNote: string;
  oauthBlocked?: boolean;
};

function apiOnly(): AiLoginMethod[] {
  return [{ id: "api-key", title: "API key", sub: "Browser" }];
}

export const AI_PROVIDERS: AiProviderDef[] = [
  {
    id: "chatgpt",
    name: "OpenAI",
    tagline: "ChatGPT Plus/Pro login or API key",
    group: "popular",
    recommended: true,
    method: "oauth",
    methods: [
      { id: "browser", title: "ChatGPT Pro/Plus", sub: "Browser" },
      { id: "headless", title: "ChatGPT Pro/Plus", sub: "Headless" },
      { id: "api-key", title: "API key", sub: "Browser" },
    ],
    loginUrl: "https://chatgpt.com",
    keyUrl: "https://platform.openai.com/api-keys",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    placeholder: "sk-…",
    freeNote: "Use the ChatGPT subscription you already pay for, or a platform API key.",
  },
  {
    id: "claude",
    name: "Anthropic",
    tagline: "Claude via API key (Pro login blocked)",
    group: "popular",
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://console.anthropic.com",
    keyUrl: "https://console.anthropic.com/settings/keys",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "anthropic/claude-sonnet-4",
    placeholder: "sk-or-… or OpenRouter key",
    oauthBlocked: true,
    freeNote: "Claude.ai subscription login is blocked. Use OpenRouter or an Anthropic-compatible key.",
  },
  {
    id: "gemini",
    name: "Google",
    tagline: "Gemini from AI Studio",
    group: "popular",
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://aistudio.google.com",
    keyUrl: "https://aistudio.google.com/apikey",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.0-flash",
    placeholder: "AIza…",
    freeNote: "Google login → free Gemini quota in AI Studio.",
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    tagline: "Log in with GitHub",
    group: "popular",
    recommended: true,
    method: "oauth",
    methods: [{ id: "headless", title: "GitHub Copilot", sub: "Device code" }],
    loginUrl: "https://github.com/login/device",
    freeNote: "Free Copilot is enough for many tasks.",
  },
  {
    id: "opencode-zen",
    name: "OpenCode Zen",
    tagline: "Free models (Laguna, Nemotron, Hy3…)",
    group: "popular",
    recommended: true,
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://opencode.ai/auth",
    keyUrl: "https://opencode.ai/auth",
    baseUrl: "https://opencode.ai/zen/v1",
    defaultModel: "laguna-s-2.1-free",
    placeholder: "your Zen API key",
    freeNote:
      "Free models work in Chat with no key. Paste a Zen key only if you want paid Zen models billed to you.",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    tagline: "One key, many models",
    group: "popular",
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://openrouter.ai",
    keyUrl: "https://openrouter.ai/keys",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openrouter/free",
    placeholder: "sk-or-v1-…",
    freeNote: "Free models if you pick :free ids.",
  },
  {
    id: "vercel",
    name: "Vercel AI Gateway",
    tagline: "Route through Vercel",
    group: "popular",
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://vercel.com/ai",
    keyUrl: "https://vercel.com/account/ai",
    baseUrl: "https://ai-gateway.vercel.sh/v1",
    defaultModel: "openai/gpt-4o-mini",
    placeholder: "vck_…",
    freeNote: "Vercel login, then paste a gateway key.",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    tagline: "Search + answer models",
    group: "popular",
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://www.perplexity.ai",
    keyUrl: "https://www.perplexity.ai/settings/api",
    baseUrl: "https://api.perplexity.ai",
    defaultModel: "sonar",
    placeholder: "pplx-…",
    freeNote: "Sign in on Perplexity, then paste your key.",
  },
  {
    id: "groq",
    name: "Groq",
    tagline: "Fast free Llama",
    group: "popular",
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://console.groq.com",
    keyUrl: "https://console.groq.com/keys",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-8b-instant",
    placeholder: "gsk_…",
    freeNote: "Free after signup.",
  },
  {
    id: "grok",
    name: "xAI",
    tagline: "Grok models",
    group: "other",
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://console.x.ai",
    keyUrl: "https://console.x.ai",
    baseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-2-latest",
    placeholder: "xai-…",
    freeNote: "Billed to your xAI account.",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    tagline: "Cheap coding + chat",
    group: "other",
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://platform.deepseek.com",
    keyUrl: "https://platform.deepseek.com/api_keys",
    baseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    placeholder: "sk-…",
    freeNote: "Sign in, then paste a key.",
  },
  {
    id: "together",
    name: "Together AI",
    tagline: "Open models",
    group: "other",
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://api.together.xyz",
    keyUrl: "https://api.together.xyz/settings/api-keys",
    baseUrl: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    placeholder: "…",
    freeNote: "Pay as you go after login.",
  },
  {
    id: "fireworks",
    name: "Fireworks AI",
    tagline: "Hosted open models",
    group: "other",
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://fireworks.ai",
    keyUrl: "https://fireworks.ai/account/api-keys",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    defaultModel: "accounts/fireworks/models/llama-v3p1-8b-instruct",
    placeholder: "fw_…",
    freeNote: "Sign in at Fireworks.",
  },
  {
    id: "cerebras",
    name: "Cerebras",
    tagline: "Very fast inference",
    group: "other",
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://cloud.cerebras.ai",
    keyUrl: "https://cloud.cerebras.ai",
    baseUrl: "https://api.cerebras.ai/v1",
    defaultModel: "llama-3.3-70b",
    placeholder: "csk-…",
    freeNote: "Sign in at Cerebras Cloud.",
  },
  {
    id: "mistral",
    name: "Mistral",
    tagline: "Mistral API",
    group: "other",
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://console.mistral.ai",
    keyUrl: "https://console.mistral.ai/api-keys",
    baseUrl: "https://api.mistral.ai/v1",
    defaultModel: "mistral-small-latest",
    placeholder: "…",
    freeNote: "Console login + API key.",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    tagline: "Inference API",
    group: "other",
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://huggingface.co",
    keyUrl: "https://huggingface.co/settings/tokens",
    baseUrl: "https://router.huggingface.co/v1",
    defaultModel: "meta-llama/Llama-3.1-8B-Instruct",
    placeholder: "hf_…",
    freeNote: "HF token after login.",
  },
  {
    id: "ollama",
    name: "Ollama",
    tagline: "Local models on your machine",
    group: "other",
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://ollama.com",
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3.1",
    placeholder: "ollama (any)",
    freeNote: "Runs on your PC. Paste ollama as key if required.",
  },
  {
    id: "custom",
    name: "Custom OpenAI-compatible",
    tagline: "Any /v1/chat/completions endpoint",
    group: "other",
    custom: true,
    method: "api-key",
    methods: apiOnly(),
    loginUrl: "https://opencode.ai/docs/providers/",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    placeholder: "your-api-key",
    freeNote: "Paste base URL + key for any compatible host.",
  },
];

import { EXTENDED_AI_PROVIDERS } from "./ai-provider-catalog";

/** Full OpenCode-style catalog — popular + extended hosts */
export const ALL_AI_PROVIDERS: AiProviderDef[] = [
  ...AI_PROVIDERS,
  ...(EXTENDED_AI_PROVIDERS as AiProviderDef[]),
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

export function setConnectedAccountModel(id: ConnectedAiId, model: string) {
  const store = loadConnectedAi();
  const acc = store.accounts[id];
  if (!acc) return;
  store.accounts[id] = { ...acc, model };
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
