import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "../db/client";
import {
  deliveryRecords,
  exchangeRates,
  products,
  purchaseRequests,
  recommendations,
  requestLines,
  routeRisks,
  supplierOffers,
  suppliers,
} from "../db/schema";
import { productLabel } from "../intake/catalog-search";
import { isMockAi, LlmError, MODELS } from "../llm/client";
import { explainWithClaude, explainWithTemplate, type LineToExplain, type Notes } from "./explain";
import { rankOffers, type OfferInput, type RankingResult } from "./scoring";

// Ranks every catalog line of a request and stores the result as a snapshot (ADR 0012).
export async function rankRequest(requestId: number, today = new Date()): Promise<void> {
  const [request] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, requestId));
  if (!request) throw new Error(`Request ${requestId} not found`);
  const country = request.countryCode;
  const needBy = new Date(`${request.needBy}T23:59:59Z`);

  const lines = await db
    .select({ line: requestLines, product: products })
    .from(requestLines)
    .innerJoin(products, eq(products.id, requestLines.productId))
    .where(and(eq(requestLines.requestId, requestId), isNotNull(requestLines.productId)));
  if (lines.length === 0) return;

  const [offerRows, rateRows, riskRows, deliveryRows, [globalRow]] = await Promise.all([
    db
      .select({ offer: supplierOffers, supplier: suppliers })
      .from(supplierOffers)
      .innerJoin(suppliers, eq(suppliers.id, supplierOffers.supplierId))
      .where(
        and(
          inArray(
            supplierOffers.productId,
            lines.map((l) => l.product.id),
          ),
          eq(supplierOffers.destinationCountryCode, country),
        ),
      ),
    db.select().from(exchangeRates),
    db.select().from(routeRisks).where(eq(routeRisks.destinationCountryCode, country)),
    db
      .select({
        supplierId: deliveryRecords.supplierId,
        count: sql<number>`count(*)::int`,
        onTime: sql<number>`count(*) filter (where ${deliveryRecords.deliveredDate} <= ${deliveryRecords.promisedDate})::int`,
      })
      .from(deliveryRecords)
      .where(eq(deliveryRecords.countryCode, country))
      .groupBy(deliveryRecords.supplierId),
    db
      .select({
        rate: sql<number>`(count(*) filter (where ${deliveryRecords.deliveredDate} <= ${deliveryRecords.promisedDate}))::float / nullif(count(*), 0)`,
      })
      .from(deliveryRecords),
  ]);

  const usdRate = new Map(rateRows.map((r) => [r.currency, r.usdRate]));
  const riskFrom = new Map(riskRows.map((r) => [r.originCountryCode, r.risk]));
  const history = new Map(deliveryRows.map((d) => [d.supplierId, { count: d.count, onTime: d.onTime }]));
  const globalOnTimeRate = globalRow?.rate ?? 0.8;

  const ranked = lines.map(({ line, product }) => {
    const offers: OfferInput[] = offerRows
      .filter(({ offer }) => offer.productId === product.id)
      .flatMap(({ offer, supplier }) => {
        const rate = usdRate.get(offer.currency);
        if (rate === undefined) {
          console.warn(`Skipping offer ${offer.id}: no exchange rate for ${offer.currency}`);
          return [];
        }
        return [
          {
            offerId: offer.id,
            supplierId: supplier.id,
            supplierName: supplier.name,
            supplierCountry: supplier.countryCode,
            unitPrice: offer.unitPrice,
            currency: offer.currency,
            usdRate: rate,
            leadTimeDays: offer.leadTimeDays,
            updatedAt: offer.updatedAt,
            deliveries: history.get(supplier.id) ?? { count: 0, onTime: 0 },
            routeRisk: riskFrom.get(supplier.countryCode) ?? 0.5,
          },
        ];
      });
    const result: RankingResult = rankOffers({ quantity: line.quantity, needBy, today, offers, globalOnTimeRate });
    return { line, product, result };
  });

  // Explanations: Claude, the template in mock mode, or nothing if Claude fails (ADR 0004).
  const toExplain: LineToExplain[] = ranked.flatMap(({ line, product, result }) =>
    result.status === "no_offers"
      ? []
      : [{ lineId: line.id, product: productLabel(product), quantity: line.quantity, country, needBy, result }],
  );
  let notes: Notes = new Map();
  let model: string | null = null;
  if (toExplain.length > 0) {
    if (isMockAi()) {
      notes = explainWithTemplate(toExplain);
      model = "mock";
    } else {
      try {
        notes = await explainWithClaude(toExplain);
        model = MODELS.explain;
      } catch (error) {
        if (!(error instanceof LlmError)) throw error;
        console.warn(`Explanation unavailable: ${error.message}`);
      }
    }
  }

  const runId = randomUUID();
  await db.transaction(async (tx) => {
    for (const { line, result } of ranked) {
      await tx
        .update(requestLines)
        // The top offer is pre-selected (spec 0004); the analyst can override it with a reason.
        .set({
          rankingStatus: result.status,
          rankedAt: today,
          selectedOfferId: result.offers[0]?.offerId ?? null,
          overrideReason: null,
        })
        .where(eq(requestLines.id, line.id));
      if (result.offers.length === 0) continue;
      await tx.insert(recommendations).values(
        result.offers.map((o, i) => ({
          runId,
          lineId: line.id,
          offerId: o.offerId,
          rank: i + 1,
          score: o.score,
          breakdown: o.breakdown,
          flags: o.flags,
          explanation: notes.get(o.offerId) ?? null,
          model,
          offerSnapshot: {
            supplierName: o.supplierName,
            supplierCountry: o.supplierCountry,
            unitPrice: o.unitPrice,
            currency: o.currency,
            usdRate: o.usdRate,
            totalUsd: o.totalUsd,
            leadTimeDays: o.leadTimeDays,
            arrivesOn: o.arrivesOn.toISOString().slice(0, 10),
            priceUpdatedAt: o.updatedAt.toISOString(),
            onTimeRate: o.onTimeRate,
            pastDeliveries: o.deliveries.count,
            pastOnTime: o.deliveries.onTime,
            routeRisk: o.routeRisk,
          },
          createdAt: today,
        })),
      );
    }
  });
}
