/**
 * Free open-source install targets for PC / web / agent stack.
 * Used when hand-holding users through installs (webapp guides; desktop later).
 * Prefer official repos + widely maintained projects.
 */

export type InstallPlatform = "windows" | "mac" | "linux" | "any" | "web";
export type InstallCategory =
  | "local-llm"
  | "agent"
  | "scraper"
  | "browser-agent"
  | "mcp"
  | "ide"
  | "automation"
  | "directory"
  | "vector-rag"
  | "voice"
  | "image"
  | "video";

export interface FreeInstallRepo {
  id: string;
  name: string;
  repoUrl: string;
  homepage?: string;
  description: string;
  /** One-liner install if possible */
  quickInstall?: string;
  howToSetUp: string;
  category: InstallCategory;
  platforms: InstallPlatform[];
  free: true;
  hardcore?: boolean;
  tags: string[];
  taskKeywords: string[];
}

/** One-click-ish install catalog — OSS first */
export const FREE_INSTALL_REPOS: FreeInstallRepo[] = [
  // ── Local LLMs ───────────────────────────────────────────────────────────
  {
    id: "ollama",
    name: "Ollama",
    repoUrl: "https://github.com/ollama/ollama",
    homepage: "https://ollama.com",
    description: "Run open models locally with one command. GPU-friendly.",
    quickInstall: "winget install Ollama.Ollama  # or download installer from ollama.com",
    howToSetUp:
      "Install → ollama pull llama3.2 / mistral / qwen2.5 → ollama run <model>. Point Plethora backends to http://127.0.0.1:11434.",
    category: "local-llm",
    platforms: ["windows", "mac", "linux"],
    free: true,
    tags: ["local", "gpu", "llm"],
    taskKeywords: ["local", "offline", "gpu", "private", "ollama"],
  },
  {
    id: "lmstudio",
    name: "LM Studio",
    repoUrl: "https://github.com/lmstudio-ai",
    homepage: "https://lmstudio.ai",
    description: "GUI for downloading/running local models + OpenAI-compatible server.",
    howToSetUp:
      "Install app → Discover model → Load → Start server → Plethora uses http://127.0.0.1:1234/v1.",
    category: "local-llm",
    platforms: ["windows", "mac", "linux"],
    free: true,
    tags: ["local", "gui", "llm"],
    taskKeywords: ["local", "gui", "lm studio"],
  },
  {
    id: "llama-cpp",
    name: "llama.cpp",
    repoUrl: "https://github.com/ggerganov/llama.cpp",
    description: "High-performance GGUF inference; run server for OpenAI-compatible API.",
    howToSetUp:
      "Build or grab releases → llama-server -m model.gguf → point Plethora custom backend at server port.",
    category: "local-llm",
    platforms: ["windows", "mac", "linux"],
    free: true,
    hardcore: true,
    tags: ["gguf", "cuda", "performance"],
    taskKeywords: ["llama.cpp", "gguf", "local", "cuda"],
  },
  {
    id: "jan",
    name: "Jan",
    repoUrl: "https://github.com/janhq/jan",
    homepage: "https://jan.ai",
    description: "Open-source ChatGPT-style desktop app for local models.",
    howToSetUp: "Install Jan → download a model in-app → chat. Optional: expose API for Plethora.",
    category: "local-llm",
    platforms: ["windows", "mac", "linux"],
    free: true,
    tags: ["local", "desktop", "chat"],
    taskKeywords: ["jan", "local chat", "desktop"],
  },
  {
    id: "open-webui",
    name: "Open WebUI",
    repoUrl: "https://github.com/open-webui/open-webui",
    description: "Beautiful web UI in front of Ollama / OpenAI-compatible backends.",
    quickInstall: "docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway ghcr.io/open-webui/open-webui:main",
    howToSetUp: "Run container or pip install → connect Ollama → use as daily AI browser home.",
    category: "local-llm",
    platforms: ["windows", "mac", "linux"],
    free: true,
    tags: ["ui", "ollama", "docker"],
    taskKeywords: ["open webui", "chat ui", "ollama"],
  },

  // ── Agents ───────────────────────────────────────────────────────────────
  {
    id: "open-interpreter",
    name: "Open Interpreter",
    repoUrl: "https://github.com/OpenInterpreter/open-interpreter",
    description: "Natural language → code execution on your machine (computer-use style).",
    quickInstall: "pip install open-interpreter",
    howToSetUp: "pip install → interpreter → chat. Use local models or API keys. Review tool permissions carefully.",
    category: "agent",
    platforms: ["windows", "mac", "linux"],
    free: true,
    hardcore: true,
    tags: ["agent", "code", "desktop"],
    taskKeywords: ["agent", "automate pc", "run code", "interpreter"],
  },
  {
    id: "aider",
    name: "Aider",
    repoUrl: "https://github.com/Aider-AI/aider",
    description: "AI pair programmer in the terminal that edits git repos.",
    quickInstall: "pip install aider-chat",
    howToSetUp: "cd project → aider → paste Plethora coding prompts. Works with many providers + local models.",
    category: "agent",
    platforms: ["windows", "mac", "linux"],
    free: true,
    hardcore: true,
    tags: ["coding", "git", "terminal"],
    taskKeywords: ["code", "refactor", "pair program", "git"],
  },
  {
    id: "continue",
    name: "Continue.dev",
    repoUrl: "https://github.com/continuedev/continue",
    homepage: "https://continue.dev",
    description: "Open-source IDE autopilot (VS Code / JetBrains) with local models.",
    howToSetUp: "Install extension → set Ollama or API provider → chat/edit with codebase context.",
    category: "ide",
    platforms: ["windows", "mac", "linux"],
    free: true,
    tags: ["ide", "vscode", "local"],
    taskKeywords: ["ide", "autocomplete", "codebase"],
  },
  {
    id: "cline",
    name: "Cline",
    repoUrl: "https://github.com/cline/cline",
    description: "Autonomous coding agent extension with MCP tool use.",
    howToSetUp: "Install in VS Code/Cursor-compatible → add API or local model → enable MCP from Plethora hub.",
    category: "agent",
    platforms: ["windows", "mac", "linux"],
    free: true,
    hardcore: true,
    tags: ["agent", "mcp", "coding"],
    taskKeywords: ["autonomous", "agent", "mcp", "coding"],
  },
  {
    id: "babyagi",
    name: "BabyAGI / task agents (ecosystem)",
    repoUrl: "https://github.com/yoheinakajima/babyagi",
    description: "Classic task-loop autonomous agent pattern (many forks).",
    howToSetUp: "Clone → pip install deps → set model keys → define objective. Prefer modern agents for production.",
    category: "agent",
    platforms: ["any"],
    free: true,
    hardcore: true,
    tags: ["autonomous", "research"],
    taskKeywords: ["autonomous agent", "task loop", "research agent"],
  },
  {
    id: "metagpt",
    name: "MetaGPT",
    repoUrl: "https://github.com/geekan/MetaGPT",
    description: "Multi-agent software company simulation (SOPs + roles).",
    howToSetUp: "pip install metagpt → configure LLM → assign product idea. Heavy but powerful for hardcore users.",
    category: "agent",
    platforms: ["windows", "mac", "linux"],
    free: true,
    hardcore: true,
    tags: ["multi-agent", "software"],
    taskKeywords: ["multi agent", "software company", "build product"],
  },
  {
    id: "autogen",
    name: "AutoGen (Microsoft)",
    repoUrl: "https://github.com/microsoft/autogen",
    description: "Multi-agent conversation framework for complex workflows.",
    howToSetUp: "pip install autogen-agentchat → define agents → run. Wire scrapers/tools as agent functions.",
    category: "agent",
    platforms: ["any"],
    free: true,
    hardcore: true,
    tags: ["multi-agent", "framework"],
    taskKeywords: ["multi agent", "orchestration", "workflow agent"],
  },
  {
    id: "crewai",
    name: "CrewAI",
    repoUrl: "https://github.com/crewAIInc/crewAI",
    description: "Role-playing multi-agent crews for research and ops.",
    quickInstall: "pip install crewai",
    howToSetUp: "Define crew roles (researcher, writer, critic) → run goal. Great for market/UGC research stacks.",
    category: "agent",
    platforms: ["any"],
    free: true,
    hardcore: true,
    tags: ["crew", "research"],
    taskKeywords: ["crew", "research agent", "roles"],
  },
  {
    id: "browser-use",
    name: "browser-use",
    repoUrl: "https://github.com/browser-use/browser-use",
    description: "Make AI agents control a real browser (navigate, click, extract).",
    howToSetUp: "pip install browser-use → set LLM → run agent tasks against public sites you may legally access.",
    category: "browser-agent",
    platforms: ["windows", "mac", "linux"],
    free: true,
    hardcore: true,
    tags: ["browser", "agent", "automation"],
    taskKeywords: ["browser agent", "click", "web agent", "scrape", "research"],
  },
  {
    id: "stagehand",
    name: "Stagehand",
    repoUrl: "https://github.com/browserbase/stagehand",
    description: "AI browser automation framework (Playwright-based) for agents.",
    howToSetUp: "Install package → write agent flows → use for structured browsing + extraction.",
    category: "browser-agent",
    platforms: ["any"],
    free: true,
    hardcore: true,
    tags: ["playwright", "browser", "agent"],
    taskKeywords: ["browser", "automation", "extract", "scrape"],
  },
  {
    id: "openai-computer-use-samples",
    name: "Computer-use agent samples / CU frameworks",
    repoUrl: "https://github.com/anthropics/anthropic-quickstarts",
    description: "Reference patterns for computer-use style agents (vendor samples evolve).",
    howToSetUp: "Study computer-use demos; prefer open local stacks (browser-use, open-interpreter) for free GPU path.",
    category: "agent",
    platforms: ["any"],
    free: true,
    hardcore: true,
    tags: ["computer-use", "desktop"],
    taskKeywords: ["computer use", "desktop agent", "gui agent"],
  },

  // ── Scrapers & web intel ─────────────────────────────────────────────────
  {
    id: "crawl4ai",
    name: "Crawl4AI",
    repoUrl: "https://github.com/unclecode/crawl4ai",
    description: "LLM-friendly web crawler — clean markdown for RAG/agents.",
    quickInstall: "pip install crawl4ai && crawl4ai-setup",
    howToSetUp:
      "Install → crawl public URLs → feed markdown into Claude/Ollama. Respect robots.txt and site ToS.",
    category: "scraper",
    platforms: ["windows", "mac", "linux"],
    free: true,
    hardcore: true,
    tags: ["crawl", "rag", "scrape", "markdown"],
    taskKeywords: ["scrape", "crawl", "research", "rag", "website data", "internet"],
  },
  {
    id: "firecrawl",
    name: "Firecrawl (open source)",
    repoUrl: "https://github.com/mendableai/firecrawl",
    homepage: "https://www.firecrawl.dev",
    description: "API + OSS crawler that turns sites into LLM-ready data.",
    howToSetUp: "Self-host OSS or free tier cloud → scrape → push into agents. Check rate limits/ToS.",
    category: "scraper",
    platforms: ["any"],
    free: true,
    hardcore: true,
    tags: ["crawl", "api", "llm"],
    taskKeywords: ["scrape", "crawl", "site to markdown", "research"],
  },
  {
    id: "scrapy",
    name: "Scrapy",
    repoUrl: "https://github.com/scrapy/scrapy",
    description: "Battle-tested Python crawling framework for large jobs.",
    quickInstall: "pip install scrapy",
    howToSetUp: "scrapy startproject → write spiders for public data sources → export JSON/CSV for agents.",
    category: "scraper",
    platforms: ["windows", "mac", "linux"],
    free: true,
    hardcore: true,
    tags: ["spider", "python", "pipeline"],
    taskKeywords: ["scrape", "spider", "bulk crawl", "data pipeline"],
  },
  {
    id: "playwright",
    name: "Playwright",
    repoUrl: "https://github.com/microsoft/playwright",
    description: "Browser automation — foundation for headless scrapers and tests.",
    quickInstall: "npm i -D playwright && npx playwright install",
    howToSetUp: "Install browsers → script extractions → or wire Playwright MCP in Plethora MCP Hub.",
    category: "scraper",
    platforms: ["windows", "mac", "linux"],
    free: true,
    tags: ["browser", "automation", "mcp"],
    taskKeywords: ["scrape", "browser", "screenshot", "automation"],
  },
  {
    id: "puppeteer",
    name: "Puppeteer",
    repoUrl: "https://github.com/puppeteer/puppeteer",
    description: "Headless Chrome control for scraping & screenshots (Node).",
    quickInstall: "npm i puppeteer",
    howToSetUp: "Script Chrome → extract DOM/text of public pages → store for analysis.",
    category: "scraper",
    platforms: ["windows", "mac", "linux"],
    free: true,
    tags: ["chrome", "scrape"],
    taskKeywords: ["scrape", "chrome", "screenshot"],
  },
  {
    id: "colly",
    name: "Colly",
    repoUrl: "https://github.com/gocolly/colly",
    description: "Fast Go scraping framework for high-volume hardcore crawls.",
    howToSetUp: "go get colly → write scrapers → great for performance-minded hardcore users.",
    category: "scraper",
    platforms: ["windows", "mac", "linux"],
    free: true,
    hardcore: true,
    tags: ["go", "scrape", "performance"],
    taskKeywords: ["scrape", "golang", "fast crawl"],
  },
  {
    id: "trafilatura",
    name: "Trafilatura",
    repoUrl: "https://github.com/adbar/trafilatura",
    description: "Extract main text/metadata from web pages (Python).",
    quickInstall: "pip install trafilatura",
    howToSetUp: "Feed URLs → get clean article text → RAG or agent research packs.",
    category: "scraper",
    platforms: ["any"],
    free: true,
    tags: ["extract", "nlp", "articles"],
    taskKeywords: ["extract article", "news scrape", "clean text"],
  },
  {
    id: "newspaper3k",
    name: "newspaper3k",
    repoUrl: "https://github.com/codelucas/newspaper",
    description: "News article scraping & curation library.",
    howToSetUp: "pip install newspaper3k → pull article sets for niche research.",
    category: "scraper",
    platforms: ["any"],
    free: true,
    tags: ["news", "articles"],
    taskKeywords: ["news", "articles", "media research"],
  },
  {
    id: "yt-dlp",
    name: "yt-dlp",
    repoUrl: "https://github.com/yt-dlp/yt-dlp",
    description: "Download public video/audio for research/editing (respect copyright).",
    howToSetUp: "winget/pip install → yt-dlp <url> → feed transcripts into agents for content analysis.",
    category: "scraper",
    platforms: ["windows", "mac", "linux"],
    free: true,
    tags: ["video", "download"],
    taskKeywords: ["youtube", "video download", "transcript", "ugc research"],
  },
  {
    id: "searxng",
    name: "SearXNG",
    repoUrl: "https://github.com/searxng/searxng",
    description: "Self-hosted metasearch — agent-friendly privacy search.",
    howToSetUp: "Docker deploy → expose search API → let agents query the open web without a single vendor lock.",
    category: "scraper",
    platforms: ["linux", "windows", "mac"],
    free: true,
    hardcore: true,
    tags: ["search", "self-host", "privacy"],
    taskKeywords: ["search", "metasearch", "research", "internet"],
  },

  // ── MCP toolkit ──────────────────────────────────────────────────────────
  {
    id: "mcp-servers-official",
    name: "Model Context Protocol servers (reference)",
    repoUrl: "https://github.com/modelcontextprotocol/servers",
    description: "Official reference MCP servers (filesystem, fetch, memory, etc.).",
    howToSetUp: "Clone → npx/run listed servers → paste configs into Claude Desktop / Cursor via Plethora MCP Hub.",
    category: "mcp",
    platforms: ["any"],
    free: true,
    tags: ["mcp", "tools"],
    taskKeywords: ["mcp", "tools", "filesystem", "fetch"],
  },
  {
    id: "mcp-python-sdk",
    name: "MCP Python SDK",
    repoUrl: "https://github.com/modelcontextprotocol/python-sdk",
    description: "Build custom MCP tools (including your own scrapers) for agents.",
    howToSetUp: "pip install mcp → wrap a scraper or API → register as tool for Desktop clients.",
    category: "mcp",
    platforms: ["any"],
    free: true,
    hardcore: true,
    tags: ["mcp", "sdk", "custom"],
    taskKeywords: ["custom mcp", "build tool", "sdk"],
  },

  // ── RAG / knowledge ──────────────────────────────────────────────────────
  {
    id: "dify",
    name: "Dify",
    repoUrl: "https://github.com/langgenius/dify",
    description: "Open-source LLM app platform (agents, RAG, workflows).",
    howToSetUp: "Docker compose up → build knowledge apps that ingest scraped docs.",
    category: "vector-rag",
    platforms: ["windows", "mac", "linux"],
    free: true,
    hardcore: true,
    tags: ["rag", "agents", "platform"],
    taskKeywords: ["rag", "knowledge base", "agent platform"],
  },
  {
    id: "anythingllm",
    name: "AnythingLLM",
    repoUrl: "https://github.com/Mintplex-Labs/anything-llm",
    description: "Desktop/private RAG chat over your documents.",
    howToSetUp: "Install desktop or docker → upload PDFs/scraped dumps → chat with your private internet archive.",
    category: "vector-rag",
    platforms: ["windows", "mac", "linux"],
    free: true,
    tags: ["rag", "documents", "privacy"],
    taskKeywords: ["documents", "rag", "private knowledge"],
  },
  {
    id: "quivr",
    name: "Quivr",
    repoUrl: "https://github.com/QuivrHQ/quivr",
    description: "Open-source RAG / second brain.",
    howToSetUp: "Deploy → ingest crawl exports → query with agents.",
    category: "vector-rag",
    platforms: ["any"],
    free: true,
    tags: ["rag", "brain"],
    taskKeywords: ["second brain", "rag", "memory"],
  },

  // ── Image / creative local ───────────────────────────────────────────────
  {
    id: "comfyui",
    name: "ComfyUI",
    repoUrl: "https://github.com/comfyanonymous/ComfyUI",
    description: "Node-based local image/video gen on GPU.",
    howToSetUp: "Clone → install torch matching GPU → run UI → load checkpoints from Hugging Face.",
    category: "image",
    platforms: ["windows", "mac", "linux"],
    free: true,
    hardcore: true,
    tags: ["image", "gpu", "sd"],
    taskKeywords: ["local image", "stable diffusion", "comfy"],
  },
  {
    id: "automatic1111",
    name: "Stable Diffusion WebUI",
    repoUrl: "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
    description: "Popular local SD UI.",
    howToSetUp: "Follow Windows install notes → download models → generate creatives offline.",
    category: "image",
    platforms: ["windows", "mac", "linux"],
    free: true,
    tags: ["image", "sd"],
    taskKeywords: ["stable diffusion", "local art", "ai image"],
  },

  // ── Video gen (Higgsfield + open local stacks) ───────────────────────────
  {
    id: "open-higgsfield-ai",
    name: "Open Higgsfield AI",
    repoUrl: "https://github.com/zilogo/open-higgsfield-ai",
    homepage: "https://muapi.ai/open-higgsfield-ai",
    description:
      "Free open-source Higgsfield-style studio: image, video, cinema & lip-sync with 200+ models. Self-host or hosted free tier.",
    quickInstall: "git clone https://github.com/zilogo/open-higgsfield-ai && npm install && npm run dev",
    howToSetUp:
      "Clone the free MIT repo → npm install → run the studio UI. Or use the hosted studio. Pair with Muapi keys if you need cloud model backends. Not affiliated with commercial Higgsfield — community FOSS alternative for Vid Gen + image.",
    category: "video",
    platforms: ["windows", "mac", "linux", "web"],
    free: true,
    tags: ["video", "image", "higgsfield", "t2v", "i2v", "lip-sync", "free"],
    taskKeywords: [
      "higgsfield",
      "higgfield",
      "video gen",
      "ai video",
      "image to video",
      "text to video",
      "lip sync",
      "cinema studio",
      "open higgsfield",
    ],
  },
  {
    id: "higgsfield-cli",
    name: "Higgsfield CLI (official)",
    repoUrl: "https://github.com/higgsfield-ai/cli",
    homepage: "https://higgsfield.ai/cli",
    description:
      "Official Higgsfield CLI / MCP — terminal + agent access to Veo, Kling, Seedance, Flux, Soul, etc. Account credits apply.",
    quickInstall: "npm i -g @higgsfield/cli && higgsfield auth login",
    howToSetUp:
      "Install CLI → auth login with your Higgsfield account → generate via `higgsfield generate` or wire MCP into Cursor/Claude. Free to install; generations use platform credits. Best when you want agent-driven marketing video from terminal.",
    category: "video",
    platforms: ["windows", "mac", "linux"],
    free: true,
    tags: ["video", "cli", "mcp", "higgsfield", "agent"],
    taskKeywords: [
      "higgsfield cli",
      "higgsfield mcp",
      "video gen api",
      "kling",
      "veo",
      "seedance",
    ],
  },
  {
    id: "wan21",
    name: "Wan 2.1 (open video)",
    repoUrl: "https://github.com/Wan-Video/Wan2.1",
    description: "Alibaba open T2V/I2V models — strong quality/VRAM balance for local GPU.",
    howToSetUp:
      "Clone → follow install for CUDA → download 1.3B or 14B weights → generate, or use ComfyUI Wan nodes.",
    category: "video",
    platforms: ["windows", "mac", "linux"],
    free: true,
    hardcore: true,
    tags: ["video", "local", "gpu", "t2v", "i2v"],
    taskKeywords: ["wan", "wan2.1", "local video", "text to video", "image to video"],
  },
  {
    id: "ltx-video",
    name: "LTX-Video",
    repoUrl: "https://github.com/Lightricks/LTX-Video",
    homepage: "https://ltx.io/model",
    description: "Fast open DiT video gen — lower VRAM, longer clips, ComfyUI support.",
    howToSetUp: "Clone → install deps → load distilled checkpoints → run inference or ComfyUI workflows.",
    category: "video",
    platforms: ["windows", "mac", "linux"],
    free: true,
    hardcore: true,
    tags: ["video", "local", "fast", "gpu"],
    taskKeywords: ["ltx", "ltx-video", "fast video gen", "local video"],
  },
  {
    id: "hunyuan-video",
    name: "HunyuanVideo",
    repoUrl: "https://github.com/Tencent-Hunyuan/HunyuanVideo",
    description: "Tencent open video foundation model — high quality T2V/I2V (VRAM hungry).",
    howToSetUp:
      "Read release notes → install CUDA stack → download checkpoints → run scripts / ComfyUI. See also HunyuanVideo-1.5 for lighter consumer GPUs.",
    category: "video",
    platforms: ["windows", "linux"],
    free: true,
    hardcore: true,
    tags: ["video", "local", "gpu", "quality"],
    taskKeywords: ["hunyuan", "hunyuanvideo", "best open video"],
  },
  {
    id: "hunyuan-video-15",
    name: "HunyuanVideo-1.5",
    repoUrl: "https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5",
    description: "Lighter Hunyuan open video (~8.3B) aimed at consumer GPUs — T2V + I2V.",
    howToSetUp: "Clone 1.5 repo → install → run with Diffusers/ComfyUI paths from their README.",
    category: "video",
    platforms: ["windows", "linux"],
    free: true,
    hardcore: true,
    tags: ["video", "local", "gpu"],
    taskKeywords: ["hunyuan 1.5", "consumer video gen", "image to video"],
  },
  {
    id: "cogvideo",
    name: "CogVideo / CogVideoX",
    repoUrl: "https://github.com/THUDM/CogVideo",
    description: "Open CogVideoX T2V & I2V (Zhipu) — solid narrative/cinematic clips.",
    howToSetUp: "Clone → install → download CogVideoX weights → run diffusers examples.",
    category: "video",
    platforms: ["windows", "linux"],
    free: true,
    hardcore: true,
    tags: ["video", "local", "t2v"],
    taskKeywords: ["cogvideo", "cogvideox", "text to video"],
  },
  {
    id: "mochi-video",
    name: "Mochi 1",
    repoUrl: "https://github.com/genmoai/mochi",
    description: "Genmo open video model — fluid motion research / local gen.",
    howToSetUp: "Follow Genmo install → GPU with enough VRAM → sample scripts.",
    category: "video",
    platforms: ["linux", "windows"],
    free: true,
    hardcore: true,
    tags: ["video", "local", "research"],
    taskKeywords: ["mochi", "genmo", "open video"],
  },

  // ── Automation ───────────────────────────────────────────────────────────
  {
    id: "n8n",
    name: "n8n",
    repoUrl: "https://github.com/n8n-io/n8n",
    description: "Open-source Zapier-like workflow automation.",
    howToSetUp: "npm/docker start → webhook scrapers into Sheets/Slack. Free self-host.",
    category: "automation",
    platforms: ["windows", "mac", "linux"],
    free: true,
    tags: ["workflow", "automation"],
    taskKeywords: ["automate", "workflow", "zapier alternative"],
  },
  {
    id: "huginn",
    name: "Huginn",
    repoUrl: "https://github.com/huginn/huginn",
    description: "Self-hosted agents that watch the web and act on events.",
    howToSetUp: "Docker deploy → create agents for RSS/scrapes/alerts. Old-school hardcore automation.",
    category: "automation",
    platforms: ["linux", "mac", "windows"],
    free: true,
    hardcore: true,
    tags: ["agents", "watch", "self-host"],
    taskKeywords: ["watch web", "alerts", "self host agents"],
  },
];

