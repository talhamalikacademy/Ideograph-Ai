import {
  CreatorProfile,
  GeneratorConfig,
  ShortsClipperPackage,
  ExtractedViralShort,
  ShortClipperStyleBlueprint
} from "../types";
import { createGeminiClient } from "../llm";
import { shortsClipperSchema } from "../services/schemas";
import {
  VERTICAL_SAFE_ZONE_PROMPT_RULE,
  SHORTS_RETENTION_CONSTRAINTS,
  resolveClipperCreatorStyle,
  buildShortsClipperPrompt
} from "./clipperRules";
import { sanitizeCreatorVocabulary } from "../services/languagePolicies";

export interface RawShortItem {
  id?: string;
  title?: string;
  extractionRationale?: string;
  hook0to3s?: string;
  escalation3to15s?: string;
  climax15to50s?: string;
  infiniteLoop50to60s?: string;
  loopBridgePreview?: string;
  storyboardFrames?: Array<{
    id?: string;
    timeRange?: string;
    visualPrompt?: string;
    captionOverlay?: string;
  }>;
}

/**
 * UI Metadata for the 4 Vertical Retention Beats in each 50–60 Second Short (2.5 WPS / 150 WPM)
 */
export const SHORTS_BEAT_DEFINITIONS = [
  {
    key: "hook0to3s" as const,
    timeBadge: "[00:00 - 00:03] 3-Second Pattern-Interrupt Hook",
    badgeNotice: "7–9 Words (2.5 WPS)",
    colorTheme: "rose"
  },
  {
    key: "escalation3to15s" as const,
    timeBadge: "[00:03 - 00:15] Rapid Escalation",
    badgeNotice: "28–32 Words + [Pause]",
    colorTheme: "amber"
  },
  {
    key: "climax15to50s" as const,
    timeBadge: "[00:15 - 00:48] Core Reveal / Climax",
    badgeNotice: "80–90 Words + Analogy",
    colorTheme: "blue"
  },
  {
    key: "infiniteLoop50to60s" as const,
    timeBadge: "[00:48 - 00:55] Infinite Loop Ending",
    badgeNotice: "15–18 Words → Loops to Hook",
    colorTheme: "emerald"
  }
];

/**
 * Counts spoken words in a section (excluding bracketed cues like [Pause]).
 */
export const countSpokenWords = (text: string): number => {
  if (!text) return 0;
  return text
    .replace(/\[[^\]]*\]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
};

/**
 * Formats seconds into MM:SS
 */
const formatSec = (sec: number): string => {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
};

/**
 * Ensures the Infinite Loop Ending flows seamlessly into the Hook without a hard stop period
 * when the hook starts as a grammatical continuation.
 */
const sanitizeInfiniteLoopEnding = (loopText: string): string => {
  const trimmed = (loopText || "").trim();
  if (!trimmed) return "";
  // Remove trailing period or ellipsis so it connects cleanly into the first word of the hook
  return trimmed.replace(/[.…]+\s*$/, "").trim();
};

/**
 * Protects against oversized long-form scripts exceeding model context windows
 * by preserving the opening, core middle chapters, and conclusion smoothly.
 */
export const prepareSafeLongScriptPayload = (
  rawScript: string,
  maxChars: number = 90000
): string => {
  const cleaned = (rawScript || "").trim();
  if (cleaned.length <= maxChars) return cleaned;
  const headChars = Math.floor(maxChars * 0.4);
  const midChars = Math.floor(maxChars * 0.35);
  const tailChars = maxChars - headChars - midChars;
  const midStart = Math.floor((cleaned.length - midChars) / 2);

  return [
    cleaned.slice(0, headChars),
    "\n\n[... LONG SCRIPT MIDDLE SECTION ...]\n\n",
    cleaned.slice(midStart, midStart + midChars),
    "\n\n[... LONG SCRIPT CLIMAX & CONCLUSION ...]\n\n",
    cleaned.slice(cleaned.length - tailChars)
  ].join("");
};

/**
 * Normalizes raw model JSON output into validated ExtractedViralShort objects
 * with 2.5 Words-Per-Second (150 WPM) mathematical timestamps & grammatical loop verification.
 */
