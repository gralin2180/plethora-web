import { AI_CATALOG } from "./ai-catalog";
import { PLATFORM_TOOLS } from "./tools-registry";
import { buildRefinedPrompt } from "./prompt-engine";
import { getAgentGuides, recommendAgentsForTask } from "./agent-setup";
import { getMcpsForTask } from "./mcp-registry";
import {
  directoriesForBudget,
  searchHintsForTask,
  type BudgetTier,
} from "./ai-directories";
import { reposForTask } from "./install-repos";
import { AGENT_DISCOVERY_LISTS } from "./hardcore-scrapers";
import type {
  AgentPathStep,
  AiCategory,
  AiPlatform,
  AiTool,
  TaskRecommendation,
  ToolPlaybookItem,
} from "./types";

const CATEGORY_KEYWORDS: Record<AiCategory, string[]> = {
  text: ["write", "email", "blog", "caption", "script", "copy", "text", "article", "essay", "letter", "pitch"],
  image: ["image", "photo", "picture", "visual", "thumbnail", "logo", "design", "poster", "banner", "illustration"],
  video: ["video", "reel", "tiktok", "youtube", "clip", "edit video", "b-roll", "podcast video", "ugc"],
  audio: ["voice", "audio", "music", "podcast", "voiceover", "narration", "song", "tts"],
  code: ["code", "website", "app", "build", "program", "debug", "api", "react", "software", "developer"],
  marketing: [
    "ad", "ads", "marketing", "campaign", "facebook", "google ads", "instagram", "seo", "landing",
    "ugc", "brand", "money", "monetize", "creator", "influencer", "sell", "client",
  ],
  automation: ["automate", "workflow", "integrate", "zapier", "mcp", "connect apps", "pipeline"],
  research: ["research", "find", "competitor", "market", "trends", "analyze market", "study", "rates"],
  productivity: ["summarize", "organize", "plan", "schedule", "productivity", "notes", "tasks", "crm"],
};

/** Expand slang / goals into keywords the catalog understands */
const SYNONYMS: Record<string, string[]> = {
  money: ["make money", "monetize", "paid", "income", "revenue", "get paid", "earn"],
  ugc: ["ugc", "user generated", "user-generated", "creator content", "brand content", "content creator"],
  business: ["shop", "store", "brand", "startup", "side hustle", "freelance"],
  ads: ["advertisement", "advert", "paid social", "meta ads", "tiktok ads"],
};

const PLATFORM_LABELS: Record<AiPlatform, string> = {
  web: "Web apps & SaaS",
  local: "Local / offline AI",
  mcp: "MCP servers (agent tools)",
  ide: "IDE agents",
  terminal: "Terminal / CLI agents",
  mobile: "Mobile apps",
  internal: "Plethora tools",
};

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function expandTask(task: string): string {
  let t = normalize(task);
  for (const [canonical, alts] of Object.entries(SYNONYMS)) {
    for (const a of alts) {
      if (t.includes(a) || t.includes(canonical)) {
        t += " " + canonical + " " + alts.join(" ");
        break;
      }
    }
  }
  // Phrase expansions
  if (t.includes("wanna") || t.includes("want to") || t.includes("i need")) {
    t += " plan strategy step by step";
  }
  if (t.match(/make money|earn|income|paid/)) {
    t += " marketplace outreach pitch client rates portfolio";
  }
  if (t.includes("ugc")) {
    t += " tiktok instagram reels brand deal script hook edit capcut faceless avatar";
  }
  return t;
}

function scoreMatch(text: string, keywords: string[]): number {
  const normalized = normalize(text);
  let score = 0;
  for (const kw of keywords) {
    if (normalized.includes(kw)) score += Math.max(1, kw.split(" ").length);
  }
  return score;
}

export function detectCategories(task: string): AiCategory[] {
  const expanded = expandTask(task);
  const scores = Object.entries(CATEGORY_KEYWORDS).map(([cat, kws]) => ({
    category: cat as AiCategory,
    score: scoreMatch(expanded, kws),
  }));
  scores.sort((a, b) => b.score - a.score);
  const top = scores.filter((s) => s.score > 0).slice(0, 4);
  return top.length > 0 ? top.map((s) => s.category) : (["marketing", "text"] as AiCategory[]);
}

