import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: {
        getItem: (key) => document.cookie
          .split("; ")
          .find((row) => row.startsWith(key + "="))
          ?.split("=")[1] ?? null,

        setItem: (key, value) => {
          document.cookie = `${key}=${value}; Path=/; SameSite=Lax`;
        },

        removeItem: (key) => {
          document.cookie = `${key}=; Path=/; Max-Age=0`;
        },
      },
    },
  }
);