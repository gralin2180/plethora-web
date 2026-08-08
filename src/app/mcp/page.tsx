import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { McpHubPage } from "@/components/McpHubPage";

export const metadata: Metadata = {
  title: "MCP Hub — Plethora",
  description:
    "MCP servers for Claude, ChatGPT, Cursor, and terminal agents — setup guides and configs for every client.",
};

export default function McpPage() {
  return (
    <SiteShell>
      <div className="px-4 py-12 sm:px-6">
        <McpHubPage />
      </div>
    </SiteShell>
  );
}
