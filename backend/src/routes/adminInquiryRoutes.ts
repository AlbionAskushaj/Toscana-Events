import { Router } from "express";
import { getInquiry, listInquiries, updateInquiryStatus } from "../controllers/inquiryController";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.use(requireAdmin);

router.get("/", listInquiries);
router.get("/:id", getInquiry);
router.patch("/:id/status", updateInquiryStatus);

export default router;
