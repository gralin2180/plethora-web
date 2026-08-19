/** ATS-friendly resume parse / score / improve + Word/PDF/LaTeX export. */

export type ResumeRole = {
  title: string;
  company: string;
  dates: string;
  bullets: string[];
};

export type ResumeEdu = {
  school: string;
  degree: string;
  year: string;
};

export type ResumeDraft = {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: string[];
  roles: ResumeRole[];
  education: ResumeEdu[];
};

export type AtsReport = {
  score: number;
  issues: string[];
  missingKeywords: string[];
  foundKeywords: string[];
};

const ACTION_VERBS = [
  "Led",
  "Built",
  "Shipped",
  "Increased",
  "Reduced",
  "Owned",
  "Designed",
  "Launched",
  "Improved",
  "Delivered",
  "Managed",
  "Created",
  "Automated",
  "Negotiated",
  "Grew",
];

const STOP = new Set([
  "with",
  "that",
  "this",
  "from",
  "your",
  "have",
  "will",
  "they",
  "them",
  "their",
  "about",
  "into",
  "would",
  "could",
  "should",
  "using",
  "plus",
  "role",
  "team",
  "work",
  "jobs",
  "job",
  "able",
  "must",
  "including",
  "across",
  "other",
  "such",
  "well",
  "also",
  "more",
  "than",
  "over",
]);

export function emptyDraft(): ResumeDraft {
  return {
    name: "",
    email: "",
    phone: "",
    summary: "",
    skills: [],
    roles: [{ title: "", company: "", dates: "", bullets: [""] }],
    education: [{ school: "", degree: "", year: "" }],
  };
}

export function draftToPlain(d: ResumeDraft): string {
  const skills = d.skills.filter(Boolean).join(", ");
  const exp = d.roles
    .filter((r) => r.title || r.company || r.bullets.some((b) => b.trim()))
    .map((r) => {
      const head = [r.title, r.company].filter(Boolean).join(" — ");
      const line = r.dates ? `${head} (${r.dates})` : head;
      const bullets = r.bullets.filter((b) => b.trim()).map((b) => `- ${b.trim()}`);
      return [line, ...bullets].join("\n");
    })
    .join("\n\n");
  const edu = d.education
    .filter((e) => e.school || e.degree)
    .map((e) => [e.degree, e.school, e.year].filter(Boolean).join(" — "))
    .join("\n");
  return [
    d.name,
    [d.email, d.phone].filter(Boolean).join(" | "),
    "",
    "Summary",
    d.summary,
    "",
    "Skills",
    skills,
    "",
    "Experience",
    exp,
    "",
    "Education",
    edu,
  ]
    .join("\n")
    .trim();
}

