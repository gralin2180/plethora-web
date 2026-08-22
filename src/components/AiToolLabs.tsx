"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Copy,
  Check,
  Captions,
  ExternalLink,
  Loader2,
  Mic,
  FileStack,
  Sparkles,
} from "lucide-react";
import {
  LOCAL_AI_CATALOG,
  costBadgeClass,
  type LocalAiEntry,
} from "@/lib/local-ai-catalog";
import { trackToolUse } from "@/lib/self-learn";
import { runPlatformAi } from "@/lib/platform-ai-client";

async function usage(toolId: string) {
  try {
    trackToolUse(toolId, 2);
    await fetch("/api/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId }),
    });
  } catch {
    /* ignore */
  }
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

function CopyBtn({ text, id }: { text: string; id: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1200);
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-zinc-400 hover:text-white"
    >
      {ok ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {ok ? "Copied" : "Copy"}
      <span className="sr-only">{id}</span>
    </button>
  );
}

/* ——— YouTube captions ——— */

function extractVideoId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && id.length === 11 ? id : null;
    }
    const v = u.searchParams.get("v");
    if (v && v.length === 11) return v;
    const m = u.pathname.match(/\/(shorts|embed|live)\/([\w-]{11})/);
    if (m?.[2]) return m[2];
  } catch {
    /* ignore */
  }
  return null;
}

function srtFromCues(
  cues: { start: number; duration: number; text: string }[]
): string {
  return cues
    .map((c, i) => {
      const end = c.start + (c.duration || 2);
      return `${i + 1}\n${fmtTs(c.start)} --> ${fmtTs(end)}\n${c.text.trim()}\n`;
    })
    .join("\n");
}

