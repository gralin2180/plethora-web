"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  countUserAssistants,
  createAssistantDraft,
  deleteAssistant,
  exportAssistantHtml,
  getAssistantLimit,
  isPlatformAssistant,
  loadCustomAssistants,
  upsertAssistant,
  type CustomAssistant,
} from "@/lib/custom-assistants";
import { Bot, Download, Plus, Trash2 } from "lucide-react";

const TRAIN_QS = [
  "What should this assistant always do first?",
  "What tone (formal / casual / playful / spicy-adult-ok)?",
  "What topics should it never touch?",
  "What industries or goals is it for?",
  "Sample goodbye line?",
];

export function CustomAssistantLab() {
  const [list, setList] = useState<CustomAssistant[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [qStep, setQStep] = useState(0);
  const limit = getAssistantLimit("free");

  useEffect(() => {
    const l = loadCustomAssistants();
    setList(l);
    if (l[0]) setActiveId(l[0].id);
  }, []);

  const active = useMemo(
    () => list.find((a) => a.id === activeId) ?? null,
    [list, activeId]
  );

  function refresh(next: CustomAssistant[]) {
    setList(next);
  }

  function createNew() {
    if (countUserAssistants(list) >= limit) {
      alert(
        `Free plan: ${limit} custom assistant. Upgrade for more, or delete one first.`
      );
      return;
    }
    const a = createAssistantDraft();
    upsertAssistant(a);
    refresh(loadCustomAssistants());
    setActiveId(a.id);
    setAnswers({});
    setQStep(0);
  }

  function saveActive(patch: Partial<CustomAssistant>) {
    if (!active) return;
    const next = { ...active, ...patch };
    upsertAssistant(next);
    refresh(loadCustomAssistants());
  }

  function applyTraining() {
    if (!active) return;
    const seed = TRAIN_QS.map((q) => ({
      q,
      a: answers[q] || "",
    })).filter((x) => x.a.trim());
    const block = seed.map((s) => `Q: ${s.q}\nA: ${s.a}`).join("\n\n");
    const systemPrompt = `You are "${active.name}", a custom Plethora assistant.

Style notes: ${active.styleNotes || "(none)"}
Topics focus: ${active.topics || "(general)"}

Training:
${block || "(none yet)"}

Rules: Be useful. Match the style. If adult content is requested and style allows, require 18+ and only adults. Hard-refuse illegal sexual content involving minors.`;
    saveActive({ systemPrompt, seedQa: seed });
  }

  function downloadHtml() {
    if (!active) return;
    const html = exportAssistantHtml(active);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.name.replace(/\s+/g, "-").toLowerCase() || "assistant"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        One free custom assistant on this device. Train with a few questions, pin a system prompt,
        export a standalone HTML chat page that uses{" "}
        <Link href="/settings/ai-keys" className="text-violet-400 hover:underline">
          your OpenRouter key
        </Link>
        . Paid plans raise the count later via account sync.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={createNew}
          className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          <Plus className="h-4 w-4" />
          New assistant ({countUserAssistants(list)}/{limit})
        </button>
        <Link href="/chat" className="text-sm text-zinc-400 hover:text-white">
          Open chat →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <ul className="space-y-1">
          {list.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setActiveId(a.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  activeId === a.id
                    ? "bg-violet-600/30 text-white"
                    : "text-zinc-400 hover:bg-white/5"
                }`}
              >
                <Bot className="mb-0.5 inline h-3.5 w-3.5" /> {a.name}
              </button>
            </li>
          ))}
          {!list.length && (
            <li className="text-xs text-zinc-600">No assistants yet.</li>
          )}
        </ul>

        {active && (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-black/25 p-4">
            <label className="block text-xs text-zinc-500">
              Name
              <input
                value={active.name}
                onChange={(e) => saveActive({ name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 text-sm text-white"
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Style notes
              <textarea
                value={active.styleNotes}
                onChange={(e) => saveActive({ styleNotes: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 text-sm text-white"
              />
            </label>
            <label className="block text-xs text-zinc-500">
              Topics
              <input
                value={active.topics}
                onChange={(e) => saveActive({ topics: e.target.value })}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 text-sm text-white"
              />
            </label>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs font-medium text-zinc-300">
                Training Q {qStep + 1}/{TRAIN_QS.length}
              </p>
              <p className="mt-1 text-sm text-white">{TRAIN_QS[qStep]}</p>
              <textarea
                value={answers[TRAIN_QS[qStep]] || ""}
                onChange={(e) =>
                  setAnswers((s) => ({ ...s, [TRAIN_QS[qStep]]: e.target.value }))
                }
                rows={2}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 text-sm text-white"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={qStep === 0}
                  onClick={() => setQStep((s) => Math.max(0, s - 1))}
                  className="text-xs text-zinc-400 hover:text-white disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={qStep >= TRAIN_QS.length - 1}
                  onClick={() => setQStep((s) => Math.min(TRAIN_QS.length - 1, s + 1))}
                  className="text-xs text-zinc-400 hover:text-white disabled:opacity-40"
                >
                  Next Q
                </button>
                <button
                  type="button"
                  onClick={applyTraining}
                  className="ml-auto rounded-lg bg-violet-600 px-2.5 py-1 text-xs text-white"
                >
                  Build system prompt
                </button>
              </div>
            </div>

            <label className="block text-xs text-zinc-500">
              System prompt
              <textarea
                value={active.systemPrompt}
                onChange={(e) => saveActive({ systemPrompt: e.target.value })}
                rows={8}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-2 font-mono text-xs text-zinc-300"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadHtml}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-100"
              >
                <Download className="h-3.5 w-3.5" />
                Export local HTML app
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isPlatformAssistant(active.id)) return;
                  deleteAssistant(active.id);
                  const next = loadCustomAssistants();
                  refresh(next);
                  setActiveId(next[0]?.id ?? null);
                }}
                disabled={isPlatformAssistant(active.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-rose-300 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
