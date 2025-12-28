import { Router } from "express";
import {
  createMenuCategory,
  createMenuItem,
  dedupeMenuItems,
  deleteMenuCategory,
  deleteMenuItem,
  getMenuCategories,
  getMenuItems,
  updateMenuCategory,
  updateMenuItem,
} from "../controllers/menuController";

const router = Router();

router.get("/categories", getMenuCategories);
router.get("/items", getMenuItems);
router.post("/items/dedupe", dedupeMenuItems);
router.post("/categories", createMenuCategory);
router.patch("/categories/:id", updateMenuCategory);
router.delete("/categories/:id", deleteMenuCategory);
router.post("/items", createMenuItem);
router.patch("/items/:id", updateMenuItem);
router.delete("/items/:id", deleteMenuItem);

export default router;
