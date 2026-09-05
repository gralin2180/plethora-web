"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Download,
  Monitor,
  Apple,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { OfficeAiBillingStrip } from "@/components/OfficeAiBillingStrip";
import { OFFICE_APPS } from "@/lib/plethora-office";
import {
  OFFICE_DESKTOP_APPS,
  type DesktopAppStatus,
} from "@/lib/office-desktop-apps";

function statusBadge(status: DesktopAppStatus) {
  if (status === "available") return "Stable";
  if (status === "beta") return "Beta";
  return "Coming soon";
}

export function OfficeDownloadsHub() {
  const featured = OFFICE_DESKTOP_APPS.filter((a) => a.featured);
  const desktopById = new Map(OFFICE_DESKTOP_APPS.map((a) => [a.id, a]));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start gap-3">
        <Building2 className="mt-1 h-8 w-8 text-cyan-300" />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-400">Suite</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Plethora Office</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Open apps in your browser to build and test. Windows installers ship when the{" "}
            <code className="text-zinc-300">.exe</code> files land in{" "}
            <code className="text-zinc-300">public/downloads/</code> — not live yet.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <OfficeAiBillingStrip appName="Office desktop" />
      </div>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles className="h-4 w-4 text-violet-300" />
          Open & test — featured apps
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((app) => (
            <FeaturedAppCard key={app.id} app={app} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-white">All Office apps</h2>
        <p className="mt-1 text-xs text-zinc-500">Click any card to open in the browser.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {OFFICE_APPS.map((app) => {
            const desktop = desktopById.get(app.id);
            return (
              <li key={app.id}>
                <Link
                  href={app.href}
                  className="group flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-4 transition hover:border-cyan-500/40 hover:bg-cyan-500/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-white">{app.name}</p>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-cyan-300" />
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-500">Like {app.like}</p>
                  <p className="mt-2 flex-1 text-sm text-zinc-400">{app.tagline}</p>
                  <p className="mt-3 text-xs text-cyan-300">Open app →</p>
                  {desktop?.platforms.find((p) => p.platform === "windows") ? (
                    <p className="mt-1 text-[10px] text-zinc-600">
                      Windows installer:{" "}
                      {desktop.installerReady ? "ready" : "coming after web beta"}
                    </p>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-black/30 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <Download className="h-4 w-4 text-[#0078d4]" />
          Windows downloads (not published yet)
        </h2>
        <p className="mt-2 text-xs text-zinc-500">
          Buttons stay disabled until installers exist — avoids 404s. Drop{" "}
          <code className="text-zinc-400">Plethora-Slack-Setup-0.1.0.exe</code> etc. into{" "}
          <code className="text-zinc-400">public/downloads/</code>, then set{" "}
          <code className="text-zinc-400">installerReady: true</code> in{" "}
          <code className="text-zinc-400">office-desktop-apps.ts</code>.
        </p>
        <ul className="mt-4 space-y-2">
          {OFFICE_DESKTOP_APPS.filter((a) =>
            a.platforms.some((p) => p.platform === "windows" && p.downloadPath)
          ).map((app) => {
            const win = app.platforms.find((p) => p.platform === "windows");
            const ready = Boolean(app.installerReady && win?.downloadPath);
            return (
              <li
                key={app.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 px-3 py-2"
              >
                <span className="text-sm text-zinc-300">{app.name}</span>
                {ready && win?.downloadPath ? (
                  <a
                    href={win.downloadPath}
                    download
                    className="inline-flex items-center gap-1 rounded-lg bg-[#0078d4] px-3 py-1.5 text-xs text-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                ) : (
                  <span className="text-xs text-zinc-600">
                    {win?.version || "—"} · use{" "}
                    <Link href={app.webHref} className="text-cyan-400 hover:underline">
                      web app
                    </Link>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-10 rounded-2xl border border-white/10 bg-black/40 p-5">
        <h2 className="text-sm font-semibold text-white">AI on every Office app</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-400">
          <li>
            <strong className="text-zinc-200">Free pool</strong> — OpenRouter / OpenCode Zen free
            models. Daily cap per account.
          </li>
          <li>
            <strong className="text-zinc-200">Plethora tokens</strong> — prepaid packs (
            <Link href="/settings/billing" className="text-cyan-300 hover:underline">
              Billing
            </Link>
            ).
          </li>
          <li>
            <strong className="text-zinc-200">BYOK</strong> — your keys (
            <Link href="/settings/ai-keys" className="text-violet-300 hover:underline">
              API keys
            </Link>
            ).
          </li>
        </ol>
        <p className="mt-4 text-xs text-zinc-500">
          Commercial license:{" "}
          <Link href="/pricing#office" className="text-cyan-300 hover:underline">
            Office Personal / Business
          </Link>
        </p>
      </div>
    </div>
  );
}

function FeaturedAppCard({ app }: { app: (typeof OFFICE_DESKTOP_APPS)[number] }) {
  const win = app.platforms.find((p) => p.platform === "windows");
  const mac = app.platforms.find((p) => p.platform === "mac");

  return (
    <Link
      href={app.webHref}
      className="group flex h-full flex-col rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-600/15 to-transparent p-5 transition hover:border-cyan-500/50 hover:from-cyan-600/10"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-semibold text-white">{app.name}</p>
          <p className="text-xs text-zinc-500">Like {app.like}</p>
        </div>
        <ExternalLink className="h-4 w-4 text-zinc-500 group-hover:text-cyan-300" />
      </div>
      <p className="mt-2 flex-1 text-sm text-zinc-400">{app.tagline}</p>
      <p className="mt-4 inline-flex items-center gap-1 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white group-hover:bg-cyan-500">
        Open in browser
        <ArrowUpRight className="h-4 w-4" />
      </p>
      <ul className="mt-3 flex flex-wrap gap-2 text-[10px] text-zinc-500">
        {win ? (
          <li className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5">
            <Monitor className="h-3 w-3" />
            Win · {app.installerReady ? statusBadge(win.status) : "web only"}
          </li>
        ) : null}
        {mac ? (
          <li className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5">
            <Apple className="h-3 w-3" />
            Mac · {statusBadge(mac.status)}
          </li>
        ) : null}
      </ul>
    </Link>
  );
}
