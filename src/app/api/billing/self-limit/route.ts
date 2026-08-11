import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanCapabilities, type PlanId } from "@/lib/plans";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = await request.json();
  const raw = body.selfLimitPremiumMonth;
  let value: number | null;
  if (raw === null || raw === "" || raw === undefined) {
    value = null;
  } else {
    value = Math.floor(Number(raw));
    if (!Number.isFinite(value) || value < 1) {
      return NextResponse.json(
        { error: "selfLimitPremiumMonth must be a positive integer or null" },
        { status: 400 }
      );
    }
    // Cap at hardcore limit
    value = Math.min(value, 5000);
  }

  // User may only set self_limit (billing trigger preserves it)
  const { error } = await supabase
    .from("profiles")
    .update({ self_limit_premium_month: value })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Could not save limit. Run supabase/billing_ai.sql if columns are missing.",
      },
      { status: 500 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_plan, self_limit_premium_month")
    .eq("id", user.id)
    .maybeSingle();

  const plan = (profile?.subscription_plan as PlanId) || "free";
  const included = getPlanCapabilities(plan).premiumAiMonthlyLimit;

  return NextResponse.json({
    ok: true,
    selfLimit: profile?.self_limit_premium_month ?? null,
    includedPremiumMonthly: included,
    note:
      value != null
        ? `Your self-cap is ${value} premium messages/month (plan includes up to ${included}). Soft warn at 80%.`
        : "Self-cap cleared — plan included budget applies.",
  });
}
