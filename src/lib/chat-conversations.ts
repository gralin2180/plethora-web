/**
 * LibreChat-style local threads. Not LibreChat — browser-only until cloud sync.
 */

import type { ChatMessage } from "./assistant-brain";
import { getPlanCapabilities, type PlanId } from "./plans";

export type ChatThreadMeta = {
  id: string;
  title: string;
  updatedAt: string;
  preview: string;
};

const INDEX_KEY = "plethora.chat.threads.v1";
const ACTIVE_KEY = "plethora.chat.active.v1";
export const LEGACY_CHAT_KEY = "plethora.chat.history.v1";

export function threadStorageKey(id: string) {
  return `plethora.chat.thread.${id}.v1`;
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `t_${Date.now()}`;
}

export function loadThreads(): ChatThreadMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as ChatThreadMeta[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveThreads(list: ChatThreadMeta[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(INDEX_KEY, JSON.stringify(list.slice(0, 400)));
}

export function getActiveThreadId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveThreadId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function loadThreadMessages(id: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(threadStorageKey(id));
    if (!raw) return [];
    const list = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function titleFromMessages(messages: ChatMessage[]): string {
  const u = messages.find((m) => m.role === "user" && m.content.trim());
  if (!u) return "New chat";
  const t = u.content.replace(/\s+/g, " ").trim().slice(0, 48);
  return t || "New chat";
}

export function previewFromMessages(messages: ChatMessage[]): string {
  const last = [...messages].reverse().find((m) => m.content.trim());
  return (last?.content || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function touchThread(id: string, messages: ChatMessage[]) {
  const list = loadThreads();
  const i = list.findIndex((t) => t.id === id);
  const meta: ChatThreadMeta = {
    id,
    title: titleFromMessages(messages),
    updatedAt: new Date().toISOString(),
    preview: previewFromMessages(messages),
  };
  if (i >= 0) list[i] = meta;
  else list.unshift(meta);
  list.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  saveThreads(list);
}

export function deleteThread(id: string) {
  saveThreads(loadThreads().filter((t) => t.id !== id));
  try {
    localStorage.removeItem(threadStorageKey(id));
  } catch {
    /* */
  }
  const active = getActiveThreadId();
  if (active === id) {
    const next = loadThreads()[0];
    if (next) setActiveThreadId(next.id);
    else localStorage.removeItem(ACTIVE_KEY);
  }
}

export function createThread(): ChatThreadMeta {
  const meta: ChatThreadMeta = {
    id: uid(),
    title: "New chat",
    updatedAt: new Date().toISOString(),
    preview: "",
  };
  saveThreads([meta, ...loadThreads()]);
  setActiveThreadId(meta.id);
  return meta;
}

/** One-time: lift the old single-history key into a thread. */
export function migrateLegacyThread(): ChatThreadMeta | null {
  if (typeof window === "undefined") return null;
  if (loadThreads().length) return null;
  try {
    const raw = localStorage.getItem(LEGACY_CHAT_KEY);
    if (!raw) return null;
    const messages = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(messages) || messages.length === 0) return null;
    const meta = createThread();
    localStorage.setItem(threadStorageKey(meta.id), JSON.stringify(messages.slice(-120)));
    touchThread(meta.id, messages);
    return meta;
  } catch {
    return null;
  }
}

export function ensureActiveThread(): ChatThreadMeta {
  migrateLegacyThread();
  const existing = loadThreads();
  const active = getActiveThreadId();
  const hit = existing.find((t) => t.id === active);
  if (hit) return hit;
  if (existing[0]) {
    setActiveThreadId(existing[0].id);
    return existing[0];
  }
  return createThread();
}

export function threadCap(plan: PlanId | "guest" = "free"): number {
  if (plan === "guest") return 8;
  return getPlanCapabilities(plan).maxChatThreads;
}
