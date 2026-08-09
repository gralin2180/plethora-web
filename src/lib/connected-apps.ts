/**
 * Connected apps catalog — how Plethora links to the tools people already use.
 * Full OAuth for each vendor needs your developer apps; we ship:
 * - Connect checklists & deep links
 * - MCP / Zapier bridges
 * - Optional personal tokens stored only in the browser (BYOK style)
 */

export type ConnectMethod = "mcp" | "zapier" | "api_key" | "oauth_guide" | "agent";

export type ConnectedApp = {
  id: string;
  name: string;
  category: string;
  blurb: string;
  methods: ConnectMethod[];
  /** Official site */
  url: string;
  /** How to wire it today */
  how: string;
  docsUrl?: string;
  mcpNote?: string;
  /** Placeholder for optional personal token label */
  tokenLabel?: string;
  icon: string; // lucide-ish key or emoji fallback label
  popular?: boolean;
};

export const CONNECTED_APP_CATEGORIES = [
  "All",
  "Design",
  "Chat & collab",
  "Code & dev",
  "Docs & files",
  "Marketing",
  "Productivity",
  "Automation",
] as const;

export const CONNECTED_APPS: ConnectedApp[] = [
  {
    id: "canva",
    name: "Canva",
    category: "Design",
    blurb: "Social creatives, brand kits, one-click designs from AI briefs.",
    methods: ["oauth_guide", "zapier", "agent"],
    url: "https://www.canva.com",
    docsUrl: "https://www.canva.com/developers/",
    how: "Generate prompts & asset briefs in Plethora → open Canva → paste. Automate export via Zapier when you need files in Drive/Slack.",
    icon: "Palette",
    popular: true,
  },
  {
    id: "figma",
    name: "Figma",
    category: "Design",
    blurb: "UI files, components, design-to-dev handoff.",
    methods: ["api_key", "mcp", "oauth_guide"],
    url: "https://www.figma.com",
    docsUrl: "https://www.figma.com/developers/api",
    how: "Create a Figma personal access token → store here (browser only) → use with Figma MCP or export prompts that match your library naming.",
    tokenLabel: "Figma personal access token",
    mcpNote: "Community Figma MCP servers can read/write files with your token.",
    icon: "Figma",
    popular: true,
  },
  {
    id: "slack",
    name: "Slack",
    category: "Chat & collab",
    blurb: "Channel posts, alerts, team digests from tools & agents.",
    methods: ["mcp", "zapier", "oauth_guide"],
    url: "https://slack.com",
    docsUrl: "https://api.slack.com/apps",
    how: "Easiest path: Zapier MCP or Slack MCP with a bot token. Post digests, campaign drafts, trading journal summaries.",
    tokenLabel: "Slack bot token (xoxb-…)",
    mcpNote: "Official / community Slack MCP or Zapier Slack actions.",
    icon: "MessageSquare",
    popular: true,
  },
  {
    id: "discord",
    name: "Discord",
    category: "Chat & collab",
    blurb: "Community bots, launch announcements, support digests.",
    methods: ["api_key", "zapier", "mcp"],
    url: "https://discord.com",
    how: "Bot token in your MCP/server or Zapier Discord steps. Plethora drafts messages → push via your connection.",
    tokenLabel: "Discord bot token",
    icon: "MessagesSquare",
    popular: true,
  },
  {
    id: "notion",
    name: "Notion",
    category: "Docs & files",
    blurb: "Wikis, SOPs, content calendars, second brain pages.",
    methods: ["api_key", "mcp", "zapier"],
    url: "https://www.notion.so",
    docsUrl: "https://developers.notion.com/",
    how: "Create an integration, share pages, paste internal token. Notion MCP is a common path for agents.",
    tokenLabel: "Notion integration token",
    mcpNote: "Notion MCP / official connector.",
    icon: "NotebookPen",
    popular: true,
  },
  {
    id: "google-drive",
    name: "Google Drive",
    category: "Docs & files",
    blurb: "Docs, Sheets, slides, shared folders for campaigns.",
    methods: ["zapier", "oauth_guide", "mcp"],
    url: "https://drive.google.com",
    how: "Prefer Zapier or official Google connectors in Claude/Cursor. Store only scoped tokens you control — never share full account passwords.",
    icon: "HardDrive",
    popular: true,
  },
  {
    id: "gmail",
    name: "Gmail",
    category: "Marketing",
    blurb: "Outreach drafts, follow-ups, support macros (respect consent).",
    methods: ["zapier", "oauth_guide"],
    url: "https://mail.google.com",
    how: "Use Gmail via Zapier / Google OAuth apps you own. Plethora writes sequences — you approve sends.",
    icon: "Mail",
    popular: true,
  },
  {
    id: "github",
    name: "GitHub",
    category: "Code & dev",
    blurb: "Repos, PRs, issues for builder workflows.",
    methods: ["api_key", "mcp", "oauth_guide"],
    url: "https://github.com",
    docsUrl: "https://docs.github.com/en/authentication",
    how: "Fine-grained PAT → browser storage here or GitHub MCP in Cursor/Claude Desktop.",
    tokenLabel: "GitHub personal access token",
    mcpNote: "GitHub MCP / official agent tools.",
    icon: "Github",
    popular: true,
  },
  {
    id: "linear",
    name: "Linear",
    category: "Code & dev",
    blurb: "Product issues and cycle plans for engineering teams.",
    methods: ["api_key", "mcp"],
    url: "https://linear.app",
    how: "API key from Linear settings → agent tools create issues from Plethora plans.",
    tokenLabel: "Linear API key",
    icon: "ListTree",
  },
  {
    id: "jira",
    name: "Jira",
    category: "Code & dev",
    blurb: "Enterprise tickets and sprint boards.",
    methods: ["oauth_guide", "zapier", "api_key"],
    url: "https://www.atlassian.com/software/jira",
    how: "Atlassian API token + email, or Zapier Jira actions from Plethora-generated tickets.",
    tokenLabel: "Atlassian API token",
    icon: "Kanban",
  },
  {
    id: "trello",
    name: "Trello",
    category: "Productivity",
    blurb: "Simple boards for campaigns and personal ops.",
    methods: ["api_key", "zapier"],
    url: "https://trello.com",
    how: "Trello API key + token, or Zapier create-card from tool outputs.",
    tokenLabel: "Trello token",
    icon: "Layout",
  },
  {
    id: "asana",
    name: "Asana",
    category: "Productivity",
    blurb: "Team tasks and marketing ops.",
    methods: ["zapier", "oauth_guide"],
    url: "https://asana.com",
    how: "Zapier Asana or official OAuth app when you need PAT path.",
    icon: "CheckSquare",
  },
  {
    id: "airtable",
    name: "Airtable",
    category: "Docs & files",
    blurb: "Lightweight CRM, content ops, rate tables.",
    methods: ["api_key", "zapier"],
    url: "https://airtable.com",
    how: "Personal access token for bases → agent writing rows from Plethora briefs.",
    tokenLabel: "Airtable personal access token",
    icon: "Table2",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "Marketing",
    blurb: "CRM notes, deals, marketing emails.",
    methods: ["zapier", "oauth_guide", "api_key"],
    url: "https://www.hubspot.com",
    how: "Private app token or Zapier CRM actions. Plethora drafts copy; HubSpot owns the send.",
    tokenLabel: "HubSpot private app token",
    icon: "Megaphone",
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    category: "Marketing",
    blurb: "Email lists and campaign shells.",
    methods: ["api_key", "zapier"],
    url: "https://mailchimp.com",
    how: "API key for lists; generate sequences in Plethora → push via Zapier.",
    tokenLabel: "Mailchimp API key",
    icon: "Mail",
  },
  {
    id: "meta-ads",
    name: "Meta Ads",
    category: "Marketing",
    blurb: "Ad accounts for Facebook / Instagram.",
    methods: ["oauth_guide", "zapier"],
    url: "https://adsmanager.facebook.com",
    how: "Creative + copy in Plethora; upload via Ads Manager or partner automation. Full Marketing API needs your Meta developer app.",
    icon: "Clapperboard",
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "Marketing",
    blurb: "Captions, titles, channel ops (with your credentials).",
    methods: ["oauth_guide", "agent"],
    url: "https://studio.youtube.com",
    how: "Use in-app YouTube captions tool for public tracks; upload/publish needs Google OAuth you control.",
    icon: "PlayCircle",
    popular: true,
  },
  {
    id: "dropbox",
    name: "Dropbox",
    category: "Docs & files",
    blurb: "File drops for brand kits and deliverables.",
    methods: ["zapier", "oauth_guide"],
    url: "https://www.dropbox.com",
    how: "Zapier file steps or Dropbox API app with scoped tokens.",
    icon: "FolderTree",
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "Marketing",
    blurb: "Store products, drafts, and promo copy.",
    methods: ["api_key", "zapier"],
    url: "https://www.shopify.com",
    how: "Admin API token for your store; Plethora writes PDP/copy → you push.",
    tokenLabel: "Shopify Admin API token",
    icon: "ShoppingBag",
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "Productivity",
    blurb: "Billing events, customer notes (read carefully).",
    methods: ["api_key", "zapier"],
    url: "https://stripe.com",
    how: "Restricted API key for read-only agents. Never store full secret in public repos.",
    tokenLabel: "Stripe secret key (restricted preferred)",
    icon: "CreditCard",
  },
  {
    id: "zapier",
    name: "Zapier",
    category: "Automation",
    blurb: "Bridge almost any SaaS without custom code.",
    methods: ["mcp", "oauth_guide"],
    url: "https://zapier.com",
    docsUrl: "https://zapier.com/mcp",
    how: "Enable Zapier MCP in Claude/Cursor, or use Zapier webhooks from agent outputs. Meta-hub for Gmail, Slack, Sheets, CRM…",
    mcpNote: "Zapier MCP is the fastest multi-app path.",
    icon: "Workflow",
    popular: true,
  },
  {
    id: "make",
    name: "Make.com",
    category: "Automation",
    blurb: "Visual scenarios for complex multi-step automation.",
    methods: ["oauth_guide", "api_key"],
    url: "https://www.make.com",
    how: "Webhooks into Make scenarios; Plethora crafts payloads and copy.",
    icon: "GitBranch",
  },
  {
    id: "n8n",
    name: "n8n",
    category: "Automation",
    blurb: "Self-hostable workflows — keep data on your server.",
    methods: ["api_key", "oauth_guide"],
    url: "https://n8n.io",
    how: "Host n8n → webhook + credentials. Pair with Plethora MCP for agent triggers.",
    tokenLabel: "n8n API key (optional)",
    icon: "Network",
  },
  {
    id: "webflow",
    name: "Webflow",
    category: "Design",
    blurb: "Marketing sites and CMS items.",
    methods: ["api_key", "zapier"],
    url: "https://webflow.com",
    how: "Site API token for CMS; copy blocks from Plethora landing-copy tools.",
    tokenLabel: "Webflow API token",
    icon: "Globe",
  },
  {
    id: "miro",
    name: "Miro",
    category: "Design",
    blurb: "Whiteboards for workshops and story maps.",
    methods: ["oauth_guide", "zapier"],
    url: "https://miro.com",
    how: "Export structured plans from Plethora → paste or Zapier cards on boards.",
    icon: "Layout",
  },
  {
    id: "zoom",
    name: "Zoom",
    category: "Chat & collab",
    blurb: "Meeting notes from transcripts (with your auth).",
    methods: ["oauth_guide", "zapier"],
    url: "https://zoom.us",
    how: "Drop transcript into Meeting notes tool → push recap to Slack/Notion via Zapier.",
    icon: "Video",
  },
  {
    id: "calendly",
    name: "Calendly",
    category: "Productivity",
    blurb: "Booking links in sequences.",
    methods: ["zapier", "api_key"],
    url: "https://calendly.com",
    how: "Embed booking URLs in message-automation / email sequences.",
    icon: "Calendar",
  },
  {
    id: "spotify",
    name: "Spotify",
    category: "Marketing",
    blurb: "Podcast / playlist promo copy (public metadata).",
    methods: ["oauth_guide"],
    url: "https://developer.spotify.com",
    how: "App credentials for playlists; use Content tools for release marketing plans.",
    icon: "Music",
  },
  {
    id: "typeform",
    name: "Typeform",
    category: "Marketing",
    blurb: "Surveys and lead forms.",
    methods: ["zapier", "api_key"],
    url: "https://www.typeform.com",
    how: "Form webhooks → CRM / Slack; Plethora drafts questions and follow-ups.",
    icon: "List",
  },
];

export function appsByCategory(cat: string): ConnectedApp[] {
  if (cat === "All") return CONNECTED_APPS;
  return CONNECTED_APPS.filter((a) => a.category === cat);
}

export function searchApps(q: string): ConnectedApp[] {
  const s = q.trim().toLowerCase();
  if (!s) return CONNECTED_APPS;
  return CONNECTED_APPS.filter(
    (a) =>
      a.name.toLowerCase().includes(s) ||
      a.blurb.toLowerCase().includes(s) ||
      a.category.toLowerCase().includes(s) ||
      a.how.toLowerCase().includes(s)
  );
}
