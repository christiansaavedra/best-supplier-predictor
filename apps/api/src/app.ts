import express, { type NextFunction, type Request, type Response } from "express";
import { sql } from "drizzle-orm";
import { ZodError } from "zod";
import { demoAuth, HttpError } from "./auth";
import { db } from "./db/client";
import { isMockAi } from "./llm/client";
import { catalogRouter } from "./routes/catalog";
import { requestsRouter } from "./routes/requests";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", async (_req, res) => {
    const { rows } = await db.execute(sql`
      select
        (select count(*)::int from suppliers) as suppliers,
        (select count(*)::int from products) as products,
        (select count(*)::int from supplier_offers) as offers`);
    res.json({ status: "ok", mockAi: isMockAi(), data: rows[0] });
  });

  app.use(catalogRouter);
  app.use(demoAuth, requestsRouter);

  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof ZodError) {
      const details = error.issues
        .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
        .join("; ");
      console.warn(`400 ${req.method} ${req.path}: ${details}`);
      return res.status(400).json({ error: `Invalid input: ${details}`, issues: error.issues });
    }
    if (error instanceof HttpError) {
      console.warn(`${error.status} ${req.method} ${req.path}: ${error.message}`);
      return res.status(error.status).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: "Internal error" });
  });

  return app;
}
