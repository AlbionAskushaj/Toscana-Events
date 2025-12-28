import { Router } from "express";
import { seedData } from "../controllers/seedController";

const router = Router();

router.post("/", seedData);

export default router;
