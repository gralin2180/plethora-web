import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Code,
  Cpu,
  HardDrive,
  Megaphone,
  Plug,
  Search,
  MessageSquare,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { PLATFORM_TOOLS } from "@/lib/tools-registry";
import { HARDCORE_BUNDLE } from "@/lib/hardcore-bundle";
import { SKILL_LEVELS } from "@/lib/skill-levels";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Prompt Engineering Assistant",
    desc: "Bad at explaining? We read your message, ask smart questions, and deliver exactly what you meant.",
    href: "/prompt-assistant",
    color: "violet",
  },
  {
    icon: Search,
    title: "AI Tool Finder",
    desc: "Describe any task — get every AI, MCP server, plugin, and local app that can help.",
    href: "/ai-finder",
    color: "cyan",
  },
  {
    icon: Zap,
    title: "50+ Runnable Tools",
    desc: "Ads, content, websites, automation — all under one roof. Try free, upgrade for more.",
    href: "/tools",
    color: "amber",
  },
  {
    icon: Plug,
    title: "MCP & Plugin Hub",
    desc: "Connect Cursor, Claude, terminal AI, and local models like Ollama. Setup guides included.",
    href: "/mcp",
    color: "emerald",
  },
];

export function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.25)_0%,_transparent_50%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/15 px-5 py-2 text-sm font-medium text-violet-200 sm:text-base">
            <Sparkles className="h-4 w-4" />
            Find it. Run it. One roof.
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Stop hunting 40 tabs
            <span className="block bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              We gather the tools for you
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Directories list apps. Converters live elsewhere. Prompts live somewhere else. Plethora is
            the place that <strong className="font-medium text-zinc-200">gets you unstuck</strong> —
            free utilities, Finder for the jungle, Local AI on your GPU. We don&apos;t cosplay Cursor
            or Freebuff.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/tools"
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3.5 font-medium text-white hover:bg-violet-500"
            >
              Browse all tools
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/learn"
              className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-8 py-3.5 font-medium text-emerald-100 hover:bg-emerald-500/20"
            >
              <BookOpen className="h-4 w-4" />
              Learn how to use AI
            </Link>
          </div>
        </div>
      </section>

      {/* AI literacy drive */}
      <section className="border-t border-white/10 bg-gradient-to-b from-emerald-500/10 to-transparent px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                India · everyday leverage
              </p>
              <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                Learn how to use AI
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-400">
                For the common man — students, shops, job seekers, parents, teachers — not just coders.
                Plain language, free phone-first starts, safety for OTP/Aadhaar, and real copy-paste
                recipes for study, WhatsApp business, and family life.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/learn"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  Open the Learn drive <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/tools/life-planner"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
                >
                  Daily life planner
                </Link>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { t: "4-line prompt formula", d: "Who + what + details + style" },
                { t: "Role tracks", d: "Student · job · shop · home" },
                { t: "Family safety checklist", d: "Banking & scam sense" },
                { t: "Practice tools", d: "Planner · calendar · chat" },
              ].map((c) => (
                <div
                  key={c.t}
                  className="rounded-2xl border border-emerald-500/20 bg-black/40 p-4"
                >
                  <p className="font-medium text-white">{c.t}</p>
                  <p className="mt-1 text-sm text-zinc-500">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Local / personal — big, not footer-sized */}
      <section className="border-y border-white/10 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Power features
          </p>
          <h2 className="mt-3 text-center text-3xl font-bold text-white sm:text-4xl">
            Your machine. Your profile.
          </h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Link
              href="/settings/backends"
              className="group relative overflow-hidden rounded-3xl border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-500/20 to-[#0b0b12] p-8 sm:p-10"
            >
              <HardDrive className="h-12 w-12 text-cyan-300" />
              <h3 className="mt-5 text-2xl font-bold text-white sm:text-3xl">Local AI backends</h3>
              <p className="mt-3 text-base text-zinc-300">
                Wire Ollama, LM Studio, or any OpenAI-compatible endpoint. Free after install. Data
                can stay off the cloud when you want it to.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-lg font-semibold text-cyan-300 group-hover:gap-3">
                Open backends <ArrowRight className="h-5 w-5" />
              </span>
            </Link>
            <Link
              href="/settings/personal"
              className="group relative overflow-hidden rounded-3xl border-2 border-violet-500/40 bg-gradient-to-br from-violet-500/20 to-[#0b0b12] p-8 sm:p-10"
            >
              <User className="h-12 w-12 text-violet-300" />
              <h3 className="mt-5 text-2xl font-bold text-white sm:text-3xl">Personal context</h3>
              <p className="mt-3 text-base text-zinc-300">
                Brand, tone, goals — stored locally so Finder and chat fit you. Not trained on by us
                as a default upload.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-lg font-semibold text-violet-300 group-hover:gap-3">
                Set context <ArrowRight className="h-5 w-5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-white/[0.02] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group rounded-2xl border border-white/10 bg-[#0b0b12] p-6 transition hover:border-violet-500/40"
            >
              <f.icon className="mb-4 h-8 w-8 text-violet-400" />
              <h3 className="font-semibold text-white group-hover:text-violet-200">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-500">{f.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm text-violet-400">
                Explore <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Popular tools</h2>
              <p className="mt-1 text-zinc-500">Try free — no account needed for first runs</p>
            </div>
            <Link href="/tools" className="text-sm text-violet-400 hover:text-violet-300">
              View all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_TOOLS.slice(0, 6).map((tool) => (
              <Link
                key={tool.id}
                href={
                  tool.slug === "prompt-assistant" || tool.slug === "ai-finder"
                    ? `/${tool.slug}`
                    : `/tools/${tool.slug}`
                }
                className="rounded-xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/20"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{tool.name}</h3>
                  {tool.isPro && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">
                      PRO
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-zinc-500 line-clamp-2">{tool.description}</p>
                <p className="mt-3 text-xs text-zinc-600">
                  {tool.freeRunsPerDay} free runs/day · {tool.category}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-white">
            Built for every skill level
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-zinc-500">
            From first-time AI users to terminal-running experts — the experience adapts to you.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SKILL_LEVELS.map((level) => (
              <div
                key={level.id}
                className={`rounded-xl border p-5 ${
                  level.id === "expert"
                    ? "border-red-500/30 bg-red-500/5"
                    : "border-white/10 bg-[#0b0b12]"
                }`}
              >
                <h3 className="font-semibold text-white">{level.label}</h3>
                <p className="mt-1 text-xs text-violet-300/80">{level.tagline}</p>
                <p className="mt-2 text-sm text-zinc-500">{level.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/auth/signup"
              className="text-sm text-violet-400 hover:text-violet-300"
            >
              Sign up free — we&apos;ll tailor tools to your level →
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-gradient-to-b from-violet-950/20 to-transparent px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <Megaphone className="mx-auto h-10 w-10 text-violet-400" />
          <h2 className="mt-4 text-3xl font-bold text-white">
            Not sure which AI to use?
          </h2>
          <p className="mt-4 text-zinc-400">
            Tell us what you want to do. We&apos;ll suggest ChatGPT, Claude, Cursor,
            Midjourney, local AI, MCP servers — everything that fits your task.
          </p>
          <Link
            href="/ai-finder"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-8 py-3 font-medium text-white hover:bg-cyan-500"
          >
            <Search className="h-4 w-4" />
            Find AI for any task
          </Link>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: "Creators & solopreneurs",
              items: ["Ad copy & hooks", "Social captions", "Landing pages", "Content calendars"],
            },
            {
              icon: Megaphone,
              title: "Marketers & ad teams",
              items: ["Campaign briefs", "Persona builder", "Ad creatives", "Competitor research"],
            },
            {
              icon: Code,
              title: "Developers & AI power users",
              items: ["MCP setup guides", "Cursor rules", "Workflow automation", "Local AI (Ollama)"],
            },
          ].map((audience) => (
            <div
              key={audience.title}
              className="rounded-2xl border border-white/10 p-6"
            >
              <audience.icon className="h-8 w-8 text-violet-400" />
              <h3 className="mt-4 font-semibold text-white">{audience.title}</h3>
              <ul className="mt-4 space-y-2">
                {audience.items.map((item) => (
                  <li key={item} className="text-sm text-zinc-500">• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-8">
              <Sparkles className="h-8 w-8 text-violet-400" />
              <h2 className="mt-4 text-2xl font-bold text-white">For everyone else</h2>
              <p className="mt-3 text-zinc-400">
                Creators, marketers, beginners — try tools free, upgrade to Pro when you need more runs.
              </p>
              <Link
                href="/pricing"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-500"
              >
                See pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8">
              <Cpu className="h-8 w-8 text-red-400" />
              <h2 className="mt-4 text-2xl font-bold text-white">Hardcore All-Access</h2>
              <p className="mt-3 text-zinc-400">
                Developers & AI power users — every tool, MCP configs, workflows, zero caps. One subscription.
              </p>
              <p className="mt-4 text-sm text-red-300/80">
                {HARDCORE_BUNDLE.priceLabel}{HARDCORE_BUNDLE.period} · all tools included
              </p>
              <Link
                href="/hardcore"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-500"
              >
                Get All-Access
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-violet-500/30 bg-violet-500/10 p-10 text-center">
          <h2 className="text-2xl font-bold text-white">Start free. Upgrade when ready.</h2>
          <p className="mt-3 text-zinc-400">
            Basic tools free daily. Pro unlocks advanced workflows, MCP integrations,
            and unlimited runs.
          </p>
          <Link
            href="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-medium text-black hover:bg-zinc-200"
          >
            See pricing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
