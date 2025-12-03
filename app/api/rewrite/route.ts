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
      return NextResponse.json(
        { error: "Missing auth token" },
        { status: 401 }
      );
    }

    // Validate session
    const { data: authData, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // ---------------------------------------------------------
    // 🔥 CHECK IF USER IS PRO
    // ---------------------------------------------------------
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", userId)
      .single();

    const isPro = profile?.is_pro === true;

    // ---------------------------------------------------------
    // 🔥 FREE USER LIMIT (3 REWRITES PER DAY)
    // ---------------------------------------------------------
    if (!isPro) {
      const today = new Date().toISOString().split("T")[0];

      const { count } = await supabase
        .from("rewrite_usage")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .gte("created_at", today);

      if ((count ?? 0) >= 3) {
        return NextResponse.json(
          { error: "Daily limit reached" },
          { status: 429 }
        );
      }
    }

    // ---------------------------------------------------------
    // 🔥 RUN THE AI REWRITE
    // ---------------------------------------------------------
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

    const raw: string = completion.choices[0].message.content ?? "";

    const extractBlock = (label: string): string => {
      const regex = new RegExp(`${label}:([\\s\\S]*?)(?=\\n[A-Z]+:|$)`, "i");
      const match = raw.match(regex);
      return match ? match[1].trim() : "";
    };

    const result = {
      soft: extractBlock("SOFT"),
      calm: extractBlock("CALM"),
      clear: extractBlock("CLEAR"),
    };

    // ---------------------------------------------------------
    // 🔥 LOG REWRITE USAGE (FREE USERS ONLY)
    // ---------------------------------------------------------
    await supabase.from("rewrite_usage").insert({
      user_id: userId,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("REWRITE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}