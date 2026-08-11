/**
 * Free vs paid capability flags — single source of truth for gates.
 * Subscription state is set only via Stripe webhook / service role.
 */

export type PlanId = "free" | "pro" | "team" | "hardcore";

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
  /** Platform free-model chat msgs per day (not BYOK, not premium) */
  freeAiDailyLimit: number;
  /**
   * Included premium-model messages per billing month on our key.
   * After this, auto-fallback to free models (Cursor-style).
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
    freeAiDailyLimit: 40,
    premiumAiMonthlyLimit: 0,
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
    freeAiDailyLimit: 400,
    premiumAiMonthlyLimit: 1500,
    softWarnRatio: 0.8,
  },
};

export function getPlanCapabilities(plan: PlanId = "free"): PlanCapabilities {
  return PLAN_CAPABILITIES[plan] ?? PLAN_CAPABILITIES.free;
}

export function canUsePaidPolish(plan: PlanId): boolean {
  return getPlanCapabilities(plan).paidLlmPolish;
}

/** Guest free stack — keeps shared free key alive under traffic. */
export const GUEST_FREE_AI_DAILY = 12;
