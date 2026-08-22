import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { DesignDoc } from "@/components/DesignDoc";

export const metadata: Metadata = {
  title: "AI architecture — Plethora",
  description:
    "How the Windows coding app (OpenCode-shaped) and the web free gateway split. Print to PDF.",
};

export default function DesignPage() {
  return (
    <SiteShell>
      <DesignDoc />
    </SiteShell>
  );
}
