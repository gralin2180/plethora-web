import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { ToolsGrid } from "@/components/ToolsGrid";

export const metadata: Metadata = {
  title: "All Tools — Plethora",
  description:
    "Free utilities, AI assistants, and productivity tools under one roof. PDF, resume, calendars, video paths, and more.",
};

export default function ToolsPage() {
  return (
    <SiteShell>
      <div className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-white">All Tools</h1>
          <p className="mt-2 max-w-2xl text-zinc-500">
            Search and run free utilities in the browser. Upgrade only when you need more capacity.
          </p>
          <div className="mt-10">
            <ToolsGrid />
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
