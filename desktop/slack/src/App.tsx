import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ECHO_SYSTEM, loadAiSettings, runAi, saveAiSettings, type AiSettings } from "./ai-client";
import {
  addChannel,
  channelMessages,
  getUser,
  loadProfile,
  loadWorkspace,
  parseMentions,
  postMessage,
  pushTaskbotInbox,
  saveProfile,
  saveWorkspace,
  type SlackAttachment,
  type SlackProfile,
  type SlackWorkspace,
} from "./slack-store";

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

export function App() {
  const [ws, setWs] = useState<SlackWorkspace>(() => loadWorkspace());
  const [profile, setProfile] = useState<SlackProfile>(() => loadProfile());
  const [channelId, setChannelId] = useState("general");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const [pendingAttachments, setPendingAttachments] = useState<SlackAttachment[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const persist = useCallback((next: SlackWorkspace) => {
    setWs(next);
    saveWorkspace(next);
  }, []);

  const messages = useMemo(() => channelMessages(ws, channelId), [ws, channelId]);
  const activeChannel = ws.channels.find((c) => c.id === channelId);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, channelId]);

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
    const chName = activeChannel?.name || channelId;
    const author = getUser(next, profile.userId)?.name || "You";
    pushTaskbotInbox(msg, chName, author);
    persist(next);
    setDraft("");
    setPendingAttachments([]);
  }

  async function askAi() {
    const text = draft.trim();
    if (!text || !activeChannel) return;
    setBusy(true);
    const history = channelMessages(ws, channelId)
      .slice(-10)
      .map((m) => `${getUser(ws, m.userId)?.name}: ${m.text}`)
      .join("\n");
    const prompt = `#${activeChannel.name}\n${history}\n\nUser: ${text}`;
    const reply = await runAi(prompt, ECHO_SYSTEM, aiSettings);
    let next = postMessage(ws, { channelId, userId: profile.userId, text });
    next = postMessage(next, { channelId, userId: "bot-echo", text: reply });
    persist(next);
    setDraft("");
    setBusy(false);
  }

  function onImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPendingAttachments((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          kind: "image",
          name: file.name,
          dataUrl: reader.result as string,
        },
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-head">
          <h1>
            {ws.name}
            <span className="badge-desktop">Windows</span>
          </h1>
          <p>@{profile.handle}</p>
        </div>
        <div className="channel-list">
          {ws.channels.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`channel-btn ${c.id === channelId ? "active" : ""}`}
              onClick={() => setChannelId(c.id)}
            >
              # {c.name}
            </button>
          ))}
          <button
            type="button"
            className="channel-btn"
            style={{ color: "#a78bfa", marginTop: 8 }}
            onClick={() => {
              const name = window.prompt("Channel name?");
              if (!name?.trim()) return;
              const next = addChannel(ws, name);
              persist(next);
              setChannelId(next.channels[next.channels.length - 1]!.id);
            }}
          >
            + Add channel
          </button>
        </div>
        <div style={{ padding: 8, borderTop: "1px solid #000" }}>
          <button type="button" className="btn-ghost" onClick={() => setSettingsOpen(true)}>
            ⚙ Profile & AI keys
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="header">
          <h2># {activeChannel?.name}</h2>
          <span style={{ fontSize: 11, color: "#888" }}>Plethora Slack · local on this PC</span>
        </header>

        <div className="messages">
          {messages.map((m) => {
            const user = getUser(ws, m.userId);
            return (
              <div key={m.id} className="msg">
                <div className="avatar" style={{ background: user?.color || "#611f69" }}>
                  {user?.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="msg-body">
                  <div>
                    <span className="author">{user?.name}</span>
                    <span className="time">{formatTime(m.ts)}</span>
                  </div>
                  <div className="text">{renderText(m.text, profile.handle)}</div>
                  {m.attachments?.map((a) =>
                    a.kind === "image" ? (
                      <img key={a.id} src={a.dataUrl} alt={a.name} className="attach" />
                    ) : null
                  )}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div className="composer">
          {pendingAttachments.map((a) => (
            <img key={a.id} src={a.dataUrl} alt="" style={{ height: 48, marginBottom: 8, borderRadius: 6 }} />
          ))}
          <div className="composer-box">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={`Message #${activeChannel?.name} — @${profile.handle} for Taskbot`}
            />
            <div className="composer-actions">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onImagePick} />
              <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
                📎 Image
              </button>
              <button type="button" className="btn-ai" disabled={busy || !draft.trim()} onClick={() => void askAi()}>
                {busy ? "…" : "✦ Ask Echo AI"}
              </button>
              <button type="button" className="btn-send" onClick={send}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {settingsOpen ? (
        <div className="settings-overlay">
          <div className="settings-panel">
            <h3 style={{ margin: 0 }}>Settings</h3>
            <p style={{ fontSize: 12, color: "#888" }}>
              AI: free Plethora pool, or paste your OpenRouter / OpenAI key (BYOK).
            </p>
            <label>
              Display name
              <input
                value={profile.displayName}
                onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
              />
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
            <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" className="btn-ghost" onClick={() => setSettingsOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-send" onClick={saveSettings}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
