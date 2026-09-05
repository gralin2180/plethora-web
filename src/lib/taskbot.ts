/**
 * Taskbot — watches Plethora Slack, extracts tasks/notes/screenshots/@mentions.
 */

import type { SlackMessage, SlackWorkspace } from "./plethora-slack";
import { loadSlackProfile } from "./plethora-slack";
import { runPlatformAi } from "./platform-ai-client";

export type TaskbotItemType = "task" | "note" | "screenshot" | "mention";

export type TaskbotItem = {
  id: string;
  type: TaskbotItemType;
  text: string;
  status: "open" | "done";
  createdAt: number;
  source: {
    channelId: string;
    channelName: string;
    messageId: string;
    authorName: string;
  };
  assignee?: string;
  priority?: "low" | "normal" | "high";
  due?: string;
  tags?: string[];
  imageDataUrl?: string;
  /** Lowercase handle this item is for (@you inbox) */
  forHandle?: string;
  aiGenerated?: boolean;
};

export type TaskbotState = {
  items: TaskbotItem[];
  lastScanAt?: number;
  autoScan: boolean;
};

const STORAGE = "plethora.taskbot.v1";

export function loadTaskbot(): TaskbotState {
  if (typeof window === "undefined") {
    return { items: [], autoScan: true };
  }
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw) as TaskbotState;
  } catch {
    /* */
  }
  return { items: [], autoScan: true };
}

export function saveTaskbot(state: TaskbotState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("plethora:taskbot-updated"));
  } catch {
    /* */
  }
}

function channelName(ws: SlackWorkspace, channelId: string): string {
  return ws.channels.find((c) => c.id === channelId)?.name || channelId;
}

function authorName(ws: SlackWorkspace, userId: string): string {
  return ws.users.find((u) => u.id === userId)?.name || "Someone";
}

/** Immediate @mention capture — no AI needed */
export function ingestMentionsFromMessage(
  state: TaskbotState,
  ws: SlackWorkspace,
  msg: SlackMessage
): TaskbotState {
  const profile = loadSlackProfile();
  const myHandle = profile.handle.toLowerCase();
  const mentions = msg.mentions || [];
  if (!mentions.some((m) => m.toLowerCase() === myHandle)) return state;

  const dup = state.items.some(
    (i) => i.type === "mention" && i.source.messageId === msg.id && i.forHandle === myHandle
  );
  if (dup) return state;

  const item: TaskbotItem = {
    id: crypto.randomUUID(),
    type: "mention",
    text: msg.text,
    status: "open",
    createdAt: msg.ts,
    source: {
      channelId: msg.channelId,
      channelName: channelName(ws, msg.channelId),
      messageId: msg.id,
      authorName: authorName(ws, msg.userId),
    },
    forHandle: myHandle,
    imageDataUrl: msg.attachments?.find((a) => a.kind === "image")?.dataUrl,
  };

  return { ...state, items: [item, ...state.items].slice(0, 500) };
}

/** Screenshot attachments become Taskbot items */
export function ingestScreenshotsFromMessage(
  state: TaskbotState,
  ws: SlackWorkspace,
  msg: SlackMessage
): TaskbotState {
  const images = msg.attachments?.filter((a) => a.kind === "image") || [];
  if (!images.length) return state;

  let next = state;
  for (const img of images) {
    const dup = next.items.some(
      (i) => i.type === "screenshot" && i.source.messageId === msg.id && i.imageDataUrl === img.dataUrl
    );
    if (dup) continue;
    const item: TaskbotItem = {
      id: crypto.randomUUID(),
      type: "screenshot",
      text: msg.text || img.name,
      status: "open",
      createdAt: msg.ts,
      source: {
        channelId: msg.channelId,
        channelName: channelName(ws, msg.channelId),
        messageId: msg.id,
        authorName: authorName(ws, msg.userId),
      },
      imageDataUrl: img.dataUrl,
      tags: ["screenshot"],
    };
    next = { ...next, items: [item, ...next.items] };
  }
  return { ...next, items: next.items.slice(0, 500) };
}

export function syncMessageToTaskbot(ws: SlackWorkspace, msg: SlackMessage): TaskbotState {
  let state = loadTaskbot();
  state = ingestMentionsFromMessage(state, ws, msg);
  state = ingestScreenshotsFromMessage(state, ws, msg);
  saveTaskbot(state);
  return state;
}

type AiExtractRow = {
  type?: string;
  text?: string;
  assignee?: string;
  priority?: string;
  due?: string;
  tags?: string[];
  messageId?: string;
};

