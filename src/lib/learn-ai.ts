/**
 * "Learn how to use AI" — practical literacy curriculum.
 * Plain language, free tools first, professional tone.
 */

export type LearnAudience =
  | "everyone"
  | "students"
  | "job"
  | "business"
  | "home"
  | "teachers"
  | "farmers";

export type LearnLesson = {
  id: string;
  title: string;
  minutes: number;
  audience: LearnAudience[];
  plain: string;
  tryIt: string;
  toolSlugs?: string[];
  externalHint?: string;
};

export const LEARN_MISSION = {
  title: "Learn how to use AI",
  tagline: "Clear guidance for better results — without the jargon.",
  intro:
    "Built for people who use AI at work, in study, and in everyday life — not only developers. Short lessons, reusable prompts, and free tools so you can practice immediately.",
  promise: [
    "Plain explanations — no confusing buzzwords",
    "Reusable recipes for study, work, business, and home",
    "Free tools you can start with in a browser",
    "Security first — never share OTP, passwords, or payment details with a chat bot",
  ],
} as const;

export const LEARN_PRINCIPLES = [
  {
    title: "AI is a capable assistant — not a substitute for you",
    body: "It helps draft, plan, and explore ideas. You remain accountable for accuracy, tone, and final decisions.",
  },
  {
    title: "You stay in control",
    body: "Verify numbers, legal or medical guidance, and financial advice with a qualified professional. AI can be wrong with confidence.",
  },
  {
    title: "Clear requests produce better answers",
    body: "State who you are, what you need, relevant constraints, and the format you want back. That simple structure is most of “prompting.”",
  },
  {
    title: "Start free and simple",
    body: "A browser is enough on day one. You do not need special hardware or setup to learn productively.",
  },
] as const;

/** Simple prompt formula — teach by repetition */
export const PROMPT_FORMULA = {
  name: "The four-line request",
  lines: [
    {
      label: "Who I am",
      example: "Product marketer preparing a client presentation for next week",
    },
    {
      label: "What I want",
      example: "A one-page outline with three talking points and a closing ask",
    },
    {
      label: "Details that matter",
      example: "B2B SaaS, non-technical audience, 10 minutes speaking time",
    },
    {
      label: "How to reply",
      example: "Use short bullets, plain language, no filler",
    },
  ],
  template: `I am: …
I need: …
Important details: …
Reply style: clear bullets, concise, in [language]`,
} as const;

export const DAY_LIFE_RECIPES: {
  role: string;
  icon: string;
  scenarios: { title: string; prompt: string }[];
}[] = [
  {
    role: "Student",
    icon: "BookOpen",
    scenarios: [
      {
        title: "Explain a difficult topic",
        prompt:
          "Explain [topic] for a high school student, with one real-world example. End with 3 practice questions and answers.",
      },
      {
        title: "Exam revision plan",
        prompt:
          "I have 12 days for [subject]. Weak areas: … Hours/day: … Create a day-by-day plan with short breaks.",
      },
      {
        title: "Interview practice",
        prompt:
          "Act as a friendly interviewer for [role]. Ask one question at a time. After my answer, give concise feedback.",
      },
    ],
  },
  {
    role: "Job seeker",
    icon: "Briefcase",
    scenarios: [
      {
        title: "Rewrite resume bullets",
        prompt:
          "Rewrite this experience into 4 strong resume bullets with measurable impact where honest: … Keep only what is true.",
      },
      {
        title: "Interview follow-up",
        prompt:
          "Write a polite email following up after an interview for [role] on [date]. Professional, under 120 words.",
      },
      {
        title: "Profile introduction",
        prompt:
          "Write an 80-word LinkedIn summary for [role]. Skills: … Strengths: … Tone: confident and clear.",
      },
    ],
  },
  {
    role: "Small business",
    icon: "Store",
    scenarios: [
      {
        title: "Product post copy",
        prompt:
          "Write 3 short social posts to promote [product] for [audience]. Warm professional tone, no spam language.",
      },
      {
        title: "Price list wording",
        prompt:
          "Create a clean price list for: … Format suitable for a screenshot or one-pager.",
      },
      {
        title: "Reply to a frustrated customer",
        prompt:
          "A customer is unhappy because … Write a calm reply that acknowledges the issue and offers a clear next step.",
      },
    ],
  },
  {
    role: "Home & family",
    icon: "Home",
    scenarios: [
      {
        title: "Weekly meal plan",
        prompt:
          "Family of 4, mid-budget, [diet preferences]. Create a 7-day dinner plan with a single shopping list.",
      },
      {
        title: "Form or admin wording",
        prompt:
          "Explain this form question in plain language, then draft my answer: …",
      },
      {
        title: "Appointment questions",
        prompt:
          "I have an appointment about … Suggest 8 calm questions to ask. Remind me this is not professional medical or legal advice.",
      },
    ],
  },
  {
    role: "Teacher / coach",
    icon: "GraduationCap",
    scenarios: [
      {
        title: "Worksheet in minutes",
        prompt:
          "Create a grade [N] worksheet on [topic], 10 questions with an answer key. Clear, age-appropriate language.",
      },
      {
        title: "Parent update",
        prompt:
          "Write a respectful message to parents about [progress update]. Warm and constructive, not scolding.",
      },
    ],
  },
  {
    role: "Field & operations",
    icon: "Sprout",
    scenarios: [
      {
        title: "Explain a technical problem simply",
        prompt:
          "Explain possible reasons for [problem] in plain language. Note when I should consult a local specialist. Not a substitute for expert advice.",
      },
      {
        title: "Turn notes into a summary",
        prompt:
          "Turn these raw notes into a clean table and a two-line summary for the team: …",
      },
    ],
  },
];

