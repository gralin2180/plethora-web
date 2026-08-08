import { createClient } from "@/lib/supabase/server";
import { getDailyLimit } from "@/lib/skill-levels";
import { getToolBySlug } from "@/lib/tools-registry";
import type { SubscriptionPlan } from "@/lib/types";

export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  plan: SubscriptionPlan;
}

export async function checkUsage(
  toolId: string,
  anonymousId?: string
): Promise<UsageCheckResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let plan: SubscriptionPlan = "free";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_plan")
      .eq("id", user.id)
      .single();
    if (profile?.subscription_plan) {
      plan = profile.subscription_plan as SubscriptionPlan;
    }
  }

  const tool = getToolBySlug(toolId) ?? { freeRunsPerDay: 10, isPro: false };
  const limit = getDailyLimit(tool.freeRunsPerDay, plan);

  const { data: count, error: usageError } = await supabase.rpc("get_usage_count", {
    p_user_id: user?.id ?? null,
    p_anonymous_id: user ? null : (anonymousId ?? null),
    p_tool_id: toolId,
  });

  // Schema not applied yet — allow traffic, treat as zero usage
  const current = usageError ? 0 : ((count as number) ?? 0);

  if (tool.isPro && plan === "free") {
    return { allowed: false, current, limit: 0, plan };
  }

  return {
    allowed: current < limit,
    current,
    limit,
    plan,
  };
}

export async function recordUsage(
  toolId: string,
  anonymousId?: string,
  metadata?: Record<string, unknown>
): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: count, error } = await supabase.rpc("increment_tool_usage", {
    p_user_id: user?.id ?? null,
    p_anonymous_id: user ? null : (anonymousId ?? null),
    p_tool_id: toolId,
    p_metadata: metadata ?? {},
  });

  if (error) {
    console.warn("[usage] increment_tool_usage failed — run web/supabase/setup.sql", error.message);
    return 0;
  }
  return count as number;
}
