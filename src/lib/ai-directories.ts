/**
 * External AI directories + awesome lists — keep users swimming in options.
 * Prefer sending users to frequently updated listings when in-app catalog is incomplete.
 */

export type BudgetTier = "free" | "low" | "mid" | "high" | "local_only" | "any";

export interface AiDirectory {
  id: string;
  name: string;
  url: string;
  description: string;
  /** What user gets when we "hold their hand" to this directory */
  howToUse: string;
  tags: string[];
  budgets: BudgetTier[];
  kind: "directory" | "github" | "newsletter" | "marketplace" | "research";
  updateNote: string;
}

export const AI_DIRECTORIES: AiDirectory[] = [
  {
    id: "aitoolsdirectory",
    name: "AI Tools Directory",
    url: "https://aitoolsdirectory.com/",
    description: "Large searchable catalog of AI tools by category.",
    howToUse:
      "Search your task keyword (e.g. UGC, ads, SEO). Open 5 free/freemium tools. Compare with Plethora’s shortlist.",
    tags: ["catalog", "general", "search"],
    budgets: ["free", "low", "mid", "high", "any"],
    kind: "directory",
    updateNote: "Community/web directory — refresh often.",
  },
  {
    id: "aixploria",
    name: "AIxploria",
    url: "https://www.aixploria.com/en/",
    description: "Updated AI tools listing with categories and free filters.",
    howToUse: "Filter Free tools first if budget is zero, then expand by use case.",
    tags: ["catalog", "free-filter", "general"],
    budgets: ["free", "low", "mid", "any"],
    kind: "directory",
    updateNote: "Frequently updated public directory.",
  },
  {
    id: "best-of-ai-directories",
    name: "best-of-ai / AI directories (GitHub)",
    url: "https://github.com/best-of-ai/ai-directories",
    description: "GitHub meta-list of AI directories and resources.",
    howToUse:
      "Open the repo → pick multiple directories → run the same search query on each for max coverage.",
    tags: ["github", "meta", "directories"],
    budgets: ["free", "any", "local_only"],
    kind: "github",
    updateNote: "Repo-based; star/watch for updates.",
  },
  {
    id: "futuretools",
    name: "FutureTools",
    url: "https://www.futuretools.io/",
    description: "Curated new AI tools with newsletter discovery.",
    howToUse: "Browse newest + categories matching your task; save 3 tools to try this week.",
    tags: ["catalog", "new-tools"],
    budgets: ["free", "low", "mid", "high", "any"],
    kind: "directory",
    updateNote: "Matt Wolfe / community — rapidly updated.",
  },
  {
    id: "theresanaiforthat",
    name: "There's An AI For That",
    url: "https://theresanaiforthat.com/",
    description: "Task-oriented “AI for X” search at scale.",
    howToUse: "Type your exact job-to-be-done. Open free tools first, then freemium.",
    tags: ["search", "tasks"],
    budgets: ["free", "low", "mid", "high", "any"],
    kind: "directory",
    updateNote: "Large index — good when niche is weird.",
  },
  {
    id: "toolify",
    name: "Toolify.ai",
    url: "https://www.toolify.ai/",
    description: "AI tool rankings and traffic-style discovery.",
    howToUse: "Sort by growth/rank in your category to find tools people actually use.",
    tags: ["rankings", "catalog"],
    budgets: ["free", "low", "mid", "high", "any"],
    kind: "directory",
    updateNote: "Ranking data changes frequently.",
  },
  {
    id: "producthunt-ai",
    name: "Product Hunt — AI",
    url: "https://www.producthunt.com/topics/artificial-intelligence",
    description: "Launch-day tools and early products.",
    howToUse: "Filter AI topic; try free launches before they paywall.",
    tags: ["launches", "early"],
    budgets: ["free", "low", "any"],
    kind: "directory",
    updateNote: "Daily launches.",
  },
  {
    id: "awesome-chatgpt",
    name: "awesome-chatgpt (GitHub)",
    url: "https://github.com/humanloop/awesome-chatgpt",
    description: "Curated prompts, tools, and resources ecosystem (and similar awesome lists).",
    howToUse: "Mine lists for free prompts/tools adjacent to your goal.",
    tags: ["github", "prompts", "lists"],
    budgets: ["free", "any"],
    kind: "github",
    updateNote: "Watch repo; community PRs.",
  },
  {
    id: "awesome-local-ai",
    name: "Awesome local AI / self-hosted lists",
    url: "https://github.com/janhq/awesome-local-ai",
    description: "Pointers to local models, UIs, and stacks for GPU PCs.",
    howToUse: "If budget is local-only, pick a stack (Ollama/Jan/etc.) and a model size that fits VRAM.",
    tags: ["local", "gpu", "self-hosted"],
    budgets: ["free", "local_only", "any"],
    kind: "github",
    updateNote: "Multiple awesome-local-* repos exist; cross-check.",
  },
  {
    id: "hugging-face-spaces",
    name: "Hugging Face Spaces",
    url: "https://huggingface.co/spaces",
    description: "Free demo apps for models (image, audio, LLM) shared by community.",
    howToUse: "Search task → try Spaces demos zero-cost before paid SaaS.",
    tags: ["free", "demos", "models"],
    budgets: ["free", "low", "local_only", "any"],
    kind: "marketplace",
    updateNote: "Always new Spaces.",
  },
  {
    id: "github-topic-ai",
    name: "GitHub topic: artificial-intelligence",
    url: "https://github.com/topics/artificial-intelligence",
    description: "Open-source AI projects and tools.",
    howToUse: "Sort by recently updated / stars; prefer MIT/Apache for commercial freeness.",
    tags: ["oss", "github"],
    budgets: ["free", "local_only", "any"],
    kind: "github",
    updateNote: "Live OSS.",
  },
  {
    id: "ohmygpt-alternatives",
    name: "AlternativeTo — AI category",
    url: "https://alternativeto.net/category/ai-and-machine-learning/",
    description: "Find free/OSS alternatives to paid AI products.",
    howToUse: "Search the paid tool you can’t afford → filter Open Source / Free.",
    tags: ["alternatives", "budget"],
    budgets: ["free", "low", "any"],
    kind: "directory",
    updateNote: "Community alternatives.",
  },
  {
    id: "awesome-ai-agents",
    name: "Awesome AI Agents (GitHub)",
    url: "https://github.com/e2b-dev/awesome-ai-agents",
    description: "Curated list of AI agents and frameworks that keep growing.",
    howToUse: "Find a free agent matching your task → open Install Hub for setup twins.",
    tags: ["agents", "github", "hardcore"],
    budgets: ["free", "local_only", "any"],
    kind: "github",
    updateNote: "Actively maintained list.",
  },
  {
    id: "awesome-web-scraping",
    name: "Awesome Web Scraping",
    url: "https://github.com/lorien/awesome-web-scraping",
    description: "Scraper libraries and stacks across languages.",
    howToUse: "Pick Scrapy/Playwright/Colly → wire into a Plethora research playbook.",
    tags: ["scrape", "github", "hardcore"],
    budgets: ["free", "local_only", "any"],
    kind: "github",
    updateNote: "Classic meta-list for scrapers.",
  },
  {
    id: "topai-tools",
    name: "TopAI.tools",
    url: "https://topai.tools/",
    description: "AI tools directory with categories and free filters.",
    howToUse: "Browse by use case; shortlist freemium first on zero budget.",
    tags: ["catalog", "general"],
    budgets: ["free", "low", "mid", "high", "any"],
    kind: "directory",
    updateNote: "Public web directory.",
  },
  {
    id: "ai-collection",
    name: "AI Collection",
    url: "https://www.thataicollection.com/",
    description: "Visual AI tools collection.",
    howToUse: "Explore categories you rarely search — discover niche free tools.",
    tags: ["catalog", "visual"],
    budgets: ["free", "low", "any"],
    kind: "directory",
    updateNote: "Curated collection site.",
  },
];

