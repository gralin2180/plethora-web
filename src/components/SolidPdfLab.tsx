"use client";

import { useMemo, useState } from "react";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Loader2,
  Trash2,
} from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { FileExportDialog, useFileExport } from "@/components/FileExportDialog";
import { trackToolUse } from "@/lib/self-learn";

type Tab = "merge" | "split" | "pages" | "compress" | "stamp";

async function usage(id: string) {
  try {
    trackToolUse(id, 2);
    await fetch("/api/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId: id }),
    });
  } catch {
    /* ignore */
  }
}

function parseRanges(spec: string, pageCount: number): number[] {
  const out: number[] = [];
  for (const part of spec.split(/[,;\s]+/).filter(Boolean)) {
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      const a = Math.max(1, Number(m[1]));
      const b = Math.min(pageCount, Number(m[2]));
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.push(i - 1);
    } else if (/^\d+$/.test(part)) {
      const n = Number(part);
      if (n >= 1 && n <= pageCount) out.push(n - 1);
    }
  }
  return [...new Set(out)].sort((a, b) => a - b);
}

export function SolidPdfLab({ initialTab = "merge" }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [range, setRange] = useState("1-");
  const [stamp, setStamp] = useState("");
  const [rotate, setRotate] = useState(90);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const { pending, offerFile, close } = useFileExport();

  const tabs: { id: Tab; label: string }[] = [
    { id: "merge", label: "Merge" },
    { id: "split", label: "Split" },
    { id: "pages", label: "Rotate / extract" },
    { id: "compress", label: "Compress" },
    { id: "stamp", label: "Stamp" },
  ];

  function take(list: FileList | File[]) {
    const next = Array.from(list).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    setFiles((tab === "merge" ? [...files, ...next] : next).slice(0, 40));
    setStatus("");
    setPageCount(null);
    const first = next[0];
    if (first && tab !== "merge") {
      void first.arrayBuffer().then((buf) =>
        PDFDocument.load(buf)
          .then((d) => setPageCount(d.getPageCount()))
          .catch(() => setPageCount(null))
      );
    }
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= files.length) return;
    const copy = files.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setFiles(copy);
  }

  async function run() {
    if (!files.length) return;
    setBusy(true);
    setStatus("");
    try {
      let bytes: Uint8Array;
      let name = "plethora.pdf";

      if (tab === "merge") {
        const merged = await PDFDocument.create();
        for (const file of files) {
          const src = await PDFDocument.load(await file.arrayBuffer());
          const copied = await merged.copyPages(src, src.getPageIndices());
          copied.forEach((p) => merged.addPage(p));
        }
        bytes = await merged.save();
        name = "merged.pdf";
        await usage("pdf-merge");
      } else {
        const src = await PDFDocument.load(await files[0].arrayBuffer());
        const count = src.getPageCount();
        setPageCount(count);
        const spec = range.replace(/-$/, `-${count}`);
        const idxs = parseRanges(spec || `1-${count}`, count);
        const pick = idxs.length ? idxs : src.getPageIndices();

        if (tab === "stamp") {
          const font = await src.embedFont(StandardFonts.Helvetica);
          for (const page of src.getPages()) {
            if (stamp.trim()) {
              page.drawText(stamp.slice(0, 80), {
                x: 28,
                y: 22,
                size: 9,
                font,
                color: rgb(0.35, 0.35, 0.4),
              });
            }
          }
          bytes = await src.save();
          name = "stamped.pdf";
        } else if (tab === "compress") {
          src.setTitle("");
          src.setAuthor("");
          src.setSubject("");
          src.setKeywords([]);
          bytes = await src.save({ useObjectStreams: true });
          name = "compressed.pdf";
        } else {
          const out = await PDFDocument.create();
          const copied = await out.copyPages(src, pick);
          copied.forEach((p) => {
            if (tab === "pages" && rotate) {
              const now = p.getRotation().angle + rotate;
              p.setRotation(degrees(((now % 360) + 360) % 360));
            }
            out.addPage(p);
          });
          bytes = await out.save();
          name = tab === "split" ? "extracted-pages.pdf" : "pages.pdf";
        }
        await usage("pdf-editor");
      }

      offerFile(new Blob([new Uint8Array(bytes)], { type: "application/pdf" }), name);
      setStatus("Ready — preview then download. Files never left this browser.");
    } catch (e) {
      setStatus(
        e instanceof Error ? e.message : "Could not process this PDF (encrypted files often fail)."
      );
    }
    setBusy(false);
  }

  const hint = useMemo(() => {
    if (tab === "merge") return "Drop many PDFs, reorder, merge — same job as iLovePDF, on your device.";
    if (tab === "split") return "Extract a range (e.g. 1-3,7) into a new PDF.";
    if (tab === "pages") return "Keep only a range and/or rotate those pages.";
    if (tab === "compress") return "Rewrite with object streams and strip metadata. Huge image-heavy PDFs still need a desktop tool.";
    return "Footer stamp on every page.";
  }, [tab]);

  return (
    <div className="space-y-4">
      <FileExportDialog pending={pending} onClose={close} />
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              if (t.id !== "merge") setFiles((f) => f.slice(0, 1));
            }}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
              tab === t.id ? "bg-white text-black" : "border border-white/10 text-zinc-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-zinc-500">{hint}</p>
      <DropZone
        compact
        multiple={tab === "merge"}
        accept="application/pdf"
        label={tab === "merge" ? "Drop PDFs to merge" : "Drop a PDF"}
        hint="Private — processed in this tab"
        disabled={busy}
        onFiles={(f) => take(f)}
      />
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5 text-xs text-zinc-300"
            >
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              {tab === "merge" && (
                <>
                  <button type="button" onClick={() => move(i, -1)} aria-label="Up">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} aria-label="Down">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Remove">
                <Trash2 className="h-3.5 w-3.5 text-zinc-500" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {pageCount != null && (
        <p className="text-[11px] text-zinc-500">{pageCount} page{pageCount === 1 ? "" : "s"} in file</p>
      )}
      {(tab === "split" || tab === "pages") && (
        <label className="block text-xs text-zinc-500">
          Pages (e.g. 1-3,5)
          <input
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
      )}
      {tab === "pages" && (
        <label className="block text-xs text-zinc-500">
          Rotate
          <select
            value={rotate}
            onChange={(e) => setRotate(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value={0}>No extra rotation</option>
            <option value={90}>90°</option>
            <option value={180}>180°</option>
            <option value={270}>270°</option>
          </select>
        </label>
      )}
      {tab === "stamp" && (
        <label className="block text-xs text-zinc-500">
          Footer
          <input
            value={stamp}
            onChange={(e) => setStamp(e.target.value)}
            placeholder="Confidential · page footer"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
      )}
      <button
        type="button"
        disabled={busy || !files.length}
        onClick={() => void run()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {tab === "merge" ? "Merge PDF" : tab === "split" ? "Extract pages" : tab === "compress" ? "Compress" : tab === "stamp" ? "Stamp PDF" : "Apply"}
      </button>
      {status && <p className="text-sm text-zinc-400">{status}</p>}
    </div>
  );
}
