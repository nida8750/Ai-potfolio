import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "@/lib/env";

let cached: SupabaseClient | undefined;

/**
 * Server-only client that uses the service role. It bypasses RLS after the
 * Route Handlers have already authorized the caller. Never import this from
 * a Client Component.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured() || !env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  if (env.supabaseServiceRoleKey === env.supabaseAnonKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must not be the anon key.");
  }

  cached ??= createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}
