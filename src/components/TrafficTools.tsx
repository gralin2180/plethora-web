"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, Download, Loader2, Sparkles } from "lucide-react";
import { trackToolUse } from "@/lib/self-learn";

function downloadText(name: string, text: string, type = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
}

export function LatexResumeBuilder() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [summary, setSummary] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState("");
  const [copied, setCopied] = useState(false);

  const tex = useMemo(() => {
    const esc = (s: string) =>
      s
        .replace(/\\/g, "\\textbackslash{}")
        .replace(/[&%$#_{}]/g, (c) => `\\${c}`)
        .replace(/\n/g, "\\\\\n");
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
{\\LARGE\\bfseries ${esc(name || "Your Name")}}\\\\[4pt]
${esc(email || "email@example.com")}${phone ? ` \\,|\\, ${esc(phone)}` : ""}
\\end{center}

\\section*{Summary}
${esc(summary || "Results-focused professional…")}

\\section*{Experience}
${esc(experience || "Role — Company (Dates)\\\\n- Impact bullet with metric")}

\\section*{Education}
${esc(education || "Degree — School (Year)")}

\\section*{Skills}
${esc(skills || "Skill A, Skill B, Skill C")}
\\end{document}
`;
  }, [name, email, phone, summary, experience, education, skills]);

  async function done() {
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

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        ATS-friendly simple article class. Compile free on{" "}
        <a href="https://www.overleaf.com" className="text-violet-400 hover:underline" target="_blank" rel="noreferrer">
          Overleaf
        </a>{" "}
        or local TeX. Then run <Link href="/tools/ats-resume" className="text-violet-400 hover:underline">ATS proofing</Link>.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            ["Name", name, setName],
            ["Email", email, setEmail],
            ["Phone", phone, setPhone],
            ["Skills (comma list)", skills, setSkills],
          ] as const
        ).map(([label, val, set]) => (
          <label key={label} className="text-xs text-zinc-500">
            {label}
            <input
              value={val}
              onChange={(e) => set(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>
        ))}
      </div>
      {(
        [
          ["Summary", summary, setSummary],
          ["Experience", experience, setExperience],
          ["Education", education, setEducation],
        ] as const
      ).map(([label, val, set]) => (
        <label key={label} className="block text-xs text-zinc-500">
          {label}
          <textarea
            value={val}
            onChange={(e) => set(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          />
        </label>
      ))}
      <pre className="max-h-48 overflow-auto rounded-xl bg-black/50 p-3 font-mono text-[10px] text-zinc-400">
        {tex}
      </pre>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            downloadText("resume.tex", tex, "application/x-tex");
            await done();
          }}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm text-white"
        >
          <Download className="h-4 w-4" /> Download .tex
        </button>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(tex);
            setCopied(true);
            await done();
            setTimeout(() => setCopied(false), 1200);
          }}
          className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy LaTeX"}
        </button>
      </div>
      <ToolCta />
    </div>
  );
}

export function AtsResumeScanner() {
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [report, setReport] = useState<string | null>(null);

  function analyze() {
    const r = resume.toLowerCase();
    const j = job.toLowerCase();
    const issues: string[] = [];
    let score = 100;

    if (resume.length < 200) {
      issues.push("Resume text is very short — ATS may miss keywords.");
      score -= 15;
    }
    if (/\|{2,}|[│┃]/.test(resume) || /columns?|table layout/i.test(resume)) {
      issues.push("Possible multi-column/table layout — many ATS parsers scramble these.");
      score -= 20;
    }
    if (/[^\x00-\x7F]{8,}/.test(resume)) {
      issues.push("Heavy special symbols/emoji can confuse parsers.");
      score -= 8;
    }
    if (!/\b(experience|education|skills|projects|summary)\b/i.test(resume)) {
      issues.push("Missing common section headers (Experience / Education / Skills).");
      score -= 12;
    }
    if (!/\b\d{4}\b/.test(resume)) {
      issues.push("Few/no years — add dates for roles and education.");
      score -= 8;
    }
    if (!/@/.test(resume) && !/\+?\d[\d\s()-]{7,}/.test(resume)) {
      issues.push("No clear email/phone contact.");
      score -= 10;
    }

    const jobWords = j
      .split(/[^a-z0-9+#.]/i)
      .filter((w) => w.length > 3)
      .filter((w, i, a) => a.indexOf(w) === i)
      .slice(0, 40);
    const missing = jobWords.filter((w) => !r.includes(w)).slice(0, 12);
    const hit = jobWords.length ? Math.round(((jobWords.length - missing.length) / jobWords.length) * 100) : 0;
    if (job.trim()) {
      score = Math.round(score * 0.55 + hit * 0.45);
      if (missing.length) {
        issues.push(`Keywords from JD not found: ${missing.join(", ")}`);
      }
    }

    score = Math.max(0, Math.min(100, score));
    const advice = [
      `**ATS fit score: ${score}/100** (heuristic — recheck after edits).`,
      "",
      ...issues.map((i) => `• ${i}`),
      "",
      "Hard rules that still win:",
      "• Single column, standard section titles, .docx or simple PDF",
      "• Mirror exact skill phrases from the JD where truthful",
      "• Prefer LaTeX/article or Word over Canva multi-column designs",
      "",
      job.trim()
        ? "Copy this into Claude/ChatGPT for a polish pass with best models: Claude Sonnet or GPT-4o."
        : "Paste a job description above for keyword match scoring.",
    ].join("\n");

    setReport(advice);
    trackToolUse("ats-resume", 2);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Instant local checks + keyword overlap. Pair with{" "}
        <Link href="/tools/latex-resume" className="text-violet-400 hover:underline">
          LaTeX resume builder
        </Link>
        .
      </p>
      <textarea
        value={resume}
        onChange={(e) => setResume(e.target.value)}
        rows={7}
        placeholder="Paste resume plain text…"
        className="w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white"
      />
      <textarea
        value={job}
        onChange={(e) => setJob(e.target.value)}
        rows={4}
        placeholder="Optional: paste job description for keyword match…"
        className="w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white"
      />
      <button
        type="button"
        onClick={analyze}
        disabled={!resume.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white disabled:opacity-40"
      >
        <Sparkles className="h-4 w-4" /> Run ATS proofing
      </button>
      {report && (
        <pre className="whitespace-pre-wrap rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-zinc-200">
          {report}
        </pre>
      )}
      <ToolCta />
    </div>
  );
}

export function MessagingAutomationLab() {
  const [channel, setChannel] = useState("whatsapp");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [out, setOut] = useState("");

  function build() {
    const plan = `# Messaging automation blueprint

Channel: ${channel}
Goal: ${goal || "(define outcome)"}
Audience: ${audience || "(who)"}

## 1. Trigger
- New lead / form submit / Stripe charge / inbound DM keyword

## 2. Message sequence (keep human opt-out)
1) Instant ack (under 60s) — value + next step
2) Wait 1–4h — social proof or FAQ
3) Wait 1d — soft CTA / booking link
4) Breakup message if silent (graceful exit)

