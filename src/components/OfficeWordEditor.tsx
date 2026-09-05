"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlignLeft,
  Bold,
  Download,
  FileText,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo,
  Strikethrough,
  Underline,
  Undo,
} from "lucide-react";
import { OfficeAssistantPanel } from "@/components/OfficeAssistantPanel";
import { trackToolUse } from "@/lib/self-learn";

const STORAGE_TITLE = "plethora.office.word.title";
const STORAGE_BODY = "plethora.office.word.bodyHtml";

const TEMPLATES: { id: string; label: string; title: string; html: string }[] = [
  {
    id: "blank",
    label: "Blank",
    title: "Untitled",
    html: "<p></p>",
  },
  {
    id: "memo",
    label: "Memo",
    title: "Internal memo",
    html: `<h1>Memo</h1><p><strong>To:</strong> </p><p><strong>From:</strong> </p><p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p><p><strong>Re:</strong> </p><hr/><h2>Summary</h2><p></p><h2>Details</h2><ul><li></li></ul><h2>Next steps</h2><ol><li></li></ol>`,
  },
  {
    id: "proposal",
    label: "Proposal",
    title: "Project proposal",
    html: `<h1>Proposal</h1><p><em>One-line pitch</em></p><h2>Problem</h2><p></p><h2>Solution</h2><p></p><h2>Timeline</h2><ul><li>Week 1 — </li><li>Week 2 — </li></ul><h2>Budget</h2><p></p>`,
  },
  {
    id: "script",
    label: "Script",
    title: "Screenplay draft",
    html: `<h1>Title</h1><p><strong>INT. LOCATION — DAY</strong></p><p>Action line.</p><p><strong>CHARACTER</strong></p><p>Dialogue.</p>`,
  },
  {
    id: "sop",
    label: "SOP",
    title: "Standard operating procedure",
    html: `<h1>SOP</h1><h2>Purpose</h2><p></p><h2>Scope</h2><p></p><h2>Steps</h2><ol><li></li><li></li></ol><h2>Escalation</h2><p></p>`,
  },
];

function stripHtml(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, " ");
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.textContent || "";
}

function wordCount(html: string) {
  const t = stripHtml(html).trim();
  if (!t) return { words: 0, chars: 0, readMin: 0 };
  const words = t.split(/\s+/).filter(Boolean).length;
  return { words, chars: t.length, readMin: Math.max(1, Math.ceil(words / 200)) };
}

function exec(cmd: string, val?: string) {
  document.execCommand(cmd, false, val);
}

