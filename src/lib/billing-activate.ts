/**
 * Apply paid plan / trial packs after Stripe (or fake billing). Service role only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { BILLING_PRODUCTS, type BillingSku } from "./billing-products";
import type { PlanId } from "./plans";

export async function activateSubscription(
  admin: SupabaseClient,
  opts: {
    userId: string;
    plan: PlanId;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    status?: string;
  }
) {
  const now = new Date().toISOString();
  await admin
    .from("profiles")
    .update({
      subscription_plan: opts.plan,
      subscription_status: opts.status || "active",
      stripe_customer_id: opts.stripeCustomerId ?? undefined,
      stripe_subscription_id: opts.stripeSubscriptionId ?? undefined,
      premium_used_period: 0,
      premium_period_start: now,
      updated_at: now,
    })
    .eq("id", opts.userId);
}

export async function activateTrialPack(
  admin: SupabaseClient,
  opts: { userId: string; sku: BillingSku; stripeCustomerId?: string }
) {
  const product = BILLING_PRODUCTS[opts.sku];
  if (!product.trialMs) return;
  const ends = new Date(Date.now() + product.trialMs).toISOString();
  const now = new Date().toISOString();
  await admin
    .from("profiles")
    .update({
      trial_pack: opts.sku,
      trial_pack_ends_at: ends,
      trial_pack_premium_used: 0,
      trial_pack_premium_cap: product.packPremiumMessages || 40,
      stripe_customer_id: opts.stripeCustomerId ?? undefined,
      updated_at: now,
    })
    .eq("id", opts.userId);
}

export async function deactivateSubscription(
  admin: SupabaseClient,
  opts: { userId?: string; subscriptionId?: string; status?: string }
) {
  const q = admin.from("profiles");
  if (opts.userId) {
    await q
      .update({
        subscription_plan: "free",
        subscription_status: opts.status || "canceled",
        stripe_subscription_id: null,
      })
      .eq("id", opts.userId);
    return;
  }
  if (opts.subscriptionId) {
    await admin
      .from("profiles")
      .update({
        subscription_plan: "free",
        subscription_status: opts.status || "canceled",
        stripe_subscription_id: null,
      })
      .eq("stripe_subscription_id", opts.subscriptionId);
  }
}

/** Increment premium counters after a successful premium-model reply. */
export async function recordPremiumUse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: { rpc: (fn: string, ...rest: any[]) => any },
  _userId?: string,
  _entitlement?: { trialActive: boolean; planActive: boolean }
) {
  try {
    const { error } = await client.rpc("increment_premium_usage");
    if (error) console.warn("[billing] increment_premium_usage", error);
  } catch (e) {
    console.warn("[billing] increment_premium_usage", e);
  }
}
