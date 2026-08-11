/**
 * About / FAQ content — also used by the assistant for accurate site answers.
 */

export const ABOUT_FAQS: { q: string; a: string }[] = [
  {
    q: "What is Plethora?",
    a: "An under-one-roof hub: Prompt Assistant, free utilities (PDF, network, captions…), AI tools & studios, Install Hub, local GPU backends, trading/marketing labs, Finder, Chat, and Plethora MCP for agents.",
  },
  {
    q: "What was Plethora built for first?",
    a: "Prompt engineering — turning messy goals into expert prompts tuned for how different model families behave. Tools and MCP grew around that core.",
  },
  {
    q: "Do you connect every LLM (Claude, Gemini, Perplexity, etc.)?",
    a: "We don’t invent free accounts at every vendor. After sign-in you get fair daily use on our platform key. For heavy or multi-model use, paste your OpenRouter key under Settings → AI keys (BYOK) — that reaches many hosted models under one key. You can still open Claude, Perplexity, or Cursor and paste prompts from us.",
  },
  {
    q: "Do I need to sign in?",
    a: "No for most free browser utilities. Yes (or BYOK) for shared cloud LLM chat so one API key isn’t burned by unlimited guests.",
  },
  {
    q: "Free vs paid?",
    a: "Free: fair daily free-model AI + utilities (global rate limits so thousands of users don't choke the free key). Pro ($19): unlimited tools, workspaces, ~300 premium AI msgs/mo then auto free-model fallback (Cursor-style). Team/Hardcore increase budgets. Try packs: 1h/$2, 24h/$5, 7d/$12. BYOK always at /settings/ai-keys. Billing at /settings/billing.",
  },
  {
    q: "What happens when I use up Pro premium AI?",
    a: "Chat keeps working on free models that day/month. Soft warn at ~80% of budget. Set a lower personal monthly limit under Billing. Your own OpenRouter key (BYOK) is never limited by us.",
  },
  {
    q: "What is Plethora MCP?",
    a: "Our first-party MCP server so Claude Desktop, Cursor, and other hosts can search tools, polish prompts, captions, DNS/ping, sitemaps, position size, etc. Setup: /mcp",
  },
  {
    q: "Where is privacy kept?",
    a: "Personal context and many self-learn signals stay on your device by default. Cloud chat/polish only sees what you send when those APIs run. See /legal/privacy and /settings/personal.",
  },
  {
    q: "Adult content?",
    a: "Consensual adult content between adults is allowed after an 18+ confirm. Sexual content involving minors is hard-blocked. You stay responsible for what you generate.",
  },
  {
    q: "Can I connect Slack, Canva, Figma, Notion…?",
    a: "Yes — open /connect. Mark apps connected, optionally store personal tokens only in your browser, and follow MCP / Zapier bridges. Full multi-tenant OAuth for every brand is an enterprise-style build (you or we register each developer app).",
  },
  {
    q: "Devices & workspaces?",
    a: "Accounts can attach workspaces and limited browser seats (about 3 free, more on paid). Manage at /workspaces after the SQL schema is applied.",
  },
];

/** Compact site knowledge block for chat system prompt */
export function siteKnowledgeForAssistant(): string {
  return `## Product facts (answer user questions about Plethora accurately)
${ABOUT_FAQS.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n")}

Key routes: / · /about · /connect · /tools · /prompt-assistant · /ai-finder · /chat · /mcp · /install · /pricing · /learn · /settings/backends · /settings/ai-keys · /settings/personal · /workspaces · /dashboard · /hardcore · /legal/terms · /legal/privacy

When users ask how something on the site works, answer with exact paths and next clicks. Prefer internal /tools/... over sending them away. If unsure, say what you know and link /about or /chat for clarification.`;
}
