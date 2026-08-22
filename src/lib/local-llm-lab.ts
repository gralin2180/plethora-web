export type LlmTrack = "add" | "create" | "train" | "connect";

export type LlmRecipe = {
  id: string;
  track: LlmTrack;
  title: string;
  time: string;
  gpu: string;
  blurb: string;
  steps: string[];
  command?: string;
};

export const LLM_RECIPES: LlmRecipe[] = [
  {
    id: "ollama-pull",
    track: "add",
    title: "Add a ready model (Ollama)",
    time: "5–15 min",
    gpu: "4GB+ VRAM (or CPU, slower)",
    blurb: "Fastest path. Download a chat model onto your PC and talk to it offline.",
    steps: [
      "Install Ollama from ollama.com (Windows / Mac / Linux).",
      "Open a terminal and pull a size that fits your VRAM.",
      "Run it once so weights download.",
      "In Plethora → Local LLMs → Connect, save http://127.0.0.1:11434 and the model name.",
    ],
    command: `ollama pull llama3.2
ollama pull qwen2.5:7b
ollama run llama3.2`,
  },
  {
    id: "lmstudio-gguf",
    track: "add",
    title: "Add a GGUF (LM Studio)",
    time: "10–20 min",
    gpu: "VRAM ≈ model size in GB",
    blurb: "GUI for Hugging Face GGUF files. Good when you want a specific quant.",
    steps: [
      "Install LM Studio.",
      "Search Hugging Face inside the app (Q4_K_M is the usual sweet spot).",
      "Load the model, start the local server.",
      "Point Plethora at http://127.0.0.1:1234/v1.",
    ],
  },
  {
    id: "hf-direct",
    track: "add",
    title: "Add from Hugging Face + llama.cpp",
    time: "20–40 min",
    gpu: "CUDA / Metal / Vulkan build",
    blurb: "Power-user path: grab a GGUF, serve OpenAI-compatible API.",
    steps: [
      "Download a .gguf from Hugging Face (respect the model license).",
      "Run llama-server from llama.cpp releases.",
      "Save the server URL in Plethora backends.",
    ],
    command: `llama-server -m ./model.Q4_K_M.gguf --port 8080 --host 127.0.0.1`,
  },
  {
    id: "modelfile",
    track: "create",
    title: "Create your own Ollama model",
    time: "15 min",
    gpu: "Same as the base model",
    blurb: "Wrap an existing model with YOUR system prompt, temperature, and stop tokens — no training required.",
    steps: [
      "Pick a base (llama3.2, qwen2.5, mistral, …).",
      "Write a Modelfile with SYSTEM, PARAMETER, and FROM.",
      "ollama create my-assistant -f Modelfile",
      "Use pipelines/local_llm/create_ollama_model.py to generate the file.",
    ],
    command: `python pipelines/local_llm/create_ollama_model.py --name my-home --from llama3.2 --system "You are my local assistant. Be direct."`,
  },
  {
    id: "merge-gguf",
    track: "create",
    title: "Quantize / pack a GGUF",
    time: "30–90 min",
    gpu: "RAM for conversion; GPU optional",
    blurb: "You already have safetensors or a fine-tune — turn it into a laptop-friendly GGUF.",
    steps: [
      "Convert Hugging Face weights with llama.cpp convert scripts.",
      "Quantize to Q4_K_M or Q5_K_M.",
      "Load in Ollama (FROM ./file.gguf) or LM Studio.",
    ],
    command: `python llama.cpp/convert_hf_to_gguf.py ./my-model --outfile my.gguf
./llama-quantize my.gguf my.Q4_K_M.gguf Q4_K_M`,
  },
  {
    id: "lora-unsloth",
    track: "train",
    title: "Train a LoRA on your PC (Unsloth)",
    time: "1–8 hours",
    gpu: "Best: 16GB+ NVIDIA. 8GB can do small LoRAs.",
    blurb: "Teach a model your voice, docs, or character using a small adapter — not a full from-scratch train.",
    steps: [
      "Export a JSONL of examples: {prompt, response} (your writing, FAQ, character).",
      "Run pipelines/local_llm/train_lora.py after installing unsloth in a venv.",
      "Merge or keep LoRA; convert to GGUF if you want Ollama.",
      "Never train on other people’s private chats without permission.",
    ],
    command: `python pipelines/local_llm/train_lora.py --data my.jsonl --out ./lora-out`,
  },
  {
    id: "axolotl",
    track: "train",
    title: "Heavier fine-tune (Axolotl / LLaMA-Factory)",
    time: "hours–days",
    gpu: "24GB+ for 7B full-ish; QLoRA on 12GB",
    blurb: "When LoRA isn’t enough. Same idea: your dataset, your GPU, your weights stay home.",
    steps: [
      "Use Axolotl or LLaMA-Factory YAML configs (see their GitHub).",
      "Start with QLoRA on 7B before touching 70B.",
      "Eval on held-out prompts so you don’t overfit gibberish.",
    ],
  },
  {
    id: "connect",
    track: "connect",
    title: "Hook the model into Plethora",
    time: "2 min",
    gpu: "—",
    blurb: "Plethora talks to localhost. Weights never upload to us.",
    steps: [
      "Start Ollama / LM Studio / llama-server.",
      "Open /settings/backends or the Connect tab here.",
      "Save base URL + model id. Chat and tools can use that stack when you pick Your AI / local.",
    ],
  },
];

export const VRAM_PICKS: { vram: string; models: string }[] = [
  { vram: "0–4 GB / CPU", models: "1–3B Q4 (llama3.2:1b, tinyllama). Slow but private." },
  { vram: "6–8 GB", models: "7–8B Q4 (llama3.1:8b, mistral:7b, qwen2.5:7b)." },
  { vram: "12 GB", models: "14B Q4 or quality 8B. Light image models." },
  { vram: "16–24 GB", models: "32B Q4, or 7–8B at high quality. Serious LoRA training." },
  { vram: "24 GB+", models: "70B Q3/Q4, local agents, video-adjacent stacks." },
];
