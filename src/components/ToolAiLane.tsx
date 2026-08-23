"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SelectModelMenu } from "@/components/SelectModelMenu";
import { loadSmoothQuality, qualityFromSmooth, saveSmoothQuality } from "@/lib/chat-quality";
import { hasByok } from "@/lib/byok";
import { hasAnyConnectedAi } from "@/lib/connected-ai";

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
      .catch(() => undefined);
  }, []);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5">
      <p className="text-xs text-zinc-400">
        <span className="font-medium text-emerald-300">Free</span>
        {" · "}
        <Link href="/get-started" className="text-violet-300 hover:underline">
          Connect a provider{connected ? " ✓" : ""}
        </Link>
        {" · "}
        <Link href="/settings/ai-keys" className="text-amber-200 hover:underline">
          API key{byok ? " ✓" : ""}
        </Link>
      </p>
      <div className="ml-auto flex items-center gap-2">
        {([18, 50, 92] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => {
              setQuality(n);
              saveSmoothQuality(n);
            }}
            className={`rounded-full px-2.5 py-1 text-[11px] ${
              qualityFromSmooth(quality) === qualityFromSmooth(n)
                ? "bg-white text-zinc-900"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {n < 34 ? "Faster" : n > 66 ? "Best" : "Balanced"}
          </button>
        ))}
        <SelectModelMenu
          zenConfigured={zen}
          openrouterConfigured={or}
          connectedLabel={connected ? "Connected AI" : "Connect"}
          anchor="down"
        />
      </div>
    </div>
  );
}
