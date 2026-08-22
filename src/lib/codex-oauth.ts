/**
 * OpenAI Codex OAuth (ChatGPT Plus/Pro subscription).
 * Same public client + PKCE flow used by Codex CLI / OpenCode.
 */

export const CODEX_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
export const CODEX_ISSUER = "https://auth.openai.com";
export const CODEX_AUTHORIZE_URL = `${CODEX_ISSUER}/oauth/authorize`;
export const CODEX_TOKEN_URL = `${CODEX_ISSUER}/oauth/token`;
export const CODEX_REDIRECT_URI = "http://localhost:1455/auth/callback";
export const CODEX_DEVICE_VERIFY_URL = `${CODEX_ISSUER}/codex/device`;
export const CODEX_DEVICE_CALLBACK_URI = `${CODEX_ISSUER}/deviceauth/callback`;
export const CODEX_SCOPES = "openid profile email offline_access";
export const CODEX_API_ENDPOINT = "https://chatgpt.com/backend-api/codex/responses";
export const CODEX_DEFAULT_MODEL = "gpt-5.4";

export type CodexTokenResponse = {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
};

export type CodexJwtClaims = {
  chatgpt_account_id?: string;
  email?: string;
  organizations?: Array<{ id: string }>;
  "https://api.openai.com/auth"?: { chatgpt_account_id?: string };
};

export type CodexPkce = { verifier: string; challenge: string };

const PKCE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(binary)
      : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function generateCodexPkce(): Promise<CodexPkce> {
  const rand = crypto.getRandomValues(new Uint8Array(43));
  const verifier = Array.from(rand)
    .map((b) => PKCE_CHARS[b % PKCE_CHARS.length])
    .join("");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  return { verifier, challenge: base64UrlEncode(digest) };
}

export function randomCodexState(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)).buffer);
}

export function buildCodexAuthorizeUrl(
  pkce: CodexPkce,
  state: string,
  redirectUri = CODEX_REDIRECT_URI
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CODEX_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: CODEX_SCOPES,
    code_challenge: pkce.challenge,
    code_challenge_method: "S256",
    id_token_add_organizations: "true",
    codex_cli_simplified_flow: "true",
    state,
    originator: "codex_cli_rs",
  });
  return `${CODEX_AUTHORIZE_URL}?${params.toString()}`;
}

export function parseJwtClaims(token: string): CodexJwtClaims | undefined {
  const parts = token.split(".");
  if (parts.length !== 3) return undefined;
  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json =
      typeof atob !== "undefined"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as CodexJwtClaims;
  } catch {
    return undefined;
  }
}

export function extractAccountIdFromClaims(
  claims: CodexJwtClaims
): string | undefined {
  return (
    claims.chatgpt_account_id ||
    claims["https://api.openai.com/auth"]?.chatgpt_account_id ||
    claims.organizations?.[0]?.id
  );
}

export function extractAccountId(tokens: CodexTokenResponse): string | undefined {
  if (tokens.id_token) {
    const claims = parseJwtClaims(tokens.id_token);
    const id = claims && extractAccountIdFromClaims(claims);
    if (id) return id;
  }
  if (tokens.access_token) {
    const claims = parseJwtClaims(tokens.access_token);
    return claims ? extractAccountIdFromClaims(claims) : undefined;
  }
  return undefined;
}

/** Parse pasted callback URL after browser OAuth (localhost:1455 or device). */
export function parseCodexCallbackUrl(raw: string): {
  code?: string;
  state?: string;
  error?: string;
} {
  try {
    const url = raw.includes("://") ? new URL(raw.trim()) : new URL(raw, "http://x");
    return {
      code: url.searchParams.get("code") || undefined,
      state: url.searchParams.get("state") || undefined,
      error:
        url.searchParams.get("error_description") ||
        url.searchParams.get("error") ||
        undefined,
    };
  } catch {
    return { error: "Invalid URL" };
  }
}

export function codexTokenExpiresAt(expiresIn?: number): number {
  return Date.now() + (expiresIn ?? 3600) * 1000 - 60_000;
}
