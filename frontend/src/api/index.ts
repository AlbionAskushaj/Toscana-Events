import {
  MenuCategory,
  MenuItem,
  MenuTemplate,
  RoomLayout,
  EventInquiry,
  InquiryStatus,
  CreateInquiryPayload,
  ChatMessage,
  ChatInquiryPayload,
} from "../types";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001/api";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

async function adminFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, { ...options, credentials: "include" });
}

export async function requestChatSession(
  sessionId: string,
  turnstileToken: string | null
): Promise<string> {
  const res = await fetch(`${API_BASE}/chat/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, turnstileToken }),
  });
  if (!res.ok) {
    let message = "Verification failed";
    try {
      const data = (await res.json()) as { message?: string };
      if (data.message) message = data.message;
    } catch {}
    throw new Error(message);
  }
  const data = (await res.json()) as { token: string };
  return data.token;
}

export function streamChatMessage(
  messages: ChatMessage[],
  sessionId: string | undefined,
  sessionToken: string,
  onText: (chunk: string) => void,
  onFieldUpdate: (fields: Partial<ChatInquiryPayload>) => void,
  onDone: () => void,
  onError: (err: Error) => void,
  signal?: AbortSignal
): void {
  fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({ messages, sessionId }),
    signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const msg = await res.text();
        onError(new Error(msg || "Chat request failed"));
        return;
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!;
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") {
            onDone();
            return;
          }
          if (payload.startsWith("[TEXT] ")) {
            onText(payload.slice(7));
          } else if (payload.startsWith("[FIELD_UPDATE] ")) {
            try {
              onFieldUpdate(JSON.parse(payload.slice(15)) as Partial<ChatInquiryPayload>);
            } catch (e) {
              console.error("[chat] Failed to parse FIELD_UPDATE payload", e, payload);
            }
          } else if (payload.startsWith("[ERROR] ")) {
            const raw = payload.slice(8);
            let message = raw;
            try {
              const parsed = JSON.parse(raw) as { code?: string; message?: string };
              if (parsed.message) message = parsed.message;
            } catch {}
            onError(new Error(message));
            return;
          }
        }
      }
      onDone();
    })
    .catch((err: unknown) => {
      if (err instanceof Error && err.name === "AbortError") return;
      onError(err instanceof Error ? err : new Error(String(err)));
    });
}

export async function getMenuCategories(): Promise<MenuCategory[]> {
  const res = await fetch(`${API_BASE}/menu/categories`);
  return handleResponse(res);
}

export async function getMenuItems(params?: {
  categoryId?: string;
  active?: boolean;
}): Promise<MenuItem[]> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  if (params?.active !== undefined) query.set("active", String(params.active));
  const res = await fetch(`${API_BASE}/menu/items?${query.toString()}`);
  return handleResponse(res);
}

export async function getMenuTemplates(): Promise<MenuTemplate[]> {
  const res = await fetch(`${API_BASE}/menu/templates`);
  return handleResponse(res);
}

export async function createMenuCategory(payload: { name: string; sortOrder: number }): Promise<MenuCategory> {
  const res = await fetch(`${API_BASE}/menu/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateMenuCategory(
  id: string,
  payload: { name?: string; sortOrder?: number }
): Promise<MenuCategory> {
  const res = await fetch(`${API_BASE}/menu/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteMenuCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/menu/categories/${id}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}

export async function createMenuItem(payload: {
  categoryId: string;
  name: string;
  description?: string;
  pricePerPerson: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  active?: boolean;
}): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/menu/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateMenuItem(
  id: string,
  payload: Partial<{
    categoryId: string;
    name: string;
    description: string;
    pricePerPerson: number;
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    active: boolean;
  }>
): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/menu/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/menu/items/${id}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}

export async function dedupeMenuItems(dryRun = true): Promise<{
  dryRun: boolean;
  totalItems: number;
  duplicateCount: number;
  duplicates: MenuItem[];
}> {
  const res = await fetch(`${API_BASE}/menu/items/dedupe?dryRun=${dryRun}`, {
    method: "POST",
  });
  return handleResponse(res);
}

export async function listDraftsByEmail(email: string): Promise<Array<{ id: string; email: string; data: any; createdAt: string; updatedAt: string }>> {
  const res = await fetch(`${API_BASE}/drafts?email=${encodeURIComponent(email)}`);
  return handleResponse(res);
}

export async function getDraft(id: string): Promise<{ id: string; email: string; data: any; createdAt: string; updatedAt: string }> {
  const res = await fetch(`${API_BASE}/drafts/${id}`);
  return handleResponse(res);
}

export async function createDraft(email: string, data: any): Promise<{ id: string; email: string; data: any; createdAt: string; updatedAt: string }> {
  const res = await fetch(`${API_BASE}/drafts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, data }),
  });
  return handleResponse(res);
}

