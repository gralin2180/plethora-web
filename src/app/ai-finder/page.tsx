import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { TaskAiFinder } from "@/components/TaskAiFinder";

export const metadata: Metadata = {
  title: "AI Tool Finder — Plethora",
  description:
    "Describe any task and discover every AI tool, MCP server, plugin, and local app that can help.",
};

export default function AiFinderPage() {
  return (
    <SiteShell>
      <div className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-3xl font-bold text-white">AI Tool Finder</h1>
          <p className="mt-2 text-zinc-500">
            Tell us what you want to do. We suggest web AI, local AI, MCP servers,
            Cursor/Claude plugins, terminal tools — everything that fits.
          </p>
          <div className="mt-10">
            <TaskAiFinder />
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
