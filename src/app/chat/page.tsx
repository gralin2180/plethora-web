import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { ChatWorkspace } from "@/components/ChatWorkspace";

export const metadata: Metadata = {
  title: "Chat — Plethora",
  description:
    "Multi-thread AI chat with model pick and agents. Inspired by LibreChat — not LibreChat.",
};

export default function ChatPage() {
  return (
    <SiteShell hideFooter>
      <div className="h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)]">
        <ChatWorkspace />
      </div>
    </SiteShell>
  );
}
