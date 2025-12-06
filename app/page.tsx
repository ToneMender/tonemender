"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function HomeRedirect() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (user) {
        // Logged in → go straight to rewrite tool
        router.replace("/rewrite");
      } else {
        // Not logged in → show marketing page
        router.replace("/landing");
      }

      setChecking(false);
    }

    checkUser();
  }, [router]);

  // Temporary loading state (very fast)
  return (
    <main className="w-full min-h-screen flex items-center justify-center text-slate-500">
      Loading…
    </main>
  );
}