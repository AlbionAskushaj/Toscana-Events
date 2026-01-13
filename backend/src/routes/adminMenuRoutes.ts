import { Router } from "express";
import {
  createMenuCategory,
  createMenuItem,
  createMenuTemplate,
  dedupeMenuItems,
  deleteMenuCategory,
  deleteMenuItem,
  deleteMenuTemplate,
  updateMenuCategory,
  updateMenuItem,
  updateMenuTemplate,
} from "../controllers/menuController";
import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

router.use(requireAdmin);

router.post("/items/dedupe", dedupeMenuItems);
router.post("/templates", createMenuTemplate);
router.patch("/templates/:id", updateMenuTemplate);
router.delete("/templates/:id", deleteMenuTemplate);
router.post("/categories", createMenuCategory);
router.patch("/categories/:id", updateMenuCategory);
router.delete("/categories/:id", deleteMenuCategory);
router.post("/items", createMenuItem);
router.patch("/items/:id", updateMenuItem);
router.delete("/items/:id", deleteMenuItem);

export default router;
