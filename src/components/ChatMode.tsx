"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  classifyChatIntent,
  generateAssistantReply,
  newMessage,
  type ChatMessage,
} from "@/lib/assistant-brain";
import { appendPattern, loadPersonalContext } from "@/lib/personal-context";
import { PersonalContextPanel } from "@/components/PersonalContextPanel";
import { ContentWarningDialog } from "@/components/ContentWarningDialog";
import { assessContentSafety, type SafetyAssessment } from "@/lib/content-safety";
import { createAssistantDraft, upsertAssistant } from "@/lib/custom-assistants";
import { startProductTour, TOUR_CHAT_OPENING } from "@/lib/product-tour";
import { hasByok } from "@/lib/byok";
import { hasCodexSubscription } from "@/lib/subscription-tokens";
import {
  Loader2,
  Send,
  Sparkles,
  Compass,
  Wrench,
  MessageCircle,
  Bot,
} from "lucide-react";

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
  onClearHistory,
}: {
  embedded?: boolean;
  initialPrompt?: string;
  /** Called when user clears — parent can sync (floating header) */
  onClearHistory?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [llmReady, setLlmReady] = useState<boolean | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [pending, setPending] = useState<{
    text: string;
    assessment: SafetyAssessment;
  } | null>(null);
  const [quotaNote, setQuotaNote] = useState<string | null>(null);
  const [softWarn, setSoftWarn] = useState<string | null>(null);
  const [byokOn, setByokOn] = useState(false);
  const [subscriptionOn, setSubscriptionOn] = useState(false);
  const [lastUserText, setLastUserText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  function clearChat() {
    setMessages([newMessage("assistant", "Clean slate. What’s on your mind?")]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
    onClearHistory?.();
  }

  useEffect(() => {
    try {
      setByokOn(hasByok());
      setSubscriptionOn(hasCodexSubscription());
    } catch {
      /* */
    }
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
      .then(
        (d: {
          openrouterConfigured?: boolean;
          signedIn?: boolean;
          guestDailyLimit?: number;
          freeDailyLimit?: number;
          entitlement?: {
            routeLabel?: string;
            softWarnMessage?: string;
            premiumLimit?: number;
            premiumUsed?: number;
            freeDailyLimit?: number;
          };
        }) => {
          setLlmReady(Boolean(d.openrouterConfigured));
          setSignedIn(Boolean(d.signedIn));
          if (d.entitlement?.softWarnMessage) {
            setSoftWarn(d.entitlement.softWarnMessage);
          }
          if (d.entitlement?.routeLabel) {
            setQuotaNote(d.entitlement.routeLabel);
          } else if (!d.signedIn && d.guestDailyLimit) {
            setQuotaNote(
              `Guest free AI: up to ${d.guestDailyLimit}/day · sign in for ~${d.freeDailyLimit ?? 40}/day · BYOK unlimited`
            );
          } else if (d.signedIn) {
            setQuotaNote(`Signed in · free AI ~${d.freeDailyLimit ?? 40}/day (platform key)`);
          }
        }
      )
      .catch(() => {
        setLlmReady(false);
        setSignedIn(false);
      });
  }, []);

  useEffect(() => {
    function onWarn(e: Event) {
      const msg = (e as CustomEvent<string>).detail;
      if (msg) setSoftWarn(msg);
    }
    function onQuota(e: Event) {
      const msg = (e as CustomEvent<string>).detail;
      if (msg) setQuotaNote(msg);
    }
    window.addEventListener("plethora:soft-warn", onWarn);
    window.addEventListener("plethora:quota-label", onQuota);
    return () => {
      window.removeEventListener("plethora:soft-warn", onWarn);
      window.removeEventListener("plethora:quota-label", onQuota);
    };
  }, []);

  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    if (messages.length) localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-80)));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function runSend(text: string, adultConsent: boolean) {
    if (!text || loading) return;
    setInput("");
    setLastUserText(text);
    const userMsg = newMessage("user", text);
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    try {
      if (classifyChatIntent(text) === "tour" && !adultConsent) {
        startProductTour();
        setMessages((m) => [...m, newMessage("assistant", TOUR_CHAT_OPENING)]);
        setLoading(false);
        return;
      }

      const reply = await generateAssistantReply(text, next, { adultConsent });
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

  async function sendText(textRaw: string) {
    const text = textRaw.trim();
    if (!text || loading) return;

    const safety = assessContentSafety(text);
    if (safety.hardBlock) {
      setPending({ text, assessment: safety });
      return;
    }
    if (safety.needsWarning) {
      setPending({ text, assessment: safety });
      return;
    }
    await runSend(text, false);
  }

  function saveAsAssistant() {
    const draft = createAssistantDraft(
      lastUserText ||
        messages
          .filter((m) => m.role === "user")
          .slice(-1)[0]
          ?.content
    );
    upsertAssistant(draft);
    setMessages((m) => [
      ...m,
      newMessage(
        "assistant",
        `Saved **${draft.name}** on this device (1 free included; upgrade for more). Open **/tools/custom-assistant** to rename, train with questions, or **export as a local HTML app**.`
      ),
    ]);
  }

  return (
    <div className={embedded ? "flex h-full flex-col" : "mx-auto max-w-3xl"}>
      {pending && (
        <ContentWarningDialog
          assessment={pending.assessment}
          onCancel={() => setPending(null)}
          onContinue={() => {
            const t = pending.text;
            setPending(null);
            if (!pending.assessment.hardBlock) {
              void runSend(t, true);
            }
          }}
        />
      )}

      {!embedded && (
        <div className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-[#12121c] to-[#0a0a12] p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-900/40">
              <Sparkles className="h-6 w-6 text-white" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Chat</h1>
              <p className="mt-1 text-sm text-zinc-400">
                Sharp middleman — not a dumb FAQ bot. Cloud AI needs sign-in (fair use) or your own
                key.
              </p>
              {llmReady !== null && (
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] ${
                    llmReady || byokOn || subscriptionOn
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {subscriptionOn
                    ? "ChatGPT subscription connected"
                    : byokOn
                      ? "BYOK connected"
                      : llmReady
                        ? "Platform AI configured"
                        : "Add platform key, subscription, or BYOK"}
                  {signedIn === false && !subscriptionOn && !byokOn && " · sign in for free tier"}
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
              onClick={clearChat}
              className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
            >
              Clear
            </button>
            <Link
              href="/settings/subscription-ai"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-1.5 text-sm font-medium text-emerald-100 hover:bg-emerald-500/25"
            >
              {subscriptionOn ? "ChatGPT on" : "Connect ChatGPT"}
            </Link>
            <Link
              href="/settings/ai-keys"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-1.5 text-sm font-medium text-amber-100 hover:bg-amber-500/25"
            >
              {byokOn ? "BYOK on" : "Add your key (BYOK)"}
            </Link>
            <Link
              href="/settings/billing"
              className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
            >
              Plan & packs
            </Link>
          </div>
          {softWarn && (
            <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              {softWarn}
            </p>
          )}
          {quotaNote && (
            <p className="mt-2 text-xs text-zinc-500">{quotaNote}</p>
          )}
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
          {messages.map((m, idx) => (
            <div key={m.id}>
              <div
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
              {m.role === "assistant" &&
                idx === messages.length - 1 &&
                !loading &&
                messages.some((x) => x.role === "user") && (
                  <div className="mt-2 flex flex-wrap gap-2 pl-10">
                    <button
                      type="button"
                      onClick={saveAsAssistant}
                      className="inline-flex items-center gap-1 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-[11px] text-violet-200 hover:bg-violet-500/20"
                    >
                      <Bot className="h-3 w-3" />
                      Create assistant from this
                    </button>
                    <Link
                      href="/tools/custom-assistant"
                      className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-zinc-400 hover:text-white"
                    >
                      Modify assistants
                    </Link>
                  </div>
                )}
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
          {quotaNote && (
            <p className="mb-2 text-[11px] text-zinc-500">{quotaNote}</p>
          )}
          {signedIn === false && (
            <p className="mb-2 text-[11px] text-zinc-500">
              Guests share free cloud models with a daily cap.{" "}
              <Link href="/auth/login?next=/chat" className="text-violet-400 hover:underline">
                Sign in
              </Link>{" "}
              for more, or{" "}
              <Link href="/settings/ai-keys" className="text-violet-400 hover:underline">
                use your key
              </Link>
              .
            </p>
          )}
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

export { clearChatHistory };

function clearChatHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}
