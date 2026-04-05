import { Request, Response } from "express";
import { env } from "../config/env";

const APIFY_RUN_SYNC_URL =
  "https://api.apify.com/v2/acts/clearpath~opentable-booker/run-sync-get-dataset-items";

const TIMEOUT_MS = 12000;

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

  if (!env.apifyToken || !env.opentableRestaurantId) {
    return res.status(503).json({
      available: null,
      slots: [],
      message: "Availability service is not configured.",
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const payload: Record<string, unknown> = {
      restaurantId: env.opentableRestaurantId,
      date,
      partySize,
      action: "checkAvailability",
    };
    if (time) payload.time = time;

    const response = await fetch(
      `${APIFY_RUN_SYNC_URL}?token=${encodeURIComponent(env.apifyToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    if (!response.ok) {
      console.error("[availability] Apify error", response.status, await response.text());
      return res.json({ available: null, slots: [], message: "Availability check failed." });
    }

    const data = (await response.json()) as Array<{
      available?: boolean;
      slots?: string[];
      times?: string[];
    }>;

    if (!Array.isArray(data) || data.length === 0) {
      return res.json({ available: false, slots: [], date });
    }

    const first = data[0];
    const slots: string[] = first.slots || first.times || [];
    const available = first.available !== undefined ? first.available : slots.length > 0;

    return res.json({ available, slots, date });
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      console.error("[availability] Apify request timed out");
      return res.json({ available: null, slots: [], message: "Availability check timed out." });
    }
    console.error("[availability] unexpected error", err);
    return res.json({ available: null, slots: [], message: "Availability check failed." });
  }
};