export function scoreResumeText(resume: string, job = ""): AtsReport {
  const r = resume.toLowerCase();
  const issues: string[] = [];
  let score = 100;

  if (resume.trim().length < 200) {
    issues.push("Resume is thin — add impact bullets with numbers.");
    score -= 15;
  }
  if (/\|{2,}|[│┃]/.test(resume) || /columns?|table layout/i.test(resume)) {
    issues.push("Multi-column / table layout often breaks ATS parsers.");
    score -= 20;
  }
  if (/[^\x00-\x7F]{8,}/.test(resume)) {
    issues.push("Unusual symbols can confuse parsers — stick to plain text.");
    score -= 8;
  }
  if (!/\b(experience|education|skills|projects|summary)\b/i.test(resume)) {
    issues.push("Use standard headers: Summary, Experience, Education, Skills.");
    score -= 12;
  }
  if (!/\b\d{4}\b/.test(resume)) {
    issues.push("Add years on roles and school.");
    score -= 8;
  }
  if (!/@/.test(resume) && !/\+?\d[\d\s()-]{7,}/.test(resume)) {
    issues.push("Add a clear email or phone.");
    score -= 10;
  }
  if (!/\d+%|\$\d|\d+\+/.test(resume)) {
    issues.push("Few metrics — ATS and recruiters both look for numbers.");
    score -= 8;
  }

  const jobWords = keywordsFrom(job).slice(0, 40);
  const missing = jobWords.filter((w) => !r.includes(w.toLowerCase())).slice(0, 16);
  const found = jobWords.filter((w) => r.includes(w.toLowerCase())).slice(0, 24);
  const hit = jobWords.length
    ? Math.round(((jobWords.length - missing.length) / jobWords.length) * 100)
    : 0;
  if (job.trim()) {
    score = Math.round(score * 0.55 + hit * 0.45);
    if (missing.length) {
      issues.push(`Job keywords not in resume: ${missing.join(", ")}`);
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    missingKeywords: missing,
    foundKeywords: found,
  };
}

export function parseResumeText(raw: string): ResumeDraft {
  const text = raw.replace(/\r/g, "").trim();
  const draft = emptyDraft();
  if (!text) return draft;

  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
  const phone =
    text.match(/(\+?\d[\d\s().-]{8,}\d)/)?.[1]?.replace(/\s+/g, " ").trim() || "";
  draft.email = email;
  draft.phone = phone;

  const lines = text.split("\n").map((l) => l.trim());
  const first = lines.find((l) => l && !l.includes("@") && !/\d{3}/.test(l) && l.length < 60);
  draft.name = (first || "").replace(/^#+\s*/, "");

  draft.summary = section(text, ["summary", "profile", "objective"]) || guessSummary(lines);
  draft.skills = splitSkills(section(text, ["skills", "technical skills", "core skills"]));
  draft.roles = parseRoles(section(text, ["experience", "work experience", "employment"]) || "");
  draft.education = parseEdu(section(text, ["education", "academics"]) || "");

  if (!draft.roles.some((r) => r.title || r.company)) {
    draft.roles = parseRoles(text);
  }
  if (!draft.skills.length) {
    const skillLine = lines.find((l) => l.includes(",") && l.split(",").length >= 3 && l.length < 220);
    if (skillLine) draft.skills = splitSkills(skillLine);
  }
  return draft;
}

export function improveResume(
  draft: ResumeDraft,
  opts: { job?: string; customPrompt?: string }
): { draft: ResumeDraft; notes: string[]; before: AtsReport; after: AtsReport } {
  const before = scoreResumeText(draftToPlain(draft), opts.job);
  const next: ResumeDraft = structuredClone(draft);
  const notes: string[] = [];

  const jdKeys = keywordsFrom(opts.job || "");
  const promptKeys = keywordsFrom(opts.customPrompt || "");
  const extra = [...jdKeys, ...promptKeys].filter(
    (k, i, a) => a.findIndex((x) => x.toLowerCase() === k.toLowerCase()) === i
  );

  const have = new Set(next.skills.map((s) => s.toLowerCase()));
  const added: string[] = [];
  for (const k of extra) {
    if (!have.has(k.toLowerCase()) && k.length > 2 && added.length < 8) {
      next.skills.push(k);
      have.add(k.toLowerCase());
      added.push(k);
    }
  }
  if (added.length) notes.push(`Added job/prompt keywords to Skills (drop any you don’t have): ${added.join(", ")}`);

  if (next.summary.trim().length < 40) {
    const skillBit = next.skills.slice(0, 5).join(", ");
    const years = next.roles.map((r) => r.dates).join(" ");
    const y = years.match(/(\d{4})/g);
    const span = y && y.length >= 2 ? `${y[0]}–${y[y.length - 1]}` : "";
    next.summary = [
      next.name ? `${next.name.split(" ")[0]} is a` : "Results-focused",
      skillBit ? `${skillBit} professional` : "professional",
      span ? `with experience spanning ${span}.` : "who ships measurable outcomes.",
      "Open with a metric in each recent role. Mirror the job’s exact skill phrases where they are true.",
    ].join(" ");
    notes.push("Wrote a tighter Summary from your skills and dates.");
  } else if (opts.customPrompt?.trim()) {
    const focus = opts.customPrompt.trim().replace(/\s+/g, " ");
    const hook = focus.length > 140 ? `${focus.slice(0, 137)}…` : focus;
    if (!next.summary.toLowerCase().includes(hook.slice(0, 24).toLowerCase())) {
      next.summary = `${next.summary.trim()} Positioned for: ${hook}`;
      notes.push("Folded your custom prompt into the summary (edit if it reads too on-the-nose).");
    }
  }

  next.roles = next.roles.map((role) => ({
    ...role,
    bullets: role.bullets
      .map((b) => b.trim())
      .filter(Boolean)
      .map((b) => punchUpBullet(b)),
  }));
  if (next.roles.some((r) => r.bullets.length)) {
    notes.push("Rewrote bullets to start with action verbs and flag missing metrics.");
  }

  const after = scoreResumeText(draftToPlain(next), opts.job);
  if (!notes.length) notes.push("Structure already looks ATS-safe. Add numbers and JD keywords if the score is still low.");
  return { draft: next, notes, before, after };
}

export function buildLatex(d: ResumeDraft): string {
  const esc = (s: string) =>
    s
      .replace(/\\/g, "\\textbackslash{}")
      .replace(/[&%$#_{}]/g, (c) => `\\${c}`)
      .replace(/\n/g, "\\\\\n");
  const roles = d.roles
    .filter((r) => r.title || r.company)
    .map((r) => {
      const head = `\\textbf{${esc(r.title || "Role")}}${r.company ? ` \\hfill ${esc(r.company)}` : ""}`;
      const dates = r.dates ? `\\\\\n{\\small ${esc(r.dates)}}` : "";
      const items = r.bullets
        .filter((b) => b.trim())
        .map((b) => `  \\item ${esc(b)}`)
        .join("\n");
      return `${head}${dates}\n${items ? `\\begin{itemize}\n${items}\n\\end{itemize}` : ""}`;
    })
    .join("\n\n");
  const edu = d.education
    .filter((e) => e.school || e.degree)
    .map((e) => `\\textbf{${esc(e.degree || "Degree")}} — ${esc(e.school)}${e.year ? ` (${esc(e.year)})` : ""}`)
    .join("\\\\\n");
  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=0.7in]{geometry}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{titlesec}
\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\setlist[itemize]{leftmargin=*,itemsep=2pt,topsep=2pt}
\\pagestyle{empty}
\\begin{document}
\\begin{center}
{\\LARGE\\bfseries ${esc(d.name || "Your Name")}}\\\\[4pt]
${esc(d.email || "email@example.com")}${d.phone ? ` \\,|\\, ${esc(d.phone)}` : ""}
\\end{center}

\\section*{Summary}
${esc(d.summary || "Results-focused professional…")}

\\section*{Experience}
${roles || esc("Role — Company (Dates)\n- Impact bullet with metric")}

\\section*{Education}
${edu || esc("Degree — School (Year)")}

\\section*{Skills}
${esc(d.skills.filter(Boolean).join(", ") || "Skill A, Skill B, Skill C")}
\\end{document}
`;
}

export async function buildPdfBlob(d: ResumeDraft): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const left = 54;
  const right = 558;
  const width = right - left;
  let y = 64;

  const pageBreak = (need: number) => {
    if (y + need > 740) {
      doc.addPage();
      y = 64;
    }
  };
  const hline = () => {
    doc.setDrawColor(40);
    doc.line(left, y, right, y);
    y += 10;
  };
  const section = (title: string) => {
    pageBreak(36);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title.toUpperCase(), left, y);
    y += 6;
    hline();
  };
  const wrap = (text: string, font: "normal" | "bold", size: number) => {
    doc.setFont("helvetica", font);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, width) as string[];
    for (const line of lines) {
      pageBreak(16);
      doc.text(line, left, y);
      y += 14;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(d.name || "Your Name", 306, y, { align: "center" });
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text([d.email, d.phone].filter(Boolean).join("  |  ") || "email@example.com", 306, y, {
    align: "center",
  });
  y += 8;

  section("Summary");
  wrap(d.summary || "Results-focused professional.", "normal", 10);

  section("Experience");
  for (const r of d.roles.filter((x) => x.title || x.company)) {
    pageBreak(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(r.title || "Role", left, y);
    if (r.company) {
      doc.setFont("helvetica", "normal");
      doc.text(r.company, right, y, { align: "right" });
    }
    y += 14;
    if (r.dates) {
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text(r.dates, left, y);
      doc.setTextColor(0);
      y += 12;
    }
    for (const b of r.bullets.filter((x) => x.trim())) {
      const lines = doc.splitTextToSize(`•  ${b.trim()}`, width - 12) as string[];
      for (const line of lines) {
        pageBreak(14);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(line, left + 8, y);
        y += 13;
      }
    }
    y += 6;
  }

  section("Education");
  for (const e of d.education.filter((x) => x.school || x.degree)) {
    wrap([e.degree, e.school, e.year].filter(Boolean).join(" — "), "normal", 10);
  }

  section("Skills");
  wrap(d.skills.filter(Boolean).join(" · ") || "Add skills", "normal", 10);

  return doc.output("blob");
}

export function buildDocxBlob(d: ResumeDraft): Blob {
  const p = (text: string, opts?: { bold?: boolean; size?: number; center?: boolean }) => {
    const sz = String(opts?.size ?? 21);
    const jc = opts?.center ? `<w:jc w:val="center"/>` : "";
    const b = opts?.bold ? "<w:b/>" : "";
    return `<w:p><w:pPr>${jc}<w:spacing w:after="80"/></w:pPr><w:r><w:rPr>${b}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`;
  };
  const heading = (t: string) =>
    `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="666666"/></w:pBdr><w:spacing w:before="200" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>${xml(t.toUpperCase())}</w:t></w:r></w:p>`;

  const body: string[] = [];
  body.push(p(d.name || "Your Name", { bold: true, size: 36, center: true }));
  body.push(p([d.email, d.phone].filter(Boolean).join("  |  ") || "email@example.com", { center: true, size: 20 }));
  body.push(heading("Summary"));
  body.push(p(d.summary || "Results-focused professional."));
  body.push(heading("Experience"));
  for (const r of d.roles.filter((x) => x.title || x.company)) {
    body.push(p(`${r.title || "Role"}${r.company ? ` — ${r.company}` : ""}${r.dates ? ` (${r.dates})` : ""}`, { bold: true }));
    for (const b of r.bullets.filter((x) => x.trim())) {
      body.push(
        `<w:p><w:pPr><w:ind w:left="360"/><w:spacing w:after="40"/></w:pPr><w:r><w:t xml:space="preserve">${xml("• " + b.trim())}</w:t></w:r></w:p>`
      );
    }
  }
  body.push(heading("Education"));
  for (const e of d.education.filter((x) => x.school || x.degree)) {
    body.push(p([e.degree, e.school, e.year].filter(Boolean).join(" — ")));
  }
  body.push(heading("Skills"));
  body.push(p(d.skills.filter(Boolean).join(", ") || "Add skills"));
  body.push(`<w:sectPr><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr>`);

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body.join("")}</w:body></w:document>`;

  const files: { path: string; data: Uint8Array }[] = [
    {
      path: "[Content_Types].xml",
      data: utf8(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
      ),
    },
    {
      path: "_rels/.rels",
      data: utf8(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
      ),
    },
    {
      path: "word/_rels/document.xml.rels",
      data: utf8(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
      ),
    },
    { path: "word/document.xml", data: utf8(documentXml) },
  ];
  return zipStore(files);
}

export async function readResumeFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return extractPdfText(file);
  }
  if (name.endsWith(".docx")) {
    return extractDocxText(await file.arrayBuffer());
  }
  const raw = await file.text();
  if (name.endsWith(".tex")) {
    return raw
      .replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, " ")
      .replace(/[{}]/g, " ")
      .replace(/\s+/g, "\n");
  }
  return raw;
}

