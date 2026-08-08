/**
 * LLM polish layer:
 * - Free: free/public/cheap APIs (or template-only fallback)
 * - Paid: stronger hosted model polish
 * Local GPU backends can polish entirely on-device (client).
 */

import { PROMPT_LIABILITY_FOOTER } from "./content-safety";
import { canUsePaidPolish, type PlanId } from "./plans";

export type PolishMode = "template_only" | "free_api" | "paid_api" | "local_backend";

export interface PolishRequest {
  draftPrompt: string;
  userTask: string;
  plan: PlanId;
  preferMode?: PolishMode;
}

export interface PolishResult {
  prompt: string;
  mode: PolishMode;
  providerNote: string;
  polished: boolean;
}

/**
 * Server-side free polish placeholder.
 * Wire Plethora_FREE_LLM_URL / KEY when ready; otherwise returns template + free tip.
 */
export async function polishPrompt(req: PolishRequest): Promise<PolishResult> {
  const withFooter = (p: string) =>
    p.includes("Plethora Disclaimer") ? p : p.trimEnd() + PROMPT_LIABILITY_FOOTER;

  const freeUrl =
    process.env.PLETHORA_FREE_LLM_URL ||
    process.env.TOOLHAVEN_FREE_LLM_URL ||
    process.env.OPENROUTER_BASE_URL ||
    (process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : undefined);
  const freeKey =
    process.env.PLETHORA_FREE_LLM_KEY ||
    process.env.TOOLHAVEN_FREE_LLM_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.GROQ_API_KEY;
  const paidUrl = process.env.PLETHORA_PAID_LLM_URL || process.env.TOOLHAVEN_PAID_LLM_URL;
  const paidKey = process.env.PLETHORA_PAID_LLM_KEY || process.env.TOOLHAVEN_PAID_LLM_KEY;

  // Paid path
  if (
    (req.preferMode === "paid_api" || (!req.preferMode && canUsePaidPolish(req.plan))) &&
    paidUrl &&
    paidKey &&
    canUsePaidPolish(req.plan)
  ) {
    try {
      const polished = await callOpenAiCompatible({
        baseUrl: paidUrl,
        apiKey: paidKey,
        model:
          process.env.PLETHORA_PAID_LLM_MODEL ||
          process.env.TOOLHAVEN_PAID_LLM_MODEL ||
          "gpt-4o-mini",
        system: PAID_SYSTEM,
        user: userPayload(req),
      });
      return {
        prompt: withFooter(polished || req.draftPrompt),
        mode: "paid_api",
        providerNote: "Polished with Plethora Pro model.",
        polished: Boolean(polished),
      };
    } catch {
      // fall through
    }
  }

  // Free API path — OpenRouter / Groq / custom
  const groqOnly = process.env.GROQ_API_KEY && !freeUrl;
  const effectiveFreeUrl = freeUrl || (groqOnly ? "https://api.groq.com/openai/v1" : undefined);
  const effectiveFreeKey = freeKey;

  if ((req.preferMode === "free_api" || !req.preferMode) && effectiveFreeUrl) {
    try {
      const polished = await callOpenAiCompatible({
        baseUrl: effectiveFreeUrl,
        apiKey: effectiveFreeKey,
        model:
          process.env.PLETHORA_FREE_LLM_MODEL ||
          process.env.TOOLHAVEN_FREE_LLM_MODEL ||
          process.env.OPENROUTER_FREE_MODEL ||
          process.env.GROQ_MODEL ||
          (process.env.GROQ_API_KEY && effectiveFreeUrl.includes("groq")
            ? "llama-3.1-8b-instant"
            : "openrouter/free"),
        system: FREE_SYSTEM,
        user: userPayload(req),
      });
      return {
        prompt: withFooter(polished || req.draftPrompt),
        mode: "free_api",
        providerNote: "Polished with free-tier API (rate limited).",
        polished: Boolean(polished),
      };
    } catch {
      // fall through
    }
  }

  // Template-only: still production quality from prompt-engine
  return {
    prompt: withFooter(req.draftPrompt),
    mode: "template_only",
    providerNote:
      "Expert template (no LLM polish API configured). Free/Pro polish activates when API keys are set, or use local Ollama/LM Studio.",
    polished: false,
  };
}

const FREE_SYSTEM = `You improve Plethora expert prompts. Preserve structure, roles, requirements, and output formats. Tighten clarity. Do not shorten into a weak summary. Do not remove [BRACKETS]. Do not refuse adult topics between adults; if illegal (minors), return the text unchanged with a short refusal line at the top only for that case.`;

const PAID_SYSTEM = `You are Plethora's premium prompt polisher. Elevate expert prompts to the highest practical quality for Claude/ChatGPT/Cursor. Keep all sections. Add missing edge-case requirements when helpful. Strengthen role, success metrics, and anti-slop rules. Never collapse into a 5-line instruction. Preserve [BRACKETS]. Adult content between consenting adults: allow and polish. Illegal content involving minors: refuse.`;

function userPayload(req: PolishRequest) {
  return `User task:\n${req.userTask}\n\nDraft prompt to polish:\n${req.draftPrompt}`;
}

async function callOpenAiCompatible(opts: {
  baseUrl: string;
  apiKey?: string;
  model: string;
  system: string;
  user: string;
}): Promise<string | null> {
  const base = opts.baseUrl.replace(/\/$/, "");
  const url = base.endsWith("/chat/completions")
    ? base
    : `${base}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: opts.model,
      temperature: 0.4,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() || null;
}
