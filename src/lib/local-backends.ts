/**
 * Local / user-owned model backends.
 * Prefer client-side direct calls (no SSRF) for localhost URLs.
 */

import { LOCAL_AI_CATALOG } from "./local-ai-catalog";

export type BackendKind =
  | "ollama"
  | "lm-studio"
  | "llama-cpp"
  | "openai-compatible"
  | "openclaw"
  | "odysseus"
  | "none";

export type CostTag = "free" | "freemium" | "paid" | "optional-paid";

export interface LocalBackendProfile {
  id: string;
  label: string;
  kind: BackendKind;
  baseUrl: string;
  model: string;
  /** User API key if the local stack requires it — never send to Plethora cloud by default */
  apiKey?: string;
  notes?: string;
  cost?: CostTag;
  costLabel?: string;
  gpuNote?: string;
  installUrl?: string;
}

export const DEFAULT_BACKEND_PROFILES: LocalBackendProfile[] = [
  {
    id: "none",
    label: "Cloud in browser (no local model)",
    kind: "none",
    baseUrl: "",
    model: "",
    cost: "freemium",
    costLabel: "Claude / ChatGPT free tiers + paid Pro options",
    gpuNote: "No local GPU required — models run in the cloud.",
    notes: "Use Claude, ChatGPT, or Gemini in the browser with Plethora prompts.",
  },
  {
    id: "ollama-default",
    label: "Ollama (local GPU/CPU)",
    kind: "ollama",
    baseUrl: "http://127.0.0.1:11434",
    model: "llama3.2",
    cost: "free",
    costLabel: "Free · open source",
    gpuNote: "Uses local GPU when available; otherwise CPU.",
    installUrl: "https://ollama.com",
    notes: "Best beginner local runtime. Chat API on your machine.",
  },
  {
    id: "lm-studio-default",
    label: "LM Studio",
    kind: "lm-studio",
    baseUrl: "http://127.0.0.1:1234/v1",
    model: "local-model",
    cost: "freemium",
    costLabel: "Free desktop app",
    gpuNote: "Loads GGUF onto GPU; VRAM limits size.",
    installUrl: "https://lmstudio.ai",
    notes: "Enable local server, load a model, match model name.",
  },
  {
    id: "llamacpp-default",
    label: "llama.cpp server",
    kind: "llama-cpp",
    baseUrl: "http://127.0.0.1:8080/v1",
    model: "default",
    cost: "free",
    costLabel: "Free · open source",
    gpuNote: "CUDA / Metal / Vulkan GPU builds.",
    installUrl: "https://github.com/ggerganov/llama.cpp",
    notes: "Run llama-server with your GGUF.",
  },
  {
    id: "openclaw-default",
    label: "OpenClaw gateway",
    kind: "openclaw",
    baseUrl: "http://127.0.0.1:18789",
    model: "default",
    cost: "free",
    costLabel: "Free · open source (cloud APIs optional paid)",
    gpuNote: "Gateway is light; attach Ollama/LM Studio for local GPU models, or Claude/OpenAI APIs (paid).",
    installUrl: "https://github.com/openclaw/openclaw",
    notes:
      "Personal AI across WhatsApp, Telegram, Discord, Slack, and more. Self-hosted. Docs: docs.openclaw.ai",
  },
  {
    id: "odysseus-default",
    label: "Odysseus (PewDiePie workspace)",
    kind: "odysseus",
    baseUrl: "http://127.0.0.1:7000",
    model: "local",
    cost: "free",
    costLabel: "Free · open source workspace",
    gpuNote: "UI free; local models use your GPU via Ollama / LM Studio / llama.cpp / vLLM.",
    installUrl: "https://github.com/pewdiepie-archdaemon/odysseus",
    notes:
      "Chat, agents, research, docs, email, calendar — local-first. Paid only if you attach cloud model APIs.",
  },
  {
    id: "open-webui",
    label: "Open WebUI",
    kind: "openai-compatible",
    baseUrl: "http://127.0.0.1:8080/v1",
    model: "default",
    cost: "free",
    costLabel: "Free · open source",
    gpuNote: "UI only — GPU is on Ollama/vLLM behind it.",
    installUrl: "https://github.com/open-webui/open-webui",
    notes: "ChatGPT-style front-end for local backends.",
  },
  {
    id: "vllm-default",
    label: "vLLM server",
    kind: "openai-compatible",
    baseUrl: "http://127.0.0.1:8000/v1",
    model: "default",
    cost: "free",
    costLabel: "Free · open source",
    gpuNote: "Needs a strong NVIDIA GPU for throughput.",
    installUrl: "https://github.com/vllm-project/vllm",
    notes: "High-throughput OpenAI-compatible serving.",
  },
  {
    id: "jan-default",
    label: "Jan (offline chat)",
    kind: "openai-compatible",
    baseUrl: "http://127.0.0.1:1337/v1",
    model: "local",
    cost: "free",
    costLabel: "Free · open source",
    gpuNote: "Runs models on local GPU/CPU.",
    installUrl: "https://jan.ai",
    notes: "Offline ChatGPT-like desktop app.",
  },
  {
    id: "custom-openai",
    label: "Custom OpenAI-compatible endpoint",
    kind: "openai-compatible",
    baseUrl: "http://127.0.0.1:8000/v1",
    model: "custom",
    cost: "free",
    costLabel: "Depends on the server you run or pay for",
    gpuNote: "Whatever your custom stack uses.",
    notes: "LocalAI, text-generation-webui, LiteLLM, KoboldCpp, etc.",
  },
  {
    id: "claude-cloud",
    label: "Claude cloud (not local)",
    kind: "none",
    baseUrl: "",
    model: "",
    cost: "freemium",
    costLabel: "Free tier + Claude Pro / API paid",
    gpuNote: "No local GPU — Anthropic hosts the model.",
    installUrl: "https://claude.ai",
    notes:
      "Not local AI. Use when you want best quality writing/coding and accept cloud processing.",
  },
];

/** Extra directory rows for the settings page (not all are “pick as default chat backend”). */
export const BACKEND_DIRECTORY = LOCAL_AI_CATALOG;

export const BACKEND_STORAGE_KEY = "Plethora.localBackend.v1";

export function loadBackendProfile(): LocalBackendProfile {
  if (typeof window === "undefined") return DEFAULT_BACKEND_PROFILES[0];
  try {
    const raw = localStorage.getItem(BACKEND_STORAGE_KEY);
    if (!raw) return DEFAULT_BACKEND_PROFILES[0];
    return { ...DEFAULT_BACKEND_PROFILES[0], ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BACKEND_PROFILES[0];
  }
}

export function saveBackendProfile(profile: LocalBackendProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BACKEND_STORAGE_KEY, JSON.stringify(profile));
}

export function isLocalhostUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "[::1]" ||
      u.hostname.endsWith(".local")
    );
  } catch {
    return false;
  }
}

export function costChipClass(cost?: CostTag): string {
  if (cost === "free") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (cost === "paid") return "bg-rose-500/15 text-rose-300 border-rose-500/30";
  if (cost === "optional-paid") return "bg-amber-500/15 text-amber-200 border-amber-500/30";
  return "bg-amber-500/15 text-amber-200 border-amber-500/30";
}
