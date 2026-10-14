# 0001. Project setup and seed data

- **Status:** Built
- **Related ADRs:** [0005](../adr/0005-nextjs-frontend-and-express-api-in-a-monorepo.md), [0011](../adr/0011-postgres-as-the-only-database.md), [0015](../adr/0015-drizzle-orm.md)

## Goal

A reviewer clones the repo, runs one command, and has the app working with realistic data.

## Requirements

- [x] pnpm monorepo: `apps/web`, `apps/api`, `packages/shared`.
- [x] `docker compose up` starts Postgres, API and web; runs migrations and seed.
- [x] `.env.example` documents `ANTHROPIC_API_KEY` (optional).
- [x] README: how to run, demo scenarios. (Test command added with spec 0003.)
- [x] Seed covers these scenarios:
  - **Clear winner:** cheap, reliable, on time.
  - **Cheapest is unreliable:** lowest price, poor on-time rate, loses to a slightly pricier reliable one.
  - **No offer on time:** late fallback.
  - **New supplier:** 1 of 1 deliveries on time; smoothing keeps it from the top.
  - **Outdated price:** offer older than 30 days.
  - **Not in catalog:** e.g. Dell laptops, no Dell products.
- [x] Seed size: ~5 countries (US, MX, CO, BR, CL), ~8 suppliers, ~20 products, ~3 users (analyst, manager, viewer).

## Notes

- Postgres is exposed on host port 5433 to avoid clashing with a local Postgres.

## Out of scope

Redis, cloud deployment, CI files, real auth.
