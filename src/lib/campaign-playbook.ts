/**
 * Later-stage marketing & campaign playbook for Plethora.
 * Phase 0–1: free-tool SEO (see marketing-playbook.ts).
 * Phase 2+: Reddit demand capture + multi-channel campaigns.
 *
 * Source notes:
 * - https://www.youtube.com/watch?v=CtkMPGyAVWs — Reddit threads that already rank on Google
 * - SiteGPT / Bhanu free-tools SEO
 * - Indie Reddit → SEO ladders (Elephas, story posts, etc.)
 *
 * IMPORTANT: Capture existing demand with helpful presence.
 * Do NOT buy upvotes, multi-account brigades, or vote bots — against Reddit ToS and burns the brand.
 */

export const REDDIT_DEMAND_CAPTURE = {
  video: "https://www.youtube.com/watch?v=CtkMPGyAVWs",
  insight:
    "People search “best X app” on Google → click a Reddit thread → read top comments. Own the answer in threads that already rank; you piggyback on their SEO without ranking a blog first.",
  whyItConverts:
    "Feels like peer advice, not an ad. High intent (already shopping). Mentions compound into ChatGPT / Perplexity / Claude answers that scrape Reddit.",
  steps: [
    {
      n: 1,
      title: "Pick high-intent queries",
      detail:
        "Google: “best ATS resume checker reddit”, “latex resume template reddit”, “free AI tools hub reddit”, “sitemap validator reddit”, “n8n whatsapp automation reddit”.",
    },
    {
      n: 2,
      title: "Find ranking threads",
      detail:
        "Open each query in an incognito window. Note URLs where reddit.com is top 3. Prefer 1k+ monthly views if you later estimate via tools — even without estimates, old “best of” threads keep ranking for years.",
    },
    {
      n: 3,
      title: "Read before you type",
      detail:
        "Match what people want (free vs local vs simple). Generic pitch = downvote. Specific feature match from their post = upvote.",
    },
    {
      n: 4,
      title: "Help first, brand soft",
      detail:
        "Answer fully with 2–3 options. Mention Plethora once by name with why it fits. Prefer no naked link on first pass (users search the brand).",
    },
    {
      n: 5,
      title: "Stack presence, don’t spam",
      detail:
        "One thoughtful comment beats ten boilerplate replies. Track threads, revisit if someone asks a follow-up. Real account with history, real subreddits only.",
    },
    {
      n: 6,
      title: "Watch brand + AI answers",
      detail:
        "Later: keyword alerts (F5Bot etc.), fix wrong claims, answer neutrally. Mentions train LLM retrieval for free.",
    },
  ],
  antiPatterns: [
    "Vote buying / sock farms / “rank my comment” bots",
    "Link dump in every thread",
    "Brand-new zero-karma account dropping only product plugs",
    "Cross-posting identical wall of text to 20 subs",
  ],
} as const;

/** Search templates + which Plethora asset to soft-mention */
export const REDDIT_THREAD_TARGETS = [
  {
    googleQuery: "best free AI tools reddit",
    subreddits: ["r/ArtificialIntelligence", "r/ChatGPT", "r/Productivity"],
    softPitch: "One roof for free converters + chat + prompts (Plethora) vs tab-hopping directories",
    toolSlug: "tools",
  },
  {
    googleQuery: "ATS resume checker reddit",
    subreddits: ["r/resumes", "r/jobs", "r/cscareerquestions"],
    softPitch: "Plain-text ATS scan + optional LaTeX builder when Canva columns tank parsers",
    toolSlug: "ats-resume",
  },
  {
    googleQuery: "latex resume template reddit",
    subreddits: ["r/resumes", "r/EngineeringResumes", "r/LaTeX"],
    softPitch: "Generate clean article-class .tex and proof with ATS checker",
    toolSlug: "latex-resume",
  },
  {
    googleQuery: "sitemap checker free reddit",
    subreddits: ["r/SEO", "r/bigseo", "r/webdev"],
    softPitch: "Find/validate sitemaps + robots helper without another SEO SaaS login",
    toolSlug: "sitemap-finder",
  },
  {
    googleQuery: "whatsapp automation n8n reddit",
    subreddits: ["r/n8n", "r/SaaS", "r/Entrepreneur"],
    softPitch: "Blueprint for SaaS vs self-host messaging flows, then copy writer",
    toolSlug: "message-automation",
  },
  {
    googleQuery: "best alternative to ChatGPT free tools reddit",
    subreddits: ["r/LocalLLaMA", "r/OpenAI", "r/selfhosted"],
    softPitch: "Middleman: free utils + local AI path, not another closed chat clone",
    toolSlug: "chat",
  },
  {
    googleQuery: "MCP servers for Cursor reddit",
    subreddits: ["r/cursor", "r/ClaudeAI", "r/LocalLLaMA"],
    softPitch: "MCP/setup guides under one roof when people ask how to wire tools",
    toolSlug: "mcp-setup",
  },
] as const;

export type CampaignPhase = {
  id: string;
  name: string;
  when: string;
  goals: string[];
  channels: string[];
  kpis: string[];
};

