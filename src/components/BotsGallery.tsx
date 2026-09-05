"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bot, Sparkles } from "lucide-react";
import {
  BOT_CATEGORIES,
  PLETHORA_BOTS,
  type BotCategory,
  type ChatBot,
} from "@/lib/chat-bots";

const CAT_STYLE: Record<
  BotCategory,
  { chip: string; card: string; glow: string }
> = {
  office: {
    chip: "bg-cyan-600/80",
    card: "hover:border-cyan-500/50",
    glow: "from-cyan-600/25",
  },
  rogue: {
    chip: "bg-orange-600/80",
    card: "hover:border-orange-500/50",
    glow: "from-orange-600/25",
  },
  fun: {
    chip: "bg-amber-600/80",
    card: "hover:border-amber-500/50",
    glow: "from-amber-600/20",
  },
  helpful: {
    chip: "bg-emerald-600/80",
    card: "hover:border-emerald-500/50",
    glow: "from-emerald-600/20",
  },
  creative: {
    chip: "bg-fuchsia-600/80",
    card: "hover:border-fuchsia-500/50",
    glow: "from-fuchsia-600/20",
  },
  spicy: {
    chip: "bg-rose-600/80",
    card: "hover:border-rose-500/50",
    glow: "from-rose-600/25",
  },
};

function BotCard({ b }: { b: ChatBot }) {
  const style = CAT_STYLE[b.category];
  return (
    <Link
      href={`/bots/${b.id}`}
      className={`group flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-br ${style.glow} to-transparent p-4 transition ${style.card}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/30 text-2xl shadow-inner shadow-black/40 ring-1 ring-white/10 transition group-hover:scale-105">
            {b.glyph}
          </span>
          <div>
            <p className="font-medium text-white">
              {b.name}
              {b.adultOnly ? (
                <span className="ml-2 rounded-full bg-rose-600/80 px-1.5 py-0.5 text-[10px] font-normal text-white">
                  18+
                </span>
              ) : null}
            </p>
            <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white ${style.chip}`}>
              {b.category}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">{b.tagline}</p>
      <p className="mt-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs italic leading-relaxed text-zinc-500">
        “{b.hello}”
      </p>
      {b.officeRole ? (
        <p className="mt-2 text-[10px] text-cyan-400">Works in Office · {b.officeRole}</p>
      ) : null}
      <p className="mt-3 inline-flex items-center gap-1 text-xs text-violet-300">
        <Sparkles className="h-3 w-3" />
        Open chat with {b.name}
      </p>
    </Link>
  );
}

export function BotsGallery() {
  const [cat, setCat] = useState<BotCategory | "all">("all");

  const list = useMemo(
    () =>
      cat === "all" ? PLETHORA_BOTS : PLETHORA_BOTS.filter((b) => b.category === cat),
    [cat]
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start gap-3">
        <Bot className="mt-1 h-8 w-8 text-violet-300" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Bots</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Named companions — pick one and chat like Grok’s character roster. Office bots (Quill,
            Echo, Ledger…) work inside Word and Rooms. Spicy bots need 18+. Build your own in{" "}
            <Link href="/tools/custom-assistant" className="text-violet-300 hover:underline">
              Custom assistants
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {BOT_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              cat === c.id
                ? "bg-violet-600 text-white"
                : "border border-white/15 text-zinc-400 hover:text-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((b) => (
          <li key={b.id}>
            <BotCard b={b} />
          </li>
        ))}
      </ul>
    </div>
  );
}
