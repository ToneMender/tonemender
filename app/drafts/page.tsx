"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        router.replace("/sign-in");
        return;
      }

      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setDrafts(messages || []);
      setLoading(false);
    }

    load();
  }, [router]);

  if (loading) return <p className="p-6">Loading drafts…</p>;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Drafts</h1>

      {drafts.length === 0 && (
        <p className="text-gray-500">No drafts saved yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {drafts.map((d) => (
          <div key={d.id} className="border p-4 rounded bg-white shadow">
            <p className="text-sm text-gray-400">{d.created_at}</p>
            <p className="mt-2"><strong>Original:</strong> {d.original}</p>
            <p className="mt-2"><strong>Soft:</strong> {d.soft}</p>
            <p className="mt-2"><strong>Calm:</strong> {d.calm}</p>
            <p className="mt-2"><strong>Clear:</strong> {d.clear}</p>
          </div>
        ))}
      </div>
    </main>
  );
}