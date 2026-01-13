import { Router } from "express";
import { createRoom, deleteRoom, updateRoom } from "../controllers/roomController";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.use(requireAdmin);

router.post("/", createRoom);
router.patch("/:id", updateRoom);
router.delete("/:id", deleteRoom);

export default router;
