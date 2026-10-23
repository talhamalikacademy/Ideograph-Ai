import { CreatorProfile, ScriptSegment } from "../types";
import { verifyCreatorContextIntegrity } from "../creator-intelligence/CreatorIntegrityGuard";
import { compileCreatorVoiceCard } from "../creator-intelligence/CreatorDNA";
import { createGeminiClient } from "../llm";
import { findLeakedPlaceholders } from "./scriptService";

/**
 * Parses Canvas plain text or `[VISUAL] ... \n (AUDIO) ...` blocks back into structured ScriptSegments
 * so edits made inside Canvas Mode stay synchronized with ScriptEditor segments, heuristics, and exports.
 */
export function parseCanvasTextToSegments(
  canvasText: string,
  existingSegments: ScriptSegment[] = []
): ScriptSegment[] {
  const trimmed = (canvasText || "").trim();
  if (!trimmed) return existingSegments;

  // Check if text uses [VISUAL] / (AUDIO) markers
  const hasMarkers = /\[VISUAL\]|\(AUDIO\)/i.test(trimmed);
  if (hasMarkers) {
    const blocks = trimmed
      .split(/(?=\[VISUAL\])/i)
      .map(b => b.trim())
      .filter(Boolean);

    const parsed: ScriptSegment[] = [];
    blocks.forEach((block, idx) => {
      const visualMatch = block.match(/\[VISUAL\]\s*([\s\S]*?)(?=\n\s*\(AUDIO\)|$)/i);
      const audioMatch = block.match(/\(AUDIO\)\s*([\s\S]*)$/i);

      const visual = (visualMatch ? visualMatch[1] : existingSegments[idx]?.visual || "Scene continuation").trim();
      const audio = (audioMatch ? audioMatch[1] : block.replace(/\[VISUAL\][^\n]*/i, "")).trim();

      if (visual || audio) {
        const leaked = [
          ...findLeakedPlaceholders(audio),
          ...findLeakedPlaceholders(visual)
        ];
        parsed.push({
          ...existingSegments[idx],
          visual: visual || "Visual scene cue",
          audio: audio || "",
          leakedPlaceholders: leaked.length > 0 ? Array.from(new Set(leaked)) : undefined
        });
      }
    });

    if (parsed.length > 0) {
      return parsed;
    }
  }

  // Fallback: split plain text by double newlines into paragraphs and map to segments
  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return existingSegments;

  return paragraphs.map((para, idx) => {
    const existing = existingSegments[idx];
    const cleanedAudio = para.replace(/^\(AUDIO\)\s*/i, "").trim();
    const leaked = findLeakedPlaceholders(cleanedAudio);
    return {
      ...existing,
      visual: existing?.visual || `Scene ${idx + 1}: Visual accompaniment for narration`,
      audio: cleanedAudio,
      leakedPlaceholders: leaked.length > 0 ? leaked : undefined
    };
  });
}

