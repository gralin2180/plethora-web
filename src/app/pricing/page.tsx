import type { Metadata } from "next";
import { PricingClient } from "@/components/PricingClient";

export const metadata: Metadata = {
  title: "Pricing — Plethora",
  description:
    "Free tools under one roof. Pro premium AI budget then free models. Try packs. BYOK always.",
};

export default function PricingPage() {
  return <PricingClient />;
}