export function reposForTask(task: string, opts?: { hardcoreOnly?: boolean; limit?: number }): FreeInstallRepo[] {
  const t = task.toLowerCase();
  const limit = opts?.limit ?? 16;
  return FREE_INSTALL_REPOS.map((r) => {
    let score = 0;
    for (const kw of r.taskKeywords) if (t.includes(kw)) score += kw.split(" ").length * 3;
    for (const tag of r.tags) if (t.includes(tag)) score += 2;
    if (t.match(/scrape|crawl|research|internet|web data|competitor/)) {
      if (r.category === "scraper" || r.category === "browser-agent") score += 4;
    }
    if (t.match(/agent|automat|hardcore/)) {
      if (r.category === "agent" || r.hardcore) score += 3;
    }
    if (t.match(/local|gpu|offline|ollama/)) {
      if (r.category === "local-llm") score += 4;
    }
    if (t.match(/video|t2v|i2v|higgsfield|higgfield|reel|wan\b|ltx|hunyuan|cogvideo|mochi/)) {
      if (r.category === "video" || r.tags.includes("video")) score += 5;
    }
    if (t.match(/image gen|stable diffusion|comfy|midjourney style/)) {
      if (r.category === "image") score += 4;
    }
    if (opts?.hardcoreOnly && r.hardcore) score += 2;
    if (!opts?.hardcoreOnly && r.free) score += 0.5;
    return { r, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.r);
}

export function allHardcoreRepos(): FreeInstallRepo[] {
  return FREE_INSTALL_REPOS.filter((r) => r.hardcore);
}

export const INSTALL_CATEGORIES: { id: InstallCategory | "all"; label: string }[] = [
  { id: "all", label: "All free installs" },
  { id: "local-llm", label: "Local LLM / GPU" },
  { id: "agent", label: "Agents" },
  { id: "scraper", label: "Scrapers & crawlers" },
  { id: "browser-agent", label: "Browser agents" },
  { id: "mcp", label: "MCP & tools" },
  { id: "vector-rag", label: "RAG / knowledge" },
  { id: "automation", label: "Automation" },
  { id: "image", label: "Local image" },
  { id: "video", label: "Video gen (Higgsfield + open)" },
  { id: "ide", label: "IDE agents" },
];
