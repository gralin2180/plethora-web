/**
 * Personalised context — NOT sent to Plethora servers by default.
 * Stored in browser localStorage; optional download as context file for local folder.
 * Optional File System Access API when browser supports it.
 */

export const PERSONAL_CONTEXT_KEY = "plethora.personalContext.v1";
export const PERSONAL_CONTEXT_CONSENT_KEY = "plethora.personalContext.consent.v1";
export const PERSONAL_CONTEXT_FILENAME = "plethora-personal-context.json";

export interface PersonalContext {
  version: 1;
  enabled: boolean;
  updatedAt: string;
  /** Free-form notes (goals, brand, tone, constraints) */
  notes: string;
  /** Structured patterns */
  preferredTone?: string;
  niche?: string;
  brands?: string;
  audiences?: string;
  avoid?: string;
  goals?: string;
  /** Short memory lines from sessions (user may add) */
  patterns: string[];
  /** Explicit privacy flag stored with file */
  privacy: {
    localOnly: true;
    serverUse: "never";
    notice: string;
  };
}

export const PRIVACY_NOTICE =
  "This context stays on your device (browser storage and/or a file YOU download or save). Plethora does not upload, train on, sell, or read this personalisation data on our servers. If you use cloud AI polish or a third-party model later, only the text YOU choose to paste/send leaves your machine — not this file automatically.";

export function emptyContext(): PersonalContext {
  return {
    version: 1,
    enabled: false,
    updatedAt: new Date().toISOString(),
    notes: "",
    patterns: [],
    privacy: {
      localOnly: true,
      serverUse: "never",
      notice: PRIVACY_NOTICE,
    },
  };
}

export function loadPersonalContext(): PersonalContext {
  if (typeof window === "undefined") return emptyContext();
  try {
    const raw = localStorage.getItem(PERSONAL_CONTEXT_KEY);
    if (!raw) return emptyContext();
    return { ...emptyContext(), ...JSON.parse(raw), privacy: emptyContext().privacy };
  } catch {
    return emptyContext();
  }
}

export function savePersonalContext(ctx: PersonalContext) {
  if (typeof window === "undefined") return;
  const next = {
    ...ctx,
    updatedAt: new Date().toISOString(),
    privacy: emptyContext().privacy,
  };
  localStorage.setItem(PERSONAL_CONTEXT_KEY, JSON.stringify(next));
}

export function hasPersonalContextConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PERSONAL_CONTEXT_CONSENT_KEY) === "accepted";
}

export function acceptPersonalContextConsent() {
  if (typeof window === "undefined") return;
  localStorage.setItem(PERSONAL_CONTEXT_CONSENT_KEY, "accepted");
}

export function contextToPromptBlock(ctx: PersonalContext): string {
  if (!ctx.enabled) return "";
  const lines: string[] = [
    "## User personalisation (LOCAL ONLY — not provided by Plethora servers)",
  ];
  if (ctx.niche) lines.push(`- Niche / industry: ${ctx.niche}`);
  if (ctx.brands) lines.push(`- Brand / business: ${ctx.brands}`);
  if (ctx.audiences) lines.push(`- Typical audiences: ${ctx.audiences}`);
  if (ctx.preferredTone) lines.push(`- Preferred tone: ${ctx.preferredTone}`);
  if (ctx.goals) lines.push(`- Ongoing goals: ${ctx.goals}`);
  if (ctx.avoid) lines.push(`- Avoid: ${ctx.avoid}`);
  if (ctx.notes.trim()) lines.push(`- Notes:\n${ctx.notes.trim()}`);
  if (ctx.patterns.length) {
    lines.push("- Observed patterns:");
    for (const p of ctx.patterns.slice(-20)) lines.push(`  • ${p}`);
  }
  lines.push(
    "Use this only to personalise output. Do not invent extra bio facts beyond this block."
  );
  return lines.join("\n");
}

export function downloadContextFile(ctx: PersonalContext) {
  const blob = new Blob([JSON.stringify(ctx, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = PERSONAL_CONTEXT_FILENAME;
  a.click();
  URL.revokeObjectURL(url);
}

export async function saveContextToUserFolder(ctx: PersonalContext): Promise<boolean> {
  // Chromium File System Access API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (!w.showSaveFilePicker) {
    downloadContextFile(ctx);
    return false;
  }
  try {
    const handle = await w.showSaveFilePicker({
      suggestedName: PERSONAL_CONTEXT_FILENAME,
      types: [
        {
          description: "Plethora personal context",
          accept: { "application/json": [".json"] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(ctx, null, 2));
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

export function importContextFromJson(text: string): PersonalContext | null {
  try {
    const data = JSON.parse(text);
    return {
      ...emptyContext(),
      ...data,
      version: 1,
      privacy: emptyContext().privacy,
    };
  } catch {
    return null;
  }
}

export function appendPattern(line: string) {
  const ctx = loadPersonalContext();
  if (!ctx.enabled || !line.trim()) return;
  const patterns = [...ctx.patterns, line.trim()].slice(-40);
  savePersonalContext({ ...ctx, patterns });
}
