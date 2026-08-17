import { NextResponse } from "next/server";
import { startCopilotDeviceAuth } from "@/lib/copilot-chat";

export async function POST() {
  try {
    const session = await startCopilotDeviceAuth();
    return NextResponse.json({ ok: true, session });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Copilot start failed" },
      { status: 502 }
    );
  }
}
