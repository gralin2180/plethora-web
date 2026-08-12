/**
 * Local-only email workspace — drafts, job apps, reminders (browser storage).
 */

export type EmailDraft = {
  id: string;
  to: string;
  subject: string;
  body: string;
  status: "draft" | "ready" | "sent";
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type JobApplication = {
  id: string;
  company: string;
  role: string;
  contactEmail: string;
  status: "draft" | "applied" | "interview" | "offer" | "rejected" | "ghosted";
  appliedAt?: string;
  followUpAt?: string;
  notes: string;
  draftId?: string;
  createdAt: string;
  updatedAt: string;
};

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  builtin?: boolean;
};

export type EmailManagerState = {
  drafts: EmailDraft[];
  applications: JobApplication[];
  templates: EmailTemplate[];
  settings: {
    notificationsEnabled: boolean;
    signature: string;
  };
};

const KEY = "plethora.email.manager.v1";

export const BUILTIN_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl-job",
    name: "Job application",
    builtin: true,
    subject: "Application — {{role}} at {{company}}",
    body: `Hi {{name}},

I'm applying for the {{role}} role at {{company}}. I bring {{years}} years in {{skill}} and would love to contribute to your team.

I've attached my resume. Happy to share a portfolio or jump on a short call this week.

Best,
{{your_name}}`,
  },
  {
    id: "tpl-followup",
    name: "Follow-up (1 week)",
    builtin: true,
    subject: "Following up — {{role}} application",
    body: `Hi {{name}},

I applied for {{role}} at {{company}} last week and wanted to briefly follow up. Still very interested — happy to provide references or a quick work sample.

Thanks for your time,
{{your_name}}`,
  },
  {
    id: "tpl-cold",
    name: "Cold outreach",
    builtin: true,
    subject: "Quick idea for {{company}}",
    body: `Hi {{name}},

I noticed {{hook}}. I help with {{offer}} — recent win: {{proof}}.

Worth a 10-minute chat this week?

— {{your_name}}`,
  },
  {
    id: "tpl-thanks",
    name: "Thank you (after interview)",
    builtin: true,
    subject: "Thank you — {{role}} conversation",
    body: `Hi {{name}},

Thank you for taking the time to discuss the {{role}} position. I enjoyed learning about {{topic}} and I'm excited about the fit.

Looking forward to next steps,
{{your_name}}`,
  },
];

function emptyState(): EmailManagerState {
  return {
    drafts: [],
    applications: [],
    templates: [...BUILTIN_TEMPLATES],
    settings: { notificationsEnabled: false, signature: "" },
  };
}

export function loadEmailManager(): EmailManagerState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as EmailManagerState;
    const builtins = BUILTIN_TEMPLATES.filter(
      (b) => !parsed.templates?.some((t) => t.id === b.id)
    );
    return {
      drafts: parsed.drafts || [],
      applications: parsed.applications || [],
      templates: [...(parsed.templates || []), ...builtins],
      settings: parsed.settings || { notificationsEnabled: false, signature: "" },
    };
  } catch {
    return emptyState();
  }
}

export function saveEmailManager(state: EmailManagerState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function applyTemplate(
  tpl: EmailTemplate,
  vars: Record<string, string>
): { subject: string; body: string } {
  let subject = tpl.subject;
  let body = tpl.body;
  for (const [k, v] of Object.entries(vars)) {
    const re = new RegExp(`\\{\\{${k}\\}\\}`, "gi");
    subject = subject.replace(re, v);
    body = body.replace(re, v);
  }
  return { subject, body };
}

export function dueReminders(apps: JobApplication[]): JobApplication[] {
  const now = Date.now();
  return apps.filter((a) => {
    if (!a.followUpAt) return false;
    const t = new Date(a.followUpAt).getTime();
    return !Number.isNaN(t) && t <= now + 24 * 60 * 60 * 1000;
  });
}
