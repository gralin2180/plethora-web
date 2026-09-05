"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Hash,
  ImagePlus,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { OfficeAiBillingStrip } from "@/components/OfficeAiBillingStrip";
import { chatSystemForOfficeBot, defaultOfficeBotId } from "@/lib/office-assistants";
import { getBot } from "@/lib/chat-bots";
import { runPlatformAi } from "@/lib/platform-ai-client";
import {
  addChannel,
  channelMessages,
  getUser,
  highlightMentions,
  loadSlackProfile,
  loadSlackWorkspace,
  postMessage,
  saveSlackProfile,
  saveSlackWorkspace,
  type SlackAttachment,
  type SlackWorkspace,
} from "@/lib/plethora-slack";
import { loadTaskbot, scanSlackWithAi, syncMessageToTaskbot } from "@/lib/taskbot";
import { trackToolUse } from "@/lib/self-learn";

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function PlethoraSlack() {
  const [ws, setWs] = useState<SlackWorkspace | null>(null);
  const [profile, setProfile] = useState(loadSlackProfile());
  const [channelId, setChannelId] = useState("general");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);
  const [botId, setBotId] = useState(defaultOfficeBotId("slack"));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scanNote, setScanNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const bot = getBot(botId);

  useEffect(() => {
    setWs(loadSlackWorkspace());
    setProfile(loadSlackProfile());
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channelId, ws?.messages.length]);

  const persist = useCallback((next: SlackWorkspace) => {
    setWs(next);
    saveSlackWorkspace(next);
  }, []);

  const messages = useMemo(() => {
    if (!ws) return [];
    return channelMessages(ws, channelId);
  }, [ws, channelId]);

  const filteredChannels = useMemo(() => {
    if (!ws) return [];
    const q = search.trim().toLowerCase();
    if (!q) return ws.channels.filter((c) => !c.isDm);
    return ws.channels.filter((c) => !c.isDm && c.name.toLowerCase().includes(q));
  }, [ws, search]);

  const [pendingAttachments, setPendingAttachments] = useState<SlackAttachment[]>([]);

  const activeChannel = ws?.channels.find((c) => c.id === channelId);

  async function send(userText?: string) {
    const text = (userText ?? draft).trim();
    if (!text || !ws) return;
    setDraft("");
    let next = postMessage(ws, {
      channelId,
      userId: profile.userId,
      text,
      attachments: pendingAttachments.length ? pendingAttachments : undefined,
    });
    setPendingAttachments([]);
    persist(next);
    syncMessageToTaskbot(next, next.messages[next.messages.length - 1]!);
    void trackToolUse("office-slack", 2);

    if (loadTaskbot().autoScan) {
      window.setTimeout(() => {
        void scanSlackWithAi(next, { channelId, limit: 25 }).then(({ note }) => setScanNote(note));
      }, 800);
    }
  }

  async function askAi() {
    const text = draft.trim();
    if (!text || !ws || !activeChannel) return;
    setBusy(true);
    const history = channelMessages(ws, channelId)
      .slice(-12)
      .map((m) => {
        const u = getUser(ws, m.userId);
        return `${u?.name || "?"}: ${m.text}`;
      })
      .join("\n");
    const prompt = `#${activeChannel.name}\n${history}\n\nUser asks AI teammate: ${text}`;
    const r = await runPlatformAi(prompt, {
      customSystem: chatSystemForOfficeBot(botId, "slack"),
      toolJob: true,
      maxTokens: 900,
    });
    const reply = (r.reply || r.code || "No reply — connect AI or BYOK.").trim();
    let next = postMessage(ws, { channelId, userId: profile.userId, text });
    next = postMessage(next, { channelId, userId: "bot-echo", text: reply });
    persist(next);
    setDraft("");
    setBusy(false);
    void trackToolUse("office-slack-ai", 3);
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPendingAttachments((prev) => [
        ...prev,
        { id: crypto.randomUUID(), kind: "image", name: file.name, dataUrl },
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function saveProfile() {
    saveSlackProfile(profile);
    if (!ws) return;
    const next = {
      ...ws,
      users: ws.users.map((u) =>
        u.id === profile.userId
          ? { ...u, name: profile.displayName, handle: profile.handle }
          : u
      ),
    };
    persist(next);
    setSettingsOpen(false);
  }

  async function runTaskbotScan() {
    if (!ws) return;
    setBusy(true);
    const { note } = await scanSlackWithAi(ws, { channelId, limit: 50 });
    setScanNote(note);
    setBusy(false);
  }

  if (!ws) {
    return <p className="text-sm text-zinc-500">Loading workspace…</p>;
  }

  return (
    <div className="space-y-3">
      <OfficeAiBillingStrip appName="Plethora Slack" />
      <p className="text-xs text-zinc-500">
        Inspired by Slack — not Slack. Local workspace on this device. Messages sync to{" "}
        <Link href="/office/taskbot" className="text-violet-300 hover:underline">
          Taskbot
        </Link>
        . Desktop:{" "}
        <Link href="/office" className="text-cyan-300 hover:underline">
          Windows download
        </Link>
        .
      </p>

      <div className="flex min-h-[calc(100dvh-16rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#1a1d21] shadow-2xl lg:min-h-[640px]">
        {/* Sidebar */}
        <aside className="flex w-full shrink-0 flex-col border-r border-black/30 bg-[#19171d] sm:w-60 lg:w-64">
          <div className="border-b border-black/30 px-3 py-3">
            <p className="truncate text-sm font-bold text-white">{ws.name}</p>
            <p className="text-[10px] text-zinc-500">@{profile.handle}</p>
          </div>
          <div className="px-2 py-2">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search channels"
                className="w-full rounded-md border border-white/5 bg-[#322942] py-1.5 pl-7 pr-2 text-xs text-white placeholder:text-zinc-500"
              />
            </div>
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Channels
            </p>
            {filteredChannels.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannelId(c.id)}
                className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm ${
                  c.id === channelId
                    ? "bg-[#1164a3] text-white"
                    : "text-zinc-300 hover:bg-white/5"
                }`}
              >
                <Hash className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="truncate">{c.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const name = window.prompt("New channel name?");
                if (!name?.trim()) return;
                const next = addChannel(ws, name);
                persist(next);
                setChannelId(next.channels[next.channels.length - 1]!.id);
              }}
              className="mt-1 flex w-full items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add channel
            </button>
            <p className="mt-4 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Apps
            </p>
            <Link
              href="/office/taskbot"
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Taskbot
            </Link>
          </nav>
          <div className="border-t border-black/30 p-2">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <Settings className="h-3.5 w-3.5" /> Profile & @handle
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-black/30 bg-[#1a1d21] px-4 py-2">
            <div>
              <p className="flex items-center gap-1 text-sm font-semibold text-white">
                <Hash className="h-4 w-4" />
                {activeChannel?.name}
              </p>
              {activeChannel?.topic ? (
                <p className="text-[11px] text-zinc-500">{activeChannel.topic}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void runTaskbotScan()}
                className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-amber-200 hover:bg-white/5 disabled:opacity-40"
              >
                {busy ? "…" : "Scan → Taskbot"}
              </button>
              <Users className="h-4 w-4 text-zinc-500" />
            </div>
          </header>

          {scanNote ? (
            <p className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-[11px] text-amber-100">
              {scanNote}
            </p>
          ) : null}

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m) => {
              const user = getUser(ws, m.userId);
              const isBot = m.userId.startsWith("bot-");
              return (
                <div key={m.id} className="group flex gap-3 hover:bg-white/[0.02] rounded-lg px-1 py-0.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                    style={{ backgroundColor: user?.color || "#611f69" }}
                  >
                    {isBot ? "◎" : user?.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-bold text-white">{user?.name || "Unknown"}</span>
                      <span className="ml-2 text-[11px] text-zinc-500">{formatTime(m.ts)}</span>
                    </p>
                    <div
                      className="mt-0.5 text-[15px] leading-relaxed text-zinc-200 [&_.slack-mention]:rounded [&_.slack-mention]:bg-[#1264a3]/30 [&_.slack-mention]:px-0.5 [&_.slack-mention]:text-sky-200 [&_.slack-mention-me]:bg-amber-500/30 [&_.slack-mention-me]:text-amber-100"
                      dangerouslySetInnerHTML={{
                        __html: highlightMentions(m.text, profile.handle),
                      }}
                    />
                    {m.attachments?.map((a) =>
                      a.kind === "image" ? (
                        <img
                          key={a.id}
                          src={a.dataUrl}
                          alt={a.name}
                          className="mt-2 max-h-48 max-w-sm rounded-lg border border-white/10"
                        />
                      ) : null
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <div className="border-t border-black/30 p-3">
            {pendingAttachments.length ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {pendingAttachments.map((a) => (
                  <img
                    key={a.id}
                    src={a.dataUrl}
                    alt={a.name}
                    className="h-14 w-14 rounded border border-white/10 object-cover"
                  />
                ))}
              </div>
            ) : null}
            <div className="rounded-xl border border-white/10 bg-[#222529] px-3 py-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                placeholder={`Message #${activeChannel?.name} — use @${profile.handle} for Taskbot mentions`}
                className="w-full resize-none bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickImage} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white"
                  title="Attach screenshot"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
                <select
                  value={botId}
                  onChange={(e) => setBotId(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#322942] px-2 py-1 text-[11px] text-white"
                >
                  {["echo", "sage", "nova", "quill", "ledger", "kira"].map((id) => {
                    const b = getBot(id);
                    if (!b) return null;
                    return (
                      <option key={id} value={id}>
                        AI: {b.glyph} {b.name}
                      </option>
                    );
                  })}
                </select>
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    disabled={busy || !draft.trim()}
                    onClick={() => void askAi()}
                    className="inline-flex items-center gap-1 rounded-lg border border-violet-500/40 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/10 disabled:opacity-40"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Ask AI
                  </button>
                  <button
                    type="button"
                    disabled={!draft.trim() && !pendingAttachments.length}
                    onClick={() => void send()}
                    className="rounded-lg bg-[#007a5a] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#006644] disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI panel */}
        {aiOpen ? (
          <aside className="hidden w-72 shrink-0 flex-col border-l border-black/30 bg-[#19171d] xl:flex">
            <div className="border-b border-black/30 px-3 py-2">
              <p className="text-xs font-medium text-white">
                {bot ? `${bot.glyph} ${bot.name}` : "AI teammate"}
              </p>
              <p className="text-[10px] text-zinc-500">{bot?.tagline}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 text-xs text-zinc-400">
              <p className="italic text-zinc-500">“{bot?.hello}”</p>
              <ul className="mt-4 space-y-2 text-[11px]">
                <li>• Summarize channel → Ask AI with “summarize last 20 messages”</li>
                <li>• @mentions to @{profile.handle} → Taskbot @ For you</li>
                <li>• Paste screenshots → Taskbot captures them</li>
                <li>• Scan → Taskbot extracts tasks & notes</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setAiOpen(false)}
              className="border-t border-black/30 px-3 py-2 text-[10px] text-zinc-500 hover:text-white"
            >
              Hide panel
            </button>
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="hidden w-8 shrink-0 items-center justify-center border-l border-black/30 bg-[#19171d] text-zinc-500 xl:flex"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
        )}
      </div>

      {settingsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1d21] p-5">
            <p className="text-lg font-semibold text-white">Your profile</p>
            <p className="mt-1 text-xs text-zinc-500">
              @handle is used for Taskbot “For you” and highlight in chat.
            </p>
            <label className="mt-4 block text-xs text-zinc-400">
              Display name
              <input
                value={profile.displayName}
                onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
              />
            </label>
            <label className="mt-3 block text-xs text-zinc-400">
              @handle (no spaces)
              <input
                value={profile.handle}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    handle: e.target.value.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 24),
                  }))
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProfile}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .slack-mention {
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
