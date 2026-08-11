import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteShell } from "@/components/SiteShell";
import { AuthConfirmClient } from "@/components/AuthConfirmClient";

export const metadata: Metadata = {
  title: "Confirming email — Plethora",
};

export default function AuthConfirmPage() {
  return (
    <SiteShell>
      <Suspense
        fallback={
          <p className="px-4 py-24 text-center text-sm text-zinc-500">Confirming…</p>
        }
      >
        <AuthConfirmClient />
      </Suspense>
    </SiteShell>
  );
}
