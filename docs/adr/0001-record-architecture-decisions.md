# 0001. Record architecture decisions

- **Status:** Accepted

## Context

The team is small and works with AI coding assistants every day. Decisions made in chat or in someone's head get lost, and an AI assistant has no memory of why the code looks the way it does. We need a cheap way to keep the reasoning next to the code.

## Decision

Record every decision that has real trade-offs as a short ADR in `docs/adr/`, and write a spec in `docs/specs/` before building each feature. Specs link to the ADRs they rely on and serve as the context for AI-assisted code generation.

## Alternatives considered

- **No written decisions** — fastest at first, but the reasoning is lost and AI output drifts from the intended design.
- **A single long design document** — harder to keep current, and it hides when and why each decision changed.

## Consequences

- Reviewers and new team members can read why the system looks the way it does.
- AI-generated code can be checked against written acceptance criteria instead of memory.
- Small overhead per decision. We keep ADRs to one page and only write them for decisions with real trade-offs.
