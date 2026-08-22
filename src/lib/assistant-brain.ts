/**
 * Chat / floating assistant brain.
 * Middleman persona · any topic · tools only when useful · offline IQ when LLM fails.
 */

import { freeChatCompletion, hasFreeChatProvider } from "./free-chat";
import {
  loadChatPersonality,
  parsePersonalityChoice,
  type ChatPersonalityId,
} from "./chat-personality";
import { recommendAiForTask } from "./recommender";
import { buildRefinedPrompt } from "./prompt-engine";
import { loadPersonalContext, contextToPromptBlock } from "./personal-context";
import { PLATFORM_TOOLS, searchTools } from "./tools-registry";
import { ABOUT_FAQS } from "./about-content";
import { getMcpsForTask } from "./mcp-registry";
import {
  getPopularTools,
  getRecentTools,
  learnFromChat,
  selfLearnSummaryForAssistant,
  trackToolUse,
} from "./self-learn";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  at: string;
  files?: { name: string; kind: string; thumb?: string }[];
}

export function newMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    at: new Date().toISOString(),
  };
}

function applyChatSideEffects(
  data: {
    code?: string;
    softWarnMessage?: string;
    quota?: { mode?: string; used?: number; limit?: number; label?: string; lane?: string };
  },
  notifyAiExhausted: () => void
) {
  if (
    data.code === "pool_exhausted" ||
    data.code === "quota" ||
    data.code === "guest_quota" ||
    data.code === "global_daily" ||
    data.code === "global_rate" ||
    data.code === "busy"
  ) {
    if (data.quota?.mode === "dev" || (data as { unrestricted?: boolean }).unrestricted) return;
    notifyAiExhausted();
  }
  if (typeof window !== "undefined" && data.softWarnMessage) {
    window.dispatchEvent(
      new CustomEvent("plethora:soft-warn", { detail: data.softWarnMessage })
    );
  }
  if (typeof window !== "undefined" && data.quota?.mode === "premium" && data.quota.limit) {
    window.dispatchEvent(
      new CustomEvent("plethora:quota-label", {
        detail: `Premium ${data.quota.used ?? "?"}/${data.quota.limit}`,
      })
    );
  } else if (typeof window !== "undefined" && data.quota?.mode === "dev") {
    window.dispatchEvent(
      new CustomEvent("plethora:quota-label", {
        detail: data.quota.label || "Dev — unrestricted",
      })
    );
  } else if (typeof window !== "undefined" && data.quota?.mode === "subscription") {
    window.dispatchEvent(
      new CustomEvent("plethora:quota-label", {
        detail: data.quota.label || "Your AI login",
      })
    );
  } else if (typeof window !== "undefined" && data.quota?.mode && data.quota.mode !== "byok") {
    const laneBit = data.quota.label ? `${data.quota.label} · ` : "";
    window.dispatchEvent(
      new CustomEvent("plethora:quota-label", {
        detail: `${laneBit}${data.quota.mode === "premium" ? "Included" : "Free"} ${data.quota.used ?? "?"}/${data.quota.limit ?? "?"}`,
      })
    );
  }
}

export type ChatIntent =
  | "greeting"
  | "mood"
  | "tour"
  | "app_help"
  | "convert_tools"
  | "find_tools"
  | "banter"
  | "general";

