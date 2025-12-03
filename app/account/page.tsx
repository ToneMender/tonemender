"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // -------------------------
      // GET USER SESSION
      // -------------------------
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        router.replace("/sign-in?error=not-authenticated");
        return;
      }

      setEmail(user.email);

      // -------------------------
      // GET PRO STATUS
      // -------------------------
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.id)
        .single();

      setIsPro(profile?.is_pro ?? false);

      // -------------------------
      // GET REWRITE COUNTS
      // from rewrite_usage table
      // -------------------------
      const todayStr = new Date().toISOString().split("T")[0];

      const { data: usage } = await supabase
        .from("rewrite_usage")
        .select("*")
        .eq("user_id", user.id);

      const total = usage?.length || 0;
      const today =
        usage?.filter((u) => u.created_at.startsWith(todayStr)).length || 0;

      setStats({ today, total });
      setLoading(false);
    }

    load();
  }, [router]);

  // -------------------------
  // LOGOUT
  // -------------------------
  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) return <p className="p-6">Loading account...</p>;

  // -------------------------
  // UI
  // -------------------------
  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Your Account</h1>

      {/* PROFILE INFO */}
      <div className="border p-4 rounded mb-6 bg-white shadow">
        <h2 className="text-xl font-semibold mb-2">Profile</h2>

        <p className="mb-2">
          <strong>Email:</strong> {email}
        </p>

        <p className="mb-2">
          <strong>Role:</strong>{" "}
          {isPro ? (
            <span className="text-green-600 font-semibold">Pro User</span>
          ) : (
            <span className="text-gray-700">Free User</span>
          )}
        </p>
      </div>

      {/* USAGE INFO */}
      <div className="border p-4 rounded mb-6 bg-white shadow">
        <h2 className="text-xl font-semibold mb-2">Usage</h2>

        <p>
          <strong>Rewrites Today:</strong> {stats.today}
        </p>
        <p>
          <strong>Total Rewrites:</strong> {stats.total}
        </p>
      </div>

      {/* SECURITY */}
      <div className="border p-4 rounded mb-6 bg-white shadow">
        <h2 className="text-xl font-semibold mb-2">Security</h2>

        <button
          onClick={handleLogout}
          className="bg-gray-800 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* DANGER ZONE */}
      <div className="border p-4 rounded bg-white shadow">
        <h2 className="text-xl font-semibold mb-2 text-red-600">
          Danger Zone
        </h2>

        <button
          onClick={async () => {
            const ok = confirm("This will delete all your saved drafts. Continue?");
            if (!ok) return;

            const { data } = await supabase.auth.getSession();
            const user = data.session?.user;
            if (!user) return;

            await supabase
              .from("messages")
              .delete()
              .eq("user_id", user.id);

            alert("All drafts deleted.");
            location.reload();
          }}
          className="border border-red-500 text-red-600 px-4 py-2 rounded mr-3"
        >
          Delete All Messages
        </button>

        <button
          onClick={async () => {
            const ok = confirm("This will delete your ENTIRE account. Continue?");
            if (!ok) return;

            const { data } = await supabase.auth.getSession();
            const user = data.session?.user;
            if (!user) return;

            await supabase.auth.admin.deleteUser(user.id);

            alert("Account deleted.");
            router.replace("/");
          }}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Delete Account
        </button>
      </div>

      {/* BACK BUTTON */}
      <div className="mt-6">
        <a
          href="/"
          className="inline-block px-4 py-2 bg-gray-200 rounded text-sm"
        >
          ⬅ Back to Home
        </a>
      </div>
    </main>
  );
}