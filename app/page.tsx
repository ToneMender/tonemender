"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import LogoutButton from "./components/LogoutButton";
import Link from "next/link";

export default function LandingPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    }
    load();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <main style={{ padding: "40px", maxWidth: "600px", margin: "auto" }}>

      {/* Logout if logged in */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {user && <LogoutButton />}
      </div>

      <h1 style={{ fontSize: "36px", fontWeight: "bold" }}>ToneMender</h1>

      <p style={{ marginTop: "20px", fontSize: "18px", lineHeight: "1.6" }}>
        ToneMender transforms emotionally charged messages into clear, kind communication.
      </p>

      <div style={{ marginTop: "40px", display: "flex", gap: "16px" }}>
        <Link href="/rewrite" style={btnBlue}>Rewrite Message</Link>
        <Link href="/drafts" style={btnGray}>Drafts</Link>
        <Link href="/account" style={btnPurple}>Account</Link>
      </div>

      {!user && (
        <div style={{ marginTop: "40px" }}>
          <Link href="/sign-in" style={btnBlack}>Sign In</Link>
          <Link href="/sign-up" style={btnGreen}>Sign Up</Link>
        </div>
      )}
    </main>
  );
}

// --- Button Styles
const btnBlue = {
  padding: "10px 16px",
  background: "#2563eb",
  color: "white",
  borderRadius: "6px",
  textDecoration: "none",
};
const btnGray = {
  padding: "10px 16px",
  background: "#6b7280",
  color: "white",
  borderRadius: "6px",
  textDecoration: "none",
};
const btnPurple = {
  padding: "10px 16px",
  background: "#4f46e5",
  color: "white",
  borderRadius: "6px",
  textDecoration: "none",
};
const btnBlack = {
  padding: "8px 14px",
  background: "#111827",
  color: "white",
  borderRadius: "6px",
  textDecoration: "none",
  marginRight: "16px",
};
const btnGreen = {
  padding: "8px 14px",
  background: "#10b981",
  color: "white",
  borderRadius: "6px",
  textDecoration: "none",
};