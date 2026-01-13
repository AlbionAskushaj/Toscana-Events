import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { DraftRow } from "../types/tables";

const RETENTION_DAYS = 30;

const cutoffIso = () =>
  new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

const toDraft = (row: DraftRow) => ({
  id: row.id,
  email: row.email,
  data: row.data,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const cleanupOldDrafts = async () => {
  const cutoff = cutoffIso();
  await supabaseAdmin.from("drafts").delete().lt("updated_at", cutoff);
};

export const listDrafts = async (req: Request, res: Response) => {
  const email = String(req.query.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    await cleanupOldDrafts();
    const cutoff = cutoffIso();
    const { data, error } = await supabaseAdmin
      .from("drafts")
      .select("*")
      .eq("email", email)
      .gte("updated_at", cutoff)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    res.json((data || []).map(toDraft));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load drafts" });
  }
};

export const getDraft = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("drafts")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Draft not found" });
    res.json(toDraft(data));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load draft" });
  }
};

export const createDraft = async (req: Request, res: Response) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const data = req.body?.data;

  if (!email || !data) {
    return res.status(400).json({ message: "Email and data are required" });
  }

  try {
    await cleanupOldDrafts();
    const { data: inserted, error } = await supabaseAdmin
      .from("drafts")
      .insert({
        email,
        data,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(toDraft(inserted as DraftRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create draft" });
  }
};

export const updateDraft = async (req: Request, res: Response) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const data = req.body?.data;

  if (!email || !data) {
    return res.status(400).json({ message: "Email and data are required" });
  }

  try {
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("drafts")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (existingError || !existing) {
      return res.status(404).json({ message: "Draft not found" });
    }
    if (existing.email !== email) {
      return res.status(403).json({ message: "Email does not match draft" });
    }

    const { data: updated, error } = await supabaseAdmin
      .from("drafts")
      .update({
        data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(toDraft(updated as DraftRow));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update draft" });
  }
};
