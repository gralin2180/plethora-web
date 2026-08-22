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
/** Chat output cap — 8k made every free turn crawl. */
export const ZEN_MAX_OUTPUT_TOKENS = 220;
export const ZEN_HISTORY_MESSAGES = 12;
export const ZEN_MESSAGE_CHARS = 3_500;

export type FreeModelSource = "zen" | "openrouter";

export type FreeModelDef = {
  id: string;
  name: string;
  source: FreeModelSource;
  badge: "Free";
  context: string;
  note?: string;
  /** OpenCode Zen: most models use chat/completions; Muse Spark free uses /responses. */
  zenApi?: "chat" | "responses";
};

/** Same order as OpenCode’s “Free models provided by OpenCode” picker, plus extras that still work. */
export const OPENCODE_ZEN_FREE_MODELS: FreeModelDef[] = [
  {
    id: "nemotron-3.5-lightning-free",
    name: "Nemotron 3.5 Lightning",
    source: "zen",
    badge: "Free",
    context: ZEN_CONTEXT_LABEL,
    note: "NVIDIA trial — don’t send secrets",
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
  {
    id: "muse-spark-1.2-contributor-free",
    name: "Muse Spark 1.2",
    source: "zen",
    badge: "Free",
    context: ZEN_CONTEXT_LABEL,
    zenApi: "responses",
    note: "Contributor free — may train on chats",
  },
  {
    id: "x-preview-f-free",
    name: "Ox Alpha Free (Unlimited)",
    source: "zen",
    badge: "Free",
    context: ZEN_CONTEXT_LABEL,
    note: "Zero-retention stealth model",
  },
  { id: "mimo-v2.5-free", name: "MiMo V2.5", source: "zen", badge: "Free", context: ZEN_CONTEXT_LABEL },
  { id: "big-pickle", name: "Big Pickle", source: "zen", badge: "Free", context: ZEN_CONTEXT_LABEL },
  {
    id: "laguna-s-2.1-free",
    name: "Laguna S 2.1",
    source: "zen",
    badge: "Free",
    context: ZEN_CONTEXT_LABEL,
  },
  {
    id: "deepseek-v4-flash-free",
    name: "DeepSeek V4 Flash",
    source: "zen",
    badge: "Free",
    context: ZEN_CONTEXT_LABEL,
  },
];

/** After premium budget: smaller/cheaper pool only (extended free, slower). */
export const SLOW_ZEN_MODEL_IDS = [
  "nemotron-3.5-lightning-free",
  "x-preview-f-free",
  "hy3-free",
] as const;

export const DEFAULT_ZEN_MODEL = OPENCODE_ZEN_FREE_MODELS[0];

export const OPENROUTER_FREE_MODELS: FreeModelDef[] = [
  {
    id: "openrouter/free",
    name: "OpenRouter Auto (free)",
    source: "openrouter",
    badge: "Free",
    context: "128K",
    note: "Picks a live $0 model",
  },
  {
    id: "nvidia/nemotron-3.5-lightning:free",
    name: "Nemotron 3.5 Lightning",
    source: "openrouter",
    badge: "Free",
    context: "128K",
  },
  {
    id: "inclusionai/ling-3.0-flash:free",
    name: "Ling 3.0 Flash",
    source: "openrouter",
    badge: "Free",
    context: "256K",
  },
  {
    id: "google/gemma-4-26b-a4b-it:free",
    name: "Gemma 4 26B",
    source: "openrouter",
    badge: "Free",
    context: "256K",
  },
  {
    id: "google/gemma-4-31b-it:free",
    name: "Gemma 4 31B",
    source: "openrouter",
    badge: "Free",
    context: "256K",
  },
  {
    id: "openai/gpt-oss-20b:free",
    name: "GPT-OSS 20B",
    source: "openrouter",
    badge: "Free",
    context: "128K",
    note: "OpenAI open-weights — not ChatGPT",
  },
  {
    id: "cohere/north-mini-code:free",
    name: "North Mini Code",
    source: "openrouter",
    badge: "Free",
    context: "256K",
  },
  {
    id: "poolside/laguna-s-2.1:free",
    name: "Laguna S 2.1",
    source: "openrouter",
    badge: "Free",
    context: "256K",
  },
  {
    id: "nvidia/nemotron-nano-9b-v2:free",
    name: "Nemotron Nano 9B",
    source: "openrouter",
    badge: "Free",
    context: "128K",
  },
  {
    id: "z-ai/glm-5.2:free",
    name: "GLM 5.2",
    source: "openrouter",
    badge: "Free",
    context: "128K",
  },
];

/** Route a user message to the cheapest/fastest free model that fits. */
export function autoRouteKind(text: string): "fast" | "code" | "vision" | "long" {
  const t = text.toLowerCase();
  if (/\[image attached|data:image|\.png|\.jpe?g|\.webp|screenshot/i.test(t)) return "vision";
  if (/\b(code|typescript|python|sql|regex|stack trace|bug|function|compile)\b/i.test(t)) return "code";
  if (text.length > 4000 || /\b(summarize this (pdf|doc|file)|long context)\b/i.test(t)) return "long";
  return "fast";
}

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
