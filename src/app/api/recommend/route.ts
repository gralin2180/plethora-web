import { NextResponse } from "next/server";
import { recommendAiForTask } from "@/lib/recommender";

export async function POST(request: Request) {
  const body = await request.json();
  const task = body.task?.trim();

  if (!task) {
    return NextResponse.json({ error: "Task is required" }, { status: 400 });
  }

  const recommendations = recommendAiForTask(task);
  return NextResponse.json(recommendations);
}
