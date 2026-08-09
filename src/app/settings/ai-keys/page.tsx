import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { AiKeysClient } from "@/components/AiKeysClient";

export const metadata: Metadata = {
  title: "AI keys — Plethora",
  description: "Bring your own OpenRouter key for unlimited personal AI use.",
};

export default function AiKeysPage() {
  return (
    <SiteShell>
      <AiKeysClient />
    </SiteShell>
  );
}
