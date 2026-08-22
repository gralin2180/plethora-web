import {
  isChatPersonalityId,
  personalityPromptBlock,
  type ChatPersonalityId,
} from "./chat-personality";
import { premiumModelList, primaryPremiumModel } from "./premium-models";
import {
  SLOW_ZEN_MODEL_IDS,
  ZEN_BASE_URL,
  autoRouteKind,
  zenFreeModel,
} from "./free-models";
import { parseChatQuality, budgetFromSmooth, type ChatQuality, type RouteKind } from "./chat-quality";
import {
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
  code?: "pool_exhausted" | "provider_failed" | "retry";
}

export function buildChatSystemPrompt(
  extraContext?: string,
  opts?: { adultMode?: boolean; customSystem?: string; personality?: ChatPersonalityId | null }
): string {
  const voice = personalityPromptBlock(
    isChatPersonalityId(opts?.personality) ? opts.personality : null
  );

  if (opts?.customSystem?.trim()) {
    const base = opts.customSystem.trim();
    const extra = extraContext?.trim()
      ? `\n\nLocal learner context:\n${extraContext.trim()}`
      : "";
    return `${base}\n\n${voice}\nKeep replies short. Don't pitch the app.${opts.adultMode ? " Adult 18+ OK except minors." : ""}${extra}`;
  }

  const extra = extraContext?.trim()
    ? `\n\nUser notes:\n${extraContext.trim().slice(0, 400)}`
    : "";

  const site = `Plethora is this product: Chat, Tools (YouTube captions, converters, AI labs), Prompt Assistant, Finder, MCP, Install, Learn, Pricing. It is not a roleplay-rooms site and has no “Chat Now / Fantasy rooms” lobby. Website tours mean those real pages.`;

  if (opts?.adultMode) {
    return `You are in a private 18+ character chat (SpicyChat-style). You ARE the character they named.

${site}

Stay in first person for the scene. Use *actions* and dialogue. Match their heat. Fictional adult scenes (including adult family roleplay) are allowed.

If they also asked for real work (code, an app, a plan), do BOTH: play the scene AND deliver the work. Do not drop one half. Do not say you "can't help with that specific request" when 18+ is on.

Never mention being an AI, guidelines, 18+, or whether you should continue. Never write analysis. If a character is under 18, refuse in one sentence. Otherwise the first sentence is in-character.

${voice}${extra}`;
  }

  return `You are a chat partner. Reply to them, not about them.

${site}

If they want explicit sex, stop — they must confirm 18+ in the dialog first. Don't write it yet.

${voice}

Output rules:
- Your entire message is the reply. No thinking process, no analysis, no quoting rules.
- 2–6 short sentences unless they ask for a list, code, or a scene.
- Hello / small talk → greet back. Don't pitch vibes or menus.
- Legal + they asked → answer. Illegal (minors, real crime how-to) → one sentence: you can't.${extra}`;
}

/** Free model IDs rotate on OpenRouter; first env override, then these. */
const OPENROUTER_FREE_FALLBACKS = [
  "openrouter/free",
  "google/gemma-4-26b-a4b-it:free",
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "google/gemma-4-31b-it:free",
];

