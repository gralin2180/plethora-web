"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  Gauge,
  KeyRound,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";

type Product = {
  sku: string;
  name: string;
  description: string;
  priceLabel: string;
  periodLabel: string;
  mode: string;
  features: string[];
  highlighted?: boolean;
};

type Status = {
  signedIn: boolean;
  stripeReady?: boolean;
  fakeBilling?: boolean;
  plan?: string;
  subscriptionStatus?: string;
  selfLimit?: number | null;
  products?: Product[];
  entitlement?: {
    plan: string;
    premiumUsed: number;
    premiumLimit: number;
    premiumAllowed: boolean;
    freeDailyLimit: number;
    freeUsedToday?: number;
    freeDailyPlanLimit?: number;
    routeLabel: string;
    softWarn?: boolean;
    softWarnMessage?: string;
    trialActive?: boolean;
    trialEndsAt?: string;
    selfLimit?: number | null;
    includedPremiumMonthly?: number;
  };
};

export function BillingClient() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [selfLimit, setSelfLimit] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch("/api/billing/status");
      const d = (await r.json()) as Status;
      setStatus(d);
      setSelfLimit(
        d.selfLimit != null
          ? String(d.selfLimit)
          : d.entitlement?.selfLimit != null
            ? String(d.entitlement.selfLimit)
            : ""
      );
    } catch {
      setErr("Could not load billing status");
    }
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function checkout(sku: string) {
    setBusy(sku);
    setErr(null);
    setNote(null);
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku }),
      });
      const d = (await r.json()) as { url?: string; error?: string; fake?: boolean };
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

  async function portal() {
    setBusy("portal");
    try {
      const r = await fetch("/api/billing/portal", { method: "POST" });
      const d = (await r.json()) as { url?: string; error?: string };
      if (d.url) window.location.href = d.url;
      else setErr(d.error || "Portal unavailable");
    } catch {
      setErr("Portal failed");
    }
    setBusy(null);
  }

  async function saveSelfLimit() {
    setBusy("limit");
    setErr(null);
    try {
      const r = await fetch("/api/billing/self-limit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selfLimitPremiumMonth: selfLimit.trim() === "" ? null : Number(selfLimit),
        }),
      });
      const d = (await r.json()) as { note?: string; error?: string };
      if (!r.ok) setErr(d.error || "Save failed");
      else {
        setNote(d.note || "Saved");
        await refresh();
      }
    } catch {
      setErr("Save failed");
    }
    setBusy(null);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-16 text-sm text-zinc-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading billing…
      </div>
    );
  }

  const ent = status?.entitlement;
  const packs = status?.products?.filter((p) => p.mode === "payment") || [];
  const subs = status?.products?.filter((p) => p.mode === "subscription") || [];

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-400">
          Billing & AI budget
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">Plan, packs & limits</h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-400">
          Pro isn&apos;t just tokens — workspaces, devices, tools, and a monthly premium model budget.
          When that budget is used, chat keeps going on free models (like Cursor). BYOK is always
          available and never hits our budget.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div>
            <p className="font-semibold text-amber-100">BYOK — always on</p>
            <p className="mt-1 text-sm text-amber-100/80">
              Paste your OpenRouter key for unlimited personal models, on you. Never rate-limited by
              our free pool.
            </p>
            <Link
              href="/settings/ai-keys"
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-medium text-black hover:bg-amber-300"
            >
              Open AI keys <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {status?.signedIn && ent && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <h2 className="font-semibold text-white">Your AI status</h2>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-zinc-400">
              {ent.routeLabel}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-zinc-500">Premium (included + packs)</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {ent.premiumUsed}/{ent.premiumLimit || 0}
              </p>
              <p className="text-[11px] text-zinc-600">
                After limit → free models keep working
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-zinc-500">Free models today</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {ent.freeUsedToday ?? 0}/{ent.freeDailyPlanLimit ?? ent.freeDailyLimit}
              </p>
              <p className="text-[11px] text-zinc-600">Fair-use daily cap</p>
            </div>
          </div>
          {ent.softWarnMessage && (
            <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              {ent.softWarnMessage}
            </p>
          )}
          {ent.trialActive && ent.trialEndsAt && (
            <p className="mt-2 text-xs text-emerald-300">
              Trial pack active until {new Date(ent.trialEndsAt).toLocaleString()}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {status.stripeReady && (
              <button
                type="button"
                onClick={() => void portal()}
                disabled={busy === "portal"}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
              >
                Manage subscription
              </button>
            )}
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
            >
              Refresh
            </button>
          </div>
        </section>
      )}

      {status?.signedIn && (
        <section className="rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-emerald-400" />
            <h2 className="font-semibold text-white">Your monthly self-limit</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Cap your own premium usage below the plan max so you don&apos;t burn the whole budget
            early. Leave empty to use the plan default (
            {ent?.includedPremiumMonthly ?? "—"} for your plan). Soft warn at 80%.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="number"
              min={1}
              placeholder="e.g. 100"
              value={selfLimit}
              onChange={(e) => setSelfLimit(e.target.value)}
              className="w-32 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={() => void saveSelfLimit()}
              disabled={busy === "limit"}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {busy === "limit" ? "Saving…" : "Save limit"}
            </button>
          </div>
        </section>
      )}

      {!status?.signedIn && (
        <p className="text-sm text-zinc-500">
          <Link href="/auth/signup" className="text-violet-400 hover:underline">
            Sign in
          </Link>{" "}
          to subscribe, buy try packs, or set self-limits.
        </p>
      )}

      {(status?.fakeBilling || !status?.stripeReady) && (
        <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-500">
          {status?.fakeBilling
            ? "Dev mode: PLETHORA_FAKE_BILLING activates plans instantly (needs SUPABASE_SERVICE_ROLE_KEY). Wire Stripe for production."
            : "Stripe keys not set yet — checkouts show setup errors until STRIPE_SECRET_KEY + price IDs are configured."}
        </p>
      )}

      <section>
        <h2 className="text-lg font-semibold text-white">Subscriptions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {subs.map((p) => (
            <div
              key={p.sku}
              className={`rounded-2xl border p-4 ${
                p.highlighted
                  ? "border-violet-500/50 bg-violet-500/10"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <h3 className="font-semibold text-white">{p.name}</h3>
              <p className="mt-1 text-xs text-zinc-500">{p.description}</p>
              <p className="mt-3">
                <span className="text-2xl font-bold text-white">{p.priceLabel}</span>
                <span className="text-zinc-500">{p.periodLabel}</span>
              </p>
              <ul className="mt-3 space-y-1">
                {p.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex gap-1.5 text-[11px] text-zinc-400">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={!status?.signedIn || busy === p.sku}
                onClick={() => void checkout(p.sku)}
                className="mt-4 w-full rounded-xl bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40"
              >
                {busy === p.sku ? "…" : `Get ${p.name}`}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Try packs (hourly · daily · weekly)</h2>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          No monthly commitment — premium access for a short window, then free models + BYOK.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {packs.map((p) => (
            <div key={p.sku} className="rounded-2xl border border-white/10 p-4">
              <h3 className="font-semibold text-white">{p.name}</h3>
              <p className="mt-1 text-xs text-zinc-500">{p.description}</p>
              <p className="mt-3 text-xl font-bold text-white">
                {p.priceLabel}
                <span className="text-sm font-normal text-zinc-500">{p.periodLabel}</span>
              </p>
              <button
                type="button"
                disabled={!status?.signedIn || busy === p.sku}
                onClick={() => void checkout(p.sku)}
                className="mt-4 w-full rounded-xl border border-amber-500/40 py-2 text-sm text-amber-100 hover:bg-amber-500/10 disabled:opacity-40"
              >
                {busy === p.sku ? "…" : "Buy pack"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {note && <p className="text-sm text-emerald-300">{note}</p>}
      {err && <p className="text-sm text-rose-300">{err}</p>}

      <p className="text-xs text-zinc-600">
        Need full pricing story?{" "}
        <Link href="/pricing" className="text-violet-400 hover:underline">
          /pricing
        </Link>
      </p>
    </div>
  );
}
