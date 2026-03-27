import { Request, Response, NextFunction } from "express";
import { supabaseAdmin, supabaseAnon } from "../config/supabase";
import { parseCookies } from "../utils/cookies";

const setAuthCookies = (res: Response, accessToken: string, refreshToken?: string) => {
  const secure = process.env.NODE_ENV === "production";
  const base = `Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
  const cookies = [`sb-access-token=${encodeURIComponent(accessToken)}; ${base}`];
  if (refreshToken) {
    cookies.push(`sb-refresh-token=${encodeURIComponent(refreshToken)}; ${base}`);
  }
  res.setHeader("Set-Cookie", cookies);
};

const getToken = (req: Request) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const cookies = parseCookies(req.headers.cookie);
  let token = getToken(req) || cookies["sb-access-token"];
  const refreshToken = cookies["sb-refresh-token"];

  if (!token && !refreshToken) {
    return res.status(401).json({ message: "Missing auth token" });
  }

  try {
    let userEmail: string | undefined;
    if (token) {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user?.email) {
        userEmail = data.user.email;
      }
    }

    if (!userEmail && refreshToken) {
      const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token: refreshToken });
      if (!error && data?.session?.access_token && data.user?.email) {
        token = data.session.access_token;
        userEmail = data.user.email;
        setAuthCookies(res, data.session.access_token, data.session.refresh_token);
      }
    }

    if (!userEmail) {
      return res.status(401).json({ message: "Invalid auth token" });
    }

    return next();
  } catch (err) {
    console.error("[auth] admin guard failed", err);
    return res.status(500).json({ message: "Admin auth failed" });
  }
};
