"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setDrafts(data);
    }
    setLoading(false);
  }

  async function deleteDraft(id: string) {
    const ok = confirm("Delete this draft?");
    if (!ok) return;

    const { error } = await supabase.from("messages").delete().eq("id", id);

    if (error) {
      alert("Failed to delete draft.");
      console.error(error);
      return;
    }

    // Remove draft from state instantly
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  if (loading) {
    return <main className="p-6">Loading drafts…</main>;
  }

  return (
    <main className="p-6">
      {/* BACK BUTTON */}
      <button
        onClick={() => (window.location.href = "/")}
        className="text-blue-600 underline mb-4"
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
            <p className="text-sm text-gray-400">{d.created_at}</p>

            <p className="mt-2">
              <strong>Original:</strong> {d.original}
            </p>
            <p className="mt-2">
              <strong>Soft:</strong> {d.soft_rewrite}
            </p>
            <p className="mt-2">
              <strong>Calm:</strong> {d.calm_rewrite}
            </p>
            <p className="mt-2">
              <strong>Clear:</strong> {d.clear_rewrite}
            </p>

            {/* DELETE DRAFT BUTTON */}
            <button
              onClick={() => deleteDraft(d.id)}
              className="mt-4 bg-red-600 text-white px-3 py-1 rounded"
            >
              Delete Draft
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}