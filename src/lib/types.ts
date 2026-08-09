export type Audience = "creator" | "marketer" | "developer" | "beginner" | "general" | "hardcore";

export type UserSegment = "casual" | "hardcore";

export type SubscriptionPlan = "free" | "pro" | "team" | "hardcore" | "hardcore-all-access";

export type AiCategory =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "code"
  | "marketing"
  | "automation"
  | "research"
  | "productivity";

export type AiPlatform =
  | "web"
  | "local"
  | "mcp"
  | "ide"
  | "terminal"
  | "mobile"
  | "internal";

export type PricingTier = "free" | "freemium" | "paid";

export interface AiTool {
  id: string;
  name: string;
  description: string;
  /** How a beginner uses this tool for a real outcome */
  howToUse: string;
  category: AiCategory;
  platform: AiPlatform;
  pricing: PricingTier;
  url?: string;
  tags: string[];
  bestFor: Audience[];
  skillLevel: "beginner" | "intermediate" | "advanced" | "expert";
  taskKeywords: string[];
}

/** Enriched recommendation card for AI Finder */
export interface ToolPlaybookItem {
  tool: AiTool;
  whyForYou: string;
  howTo: string;
  score: number;
}

export interface AgentPathStep {
  order: number;
  title: string;
  /** Exact what to do — no vague “use the stack” */
  detail: string;
  /** Primary external or internal link */
  href?: string;
  /** Run inside Plethora */
  tryHereHref?: string;
  tryHereLabel?: string;
  /** Concrete bullets (tool names + 1-line how) */
  exactBullets?: string[];
  actions?: { label: string; href: string; external?: boolean }[];
}

export interface PlatformTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  freeRunsPerDay: number;
  isPro: boolean;
  tags: string[];
  taskKeywords: string[];
  /** Suggested models for premium API later; shown as guidance now */
  bestModels?: string[];
  /** Short visual CTA under the title */
  actionHint?: string;
  /** How the tool page runs */
  runner?: "free-utility" | "prompt-studio" | "link-hub" | "app-page";
}

export interface ClarifyingQuestion {
  id: string;
  question: string;
  options?: string[];
  placeholder?: string;
  /** When true (default for option questions), users can pick several choices */
  multiSelect?: boolean;
}

export interface PromptSession {
  rawInput: string;
  detectedIntent: string;
  questions: ClarifyingQuestion[];
  answers: Record<string, string>;
  refinedPrompt?: string;
  suggestedTools?: string[];
}

export interface TaskRecommendation {
  taskSummary: string;
  detectedCategories: AiCategory[];
  skillPath: AgentPathStep[];
  playbooks: ToolPlaybookItem[];
  internalTools: PlatformTool[];
  aiTools: AiTool[];
  groupedByPlatform: Record<AiPlatform, AiTool[]>;
  mcpSuggestions: {
    id: string;
    name: string;
    description: string;
    whyUse: string;
    url?: string;
    installHint: string;
  }[];
  recommendedAgents: {
    id: string;
    name: string;
    bestFor: string;
    difficulty: string;
    timeToSetup: string;
    url: string;
    steps: string[];
    pasteHint: string;
    mcpSupport: string;
  }[];
  beginnerTip?: string;
  refinedPromptSuggestion?: string;
  directoryLinks?: {
    id: string;
    name: string;
    url: string;
    description: string;
    howToUse: string;
    updateNote: string;
  }[];
  searchHints?: string[];
  budget?: string;
  neverGiveUpNote?: string;
  installRepos?: {
    id: string;
    name: string;
    repoUrl: string;
    description: string;
    howToSetUp: string;
    quickInstall?: string;
    hardcore?: boolean;
    category: string;
  }[];
  agentDiscoveryLists?: {
    name: string;
    url: string;
    description: string;
    howToUse: string;
  }[];
}
