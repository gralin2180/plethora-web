/**
 * AI usage quota strategy for multi-user fair use on shared free keys.
 *
 * How others solve it (industry pattern):
 * 1) Free tier with hard daily caps + signup ( freemium )
 * 2) BYOK (bring your own key) for power users
 * 3) Free-model-only routing (OpenRouter free, Groq free, etc.)
 * 4) Self-host open models (your GPU/server cost)
 * 5) Ads / sponsorship (rare for LLM pure plays)
 *
 * Plethora: guests get a small free daily stack; signed-in free higher; paid higher; BYOK = their bill.
 */

import { getPlanCapabilities, type PlanId } from "./plans";

export const GUEST_AI_BLOCK =
  "Guest free AI for today is used up. Sign in free for a higher daily allowance, or add your own OpenRouter key in Settings → AI keys.";

/** Platform-key chat turns per calendar day (not BYOK). */
export function platformChatDailyLimit(plan: PlanId | "guest"): number {
  if (plan === "guest") return 12; // enough to try the product; protects the shared free key
  const caps = getPlanCapabilities(plan);
  if (caps.unlimitedToolRuns) return plan === "hardcore" ? 500 : 200;
  return 40; // signed-in free
}

export type ResolvedLlmKey = {
  source: "platform" | "byok";
  apiKey: string;
  baseUrl?: string;
  label: string;
};
