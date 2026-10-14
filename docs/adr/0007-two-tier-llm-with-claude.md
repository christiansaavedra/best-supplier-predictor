# 0007. Two-tier LLM usage with Claude

- **Status:** Accepted

## Context

The LLM does two different jobs: extracting fields from free text (frequent, simple, must be fast and cheap) and explaining a ranking with risk flags (less frequent, needs better reasoning). Both must return structured output we can validate.

## Decision

Use Anthropic Claude in two tiers:

- **Claude Haiku** for extraction and catalog-match selection.
- **Claude Sonnet** for ranking explanations.

Both are called with a JSON schema for the output (tool use / structured output), and every response is validated before use. Model IDs live in config, so a tier can be swapped without code changes.

## Alternatives considered

- **One model for everything** — simpler, but either overpays for extraction or under-serves explanations.
- **OpenAI** — comparable capabilities and structured output support. Claude chosen for its strong instruction following on constrained output and a clear small/large model pair.
- **Self-hosted open model** — more control over data, but hosting and quality work a small team should not take on in v1.

## Consequences

- Cost and latency stay low on the frequent call.
- Calls go through one small client wrapper (timeout, retries, schema validation, logging), so changing provider later touches one module.
- Supplier data is sent to an external provider; see the security risks in the proposal.
