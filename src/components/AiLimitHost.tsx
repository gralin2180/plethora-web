"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Sparkles, X, CreditCard } from "lucide-react";
import { AI_EXHAUSTED_EVENT } from "@/lib/platform-ai-client";

export function AiLimitHost() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onExhausted() {
      setOpen(true);
    }
    window.addEventListener(AI_EXHAUSTED_EVENT, onExhausted);
    return () => window.removeEventListener(AI_EXHAUSTED_EVENT, onExhausted);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        role="dialog"
        aria-labelledby="ai-limit-title"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-5 text-left shadow-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p id="ai-limit-title" className="text-lg font-semibold text-white">
              Free AI limit reached
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              We rotated through every free model until the pool was exhausted. To keep going,
              add your own API key, or pay as you go.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ol className="mt-4 space-y-2 text-sm text-zinc-300">
          <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            1. Free models (no sign-in) — used first
          </li>
          <li className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            2. Next free model, until none remain
          </li>
          <li className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-100">
            3. Now: your key, or extra paid usage
          </li>
        </ol>

        <div className="mt-5 grid gap-2">
          <Link
            href="/settings/ai-keys"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200"
          >
            <KeyRound className="h-4 w-4" />
            Use an external API key
          </Link>
          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/15 py-2.5 text-sm font-medium text-violet-100 hover:bg-violet-500/25"
          >
            <CreditCard className="h-4 w-4" />
            Pay as you go / subscribe
          </Link>
          <Link
            href="/get-started"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
          >
            <Sparkles className="h-4 w-4" />
            Connect ChatGPT or Copilot
          </Link>
        </div>
      </div>
    </div>
  );
}
