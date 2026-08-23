"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Link from "next/link";
import { VideoRecorderLab } from "@/components/VideoRecorderLab";
import { EmailManagerLab } from "@/components/EmailManagerLab";
import {
  Check,
  Copy,
  Download,
  HardDrive,
  Link2,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { buildSimpleDocx } from "@/lib/resume-ats";
import { trackToolUse } from "@/lib/self-learn";
import {
  AtsResumeScanner,
  LatexResumeBuilder,
  MessagingAutomationLab,
  RobotsTxtBuilder,
  SitemapFinder,
  SitemapUrlExtractor,
  SitemapValidator,
} from "@/components/TrafficTools";
import { MultiClockLab } from "@/components/MultiClockLab";
import { AdvancedCalculator } from "@/components/AdvancedCalculator";
import { ToolRequestForm } from "@/components/BuildYourOwnTool";
import { AiAppMaker } from "@/components/AiAppMaker";
import { CalendarGenerator, DailyLifePlanner } from "@/components/LifePlannerTools";
import {
  DnsLookupLab,
  MyIpLab,
  PingTestLab,
  SpeedTestLab,
} from "@/components/NetworkTools";
import {
  AiSummarizerLab,
  AudioTranscribeLab,
  LocalAiDirectoryLab,
  LocalAiHardwareAdvisor,
  MeetingNotesLab,
  YoutubeCaptionsLab,
  YoutubeScriptLab,
  ShortsFromUrlLab,
} from "@/components/AiToolLabs";
import {
  CaseConverterLab,
  JsonFormatterLab,
  PercentageLab,
  PositionSizeLab,
  RiskRewardLab,
  UuidLab,
  WordCounterLab,
  PasswordLab,
  RegexLab,
} from "@/components/DomainToolLabs";
import {
  DcaLab,
  KellyLab,
  LeverageLiqLab,
  PipLab,
  TradePnlLab,
} from "@/components/TradingCalcLabs";
import {
  Base64Lab,
  ContrastLab,
  HashLab,
  ImageCompressLab,
  LoremLab,
  TextDiffLab,
  TimestampLab,
  UnitLab,
  UrlEncodeLab,
} from "@/components/DemandToolLabs";
import {
  ExcelHubLab,
  PdfToDocLab,
  PdfToImagesLab,
  SlidesDeckLab,
  VideoConverterLab,
} from "@/components/InBrowserToolLabs";
import { SolidPdfLab } from "@/components/SolidPdfLab";
import { SolidCsvLab, SolidImageFormatLab, SolidImageToPdfLab } from "@/components/SolidImageLab";
import { BgRemoverLab } from "@/components/BgRemoverLab";
import { CustomAssistantLab } from "@/components/CustomAssistantLab";
import { GameEngineStudio } from "@/components/GameEngineStudio";
import { FileExportDialog, useFileExport } from "@/components/FileExportDialog";

export type FreeRunnerKind =
  | "image-to-pdf"
  | "image-format"
  | "pdf-merge"
  | "pdf-editor"
  | "pdf-to-images"
  | "pdf-to-doc"
  | "bg-remover"
  | "youtube-downloader"
  | "youtube-to-captions"
  | "youtube-to-script"
  | "shorts-from-url"
  | "video-converter"
  | "doc-converter"
  | "image-to-prompt"
  | "prompt-to-image"
  | "image-to-video"
  | "slides-deck"
  | "excel-hub"
  | "csv-text-tools"
  | "latex-resume"
  | "ats-resume"
  | "message-automation"
  | "email-manager"
  | "video-recorder"
  | "sitemap-finder"
  | "sitemap-validator"
  | "sitemap-urls"
  | "robots-txt"
  | "ping-test"
  | "speed-test"
  | "whats-my-ip"
  | "dns-lookup"
  | "multi-clock"
  | "advanced-calculator"
  | "build-your-tool"
  | "request-tool"
  | "life-planner"
  | "calendar-generator"
  | "local-ai-hardware"
  | "local-ai-directory"
  | "ai-summarizer"
  | "meeting-notes-ai"
  | "audio-transcribe"
  | "position-size"
  | "risk-reward"
  | "word-counter"
  | "case-converter"
  | "json-formatter"
  | "uuid-generator"
  | "percentage-calc"
  | "custom-assistant"
  | "password-generator"
  | "regex-helper"
  | "trade-pnl"
  | "leverage-liq"
  | "dca-calculator"
  | "pip-calculator"
  | "kelly-sizer"
  | "timestamp-converter"
  | "base64-coder"
  | "hash-generator"
  | "url-encoder"
  | "color-contrast"
  | "unit-converter"
  | "image-compress"
  | "lorem-ipsum"
  | "text-diff"
  | "game-engine";

export function FreeToolRunner({ kind, title }: { kind: FreeRunnerKind; title: string }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [filesLabel, setFilesLabel] = useState("");
  const { pending: exportFile, offerFile, close: closeExport } = useFileExport();

  function offerDataUrl(dataUrl: string, name: string) {
    fetch(dataUrl)
      .then((r) => r.blob())
      .then((blob) => offerFile(blob, name))
      .catch(() => {
        downloadDataUrl(dataUrl, name);
      });
  }

  async function track() {
    try {
      trackToolUse(kind, 2);
      await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: kind }),
      });
    } catch {
      /* ignore */
    }
  }

  async function handleImageToPdf(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setBusy(true);
    setFilesLabel(`${list.length} image(s)`);
    setStatus("Building PDF…");
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      let first = true;
      for (const file of list) {
        const dataUrl = await readAsDataURL(file);
        const img = await loadImage(dataUrl);
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const ratio = Math.min(pageW / img.width, pageH / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        if (!first) doc.addPage();
        first = false;
        doc.addImage(dataUrl, "JPEG", (pageW - w) / 2, (pageH - h) / 2, w, h);
      }
      const pdfBlob = doc.output("blob");
      offerFile(pdfBlob, "plethora-images.pdf");
      setStatus("PDF ready — preview / rename / download when you want");
      await track();
    } catch {
      setStatus("Could not convert — try smaller PNG/JPG files.");
    }
    setBusy(false);
  }

  async function handleImageFormat(
    files: FileList | File[],
    format: "image/png" | "image/jpeg" | "image/webp"
  ) {
    const file = Array.from(files)[0];
    if (!file) return;
    setBusy(true);
    setFilesLabel(file.name);
    try {
      const dataUrl = await readAsDataURL(file);
      const img = await loadImage(dataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(img, 0, 0);
      const out = canvas.toDataURL(format, 0.92);
      const ext = format.split("/")[1];
      offerDataUrl(out, `converted.${ext === "jpeg" ? "jpg" : ext}`);
      setStatus(`Ready as ${ext.toUpperCase()} — choose view / download`);
      await track();
    } catch {
      setStatus("Conversion failed.");
    }
    setBusy(false);
  }

  async function handlePdfMerge(files: FileList | File[]) {
    const list = Array.from(files);
    if (!list.length) return;
    setBusy(true);
    setFilesLabel(`${list.length} PDFs`);
    try {
      const merged = await PDFDocument.create();
      for (const file of list) {
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const out = await merged.save();
      offerFile(new Blob([new Uint8Array(out)], { type: "application/pdf" }), "merged.pdf");
      setStatus("Merged PDF ready — preview / download");
      await track();
    } catch {
      setStatus("Merge failed (encrypted PDFs may not work).");
    }
    setBusy(false);
  }

  async function handlePdfEditor(files: FileList | File[], stamp: string, reverse: boolean) {
    const file = Array.from(files)[0];
    if (!file) return;
    setBusy(true);
    setFilesLabel(file.name);
    try {
      const bytes = await file.arrayBuffer();
      let work: PDFDocument;
      if (reverse) {
        work = await PDFDocument.create();
        const src = await PDFDocument.load(bytes);
        const idxs = src.getPageIndices().reverse();
        const copied = await work.copyPages(src, idxs);
        copied.forEach((p) => work.addPage(p));
      } else {
        work = await PDFDocument.load(bytes);
      }
      if (stamp.trim()) {
        const font = await work.embedFont(StandardFonts.Helvetica);
        for (const page of work.getPages()) {
          page.drawText(stamp.slice(0, 80), {
            x: 24,
            y: 24,
            size: 10,
            font,
            color: rgb(0.4, 0.35, 0.7),
          });
        }
      }
      const out = await work.save();
      offerFile(new Blob([new Uint8Array(out)], { type: "application/pdf" }), "edited.pdf");
      setStatus("Edited PDF ready — preview / rename / download");
      await track();
    } catch {
      setStatus("Could not edit this PDF.");
    }
    setBusy(false);
  }

  if (kind === "image-to-pdf") {
    return <SolidImageToPdfLab />;
  }

  if (kind === "image-format") {
    return <SolidImageFormatLab />;
  }

  if (kind === "pdf-merge") {
    return <SolidPdfLab initialTab="merge" />;
  }

  if (kind === "pdf-editor") {
    return <SolidPdfLab initialTab="pages" />;
  }

  if (kind === "youtube-downloader") {
    return <YoutubeDual title={title} track={track} />;
  }
  if (kind === "youtube-to-captions") return <YoutubeCaptionsLab />;
  if (kind === "youtube-to-script") return <YoutubeScriptLab />;
  if (kind === "shorts-from-url") return <ShortsFromUrlLab />;
  if (kind === "pdf-to-images") return <PdfToImagesLab />;
  if (kind === "pdf-to-doc") return <PdfToDocLab />;
  if (kind === "bg-remover") return <BgRemoverLab />;
  if (kind === "video-converter") return <VideoConverterLab />;
  if (kind === "slides-deck") return <SlidesDeckLab />;
  if (kind === "excel-hub") return <ExcelHubLab />;
  if (kind === "local-ai-hardware") return <LocalAiHardwareAdvisor />;

  if (kind === "local-ai-directory") return <LocalAiDirectoryLab />;
  if (kind === "ai-summarizer") return <AiSummarizerLab />;
  if (kind === "meeting-notes-ai") return <MeetingNotesLab />;
  if (kind === "audio-transcribe") return <AudioTranscribeLab />;
  if (kind === "position-size") return <PositionSizeLab />;
  if (kind === "risk-reward") return <RiskRewardLab />;
  if (kind === "word-counter") return <WordCounterLab />;
  if (kind === "case-converter") return <CaseConverterLab />;
  if (kind === "json-formatter") return <JsonFormatterLab />;
  if (kind === "uuid-generator") return <UuidLab />;
  if (kind === "percentage-calc") return <PercentageLab />;
  if (kind === "password-generator") return <PasswordLab />;
  if (kind === "regex-helper") return <RegexLab />;
  if (kind === "trade-pnl") return <TradePnlLab />;
  if (kind === "leverage-liq") return <LeverageLiqLab />;
  if (kind === "dca-calculator") return <DcaLab />;
  if (kind === "pip-calculator") return <PipLab />;
  if (kind === "kelly-sizer") return <KellyLab />;
  if (kind === "timestamp-converter") return <TimestampLab />;
  if (kind === "base64-coder") return <Base64Lab />;
  if (kind === "hash-generator") return <HashLab />;
  if (kind === "url-encoder") return <UrlEncodeLab />;
  if (kind === "color-contrast") return <ContrastLab />;
  if (kind === "unit-converter") return <UnitLab />;
  if (kind === "image-compress") return <ImageCompressLab />;
  if (kind === "lorem-ipsum") return <LoremLab />;
  if (kind === "text-diff") return <TextDiffLab />;

  if (kind === "doc-converter") {
    return (
      <DocTextConverter
        onDone={async () => {
          setStatus("Downloaded");
          await track();
        }}
      />
    );
  }

  if (kind === "csv-text-tools") {
    return (
      <SolidCsvLab
        onDone={() => {
          setStatus("CSV ready");
          void track();
        }}
      />
    );
  }

  if (kind === "latex-resume") return <LatexResumeBuilder />;
  if (kind === "ats-resume") return <AtsResumeScanner />;
  if (kind === "message-automation") return <MessagingAutomationLab />;
  if (kind === "email-manager") return <EmailManagerLab />;
  if (kind === "video-recorder") return <VideoRecorderLab />;
  if (kind === "sitemap-finder") return <SitemapFinder />;
  if (kind === "sitemap-validator") return <SitemapValidator />;
  if (kind === "sitemap-urls") return <SitemapUrlExtractor />;
  if (kind === "robots-txt") return <RobotsTxtBuilder />;
  if (kind === "ping-test") return <PingTestLab />;
  if (kind === "speed-test") return <SpeedTestLab />;
  if (kind === "whats-my-ip") return <MyIpLab />;
  if (kind === "dns-lookup") return <DnsLookupLab />;
  if (kind === "multi-clock") return <MultiClockLab />;
  if (kind === "advanced-calculator") return <AdvancedCalculator />;
  if (kind === "build-your-tool") return <AiAppMaker />;
  if (kind === "request-tool") return <ToolRequestForm />;
  if (kind === "custom-assistant") return <CustomAssistantLab />;
  if (kind === "game-engine") return <GameEngineStudio />;
  if (kind === "life-planner") return <DailyLifePlanner />;
  if (kind === "calendar-generator") return <CalendarGenerator />;

  if (kind === "image-to-prompt" || kind === "prompt-to-image") {
    return <VisualPromptStudio kind={kind} title={title} track={track} />;
  }

  // Visual dual path guides
  return <DualPathGuide kind={kind} title={title} track={track} />;
}

function ImageFormatUi({
  title,
  status,
  busy,
  filesLabel,
  onConvert,
}: {
  title: string;
  status: string;
  busy: boolean;
  filesLabel: string;
  onConvert: (f: FileList | File[], fmt: "image/png" | "image/jpeg" | "image/webp") => void;
}) {
  const [pending, setPending] = useState<File[] | null>(null);
  return (
    <ToolShell title={title} status={status} busy={busy} filesLabel={filesLabel || (pending?.[0]?.name ?? "")}>
      <DropZone
        accept="image/*"
        label={pending ? "Image ready — pick a format" : "Drop an image"}
        hint="Then tap PNG / JPEG / WebP"
        disabled={busy}
        onFiles={(f) => setPending(Array.from(f))}
      />
      <div className="mt-4 grid grid-cols-3 gap-2">
        {([
          ["image/png", "PNG"],
          ["image/jpeg", "JPEG"],
          ["image/webp", "WebP"],
        ] as const).map(([fmt, label]) => (
          <button
            key={fmt}
            type="button"
            disabled={busy || !pending?.length}
            onClick={() => pending && onConvert(pending, fmt)}
            className="rounded-xl bg-violet-600 py-3 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40"
          >
            {label}
          </button>
        ))}
      </div>
    </ToolShell>
  );
}

function PdfEditorUi({
  title,
  status,
  busy,
  filesLabel,
  onRun,
}: {
  title: string;
  status: string;
  busy: boolean;
  filesLabel: string;
  onRun: (f: FileList | File[], stamp: string, reverse: boolean) => void;
}) {
  const [pending, setPending] = useState<File[] | null>(null);
  const [stamp, setStamp] = useState("Plethora");
  const [reverse, setReverse] = useState(false);
  return (
    <ToolShell title={title} status={status} busy={busy} filesLabel={filesLabel || pending?.[0]?.name || ""}>
      <DropZone
        accept="application/pdf"
        label="Drop a PDF to edit"
        hint="Basic: reverse page order + corner stamp. Full editors linked below."
        disabled={busy}
        onFiles={(f) => setPending(Array.from(f))}
      />
      <div className="mt-4 space-y-3">
        <label className="block text-xs text-zinc-500">
          Footer stamp
          <input
            value={stamp}
            onChange={(e) => setStamp(e.target.value)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input type="checkbox" checked={reverse} onChange={(e) => setReverse(e.target.checked)} />
          Reverse page order
        </label>
        <button
          type="button"
          disabled={busy || !pending?.length}
          onClick={() => pending && onRun(pending, stamp, reverse)}
          className="w-full rounded-xl bg-violet-600 py-3 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40"
        >
          Download edited PDF
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { label: "PDF24 tools (web)", href: "https://tools.pdf24.org/en/" },
          { label: "LibreOffice Draw", href: "https://www.libreoffice.org/" },
          { label: "Stirling PDF (self-host)", href: "https://github.com/Stirling-Tools/Stirling-PDF" },
        ].map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:border-violet-500/40 hover:text-violet-200"
          >
            {l.label}
          </a>
        ))}
      </div>
    </ToolShell>
  );
}

