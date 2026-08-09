/**
 * Graphical "how this tool works" steps for tool detail pages.
 * Generic fallbacks by category / runner when a tool has no custom flow.
 */

export type HowStep = {
  id: string;
  label: string;
  detail?: string;
};

export type ToolHowDoc = {
  summary: string;
  steps: HowStep[];
  /** Where data moves: browser / Plethora API / third-party */
  privacyNote?: string;
};

const CUSTOM: Record<string, ToolHowDoc> = {
  "ping-test": {
    summary: "Sends a lightweight reachability check from our server to a host you choose.",
    steps: [
      { id: "1", label: "You enter a host", detail: "Domain or IP — not a private network address." },
      { id: "2", label: "Plethora checks safely", detail: "SSRF guards block dangerous destinations." },
      { id: "3", label: "Round-trip shown", detail: "Latency / status returned in the UI." },
    ],
    privacyNote: "Query stays on the tool page; nothing is sold.",
  },
  "speed-test": {
    summary: "Measures download/upload against Plethora endpoints from your browser.",
    steps: [
      { id: "1", label: "Start test", detail: "Browser hits download then upload endpoints." },
      { id: "2", label: "Bytes timed", detail: "Throughput computed client-side." },
      { id: "3", label: "Result cards", detail: "Mbps + latency-style feel, not ISP-certified." },
    ],
  },
  "youtube-to-captions": {
    summary: "Pulls public captions or guides you when only manual / paid paths exist.",
    steps: [
      { id: "1", label: "Paste URL", detail: "Watch / shorts link." },
      { id: "2", label: "Find tracks", detail: "Prefer public captions when available." },
      { id: "3", label: "Export text", detail: "Copy SRT / plain text for reuse." },
    ],
  },
  "image-to-video": {
    summary: "Pipeline from stills → motion recipe (commands or external generators).",
    steps: [
      { id: "in", label: "Images in", detail: "Reference stills + motion notes." },
      { id: "plan", label: "Graph pipeline", detail: "Optional node graph builds the sequence." },
      { id: "out", label: "Clip / command out", detail: "FFmpeg recipe or export for your renderer." },
    ],
  },
  "message-automation": {
    summary: "Design a message flow as nodes, then export a ready script or checklist.",
    steps: [
      { id: "t", label: "Trigger", detail: "Who / when the sequence starts." },
      { id: "m", label: "Messages", detail: "Each node = one step in the chain." },
      { id: "e", label: "Export", detail: "Copy for your CRM, bot, or manual send." },
    ],
  },
  "build-your-tool": {
    summary: "Compose inputs → transform → output without shipping a whole product.",
    steps: [
      { id: "i", label: "Pick inputs", detail: "Text, URL, file, or choice." },
      { id: "x", label: "Connect transforms", detail: "Graph or form steps." },
      { id: "o", label: "Run & save idea", detail: "Keep notes in a workspace when signed in." },
    ],
  },
  "bg-remover": {
    summary: "Chroma / canvas-style remove in the browser when possible.",
    steps: [
      { id: "1", label: "Drop image" },
      { id: "2", label: "Process locally", detail: "Heavy lifting prefers the browser." },
      { id: "3", label: "Download PNG" },
    ],
    privacyNote: "Prefer client-side processing for privacy.",
  },
  "position-size": {
    summary: "Risk % of account → exact size for a trade.",
    steps: [
      { id: "a", label: "Account & risk" },
      { id: "b", label: "Stop distance" },
      { id: "c", label: "Position size" },
    ],
  },
  "local-ai-hardware": {
    summary: "Match VRAM / disk to a realistic local stack.",
    steps: [
      { id: "1", label: "Your specs" },
      { id: "2", label: "Use-case filter" },
      { id: "3", label: "Stack advice + install path" },
    ],
  },
  "pdf-merge": {
    summary: "Combine PDFs in-browser where supported.",
    steps: [
      { id: "1", label: "Add PDFs" },
      { id: "2", label: "Reorder" },
      { id: "3", label: "Download merged file" },
    ],
  },
};

const BY_CATEGORY: Record<string, ToolHowDoc> = {
  "Free Utilities": {
    summary: "Most free utilities run in your browser or a small Plethora API hop, then return a result you can copy or download.",
    steps: [
      { id: "1", label: "Provide input", detail: "File, URL, or form fields." },
      { id: "2", label: "Tool runs", detail: "Client-side when possible." },
      { id: "3", label: "Get output", detail: "Copy, download, or share." },
    ],
  },
  "AI Tools": {
    summary: "AI tools turn your goal into a structured prompt or mini-workflow you can run in Chat, local models, or an external API.",
    steps: [
      { id: "1", label: "Describe the job" },
      { id: "2", label: "Studio shapes a prompt", detail: "Or a free run when templated." },
      { id: "3", label: "Run where you prefer", detail: "Cloud polish, local, or copy-out." },
    ],
  },
  Trading: {
    summary: "Trading helpers do the arithmetic and structure — you own the risk decisions.",
    steps: [
      { id: "1", label: "Enter trade numbers" },
      { id: "2", label: "Compute risk / R:R / size" },
      { id: "3", label: "Copy into your journal" },
    ],
  },
  "Marketing & Ads": {
    summary: "Marketing labs generate campaigns, calendars, or copy drafts you can refine and ship.",
    steps: [
      { id: "1", label: "Offer & audience" },
      { id: "2", label: "Generate structure" },
      { id: "3", label: "Edit & export" },
    ],
  },
};

function generic(name: string): ToolHowDoc {
  return {
    summary: `${name} takes your input, runs a focused transform, and returns something you can use immediately.`,
    steps: [
      { id: "1", label: "Open tool & enter input" },
      { id: "2", label: "Run once", detail: "Counts against daily free uses when server-backed." },
      { id: "3", label: "Use the output", detail: "Copy, download, or pin to a workspace." },
    ],
  };
}

export function getToolHowItWorks(slug: string, name: string, category: string): ToolHowDoc {
  return CUSTOM[slug] || BY_CATEGORY[category] || generic(name);
}

/** Tools that show an interactive node pipeline UI under the runner */
export const NODE_GRAPH_SLUGS = new Set([
  "message-automation",
  "image-to-video",
  "build-your-tool",
  "video-converter",
  "life-planner",
  "local-ai-hardware",
  "excel-hub",
]);
