/**
 * Local / self-hosted AI products — free vs paid, GPU notes.
 * Used by backends settings + hardware advisor + AI tools directory.
 */

export type CostModel =
  | "free"
  | "free_oss"
  | "freemium"
  | "paid"
  | "paid_optional"
  | "hardware";

export type LocalAiEntry = {
  id: string;
  name: string;
  kind:
    | "runtime"
    | "workspace"
    | "gateway"
    | "chat_ui"
    | "cloud_app"
    | "model_host";
  /** Short one-liner */
  blurb: string;
  /** free | free open-source | freemium | paid SaaS | optional paid APIs | you only pay for hardware */
  cost: CostModel;
  costLabel: string;
  gpu: string;
  installUrl: string;
  docsUrl?: string;
  /** Default OpenAI-ish base URL when self-hosted */
  defaultBaseUrl?: string;
  /** Backend profile kind wiring */
  backendKind?:
    | "ollama"
    | "lm-studio"
    | "llama-cpp"
    | "openai-compatible"
    | "none";
  tags: string[];
  minVramGb?: number;
  preferredUse: string[];
};

export const COST_LABELS: Record<CostModel, string> = {
  free: "Free",
  free_oss: "Free · open source",
  freemium: "Freemium",
  paid: "Paid",
  paid_optional: "Free app · paid models optional",
  hardware: "Free software · you pay GPU power",
};

