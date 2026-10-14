# 0006. REST API

- **Status:** Accepted

## Context

The API serves a small number of resources (requests, lines, offers, recommendations, approvals) through a linear flow. Each screen needs one or two of them.

## Decision

Expose a REST API, documented with OpenAPI.

## Alternatives considered

- **GraphQL** — strongest when one screen combines many sources with varying shapes, which fits the Customer Portal more than this tool. It adds a schema layer, resolvers and harder HTTP caching for no gain here.

## Consequences

- Simple to build, test, cache and document.
- If a screen later needs data from many resources, we add a dedicated endpoint or revisit GraphQL.
