import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { InfraControlDesk } from "@/components/InfraControlDesk";

export const metadata: Metadata = {
  title: "Infra — Parsec, RustDesk, AI scale — Plethora",
  description:
    "Inventory Parsec and RustDesk hosts, self-host a RustDesk relay, and set org AI to capped, full scale, or custom admin quotas.",
};

export default function InfraPage() {
  return (
    <SiteShell>
      <div className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-400">Ops</p>
          <h1 className="mt-1 text-3xl font-semibold text-white">Server infra & remote</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Full-scale AI is an admin policy plus machines you own. Clients are still Parsec / RustDesk.
          </p>
          <div className="mt-8">
            <InfraControlDesk />
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
