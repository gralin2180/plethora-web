import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { HardcoreBundlePage } from "@/components/HardcoreBundlePage";

export const metadata: Metadata = {
  title: "Hardcore All-Access — Plethora",
  description:
    "Every Plethora tool in one subscription. Built for developers, automation builders, and AI power users.",
};

export default function HardcorePage() {
  return (
    <SiteShell>
      <HardcoreBundlePage />
    </SiteShell>
  );
}
