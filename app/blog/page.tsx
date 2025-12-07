import Link from "next/link";

export const metadata = {
  title: "ToneMender Blog – Text Tone & Relationship Communication",
  description:
    "Learn how to fix tone in text messages, avoid misunderstandings, and communicate clearly in relationships.",
};

export default function BlogIndexPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-slate-900">
      <h1 className="text-4xl font-extrabold tracking-tight mb-6">
        ToneMender Blog
      </h1>

      <p className="text-lg text-slate-600 mb-12">
        Tips, examples, and guides on fixing tone in text messages and improving
        communication in relationships.
      </p>

      <div className="space-y-8">
        <article className="border rounded-2xl p-6 hover:border-blue-600 transition">
          <h2 className="text-2xl font-bold mb-2">
            <Link href="/blog/fix-tone-in-text-messages">
              How to Fix Tone in Text Messages (Without Sounding Fake)
            </Link>
          </h2>
          <p className="text-slate-600 text-sm">
            Learn why texts get misinterpreted — and how to rewrite them so they
            sound calm, clear, and emotionally safe.
          </p>
        </article>
      </div>
    </main>
  );
}