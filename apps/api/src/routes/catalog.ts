import { asc } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/client";
import { countries, products, users } from "../db/schema";
import { productLabel } from "../intake/catalog-search";

export const catalogRouter = Router();

catalogRouter.get("/catalog", async (_req, res) => {
  const [productRows, countryRows] = await Promise.all([
    db.select().from(products).orderBy(asc(products.brand), asc(products.model)),
    db.select().from(countries).orderBy(asc(countries.name)),
  ]);
  res.json({
    products: productRows.map((p) => ({ id: p.id, sku: p.sku, label: productLabel(p) })),
    countries: countryRows,
  });
});

// Public so the web app can show the user switcher before anyone is "signed in".
catalogRouter.get("/users", async (_req, res) => {
  res.json(await db.select().from(users).orderBy(asc(users.id)));
});
