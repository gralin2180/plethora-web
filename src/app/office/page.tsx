import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { OfficeDownloadsHub } from "@/components/OfficeDownloadsHub";

export const metadata: Metadata = {
  title: "Plethora Office — Windows apps",
  description:
    "Plethora Slack and Taskbot as Windows desktop apps. Build from desktop/slack. Web previews are secondary.",
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