export function OfficeWordEditor() {
  const [title, setTitle] = useState("Untitled");
  const [ready, setReady] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);
  const [selection, setSelection] = useState("");
  const [tick, setTick] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem(STORAGE_TITLE);
      const h = localStorage.getItem(STORAGE_BODY);
      const legacy = localStorage.getItem("plethora.office.word.body");
      if (t) setTitle(t);
      if (editorRef.current) {
        if (h) editorRef.current.innerHTML = h;
        else if (legacy) {
          editorRef.current.innerHTML = legacy
            .split(/\n\n+/)
            .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
            .join("");
        } else editorRef.current.innerHTML = "<p></p>";
      }
    } catch {
      /* */
    }
    setReady(true);
  }, []);

  const persist = useCallback(() => {
    if (!editorRef.current) return;
    try {
      localStorage.setItem(STORAGE_TITLE, title);
      localStorage.setItem(STORAGE_BODY, editorRef.current.innerHTML);
    } catch {
      /* */
    }
  }, [title]);

  useEffect(() => {
    if (!ready) return;
    const id = window.setInterval(persist, 2000);
    return () => window.clearInterval(id);
  }, [ready, persist, title]);

  function bodyHtml() {
    return editorRef.current?.innerHTML || "";
  }

  function captureSelection() {
    const sel = window.getSelection()?.toString() || "";
    setSelection(sel);
    return sel;
  }

  function applyHtml(html: string) {
    if (!editorRef.current) return;
    const clean = html.replace(/^```html?\n?/i, "").replace(/```$/i, "").trim();
    editorRef.current.innerHTML = clean || "<p></p>";
    persist();
    void trackToolUse("office-word", 3);
  }

  function loadTemplate(id: string) {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t || !editorRef.current) return;
    if (bodyHtml().replace(/<[^>]+>/g, "").trim() && !window.confirm("Replace current document?")) return;
    setTitle(t.title);
    editorRef.current.innerHTML = t.html;
    persist();
  }

  function exportFile(ext: "html" | "txt") {
    const html = bodyHtml();
    const text = ext === "txt" ? `${title}\n\n${stripHtml(html)}` : `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${html}</body></html>`;
    const blob = new Blob([text], { type: ext === "html" ? "text/html" : "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/\s+/g, "-") || "document"}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const stats = wordCount(bodyHtml());
  void tick;

  function onEditorInput() {
    setTick((n) => n + 1);
    persist();
  }

  if (!ready) {
    return <p className="text-sm text-zinc-500">Loading editor…</p>;
  }

  return (
    <div className="flex min-h-[calc(100dvh-12rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Ribbon */}
        <div className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-[#0e0e16] px-2 py-2">
          <select
            onChange={(e) => loadTemplate(e.target.value)}
            defaultValue=""
            className="mr-2 rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white"
          >
            <option value="" disabled>
              Template
            </option>
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          {[
            { icon: Bold, cmd: "bold", label: "Bold" },
            { icon: Italic, cmd: "italic", label: "Italic" },
            { icon: Underline, cmd: "underline", label: "Underline" },
            { icon: Strikethrough, cmd: "strikeThrough", label: "Strike" },
          ].map(({ icon: Icon, cmd, label }) => (
            <button
              key={cmd}
              type="button"
              title={label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editorRef.current?.focus();
                exec(cmd);
                persist();
              }}
              className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <span className="mx-1 h-6 w-px bg-white/10" />
          <button
            type="button"
            title="Heading 1"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              editorRef.current?.focus();
              exec("formatBlock", "h1");
              persist();
            }}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Heading 2"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              editorRef.current?.focus();
              exec("formatBlock", "h2");
              persist();
            }}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Paragraph"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              editorRef.current?.focus();
              exec("formatBlock", "p");
              persist();
            }}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Bullet list"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              editorRef.current?.focus();
              exec("insertUnorderedList");
              persist();
            }}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Numbered list"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              editorRef.current?.focus();
              exec("insertOrderedList");
              persist();
            }}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Quote"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              editorRef.current?.focus();
              exec("formatBlock", "blockquote");
              persist();
            }}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Horizontal rule"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              editorRef.current?.focus();
              exec("insertHorizontalRule");
              persist();
            }}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="mx-1 h-6 w-px bg-white/10" />
          <button
            type="button"
            title="Undo"
            onClick={() => exec("undo")}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Redo"
            onClick={() => exec("redo")}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <Redo className="h-4 w-4" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportFile("txt")}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" /> .txt
            </button>
            <button
              type="button"
              onClick={() => exportFile("html")}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              <Download className="h-3.5 w-3.5" /> .html
            </button>
          </div>
        </div>

        {/* Title + stats */}
        <div className="border-b border-white/5 px-4 py-3 sm:px-8">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={persist}
            className="w-full bg-transparent text-2xl font-semibold text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-white"
            placeholder="Document title"
          />
          <p className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
            <FileText className="h-3 w-3" />
            {stats.words} words · {stats.chars} chars · ~{stats.readMin} min read
            {selection ? <span className="text-violet-400"> · selection active for AI</span> : null}
          </p>
        </div>

        {/* Page */}
        <div
          className="min-h-0 flex-1 overflow-y-auto bg-[#52525b] px-4 py-8 sm:px-8"
          onMouseUp={captureSelection}
          onKeyUp={captureSelection}
        >
          <div
            className="mx-auto min-h-[70vh] max-w-[48rem] rounded-sm bg-white px-10 py-12 shadow-2xl shadow-black/50 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_strong]:font-semibold"
          >
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={onEditorInput}
              className="min-h-[60vh] text-[15px] text-zinc-900 outline-none"
              role="textbox"
              aria-label="Document body"
            />
          </div>
        </div>

        <p className="border-t border-white/10 px-4 py-2 text-[10px] text-zinc-600">
          Plethora Word — inspired by Microsoft Word, not Word. Saved in this browser. Open .html in Word
          or Google Docs to convert.
        </p>
      </div>

      <OfficeAssistantPanel
        app="word"
        title={title}
        body={bodyHtml()}
        selection={selection}
        onApplyHtml={applyHtml}
        open={aiOpen}
        onOpenChange={setAiOpen}
      />
    </div>
  );
}
