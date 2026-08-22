"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Cpu, Download, FlaskConical, HardDrive, Plug, Sparkles } from "lucide-react";
import { LLM_RECIPES, VRAM_PICKS, type LlmTrack } from "@/lib/local-llm-lab";
import { LOCAL_AI_CATALOG } from "@/lib/local-ai-catalog";

const TABS: { id: LlmTrack | "stack"; label: string }[] = [
  { id: "add", label: "Add models" },
  { id: "create", label: "Create" },
  { id: "train", label: "Train" },
  { id: "connect", label: "Connect" },
  { id: "stack", label: "Runtimes" },
];

export function LocalLlmHub() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("add");
  const recipes = useMemo(
    () => (tab === "stack" ? [] : LLM_RECIPES.filter((r) => r.track === tab)),
    [tab]
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/15 via-[#10141c] to-[#080810] p-6 sm:p-8">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
          <HardDrive className="h-3.5 w-3.5" />
          Your PC · your weights
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Local LLMs — add, create, train
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Run models on the machine in front of you. Plethora does not train on your GPU from the
          cloud — we give you the recipes, then you point chat at localhost. Nothing here is a
          paid NVIDIA SKU or a fake “free GPT-4 forever” bait.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/tools/local-ai-hardware"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
          >
            <Cpu className="h-4 w-4" /> Hardware advisor
          </Link>
          <Link
            href="/settings/backends"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:bg-white/5"
          >
            <Plug className="h-4 w-4" /> Saved backends
          </Link>
          <Link
            href="/install"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:bg-white/5"
          >
            <Download className="h-4 w-4" /> Install hub
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3.5 py-1.5 text-sm ${
              tab === t.id ? "bg-cyan-600 text-white" : "border border-white/10 text-zinc-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "stack" && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {recipes.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                <span>{r.time}</span>
                <span>·</span>
                <span>{r.gpu}</span>
              </div>
              <h2 className="mt-2 text-lg font-semibold text-white">{r.title}</h2>
              <p className="mt-1 text-sm text-zinc-400">{r.blurb}</p>
              <ol className="mt-3 list-decimal space-y-1 pl-4 text-sm text-zinc-300">
                {r.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              {r.command && (
                <pre className="mt-3 overflow-auto rounded-xl bg-black/50 p-3 text-[11px] text-cyan-100/90">
                  {r.command}
                </pre>
              )}
            </article>
          ))}
        </div>
      )}

      {tab === "stack" && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {LOCAL_AI_CATALOG.filter((e) => e.kind === "runtime" || e.kind === "workspace").map(
            (e) => (
              <a
                key={e.id}
                href={e.installUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:border-cyan-500/30"
              >
                <p className="font-medium text-white">{e.name}</p>
                <p className="mt-1 text-xs text-zinc-500">{e.costLabel}</p>
                <p className="mt-2 text-sm text-zinc-400">{e.blurb}</p>
              </a>
            )
          )}
        </div>
      )}

      <section className="mt-10 rounded-2xl border border-white/10 p-5">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <FlaskConical className="h-4 w-4 text-cyan-400" />
          What fits your GPU
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="pb-2 pr-4">VRAM</th>
                <th className="pb-2">Start here</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {VRAM_PICKS.map((row) => (
                <tr key={row.vram} className="border-t border-white/10">
                  <td className="py-2.5 pr-4 font-medium text-white">{row.vram}</td>
                  <td className="py-2.5">{row.models}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-6 flex items-center gap-2 text-xs text-zinc-600">
        <Sparkles className="h-3 w-3" />
        Python helpers live in web/pipelines/local_llm/ — create a Modelfile or start a LoRA job
        on your machine, not on Vercel.
      </p>
    </div>
  );
}
