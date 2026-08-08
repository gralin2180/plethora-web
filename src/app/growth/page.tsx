import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  Megaphone,
  MessageCircle,
  ShieldAlert,
  Target,
  PlayCircle,
} from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { FREE_MARKETING_PLAYBOOK } from "@/lib/marketing-playbook";
import {
  CAMPAIGN_PHASES,
  COMMENT_SKELETONS,
  MARKETING_WATCHLIST,
  REDDIT_DEMAND_CAPTURE,
  REDDIT_THREAD_TARGETS,
} from "@/lib/campaign-playbook";

export const metadata: Metadata = {
  title: "Internal — not for production nav",
  description: "Internal growth notes. Not linked from the product.",
  robots: { index: false, follow: false },
};

export default function GrowthPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400/90">
          Later-stage ready · study first, spend later
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Growth playbook
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Capture demand that already exists (Google → free tools, Google → Reddit threads), then
          layer story launches and paid only when conversion is measurable. This page is the
          internal campaign board — open tools, study the videos, execute phases in order.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
          >
            Open free tools <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={REDDIT_DEMAND_CAPTURE.video}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5"
          >
            <PlayCircle className="h-4 w-4 text-red-400" />
            Reddit ranking video
          </a>
        </div>

        {/* Phases */}
        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Target className="h-5 w-5 text-violet-400" />
            Campaign ladder
          </h2>
          <div className="mt-4 space-y-3">
            {CAMPAIGN_PHASES.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-semibold text-white">{p.name}</h3>
                  <span className="text-xs text-zinc-500">{p.when}</span>
                </div>
                <ul className="mt-2 list-inside list-disc text-sm text-zinc-400">
                  {p.goals.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-zinc-500">
                  Channels: {p.channels.join(" · ")} · KPIs: {p.kpis.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Reddit play from CtkMPGyAVWs */}
        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <MessageCircle className="h-5 w-5 text-orange-400" />
            Reddit demand capture
          </h2>
          <p className="mt-2 text-sm text-zinc-400">{REDDIT_DEMAND_CAPTURE.insight}</p>
          <p className="mt-1 text-sm text-zinc-500">{REDDIT_DEMAND_CAPTURE.whyItConverts}</p>
          <ol className="mt-4 space-y-2">
            {REDDIT_DEMAND_CAPTURE.steps.map((s) => (
              <li
                key={s.n}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm"
              >
                <span className="font-medium text-orange-200/90">
                  {s.n}. {s.title}
                </span>
                <p className="mt-1 text-zinc-400">{s.detail}</p>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100/90">
            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <p className="font-medium">Stay clean</p>
              <ul className="mt-1 list-inside list-disc text-xs text-amber-100/70">
                {REDDIT_DEMAND_CAPTURE.antiPatterns.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Thread targets */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white">Thread hunting board</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Paste these Google queries (incognito). Comment only where you can be genuinely useful.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Google query</th>
                  <th className="px-3 py-2">Subs</th>
                  <th className="px-3 py-2">Soft pitch</th>
                  <th className="px-3 py-2">Tool</th>
                </tr>
              </thead>
              <tbody>
                {REDDIT_THREAD_TARGETS.map((t) => (
                  <tr key={t.googleQuery} className="border-b border-white/5 text-zinc-300">
                    <td className="px-3 py-3 font-mono text-xs text-cyan-200/90">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(t.googleQuery)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {t.googleQuery}
                      </a>
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-500">{t.subreddits.join(", ")}</td>
                    <td className="px-3 py-3 text-xs text-zinc-400">{t.softPitch}</td>
                    <td className="px-3 py-3">
                      <Link
                        href={t.toolSlug.startsWith("http") ? t.toolSlug : t.toolSlug === "tools" || t.toolSlug === "chat" || t.toolSlug === "mcp-setup" ? `/${t.toolSlug === "tools" ? "tools" : t.toolSlug === "mcp-setup" ? "mcp" : "chat"}` : `/tools/${t.toolSlug}`}
                        className="text-xs text-violet-300 hover:underline"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Comment skeletons */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white">Comment skeletons</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Rewrite in your voice — never bulk-paste. Help first, soft brand once.
          </p>
          <div className="mt-4 space-y-3">
            {COMMENT_SKELETONS.map((c) => (
              <div key={c.scenario} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs font-medium text-violet-300">{c.scenario}</p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-zinc-300">{c.draft}</pre>
              </div>
            ))}
          </div>
        </section>

        {/* Free tools recap */}
        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Megaphone className="h-5 w-5 text-amber-400" />
            Free-tool SEO (phase 1)
          </h2>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2">
            {FREE_MARKETING_PLAYBOOK.steps.map((s) => (
              <li
                key={s.n}
                className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-zinc-400"
              >
                <span className="font-semibold text-amber-200/90">
                  {s.n}. {s.title}
                </span>
                <p className="mt-1">{s.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Watchlist */}
        <section className="mt-12">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <BookOpen className="h-5 w-5 text-cyan-400" />
            Marketing video & article watchlist
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Study these before paid campaigns. Order roughly early → late stage.
          </p>
          <ul className="mt-4 space-y-2">
            {MARKETING_WATCHLIST.map((v) => (
              <li
                key={v.url}
                className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-white hover:text-cyan-300"
                  >
                    {v.title}
                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                  </a>
                  <p className="mt-0.5 text-xs text-zinc-500">{v.useFor}</p>
                </div>
                <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
                  {v.stage}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SiteShell>
  );
}
