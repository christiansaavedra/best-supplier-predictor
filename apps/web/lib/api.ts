import "server-only";
import { cookies } from "next/headers";

// Server-side only: the browser never calls the API directly.
const API_URL = process.env.API_URL ?? "http://localhost:4000";

export const USER_COOKIE = "demo_user";
export const DEFAULT_USER_ID = "1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const userId = (await cookies()).get(USER_COOKIE)?.value ?? DEFAULT_USER_ID;
  const res = await fetch(`${API_URL}${path}`, {
    method: init?.method ?? "GET",
    headers: { "content-type": "application/json", "x-user-id": userId },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? `API error ${res.status}`);
  return data as T;
}
