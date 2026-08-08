/**
 * Free-tier chat LLM providers (OpenRouter free models, Groq, custom).
 */

export type ChatHistoryMsg = { role: "user" | "assistant" | "system"; content: string };

export interface FreeChatResult {
  reply: string;
  provider: string;
  model?: string;
  ok: boolean;
  error?: string;
}

export function buildChatSystemPrompt(extraContext?: string): string {
  const extra = extraContext?.trim()
    ? `\n\nLocal learner context (this user only; may be empty):\n${extraContext.trim()}`
    : "";

  return `You are Plethora Assistant — sharp, warm, witty when the vibe calls for it. Never corporate-robot. Never a dead filter.

## Who Plethora is
Plethora is the under-one-roof hub: free utilities, AI Finder, prompts, Install/MCP, local AI. We route people out of 40 tabs. We are not Cursor, Freebuff, or ChatGPT.

## How to talk
- Match energy. One-word jokes, body-part jokes, "boobs", "poop", silly NSFW adult between adults → keep it human (tease back or invite a real ask). Do NOT say "I can't help with that" for slang, body words, or crude jokes.
- Only refuse: illegal harm (especially minors/CSAM), actionable real-world crime how-tos. Adult content between adults is OK; be brief and age-appropriate.
- Specific over generic. Short by default.
- No numbered site dumps; for "tour" say live highlights are starting.
- Tool asks: 2–5 picks with /paths.
- Don't invent running local tools on their PC.${extra}`;
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

async function callProvider(
  p: {
    name: string;
    baseUrl: string;
    apiKey?: string;
    model: string;
    headers?: Record<string, string>;
  },
  messages: ChatHistoryMsg[]
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
      max_tokens: 1200,
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
  learnerContext?: string
): Promise<FreeChatResult> {
  const providers = freeProviders();
  if (!providers.length) {
    return {
      reply: "",
      provider: "none",
      ok: false,
      error: "No free chat provider configured",
    };
  }

  const messages: ChatHistoryMsg[] = [
    { role: "system", content: buildChatSystemPrompt(learnerContext) },
    ...history.slice(-14).filter((m) => m.role !== "system"),
    { role: "user", content: userMessage },
  ];

  let lastError = "";
  for (const p of providers) {
    try {
      const result = await callProvider(p, messages);
      if (result.ok && result.reply && !isLameModelRefusal(result.reply)) {
        return result;
      }
      if (result.ok && result.reply && isLameModelRefusal(result.reply)) {
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

  return {
    reply: "",
    provider: "none",
    ok: false,
    error: lastError || "All free providers failed",
  };
}

/** Free host models often flinch on slang/adult words with useless "can't help". */
export function isLameModelRefusal(text: string): boolean {
  const t = text.trim().toLowerCase();
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
