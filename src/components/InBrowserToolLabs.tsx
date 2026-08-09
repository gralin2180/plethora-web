"use client";

import { useState, type ReactNode } from "react";
import {
  Download,
  Loader2,
  Presentation,
  Sheet,
} from "lucide-react";
import { DropZone } from "@/components/DropZone";
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

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function Shell({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-400">{blurb}</p>
      </div>
      {children}
    </div>
  );
}

/** PDF → PNG pages in browser (pdf.js) */
export function PdfToImagesLab() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [scale, setScale] = useState(1.5);

  async function run(files: FileList | File[]) {
    const file = Array.from(files)[0];
    if (!file) return;
    setBusy(true);
    setStatus("Loading PDF engine…");
    try {
      const pdfjs = await import("pdfjs-dist");
      // Worker from CDN matching package major
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const data = new Uint8Array(await file.arrayBuffer());
      const doc = await pdfjs.getDocument({ data }).promise;
      const n = Math.min(doc.numPages, 30);
      setStatus(`Rendering ${n} page(s)…`);
      for (let i = 1; i <= n; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas");
        await page.render({
          canvasContext: ctx,
          viewport,
        } as Parameters<typeof page.render>[0]).promise;
        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, "image/png")
        );
        if (blob) downloadBlob(blob, `page-${i}.png`);
      }
      setStatus(
        n < doc.numPages
          ? `Downloaded first ${n} pages (cap 30). Use local poppler for huge decks.`
          : `Downloaded ${n} PNG(s) — stayed in your browser.`
      );
      await usage("pdf-to-images");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not render PDF.");
    }
    setBusy(false);
  }

  return (
    <Shell
      title="PDF → images (in browser)"
      blurb="Converts pages to PNG on your device — no upload. Cap 30 pages. Links below for bulk/offline."
    >
      <label className="flex items-center gap-2 text-sm text-zinc-400">
        Scale
        <input
          type="range"
          min={1}
          max={2.5}
          step={0.25}
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
        />
        <span className="tabular-nums text-zinc-300">{scale}×</span>
      </label>
      <DropZone
        accept="application/pdf"
        label={busy ? "Working…" : "Drop a PDF"}
        onFiles={(f) => void run(f)}
        disabled={busy}
      />
      {busy && <Loader2 className="h-5 w-5 animate-spin text-violet-400" />}
      {status && <p className="text-sm text-zinc-400">{status}</p>}
      <p className="text-xs text-zinc-600">
        Heavy jobs:{" "}
        <a className="text-violet-400 hover:underline" href="https://tools.pdf24.org/en/pdf-to-images">
          PDF24
        </a>{" "}
        · local{" "}
        <a className="text-violet-400 hover:underline" href="https://github.com/oschwartz10612/poppler-windows">
          poppler
        </a>
      </p>
    </Shell>
  );
}

/** PDF → extract text as .txt / .md (path toward Word) */
export function PdfToDocLab() {
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");

  async function run(files: FileList | File[]) {
    const file = Array.from(files)[0];
    if (!file) return;
    setBusy(true);
    setStatus("Extracting text…");
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const data = new Uint8Array(await file.arrayBuffer());
      const doc = await pdfjs.getDocument({ data }).promise;
      const parts: string[] = [];
      const n = Math.min(doc.numPages, 50);
      for (let i = 1; i <= n; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const line = content.items
          .map((it) => ("str" in it ? it.str : ""))
          .join(" ");
        parts.push(`## Page ${i}\n\n${line}`);
      }
      const out = parts.join("\n\n");
      setText(out);
      setStatus(`Extracted ${n} page(s). Download .md / .txt, or paste into Word/Docs.`);
      await usage("pdf-to-doc");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Extract failed");
    }
    setBusy(false);
  }

  return (
    <Shell
      title="PDF → text / Word path"
      blurb="Pulls selectable text in-browser (best for text PDFs). Scanned books need OCR elsewhere. Download Markdown, open in Word/Google Docs for real editing."
    >
      <DropZone
        accept="application/pdf"
        label={busy ? "Extracting…" : "Drop a PDF"}
        onFiles={(f) => void run(f)}
        disabled={busy}
      />
      {status && <p className="text-sm text-zinc-400">{status}</p>}
      {text && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white"
              onClick={() =>
                downloadBlob(new Blob([text], { type: "text/markdown" }), "plethora-extract.md")
              }
            >
              <Download className="h-3.5 w-3.5" /> .md
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-zinc-300"
              onClick={() =>
                downloadBlob(new Blob([text], { type: "text/plain" }), "plethora-extract.txt")
              }
            >
              .txt
            </button>
          </div>
          <pre className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-300 whitespace-pre-wrap">
            {text.slice(0, 8000)}
            {text.length > 8000 ? "\n…" : ""}
          </pre>
        </>
      )}
    </Shell>
  );
}

