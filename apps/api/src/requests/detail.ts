import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { HttpError } from "../auth";
import { db } from "../db/client";
import {
  approvalEvents,
  countries,
  products,
  purchaseRequests,
  recommendations,
  requestLines,
  users,
} from "../db/schema";
import { productLabel } from "../intake/catalog-search";

export async function getRequestDetail(id: number) {
  const [row] = await db
    .select({ request: purchaseRequests, countryName: countries.name, createdByName: users.name })
    .from(purchaseRequests)
    .innerJoin(countries, eq(countries.code, purchaseRequests.countryCode))
    .innerJoin(users, eq(users.id, purchaseRequests.createdBy))
    .where(eq(purchaseRequests.id, id));
  if (!row) throw new HttpError(404, "Request not found");

  const lines = await db
    .select({ line: requestLines, product: products })
    .from(requestLines)
    .leftJoin(products, eq(products.id, requestLines.productId))
    .where(eq(requestLines.requestId, id))
    .orderBy(asc(requestLines.id));

  // Latest ranking run per line (older runs stay in the table as history).
  const recs = lines.length
    ? await db
        .select()
        .from(recommendations)
        .where(
          inArray(
            recommendations.lineId,
            lines.map((l) => l.line.id),
          ),
        )
        .orderBy(desc(recommendations.createdAt), asc(recommendations.rank))
    : [];

  const events = await db
    .select({ event: approvalEvents, userName: users.name })
    .from(approvalEvents)
    .innerJoin(users, eq(users.id, approvalEvents.userId))
    .where(eq(approvalEvents.requestId, id))
    .orderBy(asc(approvalEvents.createdAt), asc(approvalEvents.id));

  return {
    ...row.request,
    countryName: row.countryName,
    createdByName: row.createdByName,
    events: events.map(({ event, userName }) => ({ ...event, userName })),
    lines: lines.map(({ line, product }) => {
      const forLine = recs.filter((r) => r.lineId === line.id);
      const latestRun = forLine[0]?.runId;
      return {
        ...line,
        productLabel: product ? productLabel(product) : null,
        sku: product?.sku ?? null,
        recommendations: forLine
          .filter((r) => r.runId === latestRun)
          .map(({ offerId, rank, score, breakdown, flags, explanation, model, offerSnapshot }) => ({
            offerId,
            rank,
            score,
            breakdown,
            flags,
            explanation,
            model,
            offer: offerSnapshot,
          })),
      };
    }),
  };
}

export async function listRequests() {
  return db
    .select({
      id: purchaseRequests.id,
      status: purchaseRequests.status,
      rawText: purchaseRequests.rawText,
      countryName: countries.name,
      needBy: purchaseRequests.needBy,
      createdAt: purchaseRequests.createdAt,
      createdByName: users.name,
      lineCount: sql<number>`(select count(*)::int from ${requestLines} where ${requestLines.requestId} = ${purchaseRequests.id})`,
    })
    .from(purchaseRequests)
    .innerJoin(countries, eq(countries.code, purchaseRequests.countryCode))
    .innerJoin(users, eq(users.id, purchaseRequests.createdBy))
    .orderBy(desc(purchaseRequests.createdAt));
}
