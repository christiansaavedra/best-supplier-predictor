# 0003. Free-text request intake, constrained to the catalog

- **Status:** Accepted

## Context

Analysts receive requests as free text (customer emails, quotes). Typing them into a form is slow. But free text can ask for products no supplier offers (e.g. "Dell laptops" when no supplier lists Dell), and an LLM may invent a matching product.

## Decision

The analyst can write the request in free text. The flow is:

1. The LLM extracts structured fields per line (brand, category, model, quantity, country, need-by date).
2. Plain code searches the catalog with those fields.
3. The LLM may only pick a product from the search results, or return `no_match`. It never creates a product ID.
4. The analyst reviews and edits the filled form before submitting.

Lines with `no_match` or ambiguous matches are shown explicitly in the UI and logged.

## Alternatives considered

- **Structured form only** — no hallucination risk and less to build, but slower for the analyst and leaves a visible AI use case unused.
- **LLM maps text to products freely** — fastest to build, but it can return products that do not exist.

## Consequences

- The LLM is limited to choosing among real catalog results. A wrong choice is visible in the form before submit.
- Unmatched demand becomes a data signal (products customers want that no supplier offers).
- More states to design in the UI: matched, ambiguous, not found.
