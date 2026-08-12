"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Circle,
  Crop,
  Image,
  Monitor,
  Square,
} from "lucide-react";
import { FileExportDialog, useFileExport } from "@/components/FileExportDialog";
import { trackToolUse } from "@/lib/self-learn";

type Source = "screen" | "camera";
type Phase = "idle" | "live" | "recording";

type CropRect = { x: number; y: number; w: number; h: number };

function pickMime(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  }
  return "video/webm";
}

export function VideoRecorderLab() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number>(0);
  const cropRef = useRef<CropRect | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [source, setSource] = useState<Source>("screen");
  const [cropOn, setCropOn] = useState(false);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const { pending: exportFile, offerFile, close: closeExport } = useFileExport();

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cropRef.current = crop;
  }, [crop]);

  const stopStream = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    trackToolUse("video-recorder", 1);
    return () => {
      stopStream();
      recorderRef.current?.stop();
    };
  }, [stopStream]);

  useEffect(() => {
    if (phase !== "recording") return;
    const t0 = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 500);
    return () => clearInterval(id);
  }, [phase]);

  function videoCropRect(v: HTMLVideoElement): CropRect {
    const full = { x: 0, y: 0, w: v.videoWidth, h: v.videoHeight };
    if (!cropOn || !cropRef.current) return full;
    const c = cropRef.current;
    return {
      x: Math.max(0, Math.min(c.x, v.videoWidth - 1)),
      y: Math.max(0, Math.min(c.y, v.videoHeight - 1)),
      w: Math.max(1, Math.min(c.w, v.videoWidth - c.x)),
      h: Math.max(1, Math.min(c.h, v.videoHeight - c.y)),
    };
  }

  function drawToCanvas(v: HTMLVideoElement, out: HTMLCanvasElement) {
    const r = videoCropRect(v);
    out.width = r.w;
    out.height = r.h;
    const ctx = out.getContext("2d");
    if (!ctx || !v.videoWidth) return;
    ctx.drawImage(v, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
  }

  function paintLoop() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || v.readyState < 2) {
      rafRef.current = requestAnimationFrame(paintLoop);
      return;
    }
    drawToCanvas(v, c);
    rafRef.current = requestAnimationFrame(paintLoop);
  }

  async function startPreview(src: Source) {
    setError(null);
    stopStream();
    setSource(src);
    try {
      const stream =
        src === "screen"
          ? await navigator.mediaDevices.getDisplayMedia({
              video: { frameRate: 30 },
              audio: true,
            })
          : await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "user", width: { ideal: 1280 } },
              audio: true,
            });
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play();
      }
      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        stopStream();
        setPhase("idle");
      });
      setPhase("live");
      rafRef.current = requestAnimationFrame(paintLoop);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start capture");
      setPhase("idle");
    }
  }

  function startRecording() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || phase !== "live") return;
    drawToCanvas(v, c);
    const mime = pickMime();
    const canvasStream = c.captureStream(30);
    // Keep mic/system audio from original stream when available
    streamRef.current?.getAudioTracks().forEach((t) => canvasStream.addTrack(t));

    chunksRef.current = [];
    const rec = new MediaRecorder(canvasStream, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
    recorderRef.current = rec;
    rec.ondataavailable = (ev) => {
      if (ev.data.size) chunksRef.current.push(ev.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime.split(";")[0] });
      const ext = mime.includes("webm") ? "webm" : "mp4";
      offerFile(blob, `plethora-recording-${Date.now()}.${ext}`);
      setPhase("live");
      setElapsed(0);
    };
    rec.start(250);
    setPhase("recording");
    setElapsed(0);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }

  function takeScreenshot() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || phase === "idle") return;
    drawToCanvas(v, c);
    c.toBlob(
      (blob) => {
        if (blob) offerFile(blob, `plethora-shot-${Date.now()}.png`);
      },
      "image/png",
      0.92
    );
    trackToolUse("video-recorder", 2);
  }

  function pointerToVideoPx(clientX: number, clientY: number): { x: number; y: number } | null {
    const wrap = previewRef.current;
    const v = videoRef.current;
    if (!wrap || !v || !v.videoWidth) return null;
    const rect = wrap.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    return {
      x: Math.round(nx * v.videoWidth),
      y: Math.round(ny * v.videoHeight),
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!cropOn || phase === "idle") return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const p = pointerToVideoPx(e.clientX, e.clientY);
    if (!p) return;
    setDragging(true);
    setDragStart(p);
    setCrop({ x: p.x, y: p.y, w: 0, h: 0 });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !dragStart) return;
    const p = pointerToVideoPx(e.clientX, e.clientY);
    if (!p) return;
    setCrop({
      x: Math.min(dragStart.x, p.x),
      y: Math.min(dragStart.y, p.y),
      w: Math.abs(p.x - dragStart.x),
      h: Math.abs(p.y - dragStart.y),
    });
  }

  function onPointerUp() {
    setDragging(false);
    setDragStart(null);
  }

  const cropOverlay =
    cropOn && crop && videoRef.current?.videoWidth
      ? {
          left: `${(crop.x / videoRef.current.videoWidth) * 100}%`,
          top: `${(crop.y / videoRef.current.videoHeight) * 100}%`,
          width: `${(crop.w / videoRef.current.videoWidth) * 100}%`,
          height: `${(crop.h / videoRef.current.videoHeight) * 100}%`,
        }
      : null;

  return (
    <div className="space-y-3">
      <FileExportDialog pending={exportFile} onClose={closeExport} />

      <p className="text-xs text-zinc-500">
        Lightweight capture in your browser — screen or camera, drag to crop, record or screenshot.
        Nothing uploads; preview + save locally.
      </p>

      <div
        ref={previewRef}
        className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ touchAction: "none" }}
      >
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" aria-hidden />
        {cropOn && !cropOverlay && phase !== "idle" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 text-xs text-zinc-400">
            Drag to select crop area
          </div>
        )}
        {cropOverlay && cropOverlay.width !== "0%" && (
          <>
            <div className="pointer-events-none absolute inset-0 bg-black/50" />
            <div
              className="pointer-events-none absolute border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
              style={cropOverlay}
            />
          </>
        )}
        {phase === "recording" && (
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-red-600/90 px-2.5 py-1 text-[11px] font-medium text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            REC {elapsed}s
          </div>
        )}
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-500">
            <Monitor className="h-8 w-8 opacity-40" />
            <span className="text-xs">Pick a source below</span>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
        <button
          type="button"
          disabled={phase === "recording"}
          onClick={() => void startPreview("screen")}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 disabled:opacity-40"
        >
          <Monitor className="h-3.5 w-3.5" />
          Screen
        </button>
        <button
          type="button"
          disabled={phase === "recording"}
          onClick={() => void startPreview("camera")}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 disabled:opacity-40"
        >
          <Camera className="h-3.5 w-3.5" />
          Camera
        </button>
        <span className="hidden h-6 w-px bg-white/10 sm:block" />
        <button
          type="button"
          disabled={phase === "idle"}
          onClick={() => {
            setCropOn((v) => !v);
            if (cropOn) setCrop(null);
          }}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs ${
            cropOn ? "bg-emerald-600 text-white" : "text-zinc-300 hover:bg-white/10"
          } disabled:opacity-40`}
        >
          <Crop className="h-3.5 w-3.5" />
          Crop
        </button>
        <button
          type="button"
          disabled={phase === "idle"}
          onClick={takeScreenshot}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 disabled:opacity-40"
        >
          <Image className="h-3.5 w-3.5" />
          Shot
        </button>
        {phase !== "recording" ? (
          <button
            type="button"
            disabled={phase !== "live"}
            onClick={startRecording}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-40"
          >
            <Circle className="h-3 w-3 fill-current" />
            Record
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-900"
          >
            <Square className="h-3 w-3 fill-current" />
            Stop
          </button>
        )}
        {phase !== "idle" && phase !== "recording" && (
          <button
            type="button"
            onClick={() => {
              stopStream();
              setPhase("idle");
              setCrop(null);
            }}
            className="rounded-xl px-3 py-2 text-xs text-zinc-500 hover:text-white"
          >
            End
          </button>
        )}
      </div>

      <p className="text-[11px] text-zinc-600">
        Chrome / Edge recommended. Screen share stops if you close the shared tab. Crop applies to
        recording and screenshots. Audio included when the browser allows it.
      </p>
    </div>
  );
}
