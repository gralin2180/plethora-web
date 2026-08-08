import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { BackendsSettingsClient } from "@/components/BackendsSettingsClient";

export const metadata: Metadata = {
  title: "Local AI backends — Plethora",
  description: "Connect Ollama, LM Studio, llama.cpp, or custom OpenAI-compatible local models.",
};

export default function BackendsSettingsPage() {
  return (
    <SiteShell>
      <BackendsSettingsClient />
    </SiteShell>
  );
}
