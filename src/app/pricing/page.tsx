import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Check, Cpu, Phone, Shield } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { HARDCORE_BUNDLE, HARDCORE_FEATURES } from "@/lib/hardcore-bundle";

export const metadata: Metadata = {
  title: "Pricing — Plethora",
  description:
    "Free tools under one roof. Pro, Team, Enterprise on-call, and Hardcore for power users.",
};

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: " forever",
    desc: "Try the middleman roof — tools & finder",
    features: [
      "Browse all tools & AI catalog",
      "Limited daily runs per tool",
      "2 workspaces · up to 3 devices",
      "Prompt Assistant (10/day)",
      "AI Tool Finder (20/day)",
      "Local AI backend guides",
      "MCP setup guides",
    ],
    cta: "Start free",
    href: "/tools",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    desc: "Creators, marketers, power users",
    features: [
      "Unlimited tool runs",
      "20 workspaces · 8 devices",
      "Advanced Prompt Assistant",
      "Saved prompt templates",
      "AI Workflow Builder",
      "Pro tools (personas, rules)",
      "Priority email support",
    ],
    cta: "Start Pro trial",
    href: "/auth/signup",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$49",
    period: "/month",
    desc: "Agencies and small teams",
    features: [
      "Everything in Pro",
      "5 team seats · 25 devices",
      "100 workspaces",
      "Shared workflows & templates",
      "Usage analytics",
      "Custom MCP configs",
      "White-label options (soon)",
    ],
    cta: "Contact us",
    href: "mailto:hello@plethora.app?subject=Plethora%20Team",
    highlighted: false,
  },
];

const ENTERPRISE = [
  "Custom seat counts & SSO (SSO roadmap)",
  "On-call support / shared Slack or Discord for ops",
  "Priority feature requests and staging reviews",
  "Private catalog of approved tools for your org",
  "On-prem / VPC guidance for local backends",
  "Security questionnaire & DPA support",
  "Training workshops for your team",
  "Custom SLA for uptime of managed routes",
];

export default function PricingPage() {
  return (
    <SiteShell>
      <div className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Simple pricing</h1>
          <p className="mt-2 text-zinc-500">
            Free middleman roof first. Pro when you need volume. Enterprise when you need humans
            on-call.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 ${
                plan.highlighted
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
              <p className="mt-2 text-sm text-zinc-500">{plan.desc}</p>
              <p className="mt-6">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-zinc-500">{plan.period}</span>
              </p>
              <ul className="mt-8 space-y-3 text-left">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`mt-8 block rounded-xl py-3 text-center font-medium ${
                  plan.highlighted
                    ? "bg-violet-600 text-white hover:bg-violet-500"
                    : "border border-white/10 text-zinc-300 hover:bg-white/5"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Enterprise — big and obvious */}
        <div id="enterprise" className="mx-auto mt-10 max-w-5xl scroll-mt-24">
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-[#12100a] to-[#0b0b12] p-8 sm:p-10">
            <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-200">
                  <Building2 className="h-3.5 w-3.5" />
                  Enterprise
                </div>
                <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
                  Custom. On demand. On call.
                </h2>
                <p className="mt-3 max-w-xl text-zinc-400">
                  For companies that need seats, security reviews, private tool allowlists, and a
                  human who answers when production is on fire — not a ticket queue forever.
                </p>
                <p className="mt-6 flex flex-wrap items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">Custom</span>
                  <span className="text-zinc-500">· quote from ~$499/mo or project-based</span>
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="mailto:enterprise@plethora.app?subject=Enterprise%20on-call%20inquiry"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 font-semibold text-black hover:bg-amber-400"
                  >
                    <Phone className="h-4 w-4" />
                    Book demand call
                  </a>
                  <Link
                    href="/chat"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 font-medium text-zinc-200 hover:bg-white/5"
                  >
                    Ask assistant first
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <p className="flex items-center gap-2 text-sm font-medium text-amber-100">
                  <Shield className="h-4 w-4" />
                  What teams buy
                </p>
                <ul className="mt-4 space-y-2.5">
                  {ENTERPRISE.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/5 p-8 sm:p-10">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-red-500/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-red-400" />
                <span className="text-sm font-medium text-red-300">{HARDCORE_BUNDLE.badge}</span>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-white">{HARDCORE_BUNDLE.name}</h2>
              <p className="mt-2 text-zinc-400">{HARDCORE_BUNDLE.description}</p>
              <p className="mt-6">
                <span className="text-4xl font-bold text-white">{HARDCORE_BUNDLE.priceLabel}</span>
                <span className="text-zinc-500">{HARDCORE_BUNDLE.period}</span>
              </p>
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {HARDCORE_FEATURES.slice(0, 6).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/hardcore"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3 font-medium text-white hover:bg-red-500"
              >
                See Hardcore bundle
              </Link>
              <p className="mt-3 text-xs text-zinc-600">
                Sold separately — power users, not Enterprise seating.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
