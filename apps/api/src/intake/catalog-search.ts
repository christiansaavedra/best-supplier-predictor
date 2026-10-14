import type { ProductOption } from "@copilot/shared";

export type CatalogProduct = { id: number; sku: string; brand: string; category: string; model: string };

export type SearchQuery = { brand: string | null; category: string | null; model: string | null };

export type Candidate = ProductOption & { score: number };

const MAX_CANDIDATES = 5;

const tokens = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g) ?? [];

// Plural and casing tolerant: "ThinkPads" matches "ThinkPad".
const sameToken = (a: string, b: string) => a === b || a === `${b}s` || `${a}s` === b;

export const productLabel = (p: CatalogProduct) => `${p.brand} ${p.model}`;

// Deterministic search over the catalog. In production this would be a Postgres full-text
// or trigram query; with a small demo catalog an in-memory scan is enough.
export function searchCatalog(catalog: CatalogProduct[], query: SearchQuery): Candidate[] {
  const wanted = tokens(query.model ?? "");
  if (!query.brand && !query.category && wanted.length === 0) return [];

  let pool = catalog;

  if (query.brand) {
    const brand = query.brand.toLowerCase();
    pool = pool.filter((p) => p.brand.toLowerCase() === brand);
    if (pool.length === 0) return []; // We carry nothing from this brand.
  }
  if (query.category) {
    pool = pool.filter((p) => p.category === query.category);
  }

  const scored = pool.map((p) => {
    const have = tokens(`${p.brand} ${p.model}`);
    const score = wanted.filter((w) => have.some((h) => sameToken(w, h))).length;
    return { id: p.id, sku: p.sku, label: productLabel(p), score };
  });

  return scored
    .filter((c) => wanted.length === 0 || c.score > 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, MAX_CANDIDATES);
}
