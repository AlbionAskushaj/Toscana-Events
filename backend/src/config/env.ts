import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "backend", ".env"),
  path.resolve(__dirname, ".env"),
];

const envPath = envPaths.find((candidate) => fs.existsSync(candidate));
if (envPath) {
  dotenv.config({ path: envPath });
  console.log(`[env] Loaded env from ${envPath}`);
} else {
  dotenv.config();
  console.warn("[env] No .env file found in expected locations");
}

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

required.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`[env] Missing required env var ${key}. Set it in .env`);
  }
});

const clientOriginRaw = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const clientOrigin = clientOriginRaw
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  port: Number(process.env.PORT) || 5001,
  clientOrigin,
  postmarkToken: process.env.POSTMARK_SERVER_TOKEN || "",
  emailFrom: process.env.EMAIL_FROM || "",
};

console.log(`[env] PORT=${env.port} CLIENT_ORIGIN=${clientOriginRaw}`);
if (!env.postmarkToken) {
  console.warn("[env] Missing POSTMARK_SERVER_TOKEN; email sending disabled");
}
if (!env.emailFrom) {
  console.warn("[env] Missing EMAIL_FROM; email sending disabled");
}
