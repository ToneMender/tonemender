"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function UpgradePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);

  // 🔐 Only logged-in users can see this page
  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        router.replace("/sign-in?error=not-authenticated");
        return;
      }

      setChecking(false);
    }

    checkAuth();
  }, [router]);

  async function subscribe(type: "monthly" | "yearly") {
    setLoading(type);

    try {
      // Get current session + token
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setLoading(null);
        router.replace("/sign-in?error=not-authenticated");
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, token }),
      });

      const dataJson = await res.json();

      if (!res.ok) {
        alert(dataJson.error || "Upgrade failed.");
        setLoading(null);
        return;
      }

      // Redirect to Stripe
      window.location.href = dataJson.url;
    } catch (err) {
      console.error("SUBSCRIBE ERROR:", err);
      alert("Network error. Try again.");
      setLoading(null);
    }
  }

  if (checking) {
    return (
      <main className="p-6 text-center">
        Checking authentication…
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Upgrade to ToneMender Pro</h1>

      <p className="mb-6 text-gray-700">
        Unlock unlimited rewrites, unlimited saved drafts, and Pro-only features.
      </p>

      <div className="space-y-4">
        {/* MONTHLY */}
        <button
          onClick={() => subscribe("monthly")}
          className="bg-blue-600 text-white px-4 py-3 rounded w-full text-left"
          disabled={loading !== null}
        >
          {loading === "monthly"
            ? "Redirecting..."
            : "Subscribe Monthly — $7.99 / month"}
        </button>

        {/* YEARLY */}
        <button
          onClick={() => subscribe("yearly")}
          className="bg-green-600 text-white px-4 py-3 rounded w-full text-left"
          disabled={loading !== null}
        >
          {loading === "yearly"
            ? "Redirecting..."
            : "Subscribe Yearly — $49.99 / year"}
        </button>
      </div>

      {/* BACK BUTTON */}
      <button
        className="mt-6 text-blue-600 underline"
        onClick={() => router.push("/")}
      >
        ← Back to Home
      </button>
    </main>
  );
}