const SETTINGS_KEY = "plethora.slack.ai.v1";

export type AiSettings = {
  apiBase: string;
  byokKey?: string;
  byokModel?: string;
};

declare global {
  interface Window {
    plethoraDesktop?: { apiBase: string; isDesktop: boolean };
  }
}

export function loadAiSettings(): AiSettings {
  const base = window.plethoraDesktop?.apiBase || "https://plethora-ten.vercel.app";
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { apiBase: base, ...JSON.parse(raw) };
  } catch {
    /* */
  }
  return { apiBase: base };
}

export function saveAiSettings(s: AiSettings) {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({ byokKey: s.byokKey, byokModel: s.byokModel })
  );
}

export async function runAi(
  message: string,
  system: string,
  settings: AiSettings
): Promise<string> {
  const body: Record<string, unknown> = {
    message,
    history: [],
    toolJob: true,
    maxTokens: 900,
    customSystem: system,
  };
  if (settings.byokKey) {
    body.byokKey = settings.byokKey;
    if (settings.byokModel) body.byokModel = settings.byokModel;
  }
  const res = await fetch(`${settings.apiBase.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { reply?: string; code?: string; ok?: boolean };
  if (data.reply) return data.reply;
  return data.code || "No AI reply — add BYOK key in Settings or sign in on Plethora web.";
}

export const ECHO_SYSTEM = `You are Echo, a meeting-notes and team-comms bot for Plethora Slack (not Slack).
Extract decisions and action items when asked. Stay in character. Short chat replies. Refuse CSAM / minors.`;
