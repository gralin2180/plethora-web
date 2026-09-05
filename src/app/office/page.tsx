import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { OfficeDownloadsHub } from "@/components/OfficeDownloadsHub";

export const metadata: Metadata = {
  title: "Plethora Office — Windows apps",
  description:
    "Download Plethora Slack, Taskbot, Word, and the Office suite for Windows. Mac later. Free AI pool, BYOK, or Plethora tokens.",
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