/** Simple color-key background remove — end-to-end browser */
export function BgRemoverLab() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [tol, setTol] = useState(40);

  async function run(files: FileList | File[]) {
    const file = Array.from(files)[0];
    if (!file) return;
    setBusy(true);
    setStatus("Processing…");
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("bad image"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      // sample corners average as background
      const samples = [
        [0, 0],
        [canvas.width - 1, 0],
        [0, canvas.height - 1],
        [canvas.width - 1, canvas.height - 1],
      ];
      let r = 0,
        g = 0,
        b = 0;
      for (const [x, y] of samples) {
        const i = (y * canvas.width + x) * 4;
        r += d[i];
        g += d[i + 1];
        b += d[i + 2];
      }
      r /= 4;
      g /= 4;
      b /= 4;
      const t = tol;
      for (let i = 0; i < d.length; i += 4) {
        const dr = d[i] - r;
        const dg = d[i + 1] - g;
        const db = d[i + 2] - b;
        if (Math.sqrt(dr * dr + dg * dg + db * db) < t) d[i + 3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, "image/png")
      );
      if (blob) downloadBlob(blob, "no-bg.png");
      URL.revokeObjectURL(url);
      setStatus(
        "Downloaded PNG with corner-color key. Soft/photo subjects: use rembg local or remove.bg below."
      );
      await usage("bg-remover");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <Shell
      title="Background remover"
      blurb="Instant path: chroma-key from corner color (great for solid backdrops). AI/photo path still uses local rembg or free web services."
    >
      <label className="flex items-center gap-2 text-sm text-zinc-400">
        Tolerance
        <input
          type="range"
          min={10}
          max={120}
          value={tol}
          onChange={(e) => setTol(Number(e.target.value))}
        />
        {tol}
      </label>
      <DropZone
        accept="image/*"
        label={busy ? "Removing…" : "Drop image (solid bg works best)"}
        onFiles={(f) => void run(f)}
        disabled={busy}
      />
      {status && <p className="text-sm text-zinc-400">{status}</p>}
      <div className="flex flex-wrap gap-2 text-xs">
        <a
          className="rounded-lg border border-white/10 px-2 py-1 text-zinc-400 hover:text-white"
          href="https://www.remove.bg"
          target="_blank"
          rel="noopener noreferrer"
        >
          remove.bg (web)
        </a>
        <a
          className="rounded-lg border border-white/10 px-2 py-1 text-zinc-400 hover:text-white"
          href="https://github.com/danielgatis/rembg"
          target="_blank"
          rel="noopener noreferrer"
        >
          rembg local GPU
        </a>
      </div>
    </Shell>
  );
}

