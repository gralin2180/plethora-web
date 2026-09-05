import { useCallback, useEffect, useMemo, useState } from "react";
import { loadAiSettings, runAi, saveAiSettings, type AiSettings } from "./ai-client";
import {
  itemsForTab,
  loadProfile,
  loadRelayWorkspace,
  loadScout,
  removeItem,
  saveScout,
  scanRelayWithAi,
  syncInboxFromRelay,
  toggleItemDone,
  type ScoutItem,
  type ScoutState,
} from "./scout-store";

type Tab = "all" | "tasks" | "notes" | "screenshots" | "mentions";

const TABS: { id: Tab; label: string }[] = [
  { id: "mentions", label: "@ For you" },
  { id: "tasks", label: "Tasks" },
  { id: "notes", label: "Notes" },
  { id: "screenshots", label: "Screenshots" },
  { id: "all", label: "All" },
];

function ItemRow({
  item,
  onToggle,
  onRemove,
}: {
  item: ScoutItem;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li className={`item ${item.status === "done" ? "done" : ""}`}>
      <button type="button" className={`item-check ${item.status === "done" ? "done" : ""}`} onClick={onToggle}>
        {item.status === "done" ? "✓" : ""}
      </button>
      <div className="item-body">
        <div className="item-meta">
          <span className={`badge badge-${item.type}`}>{item.type}</span>
          {item.priority === "high" ? <span className="badge" style={{ background: "rgba(244,63,94,0.2)", color: "#fda4af" }}>high</span> : null}
          {item.aiGenerated ? <span className="badge" style={{ background: "rgba(34,211,238,0.15)", color: "#67e8f9" }}>AI</span> : null}
        </div>
        <p className="item-text">{item.text}</p>
        {item.imageDataUrl ? <img src={item.imageDataUrl} alt="" /> : null}
        <p className="item-source">
          #{item.source.channelName} · {item.source.authorName}
          {item.assignee ? ` · @${item.assignee}` : ""}
        </p>
      </div>
      <button type="button" className="item-remove" onClick={onRemove} aria-label="Remove">
        ×
      </button>
    </li>
  );
}

export function App() {
  const [state, setState] = useState<ScoutState>(() => syncInboxFromRelay(loadScout()));
  const [tab, setTab] = useState<Tab>("mentions");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const profile = loadProfile();
  const relay = loadRelayWorkspace();

  const refresh = useCallback(() => {
    setState(syncInboxFromRelay(loadScout()));
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 4000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const items = useMemo(() => itemsForTab(state, tab), [state, tab]);
  const mentionCount = itemsForTab(state, "mentions").filter((i) => i.status === "open").length;

  async function scan() {
    setBusy(true);
    const { state: next, note: n } = await scanRelayWithAi(
      (msg, system) => runAi(msg, system, aiSettings),
      { limit: 60 }
    );
    setState(next);
    setNote(n);
    setBusy(false);
  }

  function saveSettings() {
    saveAiSettings(aiSettings);
    setSettingsOpen(false);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">S</div>
        <div>
          <h1>Plethora Tasks</h1>
          <p>Watches Plethora Chat — tasks, notes, @you inbox</p>
        </div>
        <div className="topbar-actions">
          <label style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={state.autoScan}
              onChange={(e) => {
                const next = { ...state, autoScan: e.target.checked };
                setState(next);
                saveScout(next);
              }}
            />
            Auto-sync
          </label>
          <button type="button" className="btn btn-ghost" onClick={() => setSettingsOpen(true)}>
            Settings
          </button>
          <button type="button" className="btn btn-primary" disabled={busy || !relay} onClick={() => void scan()}>
            {busy ? "Scanning…" : "Scan Chat"}
          </button>
        </div>
      </header>

      <div className="layout">
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === "mentions" && mentionCount > 0 ? <span className="count">{mentionCount}</span> : null}
            </button>
          ))}
        </nav>

        <main className="main">
          {!relay ? (
            <div className="banner">
              Open <strong>Plethora Chat</strong> first and send a message — Tasks reads the same workspace on this PC.
            </div>
          ) : (
            <div className="banner" style={{ borderColor: "rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.08)", color: "#6ee7b7" }}>
              Linked to Relay · {relay.messages.length} messages · @{profile.handle} inbox active
            </div>
          )}

          {note ? <div className="note">{note}</div> : null}

          {tab === "mentions" ? (
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
              Everything where someone @mentioned <strong style={{ color: "#fcd34d" }}>@{profile.handle}</strong> in Relay.
            </p>
          ) : null}

          <ul className="item-list">
            {items.length === 0 ? (
              <li className="empty">
                <h3>Nothing here yet</h3>
                <p>
                  {tab === "mentions"
                    ? `Post in Relay with @${profile.handle} — it lands here instantly.`
                    : "Chat in Relay, then hit Scan Relay."}
                </p>
              </li>
            ) : (
              items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => {
                    const next = toggleItemDone(state, item.id);
                    setState(next);
                    saveScout(next);
                  }}
                  onRemove={() => {
                    const next = removeItem(state, item.id);
                    setState(next);
                    saveScout(next);
                  }}
                />
              ))
            )}
          </ul>
        </main>
      </div>

      {settingsOpen ? (
        <div className="modal-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: 0 }}>Scout settings</h3>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>BYOK for AI scan · free Plethora pool otherwise</p>
            <label>
              BYOK API key
              <input
                type="password"
                value={aiSettings.byokKey || ""}
                onChange={(e) => setAiSettings((s) => ({ ...s, byokKey: e.target.value || undefined }))}
                placeholder="sk-or-…"
              />
            </label>
            <label>
              Model
              <input
                value={aiSettings.byokModel || ""}
                onChange={(e) => setAiSettings((s) => ({ ...s, byokModel: e.target.value || undefined }))}
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setSettingsOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveSettings}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
