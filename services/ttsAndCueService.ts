import { CreatorProfile, ScriptData, SpokenRuntimeMetrics } from "../types";
import { createGeminiClient } from "../llm";
import { sfxMapperSchema } from "./schemas";

/**
 * Strips all non-spoken bracketed directions such as [SFX: ...], [BGM: ...], [Visual: ...], [PAUSE], etc.
 * Ensures TTS engines and spoken word counters never read sound effect or camera cues aloud.
 */
export const stripAudioCuesAndBrackets = (rawText: string): string => {
  if (!rawText) return "";
  return rawText
    .replace(/\[\s*(?:SFX|BGM|MUSIC|VISUAL|B-ROLL|CUT|BEAT|PAUSE|وقفہ|CAMERA|TEXT|CUES?|CLAIM|PAPER|INFOGRAPHIC)[^\]]*\]/gi, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Formats seconds into MM:SS
 */
export const formatSecondsToMMSS = (totalSeconds: number): string => {
  const clamped = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

/**
 * MODULE 2.3: Down-to-the-Second Runtime & Cadence Parser
 * - Strips out all non-spoken text inside brackets ([SFX: ...], [BGM: ...], [Visual: ...])
 * - Base speed = Selected Creator's natural speaking rate (default 145 WPM, scaled by speedMultiplier 0.8x - 1.5x)
 * - Adds +0.4 seconds for every comma (,) and em-dash (—)
 * - Adds +0.8 seconds for every period (.), question mark (?), or exclamation mark (!)
 * - Adds +1.5 seconds for paragraph/scene breaks or explicit [Pause] tags
 */
export const calculateExactSpokenRuntime = (
  segments: Array<{ audio?: string }>,
  speedMultiplier: number = 1.0,
  baseCreatorWpm: number = 145
): SpokenRuntimeMetrics => {
  const effectiveWpm = Math.max(80, Math.round(baseCreatorWpm * speedMultiplier));
  let totalSpokenWords = 0;
  let totalCommasAndDashes = 0;
  let totalSentenceEnds = 0;
  let totalParagraphAndPauseTags = 0;
  let cumulativeSeconds = 0;

  const sceneTimings = (segments || []).map((seg, idx) => {
    const rawAudio = seg.audio || "";
    const explicitPauseMatches = rawAudio.match(/\[\s*(?:PAUSE|BEAT|وقفہ)[^\]]*\]/gi);
    const explicitPauseCount = explicitPauseMatches ? explicitPauseMatches.length : 0;

    const cleanText = stripAudioCuesAndBrackets(rawAudio);
    const words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
    const commasAndDashes = (cleanText.match(/[,،—–]/g) || []).length;
    const sentenceEnds = (cleanText.match(/[.!?؟।]/g) || []).length;
    const paragraphBreaks = (rawAudio.match(/\n\s*\n/g) || []).length + (idx > 0 ? 1 : 0);
    const pauseCount = explicitPauseCount + paragraphBreaks;

    const baseWordSeconds = (words / effectiveWpm) * 60;
    const cadencePauseSeconds =
      (commasAndDashes * 0.4 + sentenceEnds * 0.8 + pauseCount * 1.5) / speedMultiplier;

    const durationSeconds = Math.max(1.5, Number((baseWordSeconds + cadencePauseSeconds).toFixed(2)));
    const startSecond = Number(cumulativeSeconds.toFixed(2));
    cumulativeSeconds += durationSeconds;
    const endSecond = Number(cumulativeSeconds.toFixed(2));

    totalSpokenWords += words;
    totalCommasAndDashes += commasAndDashes;
    totalSentenceEnds += sentenceEnds;
    totalParagraphAndPauseTags += pauseCount;

    return {
      sceneIndex: idx,
      cleanText,
      wordCount: words,
      durationSeconds,
      startSecond,
      endSecond
    };
  });

  const totalEstimatedSeconds = Math.round(cumulativeSeconds);

  return {
    spokenWords: totalSpokenWords,
    baseWpm: baseCreatorWpm,
    effectiveWpm,
    commaAndDashCount: totalCommasAndDashes,
    sentenceEndCount: totalSentenceEnds,
    paragraphAndPauseCount: totalParagraphAndPauseTags,
    totalEstimatedSeconds,
    formattedRuntime: formatSecondsToMMSS(totalEstimatedSeconds),
    sceneTimings
  };
};

/**
 * MODULE 2.2: Google Gemini 3.8 Flash TTS Cloud Synthesis (`gemini-3.8-flash-tts`)
 * Passes natural vocal delivery instructions derived from the cloned creator's persona
 * and strips all [SFX: ...] and [BGM: ...] cues before synthesis.
 */
export const synthesizeScratchVoiceoverWithGemini = async (
  segments: Array<{ audio?: string }>,
  creator: CreatorProfile,
  voiceName: string = "Kore",
  apiKey?: string,
  signal?: AbortSignal
): Promise<{ audioDataUrl: string; base64Audio: string; mimeType: string; modelUsed: string }> => {
  const client = createGeminiClient(apiKey);
  const cleanSpokenParagraphs = segments
    .map(s => stripAudioCuesAndBrackets(s.audio || ""))
    .filter(Boolean);

  const spokenScript = cleanSpokenParagraphs.join("\n\n");
  const styleDirection = `Narrate in ${creator.name}'s ${creator.bio.voice.tone} documentary style (${creator.bio.voice.pacing}) with clear emphasis on numbers, evidence, and rhetorical questions.`;

  return client.generateSpeech({
    text: spokenScript.slice(0, 8000),
    voiceName,
    styleDirection,
    signal
  });
};

export interface InlineAudioToken {
  type: "text" | "sfx" | "bgm" | "claim" | "paper" | "infographic" | "pause";
  content: string;
  rawTag?: string;
}

/**
 * Parses a scene's audio or visual string into inline text, [Pause]/[وقفہ] pills, [SFX: ...] / [BGM: ...] badges,
 * and interactive Click-to-Verify [CLAIM-X], [PAPER-X], [INFOGRAPHIC-X] markers.
 */
export const parseAudioTextIntoTokens = (audioText: string): InlineAudioToken[] => {
  if (!audioText) return [];
  const regex = /(\[\s*(?:SFX|BGM)\s*:[^\]]+\]|\[\s*(?:CLAIM|PAPER|INFOGRAPHIC)\s*-\s*\d+\s*\]|\[\s*(?:Pause|Beat|وقفہ)\s*\]|\[\s*[FBQSD]\d+\s*\])/gi;
  const parts = audioText.split(regex);
  const tokens: InlineAudioToken[] = [];

  for (const part of parts) {
    if (!part) continue;
    const pauseMatch = part.match(/^\[\s*(Pause|Beat|وقفہ)\s*\]$/i);
    if (pauseMatch) {
      tokens.push({
        type: "pause",
        content: pauseMatch[1].trim(),
        rawTag: part
      });
      continue;
    }
    const sfxMatch = part.match(/^\[\s*SFX\s*:\s*([^\]]+)\]$/i);
    if (sfxMatch) {
      tokens.push({
        type: "sfx",
        content: sfxMatch[1].trim(),
        rawTag: part
      });
      continue;
    }
    const bgmMatch = part.match(/^\[\s*BGM\s*:\s*([^\]]+)\]$/i);
    if (bgmMatch) {
      tokens.push({
        type: "bgm",
        content: bgmMatch[1].trim(),
        rawTag: part
      });
      continue;
    }
    const researchMarkerMatch = part.match(/^\[\s*(CLAIM|PAPER|INFOGRAPHIC)\s*-\s*(\d+)\s*\]$/i);
    if (researchMarkerMatch) {
      const kind = researchMarkerMatch[1].toUpperCase();
      const num = researchMarkerMatch[2];
      const normalizedId = `${kind}-${num}`;
      tokens.push({
        type: kind === "CLAIM" ? "claim" : kind === "PAPER" ? "paper" : "infographic",
        content: normalizedId,
        rawTag: part
      });
      continue;
    }
    const cardMarkerMatch = part.match(/^\[\s*([FBQSD])(\d+)\s*\]$/i);
    if (cardMarkerMatch) {
      const prefix = cardMarkerMatch[1].toUpperCase();
      const num = cardMarkerMatch[2];
      const normalizedId = `${prefix}${num}`;
      tokens.push({
        type: prefix === 'B' ? 'paper' : 'claim',
        content: normalizedId,
        rawTag: part
      });
      continue;
    }
    tokens.push({
      type: "text",
      content: part
    });
  }

  return tokens;
};

