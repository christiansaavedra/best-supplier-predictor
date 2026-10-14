# 0009. Supplier data via background sync

- **Status:** Accepted

## Context

Supplier catalogs, prices, lead times and delivery history must reach Postgres. Each supplier shares data differently (API, CSV, email). Uploading data is not an analyst task.

## Decision

One connector per supplier maps its data to our offer format. A scheduled job validates and upserts it; invalid rows are rejected and logged. Every offer stores `updated_at`. No upload UI.

v1 demo: mock JSON already loaded in the database; connectors are designed, not built.

## Alternatives considered

- **Manual upload UI** — puts data entry on staff and is error-prone.

## Consequences

- New suppliers need a connector; the rest of the system is unchanged.
- Stale offers can be detected and flagged in scoring.
