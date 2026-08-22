"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SelectModelMenu } from "@/components/SelectModelMenu";
import { loadSmoothQuality, qualityFromSmooth, saveSmoothQuality } from "@/lib/chat-quality";
import { hasByok } from "@/lib/byok";
import { hasAnyConnectedAi } from "@/lib/connected-ai";

const BANDS: { n: number; label: string }[] = [
  { n: 18, label: "Faster" },
  { n: 50, label: "Balanced" },
  { n: 92, label: "Best" },
];

/**
 * Shared AI lane on every AI tool page: free pool, signed-in Connect, BYOK, quality.
 */
export function ToolAiLane() {
  const [quality, setQuality] = useState(50);
  const [zen, setZen] = useState(true);
  const [or, setOr] = useState(false);
  const [byok, setByok] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setQuality(loadSmoothQuality());
    try {
      setByok(hasByok());
      setConnected(hasAnyConnectedAi());
    } catch {
      /* */
    }
    void fetch("/api/chat")
      .then((r) => r.json())
      .then((d: { zenConfigured?: boolean; openrouterConfigured?: boolean }) => {
        setZen(Boolean(d.zenConfigured));
        setOr(Boolean(d.openrouterConfigured));
      })
      .catch(() => {
        /* */
      });
  }, []);

  function pickQuality(n: number) {
    setQuality(n);
    saveSmoothQuality(n);
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        Which brain
      </p>
      <p className="mt-1 text-xs text-zinc-400">
        Same router as Chat. Not locked to Claude. Free pool, a signed-in Connect account, or your
        API key.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] text-emerald-200">
          Free pool
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] ${
            connected ? "bg-violet-500/20 text-violet-100" : "border border-white/10 text-zinc-500"
          }`}
        >
          {connected ? "Signed-in AI on" : "Connect (ChatGPT, Copilot…)"}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] ${
            byok ? "bg-amber-500/20 text-amber-100" : "border border-white/10 text-zinc-500"
          }`}
        >
          {byok ? "API key on" : "BYOK"}
        </span>
        <div className="ml-auto">
          <SelectModelMenu
            zenConfigured={zen}
            openrouterConfigured={or}
            connectedLabel={connected ? "Connected AI" : "Connect an account"}
            anchor="down"
          />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {BANDS.map((b) => (
          <button
            key={b.n}
            type="button"
            onClick={() => pickQuality(b.n)}
            className={`rounded-full px-2.5 py-1 text-[11px] ${
              qualityFromSmooth(quality) === qualityFromSmooth(b.n)
                ? "bg-white text-zinc-900"
                : "border border-white/10 text-zinc-400"
            }`}
          >
            {b.label}
          </button>
        ))}
        <Link href="/get-started" className="text-[11px] text-violet-300 hover:underline">
          Connect
        </Link>
        <Link href="/settings/ai-keys" className="text-[11px] text-zinc-500 hover:text-white">
          API keys
        </Link>
      </div>
    </div>
  );
}
