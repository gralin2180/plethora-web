"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Gamepad2,
  Loader2,
  Send,
  Sparkles,
  Upload,
} from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { collectChatAuth } from "@/lib/platform-ai-client";
import {
  buildDirectorContext,
  ensureGameDirectorAssistant,
  ENGINE_OPTIONS,
  GAME_DIRECTOR_SYSTEM,
  GAME_PIPELINE,
  loadGameChat,
  loadGameProject,
  pipelineIndex,
  saveGameChat,
  saveGameProject,
  stageLabel,
  type GameChatMessage,
  type GameEngineChoice,
  type GameProject,
  type PipelineStage,
} from "@/lib/game-engine";
import { trackToolUse } from "@/lib/self-learn";

export function GameEngineStudio() {
  const [project, setProject] = useState<GameProject | null>(null);
  const [messages, setMessages] = useState<GameChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureGameDirectorAssistant();
    setProject(loadGameProject());
    setMessages(loadGameChat());
    trackToolUse("game-engine", 1);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  function patchProject(patch: Partial<GameProject>) {
    setProject((cur) => {
      if (!cur) return cur;
      const next = { ...cur, ...patch };
      saveGameProject(next);
      return next;
    });
  }

  function addFileNames(files: FileList | File[]) {
    const names = Array.from(files)
      .map((f) => f.name)
      .filter(Boolean);
    if (!names.length || !project) return;
    const merged = [...new Set([...project.fileNames, ...names])].slice(0, 40);
    patchProject({ fileNames: merged });
    setStatus(`Noted ${names.length} file name(s) — stays on your device.`);
  }

  function removeFileName(name: string) {
    if (!project) return;
    patchProject({ fileNames: project.fileNames.filter((n) => n !== name) });
  }

  async function sendChat(override?: string) {
    const text = (override ?? input).trim();
    if (!text || busy || !project) return;
    setInput("");
    setBusy(true);
    setStatus("");

    const userMsg: GameChatMessage = {
      role: "user",
      text,
      at: new Date().toISOString(),
    };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    saveGameChat(nextMsgs);

    try {
      const auth = await collectChatAuth();
      const history = nextMsgs.slice(-16).map((m) => ({
        role: m.role,
        content: m.text,
      }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${buildDirectorContext(project)}\n\nUser: ${text}`,
          history: history.slice(0, -1),
          customSystem: GAME_DIRECTOR_SYSTEM,
          toolJob: true,
          qualitySmooth: 78,
          ...auth,
        }),
      });
      const data = (await res.json()) as { reply?: string; ok?: boolean };
      const reply =
        data.reply?.trim() ||
        "Could not reach the model — connect AI in Settings or try again.";
      const assistantMsg: GameChatMessage = {
        role: "assistant",
        text: reply,
        at: new Date().toISOString(),
      };
      const withReply = [...nextMsgs, assistantMsg];
      setMessages(withReply);
      saveGameChat(withReply);
      trackToolUse("game-engine", 2);
      void fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: "game-engine" }),
      }).catch(() => {});
    } catch {
      setStatus("Network error — check your connection or AI keys.");
    }
    setBusy(false);
  }

  function advanceStage() {
    if (!project) return;
    const idx = pipelineIndex(project.stage);
    const next = GAME_PIPELINE[Math.min(idx + 1, GAME_PIPELINE.length - 1)];
    patchProject({ stage: next.id });
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const stageIdx = pipelineIndex(project.stage);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Project desk</h2>
          </div>
          <p className="mb-4 text-xs leading-relaxed text-zinc-500">
            Production desk for games — prompts, GDD sections, Godot 4 guidance, and web slices.
            Not a browser Unity/Unreal compiler. Asset uploads store{" "}
            <span className="text-zinc-400">names only</span> on this device. Higgsfield MCP stays
            credit-based later — we never claim Stripe charged here.
          </p>

          <label className="block text-xs text-zinc-500">
            Game title
            <input
              value={project.title}
              onChange={(e) => patchProject({ title: e.target.value.slice(0, 120) })}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
              placeholder="Working title…"
            />
          </label>

          <div className="mt-4">
            <p className="text-xs text-zinc-500">Target engine</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {ENGINE_OPTIONS.map((opt) => {
                const active = project.engine === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => patchProject({ engine: opt.id as GameEngineChoice })}
                    className={`rounded-xl border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-white/10 bg-black/20 hover:border-white/20"
                    }`}
                  >
                    <p className="text-sm font-medium text-white">{opt.label}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">{opt.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs text-zinc-500">Pipeline</p>
              <button
                type="button"
                onClick={advanceStage}
                className="inline-flex items-center gap-1 text-[11px] text-violet-300 hover:text-violet-200"
              >
                Next stage
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {GAME_PIPELINE.map((step, i) => {
                const active = project.stage === step.id;
                const done = i < stageIdx;
                return (
                  <button
                    key={step.id}
                    type="button"
                    title={step.hint}
                    onClick={() => patchProject({ stage: step.id as PipelineStage })}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                      active
                        ? "bg-violet-600 text-white"
                        : done
                          ? "bg-emerald-500/15 text-emerald-200"
                          : "border border-white/10 text-zinc-400 hover:border-violet-500/30"
                    }`}
                  >
                    {step.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-zinc-600">
              Current: <span className="text-zinc-400">{stageLabel(project.stage)}</span>
            </p>
          </div>

          <label className="mt-4 block text-xs text-zinc-500">
            Notes & scratchpad
            <textarea
              value={project.notes}
              onChange={(e) => patchProject({ notes: e.target.value.slice(0, 8000) })}
              rows={5}
              placeholder="Pitch, mechanics, references, blockers…"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder:text-zinc-600"
            />
          </label>

          <div className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs text-zinc-500">
              <Upload className="h-3.5 w-3.5" />
              Reference files (names only)
            </p>
            <DropZone
              accept="*/*"
              multiple
              label="Drop refs — we store filenames, not bytes"
              hint="Concept art, docs, audio — stays local"
              onFiles={addFileNames}
            />
            {project.fileNames.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {project.fileNames.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => removeFileName(name)}
                      className="rounded-lg border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] text-zinc-300 hover:border-red-500/40 hover:text-red-200"
                      title="Remove from list"
                    >
                      {name} ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {status && <p className="mt-3 text-xs text-emerald-400/90">{status}</p>}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
          <Link href="/chat" className="text-violet-400 hover:underline">
            Main chat
          </Link>
          <span>·</span>
          <Link href="/tools/custom-assistant" className="text-violet-400 hover:underline">
            Custom assistants
          </Link>
          <span>·</span>
          <Link href="/mcp" className="text-violet-400 hover:underline">
            MCP (generators later)
          </Link>
        </div>
      </div>

      <div className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b14]">
        <div className="border-b border-white/5 px-4 py-3">
          <p className="text-sm font-medium text-white">Game Director chat</p>
          <p className="text-[11px] text-zinc-500">
            Stage-aware producer — refuses CSAM / minors in sexual content
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-sm text-zinc-500">
              <p className="font-medium text-zinc-300">Start with a pitch</p>
              <p className="mt-2 text-xs leading-relaxed">
                Example: &quot;Roguelike deckbuilder for mobile — Godot 4 — need core loop and first
                vertical slice plan.&quot;
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "Help me write a one-page pitch",
                  "Outline a GDD for this stage",
                  "Godot 4 scene tree for a platformer",
                  "Asset naming convention for sprites",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => void sendChat(chip)}
                    className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-zinc-300 hover:border-violet-500/40"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={`${m.at}-${i}`}
              className={`rounded-xl px-3 py-2.5 text-sm ${
                m.role === "user"
                  ? "ml-8 bg-violet-600/20 text-violet-50"
                  : "mr-4 bg-white/[0.04] text-zinc-200"
              }`}
            >
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {m.role === "user" ? "You" : "Game Director"}
              </p>
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
            </div>
          ))}
          {busy && (
            <p className="flex items-center gap-2 text-xs text-zinc-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </p>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/5 p-3">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendChat();
                }
              }}
              rows={2}
              placeholder={`Ask about ${stageLabel(project.stage).toLowerCase()}…`}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
            />
            <button
              type="button"
              disabled={busy || !input.trim()}
              onClick={() => void sendChat()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40"
              aria-label="Send"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-2 flex items-center gap-1 text-[10px] text-zinc-600">
            <Sparkles className="h-3 w-3" />
            Uses Plethora free pool, Connect, or BYOK — same as Chat
          </p>
        </div>
      </div>
    </div>
  );
}
