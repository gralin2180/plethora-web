/**
 * Interactive, highlight-based product tour (not a markdown dump).
 */

export const TOUR_EVENT = "plethora:start-tour";
export const TOUR_DONE_EVENT = "plethora:tour-done";

export type TourStep = {
  id: string;
  /** Matches data-tour on the target element */
  target: string | null;
  title: string;
  dialogue: string;
  placement?: "auto" | "bottom" | "top" | "center";
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: "logo",
    title: "Welcome to Plethora",
    dialogue:
      "Quick live tour — I'll light up each spot and talk you through it. No walls of text. Next takes you on.",
    placement: "bottom",
  },
  {
    id: "chat",
    target: "nav-chat",
    title: "Chat",
    dialogue:
      "Talk about anything here — mood, ideas, homework, strategy. Not just \"tools\". Same brain as the purple button.",
    placement: "bottom",
  },
  {
    id: "ai-finder",
    target: "nav-ai-finder",
    title: "AI Finder",
    dialogue:
      "Got a concrete goal? Describe it and I'll stack tools, free repos, and how-tos — only when you want that mode.",
    placement: "bottom",
  },
  {
    id: "prompt",
    target: "nav-prompt",
    title: "Prompt Assistant",
    dialogue:
      "Messy goal in, expert-ready prompt out. Works for Claude, ChatGPT, or local models.",
    placement: "bottom",
  },
  {
    id: "tools",
    target: "nav-tools",
    title: "Tools",
    dialogue:
      "Free utilities: image→PDF, format convert, PDF merge in the browser, plus guides for the heavier local stuff.",
    placement: "bottom",
  },
  {
    id: "install",
    target: "nav-install",
    title: "Install Hub",
    dialogue:
      "Free GitHub installs — Ollama, scrapers, agent frameworks. Copy-friendly setup paths.",
    placement: "bottom",
  },
  {
    id: "mcp",
    target: "nav-mcp",
    title: "MCP Hub",
    dialogue:
      "Plug tools into Claude Desktop, Cursor, and friends so your agents can actually do things.",
    placement: "bottom",
  },
  {
    id: "backends",
    target: "nav-backends",
    title: "Local AI",
    dialogue:
      "Big deal: wire Ollama / LM Studio here. Free private models on your machine — not a tiny footer link.",
    placement: "bottom",
  },
  {
    id: "pricing",
    target: "nav-pricing",
    title: "Pricing",
    dialogue:
      "Free roof first. Pro, Team, Enterprise on-call, Hardcore for power users. Only pay when volume or humans matter.",
    placement: "bottom",
  },
  {
    id: "hardcore",
    target: "nav-hardcore",
    title: "Hardcore",
    dialogue:
      "When you're deep: full stack, scrapers, agents. Skip this forever if you're keeping it chill.",
    placement: "bottom",
  },
  {
    id: "assistant",
    target: "fab-assistant",
    title: "Your sidekick",
    dialogue:
      "This button opens me anywhere. Same chat, no tab switch. Perfect when you're mid-page.",
    placement: "top",
  },
  {
    id: "personal",
    target: "link-personal",
    title: "Personal context",
    dialogue:
      "Optional notes that stay on your device. Makes answers feel more \"you\" — we don't harvest that file.",
    placement: "top",
  },
  {
    id: "backends-footer",
    target: "link-backends",
    title: "Local backends (again)",
    dialogue:
      "Same Local AI path — also huge in the footer now so you can't miss it. GPU home base.",
    placement: "top",
  },
  {
    id: "done",
    target: null,
    title: "You're set",
    dialogue:
      "That's the map. Poke around, or just keep talking — I'm here for life stuff too, not only product tours.",
    placement: "center",
  },
];

export function startProductTour(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOUR_EVENT));
}

export function finishProductTour(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOUR_DONE_EVENT));
}

export const TOUR_CHAT_OPENING =
  "On it — live tour mode. Follow the highlights and short dialogues. Hit Next / Back, or Skip anytime.";
