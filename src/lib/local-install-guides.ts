/**
 * Step-by-step PC install guides for local AI (not “open website only”).
 */

export type InstallOs = "windows" | "mac" | "linux";

export type InstallStep = {
  title: string;
  detail?: string;
  command?: string;
};

export type LocalInstallGuide = {
  backendId: string;
  name: string;
  prerequisites: string[];
  steps: Record<InstallOs, InstallStep[]>;
  verify: { title: string; command?: string; detail: string };
  afterInstall: string[];
  docsUrl: string;
};

export const LOCAL_INSTALL_GUIDES: LocalInstallGuide[] = [
  {
    backendId: "ollama-default",
    name: "Ollama",
    prerequisites: ["Windows 10/11, macOS, or Linux", "Optional: recent NVIDIA / AMD / Apple GPU drivers"],
    steps: {
      windows: [
        {
          title: "Download the Windows installer",
          detail: "Get the official .exe from ollama.com (not a third-party mirror).",
          command: "winget install Ollama.Ollama",
        },
        {
          title: "Or install with winget (optional)",
          detail: "Open PowerShell or Terminal as a normal user and run the command above. Finish the installer if a GUI appears.",
        },
        {
          title: "Pull a starter model",
          detail: "In a new terminal after Ollama is running:",
          command: "ollama pull llama3.2",
        },
        {
          title: "Test chat",
          detail: "Optional sanity check:",
          command: "ollama run llama3.2",
        },
      ],
      mac: [
        {
          title: "Install with brew or the DMG",
          detail: "Prefer Homebrew if you have it:",
          command: "brew install ollama",
        },
        {
          title: "Start the app",
          detail: "Open Ollama from Applications so the menu-bar service is running.",
        },
        {
          title: "Pull a model",
          command: "ollama pull llama3.2",
        },
      ],
      linux: [
        {
          title: "Official install script",
          detail: "Runs as root once; installs the daemon.",
          command: "curl -fsSL https://ollama.com/install.sh | sh",
        },
        {
          title: "Pull a model",
          command: "ollama pull llama3.2",
        },
      ],
    },
    verify: {
      title: "Verify API on this PC",
      command: "curl http://127.0.0.1:11434/api/tags",
      detail: "You should see JSON listing models. In Plethora, set base URL to http://127.0.0.1:11434 and model to llama3.2 (or whatever you pulled).",
    },
    afterInstall: [
      "Leave Ollama running in the background.",
      "Save this profile in Plethora → Local AI backends.",
      "Larger models need more VRAM — use Hardware advisor if responses fail or crawl.",
    ],
    docsUrl: "https://ollama.com",
  },
  {
    backendId: "lm-studio-default",
    name: "LM Studio",
    prerequisites: ["Desktop OS", "Several GB free disk for models"],
    steps: {
      windows: [
        {
          title: "Download LM Studio",
          detail: "Install from the official site (Windows installer).",
        },
        {
          title: "Download a GGUF model",
          detail: "In the app: Discover → search Llama / Qwen / Mistral → Download a quant that fits your VRAM (Q4 for most cards).",
        },
        {
          title: "Start the local server",
          detail: "Developer tab → Start server. Note host port (default 1234) and the model id shown.",
        },
        {
          title: "Match model name in Plethora",
          detail: "Copy the exact model identifier into Plethora’s Model name field. Base URL: http://127.0.0.1:1234/v1",
        },
      ],
      mac: [
        {
          title: "Install LM Studio for macOS",
          detail: "Download the Mac build from lmstudio.ai. Allow the app in Privacy settings if prompted.",
        },
        {
          title: "Load model + start server",
          detail: "Same as Windows: Discover → download → Developer → Start server on port 1234.",
        },
      ],
      linux: [
        {
          title: "Install Linux build",
          detail: "Use the official AppImage/package from lmstudio.ai documentation for your distro.",
        },
        {
          title: "Start local server",
          detail: "Load a GGUF, then enable the OpenAI-compatible server (default http://127.0.0.1:1234/v1).",
        },
      ],
    },
    verify: {
      title: "Ping the OpenAI-compatible API",
      command: 'curl http://127.0.0.1:1234/v1/models',
      detail: "Returns model list if the server is up. Keep LM Studio open while using it.",
    },
    afterInstall: [
      "Plethora only stores the URL in this browser — it calls localhost from your machine.",
      "If connection fails, check firewall, correct port, and that the server toggle is On.",
    ],
    docsUrl: "https://lmstudio.ai",
  },
  {
    backendId: "openclaw-default",
    name: "OpenClaw",
    prerequisites: ["Node.js 20+", "A messaging channel if you want WhatsApp/Telegram later"],
    steps: {
      windows: [
        {
          title: "Install Node.js LTS",
          detail: "From nodejs.org, or:",
          command: "winget install OpenJS.NodeJS.LTS",
        },
        {
          title: "Install OpenClaw CLI",
          command: "npm install -g openclaw@latest",
        },
        {
          title: "Onboard (gateway + pairing)",
          detail: "Follow the interactive wizard — installs daemon/service when offered.",
          command: "openclaw onboard --install-daemon",
        },
        {
          title: "Open the control UI",
          command: "openclaw dashboard",
        },
        {
          title: "Point models at local or cloud",
          detail:
            "In OpenClaw config, attach Ollama/LM Studio for free local GPU, or Claude/OpenAI API keys if you accept cloud usage (paid).",
        },
      ],
      mac: [
        {
          title: "Install Node + OpenClaw",
          command: "npm install -g openclaw@latest",
        },
        {
          title: "Onboard",
          command: "openclaw onboard --install-daemon",
        },
        {
          title: "Dashboard",
          command: "openclaw dashboard",
          detail: "Default gateway is often http://127.0.0.1:18789",
        },
      ],
      linux: [
        {
          title: "Install OpenClaw",
          command: "npm install -g openclaw@latest && openclaw onboard --install-daemon",
        },
        {
          title: "Open dashboard",
          command: "openclaw dashboard",
        },
      ],
    },
    verify: {
      title: "Gateway up",
      detail: "Control UI loads locally. Connect a channel (e.g. Telegram) per docs.openclaw.ai when ready.",
      command: "openclaw dashboard",
    },
    afterInstall: [
      "OpenClaw is free open source; paid fees only if you attach paid model APIs.",
      "GPU work happens in Ollama/LM Studio/vLLM — install one of those for true local models.",
      "See https://docs.openclaw.ai for channel pairing.",
    ],
    docsUrl: "https://docs.openclaw.ai",
  },
  {
    backendId: "odysseus-default",
    name: "Odysseus",
    prerequisites: ["Docker Desktop recommended", "Or Python native install per upstream docs"],
    steps: {
      windows: [
        {
          title: "Install Docker Desktop",
          detail: "Required for the easiest path. Enable WSL2 backend if prompted.",
          command: "winget install Docker.DockerDesktop",
        },
        {
          title: "Clone and start (after Docker is running)",
          detail: "In a folder of your choice (Git required):",
          command:
            "git clone https://github.com/pewdiepie-archdaemon/odysseus.git\ncd odysseus\ndocker compose up -d",
        },
        {
          title: "Open the workspace",
          detail: "Usually http://127.0.0.1:7000 — set auth as the project recommends.",
        },
        {
          title: "Connect a model backend",
          detail:
            "In Odysseus settings, point to Ollama (http://host.docker.internal:11434 on Windows) or LM Studio / cloud APIs.",
        },
      ],
      mac: [
        {
          title: "Install Docker Desktop for Mac",
          detail: "Then clone odysseus and docker compose up -d.",
          command:
            "git clone https://github.com/pewdiepie-archdaemon/odysseus.git && cd odysseus && docker compose up -d",
        },
        {
          title: "Open http://localhost:7000",
          detail: "Configure Ollama/LM Studio as the model provider inside the app.",
        },
      ],
      linux: [
        {
          title: "Docker Compose deploy",
          command:
            "git clone https://github.com/pewdiepie-archdaemon/odysseus.git\ncd odysseus\ndocker compose up -d",
        },
        {
          title: "Open port 7000",
          detail: "Keep the stack private — bind to localhost only in production.",
        },
      ],
    },
    verify: {
      title: "UI loads",
      detail: "Browser opens the Odysseus dashboard. Cookbook can help pick models for your hardware.",
    },
    afterInstall: [
      "Workspace is free/open source; models free via Ollama or paid via API keys.",
      "Treat shell/file tools carefully — enable auth and do not expose ports publicly.",
    ],
    docsUrl: "https://github.com/pewdiepie-archdaemon/odysseus",
  },
  {
    backendId: "llamacpp-default",
    name: "llama.cpp",
    prerequisites: ["C++ build tools or prebuilt binaries", "A GGUF model file"],
    steps: {
      windows: [
        {
          title: "Get a release binary",
          detail: "From github.com/ggerganov/llama.cpp releases, or build with CUDA for GPU.",
        },
        {
          title: "Run server with your model",
          command: "llama-server -m path\\to\\model.gguf --port 8080",
        },
      ],
      mac: [
        {
          title: "Build or brew",
          detail: "Follow llama.cpp README for Metal builds, then:",
          command: "./llama-server -m ./model.gguf --port 8080",
        },
      ],
      linux: [
        {
          title: "Build with CUDA (optional)",
          detail: "Compile llama.cpp for GPU, then start llama-server on port 8080.",
          command: "./llama-server -m ./model.gguf --port 8080",
        },
      ],
    },
    verify: {
      title: "OpenAI-compatible routes",
      command: "curl http://127.0.0.1:8080/v1/models",
      detail: "Set Plethora base URL to http://127.0.0.1:8080/v1",
    },
    afterInstall: ["Advanced path — prefer Ollama or LM Studio if you only need chat."],
    docsUrl: "https://github.com/ggerganov/llama.cpp",
  },
  {
    backendId: "jan-default",
    name: "Jan",
    prerequisites: ["Desktop installer from jan.ai"],
    steps: {
      windows: [
        {
          title: "Install Jan",
          detail: "Download Windows installer from jan.ai and complete setup.",
        },
        {
          title: "Download a model in-app",
          detail: "Hub → pick a model that fits RAM/VRAM → start chatting offline.",
        },
        {
          title: "Enable local API if available",
          detail: "In settings, enable OpenAI-compatible server and match port in Plethora.",
        },
      ],
      mac: [
        {
          title: "Install Jan for Mac",
          detail: "Download from jan.ai, open the app, download a model, enable local API.",
        },
      ],
      linux: [
        {
          title: "Install Jan",
          detail: "Use the Linux package from jan.ai docs; enable local server when offered.",
        },
      ],
    },
    verify: {
      title: "Chat works offline",
      detail: "Send a message with no internet. API optional depending on version.",
    },
    afterInstall: ["Fully free/open source stack for private chat."],
    docsUrl: "https://jan.ai",
  },
  {
    backendId: "open-webui",
    name: "Open WebUI",
    prerequisites: ["Docker or Python", "Ollama (or other backend) already installed"],
    steps: {
      windows: [
        {
          title: "Run with Docker",
          command:
            "docker run -d -p 8080:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui ghcr.io/open-webui/open-webui:main",
        },
        {
          title: "Open http://localhost:8080",
          detail: "Create admin account, connect Ollama at host.docker.internal:11434",
        },
      ],
      mac: [
        {
          title: "Docker run",
          command:
            "docker run -d -p 8080:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui ghcr.io/open-webui/open-webui:main",
        },
      ],
      linux: [
        {
          title: "Docker run (GPU optional extra flags)",
          command:
            "docker run -d -p 8080:8080 -v open-webui:/app/backend/data --name open-webui ghcr.io/open-webui/open-webui:main",
        },
      ],
    },
    verify: {
      title: "Login page loads",
      detail: "ChatGPT-style UI over your local models.",
    },
    afterInstall: ["UI is free; power costs come from electricity / hardware only."],
    docsUrl: "https://github.com/open-webui/open-webui",
  },
];

export function getInstallGuide(backendId: string): LocalInstallGuide | undefined {
  return LOCAL_INSTALL_GUIDES.find((g) => g.backendId === backendId);
}
