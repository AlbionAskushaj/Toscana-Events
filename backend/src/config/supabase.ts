import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

if (!env.supabaseAnonKey) {
  console.warn("[env] Missing SUPABASE_ANON_KEY for auth endpoints");
}

export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const supabaseAnon = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
