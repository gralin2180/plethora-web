/**
 * "Learn how to use AI" — literacy curriculum for everyday people
 * (India-first framing, plain language, free tools first).
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
  /** Internal tools that practice the lesson */
  toolSlugs?: string[];
  externalHint?: string;
};

export const LEARN_MISSION = {
  title: "Learn how to use AI",
  tagline: "Everyday leverage — not tech jargon.",
  indiaNote:
    "India has phones, UPI, WhatsApp — and a huge gap between “AI is everywhere on the news” and “I used it today to finish my work faster.” This drive is for the common person: students, parents, shopkeepers, freelancers, job seekers, and teachers.",
  promise: [
    "Explain AI without confusing words",
    "Show copy-paste recipes for real life (study, shop, job, family)",
    "Prefer free tools you can open on a phone",
    "Safety first — never paste OTP, Aadhaar full number, card, or passwords into any chat bot",
  ],
} as const;

export const LEARN_PRINCIPLES = [
  {
    title: "AI is a helper that writes and thinks with you",
    body: "It is not magic and not a person. You ask in normal language; it replies with text, plans, or ideas. You still decide what is true.",
  },
  {
    title: "You stay the boss",
    body: "Double-check numbers, medicines, law, money, and medical advice with a real professional. AI can be wrong with full confidence.",
  },
  {
    title: "Clear questions = better answers",
    body: "Say who you are, what you need, where (city/language if useful), and any limits (budget, time). That is “prompting” — nothing fancy.",
  },
  {
    title: "Start free",
    body: "Phone browser is enough. You do not need to buy a computer or run code on day one.",
  },
] as const;

/** Simple prompt formula — teach by repetition */
export const PROMPT_FORMULA = {
  name: "The 4-line ask",
  lines: [
    { label: "Who I am", example: "College student in Pune preparing for SSC / bank exams" },
    { label: "What I want", example: "A revision timetable for 14 days + 5 practice MCQs on today" },
    { label: "Details that matter", example: "2 hours/day, Hindi + English, weak in Quant" },
    { label: "How to reply", example: "Use simple words, bullet list, no long essays" },
  ],
  template: `I am: …
I need: …
Important details: …
Reply style: simple bullets, in [English / Hindi / mix]`,
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
        title: "Explain a tough chapter",
        prompt:
          "Explain photosynthesis as if I am in class 8, with one example from Indian agriculture. End with 3 MCQs and answers.",
      },
      {
        title: "Exam revision plan",
        prompt:
          "I have 12 days for [subject]. Weak areas: … Hours/day: … Make a day-by-day plan with 15-min breaks.",
      },
      {
        title: "English / interview practice",
        prompt:
          "Act as a friendly interviewer for campus job. Ask one question at a time. After my answer, correct my English gently.",
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
          "Rewrite this work into 4 strong resume bullets with numbers if possible: … Keep truth only.",
      },
      {
        title: "Salary / HR reply",
        prompt:
          "Write a polite WhatsApp message following up after an interview for [role] held on [date]. Simple English.",
      },
      {
        title: "Cover message for job portal",
        prompt:
          "Write 80-word introduction for Naukri/LinkedIn for [role]. I have skills: … City: …",
      },
    ],
  },
  {
    role: "Shop / small business",
    icon: "Store",
    scenarios: [
      {
        title: "WhatsApp status for product",
        prompt:
          "Write 3 short WhatsApp statuses to sell [product] in [city]. Warm tone, Hindi+English mix, no spam words.",
      },
      {
        title: "Price list / invoice wording",
        prompt:
          "Make a clean bilingual (Hindi-English) price list for: … Format for screenshot.",
      },
      {
        title: "Reply to angry customer",
        prompt:
          "Customer is unhappy because … Write a calm WhatsApp reply that takes responsibility and offers a fix.",
      },
    ],
  },
  {
    role: "Home / family",
    icon: "Home",
    scenarios: [
      {
        title: "Weekly meal plan",
        prompt:
          "Family of 4, veg, mid-budget, Indian kitchen. Make a 7-day dinner plan with shopping list for one trip.",
      },
      {
        title: "School form help",
        prompt:
          "Explain this form question in simple Hindi, then draft my answer: …",
      },
      {
        title: "Doctor appointment questions",
        prompt:
          "I will visit a doctor for … Suggest 8 calm questions to ask. I am not a doctor — remind me this is not medical advice.",
      },
    ],
  },
  {
    role: "Teacher / coach",
    icon: "GraduationCap",
    scenarios: [
      {
        title: "Worksheet in 2 minutes",
        prompt:
          "Create a class [N] worksheet on [topic], 10 questions + answer key at the end. Simple English.",
      },
      {
        title: "Parent message",
        prompt:
          "Write a respectful message to parents about [progress / PTM / fee note]. Keep warm, not scolding.",
      },
    ],
  },
  {
    role: "Farm / rural / market (examples)",
    icon: "Sprout",
    scenarios: [
      {
        title: "Simple pest explanation",
        prompt:
          "Explain possible reasons for yellow leaves on [crop] in simple language. List when to ask a local agri officer. Not a substitute for expert advice.",
      },
      {
        title: "Market rate notes",
        prompt:
          "Turn these mandi notes into a clean table and a 2-line summary for my family WhatsApp group: …",
      },
    ],
  },
];

