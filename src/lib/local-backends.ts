/**
 * Local / user-owned model backends.
 * Prefer client-side direct calls (no SSRF) for localhost URLs.
 */

export type BackendKind =
  | "ollama"
  | "lm-studio"
  | "llama-cpp"
  | "openai-compatible"
  | "none";

export interface LocalBackendProfile {
  id: string;
  label: string;
  kind: BackendKind;
  baseUrl: string;
  model: string;
  /** User API key if the local stack requires it — never send to Plethora cloud by default */
  apiKey?: string;
  notes?: string;
}

export const DEFAULT_BACKEND_PROFILES: LocalBackendProfile[] = [
  {
    id: "none",
    label: "Cloud / paste-only (no local model)",
    kind: "none",
    baseUrl: "",
    model: "",
    notes: "Use Claude, ChatGPT, Gemini in the browser with Plethora prompts.",
  },
  {
    id: "ollama-default",
    label: "Ollama (local GPU/CPU)",
    kind: "ollama",
    baseUrl: "http://127.0.0.1:11434",
    model: "llama3.2",
    notes: "Install from ollama.com. Chat: POST /api/chat. Free and private on your machine.",
  },
  {
    id: "lm-studio-default",
    label: "LM Studio (OpenAI-compatible)",
    kind: "lm-studio",
    baseUrl: "http://127.0.0.1:1234/v1",
    model: "local-model",
    notes: "Enable local server in LM Studio, load a model, match model name.",
  },
  {
    id: "llamacpp-default",
    label: "llama.cpp server",
    kind: "llama-cpp",
    baseUrl: "http://127.0.0.1:8080/v1",
    model: "default",
    notes: "Run llama-server with your GGUF; OpenAI-compatible routes where enabled.",
  },
  {
    id: "custom-openai",
    label: "Custom OpenAI-compatible endpoint",
    kind: "openai-compatible",
    baseUrl: "http://127.0.0.1:8000/v1",
    model: "custom",
    notes: "Any OpenAI-compatible API (vLLM, LocalAI, text-generation-webui, etc.).",
  },
];

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
  // Never persist secrets server-side from here — local only
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
