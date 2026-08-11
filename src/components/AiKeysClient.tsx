"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Save, Trash2, Sparkles } from "lucide-react";

const KEY = "plethora.byok.openrouter";

export function AiKeysClient() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      setKey(localStorage.getItem(KEY) || "");
    } catch {
      /* ignore */
    }
  }, []);

  function save() {
    try {
      if (key.trim()) localStorage.setItem(KEY, key.trim());
      else localStorage.removeItem(KEY);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function clear() {
    setKey("");
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-transparent p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-300" />
          <h1 className="text-2xl font-bold text-white">BYOK — your AI key</h1>
        </div>
        <p className="mt-2 text-sm text-amber-100/90">
          Always available. Billed to you, never limited by Plethora free pools or Pro budgets. Ideal
          for heavy use and specific OpenRouter models.
        </p>
      </div>

      <p className="text-sm text-zinc-400">
        Free users share our free models with fair caps. Pro includes a{" "}
        <strong className="text-zinc-200">premium message budget</strong>, then auto-falls back to
        free models. Paste your OpenRouter key here when you want full personal capacity.
      </p>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-500">
        <li>
          Create a key at{" "}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noreferrer"
            className="text-violet-400 hover:underline"
          >
            openrouter.ai/keys
          </a>
        </li>
        <li>Paste below → Save (stays in this browser only)</li>
        <li>
          Chat at{" "}
          <Link href="/chat" className="text-violet-400 hover:underline">
            /chat
          </Link>
        </li>
      </ol>
      <label className="block text-xs text-zinc-500">
        OpenRouter API key
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk-or-…"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400"
        >
          <Save className="h-4 w-4" />
          {saved ? "Saved" : "Save key"}
        </button>
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </button>
        <Link
          href="/settings/billing"
          className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 px-4 py-2 text-sm text-violet-200 hover:bg-violet-500/10"
        >
          <Sparkles className="h-4 w-4" />
          Pro & try packs
        </Link>
      </div>
      <p className="text-xs text-zinc-600">
        We never store this key on our servers. Clearing site data removes it.
      </p>
    </div>
  );
}
