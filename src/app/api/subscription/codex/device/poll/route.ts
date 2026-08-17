import { NextResponse } from "next/server";
import { extractAccountId, parseJwtClaims } from "@/lib/codex-oauth";
import { pollCodexDeviceAuth } from "@/lib/codex-chat";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const deviceAuthId = String(body.deviceAuthId ?? "").trim();
    const userCode = String(body.userCode ?? "").trim();
    if (!deviceAuthId || !userCode) {
      return NextResponse.json(
        { ok: false, error: "deviceAuthId and userCode required" },
        { status: 400 }
      );
    }

    const result = await pollCodexDeviceAuth({ deviceAuthId, userCode });
    if (result.status === "pending") {
      return NextResponse.json({ ok: true, pending: true });
    }

    const accountId = extractAccountId(result.tokens);
    const email = result.tokens.id_token
      ? parseJwtClaims(result.tokens.id_token)?.email
      : undefined;

    return NextResponse.json({
      ok: true,
      pending: false,
      tokens: {
        ...result.tokens,
        accountId,
        email,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "device poll failed" },
      { status: 502 }
    );
  }
}
