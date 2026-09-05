/**
 * Plethora Slack — local-first team chat (Slack-inspired, not Slack).
 * Messages feed Taskbot for AI extraction and @mention inbox.
 */

export type SlackUser = {
  id: string;
  name: string;
  handle: string;
  color: string;
};

export type SlackAttachment = {
  id: string;
  kind: "image";
  name: string;
  dataUrl: string;
};

export type SlackMessage = {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  ts: number;
  attachments?: SlackAttachment[];
  mentions?: string[];
  threadParentId?: string;
};

export type SlackChannel = {
  id: string;
  name: string;
  topic?: string;
  isDm?: boolean;
  memberIds?: string[];
};

export type SlackWorkspace = {
  id: string;
  name: string;
  users: SlackUser[];
  channels: SlackChannel[];
  messages: SlackMessage[];
};

const STORAGE = "plethora.slack.v1";
const PROFILE_KEY = "plethora.slack.profile.v1";

const COLORS = ["#e01e5a", "#36c5f0", "#2eb67d", "#ecb22e", "#9b59b6", "#e67e22"];

function defaultWorkspace(): SlackWorkspace {
  const me: SlackUser = {
    id: "me",
    name: "You",
    handle: "you",
    color: "#611f69",
  };
  const echo: SlackUser = {
    id: "bot-echo",
    name: "Echo",
    handle: "echo",
    color: "#4a154b",
  };
  return {
    id: "plethora-local",
    name: "Plethora Team",
    users: [me, echo],
    channels: [
      { id: "general", name: "general", topic: "Company-wide announcements" },
      { id: "random", name: "random", topic: "Off-topic and memes" },
      { id: "product", name: "product", topic: "Ship logs and specs" },
    ],
    messages: [
      {
        id: "welcome",
        channelId: "general",
        userId: "bot-echo",
        text: "Welcome to Plethora Slack — inspired by Slack, not Slack. @you mentions land in Taskbot. AI uses the same free / BYOK / token lanes as Plethora Chat.",
        ts: Date.now() - 60_000,
      },
    ],
  };
}

export function loadSlackWorkspace(): SlackWorkspace {
  if (typeof window === "undefined") return defaultWorkspace();
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw) as SlackWorkspace;
  } catch {
    /* */
  }
  return defaultWorkspace();
}

export function saveSlackWorkspace(ws: SlackWorkspace) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE, JSON.stringify(ws));
    window.dispatchEvent(new CustomEvent("plethora:slack-updated"));
  } catch {
    /* */
  }
}

export function loadSlackProfile(): { userId: string; handle: string; displayName: string } {
  if (typeof window === "undefined") {
    return { userId: "me", handle: "you", displayName: "You" };
  }
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw) as { userId: string; handle: string; displayName: string };
  } catch {
    /* */
  }
  return { userId: "me", handle: "you", displayName: "You" };
}

export function saveSlackProfile(p: { userId: string; handle: string; displayName: string }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    /* */
  }
}

export function parseMentions(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(/@([a-zA-Z0-9._-]{2,32})/g)) {
    found.add(m[1].toLowerCase());
  }
  return [...found];
}

export function highlightMentions(text: string, myHandle: string): string {
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(
    /@([a-zA-Z0-9._-]{2,32})/g,
    (_, h: string) => {
      const mine = h.toLowerCase() === myHandle.toLowerCase();
      return `<span class="${mine ? "slack-mention-me" : "slack-mention"}">@${h}</span>`;
    }
  );
}

export function getUser(ws: SlackWorkspace, userId: string): SlackUser | undefined {
  return ws.users.find((u) => u.id === userId);
}

export function channelMessages(ws: SlackWorkspace, channelId: string): SlackMessage[] {
  return ws.messages
    .filter((m) => m.channelId === channelId && !m.threadParentId)
    .sort((a, b) => a.ts - b.ts);
}

export function addChannel(ws: SlackWorkspace, name: string): SlackWorkspace {
  const id = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .slice(0, 28);
  if (ws.channels.some((c) => c.id === id)) return ws;
  return {
    ...ws,
    channels: [...ws.channels, { id, name: name.trim(), topic: "" }],
  };
}

export function postMessage(
  ws: SlackWorkspace,
  opts: {
    channelId: string;
    userId: string;
    text: string;
    attachments?: SlackAttachment[];
  }
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
  return { ...ws, messages: [...ws.messages, msg].slice(-2000) };
}

export function ensureTeamMember(ws: SlackWorkspace, name: string): { ws: SlackWorkspace; user: SlackUser } {
  const handle = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .slice(0, 20);
  const existing = ws.users.find((u) => u.handle === handle);
  if (existing) return { ws, user: existing };
  const user: SlackUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    handle,
    color: COLORS[ws.users.length % COLORS.length],
  };
  return { ws: { ...ws, users: [...ws.users, user] }, user };
}
