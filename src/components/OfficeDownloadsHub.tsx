import Link from "next/link";
import { Building2, Monitor } from "lucide-react";
import { OFFICE_APP_NAMES, type OfficeAppId } from "@/lib/office-app-names";

const DESKTOP_APPS: OfficeAppId[] = ["relay", "scout", "draft", "grid", "trace", "nook", "mail"];

export function OfficeDownloadsHub() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start gap-3">
        <Building2 className="mt-1 h-8 w-8 text-cyan-300" />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-400">Suite</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Plethora Office</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            <strong className="text-zinc-200">Six Windows apps</strong> — native on your PC. Shared data in{" "}
            <code className="text-zinc-300">%APPDATA%\Plethora\Office</code>. Web previews are for testing only.
          </p>
        </div>
      </div>

      <section className="mt-8 space-y-4">
        {DESKTOP_APPS.map((id, i) => {
          const app = OFFICE_APP_NAMES[id];
          return (
            <div
              key={id}
              className={`rounded-2xl border p-5 ${i < 2 ? "border-[#0078d4]/40 bg-gradient-to-br from-[#0078d4]/10 to-transparent" : "border-white/10 bg-white/[0.03]"}`}
            >
              <div className="flex items-start gap-3">
                <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
                <div>
                  <p className="font-semibold text-white">
                    {i + 1}. {app.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">{app.tagline}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    <code className="text-zinc-400">{app.desktopFolder}/</code> ·{" "}
                    <code className="text-zinc-400">{app.installerBaseName}-0.1.0.exe</code>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-5 font-mono text-xs text-zinc-400">
        <p className="text-zinc-500"># Install all desktop apps</p>
        <p>cd desktop</p>
        <p>.\setup-all.ps1</p>
        <p className="mt-3 text-zinc-500"># Launch Draft (example)</p>
        <p>cd desktop/draft</p>
        <p>npm run start</p>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-medium text-zinc-300">Web previews (testing only)</p>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {DESKTOP_APPS.map((id) => {
            const app = OFFICE_APP_NAMES[id];
            return (
              <Link key={id} href={app.webHref} className="rounded-lg border border-white/10 px-3 py-1.5 text-zinc-400 hover:text-white">
                {app.name}
              </Link>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
