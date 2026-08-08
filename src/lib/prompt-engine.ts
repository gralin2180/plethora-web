/**
 * Plethora Prompt Engine
 * Turns messy user intent + answers into production-grade, role-based prompts
 * that outperform generic "chat with AI" instructions.
 */

import type { ClarifyingQuestion } from "./types";

export type PromptIntent =
  | "instagram_ad"
  | "tiktok_ad"
  | "facebook_ad"
  | "google_ad"
  | "social_caption"
  | "landing_page"
  | "email"
  | "video_reel"
  | "image"
  | "code"
  | "automation"
  | "research"
  | "ugc_money"
  | "general";

export interface PromptContext {
  rawInput: string;
  intent: PromptIntent;
  businessName?: string;
  niche?: string;
  product?: string;
  audience?: string;
  goal?: string;
  tone?: string;
  platform?: string;
  details?: string;
  extraNotes: string[];
}

function norm(s: string): string {
  return s.toLowerCase().trim();
}

function pick(...candidates: (string | undefined)[]): string | undefined {
  for (const c of candidates) {
    if (c && c.trim()) return c.trim();
  }
  return undefined;
}

// ── Intent detection ──────────────────────────────────────────────────────────

export function detectIntent(raw: string, answers: Record<string, string> = {}): PromptIntent {
  const t = norm(`${raw} ${Object.values(answers).join(" ")}`);

  if (t.match(/ugc|user.?generated|make money.*content|content creator.*money|brand deal|get paid.*creat/)) {
    return "ugc_money";
  }
  if (t.match(/make money|side hustle|earn online/) && t.match(/creat|tiktok|reels|video|content/)) {
    return "ugc_money";
  }
  if (t.match(/instagram|insta\b|ig\b|reels?/)) return "instagram_ad";
  if (t.match(/tiktok|tt\b/)) return "tiktok_ad";
  if (t.match(/facebook|meta ads|fb ads?|fb\b/)) return "facebook_ad";
  if (t.match(/google ads?|search ad|ppc|sem\b/)) return "google_ad";
  if (t.match(/landing page|sales page|homepage|website copy|hero section/)) return "landing_page";
  if (t.match(/email|newsletter|subject line|cold email/)) return "email";
  if (t.match(/reel|short.?form|youtube short|video script|hook for video/)) return "video_reel";
  if (t.match(/image|photo|thumbnail|logo|visual|midjourney|flux/)) return "image";
  if (t.match(/code|debug|react|api|app|website build|cursor|program/)) return "code";
  if (t.match(/automat|workflow|zapier|mcp|pipeline|integrat/)) return "automation";
  if (t.match(/research|competitor|market analysis|trends/)) return "research";
  if (t.match(/caption|post|linkedin|twitter|x\.com|thread/)) return "social_caption";
  if (t.match(/\bad\b|ads|advert|campaign|copywriting|marketing/)) return "instagram_ad";
  if (t.match(/make money|earn|monetize|side hustle/)) return "ugc_money";

  return "general";
}

