import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "../../../lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const price = searchParams.get("price");

    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const priceId =
      price === "yearly"
        ? process.env.STRIPE_PRICE_YEARLY
        : process.env.STRIPE_PRICE_MONTHLY;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId!, quantity: 1 }],
      metadata: { userId }, // <<<< CRITICAL
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/upgrade?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("CHECKOUT ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}