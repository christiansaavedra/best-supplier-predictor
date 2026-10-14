# 0005. Next.js frontend and Express API in a monorepo

- **Status:** Accepted

## Context

The copilot needs a UI for analysts and managers, and a backend that holds the scoring logic and talks to the database and the LLM. Other surfaces (Customer Portal, internal tools) may later need the same supplier and pricing data.

## Decision

A monorepo with:

- `apps/web` — Next.js (TypeScript) frontend.
- `apps/api` — Node.js API with Express (TypeScript).
- `packages/shared` — types and validation schemas used by both.

## Alternatives considered

- **Next.js only, with its API routes** — less to build and deploy, but business logic is tied to the frontend and harder to reuse from other surfaces.
- **NestJS or Fastify instead of Express** — NestJS adds structure that a small service does not need yet; Fastify is faster, but Express is the most widely known and enough for this load.

## Consequences

- Scoring and data access live in one service any surface can call.
- Shared schemas keep the frontend and API in sync at compile time.
- Two deployable services instead of one.
