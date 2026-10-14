// Deterministic supplier ranking (ADR 0013). Pure: no database, no clock, no LLM.
// Mirrors the pseudo-code in docs/proposal.md, section 6.

export const WEIGHTS = { price: 0.45, track: 0.3, lead: 0.15, risk: 0.1 } as const;
export const PRICE_ZERO_AT = 0.3; // 30% above the cheapest offer scores 0 on price
export const LEAD_ZERO_AT_DAYS = 10; // 10 days slower than the fastest offer scores 0 on lead time
export const PRIOR_DELIVERIES = 5;
export const OUTDATED_AFTER_DAYS = 30;
export const NEW_SUPPLIER_BELOW = 5; // deliveries to this country
export const TOP_N = 3;

const DAY_MS = 86_400_000;

export type Flag = "late" | "price_outdated" | "new_supplier";

export type OfferInput = {
  offerId: number;
  supplierId: number;
  supplierName: string;
  supplierCountry: string;
  unitPrice: number;
  currency: string;
  usdRate: number;
  leadTimeDays: number;
  updatedAt: Date;
  deliveries: { count: number; onTime: number }; // to the destination country
  routeRisk: number; // 0 (none) to 1 (high)
};

export type Breakdown = { price: number; track: number; lead: number; risk: number };

export type RankedOffer = OfferInput & {
  totalUsd: number;
  arrivesOn: Date;
  onTimeRate: number; // smoothed
  score: number | null; // null for late fallback offers, which are ordered by speed
  breakdown: Breakdown | null;
  flags: Flag[];
};

export type RankingResult =
  | { status: "ranked"; offers: RankedOffer[] }
  | { status: "late"; offers: RankedOffer[] }
  | { status: "no_offers"; offers: [] };

export type RankingInput = {
  quantity: number;
  needBy: Date;
  today: Date;
  offers: OfferInput[];
  globalOnTimeRate: number; // average across all suppliers, the prior for smoothing
};

export function rankOffers({ quantity, needBy, today, offers, globalOnTimeRate }: RankingInput): RankingResult {
  if (offers.length === 0) return { status: "no_offers", offers: [] };

  const enriched = offers.map((o) => {
    const arrivesOn = new Date(today.getTime() + o.leadTimeDays * DAY_MS);
    const flags: Flag[] = [];
    if (today.getTime() - o.updatedAt.getTime() > OUTDATED_AFTER_DAYS * DAY_MS) flags.push("price_outdated");
    if (o.deliveries.count < NEW_SUPPLIER_BELOW) flags.push("new_supplier");
    return {
      ...o,
      totalUsd: round2(o.unitPrice * quantity * o.usdRate),
      arrivesOn,
      onTimeRate: smoothedOnTimeRate(o.deliveries, globalOnTimeRate),
      flags,
    };
  });

  const onTime = enriched.filter((o) => o.arrivesOn.getTime() <= needBy.getTime());

  if (onTime.length === 0) {
    const fastest = [...enriched]
      .sort((a, b) => a.leadTimeDays - b.leadTimeDays || a.totalUsd - b.totalUsd)
      .slice(0, TOP_N)
      .map((o) => ({ ...o, score: null, breakdown: null, flags: ["late" as const, ...o.flags] }));
    return { status: "late", offers: fastest };
  }

  const cheapest = Math.min(...onTime.map((o) => o.totalUsd));
  const fastest = Math.min(...onTime.map((o) => o.leadTimeDays));

  const scored = onTime.map((o) => {
    const breakdown: Breakdown = {
      price: priceScore(o.totalUsd, cheapest),
      track: o.onTimeRate,
      lead: leadScore(o.leadTimeDays, fastest),
      risk: 1 - o.routeRisk,
    };
    const score =
      WEIGHTS.price * breakdown.price +
      WEIGHTS.track * breakdown.track +
      WEIGHTS.lead * breakdown.lead +
      WEIGHTS.risk * breakdown.risk;
    return { ...o, breakdown, score: round4(score) };
  });

  scored.sort((a, b) => b.score - a.score || a.totalUsd - b.totalUsd);
  return { status: "ranked", offers: scored.slice(0, TOP_N) };
}

// Relative to the best offer, not to the spread of the others: a 5% price gap costs the same
// whether there are 2 offers or 20. Cheapest = 1, PRICE_ZERO_AT above it or more = 0.
export function priceScore(totalUsd: number, cheapest: number): number {
  return clamp01(1 - (totalUsd - cheapest) / cheapest / PRICE_ZERO_AT);
}

// Fastest = 1, LEAD_ZERO_AT_DAYS slower or more = 0.
export function leadScore(leadTimeDays: number, fastest: number): number {
  return clamp01(1 - (leadTimeDays - fastest) / LEAD_ZERO_AT_DAYS);
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

// Blends a supplier's record with the average, as if it had PRIOR_DELIVERIES typical deliveries.
// A new supplier with 1 of 1 on time does not get a perfect score.
export function smoothedOnTimeRate(deliveries: { count: number; onTime: number }, average: number): number {
  return (deliveries.onTime + PRIOR_DELIVERIES * average) / (deliveries.count + PRIOR_DELIVERIES);
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const round4 = (n: number) => Math.round(n * 10_000) / 10_000;
