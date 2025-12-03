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
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        router.replace("/sign-in");
        return;
      }

      setEmail(user.email);

      const todayStr = new Date().toISOString().split("T")[0];

      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", user.id);

      const today = messages?.filter((m) =>
        m.created_at.startsWith(todayStr)
      ).length || 0;

      setStats({ today, total: messages?.length || 0 });
      setLoading(false);
    }

    load();
  }, [router]);

  if (loading) return <p className="p-5">Loading account...</p>;

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Your Account</h1>
      <p><strong>Email:</strong> {email}</p>
      <p><strong>Rewrites Today:</strong> {stats.today}</p>
      <p><strong>Total Rewrites:</strong> {stats.total}</p>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.replace("/");
        }}
        className="mt-6 bg-gray-800 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </main>
  );
}