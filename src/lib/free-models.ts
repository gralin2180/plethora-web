/**
 * OpenCode-style free models.
 * $0 Zen models use the same public gateway OpenCode autoloads when nobody /connects
 * (`Authorization: Bearer public`). End users do not sign in.
 */

export const ZEN_BASE_URL = "https://opencode.ai/zen/v1";
export const SELECTED_MODEL_KEY = "plethora.selected-model.v1";

/** Input window we actually send (chars ≈ tokens * 4). */
export const ZEN_CONTEXT_WINDOW = 131_072;
export const ZEN_CONTEXT_LABEL = "128K";
export const ZEN_MAX_OUTPUT_TOKENS = 8_192;
export const ZEN_HISTORY_MESSAGES = 64;
export const ZEN_MESSAGE_CHARS = 24_000;

export type FreeModelSource = "zen" | "openrouter";

export type FreeModelDef = {
  id: string;
  name: string;
  source: FreeModelSource;
  badge: "Free";
  context: string;
  note?: string;
};

/** Same order as OpenCode’s “Free models provided by OpenCode” picker. */
export const OPENCODE_ZEN_FREE_MODELS: FreeModelDef[] = [
  {
    id: "laguna-s-2.1-free",
    name: "Laguna S 2.1",
    source: "zen",
    badge: "Free",
    context: ZEN_CONTEXT_LABEL,
  },
  {
    id: "nemotron-3.5-lightning-free",
    name: "Nemotron 3.5 Lightning",
    source: "zen",
    badge: "Free",
    context: ZEN_CONTEXT_LABEL,
    note: "NVIDIA trial — don’t send secrets",
  },
  {
    id: "deepseek-v4-flash-free",
    name: "DeepSeek V4 Flash",
    source: "zen",
    badge: "Free",
    context: ZEN_CONTEXT_LABEL,
  },
  {
    id: "nemotron-3-ultra-free",
    name: "Nemotron 3 Ultra",
    source: "zen",
    badge: "Free",
    context: ZEN_CONTEXT_LABEL,
    note: "NVIDIA trial — don’t send secrets",
  },
  { id: "hy3-free", name: "Hy3", source: "zen", badge: "Free", context: ZEN_CONTEXT_LABEL },
  { id: "mimo-v2.5-free", name: "MiMo V2.5", source: "zen", badge: "Free", context: ZEN_CONTEXT_LABEL },
  { id: "big-pickle", name: "Big Pickle", source: "zen", badge: "Free", context: ZEN_CONTEXT_LABEL },
];

export const DEFAULT_ZEN_MODEL = OPENCODE_ZEN_FREE_MODELS[0];

export const OPENROUTER_FREE_MODELS: FreeModelDef[] = [
  {
    id: "openrouter/free",
    name: "OpenRouter Auto (free)",
    source: "openrouter",
    badge: "Free",
    context: "128K",
  },
  {
    id: "google/gemma-4-26b-a4b-it:free",
    name: "Gemma 4 26B",
    source: "openrouter",
    badge: "Free",
    context: "128K",
  },
  {
    id: "openai/gpt-oss-20b:free",
    name: "GPT OSS 20B",
    source: "openrouter",
    badge: "Free",
    context: "128K",
  },
  {
    id: "nvidia/nemotron-nano-9b-v2:free",
    name: "Nemotron Nano 9B",
    source: "openrouter",
    badge: "Free",
    context: "128K",
  },
  {
    id: "google/gemma-4-31b-it:free",
    name: "Gemma 4 31B",
    source: "openrouter",
    badge: "Free",
    context: "128K",
  },
];

export type SelectedChatModel =
  | { kind: "connected" }
  | { kind: "zen"; id: string; label: string }
  | { kind: "openrouter"; id: string; label: string };

export function defaultZenSelection(): SelectedChatModel {
  return { kind: "zen", id: DEFAULT_ZEN_MODEL.id, label: DEFAULT_ZEN_MODEL.name };
}

export function zenFreeModel(id: string): FreeModelDef | undefined {
  return OPENCODE_ZEN_FREE_MODELS.find((m) => m.id === id);
}

export function openrouterFreeModel(id: string): FreeModelDef | undefined {
  return OPENROUTER_FREE_MODELS.find((m) => m.id === id);
}

export function loadSelectedChatModel(): SelectedChatModel {
  if (typeof window === "undefined") return defaultZenSelection();
  try {
    const raw = localStorage.getItem(SELECTED_MODEL_KEY);
    if (!raw) return defaultZenSelection();
    const parsed = JSON.parse(raw) as SelectedChatModel;
    if (parsed?.kind === "zen" && parsed.id && zenFreeModel(parsed.id)) return parsed;
    if (parsed?.kind === "openrouter" && parsed.id) return parsed;
    if (parsed?.kind === "connected") return parsed;
  } catch {
    /* */
  }
  return defaultZenSelection();
}

export function saveSelectedChatModel(model: SelectedChatModel) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SELECTED_MODEL_KEY, JSON.stringify(model));
}

export function selectedModelLabel(model: SelectedChatModel, connectedLabel?: string): string {
  if (model.kind === "zen" || model.kind === "openrouter") return model.label;
  return connectedLabel || "Connected AI";
}
