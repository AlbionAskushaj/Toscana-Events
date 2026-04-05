import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// supabaseAnon is used for auth flows (sign-in, session validation).
// If SUPABASE_ANON_KEY is not set, auth endpoints will not function.
if (!env.supabaseAnonKey) {
  console.warn("[env] Missing SUPABASE_ANON_KEY — auth endpoints will be unavailable");
}

export const supabaseAnon = env.supabaseAnonKey
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;
