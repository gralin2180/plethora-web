import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { ProjectsList } from "@/components/ProjectsList";

export const metadata: Metadata = {
  title: "Your apps",
  description: "Mini-apps built from Plethora Chat, each with its own URL.",
};

export default function ProjectsPage() {
  return (
    <SiteShell>
      <ProjectsList />
    </SiteShell>
  );
}