export function fileSlug(name: string) {
  const s = (name || "resume").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return s || "resume";
}

function punchUpBullet(b: string): string {
  let t = b.replace(/^[-•*]\s*/, "").trim();
  if (!t) return t;
  const startsVerb = ACTION_VERBS.some((v) => t.toLowerCase().startsWith(v.toLowerCase()));
  if (!startsVerb) {
    const verb = ACTION_VERBS[t.length % ACTION_VERBS.length];
    t = `${verb} ${t.charAt(0).toLowerCase()}${t.slice(1)}`;
  }
  if (!/\d/.test(t) && !/\[metric\]/i.test(t)) {
    t = `${t.replace(/\.$/, "")} [add metric]`;
  }
  return t;
}

function keywordsFrom(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.]/i)
    .map((w) => w.trim())
    .filter((w) => w.length > 3 && !STOP.has(w) && !/^\d+$/.test(w))
    .filter((w, i, a) => a.indexOf(w) === i);
}

function section(text: string, headers: string[]): string {
  const lines = text.split("\n");
  const idx = lines.findIndex((l) => {
    const n = l.replace(/[:#*]/g, "").trim().toLowerCase();
    return headers.some((h) => n === h || n.startsWith(`${h} `));
  });
  if (idx < 0) return "";
  const rest = lines.slice(idx + 1);
  const stop = rest.findIndex((l) => {
    const n = l.replace(/[:#*]/g, "").trim().toLowerCase();
    return (
      n.length > 0 &&
      n.length < 24 &&
      /^(experience|education|skills|summary|profile|projects|certifications|awards)$/.test(n) &&
      !headers.includes(n)
    );
  });
  return rest.slice(0, stop < 0 ? undefined : stop).join("\n").trim();
}

function guessSummary(lines: string[]): string {
  const blob = lines.filter((l) => l.length > 80).slice(0, 2).join(" ");
  return blob.slice(0, 600);
}

function splitSkills(s: string): string[] {
  if (!s.trim()) return [];
  return s
    .split(/[,;|•\n]/)
    .map((x) => x.replace(/^[-*]\s*/, "").trim())
    .filter((x) => x.length > 1 && x.length < 40)
    .slice(0, 24);
}

function parseRoles(block: string): ResumeRole[] {
  if (!block.trim()) return [{ title: "", company: "", dates: "", bullets: [""] }];
  const chunks = block.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
  const roles = (chunks.length ? chunks : [block]).map((chunk) => {
    const ls = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const head = ls[0] || "";
    const dash = head.split(/\s+[—–\-@|]\s+/);
    const title = dash[0] || "";
    let company = dash[1] || "";
    let dates = "";
    const dm = head.match(/\(([^)]*\d{4}[^)]*)\)/) || company.match(/\(([^)]*)\)/);
    if (dm) {
      dates = dm[1];
      company = company.replace(dm[0], "").trim();
    }
    const bullets = ls
      .slice(1)
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
    return { title, company, dates, bullets: bullets.length ? bullets : [""] };
  });
  return roles.length ? roles : [{ title: "", company: "", dates: "", bullets: [""] }];
}

function parseEdu(block: string): ResumeEdu[] {
  if (!block.trim()) return [{ school: "", degree: "", year: "" }];
  return block
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((line) => {
      const year = line.match(/\b(19|20)\d{2}\b/)?.[0] || "";
      const parts = line.split(/\s+[—–\-@|]\s+/);
      return {
        degree: parts[0] || line,
        school: parts[1]?.replace(/\(([^)]*)\)/, "").trim() || "",
        year,
      };
    });
}

