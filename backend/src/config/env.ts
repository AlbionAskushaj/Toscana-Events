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
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL || "",
  adminPanelUrl: process.env.ADMIN_PANEL_URL || "https://admin.toscanagrill.ca/inquiries",
  stripeLinkSmall: process.env.STRIPE_LINK_SMALL || "https://buy.stripe.com/eVq9ASeGE7p18XV5N23oA01",
  stripeLinkMedium: process.env.STRIPE_LINK_MEDIUM || "https://buy.stripe.com/dRm6oGgOMaBd0rp6R63oA02",
  stripeLinkLarge: process.env.STRIPE_LINK_LARGE || "https://buy.stripe.com/6oU00idCA5gT0rpcbq3oA03",
};

console.log(`[env] PORT=${env.port} CLIENT_ORIGIN=${clientOriginRaw}`);
if (!env.postmarkToken) {
  console.warn("[env] Missing POSTMARK_SERVER_TOKEN; email sending disabled");
}
if (!env.emailFrom) {
  console.warn("[env] Missing EMAIL_FROM; email sending disabled");
}
if (!env.adminNotificationEmail) {
  console.warn("[env] Missing ADMIN_NOTIFICATION_EMAIL; admin inquiry notifications will not be sent");
}
