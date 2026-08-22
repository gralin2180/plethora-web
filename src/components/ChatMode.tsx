"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { hasAnyConnectedAi } from "@/lib/connected-ai";
import {
  CHAT_PERSONALITIES,
  ADULT_MODE_EVENT,
  clearAdultSession,
  followUpSuggestions,
  getPersonality,
  isPickVibeCommand,
  loadAdultSession,
  loadChatPersonality,
  openingMessage,
  parsePersonalityChoice,
  personalityChipText,
  saveAdultSession,
  saveChatPersonality,
  type ChatPersonalityId,
} from "@/lib/chat-personality";
import {
  loadChatQuality,
  qualityFromIndex,
  qualityIndex,
  qualityLabel,
  saveChatQuality,
  type ChatQuality,
} from "@/lib/chat-quality";
import {
  Loader2,
  Send,
  Sparkles,
  Bot,
  Paperclip,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import {
  filesToModelBlock,
  prepareChatFile,
  type PreparedChatFile,
} from "@/lib/chat-files";

const HISTORY_KEY = "plethora.chat.history.v1";

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
  const [zenConfigured, setZenConfigured] = useState(false);
  const [openrouterConfigured, setOpenrouterConfigured] = useState(false);
  const [lastUserText, setLastUserText] = useState("");
  const [personality, setPersonality] = useState<ChatPersonalityId | null>(null);
  const [pickingPersonality, setPickingPersonality] = useState(false);
  const [adultSession, setAdultSession] = useState(false);
  const [quality, setQuality] = useState<ChatQuality>("balanced");
  const [unrestricted, setUnrestricted] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PreparedChatFile[]>([]);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  function clearChat() {
    setMessages([newMessage("assistant", openingMessage(personality))]);
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
      setSubscriptionOn(hasAnyConnectedAi());
    } catch {
      /* */
    }
    try {
      setPersonality(loadChatPersonality());
      setAdultSession(loadAdultSession());
      setQuality(loadChatQuality());
    } catch {
      /* */
    }
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setMessages(JSON.parse(raw));
      else {
        setMessages([newMessage("assistant", openingMessage(loadChatPersonality()))]);
      }
    } catch {
      /* ignore */
    }
                void fetch("/api/chat", { credentials: "include" })
      .then((r) => r.json())
      .then(
        (d: {
          openrouterConfigured?: boolean;
          zenConfigured?: boolean;
          llmConfigured?: boolean;
          signedIn?: boolean;
          unrestricted?: boolean;
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
          setLlmReady(
            Boolean(d.llmConfigured) || Boolean(d.openrouterConfigured) || Boolean(d.zenConfigured)
          );
          setZenConfigured(Boolean(d.zenConfigured));
          setOpenrouterConfigured(Boolean(d.openrouterConfigured));
          setSignedIn(Boolean(d.signedIn));
          setUnrestricted(Boolean(d.unrestricted));
          if (d.unrestricted) {
            setQuotaNote("Dev access — no daily cap on this account");
          } else {
            if (d.entitlement?.softWarnMessage) {
              setSoftWarn(d.entitlement.softWarnMessage);
            }
            if (d.entitlement?.routeLabel) {
              setQuotaNote(d.entitlement.routeLabel);
            } else if (!d.signedIn && d.guestDailyLimit) {
              setQuotaNote(
                `Free pool — ${d.guestDailyLimit}/day, no sign-in. Connect or extra usage if you run out.`
              );
            } else if (d.signedIn) {
              setQuotaNote(`Free pool with a daily cap · Connect is optional`);
            }
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
    function onAdult(e: Event) {
      setAdultSession(Boolean((e as CustomEvent<boolean>).detail));
    }
    window.addEventListener(ADULT_MODE_EVENT, onAdult);
    return () => {
      window.removeEventListener("plethora:soft-warn", onWarn);
      window.removeEventListener("plethora:quota-label", onQuota);
      window.removeEventListener(ADULT_MODE_EVENT, onAdult);
    };
  }, []);

  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    if (messages.length) localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-120)));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function runSend(text: string, adultConsent: boolean, files: PreparedChatFile[] = []) {
    if ((!text && !files.length) || loading) return;
    setInput("");
    setPendingFiles([]);
    setEditingId(null);
    const block = filesToModelBlock(files);
    const outbound = block ? `${text}\n\n${block}` : text;
    setLastUserText(text || files.map((f) => f.name).join(", "));
    const userMsg = newMessage("user", outbound);
    userMsg.files = files.map((f) => ({ name: f.name, kind: f.kind, thumb: f.thumb }));
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

      if (adultConsent) {
        saveAdultSession();
        setAdultSession(true);
      }

      const draft = newMessage("assistant", "");
      setMessages([...next, draft]);
      const reply = await generateAssistantReply(outbound, next, {
        adultConsent,
        personality,
        quality,
        onDelta: (chunk) => {
          setMessages((m) =>
            m.map((x) =>
              x.id === draft.id ? { ...x, content: x.content + chunk } : x
            )
          );
        },
      });
      setMessages((m) =>
        m.map((x) => (x.id === draft.id ? { ...x, content: reply || x.content } : x))
      );
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
    if ((!text && !pendingFiles.length) || loading) return;

    if (isPickVibeCommand(text)) {
      setPickingPersonality(true);
      setMessages((m) => [
        ...m,
        newMessage(
          "assistant",
          "How do you want me to talk? Witty, warm, blunt, pro, chaotic, or flirty — tap one. You can change it anytime."
        ),
      ]);
      return;
    }

    const picked = parsePersonalityChoice(text);
    if (picked) {
      saveChatPersonality(picked);
      setPersonality(picked);
      setPickingPersonality(false);
      const p = getPersonality(picked);
      if (p && !messages.some((m) => m.role === "user")) {
        setMessages([newMessage("assistant", p.hello)]);
        return;
      }
      await runSend(`Talk ${p?.label.toLowerCase() ?? picked} from now on.`, adultSession, []);
      return;
    }

    if (/^18\+\s*continue$/i.test(text)) {
      saveAdultSession();
      setAdultSession(true);
      await runSend(text, true, pendingFiles);
      return;
    }

    const safety = assessContentSafety(text);
    if (safety.hardBlock) {
      setPending({ text, assessment: safety });
      return;
    }
    if (safety.needsWarning && !adultSession) {
      setPending({ text, assessment: safety });
      return;
    }
    await runSend(text, adultSession, pendingFiles);
  }

  function beginEdit(m: ChatMessage) {
    if (loading || m.role !== "user") return;
    const idx = messages.findIndex((x) => x.id === m.id);
    if (idx < 0) return;
    const visible = m.content.split("\n\nAttached files")[0] || m.content;
    setInput(visible.trim());
    setEditingId(m.id);
    setMessages(messages.slice(0, idx));
  }

  async function onPickFiles(list: FileList | null) {
    if (!list?.length) return;
    setFileNote(null);
    const next: PreparedChatFile[] = [...pendingFiles];
    for (const file of Array.from(list).slice(0, 6)) {
      try {
        next.push(await prepareChatFile(file));
      } catch (e) {
        setFileNote(e instanceof Error ? e.message : "Couldn’t add file");
      }
    }
    setPendingFiles(next.slice(0, 8));
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const suggestionChips = useMemo(
    () =>
      followUpSuggestions({
        lastUser: lastUserText,
        lastAssistant: lastAssistant?.content,
        personality,
        pickingPersonality,
        adultSession,
      }),
    [lastUserText, lastAssistant?.content, personality, pickingPersonality, adultSession]
  );

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
                Talk like a person, not a menu. Pick a vibe, or just start — suggested replies
                follow the chat.
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
                    ? "Your AI login connected"
                    : byokOn
                      ? "BYOK connected"
                      : llmReady
                        ? "Free models ready"
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
              href="/get-started"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-4 py-1.5 text-sm font-medium text-emerald-100 hover:bg-emerald-500/25"
            >
              {subscriptionOn ? "Connected" : "Connect"}
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
        className={`flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b14] shadow-[0_24px_80px_-32px_rgba(109,40,217,0.45)] ${
          embedded ? "min-h-0 flex-1" : "min-h-[520px]"
        }`}
      >
        <div className="flex items-center gap-2 overflow-x-auto border-b border-white/5 px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            {personality && !pickingPersonality ? "Vibe" : "How I talk"}
          </span>
          {CHAT_PERSONALITIES.map((p) => {
            const active = personality === p.id && !pickingPersonality;
            return (
              <button
                key={p.id}
                type="button"
                title={p.tagline}
                onClick={() => void sendText(personalityChipText(p.id))}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
                  active
                    ? "bg-violet-600 text-white"
                    : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:border-violet-500/40 hover:text-zinc-200"
                }`}
              >
                {p.chip}
              </button>
            );
          })}
          <button
            type="button"
            title={
              adultSession
                ? "18+ on — tap to turn off (or use Settings)"
                : "Enable 18+ adult content for this browser"
            }
            onClick={() => {
              if (adultSession) {
                clearAdultSession();
                setAdultSession(false);
                return;
              }
              void sendText("I want to enable nsfw on chat");
            }}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
              adultSession
                ? "bg-amber-600 text-white"
                : "border border-amber-500/30 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
            }`}
          >
            {adultSession ? "18+ on" : "18+"}
          </button>
          <button
            type="button"
            title="Clear this chat"
            onClick={clearChat}
            className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 hover:border-red-500/40 hover:text-red-200"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto bg-[radial-gradient(1200px_400px_at_10%_-10%,rgba(124,58,237,0.12),transparent_50%)] p-4 sm:p-6">
          {messages.map((m, idx) => {
            const emptyDraft = m.role === "assistant" && !m.content.trim() && loading;
            if (emptyDraft) return null;
            return (
            <div key={m.id}>
              <div
                className={`flex items-end gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role !== "user" && (
                  <span className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-md shadow-violet-900/40">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </span>
                )}
                <div
                  className={`max-w-[min(100%,36rem)] px-4 py-2.5 text-[15px] leading-relaxed ${
                    m.role === "user"
                      ? "rounded-3xl rounded-br-md bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-lg shadow-violet-950/40"
                      : "rounded-3xl rounded-bl-md border border-white/10 bg-white/[0.06] text-zinc-100 shadow-inner"
                  }`}
                >
                  {m.files && m.files.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {m.files.map((f) =>
                        f.thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={f.name}
                            src={f.thumb}
                            alt={f.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <span
                            key={f.name}
                            className="rounded-md bg-black/20 px-1.5 py-0.5 text-[10px]"
                          >
                            {f.name}
                          </span>
                        )
                      )}
                    </div>
                  )}
                  <MessageBody text={m.content.split("\n\nAttached files")[0] || m.content} />
                  {m.role === "user" && !loading && (
                    <button
                      type="button"
                      onClick={() => beginEdit(m)}
                      className="mt-1 inline-flex items-center gap-1 text-[10px] text-white/70 hover:text-white"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit & resend
                    </button>
                  )}
                </div>
              </div>
              {m.role === "assistant" && idx === messages.length - 1 && !loading && (
                <div className="mt-2 flex flex-wrap gap-2 pl-10">
                  {suggestionChips.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => void sendText(c.text)}
                      className="rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-1 text-[11px] text-violet-100 hover:bg-violet-500/20"
                    >
                      {c.label}
                    </button>
                  ))}
                  {!embedded && messages.some((x) => x.role === "user") && (
                    <>
                      <button
                        type="button"
                        onClick={saveAsAssistant}
                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-zinc-400 hover:text-white"
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
                    </>
                  )}
                </div>
              )}
            </div>
            );
          })}
          {loading && !messages[messages.length - 1]?.content ? <TypingRow /> : null}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/10 bg-[#08080f]/90 p-3 backdrop-blur-sm">
          {quotaNote && (
            <p className="mb-2 text-[11px] text-zinc-500">{quotaNote}</p>
          )}
          {signedIn === false && (
            <p className="mb-2 text-[11px] text-zinc-500">
              Free models work without an account. Connect is optional if you want ChatGPT, Copilot,
              or your own key.
            </p>
          )}
          {fileNote && <p className="mb-2 text-[11px] text-amber-300">{fileNote}</p>}
          {pendingFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {pendingFiles.map((f) => (
                <span
                  key={f.id}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-200"
                >
                  {f.name}
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setPendingFiles((p) => p.filter((x) => x.id !== f.id))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {editingId && (
            <p className="mb-2 text-[11px] text-violet-300">
              Editing a previous prompt — later messages were dropped so the thread stays consistent.
            </p>
          )}
          <div className="mb-2 flex items-center gap-3 px-0.5">
            <QualitySlider
              value={quality}
              onChange={(q) => {
                setQuality(q);
                saveChatQuality(q);
              }}
            />
          </div>
          <div className="flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,.pdf,.txt,.md,.csv,.json,.html,.xml,.log,application/pdf,text/*"
              onChange={(e) => {
                void onPickFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-zinc-300 hover:bg-white/5 disabled:opacity-40"
              aria-label="Attach files"
              title="Attach images or documents (stored on this device)"
            >
              <Paperclip className="h-4 w-4" />
            </button>
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
              placeholder={
                editingId
                  ? "Edit prompt and send…"
                  : "Say anything, or attach a file…"
              }
              className="max-h-32 min-h-[46px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void sendText(input)}
              disabled={loading || (!input.trim() && pendingFiles.length === 0)}
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

/** Lightweight formatting — bold, *actions*, line breaks. */
function MessageBody({ text }: { text: string }) {
  return (
    <div className="space-y-1.5">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5" />;
        const chunks = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return (
          <p key={i} className="whitespace-pre-wrap">
            {chunks.map((c, j) => {
              if (c.startsWith("**") && c.endsWith("**") && c.length >= 4) {
                return (
                  <strong key={j} className="font-semibold text-white">
                    {c.slice(2, -2)}
                  </strong>
                );
              }
              if (c.startsWith("*") && c.endsWith("*") && c.length >= 2) {
                return (
                  <em key={j} className="italic text-violet-200/80">
                    {c.slice(1, -1)}
                  </em>
                );
              }
              return <span key={j}>{c}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

function QualitySlider({
  value,
  onChange,
}: {
  value: ChatQuality;
  onChange: (q: ChatQuality) => void;
}) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-2">
      <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-600">Faster</span>
      <input
        type="range"
        min={0}
        max={2}
        step={1}
        value={qualityIndex(value)}
        onChange={(e) => onChange(qualityFromIndex(Number(e.target.value)))}
        className="h-1.5 w-full cursor-pointer accent-violet-500"
        aria-label="Reply speed versus quality"
      />
      <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-600">Best</span>
      <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-violet-200">
        {qualityLabel(value)}
      </span>
    </label>
  );
}

function TypingRow() {
  return (
    <div className="flex items-end gap-2.5" aria-live="polite" aria-label="Writing a reply">
      <span className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-md shadow-violet-900/40">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </span>
      <div className="flex items-center gap-2 rounded-3xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3">
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-300 [animation-delay:-0.2s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-300 [animation-delay:-0.1s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400" />
        </span>
        <span className="text-xs text-zinc-500">Writing…</span>
      </div>
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
