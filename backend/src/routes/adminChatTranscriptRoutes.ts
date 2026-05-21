import { Router } from "express";
import { getChatTranscript, listChatTranscripts } from "../controllers/adminChatTranscriptController";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.use(requireAdmin);

router.get("/", listChatTranscripts);
router.get("/:id", getChatTranscript);

export default router;
