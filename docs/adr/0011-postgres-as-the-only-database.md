# 0011. PostgreSQL as the only database

- **Status:** Accepted

## Context

The data is relational (suppliers, products, offers, requests, lines). The team's stack also includes MongoDB and Redis.

## Decision

PostgreSQL for all data; `jsonb` for flexible parts (score breakdown, raw supplier payloads). Redis only as a cache in production (exchange rates, recent rankings). The demo skips Redis.

## Alternatives considered

- **MongoDB for raw supplier data** — nothing here needs a document store; `jsonb` covers it, and one database is simpler to run and back up.

## Consequences

- Joins, constraints and transactions where we need them (approvals, selections).
- Redis is added only when load shows a need.
