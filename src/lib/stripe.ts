import Stripe from "stripe";
import { createClient as createSupabaseJs } from "@supabase/supabase-js";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-02-24.acacia" });
}

/** Service-role client for webhooks (bypasses RLS). */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL required for billing");
  }
  return createSupabaseJs(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function siteUrl(): string {
  return (
    process.env.PLETHORA_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ).replace(/\/$/, "");
}

export function isFakeBillingEnabled(): boolean {
  return (
    process.env.PLETHORA_FAKE_BILLING === "1" ||
    (process.env.NODE_ENV === "development" && process.env.PLETHORA_FAKE_BILLING !== "0")
  );
}
