/**
 * Hardcore scraping + web-intel agent stack.
 * These are discovery + install guides — users must obey site ToS, robots.txt, and law.
 * No unauthorized access tooling; public-web research and self-owned data only.
 */

import { FREE_INSTALL_REPOS, type FreeInstallRepo } from "./install-repos";

export interface ScraperPlaybook {
  id: string;
  title: string;
  goal: string;
  legalNote: string;
  stack: string[];
  repoIds: string[];
  steps: string[];
  plethoraprompt: string;
}

export const HARDCORE_SCRAPER_PLAYBOOKS: ScraperPlaybook[] = [
  {
    id: "llm-ready-site-dump",
    title: "Turn any public site into LLM-ready knowledge",
    goal: "Crawl a public docs/blog site → clean markdown → chat with it locally.",
    legalNote: "Only crawl what you have rights to. Respect robots.txt, rate limits, and copyright.",
    stack: ["Crawl4AI or Firecrawl", "AnythingLLM / Dify", "Ollama"],
    repoIds: ["crawl4ai", "firecrawl", "anythingllm", "ollama"],
    steps: [
      "Install Crawl4AI or self-host Firecrawl.",
      "Point at public starting URL (docs, blog, help center).",
      "Export markdown/JSON.",
      "Import into AnythingLLM or Dify.",
      "Ask research questions with your local or cloud agent.",
    ],
    plethoraprompt:
      "You are a research engineer. Given markdown crawled from [SITE], extract claims, product features, pricing signals, and open questions. Flag anything that needs human verification.",
  },
  {
    id: "competitor-ad-spy",
    title: "Competitor & creative research pack",
    goal: "Collect public ad creatives + landing copy into a battlecard.",
    legalNote: "Use public ad libraries and public pages only (Meta Ads Library, TikTok Creative Center).",
    stack: ["Playwright / browser-use", "Trafilatura", "Claude or local LLM"],
    repoIds: ["playwright", "browser-use", "trafilatura"],
    steps: [
      "List competitor brand names.",
      "Pull public ads from Meta Ads Library / TikTok Creative Center (manual export ok).",
      "Crawl public landing pages with Trafilatura/Playwright.",
      "Feed into Plethora Prompt Assistant for battlecards and UGC angles.",
    ],
    plethoraprompt:
      "Build a competitive creative brief from the attached public ad copies and landing text. Output hooks that work, angles to avoid, and 10 UGC scripts.",
  },
  {
    id: "always-on-search-agent",
    title: "Always-on open-web research agent",
    goal: "Self-hosted search (SearXNG) + agent loop that never starves for sources.",
    legalNote: "SearXNG queries public engines; still obey local law and site rules when following links.",
    stack: ["SearXNG", "CrewAI / AutoGen", "browser-use"],
    repoIds: ["searxng", "crewai", "browser-use", "crawl4ai"],
    steps: [
      "Docker-run SearXNG.",
      "Give your agent a search tool wired to SearXNG.",
      "For top N results, crawl with Crawl4AI.",
      "Synthesize weekly research memo.",
    ],
    plethoraprompt:
      "Research [TOPIC]. Use multiple sources, quote with links, separate facts vs opinion, and end with action steps.",
  },
  {
    id: "ugc-trend-monitor",
    title: "UGC / short-form trend monitor",
    goal: "Track public viral patterns (via public pages + yt-dlp samples you may legally use).",
    legalNote: "Do not bypass platform paywalls or scrape private accounts. Prefer official Creative Center + public pages.",
    stack: ["yt-dlp (with rights awareness)", "browser-use", "transcript tools"],
    repoIds: ["yt-dlp", "browser-use", "trafilatura"],
    steps: [
      "Use TikTok Creative Center / public hashtag pages for trends.",
      "Optionally sample public videos you may analyze under fair use / your jurisdiction rules.",
      "Transcribe → feed scripts into Plethora for hooks.",
    ],
    plethoraprompt:
      "From these trend notes and transcripts, produce 15 hooks and 5 full UGC scripts for niche [NICHE].",
  },
  {
    id: "self-host-watchers",
    title: "Self-hosted web watchers (Huginn + n8n)",
    goal: "Agents that wake when the internet changes (RSS, price page public HTML, GitHub releases).",
    legalNote: "Poll politely. Prefer APIs/RSS when available.",
    stack: ["Huginn", "n8n", "notification channel"],
    repoIds: ["huginn", "n8n"],
    steps: [
      "Deploy Huginn or n8n.",
      "Create agents for RSS + public pages.",
      "On change → notify Slack/email + enqueue LLM summary job.",
    ],
    plethoraprompt:
      "Summarize what changed and why it matters for [GOAL]. Propose next action in under 10 bullets.",
  },
];

/** Extra agent discovery lists (repos that list more agents) */
export const AGENT_DISCOVERY_LISTS: {
  name: string;
  url: string;
  description: string;
  howToUse: string;
}[] = [
  {
    name: "Awesome AI Agents",
    url: "https://github.com/e2b-dev/awesome-ai-agents",
    description: "Living list of AI agents and frameworks.",
    howToUse: "Scan Weekly → bookmark 3 new agents → install one that matches your goal.",
  },
  {
    name: "Awesome LLM Apps",
    url: "https://github.com/Shubhamsaboo/awesome-llm-apps",
    description: "Practical LLM app & agent projects with code.",
    howToUse: "Clone a starter closest to your task; swap in Plethora prompts.",
  },
  {
    name: "Best-of AI lists (meta)",
    url: "https://github.com/best-of-ai/ai-directories",
    description: "Meta list of AI directories and resources.",
    howToUse: "Jump to specialized directories when Plethora shortlist is not enough.",
  },
  {
    name: "Awesome Web Scraping",
    url: "https://github.com/lorien/awesome-web-scraping",
    description: "Scraping libraries and tools across languages.",
    howToUse: "Pick language stack → attach scraper to your agent.",
  },
  {
    name: "Awesome Crawler",
    url: "https://github.com/BruceDone/awesome-crawler",
    description: "Crawler frameworks and data extraction.",
    howToUse: "For hardcore bulk jobs beyond Crawl4AI.",
  },
  {
    name: "MCP servers (awesome-ish indexes)",
    url: "https://github.com/modelcontextprotocol/servers",
    description: "Official starting point for agent tools.",
    howToUse: "Add fetch/filesystem/browser MCP so agents reach the web safely from chat.",
  },
  {
    name: "Firecrawl open source",
    url: "https://github.com/mendableai/firecrawl",
    description: "Site → LLM data pipeline.",
    howToUse: "Self-host when you outgrow manual copy-paste research.",
  },
  {
    name: "browser-use agents",
    url: "https://github.com/browser-use/browser-use",
    description: "Agents that drive browsers.",
    howToUse: "When pure HTTP scrape fails (JS sites), step up to browser-use.",
  },
];

export function resolveRepo(id: string): FreeInstallRepo | undefined {
  return FREE_INSTALL_REPOS.find((r) => r.id === id);
}

export function scrapeStackForTask(task: string): FreeInstallRepo[] {
  const t = task.toLowerCase();
  const boosted =
    t.match(/scrape|crawl|research|internet|competitor|data|agent|web/)
      ? FREE_INSTALL_REPOS.filter(
          (r) =>
            r.category === "scraper" ||
            r.category === "browser-agent" ||
            r.category === "agent" ||
            r.hardcore
        )
      : FREE_INSTALL_REPOS.filter((r) => r.category === "scraper" || r.hardcore);
  return boosted.slice(0, 14);
}