function rankAiTools(task: string, categories: AiCategory[]): { tool: AiTool; score: number }[] {
  const expanded = expandTask(task);
  const ranked = AI_CATALOG.map((tool) => {
    let score = 0;
    score += scoreMatch(expanded, tool.taskKeywords) * 4;
    score += scoreMatch(expanded, tool.tags) * 3;
    score += scoreMatch(expanded, [tool.name.toLowerCase(), tool.description.toLowerCase()]);
    if (categories.includes(tool.category)) score += 4;
    // Always give base agents a floor for vague tasks
    if (["chatgpt", "claude", "perplexity"].includes(tool.id) && score === 0) score = 2;
    return { tool, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  // Ensure core free agents appear for beginners even if rank is mid
  const ensureIds = ["claude", "chatgpt", "perplexity", "canva-ai"];
  for (const id of ensureIds) {
    if (!ranked.find((r) => r.tool.id === id)) {
      const tool = AI_CATALOG.find((t) => t.id === id);
      if (tool) ranked.push({ tool, score: 1 });
    }
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, 28);
}

function whyForYou(tool: AiTool, task: string): string {
  const t = normalize(task);
  if (tool.id === "claude" || tool.id === "chatgpt") {
    return "Your always-on strategy + copy brain — paste the ready prompt here first.";
  }
  if (tool.tags.includes("ugc") || tool.taskKeywords.some((k) => k.includes("ugc"))) {
    return "Maps directly to UGC / short-form creator work so you can earn or fulfill brand briefs faster.";
  }
  if (t.match(/money|earn|paid/) && tool.taskKeywords.some((k) => ["money", "sell", "outreach", "marketplace"].some((x) => k.includes(x)))) {
    return "Helps you get paid — marketplace, outreach, or sales infrastructure.";
  }
  if (tool.platform === "mcp") {
    return "Gives your AI agent hands (apps/files/browser) so work runs, not just advice.";
  }
  if (tool.category === "research") {
    return "Research layer: find rates, brands, and trends before you create.";
  }
  return `Strong fit for ${tool.category} work related to your goal.`;
}

function buildSkillPath(task: string): AgentPathStep[] {
  const t = normalize(task);
  const internal = rankInternalTools(task).slice(0, 5);
  const externalTop = rankAiTools(task, detectCategories(task))
    .map((r) => r.tool)
    .filter((x) => x.platform === "web" || x.platform === "ide")
    .slice(0, 5);

  const nicheBullets: string[] = [
    ...internal.map(
      (tool) =>
        `In Plethora: ${tool.name} → ${
          tool.slug === "prompt-assistant" || tool.slug === "ai-finder"
            ? `/${tool.slug}`
            : tool.slug === "chat"
              ? "/chat"
              : `/tools/${tool.slug}`
        } — ${tool.actionHint || tool.description.slice(0, 80)}`
    ),
    ...externalTop.map(
      (tool) =>
        `External (optional original): ${tool.name}${tool.url ? ` — ${tool.url}` : ""} — ${tool.howToUse.slice(0, 100)}`
    ),
  ].slice(0, 6);

  if (!nicheBullets.length) {
    nicheBullets.push(
      "In Plethora: Prompt Assistant → /prompt-assistant — turn this goal into a model-ready prompt",
      "In Plethora: AI Finder already matched categories above — scroll to tool cards"
    );
  }

  const tryFirst = internal[0];
  const tryHref = tryFirst
    ? tryFirst.slug === "prompt-assistant" || tryFirst.slug === "ai-finder"
      ? `/${tryFirst.slug}`
      : tryFirst.slug === "chat"
        ? "/chat"
        : `/tools/${tryFirst.slug}`
    : "/prompt-assistant";

  const steps: AgentPathStep[] = [
    {
      order: 1,
      title: "Pick where the AI runs (exactly 1)",
      detail:
        "You need one model chat open. Prefer in-app first so you stay under one roof; use an external model only if you want their specific strengths.",
      exactBullets: [
        "Best first: Plethora Chat (/chat) — after free sign-in or BYOK at /settings/ai-keys connects OpenRouter → 100+ models (Claude, Gemini, DeepSeek, Llama, many Perplexity-routed free models when listed on OpenRouter).",
        "Writing / long reasoning: Claude at claude.ai (paste the Ready-to-paste prompt from step 2).",
        "Speed + web-style answers: pick a Perplexity or search-grounded model via OpenRouter BYOK, or use perplexity.ai in another tab with the same prompt.",
        "Code projects: Cursor Agent at cursor.com with the build prompt.",
      ],
      tryHereHref: "/chat",
      tryHereLabel: "Try chat here now",
      actions: [
        { label: "Plethora Chat", href: "/chat" },
        { label: "AI keys (multi-model BYOK)", href: "/settings/ai-keys" },
        { label: "Claude.ai", href: "https://claude.ai", external: true },
        { label: "Perplexity", href: "https://www.perplexity.ai", external: true },
      ],
    },
    {
      order: 2,
      title: "Use the expert prompt (do this next)",
      detail:
        "Scroll to “Ready-to-paste prompt” on this page, click Copy, paste into the chat you opened in step 1. Replace every [BRACKET] with your niche. Do not invent steps — follow the prompt structure (role → goal → constraints → output format).",
      exactBullets: [
        "Model tip — Claude: keep long context, ask for section headers.",
        "Model tip — Gemini/GPT family: keep instructions at the top; lists beat walls of text.",
        "Model tip — local Llama/Qwen: shorter system rules, explicit “format as markdown”.",
        "Or open Prompt Assistant for clarifying questions first if your goal is messy.",
      ],
      tryHereHref: "/prompt-assistant",
      tryHereLabel: "Open Prompt Engineer here",
      href: "#ready-prompt",
      actions: [
        { label: "Jump to ready prompt", href: "#ready-prompt" },
        { label: "Prompt Assistant", href: "/prompt-assistant" },
        { label: "Multi-model router", href: "/tools/multi-model-router" },
      ],
    },
    {
      order: 3,
      title: "Run these exact tools for your mission",
      detail:
        "Not a vague “stack.” Open each item below. Prefer “Try in Plethora” first; use the external original only if you want that brand’s UI or credits.",
      exactBullets: nicheBullets,
      tryHereHref: tryHref,
      tryHereLabel: tryFirst
        ? `Try ${tryFirst.name} here now`
        : "Try Prompt Assistant now",
      actions: [
        ...internal.slice(0, 3).map((tool) => ({
          label: tool.name,
          href:
            tool.slug === "prompt-assistant" || tool.slug === "ai-finder"
              ? `/${tool.slug}`
              : tool.slug === "chat"
                ? "/chat"
                : `/tools/${tool.slug}`,
        })),
        { label: "Browse all tools", href: "/tools" },
      ],
    },
    {
      order: 4,
      title: "Optional: Plethora MCP (agent can call tools)",
      detail:
        "Install Plethora MCP in Claude Desktop or Cursor so the agent can search our catalog, captions, ping, trading math, etc. without you tab-hopping.",
      exactBullets: [
        "Open /mcp → copy Plethora MCP JSON into Claude Desktop or Cursor.",
        "Or build a custom MCP with the builder at the top of MCP Hub.",
      ],
      tryHereHref: "/mcp#plethora-mcp",
      tryHereLabel: "Install Plethora MCP",
      href: "/mcp#plethora-mcp",
      actions: [
        { label: "Plethora MCP setup", href: "/mcp#plethora-mcp" },
        { label: "Create own MCP", href: "/mcp#create-mcp" },
      ],
    },
  ];

  if (t.match(/code|app|website|saas|debug/)) {
    steps.splice(2, 0, {
      order: 0,
      title: "For code: open Cursor on your folder",
      detail:
        "Download Cursor → File → Open folder with your project → Agent chat → paste the Ready-to-paste prompt. Use Plethora /tools/code-review-agent or cursor-rules inside the site for rules files.",
      exactBullets: [
        "cursor.com → install → open project folder",
        "In Plethora: /tools/cursor-rules and /tools/code-review-agent",
      ],
      tryHereHref: "/tools/cursor-rules",
      tryHereLabel: "Generate Cursor rules here",
      actions: [
        { label: "Cursor", href: "https://cursor.com", external: true },
        { label: "Cursor rules tool", href: "/tools/cursor-rules" },
      ],
    });
  }

  return steps.map((s, i) => ({ ...s, order: i + 1 }));
}

function rankInternalTools(task: string): typeof PLATFORM_TOOLS {
  const expanded = expandTask(task);
  return PLATFORM_TOOLS.map((tool) => ({
    tool,
    score: scoreMatch(expanded, [...tool.taskKeywords, ...tool.tags, tool.description.toLowerCase()]),
  }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((r) => r.tool);
}

function filterByBudget(tools: AiTool[], budget: BudgetTier): AiTool[] {
  if (budget === "any") return tools;
  if (budget === "local_only") {
    const local = tools.filter((t) => t.platform === "local" || t.pricing === "free");
    // Always keep core agents + research for hand-holding even in local_only
    const agents = tools.filter((t) =>
      ["chatgpt", "claude", "perplexity"].includes(t.id)
    );
    const merged = [...local];
    for (const a of agents) {
      if (!merged.find((m) => m.id === a.id)) merged.push(a);
    }
    return merged;
  }
  if (budget === "free") {
    return tools.filter((t) => t.pricing === "free" || t.pricing === "freemium");
  }
  if (budget === "low") {
    return tools.filter((t) => t.pricing !== "paid" || t.tags.includes("ugc"));
  }
  return tools;
}

export function recommendAiForTask(
  task: string,
  budget: BudgetTier = "any"
): TaskRecommendation {
  const categories = detectCategories(task);
  const ranked = rankAiTools(task, categories);
  let aiTools = ranked.map((r) => r.tool);
  aiTools = filterByBudget(aiTools, budget);

  // Rebuild ranked playbooks only for filtered tools, preserve scores
  const scoreMap = new Map(ranked.map((r) => [r.tool.id, r.score]));
  const internalTools = rankInternalTools(task);

  const playbooks: ToolPlaybookItem[] = aiTools.map((tool) => ({
    tool,
    score: scoreMap.get(tool.id) ?? 1,
    whyForYou: whyForYou(tool, task),
    howTo: tool.howToUse,
  }));

  const groupedByPlatform = aiTools.reduce(
    (acc, tool) => {
      if (!acc[tool.platform]) acc[tool.platform] = [];
      acc[tool.platform].push(tool);
      return acc;
    },
    {} as Record<AiPlatform, AiTool[]>
  );

  const agentIds = recommendAgentsForTask(task);
  const recommendedAgents = getAgentGuides(agentIds).map((g) => ({
    id: g.id,
    name: g.name,
    bestFor: g.bestFor,
    difficulty: g.difficulty,
    timeToSetup: g.timeToSetup,
    url: g.url,
    steps: g.steps,
    pasteHint: g.pasteHint,
    mcpSupport: g.mcpSupport,
  }));

  const mcpSuggestions = getMcpsForTask(task, 10).map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    whyUse: m.whyUse,
    url: m.url,
    installHint: m.installHint,
  }));

  const dirs = directoriesForBudget(budget);
  const beginnerTip =
    "Exact path: (1) Pick chat: Plethora Chat or Claude/Perplexity tab (2) Copy Ready-to-paste prompt (3) Open the listed Plethora tools one by one (4) Optional Plethora MCP. Multi-model: OpenRouter BYOK reaches dozens of LLMs under one key — we route prompts, not host every vendor’s proprietary closed API without their terms.";

  return {
    taskSummary: task,
    detectedCategories: categories,
    skillPath: buildSkillPath(task),
    playbooks,
    internalTools:
      internalTools.length > 0
        ? internalTools
        : PLATFORM_TOOLS.filter((t) =>
            ["prompt-assistant", "ai-finder", "hook-generator", "ad-copy"].includes(t.id)
          ),
    aiTools: aiTools.length > 0 ? aiTools : AI_CATALOG.slice(0, 12),
    groupedByPlatform,
    mcpSuggestions,
    recommendedAgents,
    beginnerTip,
    refinedPromptSuggestion: buildRefinedPrompt(
      task,
      task.toLowerCase().includes("money")
        ? { outcome: "More sales", details: task }
        : { details: task }
    ),
    directoryLinks: dirs.map((d) => ({
      id: d.id,
      name: d.name,
      url: d.url,
      description: d.description,
      howToUse: d.howToUse,
      updateNote: d.updateNote,
    })),
    searchHints: searchHintsForTask(task, budget),
    budget,
    neverGiveUpNote:
      "If nothing above fits: open the directories, run the search hints, try 3 free tools, then Install Hub scrapers/agents. We always leave you a next step.",
    installRepos: reposForTask(task, {
      hardcoreOnly: /hardcore|scrape|crawl|agent/.test(task.toLowerCase()),
      limit: 12,
    }).map((r) => ({
      id: r.id,
      name: r.name,
      repoUrl: r.repoUrl,
      description: r.description,
      howToSetUp: r.howToSetUp,
      quickInstall: r.quickInstall,
      hardcore: r.hardcore,
      category: r.category,
    })),
    agentDiscoveryLists: AGENT_DISCOVERY_LISTS,
  };
}

// Prompt construction lives in prompt-engine (expert templates, not generic fluff).
export {
  generateClarifyingQuestions,
  buildRefinedPrompt,
  getPromptMeta,
  detectIntent,
} from "./prompt-engine";

export { PLATFORM_LABELS };
