/**
 * Commercial catalog — subscriptions, trial packs, AI budgets.
 * Stripe price IDs come from env after you create products in Stripe Dashboard.
 */

import type { PlanId } from "./plans";

export type BillingSku =
  | "pro"
  | "team"
  | "hardcore"
  | "office_personal"
  | "office_business"
  | "pack_hourly"
  | "pack_daily"
  | "pack_weekly";

export type BillingProduct = {
  sku: BillingSku;
  name: string;
  description: string;
  /** Display price */
  priceLabel: string;
  periodLabel: string;
  /** cents — for reference / fake billing */
  amountCents: number;
  mode: "subscription" | "payment";
  /** Plan activated after successful payment */
  grantsPlan?: PlanId;
  /** Temporary premium access (ms from purchase) */
  trialMs?: number;
  trialLabel?: string;
  /** Extra premium AI messages granted (on top of plan monthly) for packs */
  packPremiumMessages?: number;
  envPriceId: string;
  features: string[];
  highlighted?: boolean;
  /** Pricing family — Office suite vs AI budget plans */
  family?: "ai" | "office";
};

export const BILLING_PRODUCTS: Record<BillingSku, BillingProduct> = {
  pro: {
    sku: "pro",
    name: "Pro",
    description: "Creators & power users — included paid models, then slow cheap fallback.",
    priceLabel: "$19",
    periodLabel: "/month",
    amountCents: 1900,
    mode: "subscription",
    grantsPlan: "pro",
    envPriceId: "STRIPE_PRICE_PRO",
    highlighted: true,
    features: [
      "Unlimited free utilities & Pro tools",
      "20 workspaces · 8 devices",
      "Premium models with monthly included budget (models we buy)",
      "Then slower cheap models; extra usage is billed — we don’t resell free trials",
      "Self usage limits + soft warnings",
      "BYOK always available",
      "Office Personal included (commercial use of the suite)",
      "Priority support",
    ],
  },
  office_personal: {
    sku: "office_personal",
    name: "Office Personal",
    description:
      "Plethora Office for one person — commercial use, more chats, modest AI. Not Microsoft 365.",
    priceLabel: "$9",
    periodLabel: "/month",
    amountCents: 900,
    mode: "subscription",
    grantsPlan: "office",
    envPriceId: "STRIPE_PRICE_OFFICE_PERSONAL",
    family: "office",
    features: [
      "Full browser Office suite (Word, Boards, Rooms, Cut…)",
      "Commercial use license for one person",
      "~80 included paid-model msgs/mo for Office + Chat",
      "80 saved chat threads · 8 custom agents",
      "Need more AI budget? Pro includes this SKU’s Office license",
    ],
  },
  office_business: {
    sku: "office_business",
    name: "Office Business",
    description:
      "Suite for a shop / studio — business license, more seats, more AI. Not Microsoft 365.",
    priceLabel: "$18",
    periodLabel: "/month",
    amountCents: 1800,
    mode: "subscription",
    grantsPlan: "office_biz",
    envPriceId: "STRIPE_PRICE_OFFICE_BUSINESS",
    family: "office",
    features: [
      "Everything in Office Personal",
      "Business / studio commercial license",
      "~200 included paid-model msgs/mo",
      "200 chat threads · 25 agents · 15 devices",
      "Team Rooms + Connect for production desks",
    ],
  },
  team: {
    sku: "team",
    name: "Team",
    description: "Agencies and small teams",
    priceLabel: "$49",
    periodLabel: "/month",
    amountCents: 4900,
    mode: "subscription",
    grantsPlan: "team",
    envPriceId: "STRIPE_PRICE_TEAM",
    features: [
      "Everything in Pro",
      "Higher premium AI budget",
      "25 devices · 100 workspaces",
      "Office Business license included",
      "Shared workflows (roadmap)",
    ],
  },
  hardcore: {
    sku: "hardcore",
    name: "Hardcore All-Access",
    description: "Power stack — max AI budget and every tool unlocked",
    priceLabel: "$39",
    periodLabel: "/month",
    amountCents: 3900,
    mode: "subscription",
    grantsPlan: "hardcore",
    envPriceId: "STRIPE_PRICE_HARDCORE",
    features: [
      "Everything in Pro",
      "Largest premium AI included budget",
      "Hardcore tools & MCP power packs",
      "40 devices · 200 workspaces",
      "Office Business license included",
    ],
  },
  pack_hourly: {
    sku: "pack_hourly",
    name: "Try pack · 1 hour",
    description: "Taste premium models without a subscription",
    priceLabel: "$2",
    periodLabel: " one-time",
    amountCents: 200,
    mode: "payment",
    trialMs: 60 * 60 * 1000,
    trialLabel: "1 hour",
    packPremiumMessages: 25,
    envPriceId: "STRIPE_PRICE_PACK_HOURLY",
    features: [
      "Premium models for 1 hour or 25 msgs (whichever first)",
      "Then free pool + BYOK",
    ],
  },
  pack_daily: {
    sku: "pack_daily",
    name: "Try pack · 24 hours",
    description: "A full day of Pro-tier model access",
    priceLabel: "$5",
    periodLabel: " one-time",
    amountCents: 500,
    mode: "payment",
    trialMs: 24 * 60 * 60 * 1000,
    trialLabel: "24 hours",
    packPremiumMessages: 80,
    envPriceId: "STRIPE_PRICE_PACK_DAILY",
    features: [
      "Premium models for 24h or 80 msgs",
      "Great for a project sprint",
    ],
  },
  pack_weekly: {
    sku: "pack_weekly",
    name: "Try pack · 7 days",
    description: "A week of premium without committing monthly",
    priceLabel: "$12",
    periodLabel: " one-time",
    amountCents: 1200,
    mode: "payment",
    trialMs: 7 * 24 * 60 * 60 * 1000,
    trialLabel: "7 days",
    packPremiumMessages: 250,
    envPriceId: "STRIPE_PRICE_PACK_WEEKLY",
    features: [
      "Premium models for 7 days or 250 msgs",
      "Convert to Pro anytime",
    ],
  },
};

export function priceIdForSku(sku: BillingSku): string | undefined {
  const product = BILLING_PRODUCTS[sku];
  return process.env[product.envPriceId]?.trim() || undefined;
}

export function skuFromPriceId(priceId: string): BillingSku | null {
  for (const sku of Object.keys(BILLING_PRODUCTS) as BillingSku[]) {
    const id = process.env[BILLING_PRODUCTS[sku].envPriceId]?.trim();
    if (id && id === priceId) return sku;
  }
  return null;
}

export function isStripeBillingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}
