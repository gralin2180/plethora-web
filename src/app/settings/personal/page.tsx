import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { PersonalContextPanel } from "@/components/PersonalContextPanel";

export const metadata: Metadata = {
  title: "Personal context — Plethora",
  description: "Local-only personalisation. Leak-safe — we never upload this data.",
};

export default function PersonalContextPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-white">Personalised context</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Create a context profile (and optional local file) so prompts, chat, and recommendations
          match your patterns — without sending that file to Plethora servers.
        </p>
        <div className="mt-8">
          <PersonalContextPanel />
        </div>
      </div>
    </SiteShell>
  );
}
