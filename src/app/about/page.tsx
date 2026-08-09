import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { ABOUT_FAQS } from "@/lib/about-content";

export const metadata: Metadata = {
  title: "About & FAQ — Plethora",
  description:
    "What Plethora is, prompt engineering focus, multi-model AI, devices, MCP, and answers to common questions.",
};

export default function AboutPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300">
          About
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Plethora under one roof</h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-400">
          Plethora started as a <strong className="font-medium text-zinc-200">prompt engineering</strong>{" "}
          product — turn a messy goal into a sharp, model-ready brief — then grew into free utilities,
          AI studios, local GPU installs, trading/marketing labs, and{" "}
          <strong className="font-medium text-zinc-200">Plethora MCP</strong> so agents can call real
          tools instead of inventing them.
        </p>
        <p className="mt-3 text-base leading-relaxed text-zinc-400">
          We are not trying to replace every chat brand. We run the work, wire models you choose, and
          keep converters + install maps in one place. Longer product story lives here so the home page
          stays short.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/prompt-assistant"
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Prompt Assistant
          </Link>
          <Link
            href="/tools"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Tools
          </Link>
          <Link
            href="/chat"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Ask assistant
          </Link>
        </div>

        <h2 className="mt-14 text-xl font-semibold text-white">FAQ</h2>
        <dl className="mt-6 space-y-4">
          {ABOUT_FAQS.map((item) => (
            <div
              key={item.q}
              className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4"
            >
              <dt className="font-medium text-white">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-zinc-400">{item.a}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 text-center text-sm text-zinc-600">
          Still stuck?{" "}
          <Link href="/chat" className="text-violet-400 hover:underline">
            Chat with the assistant
          </Link>{" "}
          — it can answer product, account, and how-to questions about Plethora.
        </p>
      </div>
    </SiteShell>
  );
}
