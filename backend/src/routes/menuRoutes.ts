import { Router } from "express";
import { getMenuCategories, getMenuItems, getMenuTemplates } from "../controllers/menuController";

const router = Router();

router.get("/categories", getMenuCategories);
router.get("/items", getMenuItems);
router.get("/templates", getMenuTemplates);

export default router;