export const SAFETY_RULES = [
  "Never share OTP, full Aadhaar number, PAN, bank account, card numbers, or UPI PIN with any AI chat.",
  "Do not upload someone else’s private documents without permission.",
  "For health, money, and legal decisions — AI is a draft helper only; verify with a qualified person.",
  "If a tool asks you to “pay first to unlock” with a strange link — stop and verify the website.",
  "On shared family phones, don’t leave logged-in chats open with private employer documents.",
] as const;

export const LESSONS: LearnLesson[] = [
  {
    id: "start-5",
    title: "Start in 5 minutes (phone is enough)",
    minutes: 5,
    audience: ["everyone"],
    plain:
      "Open any free AI chat (or Plethora Chat). Type what you need in normal English or Hinglish. Read the reply. Edit it. Use what helps — ignore the rest.",
    tryIt: "Ask: “Explain fixed deposit vs PPF in simple Hindi for a first-time saver. Use short bullets.”",
    toolSlugs: ["chat"],
    externalHint: "Also fine: Gemini app, ChatGPT free, or WhatsApp-integrated assistants where available.",
  },
  {
    id: "prompt-4",
    title: "The 4-line ask (your only “prompt course”)",
    minutes: 8,
    audience: ["everyone"],
    plain:
      "Who you are + what you need + important details + how you want the answer. That one pattern beats copy-pasting random “viral prompts.”",
    tryIt: "Write one 4-line ask for tomorrow’s real task — school, shop, or job.",
    toolSlugs: ["prompt-assistant", "chat"],
  },
  {
    id: "check-work",
    title: "Always check the work",
    minutes: 6,
    audience: ["everyone", "students", "job"],
    plain:
      "AI can invent book titles, wrong prices, and wrong laws. For anything important — mark, money, medicine — verify. Use AI to draft, you to approve.",
    tryIt:
      "Ask AI for 3 sources or “what might be wrong with this answer?” about something you already know.",
  },
  {
    id: "daily-plan",
    title: "Plan your day / week with AI",
    minutes: 10,
    audience: ["everyone", "students", "job", "home"],
    plain:
      "Dump your chaos: work, family, health, exams, shop hours. Let AI turn it into hours and priorities. You adjust times that feel wrong.",
    tryIt: "Use the Daily life planner tool with your real schedule constraints.",
    toolSlugs: ["life-planner", "calendar-generator", "multi-clock"],
  },
  {
    id: "study",
    title: "Study smarter (not longer notes only)",
    minutes: 12,
    audience: ["students", "teachers"],
    plain:
      "Ask for summaries, quizzes, flashcards, and error explanations. Stick to your syllabus. Don’t submit unedited AI essays if your school forbids it — use for practice.",
    tryIt: "Paste a tough paragraph and ask for quiz + answer key.",
    toolSlugs: ["ai-worksheet-generator", "chat"],
  },
  {
    id: "job",
    title: "Job applications without panic",
    minutes: 12,
    audience: ["job"],
    plain:
      "Rewrite bullets, draft LinkedIn lines, practice HR English. Keep everything true — fake experience destroys trust.",
    tryIt: "Run ATS resume check + LaTeX/simple resume path if you need a clean CV.",
    toolSlugs: ["ats-resume", "latex-resume", "resume-bullet", "ai-bio-generator"],
  },
  {
    id: "business",
    title: "Small business & WhatsApp selling",
    minutes: 12,
    audience: ["business"],
    plain:
      "Product captions, polite customer replies, simple English price lists, festival offers. You still handle cash, GST, and real customers.",
    tryIt: "Write 3 Diwali offer lines for your actual product using Chat + copy polish.",
    toolSlugs: ["chat", "message-sequence-copy"],
  },
  {
    id: "office",
    title: "Office admin in half the time",
    minutes: 10,
    audience: ["job", "everyone"],
    plain:
      "Emails, agendas, Hindi–English draft letters, meeting notes → actions. Paste rough Hindi notes; ask for clean professional English (or reverse).",
    tryIt: "Turn messy meeting notes into 5 action items with owners.",
    toolSlugs: ["email-polish", "meeting-agenda"],
  },
  {
    id: "safety",
    title: "Stay safe (India common risks)",
    minutes: 8,
    audience: ["everyone"],
    plain:
      "Scams use fear (“KYC freeze”, “lottery”). AI can write scam-like messages too — don’t train yourself to trust urgency. Never paste banking secrets into chats.",
    tryIt: "Read the safety checklist on this page once out loud with family.",
  },
  {
    id: "local-private",
    title: "When to use tools only on your phone vs private local AI",
    minutes: 10,
    audience: ["everyone", "job"],
    plain:
      "Public free chats are fine for general learning. For secret company or personal files, prefer apps that stay offline/local when you can — later advanced step.",
    tryIt: "Open Local AI backends only if you want private models on your PC.",
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
    title: "Absolute beginner (1 hour total)",
    who: "Never used ChatGPT / Gemini seriously",
    lessonIds: ["start-5", "prompt-4", "check-work", "safety", "daily-plan"],
  },
  {
    id: "student-path",
    title: "Student track",
    who: "School, college, competitive exams",
    lessonIds: ["start-5", "prompt-4", "study", "daily-plan", "check-work", "safety"],
  },
  {
    id: "job-path",
    title: "Job seeker track",
    who: "Resume, interviews, first office job",
    lessonIds: ["start-5", "prompt-4", "job", "office", "check-work", "safety"],
  },
  {
    id: "business-path",
    title: "Shop / freelancing track",
    who: "WhatsApp business, small brand, services",
    lessonIds: ["start-5", "prompt-4", "business", "daily-plan", "safety"],
  },
];
