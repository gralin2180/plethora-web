const COPILOT_CLIENT_ID = "Iv1.b507a08c87ecfe98";
const DEVICE_CODE_URL = "https://github.com/login/device/code";
const ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
const COPILOT_SESSION_URL = "https://api.github.com/copilot_internal/v2/token";
const COPILOT_CHAT_URL = "https://api.githubcopilot.com/chat/completions";
const UA = "GitHubCopilotChat/0.26.7";

export type CopilotDeviceSession = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  interval: number;
  expiresIn: number;
};

export async function startCopilotDeviceAuth(): Promise<CopilotDeviceSession> {
  const res = await fetch(DEVICE_CODE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": UA,
    },
    body: JSON.stringify({
      client_id: COPILOT_CLIENT_ID,
      scope: "read:user",
    }),
  });
  if (!res.ok) throw new Error(`Copilot device start failed (${res.status})`);
  const data = (await res.json()) as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    expires_in?: number;
    interval?: number;
  };
  if (!data.device_code || !data.user_code) {
    throw new Error("GitHub did not return a device code");
  }
  return {
    deviceCode: data.device_code,
    userCode: data.user_code,
    verificationUri: data.verification_uri || "https://github.com/login/device",
    interval: data.interval || 5,
    expiresIn: data.expires_in || 900,
  };
}

export async function pollCopilotDeviceAuth(deviceCode: string): Promise<
  | { status: "pending" }
  | { status: "ready"; githubToken: string }
> {
  const res = await fetch(ACCESS_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": UA,
    },
    body: JSON.stringify({
      client_id: COPILOT_CLIENT_ID,
      device_code: deviceCode,
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    error?: string;
  };
  if (data.access_token) return { status: "ready", githubToken: data.access_token };
  if (data.error === "authorization_pending" || data.error === "slow_down") {
    return { status: "pending" };
  }
  if (data.error === "expired_token" || data.error === "access_denied") {
    throw new Error(data.error === "access_denied" ? "Login denied" : "Code expired — start again");
  }
  return { status: "pending" };
}

export async function exchangeCopilotSession(githubToken: string): Promise<{
  sessionToken: string;
  expiresAt: number;
}> {
  const res = await fetch(COPILOT_SESSION_URL, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${githubToken}`,
      "User-Agent": UA,
      "Editor-Version": "vscode/1.95.0",
      "Editor-Plugin-Version": "copilot-chat/0.26.7",
    },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error("GitHub Copilot isn’t enabled on this account");
  }
  if (!res.ok) throw new Error(`Copilot session failed (${res.status})`);
  const data = (await res.json()) as { token?: string; expires_at?: number };
  if (!data.token) throw new Error("No Copilot session token");
  const expiresAt =
    typeof data.expires_at === "number" && data.expires_at > 1_000_000_000_000
      ? data.expires_at
      : (data.expires_at || Date.now() / 1000 + 1500) * 1000;
  return { sessionToken: data.token, expiresAt: expiresAt - 60_000 };
}

export async function copilotChatCompletion(
  userMessage: string,
  history: { role: "user" | "assistant" | "system"; content: string }[],
  systemInstructions: string,
  sessionToken: string
): Promise<{ ok: boolean; reply: string; error?: string; provider: string }> {
  const messages = [
    { role: "system" as const, content: systemInstructions },
    ...history.filter((m) => m.role !== "system").slice(-14),
    { role: "user" as const, content: userMessage },
  ];
  try {
    const res = await fetch(COPILOT_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
        "User-Agent": UA,
        "Editor-Version": "vscode/1.95.0",
        "Editor-Plugin-Version": "copilot-chat/0.26.7",
        "Copilot-Integration-Id": "vscode-chat",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.7,
        messages,
        stream: false,
      }),
    });
    const raw = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        reply: "",
        provider: "github-copilot",
        error: `${res.status}: ${raw.slice(0, 280)}`,
      };
    }
    const data = JSON.parse(raw) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return { ok: false, reply: "", provider: "github-copilot", error: "Empty Copilot reply" };
    }
    return { ok: true, reply, provider: "github-copilot" };
  } catch (e) {
    return {
      ok: false,
      reply: "",
      provider: "github-copilot",
      error: e instanceof Error ? e.message : "network error",
    };
  }
}
