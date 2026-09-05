import { useState } from "react";
import { loadAiSettings, runAi, saveAiSettings, type AiSettings } from "./ai-client";
import { OFFICE_BOTS, botSystem, getOfficeBot, loadActiveBotId, saveActiveBotId } from "./office-bots";

type Props = {
  appName: string;
  defaultBotId?: string;
  quickActions?: { label: string; prompt: string }[];
  onResult?: (reply: string, botName: string) => void;
  placeholder?: string;
  open: boolean;
  onClose: () => void;
};

export function AiDrawer({ appName, defaultBotId = "quill", quickActions = [], onResult, placeholder, open, onClose }: Props) {
  const [botId, setBotId] = useState(() => loadActiveBotId(defaultBotId));
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [note, setNote] = useState("");
  const [settings, setSettings] = useState<AiSettings>(() => loadAiSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const bot = getOfficeBot(botId) ?? OFFICE_BOTS[0]!;

  if (!open) return null;

  async function ask(prompt: string) {
    setBusy(true);
    setNote(`Thinking… (${bot.name})`);
    const result = await runAi(prompt, botSystem(bot, appName), settings, { maxTokens: 1800 });
    setBusy(false);
    if (result.ok) {
      setNote(`${bot.name} · ${result.lane ?? "AI"}`);
      onResult?.(result.reply, bot.name);
    } else {
      setNote(result.error ?? "Failed");
    }
  }

  return (
    <>
      <div className="ai-drawer-backdrop" onClick={onClose} />
      <aside className="ai-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="ai-drawer-head">
          <h2>Plethora Bots</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="ai-drawer-body">
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--muted)" }}>
            Pick a bot, then ask or use a quick action. BYOK in settings for unlimited use.
          </p>
          <div className="bot-grid">
            {OFFICE_BOTS.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`bot-card ${botId === b.id ? "active" : ""}`}
                onClick={() => {
                  setBotId(b.id);
                  saveActiveBotId(b.id);
                }}
              >
                <span className="bot-glyph">{b.glyph}</span>
                <span className="bot-name">{b.name}</span>
                <span className="bot-tag">{b.tagline}</span>
              </button>
            ))}
          </div>
          {quickActions.map((a) => (
            <button key={a.label} type="button" className="quick-btn" disabled={busy} onClick={() => void ask(a.prompt)}>
              {a.label}
            </button>
          ))}
          <textarea
            className="ai-input"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder ?? `Ask ${bot.name}…`}
          />
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 10 }}
            disabled={busy || !input.trim()}
            onClick={() => void ask(input)}
          >
            {busy ? "Working…" : `Ask ${bot.name}`}
          </button>
          {note ? <div className="ai-note">{note}</div> : null}
          <button type="button" className="btn btn-ghost" style={{ width: "100%", marginTop: 10 }} onClick={() => setSettingsOpen(true)}>
            AI settings (BYOK)
          </button>
        </div>
      </aside>
      {settingsOpen ? (
        <div className="modal-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>AI settings</h3>
            <label>
              BYOK API key
              <input type="password" value={settings.byokKey || ""} onChange={(e) => setSettings((s) => ({ ...s, byokKey: e.target.value || undefined }))} placeholder="sk-or-…" />
            </label>
            <label>
              Model
              <input value={settings.byokModel || ""} onChange={(e) => setSettings((s) => ({ ...s, byokModel: e.target.value || undefined }))} />
            </label>
            <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setSettingsOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={() => { saveAiSettings(settings); setSettingsOpen(false); }}>Save</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AiFab({ onClick, label = "AI" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="ai-fab" onClick={onClick}>
      ✦ {label}
    </button>
  );
}

/** @deprecated use AiDrawer */
export function AiPanel(props: Omit<Props, "open" | "onClose"> & { open?: boolean }) {
  return <AiDrawer {...props} open={props.open ?? true} onClose={() => {}} />;
}
