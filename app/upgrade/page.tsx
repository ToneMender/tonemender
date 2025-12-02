"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout(plan: "monthly" | "yearly") {
    setLoading(true);
    setError("");

    // Get Supabase session (user must be logged in)
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setError("You must be logged in before upgrading.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const json = await res.json();

      if (json.url) {
        window.location.href = json.url; // Redirect to Stripe Checkout
      } else {
        setError(json.error || "Failed to start checkout.");
      }
    } catch (err) {
      setError("Network error. Try again.");
    }

    setLoading(false);
  }

  return (
    <main className="max-w-xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Upgrade to ToneMender Pro</h1>

      <p className="text-gray-700 mb-6">
        Unlock unlimited rewrites, priority processing, and pro-only features.
      </p>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <div className="space-y-4">
        <button
          disabled={loading}
          onClick={() => startCheckout("monthly")}
          className="w-full bg-purple-600 text-white py-3 rounded-lg disabled:bg-purple-300"
        >
          {loading ? "Loading…" : "Subscribe Monthly — $4.99"}
        </button>

        <button
          disabled={loading}
          onClick={() => startCheckout("yearly")}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg disabled:bg-indigo-300"
        >
          {loading ? "Loading…" : "Subscribe Yearly — $49.99"}
        </button>
      </div>
    </main>
  );
}