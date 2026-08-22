/**
 * Cursor-style AI lanes.
 *
 * We do not sell NVIDIA / OpenCode / OpenRouter :free trial access as a paid SKU.
 * Unpaid users get the public free pool (capped). Paid SKUs buy models we pay for.
 * After that included budget: slower cheap models, then a paywall for extra usage.
 */

export type ChatLane = "byok" | "premium" | "free" | "slow";

export const EXTRA_USAGE_MESSAGE =
  "Cheap-model allowance for today is used up. Add extra usage (try pack), subscribe, or paste your own API key. Utilities still work without a model.";

export function resolveChatLane(opts: {
  usesOwnAi: boolean;
  premiumAllowed: boolean;
  /** True when this account has (or had this period) a paid premium budget */
  hasPaidBudget: boolean;
}): ChatLane {
  if (opts.usesOwnAi) return "byok";
  if (opts.premiumAllowed) return "premium";
  if (opts.hasPaidBudget) return "slow";
  return "free";
}

export function laneTimeoutMs(lane: ChatLane): number {
  if (lane === "premium" || lane === "byok") return 25_000;
  return 18_000;
}

export function laneMaxAttempts(_lane: ChatLane): number {
  return 1;
}

export function laneMaxTokens(lane: ChatLane, hot?: boolean): number {
  if (lane === "premium" || lane === "byok") return hot ? 700 : 1000;
  return hot ? 280 : 420;
}

export function laneHistoryTurns(lane: ChatLane): number {
  if (lane === "premium" || lane === "byok") return 24;
  if (lane === "slow") return 8;
  return 12;
}

export function laneMessageChars(lane: ChatLane): number {
  if (lane === "premium" || lane === "byok") return 6000;
  if (lane === "slow") return 1800;
  return 3500;
}

export function laneLabel(lane: ChatLane): string {
  switch (lane) {
    case "byok":
      return "Your key";
    case "premium":
      return "Included (paid models)";
    case "slow":
      return "Slow free fallback";
    default:
      return "Free pool";
  }
}
