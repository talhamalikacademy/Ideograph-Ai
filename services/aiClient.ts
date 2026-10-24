import { createGeminiClient } from "../llm";

export function getAiClient(apiKey?: string) {
  return createGeminiClient(apiKey);
}

export function isAbortError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { name?: string; message?: string };
  return (
    anyErr.name === "AbortError" ||
    Boolean(anyErr.message && /aborted|abort/i.test(anyErr.message))
  );
}

export function cleanAndParseJSON<T = any>(rawText: string): T {
  const trimmed = (rawText || "").trim();
  if (!trimmed) return {} as T;
  const cleaned = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        return {} as T;
      }
    }
    return {} as T;
  }
}
