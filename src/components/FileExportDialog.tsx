"use client";

import { useEffect, useState } from "react";
import { Download, Eye, X } from "lucide-react";

export type PendingFile = {
  blob: Blob;
  defaultName: string;
  previewUrl?: string;
  previewText?: string;
};

/**
 * Safer save flow: preview + rename before download (never auto-push files).
 */
export function useFileExport() {
  const [pending, setPending] = useState<PendingFile | null>(null);

  function offerFile(blob: Blob, defaultName: string, opts?: { previewText?: string }) {
    const previewUrl = blob.type.startsWith("image/") || blob.type === "application/pdf"
      ? URL.createObjectURL(blob)
      : undefined;
    setPending({
      blob,
      defaultName,
      previewUrl,
      previewText: opts?.previewText,
    });
  }

  function close() {
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
  }

  return { pending, offerFile, close, setPending };
}

export function FileExportDialog({
  pending,
  onClose,
}: {
  pending: PendingFile | null;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [view, setView] = useState(true);

  useEffect(() => {
    if (pending) {
      setName(pending.defaultName);
      setView(true);
    }
  }, [pending]);

  if (!pending) return null;

  function download() {
    let final = name.trim() || pending!.defaultName;
    if (!final.includes(".") && pending!.defaultName.includes(".")) {
      const ext = pending!.defaultName.split(".").pop();
      if (ext) final = `${final}.${ext}`;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(pending!.blob);
    a.download = final;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#12121a] p-5 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-white">Result ready</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Preview first, rename if you want, then download — nothing forces a save.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-4 block text-xs text-zinc-500">
          File name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
          >
            <Eye className="h-3.5 w-3.5" />
            {view ? "Hide preview" : "View preview"}
          </button>
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400"
          >
            Discard
          </button>
        </div>

        {view && (
          <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/40">
            {pending.previewUrl && pending.blob.type.startsWith("image/") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pending.previewUrl}
                alt="Preview"
                className="max-h-72 w-full object-contain"
              />
            )}
            {pending.previewUrl && pending.blob.type === "application/pdf" && (
              <iframe title="PDF preview" src={pending.previewUrl} className="h-72 w-full" />
            )}
            {pending.previewText && (
              <pre className="max-h-72 overflow-auto p-3 text-xs text-zinc-300 whitespace-pre-wrap">
                {pending.previewText.slice(0, 12000)}
              </pre>
            )}
            {!pending.previewUrl && !pending.previewText && (
              <p className="p-4 text-sm text-zinc-500">
                Binary file ({pending.blob.type || "unknown"}) — download to open in your app.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
