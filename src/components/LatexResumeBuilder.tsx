"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { trackToolUse } from "@/lib/self-learn";
import {
  buildDocxBlob,
  buildLatex,
  buildPdfBlob,
  draftToPlain,
  emptyDraft,
  fileSlug,
  improveResume,
  parseResumeText,
  readResumeFile,
  scoreResumeText,
  type ResumeDraft,
} from "@/lib/resume-ats";

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

const STEPS = [
  { id: "contact", label: "1. Contact" },
  { id: "skills", label: "2. Skills" },
  { id: "summary", label: "3. Summary" },
  { id: "experience", label: "4. Experience" },
  { id: "education", label: "5. School" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export function LatexResumeBuilder() {
  const [draft, setDraft] = useState<ResumeDraft>(emptyDraft);
  const [step, setStep] = useState<StepId>("contact");
  const [job, setJob] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [skillDraft, setSkillDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"import" | "ats" | "pdf" | "doc" | null>(null);
  const [status, setStatus] = useState("");
  const [atsNotes, setAtsNotes] = useState<string[]>([]);
  const [importName, setImportName] = useState("");

  const tex = useMemo(() => buildLatex(draft), [draft]);
  const ats = useMemo(() => scoreResumeText(draftToPlain(draft), job), [draft, job]);
  const filled = [
    draft.name,
    draft.email,
    draft.skills.length,
    draft.summary,
    draft.roles.some((r) => r.title),
    draft.education.some((e) => e.school || e.degree),
  ].filter(Boolean).length;

  function patch(p: Partial<ResumeDraft>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  async function track() {
    trackToolUse("latex-resume", 2);
    try {
      await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: "latex-resume" }),
      });
    } catch {
      /* ignore */
    }
  }

  async function onDrop(files: FileList | File[]) {
    const file = Array.from(files)[0];
    if (!file) return;
    setBusy("import");
    setStatus("");
    try {
      const text = await readResumeFile(file);
      const parsed = parseResumeText(text);
      setDraft(parsed);
      setImportName(file.name);
      setStep("summary");
      setStatus(`Filled from ${file.name}. Fix anything the parser missed, then run ATS Solver.`);
      await track();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not read that file.");
    }
    setBusy(null);
  }

  function addSkill(raw?: string) {
    const bits = (raw ?? skillDraft)
      .split(/[,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!bits.length) return;
    patch({
      skills: [...draft.skills, ...bits.filter((s) => !draft.skills.includes(s))].slice(0, 24),
    });
    setSkillDraft("");
  }

  async function runAtsSolver() {
    setBusy("ats");
    setStatus("");
    try {
      let next = improveResume(draft, { job, customPrompt });
      if (customPrompt.trim().length > 8) {
        try {
          const { runPlatformAi } = await import("@/lib/platform-ai-client");
          const chat = await runPlatformAi(
            `Rewrite this resume for ATS. Follow the extra instructions. Do not invent employers, degrees, or metrics — use [add metric] if unknown. Return JSON only with keys name, email, phone, summary, skills (comma string), experience (plain text with bullets), education (plain text).\n\nExtra instructions:\n${customPrompt}\n\nJob description:\n${job || "(none)"}\n\nResume:\n${draftToPlain(draft)}`
          );
          if (chat.ok) {
            const data = { reply: chat.reply } as { reply?: string };
            const json = data.reply?.match(/\{[\s\S]*\}/)?.[0];
            if (json) {
              const parsed = JSON.parse(json) as Record<string, unknown>;
              const str = (k: string) => {
                const v = parsed[k];
                if (Array.isArray(v)) return v.map(String).join(", ");
                return typeof v === "string" ? v : "";
              };
              const merged = parseResumeText(
                [
                  str("name") || draft.name,
                  str("email") || draft.email,
                  str("phone") || draft.phone,
                  "Summary",
                  str("summary") || draft.summary,
                  "Skills",
                  str("skills") || draft.skills.join(", "),
                  "Experience",
                  str("experience") || "",
                  "Education",
                  str("education") || "",
                ].join("\n")
              );
              if (merged.name || merged.summary) {
                next = {
                  ...next,
                  draft: {
                    ...merged,
                    email: merged.email || draft.email,
                    phone: merged.phone || draft.phone,
                    roles: merged.roles.some((r) => r.title) ? merged.roles : next.draft.roles,
                    education: merged.education.some((e) => e.school || e.degree)
                      ? merged.education
                      : next.draft.education,
                  },
                  notes: [...next.notes, "Applied your custom prompt through ATS Solver."],
                };
              }
            }
          }
        } catch {
          /* local improve still applied */
        }
      }
      setDraft(next.draft);
      setAtsNotes([
        `Score ${next.before.score} → ${next.after.score}`,
        ...next.notes,
      ]);
      setStatus("ATS Solver updated the form. Read the notes, then export Word or PDF.");
      await track();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Solver failed");
    }
    setBusy(null);
  }

  async function exportPdf() {
    setBusy("pdf");
    try {
      const blob = await buildPdfBlob(draft);
      downloadBlob(blob, `${fileSlug(draft.name)}-resume.pdf`);
      await track();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "PDF failed");
    }
    setBusy(null);
  }

  async function exportDoc() {
    setBusy("doc");
    try {
      downloadBlob(buildDocxBlob(draft), `${fileSlug(draft.name)}-resume.docx`);
      await track();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Word export failed");
    }
    setBusy(null);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">
        Single-column ATS layout. Drop an old resume, tap through the blanks, run the solver, then
        download Word or PDF.{" "}
        <Link href="/tools/ats-resume" className="text-violet-400 hover:underline">
          Full ATS checker
        </Link>
      </p>

      <DropZone
        compact
        accept=".pdf,.docx,.txt,.md,.tex,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        label={busy === "import" ? "Reading resume…" : "Drop your current or old resume"}
        hint="PDF, Word (.docx), .txt, or .tex — fills the blanks for you"
        onFiles={(f) => void onDrop(f)}
        disabled={busy === "import"}
      />
      {importName && (
        <p className="text-xs text-emerald-400/90">Imported {importName}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{ width: `${(filled / 6) * 100}%` }}
          />
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            ats.score >= 80
              ? "bg-emerald-500/15 text-emerald-300"
              : ats.score >= 55
                ? "bg-amber-500/15 text-amber-200"
                : "bg-white/10 text-zinc-400"
          }`}
        >
          ATS {ats.score}
        </span>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
              step === s.id ? "bg-white text-black" : "border border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          {step === "contact" && (
            <div className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["Full name", "name", "Alex Rivera"],
                  ["Email", "email", "alex@email.com"],
                  ["Phone", "phone", "+1 555 0100"],
                ] as const
              ).map(([label, key, ph]) => (
                <label key={key} className={`text-xs text-zinc-500 ${key === "phone" ? "sm:col-span-2" : ""}`}>
                  {label}
                  <input
                    value={draft[key]}
                    placeholder={ph}
                    onChange={(e) => patch({ [key]: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                  />
                </label>
              ))}
              <button type="button" className={nextBtn} onClick={() => setStep("skills")}>
                Next: skills
              </button>
            </div>
          )}

          {step === "skills" && (
            <div>
              <p className="text-xs text-zinc-500">Type a skill and press Enter or comma.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {draft.skills.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => patch({ skills: draft.skills.filter((x) => x !== s) })}
                    className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-100"
                  >
                    {s} ×
                  </button>
                ))}
              </div>
              <input
                value={skillDraft}
                placeholder="React, SQL, stakeholder updates"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.endsWith(",")) addSkill(v.slice(0, -1));
                  else setSkillDraft(v);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
              />
              <button type="button" className={`${nextBtn} mt-2`} onClick={() => setStep("summary")}>
                Next: summary
              </button>
            </div>
          )}

          {step === "summary" && (
            <label className="block text-xs text-zinc-500">
              2–3 lines. Who you are + the outcome you create.
              <textarea
                value={draft.summary}
                onChange={(e) => patch({ summary: e.target.value })}
                rows={5}
                placeholder="PM who shipped checkout that cut drop-off 18%…"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
              />
              <button type="button" className={`${nextBtn} mt-2`} onClick={() => setStep("experience")}>
                Next: experience
              </button>
            </label>
          )}

          {step === "experience" && (
            <div className="space-y-3">
              {draft.roles.map((role, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-400">Role {i + 1}</p>
                    {draft.roles.length > 1 && (
                      <button
                        type="button"
                        className="text-zinc-500 hover:text-red-300"
                        onClick={() =>
                          patch({ roles: draft.roles.filter((_, j) => j !== i) })
                        }
                        aria-label="Remove role"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field
                      label="Title"
                      value={role.title}
                      placeholder="Product manager"
                      onChange={(v) =>
                        patch({
                          roles: draft.roles.map((r, j) => (j === i ? { ...r, title: v } : r)),
                        })
                      }
                    />
                    <Field
                      label="Company"
                      value={role.company}
                      placeholder="Acme"
                      onChange={(v) =>
                        patch({
                          roles: draft.roles.map((r, j) => (j === i ? { ...r, company: v } : r)),
                        })
                      }
                    />
                    <Field
                      label="Dates"
                      value={role.dates}
                      placeholder="2022 – 2026"
                      onChange={(v) =>
                        patch({
                          roles: draft.roles.map((r, j) => (j === i ? { ...r, dates: v } : r)),
                        })
                      }
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500">Impact bullets — one result per line</p>
                  {role.bullets.map((b, bi) => (
                    <input
                      key={bi}
                      value={b}
                      placeholder="Cut checkout drop-off 18% by…"
                      onChange={(e) => {
                        const bullets = role.bullets.map((x, k) => (k === bi ? e.target.value : x));
                        patch({
                          roles: draft.roles.map((r, j) => (j === i ? { ...r, bullets } : r)),
                        });
                      }}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600"
                    />
                  ))}
                  <button
                    type="button"
                    className="mt-2 text-xs text-violet-300 hover:text-white"
                    onClick={() =>
                      patch({
                        roles: draft.roles.map((r, j) =>
                          j === i ? { ...r, bullets: [...r.bullets, ""] } : r
                        ),
                      })
                    }
                  >
                    + bullet
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  patch({
                    roles: [...draft.roles, { title: "", company: "", dates: "", bullets: [""] }],
                  })
                }
                className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-white/15 py-2 text-xs text-zinc-400 hover:border-violet-400/50 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Add another role
              </button>
              <button type="button" className={nextBtn} onClick={() => setStep("education")}>
                Next: school
              </button>
            </div>
          )}

          {step === "education" && (
            <div className="space-y-2">
              {draft.education.map((ed, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-3">
                  <Field
                    label="Degree"
                    value={ed.degree}
                    placeholder="B.S. CS"
                    onChange={(v) =>
                      patch({
                        education: draft.education.map((e, j) => (j === i ? { ...e, degree: v } : e)),
                      })
                    }
                  />
                  <Field
                    label="School"
                    value={ed.school}
                    placeholder="State University"
                    onChange={(v) =>
                      patch({
                        education: draft.education.map((e, j) => (j === i ? { ...e, school: v } : e)),
                      })
                    }
                  />
                  <Field
                    label="Year"
                    value={ed.year}
                    placeholder="2021"
                    onChange={(v) =>
                      patch({
                        education: draft.education.map((e, j) => (j === i ? { ...e, year: v } : e)),
                      })
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                className="text-xs text-violet-300"
                onClick={() =>
                  patch({
                    education: [...draft.education, { school: "", degree: "", year: "" }],
                  })
                }
              >
                + education
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111] p-5 shadow-inner">
          <p className="text-center text-lg font-semibold text-white">{draft.name || "Your Name"}</p>
          <p className="mt-1 text-center text-xs text-zinc-500">
            {[draft.email || "email@example.com", draft.phone].filter(Boolean).join("  ·  ")}
          </p>
          <PreviewBlock title="Summary">{draft.summary || "Your 2–3 line pitch lands here."}</PreviewBlock>
          <PreviewBlock title="Experience">
            {draft.roles.some((r) => r.title) ? (
              draft.roles.map((r, i) => (
                <div key={i} className="mb-2">
                  <p className="text-xs font-medium text-zinc-200">
                    {r.title}
                    {r.company ? ` — ${r.company}` : ""}
                    {r.dates ? ` (${r.dates})` : ""}
                  </p>
                  <ul className="mt-0.5 list-disc pl-4 text-[11px] text-zinc-400">
                    {r.bullets.filter(Boolean).map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <span>Add a role to preview bullets.</span>
            )}
          </PreviewBlock>
          <PreviewBlock title="Education">
            {draft.education.some((e) => e.school || e.degree) ? (
              draft.education
                .filter((e) => e.school || e.degree)
                .map((e, i) => (
                  <span key={i} className="block">
                    {[e.degree, e.school, e.year].filter(Boolean).join(" — ")}
                  </span>
                ))
            ) : (
              "—"
            )}
          </PreviewBlock>
          <PreviewBlock title="Skills">
            {draft.skills.join(" · ") || "Skill chips appear here"}
          </PreviewBlock>
        </div>
      </div>

      <label className="block text-xs text-zinc-500">
        Job description (optional — ATS Solver matches keywords)
        <textarea
          value={job}
          onChange={(e) => setJob(e.target.value)}
          rows={3}
          placeholder="Paste the posting you’re applying to"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        />
      </label>

      <label className="block text-xs text-zinc-500">
        Custom prompt
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          rows={3}
          placeholder="e.g. Target senior PM at a B2B SaaS. Stress 0→1 launches, not maintenance. Keep it under one page. No buzzwords."
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        />
      </label>

      <button
        type="button"
        onClick={() => void runAtsSolver()}
        disabled={
          busy === "ats" ||
          (!draft.name && !draft.summary && !draft.roles.some((r) => r.title))
        }
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
      >
        {busy === "ats" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        ATS Solver — improve this resume
      </button>

      {atsNotes.length > 0 && (
        <ul className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-100/90">
          {atsNotes.map((n) => (
            <li key={n} className="mt-1 first:mt-0">
              • {n}
            </li>
          ))}
        </ul>
      )}
      {ats.issues.length > 0 && (
        <ul className="text-[11px] text-zinc-500">
          {ats.issues.slice(0, 4).map((i) => (
            <li key={i}>• {i}</li>
          ))}
        </ul>
      )}
      {status && <p className="text-sm text-zinc-400">{status}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void exportDoc()}
          disabled={busy === "doc"}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
        >
          {busy === "doc" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Word .docx
        </button>
        <button
          type="button"
          onClick={() => void exportPdf()}
          disabled={busy === "pdf"}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          PDF
        </button>
        <button
          type="button"
          onClick={async () => {
            downloadBlob(new Blob([tex], { type: "application/x-tex" }), `${fileSlug(draft.name)}-resume.tex`);
            await track();
          }}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300"
        >
          <Download className="h-4 w-4" /> .tex
        </button>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(tex);
            setCopied(true);
            await track();
            setTimeout(() => setCopied(false), 1200);
          }}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy LaTeX"}
        </button>
      </div>

      <details className="rounded-xl border border-white/10 bg-black/30 p-3">
        <summary className="cursor-pointer text-xs text-zinc-500">LaTeX source</summary>
        <pre className="mt-2 max-h-40 overflow-auto font-mono text-[10px] text-zinc-500">{tex}</pre>
      </details>
    </div>
  );
}

const nextBtn =
  "mt-1 w-full rounded-xl bg-white/10 py-2 text-xs font-medium text-white hover:bg-white/15 sm:col-span-2";

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="text-xs text-zinc-500">
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
      />
    </label>
  );
}

function PreviewBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <p className="border-b border-white/15 pb-1 text-[10px] font-semibold tracking-wide text-zinc-400">
        {title.toUpperCase()}
      </p>
      <div className="mt-2 text-xs leading-relaxed text-zinc-300">{children}</div>
    </div>
  );
}
