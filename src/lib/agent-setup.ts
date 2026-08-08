/**
 * Setup paths so a total beginner can go from "I have no AI" → working agent
 * (Claude / ChatGPT / Cursor / terminal / local). MCP notes included where applicable.
 */

export type AgentId =
  | "claude-web"
  | "chatgpt-web"
  | "gemini-web"
  | "claude-desktop"
  | "cursor"
  | "claude-code"
  | "ollama"
  | "lm-studio";

export interface AgentSetupGuide {
  id: AgentId;
  name: string;
  bestFor: string;
  difficulty: "easiest" | "easy" | "medium" | "advanced";
  timeToSetup: string;
  url: string;
  mcpSupport: "native" | "partial" | "coming" | "none" | "via-desktop";
  steps: string[];
  mcpNote?: string;
  pasteHint: string;
}

export const AGENT_SETUP_GUIDES: AgentSetupGuide[] = [
  {
    id: "claude-web",
    name: "Claude (claude.ai)",
    bestFor: "Best starting point for most people — deep writing, strategy, plans",
    difficulty: "easiest",
    timeToSetup: "2 minutes",
    url: "https://claude.ai",
    mcpSupport: "via-desktop",
    steps: [
      "Open claude.ai and create a free Anthropic account (Google/email ok).",
      "Start a new chat. You can paste any Plethora prompt immediately — no install needed.",
      "For projects / longer UGC or business plans: create a Project and pin your brand notes.",
      "Want tools (files, apps, browser)? Install Claude Desktop (below) or use Claude with MCP connectors where available in your plan.",
    ],
    mcpNote:
      "Full MCP works best in Claude Desktop / Claude Code. On claude.ai, start with paste-ready prompts; add Desktop when you need tools.",
    pasteHint: "Paste your Plethora prompt into a new Claude chat and hit send.",
  },
  {
    id: "chatgpt-web",
    name: "ChatGPT (chat.openai.com)",
    bestFor: "Beginners, GPTs store, image generation (DALL·E), everyday tasks",
    difficulty: "easiest",
    timeToSetup: "2 minutes",
    url: "https://chat.openai.com",
    mcpSupport: "partial",
    steps: [
      "Open chat.openai.com and sign up free (or login).",
      "Start a new chat → paste your Plethora prompt.",
      "Optional: enable Voice / Advanced data analysis / image tools if your plan allows.",
      "For custom workflows: explore GPTs in the left sidebar (browse niche GPTs for UGC, ads, coding).",
      "If your org enables connectors / custom tools, link them under settings; otherwise use the paste prompt path.",
    ],
    mcpNote:
      "ChatGPT MCP / connector availability depends on plan and rollout. Use GPTs + web tools until MCP is available on your account.",
    pasteHint: "New chat → paste prompt → optionally attach files or images.",
  },
  {
    id: "gemini-web",
    name: "Google Gemini",
    bestFor: "Google Docs/Drive users, free multimodal, research with Google",
    difficulty: "easiest",
    timeToSetup: "2 minutes",
    url: "https://gemini.google.com",
    mcpSupport: "none",
    steps: [
      "Open gemini.google.com with a Google account.",
      "Paste your Plethora prompt into a new chat.",
      "Use Gemini in Docs/Gmail/side panels when you’re already in Google Workspace.",
    ],
    pasteHint: "Paste and generate; export useful replies into Docs if needed.",
  },
  {
    id: "claude-desktop",
    name: "Claude Desktop + MCP",
    bestFor: "People who want Claude with real tools (files, browser, Zapier, etc.)",
    difficulty: "easy",
    timeToSetup: "10–15 minutes",
    url: "https://claude.ai/download",
    mcpSupport: "native",
    steps: [
      "Download Claude Desktop from claude.ai/download and install.",
      "Sign in with the same Anthropic account you use on the web.",
      "Open Settings → Developer (or MCP) and open the config file (claude_desktop_config.json).",
      "Add MCP servers from Plethora MCP Hub (JSON snippets included per server).",
      "Fully quit Claude Desktop and reopen. Check that tools appear in the chat tools menu.",
      "Paste your Plethora prompt and let Claude call tools when needed.",
    ],
    mcpNote: "This is the easiest path to MCP if you are not a developer. Prefer Desktop over IDE for non-coders.",
    pasteHint: "After MCP servers show as connected, paste the prompt and allow tool use when Claude asks.",
  },
  {
    id: "cursor",
    name: "Cursor (AI IDE)",
    bestFor: "Building apps, sites, automations; agent + MCP for developers",
    difficulty: "medium",
    timeToSetup: "10 minutes",
    url: "https://cursor.com",
    mcpSupport: "native",
    steps: [
      "Download Cursor from cursor.com and install (Windows/Mac/Linux).",
      "Sign in. Open a folder for your project (or create an empty one).",
      "Open Cursor Settings → MCP → Add server (or edit mcp.json).",
      "Add any MCP from the Plethora MCP Hub, save, reload window.",
      "Open Agent/Chat (Ctrl/Cmd+L or Agent) and paste your Plethora prompt.",
    ],
    mcpNote: "Cursor is best when the task involves code, repos, or local files + MCP.",
    pasteHint: "Use Agent mode for multi-step work; paste the full Plethora playbook prompt.",
  },
  {
    id: "claude-code",
    name: "Claude Code (terminal agent)",
    bestFor: "Power users who live in the terminal and want an autonomous coding agent",
    difficulty: "advanced",
    timeToSetup: "15–20 minutes",
    url: "https://docs.anthropic.com/en/docs/claude-code",
    mcpSupport: "native",
    steps: [
      "Install Node.js LTS from nodejs.org if you do not have it.",
      "Open a terminal and run: npm install -g @anthropic-ai/claude-code",
      "Run: claude  (or follow current Anthropic install docs if the package name changes).",
      "Authenticate when prompted with your Anthropic account / API key.",
      "cd into your project folder, then paste or type your task / Plethora prompt.",
      "Configure MCP in Claude Code settings so tools (browser, github, etc.) are available.",
    ],
    mcpNote: "Terminal agents shine for multi-file builds and automation scripts.",
    pasteHint: "Start in your project directory, then paste the expert prompt as your first message.",
  },
  {
    id: "ollama",
    name: "Ollama (local free models)",
    bestFor: "Privacy, offline use, free local LLMs on your PC",
    difficulty: "medium",
    timeToSetup: "10–20 minutes",
    url: "https://ollama.com",
    mcpSupport: "partial",
    steps: [
      "Download Ollama from ollama.com and install.",
      "Open a terminal and pull a model: ollama pull llama3.2  (or mistral, qwen2.5, etc.).",
      "Chat with: ollama run llama3.2",
      "Paste your Plethora prompt into the terminal chat.",
      "Optional: use Open WebUI or Continue/Cursor pointed at Ollama for a friendlier UI.",
    ],
    mcpNote: "MCP is usually wired through Open WebUI, Continue, or custom clients on top of Ollama.",
    pasteHint: "Shorter prompts work better on small local models; use our Prompt Assistant then trim if needed.",
  },
  {
    id: "lm-studio",
    name: "LM Studio",
    bestFor: "Local AI with a simple desktop GUI (no terminal required)",
    difficulty: "easy",
    timeToSetup: "10 minutes",
    url: "https://lmstudio.ai",
    mcpSupport: "none",
    steps: [
      "Download LM Studio from lmstudio.ai and install.",
      "Use Discover to download a starter model (e.g. a 7B–8B instruct model).",
      "Load the model → open Chat → paste your Plethora prompt.",
    ],
    pasteHint: "Same ready-to-paste prompt; expect slightly weaker results than Claude/GPT on complex strategies.",
  },
];

export function recommendAgentsForTask(task: string): AgentId[] {
  const t = task.toLowerCase();
  if (t.match(/code|website|app|saas|debug|cursor|react|api/)) {
    return ["cursor", "claude-code", "claude-web", "chatgpt-web"];
  }
  if (t.match(/local|offline|private|ollama/)) {
    return ["ollama", "lm-studio", "claude-web"];
  }
  if (t.match(/mcp|automat/)) {
    return ["claude-desktop", "cursor", "claude-web", "chatgpt-web"];
  }
  // Default: get a free web agent first, then Desktop MCP path
  return ["claude-web", "chatgpt-web", "gemini-web", "claude-desktop"];
}

export function getAgentGuides(ids: AgentId[]): AgentSetupGuide[] {
  return ids
    .map((id) => AGENT_SETUP_GUIDES.find((g) => g.id === id))
    .filter((g): g is AgentSetupGuide => Boolean(g));
}