function xml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function utf8(s: string) {
  return new TextEncoder().encode(s);
}

function crc32(data: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < data.length; i++) {
    c ^= data[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function dv(n: number, bytes: 2 | 4) {
  const b = new Uint8Array(bytes);
  const v = new DataView(b.buffer);
  if (bytes === 2) v.setUint16(0, n, true);
  else v.setUint32(0, n, true);
  return b;
}

function joinBytes(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function zipStore(files: { path: string; data: Uint8Array }[]): Blob {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = utf8(f.path);
    const crc = crc32(f.data);
    const local = joinBytes([
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
      dv(20, 2),
      dv(0, 2),
      dv(0, 2),
      dv(0, 2),
      dv(0, 2),
      dv(crc, 4),
      dv(f.data.length, 4),
      dv(f.data.length, 4),
      dv(name.length, 2),
      dv(0, 2),
      name,
      f.data,
    ]);
    locals.push(local);
    centrals.push(
      joinBytes([
        new Uint8Array([0x50, 0x4b, 0x01, 0x02]),
        dv(20, 2),
        dv(20, 2),
        dv(0, 2),
        dv(0, 2),
        dv(0, 2),
        dv(0, 2),
        dv(crc, 4),
        dv(f.data.length, 4),
        dv(f.data.length, 4),
        dv(name.length, 2),
        dv(0, 2),
        dv(0, 2),
        dv(0, 2),
        dv(0, 2),
        dv(0, 4),
        dv(offset, 4),
        name,
      ])
    );
    offset += local.length;
  }
  const central = joinBytes(centrals);
  const eocd = joinBytes([
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
    dv(0, 2),
    dv(0, 2),
    dv(files.length, 2),
    dv(files.length, 2),
    dv(central.length, 4),
    dv(offset, 4),
    dv(0, 2),
  ]);
  return new Blob([joinBytes([...locals, central, eocd])], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

/** Plain Word file from paragraphs — used by PDF→Doc and the doc converter. */
export function buildSimpleDocx(paragraphs: string[]): Blob {
  const p = (text: string) =>
    `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr><w:r><w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`;
  const body = `${paragraphs.map((line) => p(line || " ")).join("")}<w:sectPr><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/></w:sectPr>`;
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`;
  return zipStore([
    {
      path: "[Content_Types].xml",
      data: utf8(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
      ),
    },
    {
      path: "_rels/.rels",
      data: utf8(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
      ),
    },
    {
      path: "word/_rels/document.xml.rels",
      data: utf8(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`
      ),
    },
    { path: "word/document.xml", data: utf8(documentXml) },
  ]);
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];
  const n = Math.min(doc.numPages, 8);
  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    parts.push(
      content.items
        .map((it) => ("str" in it ? it.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
    );
  }
  return parts.join("\n");
}

