import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { HistoryClient } from "@/components/HistoryClient";

export const metadata: Metadata = {
  title: "History — Plethora",
};

export default function HistoryPage() {
  return (
    <SiteShell>
      <HistoryClient />
    </SiteShell>
  );
}
