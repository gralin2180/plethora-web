import { NextResponse } from "next/server";
import { pollCopilotDeviceAuth } from "@/lib/copilot-chat";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const deviceCode = String(body.deviceCode ?? "").trim();
    if (!deviceCode) {
      return NextResponse.json({ ok: false, error: "deviceCode required" }, { status: 400 });
    }
    const result = await pollCopilotDeviceAuth(deviceCode);
    if (result.status === "pending") {
      return NextResponse.json({ ok: true, pending: true });
    }
    return NextResponse.json({ ok: true, pending: false, githubToken: result.githubToken });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Copilot poll failed" },
      { status: 502 }
    );
  }
}
