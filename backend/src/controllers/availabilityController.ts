import { Request, Response } from "express";
import { checkOpenTableAvailability } from "../services/availabilityService";

export const checkAvailability = async (req: Request, res: Response) => {
  const date = String(req.query.date || "").trim();
  const partySize = parseInt(String(req.query.partySize || ""), 10);
  const time = String(req.query.time || "").trim();

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: "date must be in YYYY-MM-DD format" });
  }
  if (!partySize || partySize < 1 || partySize > 500) {
    return res.status(400).json({ message: "partySize must be a number between 1 and 500" });
  }

  const result = await checkOpenTableAvailability({ date, partySize, time: time || undefined });

  if (result.message === "Availability service is not configured.") {
    return res.status(503).json(result);
  }

  return res.json(result);
};
