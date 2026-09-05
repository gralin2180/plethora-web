import { useEffect, useMemo, useState } from "react";
import { AiDrawer, AiFab } from "@shared/AiPanel";
import { AppChrome } from "@shared/AppChrome";
import { OFFICE_NAMES } from "@shared/office-names";
import { loadTheme, saveTheme, type AppTheme } from "@shared/theme";

type Step = { id: string; label: string; note?: string };

const META = OFFICE_NAMES.flow;

const DEFAULT: Step[] = [
  { id: "1", label: "Intake", note: "What comes in?" },
  { id: "2", label: "Make", note: "Where work happens" },
  { id: "3", label: "Review", note: "QA / approval" },
  { id: "4", label: "Ship", note: "Done — out the door" },
];

export function App() {
  const [steps, setSteps] = useState<Step[]>(DEFAULT);
  const [theme, setTheme] = useState<AppTheme>(() => loadTheme());
  const [aiOpen, setAiOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("plethora.office.flow");
      if (raw) setSteps(JSON.parse(raw));
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("plethora.office.flow", JSON.stringify(steps));
  }, [steps]);

  const mermaid = useMemo(() => {
    const nodes = steps.map((s, i) => `  s${i}["${s.label.replace(/"/g, "")}"]`).join("\n");
    const edges = steps.slice(0, -1).map((_, i) => `  s${i} --> s${i + 1}`).join("\n");
    return `flowchart LR\n${nodes}\n${edges}`;
  }, [steps]);

  function applyAiLines(text: string) {
    const lines = text.split("\n").map((l) => l.replace(/^[\d.)\-*]+\s*/, "").trim()).filter(Boolean).slice(0, 12);
    if (lines.length) {
      setSteps(lines.map((label, i) => ({ id: crypto.randomUUID(), label, note: "" })));
      setAiOpen(false);
    }
  }

  function addStep() {
    setSteps((s) => [...s, { id: crypto.randomUUID(), label: "New step", note: "" }]);
  }

  function removeStep(id: string) {
    if (steps.length <= 2) return;
    setSteps((s) => s.filter((x) => x.id !== id));
  }

  function moveStep(id: string, dir: -1 | 1) {
    setSteps((s) => {
      const idx = s.findIndex((x) => x.id === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= s.length) return s;
      const copy = [...s];
      [copy[idx], copy[next]] = [copy[next]!, copy[idx]!];
      return copy;
    });
  }

  return (
    <AppChrome
      name={META.name}
      letter={META.letter}
      accent={META.accent}
      tagline="Map any workflow — film, fashion, IT, game dev. Export to Mermaid for Lucid, Miro, or docs."
      theme={theme}
      onThemeToggle={() => {
        const next: AppTheme = theme === "dark" ? "light" : "dark";
        setTheme(next);
        saveTheme(next);
      }}
      actions={
        <>
          <button type="button" className="btn btn-ghost" onClick={() => setShowExport((v) => !v)}>
            {showExport ? "Hide export" : "Export"}
          </button>
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => {
              void navigator.clipboard.writeText(mermaid);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? "Copied!" : "Copy Mermaid"}
          </button>
        </>
      }
      aiFab={<AiFab label="Ask Kira" onClick={() => setAiOpen(true)} />}
    >
      <div className="main-pane">
        <div className="help-banner">
          <span>💡</span>
          <div>
            <strong>What is Trace?</strong> It turns a brief into a step-by-step pipeline you can edit, share, and paste into diagram tools — not a full Lucidchart clone, but the fastest way to go from idea → flow.
          </div>
        </div>

        <div className="trace-timeline">
          {steps.map((step, i) => (
            <div key={step.id} className="trace-step card">
              <div className="trace-step-num">{i + 1}</div>
              <div className="trace-step-body">
                <label className="field-label">Step name</label>
                <input
                  className="text-input"
                  value={step.label}
                  onChange={(e) => setSteps((st) => st.map((x) => (x.id === step.id ? { ...x, label: e.target.value } : x)))}
                />
                <label className="field-label" style={{ marginTop: 10 }}>Note (optional)</label>
                <input
                  className="text-input"
                  value={step.note || ""}
                  placeholder="Who owns this? Tools?"
                  onChange={(e) => setSteps((st) => st.map((x) => (x.id === step.id ? { ...x, note: e.target.value } : x)))}
                />
              </div>
              <div className="trace-step-actions">
                <button type="button" className="btn btn-ghost" disabled={i === 0} onClick={() => moveStep(step.id, -1)} title="Move up">↑</button>
                <button type="button" className="btn btn-ghost" disabled={i === steps.length - 1} onClick={() => moveStep(step.id, 1)} title="Move down">↓</button>
                <button type="button" className="btn btn-ghost" onClick={() => removeStep(step.id)} title="Remove" style={{ color: "var(--rose)" }}>×</button>
              </div>
            </div>
          ))}
        </div>

        <button type="button" className="btn btn-ghost" style={{ marginTop: 12 }} onClick={addStep}>
          + Add step
        </button>

        {showExport ? (
          <div className="card" style={{ marginTop: 20 }}>
            <p className="field-label">Mermaid (paste into Notion, GitHub, Miro import, etc.)</p>
            <pre className="trace-mermaid">{mermaid}</pre>
          </div>
        ) : null}
      </div>

      <AiDrawer
        appName="Trace"
        defaultBotId="kira"
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        quickActions={[
          { label: "Fashion drop pipeline", prompt: "Return 6 short process step labels for a fashion collection drop, one per line" },
          { label: "Film post-production", prompt: "Return 8 steps for indie film post-production pipeline, one per line" },
          { label: "IT incident response", prompt: "Return 7 steps for IT incident response runbook, one per line" },
        ]}
        onResult={applyAiLines}
        placeholder="Describe your workflow — Kira returns steps…"
      />
    </AppChrome>
  );
}
