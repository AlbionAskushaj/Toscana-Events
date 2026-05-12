import { env } from "../config/env";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5000;

export interface TurnstileResult {
  success: boolean;
  errorCodes: string[];
}

export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<TurnstileResult> {
  if (!env.turnstileSecretKey) {
    return { success: false, errorCodes: ["secret-key-missing"] };
  }
  if (!token) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const body = new URLSearchParams({ secret: env.turnstileSecretKey, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) {
      console.error("[turnstile] siteverify HTTP", response.status);
      return { success: false, errorCodes: [`http-${response.status}`] };
    }

    const data = (await response.json()) as { success?: boolean; "error-codes"?: string[] };
    return { success: !!data.success, errorCodes: data["error-codes"] || [] };
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      return { success: false, errorCodes: ["timeout"] };
    }
    console.error("[turnstile] unexpected error", err);
    return { success: false, errorCodes: ["network-error"] };
  }
}