/** Prefer conversation; only tool-route when intent is clear. */
export function classifyChatIntent(text: string): ChatIntent {
  const t = text.toLowerCase().trim();

  if (
    /\b(feel(ing)?|mood|sad|dull|low|lonely|anxious|depress|burnt out|burned out|empty|numb|tired of life|down today|unmotivated|bored out|meh|blah|not okay|not ok)\b/.test(
      t
    ) ||
    /\bi('m| am) (so )?(sad|dull|low|tired|meh|blah|empty)\b/.test(t)
  ) {
    return "mood";
  }

  if (
    /\b(tour|walk ?through|show me (the |around )?(app|site|website)|how (do|to) (i )?use (this|plethora)|getting started|onboard)\b/.test(
      t
    )
  ) {
    return "tour";
  }

  if (
    /^(hi|hello|hey|yo|sup|howdy|good (morning|evening|afternoon))([\s,.!?]*)$/i.test(t)
  ) {
    return "greeting";
  }

  const productAsk =
    /\b(what is plethora|who are you|what do you do|personal context|privacy|pricing|hardcore|mcp hub|install hub|prompt assistant|middleman|under one roof|sign in|login|api key|openrouter|workspace|device|\bfaq\b|free limit|upgrade)\b/i.test(
      t
    ) ||
    (/\b(how (do|does|to)|where (is|do))\b/i.test(t) &&
      /\b(plethora|prompt assistant|mcp|api key|sign ?in|limit|pricing|workspace|byok|install)\b/i.test(
        t
      ));
  if (productAsk && !/\b(18\+|eighteen|boobs?|tits|nsfw|sex)\b/i.test(t)) {
    return "app_help";
  }

  // Short silliness / banter → never sterile refusals
  if (
    t.length <= 32 &&
    /^(poop|lol|lmao|haha|ok|okay|hmm+|nah|ye|ya|bruh|bro|wtf|idk|k|nice|cool|sus|test|ping|boop|hehe|hihi|boobs?|tits|ass|butt|penis|dick|balls|fart|lmao+|yolo|uwu|owo)[\s!.?]*$/i.test(
      t
    )
  ) {
    return "banter";
  }
  if (t.length <= 3 || /^(.)\1{2,}$/.test(t)) {
    return "banter";
  }

  if (
    /\b(convert|pdf|png|jpg|jpeg|webp|merge pdf|background remov|youtube download|yt-dlp|ffmpeg|image to pdf)\b/.test(
      t
    )
  ) {
    return "convert_tools";
  }

  if (
    /\b(find (me )?(ai |a )?tools?|which (ai|tool)|recommend (a |an )?(tool|ai|app)|super-?assist|build (me )?(a |an )|make (me )?(ads?|ugc|landing)|create (a |an )?(campaign|saas|website)|scrap(e|ing)|install ollama|cursor rules|what's popular|popular tools|recent tools)\b/.test(
      t
    ) ||
    /\b(ugc brand|facebook ads for|google ads for)\b/.test(t)
  ) {
    return "find_tools";
  }

  return "general";
}

function websiteTour(): string {
  return `On it — live highlight tour. Follow the glowing spots and short dialogues. **Next** / **Back** / **Skip** anytime.`;
}

function banterReply(text: string): string {
  const t = text.toLowerCase().trim();
  if (/poop|💩|fart/.test(t)) {
    return `Peak discourse. Filter’s awake. You actually want something, or are we stress-testing scat jokes?`;
  }
  if (/boob|tit|ass|butt|penis|dick|balls/.test(t)) {
    return `Yeah I caught that. If you want it explicit, tap 18+ when it pops — then I’ll actually go there. Otherwise we can just mess around. What’s the mood?`;
  }
  if (/lol|lmao|haha|hehe|😂/.test(t)) {
    return `Ok you’re giggling. Want a joke, a roast, or are you stalling?`;
  }
  if (/^(ok|okay|k|cool|nice)\b/.test(t)) {
    return `Cool. Keep going — I’m not going anywhere.`;
  }
  if (/^(test|ping|boop)\b/.test(t)) {
    return `Pong. Still a person on this side, not a FAQ.`;
  }
  if (/idk|hmm/.test(t)) {
    return `Valid. Bored, stuck, or just poking the chat? Pick one and I’ll meet you there.`;
  }
  if (t.length <= 3) {
    return `That’s a crumb. Give me a sentence and I’ll talk back.`;
  }
  return `Got “${text.slice(0, 40)}”. I’m listening — say more or change the subject.`;
}

function moodReply(text: string): string {
  return `Rough air — noted. Not gonna sticky-note your whole day.

Pick a mode: **vent** (I’ll listen), **tiny reset** (5‑min body/water/window), **distract** (silly or curious), or **practical** (one thing that makes tonight 5% easier).

Not therapy. If it’s crisis-level, talk to a real person or local hotline.

You said: “${text.slice(0, 100)}”`;
}

function greetingReply(): string {
  return `Hey. I’m here. What’s going on?`;
}

function appHelp(text: string): string {
  const t = text.toLowerCase();

  // FAQ keyword hits
  for (const item of ABOUT_FAQS) {
    const words = item.q
      .toLowerCase()
      .replace(/[?]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const hits = words.filter((w) => t.includes(w)).length;
    if (hits >= 2 || t.includes(item.q.toLowerCase().slice(0, 20))) {
      return `**${item.q}**\n\n${item.a}\n\nMore: /about · ask another product question anytime.`;
    }
  }

  if (/personal|privacy|leak|data|self.?learn/i.test(text)) {
    return `**Personal context** + **self-learn** stay on *your* device (localStorage). We track what tools *you* open to rank Recent / For you — not upload that to train a public model.

Servers only see what you type into chat when a free LLM key is configured. Details: /settings/personal · /about.`;
  }
  if (/pric|pro|hardcore|paid|subscription|free plan|upgrade/i.test(text)) {
    return `**Free core:** chat (fair daily limit when signed in), utilities, templates, install/MCP maps, tool discovery. **Pro/Hardcore:** higher limits, seats, power stacks. Details: /pricing · /hardcore · /about.`;
  }
  if (/sign.?in|login|account|auth|email/i.test(text)) {
    return `**Accounts:** /auth/signup or /auth/login with email. Needed for shared cloud AI fair-use and for workspaces/devices. Browser-only tools often work without an account. BYOK: /settings/ai-keys.`;
  }
  if (/api.?key|openrouter|byok|rate.?limit|quota/i.test(text)) {
    return `**Keys:** Platform free chat uses our OpenRouter (or similar) key with per-user daily caps after login. Heavy use → paste **your** OpenRouter key at /settings/ai-keys (stored in this browser only). We cannot auto-mint free vendor keys per user.`;
  }
  if (/mcp|claude desktop|cursor/i.test(text)) {
    return `**Plethora MCP:** Open /mcp — Create your own MCP at the top, then install Plethora MCP config into Claude Desktop or Cursor. Agents can search tools, captions, DNS, etc.`;
  }
  if (/workspace|device|seat/i.test(text)) {
    return `**Workspaces & devices:** After sign-in, /workspaces. Free ~ few browser seats + limited workspaces; paid raises limits. SQL tables must exist in your Supabase project.`;
  }
  if (/who are you|what is plethora|what do you do|middleman|under one roof|about/i.test(text)) {
    return `**Plethora** started as prompt engineering — now the middleman roof for prompts, free tools that run, Finder, Install/MCP, local AI, chat.

Map: **/tools** · **/prompt-assistant** · **/ai-finder** · **/install** · **/mcp** · **/chat** · **/about**. Say **tour** for highlights.`;
  }
  if (/how (do|to)|where (is|do)|what (is|does)|can i|help with/i.test(text) && t.length < 120) {
    return `I answer product questions too. Try: “how do free limits work?”, “how install Plethora MCP?”, “where is prompt assistant?”

Quick map: **/tools** · **/prompt-assistant** · **/ai-finder** · **/mcp** · **/about** (FAQ) · **/settings/ai-keys**.`;
  }
  return `Middleman map: **/tools** · **/ai-finder** · **/prompt-assistant** · **/install** · **/mcp** · **/chat** · **/about**. Ask anything about how Plethora works — accounts, MCP, pricing, tools.`;
}

function convertToolsReply(): string {
  const popular = typeof window !== "undefined" ? getPopularTools(4) : [];
  const free = PLATFORM_TOOLS.filter((t) => t.category === "Free Utilities").slice(0, 6);
  const list = (popular.length ? popular : free)
    .filter((t) => t.category === "Free Utilities" || popular.includes(t))
    .slice(0, 5);
  const picks = (list.length ? list : free).map(
    (t) => `• **${t.name}** — /tools/${t.slug}${t.actionHint ? ` (${t.actionHint})` : ""}`
  );
  return `Converters & free utilities (drop-zone first, less reading):\n\n${picks.join("\n")}\n\nMore: /tools → Free Utilities. Need a specific format? Name it.`;
}

function findToolsReply(text: string): string {
  if (/\b(popular|trending)\b/i.test(text)) {
    const pops =
      typeof window !== "undefined"
        ? getPopularTools(6)
        : PLATFORM_TOOLS.slice(0, 6);
    return (
      `**Popular right now** (global demand + your usage):\n\n` +
      pops.map((t) => `• **${t.name}** — /tools/${t.slug === "chat" ? "…" : t.slug} · ${t.category}`).join("\n") +
      `\n\nOpen /tools → **Popular** tab for the full smart rank.`
    );
  }
  if (/\brecent\b/i.test(text)) {
    const rec = typeof window !== "undefined" ? getRecentTools(6) : [];
    if (!rec.length) {
      return `No recent tools yet — poke anything under /tools and it’ll land on your **Recent** tab.`;
    }
    return (
      `**Your recent tools:**\n\n` +
      rec.map((t) => `• **${t.name}** — /tools/${t.slug}`).join("\n")
    );
  }

  const rec = recommendAiForTask(text, "any");
  const internal = searchTools(text).slice(0, 4);
  const tools = rec.playbooks
    .slice(0, 4)
    .map((p) => `• **${p.tool.name}**${p.tool.url ? ` (${p.tool.url})` : ""} — ${p.whyForYou}`)
    .join("\n");
  const internalLines = internal
    .map((t) => `• **${t.name}** (in Plethora) — /tools/${t.slug}`)
    .join("\n");

  return [
    `Under one roof first, then solid externals if needed:`,
    "",
    internalLines || "(no internal slug match — using broader AI picks)",
    "",
    tools,
    "",
    `Dig deeper: /ai-finder · /install · /tools (Popular / For you). Say **full prompt please** for a specialist prompt.`,
  ].join("\n");
}

function smartOfflineGeneral(text: string): string {
  if (/\b(meaning of life|why (are )?we here)\b/i.test(text)) {
    return `42 is overrated. Short version: reduce unnecessary suffering, make a few things you care about, stay curious. Want more philosophy or a smaller take?`;
  }
  if (/\b(joke|funny|make me laugh)\b/i.test(text)) {
    return `A SQL query walks into a bar, walks up to two tables, and asks: “Can I join you?” …I’ll stop. Want a dirtier one or a drier one?`;
  }
  if (/\b(how (do|to) (i )?start|where do i begin)\b/i.test(text)) {
    return `Start with the next smallest move you can finish in 10 minutes. If you tell me what you’re trying to do, I’ll pick one with you.`;
  }

  return `I’m with you on: “${text.slice(0, 160)}${text.length > 160 ? "…" : ""}”

Brain’s offline so I’m thinner than usual — keep talking anyway. What’s the actual thing you want out of this?`;
}

export async function generateAssistantReply(
  userText: string,
  history: ChatMessage[] = [],
  opts?: {
    adultConsent?: boolean;
    personality?: ChatPersonalityId | null;
    onDelta?: (chunk: string) => void;
    quality?: import("./chat-quality").ChatQuality;
  }
): Promise<string> {
  const text = userText.trim();
  if (!text) return "I’m here. Drop a thought, a task, or pure chaos.";

  if (typeof window !== "undefined") {
    try {
      learnFromChat(text);
    } catch {
      /* ignore */
    }
  }

  const personality =
    (typeof window !== "undefined" ? loadChatPersonality() : null) ??
    opts?.personality ??
    parsePersonalityChoice(text);

  if (opts?.adultConsent) {
    const llm = await tryLlm(text, history, {
      adultConsent: true,
      personality,
      onDelta: opts?.onDelta,
      quality: opts?.quality,
    });
    if (llm) return llm;
  }

  const intent = classifyChatIntent(text);

  if (intent === "tour") return websiteTour();

  const llm = await tryLlm(text, history, {
    adultConsent: opts?.adultConsent,
    personality,
    onDelta: opts?.onDelta,
    quality: opts?.quality,
  });
  if (llm) return llm;

  if (intent === "greeting") return greetingReply();
  if (intent === "banter") return banterReply(text);
  if (intent === "mood") return moodReply(text);
  if (intent === "app_help") return appHelp(text);
  if (intent === "convert_tools") return convertToolsReply();
  if (intent === "find_tools") {
    if (/\bfull prompt\b/i.test(text)) {
      const personal = loadPersonalContext();
      let prompt = buildRefinedPrompt(text.replace(/full prompt( please)?/i, "").trim() || text, {});
      if (personal.enabled) {
        const b = contextToPromptBlock(personal);
        if (b) prompt = `${b}\n\n${prompt}`;
      }
      return `Copy-ready specialist prompt:\n\n\`\`\`\n${prompt}\n\`\`\``;
    }
    return findToolsReply(text);
  }

  return smartOfflineGeneral(text);
}

function learnerBundle(): string {
  const parts: string[] = [];
  if (typeof window !== "undefined") {
    const sum = selfLearnSummaryForAssistant();
    if (sum) parts.push(sum);
    const personal = loadPersonalContext();
    if (personal.enabled) {
      const b = contextToPromptBlock(personal);
      if (b) parts.push(b);
    }
  }
  return parts.join("\n");
}

async function tryLlm(
  text: string,
  history: ChatMessage[],
  opts?: {
    adultConsent?: boolean;
    personality?: ChatPersonalityId | null;
    onDelta?: (chunk: string) => void;
    quality?: import("./chat-quality").ChatQuality;
  }
): Promise<string | null> {
  const learner = learnerBundle();
  const { collectChatAuth, notifyAiExhausted } = await import("./platform-ai-client");
  const auth = await collectChatAuth();
  const personality =
    (typeof window !== "undefined" ? loadChatPersonality() : null) ??
    opts?.personality;

  const wide = auth.preferredSource === "zen";
  const prior = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .filter((m) => m.content?.trim())
    .slice(-(wide ? 16 : 12))
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content.slice(0, wide ? 4000 : 2500),
    }));

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stream: Boolean(opts?.onDelta),
        message: text,
        learnerContext: learner,
        adultConsent: opts?.adultConsent,
        personality,
        quality: opts?.quality,
        ...auth,
        history: prior,
      }),
    });
    const ctype = res.headers.get("content-type") || "";
    if (ctype.includes("text/event-stream") && res.body) {
      let full = "";
      let meta: {
        reply?: string;
        code?: string;
        softWarnMessage?: string;
        quota?: { mode?: string; used?: number; limit?: number; label?: string; lane?: string };
      } = {};
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
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
          if (!payload) continue;
          try {
            const j = JSON.parse(payload) as {
              delta?: string;
              done?: boolean;
              reply?: string;
              code?: string;
              softWarnMessage?: string;
              quota?: typeof meta.quota;
            };
            if (j.delta) {
              full += j.delta;
              opts?.onDelta?.(j.delta);
            }
            if (j.done) {
              meta = j;
              if (j.reply && !full) {
                full = j.reply;
                opts?.onDelta?.(j.reply);
              }
            }
            if (j.code) meta.code = j.code;
          } catch {
            /* keep-alive */
          }
        }
      }
      applyChatSideEffects(meta, notifyAiExhausted);
      if (full.trim()) return full.trim();
    } else {
    const data = (await res.json()) as {
      reply?: string;
      ok?: boolean;
      source?: string;
      needsLogin?: boolean;
      code?: string;
      softWarnMessage?: string;
      softWarn?: boolean;
      usedPremium?: boolean;
      quota?: { mode?: string; used?: number; limit?: number; label?: string; lane?: string };
    };
    applyChatSideEffects(data, notifyAiExhausted);
    if (data.reply?.trim()) {
      opts?.onDelta?.(data.reply.trim());
      return data.reply.trim();
    }
    }
  } catch {
    /* fall through */
  }

  if (typeof window === "undefined" && hasFreeChatProvider()) {
    const r = await freeChatCompletion(text, prior, {
      learnerContext: learner,
      adultMode: opts?.adultConsent,
      personality,
      onDelta: opts?.onDelta,
    });
    if (r.ok && r.reply) return r.reply;
  }

  return null;
}

