import { CreateRequestBody, ParseRequestBody, RejectBody, SelectOfferBody } from "@copilot/shared";
import { eq, inArray } from "drizzle-orm";
import { Router } from "express";
import { HttpError, requireRole } from "../auth";
import { db } from "../db/client";
import { products, purchaseRequests, requestLines } from "../db/schema";
import { parseRequest } from "../intake/parse";
import { rankRequest } from "../ranking/rank-request";
import { getRequestDetail, listRequests } from "../requests/detail";
import { decideRequest, selectOffer, submitRequest } from "../requests/workflow";

export const requestsRouter = Router();

requestsRouter.get("/me", (req, res) => {
  res.json(req.user);
});

requestsRouter.post("/requests/parse", requireRole("analyst", "manager"), async (req, res) => {
  const { text } = ParseRequestBody.parse(req.body);
  res.json(await parseRequest(text));
});

requestsRouter.post("/requests", requireRole("analyst", "manager"), async (req, res) => {
  const body = CreateRequestBody.parse(req.body);

  const productIds = body.lines.flatMap((l) => (l.productId === null ? [] : [l.productId]));
  if (productIds.length > 0) {
    const found = await db.select({ id: products.id }).from(products).where(inArray(products.id, productIds));
    if (found.length !== new Set(productIds).size) throw new HttpError(400, "Unknown product");
  }

  const id = await db.transaction(async (tx) => {
    const [request] = await tx
      .insert(purchaseRequests)
      .values({ rawText: body.rawText, countryCode: body.countryCode, needBy: body.needBy, createdBy: req.user.id })
      .returning({ id: purchaseRequests.id });
    await tx.insert(requestLines).values(body.lines.map((l) => ({ ...l, requestId: request!.id })));
    return request!.id;
  });

  res.status(201).json({ id });
});

requestsRouter.get("/requests", async (_req, res) => {
  res.json(await listRequests());
});

requestsRouter.get("/requests/:id", async (req, res) => {
  res.json(await getRequestDetail(Number(req.params.id)));
});

requestsRouter.post("/requests/:id/rank", requireRole("analyst", "manager"), async (req, res) => {
  const id = Number(req.params.id);
  const [request] = await db.select().from(purchaseRequests).where(eq(purchaseRequests.id, id));
  if (!request) throw new HttpError(404, "Request not found");
  if (request.status !== "draft") throw new HttpError(409, "Only draft requests can be ranked");
  await rankRequest(id);
  res.json(await getRequestDetail(id));
});

requestsRouter.patch("/requests/:id/lines/:lineId", requireRole("analyst", "manager"), async (req, res) => {
  const { offerId, overrideReason } = SelectOfferBody.parse(req.body);
  const id = Number(req.params.id);
  await selectOffer(id, Number(req.params.lineId), offerId, overrideReason || null);
  res.json(await getRequestDetail(id));
});

requestsRouter.post("/requests/:id/submit", requireRole("analyst", "manager"), async (req, res) => {
  const id = Number(req.params.id);
  await submitRequest(id, req.user);
  res.json(await getRequestDetail(id));
});

requestsRouter.post("/requests/:id/approve", requireRole("manager"), async (req, res) => {
  const id = Number(req.params.id);
  await decideRequest(id, req.user, "approved", null);
  res.json(await getRequestDetail(id));
});

requestsRouter.post("/requests/:id/reject", requireRole("manager"), async (req, res) => {
  const id = Number(req.params.id);
  const { comment } = RejectBody.parse(req.body);
  await decideRequest(id, req.user, "rejected", comment);
  res.json(await getRequestDetail(id));
});
