import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { AccountSettingsClient } from "@/components/AccountSettingsClient";

export const metadata: Metadata = {
  title: "Settings — Plethora",
  description: "Account email, phone, 2FA, and billing.",
};

export default function SettingsPage() {
  return (
    <SiteShell>
      <AccountSettingsClient />
    </SiteShell>
  );
}
