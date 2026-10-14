# 0003. Ranking and explanation

- **Status:** Built
- **Related ADRs:** [0004](../adr/0004-show-ranking-and-explanation-together.md), [0012](../adr/0012-store-recommendations-as-snapshots.md), [0013](../adr/0013-weighted-score-with-hard-filters.md)

## Goal

For each line, the analyst sees the top suppliers with scores, a breakdown and a short explanation.

## Requirements

- [x] Scoring implemented as a pure function in `packages/shared` (or `apps/api`), as the pseudo-code in the proposal, section 6.
- [x] Vitest unit tests for: weights, normalization with equal values, smoothing, late fallback, no eligible supplier, outdated flag.
- [x] `POST /requests/:id/rank` scores all lines, then calls Sonnet once for explanations, citing offer IDs.
- [x] Explanation output validated; cited IDs must be in the top offers, else discarded.
- [x] LLM timeout or failure → scores shown with "explanation unavailable".
- [x] Result saved as a snapshot (offer values, scores, explanation, model).
- [x] UI: per line, top 3 with total in original currency and USD, arrival date, score breakdown, flags (late, outdated, new supplier).

## Notes

- Lines store a ranking status (`ranked`, `late`, `no_offers`) so the UI can tell "not ranked yet" from "no supplier ships this".
- Creating a request ranks it right away. If that first run fails, the page offers "Rank suppliers". Re-ranking with newer prices is out of v1.
- Mock mode builds explanations from the score breakdown with a template.
- The row shows the raw delivery record (19 of 20); the "Delivery record" bar shows the smoothed value.

## Out of scope

Basket optimization, shipping and duties, learned weights.
