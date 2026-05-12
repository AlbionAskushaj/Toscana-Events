import { Router } from "express";
import { chat, issueChatSession } from "../controllers/chatController";

const router = Router();
router.post("/session", issueChatSession);
router.post("/", chat);

export default router;
