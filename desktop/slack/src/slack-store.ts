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
};

export type SlackChannel = {
  id: string;
  name: string;
  topic?: string;
};

export type SlackWorkspace = {
  id: string;
  name: string;
  users: SlackUser[];
  channels: SlackChannel[];
  messages: SlackMessage[];
};

export type SlackProfile = {
  userId: string;
  handle: string;
  displayName: string;
};

const STORAGE = "plethora.slack.v1";
const PROFILE_KEY = "plethora.slack.profile.v1";

function defaultWorkspace(): SlackWorkspace {
  return {
    id: "plethora-local",
    name: "Plethora Team",
    users: [
      { id: "me", name: "You", handle: "you", color: "#611f69" },
      { id: "bot-echo", name: "Echo", handle: "echo", color: "#4a154b" },
    ],
    channels: [
      { id: "general", name: "general", topic: "Company-wide" },
      { id: "random", name: "random", topic: "Off-topic" },
      { id: "product", name: "product", topic: "Ship logs" },
    ],
    messages: [
      {
        id: "welcome",
        channelId: "general",
        userId: "bot-echo",
        text: "Plethora Slack on Windows. @you mentions sync to Taskbot (next app). AI: free pool, BYOK, or Plethora tokens via Settings.",
        ts: Date.now() - 60_000,
      },
    ],
  };
}

export function loadWorkspace(): SlackWorkspace {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw) as SlackWorkspace;
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

export function channelMessages(ws: SlackWorkspace, channelId: string) {
  return ws.messages
    .filter((m) => m.channelId === channelId)
    .sort((a, b) => a.ts - b.ts);
}

export function getUser(ws: SlackWorkspace, userId: string) {
  return ws.users.find((u) => u.id === userId);
}

export function addChannel(ws: SlackWorkspace, name: string): SlackWorkspace {
  const id = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 28);
  if (ws.channels.some((c) => c.id === id)) return ws;
  return { ...ws, channels: [...ws.channels, { id, name: name.trim(), topic: "" }] };
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
  return { ...ws, messages: [...ws.messages, msg].slice(-2000) };
}

/** Shared file for Taskbot Windows app (same userData pattern later) */
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
