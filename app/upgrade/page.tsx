"use client";

import Link from "next/link";

export default function UpgradePage() {
  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upgrade to ToneMender Pro</h1>

      <p className="mb-6 text-gray-700">
        Unlock unlimited rewrites, faster processing, and full message history.
      </p>

      {/* MONTHLY PLAN */}
      <a
        href="/api/checkout?plan=monthly"
        className="bg-purple-600 text-white px-6 py-3 rounded inline-block mb-4"
      >
        Subscribe Monthly — $9.99/mo
      </a>

      <br />

      {/* YEARLY PLAN */}
      <a
        href="/api/checkout?plan=yearly"
        className="bg-indigo-600 text-white px-6 py-3 rounded inline-block"
      >
        Subscribe Yearly — $79.99/yr
      </a>

      {/* BACK BUTTON */}
      <div style={{ marginTop: "30px" }}>
        <Link
          href="/"
          style={{
            padding: "8px 14px",
            background: "#6b7280",
            color: "white",
            borderRadius: "6px",
            textDecoration: "none",
          }}
        >
          Back
        </Link>
      </div>
    </main>
  );
}