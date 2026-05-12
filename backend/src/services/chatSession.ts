import crypto from "crypto";
import { env } from "../config/env";

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

interface SessionPayload {
  sid: string;
  exp: number;
}

function getSecret(): string {
  if (!env.chatSessionSecret) {
    throw new Error("[chatSession] CHAT_SESSION_SECRET is not configured");
  }
  return env.chatSessionSecret;
}

function base64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(payload: string): string {
  return base64url(crypto.createHmac("sha256", getSecret()).update(payload).digest());
}

export function issueSessionToken(sessionId: string): string {
  const payload: SessionPayload = { sid: sessionId, exp: Date.now() + SESSION_TTL_MS };
  const payloadEncoded = base64url(JSON.stringify(payload));
  const signature = sign(payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadEncoded, signature] = parts;

  const expected = sign(payloadEncoded);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64urlDecode(payloadEncoded).toString()) as SessionPayload;
  } catch {
    return null;
  }

  if (!payload.sid || typeof payload.exp !== "number") return null;
  if (Date.now() > payload.exp) return null;

  return payload;
}
