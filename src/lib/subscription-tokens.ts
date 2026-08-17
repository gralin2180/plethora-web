/**
 * Browser-only ChatGPT subscription (Codex OAuth) credentials.
 */

import {
  codexTokenExpiresAt,
  type CodexTokenResponse,
} from "./codex-oauth";

export const CODEX_STORAGE_KEY = "plethora.codex.oauth.v1";
const PKCE_SESSION_KEY = "plethora.codex.pkce.v1";

export type StoredCodexAuth = {
  accessToken: string;
  refreshToken: string;
  accountId?: string;
  email?: string;
  expiresAt: number;
  connectedAt: number;
};

export function loadCodexAuth(): StoredCodexAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CODEX_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCodexAuth;
    if (!parsed?.accessToken || !parsed?.refreshToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCodexAuth(auth: StoredCodexAuth) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CODEX_STORAGE_KEY, JSON.stringify(auth));
}

export function clearCodexAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CODEX_STORAGE_KEY);
  sessionStorage.removeItem(PKCE_SESSION_KEY);
}

export function hasCodexSubscription(): boolean {
  return Boolean(loadCodexAuth()?.accessToken);
}

export function storePkceSession(data: {
  verifier: string;
  state: string;
  redirectUri?: string;
}) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PKCE_SESSION_KEY, JSON.stringify(data));
}

export function loadPkceSession(): {
  verifier: string;
  state: string;
  redirectUri?: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PKCE_SESSION_KEY);
    return raw ? (JSON.parse(raw) as { verifier: string; state: string; redirectUri?: string }) : null;
  } catch {
    return null;
  }
}

export function tokensToStored(
  tokens: CodexTokenResponse & { accountId?: string; email?: string }
): StoredCodexAuth {
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accountId: tokens.accountId,
    email: tokens.email,
    expiresAt: codexTokenExpiresAt(tokens.expires_in),
    connectedAt: Date.now(),
  };
}

/** Returns fresh access token; refreshes via Plethora API when near expiry. */
export async function getValidCodexAuth(): Promise<StoredCodexAuth | null> {
  const current = loadCodexAuth();
  if (!current) return null;
  if (Date.now() < current.expiresAt) return current;

  try {
    const res = await fetch("/api/subscription/codex/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      tokens?: CodexTokenResponse & { accountId?: string; email?: string };
      error?: string;
    };
    if (!res.ok || !data.ok || !data.tokens) {
      if (res.status === 401) clearCodexAuth();
      return null;
    }
    const next = tokensToStored({
      ...data.tokens,
      accountId: data.tokens.accountId || current.accountId,
      email: data.tokens.email || current.email,
    });
    saveCodexAuth(next);
    return next;
  } catch {
    return null;
  }
}
