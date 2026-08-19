"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { ArrowDown, ArrowUp, Download, Loader2, Trash2 } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { FileExportDialog, useFileExport } from "@/components/FileExportDialog";
import { trackToolUse } from "@/lib/self-learn";

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function readUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function SolidImageFormatLab() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [fmt, setFmt] = useState<"image/webp" | "image/jpeg" | "image/png">("image/webp");
  const [quality, setQuality] = useState(0.82);
  const [maxW, setMaxW] = useState(0);
  const [busy, setBusy] = useState(false);
  const [outUrl, setOutUrl] = useState("");
  const [outSize, setOutSize] = useState(0);
  const { pending, offerFile, close } = useFileExport();

  async function take(files: FileList | File[]) {
    const f = Array.from(files)[0];
    if (!f) return;
    setFile(f);
    const url = await readUrl(f);
    setPreview(url);
    setOutUrl("");
  }

  async function convert() {
    if (!file || !preview) return;
    setBusy(true);
    try {
      const img = await loadImage(preview);
      let w = img.width;
      let h = img.height;
      if (maxW > 0 && w > maxW) {
        h = Math.round((h * maxW) / w);
        w = maxW;
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      if (fmt === "image/jpeg") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      const q = fmt === "image/png" ? undefined : quality;
      const dataUrl = canvas.toDataURL(fmt, q);
      setOutUrl(dataUrl);
      const bin = atob(dataUrl.split(",")[1] || "");
      setOutSize(bin.length);
      const ext = fmt === "image/jpeg" ? "jpg" : fmt.split("/")[1];
      const blob = await (await fetch(dataUrl)).blob();
      offerFile(blob, `converted.${ext}`);
      await usage("image-format");
    } catch {
      setOutUrl("");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <FileExportDialog pending={pending} onClose={close} />
      <p className="text-xs text-zinc-500">
        Squoosh-style convert on your device: format, quality, optional max width. Original never uploads.
      </p>
      <DropZone compact accept="image/*" label={file ? file.name : "Drop an image"} onFiles={(f) => void take(f)} />
      {preview && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] text-zinc-500">Original {file ? fmtBytes(file.size) : ""}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="max-h-48 w-full rounded-xl object-contain bg-black/40" />
          </div>
          <div>
            <p className="mb-1 text-[11px] text-zinc-500">
              Output {outSize ? fmtBytes(outSize) : "—"}
            </p>
            {outUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={outUrl} alt="" className="max-h-48 w-full rounded-xl object-contain bg-black/40" />
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-zinc-600">
                Convert to preview
              </div>
            )}
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {(["image/webp", "image/jpeg", "image/png"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFmt(f)}
            className={`rounded-xl py-2 text-sm ${fmt === f ? "bg-white text-black" : "border border-white/10 text-zinc-400"}`}
          >
            {f.split("/")[1].toUpperCase()}
          </button>
        ))}
      </div>
      {fmt !== "image/png" && (
        <label className="block text-xs text-zinc-500">
          Quality {Math.round(quality * 100)}%
          <input
            type="range"
            min={0.4}
            max={1}
            step={0.02}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
      )}
      <label className="block text-xs text-zinc-500">
        Max width (0 = original)
        <input
          type="number"
          min={0}
          value={maxW}
          onChange={(e) => setMaxW(Number(e.target.value))}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </label>
      <button
        type="button"
        disabled={!file || busy}
        onClick={() => void convert()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Convert
      </button>
    </div>
  );
}

