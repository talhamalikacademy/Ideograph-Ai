import { Schema, Type } from "@google/genai";

/**
 * Escapes unescaped inner double quotes inside string fields (e.g. Urdu/Hindi dialogue quotes)
 * where the model wrote `"audio": "He said "breaking news" to the crowd"`.
 */
function fixUnescapedInnerQuotes(rawJson: string): string {
  // Target known text keys commonly containing conversational or dialogue quotes
  const targetKeys =
    "audio|visual|title|scriptTitle|spokenSentenceInScript|sourceTitle|institutionOrJournal|deepVerificationDetails|context|sourceName|onScreenTitle|editorAnimationNotes|rewriteSuggestion|simpleDefinition|term|contentGoal";

  const keyPattern = new RegExp(
    `("(${targetKeys})")\\s*:\\s*"([\\s\\S]*?)"(?=\\s*(?:,\\s*"|\\s*\\n\\s*["}]|\\s*\\}\\s*,|\\s*\\}\\s*\\]|\\s*\\}))`,
    "g"
  );

  return rawJson.replace(keyPattern, (match, fullKey, _keyName, val) => {
    // If val has unescaped quotes inside it, escape them
    const sanitizedVal = val.replace(/(?<!\\)"/g, '\\"');
    return `${fullKey}: "${sanitizedVal}"`;
  });
}

/**
 * Escapes unescaped control characters (raw newlines, carriage returns, tabs)
 * that reside inside JSON string literals so JSON.parse doesn't choke on them.
 */
function escapeControlCharactersInStrings(str: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (escaped) {
      escaped = false;
      result += ch;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      result += ch;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString) {
      if (ch === "\n") {
        result += "\\n";
      } else if (ch === "\r") {
        result += "\\r";
      } else if (ch === "\t") {
        result += "\\t";
      } else {
        result += ch;
      }
    } else {
      result += ch;
    }
  }

  return result;
}

/**
 * Extracts JSON content from anywhere within markdown code fences or raw text.
 */
function extractJsonCandidate(text: string): string {
  const trimmed = (text || "").trim();
  if (!trimmed) return "";

  // 1. Look for ```json ... ``` or ``` ... ``` anywhere in text
  const fenceMatch =
    trimmed.match(/```json\s*([\s\S]*?)(?:```|$)/i) ||
    trimmed.match(/```\s*([\s\S]*?)(?:```|$)/i);

  let candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  // 2. Find outermost balanced JSON object or array
  const firstBrace = candidate.indexOf("{");
  const firstBracket = candidate.indexOf("[");

  const startIdx =
    firstBrace !== -1 && firstBracket !== -1
      ? Math.min(firstBrace, firstBracket)
      : firstBrace !== -1
      ? firstBrace
      : firstBracket;

  if (startIdx === -1) {
    return candidate;
  }

  const startChar = candidate[startIdx];
  const endChar = startChar === "{" ? "}" : "]";
  const stack: string[] = [startChar];
  let inString = false;
  let escaped = false;
  let endIdx = -1;

  for (let i = startIdx + 1; i < candidate.length; i++) {
    const ch = candidate[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (ch === "{" || ch === "[") {
        stack.push(ch);
      } else if (ch === "}" && stack.length > 0 && stack[stack.length - 1] === "{") {
        stack.pop();
        if (stack.length === 0 && endChar === "}") {
          endIdx = i;
          break;
        }
      } else if (ch === "]" && stack.length > 0 && stack[stack.length - 1] === "[") {
        stack.pop();
        if (stack.length === 0 && endChar === "]") {
          endIdx = i;
          break;
        }
      }
    }
  }

  // If balanced end found, slice off any trailing markdown tables, ledgers, or commentary
  if (endIdx !== -1) {
    return candidate.substring(startIdx, endIdx + 1);
  }

  // If unbalanced (e.g. truncated response), return from startIdx onwards for repair
  return candidate.substring(startIdx);
}

/**
 * Heals truncated JSON by closing open strings, stripping dangling keys/colons/commas,
 * and closing all open arrays and objects in reverse order.
 */
