/** Scout store — reads Relay workspace + shared taskbot inbox from Plethora Office userData */

export type ScoutItemType = "task" | "note" | "screenshot" | "mention";

export type ScoutItem = {
  id: string;
  type: ScoutItemType;
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
  forHandle?: string;
  aiGenerated?: boolean;
};

export type ScoutState = {
  items: ScoutItem[];
  lastScanAt?: number;
  autoScan: boolean;
};

type RelayMessage = {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  ts: number;
  mentions?: string[];
  attachments?: { kind: string; dataUrl: string; name: string }[];
};

type RelayWorkspace = {
  channels: { id: string; name: string }[];
  users: { id: string; name: string }[];
  messages: RelayMessage[];
};

const TASKBOT_KEY = "plethora.taskbot.v1";
const INBOX_KEY = "plethora.taskbot.inbox.v1";
const RELAY_KEY = "plethora.slack.v2";
const RELAY_LEGACY = "plethora.slack.v1";
const PROFILE_KEY = "plethora.slack.profile.v1";

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as { handle: string; displayName: string };
  } catch {
    /* */
  }
  return { handle: "you", displayName: "You" };
}

export function loadRelayWorkspace(): RelayWorkspace | null {
  try {
    const raw = localStorage.getItem(RELAY_KEY) || localStorage.getItem(RELAY_LEGACY);
    if (raw) return JSON.parse(raw) as RelayWorkspace;
  } catch {
    /* */
  }
  return null;
}

export function loadScout(): ScoutState {
  try {
    const raw = localStorage.getItem(TASKBOT_KEY);
    if (raw) return JSON.parse(raw) as ScoutState;
  } catch {
    /* */
  }
  return { items: [], autoScan: true };
}

export function saveScout(state: ScoutState) {
  localStorage.setItem(TASKBOT_KEY, JSON.stringify(state));
}

/** Merge @mention inbox pushed by Relay into Scout items */
export function syncInboxFromRelay(state: ScoutState): ScoutState {
  const profile = loadProfile();
  const myHandle = profile.handle.toLowerCase();
  try {
    const raw = localStorage.getItem(INBOX_KEY);
    if (!raw) return state;
    const inbox = JSON.parse(raw) as {
      id: string;
      text: string;
      createdAt: number;
      source: { channelName: string; authorName: string; messageId: string };
      forHandle: string;
    }[];
    let items = [...state.items];
    for (const row of inbox) {
      if (row.forHandle?.toLowerCase() !== myHandle) continue;
      if (items.some((i) => i.type === "mention" && i.source.messageId === row.source.messageId)) continue;
      items.unshift({
        id: row.id,
        type: "mention",
        text: row.text,
        status: "open",
        createdAt: row.createdAt,
        source: {
          channelId: "",
          channelName: row.source.channelName,
          messageId: row.source.messageId,
          authorName: row.source.authorName,
        },
        forHandle: myHandle,
      });
    }
    return { ...state, items: items.slice(0, 500) };
  } catch {
    return state;
  }
}

export function itemsForTab(
  state: ScoutState,
  tab: "all" | "tasks" | "notes" | "screenshots" | "mentions"
): ScoutItem[] {
  const myHandle = loadProfile().handle.toLowerCase();
  switch (tab) {
    case "tasks":
      return state.items.filter((i) => i.type === "task");
    case "notes":
      return state.items.filter((i) => i.type === "note");
    case "screenshots":
      return state.items.filter((i) => i.type === "screenshot");
    case "mentions":
      return state.items.filter(
        (i) => i.type === "mention" || (i.forHandle?.toLowerCase() === myHandle && i.type !== "screenshot")
      );
    default:
      return state.items;
  }
}

export function toggleItemDone(state: ScoutState, id: string): ScoutState {
  return {
    ...state,
    items: state.items.map((i) => (i.id === id ? { ...i, status: i.status === "open" ? "done" : "open" } : i)),
  };
}

export function removeItem(state: ScoutState, id: string): ScoutState {
  return { ...state, items: state.items.filter((i) => i.id !== id) };
}

function channelName(ws: RelayWorkspace, channelId: string) {
  return ws.channels.find((c) => c.id === channelId)?.name || channelId;
}

function authorName(ws: RelayWorkspace, userId: string) {
  return ws.users.find((u) => u.id === userId)?.name || "Someone";
}

type AiRow = {
  type?: string;
  text?: string;
  assignee?: string;
  priority?: string;
  due?: string;
  tags?: string[];
  messageId?: string;
};

export async function scanRelayWithAi(
  runAi: (msg: string, system: string) => Promise<string>,
  opts?: { limit?: number }
): Promise<{ state: ScoutState; note: string }> {
  const ws = loadRelayWorkspace();
  if (!ws?.messages.length) {
    return { state: loadScout(), note: "Open Relay and chat first — no messages to scan." };
  }

  const profile = loadProfile();
  const limit = opts?.limit ?? 50;
  const msgs = ws.messages.slice(-limit);
  const transcript = msgs
    .map((m) => {
      const ch = channelName(ws, m.channelId);
      const who = authorName(ws, m.userId);
      return `#${ch} | ${who} | msg:${m.id} | ${m.text}`;
    })
    .join("\n");

  const system = `You are Scout for Plethora Relay (not Slack). Extract actionable items.
Return ONLY a JSON array. Each object:
{ "type": "task"|"note", "text": string, "assignee"?: string, "priority"?: "low"|"normal"|"high", "due"?: string, "tags"?: string[], "messageId": string }
Max 12 items. User handle: @${profile.handle}`;

  const raw = await runAi(`Scan this chat:\n\n${transcript}`, system);
  let state = syncInboxFromRelay(loadScout());
  let rows: AiRow[] = [];

  try {
    const match = raw.trim().match(/\[[\s\S]*\]/);
    if (match) rows = JSON.parse(match[0]) as AiRow[];
  } catch {
    return { state, note: "AI returned no parseable JSON — connect BYOK in Settings." };
  }

  const msgById = new Map(msgs.map((m) => [m.id, m]));
  let added = 0;

  for (const row of rows.slice(0, 12)) {
    if (!row.text?.trim()) continue;
    const type = row.type === "task" ? "task" : "note";
    const msg = row.messageId ? msgById.get(row.messageId) : msgs[msgs.length - 1];
    if (!msg) continue;

    const fp = `${type}:${msg.id}:${row.text.slice(0, 80)}`;
    if (state.items.some((i) => i.aiGenerated && `${i.type}:${i.source.messageId}:${i.text.slice(0, 80)}` === fp)) {
      continue;
    }

    state = {
      ...state,
      items: [
        {
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
        },
        ...state.items,
      ],
    };
    added++;
  }

  state = { ...state, lastScanAt: Date.now(), items: state.items.slice(0, 500) };
  saveScout(state);
  return { state, note: added ? `Scout captured ${added} item(s).` : "Nothing new to capture." };
}
