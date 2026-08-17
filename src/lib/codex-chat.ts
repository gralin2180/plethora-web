import {
  CODEX_API_ENDPOINT,
  CODEX_DEFAULT_MODEL,
  type CodexTokenResponse,
} from "./codex-oauth";
import type { ChatHistoryMsg } from "./free-chat";

export type CodexChatAuth = {
  accessToken: string;
  accountId?: string;
};

export type CodexChatResult = {
  ok: boolean;
  reply: string;
  provider: string;
  model?: string;
  error?: string;
};

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function codexModel(): string {
  return env("PLETHORA_CODEX_MODEL") || CODEX_DEFAULT_MODEL;
}

/** Server-side proxy to ChatGPT Codex backend (subscription OAuth token). */
export async function codexChatCompletion(
  userMessage: string,
  history: ChatHistoryMsg[],
  systemInstructions: string,
  auth: CodexChatAuth
): Promise<CodexChatResult> {
  const model = codexModel();
  const input = [
    ...history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-14)
      .map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  const body = {
    model,
    store: false,
    stream: true,
    instructions: systemInstructions,
    input,
    text: { verbosity: "medium" },
    tool_choice: "none",
    parallel_tool_calls: false,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${auth.accessToken}`,
    originator: "plethora",
    "User-Agent": "Plethora/1.0 (subscription-connect)",
  };
  if (auth.accountId) headers["ChatGPT-Account-Id"] = auth.accountId;

  try {
    const res = await fetch(CODEX_API_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = (await res.text()).slice(0, 400);
      return {
        ok: false,
        reply: "",
        provider: "chatgpt-subscription",
        model,
        error: `${res.status}: ${errText}`,
      };
    }

    const reply = await collectCodexSseText(res);
    if (!reply) {
      return {
        ok: false,
        reply: "",
        provider: "chatgpt-subscription",
        model,
        error: "Empty Codex response",
      };
    }

    return {
      ok: true,
      reply,
      provider: "chatgpt-subscription",
      model,
    };
  } catch (e) {
    return {
      ok: false,
      reply: "",
      provider: "chatgpt-subscription",
      model,
      error: e instanceof Error ? e.message : "network error",
    };
  }
}

async function collectCodexSseText(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";

  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const evt = JSON.parse(payload) as {
          type?: string;
          delta?: string;
          response?: {
            output_text?: string;
            output?: Array<{
              type?: string;
              content?: Array<{ type?: string; text?: string }>;
            }>;
          };
        };

        if (evt.type === "response.output_text.delta" && evt.delta) {
          text += evt.delta;
        }

        if (evt.type === "response.completed" && evt.response) {
          if (typeof evt.response.output_text === "string") {
            text = evt.response.output_text;
          }
          for (const item of evt.response.output || []) {
            if (item.type !== "message") continue;
            for (const c of item.content || []) {
              if (c.type === "output_text" && c.text) text += c.text;
            }
          }
        }
      } catch {
        /* ignore malformed SSE chunks */
      }
    }
  }

  return text.trim();
}

export async function exchangeCodexCode(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<CodexTokenResponse> {
  const { CODEX_CLIENT_ID, CODEX_TOKEN_URL } = await import("./codex-oauth");
  const res = await fetch(CODEX_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: CODEX_CLIENT_ID,
      code_verifier: params.codeVerifier,
    }).toString(),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 280);
    throw new Error(`Token exchange failed (${res.status}): ${detail}`);
  }
  return res.json() as Promise<CodexTokenResponse>;
}

export async function refreshCodexToken(
  refreshToken: string
): Promise<CodexTokenResponse> {
  const { CODEX_CLIENT_ID, CODEX_TOKEN_URL } = await import("./codex-oauth");
  const res = await fetch(CODEX_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CODEX_CLIENT_ID,
    }).toString(),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 280);
    throw new Error(`Token refresh failed (${res.status}): ${detail}`);
  }
  return res.json() as Promise<CodexTokenResponse>;
}

export async function startCodexDeviceAuth(): Promise<{
  device_auth_id: string;
  user_code: string;
  interval: number;
  verifyUrl: string;
}> {
  const { CODEX_CLIENT_ID, CODEX_DEVICE_VERIFY_URL, CODEX_ISSUER } = await import(
    "./codex-oauth"
  );
  const res = await fetch(`${CODEX_ISSUER}/api/accounts/deviceauth/usercode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CODEX_CLIENT_ID }),
  });
  if (!res.ok) {
    throw new Error(`Device auth start failed (${res.status})`);
  }
  const data = (await res.json()) as {
    device_auth_id: string;
    user_code: string;
    interval: string;
  };
  return {
    device_auth_id: data.device_auth_id,
    user_code: data.user_code,
    interval: Math.max(parseInt(data.interval, 10) || 5, 1),
    verifyUrl: CODEX_DEVICE_VERIFY_URL,
  };
}

export async function pollCodexDeviceAuth(params: {
  deviceAuthId: string;
  userCode: string;
}): Promise<
  | { status: "pending" }
  | { status: "ready"; tokens: CodexTokenResponse }
> {
  const { CODEX_DEVICE_CALLBACK_URI, CODEX_ISSUER } = await import(
    "./codex-oauth"
  );

  const pollRes = await fetch(`${CODEX_ISSUER}/api/accounts/deviceauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device_auth_id: params.deviceAuthId,
      user_code: params.userCode,
    }),
  });

  if (pollRes.status === 403 || pollRes.status === 404) {
    return { status: "pending" };
  }

  if (!pollRes.ok) {
    throw new Error(`Device poll failed (${pollRes.status})`);
  }

  const data = (await pollRes.json()) as {
    authorization_code: string;
    code_verifier: string;
  };

  const tokens = await exchangeCodexCode({
    code: data.authorization_code,
    codeVerifier: data.code_verifier,
    redirectUri: CODEX_DEVICE_CALLBACK_URI,
  });

  return { status: "ready", tokens };
}
