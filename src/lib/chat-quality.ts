/**
 * User-picked speed vs quality. Fast still uses real models (Groq / MythoMax / GLM),
 * not a canned one-liner. Best spends more time on larger models.
 */

export type ChatQuality = "fast" | "balanced" | "best";

export const CHAT_QUALITY_KEY = "plethora.chat.quality.v1";

export function isChatQuality(v: unknown): v is ChatQuality {
  return v === "fast" || v === "balanced" || v === "best";
}

export function parseChatQuality(raw: unknown): ChatQuality {
  if (typeof raw === "number") {
    if (raw <= 0) return "fast";
    if (raw >= 2) return "best";
    return "balanced";
  }
  if (isChatQuality(raw)) return raw;
  return "balanced";
}

export function loadChatQuality(): ChatQuality {
  if (typeof window === "undefined") return "balanced";
  try {
    return parseChatQuality(localStorage.getItem(CHAT_QUALITY_KEY));
  } catch {
    return "balanced";
  }
}

export function saveChatQuality(q: ChatQuality) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAT_QUALITY_KEY, q);
}

export function qualityIndex(q: ChatQuality): number {
  return q === "fast" ? 0 : q === "best" ? 2 : 1;
}

export function qualityFromIndex(n: number): ChatQuality {
  if (n <= 0) return "fast";
  if (n >= 2) return "best";
  return "balanced";
}

export type QualityBudget = {
  timeoutMs: number;
  attempts: number;
  maxTokens: number;
  historyTurns: number;
};

export function qualityBudget(q: ChatQuality): QualityBudget {
  if (q === "fast") {
    return { timeoutMs: 8_000, attempts: 2, maxTokens: 360, historyTurns: 8 };
  }
  if (q === "best") {
    return { timeoutMs: 22_000, attempts: 4, maxTokens: 720, historyTurns: 16 };
  }
  return { timeoutMs: 12_000, attempts: 3, maxTokens: 520, historyTurns: 12 };
}

export type RouteKind = "adult" | "code" | "vision" | "long" | "general";

export function qualityLabel(q: ChatQuality): string {
  if (q === "fast") return "Faster";
  if (q === "best") return "Best";
  return "Balanced";
}