## 3. Stack (pick one lane)
### Free / FOSS
- n8n self-host: https://github.com/n8n-io/n8n
- Typebot / chatbot-ui for flows
- WhatsApp Cloud API (Meta) for official WhatsApp

### Fast SaaS (on the spot)
- ManyChat / Respond.io / Intercom series
- Twilio SMS when WhatsApp not available

### Plethora
- Workflow builder: /tools/workflow-builder
- Zapier/n8n blueprint: /tools/zap-n8n-blueprint
- Prompt polish for copy: /prompt-assistant

## 4. Compliance
- Explicit opt-in, STOP language, no unsolicited spam lists
- Store consent timestamps if B2C messaging

## 5. Metrics
- Reply rate, booking rate, time-to-first-response
`;
    setOut(plan);
    trackToolUse("message-automation", 2);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Instant SaaS vs local n8n — same dual-path idea as downloaders. Output is a build sheet you can hand to AI or an engineer.
      </p>
      <div className="flex flex-wrap gap-2">
        {["whatsapp", "sms", "instagram dm", "email drip", "slack"].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setChannel(c)}
            className={`rounded-full px-3 py-1 text-xs ${
              channel === c ? "bg-violet-600 text-white" : "border border-white/10 text-zinc-400"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <input
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="Goal e.g. book demos from Instagram comments"
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
      />
      <input
        value={audience}
        onChange={(e) => setAudience(e.target.value)}
        placeholder="Audience e.g. founders who liked our reel"
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
      />
      <button
        type="button"
        onClick={build}
        className="w-full rounded-xl bg-violet-600 py-3 text-sm font-medium text-white"
      >
        Generate automation blueprint
      </button>
      {out && (
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-black/50 p-3 text-xs text-zinc-300">
          {out}
        </pre>
      )}
      <div className="flex flex-wrap gap-2 text-xs">
        <a href="https://github.com/n8n-io/n8n" className="text-emerald-400 hover:underline" target="_blank" rel="noreferrer">
          n8n (local)
        </a>
        <a href="https://www.twilio.com/docs/whatsapp" className="text-violet-400 hover:underline" target="_blank" rel="noreferrer">
          WhatsApp API
        </a>
        <Link href="/tools/message-sequence-copy" className="text-violet-400 hover:underline">
          Sequence copy writer
        </Link>
      </div>
      <ToolCta />
    </div>
  );
}

