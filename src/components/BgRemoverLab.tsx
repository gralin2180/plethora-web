"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Paintbrush, Wand2 } from "lucide-react";
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

/**
 * Auto flood-fill from seed colors + paint erase / keep brush.
 * Much safer than simple average-corner key on portraits.
 */
export function BgRemoverLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"auto" | "paint">("auto");
  const [brush, setBrush] = useState<"erase" | "keep">("erase");
  const [brushSize, setBrushSize] = useState(24);
  const [tol, setTol] = useState(28);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [hasImage, setHasImage] = useState(false);
  const painting = useRef(false);
  const { pending, offerFile, close } = useFileExport();

  const getCtx = () => canvasRef.current?.getContext("2d", { willReadFrequently: true }) ?? null;

  const loadFile = useCallback(async (files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) return;
    setBusy(true);
    setStatus("Loading…");
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("Could not load image"));
        img.src = url;
      });
      const max = 1600;
      let w = img.width;
      let h = img.height;
      if (Math.max(w, h) > max) {
        const s = max / Math.max(w, h);
        w = Math.round(w * s);
        h = Math.round(h * s);
      }
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = getCtx();
      if (!ctx) throw new Error("ctx");
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      setHasImage(true);
      setStatus("Loaded. Run Auto (edges) or Paint erase on areas to remove.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }, []);

  function sampleEdgeSeeds(data: Uint8ClampedArray, w: number, h: number) {
    const pts: [number, number][] = [];
    const step = Math.max(2, Math.floor(Math.min(w, h) / 40));
    for (let x = 0; x < w; x += step) {
      pts.push([x, 0], [x, h - 1]);
    }
    for (let y = 0; y < h; y += step) {
      pts.push([0, y], [w - 1, y]);
    }
    // corners heavier weight
    pts.push([0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]);
    return pts;
  }

  function colorDist(d: Uint8ClampedArray, i: number, r: number, g: number, b: number) {
    const dr = d[i] - r;
    const dg = d[i + 1] - g;
    const db = d[i + 2] - b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  /** Flood fill from edge seeds — only transparentizes connected background */
  function runAuto() {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx || !hasImage) return;
    setBusy(true);
    setStatus("Flood-filling background from edges…");
    try {
      const w = canvas.width;
      const h = canvas.height;
      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;
      const visited = new Uint8Array(w * h);
      const queue: number[] = [];

      // Build seed colors from edges and queue edge pixels close to those tones
      const seeds = sampleEdgeSeeds(d, w, h);
      const colors: { r: number; g: number; b: number }[] = [];
      for (const [x, y] of seeds) {
        const i = (y * w + x) * 4;
        if (d[i + 3] < 10) continue;
        colors.push({ r: d[i], g: d[i + 1], b: d[i + 2] });
      }
      // median-ish average
      const cr = colors.reduce((s, c) => s + c.r, 0) / Math.max(1, colors.length);
      const cg = colors.reduce((s, c) => s + c.g, 0) / Math.max(1, colors.length);
      const cb = colors.reduce((s, c) => s + c.b, 0) / Math.max(1, colors.length);

      const match = (i: number) => {
        // also match if near any dominant edge sample
        if (colorDist(d, i, cr, cg, cb) < tol) return true;
        for (let k = 0; k < Math.min(colors.length, 24); k += 3) {
          const c = colors[k];
          if (colorDist(d, i, c.r, c.g, c.b) < tol * 0.85) return true;
        }
        return false;
      };

      for (const [x, y] of seeds) {
        const idx = y * w + x;
        const i = idx * 4;
        if (!visited[idx] && match(i)) {
          visited[idx] = 1;
          queue.push(idx);
        }
      }

      // BFS 4-connected
      while (queue.length) {
        const idx = queue.pop()!;
        const x = idx % w;
        const y = (idx / w) | 0;
        d[idx * 4 + 3] = 0;
        const neigh = [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1],
        ];
        for (const [nx, ny] of neigh) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const nidx = ny * w + nx;
          if (visited[nidx]) continue;
          const ni = nidx * 4;
          if (d[ni + 3] < 8) {
            visited[nidx] = 1;
            continue;
          }
          if (match(ni)) {
            visited[nidx] = 1;
            queue.push(nidx);
          }
        }
      }

      // Soft edge: fade near transparent
      const copy = new Uint8ClampedArray(d);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = (y * w + x) * 4;
          if (copy[i + 3] === 0) continue;
          let transparent = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (copy[((y + dy) * w + (x + dx)) * 4 + 3] === 0) transparent++;
            }
          }
          if (transparent >= 3) d[i + 3] = Math.min(d[i + 3], 140);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setStatus("Auto done. Refine with Paint erase on leftover backdrop, Paint keep if you erased too much.");
      void usage("bg-remover");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Auto failed");
    }
    setBusy(false);
  }

  function paintAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    ctx.save();
    ctx.globalCompositeOperation = brush === "erase" ? "destination-out" : "source-over";
    if (brush === "erase") {
      ctx.fillStyle = "rgba(0,0,0,1)";
    } else {
      // keep: we cannot restore original easily without history — use full-opacity white marker note
      // For keep: use destination-over with sampled color is hard; instead re-draw from backup would be better
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = "rgba(255,255,255,1)";
    }
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // keep needs a backup of original RGB
  const backupRef = useRef<ImageData | null>(null);

  useEffect(() => {
    if (!hasImage) return;
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (ctx && canvas && !backupRef.current) {
      backupRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  }, [hasImage]);

  function paintKeepAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    const backup = backupRef.current;
    if (!canvas || !ctx || !backup) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = Math.round((clientX - rect.left) * scaleX);
    const cy = Math.round((clientY - rect.top) * scaleY);
    const r = Math.ceil(brushSize / 2);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageData.data;
    const b = backup.data;
    const w = canvas.width;
    const h = canvas.height;
    for (let y = Math.max(0, cy - r); y < Math.min(h, cy + r); y++) {
      for (let x = Math.max(0, cx - r); x < Math.min(w, cx + r); x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy > r * r) continue;
        const i = (y * w + x) * 4;
        d[i] = b[i];
        d[i + 1] = b[i + 1];
        d[i + 2] = b[i + 2];
        d[i + 3] = b[i + 3];
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function onPointer(e: React.PointerEvent) {
    if (mode !== "paint" || !hasImage) return;
    if (e.buttons !== 1 && e.type !== "pointerdown") return;
    if (brush === "keep") paintKeepAt(e.clientX, e.clientY);
    else paintAt(e.clientX, e.clientY);
  }

  async function finishExport() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (blob) offerFile(blob, "no-bg.png");
  }

  return (
    <div className="space-y-4">
      <FileExportDialog pending={pending} onClose={close} />
      <div>
        <h2 className="text-lg font-semibold text-white">Background remover</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Auto floods from <strong className="text-zinc-300">edges</strong> (won&apos;t eat dark hair
          and eyes like a simple corner key). Then refine with paint erase / restore.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("auto")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
            mode === "auto" ? "bg-violet-600 text-white" : "border border-white/10 text-zinc-400"
          }`}
        >
          <Wand2 className="h-3.5 w-3.5" /> Auto
        </button>
        <button
          type="button"
          onClick={() => setMode("paint")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
            mode === "paint" ? "bg-violet-600 text-white" : "border border-white/10 text-zinc-400"
          }`}
        >
          <Paintbrush className="h-3.5 w-3.5" /> Paint
        </button>
      </div>

      {mode === "auto" && (
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          Edge tolerance
          <input
            type="range"
            min={12}
            max={70}
            value={tol}
            onChange={(e) => setTol(Number(e.target.value))}
          />
          {tol}
        </label>
      )}

      {mode === "paint" && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
          <label className="flex items-center gap-2">
            Brush
            <select
              value={brush}
              onChange={(e) => setBrush(e.target.value as "erase" | "keep")}
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-white"
            >
              <option value="erase">Erase (remove)</option>
              <option value="keep">Restore (from original)</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            Size
            <input
              type="range"
              min={6}
              max={80}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
            {brushSize}
          </label>
        </div>
      )}

      <DropZone
        accept="image/*"
        label={busy ? "Working…" : "Drop or pick image"}
        onFiles={(f) => {
          backupRef.current = null;
          void loadFile(f);
        }}
        disabled={busy}
      />

      <div
        className={`overflow-hidden rounded-xl border border-white/10 bg-[url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\"><rect width=\"8\" height=\"8\" fill=\"%23333\"/><rect x=\"8\" y=\"8\" width=\"8\" height=\"8\" fill=\"%23333\"/></svg>')] ${
          hasImage ? "" : "hidden"
        }`}
      >
        <canvas
          ref={canvasRef}
          className="mx-auto max-h-[420px] w-full cursor-crosshair touch-none object-contain"
          onPointerDown={(e) => {
            painting.current = true;
            (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
            onPointer(e);
          }}
          onPointerMove={(e) => {
            if (painting.current) onPointer(e);
          }}
          onPointerUp={() => {
            painting.current = false;
          }}
          onPointerLeave={() => {
            painting.current = false;
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!hasImage || busy}
          onClick={runAuto}
          className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Run auto remove
        </button>
        <button
          type="button"
          disabled={!hasImage}
          onClick={() => void finishExport()}
          className="rounded-xl border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:bg-white/5 disabled:opacity-40"
        >
          View / download PNG…
        </button>
      </div>
      {status && <p className="text-sm text-zinc-400">{status}</p>}
      <p className="text-xs text-zinc-600">
        For studio AI cutouts (complex hair), rembg on local GPU still wins — this is free in-browser.
      </p>
    </div>
  );
}
