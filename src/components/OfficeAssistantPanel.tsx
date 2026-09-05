"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { runPlatformAi } from "@/lib/platform-ai-client";
import {
  OFFICE_AI_ACTIONS,
  actionPrompt,
  chatSystemForOfficeBot,
  defaultOfficeBotId,
  officeBots,
  type OfficeAiAction,
} from "@/lib/office-assistants";
import { getBot } from "@/lib/chat-bots";
import { loadCustomAssistants } from "@/lib/custom-assistants";

type Props = {
  app: string;
  title: string;
  body: string;
  selection?: string;
  onApplyHtml: (html: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OfficeAssistantPanel({
  app,
  title,
  body,
  selection,
  onApplyHtml,
  open,
  onOpenChange,
}: Props) {
  const [botId, setBotId] = useState(defaultOfficeBotId(app));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [chat, setChat] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const bots = officeBots();
  const bot = getBot(botId);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, open]);

  async function runAction(action: OfficeAiAction, userNote?: string) {
    setBusy(true);
    setNote("");
    const { user, system } = actionPrompt(action, { title, body, selection, userNote });
    try {
      const r = await runPlatformAi(user, {
        customSystem: system,
        toolJob: true,
        maxTokens: 2000,
      });
      const html = (r.reply || "").trim();
      if (html) {
        onApplyHtml(html);
        setNote(`${OFFICE_AI_ACTIONS.find((a) => a.id === action)?.label || "Done"} applied.`);
      } else {
        setNote(r.code || "No reply — connect AI or BYOK.");
      }
    } catch {
      setNote("Network error");
    }
    setBusy(false);
  }

  async function sendChat() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next = [...chat, { role: "user" as const, text }];
    setChat(next);
    setBusy(true);
    try {
      const ctx = `Document title: ${title}\n\nBody (HTML):\n${body.slice(0, 8000)}\n\nUser: ${text}`;
      const r = await runPlatformAi(ctx, {
        customSystem: chatSystemForOfficeBot(botId, app),
        toolJob: true,
        maxTokens: 1200,
      });
      const reply = r.reply || r.code || "No reply.";
      setChat([...next, { role: "assistant", text: reply }]);
      if (reply.includes("<p>") || reply.includes("<h")) {
        setNote("Tip: use Apply last reply if the assistant returned HTML.");
      }
    } catch {
      setChat([...next, { role: "assistant", text: "Something broke. Try again." }]);
    }
    setBusy(false);
  }

  function applyLastReply() {
    const last = [...chat].reverse().find((m) => m.role === "assistant");
    if (!last) return;
    onApplyHtml(last.text);
    setNote("Applied assistant reply to document.");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-900/40 hover:opacity-95"
      >
        <Sparkles className="h-4 w-4" />
        {bot ? `${bot.glyph} ${bot.name}` : "AI teammate"}
      </button>
    );
  }

  const customs = loadCustomAssistants().slice(0, 4);

  return (
    <aside className="flex h-full w-full max-w-sm shrink-0 flex-col border-l border-white/10 bg-[#0c0c14]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-sm font-medium text-white">
          <Bot className="h-4 w-4 text-violet-400" />
          Office AI
        </p>
        <button type="button" onClick={() => onOpenChange(false)} aria-label="Close panel">
          <X className="h-4 w-4 text-zinc-500" />
        </button>
      </div>

      <div className="border-b border-white/10 p-3">
        <label className="text-[10px] uppercase tracking-wide text-zinc-500">Teammate</label>
        <select
          value={botId}
          onChange={(e) => setBotId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/15 bg-zinc-900 px-2 py-2 text-sm text-white"
        >
          {bots.map((b) => (
            <option key={b.id} value={b.id}>
              {b.glyph} {b.name} — {b.tagline.slice(0, 40)}
            </option>
          ))}
        </select>
        {bot ? <p className="mt-1 text-[11px] text-zinc-500">{bot.hello}</p> : null}
      </div>

      <div className="border-b border-white/10 p-3">
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Quick actions</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {OFFICE_AI_ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={busy}
              title={a.hint}
              onClick={() => void runAction(a.id)}
              className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300 hover:border-violet-500/40 hover:bg-violet-500/10 disabled:opacity-40"
            >
              {a.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            const brief = window.prompt("What should I draft?");
            if (brief) void runAction("draft", brief);
          }}
          className="mt-2 w-full rounded-xl bg-violet-600 py-2 text-xs font-medium text-white disabled:opacity-40"
        >
          {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Draft from brief…"}
        </button>
        {note ? <p className="mt-2 text-[11px] text-cyan-300">{note}</p> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Chat with teammate</p>
        <div className="mt-2 space-y-2">
          {chat.length === 0 ? (
            <p className="text-xs text-zinc-600">
              Ask {bot?.name || "your bot"} about this doc — structure, tone, legal-ish disclaimers, film
              call sheet copy, etc.
            </p>
          ) : null}
          {chat.map((m, i) => (
            <p
              key={i}
              className={`rounded-xl px-2.5 py-2 text-xs leading-relaxed ${
                m.role === "user"
                  ? "ml-4 bg-violet-700/40 text-violet-50"
                  : "mr-2 border border-white/10 text-zinc-300"
              }`}
            >
              {m.text.slice(0, 2000)}
            </p>
          ))}
          <div ref={endRef} />
        </div>
        {chat.some((m) => m.role === "assistant") ? (
          <button
            type="button"
            onClick={applyLastReply}
            className="mt-2 text-[11px] text-violet-300 hover:underline"
          >
            Apply last reply to document
          </button>
        ) : null}
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void sendChat();
            }}
            placeholder={`Message ${bot?.name || "assistant"}…`}
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            disabled={busy || !input.trim()}
            onClick={() => void sendChat()}
            className="rounded-xl bg-cyan-600 px-3 py-2 text-white disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        {customs.length ? (
          <p className="mt-2 text-[10px] text-zinc-600">
            Custom:{" "}
            {customs.map((c) => (
              <Link key={c.id} href="/tools/custom-assistant" className="text-violet-400 hover:underline">
                {c.name}{" "}
              </Link>
            ))}
          </p>
        ) : (
          <Link href="/bots" className="mt-2 block text-[10px] text-violet-400 hover:underline">
            More Grok-style bots →
          </Link>
        )}
      </div>
    </aside>
  );
}
