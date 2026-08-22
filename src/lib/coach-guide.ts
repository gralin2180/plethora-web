import { startProductTour, type TourStep } from "./product-tour";

export function coachForGoal(text: string): { reply: string; steps: TourStep[] } | null {
  const t = text.toLowerCase();
  if (
    /\b(youtube short|yt short|short for youtube|tiktok|reel|make (a |an )?(free )?(short|reel))\b/.test(
      t
    ) ||
    /\b(youtube|tiktok).{0,40}\b(free|for free)\b/.test(t)
  ) {
    return {
      reply: `Free path on **this** site:

1. **Tools → YouTube → captions** for a transcript (free).
2. **Prompt Assistant** for a 15–30s hook + script.
3. Edit in **CapCut** (free, off-site) and upload to YouTube Shorts.

I’ll highlight each control. Tap **Next** after you click. I can guide you around Plethora — I can’t click YouTube Studio on your PC from the browser.`,
      steps: [
        {
          id: "c-tools",
          target: "nav-tools",
          href: "/tools",
          title: "Open Tools",
          dialogue: "Click Tools. That’s the library — converters, AI tools, YouTube captions.",
          placement: "bottom",
        },
        {
          id: "c-yt",
          target: "tool-youtube-to-captions",
          href: "/tools?category=AI%20Tools",
          title: "YouTube → captions",
          dialogue:
            "Open this card. Paste a YouTube URL for a free transcript you can cut into a short.",
          placement: "bottom",
        },
        {
          id: "c-prompt",
          target: "nav-prompt",
          href: "/prompt-assistant",
          title: "Script the short",
          dialogue:
            "Use Prompt Assistant to draft a hook, 3 beats, and on-screen text. Then finish the edit in CapCut for free.",
          placement: "bottom",
        },
      ],
    };
  }
  return null;
}

export function startCoach(steps: TourStep[]) {
  startProductTour({ steps });
}

export const APP_MAKER_STEPS: TourStep[] = [
  {
    id: "am-need",
    target: "app-maker-need",
    href: "/tools/build-your-tool",
    title: "What it should do",
    dialogue: "This is the App Maker — not Chat. Paste the job here (tracker, dashboard, whatever).",
    placement: "bottom",
  },
  {
    id: "am-prompt",
    target: "app-maker-prompt",
    href: "/tools/build-your-tool",
    title: "Your rules",
    dialogue: "Optional custom prompt: tone, what to never do, keyboard-only, etc.",
    placement: "bottom",
  },
  {
    id: "am-build",
    target: "app-maker-build",
    href: "/tools/build-your-tool",
    title: "Create, then chat edits",
    dialogue:
      "Answer the chips below, then Create. After that this page becomes a modification chat plus a live preview — Chat won’t dump source.",
    placement: "top",
  },
];
