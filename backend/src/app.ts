import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env";
import menuRoutes from "./routes/menuRoutes";
import roomRoutes from "./routes/roomRoutes";
import inquiryRoutes from "./routes/inquiryRoutes";
import seedRoutes from "./routes/seedRoutes";
import draftRoutes from "./routes/draftRoutes";

console.log("[startup] Initializing Express app");
const app = express();

app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/menu", menuRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/seed", seedRoutes);
app.use("/api/drafts", draftRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

console.log("[startup] Express app configured");
export { app };
