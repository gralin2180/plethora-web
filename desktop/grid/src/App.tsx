import { useEffect, useState } from "react";
import { AiDrawer, AiFab } from "@shared/AiPanel";
import { AppChrome } from "@shared/AppChrome";
import { OFFICE_NAMES } from "@shared/office-names";
import { loadTheme, saveTheme, type AppTheme } from "@shared/theme";

type Card = { id: string; title: string };
type Col = { id: string; name: string; cards: Card[] };

const DEFAULT: Col[] = [
  { id: "backlog", name: "Backlog", cards: [] },
  { id: "doing", name: "Doing", cards: [] },
  { id: "review", name: "Review", cards: [] },
  { id: "done", name: "Done", cards: [] },
];

const META = OFFICE_NAMES.boards;

export function App() {
  const [cols, setCols] = useState<Col[]>(DEFAULT);
  const [draft, setDraft] = useState("");
  const [theme, setTheme] = useState<AppTheme>(() => loadTheme());
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("plethora.office.boards");
      if (raw) setCols(JSON.parse(raw));
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("plethora.office.boards", JSON.stringify(cols));
  }, [cols]);

  function addCard() {
    const t = draft.trim();
    if (!t) return;
    setCols((c) => c.map((col, i) => (i === 0 ? { ...col, cards: [{ id: crypto.randomUUID(), title: t }, ...col.cards] } : col)));
    setDraft("");
  }

  function move(id: string, dir: -1 | 1) {
    setCols((prev) => {
      const next = prev.map((c) => ({ ...c, cards: [...c.cards] }));
      let from = -1,
        idx = -1;
      next.forEach((c, i) => {
        const j = c.cards.findIndex((x) => x.id === id);
        if (j >= 0) {
          from = i;
          idx = j;
        }
      });
      if (from < 0) return prev;
      const to = from + dir;
      if (to < 0 || to >= next.length) return prev;
      const [card] = next[from].cards.splice(idx, 1);
      next[to].cards.unshift(card);
      return next;
    });
  }

  function addCardsFromAi(text: string) {
    const lines = text
      .split("\n")
      .map((l) => l.replace(/^[\d.)\-*]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 12);
    if (!lines.length) return;
    setCols((c) =>
      c.map((col, i) =>
        i === 0 ? { ...col, cards: [...lines.map((title) => ({ id: crypto.randomUUID(), title })), ...col.cards] } : col
      )
    );
    setAiOpen(false);
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
        <>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCard()}
            placeholder="New card title…"
            className="grid-input"
          />
          <button type="button" className="btn btn-primary" onClick={addCard}>
            Add card
          </button>
        </>
      }
      aiFab={<AiFab label="Ask Sage" onClick={() => setAiOpen(true)} />}
    >
      <div className="main-pane" style={{ paddingBottom: 0 }}>
        <div className="help-banner">
          <span>📋</span>
          <div>
            <strong>How Grid works:</strong> Type a card and hit Enter. Use ← → on each card to move it across columns. Open Sage to turn a project brief into a backlog instantly.
          </div>
        </div>
        <div className="grid-board">
          {cols.map((col, ci) => (
            <div key={col.id} className={`grid-col c${ci}`}>
              <p className="grid-col-name">
                {col.name} ({col.cards.length})
              </p>
              <ul className="grid-cards">
                {col.cards.length === 0 ? (
                  <li className="empty-state" style={{ padding: "24px 12px", fontSize: 13 }}>
                    No cards
                  </li>
                ) : (
                  col.cards.map((card) => (
                    <li key={card.id} className="grid-card">
                      <p>{card.title}</p>
                      <div className="grid-card-actions">
                        <button type="button" disabled={ci === 0} onClick={() => move(card.id, -1)} title="Move left">
                          ←
                        </button>
                        <button type="button" disabled={ci === cols.length - 1} onClick={() => move(card.id, 1)} title="Move right">
                          →
                        </button>
                        <button
                          type="button"
                          className="del"
                          onClick={() => setCols((c) => c.map((x) => ({ ...x, cards: x.cards.filter((k) => k.id !== card.id) })))}
                          title="Delete"
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <AiDrawer
        appName="Grid"
        defaultBotId="sage"
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        quickActions={[
          { label: "Lookbook shoot", prompt: "Return 8-12 short kanban card titles for a summer lookbook shoot + post production, one per line, no bullets" },
          { label: "Product launch", prompt: "Return 10 kanban card titles for a small product launch, one per line" },
        ]}
        onResult={addCardsFromAi}
        placeholder="Describe a project — Sage returns card titles…"
      />
    </AppChrome>
  );
}
