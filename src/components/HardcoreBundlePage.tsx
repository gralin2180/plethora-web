import Link from "next/link";
import {
  ArrowRight,
  Check,
  Code2,
  Cpu,
  Layers,
  Plug,
  Terminal,
  Zap,
} from "lucide-react";
import {
  HARDCORE_BUNDLE,
  HARDCORE_FEATURES,
  HARDCORE_STACK,
  HARDCORE_FAQ,
  getHardcoreToolCount,
  getHardcoreAiToolCount,
  getHardcoreAiTools,
} from "@/lib/hardcore-bundle";
import { PLATFORM_TOOLS } from "@/lib/tools-registry";

export function HardcoreBundlePage() {
  const aiTools = getHardcoreAiTools();

  return (
    <>
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(239,68,68,0.15)_0%,_transparent_50%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-sm text-red-300">
            <Cpu className="h-4 w-4" />
            {HARDCORE_BUNDLE.badge}
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            All tools.
            <span className="block bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              One subscription.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            {HARDCORE_BUNDLE.description}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#checkout"
              className="flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 font-medium text-white hover:bg-red-500"
            >
              {HARDCORE_BUNDLE.cta} — {HARDCORE_BUNDLE.priceLabel}{HARDCORE_BUNDLE.period}
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/pricing"
              className="text-sm text-zinc-500 hover:text-zinc-300"
            >
              Not hardcore? See regular pricing →
            </Link>
          </div>
          <p className="mt-6 text-sm text-zinc-600">
            {getHardcoreToolCount()} platform tools · {getHardcoreAiToolCount()} curated AI integrations · unlimited runs
          </p>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Layers, label: "All platform tools", value: `${getHardcoreToolCount()}+` },
            { icon: Plug, label: "MCP & plugins", value: "Full access" },
            { icon: Terminal, label: "Terminal AI stack", value: "Included" },
            { icon: Zap, label: "Daily run limits", value: "None" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-[#0b0b12] p-6 text-center"
            >
              <stat.icon className="mx-auto h-8 w-8 text-red-400" />
              <p className="mt-4 text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-white">What&apos;s in the bundle</h2>
          <p className="mt-2 text-center text-zinc-500">
            No picking and choosing. Every category, every Pro tool, every integration.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {HARDCORE_STACK.map((group) => (
              <div
                key={group.title}
                className="rounded-2xl border border-white/10 p-6"
              >
                <h3 className="font-semibold text-white">{group.title}</h3>
                <ul className="mt-4 space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-zinc-400">
                      <Check className="h-4 w-4 shrink-0 text-red-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-white/[0.02] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Every platform tool</h2>
              <p className="mt-1 text-zinc-500">All included — no PRO badges, no daily caps</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_TOOLS.map((tool) => (
              <div
                key={tool.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0b0b12] px-4 py-3"
              >
                <span className="text-sm text-zinc-300">{tool.name}</span>
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-300">
                  INCLUDED
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white">Curated AI stack</h2>
            <p className="mt-1 text-zinc-500">
              Advanced & developer-grade tools from our catalog — linked and configured
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {aiTools.map((tool) => (
              <div
                key={tool.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{tool.name}</h3>
                  <span className="text-[10px] uppercase tracking-wide text-zinc-600">
                    {tool.platform}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-500 line-clamp-2">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="checkout" className="border-t border-white/10 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-8">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-red-400" />
              <span className="text-sm font-medium text-red-300">{HARDCORE_BUNDLE.name}</span>
            </div>
            <p className="mt-4">
              <span className="text-5xl font-bold text-white">{HARDCORE_BUNDLE.priceLabel}</span>
              <span className="text-zinc-500">{HARDCORE_BUNDLE.period}</span>
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              or {HARDCORE_BUNDLE.annualLabel} ({HARDCORE_BUNDLE.annualSavings})
            </p>
            <ul className="mt-8 space-y-3">
              {HARDCORE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                void fetch("/api/billing/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sku: "hardcore" }),
                })
                  .then((r) => r.json())
                  .then((d: { url?: string; error?: string; needsLogin?: boolean }) => {
                    if (d.needsLogin) {
                      window.location.href = "/auth/signup?next=/hardcore";
                      return;
                    }
                    if (d.url) window.location.href = d.url;
                    else alert(d.error || "Checkout not available");
                  });
              }}
              className="mt-8 w-full rounded-xl bg-red-600 py-3.5 font-medium text-white hover:bg-red-500"
            >
              {HARDCORE_BUNDLE.cta}
            </button>
            <p className="mt-4 text-center text-xs text-zinc-600">
              Stripe Checkout when configured · Manage at /settings/billing
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold text-white">FAQ</h2>
          <div className="mt-10 space-y-6">
            {HARDCORE_FAQ.map((item) => (
              <div key={item.q}>
                <h3 className="font-medium text-white">{item.q}</h3>
                <p className="mt-2 text-sm text-zinc-500">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