export function SitemapFinder() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<{
    origin?: string;
    found?: { url: string; status: number; locCount?: number; note?: string }[];
    robotsSitemaps?: string[];
    error?: string;
  } | null>(null);

  async function run() {
    setBusy(true);
    setData(null);
    try {
      const res = await fetch("/api/sitemap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "find", url }),
      });
      const j = await res.json();
      setData(j);
      if (res.ok) trackToolUse("sitemap-finder", 2);
    } catch {
      setData({ error: "Network error" });
    }
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Check any site for sitemaps listed in robots.txt and common paths. Counts URLs for quick SEO audits.
      </p>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white"
      />
      <button
        type="button"
        disabled={busy || !url.trim()}
        onClick={() => void run()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm text-white disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Find sitemaps
      </button>
      {data?.error && <p className="text-sm text-amber-400">{data.error}</p>}
      {data?.found && (
        <div className="space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-xs text-zinc-500">Origin: {data.origin}</p>
          {data.found.length === 0 ? (
            <p className="text-sm text-zinc-400">No public sitemaps found at common paths.</p>
          ) : (
            data.found.map((f) => (
              <div key={f.url} className="rounded-lg bg-black/30 px-3 py-2 text-sm text-zinc-200">
                <a href={f.url} className="text-cyan-300 hover:underline" target="_blank" rel="noreferrer">
                  {f.url}
                </a>
                <p className="text-[11px] text-zinc-500">
                  {f.locCount ?? "?"} loc tags · {f.note} · HTTP {f.status}
                </p>
              </div>
            ))
          )}
        </div>
      )}
      <ToolCta />
    </div>
  );
}

export function SitemapValidator() {
  const [url, setUrl] = useState("");
  const [xml, setXml] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<{
    valid?: boolean;
    score?: number;
    issues?: string[];
    stats?: { locCount: number; isIndex: boolean; hasUrlset: boolean };
    error?: string;
  } | null>(null);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/sitemap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", url: url || undefined, xml: xml || undefined }),
      });
      const j = await res.json();
      setReport(j);
      if (res.ok) trackToolUse("sitemap-validator", 2);
    } catch {
      setReport({ error: "Network error" });
    }
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Sitemap URL (optional if pasting XML)"
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
      />
      <textarea
        value={xml}
        onChange={(e) => setXml(e.target.value)}
        rows={5}
        placeholder="Or paste sitemap XML…"
        className="w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-white"
      />
      <button
        type="button"
        disabled={busy || (!url.trim() && !xml.trim())}
        onClick={() => void run()}
        className="w-full rounded-xl bg-violet-600 py-3 text-sm text-white disabled:opacity-40"
      >
        {busy ? "Checking…" : "Validate sitemap"}
      </button>
      {report && !report.error && report.score !== undefined && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">
          <p className="text-lg font-semibold text-white">Score {report.score}/100</p>
          <p className="text-xs text-zinc-500">
            {report.stats?.locCount} URLs · {report.stats?.isIndex ? "index" : "urlset"}
          </p>
          <ul className="mt-2 space-y-1">
            {(report.issues || []).map((i) => (
              <li key={i}>• {i}</li>
            ))}
            {!report.issues?.length && <li className="text-emerald-400">No structural issues flagged.</li>}
          </ul>
        </div>
      )}
      {report?.error && <p className="text-sm text-amber-400">{report.error}</p>}
      <ToolCta />
    </div>
  );
}