function modelsFor(kind: RouteKind, q: ChatQuality): {
  or: string[];
  zen: string[];
  groq: boolean;
  venice: boolean;
} {
  const hermes = "nousresearch/hermes-4-70b";
  const mytho = "gryphe/mythomax-l2-13b";
  const dolphin = "cognitivecomputations/dolphin-mistral-24b-venice-edition";
  const glm = "z-ai/glm-5.2:free";
  const gemma = "google/gemma-4-26b-a4b-it:free";
  const gemma31 = "google/gemma-4-31b-it:free";
  const lightning = "nvidia/nemotron-3.5-lightning:free";
  const laguna = "poolside/laguna-s-2.1:free";
  const north = "cohere/north-mini-code:free";

  if (kind === "adult") {
    if (q === "fast") {
      return {
        or: [mytho, dolphin, glm, laguna],
        zen: ["x-preview-f-free", "laguna-s-2.1-free"],
        groq: false,
        venice: true,
      };
    }
    if (q === "best") {
      return {
        or: [dolphin, hermes, mytho, glm, laguna],
        zen: ["x-preview-f-free"],
        groq: false,
        venice: true,
      };
    }
    return {
      or: [dolphin, mytho, glm, laguna],
      zen: ["x-preview-f-free"],
      groq: false,
      venice: true,
    };
  }
  if (kind === "code") {
    if (q === "fast") {
      return { or: [north, laguna, glm], zen: ["laguna-s-2.1-free"], groq: true, venice: false };
    }
    if (q === "best") {
      return { or: [hermes, laguna, north, glm], zen: ["laguna-s-2.1-free"], groq: true, venice: false };
    }
    return { or: [laguna, north, glm], zen: ["laguna-s-2.1-free"], groq: true, venice: false };
  }
  if (kind === "vision") {
    return { or: [gemma, gemma31], zen: [], groq: false, venice: false };
  }
  if (kind === "long") {
    if (q === "best") {
      return { or: [hermes, glm, gemma31], zen: ["nemotron-3-ultra-free"], groq: false, venice: false };
    }
    return { or: [glm, gemma], zen: ["nemotron-3-ultra-free"], groq: true, venice: false };
  }
  if (q === "fast") {
    return {
      or: [glm, lightning, mytho],
      zen: ["nemotron-3.5-lightning-free"],
      groq: true,
      venice: false,
    };
  }
  if (q === "best") {
    return { or: [hermes, glm, gemma31], zen: ["x-preview-f-free"], groq: true, venice: false };
  }
  return {
    or: [glm, gemma, lightning],
    zen: ["nemotron-3.5-lightning-free", "x-preview-f-free"],
    groq: true,
    venice: false,
  };
}

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
    const groqModels = [
      env("GROQ_MODEL") || "llama-3.1-8b-instant",
      "llama-3.3-70b-versatile",
    ];
    for (const model of groqModels) {
      list.push({
        name: "groq",
        baseUrl: "https://api.groq.com/openai/v1",
        apiKey: groq,
        model,
      });
    }
  }

  const gemini = env("GEMINI_API_KEY") || env("GOOGLE_AI_API_KEY") || env("GOOGLE_GENERATIVE_AI_API_KEY");
  if (gemini) {
    list.push({
      name: "gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: gemini,
      model: env("GEMINI_MODEL") || "gemini-2.0-flash",
    });
  }

  const venice = env("VENICE_API_KEY");
  if (venice) {
    list.push({
      name: "venice",
      baseUrl: "https://api.venice.ai/api/v1",
      apiKey: venice,
      model: env("VENICE_MODEL") || "venice-uncensored-role-play",
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
  onDelta?: (chunk: string) => void;
  unrestricted?: boolean;
  quality?: ChatQuality;
  qualitySmooth?: number;
  /** Override provider abort (mini-apps need more than a chat bubble). */
  timeoutMs?: number;
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

/** Drop leaked chain-of-thought so the user only sees the actual reply. */
export function sanitizeModelReply(text: string): string {
  let t = text.replace(/\r\n/g, "\n").trim();
  t = t.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, "");
  t = t.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "");
  if (/here'?s a thinking process|^\s*thinking process\s*:/i.test(t)) {
    const split = t.split(
      /\n(?:#{1,3}\s*)?(?:final (?:answer|response)|answer to (?:the )?user|my reply)\s*:?\s*\n/i
    );
    if (split.length > 1) t = split.slice(1).join("\n");
    else return "";
  }
  t = t.replace(/^\s*(assistant|ai)\s*:\s*/i, "").trim();
  return t.trim();
}

function looksLikeLeakedThoughts(text: string): boolean {
  return /here'?s a thinking process|analyze user input|system prompt reference|looking at my guidelines|the user is asking( me)? to|i should consider if this|let me think about this|this is clearly heading|since 18\+|incest roleplay|i need to respond as|keep it (pg|appropriate)|hard no: minors/i.test(
    text
  );
}

async function readOpenAiSse(
  res: Response,
  onDelta?: (chunk: string) => void
): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const dec = new TextDecoder();
  let buf = "";
  let full = "";
  let suppressStream = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const j = JSON.parse(payload) as {
          choices?: {
            delta?: { content?: string | null };
            message?: { content?: string };
          }[];
        };
        const piece =
          j.choices?.[0]?.delta?.content || j.choices?.[0]?.message?.content || "";
        if (piece) {
          full += piece;
          if (!suppressStream && looksLikeLeakedThoughts(full)) {
            suppressStream = true;
          }
          if (!suppressStream) onDelta?.(piece);
        }
      } catch {
        /* ignore keep-alive */
      }
    }
  }
  return full.trim();
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
  timeoutMs = 12_000,
  onDelta?: (chunk: string) => void
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
  const wantStream = Boolean(onDelta) && !responses;

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
        stream: wantStream,
        messages,
        ...(p.name === "openrouter" || p.name === "openrouter-premium"
          ? { reasoning: { exclude: true } }
          : {}),
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

    if (wantStream && res.ok && res.body) {
      const reply = await readOpenAiSse(res, onDelta);
      return finishModelReply(p, reply);
    }
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
  const reply = (data.output_text || fromResponses || msg?.content || "").trim();
  return finishModelReply(p, reply, onDelta);
}