export async function scanSlackWithAi(
  ws: SlackWorkspace,
  opts?: { channelId?: string; limit?: number }
): Promise<{ state: TaskbotState; note: string }> {
  const profile = loadSlackProfile();
  const limit = opts?.limit ?? 40;
  let msgs = ws.messages.slice(-limit);
  if (opts?.channelId) msgs = msgs.filter((m) => m.channelId === opts.channelId);

  if (!msgs.length) {
    return { state: loadTaskbot(), note: "No messages to scan." };
  }

  const transcript = msgs
    .map((m) => {
      const ch = channelName(ws, m.channelId);
      const who = authorName(ws, m.userId);
      const att = m.attachments?.length ? ` [${m.attachments.length} attachment(s)]` : "";
      return `#${ch} | ${who} | msg:${m.id} | ${m.text}${att}`;
    })
    .join("\n");

  const system = `You are Taskbot for Plethora Slack (not Slack). Extract actionable items from team chat.
Return ONLY a JSON array (no markdown). Each object:
{ "type": "task"|"note", "text": string, "assignee"?: string, "priority"?: "low"|"normal"|"high", "due"?: string, "tags"?: string[], "messageId": string }

Rules:
- "task" = something someone should do, with optional assignee from @handles in the message
- "note" = important decision, deadline, or fact worth saving
- Skip jokes and pure banter
- messageId must match an id from the transcript
- Max 12 items
Current user handle: @${profile.handle}`;

  const r = await runPlatformAi(`Scan this chat transcript:\n\n${transcript}`, {
    customSystem: system,
    toolJob: true,
    maxTokens: 1800,
  });

  let state = loadTaskbot();
  const raw = (r.reply || "").trim();
  let rows: AiExtractRow[] = [];

  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) rows = JSON.parse(jsonMatch[0]) as AiExtractRow[];
  } catch {
    return { state, note: r.code || "AI returned no parseable JSON — connect AI or BYOK." };
  }

  const msgById = new Map(msgs.map((m) => [m.id, m]));
  let added = 0;

  for (const row of rows.slice(0, 12)) {
    if (!row.text?.trim()) continue;
    const type = row.type === "task" ? "task" : "note";
    const msgId = row.messageId || msgs[msgs.length - 1]?.id;
    const msg = msgId ? msgById.get(msgId) : undefined;
    if (!msg) continue;

    const fingerprint = `${type}:${msg.id}:${row.text.slice(0, 80)}`;
    if (state.items.some((i) => i.aiGenerated && `${i.type}:${i.source.messageId}:${i.text.slice(0, 80)}` === fingerprint)) {
      continue;
    }

    const item: TaskbotItem = {
      id: crypto.randomUUID(),
      type,
      text: row.text.trim(),
      status: "open",
      createdAt: Date.now(),
      source: {
        channelId: msg.channelId,
        channelName: channelName(ws, msg.channelId),
        messageId: msg.id,
        authorName: authorName(ws, msg.userId),
      },
      assignee: row.assignee?.replace(/^@/, ""),
      priority:
        row.priority === "high" || row.priority === "low" || row.priority === "normal"
          ? row.priority
          : "normal",
      due: row.due,
      tags: row.tags,
      aiGenerated: true,
      forHandle:
        row.assignee?.replace(/^@/, "").toLowerCase() === profile.handle.toLowerCase()
          ? profile.handle.toLowerCase()
          : undefined,
    };
    state = { ...state, items: [item, ...state.items] };
    added++;
  }

  state = { ...state, lastScanAt: Date.now(), items: state.items.slice(0, 500) };
  saveTaskbot(state);
  return { state, note: added ? `Taskbot added ${added} item(s).` : "Nothing new to capture." };
}

export function itemsForTab(
  state: TaskbotState,
  tab: "all" | "tasks" | "notes" | "screenshots" | "mentions"
): TaskbotItem[] {
  const profile = loadSlackProfile();
  const myHandle = profile.handle.toLowerCase();

  switch (tab) {
    case "tasks":
      return state.items.filter((i) => i.type === "task");
    case "notes":
      return state.items.filter((i) => i.type === "note");
    case "screenshots":
      return state.items.filter((i) => i.type === "screenshot");
    case "mentions":
      return state.items.filter(
        (i) =>
          i.type === "mention" ||
          (i.forHandle?.toLowerCase() === myHandle && i.type !== "screenshot")
      );
    default:
      return state.items;
  }
}

export function toggleItemDone(state: TaskbotState, id: string): TaskbotState {
  return {
    ...state,
    items: state.items.map((i) => (i.id === id ? { ...i, status: i.status === "open" ? "done" : "open" } : i)),
  };
}

export function removeItem(state: TaskbotState, id: string): TaskbotState {
  return { ...state, items: state.items.filter((i) => i.id !== id) };
}
