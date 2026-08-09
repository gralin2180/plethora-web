"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Plug,
  Search,
  Sparkles,
  Terminal,
  Wrench,
} from "lucide-react";
import { recommendAiForTask, PLATFORM_LABELS } from "@/lib/recommender";
import { BUDGET_OPTIONS, type BudgetTier } from "@/lib/ai-directories";
import { assessContentSafety, type SafetyAssessment } from "@/lib/content-safety";
import { ContentWarningDialog } from "@/components/ContentWarningDialog";
import type { AiPlatform, TaskRecommendation, ToolPlaybookItem } from "@/lib/types";

const PLATFORM_ORDER: AiPlatform[] = [
  "web",
  "mobile",
  "ide",
  "terminal",
  "local",
  "mcp",
  "internal",
];

export function TaskAiFinder() {
  const [task, setTask] = useState("");
  const [budget, setBudget] = useState<BudgetTier>("any");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaskRecommendation | null>(null);
  const [copied, setCopied] = useState(false);
  const [openAgent, setOpenAgent] = useState<string | null>(null);
  const [warning, setWarning] = useState<SafetyAssessment | null>(null);
  const [pendingTask, setPendingTask] = useState<string | null>(null);

  function executeSearch(value: string, b: BudgetTier) {
    setLoading(true);
    setTimeout(() => {
      setResult(recommendAiForTask(value, b));
      setLoading(false);
      void fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: "ai-finder" }),
      }).catch(() => {});
    }, 450);
  }

  function runSearch(value: string) {
    if (!value.trim()) return;
    const safety = assessContentSafety(value);
    if (safety.hardBlock) {
      setWarning(safety);
      setPendingTask(null);
      return;
    }
    if (safety.needsWarning) {
      setWarning(safety);
      setPendingTask(value);
      return;
    }
    executeSearch(value, budget);
  }

  const exampleTasks = [
    "i wanna make money using ugc",
    "Create Facebook ads for my online store",
    "Build a landing page for my coaching business",
    "Edit podcast videos faster",
    "Automate my email marketing workflow",
    "Generate product images for Instagram",
    "Write code for a SaaS app with Cursor",
  ];

  async function copyPrompt() {
    if (!result?.refinedPromptSuggestion) return;
    await navigator.clipboard.writeText(result.refinedPromptSuggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-5xl">
      {warning && (
        <ContentWarningDialog
          assessment={warning}
          onCancel={() => {
            setWarning(null);
            setPendingTask(null);
          }}
          onContinue={() => {
            const t = pendingTask;
            setWarning(null);
            setPendingTask(null);
            if (t) executeSearch(t, budget);
          }}
        />
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600/20 text-cyan-400">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">What do you want to get done?</h2>
            <p className="text-sm text-zinc-500">
              We hold your hand: agent setup → expert prompt → many tools by budget → live AI
              directories → MCP. We never leave you without a next step.
            </p>
          </div>
        </div>

        <label className="mb-3 block text-xs font-medium uppercase tracking-wide text-zinc-500">
          Budget
        </label>
        <div className="mb-4 flex flex-wrap gap-2">
          {BUDGET_OPTIONS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setBudget(b.id);
                if (result) executeSearch(task || result.taskSummary, b.id);
              }}
              title={b.hint}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                budget === b.id
                  ? "bg-cyan-600 text-white"
                  : "border border-white/10 text-zinc-400 hover:border-cyan-500/40"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch(task)}
            placeholder="e.g. i wanna make money using ugc"
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <button
            onClick={() => runSearch(task)}
            disabled={loading || !task.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 font-medium text-white hover:bg-cyan-500 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Super-assist me
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {exampleTasks.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setTask(ex);
                runSearch(ex);
              }}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400 hover:border-cyan-500/50 hover:text-cyan-300"
            >
              {ex}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-600">
          Prefer local GPU?{" "}
          <Link href="/settings/backends" className="text-cyan-500 hover:underline">
            Configure Ollama / LM Studio / llama.cpp
          </Link>
        </p>
      </div>

      {result && (
        <div className="mt-8 space-y-10">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
            <p className="text-sm text-cyan-200">
              <span className="font-medium">Mission:</span> {result.taskSummary}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Budget: {result.budget ?? budget} · {result.playbooks.length} tools ·{" "}
              {result.directoryLinks?.length ?? 0} directories · {result.recommendedAgents.length} agents
            </p>
            {result.beginnerTip && (
              <p className="mt-2 text-xs text-zinc-400">{result.beginnerTip}</p>
            )}
            {result.neverGiveUpNote && (
              <p className="mt-2 text-xs text-emerald-400/80">{result.neverGiveUpNote}</p>
            )}
          </div>

          <section>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <Wrench className="h-5 w-5 text-cyan-400" />
              Your path (exact steps)
            </h3>
            <p className="mb-4 text-sm text-zinc-500">
              Multi-model: one OpenRouter key under{" "}
              <Link href="/settings/ai-keys" className="text-cyan-400 hover:underline">
                AI keys
              </Link>{" "}
              can call many hosted models (Claude-class, Gemini, DeepSeek, Llama, some
              Perplexity-routed models when listed). We cannot silently mint free vendor keys for every
              company — BYOK or sign-in free tier is the sustainable path.
            </p>
            <ol className="space-y-3">
              {result.skillPath.map((step) => (
                <li
                  key={step.order}
                  className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600/20 text-sm font-bold text-cyan-300">
                    {step.order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{step.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">{step.detail}</p>
                    {step.exactBullets && step.exactBullets.length > 0 && (
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-300">
                        {step.exactBullets.map((b) => (
                          <li key={b.slice(0, 48)}>{b}</li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {step.tryHereHref && (
                        <Link
                          href={step.tryHereHref}
                          className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-cyan-500"
                        >
                          {step.tryHereLabel || "Try here now"}
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                      {step.actions?.map((a) =>
                        a.external || a.href.startsWith("http") ? (
                          <a
                            key={a.label + a.href}
                            href={a.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300 hover:border-cyan-500/40 hover:text-white"
                          >
                            {a.label}
                          </a>
                        ) : (
                          <Link
                            key={a.label + a.href}
                            href={a.href}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300 hover:border-cyan-500/40 hover:text-white"
                          >
                            {a.label}
                          </Link>
                        )
                      )}
                      {step.href && !step.tryHereHref && (
                        <a
                          href={step.href}
                          target={step.href.startsWith("http") ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
                        >
                          Open <ArrowRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
              <Terminal className="h-5 w-5 text-violet-400" />
              Don&apos;t have an AI agent yet? Set one up
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {result.recommendedAgents.map((agent) => (
                <div key={agent.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{agent.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{agent.bestFor}</p>
                    </div>
                    <a
                      href={agent.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-500"
                    >
                      Open
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenAgent(openAgent === agent.id ? null : agent.id)}
                    className="mt-3 text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    {openAgent === agent.id ? "Hide setup" : "Show setup steps"}
                  </button>
                  {openAgent === agent.id && (
                    <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-xs text-zinc-400">
                      {agent.steps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          </section>

          {result.refinedPromptSuggestion && (
            <section
              id="ready-prompt"
              className="scroll-mt-24 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-emerald-300">Ready-to-paste prompt</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Free = expert templates (+ free polish API when configured). Paid = premium polish.{" "}
                    <Link href="/prompt-assistant" className="text-violet-400 hover:underline">
                      Prompt Assistant
                    </Link>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy prompt"}
                </button>
              </div>
              <pre className="mt-4 max-h-[min(50vh,420px)] overflow-y-auto whitespace-pre-wrap rounded-xl bg-black/40 p-4 text-sm leading-relaxed text-zinc-300">
                {result.refinedPromptSuggestion}
              </pre>
            </section>
          )}

          {result.directoryLinks && result.directoryLinks.length > 0 && (
            <section>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Live AI directories (always more options)
              </h3>
              <p className="mb-4 text-sm text-zinc-500">
                Scour these constantly updated lists when you need more tools for any topic. Search
                hints:{" "}
                {(result.searchHints ?? []).map((h) => (
                  <span
                    key={h}
                    className="mr-2 inline-block rounded border border-white/10 px-2 py-0.5 text-xs text-zinc-400"
                  >
                    {h}
                  </span>
                ))}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.directoryLinks.map((d) => (
                  <a
                    key={d.id}
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-cyan-500/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-white">{d.name}</p>
                      <ExternalLink className="h-4 w-4 shrink-0 text-zinc-500" />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{d.description}</p>
                    <p className="mt-2 text-xs text-cyan-300/80">How: {d.howToUse}</p>
                    <p className="mt-1 text-[10px] text-zinc-600">{d.updateNote}</p>
                  </a>
                ))}
              </div>
            </section>
          )}

          {result.installRepos && result.installRepos.length > 0 && (
            <section>
              <h3 className="mb-2 text-lg font-semibold text-white">
                Free repos to install on your PC
              </h3>
              <p className="mb-4 text-sm text-zinc-500">
                Local LLMs, hardcore scrapers, browser agents — set them up so agents can reach the
                open web. Full catalog:{" "}
                <Link href="/install" className="text-amber-400 hover:underline">
                  Install Hub
                </Link>
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.installRepos.map((r) => (
                  <a
                    key={r.id}
                    href={r.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 hover:border-amber-500/40"
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{r.name}</p>
                      {r.hardcore && (
                        <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-300">
                          HARDCORE
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{r.description}</p>
                    <p className="mt-2 text-xs text-amber-200/70">{r.howToSetUp}</p>
                    {r.quickInstall && (
                      <p className="mt-2 font-mono text-[10px] text-zinc-600">{r.quickInstall}</p>
                    )}
                  </a>
                ))}
              </div>
            </section>
          )}

          {result.agentDiscoveryLists && result.agentDiscoveryLists.length > 0 && (
            <section>
              <h3 className="mb-2 text-lg font-semibold text-white">
                More agents & scrapers (live GitHub lists)
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.agentDiscoveryLists.map((d) => (
                  <a
                    key={d.url}
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-white/10 p-4 hover:border-red-500/30"
                  >
                    <p className="font-medium text-white">{d.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">{d.description}</p>
                    <p className="mt-2 text-xs text-red-300/80">{d.howToUse}</p>
                  </a>
                ))}
              </div>
            </section>
          )}

          {result.internalTools.length > 0 && (
            <section>
              <h3 className="mb-4 text-lg font-semibold text-white">On Plethora (try free)</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.internalTools.map((tool) => (
                  <Link
                    key={tool.id}
                    href={
                      tool.slug === "prompt-assistant" || tool.slug === "ai-finder"
                        ? `/${tool.slug}`
                        : `/tools/${tool.slug}`
                    }
                    className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 hover:bg-violet-500/10"
                  >
                    <p className="font-medium text-white">{tool.name}</p>
                    <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{tool.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {PLATFORM_ORDER.filter((p) => result.groupedByPlatform[p]?.length).map((platform) => (
            <section key={platform}>
              <h3 className="mb-4 text-lg font-semibold text-white">
                {PLATFORM_LABELS[platform]}
              </h3>
              <div className="grid gap-3">
                {result.playbooks
                  .filter((p) => p.tool.platform === platform)
                  .map((item) => (
                    <PlaybookCard key={item.tool.id} item={item} />
                  ))}
              </div>
            </section>
          ))}

          {result.mcpSuggestions.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-white">
                <Plug className="h-5 w-5 text-emerald-400" />
                MCP automations
              </h3>
              <p className="mb-4 text-sm text-zinc-500">
                Full multi-client setup on{" "}
                <Link href="/mcp" className="text-emerald-400 hover:underline">
                  MCP Hub
                </Link>
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.mcpSuggestions.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
                  >
                    <p className="font-medium text-white">{m.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">{m.description}</p>
                    <p className="mt-2 text-xs text-emerald-300/90">Why: {m.whyUse}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function PlaybookCard({ item }: { item: ToolPlaybookItem }) {
  const { tool, whyForYou, howTo } = item;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-medium text-white">{tool.name}</p>
          <p className="mt-1 text-sm text-zinc-500">{tool.description}</p>
        </div>
        {tool.url && (
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20"
          >
            Open site
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <p className="mt-3 text-sm text-zinc-300">
        <span className="font-medium text-cyan-300/90">Why for your goal:</span> {whyForYou}
      </p>
      <p className="mt-2 text-sm text-zinc-400">
        <span className="font-medium text-zinc-300">How to use it:</span> {howTo}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge label={tool.pricing} />
        <Badge label={tool.skillLevel} />
        <Badge label={tool.platform} />
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] capitalize text-zinc-400">
      {label}
    </span>
  );
}
