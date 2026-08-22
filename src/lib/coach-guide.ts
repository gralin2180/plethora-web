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

1. **Tools → YouTube → script** for a rewrite from captions.
2. **Tools → Shorts clip generator** for best-part timestamps + caption style.
3. Run **web/pipelines/shorts_cut.py** on your PC (yt-dlp + ffmpeg) for the actual MP4 — the cloud cannot cut YouTube into a file.

I’ll highlight the tools. Tap **Next** after you click.`,
      steps: [
        {
          id: "c-tools",
          target: "nav-tools",
          href: "/tools",
          title: "Open Tools",
          dialogue: "Click Tools. Captions, script, and Shorts cutter live here.",
          placement: "bottom",
        },
        {
          id: "c-yt",
          target: "tool-youtube-to-script",
          href: "/tools?category=AI%20Tools",
          title: "YouTube → script",
          dialogue: "Paste a YouTube URL. Choose full script, summary, or Shorts hooks.",
          placement: "bottom",
        },
        {
          id: "c-short",
          target: "tool-shorts-from-url",
          href: "/tools?category=AI%20Tools",
          title: "Shorts generator",
          dialogue:
            "Paste any yt-dlp video link. Get cut times and captions, then run the Python pipeline locally for the file.",
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
