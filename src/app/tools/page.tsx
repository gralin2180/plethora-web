import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteShell } from "@/components/SiteShell";
import { ToolsGrid } from "@/components/ToolsGrid";

export const metadata: Metadata = {
  title: "All Tools — Plethora",
  description:
    "Free utilities, AI tools, marketing, trading, and productivity helpers under one roof.",
};

export default function ToolsPage() {
  return (
    <SiteShell>
      <div className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-semibold tracking-tight text-white">All tools</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Free utilities and AI tools are listed separately. Categories cover marketing, trading,
            content, office, and developer work. Free uses/day are daily caps on the Free plan.
          </p>
          <div className="mt-10">
            <Suspense fallback={<p className="text-sm text-zinc-500">Loading tools…</p>}>
              <ToolsGrid />
            </Suspense>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
