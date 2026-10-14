# 0013. Weighted score with hard filters

- **Status:** Accepted

## Context

Offers must be ranked on price, lead time, supplier track record and country risk, in a way analysts can trust and we can test.

## Decision

Deterministic code: filter offers that ship to the destination, then score each with a weighted sum of normalized factors: price 45%, track record 30%, lead time 15%, country risk 10%. On-time offers rank first; if none arrive by the need-by date, the fastest are shown flagged "late". Weights live in config.

## Alternatives considered

- **LLM ranks the offers** — not reproducible, not testable, can't be audited.
- **Learned weights (ML)** — no labelled data yet; overrides and snapshots will provide it.

## Consequences

- Same input, same ranking; the breakdown explains every score.
- Weights are a business call and can be tuned without code changes.
