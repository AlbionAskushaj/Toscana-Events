import { Router } from "express";
import { listDrafts } from "../controllers/draftController";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.use(requireAdmin);

router.get("/", listDrafts);

export default router;
