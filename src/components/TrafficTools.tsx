"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";
import { trackToolUse } from "@/lib/self-learn";
import { scoreResumeText } from "@/lib/resume-ats";

export { LatexResumeBuilder } from "@/components/LatexResumeBuilder";

function downloadText(name: string, text: string, type = "text/plain") {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
}

export function AtsResumeScanner() {
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [report, setReport] = useState<ReturnType<typeof scoreResumeText> | null>(null);

  function analyze() {
    setReport(scoreResumeText(resume, job));
    trackToolUse("ats-resume", 2);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Jobscan-style keyword match in your browser. Pair with the{" "}
        <Link href="/tools/latex-resume" className="text-violet-400 hover:underline">
          resume builder + ATS Solver
        </Link>{" "}
        to rewrite.
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
        placeholder="Paste the job description (required for a useful match score)"
        className="w-full rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-white"
      />
      <button
        type="button"
        onClick={analyze}
        disabled={!resume.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white disabled:opacity-40"
      >
        <Sparkles className="h-4 w-4" /> Score against this job
      </button>
      {report && (
        <div className="space-y-3">
          <p
            className={`text-3xl font-semibold tabular-nums ${
              report.score >= 80 ? "text-emerald-400" : report.score >= 55 ? "text-amber-300" : "text-zinc-300"
            }`}
          >
            {report.score}
            <span className="ml-1 text-sm font-normal text-zinc-500">/ 100 ATS fit</span>
          </p>
          {report.foundKeywords.length > 0 && (
            <div>
              <p className="text-[11px] text-zinc-500">In your resume</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {report.foundKeywords.map((k) => (
                  <span key={k} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-200">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          {report.missingKeywords.length > 0 && (
            <div>
              <p className="text-[11px] text-zinc-500">Missing from resume (add only if true)</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {report.missingKeywords.map((k) => (
                  <span key={k} className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-200">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          <ul className="text-xs text-zinc-400">
            {report.issues.map((i) => (
              <li key={i}>• {i}</li>
            ))}
          </ul>
        </div>
      )}
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
