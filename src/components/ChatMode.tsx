"use client";

import { useEffect, useRef, useState } from "react";
import {
  classifyChatIntent,
  generateAssistantReply,
  newMessage,
  type ChatMessage,
} from "@/lib/assistant-brain";
import { appendPattern, loadPersonalContext } from "@/lib/personal-context";
import { PersonalContextPanel } from "@/components/PersonalContextPanel";
import { startProductTour, TOUR_CHAT_OPENING } from "@/lib/product-tour";
import { Loader2, Send, Sparkles, Compass, Wrench, MessageCircle } from "lucide-react";

const HISTORY_KEY = "plethora.chat.history.v1";

const QUICK = [
  { label: "Feeling meh", text: "hi im feeling dull today, help", icon: MessageCircle },
  { label: "Tour", text: "give me a tour of the website", icon: Compass },
  { label: "Quick dinner", text: "what's a good 10-minute dinner idea", icon: Sparkles },
  { label: "Find tools", text: "find tools for ugc money", icon: Wrench },
];

export function ChatMode({
  embedded = false,
  initialPrompt,
}: {
  embedded?: boolean;
  initialPrompt?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [llmReady, setLlmReady] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setMessages(JSON.parse(raw));
      else {
        setMessages([
          newMessage(
            "assistant",
            "Hey — chat, tools, chaos. Not a hall monitor. Try me."
          ),
        ]);
      }
    } catch {
      /* ignore */
    }
    void fetch("/api/chat")
      .then((r) => r.json())
      .then((d: { openrouterConfigured?: boolean }) =>
        setLlmReady(Boolean(d.openrouterConfigured))
      )
      .catch(() => setLlmReady(false));
  }, []);

  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    if (messages.length) localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-80)));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendText(textRaw: string) {
    const text = textRaw.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg = newMessage("user", text);
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    try {
      if (classifyChatIntent(text) === "tour") {
        startProductTour();
        setMessages((m) => [...m, newMessage("assistant", TOUR_CHAT_OPENING)]);
        setLoading(false);
        return;
      }

      const reply = await generateAssistantReply(text, next);
      setMessages((m) => [...m, newMessage("assistant", reply)]);
      if (loadPersonalContext().enabled && text.length > 20) {
        appendPattern(`Talked about: ${text.slice(0, 120)}`);
      }
    } catch {
      setMessages((m) => [
        ...m,
        newMessage("assistant", "Something went wrong. Try again in a moment."),
      ]);
    }
    setLoading(false);
  }

  return (
    <div className={embedded ? "flex h-full flex-col" : "mx-auto max-w-3xl"}>
      {!embedded && (
        <div className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-[#12121c] to-[#0a0a12] p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-900/40">
              <Sparkles className="h-6 w-6 text-white" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Chat</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Sharp middleman — not a dumb FAQ bot. Learns what you use (on this device only).
              </p>
              {llmReady !== null && (
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] ${
                    llmReady
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {llmReady ? "Live model on" : "Offline replies (add OpenRouter key)"}
                </span>
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void sendText("give me a tour of the website")}
              className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
            >
              Tour the site
            </button>
            <button
              type="button"
              onClick={() => {
                setMessages([newMessage("assistant", "Clean slate. What’s on your mind?")]);
                localStorage.removeItem(HISTORY_KEY);
              }}
              className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
            >
              Clear
            </button>
          </div>
          <div className="mt-4">
            <PersonalContextPanel />
          </div>
        </div>
      )}

      <div
        className={`flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c14]/90 shadow-xl shadow-black/40 ${
          embedded ? "min-h-0 flex-1" : "min-h-[480px]"
        }`}
      >
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role !== "user" && (
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600/90">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </span>
              )}
              <div
                className={`max-w-[min(100%,34rem)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-md bg-violet-600 text-white"
                    : "rounded-bl-md border border-white/8 bg-white/[0.04] text-zinc-200"
                }`}
              >
                <MessageBody text={m.content} />
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 pl-10 text-xs text-zinc-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
              Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {!embedded && (
          <div className="flex gap-2 overflow-x-auto border-t border-white/5 px-3 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {QUICK.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => void sendText(c.text)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-zinc-400 hover:border-violet-500/40 hover:text-zinc-200"
              >
                <c.icon className="h-3 w-3 text-violet-400" />
                {c.label}
              </button>
            ))}
          </div>
        )}

        {embedded && (
          <div className="border-t border-white/5 px-3 py-1.5">
            <button
              type="button"
              onClick={() => void sendText("give me a tour of the website")}
              className="text-[11px] text-violet-400 hover:underline"
            >
              Tour highlights
            </button>
          </div>
        )}

        <div className="border-t border-white/10 bg-black/20 p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendText(input);
                }
              }}
              rows={1}
              placeholder="Say anything…"
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void sendText(input)}
              disabled={loading || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Lightweight formatting — bold + soft line breaks. */
function MessageBody({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5" />;
        const chunks = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="whitespace-pre-wrap">
            {chunks.map((c, j) =>
              c.startsWith("**") && c.endsWith("**") ? (
                <strong key={j} className="font-semibold text-white">
                  {c.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{c}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}
