# Docs

The deliverable is [`proposal.md`](proposal.md); ADRs are its appendix.

| Folder             | What lives there                                                                                   | When it is written                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`adr/`](adr/)     | Architecture Decision Records: one decision per file, with context, alternatives and consequences. | When a decision with trade-offs is made. Edited in place if the decision changes. |
| [`specs/`](specs/) | Feature specs: what to build, acceptance criteria, what is out of scope.                           | Before building a feature. Updated if scope changes.                              |

## Flow

1. **Decide** → write an ADR (`adr/NNNN-title.md`, from [`adr/0000-template.md`](adr/0000-template.md)).
2. **Specify** → write a spec (`specs/NNNN-title.md`, from [`specs/0000-template.md`](specs/0000-template.md)) that links to the ADRs it depends on.
3. **Build** → the spec is the prompt context for the AI assistant. Code is reviewed against the acceptance criteria.

## Index

### ADRs

| #                                                                 | Title                                                | Status   |
| ----------------------------------------------------------------- | ---------------------------------------------------- | -------- |
| [0001](adr/0001-record-architecture-decisions.md)                 | Record architecture decisions                        | Accepted |
| [0002](adr/0002-rank-suppliers-per-request-line.md)               | Rank suppliers per request line                      | Accepted |
| [0003](adr/0003-free-text-intake-constrained-to-catalog.md)       | Free-text request intake, constrained to the catalog | Accepted |
| [0004](adr/0004-show-ranking-and-explanation-together.md)         | Show the ranking and its explanation together        | Accepted |
| [0005](adr/0005-nextjs-frontend-and-express-api-in-a-monorepo.md) | Next.js frontend and Express API in a monorepo       | Accepted |
| [0006](adr/0006-rest-api.md)                                      | REST API                                             | Accepted |
| [0007](adr/0007-two-tier-llm-with-claude.md)                      | Two-tier LLM usage with Claude                       | Accepted |
| [0008](adr/0008-google-sso-and-role-based-access.md)              | Google SSO and role-based access                     | Accepted |
| [0009](adr/0009-supplier-data-via-background-sync.md)             | Supplier data via background sync                    | Accepted |
| [0010](adr/0010-gcp-cloud-run-terraform-github-actions.md)        | GCP with Cloud Run, Terraform and GitHub Actions     | Accepted |
| [0011](adr/0011-postgres-as-the-only-database.md)                 | PostgreSQL as the only database                      | Accepted |
| [0012](adr/0012-store-recommendations-as-snapshots.md)            | Store recommendations as snapshots                   | Accepted |
| [0013](adr/0013-weighted-score-with-hard-filters.md)              | Weighted score with hard filters                     | Accepted |
| [0014](adr/0014-mock-llm-fallback.md)                             | Mock LLM fallback                                    | Accepted |
| [0015](adr/0015-drizzle-orm.md)                                   | Drizzle ORM                                          | Accepted |

### Specs

| #                                                 | Title                       | Status |
| ------------------------------------------------- | --------------------------- | ------ |
| [0001](specs/0001-project-setup-and-seed-data.md) | Project setup and seed data | Draft  |
| [0002](specs/0002-free-text-intake.md)            | Free-text intake            | Built  |
| [0003](specs/0003-ranking-and-explanation.md)     | Ranking and explanation     | Built  |
| [0004](specs/0004-selection-and-approval.md)      | Selection and approval      | Built  |
