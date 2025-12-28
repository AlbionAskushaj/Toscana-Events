import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { RoomLayoutRow, TableMetaRow, TableAreaRow, AreaLineRow } from "../types/tables";

const GRID_SIZE = 20;

const toTables = (tables?: TableMetaRow[]) =>
  (tables || []).map((t) => ({
    id: t.id,
    label: t.label,
    seats: t.seats,
    shape: t.shape,
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    rotation: t.rotation,
    areaId: t.area_id,
  }));

const toAreas = (areas?: TableAreaRow[]) =>
  (areas || []).map((a) => ({
    id: a.id,
    name: a.name,
    lines: (a.lines || []).map((line) => ({
      x1: line.x1,
      y1: line.y1,
      x2: line.x2,
      y2: line.y2,
    })),
  }));

const toRoom = (row: RoomLayoutRow) => ({
  _id: row.id,
  name: row.name,
  capacity: row.capacity,
  description: row.description,
  defaultTableConfig: {
    tablesFor2: row.default_table_config.tables_for_2,
    tablesFor4: row.default_table_config.tables_for_4,
    tablesFor6: row.default_table_config.tables_for_6,
    longTables: row.default_table_config.long_tables,
    selectedTableIds: row.default_table_config.selected_table_ids,
    combinedGroups: row.default_table_config.combined_groups?.map((g) => ({
      label: g.label,
      tableIds: g.table_ids,
      seats: g.seats,
      areaId: g.area_id,
    })),
  },
  tables: toTables(row.tables),
  areas: toAreas(row.areas),
  gridSize: GRID_SIZE,
});

const normalizeTables = (
  tables?: Array<{
    id: string;
    label: string;
    seats: number;
    shape?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    areaId?: string;
  }>
): TableMetaRow[] =>
  (tables || []).map((t) => ({
    id: t.id,
    label: t.label,
    seats: Number(t.seats) || 0,
    shape: t.shape === "round" || t.shape === "diamond" ? t.shape : "rect",
    x: Number(t.x) || 0,
    y: Number(t.y) || 0,
    width: Number(t.width) || 1,
    height: Number(t.height) || 1,
    rotation: t.rotation !== undefined ? Number(t.rotation) : undefined,
    area_id: t.areaId,
  }));

const normalizeAreas = (areas?: Array<{ id: string; name: string; lines?: AreaLineRow[] }>): TableAreaRow[] =>
  (areas || []).map((a) => ({
    id: a.id,
    name: a.name,
    lines: (a.lines || []).map((line) => ({
      x1: Number(line.x1) || 0,
      y1: Number(line.y1) || 0,
      x2: Number(line.x2) || 0,
      y2: Number(line.y2) || 0,
    })),
  }));

export const getRooms = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("room_layouts").select("*");
    if (error) throw error;
    res.json((data || []).map(toRoom));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load rooms" });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  const { name, capacity, description, tables, areas } = req.body || {};
  if (!name || !capacity) {
    return res.status(400).json({ message: "Name and capacity are required" });
  }

  try {
    const { data, error } = await supabase
      .from("room_layouts")
      .insert({
        name,
        capacity: Number(capacity),
        description: description || "",
        default_table_config: {
          tables_for_2: 0,
          tables_for_4: 0,
          tables_for_6: 0,
          long_tables: 0,
          selected_table_ids: [],
        },
        tables: normalizeTables(tables),
        areas: normalizeAreas(areas),
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(toRoom(data as RoomLayoutRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create room" });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  const { name, capacity, description, tables, areas } = req.body || {};
  try {
    const { data, error } = await supabase
      .from("room_layouts")
      .update({
        ...(name !== undefined ? { name } : {}),
        ...(capacity !== undefined ? { capacity: Number(capacity) } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(tables !== undefined ? { tables: normalizeTables(tables) } : {}),
        ...(areas !== undefined ? { areas: normalizeAreas(areas) } : {}),
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(toRoom(data as RoomLayoutRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update room" });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from("room_layouts").delete().eq("id", req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete room" });
  }
};
