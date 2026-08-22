/**
 * AI usage quota strategy for multi-user fair use on shared free keys.
 */

import { getPlanCapabilities, type PlanId, GUEST_FREE_AI_DAILY } from "./plans";

export const GUEST_AI_BLOCK =
  "Today’s free allowance is used up. Sign in for a higher daily cap, add extra usage, or paste your own API key in Settings → AI keys.";

/** Platform free-model chat turns per calendar day (not BYOK, not premium pack). */
export function platformChatDailyLimit(plan: PlanId | "guest"): number {
  if (plan === "guest") return GUEST_FREE_AI_DAILY;
  return getPlanCapabilities(plan).freeAiDailyLimit;
}

export type ResolvedLlmKey = {
  source: "platform" | "byok";
  apiKey: string;
  baseUrl?: string;
  label: string;
};
