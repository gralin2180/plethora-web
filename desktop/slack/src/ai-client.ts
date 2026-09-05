const SETTINGS_KEY = "plethora.slack.ai.v1";

export type AiSettings = {
  apiBase: string;
  byokKey?: string;
  byokModel?: string;
};

export type AiResult = {
  ok: boolean;
  reply: string;
  error?: string;
  lane?: string;
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
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ byokKey: s.byokKey, byokModel: s.byokModel }));
}

export async function runAi(message: string, system: string, settings: AiSettings): Promise<AiResult> {
  const body: Record<string, unknown> = {
    message,
    history: [],
    toolJob: true,
    maxTokens: 900,
    customSystem: system,
    preferredSource: "zen",
  };
  if (settings.byokKey) {
    body.byokKey = settings.byokKey;
    if (settings.byokModel) body.byokModel = settings.byokModel;
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch(`${settings.apiBase.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let data: { reply?: string; code?: string; ok?: boolean; quota?: { label?: string } };
    try {
      data = (await res.json()) as typeof data;
    } catch {
      return { ok: false, reply: "", error: `Server error (${res.status}). Check connection.` };
    }

    if (data.reply?.trim()) {
      return {
        ok: true,
        reply: data.reply.trim(),
        lane: data.quota?.label || (settings.byokKey ? "BYOK" : "Free pool"),
      };
    }

    const code = data.code || `http_${res.status}`;
    const hints: Record<string, string> = {
      pool_exhausted: "Free AI pool used up today. Add a BYOK key in Settings → Preferences.",
      guest_quota: "Guest limit hit. Add BYOK key or sign in on Plethora web.",
      quota: "Quota exceeded. Add BYOK key in Settings.",
      busy: "AI servers busy — try again in a moment.",
    };
    return {
      ok: false,
      reply: "",
      error: hints[code] || `AI unavailable (${code}). Add BYOK in Settings.`,
    };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return { ok: false, reply: "", error: "Request timed out after 2 min — try a shorter ask or BYOK." };
    }
    return { ok: false, reply: "", error: e instanceof Error ? e.message : "Network error — check internet." };
  } finally {
    window.clearTimeout(timer);
  }
}

export const ECHO_SYSTEM = `You are Echo, a meeting-notes and team-comms bot for Relay (Plethora Office).
Extract decisions and action items when asked. Stay in character. Short chat replies. Refuse CSAM / minors.`;
