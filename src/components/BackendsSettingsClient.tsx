"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_BACKEND_PROFILES,
  loadBackendProfile,
  saveBackendProfile,
  type LocalBackendProfile,
} from "@/lib/local-backends";

export function BackendsSettingsClient() {
  const [profile, setProfile] = useState<LocalBackendProfile>(DEFAULT_BACKEND_PROFILES[0]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(loadBackendProfile());
  }, []);

  function selectPreset(p: LocalBackendProfile) {
    setProfile({ ...p });
    setSaved(false);
  }

  function persist() {
    saveBackendProfile(profile);
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-white">Local AI backends</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Use Ollama, LM Studio, llama.cpp, or any OpenAI-compatible server on your GPU. Profiles stay
        in this browser by default (not sent to Plethora). See{" "}
        <a href="/legal/privacy" className="text-violet-400 hover:underline">
          Privacy
        </a>
        .
      </p>

      <div className="mt-8 space-y-3">
        {DEFAULT_BACKEND_PROFILES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => selectPreset(p)}
            className={`w-full rounded-xl border p-4 text-left transition ${
              profile.id === p.id
                ? "border-violet-500 bg-violet-500/10"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <p className="font-medium text-white">{p.label}</p>
            <p className="mt-1 text-xs text-zinc-500">{p.notes}</p>
          </button>
        ))}
      </div>

      {profile.kind !== "none" && (
        <div className="mt-8 space-y-4 rounded-2xl border border-white/10 p-5">
          <label className="block text-sm text-zinc-400">
            Base URL
            <input
              value={profile.baseUrl}
              onChange={(e) => setProfile({ ...profile, baseUrl: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Model name
            <input
              value={profile.model}
              onChange={(e) => setProfile({ ...profile, model: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            API key (optional, stored only in this browser)
            <input
              type="password"
              value={profile.apiKey ?? ""}
              onChange={(e) => setProfile({ ...profile, apiKey: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
              autoComplete="off"
            />
          </label>
        </div>
      )}

      <button
        type="button"
        onClick={persist}
        className="mt-6 w-full rounded-xl bg-violet-600 py-3 font-medium text-white hover:bg-violet-500"
      >
        {saved ? "Saved" : "Save backend preference"}
      </button>
    </div>
  );
}
