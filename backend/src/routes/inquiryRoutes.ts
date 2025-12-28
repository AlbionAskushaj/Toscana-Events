import { Router } from "express";
import { createInquiry, getInquiry, listInquiries, updateInquiryStatus } from "../controllers/inquiryController";

const router = Router();

router.post("/", createInquiry);
router.get("/", listInquiries);
router.get("/:id", getInquiry);
router.patch("/:id/status", updateInquiryStatus);

export default router;
