import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabase } from "../../../lib/supabase";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { token, message, recipient } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const { data: authData } = await supabase.auth.getUser(token);
    const user = authData?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 📌 CHECK FREE LIMITS
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", user.id)
      .single();

    if (!profile?.is_pro) {
      // count rewrites done today from rewrite_usage
      const today = new Date().toISOString().split("T")[0];

      const { data: usage } = await supabase
        .from("rewrite_usage")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", today);

      if ((usage?.length || 0) >= 3) {
        return NextResponse.json(
          { error: "Daily limit reached" },
          { status: 429 }
        );
      }
    }

    // ------- AI Rewrite -------
    const prompt = `
Rewrite the following message into 3 versions for a ${recipient}:

SOFT:
CALM:
CLEAR:

Message: "${message}"

Return ONLY:

SOFT: <soft>
CALM: <calm>
CLEAR: <clear>
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message.content ?? "";

    const extract = (label: string) => {
      const regex = new RegExp(`${label}:([\\s\\S]*?)(?=\\n[A-Z]+:|$)`, "i");
      const match = raw.match(regex);
      return match ? match[1].trim() : "";
    };

    const soft = extract("SOFT");
    const calm = extract("CALM");
    const clear = extract("CLEAR");

    // 📌 RECORD REWRITE IN rewrite_usage
    await supabase.from("rewrite_usage").insert({
      user_id: user.id,
    });

    return NextResponse.json({ soft, calm, clear });
  } catch (err: any) {
    console.error("REWRITE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}