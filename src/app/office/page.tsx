import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { OfficeSuite } from "@/components/OfficeSuite";

export const metadata: Metadata = {
  title: "Plethora Office — AI workspace suite",
  description:
    "AI-driven Word, Boards, Rooms, Flow, layout, capture, cut, and Sheets. Free web apps; Personal/Business for commercial use. Not Microsoft 365.",
};

export default function OfficePage() {
  return (
    <SiteShell>
      <div className="px-4 py-12 sm:px-6">
        <OfficeSuite />
      </div>
    </SiteShell>
  );
}
