import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { ConnectAppsClient } from "@/components/ConnectAppsClient";

export const metadata: Metadata = {
  title: "Connect your apps — Plethora",
  description:
    "Connect Canva, Slack, Figma, Notion, GitHub, Zapier and more to Plethora via MCP, Zapier, or personal tokens.",
};

export default function ConnectAppsPage() {
  return (
    <SiteShell>
      <ConnectAppsClient />
    </SiteShell>
  );
}
