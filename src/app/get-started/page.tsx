import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteShell } from "@/components/SiteShell";
import { GetStartedAiClient } from "@/components/GetStartedAiClient";

export const metadata: Metadata = {
  title: "Get started — Connect AI — Plethora",
  description:
    "Log in with ChatGPT, GitHub Copilot, Perplexity, Gemini, Groq, and more. Your account, your quota.",
};

export default function GetStartedPage() {
  return (
    <SiteShell>
      <Suspense
        fallback={
          <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-zinc-500">Loading…</div>
        }
      >
        <GetStartedAiClient />
      </Suspense>
    </SiteShell>
  );
}
