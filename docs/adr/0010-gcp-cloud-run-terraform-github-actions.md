# 0010. GCP with Cloud Run, Terraform and GitHub Actions

- **Status:** Accepted

## Context

The team runs on GCP with Docker and CI/CD, and is small: no time to operate clusters.

## Decision

- **Hosting:** web and API on Cloud Run; Cloud SQL (Postgres); Memorystore (Redis); Secret Manager; supplier sync as a Cloud Run job triggered by Cloud Scheduler.
- **IaC:** Terraform, one module per environment (staging, production).
- **CI/CD:** GitHub Actions. PR → lint, type check, tests. Merge to `main` → build one image, run migrations, deploy to staging. Manual approval → same image to production.

## Alternatives considered

- **GKE** — Kubernetes is overkill for two services.
- **Vercel for the web app** — great Next.js hosting, but adds a second provider and splits networking and secrets.
- **Pulumi** — TypeScript is nice, but Terraform is the more common standard.
- **Preview environment per PR** — useful later; extra cost and setup for v1.

## Consequences

- No servers to manage; services scale to zero when idle.
- The image tested in staging is the one that reaches production.