function repairTruncatedJson(str: string): string {
  let inString = false;
  let escaped = false;
  const stack: string[] = [];

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === "{" || ch === "[") {
        stack.push(ch);
      } else if (ch === "}") {
        if (stack.length > 0 && stack[stack.length - 1] === "{") {
          stack.pop();
        }
      } else if (ch === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === "[") {
          stack.pop();
        }
      }
    }
  }

  let repaired = str;
  if (inString) {
    repaired += '"';
  }

  // Remove any trailing incomplete key, colon, or comma
  repaired = repaired.replace(/,\s*(?:"[^"]*"\s*:\s*)?$/, "");
  repaired = repaired.replace(/:\s*$/, ': ""');
  repaired = repaired.replace(/,\s*$/, "");

  // Close remaining open brackets in reverse order
  while (stack.length > 0) {
    const open = stack.pop();
    if (open === "{") repaired += "}";
    else if (open === "[") repaired += "]";
  }

  return repaired;
}

/**
 * Rolls back an incomplete array of items (like segments) to the last fully closed object,
 * then properly closes the array and root object.
 */
function rollbackToLastCompleteSegment(str: string): string | null {
  const segmentsIdx = str.indexOf('"segments"');
  if (segmentsIdx === -1) return null;

  const arrayStart = str.indexOf("[", segmentsIdx);
  if (arrayStart === -1) return null;

  const lastSegmentClose = str.lastIndexOf("}");
  if (lastSegmentClose <= arrayStart) return null;

  const truncatedSlice = str.substring(0, lastSegmentClose + 1);
  return repairTruncatedJson(truncatedSlice);
}

