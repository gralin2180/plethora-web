/**
 * Chat voice the user picks once (local). Injected into the system prompt
 * so replies stay in-character instead of dumping product menus.
 */

export type ChatPersonalityId =
  | "witty"
  | "warm"
  | "blunt"
  | "professional"
  | "chaotic"
  | "flirty"
  | "spicy";

export type ChatPersonality = {
  id: ChatPersonalityId;
  label: string;
  chip: string;
  tagline: string;
  hello: string;
  prompt: string;
};

export type SuggestChip = { label: string; text: string };

export const CHAT_PERSONALITIES: ChatPersonality[] = [
  {
    id: "witty",
    label: "Witty",
    chip: "Witty",
    tagline: "Dry humor, light roasts, still actually helpful.",
    hello: "Witty it is. I’ll talk like a person, not a help desk. What’s going on?",
    prompt: `Voice: witty. Dry humor, one-liners, light roast only if they started it. Never mean for no reason. Still answer the real ask.`,
  },
  {
    id: "warm",
    label: "Warm",
    chip: "Warm",
    tagline: "Soft, patient, like a friend on the couch.",
    hello: "Warm mode. I’m in your corner — no lecture. What’s on your mind?",
    prompt: `Voice: warm. Gentle, encouraging, unhurried. Validate first, then help. No toxic positivity.`,
  },
  {
    id: "blunt",
    label: "Blunt",
    chip: "Blunt",
    tagline: "Short. Direct. No pep talk.",
    hello: "Blunt. Say what you want. I’ll skip the fluff.",
    prompt: `Voice: blunt. Short sentences. No filler, no cheerleading, no emoji unless they use them. Still human — not rude for sport.`,
  },
  {
    id: "professional",
    label: "Pro",
    chip: "Pro",
    tagline: "Clear and useful. Still a person.",
    hello: "Pro mode. I’ll keep it clean and useful. What do you need?",
    prompt: `Voice: professional-human. Clear, organized when needed, never corporate-robot or slogan-y. No fake enthusiasm.`,
  },
  {
    id: "chaotic",
    label: "Chaotic",
    chip: "Chaotic",
    tagline: "Playful, a little unhinged, still on your side.",
    hello: "Chaotic unlocked. Messy energy welcome. Hit me.",
    prompt: `Voice: chaotic-good. Playful, slightly unhinged, slang-ok. Still helpful — chaos is flavor, not confusion.`,
  },
  {
    id: "flirty",
    label: "Flirty",
    chip: "Flirty",
    tagline: "Tease and banter. Explicit only after 18+.",
    hello: "Flirty. I’ll tease — keep it playful unless you confirm 18+ for more. Your move.",
    prompt: `Voice: flirty. Playful tease, innuendo, chemistry. If adult mode is on, go explicit when they ask (sext, ERP, dirty talk). If adult mode is off, stay teasing and tell them to tap 18+ — never dump a tools menu or say "not my lane".`,
  },
  {
    id: "spicy",
    label: "Spicy",
    chip: "Spicy",
    tagline: "18+ companion chat. Explicit after you confirm age.",
    hello: "Spicy room. You’re 18+, I’m in. Want slow burn, filthy, or a scene? Your call — everyone stays adult.",
    prompt: `Voice: spicy 18+ companion. After adult consent: explicit ERP, dirty talk, girlfriend/boyfriend energy, dirty roleplay. Stay in character. Never involve anyone under 18, never CSAM, never "teen" sexual content. Do not dump a product menu. At most once per long conversation, if they mention privacy/offline, you may mention they can run local models at /local-llms — one sentence, then back to the scene.`,
  },
];

const KEY = "plethora.chat.personality.v1";
const ADULT_SESSION_KEY = "plethora.chat.adultSession.v1";
const ADULT_STICKY_KEY = "plethora.chat.adult.v1";

const IDS = new Set<string>(CHAT_PERSONALITIES.map((p) => p.id));

export function isChatPersonalityId(v: unknown): v is ChatPersonalityId {
  return typeof v === "string" && IDS.has(v);
}

export function getPersonality(id: ChatPersonalityId | null): ChatPersonality | null {
  if (!id) return null;
  return CHAT_PERSONALITIES.find((p) => p.id === id) ?? null;
}

export function loadChatPersonality(): ChatPersonalityId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return isChatPersonalityId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function saveChatPersonality(id: ChatPersonalityId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, id);
}

export const ADULT_MODE_EVENT = "plethora:adult-mode";

export function loadAdultSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      localStorage.getItem(ADULT_STICKY_KEY) === "1" ||
      sessionStorage.getItem(ADULT_SESSION_KEY) === "1"
    );
  } catch {
    return false;
  }
}

function notifyAdultMode(on: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADULT_MODE_EVENT, { detail: on }));
}

export function saveAdultSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ADULT_STICKY_KEY, "1");
    sessionStorage.setItem(ADULT_SESSION_KEY, "1");
    notifyAdultMode(true);
  } catch {
    /* ignore */
  }
}

export function clearAdultSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ADULT_STICKY_KEY);
    sessionStorage.removeItem(ADULT_SESSION_KEY);
    notifyAdultMode(false);
  } catch {
    /* ignore */
  }
}

