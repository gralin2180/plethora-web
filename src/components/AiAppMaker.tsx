"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Hammer, Send, Sparkles } from "lucide-react";
import { collectChatAuth } from "@/lib/platform-ai-client";
import {
  compileAppSpec,
  extractCompleteHtml,
  fallbackTrackerHtml,
  saveMiniApp,
  takeAppMakerIntake,
  uniqueSlug,
  slugifyAppTitle,
  titleFromBrief,
} from "@/lib/mini-apps";
import { trackToolUse } from "@/lib/self-learn";

const FEATURES = [
  "Task list",
  "Live clock",
  "Reminders + alerts",
  "Focus 15 / 25 / 50",
  "Daily stats",
  "Calendar .ics",
];

const ROUTES: { id: string; label: string; hint: string; quality: number }[] = [
  { id: "auto", label: "Auto pool", hint: "Zen + OpenRouter free rotate", quality: 50 },
  { id: "fast", label: "Faster", hint: "Snappy smaller models", quality: 18 },
  { id: "best", label: "Best free", hint: "Larger free models, slower", quality: 92 },
  { id: "connected", label: "Your AI", hint: "Connect / BYOK if linked", quality: 92 },
];

type Phase = "intake" | "building" | "studio";
type ModMsg = { role: "user" | "assistant"; text: string };

