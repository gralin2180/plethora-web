import { NextResponse } from "next/server";
import {
  CODEX_REDIRECT_URI,
  extractAccountId,
  parseJwtClaims,
} from "@/lib/codex-oauth";
import { exchangeCodexCode } from "@/lib/codex-chat";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code ?? "").trim();
    const codeVerifier = String(body.codeVerifier ?? "").trim();
    const redirectUri =
      typeof body.redirectUri === "string" && body.redirectUri.startsWith("http")
        ? body.redirectUri.trim()
        : CODEX_REDIRECT_URI;

    if (!code || !codeVerifier) {
      return NextResponse.json({ ok: false, error: "code and codeVerifier required" }, { status: 400 });
    }

    const tokens = await exchangeCodexCode({ code, codeVerifier, redirectUri });
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
      { ok: false, error: e instanceof Error ? e.message : "exchange failed" },
      { status: 502 }
    );
  }
}
