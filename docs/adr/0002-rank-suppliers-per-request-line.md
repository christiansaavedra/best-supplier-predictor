# 0002. Rank suppliers per request line

- **Status:** Accepted

## Context

Real B2B purchase requests are baskets (e.g. 50 laptops + 50 docks + 50 monitors). The best supplier for each item may differ, and buying everything from one supplier can still be cheaper overall (shipping, paperwork, volume discounts).

## Decision

A `PurchaseRequest` has many `RequestLine`s. v1 ranks suppliers **independently for each line**. No basket-level optimization.

## Alternatives considered

- **One product per request** — simplest, but does not match how customers actually buy.
- **Basket-level optimization** (pick the supplier combination with the lowest total cost) — turns ranking into an optimization problem that needs shipping and discount data we do not have yet. Planned for a later version.

## Consequences

- Scoring stays simple, testable and explainable per line.
- The analyst may see different suppliers per line and must judge consolidation by hand.
- The schema already supports baskets, so basket-level optimization needs no migration.
