"use client";

import Link from "next/link";
import { FREE_MARKETING_PLAYBOOK } from "@/lib/marketing-playbook";
import { ArrowRight, TrendingUp } from "lucide-react";

/** SiteGPT / Bhanu-style free tool growth callout on All Tools */
export function FreeMarketingStrip() {
  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
            <TrendingUp className="h-3.5 w-3.5" />
            Free marketing engine
          </p>
          <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">
            Rank free tools. Convert with the roof.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Same play SiteGPT rode (~90% Google traffic from free utils): ship pages people already
            search (sitemap, ATS resume, LaTeX CV), then soft-CTA into chat, prompts, and paid tiers.
          </p>
        </div>
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {FREE_MARKETING_PLAYBOOK.steps.map((s) => (
          <li
            key={s.n}
            className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-xs text-zinc-400"
          >
            <span className="font-semibold text-amber-200/90">
              {s.n}. {s.title}
            </span>
            <p className="mt-1 leading-relaxed">{s.detail}</p>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        {FREE_MARKETING_PLAYBOOK.ourTrafficToolIdeas.map((t) => (
          <Link
            key={t.slug}
            href={`/tools/${t.slug}`}
            className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-100 hover:bg-amber-500/20"
          >
            {t.keywordHook}
          </Link>
        ))}
        <Link
          href="/growth"
          className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] text-white hover:bg-white/15"
        >
          Full growth ladder + Reddit board <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-400 hover:bg-white/5"
        >
          CTA plan → pricing
        </Link>
      </div>
    </div>
  );
}
