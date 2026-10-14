# 0014. Mock LLM fallback

- **Status:** Accepted

## Context

Reviewers run the demo locally. An Anthropic API key may be missing, revoked or out of credit.

## Decision

If no key is set or the call fails, the LLM client returns canned responses for the seed scenarios, and the UI shows a "Mock AI" badge.

## Alternatives considered

- **Key required** — the demo breaks if the key stops working during review.

## Consequences

- The demo always runs with `docker compose up`.
- Mock responses only cover the seeded examples; other inputs return a clear "mock mode" message.
