export type SlackUser = {
  id: string;
  name: string;
  handle: string;
  color: string;
  isBot?: boolean;
};

export type SlackAttachment = {
  id: string;
  kind: "image";
  name: string;
  dataUrl: string;
};

export type SlackReaction = {
  emoji: string;
  userIds: string[];
};

export type SlackMessage = {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  ts: number;
  attachments?: SlackAttachment[];
  mentions?: string[];
  reactions?: SlackReaction[];
};

export type SlackChannel = {
  id: string;
  name: string;
  topic?: string;
  starred?: boolean;
};

export type SlackDm = {
  id: string;
  userId: string;
};

export type SlackWorkspace = {
  id: string;
  name: string;
  users: SlackUser[];
  channels: SlackChannel[];
  dms: SlackDm[];
  messages: SlackMessage[];
  lastRead: Record<string, number>;
};

export type SlackProfile = {
  userId: string;
  handle: string;
  displayName: string;
};

export type ConversationTarget =
  | { kind: "channel"; id: string }
  | { kind: "dm"; id: string };

const STORAGE = "plethora.slack.v2";
const PROFILE_KEY = "plethora.slack.profile.v1";

function defaultWorkspace(): SlackWorkspace {
  const now = Date.now();
  return {
    id: "plethora-local",
    name: "Plethora",
    users: [
      { id: "me", name: "You", handle: "you", color: "#611f69" },
      { id: "bot-echo", name: "Echo", handle: "echo", color: "#4a154b", isBot: true },
      { id: "u-sam", name: "Sam", handle: "sam", color: "#e01e5a" },
      { id: "u-alex", name: "Alex", handle: "alex", color: "#2bac76" },
    ],
    channels: [
      { id: "general", name: "general", topic: "Company-wide announcements and wins", starred: true },
      { id: "product", name: "product", topic: "Ship logs, specs, and launches" },
      { id: "design", name: "design", topic: "UI, motion, and brand" },
      { id: "random", name: "random", topic: "Off-topic — memes welcome" },
      { id: "ai-lab", name: "ai-lab", topic: "Agents, models, and experiments" },
    ],
    dms: [
      { id: "dm-echo", userId: "bot-echo" },
      { id: "dm-sam", userId: "u-sam" },
    ],
    lastRead: { general: now, product: now - 3600000 },
    messages: [
      {
        id: "welcome",
        channelId: "general",
        userId: "bot-echo",
        text: "Welcome to Relay on Windows — team chat with Echo AI, @mentions, and Scout sync.\n\nTry @you in any channel to push mentions to Scout. Hit ✦ Echo in the composer or open the AI panel →",
        ts: now - 7200000,
        reactions: [{ emoji: "👋", userIds: ["u-sam"] }],
      },
      {
        id: "m2",
        channelId: "general",
        userId: "u-sam",
        text: "Shipped the desktop build pipeline. @you can you review the installer UX?",
        ts: now - 5400000,
      },
      {
        id: "m3",
        channelId: "product",
        userId: "u-alex",
        text: "Scout v0.1 scope: @you inbox, screenshots, notes from Relay mentions.",
        ts: now - 1800000,
      },
    ],
  };
}

export function loadWorkspace(): SlackWorkspace {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw) as SlackWorkspace;
    const legacy = localStorage.getItem("plethora.slack.v1");
    if (legacy) {
      const old = JSON.parse(legacy) as SlackWorkspace;
      return {
        ...old,
        dms: old.dms ?? [{ id: "dm-echo", userId: "bot-echo" }],
        lastRead: old.lastRead ?? {},
      };
    }
  } catch {
    /* */
  }
  return defaultWorkspace();
}

export function saveWorkspace(ws: SlackWorkspace) {
  localStorage.setItem(STORAGE, JSON.stringify(ws));
}

export function loadProfile(): SlackProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as SlackProfile;
  } catch {
    /* */
  }
  return { userId: "me", handle: "you", displayName: "You" };
}

export function saveProfile(p: SlackProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function parseMentions(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/@([a-zA-Z0-9._-]{2,32})/g)) {
    found.add(m[1].toLowerCase());
  }
  return [...found];
}

export function conversationKey(target: ConversationTarget): string {
  return target.kind === "channel" ? `c:${target.id}` : `d:${target.id}`;
}

