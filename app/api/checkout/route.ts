import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: Request) {
  try {
    const { type } = await req.json();

    // Get logged-in user using Supabase Server Client
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const priceId =
      type === "yearly"
        ? process.env.STRIPE_PRICE_YEARLY
        : process.env.STRIPE_PRICE_MONTHLY;

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing Stripe price ID" },
        { status: 400 }
      );
    }

    // IMPORTANT: attach userId to metadata
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade?canceled=true`,
      metadata: {
        userId: user.id,   // 💥 THE FIX
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("CHECKOUT ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}