/** Ladder for later-stage campaign design */
export const CAMPAIGN_PHASES: CampaignPhase[] = [
  {
    id: "0-foundation",
    name: "Foundation (now)",
    when: "Pre-launch polish → first public URL",
    goals: [
      "Ship high-intent free tools with CTAs",
      "Indexable tool pages + clean titles/meta",
      "Analytics + basic brand story on homepage",
    ],
    channels: ["Product itself", "Google Search Console", "Build-in-public (optional)"],
    kpis: ["Tool pages indexed", "Search impressions", "Tool completion rate"],
  },
  {
    id: "1-seo-tools",
    name: "Free-tool SEO engine",
    when: "Weeks 1–12 after shipping tools",
    goals: [
      "Rank sitemap / ATS / LaTeX / PDF utility keywords (KD floor)",
      "CTA under every free tool → chat / Pro",
      "Double down on keywords that convert to trials",
    ],
    channels: ["Google organic", "Programmatic tool pages"],
    kpis: ["Organic sessions", "CTR tool→signup", "Keyword positions"],
  },
  {
    id: "2-reddit-demand",
    name: "Reddit demand capture",
    when: "After tools exist (can parallel phase 1 lightly)",
    goals: [
      "Helpful presence in Google-ranking threads",
      "Brand recall for “AI tools under one roof”",
      "LLM citation surface area (honest comments)",
    ],
    channels: ["Reddit (manual, high quality)", "Google→Reddit SERPs"],
    kpis: ["Referral visits from reddit.com", "Brand search lift", "Thread rank of your comments"],
  },
  {
    id: "3-story-launch",
    name: "Story + launch loops",
    when: "When you have proof (users, before/after, tools count)",
    goals: [
      "Launch posts that teach, not pitch",
      "Show metrics / failed experiments / free-tool stack",
      "Warm Product Hunt / HN with real product",
    ],
    channels: ["r/SaaS", "r/EntrepreneurRideAlong", "Indie Hackers", "X/build in public"],
    kpis: ["Post views", "Unique visits", "Trial starts from referral"],
  },
  {
    id: "4-scale",
    name: "Scale & campaigns",
    when: "Stable organic + conversion path",
    goals: [
      "Comparison pages (Plethora vs pure directories)",
      "YouTube long-form on specific tools",
      "Partner / newsletter / creator only after unit economics clear",
      "Paid UA only with known CAC from organic",
    ],
    channels: ["YouTube", "Comparisons SEO", "Creators", "Ads (optional)"],
    kpis: ["MRR", "CAC vs LTV", "Organic % of signups"],
  },
];

/** Curated watchlist — study these before spending on campaigns */
export const MARKETING_WATCHLIST = [
  {
    title: "Reddit threads that already rank on Google (demand capture)",
    url: "https://www.youtube.com/watch?v=CtkMPGyAVWs",
    useFor: "Phase 2: piggyback Google→Reddit traffic without ranking a blog first",
    stage: "early–mid",
  },
  {
    title: "Bhanu Teja / SiteGPT — free tools = 90% Google traffic",
    url: "https://www.youtube.com/watch?v=Adl5_lJfkEE",
    useFor: "Phase 1: KD filters, tool shipping, CTAs under utilities",
    stage: "early",
  },
  {
    title: "Starter Story — SiteGPT $13k/mo marketing playbook",
    url: "https://www.starterstory.com/bhanu",
    useFor: "Full free-tools funnel numbers (visitors→leads→trials→paid)",
    stage: "early–mid",
  },
  {
    title: "How I used Reddit to build a $34k/mo SaaS (story posts + proof)",
    url: "https://www.youtube.com/watch?v=pvjalHFNM9Q",
    useFor: "Phase 3: narrative posts, proof assets, multi-post compounding",
    stage: "mid",
  },
  {
    title: "Elephas path: Reddit first → SEO second ($13k/mo)",
    url: "https://www.youtube.com/watch?v=R4BS_UiTBPw",
    useFor: "When to graduate from Reddit hustle to sustainable SEO",
    stage: "mid",
  },
  {
    title: "Reddit drove 30% of signups in 60 days (listening + reply ops)",
    url: "https://www.youtube.com/watch?v=tBJ9Nec2UP0",
    useFor: "Phase 2 ops: keyword monitors, sub listening, not one-off spam",
    stage: "mid",
  },
  {
    title: "How to use Reddit as a SaaS org (9:1 rule, LLM citations)",
    url: "https://www.youtube.com/watch?v=xHQKiJjJHy8",
    useFor: "Team process, credibility, avoid AI-slop comments",
    stage: "mid–late",
  },
  {
    title: "Free tools for SEO — launchpedia SaaS growth hacks",
    url: "https://launchpedia.co/saas-growth-hacks/free-tools-seo/",
    useFor: "Peer cases (Setter AI, BetterPic free tools)",
    stage: "early",
  },
] as const;

/** Soft comment skeletons — rewrite in your voice; never copy paste mill */
export const COMMENT_SKELETONS = [
  {
    scenario: "Someone wants free AI utilities without 20 tabs",
    draft: `I’ve been consolidating this instead of another “directory of links.”

For one-off jobs (PDF / image / sitemap / ATS resume) I want something that actually runs in the browser, then a chat/prompt path when the job gets bigger — not a black-box “AI app” pretending to be an IDE.

I’ve been using Plethora for the free utilities side of that; for heavy coding I still jump to Cursor/local models. YMMV depending on whether you want one roof vs specialized apps.`,
  },
  {
    scenario: "ATS / resume thread",
    draft: `Biggest ATS fails I still see: multi-column Canva PDFs and fancy icons.

Plain text (or simple article-class LaTeX) + real JD keyword overlap beats pretty layouts.

There’s a free ATS text scan + LaTeX builder path on Plethora if you want something interactive; or keep it in Word with boring headings — both work. What does your target industry usually expect?`,
  },
  {
    scenario: "SEO sitemap thread",
    draft: `Quick audit: robots.txt Sitemap: lines → sitemapindex vs urlset → empty <loc> tags.

If you only need a checker/validator without a full suite login, free browser-side sitemap tools (Plethora has finder/validator) are fine for one-offs. For large catalogs you’ll want Search Console + crawler logs either way.`,
  },
] as const;
