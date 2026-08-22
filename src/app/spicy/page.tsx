import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { SpicyChatLanding } from "@/components/SpicyChatLanding";

export const metadata: Metadata = {
  title: "Free NSFW AI chat (18+) — spicy roleplay",
  description:
    "Adult AI girlfriend / boyfriend chat and NSFW roleplay. Confirm 18+. Then stay for tools, local LLMs, and App Maker under one roof.",
  keywords: [
    "nsfw ai chat",
    "ai girlfriend",
    "spicy ai chat",
    "adult roleplay chatbot",
    "uncensored ai chat 18+",
    "character ai nsfw alternative",
  ],
  openGraph: {
    title: "Spicy AI chat (18+) — Plethora",
    description: "Free adult companion chat. 18+ only. Tools and local models in the same app.",
  },
};

export default function SpicyPage() {
  return (
    <SiteShell hideFooter>
      <SpicyChatLanding />
    </SiteShell>
  );
}
