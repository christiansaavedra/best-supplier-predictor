import { APPROVAL_ACTIONS, MATCH_STATUSES, RANKING_STATUSES, REQUEST_STATUSES, ROLES } from "@copilot/shared";
import {
  boolean,
  char,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ROLES);
export const requestStatusEnum = pgEnum("request_status", REQUEST_STATUSES);
export const matchStatusEnum = pgEnum("match_status", MATCH_STATUSES);
export const rankingStatusEnum = pgEnum("ranking_status", RANKING_STATUSES);
export const approvalActionEnum = pgEnum("approval_action", APPROVAL_ACTIONS);

const id = () => integer().primaryKey().generatedAlwaysAsIdentity();
const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();

// Catalog and suppliers

export const countries = pgTable("countries", {
  code: char({ length: 2 }).primaryKey(),
  name: text().notNull(),
});

export const users = pgTable("users", {
  id: id(),
  name: text().notNull(),
  email: text().notNull().unique(),
  role: roleEnum().notNull(),
  countryCode: char({ length: 2 })
    .notNull()
    .references(() => countries.code),
});

export const suppliers = pgTable("suppliers", {
  id: id(),
  name: text().notNull(),
  countryCode: char({ length: 2 })
    .notNull()
    .references(() => countries.code),
});

export const products = pgTable("products", {
  id: id(),
  sku: text().notNull().unique(),
  brand: text().notNull(),
  category: text().notNull(),
  model: text().notNull(),
});

// Price and lead time differ by destination, so an offer is per supplier + product + country.
export const supplierOffers = pgTable(
  "supplier_offers",
  {
    id: id(),
    supplierId: integer()
      .notNull()
      .references(() => suppliers.id),
    productId: integer()
      .notNull()
      .references(() => products.id),
    destinationCountryCode: char({ length: 2 })
      .notNull()
      .references(() => countries.code),
    unitPrice: numeric({ precision: 14, scale: 2, mode: "number" }).notNull(),
    currency: char({ length: 3 }).notNull(),
    leadTimeDays: integer().notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull(),
  },
  (t) => [
    unique().on(t.supplierId, t.productId, t.destinationCountryCode),
    index().on(t.productId, t.destinationCountryCode),
  ],
);

export const deliveryRecords = pgTable(
  "delivery_records",
  {
    id: id(),
    supplierId: integer()
      .notNull()
      .references(() => suppliers.id),
    countryCode: char({ length: 2 })
      .notNull()
      .references(() => countries.code),
    promisedDate: date().notNull(),
    deliveredDate: date(),
    issue: text(),
  },
  (t) => [index().on(t.supplierId, t.countryCode)],
);

export const exchangeRates = pgTable("exchange_rates", {
  currency: char({ length: 3 }).primaryKey(),
  usdRate: numeric({ precision: 14, scale: 8, mode: "number" }).notNull(),
  asOf: date().notNull(),
});

// Maintained by operations: customs and cross-border complexity per route, 0 (none) to 1 (high).
export const routeRisks = pgTable(
  "route_risks",
  {
    originCountryCode: char({ length: 2 })
      .notNull()
      .references(() => countries.code),
    destinationCountryCode: char({ length: 2 })
      .notNull()
      .references(() => countries.code),
    risk: numeric({ precision: 3, scale: 2, mode: "number" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.originCountryCode, t.destinationCountryCode] })],
);

// Requests

export const purchaseRequests = pgTable("purchase_requests", {
  id: id(),
  rawText: text().notNull(),
  countryCode: char({ length: 2 })
    .notNull()
    .references(() => countries.code),
  needBy: date().notNull(),
  status: requestStatusEnum().notNull().default("draft"),
  createdBy: integer()
    .notNull()
    .references(() => users.id),
  createdAt: createdAt(),
});

export const requestLines = pgTable("request_lines", {
  id: id(),
  requestId: integer()
    .notNull()
    .references(() => purchaseRequests.id, { onDelete: "cascade" }),
  description: text().notNull(),
  productId: integer().references(() => products.id),
  quantity: integer().notNull(),
  matchStatus: matchStatusEnum().notNull(),
  selectedOfferId: integer().references(() => supplierOffers.id),
  overrideReason: text(),
  // Set when the line is ranked; null means not ranked yet (or not in the catalog).
  rankingStatus: rankingStatusEnum(),
  rankedAt: timestamp({ withTimezone: true }),
});

// Snapshot of one ranking: offer values, scores and explanation as the analyst saw them.
export const recommendations = pgTable("recommendations", {
  id: id(),
  runId: uuid().notNull(),
  lineId: integer()
    .notNull()
    .references(() => requestLines.id, { onDelete: "cascade" }),
  offerId: integer()
    .notNull()
    .references(() => supplierOffers.id),
  rank: integer().notNull(),
  score: numeric({ precision: 6, scale: 4, mode: "number" }),
  breakdown: jsonb(),
  flags: text().array().notNull().default([]),
  offerSnapshot: jsonb().notNull(),
  explanation: text(),
  model: text(),
  createdAt: createdAt(),
});

export const approvalEvents = pgTable("approval_events", {
  id: id(),
  requestId: integer()
    .notNull()
    .references(() => purchaseRequests.id, { onDelete: "cascade" }),
  userId: integer()
    .notNull()
    .references(() => users.id),
  action: approvalActionEnum().notNull(),
  comment: text(),
  selfApproval: boolean().notNull().default(false),
  createdAt: createdAt(),
});
