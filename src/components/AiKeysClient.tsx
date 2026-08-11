"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Save, Trash2, Sparkles } from "lucide-react";
import {
  BYOK_PRESETS,
  clearByok,
  guessProvider,
  loadByok,
  saveByok,
  type ByokConfig,
  type ByokProviderId,
} from "@/lib/byok";

export function AiKeysClient() {
  const [provider, setProvider] = useState<ByokProviderId>("openrouter");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(BYOK_PRESETS[0].baseUrl);
  const [model, setModel] = useState(BYOK_PRESETS[0].defaultModel);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = loadByok();
    if (existing) {
      setProvider(existing.provider);
      setApiKey(existing.apiKey);
      setBaseUrl(existing.baseUrl);
      setModel(existing.model);
    }
  }, []);

  function applyPreset(id: ByokProviderId) {
    const p = BYOK_PRESETS.find((x) => x.id === id) || BYOK_PRESETS[0];
    setProvider(id);
    setBaseUrl(p.baseUrl);
    setModel(p.defaultModel);
  }

  function onKeyBlur() {
    if (!apiKey.trim()) return;
    // Only auto-switch if still on openrouter default empty customization
    const guessed = guessProvider(apiKey);
    if (guessed !== "custom" && provider === "openrouter" && !loadByok()) {
      applyPreset(guessed);
    }
  }

  function save() {
    if (!apiKey.trim() || !baseUrl.trim()) return;
    const config: ByokConfig = {
      provider,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      model: model.trim() || "gpt-4o-mini",
    };
    saveByok(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function clear() {
    clearByok();
    setApiKey("");
    applyPreset("openrouter");
  }

  const preset = BYOK_PRESETS.find((p) => p.id === provider) || BYOK_PRESETS[0];

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-transparent p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-300" />
          <h1 className="text-2xl font-bold text-white">BYOK — your AI key</h1>
        </div>
        <p className="mt-2 text-sm text-amber-100/90">
          Bring <strong className="text-white">any</strong> OpenAI-compatible API key: OpenRouter,
          OpenAI, Groq, xAI, DeepSeek, Together, or a custom base URL. Billed to you, never limited
          by Plethora free pools or Pro budgets.
        </p>
      </div>

      <p className="text-sm text-zinc-400">
        Keys stay in this browser only and are sent only with <em>your</em> chat requests. We do not
        store them on our servers.
      </p>

      <label className="block text-xs text-zinc-500">
        Provider
        <select
          value={provider}
          onChange={(e) => applyPreset(e.target.value as ByokProviderId)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
        >
          {BYOK_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <p className="text-[11px] text-zinc-600">{preset.hint}</p>

      <label className="block text-xs text-zinc-500">
        API key
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          onBlur={onKeyBlur}
          placeholder={preset.placeholder}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
        />
      </label>

      <label className="block text-xs text-zinc-500">
        Base URL{" "}
        <span className="text-zinc-600">(must support /chat/completions)</span>
        <input
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://…"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
        />
      </label>

      <label className="block text-xs text-zinc-500">
        Model id
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={preset.defaultModel}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
        />
      </label>
      {preset.docsUrl && (
        <p className="text-xs text-zinc-500">
          Keys:{" "}
          <a
            href={preset.docsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-violet-400 hover:underline"
          >
            {preset.docsUrl.replace(/^https?:\/\//, "").split("/")[0]}
          </a>
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!apiKey.trim() || !baseUrl.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-40"
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
        <Link
          href="/chat"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
        >
          Open chat
        </Link>
      </div>
      <p className="text-xs text-zinc-600">
        Anthropic / Google Gemini native SDKs are different APIs — use OpenRouter (or another gateway)
        for those models, or a custom compatible proxy.
      </p>
    </div>
  );
}
