import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * User-scoped Supabase client for Auth cookie session. Uses the anon key
 * only; RLS applies. Cookie writes are ignored in Server Components.
 */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured() || !env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Supabase Auth is not configured.");
  }

  const store = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies; Route Handlers can.
        }
      },
    },
  });
}
