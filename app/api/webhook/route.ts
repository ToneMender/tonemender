import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); // 👈 no apiVersion

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature")!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("WEBHOOK SIGNATURE ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // -----------------------------
  // ✔️ Checkout Session Completed
  // -----------------------------
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId;
    const planType = session.metadata?.planType;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!userId) {
      console.error("❌ Missing userId in metadata");
      return NextResponse.json({ received: true });
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        is_pro: true,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        plan_type: planType || "monthly",
      })
      .eq("id", userId);

    if (error) console.error("SUPABASE PROFILE UPDATE ERROR:", error);
  }

  // -----------------------------
  // ✔️ Subscription Deleted
  // -----------------------------
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;

    await supabase
      .from("profiles")
      .update({
        is_pro: false,
        plan_type: null,
        stripe_subscription_id: null,
      })
      .eq("stripe_customer_id", customerId);
  }

  return NextResponse.json({ received: true });
}
