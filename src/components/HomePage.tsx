import Link from "next/link";
import {
  ArrowRight,
  MessageSquare,
  Plug,
  Search,
  Zap,
} from "lucide-react";
import { PLATFORM_TOOLS } from "@/lib/tools-registry";
import { StickyRails } from "@/components/StickyRails";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Prompt Assistant",
    desc: "Messy ask → short prompt to paste.",
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
        <div className="relative mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Connect your AI. Then use it.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base text-zinc-400">
            Log in with ChatGPT, Copilot, Perplexity, Gemini — the accounts you already have. Then
            chat, write prompts, or grab a tool.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/get-started"
              className="flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-medium text-black hover:bg-zinc-200"
            >
              Connect an AI
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-3 text-sm font-medium text-white hover:bg-violet-500"
            >
              Open chat
            </Link>
            <Link
              href="/prompt-assistant"
              className="text-sm text-zinc-400 hover:text-white"
            >
              Write a prompt →
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
