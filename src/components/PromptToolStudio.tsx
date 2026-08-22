"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import type { PlatformTool } from "@/lib/types";
import { buildRefinedPrompt } from "@/lib/prompt-engine";
import { assessContentSafety, type SafetyAssessment } from "@/lib/content-safety";
import { ContentWarningDialog } from "@/components/ContentWarningDialog";
import { loadAdultSession, saveAdultSession } from "@/lib/chat-personality";

const STUDIO_HINTS: Record<string, { placeholder: string; lead: string }> = {
  "blog-writer": {
    lead: "Topic, audience, tone, length — we write the draft.",
    placeholder: "e.g. Blog for solopreneurs on pricing freelancing, conversational, 1200 words…",
  },
  "content-outline": {
    lead: "What should the piece cover?",
    placeholder: "Pillar post about cold email for B2B SaaS…",
  },
  "script-writer": {
    lead: "Format + length + vibe.",
    placeholder: "8-min YouTube script about home espresso, energetic…",
  },
  "rewrite-polish": {
    lead: "Paste draft + how you want it changed.",
    placeholder: "Make this warmer and half as long:\n\n…",
  },
  "headline-generator": {
    lead: "What is the piece / offer?",
    placeholder: "Article about sleeping better without supplements…",
  },
  "newsletter-writer": {
    lead: "Theme + audience + CTA.",
    placeholder: "Weekly indie hacker letter about shipping in public…",
  },
  "ad-copy": {
    lead: "Product, platform, offer.",
    placeholder: "Instagram ads for organic matcha brand, 20% off first order…",
  },
  "hook-generator": {
    lead: "Niche + platform.",
    placeholder: "Hooks for fitness reels about desk workouts…",
  },
  "email-subject": {
    lead: "Campaign goal.",
    placeholder: "Re-engagement email for inactive SaaS trials…",
  },
  "persona-builder": {
    lead: "Product and market.",
    placeholder: "AI resume tool for career switchers…",
  },
  "ugc-brief": {
    lead: "Product + creator type.",
    placeholder: "Skincare serum, micro-influencers, honest unbox style…",
  },
  "offer-stack": {
    lead: "Core offer price range.",
    placeholder: "$49 course on Notion for students…",
  },
  "competitor-brief": {
    lead: "You vs who?",
    placeholder: "We're a quieter Notion alternative vs Notion AI…",
  },
  "landing-copy": {
    lead: "Product one-liner + audience.",
    placeholder: "Local-first password manager for freelancers…",
  },
  "ad-angles": {
    lead: "What are we selling?",
    placeholder: "Meal-prep kit subscription…",
  },
  "retargeting-flows": {
    lead: "Where did they drop off?",
    placeholder: "Added to cart, no purchase, DTC apparel…",
  },
  "caption-writer": {
    lead: "Platform + post idea.",
    placeholder: "LinkedIn post about shipping weekly…",
  },
  "thread-writer": {
    lead: "Thread thesis.",
    placeholder: "Why most AI tools fail at onboarding…",
  },
  "content-calendar": {
    lead: "Niche + platforms + cadence.",
    placeholder: "Personal finance creator, IG + TikTok, 30 days…",
  },
  "cursor-rules": {
    lead: "Stack + standards.",
    placeholder: "Next.js 15 App Router, TypeScript strict, Tailwind, no any…",
  },
  "claude-rules": {
    lead: "Repo / agent constraints.",
    placeholder: "Monorepo pnpm, React, Python FastAPI services, never commit secrets…",
  },
  "readme-writer": {
    lead: "Project blurb.",
    placeholder: "CLI that converts CSV → Postgres schema…",
  },
  "regex-helper": {
    lead: "What should match?",
    placeholder: "Emails but not ones ending in .test…",
  },
  "workflow-builder": {
    lead: "End-to-end job to automate.",
    placeholder: "Inbound lead form → enrich → Slack → draft email…",
  },
  documenter: {
    lead: "Paste a folder tree or `tree` output (never leaves your browser until you copy to an AI).",
    placeholder: "src/\n  app/\n  components/\n  lib/\n…",
  },
  "zap-n8n-blueprint": {
    lead: "Describe the automation.",
    placeholder: "New Stripe sale → Google Sheet row → thank-you email…",
  },
  summarizer: {
    lead: "Paste long text.",
    placeholder: "Paste article or notes…",
  },
  "meeting-notes": {
    lead: "Raw notes.",
    placeholder: "Messy notes from standup…",
  },
  "decision-matrix": {
    lead: "Options + criteria.",
    placeholder: "Hire freelancers vs agency for landing page redesign…",
  },
  "ai-glossary": {
    lead: "Term or concept (optional).",
    placeholder: "Explain RAG like I'm new…",
  },
  "model-picker": {
    lead: "Task + budget + privacy need.",
    placeholder: "Write legal-ish contracts, private, low budget…",
  },
  "system-prompt-builder": {
    lead: "What should the agent do?",
    placeholder: "Support bot for a Shopify store that never invents refunds…",
  },
  "prompt-library": {
    lead: "Pick a theme or leave blank for starters.",
    placeholder: "productivity · study · creative…",
  },
  "safe-ai-use": {
    lead: "What kind of data do you handle?",
    placeholder: "I work with customer emails and invoices…",
  },
  "excel-formulas": {
    lead: "Describe columns and the answer you want.",
    placeholder: "Column A product, B qty, C price — sum revenue where qty > 10…",
  },
  "pitch-outline": {
    lead: "Audience + product one-liner.",
    placeholder: "Seed deck for AI note app for students…",
  },
  "email-polish": {
    lead: "Paste rough notes + tone.",
    placeholder: "Ask boss for deadline extension, polite but firm…",
  },
  "meeting-agenda": {
    lead: "Meeting goal + attendees.",
    placeholder: "Weekly marketing sync, 30 min…",
  },
  "resume-bullet": {
    lead: "Role + duties (raw is fine).",
    placeholder: "Managed Instagram, posted 5x/week…",
  },
  "ai-bio-generator": {
    lead: "Who you are + where this bio lives (LinkedIn, X, About).",
    placeholder: "Product designer, 8y, fintech, playful but credible…",
  },
  "ai-worksheet-generator": {
    lead: "Subject, grade/level, skills to practice, length.",
    placeholder: "Grade 6 fractions worksheet, 15 problems, mild difficulty…",
  },
  "message-sequence-copy": {
    lead: "Channel, offer, audience, and tone (compliant / no spam).",
    placeholder: "WhatsApp sequence for SaaS free-trial leads who dropped mid-signup…",
  },
};

