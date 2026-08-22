/**
 * Broad MCP server registry + multi-client setup (Claude web/desktop, ChatGPT, Cursor, terminal).
 * Not Cursor-only — we rank what each client can do today.
 */

export type McpClient =
  | "claude-desktop"
  | "claude-web"
  | "chatgpt"
  | "cursor"
  | "windsurf"
  | "vscode"
  | "claude-code"
  | "cline"
  | "continue"
  | "zed"
  | "gemini-cli"
  | "raycast";

export interface McpServer {
  id: string;
  name: string;
  description: string;
  whyUse: string;
  category:
    | "browser"
    | "files"
    | "github"
    | "database"
    | "automation"
    | "search"
    | "productivity"
    | "design"
    | "communications"
    | "payments"
    | "devtools"
    | "memory"
    | "other";
  url?: string;
  docsUrl?: string;
  installHint: string;
  configSnippet?: string;
  tags: string[];
  worksWith: McpClient[];
  skillLevel: "beginner" | "intermediate" | "advanced";
  pricing: "free" | "freemium" | "paid";
  taskKeywords: string[];
}

export const MCP_CLIENTS: {
  id: McpClient;
  name: string;
  setupPriority: number;
  summary: string;
  steps: string[];
  url: string;
  autoNote: string;
}[] = [
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    setupPriority: 1,
    summary: "Best noob-friendly MCP host. Install once, add servers, use tools in chat.",
    url: "https://claude.ai/download",
    autoNote: "After config, tools appear in Claude chat automatically — approve when Claude requests them.",
    steps: [
      "Install Claude Desktop → sign in.",
      "Settings → Developer → Edit Config (claude_desktop_config.json).",
      "Paste a server from the list below into mcpServers, save.",
      "Fully quit Claude and reopen. Tools should list in the UI.",
      "Paste any Plethora prompt; Claude will call tools when allowed.",
    ],
  },
  {
    id: "claude-web",
    name: "Claude (web)",
    setupPriority: 2,
    summary: "Works immediately for prompts. MCP tools are limited on pure web — use Desktop for full MCP.",
    url: "https://claude.ai",
    autoNote: "Start on web today with paste prompts. For MCP tools, switch to Claude Desktop (same account).",
    steps: [
      "Open claude.ai — no install for text/strategy work.",
      "If your account shows Connectors / Tools, enable those you trust.",
      "For filesystem, browser, Zapier, GitHub MCP → use Claude Desktop config instead.",
    ],
  },
  {
    id: "chatgpt",
    name: "ChatGPT (web + apps)",
    setupPriority: 3,
    summary: "Paste prompts immediately. Use GPTs + available connectors; MCP support varies by plan/rollout.",
    url: "https://chat.openai.com",
    autoNote: "Where connectors/MCP appear in your account, enable them once — then ChatGPT can use them in chats automatically.",
    steps: [
      "Sign in at chat.openai.com.",
      "Paste Plethora prompts for instant value (zero config).",
      "Enable any available Connectors / tools in Settings for your workspace.",
      "Browse GPTs for niche tasks (UGC, ads, coding) as a no-MCP alternative.",
      "When OpenAI exposes MCP for your plan, add servers per their UI — same goal as Desktop MCP.",
    ],
  },
  {
    id: "cursor",
    name: "Cursor",
    setupPriority: 4,
    summary: "Developer-first MCP host with Agent mode.",
    url: "https://cursor.com",
    autoNote: "MCP tools show in Agent/Chat after mcp.json is saved and reloaded.",
    steps: [
      "Install Cursor → open a project folder.",
      "Settings → MCP → Add new global MCP server (or project .cursor/mcp.json).",
      "Paste config snippet → Save → Reload Window.",
      "Open Agent chat and ask it to use tools (or paste Plethora prompt).",
    ],
  },
  {
    id: "claude-code",
    name: "Claude Code (terminal)",
    setupPriority: 5,
    summary: "Terminal agent with MCP for coding + automation power users.",
    url: "https://docs.anthropic.com/en/docs/claude-code",
    autoNote: "Configured MCP servers load when the agent starts in that environment.",
    steps: [
      "Install Claude Code per Anthropic docs.",
      "Add MCP servers in Claude Code settings / project config.",
      "Start claude in your repo and paste the playbook prompt.",
    ],
  },
  {
    id: "windsurf",
    name: "Windsurf",
    setupPriority: 6,
    summary: "Another AI IDE with MCP/plugin support for coding workflows.",
    url: "https://codeium.com/windsurf",
    autoNote: "Add MCP configs similarly to Cursor; restart to load tools.",
    steps: [
      "Install Windsurf.",
      "Open MCP / integrations settings.",
      "Add server JSON from Plethora list → restart if needed.",
    ],
  },
  {
    id: "vscode",
    name: "VS Code + MCP extensions",
    setupPriority: 7,
    summary: "Use Continue, Cline, or official MCP extensions inside VS Code.",
    url: "https://code.visualstudio.com",
    autoNote: "Tools appear in the extension’s chat panel after config.",
    steps: [
      "Install VS Code.",
      "Install Continue or Cline (or MCP-compatible extension).",
      "Paste MCP server config into that extension’s config file.",
    ],
  },
  {
    id: "cline",
    name: "Cline",
    setupPriority: 8,
    summary: "Autonomous coding agent extension that can use MCP tools.",
    url: "https://github.com/cline/cline",
    autoNote: "MCP servers registered in Cline settings become callable mid-task.",
    steps: [
      "Install Cline in VS Code / compatible editor.",
      "Open Cline MCP settings → add servers.",
      "Start a task with your Plethora prompt.",
    ],
  },
  {
    id: "continue",
    name: "Continue.dev",
    setupPriority: 9,
    summary: "Open-source IDE copilot; can point at local models + tools.",
    url: "https://continue.dev",
    autoNote: "Configure tools/MCP in continue config; available in chat after reload.",
    steps: [
      "Install Continue in VS Code or JetBrains.",
      "Edit config.yaml / JSON for models and tools.",
      "Reload and paste prompts in Continue chat.",
    ],
  },
  {
    id: "zed",
    name: "Zed",
    setupPriority: 10,
    summary: "Fast editor with agent / MCP-oriented integrations (check current Zed docs for MCP).",
    url: "https://zed.dev",
    autoNote: "Follow Zed’s agent settings for external tools once configured.",
    steps: [
      "Install Zed from zed.dev.",
      "Open Settings → Agents / integrations.",
      "Add MCP or tool connections as documented for your version.",
    ],
  },
  {
    id: "gemini-cli",
    name: "Gemini CLI / Google AI tools",
    setupPriority: 11,
    summary: "Google’s developer surfaces; MCP and tool support evolve by product.",
    url: "https://ai.google.dev",
    autoNote: "Use official Google docs for connectors available on your account.",
    steps: [
      "Open ai.google.dev or Gemini in the product you use.",
      "Enable any available extensions or tools.",
      "Where MCP or custom tools are supported, paste server configs per Google docs.",
    ],
  },
  {
    id: "raycast",
    name: "Raycast AI",
    setupPriority: 12,
    summary: "macOS launcher with AI commands and extensions (not full Desktop MCP for all servers).",
    url: "https://www.raycast.com",
    autoNote: "Prefer Claude Desktop or Cursor when you need full MCP server JSON.",
    steps: [
      "Install Raycast (macOS).",
      "Enable AI features / AI extensions you trust.",
      "Use extensions marketplace for integrations; for classic MCP JSON hosts, use Desktop/Cursor.",
    ],
  },
];

