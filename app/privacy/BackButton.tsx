"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="inline-block mb-6 text-sm text-gray-600 hover:underline"
    >
      ← Back
    </button>
  );
}