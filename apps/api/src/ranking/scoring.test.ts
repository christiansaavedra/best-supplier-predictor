import { describe, expect, it } from "vitest";
import { leadScore, priceScore, rankOffers, smoothedOnTimeRate, WEIGHTS, type OfferInput } from "./scoring";

const today = new Date("2026-01-01T12:00:00Z");
const inDays = (n: number) => new Date(today.getTime() + n * 86_400_000);

let nextId = 1;
function offer(overrides: Partial<OfferInput> & { usd?: number }): OfferInput {
  const { usd, ...rest } = overrides;
  const id = nextId++;
  return {
    offerId: id,
    supplierId: id,
    supplierName: `Supplier ${id}`,
    supplierCountry: "US",
    unitPrice: usd ?? 100,
    currency: "USD",
    usdRate: 1,
    leadTimeDays: 10,
    updatedAt: inDays(-1),
    deliveries: { count: 20, onTime: 18 },
    routeRisk: 0.2,
    ...rest,
  };
}

const base = { quantity: 1, needBy: inDays(30), today, globalOnTimeRate: 0.8 };

describe("weights", () => {
  it("sum to 1, so scores stay between 0 and 1", () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
});

describe("priceScore", () => {
  it("gives the cheapest 1 and loses the whole score at 30% above it", () => {
    expect(priceScore(100, 100)).toBe(1);
    expect(priceScore(115, 100)).toBeCloseTo(0.5);
    expect(priceScore(130, 100)).toBeCloseTo(0);
    expect(priceScore(200, 100)).toBe(0);
  });

  it("treats a small gap as small, however few offers there are", () => {
    expect(priceScore(105, 100)).toBeCloseTo(0.833, 3);
  });
});

describe("leadScore", () => {
  it("gives the fastest 1 and loses the whole score at 10 days slower", () => {
    expect(leadScore(5, 5)).toBe(1);
    expect(leadScore(10, 5)).toBeCloseTo(0.5);
    expect(leadScore(20, 5)).toBe(0);
  });
});

describe("smoothedOnTimeRate", () => {
  it("keeps a 1-of-1 supplier below a perfect score", () => {
    expect(smoothedOnTimeRate({ count: 1, onTime: 1 }, 0.8)).toBeCloseTo((1 + 5 * 0.8) / 6);
    expect(smoothedOnTimeRate({ count: 1, onTime: 1 }, 0.8)).toBeLessThan(1);
  });

  it("uses the average when there is no history", () => {
    expect(smoothedOnTimeRate({ count: 0, onTime: 0 }, 0.8)).toBe(0.8);
  });

  it("lets a long record dominate", () => {
    expect(smoothedOnTimeRate({ count: 200, onTime: 190 }, 0.5)).toBeGreaterThan(0.93);
  });
});

describe("rankOffers", () => {
  it("returns no_offers when no supplier ships the product", () => {
    expect(rankOffers({ ...base, offers: [] })).toEqual({ status: "no_offers", offers: [] });
  });

  it("converts to USD and multiplies by quantity", () => {
    const result = rankOffers({
      ...base,
      quantity: 10,
      offers: [offer({ unitPrice: 2000, currency: "BRL", usdRate: 0.18 })],
    });
    expect(result.offers[0]!.totalUsd).toBe(3600);
  });

  it("ranks a reliable supplier above a slightly cheaper unreliable one", () => {
    const reliable = offer({ usd: 105, deliveries: { count: 20, onTime: 19 } });
    const unreliable = offer({ usd: 100, deliveries: { count: 20, onTime: 10 } });
    const result = rankOffers({ ...base, offers: [unreliable, reliable] });
    expect(result.offers.map((o) => o.offerId)).toEqual([reliable.offerId, unreliable.offerId]);
  });

  it("excludes offers that arrive after the need-by date when some arrive on time", () => {
    const fast = offer({ leadTimeDays: 5 });
    const slow = offer({ leadTimeDays: 40, usd: 50 });
    const result = rankOffers({ ...base, offers: [fast, slow] });
    expect(result.status).toBe("ranked");
    expect(result.offers.map((o) => o.offerId)).toEqual([fast.offerId]);
  });

  it("falls back to the fastest offers, flagged late, when none arrive on time", () => {
    const offers = [12, 9, 18, 15].map((leadTimeDays) => offer({ leadTimeDays }));
    const result = rankOffers({ ...base, needBy: inDays(7), offers });
    expect(result.status).toBe("late");
    expect(result.offers.map((o) => o.leadTimeDays)).toEqual([9, 12, 15]);
    expect(result.offers.every((o) => o.flags.includes("late") && o.score === null)).toBe(true);
  });

  it("flags prices older than 30 days, and new suppliers", () => {
    const stale = offer({ updatedAt: inDays(-45) });
    const newcomer = offer({ deliveries: { count: 1, onTime: 1 } });
    const result = rankOffers({ ...base, offers: [stale, newcomer] });
    expect(result.offers.find((o) => o.offerId === stale.offerId)!.flags).toContain("price_outdated");
    expect(result.offers.find((o) => o.offerId === newcomer.offerId)!.flags).toContain("new_supplier");
  });

  it("returns at most 3 offers", () => {
    const offers = Array.from({ length: 6 }, (_, i) => offer({ usd: 100 + i }));
    expect(rankOffers({ ...base, offers }).offers).toHaveLength(3);
  });

  // The seeded demo scenario: ThinkPad T14 to Colombia (apps/api/src/db/seed-data.ts).
  it("reproduces the Bogotá demo: Andes wins, NovaLink is held back by smoothing, MegaByte loses", () => {
    const andes = offer({
      supplierName: "Andes",
      usd: 1180,
      leadTimeDays: 7,
      deliveries: { count: 20, onTime: 19 },
      routeRisk: 0.05,
    });
    const megabyte = offer({
      supplierName: "MegaByte",
      usd: 1160,
      leadTimeDays: 12,
      deliveries: { count: 20, onTime: 11 },
      routeRisk: 0.3,
    });
    const northstar = offer({
      supplierName: "NorthStar",
      usd: 1290,
      leadTimeDays: 10,
      deliveries: { count: 20, onTime: 18 },
      routeRisk: 0.2,
    });
    const novalink = offer({
      supplierName: "NovaLink",
      usd: 1190,
      leadTimeDays: 5,
      deliveries: { count: 1, onTime: 1 },
      routeRisk: 0.05,
    });
    const input = { ...base, globalOnTimeRate: 0.787, offers: [andes, megabyte, northstar, novalink] };

    const result = rankOffers(input);
    expect(result.offers.map((o) => o.supplierName)).toEqual(["Andes", "NovaLink", "MegaByte"]);

    // Without smoothing (as if NovaLink had a long perfect record), NovaLink would win.
    const unsmoothed = rankOffers({
      ...input,
      offers: [andes, megabyte, northstar, { ...novalink, deliveries: { count: 1000, onTime: 1000 } }],
    });
    expect(unsmoothed.offers[0]!.supplierName).toBe("NovaLink");
  });
});
