"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FolderLock, ShieldCheck, Upload } from "lucide-react";
import {
  acceptPersonalContextConsent,
  downloadContextFile,
  emptyContext,
  hasPersonalContextConsent,
  importContextFromJson,
  loadPersonalContext,
  PRIVACY_NOTICE,
  saveContextToUserFolder,
  savePersonalContext,
  type PersonalContext,
} from "@/lib/personal-context";

export function PersonalContextPanel({ compact = false }: { compact?: boolean }) {
  const [ctx, setCtx] = useState<PersonalContext>(emptyContext());
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [pendingEnable, setPendingEnable] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setCtx(loadPersonalContext());
  }, []);

  const persist = useCallback((next: PersonalContext) => {
    setCtx(next);
    savePersonalContext(next);
  }, []);

  function tryEnable(on: boolean) {
    if (on && !hasPersonalContextConsent()) {
      setPendingEnable(true);
      setShowPrivacy(true);
      return;
    }
    persist({ ...ctx, enabled: on });
    setStatus(on ? "Personalisation ON — data stays on this device." : "Personalisation off.");
  }

  function acceptPrivacy() {
    acceptPersonalContextConsent();
    setShowPrivacy(false);
    if (pendingEnable) {
      persist({ ...ctx, enabled: true });
      setPendingEnable(false);
      setStatus("Personalisation ON — leak-safe, local only.");
    }
  }

  async function saveToFolder() {
    const ok = await saveContextToUserFolder(ctx);
    setStatus(
      ok
        ? "Saved to a folder YOU chose (browser File System Access)."
        : "Downloaded plethora-personal-context.json — move it into your local folder."
    );
  }

  function onImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const imported = importContextFromJson(String(reader.result ?? ""));
      if (!imported) {
        setStatus("Invalid context file.");
        return;
      }
      persist({ ...imported, enabled: true });
      setStatus("Imported personal context from file (still local only).");
    };
    reader.readAsText(file);
  }

  return (
    <div className={compact ? "" : "rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6"}>
      {showPrivacy && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4">
          <div className="max-w-md rounded-2xl border border-emerald-500/40 bg-[#12121a] p-6 shadow-xl">
            <div className="flex items-center gap-2 text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Leak-safe personalisation</h2>
            </div>
            <p className="mt-3 text-sm text-zinc-400">{PRIVACY_NOTICE}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-zinc-500">
              <li>We do NOT use this data for training, ads, or analytics.</li>
              <li>We do NOT upload the context file to our servers automatically.</li>
              <li>You can delete it any time (clear browser data or wipe the JSON file).</li>
              <li>Third-party AIs only see what you paste into them yourself.</li>
            </ul>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPrivacy(false);
                  setPendingEnable(false);
                }}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={acceptPrivacy}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white"
              >
                I understand — enable
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderLock className="h-5 w-5 text-emerald-400" />
          <div>
            <p className="font-semibold text-white">Personalised data (local)</p>
            {!compact && (
              <p className="text-xs text-zinc-500">
                Context file for your patterns — private by design
              </p>
            )}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={ctx.enabled}
            onChange={(e) => tryEnable(e.target.checked)}
            className="h-4 w-4 rounded border-white/20"
          />
          Enable
        </label>
      </div>

      {ctx.enabled && (
        <div className="mt-4 space-y-3">
          <Field
            label="Niche / industry"
            value={ctx.niche ?? ""}
            onChange={(v) => persist({ ...ctx, niche: v })}
          />
          <Field
            label="Brand / business"
            value={ctx.brands ?? ""}
            onChange={(v) => persist({ ...ctx, brands: v })}
          />
          <Field
            label="Audiences"
            value={ctx.audiences ?? ""}
            onChange={(v) => persist({ ...ctx, audiences: v })}
          />
          <Field
            label="Preferred tone"
            value={ctx.preferredTone ?? ""}
            onChange={(v) => persist({ ...ctx, preferredTone: v })}
          />
          <Field
            label="Ongoing goals"
            value={ctx.goals ?? ""}
            onChange={(v) => persist({ ...ctx, goals: v })}
          />
          <Field
            label="Avoid / constraints"
            value={ctx.avoid ?? ""}
            onChange={(v) => persist({ ...ctx, avoid: v })}
          />
          <label className="block text-xs text-zinc-500">
            Free-form notes / patterns
            <textarea
              value={ctx.notes}
              onChange={(e) => persist({ ...ctx, notes: e.target.value })}
              rows={compact ? 3 : 5}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
              placeholder="E.g. I always sell to Gen Z, hate hype slang, brand colors black/gold…"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                downloadContextFile(ctx);
                setStatus("Downloaded context file for your local folder.");
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
            >
              <Download className="h-3 w-3" /> Download JSON
            </button>
            <button
              type="button"
              onClick={() => void saveToFolder()}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10"
            >
              <FolderLock className="h-3 w-3" /> Save to local folder
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5">
              <Upload className="h-3 w-3" /> Import file
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onImportFile(e.target.files[0])}
              />
            </label>
            <button
              type="button"
              onClick={() => setShowPrivacy(true)}
              className="text-xs text-emerald-400/80 hover:underline"
            >
              Privacy promise
            </button>
          </div>
        </div>
      )}
      {status && <p className="mt-2 text-xs text-emerald-400/90">{status}</p>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs text-zinc-500">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
      />
    </label>
  );
}
