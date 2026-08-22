/**
 * Smooth 0–100 quality slider. Higher = larger models + more time.
 * Bands (fast / balanced / best) are labels only — the API uses the number.
 */

export type ChatQuality = "fast" | "balanced" | "best";

export const CHAT_QUALITY_KEY = "plethora.chat.quality.smooth.v1";

export function clampSmooth(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function qualityFromSmooth(n: number): ChatQuality {
  const s = clampSmooth(n);
  if (s < 34) return "fast";
  if (s < 67) return "balanced";
  return "best";
}

export function parseChatQuality(raw: unknown): ChatQuality {
  if (typeof raw === "number") return qualityFromSmooth(raw);
  if (raw === "fast" || raw === "balanced" || raw === "best") return raw;
  return "balanced";
}

export function parseSmooth(raw: unknown): number {
  if (typeof raw === "number") return clampSmooth(raw);
  if (typeof raw === "string" && raw.trim() !== "" && Number.isFinite(Number(raw))) {
    return clampSmooth(Number(raw));
  }
  return 50;
}

export function loadSmoothQuality(): number {
  if (typeof window === "undefined") return 50;
  try {
    const raw = localStorage.getItem(CHAT_QUALITY_KEY);
    if (raw == null) return 50;
    return parseSmooth(JSON.parse(raw));
  } catch {
    return 50;
  }
}

export function saveSmoothQuality(n: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAT_QUALITY_KEY, JSON.stringify(clampSmooth(n)));
}

export function qualityLabel(q: ChatQuality): string {
  if (q === "fast") return "Faster";
  if (q === "best") return "Best";
  return "Balanced";
}

export type QualityBudget = {
  timeoutMs: number;
  attempts: number;
  maxTokens: number;
  historyTurns: number;
};

/** Interpolate budget from the smooth slider (0 = snappy, 100 = max quality). */
export function budgetFromSmooth(n: number): QualityBudget {
  const t = clampSmooth(n) / 100;
  return {
    timeoutMs: Math.round(9_000 + t * 14_000),
    attempts: Math.round(4 + t * 4),
    maxTokens: Math.round(400 + t * 360),
    historyTurns: Math.round(8 + t * 10),
  };
}

export function qualityBudget(q: ChatQuality): QualityBudget {
  if (q === "fast") return budgetFromSmooth(20);
  if (q === "best") return budgetFromSmooth(100);
  return budgetFromSmooth(50);
}

export type RouteKind = "adult" | "code" | "vision" | "long" | "general";