// --- MODULE 1: CHANGE TONE ---
export const changeScriptTone = async (
  scriptText: string,
  targetTone: string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<string> => {
  const client = createGeminiClient(apiKey);

  const prompt = `
    ROLE: Master Script Editor.
    TASK: Rewrite the following script to have a "${targetTone}" tone.
    
    [ALGORITHMIC RULES]
    1. ANALYZE the current emotional weight and rhythm.
    2. TRANSFORM the vocabulary and sentence structure to match "${targetTone}".
    3. CONSTRAINT: You MUST preserve the original paragraph structure, [VISUAL] and (AUDIO) markers (if present), argument order, and factual details. Do not summarize. Do not add new facts.
    4. GOAL: The output must feel like the exact same script, just spoken by someone with a different emotional intent.
    
    INPUT SCRIPT:
    """
    ${scriptText}
    """
    
    OUTPUT:
    Return ONLY the rewritten script text. No meta-commentary.
  `;

  const { text } = await client.generateText({
    task: 'script',
    prompt,
    temperature: 0.7,
    signal
  });

  return text || scriptText;
};

// --- MODULE 2: CHANGE STYLE ---
export const changeScriptStyle = async (
  scriptText: string,
  targetCreator: CreatorProfile,
  apiKey?: string,
  signal?: AbortSignal
): Promise<string> => {
  verifyCreatorContextIntegrity(targetCreator);
  const client = createGeminiClient(apiKey);
  const voiceCard = compileCreatorVoiceCard(targetCreator);

  const prompt = `
    ROLE: Ghostwriter for ${targetCreator.name}.
    TASK: Rewrite the provided script to match the complete stylistic DNA of ${targetCreator.name}.
    
    ${voiceCard}
    
    [EXECUTION RULES]
    1. ABSORB the input script's topic and key arguments.
    2. REWRITE it as if ${targetCreator.name} is speaking it. Follow their Hook Style, Body Structure, Pacing, Emotional Range, and Closing Style.
    3. Preserve [VISUAL] and (AUDIO) segment markers if present in the input so the script structure stays intact.
    4. INTEGRATE their signature phrases and vocabulary naturally where appropriate.
    5. OBEY all Forbidden Patterns for ${targetCreator.name}.
    6. PRESERVE factual truth. Do not hallucinate new data points, but reframe existing ones through ${targetCreator.name}'s research lens (${targetCreator.bio.research.methodology}).
    
    INPUT SCRIPT:
    """
    ${scriptText}
    """
    
    OUTPUT:
    Return ONLY the rewritten script text.
  `;

  const { text } = await client.generateText({
    task: 'script',
    prompt,
    temperature: 0.7,
    signal
  });

  return text || scriptText;
};

// --- MODULE 3: SUMMARIZE SCRIPT ---
export const summarizeScript = async (
  scriptText: string,
  length: 'Short' | 'Medium' | 'Detailed',
  apiKey?: string,
  signal?: AbortSignal
): Promise<string> => {
  const client = createGeminiClient(apiKey);

  const lengthInstructions = {
    Short: "Condense to the absolute core hook and conclusion. Max 150 words.",
    Medium: "Retain main arguments but remove examples and fluff. Approx 50% of original.",
    Detailed: "Keep all distinct points but tighten phrasing. Approx 80% of original."
  };

  const prompt = `
    ROLE: Executive Script Editor.
    TASK: Condense the script based on the following constraint: ${lengthInstructions[length]}
    
    [LOGIC]
    1. IDENTIFY the narrative arc (Beginning -> Middle -> End).
    2. STRIP away repetition, filler words, and secondary elaborations.
    3. PRESERVE narrative continuity and [VISUAL] / (AUDIO) segment markers if present. The output must be a coherent, read-aloud script, NOT a bulleted list.
    4. TONE: Keep the original intent, just sharper.
    
    INPUT SCRIPT:
    """
    ${scriptText}
    """
    
    OUTPUT:
    Return ONLY the condensed script text.
  `;

  const { text } = await client.generateText({
    task: 'script',
    prompt,
    temperature: 0.65,
    signal
  });

  return text || scriptText;
};

// --- MODULE 4: EXTEND WITH QUESTIONS ---
export const extendScriptWithQuestions = async (
  scriptText: string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<string> => {
  const client = createGeminiClient(apiKey);

  const prompt = `
    ROLE: Socratic Engagement Engine.
    TASK: Deepen the following script by appending or weaving in 3-4 profound, relevant questions.
    
    [BEHAVIOR]
    1. ANALYZE the script's central theme and conclusion.
    2. GENERATE questions that:
       - Challenge the viewer's assumptions.
       - Encourage self-reflection.
       - Open a "loop" for future thought.
    3. INTEGRATION: Add these questions naturally, preserving [VISUAL] and (AUDIO) formatting if present in the input script.
    4. Do NOT change the original text substantially, primarily ADD to it.
    
    INPUT SCRIPT:
    """
    ${scriptText}
    """
    
    OUTPUT:
    Return the full script with the new questions integrated.
  `;

  const { text } = await client.generateText({
    task: 'script',
    prompt,
    temperature: 0.7,
    signal
  });

  return text || scriptText;
};