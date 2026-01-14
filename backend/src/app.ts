import express from "express";
import cors from "cors";
import morgan from "morgan";
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
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/drafts", draftRoutes);
app.use("/api/admin/menu", adminMenuRoutes);
app.use("/api/admin/inquiries", adminInquiryRoutes);
app.use("/api/admin/rooms", adminRoomsRoutes);
app.use("/api/admin/drafts", adminDraftRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

console.log("[startup] Express app configured");
export { app };
