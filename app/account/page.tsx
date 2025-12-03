"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Get logged-in user
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.replace("/sign-in");
        return;
      }

      const user = userData.user;

      setEmail(user.email);

      // Count rewrites
      const todayStr = new Date().toISOString().split("T")[0];

      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("LOAD MESSAGES ERROR:", error);
        setLoading(false);
        return;
      }

      const total = messages?.length || 0;
      const today =
        messages?.filter((m) => m.created_at.startsWith(todayStr)).length || 0;

      setStats({ today, total });
      setLoading(false);
    }

    load();
  }, [router]);

  // LOGOUT
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  // DELETE ALL MESSAGES
  async function handleDeleteData() {
    const ok = confirm("Delete ALL saved messages? This cannot be undone.");
    if (!ok) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    await supabase.from("messages").delete().eq("user_id", user.id);

    alert("All messages deleted.");
    location.reload();
  }

  // DELETE ACCOUNT
  async function handleDeleteAccount() {
    const ok = confirm(
      "Are you sure you want to delete your ENTIRE account permanently?"
    );
    if (!ok) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    // Requires service role on server — but at least run client call
    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("DELETE ACCOUNT ERROR:", error);
      alert("Error deleting account. Check Supabase service role permissions.");
      return;
    }

    alert("Your account has been deleted.");
    router.push("/");
  }

  if (loading) return <p className="p-5">Loading account...</p>;

  return (
    <main className="max-w-xl mx-auto p-6">
      {/* BACK BUTTON */}
      <button
        onClick={() => router.push("/")}
        className="text-blue-600 underline mb-4"
      >
        ← Back to Home
      </button>

      <h1 className="text-3xl font-bold mb-4">Your Account</h1>

      {/* Profile Section */}
      <div className="border p-4 rounded mb-6 bg-white shadow">
        <h2 className="text-xl font-semibold mb-2">Profile</h2>

        <p className="text-gray-700 mb-2">
          <strong>Email:</strong> {email}
        </p>

        <p className="text-gray-700 mb-2">
          <strong>Status:</strong>{" "}
          <span className="text-purple-600 font-semibold">Free User</span>
        </p>
      </div>

      {/* Usage Stats */}
      <div className="border p-4 rounded mb-6 bg-white shadow">
        <h2 className="text-xl font-semibold mb-2">Usage</h2>

        <p>
          <strong>Rewrites Today:</strong> {stats.today}
        </p>
        <p>
          <strong>Total Rewrites:</strong> {stats.total}
        </p>
      </div>

      {/* Security */}
      <div className="border p-4 rounded mb-6 bg-white shadow">
        <h2 className="text-xl font-semibold mb-2">Security</h2>

        <button
          onClick={handleLogout}
          className="bg-gray-800 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* Danger Zone */}
      <div className="border p-4 rounded bg-white shadow">
        <h2 className="text-xl font-semibold mb-2 text-red-600">Danger Zone</h2>

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