function parseMarkdownToSegments(markdown: string): Array<{ visual: string; audio: string }> {
  const trimmed = (markdown || "").trim();
  if (!trimmed) return [];

  const blocks = trimmed.split(/(?=\[VISUAL\]|Scene\s+\d+|###\s+Scene)/i).filter(Boolean);
  const segments: Array<{ visual: string; audio: string }> = [];

  for (const block of blocks) {
    const visualMatch = block.match(/\[VISUAL\]\s*([\s\S]*?)(?=\n\s*(?:\(AUDIO\)|NARRATION:)|$)/i);
    const audioMatch = block.match(/(?:\(AUDIO\)|NARRATION:)\s*([\s\S]*)$/i);
    const visual = visualMatch ? visualMatch[1].trim() : "Documentary visual b-roll";
    const audio = audioMatch ? audioMatch[1].trim() : block.replace(/\[VISUAL\][^\n]*/i, "").trim();
    if (audio || visual) {
      segments.push({ visual: visual || "Visual b-roll", audio: audio || "" });
    }
  }

  if (segments.length > 0) return segments;

  const paras = trimmed.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  return paras.map((p, idx) => ({
    visual: `Scene ${idx + 1} footage`,
    audio: p
  }));
}

/**
 * Normalizes root structure if the model nested the response under a wrapper key
 * like `metadata`, `script`, or `scriptPackage`, or used alias keys like `scriptTitle` / `scriptMarkdown`.
 */
function normalizeRootObject<T>(obj: any): T {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return obj as T;
  }

  const wrapper =
    (obj.metadata && typeof obj.metadata === "object" ? obj.metadata : null) ||
    (obj.script && typeof obj.script === "object" ? obj.script : null) ||
    (obj.scriptPackage && typeof obj.scriptPackage === "object" ? obj.scriptPackage : null);

  const merged = wrapper ? { ...wrapper, ...obj } : { ...obj };

  if (!merged.title && merged.scriptTitle) {
    merged.title = merged.scriptTitle;
  }

  if ((!merged.segments || !merged.segments.length) && typeof merged.scriptMarkdown === "string") {
    merged.segments = parseMarkdownToSegments(merged.scriptMarkdown);
  }

  return merged as T;
}

/**
 * Extracts and parses a JSON object or array from model output text.
 * Resilient against:
 * - Unescaped quotes in dialogue narration (Urdu/Hindi/English quotes)
 * - Truncated/unclosed markdown code fences
 * - Trailing markdown tables / source ledgers after closing }
 * - Unescaped raw newlines/control characters inside JSON strings
 * - Trailing commas
 * - Cut-off JSON from max_tokens exhaustion
 * - Wrapped metadata objects
 */
export function parseJSON<T = any>(text: string): T {
  if (!text || !text.trim()) {
    return {} as T;
  }

  const extracted = extractJsonCandidate(text);

  // Strategy 1: Direct JSON.parse
  try {
    const parsed = JSON.parse(extracted);
    return normalizeRootObject<T>(parsed);
  } catch {
    // Continue to repair
  }

  // Strategy 2: Fix unescaped dialogue quotes, control characters & trailing commas
  try {
    const withQuotesFixed = fixUnescapedInnerQuotes(extracted);
    const escaped = escapeControlCharactersInStrings(withQuotesFixed);
    const withoutTrailingCommas = escaped.replace(/,\s*([\]}])/g, "$1");
    const parsed = JSON.parse(withoutTrailingCommas);
    return normalizeRootObject<T>(parsed);
  } catch {
    // Continue
  }

  // Strategy 3: Repair truncated JSON (unclosed strings, open stacks)
  try {
    const repaired = repairTruncatedJson(extracted);
    const withQuotesFixed = fixUnescapedInnerQuotes(repaired);
    const escaped = escapeControlCharactersInStrings(withQuotesFixed);
    const withoutTrailingCommas = escaped.replace(/,\s*([\]}])/g, "$1");
    const parsed = JSON.parse(withoutTrailingCommas);
    return normalizeRootObject<T>(parsed);
  } catch {
    // Continue
  }

  // Strategy 4: Roll back to last complete segment in array
  try {
    const rolledBack = rollbackToLastCompleteSegment(extracted);
    if (rolledBack) {
      const withQuotesFixed = fixUnescapedInnerQuotes(rolledBack);
      const escaped = escapeControlCharactersInStrings(withQuotesFixed);
      const withoutTrailingCommas = escaped.replace(/,\s*([\]}])/g, "$1");
      const parsed = JSON.parse(withoutTrailingCommas);
      return normalizeRootObject<T>(parsed);
    }
  } catch {
    // Continue
  }

  // Strategy 5: Resilient regex extraction for title & segments
  try {
    const titleMatch = text.match(/"(?:title|scriptTitle)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i);
    const segmentRegex = /\{\s*"visual"\s*:\s*"([\s\S]*?)"\s*,\s*"audio"\s*:\s*"([\s\S]*?)"\s*\}/gi;
    const extractedSegments: Array<{ visual: string; audio: string }> = [];
    let segMatch: RegExpExecArray | null;

    while ((segMatch = segmentRegex.exec(text)) !== null) {
      extractedSegments.push({
        visual: segMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'),
        audio: segMatch[2].replace(/\\n/g, "\n").replace(/\\"/g, '"')
      });
    }

    if (extractedSegments.length > 0) {
      console.warn(
        `[parseJSON] Recovered ${extractedSegments.length} segments via regex heuristic parser from malformed response.`
      );
      return {
        title: titleMatch ? titleMatch[1] : "Generated Script",
        segments: extractedSegments
      } as unknown as T;
    }
  } catch (extractErr) {
    console.warn("[parseJSON] Regex segment recovery failed:", extractErr);
  }

  console.error(
    "JSON Parse Error. Raw Text Length:",
    text.length,
    "Preview:",
    text.substring(0, 140)
  );
  throw new Error("The AI response was incomplete or invalid JSON. Please try again.");
}

/**
 * Validates that required top-level properties in a Schema exist on the parsed object.
 */
export function validateSchemaShape(data: unknown, schema?: Schema): { valid: boolean; missing: string[] } {
  if (!schema || schema.type !== Type.OBJECT) {
    return { valid: data !== null && data !== undefined, missing: [] };
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, missing: schema.required || [] };
  }
  const record = data as Record<string, unknown>;
  const requiredFields = schema.required || [];
  const missing = requiredFields.filter(key => {
    if (key === "title" && (record["title"] || record["scriptTitle"])) return false;
    if (
      key === "segments" &&
      ((Array.isArray(record["segments"]) && record["segments"].length > 0) || record["scriptMarkdown"])
    ) {
      return false;
    }
    return record[key] === undefined || record[key] === null;
  });
  return { valid: missing.length === 0, missing };
}