export function SolidImageToPdfLab() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState<"a4" | "letter">("a4");
  const [margin, setMargin] = useState(24);
  const { pending, offerFile, close } = useFileExport();

  function take(list: FileList | File[]) {
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, 40));
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
    try {
      const doc = new jsPDF({ unit: "pt", format: page });
      let first = true;
      for (const file of files) {
        const dataUrl = await readUrl(file);
        const img = await loadImage(dataUrl);
        const pageW = doc.internal.pageSize.getWidth() - margin * 2;
        const pageH = doc.internal.pageSize.getHeight() - margin * 2;
        const ratio = Math.min(pageW / img.width, pageH / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        if (!first) doc.addPage();
        first = false;
        const kind = file.type.includes("png") ? "PNG" : "JPEG";
        let payload = dataUrl;
        if (kind === "JPEG" && !dataUrl.startsWith("data:image/jpeg")) {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, img.width, img.height);
            ctx.drawImage(img, 0, 0);
            payload = canvas.toDataURL("image/jpeg", 0.92);
          }
        }
        doc.addImage(payload, kind, margin + (pageW - w) / 2, margin + (pageH - h) / 2, w, h);
      }
      offerFile(doc.output("blob"), "images.pdf");
      await usage("image-to-pdf");
    } catch {
      /* ignore */
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <FileExportDialog pending={pending} onClose={close} />
      <p className="text-xs text-zinc-500">
        Drop scans or photos → one PDF. Reorder pages. Stays on this device (iLovePDF-style, no account).
      </p>
      <DropZone compact multiple accept="image/*" label="Drop images" onFiles={take} />
      {files.length > 0 && (
        <ul className="space-y-1">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5 text-xs">
              <span className="min-w-0 flex-1 truncate text-zinc-300">{f.name}</span>
              <button type="button" onClick={() => move(i, -1)} aria-label="Up">
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => move(i, 1)} aria-label="Down">
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Remove">
                <Trash2 className="h-3.5 w-3.5 text-zinc-500" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-zinc-500">
          Page
          <select
            value={page}
            onChange={(e) => setPage(e.target.value as "a4" | "letter")}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          >
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
          </select>
        </label>
        <label className="text-xs text-zinc-500">
          Margin (pt)
          <input
            type="number"
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={!files.length || busy}
        onClick={() => void run()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Make PDF
      </button>
    </div>
  );
}

export function parseCsv(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  const s = raw.replace(/^\uFEFF/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === "," || c === "\t") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.length)) rows.push(row);
  return rows.filter((r) => r.some((c) => c.trim()));
}

export function SolidCsvLab({ onDone }: { onDone: () => void }) {
  const [raw, setRaw] = useState("");
  const [sortCol, setSortCol] = useState(0);
  const rows = useMemo(() => parseCsv(raw), [raw]);
  const header = rows[0] || [];
  const body = rows.slice(1);
  const unique = useMemo(() => {
    const seen = new Set<string>();
    const out: string[][] = header.length ? [header] : [];
    for (const r of body) {
      const k = r.join("\t").toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(r);
    }
    return out;
  }, [header, body]);

  const sorted = useMemo(() => {
    if (unique.length < 2) return unique;
    const [h, ...rest] = unique;
    rest.sort((a, b) => (a[sortCol] || "").localeCompare(b[sortCol] || "", undefined, { numeric: true }));
    return [h, ...rest];
  }, [unique, sortCol]);

  const csv = sorted.map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n");
  const json = JSON.stringify(
    sorted.slice(1).map((r) => Object.fromEntries(sorted[0].map((h, i) => [h || `col${i + 1}`, r[i] ?? ""]))),
    null,
    2
  );

  function dl(text: string, name: string, type: string) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    onDone();
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Paste CSV/TSV — TableConvert-style: preview, dedupe, sort, download CSV or JSON. Stays in the browser.
      </p>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={6}
        placeholder={"name,email\nAda,ada@x.com"}
        className="w-full rounded-2xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-white"
      />
      {header.length > 0 && (
        <>
          <label className="text-xs text-zinc-500">
            Sort by
            <select
              value={sortCol}
              onChange={(e) => setSortCol(Number(e.target.value))}
              className="ml-2 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-white"
            >
              {header.map((h, i) => (
                <option key={i} value={i}>
                  {h || `col ${i + 1}`}
                </option>
              ))}
            </select>
          </label>
          <div className="max-h-48 overflow-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-[11px] text-zinc-300">
              <thead className="bg-white/5 text-zinc-400">
                <tr>
                  {header.map((h, i) => (
                    <th key={i} className="px-2 py-1 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.slice(1, 31).map((r, i) => (
                  <tr key={i} className="border-t border-white/5">
                    {r.map((c, j) => (
                      <td key={j} className="px-2 py-1">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-zinc-500">
            {body.length} rows → {sorted.length - 1} unique
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-xl bg-violet-600 px-4 py-2 text-sm text-white" onClick={() => dl(csv, "cleaned.csv", "text/csv")}>
              CSV
            </button>
            <button type="button" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300" onClick={() => dl(json, "table.json", "application/json")}>
              JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}
