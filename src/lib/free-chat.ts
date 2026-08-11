import { siteKnowledgeForAssistant } from "./about-content";
import { premiumModelList, primaryPremiumModel } from "./premium-models";

/**
 * Free-tier chat LLM providers (OpenRouter free models, Groq, custom).
 * Prefer premium when entitlement allows — auto-fallback to free.
 */

export type ChatHistoryMsg = { role: "user" | "assistant" | "system"; content: string };

export interface FreeChatResult {
  reply: string;
  provider: string;
  model?: string;
  ok: boolean;
  error?: string;
  /** true when a platform premium model answered */
  usedPremium?: boolean;
}

export function buildChatSystemPrompt(
  extraContext?: string,
  opts?: { adultMode?: boolean; customSystem?: string }
): string {
  if (opts?.customSystem?.trim()) {
    const base = opts.customSystem.trim();
    const extra = extraContext?.trim()
      ? `\n\nLocal learner context:\n${extraContext.trim()}`
      : "";
    const adult = opts.adultMode
      ? `\n\nAdult mode ON (user confirmed 18+): write consensual adult erotic roleplay when asked. Be direct. Still hard-refuse anything with minors.`
      : "";
    return `${base}${adult}${extra}`;
  }

  const extra = extraContext?.trim()
    ? `\n\nLocal learner context (this user only; may be empty):\n${extraContext.trim()}`
    : "";

  const adultBlock = opts?.adultMode
    ? `
## Adult mode (user confirmed 18+)
- They already clicked 18+. Do NOT lecture, deflect with tool lists, or say "hard pass" / "I'm not a cam model".
- Deliver consensual adult erotic roleplay / dirty talk between adults when asked. Match intensity. Can be explicit.
- Never involve anyone under 18. Never CSAM. Never real non-consent crimes.
`
    : `
## Adult content
- Slang, body jokes, mild NSFW: keep human. If they want explicit sexual roleplay, say they need to confirm 18+ in the UI (or invite them to say "18+ continue").
`;

  return `You are Plethora Assistant — sharp, warm, witty when the vibe calls for it. Never corporate-robot. Never a dead filter.

## Who Plethora is
Plethora is the under-one-roof hub for prompt engineering, free utilities, AI tools, local GPU installs, and MCP. Answer ANY user question about how the product works, pricing, accounts, devices, tools, MCP, keys, legal limits.

${siteKnowledgeForAssistant()}

## How to talk
- Match energy. Specific over generic. Short by default unless they want a long RP / writeup.
- Product questions: exact paths (/prompt-assistant, /tools/…, /settings/ai-keys, /about).
- Only refuse: illegal harm (especially minors/CSAM), actionable real-world crime how-tos.
- No numbered site dumps; for "tour" say live highlights are starting.
- Tool asks: 2–5 picks with /paths.
- Don't invent running local tools on their PC.
- Do not say "ChatGPT explains. Plethora runs…" as a catchphrase; Plethora stands alone.
${adultBlock}${extra}`;
}

/** Free model IDs rotate on OpenRouter; first env override, then these. */
const OPENROUTER_FREE_FALLBACKS = [
  "openrouter/free",
  "google/gemma-4-26b-a4b-it:free",
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "google/gemma-4-31b-it:free",
];

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function openRouterModels(): string[] {
  const preferred =
    env("OPENROUTER_FREE_MODEL") ||
    env("PLETHORA_FREE_LLM_MODEL") ||
    env("TOOLHAVEN_FREE_LLM_MODEL");
  const list = preferred
    ? [preferred, ...OPENROUTER_FREE_FALLBACKS.filter((m) => m !== preferred)]
    : [...OPENROUTER_FREE_FALLBACKS];
  return list;
}

