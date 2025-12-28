import {
  MenuCategory,
  MenuItem,
  RoomLayout,
  EventInquiry,
  InquiryStatus,
  CreateInquiryPayload,
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
