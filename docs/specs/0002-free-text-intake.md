# 0002. Free-text intake

- **Status:** Built
- **Related ADRs:** [0003](../adr/0003-free-text-intake-constrained-to-catalog.md), [0007](../adr/0007-two-tier-llm-with-claude.md), [0014](../adr/0014-mock-llm-fallback.md)

## Goal

The analyst pastes a request and gets an editable draft with lines matched to real products.

## Requirements

- [x] `POST /requests/parse` takes text, returns country, need-by date and lines.
- [x] Haiku extracts fields with a JSON schema; output validated with zod.
- [x] Code searches the catalog per line; Haiku picks one of the returned IDs or `no_match`. Any ID not in the results is rejected.
- [x] Each line shows a status: matched, ambiguous, not found.
- [x] Analyst can edit fields, change the product, or remove lines before creating the request.
- [x] Not-found lines are saved with the request (for the unmatched-demand metric) and skipped in ranking. Ambiguous lines must be resolved before creating the request.
- [x] If the LLM fails, the analyst gets an empty form to fill in by hand.
- [x] Mock mode returns canned results for the seeded examples, with a "Mock AI" badge.
- [x] Demo panel (collapsible, open by default) with 3 "Try it" requests that fill the text box, each saying what to look for.

## Notes

- Catalog search is an in-memory token match over the demo catalog; production would use Postgres full-text or trigram search.
- If Claude picks a product ID outside the search results, it is rejected and the line becomes "pick a product".
- If the pick step fails, the deterministic rule is used: a single best search result is a match, a tie is ambiguous.

## Out of scope

Multi-turn chat, file/email attachments.
