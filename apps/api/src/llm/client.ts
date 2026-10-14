import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

// Every LLM call goes through this module (ADR 0007): one place for models, timeouts and validation.

export const MODELS = {
  extract: process.env.LLM_EXTRACT_MODEL ?? "claude-haiku-5-5",
  explain: process.env.LLM_EXPLAIN_MODEL ?? "claude-sonnet-5-5",
};

const TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 20_000);

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic({ timeout: TIMEOUT_MS, maxRetries: 1 }) : null;

export const isMockAi = () => client === null;

export class LlmError extends Error {}

export async function structuredCall<S extends z.ZodType>(opts: {
  model: string;
  system: string;
  user: string;
  schema: S;
  effort?: "low" | "medium" | "high";
}): Promise<z.infer<S>> {
  if (!client) throw new LlmError("No API key configured");

  let response;
  try {
    response = await client.messages.parse({
      model: opts.model,
      max_tokens: 8000,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
      output_config: { format: zodOutputFormat(opts.schema), effort: opts.effort ?? "low" },
    });
  } catch (error) {
    if (error instanceof Anthropic.APIError) throw new LlmError(`Claude API error ${error.status}: ${error.message}`);
    throw new LlmError(`Claude call failed: ${(error as Error).message}`);
  }

  if (response.stop_reason === "refusal") throw new LlmError("Claude declined the request");
  if (response.stop_reason === "max_tokens") throw new LlmError("Claude response was cut off");
  if (response.parsed_output == null) throw new LlmError("Claude response did not match the schema");
  return response.parsed_output;
}