export type ServerChatOpts = {
  adultMode?: boolean;
  personality?: ChatPersonalityId | null;
  codex?: { accessToken: string; accountId?: string };
  copilot?: { sessionToken: string };
  byok?: { apiKey: string; baseUrl?: string; model?: string };
  customSystem?: string;
  preferPremium?: boolean;
  maxTokens?: number;
  preferredModel?: string;
  preferredSource?: "zen" | "openrouter";
  lane?: import("./ai-lanes").ChatLane;
  onDelta?: (chunk: string) => void;
  unrestricted?: boolean;
  quality?: import("./chat-quality").ChatQuality;
};

/** Server-side entry used by /api/chat */
export async function generateAssistantReplyServer(
  userText: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  learnerContext?: string,
  opts?: ServerChatOpts
): Promise<{ reply: string; source: string; usedPremium?: boolean; code?: string }> {
  const text = userText.trim();
  const intent = classifyChatIntent(text);
  const adultMode = Boolean(opts?.adultMode);
  const mcpHits = getMcpsForTask(text, 2);
  const mcpHint =
    mcpHits.length > 0
      ? `If they named a product, add one short line suggesting MCP/plugin: ${mcpHits
          .map((m) => `${m.name} — ${m.docsUrl || m.url || "/mcp"}`)
          .join("; ")}. Don't dump a catalog.`
      : "";
  const learner =
    [learnerContext, mcpHint].filter(Boolean).join("\n") || undefined;

  // Adult / sexual intent always goes to LLM (after consent) — not banter shortcuts
  if (adultMode) {
    const llm = await freeChatCompletion(text, history, {
      learnerContext: learner,
      adultMode: true,
      personality: opts?.personality,
      codex: opts?.codex,
      copilot: opts?.copilot,
      byok: opts?.byok,
      customSystem: opts?.customSystem,
      preferPremium: opts?.preferPremium,
      maxTokens: opts?.maxTokens,
      preferredModel: opts?.preferredModel,
      preferredSource: opts?.preferredSource,
      lane: opts?.lane,
      onDelta: opts?.onDelta,
      unrestricted: opts?.unrestricted,
      quality: opts?.quality,
    });
    if (llm.ok) return { reply: llm.reply, source: llm.provider, usedPremium: llm.usedPremium };
    if (llm.code === "pool_exhausted") {
      return { reply: llm.reply, source: "exhausted", code: "pool_exhausted" };
    }
    return { reply: smartOfflineGeneral(text), source: "offline" };
  }

  if (intent === "tour") return { reply: websiteTour(), source: "tour" };

  const chatOpts = {
    learnerContext: learner,
    adultMode,
    personality: opts?.personality,
    codex: opts?.codex,
    copilot: opts?.copilot,
    byok: opts?.byok,
    customSystem: opts?.customSystem,
    preferPremium: opts?.preferPremium,
    maxTokens: opts?.maxTokens,
    preferredModel: opts?.preferredModel,
    preferredSource: opts?.preferredSource,
    lane: opts?.lane,
    onDelta: opts?.onDelta,
    unrestricted: opts?.unrestricted,
    quality: opts?.quality,
  };

  const llm = await freeChatCompletion(text, history, chatOpts);
  if (llm.ok) return { reply: llm.reply, source: llm.provider, usedPremium: llm.usedPremium };
  if (llm.code === "pool_exhausted") {
    return { reply: llm.reply, source: "exhausted", code: "pool_exhausted" };
  }

  if (intent === "greeting") {
    return { reply: greetingReply(), source: "greeting" };
  }
  if (intent === "banter") {
    return { reply: banterReply(text), source: "banter" };
  }
  if (intent === "mood") {
    return { reply: moodReply(text), source: "offline-mood" };
  }
  if (intent === "app_help") return { reply: appHelp(text), source: "app" };
  if (intent === "convert_tools") {
    const free = PLATFORM_TOOLS.filter((t) => t.category === "Free Utilities").slice(0, 5);
    return {
      reply:
        `Fast free utilities:\n` +
        free.map((t) => `• **${t.name}** /tools/${t.slug}`).join("\n") +
        `\nDrop-zones first. Want a specific convert? Name it.`,
      source: "tools",
    };
  }
  if (intent === "find_tools") {
    const rec = recommendAiForTask(text, "any");
    const tools = rec.playbooks
      .slice(0, 5)
      .map((p) => `• **${p.tool.name}**${p.tool.url ? ` (${p.tool.url})` : ""} — ${p.whyForYou}`)
      .join("\n");
    return {
      reply: `Middleman picks (inside + solid externals):\n\n${tools}\n\nMore: /ai-finder · /tools`,
      source: "finder",
    };
  }

  return { reply: smartOfflineGeneral(text), source: "offline" };
}

/** Client helper for tool pages */
export function noteToolVisit(slug: string) {
  try {
    trackToolUse(slug, 1);
  } catch {
    /* ignore */
  }
}
