"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Save, Trash2 } from "lucide-react";

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
      <div className="flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-violet-400" />
        <h1 className="text-2xl font-bold text-white">AI keys (BYOK)</h1>
      </div>
      <p className="text-sm text-zinc-400">
        One platform OpenRouter key cannot serve every visitor forever. After sign-in, free users get
        a daily cloud-AI allowance on our key. For heavy use, paste{" "}
        <strong className="text-zinc-200">your</strong> OpenRouter key (stored only in this browser,
        sent only with your chat requests — we do not save it on our servers).
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
        <li>Paste below → Save</li>
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
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          <Save className="h-4 w-4" />
          {saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={clear}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </button>
      </div>
      <p className="text-xs text-zinc-600">
        Guests without a key: converters & offline tools still work. Cloud chat needs sign-in or
        BYOK.
      </p>
    </div>
  );
}