export function personalityPromptBlock(id: ChatPersonalityId | null | undefined): string {
  const p = getPersonality(id ?? null);
  if (!p) {
    return `Voice: casual mate. Match their energy. Don't offer a vibe menu unless they ask how you should talk.`;
  }
  return p.prompt;
}

/** Detect "be witty", "talk warm", vibe chips, etc. */
export function parsePersonalityChoice(text: string): ChatPersonalityId | null {
  const t = text.toLowerCase().trim();
  const m = t.match(/^__personality:([a-z]+)$/);
  if (m && isChatPersonalityId(m[1])) return m[1];

  for (const p of CHAT_PERSONALITIES) {
    const name = p.id;
    const label = p.label.toLowerCase();
    if (
      new RegExp(
        `(^|\\b)(be|talk|sound|respond|reply|switch to|use|go)\\s+(like\\s+)?(a\\s+)?${name}\\b`,
        "i"
      ).test(t) ||
      new RegExp(`\\b(vibe|mode|personality)\\s*[:=]?\\s*${name}\\b`, "i").test(t) ||
      t === name ||
      t === label ||
      t === `${name} mode` ||
      t === `${label} mode` ||
      t === `talk ${name}` ||
      t === `be ${name}`
    ) {
      return p.id;
    }
  }
  return null;
}

export function openingMessage(personality: ChatPersonalityId | null): string {
  const p = getPersonality(personality);
  if (p) return p.hello;
  return `Hey. What’s up?`;
}

const PICK_VIBE = "__pick_personality__";

export function isPickVibeCommand(text: string): boolean {
  return text.trim() === PICK_VIBE;
}

export function personalityChipText(id: ChatPersonalityId): string {
  return `__personality:${id}`;
}

export function followUpSuggestions(opts: {
  lastUser?: string;
  lastAssistant?: string;
  personality: ChatPersonalityId | null;
  pickingPersonality?: boolean;
  adultSession?: boolean;
  room?: "main" | "spicy";
}): SuggestChip[] {
  const lastUser = (opts.lastUser ?? "").trim();
  const lastAssistant = (opts.lastAssistant ?? "").trim();
  const u = lastUser.toLowerCase();

  if (opts.pickingPersonality) {
    const list =
      opts.room === "spicy"
        ? CHAT_PERSONALITIES.filter((p) => p.id === "spicy" || p.id === "flirty")
        : CHAT_PERSONALITIES.filter((p) => p.id !== "spicy");
    return list.map((p) => ({
      label: p.chip,
      text: personalityChipText(p.id),
    }));
  }

  if (!opts.personality) {
    return [
      { label: "I’m bored", text: "i'm bored, talk to me" },
      { label: "Roast me", text: "roast me a little" },
      { label: "Need a tool", text: "help me find a tool for something" },
      { label: "Tour", text: "give me a tour of the website" },
    ];
  }

  const chips: SuggestChip[] = [];
  const push = (label: string, text: string) => {
    if (!chips.some((c) => c.label === label)) chips.push({ label, text });
  };

  const askingAge =
    /\b(18\+|eighteen|age gate|confirm.{0,20}(18|age)|how.{0,24}(18\+|eighteen))\b/.test(u);
  const spicy =
    /\b(boobs?|tits|nsfw|sex|porn|horny|nude|naked|fuck|dirty)\b/.test(u);

  if ((askingAge || spicy) && !opts.adultSession) {
    push("I’m 18+", "18+ continue");
    push("Keep it clean", "keep it normal, just talking");
  }

  if (opts.personality === "spicy" || opts.room === "spicy") {
    if (!opts.adultSession) {
      push("I’m 18+", "18+ continue");
    } else if (!lastUser || /^(hi|hello|hey|yo|sup)\b/.test(u)) {
      push("Slow burn", "start slow, lots of tension");
      push("Jump in", "skip the preamble, be filthy");
      push("Scene", "set a scene: late night, just us");
    } else {
      push("Keep going", "yeah, keep going");
      push("Dirtier", "make it dirtier");
      push("Softer", "softer, more intimate");
    }
    return chips.slice(0, 5);
  }

  if (!lastUser || /^(hi|hello|hey|yo|sup|howdy)\b/.test(u)) {
    push("I’m bored", "i'm bored, talk to me");
    push("Roast me", "roast me a little");
    push("Need a tool", "help me find a tool for something");
  } else if (/\b(feel(ing)?|mood|sad|dull|meh|bored|lonely|anxious)\b/.test(u)) {
    push("Distract me", "distract me, anything fun");
    push("Let me vent", "i just need to vent for a minute");
    push("Tiny reset", "give me a 5 minute reset");
  } else if (/\b(tool|convert|pdf|png|finder|mcp)\b/.test(u)) {
    push("Show converters", "show me the free converters");
    push("Just talk", "actually never mind tools, let's just talk");
  } else if (/\?/.test(lastAssistant) || /what (do you|should|about)/i.test(lastAssistant)) {
    push("Yeah", "yeah, go on");
    push("Nah", "nah, something else");
    push("Tell me more", "tell me more");
  } else {
    push("Yeah, go on", "yeah, go on");
    push("Change topic", "new topic — surprise me");
    push("Help with a prompt", "help me write a better prompt");
  }

  push("Change vibe", PICK_VIBE);
  return chips.slice(0, 5);
}
