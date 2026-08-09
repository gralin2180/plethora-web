import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteShell } from "@/components/SiteShell";
import { WorkspacesClient } from "@/components/WorkspacesClient";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Workspaces & devices — Plethora",
  description: "Cloud workspaces and device seats attached to your account.",
};

export default async function WorkspacesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/workspaces");

  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-white">Workspaces & devices</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Workspaces live on your Supabase account. Free plans keep a few browser seats; paid
          unlocks more devices and workspaces.
        </p>
        <div className="mt-10">
          <WorkspacesClient />
        </div>
      </div>
    </SiteShell>
  );
}
