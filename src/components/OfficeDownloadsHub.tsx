"use client";

import Link from "next/link";
import { Building2, Download, Monitor, Apple, Sparkles, Globe } from "lucide-react";
import { OfficeAiBillingStrip } from "@/components/OfficeAiBillingStrip";
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
  const shipping = OFFICE_DESKTOP_APPS.filter((a) =>
    a.platforms.some((p) => p.platform === "windows" && p.status !== "coming_soon")
  );
  const queued = OFFICE_DESKTOP_APPS.filter((a) =>
    a.platforms.every((p) => p.platform !== "windows" || p.status === "coming_soon")
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start gap-3">
        <Building2 className="mt-1 h-8 w-8 text-cyan-300" />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-400">Suite</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Plethora Office</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Download Windows apps for team chat, task capture, and docs. Inspired by Word, Slack,
            Trello, Figma — not those products. Mac builds ship after Windows beta.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            Free web previews still work — use{" "}
            <span className="text-zinc-400">Open web app</span> on each card until the installer is
            ready.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <OfficeAiBillingStrip appName="Office desktop" />
      </div>

      {shipping.length ? (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Download className="h-4 w-4 text-[#0078d4]" />
            Download for Windows
          </h2>
          <div className="mt-4 space-y-4">
            {shipping.map((app) => (
              <AppCard key={app.id} app={app} primary />
            ))}
          </div>
        </section>
      ) : null}

      {queued.length ? (
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-zinc-400">Coming to Windows next</h2>
          <div className="mt-4 space-y-4">
            {queued.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        </section>
      ) : null}

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

function AppCard({
  app,
  primary,
}: {
  app: (typeof OFFICE_DESKTOP_APPS)[number];
  primary?: boolean;
}) {
  const win = app.platforms.find((p) => p.platform === "windows");
  const mac = app.platforms.find((p) => p.platform === "mac");
  const href = win?.downloadPath || app.downloadPath;
  const canDownload = win && win.status !== "coming_soon" && Boolean(href);

  return (
    <article
      className={`rounded-2xl border p-5 ${
        primary
          ? "border-[#0078d4]/40 bg-gradient-to-br from-[#0078d4]/10 to-transparent"
          : "border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-white">{app.name}</p>
          <p className="text-xs text-zinc-500">Like {app.like}</p>
          <p className="mt-2 text-sm text-zinc-400">{app.tagline}</p>
          {app.aiFunnel ? (
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-violet-300">
              <Sparkles className="h-3 w-3" />
              AI: free · BYOK · tokens
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {canDownload && href ? (
            <a
              href={href}
              download
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0078d4] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#106ebe]"
            >
              <Download className="h-4 w-4" />
              Windows {win?.version || app.version}
            </a>
          ) : null}
          <Link
            href={app.webHref}
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-600/15 px-4 py-2.5 text-sm font-medium text-cyan-100 hover:bg-cyan-600/25"
          >
            <Globe className="h-4 w-4" />
            Open web app
          </Link>
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-3 text-[11px] text-zinc-500">
        {win ? (
          <li className="flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1">
            <Monitor className="h-3 w-3" />
            Windows · {statusBadge(win.status)}
            {win.sizeLabel ? ` · ${win.sizeLabel}` : ""}
          </li>
        ) : null}
        {mac ? (
          <li className="flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1">
            <Apple className="h-3 w-3" />
            macOS · {statusBadge(mac.status)}
          </li>
        ) : null}
      </ul>
      {win?.notes ? <p className="mt-2 text-xs text-zinc-600">{win.notes}</p> : null}
    </article>
  );
}
