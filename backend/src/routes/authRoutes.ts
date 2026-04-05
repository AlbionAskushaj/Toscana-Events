import { Router } from "express";
import { supabaseAnon } from "../config/supabase";
import { parseCookies } from "../utils/cookies";

const router = Router();

const setAuthCookies = (accessToken: string, refreshToken: string) => {
  const secure = process.env.NODE_ENV === "production";
  const sameSite = secure ? "Strict" : "Lax";
  const base = `Path=/; HttpOnly; SameSite=${sameSite}${secure ? "; Secure" : ""}`;
  return [
    `sb-access-token=${encodeURIComponent(accessToken)}; ${base}`,
    `sb-refresh-token=${encodeURIComponent(refreshToken)}; ${base}`,
  ];
};

const clearAuthCookies = () => {
  const secure = process.env.NODE_ENV === "production";
  const sameSite = secure ? "None" : "Lax";
  const base = `Path=/; HttpOnly; SameSite=${sameSite}${secure ? "; Secure" : ""}; Max-Age=0`;
  return [
    `sb-access-token=; ${base}`,
    `sb-refresh-token=; ${base}`,
  ];
};

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  if (!supabaseAnon) {
    return res.status(503).json({ message: "Auth service is not configured." });
  }
  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email: String(email),
    password: String(password),
  });

  if (error || !data.session || !data.user) {
    return res.status(401).json({ message: error?.message || "Invalid credentials" });
  }

  res.setHeader("Set-Cookie", setAuthCookies(data.session.access_token, data.session.refresh_token));
  return res.json({ user: { email: data.user.email } });
});

router.post("/logout", async (_req, res) => {
  res.setHeader("Set-Cookie", clearAuthCookies());
  return res.status(204).send();
});

router.get("/session", async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies["sb-access-token"];
  if (!token) {
    return res.json({ user: null });
  }

  if (!supabaseAnon) return res.json({ user: null });
  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data.user) {
    return res.json({ user: null });
  }

  return res.json({ user: { email: data.user.email } });
});

export default router;
