# 0004. Show the ranking and its explanation together

- **Status:** Accepted

## Context

Scores are computed by plain code in milliseconds. The LLM explanation takes a few seconds. We can show scores first and stream the explanation in, or wait and show both at once.

## Decision

Wait and show scores and explanation together, as one result. If the LLM call fails or times out, show the scores with an "explanation unavailable" notice. The LLM never blocks the ranking.

## Alternatives considered

- **Scores first, explanation loads after** — faster first paint, but the analyst may decide before reading the risk flags, and the layout shifts while they read.

## Consequences

- The analyst sees one complete, stable result, including risk flags, before choosing.
- A few seconds of waiting per ranking. Acceptable for a task done a few times a day, not hundreds.
- Needs a timeout and a fallback path in the UI.