export async function updateDraft(
  id: string,
  email: string,
  data: any
): Promise<{ id: string; email: string; data: any; createdAt: string; updatedAt: string }> {
  const res = await fetch(`${API_BASE}/drafts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, data }),
  });
  return handleResponse(res);
}

export async function getRooms(): Promise<RoomLayout[]> {
  const res = await fetch(`${API_BASE}/rooms`);
  return handleResponse(res);
}


export async function createRoom(payload: Partial<RoomLayout>): Promise<RoomLayout> {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateRoom(id: string, payload: Partial<RoomLayout>): Promise<RoomLayout> {
  const res = await fetch(`${API_BASE}/rooms/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteRoom(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/rooms/${id}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}


export async function createInquiry(
  payload: CreateInquiryPayload
): Promise<EventInquiry> {
  const res = await fetch(`${API_BASE}/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function getInquiries(): Promise<EventInquiry[]> {
  const res = await fetch(`${API_BASE}/inquiries`);
  return handleResponse(res);
}

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus
): Promise<EventInquiry> {
  const res = await fetch(`${API_BASE}/inquiries/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

export async function adminCreateMenuCategory(payload: { name: string; sortOrder: number }): Promise<MenuCategory> {
  const res = await adminFetch("/admin/menu/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function adminCreateMenuTemplate(payload: {
  name: string;
  description?: string;
  sortOrder: number;
  courses: Array<{ name: string; suggestedItemNames?: string[] }>;
}): Promise<MenuTemplate> {
  const res = await adminFetch("/admin/menu/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function adminUpdateMenuTemplate(
  id: string,
  payload: Partial<{
    name: string;
    description: string;
    sortOrder: number;
    courses: Array<{ name: string; suggestedItemNames?: string[] }>;
  }>
): Promise<MenuTemplate> {
  const res = await adminFetch(`/admin/menu/templates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function adminDeleteMenuTemplate(id: string): Promise<void> {
  const res = await adminFetch(`/admin/menu/templates/${id}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}

export async function adminUpdateMenuCategory(
  id: string,
  payload: { name?: string; sortOrder?: number }
): Promise<MenuCategory> {
  const res = await adminFetch(`/admin/menu/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function adminDeleteMenuCategory(id: string): Promise<void> {
  const res = await adminFetch(`/admin/menu/categories/${id}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}

export async function adminCreateMenuItem(payload: {
  categoryId: string;
  name: string;
  description?: string;
  pricePerPerson: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  active?: boolean;
}): Promise<MenuItem> {
  const res = await adminFetch("/admin/menu/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function adminUpdateMenuItem(
  id: string,
  payload: Partial<{
    categoryId: string;
    name: string;
    description: string;
    pricePerPerson: number;
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    active: boolean;
  }>
): Promise<MenuItem> {
  const res = await adminFetch(`/admin/menu/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function adminDeleteMenuItem(id: string): Promise<void> {
  const res = await adminFetch(`/admin/menu/items/${id}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}

export async function adminDedupeMenuItems(dryRun = true): Promise<{
  dryRun: boolean;
  totalItems: number;
  duplicateCount: number;
  duplicates: MenuItem[];
}> {
  const res = await adminFetch(`/admin/menu/items/dedupe?dryRun=${dryRun}`, {
    method: "POST",
  });
  return handleResponse(res);
}

export async function adminGetInquiries(page = 0): Promise<{ inquiries: EventInquiry[]; total: number; page: number; limit: number }> {
  const res = await adminFetch(`/admin/inquiries?page=${page}`);
  return handleResponse(res);
}

export async function adminUpdateInquiryStatus(
  id: string,
  status: InquiryStatus
): Promise<EventInquiry> {
  const res = await adminFetch(`/admin/inquiries/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

export async function adminCreateRoom(payload: Partial<RoomLayout>): Promise<RoomLayout> {
  const res = await adminFetch("/admin/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function adminUpdateRoom(id: string, payload: Partial<RoomLayout>): Promise<RoomLayout> {
  const res = await adminFetch(`/admin/rooms/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function adminDeleteRoom(id: string): Promise<void> {
  const res = await adminFetch(`/admin/rooms/${id}`, {
    method: "DELETE",
  });
  await handleResponse(res);
}
