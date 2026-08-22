"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Hammer, Loader2, Send, Sparkles } from "lucide-react";
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
  "Pomodoro / timer",
  "Daily stats",
  "Notes",
  "Export CSV",
  "Keyboard shortcuts",
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
  const [features, setFeatures] = useState<string[]>(["Task list", "Pomodoro / timer"]);
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

  async function generateHtml(message: string, previousHtml?: string): Promise<string | null> {
    const auth = await collectChatAuth();
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "miniapp",
        stream: false,
        qualitySmooth: 92,
        message: previousHtml
          ? `Here is the current app HTML. Apply this change and return the FULL updated document only.\n\nChange: ${message}\n\nCURRENT:\n${previousHtml.slice(0, 48000)}`
          : message,
        ...auth,
      }),
    });
    const json = (await res.json()) as { reply?: string; ok?: boolean };
    return extractCompleteHtml(json.reply || "");
  }

  async function buildApp() {
    if (!need.trim()) {
      setStatus("Say what the app should do.");
      return;
    }
    setPhase("building");
    setStatus("");
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
      const fromModel = await generateHtml(spec);
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
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/5 p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-300" />
        <p className="mt-3 font-medium text-white">Building your web app…</p>
        <p className="mt-1 text-sm text-zinc-500">This stays in the maker — not in Chat.</p>
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
          Brief the job, your rules, and a few Plethora questions. We generate a real web app in
          the preview — then this tool becomes a chatbox for edits only.
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
