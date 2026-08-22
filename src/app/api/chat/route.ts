import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateAssistantReplyServer } from "@/lib/assistant-brain";
import { isChatPersonalityId } from "@/lib/chat-personality";
import {
  EXTRA_USAGE_MESSAGE,
  laneHistoryTurns,
  laneLabel,
  laneMaxTokens,
  laneMessageChars,
  resolveChatLane,
  type ChatLane,
} from "@/lib/ai-lanes";
import { assessContentSafety } from "@/lib/content-safety";
import { hasFreeChatProvider, hasOpenRouterProvider, hasZenProvider } from "@/lib/free-chat";
import { OPENCODE_ZEN_FREE_MODELS, OPENROUTER_FREE_MODELS } from "@/lib/free-models";
import { createClient } from "@/lib/supabase/server";
import { platformChatDailyLimit } from "@/lib/ai-quota";
import { getPlanCapabilities, type PlanId } from "@/lib/plans";
import { resolveAiEntitlement, softWarnAt, type EntitlementRow } from "@/lib/entitlements";
import {
  assertPlatformFreeCapacity,
  freePlatformDailyHardCap,
  withPlatformFreeSlot,
} from "@/lib/free-tier-guard";
import { recordPremiumUse } from "@/lib/billing-activate";
import { parseChatQuality, budgetFromSmooth } from "@/lib/chat-quality";
import { emailsFromAuthUser, envDevEmailList, isDevUnrestricted } from "@/lib/dev-access";

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
    openrouterConfigured: hasOpenRouterProvider(),
    zenConfigured: hasZenProvider(),
    llmConfigured: hasFreeChatProvider(),
    freeModels: {
      zen: OPENCODE_ZEN_FREE_MODELS,
      openrouter: OPENROUTER_FREE_MODELS,
    },
    signedIn: Boolean(user),
    unrestricted: isDevUnrestricted({
      email: user?.email,
      userId: user?.id,
      emails: emailsFromAuthUser(user),
    }),
    devAllowlistConfigured: envDevEmailList().length > 0,
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

    const adultConsent = Boolean(body.adultConsent);

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

    const preferredModel =
      typeof body.preferredModel === "string" && body.preferredModel.trim()
        ? body.preferredModel.trim().slice(0, 120)
        : undefined;
    const preferredSource =
      body.preferredSource === "zen" || body.preferredSource === "openrouter"
        ? (body.preferredSource as "zen" | "openrouter")
        : undefined;

    const codexAccessToken =
      typeof body.codexAccessToken === "string" && body.codexAccessToken.length > 20
        ? body.codexAccessToken.trim().slice(0, 8000)
        : undefined;
    const codexAccountId =
      typeof body.codexAccountId === "string" && body.codexAccountId.trim()
        ? body.codexAccountId.trim().slice(0, 120)
        : undefined;

    const copilotSessionToken =
      typeof body.copilotSessionToken === "string" && body.copilotSessionToken.length > 20
        ? body.copilotSessionToken.trim().slice(0, 8000)
        : undefined;

    const usesOwnAi = Boolean(byokKey || codexAccessToken || copilotSessionToken);
    const usesZenPublic = preferredSource === "zen" && !byokKey && hasZenProvider();

    const cookieStore = await cookies();
    const anonymousId = getOrCreateAnonymousId(cookieStore);
    const setAnonCookie = !cookieStore.get(ANON_COOKIE)?.value;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const unrestricted = isDevUnrestricted({
      email: user?.email,
      userId: user?.id,
      emails: emailsFromAuthUser(user),
    });
    const adultMode = adultConsent;

    if (!hasFreeChatProvider() && !usesOwnAi && !usesZenPublic) {
      return NextResponse.json(
        {
          reply:
            "No free cloud model is configured on the server yet. Connect your own AI under Get started (ChatGPT, Copilot, Perplexity…), add OPENROUTER_API_KEY, or paste a key under Settings → AI keys.",
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

    // Free-path quota. Owner/dev bypass; everyone else stays capped.
    if (!usesOwnAi && !unrestricted) {
      if (user) {
        limit = entitlement.freeDailyLimit;
        try {
          const { data: usageCount } = await supabase.rpc("get_usage_count", {
            p_user_id: user.id,
            p_anonymous_id: null,
            p_tool_id: "chat-llm",
          });
          usedBefore = typeof usageCount === "number" ? usageCount : 0;
          if (usedBefore >= limit && !entitlement.premiumAllowed) {
            return NextResponse.json(
              {
                reply: EXTRA_USAGE_MESSAGE,
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
                reply: EXTRA_USAGE_MESSAGE,
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

    const lane: ChatLane = resolveChatLane({
      usesOwnAi,
      premiumAllowed: entitlement.premiumAllowed,
      hasPaidBudget: entitlement.premiumEffectiveLimit > 0 || entitlement.planActive,
    });

    const histTurns = laneHistoryTurns(lane);
    const histChars = laneMessageChars(lane);
    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (m: { role?: string; content?: string }) =>
              (m.role === "user" || m.role === "assistant") && m.content
          )
          .map((m: { role: "user" | "assistant"; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: String(m.content).slice(0, histChars),
          }))
          .slice(-histTurns)
      : [];

    const histForModel =
      history.length &&
      history[history.length - 1]?.role === "user" &&
      history[history.length - 1]?.content === message
        ? history.slice(0, -1)
        : history;

    const preferPremium = lane === "premium";
    const freeLoadResult =
      usesOwnAi || preferPremium || unrestricted
        ? ({ ok: true, load: "normal" } as const)
        : assertPlatformFreeCapacity();
    if (!freeLoadResult.ok) {
      return NextResponse.json(
        {
          reply: freeLoadResult.reason,
          ok: false,
          code: freeLoadResult.code,
          needsUpgrade: true,
        },
        { status: 429 }
      );
    }
    const maxTokens = laneMaxTokens(lane, freeLoadResult.load === "hot");
    const quality = parseChatQuality(body.qualitySmooth ?? body.quality);
    const budget = budgetFromSmooth(
      typeof body.qualitySmooth === "number" ? body.qualitySmooth : quality === "fast" ? 20 : quality === "best" ? 100 : 50
    );

    const wantStream = Boolean(body.stream);
    const chatOpts = {
      adultMode,
      byok: byokKey
        ? {
            apiKey: byokKey,
            baseUrl: byokBaseUrl,
            model: byokModel,
          }
        : undefined,
      codex: codexAccessToken
        ? { accessToken: codexAccessToken, accountId: codexAccountId }
        : undefined,
      copilot: copilotSessionToken ? { sessionToken: copilotSessionToken } : undefined,
      customSystem:
        typeof body.customSystem === "string" ? body.customSystem.slice(0, 6000) : undefined,
      personality: isChatPersonalityId(body.personality) ? body.personality : undefined,
      preferPremium,
      maxTokens: lane === "premium" || lane === "byok" ? maxTokens : budget.maxTokens,
      preferredModel,
      preferredSource,
      lane,
      unrestricted,
      quality,
      qualitySmooth: typeof body.qualitySmooth === "number" ? body.qualitySmooth : undefined,
    };

    if (wantStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const send = (obj: unknown) =>
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
          try {
            const result = await generateAssistantReplyServer(
              message,
              histForModel,
              typeof body.learnerContext === "string"
                ? body.learnerContext.slice(
                    0,
                    lane === "premium" || lane === "byok" ? 4000 : 1500
                  )
                : undefined,
              {
                ...chatOpts,
                onDelta: (chunk) => send({ delta: chunk }),
              }
            );
            send({
              done: true,
              reply: result.reply,
              source: result.source,
              ok: !result.code,
              code: result.code,
              usedPremium: Boolean(result.usedPremium),
              unrestricted,
              quota: unrestricted
                ? { mode: "dev", label: "Dev — unrestricted" }
                : { mode: plan, used: usedBefore + 1, limit, lane, label: laneLabel(lane) },
            });
            if (!usesOwnAi && !unrestricted && result.reply && !result.code) {
              try {
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
              } catch {
                /* soft */
              }
            }
          } catch {
            send({
              done: true,
              reply: "Something broke on the server. Try again in a second.",
              ok: false,
            });
          } finally {
            controller.close();
          }
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    const run = async () =>
      generateAssistantReplyServer(
        message,
        histForModel,
        typeof body.learnerContext === "string"
          ? body.learnerContext.slice(0, lane === "premium" || lane === "byok" ? 4000 : 1500)
          : undefined,
        chatOpts
      );

    const result =
      unrestricted || usesOwnAi || lane === "premium"
        ? await run()
        : await withPlatformFreeSlot(run);

    if (result.code === "pool_exhausted" && !unrestricted) {
      const res = NextResponse.json(
        {
          reply: result.reply,
          ok: false,
          code: "pool_exhausted",
          needsUpgrade: true,
          source: result.source,
        },
        { status: 429 }
      );
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
    }

    // Usage accounting
    if (!usesOwnAi && !unrestricted && result.reply) {
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
      !usesOwnAi &&
      !result.usedPremium &&
      softWarnAt(usedBefore, limit, getPlanCapabilities(plan === "guest" ? "free" : plan).softWarnRatio);

    let softWarnMessage = entitlement.softWarnMessage;
    if (freeSoft) {
      softWarnMessage = `Soft warning: free AI ${usedBefore}/${limit} today. After that, extra usage is paid (try pack / subscribe) or BYOK.`;
    } else if (
      entitlement.premiumEffectiveLimit > 0 &&
      softWarnAt(
        entitlement.premiumUsed,
        entitlement.premiumEffectiveLimit,
        getPlanCapabilities(entitlement.plan).softWarnRatio
      )
    ) {
      softWarnMessage = `Soft warning: included paid models ${entitlement.premiumUsed}/${entitlement.premiumEffectiveLimit} this period. After that you stay on slower cheap models, then extra usage is billed.`;
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
      llmReady: hasFreeChatProvider() || usesOwnAi,
      plan,
      usedPremium: Boolean(result.usedPremium),
      softWarn: Boolean(softWarnMessage),
      softWarnMessage,
      quota: unrestricted
        ? { mode: "dev" as const, label: "Dev — unrestricted" }
        : copilotSessionToken
        ? { mode: "subscription" as const, label: "GitHub Copilot" }
        : codexAccessToken
        ? { mode: "subscription" as const }
        : byokKey
          ? { mode: "byok" as const }
          : result.usedPremium
          ? {
              mode: "premium" as const,
              used: entitlement.premiumUsed,
              limit: entitlement.premiumEffectiveLimit,
              lane,
              label: laneLabel(lane),
            }
          : { mode: plan, used: usedBefore, limit, lane, label: laneLabel(lane) },
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
