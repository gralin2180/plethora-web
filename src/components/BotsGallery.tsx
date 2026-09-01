"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bot, Sparkles } from "lucide-react";
import {
  BOT_CATEGORIES,
  PLETHORA_BOTS,
  type BotCategory,
} from "@/lib/chat-bots";

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
            Named companions — pick one and chat like Grok’s character roster. Spicy bots need 18+.
            Want your own? Build one in{" "}
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
            <Link
              href={`/bots/${b.id}`}
              className="flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-4 transition hover:border-violet-500/40"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600/25 text-xl text-violet-100">
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
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">{b.category}</p>
                </div>
              </div>
              <p className="mt-3 flex-1 text-sm text-zinc-400">{b.tagline}</p>
              <p className="mt-3 inline-flex items-center gap-1 text-xs text-violet-300">
                <Sparkles className="h-3 w-3" />
                Chat with {b.name}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
