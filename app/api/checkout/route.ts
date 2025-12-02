import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Supabase server client for verifying sessions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // requires service role
);

export async function POST(req: Request) {
  try {
    // Validate Supabase user session
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data: sessionData } = await supabase.auth.getUser(token);

    if (!sessionData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const user = sessionData.user;

    // Read plan (monthly or yearly)
    const { plan } = await req.json();

    // Replace with YOUR price IDs:
    const MONTHLY_PRICE = "price_1SZiAFJEOSJcI2obrBnaFsAo";
    const YEARLY_PRICE = "price_1SZiAqJEOSJcI2obGRN9PSnn";

    const priceId = plan === "yearly" ? YEARLY_PRICE : MONTHLY_PRICE;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email!,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}