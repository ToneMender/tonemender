"use client";

import { supabase } from "../../lib/supabase";

export default function LogoutButton() {
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  }

  return (
    <button
      onClick={handleLogout}
      className="absolute top-4 right-4 text-sm bg-gray-200 px-3 py-1 rounded"
    >
      Logout
    </button>
  );
}