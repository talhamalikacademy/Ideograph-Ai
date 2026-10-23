import { Schema, GenerateContentResponse } from "@google/genai";
import { Citation } from "../types";
import { GroundedSource } from "./LLMClient";
import { createGeminiClient, extractGroundingSources } from "./GeminiClient";

export type { GroundedSource };

/**
 * Sanitizes model-returned citations against verified web URLs from Google Search grounding metadata.
 * Strips any ungrounded or hallucinated URLs produced by the model.
 */
export function sanitizeCitationsFromSources(
  rawCitations: Citation[] | undefined,
  groundedUrls: GroundedSource[]
): Citation[] {
  if (!Array.isArray(rawCitations)) return [];

  return rawCitations.map((cite, idx) => {
    const rawUrl = typeof cite.url === "string" ? cite.url.trim() : "";
    const matchingGrounded =
      groundedUrls.find(g => g.uri === rawUrl) ||
      groundedUrls.find(
        g =>
          cite.sourceName &&
          g.title.toLowerCase().includes(cite.sourceName.toLowerCase().slice(0, 18))
      );

    const verifiedUrl = matchingGrounded?.uri;
    const isVerified = Boolean(verifiedUrl);

    return {
      id: cite.id || String(idx + 1),
      type: cite.type || "Research",
      sourceName: cite.sourceName || matchingGrounded?.title || "Primary Reference",
      context: cite.context || "Referenced in script analysis.",
      reliabilityScore: isVerified
        ? cite.reliabilityScore || "High"
        : cite.reliabilityScore === "High"
          ? "Medium"
          : cite.reliabilityScore || "Medium",
      isVerified,
      url: verifiedUrl
    };
  });
}

/**
 * Backward-compatible helper accepting a raw GenerateContentResponse.
 */
export function sanitizeCitationsWithGrounding(
  rawCitations: Citation[] | undefined,
  response?: GenerateContentResponse
): Citation[] {
  const sources = response ? extractGroundingSources(response) : [];
  return sanitizeCitationsFromSources(rawCitations, sources);
}

export async function runGroundedJson<T>(options: {
  prompt: string;
  schema: Schema;
  apiKey?: string;
  systemInstruction?: string;
  signal?: AbortSignal;
}): Promise<{ data: T; sources: GroundedSource[]; modelUsed: string }> {
  const client = createGeminiClient(options.apiKey);
  return client.generateGroundedJson<T>({
    prompt: options.prompt,
    schema: options.schema,
    systemInstruction: options.systemInstruction,
    signal: options.signal
  });
}