export const LOCAL_AI_CATALOG: LocalAiEntry[] = [
  // ——— Runtimes / model servers ———
  {
    id: "ollama",
    name: "Ollama",
    kind: "runtime",
    blurb: "One-command local model runner. Best default for beginners.",
    cost: "free_oss",
    costLabel: "Free · open source",
    gpu: "Uses GPU when available (NVIDIA / Apple Metal / AMD on some builds). Falls back to CPU (slower).",
    installUrl: "https://ollama.com",
    docsUrl: "https://github.com/ollama/ollama",
    defaultBaseUrl: "http://127.0.0.1:11434",
    backendKind: "ollama",
    tags: ["local", "gpu", "cli", "beginner"],
    minVramGb: 4,
    preferredUse: ["chat", "coding", "privacy"],
  },
  {
    id: "lm-studio",
    name: "LM Studio",
    kind: "runtime",
    blurb: "Desktop GUI to download GGUF models and serve OpenAI-compatible API.",
    cost: "freemium",
    costLabel: "Free desktop app (check license for commercial)",
    gpu: "Loads models onto GPU when configured; VRAM limits model size.",
    installUrl: "https://lmstudio.ai",
    defaultBaseUrl: "http://127.0.0.1:1234/v1",
    backendKind: "lm-studio",
    tags: ["local", "gpu", "gui", "gguf"],
    minVramGb: 6,
    preferredUse: ["chat", "experiments", "privacy"],
  },
  {
    id: "llama-cpp",
    name: "llama.cpp / llama-server",
    kind: "runtime",
    blurb: "Fast GGUF inference; power-user local server.",
    cost: "free_oss",
    costLabel: "Free · open source",
    gpu: "CUDA / Metal / Vulkan builds use GPU heavily.",
    installUrl: "https://github.com/ggerganov/llama.cpp",
    defaultBaseUrl: "http://127.0.0.1:8080/v1",
    backendKind: "llama-cpp",
    tags: ["local", "gpu", "gguf", "advanced"],
    minVramGb: 4,
    preferredUse: ["chat", "coding", "low-level"],
  },
  {
    id: "vllm",
    name: "vLLM",
    kind: "runtime",
    blurb: "High-throughput OpenAI-compatible server for serious GPU boxes.",
    cost: "free_oss",
    costLabel: "Free · open source",
    gpu: "Designed for multi-GB NVIDIA GPUs; not for light laptops.",
    installUrl: "https://github.com/vllm-project/vllm",
    defaultBaseUrl: "http://127.0.0.1:8000/v1",
    backendKind: "openai-compatible",
    tags: ["local", "gpu", "server", "throughput"],
    minVramGb: 16,
    preferredUse: ["heavy local", "teams", "coding"],
  },
  {
    id: "koboldcpp",
    name: "KoboldCpp",
    kind: "runtime",
    blurb: "Easy local GGUF runner popular for creative writing.",
    cost: "free_oss",
    costLabel: "Free · open source",
    gpu: "GPU layers offload when VRAM allows.",
    installUrl: "https://github.com/LostRuins/koboldcpp",
    defaultBaseUrl: "http://127.0.0.1:5001/v1",
    backendKind: "openai-compatible",
    tags: ["local", "writing", "gguf"],
    minVramGb: 6,
    preferredUse: ["writing", "roleplay", "chat"],
  },
  {
    id: "text-gen-webui",
    name: "text-generation-webui (oobabooga)",
    kind: "runtime",
    blurb: "All-in-one Gradio UI for many model backends.",
    cost: "free_oss",
    costLabel: "Free · open source",
    gpu: "Heavy GPU use for large models; many extensions.",
    installUrl: "https://github.com/oobabooga/text-generation-webui",
    defaultBaseUrl: "http://127.0.0.1:5000/v1",
    backendKind: "openai-compatible",
    tags: ["local", "gpu", "gui", "extensions"],
    minVramGb: 8,
    preferredUse: ["experiments", "writing", "chat"],
  },
  // ——— Workspaces / gateways (user-requested + popular) ———
  {
    id: "openclaw",
    name: "OpenClaw",
    kind: "gateway",
    blurb:
      "Self-hosted personal AI assistant gateway — WhatsApp, Telegram, Discord, Slack, and more, wired to local or cloud models.",
    cost: "free_oss",
    costLabel: "Free · open source (you pay cloud APIs only if you attach them)",
    gpu: "Gateway itself is light; GPU is used by whatever local model backend you connect (Ollama / LM Studio / vLLM).",
    installUrl: "https://github.com/openclaw/openclaw",
    docsUrl: "https://docs.openclaw.ai",
    defaultBaseUrl: "http://127.0.0.1:18789",
    backendKind: "openai-compatible",
    tags: ["gateway", "agents", "messaging", "self-hosted"],
    minVramGb: 0,
    preferredUse: ["agents", "messaging", "automation", "privacy"],
  },
  {
    id: "odysseus",
    name: "Odysseus (by PewDiePie)",
    kind: "workspace",
    blurb:
      "Self-hosted AI workspace: chat, agents, research, documents, email, calendar — local-first. Connect Ollama / LM Studio / llama.cpp / cloud APIs.",
    cost: "free_oss",
    costLabel: "Free · open source workspace (models may be free local or paid APIs)",
    gpu: "UI is free; local models use your GPU via the runtime you choose. Larger agent + research jobs need stronger GPUs.",
    installUrl: "https://github.com/pewdiepie-archdaemon/odysseus",
    docsUrl: "https://github.com/pewdiepie-archdaemon/odysseus",
    defaultBaseUrl: "http://127.0.0.1:7000",
    backendKind: "openai-compatible",
    tags: ["workspace", "agents", "local-first", "privacy"],
    minVramGb: 8,
    preferredUse: ["agents", "research", "productivity", "privacy"],
  },
  {
    id: "open-webui",
    name: "Open WebUI",
    kind: "chat_ui",
    blurb: "ChatGPT-style UI on top of Ollama and other backends.",
    cost: "free_oss",
    costLabel: "Free · open source",
    gpu: "UI is light; GPU sits with Ollama / vLLM behind it.",
    installUrl: "https://github.com/open-webui/open-webui",
    defaultBaseUrl: "http://127.0.0.1:8080",
    backendKind: "openai-compatible",
    tags: ["chat-ui", "ollama", "self-hosted"],
    minVramGb: 0,
    preferredUse: ["chat", "teams", "privacy"],
  },
  {
    id: "anythingllm",
    name: "AnythingLLM",
    kind: "workspace",
    blurb: "Docs chat / RAG desktop or server with local or cloud models.",
    cost: "freemium",
    costLabel: "Free core · cloud extras may cost",
    gpu: "Local embeddings + LLM need RAM/VRAM; cloud mode uses APIs.",
    installUrl: "https://anythingllm.com",
    backendKind: "openai-compatible",
    tags: ["rag", "documents", "desktop"],
    minVramGb: 8,
    preferredUse: ["documents", "rag", "privacy"],
  },
  {
    id: "jan",
    name: "Jan",
    kind: "workspace",
    blurb: "Offline ChatGPT-like desktop app with local models.",
    cost: "free_oss",
    costLabel: "Free · open source",
    gpu: "Runs models locally on GPU/CPU.",
    installUrl: "https://jan.ai",
    backendKind: "openai-compatible",
    tags: ["desktop", "offline", "chat"],
    minVramGb: 6,
    preferredUse: ["chat", "privacy", "beginner"],
  },
  {
    id: "gpt4all",
    name: "GPT4All",
    kind: "chat_ui",
    blurb: "Simple free desktop chat with downloadable models.",
    cost: "free_oss",
    costLabel: "Free · open source",
    gpu: "Uses available GPU acceleration depending on build.",
    installUrl: "https://www.nomic.ai/gpt4all",
    backendKind: "none",
    tags: ["desktop", "beginner", "offline"],
    minVramGb: 4,
    preferredUse: ["chat", "beginner", "privacy"],
  },
  {
    id: "sillytavern",
    name: "SillyTavern",
    kind: "chat_ui",
    blurb: "Powerful frontend for roleplay & character chat with local backends.",
    cost: "free_oss",
    costLabel: "Free · open source",
    gpu: "Frontend only — model GPU usage is on Ollama / kobold / etc.",
    installUrl: "https://github.com/SillyTavern/SillyTavern",
    backendKind: "openai-compatible",
    tags: ["frontend", "roleplay", "local"],
    minVramGb: 0,
    preferredUse: ["writing", "roleplay", "chat"],
  },
  {
    id: "comfyui",
    name: "ComfyUI",
    kind: "runtime",
    blurb: "Node-based local image (and video) generation — GPU heavy.",
    cost: "free_oss",
    costLabel: "Free · open source",
    gpu: "Almost always needs a CUDA/Metal GPU for usable speed.",
    installUrl: "https://github.com/comfyanonymous/ComfyUI",
    backendKind: "none",
    tags: ["image", "video", "gpu", "diffusion"],
    minVramGb: 6,
    preferredUse: ["image", "video", "creative"],
  },
  {
    id: "stable-diffusion-webui",
    name: "AUTOMATIC1111 / Forge WebUI",
    kind: "runtime",
    blurb: "Classic local Stable Diffusion interface.",
    cost: "free_oss",
    costLabel: "Free · open source",
    gpu: "Requires consumer GPU with enough VRAM for SD/SDXL.",
    installUrl: "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
    backendKind: "none",
    tags: ["image", "gpu", "diffusion"],
    minVramGb: 4,
    preferredUse: ["image", "creative"],
  },
  {
    id: "whisper",
    name: "OpenAI Whisper / faster-whisper",
    kind: "runtime",
    blurb: "Local speech-to-text for captions and meetings.",
    cost: "free_oss",
    costLabel: "Free · open source",
    gpu: "GPU dramatically speeds medium/large models.",
    installUrl: "https://github.com/openai/whisper",
    docsUrl: "https://github.com/SYSTRAN/faster-whisper",
    backendKind: "none",
    tags: ["audio", "captions", "transcription"],
    minVramGb: 2,
    preferredUse: ["captions", "meetings", "audio"],
  },
  // ——— Cloud apps that users still ask about as “Claude options” ———
  {
    id: "claude-web",
    name: "Claude (Anthropic cloud)",
    kind: "cloud_app",
    blurb: "Official Claude chat in the browser. Not local — data leaves your machine.",
    cost: "freemium",
    costLabel: "Free tier + Claude Pro / Team paid plans",
    gpu: "No local GPU required — Anthropic hosts models in the cloud.",
    installUrl: "https://claude.ai",
    backendKind: "none",
    tags: ["cloud", "chat", "writing"],
    preferredUse: ["writing", "coding", "analysis"],
  },
  {
    id: "claude-api",
    name: "Claude API",
    kind: "cloud_app",
    blurb: "Pay-as-you-go Claude for apps and gateways (OpenClaw can attach it).",
    cost: "paid",
    costLabel: "Paid usage (API billing)",
    gpu: "Cloud-hosted. Local GPU unused unless you also run a local model side-by-side.",
    installUrl: "https://console.anthropic.com",
    backendKind: "none",
    tags: ["cloud", "api", "paid"],
    preferredUse: ["coding", "writing", "agents"],
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    kind: "cloud_app",
    blurb: "OpenAI hosted chat. Free tier + Plus/Team plans.",
    cost: "freemium",
    costLabel: "Free tier + Plus / Team paid",
    gpu: "Cloud — no local GPU needed.",
    installUrl: "https://chatgpt.com",
    backendKind: "none",
    tags: ["cloud", "chat"],
    preferredUse: ["chat", "coding", "general"],
  },
  {
    id: "openai-api",
    name: "OpenAI API",
    kind: "cloud_app",
    blurb: "GPT models for apps and OpenAI-compatible clients.",
    cost: "paid",
    costLabel: "Paid usage",
    gpu: "Cloud-hosted.",
    installUrl: "https://platform.openai.com",
    backendKind: "none",
    tags: ["cloud", "api", "paid"],
    preferredUse: ["coding", "apps", "agents"],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    kind: "cloud_app",
    blurb: "Google hosted multimodal chat + API.",
    cost: "freemium",
    costLabel: "Free tier + paid Google AI plans / API",
    gpu: "Cloud — no local GPU.",
    installUrl: "https://gemini.google.com",
    backendKind: "none",
    tags: ["cloud", "multimodal"],
    preferredUse: ["chat", "research", "multimodal"],
  },
  {
    id: "cursor",
    name: "Cursor",
    kind: "cloud_app",
    blurb: "AI coding IDE. Free hobby tier; Pro is paid.",
    cost: "freemium",
    costLabel: "Free tier + Cursor Pro paid",
    gpu: "Cloud models by default; can also use local models via custom endpoints on some setups.",
    installUrl: "https://cursor.com",
    backendKind: "none",
    tags: ["ide", "coding"],
    preferredUse: ["coding"],
  },
  {
    id: "continue-dev",
    name: "Continue.dev",
    kind: "chat_ui",
    blurb: "Open-source IDE extension that can hit local Ollama or paid APIs.",
    cost: "free_oss",
    costLabel: "Free · open source (APIs optional paid)",
    gpu: "Local models use your GPU via Ollama/LM Studio.",
    installUrl: "https://continue.dev",
    backendKind: "openai-compatible",
    tags: ["ide", "coding", "local"],
    preferredUse: ["coding", "privacy"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    kind: "model_host",
    blurb: "One API for many cloud models (some free, many paid).",
    cost: "paid_optional",
    costLabel: "Credits / free model routes vary",
    gpu: "Cloud — no local GPU.",
    installUrl: "https://openrouter.ai",
    backendKind: "openai-compatible",
    tags: ["cloud", "api", "multi-model"],
    preferredUse: ["experiments", "coding", "chat"],
  },
];

export function costBadgeClass(cost: CostModel): string {
  switch (cost) {
    case "free":
    case "free_oss":
    case "hardware":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "freemium":
    case "paid_optional":
      return "bg-amber-500/15 text-amber-200 border-amber-500/30";
    case "paid":
      return "bg-rose-500/15 text-rose-300 border-rose-500/30";
    default:
      return "bg-white/10 text-zinc-300 border-white/15";
  }
}
