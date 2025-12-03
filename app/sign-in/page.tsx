"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Allow session to finish saving
    setTimeout(() => router.replace("/"), 300);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-[360px]">
        <h1 className="text-2xl font-bold mb-4 text-center">Sign In</h1>

        {error && <p className="text-red-500">{error}</p>}

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="border p-2 rounded" />
          <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" className="border p-2 rounded" />
          <button disabled={loading} className="bg-blue-600 text-white p-2 rounded">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}