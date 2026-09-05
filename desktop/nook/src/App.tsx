import { useEffect, useState } from "react";
import { AppChrome } from "@shared/AppChrome";
import { OFFICE_BOTS, botSystem, getOfficeBot } from "@shared/office-bots";
import { loadAiSettings, runAi } from "@shared/ai-client";
import { OFFICE_NAMES } from "@shared/office-names";
import { loadTheme, saveTheme, type AppTheme } from "@shared/theme";

type Msg = { role: "user" | "bot"; text: string; botName?: string };
type Channel = { id: string; name: string; msgs: Msg[] };

const META = OFFICE_NAMES.rooms;

export function App() {
  const [channels, setChannels] = useState<Channel[]>([
    { id: "general", name: "general", msgs: [] },
    { id: "ideas", name: "ideas", msgs: [] },
  ]);
  const [active, setActive] = useState("general");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [botId, setBotId] = useState("echo");
  const [theme, setTheme] = useState<AppTheme>(() => loadTheme());

  const ch = channels.find((c) => c.id === active)!;
  const bot = getOfficeBot(botId) ?? OFFICE_BOTS[0]!;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("plethora.office.rooms");
      if (raw) setChannels(JSON.parse(raw));
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("plethora.office.rooms", JSON.stringify(channels));
  }, [channels]);

  async function send() {
    const text = input.trim();
    if (!text || !ch) return;
    setInput("");
    const history = [...ch.msgs, { role: "user" as const, text }];
    setChannels((all) => all.map((c) => (c.id === ch.id ? { ...c, msgs: history } : c)));
    setBusy(true);
    const prompt = `#${ch.name}\n${history.slice(-8).map((m) => `${m.role}: ${m.text}`).join("\n")}\n\nReply as ${bot.name}.`;
    const result = await runAi(prompt, botSystem(bot, "Nook"), loadAiSettings());
    setChannels((all) =>
      all.map((c) =>
        c.id === ch.id
          ? {
              ...c,
              msgs: [...history, { role: "bot", text: result.ok ? result.reply : result.error || "No reply", botName: bot.name }].slice(-80),
            }
          : c
      )
    );
    setBusy(false);
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
    >
      <div className="layout-row">
        <aside className="nook-sidebar">
          <p className="nook-label">Channels</p>
          {channels.map((c) => (
            <button key={c.id} type="button" className={`nook-ch ${c.id === active ? "active" : ""}`} onClick={() => setActive(c.id)}>
              #{c.name}
            </button>
          ))}
          <button
            type="button"
            className="nook-add"
            onClick={() => {
              const name = window.prompt("Channel name?");
              if (!name?.trim()) return;
              const id = name.trim().toLowerCase().replace(/\s+/g, "-");
              setChannels((c) => [...c, { id, name: name.trim(), msgs: [] }]);
              setActive(id);
            }}
          >
            + New channel
          </button>
          <p className="nook-label" style={{ marginTop: 20 }}>
            Teammate bot
          </p>
          <select value={botId} onChange={(e) => setBotId(e.target.value)} className="nook-select">
            {OFFICE_BOTS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.glyph} {b.name}
              </option>
            ))}
          </select>
          <div className="help-banner" style={{ marginTop: 16, flexDirection: "column", fontSize: 12 }}>
            <strong>Tip</strong>
            <span>Echo for notes, Nova for ideas, Sage for plans. Messages stay on this device.</span>
          </div>
        </aside>
        <div className="nook-chat">
          <p className="nook-meta">
            #{ch?.name} · chatting with {bot.glyph} {bot.name}
          </p>
          <div className="nook-msgs">
            {ch?.msgs.length === 0 ? (
              <div className="empty-state">
                <h3>Start the conversation</h3>
                <p>Say hi — {bot.name} will reply using Plethora AI.</p>
              </div>
            ) : (
              ch?.msgs.map((m, i) => (
                <div key={i} className={`nook-msg ${m.role}`}>
                  {m.role === "bot" ? <span className="nook-bot-tag">{m.botName ?? "Bot"}</span> : null}
                  {m.text}
                </div>
              ))
            )}
            {busy ? <p className="nook-typing">{bot.name} is typing…</p> : null}
          </div>
          <div className="nook-compose">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void send()}
              placeholder={`Message #${ch?.name}…`}
            />
            <button type="button" className="btn btn-primary" disabled={busy || !input.trim()} onClick={() => void send()}>
              Send
            </button>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}
