import { useEffect, useMemo, useState } from "react";
import { AiDrawer, AiFab } from "@shared/AiPanel";
import { AppChrome } from "@shared/AppChrome";
import { OFFICE_NAMES } from "@shared/office-names";
import { loadTheme, saveTheme, type AppTheme } from "@shared/theme";

type MailMessage = {
  id: string;
  folder: "inbox" | "sent" | "drafts";
  from: string;
  to: string;
  subject: string;
  body: string;
  ts: number;
  unread?: boolean;
};

const STORAGE = "plethora.mail.v1";

function loadMail(): MailMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw) as MailMessage[];
  } catch {
    /* */
  }
  return [
    {
      id: "welcome",
      folder: "inbox",
      from: "team@plethora.app",
      to: "you@local",
      subject: "Welcome to Plethora Mail",
      body: "Your inbox lives on this PC. Compose, draft with Quill AI, and export when ready.\n\nConnect real SMTP later — this is your local mail desk first.",
      ts: Date.now() - 3600000,
      unread: true,
    },
  ];
}

const META = OFFICE_NAMES.mail;

export function App() {
  const [messages, setMessages] = useState<MailMessage[]>(() => loadMail());
  const [folder, setFolder] = useState<"inbox" | "sent" | "drafts">("inbox");
  const [selectedId, setSelectedId] = useState<string | null>("welcome");
  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState({ to: "", subject: "", body: "" });
  const [theme, setTheme] = useState<AppTheme>(() => loadTheme());
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(messages));
  }, [messages]);

  const folderMessages = useMemo(() => messages.filter((m) => m.folder === folder).sort((a, b) => b.ts - a.ts), [messages, folder]);
  const selected = messages.find((m) => m.id === selectedId) ?? folderMessages[0];

  function sendMail() {
    const to = draft.to.trim();
    const subject = draft.subject.trim();
    const body = draft.body.trim();
    if (!to || !subject) return;
    const msg: MailMessage = {
      id: crypto.randomUUID(),
      folder: "sent",
      from: "you@local",
      to,
      subject,
      body,
      ts: Date.now(),
    };
    setMessages((m) => [msg, ...m]);
    setFolder("sent");
    setSelectedId(msg.id);
    setComposeOpen(false);
    setDraft({ to: "", subject: "", body: "" });
  }

  function saveDraft() {
    const msg: MailMessage = {
      id: crypto.randomUUID(),
      folder: "drafts",
      from: "you@local",
      to: draft.to,
      subject: draft.subject || "(no subject)",
      body: draft.body,
      ts: Date.now(),
    };
    setMessages((m) => [msg, ...m]);
    setFolder("drafts");
    setSelectedId(msg.id);
    setComposeOpen(false);
  }

  function markRead(id: string) {
    setMessages((m) => m.map((x) => (x.id === id ? { ...x, unread: false } : x)));
  }

  return (
    <AppChrome
      name={META.name}
      letter={META.letter}
      accent={META.accent}
      tagline={META.tagline}
      theme={theme}
      onThemeToggle={() => {
        const next: AppTheme = theme === "dark" ? "light" : "dark";
        setTheme(next);
        saveTheme(next);
      }}
      actions={
        <button type="button" className="btn btn-accent" onClick={() => setComposeOpen(true)}>
          ✎ Compose
        </button>
      }
      aiFab={<AiFab label="Draft with AI" onClick={() => setAiOpen(true)} />}
    >
      <div className="layout-row mail-layout">
        <aside className="mail-sidebar">
          {(["inbox", "sent", "drafts"] as const).map((f) => (
            <button key={f} type="button" className={`mail-folder ${folder === f ? "active" : ""}`} onClick={() => { setFolder(f); setSelectedId(null); }}>
              {f === "inbox" ? "📥 Inbox" : f === "sent" ? "📤 Sent" : "📝 Drafts"}
              <span className="mail-count">{messages.filter((m) => m.folder === f).length}</span>
            </button>
          ))}
        </aside>
        <div className="mail-list">
          {folderMessages.length === 0 ? (
            <div className="empty-state"><h3>Empty</h3><p>Nothing in {folder}.</p></div>
          ) : (
            folderMessages.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`mail-row ${selected?.id === m.id ? "active" : ""} ${m.unread ? "unread" : ""}`}
                onClick={() => { setSelectedId(m.id); markRead(m.id); }}
              >
                <span className="mail-row-from">{m.folder === "sent" ? `To: ${m.to}` : m.from}</span>
                <span className="mail-row-subject">{m.subject}</span>
                <span className="mail-row-preview">{m.body.slice(0, 60)}</span>
              </button>
            ))
          )}
        </div>
        <article className="mail-read card">
          {selected ? (
            <>
              <h2 className="mail-read-subject">{selected.subject}</h2>
              <p className="mail-read-meta">
                {selected.folder === "sent" ? `To ${selected.to}` : `From ${selected.from}`} · {new Date(selected.ts).toLocaleString()}
              </p>
              <div className="mail-read-body">{selected.body.split("\n").map((line, i) => <p key={i}>{line}</p>)}</div>
              <button type="button" className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => { setDraft({ to: selected.from.replace(/@.*/, "") + "@", subject: `Re: ${selected.subject}`, body: `\n\n---\n${selected.body}` }); setComposeOpen(true); }}>
                Reply
              </button>
            </>
          ) : (
            <div className="empty-state"><p>Select a message</p></div>
          )}
        </article>
      </div>

      {composeOpen ? (
        <div className="modal-overlay" onClick={() => setComposeOpen(false)}>
          <div className="modal mail-compose" onClick={(e) => e.stopPropagation()}>
            <h3>New message</h3>
            <label>To<input className="text-input" value={draft.to} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} placeholder="name@company.com" /></label>
            <label>Subject<input className="text-input" value={draft.subject} onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))} /></label>
            <label>Body<textarea className="text-input" rows={8} value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} /></label>
            <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost" onClick={saveDraft}>Save draft</button>
              <button type="button" className="btn btn-ghost" onClick={() => setComposeOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={sendMail}>Send</button>
            </div>
          </div>
        </div>
      ) : null}

      <AiDrawer
        appName="Mail"
        defaultBotId="quill"
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        quickActions={[
          { label: "Professional reply", prompt: `Write a professional email reply.\nOriginal:\n${selected?.body || ""}` },
          { label: "Short follow-up", prompt: "Write a 3-sentence follow-up email asking for status update" },
        ]}
        onResult={(reply) => {
          setDraft((d) => ({ ...d, body: reply }));
          setComposeOpen(true);
          setAiOpen(false);
        }}
        placeholder="Describe the email you need…"
      />
    </AppChrome>
  );
}
