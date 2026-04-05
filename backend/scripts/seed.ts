#!/usr/bin/env npx tsx
/**
 * Standalone seed script — run from the backend directory:
 *   npx tsx scripts/seed.ts
 */
import "../src/config/env";
import { supabaseAdmin } from "../src/config/supabase";

async function seed() {
  console.log("Clearing existing data…");
  await supabaseAdmin.from("menu_items").delete().neq("id", "");
  await supabaseAdmin.from("menu_categories").delete().neq("id", "");
  await supabaseAdmin.from("room_layouts").delete().neq("id", "");
  console.log("  ✓ Cleared menu_items, menu_categories, room_layouts");

  // ─── Categories ─────────────────────────────────────────────────────────────
  const { data: categories, error: catErr } = await supabaseAdmin
    .from("menu_categories")
    .insert([
      { name: "Salads",     sort_order: 1 },
      { name: "Appetizers", sort_order: 2 },
      { name: "Soups",      sort_order: 3 },
      { name: "Pasta",      sort_order: 4 },
      { name: "Mains",      sort_order: 5 },
      { name: "Pizza",      sort_order: 6 },
    ])
    .select();

  if (catErr) throw catErr;
  if (!categories) throw new Error("No categories returned");
  console.log(`  ✓ Inserted ${categories.length} categories`);

  const catId = (name: string) =>
    categories.find((c) => c.name === name)?.id as string;

  // ─── Menu Items ─────────────────────────────────────────────────────────────
  const items = [
    // Salads
    { category_id: catId("Salads"), name: "Beet + Feta Salad", description: "Beets, arugula, feta, red onions, tomatoes, house vinaigrette", price_per_person: 17, is_vegetarian: true,  is_vegan: false, is_gluten_free: true,  active: true },
    { category_id: catId("Salads"), name: "Caprese Salad",     description: "Fior di latte, tomatoes, house basil pesto, mixed greens, EVOO, balsamic reduction", price_per_person: 15, is_vegetarian: true,  is_vegan: false, is_gluten_free: true,  active: true },
    { category_id: catId("Salads"), name: "Burrata Salad",     description: "Creamy burrata, arugula, roasted almonds, house basil pesto, vinaigrette, focaccia", price_per_person: 19, is_vegetarian: true,  is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Salads"), name: "Caesar Salad",      description: "Romaine hearts, parmesan, house croutons, creamy garlic dressing", price_per_person: 13, is_vegetarian: true,  is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Salads"), name: "Greco Salad",       description: "Romaine, tomatoes, cucumbers, red onions, peppers, olives, feta, vinaigrette", price_per_person: 16, is_vegetarian: true,  is_vegan: false, is_gluten_free: true,  active: true },

    // Appetizers
    { category_id: catId("Appetizers"), name: "Italian Platter",        description: "Calamari, arancini, polpette salsiccia — great for sharing", price_per_person: 39, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Appetizers"), name: "Antipasti Board",         description: "2 cheeses, 2 meats, sweet & savory bites, focaccia", price_per_person: 29, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Appetizers"), name: "Parmesan Truffle Fries",  description: "Crispy fries, white truffle oil, parmesan, sea salt", price_per_person: 11, is_vegetarian: true,  is_vegan: false, is_gluten_free: true,  active: true },
    { category_id: catId("Appetizers"), name: "Marinated Olives",        description: "Mediterranean olives, herbs, spices, focaccia", price_per_person: 13, is_vegetarian: true,  is_vegan: true,  is_gluten_free: true,  active: true },
    { category_id: catId("Appetizers"), name: "Calamari Fritti",         description: "Breaded calamari, spicy tomato sauce, lemon", price_per_person: 17, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Appetizers"), name: "Gamberi",                 description: "Prawns, rosé sauce, focaccia", price_per_person: 16, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Appetizers"), name: "Bruschetta",              description: "Tomato, onion, basil, garlic, EVOO, focaccia, grana padano", price_per_person: 12, is_vegetarian: true,  is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Appetizers"), name: "Mussels Salsiccia",       description: "Sautéed mussels, spicy Italian sausage, tomato sauce", price_per_person: 19, is_vegetarian: false, is_vegan: false, is_gluten_free: true,  active: true },
    { category_id: catId("Appetizers"), name: "Homemade Meatballs",      description: "Beef & pork, zesty tomato sauce, parmesan, focaccia", price_per_person: 15, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Appetizers"), name: "Arancini",                description: "Crispy risotto balls, fior di latte, tomato sauce", price_per_person: 15, is_vegetarian: true,  is_vegan: false, is_gluten_free: false, active: true },

    // Soups
    { category_id: catId("Soups"), name: "Cioppino",       description: "Tomato-based seafood soup: shrimp, scallops, mussels, clams", price_per_person: 23, is_vegetarian: false, is_vegan: false, is_gluten_free: true,  active: true },
    { category_id: catId("Soups"), name: "Soup of the Day", description: "Chef's daily creation with seasonal ingredients", price_per_person: 9, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },

    // Pasta
    { category_id: catId("Pasta"), name: "Spaghetti Pomodoro",      description: "Spaghetti, parmesan, tomato, basil", price_per_person: 19, is_vegetarian: true,  is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pasta"), name: "Fettuccine Alfredo",      description: "Fettuccine, parmesan, cream sauce", price_per_person: 21, is_vegetarian: true,  is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pasta"), name: "Gnocchi",                 description: "Hand-rolled potato gnocchi, parmesan, roasted red pepper cream sauce", price_per_person: 22, is_vegetarian: true,  is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pasta"), name: "Penne Toscana",           description: "Penne, chicken, mushrooms, parmesan, rosé sauce", price_per_person: 24, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pasta"), name: "Spaghetti Carbonara",     description: "Spaghetti, bacon, parmesan, black pepper, cream sauce", price_per_person: 24, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pasta"), name: "Lasagna",                 description: "Beef, pork, mozzarella, tomato sauce, baked", price_per_person: 25, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pasta"), name: "Veal Tortellini",         description: "Beef-stuffed tortellini, rosé sauce, mozzarella, baked", price_per_person: 24, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pasta"), name: "Penne Salsiccia",         description: "Penne, Italian sausage, mushrooms, chilli pepper, roasted jalapeños, tomato sauce", price_per_person: 24, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pasta"), name: "Butternut Squash Ravioli", description: "Ravioli, parmesan, pesto cream sauce", price_per_person: 25, is_vegetarian: true,  is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pasta"), name: "Fettuccine Piccante",     description: "Fettuccine, shrimp, roasted jalapeños, parmesan, white wine sauce", price_per_person: 26, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pasta"), name: "Spaghetti Vongole",       description: "Clam shells and meat, white wine or tomato sauce", price_per_person: 27, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pasta"), name: "Ravioli Aragosta",        description: "Lobster and crab-stuffed ravioli, parmesan, sun-dried tomato pesto cream", price_per_person: 28, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pasta"), name: "Spaghetti Pescatore",     description: "Spaghetti, shrimp, clams, scallops, mussels, white wine or tomato sauce", price_per_person: 29, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pasta"), name: "Oceano Risotto",          description: "Risotto, shrimp, scallops, parmesan, rosé sauce", price_per_person: 29, is_vegetarian: false, is_vegan: false, is_gluten_free: true,  active: true },

    // Mains
    { category_id: catId("Mains"), name: "Chicken Parmigiana",       description: "Breaded chicken breast, fior di latte, tomato sauce, spaghetti pomodoro", price_per_person: 29, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Mains"), name: "Chicken Piccata",          description: "Grilled chicken breast, lemon caper white wine sauce, spaghetti pomodoro", price_per_person: 31, is_vegetarian: false, is_vegan: false, is_gluten_free: true,  active: true },
    { category_id: catId("Mains"), name: "Chicken Funghi di Bosco",  description: "Grilled chicken breast, mushroom Dijon cream sauce, spaghetti pomodoro", price_per_person: 32, is_vegetarian: false, is_vegan: false, is_gluten_free: true,  active: true },
    { category_id: catId("Mains"), name: "Mediterranean Ribs",       description: "Braised baby back ribs, lemon fennel, coriander, roasted potatoes", price_per_person: 34, is_vegetarian: false, is_vegan: false, is_gluten_free: true,  active: true },
    { category_id: catId("Mains"), name: "Lamb Shank",               description: "Slow-braised lamb, red wine demi-glace, roasted potatoes, seasonal vegetables", price_per_person: 35, is_vegetarian: false, is_vegan: false, is_gluten_free: true,  active: true },
    { category_id: catId("Mains"), name: "Atlantic Salmon",          description: "Grilled salmon, fresh tomato & caper salsa, risotto", price_per_person: 36, is_vegetarian: false, is_vegan: false, is_gluten_free: true,  active: true },
    { category_id: catId("Mains"), name: "Beef Tagliata",            description: "AAA Alberta beef tenderloin, arugula, tomato, risotto, red wine demi-glace", price_per_person: 45, is_vegetarian: false, is_vegan: false, is_gluten_free: true,  active: true },
    { category_id: catId("Mains"), name: "Bistecca alla Fiorentina", description: "House specialty — AAA Alberta beef, roasted potatoes, seasonal vegetables, spaghetti pomodoro. Market price; team will confirm final cost.", price_per_person: 65, is_vegetarian: false, is_vegan: false, is_gluten_free: true,  active: true },

    // Pizza
    { category_id: catId("Pizza"), name: "Margherita",          description: "Tomato sauce, fior di latte, fresh basil, olive oil", price_per_person: 21, is_vegetarian: true,  is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pizza"), name: "Diavolo",             description: "Tomato sauce, fior di latte, spicy Calabrese salami, roasted jalapeños", price_per_person: 25, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pizza"), name: "Siciliana",           description: "Tomato sauce, fior di latte, Italian sausage, roasted peppers, onions", price_per_person: 26, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pizza"), name: "Parma e Funghi",      description: "Basil pesto, fior di latte, mushrooms, arugula, prosciutto di Parma, truffle oil", price_per_person: 27, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pizza"), name: "Quattro Carni",       description: "Tomato sauce, fior di latte, pepperoni, Italian sausage, prosciutto, mortadella", price_per_person: 28, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
    { category_id: catId("Pizza"), name: "Burrata & Mortadella", description: "Basil pesto, fior di latte, mortadella, olives, arugula, burrata, olive oil, balsamic", price_per_person: 29, is_vegetarian: false, is_vegan: false, is_gluten_free: false, active: true },
  ];

  const { error: itemsErr } = await supabaseAdmin.from("menu_items").insert(items);
  if (itemsErr) throw itemsErr;
  console.log(`  ✓ Inserted ${items.length} menu items`);

  // ─── Rooms ───────────────────────────────────────────────────────────────────
  const rooms = [
    {
      name: "Mahogany — Full Venue Buyout",
      capacity: 84,
      description: "Exclusive full restaurant buyout at our Mahogany location, accommodating up to 84 guests. Available for buyout only — perfect for large celebrations, corporate galas, and milestone events. Friday and Saturday night buyouts require a $10,000 minimum spend.",
      default_table_config: { tables_for_2: 0, tables_for_4: 0, tables_for_6: 0, long_tables: 0 },
      tables: [],
      areas: [],
    },
    {
      name: "10th Avenue — Private Room",
      capacity: 10,
      description: "Intimate private room at our downtown 10th Avenue location, seating up to 10 guests. Equipped with a presentation screen — ideal for corporate meetings, team dinners, and executive events.",
      default_table_config: { tables_for_2: 0, tables_for_4: 0, tables_for_6: 0, long_tables: 0 },
      tables: [],
      areas: [],
    },
    {
      name: "10th Avenue — Full Restaurant",
      capacity: 150,
      description: "Full restaurant buyout at our downtown 10th Avenue location, accommodating up to 150 guests. An exclusive dining experience in the heart of Calgary. Friday and Saturday night buyouts require a $10,000 minimum spend.",
      default_table_config: { tables_for_2: 0, tables_for_4: 0, tables_for_6: 0, long_tables: 0 },
      tables: [],
      areas: [],
    },
    {
      name: "Heritage Plaza — Room Bookout",
      capacity: 50,
      description: "Semi-private room bookout at our Heritage Plaza location, accommodating up to 50 guests. A versatile space for mid-sized gatherings, celebrations, and corporate events.",
      default_table_config: { tables_for_2: 0, tables_for_4: 0, tables_for_6: 0, long_tables: 0 },
      tables: [],
      areas: [],
    },
    {
      name: "Heritage Plaza — Private Restaurant",
      capacity: 80,
      description: "Private restaurant section at Heritage Plaza, accommodating up to 80 guests. A fully private dining experience with a dedicated space — ideal for large celebrations and formal events.",
      default_table_config: { tables_for_2: 0, tables_for_4: 0, tables_for_6: 0, long_tables: 0 },
      tables: [],
      areas: [],
    },
    {
      name: "Heritage Plaza — Full Restaurant",
      capacity: 150,
      description: "Full restaurant buyout at Heritage Plaza, accommodating up to 150 guests. An elegant venue for galas, corporate events, and milestone celebrations. Friday and Saturday night buyouts require a $10,000 minimum spend.",
      default_table_config: { tables_for_2: 0, tables_for_4: 0, tables_for_6: 0, long_tables: 0 },
      tables: [],
      areas: [],
    },
  ];

  const { error: roomsErr } = await supabaseAdmin.from("room_layouts").insert(rooms);
  if (roomsErr) throw roomsErr;
  console.log(`  ✓ Inserted ${rooms.length} rooms`);

  console.log("\nSeed complete.");
  console.log(`  ${categories.length} categories · ${items.length} menu items · ${rooms.length} rooms (6)`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
