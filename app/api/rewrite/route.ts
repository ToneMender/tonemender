import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Supabase server client (uses anon key, no helpers)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper to extract each variant from the raw AI text
const extract = (raw: string, label: string): string => {
  const start = raw.indexOf(label + ":");
  if (start === -1) return "";

  const after = raw.substring(start + label.length + 1).trim();

  const nextLabels = ["SOFT:", "CALM:", "CLEAR:"].filter(
    (l) => l !== label + ":"
  );

  let endIndex = after.length;
  for (const lbl of nextLabels) {
    const idx = after.indexOf(lbl);
    if (idx !== -1 && idx < endIndex) endIndex = idx;
  }

  return after.substring(0, endIndex).trim();
};

export async function POST(request: Request) {
  try {
    const { token, message, recipient } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // 1) Get the user from the token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 2) Check today's usage
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from("rewrite_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfDay.toISOString());

    if (countError) {
      console.error("Usage count error:", countError);
    }

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: "Daily limit reached", limit: 3 },
        { status: 429 }
      );
    }

    // 3) Call OpenAI to get rewrites
    const prompt = `
Rewrite the following message into 3 versions for a ${recipient}:

SOFT:
CALM:
CLEAR:

Message: "${message}"

Return your answer ONLY in this format:

SOFT: <soft rewrite>

CALM: <calm rewrite>

CLEAR: <clear rewrite>
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const raw: string = String(completion.choices[0].message.content ?? "");

    const soft = extract(raw, "SOFT");
    const calm = extract(raw, "CALM");
    const clear = extract(raw, "CLEAR");

    // 4) Record usage
    await supabase.from("rewrite_usage").insert({
      user_id: userId,
    });

    return NextResponse.json({ soft, calm, clear });
  } catch (err: any) {
    console.error("rewrite error:", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}