import Link from "next/link";
import {
  ArrowRight,
  MessageSquare,
  Plug,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { PLATFORM_TOOLS } from "@/lib/tools-registry";
import { StickyRails } from "@/components/StickyRails";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Prompt Assistant",
    desc: "Messy goal → expert, model-ready prompt.",
    href: "/prompt-assistant",
  },
  {
    icon: Search,
    title: "AI Finder",
    desc: "Exact path: chat, tools, MCP for any job.",
    href: "/ai-finder",
  },
  {
    icon: Zap,
    title: "Tools that run",
    desc: "Converters, SEO, trading, captions — under one roof.",
    href: "/tools",
  },
  {
    icon: Plug,
    title: "Connect & MCP",
    desc: "Slack, Canva, Figma, Notion + Plethora MCP for agents.",
    href: "/connect",
  },
];

export function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.25)_0%,_transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/15 px-4 py-1.5 text-sm font-medium text-violet-200">
            <Sparkles className="h-4 w-4" />
            Tools. AI. One place.
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-[1.15]">
            <span className="block">Everything you need to ship,</span>
            <span className="mt-1 block bg-gradient-to-r from-violet-300 via-violet-400 to-cyan-300 bg-clip-text pb-[0.15em] leading-[1.25] text-transparent">
              without twenty open tabs
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Prompt engineering first — then free utilities, AI studios, local GPU, and Plethora MCP so
            your agents run the work.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/prompt-assistant"
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-3 text-sm font-medium text-white hover:bg-violet-500"
            >
              Prompt Assistant
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools"
              className="flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3 text-sm font-medium text-zinc-100 hover:bg-white/[0.05]"
            >
              Browse tools
            </Link>
            <Link
              href="/about"
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              About & FAQ →
            </Link>
            <Link
              href="/connect"
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              Connect apps →
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <StickyRails />
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-violet-500/35"
            >
              <f.icon className="mb-3 h-6 w-6 text-violet-400" />
              <h2 className="font-semibold text-white">{f.title}</h2>
              <p className="mt-1.5 text-sm text-zinc-500">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Popular tools</h2>
            <Link href="/tools" className="text-sm text-violet-400 hover:text-violet-300">
              All tools →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_TOOLS.slice(0, 6).map((tool) => (
              <Link
                key={tool.id}
                href={
                  tool.slug === "prompt-assistant" || tool.slug === "ai-finder"
                    ? `/${tool.slug}`
                    : `/tools/${tool.slug}`
                }
                className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 hover:border-white/20"
              >
                <p className="font-medium text-white">{tool.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm text-zinc-500">
            Questions on accounts, keys, MCP, free limits, or how tools work?
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/chat"
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              Ask the assistant
            </Link>
            <Link
              href="/about"
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
            >
              About & FAQ
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
            >
              Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
