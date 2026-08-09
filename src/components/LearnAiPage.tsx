"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  GraduationCap,
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
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-[#0b0b12] to-violet-950/40 p-6 sm:p-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
          Guided learning
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl sm:leading-tight">
          {LEARN_MISSION.title}
        </h1>
        <p className="mt-3 text-lg font-medium leading-snug text-zinc-200">
          {LEARN_MISSION.tagline}
        </p>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
          {LEARN_MISSION.intro}
        </p>
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {LEARN_MISSION.promise.map((p) => (
            <li
              key={p}
              className="flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm leading-snug text-zinc-300"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400/90" />
              {p}
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
          >
            Practice in Chat <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/tools/life-planner"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm text-zinc-200 transition hover:bg-white/5"
          >
            Daily planner
          </Link>
        </div>
      </div>

      {/* Principles */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight text-white">How to think about AI</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
          Four principles most productive users return to every time they open a chat.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {LEARN_PRINCIPLES.map((pr, i) => (
            <div
              key={pr.title}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
            >
              <p className="text-[11px] font-medium tabular-nums text-zinc-600">
                0{i + 1}
              </p>
              <h3 className="mt-2 font-medium leading-snug text-white">{pr.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{pr.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Prompt formula */}
      <section className="mt-14 rounded-3xl border border-violet-500/20 bg-violet-500/[0.06] p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
          <Sparkles className="h-5 w-5 text-violet-300" />
          {PROMPT_FORMULA.name}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          The structure most people need. Fill in each line, send once, refine only if needed.
        </p>
        <ol className="mt-5 space-y-3">
          {PROMPT_FORMULA.lines.map((line, i) => (
            <li key={line.label} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-violet-300/90">
                {i + 1}. {line.label}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">{line.example}</p>
            </li>
          ))}
        </ol>
        <pre className="mt-5 overflow-auto rounded-xl border border-white/5 bg-black/50 p-4 text-xs leading-relaxed text-zinc-300">
          {PROMPT_FORMULA.template}
        </pre>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void copyText("formula", PROMPT_FORMULA.template)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/5"
          >
            {copied === "formula" ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Copy template
          </button>
          <Link href="/prompt-assistant" className="text-xs text-violet-300 hover:underline">
            Or use Prompt Assistant →
          </Link>
        </div>
      </section>

      {/* Paths */}
      <section className="mt-14">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
          <GraduationCap className="h-5 w-5 text-amber-300/90" />
          Choose a path
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Each path is a short sequence of lessons. Work through them in order — about an hour for
          the beginner track.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {LEARN_PATHS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPathId(p.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                pathId === p.id
                  ? "bg-white text-zinc-900"
                  : "border border-white/10 text-zinc-400 hover:bg-white/5"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-zinc-500">{path.who}</p>
        <ol className="mt-6 space-y-3">
          {pathLessons.map((lesson, i) => (
            <li
              key={lesson.id}
              id={lesson.id}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-medium leading-snug text-white">
                  <span className="mr-2 text-zinc-600">{i + 1}.</span>
                  {lesson.title}
                </h3>
                <span className="text-xs tabular-nums text-zinc-500">~{lesson.minutes} min</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{lesson.plain}</p>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                <span className="font-medium text-zinc-200">Try it: </span>
                {lesson.tryIt}
              </p>
              {lesson.toolSlugs && lesson.toolSlugs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {lesson.toolSlugs.map((s) => (
                    <Link
                      key={s}
                      href={toolHref(s)}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-zinc-300 transition hover:border-violet-500/40 hover:text-white"
                    >
                      Open {s}
                    </Link>
                  ))}
                </div>
              )}
              {lesson.externalHint && (
                <p className="mt-2 text-xs leading-relaxed text-zinc-600">{lesson.externalHint}</p>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Recipes */}
      <section className="mt-14">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
          <BookOpen className="h-5 w-5 text-cyan-300/90" />
          Ready-to-use prompts
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Replace the brackets with your details. Send to Chat. Edit anything that is not quite right.
        </p>
        <div className="mt-6 space-y-8">
          {DAY_LIFE_RECIPES.map((role) => (
            <div key={role.role}>
              <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                {role.role}
              </h3>
              <div className="mt-3 grid gap-2">
                {role.scenarios.map((sc) => (
                  <div
                    key={sc.title}
                    className="rounded-xl border border-white/10 bg-black/25 p-3.5 sm:p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white">{sc.title}</p>
                      <button
                        type="button"
                        onClick={() => void copyText(sc.title, sc.prompt)}
                        className="inline-flex items-center gap-1 text-[11px] text-zinc-400 transition hover:text-white"
                      >
                        {copied === sc.title ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        Copy
                      </button>
                    </div>
                    <p className="mt-2 font-mono text-xs leading-relaxed text-zinc-400">
                      {sc.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety */}
      <section className="mt-14 rounded-3xl border border-amber-500/25 bg-amber-500/[0.05] p-6 sm:p-8">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
          <Shield className="h-5 w-5 text-amber-300/90" />
          Safety checklist
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Share this with anyone who is new to AI chat tools.
        </p>
        <ul className="mt-5 space-y-2.5">
          {SAFETY_RULES.map((r) => (
            <li key={r} className="flex gap-2.5 text-sm leading-relaxed text-zinc-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/80" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      {/* Tools strip */}
      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight text-white">Practice on Plethora</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Tools designed to turn what you learn into a habit.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            {
              href: "/tools/life-planner",
              title: "Daily life planner",
              desc: "Turn priorities into a clear day plan.",
            },
            {
              href: "/tools/calendar-generator",
              title: "Calendar generator",
              desc: "Month grid and .ics for your phone.",
            },
            {
              href: "/tools/ai-worksheet-generator",
              title: "Worksheet generator",
              desc: "Quizzes and practice sets for study or teaching.",
            },
            {
              href: "/tools/ats-resume",
              title: "ATS resume check",
              desc: "Catch resume issues before you apply.",
            },
            {
              href: "/chat",
              title: "Chat",
              desc: "A focused place to practice the four-line request.",
            },
            {
              href: "/tools/multi-clock",
              title: "Multi timer",
              desc: "Timers when your plan becomes execution.",
            },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20"
            >
              <p className="font-medium text-white">{t.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-14 text-center text-sm leading-relaxed text-zinc-600">
        Share this page with a colleague or friend who is still figuring AI out.
      </p>
    </div>
  );
}