export const BUDGET_OPTIONS: { id: BudgetTier; label: string; hint: string }[] = [
  { id: "any", label: "Any budget", hint: "Show everything." },
  { id: "free", label: "$0 only", hint: "Free tiers, OSS, local, freemium trials." },
  { id: "low", label: "Low ($1–30/mo)", hint: "Cheap SaaS + free stack." },
  { id: "mid", label: "Mid ($30–100/mo)", hint: "Serious freelancers / small brands." },
  { id: "high", label: "High ($100+/mo)", hint: "Teams and paid stacks OK." },
  { id: "local_only", label: "Local GPU only", hint: "Prefer offline/self-hosted; still show free web when needed." },
];

export function directoriesForBudget(budget: BudgetTier): AiDirectory[] {
  if (budget === "any") return AI_DIRECTORIES;
  return AI_DIRECTORIES.filter((d) => d.budgets.includes(budget) || d.budgets.includes("any"));
}

export function searchHintsForTask(task: string, budget: BudgetTier): string[] {
  const base = task.trim() || "AI tools";
  const free = budget === "free" || budget === "local_only" || budget === "low";
  return [
    `${base}${free ? " free" : ""}`,
    `${base} open source`,
    `${base} API`,
    budget === "local_only" ? `${base} local LLM GPU` : `${base} best tools 2026`,
  ];
}
