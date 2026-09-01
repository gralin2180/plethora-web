/**
 * Plethora Office — AI-driven workspace suite.
 * Inspired by Office / Slack / Trello / Figma / OBS. Not those products.
 * Browser rooms + existing Plethora tools. Files stay on this device unless you export.
 */

export type OfficeDesk =
  | "docs"
  | "collab"
  | "design"
  | "media"
  | "data"
  | "ops";

export type OfficeApp = {
  id: string;
  name: string;
  /** Like “Word”, “Slack”, “Trello” — never claim we are them. */
  like: string;
  tagline: string;
  desk: OfficeDesk;
  href: string;
  icon: string;
  /** True when this page runs a lab (not a redirect). */
  native?: boolean;
};

export type OfficeIndustry = {
  id: string;
  name: string;
  blurb: string;
  appIds: string[];
  extraHrefs: { label: string; href: string }[];
};

export const OFFICE_DESKS: { id: OfficeDesk; label: string }[] = [
  { id: "docs", label: "Docs & decks" },
  { id: "collab", label: "Team" },
  { id: "design", label: "Design" },
  { id: "media", label: "Capture & cut" },
  { id: "data", label: "Sheets & connect" },
  { id: "ops", label: "Ops" },
];

export const OFFICE_APPS: OfficeApp[] = [
  {
    id: "word",
    name: "Word",
    like: "Microsoft Word",
    tagline: "Write, rewrite, export. AI drafts stay in this browser.",
    desk: "docs",
    href: "/office/word",
    icon: "FileText",
    native: true,
  },
  {
    id: "slides",
    name: "Slides",
    like: "PowerPoint",
    tagline: "Outline → Marp deck you can export.",
    desk: "docs",
    href: "/tools/slides-deck",
    icon: "Presentation",
  },
  {
    id: "sheets",
    name: "Sheets",
    like: "Excel",
    tagline: "CSV / tables in the browser, ready to connect.",
    desk: "data",
    href: "/tools/excel-hub",
    icon: "Sheet",
  },
  {
    id: "boards",
    name: "Boards",
    like: "Trello",
    tagline: "Kanban for IT, production, fashion drops, film units.",
    desk: "collab",
    href: "/office/boards",
    icon: "Layout",
    native: true,
  },
  {
    id: "rooms",
    name: "Rooms",
    like: "Slack",
    tagline: "Channels on this device. AI teammate optional.",
    desk: "collab",
    href: "/office/rooms",
    icon: "MessageSquare",
    native: true,
  },
  {
    id: "mail",
    name: "Mail desk",
    like: "Outlook",
    tagline: "Drafts, job apps, follow-ups — local email manager.",
    desk: "collab",
    href: "/tools/email-manager",
    icon: "Mail",
  },
  {
    id: "design",
    name: "Layout board",
    like: "Figma",
    tagline: "Frames, notes, asset names — not a vector editor.",
    desk: "design",
    href: "/office/design",
    icon: "PenLine",
    native: true,
  },
  {
    id: "flow",
    name: "Flow",
    like: "Lucidchart / Miro",
    tagline: "Process, pipeline, and production flow from a brief.",
    desk: "ops",
    href: "/office/flow",
    icon: "Workflow",
    native: true,
  },
  {
    id: "capture",
    name: "Capture",
    like: "OBS",
    tagline: "Screen / cam recorder and stills in the browser.",
    desk: "media",
    href: "/tools/video-recorder",
    icon: "Video",
  },
  {
    id: "cut",
    name: "Cut",
    like: "Premiere / CapCut",
    tagline: "Shot list + in/out. Heavy encode still uses FFmpeg locally.",
    desk: "media",
    href: "/office/cut",
    icon: "Clapperboard",
    native: true,
  },
  {
    id: "connect",
    name: "Connect",
    like: "Power Automate / Zapier",
    tagline: "CSV, webhooks, and pointers into Sheets / MCP.",
    desk: "data",
    href: "/office/connect",
    icon: "Cable",
    native: true,
  },
  {
    id: "notes",
    name: "Meeting notes",
    like: "OneNote",
    tagline: "AI notes from a dump of what was said.",
    desk: "docs",
    href: "/tools/meeting-notes-ai",
    icon: "NotebookPen",
  },
  {
    id: "infra",
    name: "Infra / remote",
    like: "Parsec + RustDesk + GPU farm",
    tagline: "Host inventory, RustDesk relay recipe, admin AI scale (capped / full / custom).",
    desk: "ops",
    href: "/office/infra",
    icon: "Server",
    native: true,
  },
];

export const OFFICE_INDUSTRIES: OfficeIndustry[] = [
  {
    id: "it",
    name: "IT / software",
    blurb: "Tickets, docs, diagrams, rooms — ship without twenty SaaS tabs.",
    appIds: ["rooms", "boards", "word", "sheets", "flow", "connect", "infra"],
    extraHrefs: [
      { label: "App Maker", href: "/tools/build-your-tool" },
      { label: "Local LLMs", href: "/local-llms" },
      { label: "Infra desk", href: "/infra" },
    ],
  },
  {
    id: "gamedev",
    name: "Game dev",
    blurb: "GDD, boards, layout, capture — Director for the full pipeline.",
    appIds: ["boards", "word", "design", "flow", "capture", "rooms"],
    extraHrefs: [{ label: "Game Director", href: "/game-director" }],
  },
  {
    id: "media",
    name: "Media house",
    blurb: "Capture, cut, decks, copy — newsroom or agency desk.",
    appIds: ["capture", "cut", "slides", "word", "design", "boards"],
    extraHrefs: [
      { label: "Shorts from URL", href: "/tools/shorts-from-url" },
      { label: "YouTube → script", href: "/tools/youtube-to-script" },
    ],
  },
  {
    id: "production",
    name: "Production house",
    blurb: "Unit board, call sheet copy, flow, rooms.",
    appIds: ["boards", "rooms", "word", "flow", "cut", "capture"],
    extraHrefs: [{ label: "Life / calendar", href: "/tools/calendar-generator" }],
  },
  {
    id: "fashion",
    name: "Fashion",
    blurb: "Look frames, drop boards, lookbook decks.",
    appIds: ["design", "boards", "slides", "word", "capture", "sheets"],
    extraHrefs: [{ label: "Image prompt pack", href: "/tools/image-prompt-pack" }],
  },
  {
    id: "film",
    name: "Film",
    blurb: "Shot list, boards, capture, cut, script Word.",
    appIds: ["cut", "capture", "boards", "word", "slides", "rooms"],
    extraHrefs: [
      { label: "Video gen brief", href: "/tools/video-gen-brief" },
      { label: "TTS script", href: "/tools/tts-script-studio" },
    ],
  },
];

export function getOfficeApp(id: string): OfficeApp | undefined {
  return OFFICE_APPS.find((a) => a.id === id);
}

export function officeAppsForIndustry(id: string): OfficeApp[] {
  const pack = OFFICE_INDUSTRIES.find((i) => i.id === id);
  if (!pack) return OFFICE_APPS;
  return pack.appIds
    .map((aid) => getOfficeApp(aid))
    .filter((a): a is OfficeApp => Boolean(a));
}
