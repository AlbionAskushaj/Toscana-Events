import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { MenuCategoryRow } from "../types/tables";

export const seedData = async (_req: Request, res: Response) => {
  try {
    await supabase.from("menu_items").delete().neq("id", "");
    await supabase.from("menu_categories").delete().neq("id", "");
    await supabase.from("room_layouts").delete().neq("id", "");

    const { data: categories, error: categoryError } = await supabase
      .from("menu_categories")
      .insert([
        { name: "Antipasti", sort_order: 1 },
        { name: "Salads", sort_order: 2 },
        { name: "Pastas", sort_order: 3 },
        { name: "Carne e Pesce", sort_order: 4 },
        { name: "Stone Oven Pizza", sort_order: 5 },
      ])
      .select();

    if (categoryError) throw categoryError;
    if (!categories) throw new Error("Failed to insert categories");

    const catId = (name: string) => categories.find((c) => c.name === name)?.id as string;

    const { error: itemsError } = await supabase.from("menu_items").insert([
      // Antipasti
      { category_id: catId("Antipasti"), name: "Parmesan Truffle Fries", description: "Crispy fries with white truffle oil, parmesan, sea salt", price_per_person: 11, is_vegetarian: true, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Antipasti"), name: "Calamari Fritti", description: "Lightly breaded calamari with spicy tomato sauce and lemon", price_per_person: 18, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Antipasti"), name: "Bruschetta", description: "Tomato, onion, basil, garlic EVOO on focaccia", price_per_person: 12, is_vegetarian: true, is_vegan: true, is_gluten_free: false, active: true },
      { category_id: catId("Antipasti"), name: "Arancini", description: "Crispy risotto balls stuffed with fior di latte", price_per_person: 15, is_vegetarian: true, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Antipasti"), name: "Mussels Salsiccia", description: "Mussels with spicy Italian sausage in zesty tomato sauce", price_per_person: 19, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },

      // Salads
      { category_id: catId("Salads"), name: "Beet + Feta Salad", description: "Beets, arugula, feta, tomatoes, vinaigrette", price_per_person: 17, is_vegetarian: true, is_vegan: false, is_gluten_free: true, active: true },
      { category_id: catId("Salads"), name: "Caprese Salad", description: "Fior di latte, tomatoes, basil pesto, mixed greens", price_per_person: 15, is_vegetarian: true, is_vegan: false, is_gluten_free: true, active: true },
      { category_id: catId("Salads"), name: "Burrata Salad", description: "Creamy burrata, arugula, roasted almonds, pesto vinaigrette", price_per_person: 18, is_vegetarian: true, is_vegan: false, is_gluten_free: true, active: true },
      { category_id: catId("Salads"), name: "Caesar Salad", description: "Romaine, parmesan, croutons, creamy garlic dressing", price_per_person: 13, is_vegetarian: true, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Salads"), name: "Greco Salad", description: "Tomatoes, cucumbers, peppers, olives, feta, vinaigrette", price_per_person: 16, is_vegetarian: true, is_vegan: false, is_gluten_free: true, active: true },

      // Pastas
      { category_id: catId("Pastas"), name: "Spaghetti Pomodoro", description: "Tomato basil sauce, parmesan, spaghetti", price_per_person: 21, is_vegetarian: true, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Pastas"), name: "Penne Toscana", description: "Chicken, mushrooms, parmesan, rosé sauce", price_per_person: 24, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Pastas"), name: "Fettucine Piccante", description: "Shrimp, roasted jalapeños, parmesan, white wine sauce", price_per_person: 26, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Pastas"), name: "Butternut Squash Ravioli", description: "Parmesan, pesto cream sauce", price_per_person: 25, is_vegetarian: true, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Pastas"), name: "Spaghetti Carbonara", description: "Bacon, parmesan, black pepper, cream sauce", price_per_person: 23, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Pastas"), name: "Lasagna", description: "Beef, pork, mozzarella, tomato sauce", price_per_person: 24, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Pastas"), name: "Gnocchi", description: "Potato gnocchi, parmesan, roasted red pepper cream", price_per_person: 22, is_vegetarian: true, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Pastas"), name: "Penne Salsiccia", description: "Italian sausage, mushrooms, chili, tomato sauce", price_per_person: 24, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Pastas"), name: "Spaghetti Pescatore", description: "Shrimp, clams, scallops, mussels in white wine or tomato", price_per_person: 29, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Pastas"), name: "Oceano Risotto", description: "Risotto with shrimp, scallops, parmesan, rosé sauce", price_per_person: 28, is_vegetarian: false, is_vegan: false, is_gluten_free: true, active: true },
      { category_id: catId("Pastas"), name: "Ravioli Aragosta", description: "Lobster & crab-stuffed ravioli, sun-dried tomato pesto cream", price_per_person: 28, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },

      // Carne e Pesce (mains)
      { category_id: catId("Carne e Pesce"), name: "Bistecca alla Fiorentina", description: "Bone-in Alberta beef, roasted potatoes, veggies, spaghetti pomodoro", price_per_person: 55, is_vegetarian: false, is_vegan: false, is_gluten_free: true, active: true },
      { category_id: catId("Carne e Pesce"), name: "Lamb Shank", description: "Slow-braised lamb, red wine demi-glace, roasted potatoes, vegetables", price_per_person: 34, is_vegetarian: false, is_vegan: false, is_gluten_free: true, active: true },
      { category_id: catId("Carne e Pesce"), name: "Atlantic Salmon", description: "Grilled salmon, tomato & caper salsa over risotto", price_per_person: 30, is_vegetarian: false, is_vegan: false, is_gluten_free: true, active: true },
      { category_id: catId("Carne e Pesce"), name: "Mediterranean Ribs", description: "Baby back ribs, lemon fennel, coriander, roasted potatoes, vegetables", price_per_person: 32, is_vegetarian: false, is_vegan: false, is_gluten_free: true, active: true },
      { category_id: catId("Carne e Pesce"), name: "Beef Tagliata", description: "AAA Alberta beef tenderloin, arugula, tomato, risotto, red wine demi", price_per_person: 45, is_vegetarian: false, is_vegan: false, is_gluten_free: true, active: true },
      { category_id: catId("Carne e Pesce"), name: "Chicken Parmigiana", description: "Breaded chicken, fior di latte, tomato sauce, spaghetti pomodoro", price_per_person: 28, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Carne e Pesce"), name: "Chicken Piccata", description: "Grilled chicken, lemon caper white wine sauce, spaghetti pomodoro", price_per_person: 27, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Carne e Pesce"), name: "Chicken Funghi di Bosco", description: "Grilled chicken, mushroom Dijon cream, spaghetti pomodoro", price_per_person: 27, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },

      // Pizza
      { category_id: catId("Stone Oven Pizza"), name: "Margherita", description: "Tomato sauce, fior di latte, fresh basil, olive oil", price_per_person: 19, is_vegetarian: true, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Stone Oven Pizza"), name: "Diavolo", description: "Tomato sauce, fior di latte, spicy Calabrese salami, roasted jalapeños", price_per_person: 21, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Stone Oven Pizza"), name: "Siciliana", description: "Tomato sauce, fior di latte, Italian sausage, roasted peppers & onions", price_per_person: 22, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Stone Oven Pizza"), name: "Quattro Carni", description: "Tomato sauce, fior di latte, pepperoni, sausage, prosciutto, mortadella", price_per_person: 24, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Stone Oven Pizza"), name: "Parma e Funghi", description: "Basil pesto sauce, fior di latte, mushrooms, arugula, prosciutto di Parma, truffle oil", price_per_person: 27, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
      { category_id: catId("Stone Oven Pizza"), name: "Burrata & Mortadella", description: "Basil pesto sauce, fior di latte, mortadella, olives, arugula, burrata", price_per_person: 26, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    ]);

    if (itemsError) throw itemsError;

    const { error: roomsError } = await supabase.from("room_layouts").insert([
      {
        name: "Toscana on 10th (Main Room)",
        capacity: 150,
        description: "Downtown 10th Ave layout",
        default_table_config: { tables_for_2: 0, tables_for_4: 0, tables_for_6: 0, long_tables: 0 },
        areas: [
          { id: "main", name: "Main Dining", lines: [{ x1: 15, y1: 0, x2: 15, y2: 19 }] },
          { id: "bar", name: "Bar Rail" },
        ],
        tables: [
          { id: "1", label: "1", seats: 4, shape: "rect", x: 1, y: 1, width: 2, height: 2, area_id: "main" },
          { id: "2", label: "2", seats: 4, shape: "rect", x: 4, y: 1, width: 2, height: 2, area_id: "main" },
          { id: "3", label: "3", seats: 4, shape: "rect", x: 7, y: 1, width: 2, height: 2, area_id: "main" },
          { id: "4", label: "4", seats: 4, shape: "rect", x: 1, y: 4, width: 2, height: 2, area_id: "main" },
          { id: "5", label: "5", seats: 4, shape: "rect", x: 4, y: 4, width: 2, height: 2, area_id: "main" },
          { id: "6", label: "6", seats: 4, shape: "rect", x: 7, y: 4, width: 2, height: 2, area_id: "main" },
          { id: "7", label: "7", seats: 6, shape: "rect", x: 1, y: 7, width: 3, height: 2, area_id: "main" },
          { id: "8", label: "8", seats: 6, shape: "rect", x: 5, y: 7, width: 3, height: 2, area_id: "main" },
          { id: "9", label: "9", seats: 6, shape: "rect", x: 9, y: 7, width: 3, height: 2, area_id: "main" },
          { id: "10", label: "10", seats: 6, shape: "rect", x: 1, y: 11, width: 3, height: 2, area_id: "main" },
          { id: "11", label: "11", seats: 6, shape: "rect", x: 5, y: 11, width: 3, height: 2, area_id: "main" },
          { id: "12", label: "12", seats: 6, shape: "rect", x: 9, y: 11, width: 3, height: 2, area_id: "main" },
          { id: "20", label: "20", seats: 8, shape: "diamond", x: 12, y: 14, width: 2, height: 2, area_id: "main" },
          { id: "40", label: "40", seats: 2, shape: "round", x: 16, y: 3, width: 1, height: 1, area_id: "bar" },
          { id: "41", label: "41", seats: 2, shape: "round", x: 18, y: 3, width: 1, height: 1, area_id: "bar" },
          { id: "42", label: "42", seats: 2, shape: "round", x: 16, y: 6, width: 1, height: 1, area_id: "bar" },
          { id: "43", label: "43", seats: 2, shape: "round", x: 18, y: 6, width: 1, height: 1, area_id: "bar" },
        ],
      },
      {
        name: "Toscana Macleod",
        capacity: 140,
        description: "Macleod Trail layout",
        default_table_config: { tables_for_2: 0, tables_for_4: 0, tables_for_6: 0, long_tables: 0 },
        areas: [
          { id: "main", name: "Main Dining", lines: [{ x1: 14, y1: 0, x2: 14, y2: 19 }] },
          { id: "bar", name: "Bar Rail" },
        ],
        tables: [
          { id: "1", label: "1", seats: 4, shape: "rect", x: 1, y: 2, width: 2, height: 2, area_id: "main" },
          { id: "2", label: "2", seats: 4, shape: "rect", x: 4, y: 2, width: 2, height: 2, area_id: "main" },
          { id: "3", label: "3", seats: 4, shape: "rect", x: 7, y: 2, width: 2, height: 2, area_id: "main" },
          { id: "4", label: "4", seats: 6, shape: "rect", x: 1, y: 6, width: 3, height: 2, area_id: "main" },
          { id: "5", label: "5", seats: 6, shape: "rect", x: 5, y: 6, width: 3, height: 2, area_id: "main" },
          { id: "6", label: "6", seats: 6, shape: "rect", x: 9, y: 6, width: 3, height: 2, area_id: "main" },
          { id: "7", label: "7", seats: 6, shape: "rect", x: 1, y: 10, width: 3, height: 2, area_id: "main" },
          { id: "8", label: "8", seats: 6, shape: "rect", x: 5, y: 10, width: 3, height: 2, area_id: "main" },
          { id: "9", label: "9", seats: 6, shape: "rect", x: 9, y: 10, width: 3, height: 2, area_id: "main" },
          { id: "10", label: "10", seats: 8, shape: "diamond", x: 11, y: 14, width: 2, height: 2, area_id: "main" },
          { id: "40", label: "40", seats: 2, shape: "round", x: 15, y: 4, width: 1, height: 1, area_id: "bar" },
          { id: "41", label: "41", seats: 2, shape: "round", x: 17, y: 4, width: 1, height: 1, area_id: "bar" },
          { id: "42", label: "42", seats: 2, shape: "round", x: 15, y: 7, width: 1, height: 1, area_id: "bar" },
          { id: "43", label: "43", seats: 2, shape: "round", x: 17, y: 7, width: 1, height: 1, area_id: "bar" },
        ],
      },
    ]);

    if (roomsError) throw roomsError;

    res.json({ message: "Seed data inserted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to seed data" });
  }
};
