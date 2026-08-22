/**
 * Interactive, highlight-based product tour.
 */

export const TOUR_EVENT = "plethora:start-tour";
export const TOUR_DONE_EVENT = "plethora:tour-done";

export type TourStep = {
  id: string;
  target: string | null;
  title: string;
  dialogue: string;
  placement?: "auto" | "bottom" | "top" | "center";
  /** Navigate here before highlighting (coach flows). */
  href?: string;
};

export type TourStartDetail = { steps?: TourStep[] };

export function startProductTour(detail?: TourStartDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOUR_EVENT, { detail: detail || {} }));
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: "logo",
    title: "Plethora overview",
    dialogue:
      "One hub for free utilities, AI tools, marketing/trading helpers, local AI installs, and MCP servers. Use Next to follow the main routes.",
    placement: "bottom",
  },
  {
    id: "tools",
    target: "nav-tools",
    title: "Tools library",
    dialogue:
      "Browse here first. Free Utilities (PDF, network, counters) are separate from AI Tools (captions, chat, local stacks). Use category chips for Marketing, Trading, and more.",
    placement: "bottom",
  },
  {
    id: "projects",
    target: "nav-projects",
    title: "Your apps",
    dialogue:
      "Mini-apps from AI App Maker land here — open /projects anytime from Chat or the header.",
    placement: "bottom",
  },
  {
    id: "learn",
    target: "nav-learn",
    title: "Learn",
    dialogue:
      "Short lessons and copy-ready prompts if you want skills before tools — clear language, no jargon dump.",
    placement: "bottom",
  },
  {
    id: "chat",
    target: "nav-chat",
    title: "Chat",
    dialogue:
      "Ask anything about Plethora or your work. Good place to type “tour” again or “find a tool for …”",
    placement: "bottom",
  },
  {
    id: "finder",
    target: "nav-ai-finder",
    title: "Finder",
    dialogue:
      "Describe a goal and get stacked recommendations — apps, free repos, and when MCP fits.",
    placement: "bottom",
  },
  {
    id: "mcp",
    target: "nav-mcp",
    title: "MCP Hub",
    dialogue:
      "Connect tool servers to AI hosts (Claude Desktop, Cursor, VS Code extensions, and more). Search servers or build a custom local MCP scaffold.",
    placement: "bottom",
  },
  {
    id: "backends",
    target: "nav-backends",
    title: "Local AI",
    dialogue:
      "Install Ollama, OpenClaw, Odysseus, LM Studio, and friends with copy-paste PC commands — then save localhost URLs here.",
    placement: "bottom",
  },
  {
    id: "prompt",
    target: "nav-prompt",
    title: "Prompt Assistant",
    dialogue:
      "Turn a messy goal into a model-ready prompt you can paste into Claude, ChatGPT, or a local model.",
    placement: "bottom",
  },
  {
    id: "pricing",
    target: "nav-pricing",
    title: "Pricing",
    dialogue:
      "Free daily uses cover most exploration. Paid plans raise limits when you run tools harder.",
    placement: "bottom",
  },
  {
    id: "assistant",
    target: "fab-assistant",
    title: "Floating assistant",
    dialogue:
      "Open chat from any page without leaving. Same brain as /chat.",
    placement: "top",
  },
  {
    id: "done",
    target: null,
    title: "You’re ready",
    dialogue:
      "Start with Tools → pick Free Utilities or AI Tools, or open Local AI if you own a GPU. Restart this tour anytime from the header or by asking Chat for a tour.",
    placement: "center",
  },
];

export function finishProductTour(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOUR_DONE_EVENT));
}

export const TOUR_CHAT_OPENING =
  "This is **Plethora** — tools, chat, prompts, Finder, MCP, and install guides. Follow the glowing spots. **Next** / **Back** / **Skip**. Not a roleplay-rooms site.";