export const MCP_SERVERS: McpServer[] = [
  {
    id: "mcp-plethora",
    name: "Plethora MCP (official)",
    description:
      "First-party server: search Plethora tools, recommend stacks, polish prompts, YouTube captions, ping, DNS, sitemaps, position size.",
    whyUse:
      "Makes Claude/Cursor sticky with real product actions—not generic internet search. Agents open exact /tools URLs and call live APIs.",
    category: "devtools",
    url: "/mcp#plethora-mcp",
    installHint:
      "Run packages/plethora-mcp (npm install && node src/index.js) or npx @plethora/mcp when published. Set PLETHORA_API_BASE to your site.",
    tags: ["mcp", "plethora", "official", "tools"],
    worksWith: ["claude-desktop", "cursor", "claude-code", "cline", "continue", "vscode"],
    skillLevel: "beginner",
    pricing: "free",
    taskKeywords: [
      "plethora mcp",
      "use plethora tools",
      "search tools",
      "agent tools",
      "sticky",
    ],
    configSnippet: `{
  "mcpServers": {
    "plethora": {
      "command": "node",
      "args": ["./packages/plethora-mcp/src/index.js"],
      "env": { "PLETHORA_API_BASE": "https://plethora-ten.vercel.app" }
    }
  }
}`,
  },
  {
    id: "mcp-zapier",
    name: "Zapier MCP",
    description: "Connect agents to 8,000+ apps (Gmail, Sheets, Slack, CRM, Notion…).",
    whyUse: "Automate outreach, lead capture, UGC delivery, posting schedules without building APIs.",
    category: "automation",
    url: "https://zapier.com/mcp",
    docsUrl: "https://docs.zapier.com",
    installHint: "Create a Zapier MCP endpoint in Zapier, then paste the server URL/token into Claude Desktop or Cursor.",
    tags: ["mcp", "automation", "integrations", "zapier"],
    worksWith: ["claude-desktop", "cursor", "claude-code", "chatgpt"],
    skillLevel: "intermediate",
    pricing: "freemium",
    taskKeywords: ["automate", "email", "crm", "slack", "sheets", "workflow", "integrate", "zapier", "money", "ugc"],
    configSnippet: `{
  "mcpServers": {
    "zapier": {
      "url": "YOUR_ZAPIER_MCP_URL"
    }
  }
}`,
  },
  {
    id: "mcp-composio",
    name: "Composio",
    description: "Tool-calling layer with many SaaS integrations for agents.",
    whyUse: "Give your agent Gmail, GitHub, Linear, Notion actions with managed auth.",
    category: "automation",
    url: "https://composio.dev",
    installHint: "Create API key in Composio → add MCP/connector per their dashboard.",
    tags: ["mcp", "tools", "saas"],
    worksWith: ["claude-desktop", "cursor", "claude-code"],
    skillLevel: "intermediate",
    pricing: "freemium",
    taskKeywords: ["automate", "gmail", "github", "notion", "tools", "agent"],
  },
  {
    id: "mcp-browser",
    name: "Playwright / Browser MCP",
    description: "Let the agent open pages, click, fill forms, and scrape structure.",
    whyUse: "Research competitors, test landing pages, fill creator platforms without manual clicking.",
    category: "browser",
    url: "https://github.com/microsoft/playwright-mcp",
    installHint: "Install Playwright MCP package; add npx command to Claude Desktop / Cursor mcp.json.",
    tags: ["mcp", "browser", "scraping", "qa"],
    worksWith: ["claude-desktop", "cursor", "claude-code", "cline"],
    skillLevel: "advanced",
    pricing: "free",
    taskKeywords: ["browse", "scrape", "research", "competitor", "web", "ugc", "brand"],
    configSnippet: `{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}`,
  },
  {
    id: "mcp-filesystem",
    name: "Filesystem MCP",
    description: "Read/write files in allowed folders on your machine.",
    whyUse: "Batch rename UGC assets, generate scripts to disk, organize brand kits.",
    category: "files",
    installHint: "Official Anthropic filesystem server — point allowlist dirs carefully.",
    tags: ["mcp", "files", "local"],
    worksWith: ["claude-desktop", "cursor", "claude-code"],
    skillLevel: "intermediate",
    pricing: "free",
    taskKeywords: ["files", "folder", "local", "organize", "batch", "documents"],
    configSnippet: `{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"]
    }
  }
}`,
  },
  {
    id: "mcp-github",
    name: "GitHub MCP",
    description: "Repos, issues, PRs, and code search via the agent.",
    whyUse: "Ship products, portfolio sites, and automations that power a UGC business.",
    category: "github",
    url: "https://github.com/github/github-mcp-server",
    installHint: "Create a GitHub PAT with least privilege; add as env in MCP config.",
    tags: ["mcp", "github", "code"],
    worksWith: ["claude-desktop", "cursor", "claude-code", "vscode"],
    skillLevel: "intermediate",
    pricing: "free",
    taskKeywords: ["github", "code", "repo", "pr", "issue", "git"],
    configSnippet: `{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_TOKEN" }
    }
  }
}`,
  },
  {
    id: "mcp-supabase",
    name: "Supabase MCP",
    description: "Query and manage Supabase projects (DB, auth, edge) from the agent.",
    whyUse: "Build SaaS backends, waitlists, client portals for a creator agency.",
    category: "database",
    url: "https://supabase.com/docs/guides/getting-started/mcp",
    installHint: "Use Supabase dashboard MCP / personal access flow as documented.",
    tags: ["mcp", "database", "supabase", "backend"],
    worksWith: ["claude-desktop", "cursor", "claude-code"],
    skillLevel: "advanced",
    pricing: "freemium",
    taskKeywords: ["database", "sql", "auth", "backend", "saas", "supabase"],
  },
  {
    id: "mcp-postgres",
    name: "Postgres MCP",
    description: "Direct SQL and schema inspection for Postgres databases.",
    whyUse: "Data products, analytics for content performance, client reporting DBs.",
    category: "database",
    installHint: "Point DATABASE_URL at a read-scoped user when possible.",
    tags: ["mcp", "postgres", "sql"],
    worksWith: ["claude-desktop", "cursor", "claude-code"],
    skillLevel: "advanced",
    pricing: "free",
    taskKeywords: ["sql", "postgres", "database", "analytics"],
  },
  {
    id: "mcp-memory",
    name: "Memory MCP",
    description: "Persistent memory graph so agents remember brand, clients, preferences.",
    whyUse: "Keep UGC rates, niches, and client notes across chats.",
    category: "memory",
    installHint: "Install official memory server; keep path private.",
    tags: ["mcp", "memory", "context"],
    worksWith: ["claude-desktop", "cursor", "claude-code"],
    skillLevel: "intermediate",
    pricing: "free",
    taskKeywords: ["memory", "remember", "notes", "context", "brand"],
  },
  {
    id: "mcp-fetch",
    name: "Fetch MCP",
    description: "HTTP fetch of public URLs into the agent context.",
    whyUse: "Pull brand briefs, product pages, and competitor sites into a strategy session.",
    category: "search",
    installHint: "npx @modelcontextprotocol/server-fetch",
    tags: ["mcp", "http", "research"],
    worksWith: ["claude-desktop", "cursor", "claude-code"],
    skillLevel: "beginner",
    pricing: "free",
    taskKeywords: ["fetch", "url", "research", "read page", "blog"],
  },
  {
    id: "mcp-brave-search",
    name: "Brave Search MCP",
    description: "Web search from the agent with Brave Search API.",
    whyUse: "Live research on niches, rates, viral formats, and brands hiring UGC.",
    category: "search",
    url: "https://brave.com/search/api/",
    installHint: "Get Brave Search API key → set in MCP env.",
    tags: ["mcp", "search", "research"],
    worksWith: ["claude-desktop", "cursor", "claude-code"],
    skillLevel: "intermediate",
    pricing: "freemium",
    taskKeywords: ["search", "research", "trends", "news", "market"],
  },
  {
    id: "mcp-puppeteer",
    name: "Puppeteer MCP",
    description: "Headless Chrome control for screenshots and flows.",
    whyUse: "Capture product pages and proof for UGC briefs.",
    category: "browser",
    installHint: "Install puppeteer MCP package; allowlist domains you control.",
    tags: ["mcp", "browser", "screenshots"],
    worksWith: ["claude-desktop", "cursor", "claude-code"],
    skillLevel: "advanced",
    pricing: "free",
    taskKeywords: ["screenshot", "browser", "scrape", "pdf"],
  },
  {
    id: "mcp-notion",
    name: "Notion MCP",
    description: "Read/write Notion pages and databases from the agent.",
    whyUse: "Client CRMs, content calendars, UGC SOP wikis.",
    category: "productivity",
    url: "https://developers.notion.com",
    installHint: "Create Notion integration token → share pages → wire MCP env.",
    tags: ["mcp", "notion", "docs", "crm"],
    worksWith: ["claude-desktop", "cursor", "chatgpt"],
    skillLevel: "intermediate",
    pricing: "freemium",
    taskKeywords: ["notion", "wiki", "docs", "calendar", "crm", "sop"],
  },
  {
    id: "mcp-slack",
    name: "Slack MCP",
    description: "Send messages and read channels your bot can access.",
    whyUse: "Client comms, deliverables pings, team ops for a UGC studio.",
    category: "communications",
    installHint: "Create Slack app token with minimal scopes.",
    tags: ["mcp", "slack", "chat"],
    worksWith: ["claude-desktop", "cursor", "claude-code"],
    skillLevel: "intermediate",
    pricing: "freemium",
    taskKeywords: ["slack", "team", "message", "notify"],
  },
  {
    id: "mcp-gmail",
    name: "Gmail / Google Workspace MCP",
    description: "Draft and manage email (via official or community MCP / Zapier).",
    whyUse: "Pitch brands, follow up on UGC deals, send media kits.",
    category: "communications",
    installHint: "Prefer Zapier MCP or Google’s supported connector; avoid broad mail scopes.",
    tags: ["mcp", "gmail", "email", "outreach"],
    worksWith: ["claude-desktop", "cursor", "chatgpt"],
    skillLevel: "intermediate",
    pricing: "freemium",
    taskKeywords: ["email", "gmail", "outreach", "pitch", "cold email", "ugc", "money"],
  },
  {
    id: "mcp-stripe",
    name: "Stripe MCP",
    description: "Query payments, customers, and products (read-heavy setups recommended).",
    whyUse: "Track revenue from digital products, retainers, invoices.",
    category: "payments",
    url: "https://stripe.com/docs",
    installHint: "Restricted API key; never expose write keys in chat logs.",
    tags: ["mcp", "stripe", "payments", "revenue"],
    worksWith: ["claude-desktop", "cursor", "claude-code"],
    skillLevel: "advanced",
    pricing: "paid",
    taskKeywords: ["stripe", "payment", "invoice", "revenue", "money", "saas"],
  },
  {
    id: "mcp-figma",
    name: "Figma MCP",
    description: "Inspect design files and export context into the agent.",
    whyUse: "Turn brand kits into UGC scripts, storyboards, and ad frames.",
    category: "design",
    url: "https://www.figma.com",
    installHint: "Use official or community Figma MCP with a personal access token.",
    tags: ["mcp", "figma", "design"],
    worksWith: ["claude-desktop", "cursor"],
    skillLevel: "intermediate",
    pricing: "freemium",
    taskKeywords: ["figma", "design", "ui", "brand kit", "creative"],
  },
  {
    id: "mcp-sqlite",
    name: "SQLite MCP",
    description: "Local SQL database for lightweight storage.",
    whyUse: "Track brand leads, rates, posts — private on your machine.",
    category: "database",
    installHint: "Point at a local .db file path in config.",
    tags: ["mcp", "sqlite", "local"],
    worksWith: ["claude-desktop", "cursor", "claude-code"],
    skillLevel: "intermediate",
    pricing: "free",
    taskKeywords: ["sqlite", "local db", "tracker", "crm"],
  },
  {
    id: "mcp-sequential-thinking",
    name: "Sequential Thinking MCP",
    description: "Structured multi-step reasoning tool for complex plans.",
    whyUse: "Force deeper plans for businesses, funnels, and multi-platform content systems.",
    category: "devtools",
    installHint: "Install official sequential-thinking MCP server package.",
    tags: ["mcp", "reasoning", "planning"],
    worksWith: ["claude-desktop", "cursor", "claude-code"],
    skillLevel: "beginner",
    pricing: "free",
    taskKeywords: ["plan", "strategy", "reason", "complex", "business"],
  },
  {
    id: "mcp-youtube",
    name: "YouTube / transcript tools MCP",
    description: "Pull video metadata/transcripts (community servers vary).",
    whyUse: "Study viral UGC formats and turn videos into scripts.",
    category: "other",
    installHint: "Use a maintained community YouTube MCP; verify publisher before install.",
    tags: ["mcp", "youtube", "ugc", "transcript"],
    worksWith: ["claude-desktop", "cursor"],
    skillLevel: "intermediate",
    pricing: "free",
    taskKeywords: ["youtube", "transcript", "viral", "ugc", "script"],
  },
  {
    id: "mcp-linear",
    name: "Linear MCP",
    description: "Issues and project tracking for product teams.",
    whyUse: "Run a content/product studio with clear tickets.",
    category: "productivity",
    url: "https://linear.app",
    installHint: "Linear API key in MCP env.",
    tags: ["mcp", "linear", "tasks"],
    worksWith: ["claude-desktop", "cursor", "claude-code"],
    skillLevel: "intermediate",
    pricing: "freemium",
    taskKeywords: ["linear", "tasks", "sprint", "project"],
  },
  {
    id: "mcp-sentry",
    name: "Sentry MCP",
    description: "Read production errors and suggest fixes.",
    whyUse: "Ship client sites/apps without drowning in stack traces.",
    category: "devtools",
    url: "https://sentry.io",
    installHint: "Sentry auth token with project read scope.",
    tags: ["mcp", "sentry", "debug"],
    worksWith: ["cursor", "claude-code", "claude-desktop"],
    skillLevel: "advanced",
    pricing: "freemium",
    taskKeywords: ["error", "bug", "sentry", "production", "debug"],
  },
  {
    id: "mcp-vercel",
    name: "Vercel MCP",
    description: "Deployments, projects, env vars, and logs for apps hosted on Vercel.",
    whyUse: "This site runs on Vercel — the official MCP talks to the same dashboard from Cursor or Claude.",
    category: "devtools",
    url: "https://vercel.com/docs/mcp",
    docsUrl: "https://vercel.com/docs/mcp",
    installHint: "Add the official Vercel MCP (OAuth) from vercel.com/docs/mcp in Cursor or Claude.",
    tags: ["mcp", "vercel", "deploy", "nextjs"],
    worksWith: ["cursor", "claude-desktop", "claude-code", "vscode"],
    skillLevel: "beginner",
    pricing: "free",
    taskKeywords: ["vercel", "deploy", "next.js", "nextjs", "hosting", "preview", "environment variable"],
  },
  {
    id: "mcp-aws-docs",
    name: "AWS / cloud docs MCP",
    description: "Query cloud documentation in-context (community variants).",
    whyUse: "Deploy AI automations and backends that scale a creator business.",
    category: "devtools",
    installHint: "Prefer read-only docs servers; never expose root cloud keys.",
    tags: ["mcp", "aws", "cloud"],
    worksWith: ["cursor", "claude-code"],
    skillLevel: "advanced",
    pricing: "free",
    taskKeywords: ["aws", "cloud", "deploy", "infrastructure"],
  },
];

export function getMcpsForTask(task: string, limit = 12): McpServer[] {
  const t = task.toLowerCase();
  return MCP_SERVERS.map((s) => {
    let score = 0;
    for (const kw of s.taskKeywords) {
      if (t.includes(kw)) score += kw.split(" ").length * 3;
    }
    for (const tag of s.tags) {
      if (t.includes(tag)) score += 2;
    }
    // Mild default relevance so list never feels empty for business/creator tasks
    if (t.match(/money|business|brand|ugc|content|market|automat|email|research/)) {
      if (["automation", "search", "browser", "communications"].includes(s.category)) score += 1;
    }
    return { s, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}

export const MCP_CATEGORIES = [
  "all",
  "automation",
  "browser",
  "files",
  "github",
  "database",
  "search",
  "productivity",
  "design",
  "communications",
  "payments",
  "devtools",
  "memory",
  "other",
] as const;
