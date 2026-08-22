"use client";

/**
 * Build your own tool in minutes + tool request inbox (browser-local + optional API).
 */

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Check,
  Hammer,
  Inbox,
  Loader2,
  Play,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { trackToolUse } from "@/lib/self-learn";
import { assessContentSafety, type SafetyAssessment } from "@/lib/content-safety";
import { ContentWarningDialog } from "@/components/ContentWarningDialog";
import { loadAdultSession, saveAdultSession } from "@/lib/chat-personality";

const CUSTOM_KEY = "plethora.customTools.v1";
const REQUEST_KEY = "plethora.toolRequests.v1";

export type CustomTool = {
  id: string;
  name: string;
  need: string;
  prompt: string;
  kind: "ai" | "text" | "math" | "list";
  createdAt: string;
};

export type ToolRequest = {
  id: string;
  title: string;
  description: string;
  email: string;
  createdAt: string;
  status: "queued";
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadCustom(): CustomTool[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCustom(list: CustomTool[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
}

function loadRequests(): ToolRequest[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(REQUEST_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRequests(list: ToolRequest[]) {
  localStorage.setItem(REQUEST_KEY, JSON.stringify(list));
}

function detectKind(need: string, prompt: string): CustomTool["kind"] {
  const t = `${need} ${prompt}`.toLowerCase();
  if (/\b(list|checklist|todo|steps)\b/.test(t)) return "list";
  if (/\b(calc|math|formula|percent|convert numbers)\b/.test(t)) return "math";
  if (/\b(upper|lower|trim|count words|regex|slug|json)\b/.test(t)) return "text";
  return "ai";
}

function runTextOps(input: string, need: string): string {
  const n = need.toLowerCase();
  if (n.includes("upper")) return input.toUpperCase();
  if (n.includes("lower")) return input.toLowerCase();
  if (n.includes("slug")) {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  if (n.includes("count") || n.includes("words")) {
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    const chars = input.length;
    const lines = input ? input.split(/\n/).length : 0;
    return `Words: ${words}\nCharacters: ${chars}\nLines: ${lines}`;
  }
  if (n.includes("json")) {
    try {
      return JSON.stringify(JSON.parse(input), null, 2);
    } catch (e) {
      return `Invalid JSON: ${e instanceof Error ? e.message : "parse error"}`;
    }
  }
  if (n.includes("trim")) return input.trim();
  // reverse lines default-ish transform
  if (n.includes("reverse")) return input.split("").reverse().join("");
  return input
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
}

function runMath(input: string): string {
  try {
    const cleaned = input.replace(/[^0-9+\-*/().,%\s]/g, "");
    // eslint-disable-next-line no-new-func
    const v = Function(`"use strict"; return (${cleaned.replace(/%/g, "/100")})`)();
    return String(v);
  } catch {
    return "Could not evaluate — use a simple expression like (12+8)*0.18";
  }
}

function runList(input: string): string {
  const items = input
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  return items.map((item, i) => `${i + 1}. [ ] ${item}`).join("\n");
}

export function BuildYourOwnTool() {
  const [name, setName] = useState("");
  const [need, setNeed] = useState("");
  const [prompt, setPrompt] = useState("");
  const [built, setBuilt] = useState<CustomTool | null>(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<CustomTool[]>([]);
  const [status, setStatus] = useState("");
  const [warning, setWarning] = useState<SafetyAssessment | null>(null);

  useEffect(() => {
    setSaved(loadCustom());
  }, []);

  function buildNow() {
    if (!need.trim() && !prompt.trim()) {
      setStatus("Describe what the tool should do.");
      return;
    }
    const kind = detectKind(need, prompt);
    const tool: CustomTool = {
      id: uid(),
      name: name.trim() || need.trim().slice(0, 48) || "My tool",
      need: need.trim(),
      prompt: prompt.trim(),
      kind,
      createdAt: new Date().toISOString(),
    };
    setBuilt(tool);
    setOutput("");
    setInput("");
    setStatus(
      kind === "ai"
        ? "Live tool ready — AI transform uses free chat when you run it."
        : `Live tool ready — mode: ${kind}.`
    );
    trackToolUse("build-your-tool", 3);
  }

  async function runBuilt() {
    if (!built) return;
    setBusy(true);
    setOutput("");
    try {
      if (built.kind === "text") {
        setOutput(runTextOps(input, `${built.need} ${built.prompt}`));
      } else if (built.kind === "math") {
        setOutput(runMath(input || built.prompt));
      } else if (built.kind === "list") {
        setOutput(runList(input));
      } else {
        const blob = [built.need, built.prompt, input].join("\n");
        const safety = assessContentSafety(blob);
        if (safety.hardBlock) {
          setWarning(safety);
          setBusy(false);
          return;
        }
        if (safety.needsWarning && !loadAdultSession()) {
          setWarning(safety);
          setBusy(false);
          return;
        }
        if (safety.needsWarning) saveAdultSession();
        const { runPlatformAi } = await import("@/lib/platform-ai-client");
        const data = await runPlatformAi(
          [
            "You are a focused one-shot utility. Respond with ONLY the useful result, no preamble.",
            `Tool name: ${built.name}`,
            `User need: ${built.need}`,
            `Rules: ${built.prompt || "Be precise and helpful."}`,
            "",
            "INPUT:",
            input || built.need,
          ].join("\n")
        );
        if (!data.ok) throw new Error(data.reply || "Chat failed");
        setOutput(data.reply || "(empty)");
      }
      trackToolUse("build-your-tool", 2);
    } catch (e) {
      setOutput(e instanceof Error ? e.message : "Run failed");
    } finally {
      setBusy(false);
    }
  }

  function pinTool() {
    if (!built) return;
    const next = [built, ...saved.filter((s) => s.id !== built.id)].slice(0, 40);
    saveCustom(next);
    setSaved(next);
    setStatus("Pinned to Your tools on this device.");
  }

  function removeSaved(id: string) {
    const next = saved.filter((s) => s.id !== id);
    saveCustom(next);
    setSaved(next);
  }

  return (
    <div className="space-y-5">
      {warning && (
        <ContentWarningDialog
          assessment={warning}
          onCancel={() => setWarning(null)}
          onContinue={() => {
            if (warning.hardBlock) {
              setWarning(null);
              return;
            }
            saveAdultSession();
            setWarning(null);
            void runBuilt();
          }}
        />
      )}
      <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/15 to-transparent p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
          <Hammer className="h-3.5 w-3.5" />
          Build your own tool
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Describe the job + optional system prompt. We spin up a live mini-tool here instantly
          (text / math / checklist, or AI). Pin it for later on this browser.
        </p>
      </div>

      <label className="block text-xs text-zinc-500">
        Tool name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Client email softener"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </label>
      <label className="block text-xs text-zinc-500">
        What you need
        <textarea
          value={need}
          onChange={(e) => setNeed(e.target.value)}
          rows={3}
          placeholder="I need a tool that rewrites rough meeting notes into crisp action items…"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </label>
      <label className="block text-xs text-zinc-500">
        System prompt / rules (optional)
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Keep under 120 words. Bullet only. No fluff. Preserve deadlines."
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </label>

      <button
        type="button"
        onClick={buildNow}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white hover:bg-violet-500"
      >
        <Sparkles className="h-4 w-4" />
        Build it right now
      </button>
      {status && <p className="text-xs text-zinc-500">{status}</p>}

      {built && (
        <div className="space-y-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-white">{built.name}</p>
              <p className="text-xs text-zinc-500">
                Mode: {built.kind} · {new Date(built.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              onClick={pinTool}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5"
            >
              <Save className="h-3.5 w-3.5" />
              Pin to device
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            placeholder="Paste input for this tool…"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void runBuilt()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run tool
          </button>
          {output && (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-black/50 p-3 text-sm text-zinc-200">
              {output}
            </pre>
          )}
        </div>
      )}

      {saved.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Your pinned tools
          </p>
          <ul className="space-y-2">
            {saved.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    setBuilt(t);
                    setName(t.name);
                    setNeed(t.need);
                    setPrompt(t.prompt);
                    setStatus(`Loaded “${t.name}”.`);
                  }}
                >
                  <span className="block truncate text-sm text-white">{t.name}</span>
                  <span className="text-[11px] text-zinc-500">{t.kind}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeSaved(t.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-300"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ToolRequestForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [queue, setQueue] = useState<ToolRequest[]>([]);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    setQueue(loadRequests());
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    const item: ToolRequest = {
      id: uid(),
      title: title.trim(),
      description: description.trim(),
      email: email.trim(),
      createdAt: new Date().toISOString(),
      status: "queued",
    };
    const next = [item, ...queue].slice(0, 50);
    saveRequests(next);
    setQueue(next);
    try {
      await fetch("/api/tool-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    } catch {
      /* local save is enough */
    }
    setTitle("");
    setDescription("");
    setOk(true);
    trackToolUse("request-tool", 2);
    setTimeout(() => setOk(false), 2500);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-200/90">
          <Inbox className="h-3.5 w-3.5" />
          Request a tool
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Missing something? Tell us. We prioritize high-search free utilities and workflow gaps.
          Requests are saved on this device and sent to our backlog endpoint when available.
        </p>
      </div>

      <form onSubmit={(e) => void submit(e)} className="space-y-3">
        <label className="block text-xs text-zinc-500">
          Tool name / keyword
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. invoice PDF → Excel free"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-xs text-zinc-500">
          Why / how you&apos;d use it
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="I keep switching tabs for X. If Plethora had Y, I'd use it daily…"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-xs text-zinc-500">
          Email (optional — for follow-up)
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 py-3 text-sm font-medium text-white hover:bg-amber-500"
        >
          {ok ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {ok ? "Request queued" : "Submit request"}
        </button>
      </form>

      {queue.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Your requests
          </p>
          <ul className="max-h-48 space-y-2 overflow-auto">
            {queue.map((r) => (
              <li key={r.id} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                <p className="text-sm text-white">{r.title}</p>
                <p className="text-[11px] text-zinc-500 line-clamp-2">{r.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-xs text-zinc-600">
        Or{" "}
        <Link href="/tools/build-your-tool" className="text-violet-400 hover:underline">
          build a temporary tool yourself
        </Link>{" "}
        while you wait.
      </p>
    </div>
  );
}

/** Combined panel for marketplace polish */
export function BuildAndRequestHub() {
  const [tab, setTab] = useState<"build" | "request">("build");
  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("build")}
          className={`rounded-full px-4 py-1.5 text-sm ${
            tab === "build" ? "bg-violet-600 text-white" : "border border-white/10 text-zinc-400"
          }`}
        >
          Build now
        </button>
        <button
          type="button"
          onClick={() => setTab("request")}
          className={`rounded-full px-4 py-1.5 text-sm ${
            tab === "request" ? "bg-violet-600 text-white" : "border border-white/10 text-zinc-400"
          }`}
        >
          Request tool
        </button>
      </div>
      {tab === "build" ? <BuildYourOwnTool /> : <ToolRequestForm />}
    </div>
  );
}
