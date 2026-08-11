import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  BILLING_PRODUCTS,
  skuFromPriceId,
  type BillingSku,
} from "@/lib/billing-products";
import {
  activateSubscription,
  activateTrialPack,
  deactivateSubscription,
} from "@/lib/billing-activate";
import { createServiceClient, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!whSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET missing" }, { status: 503 });
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, whSecret);
  } catch (err) {
    console.error("[webhook] signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let admin;
  try {
    admin = createServiceClient();
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Service role missing" }, { status: 500 });
  }

  // Idempotency
  const { data: existing } = await admin
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.metadata?.supabase_user_id || session.client_reference_id || "";
        const sku = (session.metadata?.sku || "") as BillingSku;
        if (!userId) break;

        if (session.mode === "subscription") {
          const product = BILLING_PRODUCTS[sku];
          const plan = product?.grantsPlan || "pro";
          const subId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id;
          await activateSubscription(admin, {
            userId,
            plan,
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : undefined,
            stripeSubscriptionId: subId,
            status: "active",
          });
        } else if (session.mode === "payment" && sku.startsWith("pack_")) {
          await activateTrialPack(admin, {
            userId,
            sku,
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : undefined,
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        const priceId = sub.items.data[0]?.price?.id;
        const sku = (sub.metadata?.sku || (priceId && skuFromPriceId(priceId)) || "pro") as BillingSku;
        const plan = BILLING_PRODUCTS[sku]?.grantsPlan || "pro";
        const status = sub.status;
        if (status === "active" || status === "trialing") {
          if (userId) {
            await activateSubscription(admin, {
              userId,
              plan,
              stripeCustomerId:
                typeof sub.customer === "string" ? sub.customer : undefined,
              stripeSubscriptionId: sub.id,
              status,
            });
          }
        } else if (["canceled", "unpaid", "incomplete_expired"].includes(status)) {
          if (userId) {
            await deactivateSubscription(admin, { userId, status });
          } else {
            await deactivateSubscription(admin, {
              subscriptionId: sub.id,
              status,
            });
          }
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (userId) {
          await deactivateSubscription(admin, { userId, status: "canceled" });
        } else {
          await deactivateSubscription(admin, {
            subscriptionId: sub.id,
            status: "canceled",
          });
        }
        break;
      }
      default:
        break;
    }

    await admin.from("stripe_events").insert({ id: event.id, type: event.type });
  } catch (e) {
    console.error("[webhook] process", e);
    return NextResponse.json({ error: "Process failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
