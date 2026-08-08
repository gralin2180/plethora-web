import { PLATFORM_TOOLS } from "./tools-registry";
import { AI_CATALOG } from "./ai-catalog";
import type { PlatformTool, AiTool } from "./types";

export const HARDCORE_BUNDLE = {
  id: "hardcore-all-access",
  name: "Hardcore All-Access",
  tagline: "Every tool. One subscription. Zero juggling.",
  price: 39,
  priceLabel: "$39",
  period: "/month",
  annualPrice: 390,
  annualLabel: "$390/year",
  annualSavings: "Save $78",
  description:
    "Built for developers, automation nerds, and AI power users who live in Cursor, terminals, and MCP configs. One place for every Plethora tool — no à la carte, no limits.",
  cta: "Get All-Access",
  href: "/hardcore#checkout",
  badge: "Hardcore only",
} as const;

export const HARDCORE_INCLUDES = {
  platformTools: PLATFORM_TOOLS,
  advancedAiTools: AI_CATALOG.filter((t) => t.skillLevel === "advanced"),
  developerAiTools: AI_CATALOG.filter(
    (t) => t.bestFor.includes("developer") && t.skillLevel !== "beginner"
  ),
} as const;

export const HARDCORE_FEATURES = [
  "Unlimited runs on all 12+ platform tools",
  "Every Pro tool unlocked (personas, cursor rules, workflows)",
  "Full MCP Hub — custom server configs & setup wizards",
  "AI Workflow Builder with saved pipelines",
  "Curated advanced AI catalog (Claude Code, Cursor, ComfyUI, Ollama)",
  "Plugin integrations for Cursor, Claude, terminal AI",
  "Priority support & early access to new tools",
  "No daily run caps — ever",
] as const;

export const HARDCORE_STACK = [
  {
    title: "Developer tools",
    items: ["MCP Setup Helper", "Cursor Rules Generator", "AI Workflow Builder"],
  },
  {
    title: "Automation & integrations",
    items: ["Custom MCP configs", "Plugin hub access", "Workflow pipelines"],
  },
  {
    title: "Power-user AI picks",
    items: ["Claude Code", "Cursor", "Ollama", "ComfyUI", "Zapier MCP"],
  },
  {
    title: "Everything else",
    items: ["All marketing & content tools", "Prompt Assistant Pro", "AI Tool Finder unlimited"],
  },
] as const;

export const HARDCORE_FAQ = [
  {
    q: "Who is this for?",
    a: "Hardcore All-Access is for advanced users — developers, automation builders, and AI power users who want every Plethora tool without picking plans or hitting daily limits.",
  },
  {
    q: "How is this different from Pro?",
    a: "Pro is for creators and marketers who need more runs. Hardcore is the full stack: every tool, MCP configs, workflows, developer integrations, and zero caps. One price, everything included.",
  },
  {
    q: "Do I still get the free tools?",
    a: "Yes — but you won't need the free tier limits. Hardcore unlocks unlimited access to the entire platform from day one.",
  },
  {
    q: "Can beginners buy this?",
    a: "You can, but it's overkill. If you're just getting started, use Free or Pro. Hardcore is sold only on the dedicated page — we don't push it in the beginner funnel.",
  },
] as const;

export function getHardcoreToolCount(): number {
  return HARDCORE_INCLUDES.platformTools.length;
}

export function getHardcoreAiToolCount(): number {
  const ids = new Set<string>();
  for (const t of [...HARDCORE_INCLUDES.advancedAiTools, ...HARDCORE_INCLUDES.developerAiTools]) {
    ids.add(t.id);
  }
  return ids.size;
}

export function isHardcoreTool(tool: PlatformTool): boolean {
  return (
    tool.isPro ||
    tool.category === "Developer" ||
    tool.category === "Automation" ||
    tool.tags.includes("mcp") ||
    tool.tags.includes("workflow")
  );
}

export function getHardcoreAiTools(): AiTool[] {
  const seen = new Set<string>();
  const result: AiTool[] = [];
  for (const t of [...HARDCORE_INCLUDES.advancedAiTools, ...HARDCORE_INCLUDES.developerAiTools]) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      result.push(t);
    }
  }
  return result;
}
