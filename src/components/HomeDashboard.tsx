"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Flame,
  Hammer,
  HardDrive,
  Heart,
  MessageSquare,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";
import { greetingForNow, loadHomeName, saveHomeName } from "@/lib/home-desk";
import { getForYouTools, getRecentTools } from "@/lib/self-learn";
import { listMiniApps } from "@/lib/mini-apps";
import type { MiniApp } from "@/lib/mini-apps";
import type { PlatformTool } from "@/lib/types";
import { StickyRails } from "@/components/StickyRails";

function toolHref(slug: string) {
  if (slug === "prompt-assistant" || slug === "ai-finder") return `/${slug}`;
  if (slug === "chat") return "/chat";
  if (slug === "spicy-chat") return "/spicy";
  if (slug === "local-llms") return "/local-llms";
  if (slug === "mcp-setup") return "/mcp";
  return `/tools/${slug}`;
}

const ROOMS = [
  { href: "/chat", label: "Chat", icon: MessageSquare, hint: "Normal talk" },
  { href: "/spicy", label: "Spicy 18+", icon: Flame, hint: "Companion chat" },
  { href: "/local-llms", label: "Local LLMs", icon: HardDrive, hint: "Your PC" },
  { href: "/tools", label: "Tools", icon: Wrench, hint: "The whole roof" },
  { href: "/tools/build-your-tool", label: "App Maker", icon: Hammer, hint: "Build a web app" },
  { href: "/ai-finder", label: "Finder", icon: Search, hint: "What should I use?" },
];

export function HomeDashboard() {
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [hello, setHello] = useState("Welcome back");
  const [recent, setRecent] = useState<PlatformTool[]>([]);
  const [foryou, setForyou] = useState<PlatformTool[]>([]);
  const [apps, setApps] = useState<MiniApp[]>([]);

  useEffect(() => {
    const n = loadHomeName();
    setName(n);
    setHello(greetingForNow(n));
    setRecent(getRecentTools(8));
    setForyou(getForYouTools(6));
    setApps(listMiniApps().slice(0, 4));
  }, []);

  function saveName() {
    saveHomeName(draft);
    const n = draft.trim();
    setName(n);
    setHello(greetingForNow(n));
    setDraft("");
  }

  return (
    <>
      <section className="relative overflow-hidden px-4 pb-8 pt-12 sm:px-6 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.28)_0%,_transparent_52%)]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80">
            Your desk
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {hello}
          </h1>
          <p className="mt-3 max-w-xl text-base text-zinc-400">
            This is home — chat, tools, local models, and the apps you built. Pick up where you
            left off instead of opening forty tabs.
          </p>
          {!name && (
            <form
              className="mt-5 flex max-w-md gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                saveName();
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What should we call you?"
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
              />
              <button
                type="submit"
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black"
              >
                Save
              </button>
            </form>
          )}
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
            >
              Open chat <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm text-zinc-200 hover:bg-white/5"
            >
              Connect an AI
            </Link>
            <Link href="/local-llms" className="text-sm text-cyan-300 hover:underline">
              Run models on this PC →
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROOMS.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-violet-500/40"
            >
              <r.icon className="mb-2 h-5 w-5 text-violet-400 group-hover:text-violet-300" />
              <p className="font-medium text-white">{r.label}</p>
              <p className="text-xs text-zinc-500">{r.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <StickyRails />
        </div>
      </section>

      {apps.length > 0 && (
        <section className="border-t border-white/10 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-lg font-semibold text-white">Your apps</h2>
              <Link href="/projects" className="text-sm text-violet-400">
                All projects →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {apps.map((a) => (
                <Link
                  key={a.slug}
                  href={`/projects/${a.slug}`}
                  className="rounded-xl border border-white/10 px-4 py-3 hover:border-white/20"
                >
                  <p className="font-medium text-white">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{a.brief}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-white/10 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Heart className="h-4 w-4 text-rose-400" /> For you
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(recent.length ? recent : foryou).slice(0, 6).map((tool) => (
              <Link
                key={tool.id}
                href={toolHref(tool.slug)}
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
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <Sparkles className="h-4 w-4 text-violet-400" />
            New here? Tour the roof, or land in spicy chat / local LLMs from search — same home.
          </p>
          <Link
            href="/about"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            About & FAQ
          </Link>
        </div>
      </section>
    </>
  );
}