export function SitemapUrlExtractor() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/sitemap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extract", url }),
      });
      const j = await res.json();
      setUrls(j.urls || []);
      if (res.ok) trackToolUse("sitemap-urls", 2);
    } catch {
      setUrls([]);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com/sitemap.xml"
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
      />
      <button
        type="button"
        disabled={busy || !url.trim()}
        onClick={() => void run()}
        className="w-full rounded-xl bg-violet-600 py-3 text-sm text-white disabled:opacity-40"
      >
        Extract URLs (first 500)
      </button>
      {urls.length > 0 && (
        <>
          <p className="text-xs text-zinc-500">{urls.length} URLs</p>
          <pre className="max-h-48 overflow-auto rounded-xl bg-black/50 p-3 font-mono text-[10px] text-zinc-400">
            {urls.join("\n")}
          </pre>
          <button
            type="button"
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300"
            onClick={() => downloadText("sitemap-urls.txt", urls.join("\n"))}
          >
            Download list
          </button>
        </>
      )}
      <ToolCta />
    </div>
  );
}

export function RobotsTxtBuilder() {
  const [site, setSite] = useState("https://example.com");
  const [sitemap, setSitemap] = useState("/sitemap.xml");
  const [disallow, setDisallow] = useState("/admin\n/private");

  const robots = useMemo(() => {
    const origin = site.replace(/\/$/, "");
    const sm = sitemap.startsWith("http") ? sitemap : `${origin}${sitemap.startsWith("/") ? "" : "/"}${sitemap}`;
    const disallowLines = disallow
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((p) => `Disallow: ${p.startsWith("/") ? p : `/${p}`}`)
      .join("\n");
    return `User-agent: *\nAllow: /\n${disallowLines}\n\nSitemap: ${sm}\n`;
  }, [site, sitemap, disallow]);

  return (
    <div className="space-y-3">
      <input
        value={site}
        onChange={(e) => setSite(e.target.value)}
        placeholder="https://yoursite.com"
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
      />
      <input
        value={sitemap}
        onChange={(e) => setSitemap(e.target.value)}
        placeholder="/sitemap.xml"
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
      />
      <textarea
        value={disallow}
        onChange={(e) => setDisallow(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-white"
      />
      <pre className="rounded-xl bg-black/50 p-3 font-mono text-xs text-zinc-300">{robots}</pre>
      <button
        type="button"
        className="rounded-xl bg-violet-600 px-4 py-2 text-sm text-white"
        onClick={() => {
          downloadText("robots.txt", robots);
          trackToolUse("robots-txt", 2);
        }}
      >
        Download robots.txt
      </button>
      <ToolCta />
    </div>
  );
}

function ToolCta() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
      <p className="font-medium text-white">Need more than this utility?</p>
      <p className="mt-1 text-xs text-zinc-400">
        Explore chat, prompt assist, and the rest of the tools under one roof.
      </p>
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        <Link href="/chat" className="text-violet-300 hover:underline">
          Open chat →
        </Link>
        <Link href="/tools" className="text-violet-300 hover:underline">
          All tools →
        </Link>
      </div>
    </div>
  );
}
