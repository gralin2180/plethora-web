import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { SubscriptionAiClient } from "@/components/SubscriptionAiClient";

export const metadata: Metadata = {
  title: "Subscription AI — Plethora",
  description:
    "Connect ChatGPT Plus or Pro to use your OpenAI subscription in Plethora chat — OpenCode-style OAuth.",
};

export default function SubscriptionAiPage() {
  return (
    <SiteShell>
      <SubscriptionAiClient />
    </SiteShell>
  );
}
