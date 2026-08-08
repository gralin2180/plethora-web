import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { InstallHubPage } from "@/components/InstallHubPage";

export const metadata: Metadata = {
  title: "Install Hub — free repos, agents & scrapers — Plethora",
  description:
    "Install free open-source LLMs, hardcore scrapers, browser agents, and MCP tools on your PC. Wired for the Plethora web app.",
};

export default function InstallPage() {
  return (
    <SiteShell>
      <div className="px-4 py-12 sm:px-6">
        <InstallHubPage />
      </div>
    </SiteShell>
  );
}
