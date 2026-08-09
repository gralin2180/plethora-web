/**
 * AI usage quota strategy for multi-user:
 * - Logged-in free users share owner OPENROUTER_API_KEY with tight daily caps
 * - Users may attach their own OpenRouter/Groq key (BYOK) — unlimited by us, their bill
 * - Guests cannot burn cloud LLM; free browser tools still work
 */

import { getPlanCapabilities, type PlanId } from "./plans";

export const GUEST_AI_BLOCK =
  "Cloud AI needs a free account so we can cap fair use (one platform key can’t serve unlimited guests). Sign in with email, or add your own OpenRouter key in Settings → AI keys.";

/** Max platform-key chat turns per user per day (not BYOK). */
export function platformChatDailyLimit(plan: PlanId): number {
  const caps = getPlanCapabilities(plan);
  if (caps.unlimitedToolRuns) return plan === "hardcore" ? 500 : 200;
  return 25; // free
}

export type ResolvedLlmKey = {
  source: "platform" | "byok";
  apiKey: string;
  baseUrl?: string;
  label: string;
};