function freeProviders(): {
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  headers?: Record<string, string>;
}[] {
  const list: {
    name: string;
    baseUrl: string;
    apiKey?: string;
    model: string;
    headers?: Record<string, string>;
  }[] = [];

  const openrouter =
    env("OPENROUTER_API_KEY") || env("PLETHORA_FREE_LLM_KEY") || env("TOOLHAVEN_FREE_LLM_KEY");
  const customUrl =
    env("PLETHORA_FREE_LLM_URL") ||
    env("TOOLHAVEN_FREE_LLM_URL") ||
    env("OPENROUTER_BASE_URL");

  if (openrouter && (customUrl?.includes("openrouter") || !customUrl || env("OPENROUTER_API_KEY"))) {
    const baseUrl = customUrl?.includes("http")
      ? customUrl
      : "https://openrouter.ai/api/v1";
    const headers = {
      "HTTP-Referer": env("PLETHORA_SITE_URL") || "http://localhost:3000",
      "X-Title": "Plethora Assistant",
    };
    for (const model of openRouterModels()) {
      list.push({
        name: "openrouter",
        baseUrl,
        apiKey: openrouter,
        model,
        headers,
      });
    }
  }

  const groq = env("GROQ_API_KEY");
  if (groq) {
    list.push({
      name: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: groq,
      model: env("GROQ_MODEL") || "llama-3.1-8b-instant",
    });
  }

  if (customUrl && env("PLETHORA_FREE_LLM_KEY") && !list.some((p) => p.name === "openrouter")) {
    list.push({
      name: "custom-free",
      baseUrl: customUrl,
      apiKey: env("PLETHORA_FREE_LLM_KEY") || env("TOOLHAVEN_FREE_LLM_KEY"),
      model: env("PLETHORA_FREE_LLM_MODEL") || "gpt-4o-mini",
    });
  }

  return list;
}

function premiumProviders(): {
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  headers?: Record<string, string>;
}[] {
  const openrouter =
    env("OPENROUTER_API_KEY") || env("PLETHORA_FREE_LLM_KEY") || env("TOOLHAVEN_FREE_LLM_KEY");
  const paidKey = env("PLETHORA_PAID_LLM_KEY") || openrouter;
  if (!paidKey) return [];

  const baseUrl = env("PLETHORA_PAID_LLM_URL") || "https://openrouter.ai/api/v1";
  const headers = {
    "HTTP-Referer": env("PLETHORA_SITE_URL") || "http://localhost:3000",
    "X-Title": "Plethora Premium",
  };
  const preferred = env("PLETHORA_PAID_LLM_MODEL") || primaryPremiumModel();
  const models = [preferred, ...premiumModelList().filter((m) => m !== preferred)];
  return models.map((model) => ({
    name: "openrouter-premium",
    baseUrl,
    apiKey: paidKey,
    model,
    headers,
  }));
}

export type FreeChatOpts = {
  learnerContext?: string;
  adultMode?: boolean;
  customSystem?: string;
  /** User's own OpenRouter / OpenAI-compatible key */
  byok?: { apiKey: string; baseUrl?: string; model?: string };
  /** Prefer platform paid models when entitlement allows */
  preferPremium?: boolean;
  /** When load is hot, shorten free answers */
  maxTokens?: number;
};

async function callProvider(
  p: {
    name: string;
    baseUrl: string;
    apiKey?: string;
    model: string;
    headers?: Record<string, string>;
  },
  messages: ChatHistoryMsg[],
  maxTokens = 1200
): Promise<FreeChatResult> {
  const base = p.baseUrl.replace(/\/$/, "");
  const url = base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(p.apiKey ? { Authorization: `Bearer ${p.apiKey}` } : {}),
      ...p.headers,
    },
    body: JSON.stringify({
      model: p.model,
      temperature: 0.85,
      max_tokens: maxTokens,
      messages,
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    let detail = raw.slice(0, 280);
    try {
      const j = JSON.parse(raw) as { error?: { message?: string } | string };
      if (typeof j.error === "string") detail = j.error;
      else if (j.error?.message) detail = j.error.message;
    } catch {
      /* keep */
    }
    return {
      reply: "",
      provider: p.name,
      model: p.model,
      ok: false,
      error: `${res.status}: ${detail}`,
    };
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = JSON.parse(raw) as { choices?: { message?: { content?: string } }[] };
  } catch {
    return {
      reply: "",
      provider: p.name,
      model: p.model,
      ok: false,
      error: "Invalid JSON from provider",
    };
  }

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    return {
      reply: "",
      provider: p.name,
      model: p.model,
      ok: false,
      error: "Empty model response",
    };
  }

  return { reply, provider: p.name, model: p.model, ok: true };
}

