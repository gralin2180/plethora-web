/**
 * Free-marketing playbook (Bhanu Teja / SiteGPT style) for Plethora traffic tools.
 * Product philosophy: high-intent utilities rank on Google → CTA into Plethora core.
 */

export const FREE_MARKETING_PLAYBOOK = {
  source: "SiteGPT free-tool growth (public free tools + SEO)",
  steps: [
    {
      n: 1,
      title: "Search seed keywords",
      detail:
        "Use Keywords Explorer / free Google tools: seeds like “sitemap”, “resume latex”, “ats resume”, “pdf merge”, “ai bio generator”.",
    },
    {
      n: 2,
      title: "Filter topic",
      detail: "Include niche words (ai, resume, sitemap, pdf) so volume is relevant to tools you’ll actually ship.",
    },
    {
      n: 3,
      title: "Keyword difficulty",
      detail: "Prefer KD ≤ ~10 when competitive budgets are low; pick long-tails you can own with one focused page.",
    },
    {
      n: 4,
      title: "Search volume floor",
      detail: "Target solid monthly volume (often 1k+ in US when possible) so a ranking page moves the needle.",
    },
    {
      n: 5,
      title: "Document findings",
      detail: "Keep a sheet: keyword · volume · KD · parent topic · which Plethora tool ranks for it.",
    },
    {
      n: 6,
      title: "Plan CTAs",
      detail:
        "After the free tool finishes: soft CTA → Chat / Prompt Assistant / Pro trial. Match SiteGPT’s “want more?” placement under the work area.",
    },
  ],
  sitegptGapsWeFill: [
    "Sitemap finder & checker",
    "Sitemap validator",
    "Sitemap URL extractor",
    "Robots.txt + sitemap helper",
    "JSON / CSV → Markdown tables (we expand office converters)",
    "Resume ATS + LaTeX builders (career intent traffic)",
    "Messaging automation blueprints (agency intent)",
  ],
  ourTrafficToolIdeas: [
    { keywordHook: "latex resume", slug: "latex-resume" },
    { keywordHook: "ats resume checker", slug: "ats-resume" },
    { keywordHook: "sitemap checker", slug: "sitemap-finder" },
    { keywordHook: "sitemap validator", slug: "sitemap-validator" },
    { keywordHook: "ai bio generator", slug: "ai-bio-generator" },
    { keywordHook: "ai worksheet generator", slug: "ai-worksheet-generator" },
    { keywordHook: "whatsapp automation", slug: "message-automation" },
  ],
} as const;