function splitAnswer(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/\s*\|\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function mapMulti(
  value: string | undefined,
  map: Record<string, string>,
  joinWith = "; "
): string | undefined {
  const parts = splitAnswer(value);
  if (parts.length === 0) return undefined;
  return parts.map((p) => map[p] ?? p).join(joinWith);
}

// ── Context extraction from free text + answers ───────────────────────────────

export function buildPromptContext(
  rawInput: string,
  answers: Record<string, string>
): PromptContext {
  const t = norm(rawInput);
  const intent = detectIntent(rawInput, answers);
  const extraNotes: string[] = [];

  // Audience hints from free text
  let audience: string | undefined;
  if (t.match(/genz|gen z|gen-z|young|18.?30|teen|college/)) {
    audience = "Young adults (18–30), Gen Z";
  }
  if (t.match(/millennial|30.?45|parents/)) {
    audience = "Millennials / busy professionals and parents";
  }
  if (t.match(/b2b|enterprise|saas|founders|c.?suite/)) {
    audience = "B2B decision-makers, founders, and operators";
  }

  // Niche / shop hints
  let niche: string | undefined;
  const nicheMatch = rawInput.match(
    /\b(clothing|fashion|sneakers?|shoes|electronics|cafe|café|coffee|jewelry|skincare|beauty|fitness|gym|food|restaurant|coaching|agency|saas|software|courses?|ebook)\b/i
  );
  if (nicheMatch) niche = nicheMatch[1];

  // Product
  let product: string | undefined;
  if (t.match(/shop|store|ecommerce|e-commerce|products?/)) {
    product = "Products sold online (user should specify exact catalog)";
  }

  // Goal from answers + text (supports multi-select joined by " | ")
  let goal = answers.outcome || answers.goal;
  if (!goal) {
    if (t.match(/click|traffic|visit/)) goal = "Drive more profile visits, website clicks, and store traffic";
    else if (t.match(/sell|sales|revenue/)) goal = "Drive sales and revenue";
    else if (t.match(/lead|book|demo/)) goal = "Generate qualified leads";
    else if (t.match(/follow|aware/)) goal = "Grow awareness and followers";
  }

  // Tone
  let tone = answers.tone;
  if (!tone) {
    if (t.match(/professional/)) tone = "Professional, modern, confident";
    else if (t.match(/casual|friendly/)) tone = "Casual, friendly, conversational";
    else if (t.match(/bold|catchy|hype/)) tone = "Bold, confident, and high-energy";
  }

  // Details freeform often holds gold
  const details = answers.details;
  let businessName = pick(answers.businessName) ?? undefined;
  if (details) {
    const nameMatch = details.match(
      /(?:business|shop|brand|store)\s*(?:name)?\s*[:=-]?\s*["']?([^,"'\n.]+)/i
    );
    if (nameMatch) {
      businessName = businessName ?? nameMatch[1].trim();
      extraNotes.push(`Parsed brand hint: ${nameMatch[1].trim()}`);
    }
  }

  // Outcome map to clearer goal language
  const outcomeMap: Record<string, string> = {
    "More sales": "Convert viewers into buyers and increase order volume",
    "More clicks/traffic": "Drive profile visits, link clicks, and store traffic",
    "More leads / DMs": "Generate DMs, inquiries, and qualified leads",
    "Brand awareness": "Increase brand recognition and memorable presence",
    "Product launch hype": "Build launch anticipation and day-one demand",
    "Educate my audience": "Educate the audience so they trust and want the offer",
    "Save time on work": "Deliver ready-to-use assets that save production time",
    "Learn something new": "Teach clearly while remaining actionable",
    "Full working code": "Deliver full working code ready to run",
    "Architecture + code": "Deliver architecture decisions plus implementation code",
    "Bug fix only": "Focus only on fixing the bug with minimal diffs",
    "Step-by-step plan then code": "Provide a clear plan, then implement the code",
  };
  const mappedGoal = mapMulti(goal, outcomeMap);
  if (mappedGoal) goal = mappedGoal;

  // Tone map from option labels
  const toneMap: Record<string, string> = {
    "Professional & premium": "Professional, modern, confident, and premium",
    "Casual & friendly": "Casual, friendly, and conversational",
    "Bold & hype": "Bold, high-energy, and confident",
    "Warm & trustworthy": "Warm, human, and trustworthy",
    "Luxury / minimal": "Luxury, minimal, and refined",
    Professional: "Professional, clear, and persuasive",
    "Bold & catchy": "Bold, catchy, and attention-grabbing",
    "Bold & direct": "Bold, direct, and no-nonsense",
    "Simple for beginners": "Simple, plain-language, beginner-friendly",
  };
  const mappedTone = mapMulti(tone, toneMap, " + ");
  if (mappedTone) tone = mappedTone;

  // Audience map (multi-select OK)
  const audienceMap: Record<string, string> = {
    "Gen Z (18–24)": "Gen Z (18–24), trend-aware, mobile-first",
    "Young adults (18–30)": "Young adults (18–30), Gen Z / young millennial",
    "Millennials (25–40)": "Millennials (25–40), value-conscious professionals",
    "Parents / families": "Parents and families making practical purchase decisions",
    "B2B / professionals": "B2B buyers, operators, and professionals",
    "Mass market / general": "Broad mass-market consumers",
  };
  const mappedAudience = mapMulti(answers.audience, audienceMap, " · ");
  if (mappedAudience) {
    audience = mappedAudience;
  }

  return {
    rawInput: rawInput.trim(),
    intent,
    businessName,
    niche: pick(answers.niche, niche),
    product: pick(answers.product, product),
    audience: audience ?? "Primary customers who match the business offer",
    goal: goal ?? "Achieve a clear, measurable business result",
    tone: tone ?? "Professional, clear, and persuasive",
    platform: pick(answers.platform),
    details: details?.trim() || undefined,
    extraNotes,
  };
}

function slot(value: string | undefined, placeholder: string): string {
  if (value && !value.includes("user should specify")) return value;
  return `[${placeholder}]`;
}

function intentLabel(intent: PromptIntent): string {
  const labels: Record<PromptIntent, string> = {
    instagram_ad: "Instagram advertising & Reels growth",
    tiktok_ad: "TikTok advertising & short-form growth",
    facebook_ad: "Meta / Facebook advertising",
    google_ad: "Google Search & Performance Max advertising",
    social_caption: "social content & captions",
    landing_page: "high-converting landing page copy",
    email: "email marketing & conversion copy",
    video_reel: "short-form video scripts & creative direction",
    image: "AI image generation & visual briefing",
    code: "software engineering & AI-assisted development",
    automation: "workflow automation & systems design",
    research: "market research & competitive analysis",
    ugc_money: "UGC creator business & monetization",
    general: "strategic problem-solving and execution",
  };
  return labels[intent];
}

// ── Clarifying questions (intent-aware, extract high-signal fields) ───────────

export function generateClarifyingQuestions(input: string): ClarifyingQuestion[] {
  const intent = detectIntent(input);
  const t = norm(input);
  const questions: ClarifyingQuestion[] = [];

  // Always collect missing business identity for commercial intents
  const commercial: PromptIntent[] = [
    "instagram_ad",
    "tiktok_ad",
    "facebook_ad",
    "google_ad",
    "landing_page",
    "email",
    "social_caption",
    "video_reel",
  ];

  if (commercial.includes(intent)) {
    if (!t.match(/clothing|fashion|sneakers|electronics|cafe|jewelry|skincare|fitness|saas|coach/)) {
      questions.push({
        id: "niche",
        question: "What niche or industry is the business in?",
        placeholder: "e.g. streetwear, bakery, online coaching, SaaS...",
      });
    }

    questions.push({
      id: "product",
      question: "What do you sell or promote? (be specific)",
      placeholder: "e.g. premium hoodies, 1:1 fitness coaching, $29 meal-prep kit",
    });

    if (!t.match(/genz|gen z|young|millennial|b2b|mom|parents|enterprise/)) {
      questions.push({
        id: "audience",
        question: "Who is the target buyer? (select all that apply)",
        multiSelect: true,
        options: [
          "Gen Z (18–24)",
          "Young adults (18–30)",
          "Millennials (25–40)",
          "Parents / families",
          "B2B / professionals",
          "Mass market / general",
        ],
      });
    }

    if (!t.match(/sale|click|traffic|lead|follow|book|demo|sign.?up/)) {
      questions.push({
        id: "outcome",
        question: "Primary campaign goals? (select all that apply)",
        multiSelect: true,
        options: [
          "More sales",
          "More clicks/traffic",
          "More leads / DMs",
          "Brand awareness",
          "Product launch hype",
        ],
      });
    }

    if (!t.match(/professional|casual|bold|funny|luxury|premium|playful/)) {
      questions.push({
        id: "tone",
        question: "Brand voice? (select all that fit)",
        multiSelect: true,
        options: [
          "Professional & premium",
          "Casual & friendly",
          "Bold & hype",
          "Warm & trustworthy",
          "Luxury / minimal",
        ],
      });
    }

    questions.push({
      id: "details",
      question: "Business name, offer, price, or USP? (the more specific, the sharper the prompt)",
      placeholder: "e.g. Brand: NightOwl — $48 streetwear hoodies, free shipping over $80",
    });
  } else if (intent === "code") {
    questions.push({
      id: "product",
      question: "What are you building or fixing?",
      placeholder: "e.g. Next.js SaaS dashboard with Stripe billing",
    });
    questions.push({
      id: "details",
      question: "Stack, constraints, or files involved?",
      placeholder: "e.g. TypeScript, Supabase, must work on mobile",
    });
    questions.push({
      id: "outcome",
      question: "What should the output include? (select all that apply)",
      multiSelect: true,
      options: [
        "Full working code",
        "Architecture + code",
        "Bug fix only",
        "Step-by-step plan then code",
      ],
    });
  } else {
    if (input.split(/\s+/).length < 6) {
      questions.push({
        id: "goal",
        question: "What is the main outcome you want?",
        placeholder: "Be specific — what success looks like",
      });
    }
    questions.push({
      id: "audience",
      question: "Who is this for? (select all that apply)",
      multiSelect: true,
      options: [
        "Gen Z (18–24)",
        "Young adults (18–30)",
        "Millennials (25–40)",
        "Parents / families",
        "B2B / professionals",
        "Mass market / general",
      ],
    });
    questions.push({
      id: "tone",
      question: "Tone? (select all that fit)",
      multiSelect: true,
      options: ["Professional", "Casual & friendly", "Bold & direct", "Simple for beginners"],
    });
    questions.push({
      id: "details",
      question: "Any constraints, examples, or must-haves?",
      placeholder: "Optional but highly recommended",
    });
  }

  // Dedupe by id, max 5
  const seen = new Set<string>();
  return questions
    .filter((q) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    })
    .slice(0, 5);
}

// ── Template builders (expert-level, beat free-model quality) ─────────────────

function businessBlock(ctx: PromptContext): string {
  return `Business Information:
- Business Name: ${slot(ctx.businessName, "Your Business / Shop Name")}
- Industry / Niche: ${slot(ctx.niche, "e.g. Clothing, Sneakers, Electronics, Café, Jewelry, Coaching")}
- Products / Services: ${slot(ctx.product, "Describe exactly what you sell and what makes it different")}
- Target Audience: ${ctx.audience}
- Primary Goal: ${ctx.goal}
- Tone: ${ctx.tone}
- Brand Personality: Authentic, distinctive, credible, and results-oriented
- Extra context from user: ${ctx.details ?? "None provided — invent nothing critical; use clear [BRACKET] placeholders for missing facts"}
- User's raw request (preserve intent): "${ctx.rawInput}"`;
}

function antiSlopRules(): string {
  return `Quality Bar (non-negotiable):
- No generic fluff, filler, or empty marketing jargon ("unlock your potential", "game-changer" without substance).
- Every claim must be supportable; if a fact is unknown, use a [PLACEHOLDER] instead of inventing stats.
- Prefer specific verbs, concrete benefits, and buyer psychology over feature lists.
- Vary sentence length. Lead with the buyer's problem or desire before your product.
- Never use spammy urgency ("ACT NOW!!!", fake scarcity) unless the user provided a real deadline.
- Do not invent reviews, awards, or "10,000 customers" unless given.
- Output must be immediately paste-ready for production.`;
}

function buildInstagramAdPrompt(ctx: PromptContext): string {
  return `Act as an elite Instagram growth strategist, performance creative director, and conversion copywriter who has shipped ads for D2C brands, creator shops, and modern retail.

You are better than a generic chat assistant: you think in hooks, retention, offer clarity, and measurable CTR/CVR — not vibes alone.

Your task: create a complete, high-converting Instagram advertising + organic-ready creative package for this business.

${businessBlock(ctx)}

${antiSlopRules()}

Requirements:
1. Write 5 distinct Instagram ad/copy variations (not synonyms of the same idea). Each must use a different angle:
   - Version 1: Problem → agitation → solution
   - Version 2: Desire / identity transformation
   - Version 3: Social proof / "people like you" framing (use [PLACEHOLDER] if no real proof)
   - Version 4: Offer / value clarity (what they get + why now)
   - Version 5: Curiosity / pattern-interrupt hook
2. For EACH variation include:
   - Headline (under 8 words, scroll-stopping)
   - Hook (first line — must work with sound off)
   - Full caption (90–140 words)
   - Benefits (not feature laundry lists)
   - Emotion + light urgency without spam
   - One clear CTA (Shop Now / Visit Link / DM "LIST" / etc.)
   - 8–12 relevant hashtags (mix niche + mid + broad; no banned/spam tags)
   - On-screen Reel text (max 10 words)
   - Visual concept (shot list, angles, colors, transitions, lighting)
   - Music style (current Gen Z / short-form friendly, describe vibe + BPM feel, not copyrighted track names)
   - Why it works (tie to attention, interest, desire, action)
3. Apply AIDA and PAS frameworks intentionally.
4. Match audience language: ${ctx.audience}. Use modern, natural language — zero cringe slang stacks.
5. Include platform-native tips:
   - First 1 second of vision/audio strategy
   - Caption line breaks for mobile readability
   - CTA placement (early soft CTA + hard CTA at end)

Marketing constraints:
- Focus on solving a real customer problem or desire.
- Create curiosity without clickbait.
- Prefer one message per ad; do not pile every benefit into one caption.
- Flag any legal/claims risks if copy would need disclaimers.

Output Format (exact):

## Creative Strategy Snapshot
- Core promise:
- Main pain:
- Angle ranking (why these 5):
- Primary CTA recommendation:

## Ad Version 1 — [Angle Name]
Headline:
Hook:
Caption:
CTA:
Hashtags:
Reel Text:
Visual Concept:
Music Style:
Why it Works:
Risk / claim watchouts:

(Repeat Ad Version 2–5 with the same fields.)

## Format & Distribution Recommendations
- Best format: Reel vs Carousel vs Static (pick one primary + why)
- Ideal Reel length:
- Best posting windows (general best-practice ranges; note timezone = audience local)
- Placement notes: Feed ad vs Stories vs Reels ads

## A/B Test Plan
List 3 high-leverage tests (only change ONE variable each):
1.
2.
3.

## Bonus: 3 alternate hooks only (for swap testing)
1.
2.
3.

If any critical business fact is missing, keep [BRACKETS] visible and still deliver full creative excellence around them.`;
}

function buildTikTokAdPrompt(ctx: PromptContext): string {
  return `Act as a TikTok creative strategist and short-form performance marketer who understands native TikTok culture, not "Instagram ads filmed vertical."

Task: produce a full TikTok ad + organic content system for this business.

${businessBlock(ctx)}

${antiSlopRules()}

Requirements:
1. 5 video concepts with different hook mechanics (visual pattern interrupt, text on screen, POV, before/after, founder's face, UGC style).
2. Each includes: hook (0–1s), beat sheet (0–3 / 3–8 / 8–15 / 15–end), spoken lines or captions, CTA, on-screen text, music vibe, why it retains.
3. Spec for TikTok Spark-style ads vs organic native posts.
4. Comment strategy (seed comment + pin idea).
5. 3 A/B tests + recommended length.

Output with clear ## headers per concept and a final distribution plan.`;
}

function buildFacebookAdPrompt(ctx: PromptContext): string {
  return `Act as a Meta Ads performance marketer and creative strategist (Facebook + Instagram placements under Meta).

${businessBlock(ctx)}

${antiSlopRules()}

Deliver:
1. Campaign objective recommendation (Traffic vs Sales vs Leads) with rationale.
2. 5 ad variations: Primary text (primary ≤125 chars strong open), headline, description, CTA button, creative brief.
3. Audience seeds (interests, lookalikes conceptually — not fake sizes).
4. Offer clarity + landing page message match checklist.
5. 3 A/B tests (creative vs audience vs offer).

Use exact section headers. No invented ROAS claims.`;
}

function buildGoogleAdPrompt(ctx: PromptContext): string {
  return `Act as a Google Ads (Search + RSA) specialist.

${businessBlock(ctx)}

${antiSlopRules()}

Deliver:
1. Keyword themes (exact / phrase / broad match examples) + negatives.
2. 15 RSA headlines (≤30 chars) + 4 descriptions (≤90 chars).
3. Pinning recommendations.
4. Ad extensions plan (sitelinks, callouts, structured snippets).
5. Landing page message-match notes.
6. 3 tests to run in the first 14 days.`;
}

function buildLandingPagePrompt(ctx: PromptContext): string {
  return `Act as a direct-response landing page strategist and senior conversion copywriter (Swagger-level clarity, no fluff).

${businessBlock(ctx)}

${antiSlopRules()}

Write a complete landing page copy package:
1. Above-the-fold: eyebrow, H1, subhead, primary CTA, secondary CTA, trust line
2. Problem section
3. Solution / product mechanism
4. Benefits grid (6 bullets, benefit-led)
5. Social proof section structure ([PLACEHOLDERS] for real quotes)
6. Feature → benefit deep dive
7. Objection handling FAQ (8)
8. Final CTA block
9. SEO title + meta description

Also provide:
- Suggested page structure wireframe outline
- 3 hero A/B variants
- Message hierarchy (what to say first/second/third)

Tone: ${ctx.tone}. Audience: ${ctx.audience}.`;
}

function buildEmailPrompt(ctx: PromptContext): string {
  return `Act as a lifecycle + direct-response email copywriter.

${businessBlock(ctx)}

${antiSlopRules()}

Deliver:
1. 8 subject lines (curiosity / benefit / urgency / plain-text personal) + preview text for each
2. One full promotional email (scannable, mobile-first)
3. One nurture/value email
4. One abandoned-intent / retargeting style email
5. CTA hierarchy + link strategy
6. Spam-trigger words to avoid
7. 3 A/B tests

State assumptions in brackets when data is missing.`;
}

function buildSocialCaptionPrompt(ctx: PromptContext): string {
  return `Act as a social content strategist and short-form copy chief.

${businessBlock(ctx)}

${antiSlopRules()}

Create 10 captions for the chosen platform (${ctx.platform ?? "primary social platform"}), each with:
- Hook line
- Body
- CTA
- Hashtag set
- Suggested visual

Vary angles. No repetitive templates.`;
}

function buildVideoReelPrompt(ctx: PromptContext): string {
  return `Act as a short-form video director + scriptwriter for Reels/TikTok/Shorts.

${businessBlock(ctx)}

${antiSlopRules()}

Deliver 5 complete short-form scripts:
- Hook (0–1s)
- Script with timing
- B-roll list
- On-screen text
- CTA
- Music vibe
- Retention notes

Plus posting format recommendations.`;
}

function buildImagePrompt(ctx: PromptContext): string {
  return `Act as a senior art director writing production-ready prompts for Midjourney / Flux / Ideogram / SDXL.

${businessBlock(ctx)}

Produce:
1. 5 full image prompts (detailed subject, composition, lens, lighting, color grade, mood, negative avoid list)
2. Aspect ratios per use case (1:1, 4:5, 9:16, 16:9)
3. Brand-safe style guide notes
4. Variants for ad vs organic vs product shot

Be specific enough that an AI image model can render without guessing.`;
}

function buildCodePrompt(ctx: PromptContext): string {
  return `Act as a principal software engineer pair-programming in production systems.

User request: "${ctx.rawInput}"

Context:
- What they're building: ${slot(ctx.product, "describe the feature or system")}
- Audience of code: maintainable production code, not throwaway snippets
- Desired output: ${ctx.goal}
- Extra: ${ctx.details ?? "None"}
- Tone of explanation: ${ctx.tone}

Requirements for your response:
1. Restate the problem in crisp technical terms (3–6 bullets).
2. Propose the approach and tradeoffs before code.
3. Deliver complete, typed, runnable code (no pseudo-code unless asked).
4. Call out edge cases, security, and performance notes.
5. List verification steps (how to test).
6. Suggest follow-up improvements only after the solution works.

Constraints:
- Do not invent APIs or package versions that are unclear — mark assumptions.
- Prefer clear structure over cleverness.
- If requirements are ambiguous, ask exactly one critical clarifying question, then continue with a best-practice default in brackets.`;
}

function buildAutomationPrompt(ctx: PromptContext): string {
  return `Act as an automation architect (Zapier / Make / n8n / MCP-aware systems).

${businessBlock(ctx)}

Design a complete automation:
1. Goal & success metric
2. Trigger
3. Step-by-step workflow with tools
4. Data fields mapping
5. Error handling & retries
6. Human-in-the-loop points
7. MVP version vs advanced version
8. Test plan`;
}

function buildResearchPrompt(ctx: PromptContext): string {
  return `Act as a sharp market analyst and research lead.

Research brief: "${ctx.rawInput}"
Goal: ${ctx.goal}
Audience for the research output: ${ctx.audience}
Extra: ${ctx.details ?? "None"}

${antiSlopRules()}

Deliver:
1. Research questions hierarchy
2. Framework (jobs-to-be-done / competitor matrix / SWOT as relevant)
3. Structured findings template with sources section
4. Implications & recommendations
5. Open questions / unknowns
Never invent statistics — use [VERIFY] tags when a number would be required.`;
}

function buildGeneralPrompt(ctx: PromptContext): string {
  return `Act as a world-class specialist in ${intentLabel(ctx.intent)} — proactive, precise, and execution-focused.

User's original request: "${ctx.rawInput}"

Context pack:
- Goal: ${ctx.goal}
- Audience: ${ctx.audience}
- Tone: ${ctx.tone}
- Platform / channel: ${ctx.platform ?? "Not specified"}
- Additional details: ${ctx.details ?? "None"}
${ctx.extraNotes.length ? `- Notes: ${ctx.extraNotes.join("; ")}` : ""}

${antiSlopRules()}

Operating instructions:
1. Infer the highest-value deliverable from the request (do not ask more than one critical question unless blocked).
2. Lead with the answer / deliverable, not preambles.
3. Use a clear structure: Overview → Deliverable → Next steps.
4. When you need missing details, insert [BRACKETED PLACEHOLDERS] instead of fictional facts.
5. Include success criteria so the user can judge if the output is good.
6. Offer one advanced upgrade option after the core deliverable.

Output requirements:
- Actionable, specific, ready to use
- No generic advice that could apply to any business or task
- Prefer examples and concrete wording over abstract guidance`;
}

function buildUgcMoneyPrompt(ctx: PromptContext): string {
  return `Act as an elite UGC creator business coach + short-form performance creative director who has helped beginners land paid brand deals and scale a content studio.

User's raw goal: "${ctx.rawInput}"

Context:
- Niche / industry: ${slot(ctx.niche, "your niche e.g. beauty, fitness, tech, food, fashion")}
- Offer / product focus: ${slot(ctx.product, "what you create or promote")}
- Target buyer: ${ctx.audience} (usually brands' marketing managers OR end consumers)
- Goal: ${ctx.goal || "Get paid for UGC / grow a UGC income stream"}
- Tone for content: ${ctx.tone}
- Extra: ${ctx.details ?? "None"}

${antiSlopRules()}

Deliver a complete beginner-to-paid playbook:

## 1. Positioning
- 3 niche positioning options with example "I help brands…" one-liners
- How to pick one this week

## 2. Portfolio in 48 hours
- Exactly what 3 sample videos to film/edit (even without brand products — use products at home)
- Hook formulas + sample scripts for each
- Tools: CapCut / phone camera / free music notes

## 3. Where to get paid
- Marketplaces (e.g. Insense, Billo, Trend-type platforms) vs direct outreach
- Week-1 action list for each path
- Example day rate / package pricing frames in [BRACKETS] if unknown

## 4. Outreach
- 5 brand pitch DM templates
- 3 cold email templates (subject + body)
- Follow-up cadence (day 0 / 3 / 7)

## 5. Content system
- 10 scroll-stopping hooks for the chosen niche
- 5 full UGC ad scripts (hook, body, CTA) 20–35 seconds
- Hook → Shoot list → Caption → Hashtags for each

## 6. AI workflow (mandatory)
Tell the user, step by step, which AI tools to open and what to paste:
1) Strategy in Claude/ChatGPT (this whole prompt)
2) Research brands/trends (Perplexity / TikTok Creative Center / Meta Ads Library)
3) Edit/publish (CapCut / Opus Clip)
4) Optional faceless path (HeyGen / Arcads / ElevenLabs)
5) Money ops (Notion tracker + Stripe/Gumroad if selling packs)

## 7. 14-day sprint calendar
Day-by-day checklist from zero → first pitch or first upload.

## 8. Metrics
What to track weekly (send rate, reply rate, delivery time, $ per video).

Do not dump vague "believe in yourself" content. Every section must be executable today.`;
}

function buildByIntent(ctx: PromptContext): string {
  switch (ctx.intent) {
    case "instagram_ad":
      return buildInstagramAdPrompt(ctx);
    case "tiktok_ad":
      return buildTikTokAdPrompt(ctx);
    case "facebook_ad":
      return buildFacebookAdPrompt(ctx);
    case "google_ad":
      return buildGoogleAdPrompt(ctx);
    case "landing_page":
      return buildLandingPagePrompt(ctx);
    case "email":
      return buildEmailPrompt(ctx);
    case "social_caption":
      return buildSocialCaptionPrompt(ctx);
    case "video_reel":
      return buildVideoReelPrompt(ctx);
    case "image":
      return buildImagePrompt(ctx);
    case "code":
      return buildCodePrompt(ctx);
    case "automation":
      return buildAutomationPrompt(ctx);
    case "research":
      return buildResearchPrompt(ctx);
    case "ugc_money":
      return buildUgcMoneyPrompt(ctx);
    default:
      return buildGeneralPrompt(ctx);
  }
}

/**
 * Main entry: build a production-grade refined prompt from messy input + answers.
 */
export function buildRefinedPrompt(
  rawInput: string,
  answers: Record<string, string>
): string {
  const ctx = buildPromptContext(rawInput, answers);
  return buildByIntent(ctx);
}

export function getPromptMeta(rawInput: string, answers: Record<string, string>) {
  const ctx = buildPromptContext(rawInput, answers);
  return {
    intent: ctx.intent,
    intentLabel: intentLabel(ctx.intent),
    quality: "production" as const,
  };
}
