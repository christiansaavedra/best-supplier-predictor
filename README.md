# Supplier Copilot

Recommends the best supplier for each IT hardware purchase request. Ranking is done by deterministic code; an LLM reads the free-text request and explains the result.

- **Proposal:** [`docs/proposal.md`](docs/proposal.md)
- **Decisions (ADRs) and specs:** [`docs/`](docs/)

## Run it

Requires [Docker](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up --build
```

Open http://localhost:3000. The first start builds the images and loads the demo data (about 2 minutes).

### With real AI (optional, recommended)

Without an API key, the app uses canned AI responses for the demo scenarios and shows a **Mock AI** badge. To use Claude:

```bash
cp .env.example .env
```

Set `ANTHROPIC_API_KEY` in `.env`, then run `docker compose up` again.

### Reset the demo data

```bash
docker compose down -v
```

## Demo scenarios

The **New request** page has a _Demo scenarios_ panel with three prepared requests: click **Try it** to run one. The seed data is built so each case below can be seen in the app.

| Scenario                      | Where                                 | What to look for                                                            |
| ----------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| Cheapest supplier loses       | ThinkPad T14 to Colombia              | MegaByte is cheapest but has a 55% on-time record, so it ranks below Andes. |
| New supplier                  | ThinkPad T14 to Colombia              | NovaLink has 1 of 1 deliveries on time. Smoothing keeps it from the top.    |
| Clear winner + outdated price | Lenovo USB-C Dock to Colombia         | Andes wins. Pacific is cheapest but its price is 45 days old.               |
| Nothing arrives on time       | MacBook Air M3 to Chile within a week | Fastest offers shown, flagged as late.                                      |
| Not in catalog                | Any Dell product                      | Shown as not found.                                                         |
| Ambiguous match               | "ThinkPads"                           | Matches more than one model; the analyst picks.                             |

### Try the approval flow

Use **Acting as** in the header to switch between Ana (analyst), Martín (manager) and Sofía (viewer, read-only):

1. As Ana, create a request. The recommended supplier is pre-selected per line; choosing another asks for a reason. Submit it.
2. As Martín, approve it, or send it back with a comment.
3. The audit trail at the bottom of the request records every step, including self-approvals.

## Tests

```bash
pnpm test
```

Unit tests for the scoring formula live in `apps/api/src/ranking/scoring.test.ts`.

Lint and format:

```bash
pnpm lint
pnpm format
```

## Local development (without Docker for the apps)

Requires Node 22+ and pnpm.

```bash
cp .env.example .env
docker compose up -d db
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev
```

The database is exposed on port **5433** to avoid clashing with a local Postgres.

## Structure

```
apps/web         Next.js frontend
apps/api         Express API, Drizzle schema, migrations, seed
packages/shared  Types and validation shared by both
docs/            Proposal, ADRs, specs
```