function YoutubeDual({ title, track }: { title: string; track: () => Promise<void> }) {
  const [mode, setMode] = useState<"instant" | "local">("instant");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [links, setLinks] = useState<{ label: string; href: string }[]>([]);
  const [copied, setCopied] = useState(false);

  const localCmd = useMemo(() => {
    const u = url.trim() || "PASTE_URL_HERE";
    return `pip install yt-dlp\nyt-dlp "${u}"\n# audio only:\nyt-dlp -x --audio-format mp3 "${u}"`;
  }, [url]);

  async function resolveInstant() {
    setBusy(true);
    setError("");
    setLinks([]);
    try {
      const res = await fetch("/api/youtube-resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Instant resolve failed — switch to Local mode.");
      } else if (!data.links?.length) {
        setError("No links returned. Try Local yt-dlp or open cobalt.tools.");
      } else {
        setLinks(data.links);
        await track();
      }
    } catch {
      setError("Network error. Use Local mode.");
    }
    setBusy(false);
  }

  return (
    <ToolShell title={title} status="" busy={busy} filesLabel="">
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-black/30 p-1">
        <button
          type="button"
          onClick={() => setMode("instant")}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
            mode === "instant" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Zap className="h-4 w-4" /> Instant links
        </button>
        <button
          type="button"
          onClick={() => setMode("local")}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition ${
            mode === "local" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          <HardDrive className="h-4 w-4" /> Local yt-dlp
        </button>
      </div>

      <div className="relative">
        <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube URL here…"
          className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
        />
      </div>

      {mode === "instant" ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-zinc-500">
            Resolves download links via privacy-minded open software (Cobalt). Rate limits apply. Only
            download what you&apos;re allowed to.
          </p>
          <button
            type="button"
            disabled={busy || !url.trim()}
            onClick={() => void resolveInstant()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Get download links
          </button>
          {error && <p className="text-sm text-amber-400/90">{error}</p>}
          {links.length > 0 && (
            <div className="space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 text-sm text-emerald-200 hover:bg-black/50"
                >
                  <Download className="h-4 w-4" /> {l.label}
                </a>
              ))}
            </div>
          )}
          <a
            href="https://cobalt.tools/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-violet-400 hover:underline"
          >
            Or open cobalt.tools in a new tab →
          </a>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-zinc-500">
            Fully offline after install. Best privacy. Install{" "}
            <a
              href="https://github.com/yt-dlp/yt-dlp"
              className="text-emerald-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              yt-dlp
            </a>{" "}
            then run:
          </p>
          <pre className="overflow-x-auto rounded-xl bg-black/50 p-3 text-[11px] leading-relaxed text-zinc-300">
            {localCmd}
          </pre>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(localCmd);
              setCopied(true);
              await track();
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/40 py-3 text-sm text-emerald-200 hover:bg-emerald-500/10"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy commands"}
          </button>
          <Link href="/install" className="block text-center text-xs text-zinc-500 hover:text-violet-300">
            More install paths → Install Hub
          </Link>
        </div>
      )}
    </ToolShell>
  );
}

