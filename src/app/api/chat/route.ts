import { NextResponse } from "next/server";
import { generateAssistantReplyServer } from "@/lib/assistant-brain";
import { assessContentSafety } from "@/lib/content-safety";
import { hasFreeChatProvider } from "@/lib/free-chat";
import { createClient } from "@/lib/supabase/server";
import { GUEST_AI_BLOCK, platformChatDailyLimit } from "@/lib/ai-quota";
import { getPlanCapabilities, type PlanId } from "@/lib/plans";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return NextResponse.json({
    ok: true,
    openrouterConfigured: hasFreeChatProvider(),
    signedIn: Boolean(user),
    requiresAuth: true,
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

    // BYOK from client (user’s key — never log)
    const byokKey =
      typeof body.byokKey === "string" && body.byokKey.startsWith("sk-")
        ? body.byokKey.slice(0, 200)
        : typeof body.byokKey === "string" && body.byokKey.length > 20
          ? body.byokKey.slice(0, 200)
          : undefined;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !byokKey) {
      return NextResponse.json(
        {
          reply: GUEST_AI_BLOCK,
          ok: false,
          code: "auth_required",
          needsLogin: true,
        },
        { status: 401 }
      );
    }

    let plan: PlanId = "free";
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_plan")
        .eq("id", user.id)
        .single();
      plan = (profile?.subscription_plan as PlanId) || "free";

      if (!byokKey) {
        const limit = platformChatDailyLimit(plan);
        try {
          const { data: usageCount } = await supabase.rpc("get_usage_count", {
            p_user_id: user.id,
            p_anonymous_id: null,
            p_tool_id: "chat-llm",
          });
          const used = typeof usageCount === "number" ? usageCount : 0;
          if (used >= limit) {
            return NextResponse.json(
              {
                reply: `Daily free AI chat limit (${limit}) reached on ${getPlanCapabilities(plan).name}. Add your own OpenRouter key in Settings → AI keys (BYOK), or upgrade. Free utilities still work without AI.`,
                ok: false,
                code: "quota",
                needsUpgrade: true,
                limit,
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
          /* tables may miss RPC — still allow */
        }
      }
    }

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (m: { role?: string; content?: string }) =>
              (m.role === "user" || m.role === "assistant") && m.content
          )
          .map((m: { role: "user" | "assistant"; content: string }) => ({
            role: m.role,
            content: String(m.content).slice(0, 4000),
          }))
          .slice(-12)
      : [];

    const result = await generateAssistantReplyServer(
      message,
      history,
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

    return NextResponse.json({
      reply: result.reply,
      source: result.source,
      ok: true,
      needsWarning: safety.needsWarning && !adultMode,
      llmReady: hasFreeChatProvider() || Boolean(byokKey),
      plan,
    });
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
