import { NextResponse } from "next/server";
import {
  buildRefinedPrompt,
  generateClarifyingQuestions,
  recommendAiForTask,
} from "@/lib/recommender";

export async function POST(request: Request) {
  const body = await request.json();
  const rawInput = body.input?.trim();
  const answers = body.answers ?? {};

  if (!rawInput) {
    return NextResponse.json({ error: "Input is required" }, { status: 400 });
  }

  if (!body.answers) {
    const questions = generateClarifyingQuestions(rawInput);
    return NextResponse.json({ questions });
  }

  const refinedPrompt = buildRefinedPrompt(rawInput, answers);
  const recommendations = recommendAiForTask(
    rawInput + " " + Object.values(answers).join(" ")
  );

  return NextResponse.json({
    refinedPrompt,
    suggestedTools: recommendations.aiTools.slice(0, 8),
    internalTools: recommendations.internalTools,
  });
}
