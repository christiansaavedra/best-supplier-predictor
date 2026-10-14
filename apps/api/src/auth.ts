import type { Role } from "@copilot/shared";
import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";
import { db } from "./db/client";
import { users } from "./db/schema";

export type CurrentUser = typeof users.$inferSelect;

declare global {
  namespace Express {
    interface Request {
      user: CurrentUser;
    }
  }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Demo stand-in for Google SSO + JWT (ADR 0008): the web app sends the selected user's id.
export async function demoAuth(req: Request, _res: Response, next: NextFunction) {
  const id = Number(req.header("x-user-id"));
  const [user] = Number.isInteger(id) ? await db.select().from(users).where(eq(users.id, id)) : [];
  if (!user) throw new HttpError(401, "Unknown user");
  req.user = user;
  next();
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) throw new HttpError(403, `Requires role: ${roles.join(" or ")}`);
    next();
  };