function fmtTs(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

export function YoutubeCaptionsLab() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [plain, setPlain] = useState("");
  const [srt, setSrt] = useState("");
  const [meta, setMeta] = useState("");
  const [lang, setLang] = useState("en");

  const videoId = extractVideoId(url);
  const ytdlpSubs = videoId
    ? `yt-dlp --write-auto-sub --sub-lang ${lang},en --skip-download --convert-subs srt "https://www.youtube.com/watch?v=${videoId}"`
    : `yt-dlp --write-auto-sub --sub-lang en --skip-download --convert-subs srt "YOUR_URL"`;
  const whisperCmd = videoId
    ? `# 1) Get audio only\nyt-dlp -x --audio-format mp3 -o "audio.%(ext)s" "https://www.youtube.com/watch?v=${videoId}"\n# 2) Transcribe with GPU (faster-whisper CLI or Python)\nwhisper audio.mp3 --model medium --device cuda --output_format srt`
    : "whisper your-audio.mp3 --model medium --device cuda --output_format srt";

  async function fetchCaptions() {
    if (!videoId) {
      setError("Paste a valid YouTube URL or 11-character video id.");
      return;
    }
    setBusy(true);
    setError("");
    setPlain("");
    setSrt("");
    try {
      const res = await fetch("/api/youtube-captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not fetch captions");
      setPlain(data.plain || "");
      setSrt(
        data.srt ||
          (data.cues?.length ? srtFromCues(data.cues) : "") ||
          data.plain ||
          ""
      );
      setMeta(
        [
          data.title && `Title: ${data.title}`,
          data.language && `Language: ${data.language}`,
          data.source && `Source: ${data.source}`,
          data.note,
        ]
          .filter(Boolean)
          .join(" · ")
      );
      await usage("youtube-to-captions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  function download(name: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <Shell
      title="YouTube → captions"
      blurb="Fetch public captions when available. If the video has none, use free local GPU paths (yt-dlp + Whisper) below — commonly requested on Reddit & X for Shorts and accessibility."
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
        />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
        >
          {["en", "hi", "es", "fr", "de", "pt", "ja", "ko", "zh-Hans", "ar"].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={() => void fetchCaptions()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Captions className="h-4 w-4" />}
          Get captions
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {meta && <p className="text-xs text-zinc-500">{meta}</p>}

      {plain && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <CopyBtn text={plain} id="plain" />
            <button
              type="button"
              onClick={() => download("captions.txt", plain)}
              className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-zinc-400 hover:text-white"
            >
              Download .txt
            </button>
            {srt && (
              <button
                type="button"
                onClick={() => download("captions.srt", srt)}
                className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-zinc-400 hover:text-white"
              >
                Download .srt
              </button>
            )}
          </div>
          <pre className="max-h-80 overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap">
            {plain}
          </pre>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
          <p className="text-sm font-medium text-white">Local free · yt-dlp auto-subs</p>
          <p className="mt-1 text-xs text-zinc-500">
            Free. No GPU required for existing auto captions.
          </p>
          <pre className="mt-3 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] text-zinc-300">
            {ytdlpSubs}
          </pre>
          <div className="mt-2">
            <CopyBtn text={ytdlpSubs} id="ytdlp" />
          </div>
        </div>
        <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-4">
          <p className="text-sm font-medium text-white">Local free · Whisper on GPU</p>
          <p className="mt-1 text-xs text-zinc-500">
            Free & open-source. Uses GPU when available — best when no captions exist.
          </p>
          <pre className="mt-3 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] text-zinc-300">
            {whisperCmd}
          </pre>
          <div className="mt-2 flex flex-wrap gap-2">
            <CopyBtn text={whisperCmd} id="whisper" />
            <a
              href="https://github.com/SYSTRAN/faster-whisper"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-violet-300 hover:underline"
            >
              faster-whisper <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ——— Directory ——— */

export function LocalAiDirectoryLab() {
  const [filter, setFilter] = useState<"all" | "local" | "cloud" | "free">("all");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    let items = LOCAL_AI_CATALOG;
    if (filter === "local")
      items = items.filter((e) => e.kind !== "cloud_app" && e.kind !== "model_host");
    if (filter === "cloud")
      items = items.filter((e) => e.kind === "cloud_app" || e.kind === "model_host");
    if (filter === "free")
      items = items.filter((e) =>
        ["free", "free_oss", "hardware", "paid_optional", "freemium"].includes(e.cost)
      );
    if (q.trim()) {
      const qq = q.toLowerCase();
      items = items.filter((e) =>
        `${e.name} ${e.blurb} ${e.tags.join(" ")} ${e.costLabel}`.toLowerCase().includes(qq)
      );
    }
    return items;
  }, [filter, q]);

  return (
    <Shell
      title="Local & AI apps directory"
      blurb="What people install for GPU-local AI vs what stays cloud/paid. OpenClaw and Odysseus sit here next to Ollama, Claude, and ChatGPT — with cost and GPU notes."
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search OpenClaw, Odysseus, Claude…"
          className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["local", "Local / self-host"],
              ["cloud", "Cloud"],
              ["free", "Free-first"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setFilter(id);
                void usage("local-ai-directory");
              }}
              className={`rounded-full px-3 py-1.5 text-xs ${
                filter === id
                  ? "bg-violet-600 text-white"
                  : "border border-white/10 text-zinc-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {list.map((e) => (
          <CatalogCard key={e.id} entry={e} />
        ))}
      </div>
    </Shell>
  );
}

function CatalogCard({ entry }: { entry: LocalAiEntry }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-white">{entry.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">{entry.blurb}</p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${costBadgeClass(entry.cost)}`}
        >
          {entry.costLabel}
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-zinc-500">
        <span className="text-zinc-400">GPU: </span>
        {entry.gpu}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={entry.installUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-violet-300 hover:border-violet-500/40"
        >
          Install / site <ExternalLink className="h-3 w-3" />
        </a>
        {entry.docsUrl && entry.docsUrl !== entry.installUrl && (
          <a
            href={entry.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 hover:text-white"
          >
            Docs
          </a>
        )}
        {entry.defaultBaseUrl && (
          <span className="rounded-lg border border-white/5 px-2.5 py-1 font-mono text-[10px] text-zinc-500">
            {entry.defaultBaseUrl}
          </span>
        )}
      </div>
    </div>
  );
}

/* ——— Hardware advisor ——— */

type UseCase =
  | "chat"
  | "coding"
  | "writing"
  | "agents"
  | "image"
  | "captions"
  | "privacy"
  | "research";

export function LocalAiHardwareAdvisor() {
  const [vram, setVram] = useState(8);
  const [ram, setRam] = useState(16);
  const [useCases, setUseCases] = useState<UseCase[]>(["chat", "privacy"]);
  const [os, setOs] = useState<"windows" | "mac" | "linux">("windows");
  const [budget, setBudget] = useState<"free_only" | "ok_paid">("free_only");

  function toggle(u: UseCase) {
    setUseCases((prev) =>
      prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]
    );
  }

  const result = useMemo(() => {
    const reasons: string[] = [];
    const picks: { entry: LocalAiEntry; score: number; why: string }[] = [];

    const wantAgents = useCases.includes("agents") || useCases.includes("research");
    const wantImage = useCases.includes("image");
    const wantCaptions = useCases.includes("captions");
    const wantCode = useCases.includes("coding");
    const wantPrivacy = useCases.includes("privacy");

    for (const entry of LOCAL_AI_CATALOG) {
      if (budget === "free_only" && entry.cost === "paid") continue;

      let score = 0;
      const why: string[] = [];

      const minV = entry.minVramGb ?? 0;
      if (entry.kind !== "cloud_app" && entry.kind !== "model_host") {
        if (vram < minV) {
          score -= 5;
          why.push(`Needs ~${minV}GB+ VRAM ideally`);
        } else {
          score += 2;
        }
      }

      if (wantPrivacy && (entry.kind === "runtime" || entry.kind === "workspace" || entry.kind === "gateway")) {
        score += 3;
        why.push("Keeps option fully local");
      }

      for (const uc of useCases) {
        if (entry.preferredUse.includes(uc)) {
          score += 3;
          why.push(`Strong for ${uc}`);
        }
      }

      // Hardware banding tips
      if (entry.id === "ollama" && vram >= 4) {
        score += 4;
        why.push("Best beginner local runtime");
      }
      if (entry.id === "lm-studio" && vram >= 6) score += 2;
      if (entry.id === "openclaw" && wantAgents) {
        score += 5;
        why.push("Gateway for messaging + tools");
      }
      if (entry.id === "odysseus" && (wantAgents || wantResearch(useCases))) {
        score += 5;
        why.push("Full local workspace (PewDiePie OSS)");
      }
      if (entry.id === "claude-web" && !wantPrivacy && (wantCode || useCases.includes("writing"))) {
        score += 3;
        why.push("Strong cloud writing/coding");
      }
      if (entry.id === "vllm" && vram >= 16) score += 3;
      if (entry.id === "vllm" && vram < 16) score -= 4;
      if (entry.id === "comfyui" && wantImage && vram >= 6) score += 5;
      if (entry.id === "whisper" && wantCaptions) score += 5;
      if (entry.id === "continue-dev" && wantCode) score += 3;
      if (entry.cost === "free_oss" || entry.cost === "free") score += 1;
      if (budget === "ok_paid" && entry.cost === "paid" && wantCode) score += 1;
      if (os === "mac" && entry.id === "ollama") score += 1;

      if (score > 0) picks.push({ entry, score, why: why.slice(0, 3).join(" · ") });
    }

    picks.sort((a, b) => b.score - a.score);

    if (vram < 4) {
      reasons.push(
        "Low VRAM: prefer tiny models (1–3B) on CPU/GPU, or cloud freemium (Claude / Gemini free tiers)."
      );
    } else if (vram < 8) {
      reasons.push("Around 4–7GB VRAM: 7B Q4 models via Ollama/LM Studio work well.");
    } else if (vram < 16) {
      reasons.push("8–15GB VRAM: 7B–14B local chat, image gen on tighter settings, OpenClaw + Ollama stack.");
    } else {
      reasons.push("16GB+ VRAM: comfortable 32B-class or larger local models, multi-agent stacks, vLLM experiments.");
    }
    if (ram < 16) reasons.push("Under 16GB system RAM may thrash with large contexts — keep chats short.");
    if (wantAgents)
      reasons.push("Agents need a workspace/gateway (Odysseus or OpenClaw) plus a model runtime.");

    return { picks: picks.slice(0, 8), reasons, modelHint: modelSizeHint(vram) };
  }, [vram, ram, useCases, os, budget]);

  return (
    <Shell
      title="Local AI hardware advisor"
      blurb="Local AI runs on your GPU (or slowly on CPU). Tell us your VRAM and goals — we map free vs paid options including OpenClaw, Odysseus, Ollama, and Claude."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-zinc-400">
          GPU VRAM (GB)
          <input
            type="number"
            min={0}
            max={128}
            value={vram}
            onChange={(e) => setVram(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white"
          />
        </label>
        <label className="block text-sm text-zinc-400">
          System RAM (GB)
          <input
            type="number"
            min={4}
            max={256}
            value={ram}
            onChange={(e) => setRam(Number(e.target.value) || 8)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white"
          />
        </label>
        <label className="block text-sm text-zinc-400">
          OS
          <select
            value={os}
            onChange={(e) => setOs(e.target.value as typeof os)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white"
          >
            <option value="windows">Windows</option>
            <option value="mac">macOS</option>
            <option value="linux">Linux</option>
          </select>
        </label>
        <label className="block text-sm text-zinc-400">
          Budget
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value as typeof budget)}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-white"
          >
            <option value="free_only">Free software only (optional free cloud tiers)</option>
            <option value="ok_paid">OK with paid APIs / Pro plans</option>
          </select>
        </label>
      </div>

      <div>
        <p className="text-sm text-zinc-400">What do you want to do?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              ["chat", "Chat"],
              ["coding", "Coding"],
              ["writing", "Writing"],
              ["agents", "Agents / automation"],
              ["research", "Research"],
              ["image", "Image gen"],
              ["captions", "Captions / STT"],
              ["privacy", "Stay private"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={`rounded-full px-3 py-1.5 text-xs ${
                useCases.includes(id)
                  ? "bg-violet-600 text-white"
                  : "border border-white/10 text-zinc-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void usage("local-ai-hardware")}
        className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
      >
        Save run & show picks
      </button>

      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <p className="text-sm font-medium text-white">Model size hint for your GPU</p>
        <p className="mt-1 text-sm text-zinc-300">{result.modelHint}</p>
        <ul className="mt-3 space-y-1 text-xs text-zinc-500">
          {result.reasons.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        {result.picks.map(({ entry, why }, i) => (
          <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-white">
                <span className="mr-2 text-zinc-600">#{i + 1}</span>
                {entry.name}
              </p>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] ${costBadgeClass(entry.cost)}`}
              >
                {entry.costLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-400">{entry.blurb}</p>
            {why && <p className="mt-2 text-xs text-violet-200/80">{why}</p>}
            <p className="mt-2 text-xs text-zinc-500">GPU: {entry.gpu}</p>
            <a
              href={entry.installUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs text-violet-300 hover:underline"
            >
              Open site <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-600">
        Prefer to pick a backend profile for Plethora?{" "}
        <a href="/settings/backends" className="text-violet-400 hover:underline">
          Local AI backends
        </a>
      </p>
    </Shell>
  );
}

function wantResearch(u: UseCase[]) {
  return u.includes("research");
}

function modelSizeHint(vram: number): string {
  if (vram <= 0) return "No discrete GPU listed — use cloud freemium or very small CPU models (1–3B).";
  if (vram < 4) return "Tiny models only (1–3B Q4). Consider Gemini/Claude free tiers for quality.";
  if (vram < 8) return "Aim for 7B class Q4/Q5 (e.g. llama3.1:8b, mistral:7b, qwen2.5:7b).";
  if (vram < 12) return "Comfortable 7B–13B Q4/Q5; light image models if carefully configured.";
  if (vram < 16) return "14B–20B Q4 or quality 7–8B full precision chat.";
  if (vram < 24) return "32B Q4 is realistic; SDXL / video at modest settings.";
  return "24GB+: 70B Q3/Q4 or smaller models at very high quality; serious agent stacks.";
}

/* ——— Summarizer ——— */

export function AiSummarizerLab() {
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  const [style, setStyle] = useState<"brief" | "bullets" | "detailed">("bullets");

  function summarizeLocal() {
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned) return;
    const sentences = cleaned
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);
    const scored = sentences.map((s, i) => {
      const words = s.toLowerCase().split(/\W+/).filter(Boolean);
      const score =
        words.length +
        (i === 0 ? 4 : 0) +
        (/\d|%|\$|important|key|result|because|however/i.test(s) ? 3 : 0);
      return { s, score, i };
    });
    scored.sort((a, b) => b.score - a.score);
    const n = style === "brief" ? 3 : style === "bullets" ? 6 : 10;
    const top = scored
      .slice(0, Math.min(n, scored.length))
      .sort((a, b) => a.i - b.i)
      .map((x) => x.s);

    let result: string;
    if (style === "brief") {
      result = top.join(" ");
    } else if (style === "bullets") {
      result = top.map((s) => `• ${s}`).join("\n");
    } else {
      result = [
        "Overview",
        top.slice(0, 2).join(" "),
        "",
        "Key points",
        ...top.map((s) => `• ${s}`),
        "",
        `(~${cleaned.split(/\s+/).length} words reduced to ${top.length} sentences)`,
      ].join("\n");
    }
    setOut(result);
    void usage("ai-summarizer");
  }

  const cloudPrompt = `Summarize the following for a busy professional.
Style: ${style}.
Keep facts accurate. Flag uncertainty.
---
${text.slice(0, 12000)}`;

  return (
    <Shell
      title="AI text summarizer"
      blurb="Instant extractive summary in your browser, or copy a strong prompt for Claude / ChatGPT / local Ollama — top request on Reddit for long articles & PDFs."
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="Paste article, email thread, or notes…"
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
      />
      <div className="flex flex-wrap gap-2">
        {(["brief", "bullets", "detailed"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStyle(s)}
            className={`rounded-full px-3 py-1.5 text-xs capitalize ${
              style === s ? "bg-violet-600 text-white" : "border border-white/10 text-zinc-400"
            }`}
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          onClick={summarizeLocal}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500"
        >
          <FileStack className="h-4 w-4" /> Summarize now
        </button>
      </div>
      {out && (
        <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-200">
          {out}
        </pre>
      )}
      {text.trim() && (
        <div className="rounded-xl border border-white/10 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">Cloud / local model prompt</p>
            <CopyBtn text={cloudPrompt} id="sum" />
          </div>
          <p className="mt-2 line-clamp-4 font-mono text-[11px] text-zinc-500">{cloudPrompt}</p>
        </div>
      )}
    </Shell>
  );
}

/* ——— Meeting notes ——— */

export function MeetingNotesLab() {
  const [text, setText] = useState("");
  const [out, setOut] = useState("");

  function run() {
    const lines = text
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const decisions = lines.filter((l) =>
      /decid|agree|will go with|final|approved/i.test(l)
    );
    const actions = lines.filter((l) =>
      /action|todo|follow.?up|assign|owner|by friday|next week|please/i.test(l)
    );
    const questions = lines.filter((l) => l.includes("?") || /open question|tbd|unclear/i.test(l));

    const bullets = (arr: string[], fallback: string) =>
      arr.length ? arr.slice(0, 12).map((a) => `• ${a}`).join("\n") : `• ${fallback}`;

    setOut(
      [
        "## Meeting notes",
        "",
        "### Summary",
        lines.slice(0, 3).join(" ") || "(paste a longer transcript)",
        "",
        "### Decisions",
        bullets(decisions, "No clear decisions detected — review transcript."),
        "",
        "### Action items",
        bullets(actions, "No action verbs found — mark owners manually."),
        "",
        "### Open questions",
        bullets(questions, "None flagged."),
        "",
        "### Suggested AI polish prompt",
        "Rewrite these notes into a client-ready recap with owners and due dates.",
      ].join("\n")
    );
    void usage("meeting-notes-ai");
  }

  const prompt = `Turn this meeting transcript into:
1) 5-bullet summary
2) Decisions
3) Action items as Owner — Task — Due
4) Risks / open questions
Keep professional tone.
---
${text.slice(0, 12000)}`;

  return (
    <Shell
      title="Meeting notes from transcript"
      blurb="Structure messy notes or ASR output. Pair with Whisper (audio→text) for a full free local pipeline."
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="Paste transcript or rough notes…"
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
      />
      <button
        type="button"
        onClick={run}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500"
      >
        <Sparkles className="h-4 w-4" /> Structure notes
      </button>
      {out && (
        <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-200">
          {out}
        </pre>
      )}
      {text.trim() && (
        <div className="flex items-center justify-between rounded-xl border border-white/10 p-3">
          <p className="text-xs text-zinc-500">Copy prompt for Claude / Ollama</p>
          <CopyBtn text={prompt} id="meet" />
        </div>
      )}
    </Shell>
  );
}

/* ——— Whisper hub ——— */

export function AudioTranscribeLab() {
  return (
    <Shell
      title="Audio / video → text"
      blurb="Free local transcription with Whisper. GPU optional but much faster for long files — top alternative to paid Otter / Fireflies on Reddit."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            title: "faster-whisper (recommended)",
            cost: "Free · open source",
            body: "pip install faster-whisper\n# GPU\nfrom faster_whisper import WhisperModel\nm = WhisperModel('medium', device='cuda')\nsegs, info = m.transcribe('talk.mp3')\nfor s in segs: print(s.start, s.text)",
            link: "https://github.com/SYSTRAN/faster-whisper",
          },
          {
            title: "whisper.cpp",
            cost: "Free · open source",
            body: "Build whisper.cpp, then:\n./main -m models/ggml-medium.bin -f audio.wav -osrt",
            link: "https://github.com/ggerganov/whisper.cpp",
          },
          {
            title: "OpenAI Whisper CLI",
            cost: "Free · open source",
            body: "pip install -U openai-whisper\nwhisper meeting.mp4 --model medium --device cuda --output_format srt",
            link: "https://github.com/openai/whisper",
          },
          {
            title: "Cloud paid alternatives",
            cost: "Paid / freemium",
            body: "Otter, Fireflies, Descript, Whisper API — convenient, leave your data off-device.",
            link: "https://platform.openai.com/docs/guides/speech-to-text",
          },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-white">{c.title}</p>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                {c.cost}
              </span>
            </div>
            <pre className="mt-3 overflow-auto rounded-lg bg-black/50 p-3 text-[11px] text-zinc-300">
              {c.body}
            </pre>
            <a
              href={c.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => void usage("audio-transcribe")}
              className="mt-3 inline-flex items-center gap-1 text-xs text-violet-300 hover:underline"
            >
              <Mic className="h-3 w-3" /> Open resource
            </a>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function pythonHint(script: string) {
  return `cd web
python pipelines/${script}`;
}

export function YoutubeScriptLab() {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"full" | "summary" | "hooks" | "voiceover">("full");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [plain, setPlain] = useState("");
  const [out, setOut] = useState("");
  const [lang, setLang] = useState("en");
  const videoId = extractVideoId(url);

  async function run() {
    if (!videoId) {
      setError("Need a YouTube watch / Shorts URL (or 11-char id). Other sites: run pipelines/youtube_script.py locally.");
      return;
    }
    setBusy(true);
    setError("");
    setOut("");
    try {
      const res = await fetch("/api/youtube-captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No public captions — use the Python pipeline.");
      const transcript = String(data.plain || "").slice(0, 18000);
      setPlain(transcript);
      const want =
        mode === "full"
          ? "Rewrite as a spoken video script with scene headings, VO, and on-screen text. Keep facts from the source."
          : mode === "summary"
            ? "Write a tight summary: 8 bullets + 1 paragraph overview. No fluff."
            : mode === "hooks"
              ? "Give 8 Shorts/TikTok hooks (max 12 words) plus 3 20-second beat outlines."
              : "Write a 60-second voiceover only, conversational, no stage directions.";
      const ai = await runPlatformAi(
        `${want}\nLanguage: ${lang}.\nSource transcript:\n${transcript}`
      );
      if (!ai.ok) throw new Error(ai.reply || "AI pool busy — copy the transcript and try Chat.");
      setOut(ai.reply);
      await usage("youtube-to-script");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <Shell
      title="YouTube → script"
      blurb="Public captions in the browser, then AI rewrites: full script, summary, hooks, or VO. No captions? Local Python (yt-dlp + Whisper) in web/pipelines."
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
        />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
        >
          {["en", "hi", "es", "fr", "de", "pt", "ja"].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["full", "Full script"],
            ["summary", "Summary"],
            ["hooks", "Shorts hooks"],
            ["voiceover", "60s VO"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`rounded-full px-3 py-1.5 text-xs ${
              mode === id ? "bg-violet-600 text-white" : "border border-white/10 text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => void run()}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Make it
        </button>
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      {out && (
        <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-200">
          {out}
        </pre>
      )}
      {plain && (
        <details className="rounded-xl border border-white/10 p-3 text-sm text-zinc-400">
          <summary className="cursor-pointer text-zinc-300">Source transcript</summary>
          <p className="mt-2 whitespace-pre-wrap text-xs">{plain.slice(0, 4000)}</p>
        </details>
      )}
      <p className="font-mono text-[11px] text-zinc-600">{pythonHint("youtube_script.py URL")}</p>
    </Shell>
  );
}

export function ShortsFromUrlLab() {
  const [url, setUrl] = useState("");
  const [style, setStyle] = useState<"none" | "tiktok" | "karaoke">("tiktok");
  const [len, setLen] = useState("30");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState("");
  const [cutsJson, setCutsJson] = useState("");
  const videoId = extractVideoId(url);

  async function run() {
    setBusy(true);
    setError("");
    setPlan("");
    setCutsJson("");
    try {
      let transcript = "";
      if (videoId) {
        const res = await fetch("/api/youtube-captions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, lang: "en" }),
        });
        const data = await res.json();
        if (res.ok) transcript = String(data.plain || "").slice(0, 16000);
      }
      if (!transcript) {
        transcript = `(No public captions in the browser for this URL.) User link: ${url.trim() || "(empty)"}. Propose clip windows anyway as a template and tell them to run the local Python cutter.`;
      }
      const ai = await runPlatformAi(
        `You plan YouTube Shorts / Reels from a long video.
Target each clip ~${len} seconds. Caption style: ${style}.
Return:
1) A human plan (hooks, why each cut works).
2) A JSON array ONLY in a fenced block named cuts, items: {"start": seconds number, "end": seconds number, "hook": string, "on_screen": string}.
Max 5 clips. start < end. Stay inside typical video length if unknown assume 10 minutes.
Transcript / notes:
${transcript}`
      );
      if (!ai.ok) throw new Error(ai.reply || "AI failed");
      setPlan(ai.reply);
      const m = ai.reply.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (m) setCutsJson(m[1].trim());
      await usage("shorts-from-url");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  const cmd = `python pipelines/shorts_cut.py --url "${url.trim() || "VIDEO_URL"}" --target ${len} --captions ${style}${
    cutsJson ? " --cuts cuts.json" : ""
  }`;

  return (
    <Shell
      title="Shorts from any video URL"
      blurb="This site cannot re-encode YouTube/TikTok into an MP4 on Vercel. It pulls captions when it can, AI-picks the best beats + caption lines, then you run the Python+ffmpeg pipeline locally for a vertical Short with burned captions."
    >
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="YouTube, or any yt-dlp URL…"
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50"
      />
      <div className="flex flex-wrap gap-2">
        {(["15", "30", "60"] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setLen(n)}
            className={`rounded-full px-3 py-1.5 text-xs ${
              len === n ? "bg-cyan-600 text-white" : "border border-white/10 text-zinc-400"
            }`}
          >
            {n}s
          </button>
        ))}
        {(
          [
            ["none", "No burn-in"],
            ["tiktok", "Big captions"],
            ["karaoke", "Word highlight"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setStyle(id)}
            className={`rounded-full px-3 py-1.5 text-xs ${
              style === id ? "bg-violet-600 text-white" : "border border-white/10 text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => void run()}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Pick best parts
        </button>
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      {plan && (
        <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-zinc-200">
          {plan}
        </pre>
      )}
      {cutsJson && (
        <div className="rounded-xl border border-white/10 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">cuts.json</p>
            <CopyBtn text={cutsJson} id="cuts" />
          </div>
          <pre className="mt-2 max-h-40 overflow-auto text-[11px] text-zinc-400">{cutsJson}</pre>
        </div>
      )}
      <pre className="overflow-auto rounded-xl bg-black/50 p-3 text-[11px] text-zinc-300">{cmd}</pre>
    </Shell>
  );
}
