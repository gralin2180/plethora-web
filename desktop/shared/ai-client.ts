const SETTINGS_KEY = "plethora.office.ai.v1";

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

export async function runAi(
  message: string,
  system: string,
  settings: AiSettings,
  opts?: { maxTokens?: number }
): Promise<AiResult> {
  const body: Record<string, unknown> = {
    message,
    history: [],
    toolJob: true,
    maxTokens: opts?.maxTokens ?? 1200,
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

    let data: { reply?: string; code?: string; quota?: { label?: string } };
    try {
      data = (await res.json()) as typeof data;
    } catch {
      return { ok: false, reply: "", error: `Server error (${res.status}).` };
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
      pool_exhausted: "Free pool used up — add BYOK in Settings.",
      guest_quota: "Guest limit — add BYOK key.",
      quota: "Quota exceeded.",
      busy: "AI busy — retry shortly.",
    };
    return { ok: false, reply: "", error: hints[code] || `AI unavailable (${code}).` };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return { ok: false, reply: "", error: "Timed out — try BYOK or shorter prompt." };
    }
    return { ok: false, reply: "", error: e instanceof Error ? e.message : "Network error." };
  } finally {
    window.clearTimeout(timer);
  }
}
