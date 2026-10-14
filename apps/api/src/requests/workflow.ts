import type { ApprovalAction, RequestStatus } from "@copilot/shared";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { CurrentUser } from "../auth";
import { HttpError } from "../auth";
import { db } from "../db/client";
import { approvalEvents, purchaseRequests, recommendations, requestLines } from "../db/schema";

// Draft -> PendingApproval -> Approved | Rejected -> (edit selections) -> PendingApproval
const EDITABLE: RequestStatus[] = ["draft", "rejected"];

async function loadRequest(id: number) {
  const [request] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, id));
  if (!request) throw new HttpError(404, "Request not found");
  return request;
}

export async function selectOffer(requestId: number, lineId: number, offerId: number, overrideReason: string | null) {
  const request = await loadRequest(requestId);
  if (!EDITABLE.includes(request.status))
    throw new HttpError(409, "Selections can only change on draft or rejected requests");

  const [line] = await db
    .select()
    .from(requestLines)
    .where(and(eq(requestLines.id, lineId), eq(requestLines.requestId, requestId)));
  if (!line) throw new HttpError(404, "Line not found");

  // Only offers from the latest ranking of this line can be selected.
  const recs = await db
    .select({ runId: recommendations.runId, offerId: recommendations.offerId, rank: recommendations.rank })
    .from(recommendations)
    .where(eq(recommendations.lineId, lineId))
    .orderBy(desc(recommendations.createdAt));
  const latest = recs.filter((r) => r.runId === recs[0]?.runId);
  const chosen = latest.find((r) => r.offerId === offerId);
  if (!chosen) throw new HttpError(400, "That offer is not in this line's ranking");

  const isOverride = chosen.rank !== 1;
  if (isOverride && !overrideReason)
    throw new HttpError(400, "Choosing an offer other than the recommended one needs a reason");

  await db
    .update(requestLines)
    .set({ selectedOfferId: offerId, overrideReason: isOverride ? overrideReason : null })
    .where(eq(requestLines.id, lineId));
}

export async function submitRequest(requestId: number, user: CurrentUser) {
  const request = await loadRequest(requestId);
  if (!EDITABLE.includes(request.status)) throw new HttpError(409, "Only draft or rejected requests can be submitted");

  const lines = await db.select().from(requestLines).where(eq(requestLines.requestId, requestId));
  const orderable = lines.filter((l) => l.rankingStatus === "ranked" || l.rankingStatus === "late");
  if (orderable.length === 0) throw new HttpError(409, "No line has a supplier to order from");
  if (orderable.some((l) => l.selectedOfferId === null))
    throw new HttpError(409, "Select a supplier for every ranked line");

  await transition(requestId, EDITABLE, "pending_approval", { userId: user.id, action: "submitted" });
}

export async function decideRequest(
  requestId: number,
  user: CurrentUser,
  action: Extract<ApprovalAction, "approved" | "rejected">,
  comment: string | null,
) {
  const request = await loadRequest(requestId);
  if (request.status !== "pending_approval")
    throw new HttpError(409, "Only requests pending approval can be approved or rejected");

  // Self-approval is allowed in v1 (one manager would otherwise be a bottleneck) but recorded (ADR 0008).
  await transition(requestId, ["pending_approval"], action, {
    userId: user.id,
    action,
    comment,
    selfApproval: request.createdBy === user.id,
  });
}

// The status check is part of the UPDATE, so two people acting at once cannot both succeed.
async function transition(
  requestId: number,
  from: RequestStatus[],
  to: RequestStatus,
  event: { userId: number; action: ApprovalAction; comment?: string | null; selfApproval?: boolean },
) {
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(purchaseRequests)
      .set({ status: to })
      .where(and(eq(purchaseRequests.id, requestId), inArray(purchaseRequests.status, from)))
      .returning({ id: purchaseRequests.id });
    if (updated.length === 0) throw new HttpError(409, "The request changed in the meantime. Reload and try again.");
    await tx.insert(approvalEvents).values({ requestId, ...event });
  });
}