function VisualPromptStudio({
  kind,
  title,
  track,
}: {
  kind: "image-to-prompt" | "prompt-to-image";
  title: string;
  track: () => Promise<void>;
}) {
  const [notes, setNotes] = useState("");
  const [out, setOut] = useState("");
  const [copied, setCopied] = useState(false);

  function build() {
    if (kind === "image-to-prompt") {
      setOut(
        `You are an expert image reverse-prompt engineer.\n\nDescribe this image (or description) as a single high-quality text-to-image prompt.\nInclude: subject, style, lighting, camera, materials, color grade, mood. End with technical tokens for Midjourney/Flux/SDXL.\n\n---\n${notes || "[describe what you see / paste vision model output]"}\n---\n\nOutput only the prompt.`
      );
    } else {
      setOut(
        `Create a production-ready text-to-image prompt for:\n\n${notes || "[your idea]"}\n\nStructure:\n1) Main subject + action\n2) Environment\n3) Style / artist references (optional)\n4) Lighting + camera\n5) Quality boosters\n\nAlso give a shorter 1-line variant. Target models: Flux, Midjourney v6, SDXL.`
      );
    }
    void track();
  }

  return (
    <ToolShell title={title} status="" busy={false} filesLabel="">
      <p className="mb-3 text-xs text-zinc-500">
        Best models:{" "}
        {kind === "image-to-prompt"
          ? "Claude Sonnet vision · GPT-4o · Gemini Flash"
          : "Flux · Midjourney · SDXL (local ComfyUI free)"}
      </p>
      {kind === "image-to-prompt" && (
        <DropZone
          accept="image/*"
          label="Optional: drop image for your own notes"
          hint="We don’t upload — use the file name / your description. Paste vision output too."
          onFiles={(f) => {
            const name = Array.from(f)[0]?.name;
            if (name) setNotes((n) => (n ? `${n}\n` : "") + `Image file: ${name}`);
          }}
        />
      )}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        placeholder={kind === "image-to-prompt" ? "Describe the image or paste notes…" : "Describe the image you want…"}
        className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder:text-zinc-600"
      />
      <button
        type="button"
        onClick={build}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white hover:bg-violet-500"
      >
        <Sparkles className="h-4 w-4" /> Build ready-to-paste prompt
      </button>
      {out && (
        <div className="mt-4">
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-black/50 p-3 text-xs text-zinc-300">
            {out}
          </pre>
          <button
            type="button"
            className="mt-2 flex items-center gap-2 text-xs text-violet-300"
            onClick={async () => {
              await navigator.clipboard.writeText(out);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy for ChatGPT / Claude / local"}
          </button>
        </div>
      )}
    </ToolShell>
  );
}

function DualPathGuide({
  kind,
  title,
  track,
}: {
  kind: FreeRunnerKind;
  title: string;
  track: () => Promise<void>;
}) {
  const cfg = GUIDE[kind];
  if (!cfg) return null;
  return (
    <ToolShell title={title} status="" busy={false} filesLabel="">
      <div className="grid gap-3 sm:grid-cols-2">
        {cfg.paths.map((p) => (
          <div
            key={p.title}
            className={`rounded-2xl border p-4 ${
              p.tone === "instant"
                ? "border-violet-500/30 bg-violet-500/5"
                : "border-emerald-500/30 bg-emerald-500/5"
            }`}
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              {p.tone === "instant" ? (
                <Zap className="h-4 w-4 text-violet-400" />
              ) : (
                <HardDrive className="h-4 w-4 text-emerald-400" />
              )}
              {p.title}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">{p.blurb}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  onClick={() => void track()}
                  className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300 hover:border-violet-500/40"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      {cfg.tip && <p className="mt-4 text-xs text-zinc-600">{cfg.tip}</p>}
    </ToolShell>
  );
}

const GUIDE: Partial<
  Record<
    FreeRunnerKind,
    {
      tip?: string;
      paths: {
        title: string;
        tone: "instant" | "local";
        blurb: string;
        links: { label: string; href: string }[];
      }[];
    }
  >
> = {
  "pdf-to-images": {
    tip: "Need one-click later? Self-host Stirling PDF or poppler.",
    paths: [
      {
        title: "On the spot",
        tone: "instant",
        blurb: "Open free web tools that export pages. Prefer services you trust with non-sensitive PDFs.",
        links: [
          { label: "PDF24 → Image", href: "https://tools.pdf24.org/en/pdf-to-images" },
          { label: "ILovePDF free", href: "https://www.ilovepdf.com/pdf_to_jpg" },
        ],
      },
      {
        title: "Local / private",
        tone: "local",
        blurb: "pdftoppm (poppler) or LibreOffice. Install Hub has hardcore paths.",
        links: [
          { label: "Poppler Windows", href: "https://github.com/oschwartz10612/poppler-windows" },
          { label: "Install Hub", href: "/install" },
        ],
      },
    ],
  },
  "pdf-to-doc": {
    paths: [
      {
        title: "On the spot",
        tone: "instant",
        blurb: "Google Docs: upload PDF → Open with Docs → Download DOCX.",
        links: [
          { label: "Google Docs", href: "https://docs.google.com" },
          { label: "Adobe free web", href: "https://www.adobe.com/acrobat/online/pdf-to-word.html" },
        ],
      },
      {
        title: "Local",
        tone: "local",
        blurb: "LibreOffice Draw/Writer for offline export.",
        links: [
          { label: "LibreOffice", href: "https://www.libreoffice.org/download/download/" },
          { label: "Prompt polish", href: "/prompt-assistant" },
        ],
      },
    ],
  },
  "bg-remover": {
    paths: [
      {
        title: "On the spot",
        tone: "instant",
        blurb: "Upload in browser, download transparent PNG.",
        links: [
          { label: "remove.bg", href: "https://www.remove.bg" },
          { label: "Adobe Express", href: "https://www.adobe.com/express/feature/image/remove-background" },
        ],
      },
      {
        title: "Local GPU",
        tone: "local",
        blurb: "rembg or ComfyUI nodes — free unlimited offline.",
        links: [
          { label: "rembg GitHub", href: "https://github.com/danielgatis/rembg" },
          { label: "Install Hub", href: "/install" },
        ],
      },
    ],
  },
  "video-converter": {
    paths: [
      {
        title: "Simple GUI",
        tone: "instant",
        blurb: "HandBrake for presets without memorizing flags.",
        links: [{ label: "HandBrake", href: "https://handbrake.fr/" }],
      },
      {
        title: "Power local",
        tone: "local",
        blurb: "ffmpeg -i in.mkv -c:v libx264 -c:a aac out.mp4",
        links: [
          { label: "FFmpeg", href: "https://ffmpeg.org/download.html" },
          { label: "Install Hub", href: "/install" },
        ],
      },
    ],
  },
  "image-to-video": {
    tip: "Free path: Open Higgsfield FOSS studio or local Wan/LTX/Hunyuan via Comfy. Paid path: Runway/Kling/official Higgsfield credits.",
    paths: [
      {
        title: "Free · Open Higgsfield",
        tone: "instant",
        blurb:
          "FOSS Higgsfield-style Video/Cinema/Lip-sync studio (200+ models). Self-host or free hosted variant — not the paid Higgsfield app.",
        links: [
          {
            label: "Open Higgsfield AI (GitHub)",
            href: "https://github.com/zilogo/open-higgsfield-ai",
          },
          {
            label: "Install Hub → video",
            href: "/install",
          },
        ],
      },
      {
        title: "On the spot (credits)",
        tone: "instant",
        blurb: "Web apps when you need speed and accept paid tiers.",
        links: [
          { label: "Higgsfield (product)", href: "https://higgsfield.ai" },
          { label: "Higgsfield CLI", href: "https://github.com/higgsfield-ai/cli" },
          { label: "Luma Dream Machine", href: "https://lumalabs.ai/dream-machine" },
          { label: "Kling AI", href: "https://klingai.com/" },
          { label: "Runway", href: "https://runwayml.com/" },
        ],
      },
      {
        title: "Local GPU (fully free after setup)",
        tone: "local",
        blurb: "Wan / LTX / Hunyuan / CogVideo / Mochi — or ComfyUI nodes. Free weights, your VRAM.",
        links: [
          { label: "Wan 2.1", href: "https://github.com/Wan-Video/Wan2.1" },
          { label: "LTX-Video", href: "https://github.com/Lightricks/LTX-Video" },
          { label: "HunyuanVideo", href: "https://github.com/Tencent-Hunyuan/HunyuanVideo" },
          { label: "ComfyUI", href: "https://github.com/comfyanonymous/ComfyUI" },
          { label: "Install Hub", href: "/install" },
        ],
      },
    ],
  },
  "slides-deck": {
    tip: "Best FOSS path: write outline in Chat, then Marp → PDF/PPTX.",
    paths: [
      {
        title: "On the spot",
        tone: "instant",
        blurb: "Gamma & Google Slides AI for zero-install decks. Great when speed > privacy.",
        links: [
          { label: "Gamma.app", href: "https://gamma.app" },
          { label: "Google Slides", href: "https://slides.google.com" },
          { label: "Pitch", href: "https://pitch.com" },
        ],
      },
      {
        title: "Local / FOSS",
        tone: "local",
        blurb: "Marp (Markdown slides) or reveal.js — versionable, free, offline once installed.",
        links: [
          { label: "Marp", href: "https://github.com/marp-team/marp" },
          { label: "reveal.js", href: "https://github.com/hakimel/reveal.js" },
          { label: "LibreOffice Impress", href: "https://www.libreoffice.org/" },
        ],
      },
    ],
  },
  "excel-hub": {
    tip: "For formulas: generate in Prompt Studio tools, paste into Sheets/Excel.",
    paths: [
      {
        title: "On the spot",
        tone: "instant",
        blurb: "Google Sheets + AI formulas in browser. Fast collaboration.",
        links: [
          { label: "Google Sheets", href: "https://sheets.google.com" },
          { label: "Microsoft Excel web", href: "https://www.microsoft.com/microsoft-365/excel" },
          { label: "Formula helper tool", href: "/tools/excel-formulas" },
        ],
      },
      {
        title: "Local / FOSS",
        tone: "local",
        blurb: "LibreOffice Calc offline. SheetJS / ExcelJS for developers, pandas for bulk jobs.",
        links: [
          { label: "LibreOffice Calc", href: "https://www.libreoffice.org/" },
          { label: "SheetJS community", href: "https://github.com/SheetJS/sheetjs" },
          { label: "pandas", href: "https://github.com/pandas-dev/pandas" },
        ],
      },
    ],
  },
};

function DocTextConverter({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4">
        <p className="mb-2 text-center text-sm text-zinc-400">Paste text · download as file</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white"
          placeholder="Paste anything…"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          className="rounded-xl bg-violet-600 py-3 text-sm text-white"
          onClick={() => {
            downloadBlob(new Blob([text], { type: "text/plain" }), "notes.txt");
            onDone();
          }}
        >
          .txt
        </button>
        <button
          type="button"
          className="rounded-xl border border-white/10 py-3 text-sm text-zinc-300"
          onClick={() => {
            downloadBlob(new Blob([text], { type: "text/markdown" }), "notes.md");
            onDone();
          }}
        >
          .md
        </button>
        <button
          type="button"
          className="rounded-xl border border-white/10 py-3 text-sm text-zinc-300"
          onClick={() => {
            downloadBlob(
              buildSimpleDocx(text.split(/\n/)),
              "notes.docx"
            );
            onDone();
          }}
        >
          Word
        </button>
      </div>
    </div>
  );
}

function CsvCleanup({ onDone }: { onDone: () => void }) {
  const [raw, setRaw] = useState("");
  const [out, setOut] = useState("");

  function clean() {
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const uniq: string[] = [];
    for (const l of lines) {
      const key = l.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(l);
    }
    setOut(uniq.join("\n"));
    onDone();
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Paste CSV / TSV rows. We’ll trim blanks + drop exact-duplicate lines in the browser.
      </p>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={7}
        placeholder={"name,email\nAda,ada@x.com\nAda,ada@x.com"}
        className="w-full rounded-2xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-white"
      />
      <button
        type="button"
        onClick={clean}
        className="w-full rounded-xl bg-violet-600 py-3 text-sm font-medium text-white hover:bg-violet-500"
      >
        Clean table
      </button>
      {out && (
        <>
          <pre className="max-h-40 overflow-auto rounded-xl bg-black/50 p-3 font-mono text-xs text-zinc-300">
            {out}
          </pre>
          <button
            type="button"
            className="rounded-xl border border-emerald-500/40 px-4 py-2 text-sm text-emerald-200"
            onClick={() => downloadBlob(new Blob([out], { type: "text/csv" }), "cleaned.csv")}
          >
            Download cleaned.csv
          </button>
        </>
      )}
    </div>
  );
}

function ToolShell({
  title,
  children,
  status,
  busy,
  filesLabel,
  exportPending = null,
  onExportClose,
}: {
  title: string;
  children: React.ReactNode;
  status: string;
  busy: boolean;
  filesLabel: string;
  exportPending?: import("@/components/FileExportDialog").PendingFile | null;
  onExportClose?: () => void;
}) {
  return (
    <div>
      {exportPending != null && onExportClose ? (
        <FileExportDialog pending={exportPending} onClose={onExportClose} />
      ) : null}
      <h2 className="sr-only">{title}</h2>
      {filesLabel && (
        <p className="mb-2 text-xs text-zinc-500">
          Selected: <span className="text-zinc-300">{filesLabel}</span>
        </p>
      )}
      {children}
      {busy && (
        <p className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Working on your device…
        </p>
      )}
      {status && (
        <p className="mt-3 flex items-center gap-2 text-sm text-emerald-400/90">
          <Download className="h-4 w-4" /> {status}
        </p>
      )}
      <p className="mt-6 text-center text-xs text-zinc-600">
        Done?{" "}
        <Link href="/chat" className="text-violet-400 hover:underline">
          Chat with Plethora
        </Link>{" "}
        ·{" "}
        <Link href="/prompt-assistant" className="text-violet-400 hover:underline">
          Prompt Assistant
        </Link>
      </p>
    </div>
  );
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function downloadDataUrl(dataUrl: string, name: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  a.click();
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