/**
 * MODULE 3: Emotional Shift Scanner & SFX / BGM Cue Injection Algorithm
 * Preserves 100% of the spoken words while inserting inline [SFX: ...] and [BGM: ...] cues
 * at hooks, evidence reveals, transitions, and emotional shifts.
 */
export const autoMapSfxAndBgmCues = async (
  script: ScriptData,
  creator: CreatorProfile,
  apiKey?: string,
  signal?: AbortSignal
): Promise<ScriptData> => {
  const client = createGeminiClient(apiKey);

  // First strip any previously injected [SFX: ...] or [BGM: ...] tags so re-running never duplicates tags
  const cleanInputSegments = (script.segments || []).map((seg, idx) => ({
    sceneIndex: idx + 1,
    visual: seg.visual,
    audio: (seg.audio || "")
      .replace(/\[\s*(?:SFX|BGM)\s*:[^\]]+\]\s*/gi, "")
      .trim()
  }));

  const prompt = `
====================================================================
MODULE 3: EMOTIONAL SHIFT SCANNER & SFX / BGM CUE MAPPER
====================================================================
Creator Style: ${creator.name} (${creator.bio.archetype})
Tone & Pacing: ${creator.bio.voice.tone} | ${creator.bio.voice.pacing}

TASK: Run an emotional beat scan over the ${cleanInputSegments.length} script scenes below.
CRITICAL NON-DESTRUCTIVE RULE:
- You MUST preserve 100% of the existing spoken words verbatim in the exact same language (${script.language || "Original"}). Do NOT delete, summarize, or rewrite a single spoken sentence.
- Insert structured inline audio direction tags ([SFX: ...] and [BGM: ...]) directly into each scene's 'audio' text at key emotional and structural transitions:
  1. Hook / Opening (Scene 1): Inject high-impact attention grabbers (e.g., [SFX: Cinematic Sub-Bass Drop], [BGM: Fast Ticking Clock Rhythm Starts]).
  2. Evidence / Data / Document Reveals: Inject tactile visual-support sounds right before statistics, dates, or quotes (e.g., [SFX: Newspaper Highlighter Swish], [SFX: Camera Shutter Click], [SFX: Digital Glitch / Data Counter Beep]).
  3. Scene / Topic Transitions: Inject movement cues (e.g., [SFX: Deep Whoosh Transition], [SFX: Tape Rewind]).
  4. Emotional Shifts & Climax: Inject music mood changes (e.g., [BGM: Low Investigative Synth Drone Fades In], [BGM: Cuts to Complete Silence for Dramatic Pause], [BGM: Uplifting Orchestral Swell]).
- Place 2 to 4 well-timed [SFX: ...] / [BGM: ...] tags per scene. Use ONLY the exact format [SFX: Description] and [BGM: Description].

INPUT SCENES (${cleanInputSegments.length} scenes):
${JSON.stringify(cleanInputSegments)}
`;

  const { data } = await client.generateJson<{
    segments?: Array<{ audio?: string }>;
  }>({
    task: "analysis",
    prompt,
    schema: sfxMapperSchema,
    temperature: 0.4,
    maxOutputTokens: 8192,
    signal
  });

  const updatedSegments = (script.segments || []).map((origSeg, idx) => {
    const mappedAudio = data.segments?.[idx]?.audio;
    return {
      ...origSeg,
      audio: mappedAudio && mappedAudio.trim().length > 0 ? mappedAudio : origSeg.audio
    };
  });

  return {
    ...script,
    segments: updatedSegments
  };
};
