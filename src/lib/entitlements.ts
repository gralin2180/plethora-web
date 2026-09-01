/**
 * Resolve user entitlement for AI routing (subscription + trial packs + self limits).
 */

import { getPlanCapabilities, parsePlanId, type PlanId, GUEST_FREE_AI_DAILY } from "./plans";

export type EntitlementRow = {
  subscription_plan?: string | null;
  subscription_status?: string | null;
  premium_used_period?: number | null;
  premium_period_start?: string | null;
  self_limit_premium_month?: number | null;
  trial_pack?: string | null;
  trial_pack_ends_at?: string | null;
  trial_pack_premium_used?: number | null;
  trial_pack_premium_cap?: number | null;
  stripe_customer_id?: string | null;
};

export type AiEntitlement = {
  plan: PlanId;
  planActive: boolean;
  /** Can spend platform premium models this request (budget remaining) */
  premiumAllowed: boolean;
  premiumUsed: number;
  premiumLimit: number;
  /** Effective limit after user self-cap */
  premiumEffectiveLimit: number;
  freeDailyLimit: number;
  softWarn: boolean;
  softWarnMessage?: string;
  routeLabel: string;
  trialActive: boolean;
  trialEndsAt?: string;
  selfLimit: number | null;
  fallbacksToFreeWhenPremiumExhausted: boolean;
};

function asPlan(raw: string | null | undefined): PlanId {
  return parsePlanId(raw);
}

function periodNeedsReset(iso: string | null | undefined): boolean {
  if (!iso) return true;
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return true;
  const now = new Date();
  // Calendar-month style: reset if month/year differs
  return start.getUTCFullYear() !== now.getUTCFullYear() || start.getUTCMonth() !== now.getUTCMonth();
}

export function resolveAiEntitlement(
  row: EntitlementRow | null | undefined,
  opts?: { isGuest?: boolean }
): AiEntitlement {
  if (opts?.isGuest || !row) {
    return {
      plan: "free",
      planActive: false,
      premiumAllowed: false,
      premiumUsed: 0,
      premiumLimit: 0,
      premiumEffectiveLimit: 0,
      freeDailyLimit: GUEST_FREE_AI_DAILY,
      softWarn: false,
      routeLabel: "guest · free models",
      trialActive: false,
      selfLimit: null,
      fallbacksToFreeWhenPremiumExhausted: true,
    };
  }

  const status = (row.subscription_status || "inactive").toLowerCase();
  const planActive = status === "active" || status === "trialing";
  let plan = asPlan(row.subscription_plan);
  if (!planActive && plan !== "free") {
    // Stale plan label after cancel — treat as free for premium
    plan = "free";
  }

  const caps = getPlanCapabilities(plan);
  let premiumLimit = planActive ? caps.premiumAiMonthlyLimit : 0;
  let premiumUsed = Number(row.premium_used_period || 0);
  if (periodNeedsReset(row.premium_period_start)) {
    premiumUsed = 0;
  }

  const trialEnds = row.trial_pack_ends_at ? new Date(row.trial_pack_ends_at) : null;
  const trialActive = Boolean(
    trialEnds && !Number.isNaN(trialEnds.getTime()) && trialEnds.getTime() > Date.now()
  );
  if (trialActive) {
    const packCap = Number(row.trial_pack_premium_cap || 0);
    const packUsed = Number(row.trial_pack_premium_used || 0);
    // Trial grants pack messages; if also on free plan, enable premium temporarily
    if (packCap > 0) {
      premiumLimit = Math.max(premiumLimit, packCap);
      // For trial-only users use pack usage; for sub+trial use max of both buckets conservatively
      if (!planActive) {
        premiumUsed = packUsed;
      }
    } else {
      // time-only trial: grant a small default
      premiumLimit = Math.max(premiumLimit, 40);
    }
  }

  const selfLimit =
    row.self_limit_premium_month != null && row.self_limit_premium_month > 0
      ? Number(row.self_limit_premium_month)
      : null;
  const premiumEffectiveLimit =
    selfLimit != null ? Math.min(premiumLimit, selfLimit) : premiumLimit;

  const premiumAllowed = premiumEffectiveLimit > 0 && premiumUsed < premiumEffectiveLimit;

  const ratio = premiumEffectiveLimit > 0 ? premiumUsed / premiumEffectiveLimit : 0;
  const softWarn = premiumEffectiveLimit > 0 && ratio >= caps.softWarnRatio && premiumAllowed;
  const softWarnMessage = softWarn
    ? `Soft warning: you've used ${premiumUsed}/${premiumEffectiveLimit} included paid-model messages this period. After that, Plethora stays on slower cheap models, then asks for extra usage.`
    : undefined;

  let routeLabel = `${caps.name} · free pool`;
  if (premiumAllowed) {
    routeLabel = trialActive && !planActive
      ? `Trial pack · included models (${premiumUsed}/${premiumEffectiveLimit})`
      : `${caps.name} · included models (${premiumUsed}/${premiumEffectiveLimit})`;
  } else if (premiumLimit > 0) {
    routeLabel = `${caps.name} · slow fallback (included budget used)`;
  }

  return {
    plan: planActive || trialActive ? (planActive ? plan : "pro") : "free",
    planActive: planActive || trialActive,
    premiumAllowed,
    premiumUsed,
    premiumLimit,
    premiumEffectiveLimit,
    freeDailyLimit: planActive
      ? caps.freeAiDailyLimit
      : getPlanCapabilities("free").freeAiDailyLimit,
    softWarn,
    softWarnMessage,
    routeLabel,
    trialActive,
    trialEndsAt: trialActive && row.trial_pack_ends_at ? row.trial_pack_ends_at : undefined,
    selfLimit,
    fallbacksToFreeWhenPremiumExhausted: true,
  };
}

export function softWarnAt(used: number, limit: number, ratio = 0.8): boolean {
  if (limit <= 0) return false;
  return used / limit >= ratio && used < limit;
}
