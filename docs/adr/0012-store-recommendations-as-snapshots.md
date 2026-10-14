# 0012. Store recommendations as snapshots

- **Status:** Accepted

## Context

Prices and lead times change between the analyst's ranking and the manager's approval.

## Decision

Each ranking is saved with the offer values, scores, breakdown, explanation and model version at that moment.

## Alternatives considered

- **Recompute on view** — less storage, but the manager may approve something different from what the analyst saw, and decisions can't be audited later.

## Consequences

- Approvals and audits see exactly what was decided on.
- Snapshot data grows with use; old snapshots can be archived.
- Snapshots also become the training data for learned weights later.
