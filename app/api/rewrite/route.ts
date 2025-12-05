import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// 🔒 Server-side Supabase client (service role key required)
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!, // service key for server only
  { auth: { persistSession: false } }
);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { token, message, recipient, tone } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Missing auth token" },
        { status: 401 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // -------- AUTH CHECK (SERVER SAFE) --------
    const {
      data: auth,
      error: authError,
    } = await supabaseServer.auth.getUser(token);

    if (authError || !auth?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = auth.user;

    // -------- CHECK PRO STATUS + FREE LIMIT INFO --------
    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("is_pro, free_rewrites_remaining, last_reset_date")
      .eq("id", user.id)
      .single();

    // -------- MIDNIGHT RESET CHECK (LOCAL DAILY RESET) --------
    if (profile && !profile.is_pro) {
      const today = new Date().toISOString().split("T")[0];

      // If last reset was NOT today → reset counter
      if (profile.last_reset_date !== today) {
        await supabaseServer
          .from("profiles")
          .update({
            free_rewrites_remaining: 3,
            last_reset_date: today,
          })
          .eq("id", user.id);

        profile.free_rewrites_remaining = 3;
      }

      // -------- DAILY LIMIT ENFORCEMENT --------
      if (profile.free_rewrites_remaining <= 0) {
        return NextResponse.json(
          { error: "Daily limit reached" },
          { status: 429 }
        );
      }
    }

    // -------- CONTEXT MAPPING --------
    const trimmedMessage = message.trim();

    const recipientDescription = (() => {
      switch (recipient) {
        case "partner":
          return "a romantic partner you care about and want to keep a healthy, vulnerable connection with";
        case "friend":
          return "a friend you want to stay close with while being honest";
        case "family":
          return "a family member where you want less drama and more understanding";
        case "coworker":
          return "a coworker or manager where you need to stay professional but honest";
        default:
          return "someone you care about and want to communicate with in a healthy, respectful way";
      }
    })();

    const primaryToneHint = (() => {
      if (!tone || tone === "default") return "";
      if (tone === "soft") {
        return "The user’s primary preference is SOFT. Make that version especially gentle, reassuring and emotionally safe while keeping boundaries.";
      }
      if (tone === "calm") {
        return "The user’s primary preference is CALM. Make that version especially neutral, steady and balanced, without sounding cold.";
      }
      if (tone === "clear") {
        return "The user’s primary preference is CLEAR. Make that version especially direct and honest, but still respectful and not attacking.";
      }
      return "";
    })();

    // -------- PERFORM AI REWRITE (IMPROVED PROMPT + SCORE + EMOTION) --------
    const prompt = `
You are an expert relationship and communication coach. Your job is to rewrite emotionally charged messages so they are safe, clear and honest, without losing the original point.

User context:
- They are sending this to ${recipientDescription}.
- The goal is to reduce conflict, avoid blame, and increase understanding while still expressing how they feel.
${primaryToneHint}

You will create THREE versions of the message using these exact tone definitions:

SOFT:
- Very gentle and compassionate.
- Uses "I" statements, empathy, and softness.
- De-escalates tension and reassures the other person.
- Good when the situation is sensitive and the user wants to avoid conflict.

CALM:
- Neutral and steady.
- Clear but not sharp.
- Removes drama, accusations, and exaggeration.
- Good for day-to-day misunderstandings or when the user wants to sound mature.

CLEAR:
- Direct and straightforward, but still respectful.
- States needs, boundaries, or problems plainly.
- Avoids insults, name-calling, and threats.
- Good when the user needs to be firm without being cruel.

You will ALSO:
1) Give a TONE_SCORE from 0–100 for the ORIGINAL message, where:
   - 0 = extremely harsh / attacking
   - 100 = extremely calm, kind and safe
2) Briefly describe how the ORIGINAL message is likely to make the other person feel (EMOTION_PREDICTION), in 1 short sentence (for example: "They may feel blamed and defensive.").

IMPORTANT RULES:
- Keep the original intent and meaning of the user’s message, but remove blamey wording, swearing, or insults in the rewrites.
- NEVER add fake details or change the situation.
- Do NOT mention that you are an AI or that this is a rewrite.
- Do NOT include headers, bullet points, or explanations outside of the required format.
- Each version should sound like a natural text message someone would actually send.
- TONE_SCORE must be a single integer from 0 to 100.
- EMOTION_PREDICTION must be one short plain sentence.

Here is the original message:

"${trimmedMessage}"

Return your answer in EXACTLY this format with no extra text before or after:

SOFT: <soft version as a single or multi-sentence message>
CALM: <calm version as a single or multi-sentence message>
CLEAR: <clear version as a single or multi-sentence message>
TONE_SCORE: <integer from 0 to 100 for the ORIGINAL message>
EMOTION_PREDICTION: <one short sentence about how the ORIGINAL message may make them feel>
`.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const raw = (completion.choices[0].message.content ?? "").trim();

    const extract = (label: string) => {
      const regex = new RegExp(`${label}:([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`, "i");
      const match = raw.match(regex);
      return match ? match[1].trim() : "";
    };

    const soft = extract("SOFT");
    const calm = extract("CALM");
    const clear = extract("CLEAR");

    const toneScoreRaw = extract("TONE_SCORE");
    let toneScore: number | null = null;
    const scoreMatch = toneScoreRaw.match(/\d+/);
    if (scoreMatch) {
      const parsed = parseInt(scoreMatch[0], 10);
      if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        toneScore = parsed;
      }
    }

    const emotionPrediction = extract("EMOTION_PREDICTION");

    // -------- LOG REWRITE USAGE --------
    await supabaseServer.from("rewrite_usage").insert({
      user_id: user.id,
    });

    // Decrement free rewrite count only for non-pro users WITH a profile
    if (profile && !profile.is_pro) {
      await supabaseServer
        .from("profiles")
        .update({
          free_rewrites_remaining: profile.free_rewrites_remaining - 1,
        })
        .eq("id", user.id);
    }

    return NextResponse.json({
      soft,
      calm,
      clear,
      toneScore,
      emotionPrediction,
    });
  } catch (err: any) {
    console.error("REWRITE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}