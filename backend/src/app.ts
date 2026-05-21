import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import menuRoutes from "./routes/menuRoutes";
import roomRoutes from "./routes/roomRoutes";
import inquiryRoutes from "./routes/inquiryRoutes";
import seedRoutes from "./routes/seedRoutes";
import draftRoutes from "./routes/draftRoutes";
import adminMenuRoutes from "./routes/adminMenuRoutes";
import adminInquiryRoutes from "./routes/adminInquiryRoutes";
import adminRoomsRoutes from "./routes/adminRoomsRoutes";
import adminDraftRoutes from "./routes/adminDraftRoutes";
import adminChatTranscriptRoutes from "./routes/adminChatTranscriptRoutes";
import authRoutes from "./routes/authRoutes";
import chatRoutes from "./routes/chatRoutes";
import availabilityRoutes from "./routes/availabilityRoutes";

console.log("[startup] Initializing Express app");
const app = express();

// Security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)
app.use(helmet());

const allowedOrigins = env.clientOrigin;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / health check requests with no Origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(morgan("dev"));

// Rate limiter for inquiry submission: 10 requests per 15 minutes per IP
const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many inquiry submissions. Please try again later." },
});

// Rate limiter for draft mutations: 30 requests per 15 minutes per IP
const draftMutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many draft requests. Please try again later." },
});

// Rate limiter for chat: 12 messages per minute per IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many chat messages. Please slow down." },
});

// Rate limiter for chat session issuance: 10 per 15 min per IP
const chatSessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many session requests. Please try again later." },
});

// Rate limiter for auth: 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again later." },
});

// Rate limiter for public read endpoints: 100 requests per minute per IP
const publicReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
});

// Rate limiter for availability checks: 30 per minute per IP (Apify cost control)
export const availabilityLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many availability checks. Please try again shortly." },
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/menu", publicReadLimiter, menuRoutes);
app.use("/api/rooms", publicReadLimiter, roomRoutes);
app.use("/api/inquiries", inquiryLimiter, inquiryRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/drafts", draftMutationLimiter, draftRoutes);
app.use("/api/admin/menu", adminMenuRoutes);
app.use("/api/admin/inquiries", adminInquiryRoutes);
app.use("/api/admin/rooms", adminRoomsRoutes);
app.use("/api/admin/drafts", adminDraftRoutes);
app.use("/api/admin/chat-transcripts", adminChatTranscriptRoutes);
app.use("/api/chat/session", chatSessionLimiter);
app.use("/api/chat", chatLimiter, chatRoutes);
app.use("/api/availability", availabilityLimiter, availabilityRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

console.log("[startup] Express app configured");
export { app };
