/**
 * Free vs paid capability flags — single source of truth for gates.
 * Subscription state is set only via Stripe webhook / service role.
 */

export type PlanId = "free" | "pro" | "team" | "hardcore" | "office" | "office_biz";

export type OfficeLicense = "web" | "personal" | "business";

export interface PlanCapabilities {
  id: PlanId;
  name: string;
  templatePrompts: true;
  freeApiPolish: boolean;
  freePolishDailyLimit: number;
  paidLlmPolish: boolean;
  paidPolishDailyLimit: number | "unlimited";
  unlimitedToolRuns: boolean;
  multiLocalBackendProfiles: boolean;
  priorityDirectoryPacks: boolean;
  hardcoreTools: boolean;
  maxDevices: number;
  maxWorkspaces: number;
  /** Microsoft-style suite license — not Microsoft 365. */
  officeLicense: OfficeLicense;
  maxChatThreads: number;
  maxCustomAssistants: number;
  /** Platform free-model chat msgs per day (not BYOK, not premium) */
  freeAiDailyLimit: number;
  /**
   * Included paid-model messages per billing month on our key.
   * After this: slower cheap models (daily cap), then extra usage is billed.
   * We do not resell NVIDIA/OpenCode/OpenRouter :free trial access as a paid SKU.
   */
  premiumAiMonthlyLimit: number;
  /** Soft warn when used/limit >= this (0–1) */
  softWarnRatio: number;
}

export const PLAN_CAPABILITIES: Record<PlanId, PlanCapabilities> = {
  free: {
    id: "free",
    name: "Free",
    templatePrompts: true,
    freeApiPolish: true,
    freePolishDailyLimit: 15,
    paidLlmPolish: false,
    paidPolishDailyLimit: 0,
    unlimitedToolRuns: false,
    multiLocalBackendProfiles: false,
    priorityDirectoryPacks: false,
    hardcoreTools: false,
    maxDevices: 3,
    maxWorkspaces: 2,
    officeLicense: "web",
    maxChatThreads: 12,
    maxCustomAssistants: 1,
    freeAiDailyLimit: 40,
    premiumAiMonthlyLimit: 0,
    softWarnRatio: 0.8,
  },
  office: {
    id: "office",
    name: "Office Personal",
    templatePrompts: true,
    freeApiPolish: true,
    freePolishDailyLimit: 40,
    paidLlmPolish: true,
    paidPolishDailyLimit: 80,
    unlimitedToolRuns: false,
    multiLocalBackendProfiles: true,
    priorityDirectoryPacks: false,
    hardcoreTools: false,
    maxDevices: 5,
    maxWorkspaces: 8,
    officeLicense: "personal",
    maxChatThreads: 80,
    maxCustomAssistants: 8,
    freeAiDailyLimit: 80,
    premiumAiMonthlyLimit: 80,
    softWarnRatio: 0.8,
  },
  office_biz: {
    id: "office_biz",
    name: "Office Business",
    templatePrompts: true,
    freeApiPolish: true,
    freePolishDailyLimit: 80,
    paidLlmPolish: true,
    paidPolishDailyLimit: 200,
    unlimitedToolRuns: true,
    multiLocalBackendProfiles: true,
    priorityDirectoryPacks: true,
    hardcoreTools: false,
    maxDevices: 15,
    maxWorkspaces: 40,
    officeLicense: "business",
    maxChatThreads: 200,
    maxCustomAssistants: 25,
    freeAiDailyLimit: 150,
    premiumAiMonthlyLimit: 200,
    softWarnRatio: 0.8,
  },
  pro: {
    id: "pro",
    name: "Pro",
    templatePrompts: true,
    freeApiPolish: true,
    freePolishDailyLimit: 50,
    paidLlmPolish: true,
    paidPolishDailyLimit: 200,
    unlimitedToolRuns: true,
    multiLocalBackendProfiles: true,
    priorityDirectoryPacks: true,
    hardcoreTools: false,
    maxDevices: 8,
    maxWorkspaces: 20,
    officeLicense: "personal",
    maxChatThreads: 80,
    maxCustomAssistants: 15,
    freeAiDailyLimit: 120,
    premiumAiMonthlyLimit: 300,
    softWarnRatio: 0.8,
  },
  team: {
    id: "team",
    name: "Team",
    templatePrompts: true,
    freeApiPolish: true,
    freePolishDailyLimit: 100,
    paidLlmPolish: true,
    paidPolishDailyLimit: 500,
    unlimitedToolRuns: true,
    multiLocalBackendProfiles: true,
    priorityDirectoryPacks: true,
    hardcoreTools: false,
    maxDevices: 25,
    maxWorkspaces: 100,
    officeLicense: "business",
    maxChatThreads: 200,
    maxCustomAssistants: 50,
    freeAiDailyLimit: 200,
    premiumAiMonthlyLimit: 900,
    softWarnRatio: 0.8,
  },
  hardcore: {
    id: "hardcore",
    name: "Hardcore All-Access",
    templatePrompts: true,
    freeApiPolish: true,
    freePolishDailyLimit: 9999,
    paidLlmPolish: true,
    paidPolishDailyLimit: "unlimited",
    unlimitedToolRuns: true,
    multiLocalBackendProfiles: true,
    priorityDirectoryPacks: true,
    hardcoreTools: true,
    maxDevices: 40,
    maxWorkspaces: 200,
    officeLicense: "business",
    maxChatThreads: 400,
    maxCustomAssistants: 100,
    freeAiDailyLimit: 400,
    premiumAiMonthlyLimit: 1500,
    softWarnRatio: 0.8,
  },
};

export function getPlanCapabilities(plan: PlanId = "free"): PlanCapabilities {
  return PLAN_CAPABILITIES[plan] ?? PLAN_CAPABILITIES.free;
}

export function parsePlanId(raw: string | null | undefined): PlanId {
  if (
    raw === "pro" ||
    raw === "team" ||
    raw === "hardcore" ||
    raw === "office" ||
    raw === "office_biz"
  ) {
    return raw;
  }
  return "free";
}

export function officeLicenseFor(plan: PlanId = "free"): OfficeLicense {
  return getPlanCapabilities(plan).officeLicense;
}

export function canUsePaidPolish(plan: PlanId): boolean {
  return getPlanCapabilities(plan).paidLlmPolish;
}

/** Guest free stack — keeps shared free key alive under traffic. */
export const GUEST_FREE_AI_DAILY = 12;
