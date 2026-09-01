import type { SubscriptionPlan } from "./types";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export const SKILL_LEVELS: {
  id: SkillLevel;
  label: string;
  tagline: string;
  description: string;
}[] = [
  {
    id: "beginner",
    label: "Beginner",
    tagline: "Just getting started with AI",
    description: "Guided prompts, simple tools, and clear recommendations. No jargon.",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    tagline: "Comfortable with AI, want speed",
    description: "More control, workflow shortcuts, and smarter tool routing.",
  },
  {
    id: "advanced",
    label: "Advanced",
    tagline: "Power user — MCP, automations, integrations",
    description: "MCP servers, Cursor rules, workflow builder, and local AI.",
  },
  {
    id: "expert",
    label: "Expert / God Mode",
    tagline: "Terminal agents, custom stacks, zero hand-holding",
    description: "Full catalog, unlimited runs, raw configs, and hardcore bundle access.",
  },
];

export const PLAN_LIMITS: Record<
  SubscriptionPlan,
  { multiplier: number; unlimited: boolean }
> = {
  free: { multiplier: 1, unlimited: false },
  office: { multiplier: 2, unlimited: false },
  office_biz: { multiplier: 4, unlimited: false },
  pro: { multiplier: 5, unlimited: false },
  team: { multiplier: 10, unlimited: false },
  hardcore: { multiplier: 999, unlimited: true },
  "hardcore-all-access": { multiplier: 999, unlimited: true },
};

export function getDailyLimit(
  baseLimit: number,
  plan: SubscriptionPlan
): number {
  const config = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  if (config.unlimited) return 999999;
  return baseLimit * config.multiplier;
}

export function getSkillLevelLabel(level: SkillLevel): string {
  return SKILL_LEVELS.find((s) => s.id === level)?.label ?? level;
}

export function getRecommendedToolsForSkill(level: SkillLevel): string[] {
  switch (level) {
    case "beginner":
      return ["prompt-assistant", "ai-finder", "caption-writer", "summarizer"];
    case "intermediate":
      return ["ad-copy", "hook-generator", "landing-copy", "persona-builder"];
    case "advanced":
      return ["mcp-setup", "cursor-rules", "workflow-builder"];
    case "expert":
      return ["workflow-builder", "cursor-rules", "mcp-setup", "ai-finder"];
    default:
      return ["prompt-assistant", "ai-finder"];
  }
}
