import { Router } from "express";
import { seedData } from "../controllers/seedController";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.use(requireAdmin);
router.post("/", seedData);

export default router;
