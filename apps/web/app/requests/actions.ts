"use server";

import type { CreateRequestBody, ParseResult } from "@copilot/shared";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const failure = (error: unknown): { ok: false; error: string } => ({
  ok: false,
  error: error instanceof ApiError ? error.message : "Something went wrong. Try again.",
});

export async function parseText(text: string): Promise<Result<ParseResult>> {
  try {
    return { ok: true, data: await api<ParseResult>("/requests/parse", { method: "POST", body: { text } }) };
  } catch (error) {
    return failure(error);
  }
}

export async function createRequest(body: CreateRequestBody): Promise<Result<never>> {
  let id: number;
  try {
    ({ id } = await api<{ id: number }>("/requests", { method: "POST", body }));
  } catch (error) {
    return failure(error);
  }
  // Rank right away. If it fails, the request page offers a "Rank suppliers" button.
  await api(`/requests/${id}/rank`, { method: "POST" }).catch(() => undefined);
  redirect(`/requests/${id}`);
}

export async function rankRequest(id: number) {
  return act(id, "POST", `/requests/${id}/rank`);
}

async function act(id: number, method: "POST" | "PATCH", path: string, body?: unknown): Promise<Result<null>> {
  try {
    await api(path, { method, body });
  } catch (error) {
    return failure(error);
  }
  revalidatePath(`/requests/${id}`);
  return { ok: true, data: null };
}

export async function selectOffer(id: number, lineId: number, offerId: number, overrideReason: string | null) {
  return act(id, "PATCH", `/requests/${id}/lines/${lineId}`, { offerId, overrideReason });
}

export async function submitRequest(id: number) {
  return act(id, "POST", `/requests/${id}/submit`);
}

export async function approveRequest(id: number) {
  return act(id, "POST", `/requests/${id}/approve`);
}

export async function rejectRequest(id: number, comment: string) {
  return act(id, "POST", `/requests/${id}/reject`, { comment });
}
