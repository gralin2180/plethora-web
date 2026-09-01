import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { PricingClient } from "@/components/PricingClient";

export const metadata: Metadata = {
  title: "Pricing — Plethora",
  description:
    "Free tools under one roof. Office Personal/Business like a suite (not Microsoft 365). Pro premium AI. Chat with threads.",
};

export default function PricingPage() {
  return (
    <SiteShell>
      <PricingClient />
    </SiteShell>
  );
}
