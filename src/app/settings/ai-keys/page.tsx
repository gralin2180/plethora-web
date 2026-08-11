import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { AiKeysClient } from "@/components/AiKeysClient";

export const metadata: Metadata = {
  title: "AI keys (BYOK) — Plethora",
  description:
    "Bring your own OpenAI-compatible API key: OpenRouter, OpenAI, Groq, xAI, DeepSeek, or custom.",
};

export default function AiKeysPage() {
  return (
    <SiteShell>
      <AiKeysClient />
    </SiteShell>
  );
}
