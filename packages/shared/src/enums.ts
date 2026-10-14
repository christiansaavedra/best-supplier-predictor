import { z } from "zod";

export const ROLES = ["analyst", "manager", "viewer", "admin"] as const;
export const Role = z.enum(ROLES);
export type Role = z.infer<typeof Role>;

export const REQUEST_STATUSES = ["draft", "pending_approval", "approved", "rejected"] as const;
export const RequestStatus = z.enum(REQUEST_STATUSES);
export type RequestStatus = z.infer<typeof RequestStatus>;

export const MATCH_STATUSES = ["matched", "ambiguous", "not_found"] as const;
export const MatchStatus = z.enum(MATCH_STATUSES);
export type MatchStatus = z.infer<typeof MatchStatus>;

export const RANKING_STATUSES = ["ranked", "late", "no_offers"] as const;
export const RankingStatus = z.enum(RANKING_STATUSES);
export type RankingStatus = z.infer<typeof RankingStatus>;

export const APPROVAL_ACTIONS = ["submitted", "approved", "rejected"] as const;
export const ApprovalAction = z.enum(APPROVAL_ACTIONS);
export type ApprovalAction = z.infer<typeof ApprovalAction>;
