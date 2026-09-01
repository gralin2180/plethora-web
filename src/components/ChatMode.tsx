"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { coachForGoal, startCoach, APP_MAKER_STEPS } from "@/lib/coach-guide";
import {
  isMiniAppNudge,
  projectPath,
  stashAppMakerIntake,
  wantsMiniApp,
} from "@/lib/mini-apps";
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
  loadSmoothQuality,
  qualityFromSmooth,
  qualityLabel,
  saveSmoothQuality,
} from "@/lib/chat-quality";
import {
  Loader2,
  Send,
  Sparkles,
  Bot,
  Paperclip,
  Pencil,
  Square,
  ChevronDown,
  Trash2,
  ImagePlus,
  Volume2,
  Mic,
  X,
} from "lucide-react";
import {
  filesToModelBlock,
  prepareChatFile,
  type PreparedChatFile,
} from "@/lib/chat-files";
import {
  companionDirective,
  speakAsAvatar,
  type SpicyAvatar,
} from "@/lib/spicy-avatars";
import { spicyImageUrl, spicyScenePrompt } from "@/lib/spicy-media";
import {
  botChatKey,
  botSystemForChat,
  type ChatBot,
} from "@/lib/chat-bots";
import { SelectModelMenu } from "@/components/SelectModelMenu";

const HISTORY_KEY = "plethora.chat.history.v1";
const SPICY_HISTORY_KEY = "plethora.spicy.history.v1";