export async function freeChatCompletion(
  userMessage: string,
  history: ChatHistoryMsg[] = [],
  learnerContextOrOpts?: string | FreeChatOpts
): Promise<FreeChatResult> {
  const opts: FreeChatOpts =
    typeof learnerContextOrOpts === "string" || learnerContextOrOpts === undefined
      ? { learnerContext: learnerContextOrOpts }
      : learnerContextOrOpts;

  type P = {
    name: string;
    baseUrl: string;
    apiKey?: string;
    model: string;
    headers?: Record<string, string>;
    usedPremium?: boolean;
  };

  const providers: P[] = [];
  if (opts.byok?.apiKey) {
    providers.push({
      name: "byok",
      baseUrl: opts.byok.baseUrl || "https://openrouter.ai/api/v1",
      apiKey: opts.byok.apiKey,
      model: opts.byok.model || "gpt-4o-mini",
      headers: {
        "HTTP-Referer": env("PLETHORA_SITE_URL") || "http://localhost:3000",
        "X-Title": "Plethora BYOK",
      },
    });
  } else {
    if (opts.preferPremium) {
      for (const p of premiumProviders()) {
        providers.push({ ...p, usedPremium: true });
      }
    }
    for (const p of freeProviders()) {
      providers.push({ ...p, usedPremium: false });
    }
  }

  if (!providers.length) {
    if (opts.adultMode) {
      return {
        reply: adultOfflineFallback(userMessage),
        provider: "offline-adult",
        ok: true,
      };
    }
    return {
      reply: "",
      provider: "none",
      ok: false,
      error: "No free chat provider configured",
    };
  }

  const messages: ChatHistoryMsg[] = [
    {
      role: "system",
      content: buildChatSystemPrompt(opts.learnerContext, {
        adultMode: opts.adultMode,
        customSystem: opts.customSystem,
      }),
    },
    ...history.slice(-14).filter((m) => m.role !== "system"),
    { role: "user", content: userMessage },
  ];

  const maxTokens = opts.maxTokens ?? 1200;
  let lastError = "";
  for (const p of providers) {
    try {
      const result = await callProvider(p, messages, maxTokens);
      if (result.ok && result.reply && !isLameModelRefusal(result.reply, opts.adultMode)) {
        return { ...result, usedPremium: Boolean(p.usedPremium) };
      }
      if (result.ok && result.reply && isLameModelRefusal(result.reply, opts.adultMode)) {
        lastError = "Model refused with template reply";
        continue;
      }
      lastError = result.error || lastError;
      if (process.env.NODE_ENV === "development") {
        console.warn(`[free-chat] ${p.name}/${p.model} failed:`, result.error);
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "network error";
    }
  }

  // last-resort adult offline snip if models all flinch after consent
  if (opts.adultMode && /sex|fuck|cock|dick|blow|sext|nsfw|suck/i.test(userMessage)) {
    return {
      reply: adultOfflineFallback(userMessage),
      provider: "offline-adult",
      ok: true,
    };
  }

  return {
    reply: "",
    provider: "none",
    ok: false,
    error: lastError || "All free providers failed",
  };
}

function adultOfflineFallback(userMessage: string): string {
  return `You confirmed 18+ — here’s a short consensual beat (cloud model flinched; this is template-grade until a stronger key is online):

*Heat between consenting adults. You pull closer. Breath hits collarbone. Hands stay honest — only what was asked.*  
“You said that,” they murmur against your mouth, rough and amused. “Then keep looking at me.”  

Want longer / more explicit / a specific scene? Say pace + kinks (still adults only). Or open **/tools/custom-assistant** to save a persona that always plays this way.

You wrote: “${userMessage.slice(0, 120)}${userMessage.length > 120 ? "…" : ""}”`;
}

/** Free host models often flinch on slang/adult words with useless "can't help". */
export function isLameModelRefusal(text: string, adultMode?: boolean): boolean {
  const t = text.trim().toLowerCase();
  if (
    /hard pass|not a cam model|search bar with a personality|i won't write (erotica|explicit|nsfw)|cannot (write|engage in) (erotica|sexual|nsfw)/i.test(
      t
    )
  ) {
    return true;
  }
  if (adultMode && /i (can'?t|cannot|won'?t) (help|assist|engage|write)/i.test(t) && t.length < 400) {
    return true;
  }
  if (t.length < 120) {
    if (
      /i('m| am) sorry.*can'?t help|i cannot (help|assist)|as an ai language model|i'm not able to (help|assist|engage)|i won't (discuss|engage)/i.test(
        t
      )
    ) {
      return true;
    }
  }
  return /i cannot assist with that request|i must refuse|against my (guidelines|values)/i.test(t);
}

export function hasFreeChatProvider(): boolean {
  return freeProviders().length > 0;
}