export function channelMessages(ws: SlackWorkspace, channelId: string) {
  return ws.messages.filter((m) => m.channelId === channelId).sort((a, b) => a.ts - b.ts);
}

export function dmMessages(ws: SlackWorkspace, dmId: string) {
  return ws.messages.filter((m) => m.channelId === dmId).sort((a, b) => a.ts - b.ts);
}

export function getUser(ws: SlackWorkspace, userId: string) {
  return ws.users.find((u) => u.id === userId);
}

export function getChannel(ws: SlackWorkspace, channelId: string) {
  return ws.channels.find((c) => c.id === channelId);
}

export function getDm(ws: SlackWorkspace, dmId: string) {
  return ws.dms.find((d) => d.id === dmId);
}

export function unreadCount(ws: SlackWorkspace, key: string): number {
  const last = ws.lastRead[key] ?? 0;
  const id = key.startsWith("c:") ? key.slice(2) : key.slice(2);
  return ws.messages.filter((m) => m.channelId === id && m.ts > last && m.userId !== "me").length;
}

export function markRead(ws: SlackWorkspace, key: string): SlackWorkspace {
  return { ...ws, lastRead: { ...ws.lastRead, [key]: Date.now() } };
}

export function addChannel(ws: SlackWorkspace, name: string): SlackWorkspace {
  const id = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 28);
  if (ws.channels.some((c) => c.id === id)) return ws;
  return { ...ws, channels: [...ws.channels, { id, name: name.trim(), topic: "" }] };
}

export function toggleStar(ws: SlackWorkspace, channelId: string): SlackWorkspace {
  return {
    ...ws,
    channels: ws.channels.map((c) => (c.id === channelId ? { ...c, starred: !c.starred } : c)),
  };
}

export function toggleReaction(ws: SlackWorkspace, messageId: string, emoji: string, userId: string): SlackWorkspace {
  return {
    ...ws,
    messages: ws.messages.map((m) => {
      if (m.id !== messageId) return m;
      const reactions = [...(m.reactions ?? [])];
      const idx = reactions.findIndex((r) => r.emoji === emoji);
      if (idx >= 0) {
        const r = reactions[idx]!;
        const has = r.userIds.includes(userId);
        const userIds = has ? r.userIds.filter((id) => id !== userId) : [...r.userIds, userId];
        if (userIds.length === 0) reactions.splice(idx, 1);
        else reactions[idx] = { ...r, userIds };
      } else {
        reactions.push({ emoji, userIds: [userId] });
      }
      return { ...m, reactions: reactions.length ? reactions : undefined };
    }),
  };
}

export function postMessage(
  ws: SlackWorkspace,
  opts: { channelId: string; userId: string; text: string; attachments?: SlackAttachment[] }
): SlackWorkspace {
  const mentions = parseMentions(opts.text);
  const msg: SlackMessage = {
    id: crypto.randomUUID(),
    channelId: opts.channelId,
    userId: opts.userId,
    text: opts.text.trim(),
    ts: Date.now(),
    attachments: opts.attachments?.length ? opts.attachments : undefined,
    mentions: mentions.length ? mentions : undefined,
  };
  return { ...ws, messages: [...ws.messages, msg].slice(-3000) };
}

export function pushTaskbotInbox(msg: SlackMessage, channelName: string, authorName: string) {
  const profile = loadProfile();
  const myHandle = profile.handle.toLowerCase();
  if (!msg.mentions?.some((m) => m === myHandle)) return;
  const key = "plethora.taskbot.inbox.v1";
  try {
    const raw = localStorage.getItem(key);
    const items = raw ? (JSON.parse(raw) as unknown[]) : [];
    items.unshift({
      id: crypto.randomUUID(),
      type: "mention",
      text: msg.text,
      createdAt: msg.ts,
      source: { channelName, authorName, messageId: msg.id },
      forHandle: myHandle,
    });
    localStorage.setItem(key, JSON.stringify(items.slice(0, 200)));
  } catch {
    /* */
  }
}

export function formatDateLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export function shouldGroupWithPrev(prev: SlackMessage | undefined, curr: SlackMessage): boolean {
  if (!prev) return false;
  if (prev.userId !== curr.userId) return false;
  return curr.ts - prev.ts < 5 * 60 * 1000;
}
