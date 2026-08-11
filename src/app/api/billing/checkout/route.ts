import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  BILLING_PRODUCTS,
  isStripeBillingConfigured,
  priceIdForSku,
  type BillingSku,
} from "@/lib/billing-products";
import { getStripe, isFakeBillingEnabled, siteUrl } from "@/lib/stripe";
import { activateSubscription, activateTrialPack } from "@/lib/billing-activate";
import { createServiceClient } from "@/lib/stripe";

const SKUS = new Set(Object.keys(BILLING_PRODUCTS));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sku = String(body.sku || "") as BillingSku;
    if (!SKUS.has(sku)) {
      return NextResponse.json({ error: "Invalid product" }, { status: 400 });
    }

    const product = BILLING_PRODUCTS[sku];
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "Sign in required", needsLogin: true },
        { status: 401 }
      );
    }

    // Dev / pre-Stripe: activate immediately with service role
    if (!isStripeBillingConfigured() && isFakeBillingEnabled()) {
      try {
        const admin = createServiceClient();
        if (product.grantsPlan) {
          await activateSubscription(admin, {
            userId: user.id,
            plan: product.grantsPlan,
            status: "active",
          });
        } else if (product.trialMs) {
          await activateTrialPack(admin, { userId: user.id, sku });
        }
        return NextResponse.json({
          ok: true,
          fake: true,
          url: `${siteUrl()}/settings/billing?success=1&fake=1`,
        });
      } catch (e) {
        return NextResponse.json(
          {
            error:
              e instanceof Error
                ? e.message
                : "Fake billing needs SUPABASE_SERVICE_ROLE_KEY",
          },
          { status: 500 }
        );
      }
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        {
          error:
            "Stripe is not configured yet. Set STRIPE_SECRET_KEY and price IDs, or PLETHORA_FAKE_BILLING=1 for local tests.",
        },
        { status: 503 }
      );
    }

    const priceId = priceIdForSku(sku);
    if (!priceId) {
      return NextResponse.json(
        {
          error: `Missing env ${product.envPriceId} for ${sku}. Create the product in Stripe and set the price ID.`,
        },
        { status: 503 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      try {
        const admin = createServiceClient();
        await admin
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", user.id);
      } catch {
        /* service role optional until webhook */
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: product.mode,
      customer: customerId,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
        sku,
      },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl()}/settings/billing?success=1`,
      cancel_url: `${siteUrl()}/pricing?canceled=1`,
      allow_promotion_codes: true,
      ...(product.mode === "subscription"
        ? {
            subscription_data: {
              metadata: { supabase_user_id: user.id, sku },
            },
          }
        : {}),
    });

    if (!session.url) {
      return NextResponse.json({ error: "No checkout URL" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
  } catch (e) {
    console.error("[billing/checkout]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
