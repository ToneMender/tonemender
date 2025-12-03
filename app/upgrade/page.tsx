"use client";

import Link from "next/link";

export default function UpgradePage() {
  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upgrade to ToneMender Pro</h1>

      <p className="mb-6 text-gray-700">
        Get unlimited rewrites, faster processing, and full message history.
      </p>

      <a
        href="/api/checkout"
        className="bg-purple-600 text-white px-6 py-3 rounded inline-block"
      >
        Subscribe Monthly
      </a>

      <div style={{ marginTop: "20px" }}>
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