import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { OfficeDownloadsHub } from "@/components/OfficeDownloadsHub";

export const metadata: Metadata = {
  title: "Plethora Office — open apps",
  description:
    "Open Plethora Slack, Taskbot, Word, and the full Office suite in your browser. Windows installers coming soon.",
};

export default function OfficePage() {
  return (
    <SiteShell>
      <div className="px-4 py-10 sm:px-6">
        <OfficeDownloadsHub />
      </div>
    </SiteShell>
  );
}
