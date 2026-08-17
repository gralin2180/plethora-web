import { NextResponse } from "next/server";
import { extractAccountId, parseJwtClaims } from "@/lib/codex-oauth";
import { refreshCodexToken } from "@/lib/codex-chat";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const refreshToken = String(body.refreshToken ?? "").trim();
    if (!refreshToken) {
      return NextResponse.json({ ok: false, error: "refreshToken required" }, { status: 400 });
    }

    const tokens = await refreshCodexToken(refreshToken);
    const accountId = extractAccountId(tokens);
    const email = tokens.id_token
      ? parseJwtClaims(tokens.id_token)?.email
      : undefined;

    return NextResponse.json({
      ok: true,
      tokens: {
        ...tokens,
        accountId,
        email,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "refresh failed" },
      { status: e instanceof Error && e.message.includes("401") ? 401 : 502 }
    );
  }
}
