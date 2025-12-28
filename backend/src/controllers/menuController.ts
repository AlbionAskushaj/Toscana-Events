import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { MenuCategoryRow, MenuItemRow } from "../types/tables";

const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "");

const toCategory = (row: MenuCategoryRow) => ({
  _id: row.id,
  name: row.name,
  sortOrder: row.sort_order,
});

const toMenuItem = (row: MenuItemRow) => ({
  _id: row.id,
  categoryId: row.category_id,
  name: row.name,
  description: row.description,
  pricePerPerson: row.price_per_person,
  isVegetarian: row.is_vegetarian,
  isVegan: row.is_vegan,
  isGlutenFree: row.is_gluten_free,
  active: row.active,
});

async function findDuplicateMenuItem(input: {
  id?: string;
  categoryId: string;
  name: string;
  pricePerPerson: number;
}): Promise<MenuItemRow | null> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("category_id", input.categoryId)
    .eq("price_per_person", input.pricePerPerson);

  if (error) throw error;

  const normalized = normalizeName(input.name);
  const match = (data || []).find(
    (row) =>
      row.id !== input.id &&
      normalizeName(row.name) === normalized
  );

  return match || null;
}

export const getMenuCategories = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("menu_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    res.json((data || []).map(toCategory));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load menu categories" });
  }
};

export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const { categoryId, active } = req.query;
    let query = supabase.from("menu_items").select("*");

    if (categoryId) {
      query = query.eq("category_id", String(categoryId));
    }
    if (active !== undefined) {
      query = query.eq("active", String(active) === "true");
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json((data || []).map(toMenuItem));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load menu items" });
  }
};

export const createMenuCategory = async (req: Request, res: Response) => {
  const { name, sortOrder } = req.body || {};
  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Category name is required" });
  }

  try {
    const { data, error } = await supabase
      .from("menu_categories")
      .insert({ name, sort_order: Number(sortOrder) || 0 })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(toCategory(data as MenuCategoryRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create menu category" });
  }
};

export const updateMenuCategory = async (req: Request, res: Response) => {
  const { name, sortOrder } = req.body || {};
  try {
    const { data, error } = await supabase
      .from("menu_categories")
      .update({
        ...(name !== undefined ? { name } : {}),
        ...(sortOrder !== undefined ? { sort_order: Number(sortOrder) || 0 } : {}),
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(toCategory(data as MenuCategoryRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update menu category" });
  }
};

export const deleteMenuCategory = async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from("menu_categories").delete().eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete menu category" });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  const {
    categoryId,
    name,
    description = "",
    pricePerPerson,
    isVegetarian = false,
    isVegan = false,
    isGlutenFree = false,
    active = true,
  } = req.body || {};

  if (!categoryId || !name || pricePerPerson === undefined) {
    return res.status(400).json({ message: "Category, name, and price are required" });
  }

  try {
    const duplicate = await findDuplicateMenuItem({
      categoryId,
      name,
      pricePerPerson: Number(pricePerPerson),
    });

    if (duplicate) {
      return res.status(409).json({ message: "Duplicate menu item detected" });
    }

    const { data, error } = await supabase
      .from("menu_items")
      .insert({
        category_id: categoryId,
        name,
        description,
        price_per_person: Number(pricePerPerson),
        is_vegetarian: Boolean(isVegetarian),
        is_vegan: Boolean(isVegan),
        is_gluten_free: Boolean(isGlutenFree),
        active: Boolean(active),
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(toMenuItem(data as MenuItemRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create menu item" });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  const {
    categoryId,
    name,
    description,
    pricePerPerson,
    isVegetarian,
    isVegan,
    isGlutenFree,
    active,
  } = req.body || {};

  try {
    const { data: existing, error: existingError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (existingError || !existing) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    const nextCategoryId = categoryId ?? existing.category_id;
    const nextName = name ?? existing.name;
    const nextPrice = pricePerPerson !== undefined ? Number(pricePerPerson) : existing.price_per_person;

    const duplicate = await findDuplicateMenuItem({
      id: req.params.id,
      categoryId: nextCategoryId,
      name: nextName,
      pricePerPerson: nextPrice,
    });

    if (duplicate) {
      return res.status(409).json({ message: "Duplicate menu item detected" });
    }

    const { data, error } = await supabase
      .from("menu_items")
      .update({
        ...(categoryId !== undefined ? { category_id: categoryId } : {}),
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(pricePerPerson !== undefined ? { price_per_person: Number(pricePerPerson) } : {}),
        ...(isVegetarian !== undefined ? { is_vegetarian: Boolean(isVegetarian) } : {}),
        ...(isVegan !== undefined ? { is_vegan: Boolean(isVegan) } : {}),
        ...(isGlutenFree !== undefined ? { is_gluten_free: Boolean(isGlutenFree) } : {}),
        ...(active !== undefined ? { active: Boolean(active) } : {}),
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(toMenuItem(data as MenuItemRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update menu item" });
  }
};

export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from("menu_items").delete().eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete menu item" });
  }
};

export const dedupeMenuItems = async (req: Request, res: Response) => {
  const dryRun = String(req.query.dryRun ?? "true").toLowerCase() !== "false";

  try {
    const { data, error } = await supabase.from("menu_items").select("*");
    if (error) throw error;

    const items = data || [];
    const groups = new Map<string, MenuItemRow[]>();

    items.forEach((item) => {
      const key = `${item.category_id}:${item.price_per_person}:${normalizeName(item.name)}`;
      const group = groups.get(key) || [];
      group.push(item);
      groups.set(key, group);
    });

    const duplicates: MenuItemRow[] = [];
    groups.forEach((group) => {
      if (group.length <= 1) return;
      group.sort((a, b) => a.id.localeCompare(b.id));
      duplicates.push(...group.slice(1));
    });

    if (!dryRun && duplicates.length > 0) {
      const { error: deleteError } = await supabase
        .from("menu_items")
        .delete()
        .in(
          "id",
          duplicates.map((d) => d.id)
        );
      if (deleteError) throw deleteError;
    }

    res.json({
      dryRun,
      totalItems: items.length,
      duplicateCount: duplicates.length,
      duplicates: duplicates.map(toMenuItem),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to dedupe menu items" });
  }
};
