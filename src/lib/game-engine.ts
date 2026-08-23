/**
 * Game Director — production desk for making games with prompts + uploads.
 * Prefer Godot 4 / web slice. Not a browser Unity/Unreal compiler.
 */

import { loadCustomAssistants, upsertAssistant, type CustomAssistant } from "./custom-assistants";

export const GAME_DIRECTOR_ID = "plethora-game-director";

export const GAME_PROJECT_KEY = "plethora.gameProject.v1";
export const GAME_CHAT_KEY = "plethora.gameDirector.chat.v1";

export type GameEngineChoice = "godot4" | "web" | "unity-guides" | "unreal-guides";

export type PipelineStage =
  | "pitch"
  | "gdd"
  | "systems"
  | "art"
  | "assets"
  | "audio"
  | "engine"
  | "build";

export type PipelineStep = {
  id: PipelineStage;
  label: string;
  hint: string;
};

export const GAME_PIPELINE: PipelineStep[] = [
  { id: "pitch", label: "Pitch", hint: "One-liner, hook, audience, platform" },
  { id: "gdd", label: "GDD", hint: "Goals, loops, levels, win/lose" },
  { id: "systems", label: "Systems", hint: "Mechanics, economy, progression" },
  { id: "art", label: "Art", hint: "Style bible, palette, references" },
  { id: "assets", label: "Assets", hint: "Sprites, models, tilesets — names only here" },
  { id: "audio", label: "Audio", hint: "SFX list, music mood, stems" },
  { id: "engine", label: "Engine", hint: "Godot 4 scenes or web slice architecture" },
  { id: "build", label: "Build", hint: "Export, test plan, itch/page copy" },
];

export const ENGINE_OPTIONS: { id: GameEngineChoice; label: string; hint: string }[] = [
  {
    id: "godot4",
    label: "Godot 4",
    hint: "Preferred — 2D/3D, GDScript, export web/desktop",
  },
  {
    id: "web",
    label: "Web slice",
    hint: "HTML canvas / Phaser / tiny playable in browser",
  },
  {
    id: "unity-guides",
    label: "Unity (guides only)",
    hint: "Architecture & asset lists — not compiled here",
  },
  {
    id: "unreal-guides",
    label: "Unreal (guides only)",
    hint: "Blueprint notes — not compiled here",
  },
];

export type GameProject = {
  id: string;
  title: string;
  engine: GameEngineChoice;
  stage: PipelineStage;
  notes: string;
  /** File names only — nothing uploaded to Plethora servers from this desk */
  fileNames: string[];
  createdAt: string;
  updatedAt: string;
};

export type GameChatMessage = {
  role: "user" | "assistant";
  text: string;
  at: string;
};

export const GAME_DIRECTOR_SYSTEM = `You are the Plethora Game Director — a senior game producer + designer desk partner.

Scope:
- Help users ship games via prompts, design docs, system specs, asset lists, audio plans, Godot 4 guidance, and web-playable slices.
- This is NOT a browser Unity/Unreal compiler. Do not promise to compile native builds inside Plethora.
- Prefer Godot 4 for full games; suggest web slice (Phaser/canvas) for quick playable demos.
- Higgsfield / MCP generators are credit-based later — mention when relevant but never claim Stripe charged or paid credits consumed.

Safety (hard rules):
- Refuse CSAM and any sexual content involving minors — no exceptions, no "artistic" loopholes.
- Refuse illegal content. Adult themes only for clearly adult fictional characters when user confirms 18+.

Workflow:
- Follow the pipeline: pitch → GDD → systems → art → assets → audio → engine → build.
- Ask one focused question at a time when stuck.
- Output actionable artifacts: bullet GDD sections, Godot scene trees, export checklists, asset naming conventions.
- Reference uploaded file *names* the user listed — you never receive binary uploads here.

Tone: enthusiastic craft-focused producer. Short paragraphs. Use markdown headings when delivering docs.`;

export function emptyGameProject(): GameProject {
  const now = new Date().toISOString();
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `gp_${Date.now()}`,
    title: "Untitled game",
    engine: "godot4",
    stage: "pitch",
    notes: "",
    fileNames: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function loadGameProject(): GameProject {
  if (typeof window === "undefined") return emptyGameProject();
  try {
    const raw = localStorage.getItem(GAME_PROJECT_KEY);
    if (!raw) return emptyGameProject();
    const parsed = JSON.parse(raw) as GameProject;
    if (!parsed?.id) return emptyGameProject();
    return parsed;
  } catch {
    return emptyGameProject();
  }
}

export function saveGameProject(project: GameProject): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    GAME_PROJECT_KEY,
    JSON.stringify({ ...project, updatedAt: new Date().toISOString() })
  );
}

export function loadGameChat(): GameChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GAME_CHAT_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as GameChatMessage[];
    return Array.isArray(list) ? list.slice(-80) : [];
  } catch {
    return [];
  }
}

export function saveGameChat(messages: GameChatMessage[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GAME_CHAT_KEY, JSON.stringify(messages.slice(-80)));
}

/** Built-in assistant — upsert without consuming the user's free custom-assistant slot */
export function ensureGameDirectorAssistant(): CustomAssistant {
  const now = new Date().toISOString();
  const existing = loadCustomAssistants().find((a) => a.id === GAME_DIRECTOR_ID);
  const next: CustomAssistant = {
    id: GAME_DIRECTOR_ID,
    name: "Game Director",
    systemPrompt: GAME_DIRECTOR_SYSTEM,
    styleNotes: "Producer + designer. Godot 4 first. Pipeline-aware.",
    topics: "game design, Godot, web games, GDD, assets, audio",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    seedQa: existing?.seedQa ?? [],
  };
  upsertAssistant(next);
  return next;
}

export function pipelineIndex(stage: PipelineStage): number {
  return GAME_PIPELINE.findIndex((s) => s.id === stage);
}

export function stageLabel(stage: PipelineStage): string {
  return GAME_PIPELINE.find((s) => s.id === stage)?.label ?? stage;
}

export function buildDirectorContext(project: GameProject): string {
  const engine = ENGINE_OPTIONS.find((e) => e.id === project.engine);
  const step = GAME_PIPELINE.find((s) => s.id === project.stage);
  const files =
    project.fileNames.length > 0
      ? project.fileNames.map((n) => `- ${n}`).join("\n")
      : "(none listed)";
  return `[Game Director desk context]
Title: ${project.title}
Engine: ${engine?.label ?? project.engine} — ${engine?.hint ?? ""}
Pipeline stage: ${step?.label ?? project.stage} — ${step?.hint ?? ""}
Notes:
${project.notes.trim() || "(empty)"}
Referenced file names (local only, not uploaded):
${files}`;
}
