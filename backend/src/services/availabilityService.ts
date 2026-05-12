import { env } from "../config/env";

const APIFY_RUN_SYNC_URL =
  "https://api.apify.com/v2/acts/clearpath~opentable-booker/run-sync-get-dataset-items";

const TIMEOUT_MS = 12000;

export interface AvailabilityResult {
  available: boolean | null;
  slots: string[];
  date?: string;
  message?: string;
}

export async function checkOpenTableAvailability(params: {
  date: string;
  partySize: number;
  time?: string;
}): Promise<AvailabilityResult> {
  const { date, partySize, time } = params;

  if (!env.apifyToken || !env.opentableRestaurantId) {
    return {
      available: null,
      slots: [],
      message: "Availability service is not configured.",
    };
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
      return { available: null, slots: [], message: "Availability check failed." };
    }

    const data = (await response.json()) as Array<{
      available?: boolean;
      slots?: string[];
      times?: string[];
    }>;

    if (!Array.isArray(data) || data.length === 0) {
      return { available: false, slots: [], date };
    }

    const first = data[0];
    const slots: string[] = first.slots || first.times || [];
    const available = first.available !== undefined ? first.available : slots.length > 0;

    return { available, slots, date };
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      console.error("[availability] Apify request timed out");
      return { available: null, slots: [], message: "Availability check timed out." };
    }
    console.error("[availability] unexpected error", err);
    return { available: null, slots: [], message: "Availability check failed." };
  }
}
