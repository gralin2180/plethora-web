"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SelectModelMenu } from "@/components/SelectModelMenu";
import { loadSmoothQuality, qualityFromSmooth, saveSmoothQuality } from "@/lib/chat-quality";
import { hasByok } from "@/lib/byok";
import { hasAnyConnectedAi } from "@/lib/connected-ai";

const BANDS: { n: number; label: string; hint: string }[] = [
  { n: 18, label: "Faster", hint: "Short replies" },
  { n: 50, label: "Balanced", hint: "Default" },
  { n: 92, label: "Best", hint: "Longer / harder jobs" },
];

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
    <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div>
        <p className="text-sm font-semibold text-white">Who pays for the model?</p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Pick one path. Free always works. Connect or an API key uses *your* account.
        </p>
        <ol className="mt-2 space-y-1.5 text-xs text-zinc-300">
          <li>
            <span className="font-medium text-emerald-300">1. Free pool</span> — already on. No
            card.
          </li>
          <li>
            <span className="font-medium text-violet-200">2. Signed-in AI</span> —{" "}
            <Link href="/get-started" className="text-violet-300 hover:underline">
              Connect ChatGPT / Copilot / …
            </Link>
            {connected ? " · linked" : ""}
          </li>
          <li>
            <span className="font-medium text-amber-200">3. Your API key</span> —{" "}
            <Link href="/settings/ai-keys" className="text-violet-300 hover:underline">
              paste OpenRouter / OpenAI
            </Link>
            {byok ? " · saved on this device" : ""}
          </li>
        </ol>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">How hard should it try?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {BANDS.map((b) => (
            <button
              key={b.n}
              type="button"
              onClick={() => pickQuality(b.n)}
              className={`rounded-full px-3 py-1.5 text-xs ${
                qualityFromSmooth(quality) === qualityFromSmooth(b.n)
                  ? "bg-white text-zinc-900"
                  : "border border-white/10 text-zinc-400"
              }`}
            >
              {b.label}
              <span className="ml-1 text-[10px] opacity-70">{b.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">Exact model (optional)</p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          Auto is fine. Open the menu only if you want a named free model.
        </p>
        <div className="mt-2">
          <SelectModelMenu
            zenConfigured={zen}
            openrouterConfigured={or}
            connectedLabel={connected ? "Your connected AI" : "Use connected AI"}
            anchor="down"
          />
        </div>
      </div>
    </div>
  );
}
