import { Router } from "express";
import { createRoom, deleteRoom, getRooms, updateRoom } from "../controllers/roomController";

const router = Router();

router.get("/", getRooms);
router.post("/", createRoom);
router.patch("/:id", updateRoom);
router.delete("/:id", deleteRoom);

export default router;
