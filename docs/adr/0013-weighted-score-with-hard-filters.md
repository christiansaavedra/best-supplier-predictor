# 0013. Weighted score with hard filters

- **Status:** Accepted

## Context

Offers must be ranked on price, lead time, supplier track record and country risk, in a way analysts can trust and we can test.

## Decision

Deterministic code: filter offers that ship to the destination, then score each with a weighted sum: price 45%, track record 30%, lead time 15%, country risk 10%. On-time offers rank first; if none arrive by the need-by date, the fastest are shown flagged "late".

Price and lead time are scored against the best on-time offer:

- **Price:** loses its whole score at 30% above the cheapest (5% above = 0.83).
- **Lead time:** loses its whole score at 10 days slower than the fastest.

Weights and both caps live in config.

## Alternatives considered

- **LLM ranks the offers** — not reproducible, not testable, can't be audited.
- **Learned weights (ML)** — no labelled data yet; overrides and snapshots will provide it.
- **Min-max scaling** (cheapest = 1, most expensive = 0) — the first version. A unit test showed that with two offers, $100 at 50% on time beat $105 at 95% on time, because a 5% gap became the full price weight.
- **Ratio to the best** (cheapest ÷ price) — so gentle that lead time dominates.

## Consequences

- Same input, same ranking; the breakdown explains every score.
- A small price gap stays small, however many offers there are.
- Weights and caps are business calls and can be tuned without code changes.
