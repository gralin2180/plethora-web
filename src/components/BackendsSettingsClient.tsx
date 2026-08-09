"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_BACKEND_PROFILES,
  BACKEND_DIRECTORY,
  costChipClass,
  loadBackendProfile,
  saveBackendProfile,
  type LocalBackendProfile,
} from "@/lib/local-backends";
import { costBadgeClass } from "@/lib/local-ai-catalog";
import { BackendInstallGuide } from "@/components/InstallAndMcpHelpers";

export function BackendsSettingsClient() {
  const [profile, setProfile] = useState<LocalBackendProfile>(DEFAULT_BACKEND_PROFILES[0]);
  const [saved, setSaved] = useState(false);
  const [showAll, setShowAll] = useState(true);

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
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-white">Local AI backends</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        Local AI means models run on <span className="text-zinc-300">your GPU (or CPU)</span>. Cloud apps
        like Claude stay paid/freemium in the browser. Profiles stay in this browser — see{" "}
        <a href="/legal/privacy" className="text-violet-400 hover:underline">
          Privacy
        </a>
        .
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/tools/local-ai-hardware"
          className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/20"
        >
          Hardware advisor →
        </Link>
        <Link
          href="/tools/local-ai-directory"
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
        >
          Full free/paid directory →
        </Link>
      </div>

      <h2 className="mt-10 text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">
        Preferred profile
      </h2>
      <div className="mt-4 space-y-3">
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
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium text-white">{p.label}</p>
              {p.costLabel && (
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] ${costChipClass(p.cost)}`}
                >
                  {p.costLabel}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">{p.notes}</p>
            {p.gpuNote && (
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">GPU: {p.gpuNote}</p>
            )}
            {p.installUrl && (
              <a
                href={p.installUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="mt-2 inline-block text-[11px] text-violet-400 hover:underline"
              >
                Install / site
              </a>
            )}
          </button>
        ))}
      </div>

      {profile.kind !== "none" && profile.id !== "claude-cloud" && (
        <BackendInstallGuide backendId={profile.id} name={profile.label} />
      )}

      {profile.kind !== "none" && (
        <div className="mt-8 space-y-4 rounded-2xl border border-white/10 p-5">
          <p className="text-sm font-medium text-white">Connection details (after install)</p>
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

      <div className="mt-14">
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-sm font-medium text-zinc-300 hover:text-white"
        >
          {showAll ? "Hide" : "Show"} full catalog (OpenClaw, Odysseus, Claude, more)
        </button>
        {showAll && (
          <div className="mt-4 space-y-3">
            {BACKEND_DIRECTORY.map((e) => (
              <div key={e.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{e.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">{e.blurb}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${costBadgeClass(e.cost)}`}
                  >
                    {e.costLabel}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">GPU: {e.gpu}</p>
                <a
                  href={e.installUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-[11px] text-violet-400 hover:underline"
                >
                  {e.installUrl.replace(/^https?:\/\//, "").slice(0, 48)}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
