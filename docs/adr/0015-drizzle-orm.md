# 0015. Drizzle ORM

- **Status:** Accepted

## Context

The API needs typed database access and migrations for PostgreSQL.

## Decision

Use Drizzle for schema, queries and migrations.

## Alternatives considered

- **Prisma** — most widely known, but heavier and hides the SQL.
- **Plain SQL with `pg`** — most explicit, but no types and more boilerplate.

## Consequences

- Queries read close to SQL and are fully typed.
- Schema lives in TypeScript and can be shared with validation code.
