import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { LearnAiPage } from "@/components/LearnAiPage";

export const metadata: Metadata = {
  title: "Learn how to use AI — everyday India · Plethora",
  description:
    "Plain-language AI literacy for students, shops, job seekers, and families in India. Safety, prompts, daily life recipes. Free tools to practice.",
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