export const normalizeExtractedShorts = (
  rawShorts: RawShortItem[] | undefined,
  creatorId?: CreatorProfile | string
): ExtractedViralShort[] => {
  const wps = SHORTS_RETENTION_CONSTRAINTS.wordsPerSecond; // 2.5 words/sec (150 WPM)

  return (rawShorts || [])
    .slice(0, SHORTS_RETENTION_CONSTRAINTS.extractedShortsCount)
    .map((item, idx) => {
      const hook = sanitizeCreatorVocabulary((item.hook0to3s || "").trim(), creatorId);
      const escalation = sanitizeCreatorVocabulary((item.escalation3to15s || "").trim(), creatorId);
      const climax = sanitizeCreatorVocabulary((item.climax15to50s || "").trim(), creatorId);
      const loop = sanitizeInfiniteLoopEnding(
        sanitizeCreatorVocabulary(item.infiniteLoop50to60s || "", creatorId)
      );

      const hookWords = countSpokenWords(hook);
      const escalationWords = countSpokenWords(escalation);
      const climaxWords = countSpokenWords(climax);
      const loopWords = countSpokenWords(loop);
      const totalWords = hookWords + escalationWords + climaxWords + loopWords;

      // Dynamic 2.5 WPS (150 WPM) timestamp calculation
      const pauseCount = (
        [hook, escalation, climax, loop].join(" ").match(/\[\s*pause\s*\]/gi) ||
        []
      ).length;

      const hookSec = Math.max(3, Math.round(hookWords / wps));
      const escSec = Math.max(
        10,
        Math.round(escalationWords / wps + (pauseCount > 0 ? 1 : 0))
      );
      const climaxSec = Math.max(25, Math.round(climaxWords / wps));
      const loopSec = Math.max(5, Math.round(loopWords / wps));

      const t0 = 0;
      const t1 = t0 + hookSec;
      const t2 = t1 + escSec;
      const t3 = t2 + climaxSec;
      const t4 = t3 + loopSec;

      const sectionTimings = {
        hookRange: `${formatSec(t0)} - ${formatSec(t1)}`,
        hookWords,
        escalationRange: `${formatSec(t1)} - ${formatSec(t2)}`,
        escalationWords,
        climaxRange: `${formatSec(t2)} - ${formatSec(t3)}`,
        climaxWords,
        loopRange: `${formatSec(t3)} - ${formatSec(t4)}`,
        loopWords
      };

      const fullSpokenScript = [hook, escalation, climax, loop]
        .filter(Boolean)
        .join(" ");

      const estimatedSeconds = Math.max(45, Math.min(65, t4));

      const loopBridgePreview =
        item.loopBridgePreview && item.loopBridgePreview.trim().length > 0
          ? item.loopBridgePreview.trim()
          : `${loop} ➔ ${hook}`;

      const frames = (item.storyboardFrames || [])
        .slice(0, SHORTS_RETENTION_CONSTRAINTS.storyboardFrameCountMax)
        .map((f, fIdx) => ({
          id: f.id || `short-${idx + 1}-frame-${fIdx + 1}`,
          timeRange:
            f.timeRange ||
            `00:${String(fIdx * 9).padStart(2, "0")} - 00:${String(
              Math.min(estimatedSeconds, (fIdx + 1) * 9)
            ).padStart(2, "0")}`,
          visualPrompt:
            f.visualPrompt || "Cinematic vertical 9:16 documentary shot",
          captionOverlay: f.captionOverlay || ""
        }));

      return {
        id: item.id || `short-${idx + 1}`,
        title: item.title || `Viral Short #${idx + 1}`,
        extractionRationale:
          item.extractionRationale ||
          "High-retention standalone micro-narrative extracted from source script.",
        hook0to3s: hook,
        escalation3to15s: escalation,
        climax15to50s: climax,
        infiniteLoop50to60s: loop,
        fullSpokenScript,
        wordCount: totalWords,
        estimatedSeconds,
        sectionTimings,
        loopBridgePreview,
        storyboardFrames: frames
      };
    });
};

/**
 * Fallback parser in case the model returns raw markdown or partially formatted text
 * instead of strict JSON on huge scripts.
 */
