import { z } from "zod";
import { MatchStatus } from "./enums";

// POST /requests/parse

export const ParseRequestBody = z.object({ text: z.string().trim().min(1).max(5000) });

export const ProductOption = z.object({ id: z.number(), sku: z.string(), label: z.string() });
export type ProductOption = z.infer<typeof ProductOption>;

export const DraftLine = z.object({
  description: z.string(),
  quantity: z.number().int().positive(),
  matchStatus: MatchStatus,
  productId: z.number().nullable(),
  candidates: z.array(ProductOption),
});
export type DraftLine = z.infer<typeof DraftLine>;

export const ParseResult = z.object({
  countryCode: z.string().nullable(),
  needBy: z.string().nullable(),
  lines: z.array(DraftLine),
  mockAi: z.boolean(),
  warning: z.string().nullable(),
});
export type ParseResult = z.infer<typeof ParseResult>;

// POST /requests

export const CreateRequestBody = z.object({
  rawText: z.string().trim().min(1),
  countryCode: z.string().length(2),
  needBy: z.iso.date(),
  lines: z
    .array(
      z.discriminatedUnion("matchStatus", [
        z.object({
          matchStatus: z.literal("matched"),
          description: z.string(),
          quantity: z.number().int().positive(),
          productId: z.number(),
        }),
        z.object({
          matchStatus: z.literal("not_found"),
          description: z.string(),
          quantity: z.number().int().positive(),
          productId: z.null(),
        }),
      ]),
    )
    .min(1),
});
export type CreateRequestBody = z.infer<typeof CreateRequestBody>;

// PATCH /requests/:id/lines/:lineId — pick an offer; any offer but the top one needs a reason.

export const SelectOfferBody = z.object({
  offerId: z.number().int(),
  overrideReason: z.string().trim().max(500).nullable(),
});
export type SelectOfferBody = z.infer<typeof SelectOfferBody>;

// POST /requests/:id/reject

export const RejectBody = z.object({ comment: z.string().trim().min(1, "A comment is required").max(1000) });
