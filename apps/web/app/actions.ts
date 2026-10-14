"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { USER_COOKIE } from "@/lib/api";

export async function switchUser(userId: string) {
  (await cookies()).set(USER_COOKIE, userId, { path: "/", sameSite: "lax" });
  revalidatePath("/", "layout");
}