/** Interactive ffmpeg command builder */
export function VideoConverterLab() {
  const [infile, setInfile] = useState("input.mov");
  const [preset, setPreset] = useState<"mp4" | "mp3" | "gif" | "compress">("mp4");
  const cmds: Record<string, string> = {
    mp4: `ffmpeg -i "${infile}" -c:v libx264 -crf 23 -c:a aac -movflags +faststart out.mp4`,
    mp3: `ffmpeg -i "${infile}" -vn -c:a libmp3lame -q:a 2 out.mp3`,
    gif: `ffmpeg -i "${infile}" -vf "fps=12,scale=480:-1:flags=lanczos" -loop 0 out.gif`,
    compress: `ffmpeg -i "${infile}" -c:v libx264 -crf 28 -preset fast -c:a aac -b:a 96k out-small.mp4`,
  };
  const cmd = cmds[preset];

  return (
    <Shell
      title="Video / audio converter"
      blurb="Full conversion needs FFmpeg on your PC (free). We generate the exact command — paste in terminal. HandBrake if you prefer GUI."
    >
      <label className="block text-sm text-zinc-400">
        Input filename
        <input
          value={infile}
          onChange={(e) => setInfile(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["mp4", "→ MP4"],
            ["mp3", "→ MP3"],
            ["gif", "→ GIF"],
            ["compress", "Compress"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setPreset(id);
              void usage("video-converter");
            }}
            className={`rounded-full px-3 py-1.5 text-xs ${
              preset === id ? "bg-violet-600 text-white" : "border border-white/10 text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <pre className="overflow-x-auto rounded-xl border border-emerald-500/20 bg-black/40 p-3 text-xs text-emerald-100/90">
        {cmd}
      </pre>
      <button
        type="button"
        className="text-xs text-violet-300"
        onClick={() => void navigator.clipboard.writeText(cmd)}
      >
        Copy command
      </button>
      <div className="flex flex-wrap gap-2 text-xs">
        <a
          href="https://ffmpeg.org/download.html"
          className="text-zinc-400 hover:text-white"
          target="_blank"
          rel="noopener noreferrer"
        >
          Install FFmpeg
        </a>
        <a
          href="https://handbrake.fr/"
          className="text-zinc-400 hover:text-white"
          target="_blank"
          rel="noopener noreferrer"
        >
          HandBrake GUI
        </a>
      </div>
    </Shell>
  );
}

export function SlidesDeckLab() {
  const [title, setTitle] = useState("Q3 Plan");
  const [bullets, setBullets] = useState("Goal\nCustomers\nRoadmap\nAsk");
  const md = `---
marp: true
theme: default
paginate: true
---

# ${title}

${bullets
  .split("\n")
  .filter(Boolean)
  .map((b) => `## ${b.trim()}\n\n- Point one\n- Point two\n\n---\n`)
  .join("\n")}
`;

  return (
    <Shell
      title="Presentation builder"
      blurb="Generate Marp Markdown now — open free in VS Code Marp or marp.app. Still free FOSS path vs paid Gamma."
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
        placeholder="Deck title"
      />
      <textarea
        value={bullets}
        onChange={(e) => setBullets(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        placeholder="One section title per line"
      />
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm text-white"
        onClick={() => {
          downloadBlob(new Blob([md], { type: "text/markdown" }), "deck.md");
          void usage("slides-deck");
        }}
      >
        <Presentation className="h-4 w-4" /> Download Marp .md
      </button>
      <pre className="max-h-40 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-[11px] text-zinc-400">
        {md.slice(0, 1500)}
      </pre>
      <a
        href="https://web.marp.app/"
        className="text-xs text-violet-300 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Open Marp Web (free)
      </a>
    </Shell>
  );
}

export function ExcelHubLab() {
  const [rows, setRows] = useState("Product,Price,Qty\nA,10,3\nB,20,2");
  const parsed = rows
    .trim()
    .split(/\n/)
    .map((l) => l.split(",").map((c) => c.trim()));

  return (
    <Shell
      title="Excel / table hub"
      blurb="Paste CSV → preview → download. Formula prompt for Sheets/Excel. LibreOffice for full desktop."
    >
      <textarea
        value={rows}
        onChange={(e) => setRows(e.target.value)}
        rows={5}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white"
      />
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-xs text-zinc-300">
          <tbody>
            {parsed.slice(0, 20).map((r, i) => (
              <tr key={i} className="border-b border-white/5">
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
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm text-white"
        onClick={() => {
          downloadBlob(new Blob([rows], { type: "text/csv" }), "table.csv");
          void usage("excel-hub");
        }}
      >
        <Sheet className="h-4 w-4" /> Download .csv
      </button>
      <a
        href="/tools/csv-text-tools"
        className="block text-xs text-violet-300 hover:underline"
      >
        Advanced CSV cleanup →
      </a>
    </Shell>
  );
}