export function PromptToolStudio({ tool }: { tool: PlatformTool }) {
  const meta = STUDIO_HINTS[tool.slug] ?? {
    lead: "Describe what you need — we'll build a sharp prompt.",
    placeholder: "Type here…",
  };
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [promptUsed, setPromptUsed] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [warning, setWarning] = useState<SafetyAssessment | null>(null);

  const models = tool.bestModels ?? ["Claude Sonnet", "GPT-4o"];

  const result = output;

  function buildPrompt(): string {
    const raw = input.trim() || tool.description;
    let prompt = "";
    if (tool.slug === "documenter") {
      prompt = `You are a senior technical writer.\n\nGiven this folder/file inventory (user may have redacted secrets):\n\n\`\`\`\n${raw}\n\`\`\`\n\nProduce:\n1) One-paragraph product overview (guess carefully)\n2) Module map (each top folder)\n3) Suggested architecture diagram in mermaid\n4) Onboarding doc for a new dev\n5) Open questions for the owner\nDo not invent credentials or live URLs.`;
    } else if (tool.slug === "claude-rules") {
      prompt = `Write a CLAUDE.md / project rules file for Anthropic Claude Code workflows.\n\nProject constraints:\n${raw}\n\nInclude: coding standards, files never to touch without ask, testing expectations, security (no secrets), PR habits. Output markdown only.`;
    } else if (tool.slug === "cursor-rules") {
      prompt = `Generate .cursor/rules (or a single rules markdown) for this stack:\n${raw}\n\nBe specific, not generic boilerplate. Include naming, error handling, and test rules.`;
    } else if (tool.slug === "workflow-builder") {
      prompt = `Design an AI + tools workflow as numbered steps with who/what/tool at each hop.\n\nJob:\n${raw}\n\nOutput: diagram (mermaid), step list, failure handling, free vs paid tool notes.`;
    } else if (tool.slug === "ai-glossary" || tool.slug === "safe-ai-use" || tool.slug === "prompt-library" || tool.slug === "model-picker") {
      prompt = buildRefinedPrompt(`${tool.name}: ${raw}`, {});
    } else if (tool.slug === "ai-bio-generator") {
      prompt = `Write 3 biography variants (short / medium / long) for:\n${raw}\n\nRules: no fake credentials; optional personality; provide plain-text + LinkedIn-ready versions. Mark character counts.`;
    } else if (tool.slug === "ai-worksheet-generator") {
      prompt = `Create a printable practice worksheet.\n\nSpec:\n${raw}\n\nInclude: title, instructions, numbered items, answer key on a separate section, accessibility notes for teachers. Markdown.`;
    } else if (tool.slug === "message-sequence-copy") {
      prompt = `Write a multi-touch messaging sequence (opt-in compliant, include STOP language).\n\nBrief:\n${raw}\n\nOutput: message 1–4 with timing, channel notes, and A/B subject line options if email/SMS.`;
    } else {
      prompt = buildRefinedPrompt(`${tool.name} for: ${raw}`, {});
    }
    return prompt;
  }

  async function generate() {
    const safety = assessContentSafety(input);
    if (safety.hardBlock) {
      setWarning(safety);
      return;
    }
    if (safety.needsWarning && !loadAdultSession()) {
      setWarning(safety);
      return;
    }
    if (safety.needsWarning) saveAdultSession();
    await generateNow();
  }

  async function generateNow() {
    const prompt = buildPrompt();
    setPromptUsed(prompt);
    setErr("");
    setBusy(true);
    setOutput("");
    try {
      const { runPlatformAi } = await import("@/lib/platform-ai-client");
      const data = await runPlatformAi(
        `${prompt}\n\nWrite the deliverable now. Do not explain how you would write it. No preamble.`
      );
      if (data.ok && data.reply.trim()) {
        setOutput(data.reply.trim());
      } else {
        setOutput(prompt);
        setErr(
          data.exhausted
            ? "Free AI is exhausted — add a key or pay as you go."
            : data.reply || "Chat unavailable — copied a ready prompt instead."
        );
      }
    } catch {
      setOutput(prompt);
      setErr("Offline / chat failed — here’s a prompt you can paste anywhere.");
    }
    setBusy(false);
    void fetch("/api/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId: tool.id }),
    }).catch(() => undefined);
  }

  return (
    <div className="space-y-4">
      {warning && (
        <ContentWarningDialog
          assessment={warning}
          onCancel={() => setWarning(null)}
          onContinue={() => {
            if (warning.hardBlock) {
              setWarning(null);
              return;
            }
            saveAdultSession();
            setWarning(null);
            void generateNow();
          }}
        />
      )}
      {models.length > 0 && (
        <p className="text-[11px] text-zinc-500">
          Writes a real draft with your connected AI (or free chat). Fallback: a pasteable prompt.
        </p>
      )}

      <p className="text-sm text-zinc-400">{meta.lead}</p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
        placeholder={meta.placeholder}
        className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => void generate()}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? "Writing…" : "Write it"}
      </button>
      {err && <p className="text-xs text-amber-300">{err}</p>}

      {result && (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-400">Result</p>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(result);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="flex items-center gap-1 text-xs text-violet-300"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">
            {result}
          </pre>
          {promptUsed && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-zinc-500">Prompt used</summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[11px] text-zinc-500">
                {promptUsed}
              </pre>
            </details>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <Link href="/chat" className="text-violet-400 hover:underline">
              Continue in Chat →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
