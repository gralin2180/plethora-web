import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { BillingClient } from "@/components/BillingClient";

export const metadata: Metadata = {
  title: "Billing & AI budget — Plethora",
  description: "Manage Pro subscription, try packs, premium AI limits, and self-caps.",
};

export default function BillingPage() {
  return (
    <SiteShell>
      <BillingClient />
    </SiteShell>
  );
}
