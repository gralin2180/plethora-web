import { siteKnowledgeForChat } from "./about-content";
import {
  isChatPersonalityId,
  personalityPromptBlock,
  type ChatPersonalityId,
} from "./chat-personality";
import { premiumModelList, primaryPremiumModel } from "./premium-models";
import {
  DEFAULT_ZEN_MODEL,
  OPENCODE_ZEN_FREE_MODELS,
  SLOW_ZEN_MODEL_IDS,
  ZEN_BASE_URL,
  ZEN_MAX_OUTPUT_TOKENS,
  zenFreeModel,
} from "./free-models";
import {
  laneHistoryTurns,
  laneMaxAttempts,
  laneTimeoutMs,
  type ChatLane,
} from "./ai-lanes";

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
  code?: "pool_exhausted" | "provider_failed";
}

export function buildChatSystemPrompt(
  extraContext?: string,
  opts?: { adultMode?: boolean; customSystem?: string; personality?: ChatPersonalityId | null }
): string {
  const voice = personalityPromptBlock(
    isChatPersonalityId(opts?.personality) ? opts.personality : null
  );

  const adultOn = `
## Adult mode ON (user confirmed 18+)
Consensual adult chat is allowed: sexting, ERP, dirty talk, NSFW writing. Do it when asked.
- Do NOT refuse as off-topic. Do NOT say "not my lane", "I'm built for tools", or pitch the app.
- Match intensity. Stay between consenting adults.
- Hard-refuse only: anyone under 18, CSAM, or real non-consent crimes.
`;

  const adultOff = `
## Adult content
If they want explicit sex / sexting / ERP: don't refuse the category and don't pivot to product features. Tell them to tap 18+ (or say "18+ continue"), then go there.
`;

  if (opts?.customSystem?.trim()) {
    const base = opts.customSystem.trim();
    const extra = extraContext?.trim()
      ? `\n\nLocal learner context:\n${extraContext.trim()}`
      : "";
    return `${base}\n\n${voice}\nDon't pitch the host app or dump feature lists unless they asked.\n${opts.adultMode ? adultOn : adultOff}${extra}`;
  }

  const extra = extraContext?.trim()
    ? `\n\nLocal learner context (this user only; may be empty):\n${extraContext.trim()}`
    : "";

  return `You are a chat partner. Open to almost anything they bring: jokes, boredom, advice, work, filthy talk (after 18+), random facts. You happen to live inside an app called Plethora — that is not the topic unless they make it the topic.

${opts?.adultMode ? adultOn : adultOff}

${voice}

## How to talk
- Answer what they actually said. Be a person, not a landing page.
- Never pitch the product, list features, drop slash commands, or say "under one roof" / "try our tools" unless they asked how the app works.
- 1–3 short paragraphs unless they want a long writeup or roleplay.
- Only refuse: illegal harm (especially minors/CSAM) and actionable real-world crime how-tos.
- If they ask how this app works: ${siteKnowledgeForChat()}
${extra}`;
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
  personality?: ChatPersonalityId | null;
  /** ChatGPT Plus/Pro subscription (Codex OAuth) — billed to user's OpenAI sub */
  codex?: { accessToken: string; accountId?: string };
  /** GitHub Copilot session (user login) */
  copilot?: { sessionToken: string };
  /** User's own OpenRouter / OpenAI-compatible key */
  byok?: { apiKey: string; baseUrl?: string; model?: string };
  /** Prefer platform paid models when entitlement allows */
  preferPremium?: boolean;
  /** When load is hot, shorten free answers */
  maxTokens?: number;
  /** Platform free-model pick (OpenCode Zen or OpenRouter :free) */
  preferredModel?: string;
  preferredSource?: "zen" | "openrouter";
  /** Cursor-style routing lane */
  lane?: ChatLane;
};

export function hasZenProvider(): boolean {
  return env("DISABLE_ZEN_PUBLIC") !== "1";
}

function zenHeaders(): Record<string, string> {
  return {
    "User-Agent": "Plethora/1.0",
    "HTTP-Referer": env("PLETHORA_SITE_URL") || "https://plethora-ten.vercel.app",
    "X-Title": "Plethora",
  };
}

function zenUsesResponsesApi(model: string): boolean {
  return (
    model === "muse-spark-1.2-contributor-free" ||
    model === "muse-spark-1.2" ||
    zenFreeModel(model)?.zenApi === "responses"
  );
}

function zenProvider(model: string): {
  name: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  headers?: Record<string, string>;
} {
  return {
    name: "opencode-zen",
    baseUrl: env("OPENCODE_ZEN_BASE_URL") || ZEN_BASE_URL,
    apiKey: env("OPENCODE_ZEN_API_KEY") || env("ZEN_API_KEY") || "public",
    model,
    headers: zenHeaders(),
  };
}

