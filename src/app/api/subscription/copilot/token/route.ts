import { NextResponse } from "next/server";
import { exchangeCopilotSession } from "@/lib/copilot-chat";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const githubToken = String(body.githubToken ?? "").trim();
    if (!githubToken) {
      return NextResponse.json({ ok: false, error: "githubToken required" }, { status: 400 });
    }
    const session = await exchangeCopilotSession(githubToken);
    return NextResponse.json({
      ok: true,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Copilot token failed";
    const status = /isn.?t enabled|401|403/i.test(msg) ? 401 : 502;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
