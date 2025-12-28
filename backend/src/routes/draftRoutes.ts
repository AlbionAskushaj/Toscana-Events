import { Router } from "express";
import { createDraft, getDraft, listDrafts, updateDraft } from "../controllers/draftController";

const router = Router();

router.get("/", listDrafts);
router.get("/:id", getDraft);
router.post("/", createDraft);
router.patch("/:id", updateDraft);

export default router;