export function AiAppMaker() {
  const [phase, setPhase] = useState<Phase>("intake");
  const [name, setName] = useState("");
  const [need, setNeed] = useState("");
  const [prompt, setPrompt] = useState("");
  const [audience, setAudience] = useState("Just me");
  const [data, setData] = useState("Stay in this browser");
  const [look, setLook] = useState("Dark, focused");
  const [features, setFeatures] = useState<string[]>([
    "Task list",
    "Live clock",
    "Reminders + alerts",
    "Focus 15 / 25 / 50",
  ]);
  const [route, setRoute] = useState("auto");
  const [buildLog, setBuildLog] = useState("");
  const [buildStep, setBuildStep] = useState("Planning layout");
  const [constraints, setConstraints] = useState("");
  const [html, setHtml] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("");
  const [modInput, setModInput] = useState("");
  const [mods, setMods] = useState<ModMsg[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const draft = takeAppMakerIntake();
    if (draft?.need) setNeed(draft.need);
    if (draft?.prompt) setPrompt(draft.prompt);
    if (draft?.name) setName(draft.name);
    else if (draft?.need) setName(titleFromBrief(draft.need));
  }, []);

  function toggleFeature(f: string) {
    setFeatures((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  }

  async function generateHtml(
    message: string,
    previousHtml?: string,
    onDelta?: (chunk: string) => void
  ): Promise<string | null> {
    const auth = await collectChatAuth();
    const q = ROUTES.find((r) => r.id === route)?.quality ?? 92;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "miniapp",
        stream: true,
        qualitySmooth: q,
        message: previousHtml
          ? `Here is the current app HTML. Apply this change and return the FULL updated document only.\n\nChange: ${message}\n\nCURRENT:\n${previousHtml.slice(0, 40000)}`
          : message,
        ...auth,
      }),
    });
    const ctype = res.headers.get("content-type") || "";
    let full = "";
    if (ctype.includes("text/event-stream") && res.body) {
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          try {
            const j = JSON.parse(t.slice(5).trim()) as { delta?: string; reply?: string };
            if (j.delta) {
              full += j.delta;
              onDelta?.(j.delta);
            }
            if (j.reply && !full) full = j.reply;
          } catch {
            /* */
          }
        }
      }
    } else {
      const json = (await res.json()) as { reply?: string };
      full = json.reply || "";
    }
    return extractCompleteHtml(full);
  }

  async function buildApp() {
    if (!need.trim()) {
      setStatus("Say what the app should do.");
      return;
    }
    setPhase("building");
    setStatus("");
    setBuildLog("");
    setBuildStep("Laying out clock, tasks, and focus");
    trackToolUse("build-your-tool", 5);
    const title = name.trim() || titleFromBrief(need);
    const spec = compileAppSpec({
      name: title,
      need: need.trim(),
      prompt: prompt.trim(),
      audience,
      data,
      look,
      features,
      constraints: constraints.trim(),
    });
    try {
      const fromModel = await generateHtml(spec, undefined, (chunk) => {
        setBuildLog((s) => (s + chunk).slice(-4000));
        if (chunk.includes("clock") || chunk.includes("Date")) setBuildStep("Wiring live clock");
        else if (chunk.includes("Notification") || chunk.includes("remind"))
          setBuildStep("Adding reminders");
        else if (chunk.includes("pomodoro") || chunk.includes("timer"))
          setBuildStep("Focus timer presets");
        else if (chunk.includes("</html>")) setBuildStep("Sealing the document");
      });
      const doc = fromModel || fallbackTrackerHtml(title);
      const id = uniqueSlug(slugifyAppTitle(title));
      saveMiniApp({
        slug: id,
        title,
        brief: need.trim(),
        html: doc,
        createdAt: new Date().toISOString(),
      });
      setSlug(id);
      setHtml(doc);
      setName(title);
      setMods([]);
      setPhase("studio");
    } catch {
      const doc = fallbackTrackerHtml(title);
      const id = uniqueSlug(slugifyAppTitle(title));
      saveMiniApp({
        slug: id,
        title,
        brief: need.trim(),
        html: doc,
        createdAt: new Date().toISOString(),
      });
      setSlug(id);
      setHtml(doc);
      setPhase("studio");
      setStatus("Model timed out — started from a working tracker. Ask the chat to reshape it.");
    }
  }

  async function sendMod() {
    const q = modInput.trim();
    if (!q || busy) return;
    setModInput("");
    setMods((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const next = await generateHtml(q, html);
      if (!next) {
        setMods((m) => [
          ...m,
          { role: "assistant", text: "Couldn't apply that cleanly. Try one smaller change." },
        ]);
        return;
      }
      setHtml(next);
      if (slug) {
        saveMiniApp({
          slug,
          title: name || "My app",
          brief: need,
          html: next,
          createdAt: new Date().toISOString(),
        });
      }
      setMods((m) => [...m, { role: "assistant", text: "Updated. Check the preview." }]);
    } catch {
      setMods((m) => [...m, { role: "assistant", text: "That edit failed. Try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  }

  if (phase === "building") {
    return (
      <div className="overflow-hidden rounded-2xl border border-violet-500/40 bg-[#070712]">
        <div className="relative overflow-hidden border-b border-white/10 px-4 py-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_200px_at_20%_0%,rgba(139,92,246,.35),transparent)]" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
            Compiling
          </p>
          <p className="relative mt-1 text-lg font-semibold text-white">{buildStep}…</p>
          <p className="relative mt-1 text-xs text-zinc-500">
            Not Chat — you should see structure appear below as the model writes.
          </p>
          <div className="relative mt-4 flex gap-2">
            {["Clock", "Tasks", "Remind", "Focus", "Export"].map((s, i) => (
              <span
                key={s}
                className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] text-cyan-100"
                style={{ opacity: 0.45 + (i % 5) * 0.1 }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <pre className="max-h-[360px] overflow-auto bg-black/50 p-4 font-mono text-[11px] leading-relaxed text-emerald-300/90">
          {buildLog || "// waiting for first tokens…"}
        </pre>
      </div>
    );
  }

  if (phase === "studio") {
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_min(340px,100%)]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <p className="truncate text-sm font-semibold text-white">{name || "Your app"}</p>
            <div className="flex gap-2">
              {slug ? (
                <Link
                  href={`/projects/${slug}`}
                  target="_blank"
                  className="text-[11px] text-violet-300 hover:underline"
                >
                  Full window
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => setPhase("intake")}
                className="text-[11px] text-zinc-400 hover:text-white"
              >
                New brief
              </button>
            </div>
          </div>
          <iframe
            title={name || "app preview"}
            srcDoc={html}
            sandbox="allow-scripts allow-same-origin allow-modals"
            className="h-[min(70vh,640px)] w-full border-0 bg-white"
          />
        </div>
        <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-violet-500/30 bg-[#0c0c14]">
          <p className="border-b border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-violet-200">
            Modify
          </p>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {mods.length === 0 && (
              <p className="text-sm text-zinc-500">
                Ask for changes: “add a weekly review”, “make the timer 50 minutes”, “simpler
                layout”. Source stays out of this box.
              </p>
            )}
            {mods.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-6 bg-violet-600 text-white"
                    : "mr-4 border border-white/10 bg-white/[0.04] text-zinc-200"
                }`}
              >
                {m.text}
              </div>
            ))}
            {busy && <p className="text-xs text-zinc-500">Applying…</p>}
          </div>
          <div className="flex gap-2 border-t border-white/10 p-2">
            <input
              value={modInput}
              onChange={(e) => setModInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void sendMod();
              }}
              placeholder="What should change?"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              disabled={busy || !modInput.trim()}
              onClick={() => void sendMod()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white disabled:opacity-40"
              aria-label="Send change"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/15 to-transparent p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
          <Hammer className="h-3.5 w-3.5" />
          AI App Maker
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Brief the job, your rules, and a few Plethora questions. Create a real web app here —
          then this tool is only a modification chat.
        </p>
      </div>

      <div>
        <p className="text-xs text-zinc-500">Model path (not Claude-only)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {ROUTES.map((r) => (
            <Chip key={r.id} on={route === r.id} onClick={() => setRoute(r.id)}>
              {r.label}
            </Chip>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-zinc-600">
          {ROUTES.find((r) => r.id === route)?.hint}. Chat quality + Connect/BYOK still apply.
          “Claude Sonnet” on the tool card was a suggestion, not the only engine.
        </p>
      </div>

      <label className="block text-xs text-zinc-500">
        App name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Productivity Tracker"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </label>

      <label className="block text-xs text-zinc-500">
        What should it do?
        <textarea
          data-tour="app-maker-need"
          value={need}
          onChange={(e) => setNeed(e.target.value)}
          rows={4}
          placeholder="Daily productivity + time tracker with tasks and Pomodoro…"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </label>

      <label className="block text-xs text-zinc-500">
        Custom prompt / rules
        <textarea
          data-tour="app-maker-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="No accounts. Keyboard-first. Never lecture me. Keep copy short."
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="text-xs text-zinc-500">Who is this for?</legend>
        <div className="flex flex-wrap gap-2">
          {["Just me", "Household / team", "Customers / public"].map((o) => (
            <Chip key={o} on={audience === o} onClick={() => setAudience(o)}>
              {o}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs text-zinc-500">Where should data live?</legend>
        <div className="flex flex-wrap gap-2">
          {["Stay in this browser", "Easy export (CSV)", "I don’t care yet"].map((o) => (
            <Chip key={o} on={data === o} onClick={() => setData(o)}>
              {o}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs text-zinc-500">Look</legend>
        <div className="flex flex-wrap gap-2">
          {["Dark, focused", "Clean light", "Playful color"].map((o) => (
            <Chip key={o} on={look === o} onClick={() => setLook(o)}>
              {o}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-xs text-zinc-500">Must-haves</legend>
        <div className="flex flex-wrap gap-2">
          {FEATURES.map((f) => (
            <Chip key={f} on={features.includes(f)} onClick={() => toggleFeature(f)}>
              {f}
            </Chip>
          ))}
        </div>
      </fieldset>

      <label className="block text-xs text-zinc-500">
        Hard no’s (optional)
        <input
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
          placeholder="No accounts, no ads, don’t reset on refresh…"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </label>

      <button
        type="button"
        data-tour="app-maker-build"
        onClick={() => void buildApp()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white hover:bg-violet-500"
      >
        <Sparkles className="h-4 w-4" />
        Create web app
      </button>
      {status && <p className="text-xs text-amber-200">{status}</p>}
      <p className="text-[11px] text-zinc-600">
        Want Plethora staff to build something instead?{" "}
        <Link href="/tools/request-tool" className="text-violet-400 hover:underline">
          Request a tool
        </Link>
      </p>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs ${
        on ? "bg-violet-600 text-white" : "border border-white/10 text-zinc-400 hover:border-violet-500/40"
      }`}
    >
      {children}
    </button>
  );
}
