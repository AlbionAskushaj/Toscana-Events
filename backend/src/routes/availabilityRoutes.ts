import { Router } from "express";
import { checkAvailability } from "../controllers/availabilityController";

const router = Router();

router.get("/", checkAvailability);

export default router;
