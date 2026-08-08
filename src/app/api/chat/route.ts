import { NextResponse } from "next/server";
import { generateAssistantReplyServer } from "@/lib/assistant-brain";
import { assessContentSafety } from "@/lib/content-safety";
import { hasFreeChatProvider } from "@/lib/free-chat";

export async function GET() {
  return NextResponse.json({
    ok: true,
    openrouterConfigured: hasFreeChatProvider(),
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
      typeof body.learnerContext === "string" ? body.learnerContext.slice(0, 2000) : undefined
    );

    return NextResponse.json({
      reply: result.reply,
      source: result.source,
      ok: true,
      needsWarning: safety.needsWarning,
      llmReady: hasFreeChatProvider(),
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
