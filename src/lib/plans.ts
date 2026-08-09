/**
 * Free vs paid capability flags — single source of truth for gates.
 * Wire Stripe / Supabase plan later; until then client can pass "free" | "pro" | "hardcore".
 */

export type PlanId = "free" | "pro" | "team" | "hardcore";

export interface PlanCapabilities {
  id: PlanId;
  name: string;
  /** Template prompts always on for every plan */
  templatePrompts: true;
  /** Free public/cheap model polish (rate limited) */
  freeApiPolish: boolean;
  freePolishDailyLimit: number;
  /** Higher-quality hosted polish (owner-controlled provider) */
  paidLlmPolish: boolean;
  paidPolishDailyLimit: number | "unlimited";
  unlimitedToolRuns: boolean;
  multiLocalBackendProfiles: boolean;
  priorityDirectoryPacks: boolean;
  hardcoreTools: boolean;
  /** Concurrent registered browsers / devices */
  maxDevices: number;
  maxWorkspaces: number;
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
  },
};

export function getPlanCapabilities(plan: PlanId = "free"): PlanCapabilities {
  return PLAN_CAPABILITIES[plan] ?? PLAN_CAPABILITIES.free;
}

export function canUsePaidPolish(plan: PlanId): boolean {
  return getPlanCapabilities(plan).paidLlmPolish;
}