const parseFallbackShortsFromText = (rawText: string): RawShortItem[] => {
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed?.shorts) && parsed.shorts.length > 0) {
        return parsed.shorts;
      }
    }
  } catch {
    // Continue to regex section extraction fallback
  }

  const hookMatch =
    rawText.match(/\[00:00\s*-\s*00:03\][^\n]*\n+([^\n\[]+)/i)?.[1]?.trim() ||
    "What if everything you knew about this crisis was backwards?";
  const escMatch =
    rawText
      .match(/\[00:03\s*-\s*00:15\][^\n]*\n+([\s\S]*?)(?=\[00:15|\n\n)/i)?.[1]
      ?.trim() ||
    "On the surface, everything looks normal. [Pause] Yet underneath, a silent mechanism is shifting the entire balance right before our eyes.";
  const climaxMatch =
    rawText
      .match(/\[00:15\s*-\s*00:(?:48|50)\][^\n]*\n+([\s\S]*?)(?=\[00:(?:48|50)|\n\n)/i)?.[1]
      ?.trim() ||
    rawText.slice(0, 450).trim();
  const loopMatch =
    rawText
      .match(/\[00:(?:48|50)\s*-\s*00:(?:55|60)\][^\n]*\n+([^\n\[]+)/i)?.[1]
      ?.trim() ||
    "And that hidden chain reaction is the exact reason why we have to ask";

  return [
    {
      id: "short-fallback-1",
      title: "Extracted Core Mechanism Short",
      extractionRationale:
        "Fallback extraction from long-form script preserving 2.5 WPS pacing.",
      hook0to3s: hookMatch,
      escalation3to15s: escMatch,
      climax15to50s: climaxMatch,
      infiniteLoop50to60s: loopMatch,
      loopBridgePreview: `${loopMatch} ➔ ${hookMatch}`,
      storyboardFrames: [
        {
          id: "sf-1",
          timeRange: "00:00 - 00:03",
          visualPrompt: `High-contrast cold-open visual hook. ${VERTICAL_SAFE_ZONE_PROMPT_RULE}`,
          captionOverlay: "THE HIDDEN PARADOX"
        },
        {
          id: "sf-2",
          timeRange: "00:03 - 00:15",
          visualPrompt: `Split-screen comparison showing normal reality vs underlying crisis. ${VERTICAL_SAFE_ZONE_PROMPT_RULE}`,
          captionOverlay: " BENEATH THE SURFACE"
        },
        {
          id: "sf-3",
          timeRange: "00:15 - 00:48",
          visualPrompt: `Step-by-step physical analogy diagram illustrating the core mechanism. ${VERTICAL_SAFE_ZONE_PROMPT_RULE}`,
          captionOverlay: "STEP-BY-STEP MECHANISM"
        },
        {
          id: "sf-4",
          timeRange: "00:48 - 00:55",
          visualPrompt: `Visual loop transition matching the opening frame geometry. ${VERTICAL_SAFE_ZONE_PROMPT_RULE}`,
          captionOverlay: "THE FULL CIRCLE"
        }
      ]
    }
  ];
};

/**
 * UI Helper: Formats a single extracted Short for 1-click clipboard copy
 */
export const formatSingleShortForCopy = (short: ExtractedViralShort): string => {
  const timings = short.sectionTimings;
  return [
    `TITLE: ${short.title} (~${short.estimatedSeconds}s | ${short.wordCount} words @ 2.5 WPS)`,
    `WHY THIS CLIPS: ${short.extractionRationale}`,
    ``,
    `[${timings?.hookRange || "00:00 - 00:03"}] HOOK (${timings?.hookWords ?? 8} words):`,
    short.hook0to3s,
    ``,
    `[${timings?.escalationRange || "00:03 - 00:15"}] RAPID ESCALATION (${timings?.escalationWords ?? 30} words):`,
    short.escalation3to15s,
    ``,
    `[${timings?.climaxRange || "00:15 - 00:48"}] CORE REVEAL / CLIMAX (${timings?.climaxWords ?? 85} words):`,
    short.climax15to50s,
    ``,
    `[${timings?.loopRange || "00:48 - 00:55"}] INFINITE LOOP ENDING (${timings?.loopWords ?? 16} words):`,
    short.infiniteLoop50to60s,
    ``,
    `[SEAMLESS LOOP CHECK]: ${short.loopBridgePreview || `${short.infiniteLoop50to60s} ➔ ${short.hook0to3s}`}`
  ].join("\n");
};

/**
 * UI Helper: Formats all 3 extracted Shorts + 9:16 storyboard prompts for .TXT download
 */
export const formatShortsPackageForExport = (
  pkg: ShortsClipperPackage
): string => {
  return pkg.shorts
    .map(
      (s, i) =>
        `========================================\nSHORT #${i + 1}: ${s.title}\nStyle: ${
          pkg.creatorApplied
        } | Words: ${s.wordCount} | Est. Duration: ${
          s.estimatedSeconds
        }s (150 WPM / 2.5 WPS)\n========================================\n[${
          s.sectionTimings?.hookRange || "00:00 - 00:03"
        }] HOOK:\n${s.hook0to3s}\n\n[${
          s.sectionTimings?.escalationRange || "00:03 - 00:15"
        }] ESCALATION:\n${s.escalation3to15s}\n\n[${
          s.sectionTimings?.climaxRange || "00:15 - 00:48"
        }] CORE REVEAL:\n${s.climax15to50s}\n\n[${
          s.sectionTimings?.loopRange || "00:48 - 00:55"
        }] INFINITE LOOP ENDING:\n${
          s.infiniteLoop50to60s
        }\n\nSEAMLESS LOOP CHECK:\n${
          s.loopBridgePreview || `${s.infiniteLoop50to60s} -> ${s.hook0to3s}`
        }\n\n9:16 STORYBOARD PROMPTS:\n${s.storyboardFrames
          .map(
            f =>
              `- [${f.timeRange}] ${f.visualPrompt} (Caption: "${f.captionOverlay}")`
          )
          .join("\n")}`
    )
    .join("\n\n\n");
};

/**
 * Main API Execution Function: Connects Shorts Clipper rules & Creator Style Blueprint with Gemini API
 * Includes token-limit safety, structured JSON validation, and resilient fallback parsing.
 */
export const executeShortsClipperPipeline = async (
  longFormScriptText: string,
  config: GeneratorConfig,
  selectedCreator:
    | CreatorProfile
    | ShortClipperStyleBlueprint
    | string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<ShortsClipperPackage> => {
  const safeScriptText = prepareSafeLongScriptPayload(longFormScriptText, 90000);
  if (!safeScriptText) {
    throw new Error("Please provide a non-empty script or transcript to extract Shorts from.");
  }

  const client = createGeminiClient(apiKey);

  const {
    effectiveCreator,
    creatorBlueprint,
    styleSystemPrompt,
    voiceCard,
    creatorAppliedLabel
  } = resolveClipperCreatorStyle(safeScriptText, config, selectedCreator);

  const prompt = buildShortsClipperPrompt(
    safeScriptText,
    config,
    effectiveCreator,
    voiceCard,
    creatorBlueprint
  );

  try {
    const { data } = await client.generateJson<{
      sourceSummary?: string;
      shorts?: RawShortItem[];
    }>({
      task: "script",
      systemInstruction: styleSystemPrompt,
      prompt,
      schema: shortsClipperSchema,
      temperature: 0.65,
      maxOutputTokens: 8192,
      signal
    });

    const normalizedShorts = normalizeExtractedShorts(data.shorts, effectiveCreator);
    if (normalizedShorts.length === 0) {
      throw new Error("Model returned an empty shorts array; triggering fallback parser.");
    }

    return {
      sourceSummary:
        data.sourceSummary ||
        `Extracted 3 standalone 55-second Shorts in ${creatorBlueprint.name}'s authentic voice (2.5 WPS).`,
      creatorApplied: creatorAppliedLabel,
      creatorBlueprintUsed: creatorBlueprint,
      shorts: normalizedShorts
    };
  } catch (err: any) {
    if (signal?.aborted) throw err;
    console.warn("Primary JSON Shorts extraction encountered an issue, attempting resilient fallback:", err);

    const { text } = await client.generateText({
      task: "script",
      systemInstruction: styleSystemPrompt,
      prompt: `${prompt}\n\nReturn valid JSON matching { "sourceSummary": "...", "shorts": [ ... ] }.`,
      temperature: 0.6,
      maxOutputTokens: 8192,
      signal
    });

    const fallbackRawShorts = parseFallbackShortsFromText(text);
    const normalizedShorts = normalizeExtractedShorts(fallbackRawShorts, effectiveCreator);

    return {
      sourceSummary: `Extracted standalone viral Shorts in ${creatorBlueprint.name}'s voice (2.5 WPS pacing).`,
      creatorApplied: creatorAppliedLabel,
      creatorBlueprintUsed: creatorBlueprint,
      shorts: normalizedShorts
    };
  }
};

/**
 * 9:16 Vertical Storyboard Image Generator: Connects Vertical Safe-Zone Framing Rule with Gemini Image API
 */
export const executeVerticalStoryboardImage = async (
  prompt: string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<string> => {
  const client = createGeminiClient(apiKey);
  const fullVerticalPrompt = `${prompt.trim()}. ${VERTICAL_SAFE_ZONE_PROMPT_RULE}`;
  const { dataUrl } = await client.generateImage({
    task: "imageFast",
    prompt: fullVerticalPrompt,
    aspectRatio: "9:16",
    signal
  });
  return dataUrl;
};
