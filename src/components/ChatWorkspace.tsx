"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  MessageSquare,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { ChatMode } from "@/components/ChatMode";
import { PLETHORA_BOTS } from "@/lib/chat-bots";
import { loadCustomAssistants } from "@/lib/custom-assistants";
import {
  createThread,
  deleteThread,
  ensureActiveThread,
  loadThreads,
  setActiveThreadId,
  threadCap,
  threadStorageKey,
  touchThread,
  type ChatThreadMeta,
} from "@/lib/chat-conversations";
import type { ChatMessage } from "@/lib/assistant-brain";
import type { PlanId } from "@/lib/plans";
import { parsePlanId } from "@/lib/plans";

export function ChatWorkspace() {
  const [threads, setThreads] = useState<ChatThreadMeta[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState<PlanId | "guest">("guest");
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);

  const cap = threadCap(plan);

  const refresh = useCallback(() => {
    const t = ensureActiveThread();
    setThreads(loadThreads());
    setActiveId(t.id);
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
    setAgents(loadCustomAssistants().slice(0, 6));
    void fetch("/api/chat", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { signedIn?: boolean; entitlement?: { plan?: string } }) => {
        if (!d.signedIn) setPlan("guest");
        else setPlan(parsePlanId(d.entitlement?.plan));
      })
      .catch(() => setPlan("guest"));
  }, [refresh]);

  const visible = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return threads;
    return threads.filter(
      (t) => t.title.toLowerCase().includes(s) || t.preview.toLowerCase().includes(s)
    );
  }, [threads, q]);

  function newChat() {
    if (threads.length >= cap) {
      setNote(`Thread cap (${cap}) on this plan. Delete one or upgrade Office / Pro.`);
      return;
    }
    setNote("");
    const t = createThread();
    setThreads(loadThreads());
    setActiveId(t.id);
  }

  function pick(id: string) {
    setActiveThreadId(id);
    setActiveId(id);
  }

  function remove(id: string) {
    deleteThread(id);
    refresh();
  }

  function onHistoryChange(messages: ChatMessage[]) {
    if (!activeId) return;
    touchThread(activeId, messages);
    setThreads(loadThreads());
  }

  const bots = PLETHORA_BOTS.filter((b) => !b.adultOnly).slice(0, 6);

  if (!ready || !activeId) {
    return <p className="p-6 text-sm text-zinc-500">Loading chat…</p>;
  }

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-[min(100%,17.5rem)] shrink-0 flex-col border-r border-white/10 bg-[#0a0a12]">
        <div className="border-b border-white/10 p-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-violet-400">
            Plethora Chat
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Threads, models, agents — inspired by LibreChat, not LibreChat.
          </p>
          <button
            type="button"
            onClick={newChat}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-2 text-sm text-white hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" /> New chat
          </button>
          <label className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-zinc-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search chats"
              className="w-full bg-transparent text-xs text-white placeholder:text-zinc-600 focus:outline-none"
            />
          </label>
          {note ? <p className="mt-2 text-[11px] text-amber-200">{note}</p> : null}
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {visible.map((t) => (
            <li key={t.id}>
              <div
                className={`group flex items-start gap-1 rounded-xl px-2 py-2 ${
                  t.id === activeId ? "bg-violet-600/20" : "hover:bg-white/5"
                }`}
              >
                <button type="button" onClick={() => pick(t.id)} className="min-w-0 flex-1 text-left">
                  <p className="flex items-center gap-1 truncate text-sm text-white">
                    <MessageSquare className="h-3 w-3 shrink-0 text-zinc-500" />
                    {t.title}
                  </p>
                  {t.preview ? (
                    <p className="mt-0.5 truncate text-[11px] text-zinc-500">{t.preview}</p>
                  ) : null}
                </button>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100"
                  aria-label="Delete chat"
                  onClick={() => remove(t.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-zinc-500" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 p-3">
          <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            <Bot className="h-3 w-3" /> Agents
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {bots.map((b) => (
              <Link
                key={b.id}
                href={`/bots/${b.id}`}
                className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-zinc-300 hover:text-white"
              >
                {b.glyph} {b.name}
              </Link>
            ))}
            {agents.map((a) => (
              <Link
                key={a.id}
                href="/tools/custom-assistant"
                className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-zinc-400"
              >
                {a.name}
              </Link>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-zinc-600">
            {threads.length}/{cap} threads ·{" "}
            <Link href="/pricing#office" className="text-violet-400 hover:underline">
              Office plans
            </Link>
          </p>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <ChatMode
          key={activeId}
          hideHero
          historyKey={threadStorageKey(activeId)}
          onHistoryChange={onHistoryChange}
        />
      </div>
    </div>
  );
}
