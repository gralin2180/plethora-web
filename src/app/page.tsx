import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { HomeDashboard } from "@/components/HomeDashboard";

export const metadata: Metadata = {
  title: "Plethora — your AI home base",
  description:
    "Chat, tools, local LLMs on your PC, App Maker, and 18+ spicy chat — one roof you actually come back to.",
};

export default function Page() {
  return (
    <SiteShell>
      <HomeDashboard />
    </SiteShell>
  );
}
