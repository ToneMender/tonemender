"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace("/sign-in");
        return;
      }

      const userId = auth.user.id;
      setEmail(auth.user.email);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", userId)
        .single();

      setIsPro(profile?.is_pro === true);

      const today = new Date().toISOString().split("T")[0];

      const { count: todayCount } = await supabase
        .from("rewrite_usage")
        .select("id", { count: "exact" })
        .eq("user_id", userId)
        .gte("created_at", today);

      const { count: totalCount } = await supabase
        .from("rewrite_usage")
        .select("id", { count: "exact" })
        .eq("user_id", userId);

      setStats({
        today: todayCount ?? 0,
        total: totalCount ?? 0,
      });

      setLoading(false);
    }

    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleDeleteData() {
    const ok = confirm("Delete ALL saved messages?");
    if (!ok) return;

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    await supabase.from("messages").delete().eq("user_id", auth.user.id);
    location.reload();
  }

  async function handleDeleteAccount() {
    const ok = confirm("Delete your ENTIRE account?");
    if (!ok) return;

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    await supabase.auth.admin.deleteUser(auth.user.id);
    router.replace("/");
  }

  if (loading) return <main className="p-5">Loading...</main>;

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Your Account</h1>

      <div className="border p-4 rounded mb-6">
        <h2 className="text-xl font-semibold mb-2">Profile</h2>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Plan:</strong> {isPro ? "Pro" : "Free"}</p>
      </div>

      <div className="border p-4 rounded mb-6">
        <h2 className="text-xl font-semibold mb-2">Rewrite Usage</h2>
        <p><strong>Rewrites Today:</strong> {stats.today}</p>
        <p><strong>Total Rewrites:</strong> {stats.total}</p>
      </div>

      <div className="border p-4 rounded mb-6">
        <h2 className="text-xl font-semibold mb-2">Security</h2>
        <button
          onClick={handleLogout}
          className="bg-gray-800 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="border p-4 rounded">
        <h2 className="text-xl font-semibold mb-2 text-red-600">
          Danger Zone
        </h2>

        <button
          onClick={handleDeleteData}
          className="border border-red-500 text-red-600 px-4 py-2 rounded mr-3"
        >
          Delete All Messages
        </button>

        <button
          onClick={handleDeleteAccount}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Delete Account
        </button>
      </div>
    </main>
  );
}