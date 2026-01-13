import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthUser = { email: string | null };
type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001/api";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE}/auth/session`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load session");
        }
        return res.json();
      })
      .then((data) => {
        if (!mounted) return;
        setUser(data.user || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[auth] Failed to load session", err);
        if (!mounted) return;
        setUser(null);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: async (email: string, password: string) => {
        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
          });
          if (!res.ok) {
            const message = await res.text();
            return { error: message || "Invalid credentials" };
          }
          const data = await res.json();
          setUser(data.user || null);
          return {};
        } catch (err) {
          console.error("[auth] Failed to sign in", err);
          return { error: "Sign-in failed" };
        }
      },
      signOut: async () => {
        try {
          await fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            credentials: "include",
          });
        } catch (err) {
          console.error("[auth] Failed to sign out", err);
        } finally {
          setUser(null);
        }
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
