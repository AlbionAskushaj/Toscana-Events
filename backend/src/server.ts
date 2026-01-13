import { app } from "./app";
import { env } from "./config/env";
import { supabaseAdmin } from "./config/supabase";

async function checkSupabase() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    console.warn("[startup] Supabase env vars missing; skipping connection check");
    return;
  }

  try {
    const { error } = await supabaseAdmin.from("menu_categories").select("id").limit(1);
    if (error) {
      console.error("[startup] Supabase connection check failed:", error.message);
      return;
    }
    console.log("[startup] Supabase connection OK");
  } catch (err) {
    console.error("[startup] Supabase connection check failed:", err);
  }
}

async function start() {
  try {
    console.log("[startup] Booting server process");
    console.log(`[startup] Starting server on port ${env.port}`);
    const server = app.listen(env.port, () => {
      console.log(`API server running on port ${env.port}`);
      void checkSupabase();
    });
    server.on("error", (err) => {
      console.error("[startup] Server failed to start:", err);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
