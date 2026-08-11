/**
 * Browser-only BYOK config (OpenAI-compatible providers).
 */

export type ByokProviderId =
  | "openrouter"
  | "openai"
  | "groq"
  | "xai"
  | "together"
  | "deepseek"
  | "custom";

export type ByokConfig = {
  provider: ByokProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
};

export const BYOK_STORAGE_KEY = "plethora.byok.v2";
/** Legacy single-key field — still read for migration */
export const BYOK_LEGACY_KEY = "plethora.byok.openrouter";

export type ByokPreset = {
  id: ByokProviderId;
  name: string;
  baseUrl: string;
  defaultModel: string;
  placeholder: string;
  docsUrl?: string;
  hint: string;
};

export const BYOK_PRESETS: ByokPreset[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openrouter/auto",
    placeholder: "sk-or-v1-…",
    docsUrl: "https://openrouter.ai/keys",
    hint: "One key → many models (Claude, GPT, Gemini…)",
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    placeholder: "sk-…",
    docsUrl: "https://platform.openai.com/api-keys",
    hint: "Official GPT API",
  },
  {
    id: "groq",
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    placeholder: "gsk_…",
    docsUrl: "https://console.groq.com/keys",
    hint: "Fast Llama / Mixtral",
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    baseUrl: "https://api.x.ai/v1",
    defaultModel: "grok-2-latest",
    placeholder: "xai-…",
    docsUrl: "https://console.x.ai/",
    hint: "Grok models",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    placeholder: "sk-…",
    docsUrl: "https://platform.deepseek.com/api_keys",
    hint: "DeepSeek chat / coder",
  },
  {
    id: "together",
    name: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    placeholder: "…",
    docsUrl: "https://api.together.xyz/",
    hint: "Open models at Together",
  },
  {
    id: "custom",
    name: "Custom (OpenAI-compatible)",
    baseUrl: "https://api.example.com/v1",
    defaultModel: "gpt-4o-mini",
    placeholder: "your-api-key",
    hint: "Any /v1/chat/completions endpoint",
  },
];

export function guessProvider(apiKey: string): ByokProviderId {
  const k = apiKey.trim();
  if (k.startsWith("sk-or-")) return "openrouter";
  if (k.startsWith("gsk_")) return "groq";
  if (k.startsWith("xai-")) return "xai";
  if (k.startsWith("sk-")) return "openai";
  return "custom";
}

export function loadByok(): ByokConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BYOK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ByokConfig;
      if (parsed?.apiKey && parsed.baseUrl) {
        return {
          provider: parsed.provider || "custom",
          apiKey: parsed.apiKey,
          baseUrl: parsed.baseUrl.replace(/\/$/, ""),
          model: parsed.model || "gpt-4o-mini",
        };
      }
    }
    const legacy = localStorage.getItem(BYOK_LEGACY_KEY);
    if (legacy?.trim()) {
      return {
        provider: "openrouter",
        apiKey: legacy.trim(),
        baseUrl: "https://openrouter.ai/api/v1",
        model: "openrouter/auto",
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveByok(config: ByokConfig) {
  if (typeof window === "undefined") return;
  const cleaned: ByokConfig = {
    provider: config.provider,
    apiKey: config.apiKey.trim(),
    baseUrl: config.baseUrl.trim().replace(/\/$/, ""),
    model: config.model.trim() || "gpt-4o-mini",
  };
  localStorage.setItem(BYOK_STORAGE_KEY, JSON.stringify(cleaned));
  // Keep legacy in sync so old code paths see a key
  if (cleaned.provider === "openrouter") {
    localStorage.setItem(BYOK_LEGACY_KEY, cleaned.apiKey);
  } else {
    localStorage.removeItem(BYOK_LEGACY_KEY);
  }
}

export function clearByok() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(BYOK_STORAGE_KEY);
  localStorage.removeItem(BYOK_LEGACY_KEY);
}

export function hasByok(): boolean {
  return Boolean(loadByok()?.apiKey);
}
