import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateAssistantReplyServer } from "@/lib/assistant-brain";
import { assessContentSafety } from "@/lib/content-safety";
import { hasFreeChatProvider } from "@/lib/free-chat";
import { createClient } from "@/lib/supabase/server";
import { GUEST_AI_BLOCK, platformChatDailyLimit } from "@/lib/ai-quota";
import { getPlanCapabilities, type PlanId } from "@/lib/plans";
import { resolveAiEntitlement, softWarnAt, type EntitlementRow } from "@/lib/entitlements";
import {
  assertPlatformFreeCapacity,
  freePlatformDailyHardCap,
  withPlatformFreeSlot,
} from "@/lib/free-tier-guard";
import { recordPremiumUse } from "@/lib/billing-activate";

const ANON_COOKIE = "Plethora_anon_id";
const PROFILE_ENT_COLS =
  "subscription_plan, subscription_status, premium_used_period, premium_period_start, self_limit_premium_month, trial_pack, trial_pack_ends_at, trial_pack_premium_used, trial_pack_premium_cap, stripe_customer_id";

function getOrCreateAnonymousId(
  cookieStore: Awaited<ReturnType<typeof cookies>>
): string {
  let id = cookieStore.get(ANON_COOKIE)?.value;
  if (!id) id = crypto.randomUUID();
  return id;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let entitlement = resolveAiEntitlement(null, { isGuest: !user });
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(PROFILE_ENT_COLS)
      .eq("id", user.id)
      .maybeSingle();
    entitlement = resolveAiEntitlement((profile as EntitlementRow) || {});
  }

  return NextResponse.json({
    ok: true,
    openrouterConfigured: hasFreeChatProvider(),
    signedIn: Boolean(user),
    requiresAuth: false,
    guestDailyLimit: platformChatDailyLimit("guest"),
    freeDailyLimit: platformChatDailyLimit("free"),
    entitlement: {
      plan: entitlement.plan,
      premiumUsed: entitlement.premiumUsed,
      premiumLimit: entitlement.premiumEffectiveLimit,
      premiumAllowed: entitlement.premiumAllowed,
      freeDailyLimit: entitlement.freeDailyLimit,
      routeLabel: entitlement.routeLabel,
      softWarn: entitlement.softWarn,
      softWarnMessage: entitlement.softWarnMessage,
      trialActive: entitlement.trialActive,
      selfLimit: entitlement.selfLimit,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = String(body.message ?? "").trim();
    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const safety = assessContentSafety(message);
    if (safety.hardBlock) {
      return NextResponse.json(
        { reply: safety.message, ok: false, hardBlock: true },
        { status: 403 }
      );
    }

    const adultMode = Boolean(body.adultConsent) && safety.needsWarning;

    const byokKey =
      typeof body.byokKey === "string" && body.byokKey.trim().length > 20
        ? body.byokKey.trim().slice(0, 300)
        : undefined;
    const byokBaseUrl =
      typeof body.byokBaseUrl === "string" && body.byokBaseUrl.startsWith("http")
        ? body.byokBaseUrl.trim().slice(0, 300)
        : undefined;
    const byokModel =
      typeof body.byokModel === "string" && body.byokModel.trim()
        ? body.byokModel.trim().slice(0, 120)
        : undefined;

    const cookieStore = await cookies();
    const anonymousId = getOrCreateAnonymousId(cookieStore);
    const setAnonCookie = !cookieStore.get(ANON_COOKIE)?.value;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!hasFreeChatProvider() && !byokKey) {
      return NextResponse.json(
        {
          reply:
            "No free cloud model is configured on the server yet (OpenRouter/Groq free key). Add OPENROUTER_API_KEY in Vercel env, or paste your own key under Settings → AI keys.",
          ok: false,
          code: "no_provider",
        },
        { status: 503 }
      );
    }

    let plan: PlanId | "guest" = user ? "free" : "guest";
    let usedBefore = 0;
    let limit = platformChatDailyLimit("guest");
    let entitlement = resolveAiEntitlement(null, { isGuest: !user });
    let profileRow: EntitlementRow | null = null;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select(PROFILE_ENT_COLS)
        .eq("id", user.id)
        .maybeSingle();
      profileRow = (profile as EntitlementRow) || {};
      entitlement = resolveAiEntitlement(profileRow);
      plan = entitlement.plan;
    }

    // Free-path quota (BYOK skips platform free daily + global free guard)
    if (!byokKey) {
      if (user) {
        limit = entitlement.freeDailyLimit;
        try {
          const { data: usageCount } = await supabase.rpc("get_usage_count", {
            p_user_id: user.id,
            p_anonymous_id: null,
            p_tool_id: "chat-llm",
          });
          usedBefore = typeof usageCount === "number" ? usageCount : 0;
          if (usedBefore >= limit) {
            return NextResponse.json(
              {
                reply: `Daily free AI limit (${limit}) hit on ${getPlanCapabilities(plan === "guest" ? "free" : plan).name}. Premium budget uses a separate counter — if you've exhausted both free daily and premium, use Settings → AI keys (BYOK) or wait until tomorrow.`,
                ok: false,
                code: "quota",
                needsUpgrade: true,
                limit,
                used: usedBefore,
                entitlement: summarizeEnt(entitlement),
              },
              { status: 429 }
            );
          }
          // Only count against free daily when NOT using premium budget this turn.
          // We increment after we know routing; mark later.
        } catch {
          /* RPC missing — soft allow */
        }
      } else {
        limit = platformChatDailyLimit("guest");
        try {
          const { data: usageCount } = await supabase.rpc("get_usage_count", {
            p_user_id: null,
            p_anonymous_id: anonymousId,
            p_tool_id: "chat-llm",
          });
          usedBefore = typeof usageCount === "number" ? usageCount : 0;
          if (usedBefore >= limit) {
            return NextResponse.json(
              {
                reply: GUEST_AI_BLOCK,
                ok: false,
                code: "guest_quota",
                needsLogin: true,
                limit,
                used: usedBefore,
              },
              { status: 429 }
            );
          }
        } catch {
          /* if usage tables missing, still allow guests so product works */
        }
      }

      // Global free-pool choke protection (not for premium-entitled when we'll use premium path)
      // For free routing (incl. premium-exhausted fallback) always apply
      if (!entitlement.premiumAllowed) {
        const gate = assertPlatformFreeCapacity();
        if (!gate.ok) {
          return NextResponse.json(
            {
              reply: gate.reason,
              ok: false,
              code: gate.code,
              needsUpgrade: true,
            },
            { status: 429 }
          );
        }
      }

      // Global daily free ceiling (platform key budget)
      try {
        const { data: globalUsed } = await supabase.rpc("get_usage_count", {
          p_user_id: null,
          p_anonymous_id: "platform-free-pool",
          p_tool_id: "chat-llm-global",
        });
        const g = typeof globalUsed === "number" ? globalUsed : 0;
        if (!entitlement.premiumAllowed && g >= freePlatformDailyHardCap()) {
          return NextResponse.json(
            {
              reply:
                "The shared free AI pool is at capacity for today. Use BYOK (Settings → AI keys), a try pack, or Pro for premium capacity — utilities still work offline.",
              ok: false,
              code: "global_daily",
              needsUpgrade: true,
            },
            { status: 429 }
          );
        }
      } catch {
        /* optional */
      }
    }

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (m: { role?: string; content?: string }) =>
              (m.role === "user" || m.role === "assistant") && m.content
          )
          .map((m: { role: "user" | "assistant"; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: String(m.content).slice(0, 3500),
          }))
          .slice(-24)
      : [];

    const histForModel =
      history.length &&
      history[history.length - 1]?.role === "user" &&
      history[history.length - 1]?.content === message
        ? history.slice(0, -1)
        : history;

    const preferPremium = !byokKey && entitlement.premiumAllowed;
    const freeLoadResult =
      byokKey || preferPremium
        ? ({ ok: true, load: "normal" } as const)
        : assertPlatformFreeCapacity();
    const maxTokens =
      !byokKey && freeLoadResult.ok && freeLoadResult.load === "hot"
        ? 600
        : !byokKey && freeLoadResult.ok && freeLoadResult.load === "elevated"
          ? 900
          : 1200;

    const run = async () =>
      generateAssistantReplyServer(
        message,
        histForModel,
        typeof body.learnerContext === "string" ? body.learnerContext.slice(0, 2000) : undefined,
        {
          adultMode,
          byok: byokKey
            ? {
                apiKey: byokKey,
                baseUrl: byokBaseUrl,
                model: byokModel,
              }
            : undefined,
          customSystem:
            typeof body.customSystem === "string" ? body.customSystem.slice(0, 6000) : undefined,
          preferPremium,
          maxTokens,
        }
      );

    const result =
      !byokKey && !preferPremium
        ? await withPlatformFreeSlot(run)
        : await run();

    // Usage accounting
    if (!byokKey && result.reply) {
      try {
        if (result.usedPremium && user) {
          await recordPremiumUse(supabase, user.id, {
            trialActive: entitlement.trialActive,
            planActive: entitlement.planActive,
          });
          // Refresh entitlement counters for response
          entitlement = {
            ...entitlement,
            premiumUsed: entitlement.premiumUsed + 1,
            premiumAllowed:
              entitlement.premiumUsed + 1 < entitlement.premiumEffectiveLimit,
          };
        } else {
          // free model path
          if (user) {
            await supabase.rpc("increment_tool_usage", {
              p_user_id: user.id,
              p_anonymous_id: null,
              p_tool_id: "chat-llm",
              p_metadata: { source: "chat", tier: "free" },
            });
          } else {
            await supabase.rpc("increment_tool_usage", {
              p_user_id: null,
              p_anonymous_id: anonymousId,
              p_tool_id: "chat-llm",
              p_metadata: { source: "chat-guest", tier: "free" },
            });
          }
          await supabase.rpc("increment_tool_usage", {
            p_user_id: null,
            p_anonymous_id: "platform-free-pool",
            p_tool_id: "chat-llm-global",
            p_metadata: { source: "global" },
          });
          usedBefore += 1;
        }
      } catch {
        /* soft */
      }
    }

    // Soft fre daily warn
    const freeSoft =
      !byokKey &&
      !result.usedPremium &&
      softWarnAt(usedBefore, limit, getPlanCapabilities(plan === "guest" ? "free" : plan).softWarnRatio);

    let softWarnMessage = entitlement.softWarnMessage;
    if (freeSoft) {
      softWarnMessage = `Soft warning: free AI ${usedBefore}/${limit} today. When free daily ends you can still use BYOK, or Pro premium budget if you have it.`;
    } else if (
      entitlement.premiumEffectiveLimit > 0 &&
      softWarnAt(
        entitlement.premiumUsed,
        entitlement.premiumEffectiveLimit,
        getPlanCapabilities(entitlement.plan).softWarnRatio
      )
    ) {
      softWarnMessage = `Soft warning: premium AI ${entitlement.premiumUsed}/${entitlement.premiumEffectiveLimit} this period. After the limit, replies stay on free models (Cursor-style).`;
    }

    if (user && result.reply) {
      try {
        await supabase.from("chat_messages").insert([
          {
            user_id: user.id,
            role: "user",
            content: message.slice(0, 8000),
          },
          {
            user_id: user.id,
            role: "assistant",
            content: result.reply.slice(0, 12000),
            metadata: {
              source: result.source,
              usedPremium: result.usedPremium,
            },
          },
        ]);
      } catch {
        /* table optional */
      }
    }

    const res = NextResponse.json({
      reply: result.reply,
      source: result.source,
      ok: true,
      needsWarning: safety.needsWarning && !adultMode,
      llmReady: hasFreeChatProvider() || Boolean(byokKey),
      plan,
      usedPremium: Boolean(result.usedPremium),
      softWarn: Boolean(softWarnMessage),
      softWarnMessage,
      quota: byokKey
        ? { mode: "byok" as const }
        : result.usedPremium
          ? {
              mode: "premium" as const,
              used: entitlement.premiumUsed,
              limit: entitlement.premiumEffectiveLimit,
            }
          : { mode: plan, used: usedBefore, limit },
      entitlement: summarizeEnt(entitlement),
      contextTurns: histForModel.length,
    });

    if (setAnonCookie) {
      res.cookies.set(ANON_COOKIE, anonymousId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }

    return res;
  } catch {
    return NextResponse.json(
      {
        reply: "Something broke on the server. Try again in a second.",
        ok: false,
      },
      { status: 500 }
    );
  }
}

function summarizeEnt(e: ReturnType<typeof resolveAiEntitlement>) {
  return {
    plan: e.plan,
    premiumUsed: e.premiumUsed,
    premiumLimit: e.premiumEffectiveLimit,
    premiumAllowed: e.premiumAllowed,
    freeDailyLimit: e.freeDailyLimit,
    routeLabel: e.routeLabel,
    trialActive: e.trialActive,
    selfLimit: e.selfLimit,
  };
}
