import type { DraftLine, ParseResult } from "@copilot/shared";
import { asc } from "drizzle-orm";
import { db } from "../db/client";
import { countries, products } from "../db/schema";
import { isMockAi, LlmError } from "../llm/client";
import { searchCatalog } from "./catalog-search";
import { extractMock, extractWithClaude, pickMock, pickWithClaude, type Extraction } from "./llm-steps";

const MANUAL_ENTRY = "Fill in the form by hand.";

export async function parseRequest(text: string): Promise<ParseResult> {
  const today = new Date();
  const [catalog, countryRows] = await Promise.all([
    db.select().from(products).orderBy(asc(products.id)),
    db.select().from(countries),
  ]);
  const categories = [...new Set(catalog.map((p) => p.category))];

  let mockAi = isMockAi();
  let warning: string | null = null;

  // 1. Extract fields. Claude, else the canned demo response, else an empty form.
  let extraction: Extraction | null = null;
  if (!mockAi) {
    try {
      extraction = await extractWithClaude(text, { today, countries: countryRows, categories });
    } catch (error) {
      if (!(error instanceof LlmError)) throw error;
      console.warn(error.message);
      extraction = extractMock(text, today);
      mockAi = extraction !== null;
      warning = `The AI service is unavailable. ${extraction ? "Showing the demo response." : MANUAL_ENTRY}`;
    }
  } else {
    extraction = extractMock(text, today);
    if (!extraction)
      warning = `Mock AI only understands the demo requests. Add an API key to try your own text, or ${MANUAL_ENTRY.toLowerCase()}`;
  }

  if (!extraction) return { countryCode: null, needBy: null, lines: [], mockAi, warning };

  // 2. Search the catalog in code. No results means not found, without asking the LLM.
  const searched = extraction.lines.map((line) => ({
    description: line.description,
    quantity: Math.max(1, line.quantity),
    candidates: searchCatalog(catalog, line),
  }));

  // 3. Pick among the results. Claude when available; the deterministic rule otherwise.
  const withCandidates = searched.filter((l) => l.candidates.length > 0);
  let picks = pickMock(withCandidates);
  if (!mockAi && withCandidates.length > 0) {
    try {
      picks = await pickWithClaude(withCandidates);
    } catch (error) {
      if (!(error instanceof LlmError)) throw error;
      console.warn(error.message);
      mockAi = true;
      warning = "The AI service is unavailable. Products were matched by catalog search only.";
    }
  }

  const lines: DraftLine[] = searched.map((line) => {
    const pick = line.candidates.length > 0 ? picks[withCandidates.indexOf(line)]! : null;
    const candidates = line.candidates.map(({ id, sku, label }) => ({ id, sku, label }));
    if (!pick || pick.decision === "no_match")
      return { ...line, candidates, matchStatus: "not_found", productId: null };
    return { ...line, candidates, matchStatus: pick.decision, productId: pick.productId };
  });

  const countryCode = countryRows.some((c) => c.code === extraction.country_code) ? extraction.country_code : null;
  const needBy =
    extraction.need_by &&
    /^\d{4}-\d{2}-\d{2}$/.test(extraction.need_by) &&
    !Number.isNaN(Date.parse(extraction.need_by))
      ? extraction.need_by
      : null;

  return { countryCode, needBy, lines, mockAi, warning };
}
