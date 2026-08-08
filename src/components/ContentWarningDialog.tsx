"use client";

import { AlertTriangle } from "lucide-react";
import type { SafetyAssessment } from "@/lib/content-safety";

export function ContentWarningDialog({
  assessment,
  onContinue,
  onCancel,
}: {
  assessment: SafetyAssessment;
  onContinue: () => void;
  onCancel: () => void;
}) {
  if (assessment.hardBlock) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
        <div className="max-w-md rounded-2xl border border-red-500/40 bg-[#12121a] p-6 shadow-xl">
          <div className="flex items-center gap-2 text-red-300">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">{assessment.title}</h2>
          </div>
          <p className="mt-3 text-sm text-zinc-400">{assessment.message}</p>
          <button
            type="button"
            onClick={onCancel}
            className="mt-6 w-full rounded-xl border border-white/10 py-2.5 text-sm text-white hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="max-w-md rounded-2xl border border-amber-500/40 bg-[#12121a] p-6 shadow-xl">
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-lg font-semibold">{assessment.title}</h2>
        </div>
        <p className="mt-3 text-sm text-zinc-400">{assessment.message}</p>
        <p className="mt-3 text-xs text-zinc-600">
          Continuing records your acknowledgment for this session only. See{" "}
          <a href="/legal/terms" className="text-zinc-400 underline">
            Terms
          </a>
          .
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-zinc-300 hover:bg-white/5"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-medium text-white hover:bg-amber-500"
          >
            {assessment.continueLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
