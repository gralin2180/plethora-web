import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { LearnAiPage } from "@/components/LearnAiPage";

export const metadata: Metadata = {
  title: "Learn how to use AI · Plethora",
  description:
    "Clear, practical AI guidance for students, professionals, and teams. Safety habits, four-line prompts, role-based paths, and free practice tools.",
};

export default function LearnRoutePage() {
  return (
    <SiteShell>
      <div className="px-4 py-12 sm:px-6">
        <LearnAiPage />
      </div>
    </SiteShell>
  );
}
