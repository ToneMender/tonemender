import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  if (!searchParams.token) {
    return <p>Invalid confirmation link.</p>
  }

  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .eq("confirm_token", searchParams.token)
    .single()

  if (!data || error) {
    return <p>This link is invalid or expired.</p>
  }

  await supabase
    .from("newsletter_subscribers")
    .update({
      confirmed: true,
      confirmed_at: new Date(),
      confirm_token: null,
    })
    .eq("id", data.id)

  // ✅ Send "You're in" email
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ToneMender <updates@tonemender.com>",
      to: data.email,
      subject: "You’re in 🙌",
      html: `<p>You’re officially on the ToneMender list 💙</p>`,
    }),
  })

  return <p>✅ You’re in! Thanks for joining ToneMender.</p>
}