async function extractDocxText(buf: ArrayBuffer): Promise<string> {
  const xmlDoc = await unzipFind(buf, "word/document.xml");
  if (!xmlDoc) throw new Error("Not a valid .docx");
  const xml = new TextDecoder().decode(xmlDoc);
  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<w:br[^/]*\/>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:t[^>]*>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n");
}

async function unzipFind(buf: ArrayBuffer, want: string): Promise<Uint8Array | null> {
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);
  let i = 0;
  while (i < bytes.length - 30) {
    if (view.getUint32(i, true) !== 0x04034b50) {
      i += 1;
      continue;
    }
    const method = view.getUint16(i + 8, true);
    const comp = view.getUint32(i + 18, true);
    const nameLen = view.getUint16(i + 26, true);
    const extra = view.getUint16(i + 28, true);
    const name = new TextDecoder().decode(bytes.slice(i + 30, i + 30 + nameLen));
    const start = i + 30 + nameLen + extra;
    const slice = bytes.slice(start, start + comp);
    i = start + comp;
    if (name.replace(/\\/g, "/") !== want) continue;
    if (method === 0) return slice;
    if (method === 8) {
      const ds = new DecompressionStream("deflate-raw");
      const out = await new Response(new Blob([slice]).stream().pipeThrough(ds)).arrayBuffer();
      return new Uint8Array(out);
    }
  }
  return null;
}
