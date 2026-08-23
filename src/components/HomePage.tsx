import Link from "next/link";
import {
  ArrowRight,
  Flame,
  Gamepad2,
  Hammer,
  HardDrive,
  MessageSquare,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";
import { PLATFORM_TOOLS } from "@/lib/tools-registry";
import { StickyRails } from "@/components/StickyRails";

const ROOMS = [
  { href: "/chat", title: "Chat", desc: "Normal talk", icon: MessageSquare },
  { href: "/spicy", title: "Spicy 18+", desc: "Companion chat", icon: Flame },
  { href: "/game-director", title: "Game Director", desc: "Make games", icon: Gamepad2 },
  { href: "/local-llms", title: "Local LLMs", desc: "Your PC", icon: HardDrive },
  { href: "/tools", title: "Tools", desc: "The whole roof", icon: Wrench },
  { href: "/tools/build-your-tool", title: "App Maker", desc: "Build a web app", icon: Hammer },
  { href: "/ai-finder", title: "Finder", desc: "What should I use?", icon: Search },
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
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
            Everything you need to ship, without twenty open tabs
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Free utilities, chat, local models on your PC, and MCP so agents can run the work.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/tools"
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-3 text-sm font-medium text-white hover:bg-violet-500"
            >
              Browse tools
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3 text-sm font-medium text-zinc-100 hover:bg-white/[0.05]"
            >
              Open chat
            </Link>
            <Link href="/get-started" className="text-sm text-zinc-500 hover:text-zinc-300">
              Connect an AI →
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
        <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROOMS.map((f) => (
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
                    : tool.slug === "game-engine"
                      ? "/game-director"
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
