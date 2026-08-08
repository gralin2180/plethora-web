import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { PromptAssistant } from "@/components/PromptAssistant";

export const metadata: Metadata = {
  title: "Prompt Engineering Assistant — Plethora",
  description:
    "Turn messy ideas into perfect AI prompts. We ask clarifying questions and deliver exactly what you meant.",
};

export default function PromptAssistantPage() {
  return (
    <SiteShell>
      <div className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-white">Prompt Engineering Assistant</h1>
          <p className="mt-2 text-zinc-500">
            Bad at explaining? No problem. We read your message, ask a few questions,
            and build a prompt that gets you exactly what you want.
          </p>
          <div className="mt-10">
            <PromptAssistant />
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
