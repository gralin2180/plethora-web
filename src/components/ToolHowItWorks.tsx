"use client";

import { getToolHowItWorks } from "@/lib/tool-how-it-works";
import { ArrowRight, Shield } from "lucide-react";

export function ToolHowItWorks({
  slug,
  name,
  category,
}: {
  slug: string;
  name: string;
  category: string;
}) {
  const doc = getToolHowItWorks(slug, name, category);

  return (
    <section
      className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.07] via-transparent to-cyan-500/[0.05]"
      aria-labelledby={`how-${slug}`}
    >
      <div className="border-b border-white/5 px-5 py-4 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          How it works
        </p>
        <h2 id={`how-${slug}`} className="mt-1 text-base font-semibold text-white">
          Path from input → result
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-400">{doc.summary}</p>
      </div>

      <div className="px-5 py-6 sm:px-6">
        <ol className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-0">
          {doc.steps.map((step, i) => (
            <li key={step.id} className="flex min-w-0 flex-1 items-stretch gap-0 sm:flex-row">
              <div className="relative flex flex-1 flex-col rounded-xl border border-white/10 bg-black/30 px-4 py-4">
                <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600/90 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-white">{step.label}</span>
                {step.detail && (
                  <span className="mt-1 text-xs leading-relaxed text-zinc-500">{step.detail}</span>
                )}
              </div>
              {i < doc.steps.length - 1 && (
                <div
                  className="flex items-center justify-center px-1 py-2 text-zinc-600 sm:px-2"
                  aria-hidden
                >
                  <ArrowRight className="hidden h-4 w-4 sm:block" />
                  <span className="text-xs sm:hidden">↓</span>
                </div>
              )}
            </li>
          ))}
        </ol>

        {/* Mini graph rails */}
        <div className="mt-6 hidden h-1.5 overflow-hidden rounded-full bg-white/5 sm:block">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500/80 to-cyan-400"
            style={{ width: "100%" }}
          />
        </div>

        {doc.privacyNote && (
          <p className="mt-4 flex items-start gap-2 text-xs text-zinc-500">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/80" />
            {doc.privacyNote}
          </p>
        )}
      </div>
    </section>
  );
}
