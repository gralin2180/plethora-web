import { NextResponse } from "next/server";
import { buildRefinedPrompt, detectIntent } from "@/lib/prompt-engine";
import { polishPrompt } from "@/lib/llm-polish";
import { POOL_EXHAUSTED_MESSAGE } from "@/lib/free-chat";
import { assessContentSafety } from "@/lib/content-safety";
import type { PlanId } from "@/lib/plans";

export async function POST(request: Request) {
  const body = await request.json();
  const task = String(body.task ?? body.input ?? "").trim();
  const answers = (body.answers ?? {}) as Record<string, string>;
  const plan = (body.plan ?? "free") as PlanId;
  const preferMode = body.preferMode as
    | "template_only"
    | "free_api"
    | "paid_api"
    | "local_backend"
    | undefined;

  if (!task) {
    return NextResponse.json({ error: "task is required" }, { status: 400 });
  }

  const safety = assessContentSafety(task + " " + Object.values(answers).join(" "));
  if (safety.hardBlock) {
    return NextResponse.json(
      {
        error: safety.message,
        hardBlock: true,
        safety,
      },
      { status: 403 }
    );
  }

  const draft = body.draftPrompt
    ? String(body.draftPrompt)
    : buildRefinedPrompt(task, answers);

  const skipPolish =
    preferMode === "template_only" || detectIntent(task, answers) === "general";

  const result = skipPolish
    ? {
        prompt: draft,
        mode: "template_only" as const,
        providerNote: "Ready to paste.",
        polished: false,
      }
    : await polishPrompt({
        draftPrompt: draft,
        userTask: task,
        plan,
        preferMode,
        adultMode: Boolean(body.adultConsent),
      });

  if (result.mode === "exhausted") {
    return NextResponse.json(
      {
        ...result,
        safety,
        needsWarning: safety.needsWarning,
        ok: false,
        code: "pool_exhausted",
        error: POOL_EXHAUSTED_MESSAGE,
      },
      { status: 429 }
    );
  }

  return NextResponse.json({
    ...result,
    safety,
    needsWarning: safety.needsWarning,
  });
}
