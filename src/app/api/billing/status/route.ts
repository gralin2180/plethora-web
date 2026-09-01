import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveAiEntitlement, type EntitlementRow } from "@/lib/entitlements";
import { getPlanCapabilities } from "@/lib/plans";
import {
  BILLING_PRODUCTS,
  isStripeBillingConfigured,
} from "@/lib/billing-products";
import { isFakeBillingEnabled } from "@/lib/stripe";
import { platformChatDailyLimit } from "@/lib/ai-quota";
import { applyOrgAiToEntitlement, orgAiIsFullScale, readOrgAiPolicyFromEnv } from "@/lib/infra-control";

const COLS =
  "subscription_plan, subscription_status, premium_used_period, premium_period_start, self_limit_premium_month, trial_pack, trial_pack_ends_at, trial_pack_premium_used, trial_pack_premium_cap, stripe_customer_id, stripe_subscription_id, email";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      signedIn: false,
      stripeReady: isStripeBillingConfigured(),
      fakeBilling: isFakeBillingEnabled() && !isStripeBillingConfigured(),
      products: Object.values(BILLING_PRODUCTS).map(publicProduct),
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(COLS)
    .eq("id", user.id)
    .maybeSingle();

  const orgAi = readOrgAiPolicyFromEnv();
  const ent = applyOrgAiToEntitlement(
    resolveAiEntitlement((profile as EntitlementRow) || {}),
    orgAi
  );
  const caps = getPlanCapabilities(ent.plan);
  const orgFull = orgAiIsFullScale(orgAi);

  let freeUsedToday = 0;
  try {
    const { data: usageCount } = await supabase.rpc("get_usage_count", {
      p_user_id: user.id,
      p_anonymous_id: null,
      p_tool_id: "chat-llm",
    });
    freeUsedToday = typeof usageCount === "number" ? usageCount : 0;
  } catch {
    /* */
  }

  return NextResponse.json({
    signedIn: true,
    stripeReady: isStripeBillingConfigured(),
    fakeBilling: isFakeBillingEnabled() && !isStripeBillingConfigured(),
    plan: profile?.subscription_plan || "free",
    subscriptionStatus: profile?.subscription_status || "inactive",
    entitlement: {
      plan: ent.plan,
      premiumUsed: ent.premiumUsed,
      premiumLimit: orgFull ? Number.MAX_SAFE_INTEGER : ent.premiumEffectiveLimit,
      premiumAllowed: orgFull ? true : ent.premiumAllowed,
      freeDailyLimit: orgFull ? Number.MAX_SAFE_INTEGER : ent.freeDailyLimit,
      freeUsedToday,
      freeDailyPlanLimit: orgFull ? Number.MAX_SAFE_INTEGER : platformChatDailyLimit(ent.plan),
      routeLabel: orgFull ? "org full scale" : ent.routeLabel,
      softWarn: ent.softWarn,
      softWarnMessage: ent.softWarnMessage,
      trialActive: ent.trialActive,
      trialEndsAt: ent.trialEndsAt,
      selfLimit: ent.selfLimit,
      includedPremiumMonthly: caps.premiumAiMonthlyLimit,
    },
    selfLimit: profile?.self_limit_premium_month ?? null,
    products: Object.values(BILLING_PRODUCTS).map(publicProduct),
  });
}

function publicProduct(p: (typeof BILLING_PRODUCTS)[keyof typeof BILLING_PRODUCTS]) {
  return {
    sku: p.sku,
    name: p.name,
    description: p.description,
    priceLabel: p.priceLabel,
    periodLabel: p.periodLabel,
    mode: p.mode,
    features: p.features,
    highlighted: p.highlighted,
    family: p.family || "ai",
  };
}
