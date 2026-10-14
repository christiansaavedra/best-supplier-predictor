import type { ApprovalAction, MatchStatus, ProductOption, RankingStatus, RequestStatus, Role } from "@copilot/shared";

export type User = { id: number; name: string; role: Role; countryCode: string };

export type Catalog = { products: ProductOption[]; countries: { code: string; name: string }[] };

export type Flag = "late" | "price_outdated" | "new_supplier";

export type Recommendation = {
  offerId: number;
  rank: number;
  score: number | null;
  breakdown: { price: number; track: number; lead: number; risk: number } | null;
  flags: Flag[];
  explanation: string | null;
  model: string | null;
  offer: {
    supplierName: string;
    supplierCountry: string;
    unitPrice: number;
    currency: string;
    totalUsd: number;
    leadTimeDays: number;
    arrivesOn: string;
    onTimeRate: number;
    pastDeliveries: number;
    pastOnTime?: number; // missing in snapshots saved before it was added
  };
};

export type RequestLine = {
  id: number;
  description: string;
  quantity: number;
  matchStatus: MatchStatus;
  productLabel: string | null;
  sku: string | null;
  rankingStatus: RankingStatus | null;
  selectedOfferId: number | null;
  overrideReason: string | null;
  recommendations: Recommendation[];
};

export type ApprovalEvent = {
  id: number;
  userName: string;
  action: ApprovalAction;
  comment: string | null;
  selfApproval: boolean;
  createdAt: string;
};

export type RequestDetail = {
  id: number;
  rawText: string;
  countryCode: string;
  countryName: string;
  needBy: string;
  status: RequestStatus;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  lines: RequestLine[];
  events: ApprovalEvent[];
};

export type RequestSummary = {
  id: number;
  status: RequestStatus;
  rawText: string;
  countryName: string;
  needBy: string;
  createdAt: string;
  createdByName: string;
  lineCount: number;
};