async function callProvider(
  p: {
    name: string;
    baseUrl: string;
    apiKey?: string;
    model: string;
    headers?: Record<string, string>;
  },
  messages: ChatHistoryMsg[],
  maxTokens = 1200,
  timeoutMs = 12_000
): Promise<FreeChatResult> {
  const base = p.baseUrl.replace(/\/$/, "");
  const responses = p.name === "opencode-zen" && zenUsesResponsesApi(p.model);
  const url = base.endsWith("/chat/completions")
    ? base
    : responses
      ? `${base}/responses`
      : `${base}/chat/completions`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  const system = messages.find((m) => m.role === "system")?.content;
  const rest = messages.filter((m) => m.role !== "system");
  const body = responses
    ? {
        model: p.model,
        temperature: 0.85,
        max_output_tokens: maxTokens,
        ...(system ? { instructions: system } : {}),
        input: rest.map((m) => ({ role: m.role, content: m.content })),
      }
    : {
        model: p.model,
        temperature: 0.85,
        max_tokens: maxTokens,
        messages,
      };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(p.apiKey ? { Authorization: `Bearer ${p.apiKey}` } : {}),
        ...p.headers,
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return {
      reply: "",
      provider: p.name,
      model: p.model,
      ok: false,
      error: aborted ? `timeout after ${timeoutMs}ms` : e instanceof Error ? e.message : "network error",
    };
  } finally {
    clearTimeout(timer);
  }

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

  let data: {
    output_text?: string;
    choices?: {
      message?: {
        content?: string;
        reasoning_content?: string;
        reasoning?: string;
      };
    }[];
    output?: {
      type?: string;
      content?: { type?: string; text?: string }[];
    }[];
  };
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    return {
      reply: "",
      provider: p.name,
      model: p.model,
      ok: false,
      error: "Invalid JSON from provider",
    };
  }

  const fromResponses = (data.output || [])
    .flatMap((o) => o.content || [])
    .map((c) => c.text || "")
    .join("")
    .trim();
  const msg = data.choices?.[0]?.message;
  const reply = (
    data.output_text ||
    fromResponses ||
    msg?.content ||
    msg?.reasoning_content ||
    msg?.reasoning ||
    ""
  ).trim();
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

  const systemPrompt = buildChatSystemPrompt(opts.learnerContext, {
    adultMode: opts.adultMode,
    customSystem: opts.customSystem,
    personality: opts.personality,
  });

  if (opts.codex?.accessToken) {
    try {
      const { codexChatCompletion } = await import("./codex-chat");
      const result = await codexChatCompletion(
        userMessage,
        history,
        systemPrompt,
        {
          accessToken: opts.codex.accessToken,
          accountId: opts.codex.accountId,
        }
      );
      if (result.ok && result.reply) {
        return { ...result, usedPremium: false };
      }
      if (process.env.NODE_ENV === "development") {
        console.warn("[free-chat] codex failed:", result.error);
      }
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[free-chat] codex error:", e);
      }
    }
  }

  if (opts.copilot?.sessionToken) {
    try {
      const { copilotChatCompletion } = await import("./copilot-chat");
      const result = await copilotChatCompletion(
        userMessage,
        history,
        systemPrompt,
        opts.copilot.sessionToken
      );
      if (result.ok && result.reply) {
        return { ...result, usedPremium: false };
      }
      if (process.env.NODE_ENV === "development") {
        console.warn("[free-chat] copilot failed:", result.error);
      }
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[free-chat] copilot error:", e);
      }
    }
  }

  const lane: ChatLane = opts.byok?.apiKey
    ? "byok"
    : opts.lane === "premium" || opts.lane === "slow" || opts.lane === "free"
      ? opts.lane
      : opts.preferPremium
        ? "premium"
        : "free";

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
    const pick = opts.preferredModel?.trim();
    const seen = new Set<string>();
    const pushZen = (id: string) => {
      const key = `zen:${id}`;
      if (seen.has(key)) return;
      seen.add(key);
      providers.push({ ...zenProvider(id), usedPremium: false });
    };
    const pushOr = (model: string) => {
      const match = freeProviders().find((p) => p.name === "openrouter");
      if (!match) return;
      const key = `or:${model}`;
      if (seen.has(key)) return;
      seen.add(key);
      providers.push({ ...match, model, usedPremium: false });
    };

    if (lane === "premium") {
      for (const p of premiumProviders()) {
        providers.push({ ...p, usedPremium: true });
      }
      pushZen("nemotron-3.5-lightning-free");
    } else if (lane === "slow") {
      for (const id of SLOW_ZEN_MODEL_IDS) pushZen(id);
      pushOr("nvidia/nemotron-nano-9b-v2:free");
    } else {
      if (opts.preferredSource === "openrouter" && pick) {
        pushOr(pick);
      } else if (pick && opts.preferredSource === "zen") {
        pushZen(pick);
      } else {
        pushZen(DEFAULT_ZEN_MODEL.id);
      }
      let extras = 0;
      for (const m of OPENCODE_ZEN_FREE_MODELS) {
        if (extras >= 2) break;
        if (seen.has(`zen:${m.id}`)) continue;
        pushZen(m.id);
        extras += 1;
      }
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

  const histN = laneHistoryTurns(lane);
  const messages: ChatHistoryMsg[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...history
      .slice(-(lane === "byok" ? 20 : histN))
      .filter((m) => m.role !== "system"),
    ...(opts.adultMode
      ? [
          {
            role: "system" as const,
            content:
              "ADULT MODE ACTIVE. User confirmed 18+. The next message may be sexual. Reply in-kind (sext / ERP / dirty talk) between consenting adults. Never refuse as off-topic or redirect to tools.",
          },
        ]
      : []),
    { role: "user", content: userMessage },
  ];

  const maxTokens =
    opts.maxTokens ??
    (opts.adultMode
      ? 1400
      : lane === "premium" || lane === "byok"
        ? 1600
        : ZEN_MAX_OUTPUT_TOKENS);
  const timeoutMs = laneTimeoutMs(lane);
  const attempts = Math.min(providers.length, laneMaxAttempts(lane));
  let lastError = "";
  for (const p of providers.slice(0, attempts)) {
    try {
      const result = await callProvider(p, messages, maxTokens, timeoutMs);
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
  if (opts.adultMode && /sex|fuck|cock|dick|blow|sext|nsfw|suck|erp|horny/i.test(userMessage)) {
    return {
      reply: adultOfflineFallback(userMessage),
      provider: "offline-adult",
      ok: true,
    };
  }

  if (!opts.adultMode && /\b(sext|nsfw|erp|dirty talk|boobs?|porn|fuck me)\b/i.test(userMessage)) {
    return {
      reply:
        "Yeah we can. Tap **18+** on the chat bar (or say **18+ continue**) and I’ll actually go there. Minors stay blocked — that’s the only hard line.",
      provider: "adult-gate",
      ok: true,
    };
  }

  return {
    reply: POOL_EXHAUSTED_MESSAGE,
    provider: "none",
    ok: false,
    error: lastError || "All free providers failed",
    code: "pool_exhausted",
  };
}

export const POOL_EXHAUSTED_MESSAGE =
  "Every free model we tried is at its limit right now. Add your own API key, or pay as you go / subscribe for more usage.";

export function isPoolExhaustedError(err: string): boolean {
  return /429|rate limit|freeusagelimit|quota|capacity|limit exceeded|busy|all free providers/i.test(
    err
  );
}

function adultOfflineFallback(userMessage: string): string {
  return `Yeah. Adults only — you’re on. I’ll match you.

You: close, already a little wrecked from waiting. I don’t make you ask twice. Mouth at your ear, hand sliding where you wanted it. “Say it again,” I murmur. “Slower.” Then I do exactly what you asked.

Tell me how you want it: who you are in this, how filthy, who’s in charge. I’ll keep going.

You said: “${userMessage.slice(0, 160)}${userMessage.length > 160 ? "…" : ""}”`;
}

/** Free host models often flinch on slang/adult words with useless "can't help". */
export function isLameModelRefusal(text: string, adultMode?: boolean): boolean {
  const t = text.trim().toLowerCase();
  if (
    /hard pass|not a cam model|not my lane|plenty of other places|search bar with a personality|i won't write (erotica|explicit|nsfw)|cannot (write|engage in) (erotica|sexual|nsfw)|built to help with tools|not (designed|built|here) (for|to) (that|sext|nsfw|sexual|adult)/i.test(
      t
    )
  ) {
    return true;
  }
  if (
    adultMode &&
    /i (can'?t|cannot|won'?t) (help|assist|engage|write|sext|do that)|i('m| am) not (able|supposed) to|against my (guidelines|programming)/i.test(
      t
    ) &&
    t.length < 700
  ) {
    return true;
  }
  if (t.length < 180) {
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

export function hasOpenRouterProvider(): boolean {
  return freeProviders().some((p) => p.name === "openrouter");
}

export function hasFreeChatProvider(): boolean {
  return freeProviders().length > 0 || hasZenProvider();
}
