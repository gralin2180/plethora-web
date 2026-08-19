import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { DesignDoc } from "@/components/DesignDoc";

export const metadata: Metadata = {
  title: "AI architecture — Plethora",
  description:
    "How Plethora runs free models, rotates until exhausted, then asks for a key or pay-as-you-go.",
};

export default function DesignPage() {
  return (
    <SiteShell>
      <DesignDoc />
    </SiteShell>
  );
}
