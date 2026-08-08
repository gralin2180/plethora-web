import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { ChatMode } from "@/components/ChatMode";

export const metadata: Metadata = {
  title: "Chat mode — Plethora",
  description:
    "Multi-turn Plethora assistant with local personalisation. Ask anything related or unrelated to the app.",
};

export default function ChatPage() {
  return (
    <SiteShell>
      <div className="px-4 py-12 sm:px-6">
        <ChatMode />
      </div>
    </SiteShell>
  );
}
