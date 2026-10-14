# 0002. Free-text intake

- **Status:** Draft
- **Related ADRs:** [0003](../adr/0003-free-text-intake-constrained-to-catalog.md), [0007](../adr/0007-two-tier-llm-with-claude.md), [0014](../adr/0014-mock-llm-fallback.md)

## Goal

The analyst pastes a request and gets an editable draft with lines matched to real products.

## Requirements

- [ ] `POST /requests/parse` takes text, returns country, need-by date and lines.
- [ ] Haiku extracts fields with a JSON schema; output validated with zod.
- [ ] Code searches the catalog per line; Haiku picks one of the returned IDs or `no_match`. Any ID not in the results is rejected.
- [ ] Each line shows a status: matched, ambiguous, not found.
- [ ] Analyst can edit fields, change the product, or remove lines before creating the request.
- [ ] Not-found lines are saved for the unmatched-demand metric.
- [ ] Mock mode returns canned results for the seeded examples, with a "Mock AI" badge.

## Out of scope

Multi-turn chat, file/email attachments.
