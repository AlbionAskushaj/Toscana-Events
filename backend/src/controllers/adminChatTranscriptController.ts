import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { ChatTranscriptRow, TranscriptTurn } from "../types/tables";

const toSummary = (row: ChatTranscriptRow) => {
  const turns = (row.transcript || []) as TranscriptTurn[];
  const firstUser = turns.find((t) => t.role === "user");
  return {
    id: row.id,
    sessionId: row.session_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessageAt: row.last_message_at,
    inquiryId: row.inquiry_id,
    contactEmail: row.contact_email,
    contactName: row.contact_name,
    messageCount: row.message_count,
    preview: firstUser ? firstUser.content.slice(0, 140) : "",
  };
};

export const listChatTranscripts = async (req: Request, res: Response) => {
  const page = Math.max(0, Number(req.query.page) || 0);
  const limit = 50;
  const from = page * limit;
  const to = from + limit - 1;

  try {
    const { data, error, count } = await supabaseAdmin
      .from("chat_transcripts")
      .select("*", { count: "exact" })
      .order("last_message_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const rows = (data || []) as ChatTranscriptRow[];
    res.json({
      transcripts: rows.map(toSummary),
      total: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    console.error("[admin] listChatTranscripts error", err);
    res.status(500).json({ message: "Failed to load chat transcripts" });
  }
};

export const getChatTranscript = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("chat_transcripts")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: "Transcript not found" });
    }

    const row = data as ChatTranscriptRow;
    res.json({
      id: row.id,
      sessionId: row.session_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastMessageAt: row.last_message_at,
      inquiryId: row.inquiry_id,
      contactEmail: row.contact_email,
      contactName: row.contact_name,
      messageCount: row.message_count,
      transcript: row.transcript,
    });
  } catch (err) {
    console.error("[admin] getChatTranscript error", err);
    res.status(500).json({ message: "Failed to load transcript" });
  }
};
