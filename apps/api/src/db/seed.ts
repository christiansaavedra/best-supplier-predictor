import { sql } from "drizzle-orm";
import { db, pool } from "./client";
import * as s from "./schema";
import * as data from "./seed-data";

const DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_SIZE = 20;
const reset = process.argv.includes("--reset");

// Small deterministic PRNG so every reviewer gets the same data.
function prng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = prng(42);
const between = (min: number, max: number) => min + random() * (max - min);
const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS);
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

function leadTimeFor(origin: string, destination: string): number {
  if (origin === destination) return Math.round(between(3, 7));
  if (origin === "US") return Math.round(between(8, 15));
  return Math.round(between(7, 14));
}

// Which suppliers usually serve a destination (before random sampling).
function supplierPool(destination: string) {
  return data.suppliers.filter(
    (sup) =>
      sup.key !== "novalink" &&
      (sup.countryCode === destination ||
        sup.countryCode === "US" ||
        (sup.key === "megabyte" && destination !== "BR") ||
        (sup.key === "andes" && destination === "CL")),
  );
}

async function main() {
  const [{ count }] = (await db.execute<{ count: number }>(sql`select count(*)::int as count from countries`)).rows as [
    { count: number },
  ];
  if (count > 0 && !reset) {
    console.log("Database already seeded. Use --reset to reseed.");
    return;
  }

  await db.transaction(async (tx) => {
    if (reset) {
      await tx.execute(sql`truncate
        approval_events, recommendations, request_lines, purchase_requests,
        delivery_records, supplier_offers, route_risks, exchange_rates,
        products, suppliers, users, countries
        restart identity cascade`);
    }

    await tx.insert(s.countries).values(data.countries);
    await tx.insert(s.users).values([...data.users]);
    await tx
      .insert(s.exchangeRates)
      .values(
        Object.entries(data.usdRates).map(([currency, usdRate]) => ({ currency, usdRate, asOf: isoDate(new Date()) })),
      );
    await tx.insert(s.routeRisks).values(
      data.countries.flatMap((o) =>
        data.countries.map((d) => ({
          originCountryCode: o.code,
          destinationCountryCode: d.code,
          risk: data.routeRisk(o.code, d.code),
        })),
      ),
    );

    const supplierRows = await tx
      .insert(s.suppliers)
      .values(data.suppliers.map(({ name, countryCode }) => ({ name, countryCode })))
      .returning();
    const supplierId = new Map(data.suppliers.map((sup, i) => [sup.key, supplierRows[i]!.id]));

    const productRows = await tx
      .insert(s.products)
      .values(data.products.map(({ sku, brand, category, model }) => ({ sku, brand, category, model })))
      .returning();
    const productId = new Map(data.products.map((p, i) => [p.sku, productRows[i]!.id]));

    // Offers: scenarios as written, everything else generated.
    const offers: (typeof s.supplierOffers.$inferInsert)[] = [];
    const served = new Set<string>(); // "supplierKey:country", for delivery history

    const addOffer = (
      supKey: data.SupplierKey,
      sku: data.Sku,
      country: string,
      usd: number,
      leadTimeDays: number,
      daysSinceUpdate: number,
    ) => {
      const sup = data.suppliers.find((x) => x.key === supKey)!;
      offers.push({
        supplierId: supplierId.get(supKey)!,
        productId: productId.get(sku)!,
        destinationCountryCode: country,
        unitPrice: Math.round((usd / data.usdRates[sup.currency]!) * 100) / 100,
        currency: sup.currency,
        leadTimeDays,
        updatedAt: daysAgo(daysSinceUpdate),
      });
      served.add(`${supKey}:${country}`);
    };

    for (const scenario of data.scenarioOffers) {
      for (const o of scenario.offers) {
        addOffer(o.supplier, scenario.sku, scenario.country, o.usd, o.leadTimeDays, o.daysSinceUpdate ?? 2);
      }
    }

    for (const product of data.products) {
      for (const country of data.countries) {
        if (data.scenarioOffers.some((x) => x.sku === product.sku && x.country === country.code)) continue;
        const pool = supplierPool(country.code).filter(() => random() < 0.7);
        for (const sup of pool) {
          const usd = Math.round(product.usd * between(0.92, 1.12));
          addOffer(
            sup.key,
            product.sku,
            country.code,
            usd,
            leadTimeFor(sup.countryCode, country.code),
            Math.round(between(1, 20)),
          );
        }
      }
    }
    await tx.insert(s.supplierOffers).values(offers);

    // Delivery history: HISTORY_SIZE past deliveries per supplier and country served, matching onTimeRate.
    const deliveries: (typeof s.deliveryRecords.$inferInsert)[] = [];
    for (const key of served) {
      const [supKey, countryCode] = key.split(":") as [data.SupplierKey, string];
      const sup = data.suppliers.find((x) => x.key === supKey)!;
      const history =
        sup.onTimeRate === null
          ? data.novalinkHistory.filter((h) => h.countryCode === countryCode).map((h) => h.onTime)
          : Array.from({ length: HISTORY_SIZE }, (_, i) => i < Math.round(sup.onTimeRate * HISTORY_SIZE));
      for (const onTime of history) {
        const promised = daysAgo(Math.round(between(15, 365)));
        const lateBy = onTime ? 0 : Math.round(between(3, 12));
        deliveries.push({
          supplierId: supplierId.get(supKey)!,
          countryCode,
          promisedDate: isoDate(promised),
          deliveredDate: isoDate(new Date(promised.getTime() + (lateBy - Math.round(between(0, 2))) * DAY_MS)),
          issue: !onTime && random() < 0.4 ? (random() < 0.5 ? "Partial shipment" : "Damaged packaging") : null,
        });
      }
    }
    await tx.insert(s.deliveryRecords).values(deliveries);

    console.log(
      `Seeded ${data.countries.length} countries, ${supplierRows.length} suppliers, ${productRows.length} products, ` +
        `${offers.length} offers, ${deliveries.length} deliveries, ${data.users.length} users`,
    );
  });
}

await main();
await pool.end();