export function ChatMode({
  embedded = false,
  initialPrompt,
  onClearHistory,
  room = "main",
  companion = null,
  bot = null,
  historyKey,
  hideHero = false,
  onHistoryChange,
}: {
  embedded?: boolean;
  initialPrompt?: string;
  onClearHistory?: () => void;
  room?: "main" | "spicy";
  companion?: SpicyAvatar | null;
  /** Named Grok-style character bot — dedicated room history + system prompt. */
  bot?: ChatBot | null;
  /** Override localStorage key (LibreChat-style threads). */
  historyKey?: string;
  hideHero?: boolean;
  onHistoryChange?: (messages: ChatMessage[]) => void;
}) {
  const router = useRouter();
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
  const abortRef = useRef<AbortController | null>(null);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [qualitySmooth, setQualitySmooth] = useState(50);
  const [unrestricted, setUnrestricted] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PreparedChatFile[]>([]);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickBottom = useRef(true);

  const histKey = bot
    ? botChatKey(bot.id)
    : room === "spicy"
      ? companion?.id
        ? `plethora.spicy.history.${companion.id}`
        : SPICY_HISTORY_KEY
      : historyKey || HISTORY_KEY;
  const spicy = room === "spicy" || Boolean(bot?.adultOnly);

  function clearChat() {
    setMessages([
      newMessage(
        "assistant",
        bot?.hello ||
          (companion
            ? `Hey — I’m ${companion.name}. ${companion.traits || "Tell me how you want me."}`
            : openingMessage(spicy ? "spicy" : personality))
      ),
    ]);
    try {
      localStorage.removeItem(histKey);
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
      if (bot?.adultOnly || spicy) {
        setPersonality("spicy");
        const adult = loadAdultSession();
        setAdultSession(bot?.adultOnly ? true : adult);
        if (bot?.adultOnly && !adult) saveAdultSession();
      } else if (bot) {
        setPersonality(null);
        setAdultSession(loadAdultSession());
      } else {
        setPersonality(loadChatPersonality());
        setAdultSession(loadAdultSession());
      }
      setQualitySmooth(loadSmoothQuality());
    } catch {
      /* */
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
  }, [spicy]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(histKey);
      if (raw) setMessages(JSON.parse(raw));
      else {
        const hello = bot
          ? bot.hello
          : companion
            ? `Hey — I’m ${companion.name}. ${companion.traits || "Tell me how you want me."}`
            : openingMessage(spicy ? "spicy" : loadChatPersonality());
        setMessages([newMessage("assistant", hello)]);
      }
    } catch {
      /* ignore */
    }
  }, [histKey, spicy, bot, companion]);

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

  const histKeyRef = useRef(histKey);

  useEffect(() => {
    if (histKeyRef.current !== histKey) {
      histKeyRef.current = histKey;
      return;
    }
    if (messages.length) localStorage.setItem(histKey, JSON.stringify(messages.slice(-120)));
    onHistoryChange?.(messages);
    if (!stickBottom.current) return;
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, histKey]);

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
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const coach = !spicy && !bot ? coachForGoal(text) : null;
      if (coach) {
        startCoach(coach.steps);
        setMessages((m) => [...m, newMessage("assistant", coach.reply)]);
        setLoading(false);
        return;
      }

      if (!spicy && !bot && classifyChatIntent(text) === "tour") {
        startProductTour();
        setMessages((m) => [...m, newMessage("assistant", TOUR_CHAT_OPENING)]);
        setLoading(false);
        return;
      }

      const priorUsers = messages.filter((m) => m.role === "user").map((m) => m.content);
      const assistantDumpedCode = messages.some(
        (m) => m.role === "assistant" && /```|<!DOCTYPE|<html[\s>]/i.test(m.content)
      );
      const appAsk =
        !spicy &&
        !bot &&
        (wantsMiniApp(text) ||
          (isMiniAppNudge(text) && (priorUsers.some(wantsMiniApp) || assistantDumpedCode)));

      if (appAsk) {
        const brief = [...priorUsers, text].join("\n");
        stashAppMakerIntake({ need: brief.slice(0, 2000) });
        startCoach(APP_MAKER_STEPS);
        router.push("/tools/build-your-tool");
        const note = newMessage(
          "assistant",
          "Apps aren’t built in this chat. **AI App Maker** is open — what it should do, your custom prompt, then a few Plethora questions. After **Create web app**, that page is only a modification chat + live preview."
        );
        if (!adultConsent) {
          setMessages((m) => [...m, note]);
          setLoading(false);
          return;
        }
        setMessages((m) => [...m, note]);
      }

      if (adultConsent) {
        saveAdultSession();
        setAdultSession(true);
      }

      const draft = newMessage("assistant", "");
      setMessages((m) => [...m, draft]);
      const llmText = [
        companion ? companionDirective(companion) : "",
        appAsk
          ? `${outbound}\n\n[They are building the app in /tools/build-your-tool now. Do not output HTML or source. Short in-character only.]`
          : outbound,
      ]
        .filter(Boolean)
        .join("\n\n");
      const reply = await generateAssistantReply(llmText, next, {
        adultConsent,
        personality: bot ? null : personality,
        customSystem: bot ? botSystemForChat(bot) : undefined,
        quality: qualityFromSmooth(qualitySmooth),
        qualitySmooth,
        signal: ac.signal,
        onDelta: (chunk) => {
          if (/```|<!DOCTYPE|<html[\s>]/i.test(chunk)) return;
          setMessages((m) =>
            m.map((x) =>
              x.id === draft.id ? { ...x, content: x.content + chunk } : x
            )
          );
        },
      });
      const cleaned = stripDumpedCode(reply || "");
      setMessages((m) =>
        m.map((x) => (x.id === draft.id ? { ...x, content: cleaned || x.content } : x))
      );
      if (loadPersonalContext().enabled && text.length > 20) {
        appendPattern(`Talked about: ${text.slice(0, 120)}`);
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        /* stopped */
      } else {
        setMessages((m) => [
          ...m,
          newMessage("assistant", "Something went wrong. Try again in a moment."),
        ]);
      }
    }
    setLoading(false);
    abortRef.current = null;
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
      if (!spicy) saveChatPersonality(picked);
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
        room,
      }),
    [lastUserText, lastAssistant?.content, personality, pickingPersonality, adultSession, room]
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
    <div
      className={
        embedded || hideHero
          ? "flex h-full min-h-0 flex-col overflow-hidden"
          : "mx-auto max-w-3xl"
      }
    >
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

      {!embedded && !bot && !hideHero && (
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
            <Link
              href="/projects"
              className="rounded-full border border-violet-500/40 bg-violet-500/15 px-4 py-1.5 text-sm font-medium text-violet-100 hover:bg-violet-500/25"
            >
              Projects
            </Link>
            <Link
              href="/tools/build-your-tool"
              className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
            >
              App Maker
            </Link>
            <Link
              href="/bots"
              className="rounded-full border border-violet-500/40 bg-violet-500/15 px-4 py-1.5 text-sm font-medium text-violet-100 hover:bg-violet-500/25"
            >
              Bots
            </Link>
            <Link
              href="/game-director"
              className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
            >
              Game Director
            </Link>
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
        className={`flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b14] shadow-[0_24px_80px_-32px_rgba(109,40,217,0.45)] ${
          embedded || hideHero ? "h-full min-h-0 flex-1 rounded-none border-0 shadow-none sm:rounded-none" : "min-h-[520px]"
        }`}
      >
        <div className="flex items-center gap-2 overflow-x-auto border-b border-white/5 px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {bot ? (
            <>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600/40 text-sm text-violet-100">
                {bot.glyph}
              </span>
              <span className="shrink-0 text-sm font-medium text-white">{bot.name}</span>
              <span className="hidden max-w-[14rem] shrink truncate text-[11px] text-zinc-500 sm:inline">
                {bot.tagline}
              </span>
              {bot.adultOnly ? (
                <span className="shrink-0 rounded-full bg-rose-600/80 px-2 py-0.5 text-[10px] text-white">
                  18+
                </span>
              ) : null}
              <Link
                href="/bots"
                className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 hover:text-white"
              >
                All bots
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
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
        <div
          ref={scrollerRef}
          onScroll={() => {
            const el = scrollerRef.current;
            if (!el) return;
            stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
          }}
          className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain bg-[radial-gradient(1200px_400px_at_10%_-10%,rgba(124,58,237,0.12),transparent_50%)] p-4 sm:p-6"
        >
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
                  {m.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.imageUrl}
                      alt=""
                      className="mt-2 max-h-72 w-full rounded-xl object-cover"
                    />
                  ) : null}
                  {m.project && <ProjectCard slug={m.project.slug} title={m.project.title} />}
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
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="min-w-0 text-[11px] text-zinc-500">{quotaNote}</p>
            <div className="flex shrink-0 items-center gap-2">
              {!spicy ? (
                <SelectModelMenu
                  zenConfigured={zenConfigured}
                  openrouterConfigured={openrouterConfigured}
                  connectedLabel={subscriptionOn ? "Connected" : undefined}
                  anchor="up"
                />
              ) : null}
            <QualityMenu
              value={qualitySmooth}
              open={qualityOpen}
              onOpen={setQualityOpen}
              onChange={(n) => {
                setQualitySmooth(n);
                saveSmoothQuality(n);
                setQualityOpen(false);
              }}
            />
            </div>
          </div>
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
            {spicy ? (
              <>
                <button
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-zinc-300 hover:bg-white/5"
                  aria-label="Generate scene image"
                  title="Generate a scene image from the last reply (Flux via Pollinations)"
                  onClick={() => {
                    const last = [...messages].reverse().find((x) => x.role === "assistant");
                    if (!last) return;
                    const url = spicyImageUrl(
                      spicyScenePrompt(companion?.look || "", last.content.slice(0, 240))
                    );
                    setMessages((ms) =>
                      ms.map((x) => (x.id === last.id ? { ...x, imageUrl: url } : x))
                    );
                  }}
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-zinc-300 hover:bg-white/5"
                  aria-label="Speak last reply"
                  title="Speak last reply in this avatar’s voice"
                  onClick={() => {
                    const last = [...messages].reverse().find((m) => m.role === "assistant");
                    if (last?.content) speakAsAvatar(last.content, companion?.voice || "warm-f");
                  }}
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 text-zinc-300 hover:bg-white/5"
                  aria-label="Talk"
                  title="Talk — fills the box (browser speech)"
                  onClick={() => {
                    const W = window as unknown as {
                      webkitSpeechRecognition?: new () => {
                        lang: string;
                        start: () => void;
                        onresult:
                          | ((e: {
                              results: { 0?: { 0?: { transcript?: string } } };
                            }) => void)
                          | null;
                      };
                      SpeechRecognition?: new () => {
                        lang: string;
                        start: () => void;
                        onresult:
                          | ((e: {
                              results: { 0?: { 0?: { transcript?: string } } };
                            }) => void)
                          | null;
                      };
                    };
                    const Ctor = W.webkitSpeechRecognition || W.SpeechRecognition;
                    if (!Ctor) return;
                    const rec = new Ctor();
                    rec.lang = "en-US";
                    rec.onresult = (e) => {
                      const t = e.results[0]?.[0]?.transcript;
                      if (t) setInput((cur) => (cur ? `${cur} ${t}` : t));
                    };
                    rec.start();
                  }}
                >
                  <Mic className="h-4 w-4" />
                </button>
              </>
            ) : null}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={(e) => {
                const files = e.clipboardData?.files;
                if (files && files.length) {
                  e.preventDefault();
                  void onPickFiles(files);
                }
              }}
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
                  : "Say anything, paste or attach a file…"
              }
              className="max-h-32 min-h-[46px] flex-1 resize-none overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            />
            {loading ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-200 text-zinc-900 hover:bg-white"
                aria-label="Stop generating"
                title="Stop"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
            <button
              type="button"
              onClick={() => void sendText(input)}
              disabled={!input.trim() && pendingFiles.length === 0}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Lightweight formatting — bold, *actions*, line breaks. */
function stripDumpedCode(text: string): string {
  return text
    .replace(/```[\s\S]*$/g, "")
    .replace(/<!DOCTYPE[\s\S]*/gi, "")
    .replace(/<html[\s\S]*/gi, "")
    .trim();
}

function ProjectCard({ slug, title }: { slug: string; title: string }) {
  const href = projectPath(slug);
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-violet-500/30 bg-violet-500/10">
      <p className="px-3 pt-2 text-[11px] uppercase tracking-wide text-violet-200/80">Live app</p>
      <p className="px-3 text-sm font-semibold text-white">{title}</p>
      <p className="px-3 text-[11px] text-zinc-400">/projects/{slug}</p>
      <div className="mt-2 flex gap-2 border-t border-white/10 px-3 py-2">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
        >
          Open window
        </a>
        <Link href={href} className="rounded-lg px-3 py-1.5 text-xs text-violet-200 hover:underline">
          Open here
        </Link>
      </div>
    </div>
  );
}

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

function QualityMenu({
  value,
  open,
  onOpen,
  onChange,
}: {
  value: number;
  open: boolean;
  onOpen: (v: boolean) => void;
  onChange: (n: number) => void;
}) {
  const band = qualityFromSmooth(value);
  const options: { n: number; label: string; hint: string }[] = [
    { n: 18, label: "Faster", hint: "Snappy replies" },
    { n: 50, label: "Balanced", hint: "Default" },
    { n: 92, label: "Best", hint: "Roleplay, code, long answers" },
  ];
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => onOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-zinc-200 hover:border-violet-500/40"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {qualityLabel(band)}
        <ChevronDown className="h-3 w-3 text-zinc-500" />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute bottom-full right-0 z-20 mb-1.5 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#12121c] py-1 shadow-xl shadow-black/50"
        >
          {options.map((o) => (
            <li key={o.n}>
              <button
                type="button"
                role="option"
                aria-selected={qualityFromSmooth(value) === qualityFromSmooth(o.n)}
                onClick={() => onChange(o.n)}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-white/[0.06]"
              >
                <span className="text-xs text-white">{o.label}</span>
                <span className="text-[10px] text-zinc-500">{o.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
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
