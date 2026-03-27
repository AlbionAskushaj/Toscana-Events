import express from "express";
import cors from "cors";
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
import authRoutes from "./routes/authRoutes";

console.log("[startup] Initializing Express app");
const app = express();

const allowedOrigins = env.clientOrigin;
app.use(
  cors({
    origin: (origin, callback) => {
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

// Rate limiter for auth: 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again later." },
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/inquiries", inquiryLimiter, inquiryRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/drafts", draftMutationLimiter, draftRoutes);
app.use("/api/admin/menu", adminMenuRoutes);
app.use("/api/admin/inquiries", adminInquiryRoutes);
app.use("/api/admin/rooms", adminRoomsRoutes);
app.use("/api/admin/drafts", adminDraftRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

console.log("[startup] Express app configured");
export { app };
