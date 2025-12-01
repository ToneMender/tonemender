import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // Placeholder rewrites
    const soft = `Soft rewrite of: ${message}`;
    const calm = `Calm rewrite of: ${message}`;
    const clear = `Clear rewrite of: ${message}`;

    // Save to database
    const { error } = await supabase.from("messages").insert({
      original_text: message,
      soft_rewrite: soft,
      calm_rewrite: calm,
      clear_rewrite: clear,
      tone: "neutral",
    });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({
      original: message,
      rewrites: { soft, calm, clear },
      tone: "neutral",
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}