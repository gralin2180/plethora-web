import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AiDrawer, AiFab } from "@shared/AiPanel";
import { AppChrome } from "@shared/AppChrome";
import { OFFICE_NAMES } from "@shared/office-names";
import { loadTheme, saveTheme, type AppTheme } from "@shared/theme";

type Doc = { id: string; title: string; html: string; updatedAt: number };

const STORAGE = "plethora.office.docs.v2";

const TEMPLATES = [
  { id: "blank", label: "Blank", title: "Untitled", html: "<p></p>" },
  {
    id: "memo",
    label: "Memo",
    title: "Internal memo",
    html: "<h2>Summary</h2><p></p><h2>Next steps</h2><ol><li></li></ol>",
  },
  {
    id: "proposal",
    label: "Proposal",
    title: "Project proposal",
    html: "<h2>Problem</h2><p></p><h2>Solution</h2><p></p><h2>Timeline</h2><p></p>",
  },
];

function loadDocs(): Doc[] {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw) as Doc[];
  } catch {
    /* */
  }
  return [{ id: "default", title: "Untitled", html: "<p></p>", updatedAt: Date.now() }];
}

function exec(cmd: string, val?: string) {
  document.execCommand(cmd, false, val);
}

const META = OFFICE_NAMES.docs;

export function App() {
  const [docs, setDocs] = useState<Doc[]>(() => loadDocs());
  const [activeId, setActiveId] = useState(() => loadDocs()[0]?.id ?? "default");
  const [theme, setTheme] = useState<AppTheme>(() => loadTheme());
  const [selection, setSelection] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [saved, setSaved] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);

  const active = docs.find((d) => d.id === activeId) ?? docs[0]!;

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(docs));
    setSaved(true);
  }, [docs]);

  useEffect(() => {
    if (!editorRef.current || !active) return;
    editorRef.current.innerHTML = active.html || "<p></p>";
  }, [activeId, active?.id]);

  const persistBody = useCallback(() => {
    if (!editorRef.current || !active) return;
    const html = editorRef.current.innerHTML;
    setSaved(false);
    setDocs((list) =>
      list.map((d) => (d.id === active.id ? { ...d, html, updatedAt: Date.now() } : d))
    );
  }, [active]);

  const wordCount = useMemo(() => {
    const text = (active?.html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return text ? text.split(" ").length : 0;
  }, [active?.html]);

  function setTitle(title: string) {
    if (!active) return;
    setDocs((list) => list.map((d) => (d.id === active.id ? { ...d, title, updatedAt: Date.now() } : d)));
    setSaved(false);
  }

  function newDoc(templateId?: string) {
    const t = TEMPLATES.find((x) => x.id === templateId) ?? TEMPLATES[0]!;
    const doc: Doc = { id: crypto.randomUUID(), title: t.title, html: t.html, updatedAt: Date.now() };
    setDocs((list) => [doc, ...list]);
    setActiveId(doc.id);
  }

  function applyHtml(html: string) {
    if (!editorRef.current) return;
    const clean = html.replace(/^```html?\n?/i, "").replace(/```$/i, "").trim();
    editorRef.current.innerHTML = clean || "<p></p>";
    persistBody();
    setAiOpen(false);
  }

  function exportFile(ext: "html" | "txt") {
    const html = editorRef.current?.innerHTML || active.html;
    const title = active.title;
    const text =
      ext === "txt"
        ? `${title}\n\n${html.replace(/<[^>]+>/g, " ")}`
        : `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${html}</body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    a.download = `${title.replace(/\s+/g, "-") || "document"}.${ext}`;
    a.click();
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
          <select
            onChange={(e) => newDoc(e.target.value || undefined)}
            defaultValue=""
            className="btn btn-ghost"
            style={{ padding: "6px 10px" }}
          >
            <option value="" disabled>New from template</option>
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <button type="button" className="btn btn-ghost" onClick={() => exportFile("html")}>Export</button>
        </>
      }
      aiFab={<AiFab label="Ask Quill" onClick={() => setAiOpen(true)} />}
    >
      <div className="draft-shell">
        <aside className="draft-sidebar">
          <div className="draft-sidebar-head">
            <h2>Documents</h2>
            <button type="button" className="draft-new-btn" onClick={() => newDoc()}>+ New document</button>
          </div>
          <div className="draft-doc-list">
            {docs
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`draft-doc-item ${d.id === activeId ? "active" : ""}`}
                  onClick={() => setActiveId(d.id)}
                >
                  <strong>{d.title || "Untitled"}</strong>
                  <span>{new Date(d.updatedAt).toLocaleDateString()}</span>
                </button>
              ))}
          </div>
        </aside>

        <div className="draft-main">
          <div className="draft-toolbar">
            <div className="draft-toolbar-group">
              {(["bold", "italic", "underline"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  className="ribbon-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { editorRef.current?.focus(); exec(c); persistBody(); }}
                >
                  {c === "bold" ? "B" : c === "italic" ? "I" : "U"}
                </button>
              ))}
            </div>
            <div className="draft-toolbar-group">
              <button type="button" className="ribbon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => { editorRef.current?.focus(); exec("insertUnorderedList"); persistBody(); }}>• List</button>
              <button type="button" className="ribbon-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => { editorRef.current?.focus(); exec("formatBlock", "h2"); persistBody(); }}>Heading</button>
            </div>
            <div className="draft-toolbar-spacer" />
            <span className="draft-save-hint">{saved ? "Saved" : "Saving…"}</span>
          </div>

          <div className="draft-editor-area" onMouseUp={() => setSelection(window.getSelection()?.toString() || "")}>
            <div className="draft-page">
              <div className="draft-page-head">
                <input
                  className="doc-title"
                  value={active.title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={persistBody}
                  placeholder="Untitled document"
                />
              </div>
              <div
                ref={editorRef}
                className="doc-body"
                contentEditable
                suppressContentEditableWarning
                onInput={persistBody}
              />
            </div>
          </div>

          <div className="draft-statusbar">
            <span>{wordCount} words</span>
            <span>Local on this PC</span>
          </div>
        </div>
      </div>

      <AiDrawer
        appName="Docs"
        defaultBotId="quill"
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        placeholder="Ask Quill to rewrite, expand, or structure…"
        quickActions={[
          { label: "Executive summary", prompt: `Write an executive summary HTML for:\nTitle: ${active.title}\nBody: ${editorRef.current?.innerHTML || active.html}\nSelection: ${selection}` },
          { label: "Fix grammar & tone", prompt: `Return improved HTML for this document:\n${editorRef.current?.innerHTML || active.html}` },
          { label: "Expand selection", prompt: selection ? `Expand this into a paragraph (HTML):\n${selection}` : `Expand the last paragraph.` },
        ]}
        onResult={(reply) => {
          if (reply.includes("<p>") || reply.includes("<h")) applyHtml(reply);
        }}
      />
    </AppChrome>
  );
}
