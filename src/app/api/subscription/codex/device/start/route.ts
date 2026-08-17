import { NextResponse } from "next/server";
import { startCodexDeviceAuth } from "@/lib/codex-chat";

export async function POST() {
  try {
    const session = await startCodexDeviceAuth();
    return NextResponse.json({
      ok: true,
      session: {
        deviceAuthId: session.device_auth_id,
        userCode: session.user_code,
        interval: session.interval,
        verifyUrl: session.verifyUrl,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "device start failed" },
      { status: 502 }
    );
  }
}
