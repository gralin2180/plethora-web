import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadAiSettings, runAi, saveAiSettings, type AiSettings } from "./ai-client";
import {
  RELAY_BOTS,
  botSystem,
  botUserId,
  getRelayBot,
  loadActiveBotId,
  saveActiveBotId,
  type RelayBot,
} from "./relay-bots";
import { applyTheme, loadTheme, saveTheme, type RelayTheme } from "./theme";
import {
  addChannel,
  channelMessages,
  conversationKey,
  dmMessages,
  formatDateLabel,
  getChannel,
  getDm,
  getUser,
  loadProfile,
  loadWorkspace,
  markRead,
  postMessage,
  pushTaskbotInbox,
  saveProfile,
  saveWorkspace,
  shouldGroupWithPrev,
  toggleReaction,
  toggleStar,
  unreadCount,
  type ConversationTarget,
  type SlackAttachment,
  type SlackMessage,
  type SlackProfile,
  type SlackWorkspace,
} from "./slack-store";

/* ── Icons ── */
const Icon = {
  Home: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" />
    </svg>
  ),
  Dm: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  ),
  Activity: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 0 1-6 6M6 8a6 6 0 0 0 6 6M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  Ai: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7L12 17.8 5.7 21l2.3-7-6-4.6h7.6L12 2z" />
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Chevron: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  Star: ({ filled }: { filled?: boolean }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M12 2l3.1 6.3 7 1-5 4.9 1.2 7L12 18.8 5.7 21.2 7 14.2 2 9.3l7-1L12 2z" />
    </svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  ),
  Attach: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  At: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </svg>
  ),
  Emoji: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
    </svg>
  ),
  Close: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function renderText(text: string, myHandle: string) {
  const parts = text.split(/(@[a-zA-Z0-9._-]{2,32})/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const mine = part.slice(1).toLowerCase() === myHandle.toLowerCase();
      return (
        <span key={i} className={mine ? "mention-me" : "mention"}>
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

type RailView = "home" | "dms" | "activity" | "ai";
type AiPanelTab = "assist" | "bots";

function resolveAuthor(ws: SlackWorkspace, userId: string) {
  const u = getUser(ws, userId);
  if (u) return u;
  const botId = userId === "bot-echo" ? "echo" : userId.startsWith("bot-") ? userId.slice(4) : "";
  const bot = botId ? getRelayBot(botId) : undefined;
  if (bot) return { id: userId, name: bot.name, handle: bot.id, color: bot.color, isBot: true };
  return { id: userId, name: "Bot", handle: "bot", color: "#611f69", isBot: true };
}

export function App() {
  const [ws, setWs] = useState<SlackWorkspace>(() => loadWorkspace());
  const [profile, setProfile] = useState<SlackProfile>(() => loadProfile());
  const [target, setTarget] = useState<ConversationTarget>({ kind: "channel", id: "general" });
  const [railView, setRailView] = useState<RailView>("home");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(true);
  const [aiPanelTab, setAiPanelTab] = useState<AiPanelTab>("assist");
  const [activeBotId, setActiveBotId] = useState(() => loadActiveBotId());
  const [theme, setTheme] = useState<RelayTheme>(() => loadTheme());
  const [typingBot, setTypingBot] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const [pendingAttachments, setPendingAttachments] = useState<SlackAttachment[]>([]);
  const [channelTab, setChannelTab] = useState<"messages" | "files">("messages");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeBot = useMemo(() => getRelayBot(activeBotId) ?? getRelayBot("echo")!, [activeBotId]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function pickBot(bot: RelayBot) {
    setActiveBotId(bot.id);
    saveActiveBotId(bot.id);
    setAiPanelTab("assist");
  }

  function toggleTheme() {
    const next: RelayTheme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    saveTheme(next);
  }

  const convKey = conversationKey(target);
  const channelId = target.kind === "channel" ? target.id : target.id;

  const persist = useCallback((next: SlackWorkspace) => {
    setWs(next);
    saveWorkspace(next);
  }, []);

  const messages = useMemo(() => {
    if (target.kind === "channel") return channelMessages(ws, target.id);
    return dmMessages(ws, target.id);
  }, [ws, target]);

  const activeChannel = target.kind === "channel" ? getChannel(ws, target.id) : undefined;
  const activeDm = target.kind === "dm" ? getDm(ws, target.id) : undefined;
  const activeDmUser = activeDm ? getUser(ws, activeDm.userId) : undefined;

  const displayName =
    target.kind === "channel" ? activeChannel?.name : activeDmUser?.name ?? "Direct message";
  const displayTopic =
    target.kind === "channel" ? activeChannel?.topic : `@${activeDmUser?.handle ?? "user"}`;

  const filteredChannels = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ws.channels;
    return ws.channels.filter((c) => c.name.toLowerCase().includes(q));
  }, [ws.channels, search]);

  const starredChannels = filteredChannels.filter((c) => c.starred);
  const otherChannels = filteredChannels.filter((c) => !c.starred);

  const totalUnread = useMemo(() => {
    let n = 0;
    for (const c of ws.channels) n += unreadCount(ws, `c:${c.id}`);
    for (const d of ws.dms) n += unreadCount(ws, `d:${d.id}`);
    return n;
  }, [ws]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, channelId]);

  useEffect(() => {
    setWs((w) => {
      const next = markRead(w, convKey);
      saveWorkspace(next);
      return next;
    });
  }, [convKey]);

  function selectChannel(id: string) {
    setTarget({ kind: "channel", id });
    setRailView("home");
    setChannelTab("messages");
  }

  function selectDm(id: string) {
    setTarget({ kind: "dm", id });
    setRailView("dms");
  }

  function send() {
    const text = draft.trim();
    if (!text && !pendingAttachments.length) return;
    const next = postMessage(ws, {
      channelId,
      userId: profile.userId,
      text: text || "(attachment)",
      attachments: pendingAttachments.length ? pendingAttachments : undefined,
    });
    const msg = next.messages[next.messages.length - 1]!;
    const chName = displayName ?? channelId;
    const author = getUser(next, profile.userId)?.name || "You";
    pushTaskbotInbox(msg, chName, author);
    persist(next);
    setDraft("");
    setPendingAttachments([]);
  }

  async function askAi(promptOverride?: string, botOverride?: RelayBot) {
    const bot = botOverride ?? activeBot;
    const userPrompt = (promptOverride ?? draft).trim();
    const promptText =
      userPrompt || `Review #${displayName} and help me — what's the thread and what should I do next?`;
    const fromComposer = !promptOverride;
    const showUserLine = fromComposer ? Boolean(draft.trim()) || !userPrompt : Boolean(promptOverride);

    setBusy(true);
    setTypingBot(bot.name);
    setAiStatus(`Thinking… (${bot.name})`);

    const history = messages
      .slice(-12)
      .map((m) => `${resolveAuthor(ws, m.userId).name}: ${m.text}`)
      .join("\n");
    const prompt = `#${displayName}\n${history}\n\nUser: ${promptText}`;

    try {
      const result = await runAi(prompt, botSystem(bot), aiSettings);
      let next = ws;

      if (showUserLine) {
        const userLine = draft.trim() || promptOverride || "✦ Ask " + bot.name;
        next = postMessage(next, { channelId, userId: profile.userId, text: userLine });
      }

      if (result.ok) {
        setAiStatus(`${bot.name} · ${result.lane ?? "AI"}`);
        next = postMessage(next, { channelId, userId: botUserId(bot.id), text: result.reply });
      } else {
        setAiStatus(result.error ?? "Failed");
        next = postMessage(next, {
          channelId,
          userId: botUserId(bot.id),
          text: `⚠ ${result.error}\n\nSettings → add a BYOK key (OpenRouter / OpenAI) for unlimited replies.`,
        });
      }

      persist(next);
      if (fromComposer) setDraft("");
    } finally {
      setTypingBot(null);
      setBusy(false);
    }
  }

  function onImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPendingAttachments((prev) => [
        ...prev,
        { id: crypto.randomUUID(), kind: "image", name: file.name, dataUrl: reader.result as string },
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function wrapSelection(before: string, after: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = draft.slice(start, end);
    const next = draft.slice(0, start) + before + selected + after + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, end + before.length);
    });
  }

  function saveSettings() {
    saveProfile(profile);
    saveAiSettings(aiSettings);
    setWs((w) => ({
      ...w,
      users: w.users.map((u) =>
        u.id === profile.userId ? { ...u, name: profile.displayName, handle: profile.handle } : u
      ),
    }));
    setSettingsOpen(false);
  }

  function react(msg: SlackMessage, emoji: string) {
    persist(toggleReaction(ws, msg.id, emoji, profile.userId));
  }

  const messageBlocks = useMemo(() => {
    const blocks: { date?: string; msg: SlackMessage; grouped: boolean }[] = [];
    let lastDate = "";
    messages.forEach((msg, i) => {
      const date = formatDateLabel(msg.ts);
      if (date !== lastDate) {
        blocks.push({ date, msg, grouped: false });
        lastDate = date;
      } else {
        blocks.push({ msg, grouped: shouldGroupWithPrev(messages[i - 1], msg) });
      }
    });
    return blocks;
  }, [messages]);

  const members = ws.users.slice(0, 4);

  return (
    <div className="app-shell">
      {/* Workspace rail */}
      <nav className="workspace-rail">
        <div className="rail-workspace" title={ws.name}>
          P
        </div>
        <button
          type="button"
          className={`rail-btn ${railView === "home" ? "active" : ""}`}
          title="Home"
          onClick={() => setRailView("home")}
        >
          <Icon.Home />
        </button>
        <div className="rail-btn-wrap">
          <button
            type="button"
            className={`rail-btn ${railView === "dms" ? "active" : ""}`}
            title="Direct messages"
            onClick={() => setRailView("dms")}
          >
            <Icon.Dm />
          </button>
          {totalUnread > 0 ? <span className="rail-badge">{totalUnread > 9 ? "9+" : totalUnread}</span> : null}
        </div>
        <button
          type="button"
          className={`rail-btn ${railView === "activity" ? "active" : ""}`}
          title="Activity"
          onClick={() => setRailView("activity")}
        >
          <Icon.Activity />
        </button>
        <button
          type="button"
          className={`rail-btn ${railView === "ai" || aiPanelOpen ? "active" : ""}`}
          title="AI & agents"
          onClick={() => {
            setRailView("ai");
            setAiPanelOpen(true);
          }}
        >
          <Icon.Ai />
        </button>
        <div className="rail-spacer" />
        <button type="button" className="rail-btn" title="Settings" onClick={() => setSettingsOpen(true)}>
          ⚙
        </button>
      </nav>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <h1 className="workspace-name">
            {ws.name}
            <Icon.Chevron />
          </h1>
          <div className="sidebar-actions">
            <button type="button" className="icon-btn" title="New message">
              <Icon.Dm />
            </button>
            <button type="button" className="icon-btn" title="New channel" onClick={() => {
              const name = window.prompt("Channel name?");
              if (!name?.trim()) return;
              const next = addChannel(ws, name);
              persist(next);
              selectChannel(next.channels[next.channels.length - 1]!.id);
            }}>
              <Icon.Plus />
            </button>
          </div>
        </div>

        <div className="search-box">
          <Icon.Search />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a channel or DM"
          />
        </div>

        <div className="sidebar-scroll">
          {railView === "dms" ? (
            <div className="nav-section">
              <div className="nav-section-label">Direct messages</div>
              {ws.dms.map((d) => {
                const user = getUser(ws, d.userId);
                const unread = unreadCount(ws, `d:${d.id}`);
                return (
                  <button
                    key={d.id}
                    type="button"
                    className={`nav-item ${target.kind === "dm" && target.id === d.id ? "active" : ""}`}
                    onClick={() => selectDm(d.id)}
                  >
                    {user?.isBot ? "✦ " : ""}
                    {user?.name ?? d.id}
                    {unread > 0 ? <span className="unread-dot" /> : null}
                  </button>
                );
              })}
            </div>
          ) : railView === "activity" ? (
            <div className="nav-section">
              <div className="nav-section-label">Recent activity</div>
              {ws.messages
                .slice()
                .sort((a, b) => b.ts - a.ts)
                .slice(0, 8)
                .map((m) => {
                  const user = getUser(ws, m.userId);
                  const ch = getChannel(ws, m.channelId)?.name ?? (getDm(ws, m.channelId) ? "DM" : m.channelId);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className="nav-item"
                      style={{ fontSize: 13 }}
                      onClick={() => {
                        const chObj = getChannel(ws, m.channelId);
                        if (chObj) selectChannel(chObj.id);
                        else {
                          const dm = getDm(ws, m.channelId);
                          if (dm) selectDm(dm.id);
                        }
                      }}
                    >
                      <span style={{ opacity: 0.6 }}>#{ch}</span> · {user?.name}: {m.text.slice(0, 40)}…
                    </button>
                  );
                })}
            </div>
          ) : (
            <>
              {starredChannels.length > 0 ? (
                <div className="nav-section">
                  <div className="nav-section-label">Starred</div>
                  {starredChannels.map((c) => (
                    <ChannelBtn
                      key={c.id}
                      channel={c}
                      active={target.kind === "channel" && target.id === c.id}
                      unread={unreadCount(ws, `c:${c.id}`)}
                      onClick={() => selectChannel(c.id)}
                    />
                  ))}
                </div>
              ) : null}
              <div className="nav-section">
                <div className="nav-section-label">
                  Channels
                  <button type="button" title="Add channel" onClick={() => {
                    const name = window.prompt("Channel name?");
                    if (!name?.trim()) return;
                    const next = addChannel(ws, name);
                    persist(next);
                    selectChannel(next.channels[next.channels.length - 1]!.id);
                  }}>
                    <Icon.Plus />
                  </button>
                </div>
                {otherChannels.map((c) => (
                  <ChannelBtn
                    key={c.id}
                    channel={c}
                    active={target.kind === "channel" && target.id === c.id}
                    unread={unreadCount(ws, `c:${c.id}`)}
                    onClick={() => selectChannel(c.id)}
                  />
                ))}
              </div>
              <div className="nav-section">
                <div className="nav-section-label">Direct messages</div>
                {ws.dms.slice(0, 3).map((d) => {
                  const user = getUser(ws, d.userId);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className={`nav-item ${target.kind === "dm" && target.id === d.id ? "active" : ""}`}
                      onClick={() => selectDm(d.id)}
                    >
                      {user?.isBot ? "✦ " : ""}
                      {user?.name}
                    </button>
                  );
                })}
              </div>
              <div className="nav-section">
                <div className="nav-section-label">Apps & agents</div>
                <button type="button" className="nav-item" onClick={() => { setAiPanelOpen(true); setAiPanelTab("bots"); }}>
                  ✦ Plethora Bots
                </button>
                <button type="button" className="nav-item" style={{ opacity: 0.6 }}>
                  Scout sync
                </button>
              </div>
            </>
          )}
        </div>

        <div className="sidebar-user" onClick={() => setSettingsOpen(true)} role="button" tabIndex={0}>
          <div className="avatar" style={{ background: getUser(ws, profile.userId)?.color }}>
            {profile.displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">
              <span className="status-dot" />
              {profile.displayName}
            </div>
            <div className="sidebar-user-handle">@{profile.handle} · Active</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="conversation">
        <header className="channel-header">
          <div className="channel-title">
            {target.kind === "channel" ? (
              <button
                type="button"
                className={`star-btn ${activeChannel?.starred ? "starred" : ""}`}
                onClick={() => activeChannel && persist(toggleStar(ws, activeChannel.id))}
              >
                <Icon.Star filled={activeChannel?.starred} />
              </button>
            ) : null}
            <h2>
              {target.kind === "channel" ? "# " : ""}
              {displayName}
            </h2>
          </div>
          <div className="channel-tabs">
            <button
              type="button"
              className={`channel-tab ${channelTab === "messages" ? "active" : ""}`}
              onClick={() => setChannelTab("messages")}
            >
              Messages
            </button>
            <button
              type="button"
              className={`channel-tab ${channelTab === "files" ? "active" : ""}`}
              onClick={() => setChannelTab("files")}
            >
              Files
            </button>
          </div>
          <div className="channel-header-actions">
            <div className="members-pill">
              <div className="member-avatars">
                {members.map((u) => (
                  <span key={u.id} style={{ background: u.color }}>
                    {u.name.slice(0, 1)}
                  </span>
                ))}
              </div>
              {ws.users.length}
            </div>
            <button type="button" className="header-action" onClick={toggleTheme} title="Toggle light/dark">
              {theme === "dark" ? "☀ Light" : "☾ Dark"}
            </button>
            <button type="button" className="header-action">
              <Icon.Search /> Search
            </button>
          </div>
        </header>

        {channelTab === "files" ? (
          <div className="empty-state">
            <h3>Shared files</h3>
            <p>Images and attachments from this conversation appear here.</p>
          </div>
        ) : (
          <>
            <div className="message-scroll">
              {displayTopic ? (
                <div style={{ padding: "16px 8px 8px", color: "var(--text-muted)", fontSize: 13 }}>
                  {displayTopic}
                </div>
              ) : null}
              {messageBlocks.map(({ date, msg, grouped }, i) => {
                const user = resolveAuthor(ws, msg.userId);
                return (
                  <div key={msg.id + String(i)}>
                    {date ? <div className="date-divider">{date}</div> : null}
                    <div className="message-group">
                      {grouped ? (
                        <div className="avatar spacer">·</div>
                      ) : (
                        <div className="avatar" style={{ background: user?.color || "#611f69" }}>
                          {user?.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="msg-content">
                        {!grouped ? (
                          <div className="msg-header">
                            <span className={`msg-author ${user?.isBot ? "bot" : ""}`}>{user?.name}</span>
                            {user?.isBot ? (
                              <span style={{ fontSize: 10, background: "rgba(139,92,246,0.3)", padding: "1px 6px", borderRadius: 99, color: "#c4b5fd" }}>
                                APP
                              </span>
                            ) : null}
                            <span className="msg-time">{formatTime(msg.ts)}</span>
                          </div>
                        ) : (
                          <div className="msg-header compact">
                            <span className="msg-time">{formatTime(msg.ts)}</span>
                          </div>
                        )}
                        <div className="msg-text">{renderText(msg.text, profile.handle)}</div>
                        {msg.attachments?.map((a) =>
                          a.kind === "image" ? (
                            <img key={a.id} src={a.dataUrl} alt={a.name} className="msg-attach" />
                          ) : null
                        )}
                        {msg.reactions?.length ? (
                          <div className="msg-reactions">
                            {msg.reactions.map((r) => (
                              <button
                                key={r.emoji}
                                type="button"
                                className={`reaction-pill ${r.userIds.includes(profile.userId) ? "mine" : ""}`}
                                onClick={() => react(msg, r.emoji)}
                              >
                                {r.emoji} {r.userIds.length}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="msg-hover-bar">
                        <button type="button" className="hover-btn" title="Add reaction" onClick={() => react(msg, "👍")}>
                          👍
                        </button>
                        <button type="button" className="hover-btn" title="Celebrate" onClick={() => react(msg, "🎉")}>
                          🎉
                        </button>
                        <button type="button" className="hover-btn" title="Reply in thread">
                          ↩
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {typingBot ? (
                <div className="typing-indicator">
                  <div className="avatar" style={{ background: activeBot.color }}>
                    {activeBot.glyph}
                  </div>
                  <div className="typing-body">
                    <span className="msg-author bot">{typingBot}</span>
                    <span className="typing-dots">
                      <span /> <span /> <span />
                    </span>
                    {aiStatus ? <span className="typing-status">{aiStatus}</span> : null}
                  </div>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>

            <div className="composer-wrap">
              {pendingAttachments.length ? (
                <div className="pending-attach">
                  {pendingAttachments.map((a) => (
                    <img key={a.id} src={a.dataUrl} alt="" />
                  ))}
                </div>
              ) : null}
              <div className="composer">
                <div className="composer-toolbar">
                  <button type="button" className="fmt-btn" title="Bold" onClick={() => wrapSelection("*", "*")}>
                    B
                  </button>
                  <button type="button" className="fmt-btn" title="Italic" onClick={() => wrapSelection("_", "_")}>
                    I
                  </button>
                  <button type="button" className="fmt-btn" title="Strikethrough" onClick={() => wrapSelection("~", "~")}>
                    S
                  </button>
                  <button type="button" className="fmt-btn" title="Code" onClick={() => wrapSelection("`", "`")}>
                    {"</>"}
                  </button>
                  <button type="button" className="fmt-btn" title="Quote" onClick={() => setDraft((d) => (d.startsWith("> ") ? d : `> ${d}`))}>
                    "
                  </button>
                  <span className="spacer" />
                  <button
                    type="button"
                    className="composer-ai-chip"
                    disabled={busy}
                    onClick={() => void askAi()}
                    title={draft.trim() ? `Ask ${activeBot.name} about your message` : `Ask ${activeBot.name} about this channel`}
                  >
                    {activeBot.glyph} {busy ? `${activeBot.name}…` : `Ask ${activeBot.name}`}
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={`Message ${target.kind === "channel" ? "#" : ""}${displayName}`}
                  rows={1}
                />
                <div className="composer-bottom">
                  <button type="button" className="fmt-btn" title="Attach" onClick={() => fileRef.current?.click()}>
                    <Icon.Attach />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={onImagePick} />
                  <button type="button" className="fmt-btn" title="Mention" onClick={() => setDraft((d) => d + "@")}>
                    <Icon.At />
                  </button>
                  <button type="button" className="fmt-btn" title="Emoji" onClick={() => setDraft((d) => d + " 🙂")}>
                    <Icon.Emoji />
                  </button>
                  <span className="spacer" />
                  <button type="button" className="send-btn" disabled={!draft.trim() && !pendingAttachments.length} onClick={send}>
                    <Icon.Send />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* AI panel */}
      {aiPanelOpen ? (
        <aside className="ai-panel">
          <div className="ai-panel-head">
            <h3>
              AI <span>Plethora Bots</span>
            </h3>
            <button type="button" className="icon-btn" onClick={() => setAiPanelOpen(false)}>
              <Icon.Close />
            </button>
          </div>
          <div className="ai-panel-tabs">
            <button type="button" className={`ai-tab ${aiPanelTab === "assist" ? "active" : ""}`} onClick={() => setAiPanelTab("assist")}>
              Assist
            </button>
            <button type="button" className={`ai-tab ${aiPanelTab === "bots" ? "active" : ""}`} onClick={() => setAiPanelTab("bots")}>
              Bots
            </button>
          </div>
          <div className="ai-panel-body">
            {aiPanelTab === "bots" ? (
              <div className="bot-grid">
                {RELAY_BOTS.map((bot) => (
                  <button
                    key={bot.id}
                    type="button"
                    className={`bot-card ${activeBotId === bot.id ? "active" : ""}`}
                    onClick={() => pickBot(bot)}
                  >
                    <span className="bot-glyph">{bot.glyph}</span>
                    <span className="bot-name">{bot.name}</span>
                    <span className="bot-tag">{bot.tagline}</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="ai-active-bot">
                  <span className="bot-glyph lg">{activeBot.glyph}</span>
                  <div>
                    <strong>{activeBot.name}</strong>
                    <p>{activeBot.tagline}</p>
                  </div>
                </div>
                {aiStatus ? <div className="ai-status-bar">{aiStatus}</div> : null}
                <div className="ai-card">
                  <p>Active bot replies in-channel. Free Plethora pool, BYOK, or tokens via Settings.</p>
                  <button type="button" className="ai-quick-btn" disabled={busy} onClick={() => void askAi("Summarize this channel in 3 bullets")}>
                    Summarize channel
                  </button>
                  <button type="button" className="ai-quick-btn" disabled={busy} onClick={() => void askAi("Draft a friendly reply to the latest message")}>
                    Draft a reply
                  </button>
                  <button type="button" className="ai-quick-btn" disabled={busy} onClick={() => void askAi("Extract action items with @you tags")}>
                    Extract @you tasks
                  </button>
                  <button type="button" className="ai-quick-btn" disabled={busy} onClick={() => setAiPanelTab("bots")}>
                    Switch bot →
                  </button>
                </div>
                <div className="ai-card ai-card-muted">
                  <p style={{ margin: 0 }}>
                    <strong>Scout sync</strong> — @you mentions queue to Scout on this PC.
                  </p>
                </div>
              </>
            )}
          </div>
        </aside>
      ) : null}

      {settingsOpen ? (
        <div className="modal-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Preferences</h3>
            <p className="modal-sub">Profile, AI billing lane (free · BYOK · Plethora tokens)</p>
            <label>
              Display name
              <input value={profile.displayName} onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))} />
            </label>
            <label>
              @handle
              <input
                value={profile.handle}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    handle: e.target.value.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 24),
                  }))
                }
              />
            </label>
            <label>
              Theme
              <select
                value={theme}
                onChange={(e) => {
                  const t = e.target.value as RelayTheme;
                  setTheme(t);
                  saveTheme(t);
                }}
                style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>
            <label>
              BYOK API key (optional)
              <input
                type="password"
                value={aiSettings.byokKey || ""}
                onChange={(e) => setAiSettings((s) => ({ ...s, byokKey: e.target.value || undefined }))}
                placeholder="sk-or-… or sk-…"
              />
            </label>
            <label>
              Model (optional)
              <input
                value={aiSettings.byokModel || ""}
                onChange={(e) => setAiSettings((s) => ({ ...s, byokModel: e.target.value || undefined }))}
                placeholder="openrouter model id"
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setSettingsOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={saveSettings}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChannelBtn({
  channel,
  active,
  unread,
  onClick,
}: {
  channel: { id: string; name: string };
  active: boolean;
  unread: number;
  onClick: () => void;
}) {
  return (
    <button type="button" className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      <span className="hash">#</span> {channel.name}
      {unread > 0 ? <span className="unread-dot" /> : null}
    </button>
  );
}
