import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Server-side Supabase client using service role key
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!, // service role key (server only)
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const { type, token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 🔐 Validate user from token (server-safe)
    const {
      data: auth,
      error: authError,
    } = await supabaseServer.auth.getUser(token);

    if (authError || !auth?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = auth.user;

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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade?canceled=true`,
      customer_email: user.email ?? undefined,
      metadata: {
        userId: user.id, // 👈 used by webhook to set is_pro
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("CHECKOUT ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}