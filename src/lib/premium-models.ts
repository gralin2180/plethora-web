/**
 * Paid models allowed on Plethora's platform key when user has premium budget.
 * Free plan always routes to free models only.
 */

export type RoutingTier = "free" | "premium" | "byok";

/** Prefer solid mid-tier (margin-friendly). Override with PLETHORA_PREMIUM_MODELS comma list. */
const DEFAULT_PREMIUM_MODELS = [
  "deepseek/deepseek-chat-v3-0324",
  "google/gemini-2.0-flash-001",
  "meta-llama/llama-3.3-70b-instruct",
  "qwen/qwen-2.5-72b-instruct",
  "openai/gpt-4o-mini",
  "anthropic/claude-3.5-haiku",
];

export function premiumModelList(): string[] {
  const raw = process.env.PLETHORA_PREMIUM_MODELS?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [...DEFAULT_PREMIUM_MODELS];
}

export function primaryPremiumModel(): string {
  return (
    process.env.PLETHORA_PREMIUM_MODEL?.trim() ||
    premiumModelList()[0] ||
    "deepseek/deepseek-chat-v3-0324"
  );
}
