import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateAssistantReplyServer } from "@/lib/assistant-brain";
import { assessContentSafety } from "@/lib/content-safety";
import { hasFreeChatProvider } from "@/lib/free-chat";
import { createClient } from "@/lib/supabase/server";
import { GUEST_AI_BLOCK, platformChatDailyLimit } from "@/lib/ai-quota";
import { getPlanCapabilities, type PlanId } from "@/lib/plans";

const ANON_COOKIE = "Plethora_anon_id";

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

  return NextResponse.json({
    ok: true,
    openrouterConfigured: hasFreeChatProvider(),
    signedIn: Boolean(user),
    requiresAuth: false,
    guestDailyLimit: platformChatDailyLimit("guest"),
    freeDailyLimit: platformChatDailyLimit("free"),
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
        ? body.byokKey.trim().slice(0, 200)
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

    if (!byokKey) {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_plan")
          .eq("id", user.id)
          .single();
        plan = (profile?.subscription_plan as PlanId) || "free";
        limit = platformChatDailyLimit(plan);
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
                reply: `Daily free AI limit (${limit}) hit on ${getPlanCapabilities(plan).name}. Sign in doesn’t reset today — wait until tomorrow, upgrade, or Settings → AI keys for BYOK.`,
                ok: false,
                code: "quota",
                needsUpgrade: true,
                limit,
                used: usedBefore,
              },
              { status: 429 }
            );
          }
          await supabase.rpc("increment_tool_usage", {
            p_user_id: user.id,
            p_anonymous_id: null,
            p_tool_id: "chat-llm",
            p_metadata: { source: "chat" },
          });
        } catch {
          /* RPC missing — soft allow */
        }
      } else {
        // Guest free stack (shared platform free models)
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
          await supabase.rpc("increment_tool_usage", {
            p_user_id: null,
            p_anonymous_id: anonymousId,
            p_tool_id: "chat-llm",
            p_metadata: { source: "chat-guest" },
          });
        } catch {
          /* if usage tables missing, still allow guests so product works */
        }
      }
    }

    // Context window for the model: last N turns
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

    // Drop trailing user dupe if client already appended current message as last history item
    const histForModel =
      history.length &&
      history[history.length - 1]?.role === "user" &&
      history[history.length - 1]?.content === message
        ? history.slice(0, -1)
        : history;

    const result = await generateAssistantReplyServer(
      message,
      histForModel,
      typeof body.learnerContext === "string" ? body.learnerContext.slice(0, 2000) : undefined,
      {
        adultMode,
        byok: byokKey
          ? {
              apiKey: byokKey,
              baseUrl:
                typeof body.byokBaseUrl === "string" ? body.byokBaseUrl : undefined,
            }
          : undefined,
        customSystem:
          typeof body.customSystem === "string" ? body.customSystem.slice(0, 6000) : undefined,
      }
    );

    // Persist cloud transcript for signed-in users (best-effort)
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
            metadata: { source: result.source },
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
      quota: byokKey
        ? { mode: "byok" }
        : { mode: plan, used: usedBefore + 1, limit },
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
