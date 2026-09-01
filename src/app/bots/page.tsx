import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { BotsGallery } from "@/components/BotsGallery";

export const metadata: Metadata = {
  title: "Bots — Plethora",
  description:
    "Pick a named companion bot and chat — fun, helpful, creative, or spicy 18+ characters under one roof.",
};

export default function BotsPage() {
  return (
    <SiteShell>
      <div className="px-4 py-12 sm:px-6">
        <BotsGallery />
      </div>
    </SiteShell>
  );
}
