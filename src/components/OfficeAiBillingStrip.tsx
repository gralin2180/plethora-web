"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Key, Sparkles, Zap } from "lucide-react";

type Entitlement = {
  plan?: string;
  routeLabel?: string;
  freeDailyLimit?: number;
  premiumAllowed?: boolean;
  signedIn?: boolean;
};

type Props = {
  appName: string;
  compact?: boolean;
};

/**
 * Shared AI billing strip for Office desktop funnel apps.
 * Free pool → paid Plethora tokens → BYOK / connected accounts.
 */
export function OfficeAiBillingStrip({ appName, compact }: Props) {
  const [ent, setEnt] = useState<Entitlement | null>(null);

  useEffect(() => {
    void fetch("/api/chat", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { signedIn?: boolean; entitlement?: Entitlement; freeModels?: unknown }) => {
        setEnt({
          signedIn: d.signedIn,
          plan: d.entitlement?.plan,
          routeLabel: d.entitlement?.routeLabel,
          freeDailyLimit: d.entitlement?.freeDailyLimit,
          premiumAllowed: d.entitlement?.premiumAllowed,
        });
      })
      .catch(() => setEnt(null));
  }, []);

  if (compact) {
    return (
      <p className="text-[10px] text-zinc-500">
        AI: {ent?.routeLabel || "Free pool"} ·{" "}
        <Link href="/settings/ai-keys" className="text-violet-300 hover:underline">
          BYOK
        </Link>{" "}
        ·{" "}
        <Link href="/settings/billing" className="text-cyan-300 hover:underline">
          Tokens
        </Link>
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-r from-violet-950/40 via-black/30 to-cyan-950/30 px-3 py-2.5 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
        <div>
          <p className="text-xs font-medium text-white">{appName} AI</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-400">
            <span className="text-zinc-300">Free</span> — OpenRouter / Zen free models (daily cap).{" "}
            <span className="text-zinc-300">Tokens</span> — Plethora prepaid messages, billed on use.{" "}
            <span className="text-zinc-300">BYOK</span> — your OpenRouter, OpenAI, or connected Codex.
          </p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-0">
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
          <Zap className="h-3 w-3" />
          {ent?.routeLabel || "Free pool"}
          {ent?.freeDailyLimit ? ` · ${ent.freeDailyLimit}/day` : ""}
        </span>
        <Link
          href="/settings/billing"
          className="rounded-full bg-cyan-700/80 px-2.5 py-0.5 text-[10px] font-medium text-white hover:bg-cyan-600"
        >
          Buy tokens
        </Link>
        <Link
          href="/settings/ai-keys"
          className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] text-zinc-300 hover:text-white"
        >
          <Key className="h-3 w-3" />
          API keys
        </Link>
      </div>
    </div>
  );
}
