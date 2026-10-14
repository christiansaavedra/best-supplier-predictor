# 0003. Ranking and explanation

- **Status:** Draft
- **Related ADRs:** [0004](../adr/0004-show-ranking-and-explanation-together.md), [0012](../adr/0012-store-recommendations-as-snapshots.md), [0013](../adr/0013-weighted-score-with-hard-filters.md)

## Goal

For each line, the analyst sees the top suppliers with scores, a breakdown and a short explanation.

## Requirements

- [ ] Scoring implemented as a pure function in `packages/shared` (or `apps/api`), exactly as the pseudo-code in the proposal, section 6.
- [ ] Vitest unit tests for: weights, normalization with equal values, smoothing, late fallback, no eligible supplier, outdated flag.
- [ ] `POST /requests/:id/rank` scores all lines, then calls Sonnet once for explanations, citing offer IDs.
- [ ] Explanation output validated; cited IDs must be in the top offers, else discarded.
- [ ] LLM timeout or failure → scores shown with "explanation unavailable".
- [ ] Result saved as a snapshot (offer values, scores, explanation, model).
- [ ] UI: per line, top 3 with total in original currency and USD, arrival date, score breakdown, flags (late, outdated, new supplier).

## Out of scope

Basket optimization, shipping and duties, learned weights.