export const SAFETY_RULES = [
  "Never share OTP, national ID numbers, bank or card details, or account passwords with any AI chat.",
  "Do not upload other people’s private documents without permission.",
  "For health, money, and legal decisions — treat AI as a drafting aid only; verify with a qualified professional.",
  "If a tool demands unexpected payment or unusual login links — stop and verify the official site.",
  "On shared devices, sign out of chats that contain sensitive work or personal files.",
] as const;

export const LESSONS: LearnLesson[] = [
  {
    id: "start-5",
    title: "Start in five minutes",
    minutes: 5,
    audience: ["everyone"],
    plain:
      "Open any free AI chat (or Plethora Chat). Describe what you need in normal language. Read the reply, edit it, and keep only what helps.",
    tryIt:
      "Ask: “Explain [a concept you care about] in short bullets for a first-time learner.”",
    toolSlugs: ["chat"],
    externalHint: "Also fine: Gemini, ChatGPT free, Claude free, or Copilot where available.",
  },
  {
    id: "prompt-4",
    title: "The four-line request",
    minutes: 8,
    audience: ["everyone"],
    plain:
      "Who you are + what you need + important details + how you want the answer. That pattern beats collecting random viral prompts.",
    tryIt: "Write one four-line request for a real task you have this week.",
    toolSlugs: ["prompt-assistant", "chat"],
  },
  {
    id: "check-work",
    title: "Always review the output",
    minutes: 6,
    audience: ["everyone", "students", "job"],
    plain:
      "AI can invent sources, prices, and rules. For anything important — grades, money, health — verify. Use AI to draft; you approve.",
    tryIt:
      "Ask AI what might be wrong with an answer on a topic you already know well.",
  },
  {
    id: "daily-plan",
    title: "Plan your day or week with AI",
    minutes: 10,
    audience: ["everyone", "students", "job", "home"],
    plain:
      "List work, study, errands, and priorities. Let AI turn chaos into time blocks. Adjust anything that does not fit real life.",
    tryIt: "Use the Daily life planner with your actual constraints.",
    toolSlugs: ["life-planner", "calendar-generator", "multi-clock"],
  },
  {
    id: "study",
    title: "Study more effectively",
    minutes: 12,
    audience: ["students", "teachers"],
    plain:
      "Request summaries, quizzes, flashcards, and explanations of mistakes. Follow your syllabus. Use AI for practice — not for policy violations.",
    tryIt: "Paste a difficult paragraph and ask for a short quiz with an answer key.",
    toolSlugs: ["ai-worksheet-generator", "chat"],
  },
  {
    id: "job",
    title: "Job applications with less stress",
    minutes: 12,
    audience: ["job"],
    plain:
      "Rewrite bullets, draft LinkedIn lines, and practice interview answers. Keep everything truthful — invented experience destroys trust.",
    tryIt: "Run an ATS resume check, or polish your CV wording in chat.",
    toolSlugs: ["ats-resume", "latex-resume", "resume-bullet", "ai-bio-generator"],
  },
  {
    id: "business",
    title: "Small business messaging",
    minutes: 12,
    audience: ["business"],
    plain:
      "Product copy, calm customer replies, offers, and simple lists. You still own pricing, delivery, and real customer relationships.",
    tryIt: "Draft three promotional lines for a product you actually sell.",
    toolSlugs: ["chat", "message-sequence-copy"],
  },
  {
    id: "office",
    title: "Office work in half the time",
    minutes: 10,
    audience: ["job", "everyone"],
    plain:
      "Emails, agendas, polish rough notes into action items, and clean professional language for meetings.",
    tryIt: "Turn messy meeting notes into five action items with owners.",
    toolSlugs: ["email-polish", "meeting-agenda"],
  },
  {
    id: "safety",
    title: "Stay safe online",
    minutes: 8,
    audience: ["everyone"],
    plain:
      "Scams rely on urgency and fear. Treat unexpected payment or account warnings carefully. Never paste banking or identity secrets into chats.",
    tryIt: "Review the safety checklist on this page once with someone who shares a device with you.",
  },
  {
    id: "local-private",
    title: "When to use cloud chat vs local AI",
    minutes: 10,
    audience: ["everyone", "job"],
    plain:
      "Public free chats are fine for general learning. For confidential company or personal files, prefer private or local setups when you need them.",
    tryIt: "Open Local AI backends only if you want models that stay on your machine.",
    toolSlugs: [],
    externalHint: "Install Hub → Ollama / LM Studio when you are ready.",
  },
];

export const LEARN_PATHS: {
  id: string;
  title: string;
  who: string;
  lessonIds: string[];
}[] = [
  {
    id: "starter",
    title: "Absolute beginner",
    who: "About one hour total if you are new to ChatGPT, Gemini, or Claude",
    lessonIds: ["start-5", "prompt-4", "check-work", "safety", "daily-plan"],
  },
  {
    id: "student-path",
    title: "Student track",
    who: "School, college, and exam preparation",
    lessonIds: ["start-5", "prompt-4", "study", "daily-plan", "check-work", "safety"],
  },
  {
    id: "job-path",
    title: "Career track",
    who: "Resumes, interviews, and first professional roles",
    lessonIds: ["start-5", "prompt-4", "job", "office", "check-work", "safety"],
  },
  {
    id: "business-path",
    title: "Business track",
    who: "Founders, freelancers, and small teams",
    lessonIds: ["start-5", "prompt-4", "business", "daily-plan", "safety"],
  },
];