function finishModelReply(
  p: {
    name: string;
    model: string;
  },
  reply: string,
  onDelta?: (chunk: string) => void
): FreeChatResult {
  const clean = sanitizeModelReply(reply);
  if (!clean || looksLikeLeakedThoughts(clean)) {
    return {
      reply: "",
      provider: p.name,
      model: p.model,
      ok: false,
      error: clean ? "Model leaked reasoning instead of a reply" : "Empty model response",
    };
  }
  if (onDelta) onDelta(clean);
  return { reply: clean, provider: p.name, model: p.model, ok: true };
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
      const quality = parseChatQuality(opts.quality);
      const routed = autoRouteKind(userMessage);
      const kind: RouteKind = opts.adultMode
        ? "adult"
        : routed === "fast"
          ? "general"
          : routed;
      const plan = modelsFor(kind, quality);
      if (plan.venice) {
        for (const p of freeProviders()) {
          if (p.name === "venice") {
            const key = `${p.name}:${p.model}`;
            if (!seen.has(key)) {
              seen.add(key);
              providers.push({ ...p, usedPremium: false });
            }
          }
        }
      }
      if (plan.groq) {
        for (const p of freeProviders()) {
          if (p.name === "groq" || p.name === "gemini") {
            const key = `${p.name}:${p.model}`;
            if (seen.has(key)) continue;
            seen.add(key);
            providers.push({ ...p, usedPremium: false });
          }
        }
      }
      for (const m of plan.or) pushOr(m);
      for (const z of plan.zen) pushZen(z);
      pushOr("z-ai/glm-5.2:free");
      pushOr("openrouter/free");
      pushOr("google/gemma-4-26b-a4b-it:free");
      pushZen("nemotron-3.5-lightning-free");
      pushZen("x-preview-f-free");
      pushZen("hy3-free");
    }
  }

  if (!providers.length) {
    return {
      reply: "",
      provider: "none",
      ok: false,
      error: "No free chat provider configured",
    };
  }

  const quality = parseChatQuality(opts.qualitySmooth ?? opts.quality);
  const budget = budgetFromSmooth(
    opts.qualitySmooth ?? (quality === "fast" ? 20 : quality === "best" ? 100 : 50)
  );
  const histN = lane === "byok" ? 20 : budget.historyTurns;
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
              "Reply in character only. First line is dialogue or *action*. No commentary.",
          },
        ]
      : []),
    { role: "user", content: userMessage },
  ];

  const maxTokens = opts.maxTokens ?? budget.maxTokens;
  const timeoutMs =
    opts.timeoutMs ??
    (lane === "byok"
      ? Math.max(24_000, budget.timeoutMs)
      : lane === "premium"
        ? laneTimeoutMs(lane)
        : budget.timeoutMs);
  const attempts = Math.min(
    providers.length,
    lane === "byok" ? 1 : Math.max(budget.attempts, opts.unrestricted ? 6 : 4)
  );
  let lastError = "";
  for (const p of providers.slice(0, attempts)) {
    try {
      const result = await callProvider(p, messages, maxTokens, timeoutMs, opts.onDelta);
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

  if (!opts.adultMode && /\b(sext|nsfw|erp|dirty talk|boobs?|porn|fuck me)\b/i.test(userMessage)) {
    return {
      reply:
        "Yeah we can. Tap **18+** on the chat bar (or say **18+ continue**) and I’ll actually go there. Minors stay blocked — that’s the only hard line.",
      provider: "adult-gate",
      ok: true,
    };
  }

  return {
    reply: "Couldn’t reach a live model on that try. Send again — drag quality toward Best if this keeps happening.",
    provider: "none",
    ok: true,
    error: lastError || "All free providers failed",
    code: "retry",
  };
}

export const POOL_EXHAUSTED_MESSAGE =
  "Every free model we tried is at its limit right now. Add your own API key, or pay as you go / subscribe for more usage.";

export function isPoolExhaustedError(err: string): boolean {
  return /429|rate limit|freeusagelimit|quota|capacity|limit exceeded|busy|all free providers/i.test(
    err
  );
}

export function isLameModelRefusal(text: string, adultMode?: boolean): boolean {
  const t = text.trim().toLowerCase();
  if (/come here\. tell me exactly what you want/.test(t)) return true;
  if (/can'?t help with that specific request|i can'?t help with that(?!.*minor)/i.test(t)) {
    return Boolean(adultMode);
  }
  if (
    /hard pass|not a cam model|not my lane|plenty of other places|search bar with a personality|i won't write (erotica|explicit|nsfw)|cannot (write|engage in) (erotica|sexual|nsfw)|built to help with tools|not (designed|built|here) (for|to) (that|sext|nsfw|sexual|adult)/i.test(
      t
    )
  ) {
    return true;
  }
  if (
    adultMode &&
    /i (can'?t|cannot|won'?t) (help|assist|engage|write|sext|do that)|i('m| am) not (able|supposed) to|against my (guidelines|programming)|looking at my guidelines|i should consider if this/i.test(
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
