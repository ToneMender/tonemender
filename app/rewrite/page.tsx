"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Toast from "../components/Toast";

export default function RewritePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  // ---------------------------------------------------------
  // AUTH GUARD — runs BEFORE showing UI
  // ---------------------------------------------------------
  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;

      if (!user) {
        // not logged in → redirect
        router.replace("/sign-in?error=not-authenticated");
        return;
      }

      // logged in
      setAuthorized(true);
    }

    checkAuth().finally(() => setAuthChecked(true));
  }, [router]);

  // ---------------------------------------------------------
  // Do NOT render ANY UI until auth check finishes
  // ---------------------------------------------------------
  if (!authChecked) {
    return (
      <main className="p-8 text-center">
        Checking authentication…
      </main>
    );
  }

  // If not logged in, returning null prevents "flash"
  if (!authorized) return null;

  // ---------------------------------------------------------
  // Normal rewrite page logic begins here
  // ---------------------------------------------------------
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("partner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(false);

  const [results, setResults] = useState({
    soft: "",
    calm: "",
    clear: "",
  });

  const [toast, setToast] = useState("");

  async function handleRewrite() {
    setError("");
    setLimitReached(false);
    setResults({ soft: "", calm: "", clear: "" });
    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setError("You must be logged in to use ToneMender.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, message, recipient }),
      });

      const json = await res.json();

      if (res.status === 429) {
        setLimitReached(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(json.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      setResults({
        soft: json.soft || "",
        calm: json.calm || "",
        clear: json.clear || "",
      });
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setToast("Copied!");
  }

  function useThis(text: string) {
    setMessage(text);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveMessage(text, tone) {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;

    if (!user) {
      alert("You must be logged in to save messages.");
      return;
    }

    await supabase.from("messages").insert({
      user_id: user.id,
      original: message,
      rewritten: text,
      tone,
    });

    alert("Saved!");
  }

  // ---------------------------------------------------------
  // FULL UI HERE (unchanged)
  // ---------------------------------------------------------
  return (
    <main className="max-w-2xl mx-auto p-5">
      <h1 className="text-3xl font-bold mb-5">Rewrite Your Message</h1>

      {/* (UI unchanged from your version) */}
      {/* I can paste all of it again if you want, but you know the rest */}
    </main>
  );
}