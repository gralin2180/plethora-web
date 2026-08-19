/**
 * LLM polish layer:
 * - Free: free/public/cheap APIs (or template-only fallback)
 * - Paid: stronger hosted model polish
 * Local GPU backends can polish entirely on-device (client).
 */

import { canUsePaidPolish, type PlanId } from "./plans";
import { freeChatCompletion } from "./free-chat";

export type PolishMode = "template_only" | "free_api" | "paid_api" | "local_backend" | "exhausted";

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
      const cleaned = polished ? stripDisclaimer(polished) : "";
      if (cleaned && !isBloated(cleaned, req.draftPrompt)) {
        return {
          prompt: cleaned,
          mode: "paid_api",
          providerNote: "Tightened for paste.",
          polished: true,
        };
      }
    } catch {
      // fall through
    }
  }

  // Free path — same rotate-until-exhausted chain as Chat and tools
  if (req.preferMode === "free_api" || !req.preferMode) {
    try {
      const llm = await freeChatCompletion(userPayload(req), [], {
        customSystem: FREE_SYSTEM,
        preferredSource: "zen",
        maxTokens: 220,
      });
      if (llm.code === "pool_exhausted") {
        return {
          prompt: req.draftPrompt,
          mode: "exhausted",
          providerNote: llm.reply,
          polished: false,
        };
      }
      const cleaned = llm.ok && llm.reply ? stripDisclaimer(llm.reply) : "";
      if (cleaned && !isBloated(cleaned, req.draftPrompt)) {
        return {
          prompt: cleaned,
          mode: "free_api",
          providerNote: "Tightened for paste.",
          polished: true,
        };
      }
    } catch {
      /* fall through */
    }
  }

  // Template-only: still production quality from prompt-engine
  return {
    prompt: req.draftPrompt,
    mode: "template_only",
    providerNote: "Ready to paste.",
    polished: false,
  };
}

const BLOAT_MARKERS =
  /context pack|operating instructions|curation framework|quality bar|why this is (an )?improvement|world-class specialist|plethora disclaimer|refinement questionnaire|advanced upgrade option/i;

function isBloated(text: string, draft: string): boolean {
  if (BLOAT_MARKERS.test(text)) return true;
  if (text.length > 900) return true;
  if (draft.length > 0 && text.length > draft.length * 3 && text.length > 600) return true;
  return false;
}

function stripDisclaimer(text: string): string {
  return text
    .replace(/\n*---\s*\n+Plethora Disclaimer:[\s\S]*$/i, "")
    .replace(/\*\*\*+\s*$/g, "")
    .trim();
}

const FREE_SYSTEM = `Rewrite into a SHORT prompt to paste into ChatGPT. Max 80 words.

Do:
- One role line, the task, 3–6 short bullets.
- Keep the user's meaning. If they asked for adult content between consenting adults, stay direct.

Do not:
- Frameworks, menus, questionnaires, “next steps”, success criteria
- “Context pack”, “operating instructions”, “quality bar”
- “Why this is better” essays
- Legal disclaimers
- Pretend you are a strategist writing a consulting document`;

const PAID_SYSTEM = FREE_SYSTEM;

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
      temperature: 0.2,
      max_tokens: 220,
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
