"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  Loader2,
  MessageSquare,
} from "lucide-react";
import {
  buildRefinedPrompt,
  generateClarifyingQuestions,
  getPromptMeta,
  recommendAiForTask,
} from "@/lib/recommender";
import { detectIntent } from "@/lib/prompt-engine";
import { assessContentSafety, type SafetyAssessment } from "@/lib/content-safety";
import { ContentWarningDialog } from "@/components/ContentWarningDialog";
import { loadAdultSession, saveAdultSession } from "@/lib/chat-personality";
import {
  contextToPromptBlock,
  loadPersonalContext,
} from "@/lib/personal-context";
import { PersonalContextPanel } from "@/components/PersonalContextPanel";

type Step = "input" | "questions" | "result";

export function PromptAssistant() {
  const [step, setStep] = useState<Step>("input");
  const [rawInput, setRawInput] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [refinedPrompt, setRefinedPrompt] = useState("");
  const [meta, setMeta] = useState<{ intentLabel: string; polishNote?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<SafetyAssessment | null>(null);
  const [pendingAction, setPendingAction] = useState<"start" | "submit" | null>(null);

  const questions = rawInput ? generateClarifyingQuestions(rawInput) : [];

  function handleStart() {
    if (!rawInput.trim()) return;
    const safety = assessContentSafety(rawInput);
    if (safety.hardBlock) {
      setWarning(safety);
      setPendingAction(null);
      return;
    }
    if (safety.needsWarning) {
      setWarning(safety);
      setPendingAction("start");
      return;
    }
    const qs = generateClarifyingQuestions(rawInput);
    if (qs.length === 0) {
      void runGenerate();
      return;
    }
    setStep("questions");
    setAnswers({});
  }

  async function trackUsage() {
    try {
      await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: "prompt-assistant" }),
      });
    } catch {
      // Non-blocking
    }
  }

  function toggleOption(questionId: string, opt: string, multi: boolean) {
    setAnswers((prev) => {
      const current = prev[questionId] ?? "";
      if (!multi) {
        return { ...prev, [questionId]: opt };
      }
      const selected = current
        ? current.split(/\s*\|\s*/).map((s) => s.trim()).filter(Boolean)
        : [];
      const next = selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt];
      if (next.length === 0) {
        const { [questionId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [questionId]: next.join(" | ") };
    });
  }

  function isOptionSelected(questionId: string, opt: string): boolean {
    const current = answers[questionId];
    if (!current) return false;
    return current.split(/\s*\|\s*/).map((s) => s.trim()).includes(opt) || current === opt;
  }

  async function runGenerate() {
    setLoading(true);
    let draft = buildRefinedPrompt(rawInput, answers);
    const personal = loadPersonalContext();
    if (personal.enabled) {
      const block = contextToPromptBlock(personal);
      if (block) draft = `${block}\n\n${draft}`;
    }
    const promptMeta = getPromptMeta(rawInput, answers);
    const intent = detectIntent(rawInput, answers);

    if (intent === "general") {
      setRefinedPrompt(draft);
      setMeta({ intentLabel: promptMeta.intentLabel });
      setStep("result");
      setLoading(false);
      await trackUsage();
      return;
    }

    try {
      const res = await fetch("/api/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: rawInput,
          answers,
          draftPrompt: draft,
          plan: "free",
          adultConsent: loadAdultSession(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRefinedPrompt(data.prompt ?? draft);
        setMeta({
          intentLabel: promptMeta.intentLabel,
          polishNote: data.providerNote,
        });
      } else if (res.status === 403) {
        const data = await res.json();
        setWarning(data.safety);
        setLoading(false);
        return;
      } else if (res.status === 429) {
        const { notifyAiExhausted } = await import("@/lib/platform-ai-client");
        notifyAiExhausted();
        setRefinedPrompt(draft);
        setMeta({
          intentLabel: promptMeta.intentLabel,
          polishNote: "Free AI exhausted — template kept. Add a key or pay as you go.",
        });
      } else {
        setRefinedPrompt(draft);
        setMeta({ intentLabel: promptMeta.intentLabel });
      }
    } catch {
      setRefinedPrompt(draft);
      setMeta({ intentLabel: promptMeta.intentLabel });
    }

    setStep("result");
    setLoading(false);
    await trackUsage();
  }

  function handleSubmitAnswers() {
    const safety = assessContentSafety(rawInput + " " + Object.values(answers).join(" "));
    if (safety.hardBlock) {
      setWarning(safety);
      return;
    }
    if (safety.needsWarning) {
      setWarning(safety);
      setPendingAction("submit");
      return;
    }
    void runGenerate();
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(refinedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const recommendations = refinedPrompt
    ? recommendAiForTask(rawInput + " " + Object.values(answers).join(" "))
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      {warning && (
        <ContentWarningDialog
          assessment={warning}
          onCancel={() => {
            setWarning(null);
            setPendingAction(null);
          }}
          onContinue={() => {
            const action = pendingAction;
            setWarning(null);
            setPendingAction(null);
            void saveAdultSession();
            if (action === "start") {
              const qs = generateClarifyingQuestions(rawInput);
              if (qs.length === 0) {
                void runGenerate();
              } else {
                setStep("questions");
                setAnswers({});
              }
            } else if (action === "submit") {
              void runGenerate();
            }
          }}
        />
      )}
      {step === "input" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">What do you want?</h2>
              <p className="text-sm text-zinc-500">
                Type it messy. We give you a short prompt to paste.
              </p>
            </div>
          </div>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="e.g. i need ad for my shop instagram"
            rows={4}
            className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <button
            onClick={handleStart}
            disabled={!rawInput.trim() || loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-medium text-white hover:bg-violet-500 disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Writing prompt…
              </>
            ) : (
              <>
                Get my prompt
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          <div className="mt-6">
            <PersonalContextPanel compact />
          </div>
        </div>
      )}

      {step === "questions" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-200">
            You said: &ldquo;{rawInput}&rdquo;
          </div>
          <p className="text-sm text-zinc-500">Optional details. Skip if you don’t care.</p>
          {questions.map((q) => {
            const multi = q.multiSelect !== false && Boolean(q.options);
            return (
            <div
              key={q.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <p className="font-medium text-white">{q.question}</p>
              {q.options && multi && (
                <p className="mt-1 text-xs text-zinc-600">Multi-select · click again to deselect</p>
              )}
              {q.options ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const selected = isOptionSelected(q.id, opt);
                    return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleOption(q.id, opt, multi)}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                        selected
                          ? "border-violet-500 bg-violet-600/20 text-violet-200"
                          : "border-white/10 text-zinc-400 hover:border-white/20"
                      }`}
                    >
                      {selected ? "✓ " : ""}
                      {opt}
                    </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder={q.placeholder}
                  className="mt-3 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
                />
              )}
            </div>
            );
          })}
          <button
            onClick={handleSubmitAnswers}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-medium text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Building prompt...
              </>
            ) : (
              <>
                Get my prompt
              </>
            )}
          </button>
        </div>
      )}

      {step === "result" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 font-medium text-white">
                <Check className="h-4 w-4 text-emerald-400" />
                Your prompt
              </p>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1 text-xs text-zinc-300 hover:bg-white/5"
              >
                <Copy className="h-3 w-3" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="max-h-[min(70vh,520px)] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
              {refinedPrompt}
            </pre>
          </div>

          <p className="text-sm text-zinc-500">Copy and paste into Chat or any AI chat.</p>

          {recommendations && detectIntent(rawInput, answers) !== "general" && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="font-semibold text-white">Recommended AI tools for this task</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Run the prompt above in any of these.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {recommendations.aiTools.slice(0, 6).map((tool) => (
                  <a
                    key={tool.id}
                    href={tool.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                  >
                    <span className="font-medium text-white">{tool.name}</span>
                    <span className="ml-2 text-xs text-zinc-500 capitalize">
                      {tool.platform} · {tool.pricing}
                    </span>
                  </a>
                ))}
              </div>
              <Link
                href="/ai-finder"
                className="mt-4 inline-flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
              >
                See all AI options for this task
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          <button
            onClick={() => {
              setStep("input");
              setRawInput("");
              setAnswers({});
              setRefinedPrompt("");
              setMeta(null);
            }}
            className="text-sm text-zinc-500 hover:text-white"
          >
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
