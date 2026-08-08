"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  GraduationCap,
  Heart,
  Shield,
  Sparkles,
} from "lucide-react";
import {
  DAY_LIFE_RECIPES,
  LEARN_MISSION,
  LEARN_PATHS,
  LEARN_PRINCIPLES,
  LESSONS,
  PROMPT_FORMULA,
  SAFETY_RULES,
  type LearnLesson,
} from "@/lib/learn-ai";

function lessonById(id: string): LearnLesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

function toolHref(slug: string) {
  if (slug === "chat") return "/chat";
  if (slug === "prompt-assistant") return "/prompt-assistant";
  return `/tools/${slug}`;
}

export function LearnAiPage() {
  const [pathId, setPathId] = useState(LEARN_PATHS[0].id);
  const [copied, setCopied] = useState<string | null>(null);
  const path = LEARN_PATHS.find((p) => p.id === pathId) ?? LEARN_PATHS[0];
  const pathLessons = useMemo(
    () => path.lessonIds.map(lessonById).filter(Boolean) as LearnLesson[],
    [path]
  );

  async function copyText(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-[#0b0b12] to-violet-500/10 p-6 sm:p-10">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          <Heart className="h-3.5 w-3.5" />
          India AI literacy drive
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {LEARN_MISSION.title}
        </h1>
        <p className="mt-2 text-lg text-emerald-100/90">{LEARN_MISSION.tagline}</p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400">
          {LEARN_MISSION.indiaNote}
        </p>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {LEARN_MISSION.promise.map((p) => (
            <li
              key={p}
              className="flex items-start gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-300"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              {p}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Practice in Chat <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/tools/life-planner"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm text-zinc-200 hover:bg-white/5"
          >
            Daily life planner
          </Link>
        </div>
      </div>

      {/* Principles */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">First, calm the confusion</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {LEARN_PRINCIPLES.map((pr) => (
            <div key={pr.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="font-medium text-white">{pr.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{pr.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prompt formula */}
      <section className="mt-12 rounded-3xl border border-violet-500/25 bg-violet-500/5 p-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
          <Sparkles className="h-5 w-5 text-violet-300" />
          {PROMPT_FORMULA.name}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          This is the only “prompt engineering” most people need. Copy, fill blanks, send.
        </p>
        <ol className="mt-4 space-y-3">
          {PROMPT_FORMULA.lines.map((line, i) => (
            <li key={line.label} className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
                {i + 1}. {line.label}
              </p>
              <p className="mt-1 text-sm text-zinc-300">{line.example}</p>
            </li>
          ))}
        </ol>
        <pre className="mt-4 overflow-auto rounded-xl bg-black/50 p-4 text-xs text-zinc-300">
          {PROMPT_FORMULA.template}
        </pre>
        <button
          type="button"
          onClick={() => void copyText("formula", PROMPT_FORMULA.template)}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300"
        >
          {copied === "formula" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          Copy template
        </button>
        <Link
          href="/prompt-assistant"
          className="ml-3 text-xs text-violet-300 hover:underline"
        >
          Or use Prompt Assistant →
        </Link>
      </section>

      {/* Paths */}
      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
          <GraduationCap className="h-5 w-5 text-amber-300" />
          Pick your track
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {LEARN_PATHS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPathId(p.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm ${
                pathId === p.id
                  ? "bg-emerald-600 text-white"
                  : "border border-white/10 text-zinc-400 hover:bg-white/5"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-zinc-500">{path.who}</p>
        <ol className="mt-6 space-y-3">
          {pathLessons.map((lesson, i) => (
            <li
              key={lesson.id}
              id={lesson.id}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold text-white">
                  <span className="mr-2 text-zinc-600">{i + 1}.</span>
                  {lesson.title}
                </h3>
                <span className="text-xs text-zinc-500">~{lesson.minutes} min</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{lesson.plain}</p>
              <p className="mt-3 text-sm text-emerald-200/90">
                <span className="font-medium">Try it: </span>
                {lesson.tryIt}
              </p>
              {lesson.toolSlugs && lesson.toolSlugs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {lesson.toolSlugs.map((s) => (
                    <Link
                      key={s}
                      href={toolHref(s)}
                      className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-100 hover:bg-emerald-500/20"
                    >
                      Open {s}
                    </Link>
                  ))}
                </div>
              )}
              {lesson.externalHint && (
                <p className="mt-2 text-xs text-zinc-600">{lesson.externalHint}</p>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Day life recipes */}
      <section className="mt-12">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
          <BookOpen className="h-5 w-5 text-cyan-300" />
          Copy-paste for real Indian days
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Change the brackets. Send to Chat. Edit what is wrong. That is the whole skill.
        </p>
        <div className="mt-6 space-y-6">
          {DAY_LIFE_RECIPES.map((role) => (
            <div key={role.role}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300/90">
                {role.role}
              </h3>
              <div className="mt-2 grid gap-2">
                {role.scenarios.map((sc) => (
                  <div
                    key={sc.title}
                    className="rounded-xl border border-white/10 bg-black/30 p-3 sm:p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{sc.title}</p>
                      <button
                        type="button"
                        onClick={() => void copyText(sc.title, sc.prompt)}
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
                      >
                        {copied === sc.title ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Copy prompt
                      </button>
                    </div>
                    <p className="mt-2 font-mono text-xs leading-relaxed text-zinc-400">{sc.prompt}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety */}
      <section className="mt-12 rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
          <Shield className="h-5 w-5 text-amber-300" />
          Family safety checklist
        </h2>
        <ul className="mt-4 space-y-2">
          {SAFETY_RULES.map((r) => (
            <li key={r} className="flex gap-2 text-sm text-zinc-300">
              <span className="text-amber-400">•</span>
              {r}
            </li>
          ))}
        </ul>
      </section>

      {/* Tools strip */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">Practice tools on this roof</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            {
              href: "/tools/life-planner",
              title: "Daily life planner",
              desc: "Wake, focus blocks, family — one page plan.",
            },
            {
              href: "/tools/calendar-generator",
              title: "Calendar generator",
              desc: "Month grid + .ics for your phone.",
            },
            {
              href: "/tools/ai-worksheet-generator",
              title: "Worksheet generator",
              desc: "Teachers & self-study quizzes.",
            },
            {
              href: "/tools/ats-resume",
              title: "ATS resume check",
              desc: "Job applications that parse cleanly.",
            },
            { href: "/chat", title: "Chat", desc: "Low-pressure place to practice the 4-line ask." },
            {
              href: "/tools/multi-clock",
              title: "Multi timer",
              desc: "Pomodoro when the plan starts.",
            },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-emerald-500/40"
            >
              <p className="font-medium text-white">{t.title}</p>
              <p className="mt-1 text-sm text-zinc-500">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-12 text-center text-sm text-zinc-600">
        Sharing this page with one friend or family group is already part of the drive.
      </p>
    </div>
  );
}
