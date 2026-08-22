"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, KeyRound, Loader2, Building2, Cpu, Phone, Shield } from "lucide-react";
import { HARDCORE_BUNDLE, HARDCORE_FEATURES } from "@/lib/hardcore-bundle";

const FREE_FEATURES = [
  "Browse all tools & AI catalog",
  "Free public-pool models (capped daily) — not a paid SKU",
  "When the cap hits: your API key, or extra usage / subscribe",
  "2 workspaces · up to 3 devices",
  "Prompt Assistant + AI Finder",
  "BYOK anytime (your OpenRouter key)",
  "Local AI backend guides · MCP setup",
];

const PRO_FEATURES = [
  "Unlimited tool runs · Pro tools unlock",
  "20 workspaces · 8 devices",
  "~300 included paid-model msgs/mo (models we buy)",
  "Then slower cheap models, then extra usage is billed",
  "Hourly / daily / weekly extra-usage packs",
  "Priority support · BYOK still available",
];

const TEAM_FEATURES = [
  "Everything in Pro",
  "~900 premium AI messages/mo included",
  "25 devices · 100 workspaces",
  "Shared workflows (roadmap)",
  "Custom MCP configs",
];

export function PricingClient() {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function checkout(sku: string) {
    setBusy(sku);
    setErr(null);
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku }),
      });
      const d = (await r.json()) as {
        url?: string;
        error?: string;
        needsLogin?: boolean;
      };
      if (r.status === 401 || d.needsLogin) {
        window.location.href = "/auth/signup?next=/pricing";
        return;
      }
      if (!r.ok) {
        setErr(d.error || "Checkout failed");
        setBusy(null);
        return;
      }
      if (d.url) {
        window.location.href = d.url;
        return;
      }
      setErr("No checkout URL");
    } catch {
      setErr("Network error");
    }
    setBusy(null);
  }

  return (
      <div className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Simple pricing</h1>
          <p className="mt-2 text-zinc-500">
            Free pool for unpaid use. Paid plans buy models we pay for — then a slow cheap
            fallback, then extra usage. Same shape as Cursor / Claude.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              href="/settings/ai-keys"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-1.5 text-sm font-medium text-amber-100 hover:bg-amber-500/25"
            >
              <KeyRound className="h-3.5 w-3.5" />
              BYOK — your key, unlimited
            </Link>
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
            >
              Billing & try packs
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
          <PlanCard
            name="Free"
            price="$0"
            period=" forever"
            desc="Fair free AI + full tool roof"
            features={FREE_FEATURES}
            cta="Start free"
            onCta={() => {
              window.location.href = "/tools";
            }}
            highlighted={false}
          />
          <PlanCard
            name="Pro"
            price="$19"
            period="/month"
            desc="Included paid models → slow fallback"
            features={PRO_FEATURES}
            cta={busy === "pro" ? "…" : "Get Pro"}
            onCta={() => void checkout("pro")}
            highlighted
            disabled={busy === "pro"}
          />
          <PlanCard
            name="Team"
            price="$49"
            period="/month"
            desc="Agencies and small teams"
            features={TEAM_FEATURES}
            cta={busy === "team" ? "…" : "Get Team"}
            onCta={() => void checkout("team")}
            highlighted={false}
            disabled={busy === "team"}
          />
        </div>

        {err && (
          <p className="mx-auto mt-4 max-w-xl text-center text-sm text-rose-300">{err}</p>
        )}

        <div className="mx-auto mt-10 max-w-5xl rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold text-white">Pay as you go (no monthly bill)</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Extra usage when included budget and cheap fallback are used up.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { sku: "pack_hourly", label: "1 hour", price: "$2" },
              { sku: "pack_daily", label: "24 hours", price: "$5" },
              { sku: "pack_weekly", label: "7 days", price: "$12" },
            ].map((p) => (
              <button
                key={p.sku}
                type="button"
                disabled={busy === p.sku}
                onClick={() => void checkout(p.sku)}
                className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-4 text-left hover:bg-amber-500/10 disabled:opacity-50"
              >
                <p className="text-sm font-medium text-white">{p.label}</p>
                <p className="mt-1 text-2xl font-bold text-amber-100">{p.price}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {busy === p.sku ? (
                    <Loader2 className="inline h-3 w-3 animate-spin" />
                  ) : (
                    "Buy try pack"
                  )}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Enterprise */}
        <div id="enterprise" className="mx-auto mt-10 max-w-5xl scroll-mt-24">
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-[#12100a] to-[#0b0b12] p-8 sm:p-10">
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
                  Seats, security reviews, private tool allowlists, and humans when production is on
                  fire.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="mailto:enterprise@plethora.app?subject=Enterprise%20on-call%20inquiry"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 font-semibold text-black hover:bg-amber-400"
                  >
                    <Phone className="h-4 w-4" />
                    Book demand call
                  </a>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
                <p className="flex items-center gap-2 text-sm font-medium text-amber-100">
                  <Shield className="h-4 w-4" />
                  What teams buy
                </p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" /> Custom seats & SSO
                    roadmap
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" /> On-call Slack /
                    Discord
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" /> DPA & security
                    questionnaire
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/5 p-8 sm:p-10">
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
              <button
                type="button"
                disabled={busy === "hardcore"}
                onClick={() => void checkout("hardcore")}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3 font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {busy === "hardcore" ? "…" : "Get Hardcore"}
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}

function PlanCard({
  name,
  price,
  period,
  desc,
  features,
  cta,
  onCta,
  highlighted,
  disabled,
}: {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  onCta: () => void;
  highlighted: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-8 ${
        highlighted ? "border-violet-500 bg-violet-500/10" : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <h2 className="text-xl font-semibold text-white">{name}</h2>
      <p className="mt-2 text-sm text-zinc-500">{desc}</p>
      <p className="mt-6">
        <span className="text-4xl font-bold text-white">{price}</span>
        <span className="text-zinc-500">{period}</span>
      </p>
      <ul className="mt-8 space-y-3 text-left">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            {f}
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled={disabled}
        onClick={onCta}
        className={`mt-8 block w-full rounded-xl py-3 text-center font-medium disabled:opacity-50 ${
          highlighted
            ? "bg-violet-600 text-white hover:bg-violet-500"
            : "border border-white/10 text-zinc-300 hover:bg-white/5"
        }`}
      >
        {cta}
      </button>
    </div>
  );
}
