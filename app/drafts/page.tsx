"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function DraftsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<any[]>([]);

  useEffect(() => {
    async function init() {
      // Check auth
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        router.replace("/sign-in?error=not-authenticated");
        return;
      }

      // Load drafts for this user
      await loadDrafts(user.id);
      setLoading(false);
    }

    async function loadDrafts(userId: string) {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setDrafts(data);
      }
    }

    init();
  }, [router]);

  async function handleDeleteDraft(id: string) {
    const ok = confirm("Delete this draft?");
    if (!ok) return;

    const { error } = await supabase.from("messages").delete().eq("id", id);

    if (error) {
      alert("Failed to delete draft.");
      return;
    }

    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  if (loading) {
    return (
      <main className="p-6 text-center">
        Checking authentication…
      </main>
    );
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="mb-4 text-blue-600 underline"
      >
        ← Back to Home
      </button>

      <h1 className="text-2xl font-bold mb-4">Your Drafts</h1>

      {drafts.length === 0 && (
        <p className="text-gray-500">No drafts saved yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {drafts.map((d) => (
          <div key={d.id} className="border p-4 rounded bg-white shadow">
            <p className="text-sm text-gray-400 mb-2">
              {new Date(d.created_at).toLocaleString()}
            </p>

            <p className="mt-1">
              <strong>Original:</strong> {d.original}
            </p>

            {d.soft_rewrite && (
              <p className="mt-1">
                <strong>Soft:</strong> {d.soft_rewrite}
              </p>
            )}

            {d.calm_rewrite && (
              <p className="mt-1">
                <strong>Calm:</strong> {d.calm_rewrite}
              </p>
            )}

            {d.clear_rewrite && (
              <p className="mt-1">
                <strong>Clear:</strong> {d.clear_rewrite}
              </p>
            )}

            <button
              onClick={() => handleDeleteDraft(d.id)}
              className="mt-3 text-sm text-red-600 underline"
            >
              Delete draft
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}