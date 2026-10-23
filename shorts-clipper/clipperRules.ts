import {
  CreatorProfile,
  CreatorStyleSchema,
  GeneratorConfig,
  ShortClipperStyleBlueprint
} from "../types";
import { CREATORS, creatorRegistry } from "../constants";
import { AutoChooser } from "../creator-intelligence/AutoChooser";
import { CreatorBlender } from "../creator-intelligence/CreatorBlender";
import {
  compileCreatorDNA,
  compileCreatorVoiceCard
} from "../creator-intelligence/CreatorDNA";
import {
  executePreGenerationRules,
  URDU_CONVERSATIONAL_RETENTION_RULE
} from "../services/preGenerationRules";

/**
 * 9:16 Vertical Safe-Zone Framing Rule for Mobile Shorts / Reels / TikTok
 */
export const VERTICAL_SAFE_ZONE_PROMPT_RULE =
  "Vertical 9:16 mobile framing, primary subject centered in the middle third of the frame, clean uncluttered negative space in the top 15% and bottom 25% to leave safe zones for mobile captions and Shorts UI overlays.";

/**
 * Word Count & Pacing Constants for 50–60 Second Vertical Shorts
 * Strictly enforced at 150 WPM = 2.5 Words-Per-Second (WPS)
 */
export const SHORTS_RETENTION_CONSTRAINTS = {
  wordsPerSecond: 2.5,
  spokenWordsPerMinute: 150,
  hookMinWords: 7,
  hookMaxWords: 9,
  escalationMinWords: 28,
  escalationMaxWords: 32,
  climaxMinWords: 80,
  climaxMaxWords: 90,
  loopMinWords: 15,
  loopMaxWords: 18,
  targetTotalWordsMin: 130,
  targetTotalWordsMax: 150,
  escalationMaxWordsPerSentence: 10,
  storyboardFrameCountMin: 5,
  storyboardFrameCountMax: 6,
  extractedShortsCount: 3
} as const;

/**
 * Clean Lookup Helper: Extracts the full Creator Style Schema from `creatorRegistry`
 * given a CreatorStyleSchema, CreatorProfile, or creatorId string with zero data loss.
 */
export const extractShortClipperStyleBlueprint = (
  creatorOrId: CreatorProfile | CreatorStyleSchema | ShortClipperStyleBlueprint | string | undefined
): CreatorStyleSchema => {
  return creatorRegistry.get(creatorOrId);
};

/**
 * Upgraded ShortClipper System Prompt Template
 * Enforces Creator Style DNA (vocalCadence, analogyRule, authorityFraming, avoidList, fewShotExamples),
 * 150 WPM (2.5 WPS) mathematical pacing, teleprompter numeric readability, and the Seamless Infinite Loop Law.
 */
export const buildShortClipperSystemPrompt = (
  creatorProfile: ShortClipperStyleBlueprint,
  fullDnaPrompt?: string
): string => `
You are an elite short-form viral script adaptation engine. Your task is to extract the single most mind-blowing core concepts from a LONG SCRIPT and transform them into 3 high-retention vertical video scripts (50–60 seconds each) strictly written in the voice and structural DNA of: ${creatorProfile.name}.

### 1. CREATOR STYLE DNA (${creatorProfile.name.toUpperCase()})
- **Vocal Cadence & Tone:** ${creatorProfile.tone || "Curious, objective, urgent, and clear."} (${creatorProfile.vocalCadence})
- **Transition Phrases:** Use authentic bridges like "${creatorProfile.transitions || "Let's understand the science behind this step-by-step / Here is where it gets really interesting"}".
- **Analogy Rule:** ${creatorProfile.analogyRule || "Always explain complex mechanisms using a tangible, everyday physical phenomenon (e.g., ripples in a pond, a moving train) that visually matches the physics."}
- **Authority Framing (CRITICAL):** ${creatorProfile.authorityFraming}
- **Teleprompter Numeric Readability:** ${creatorProfile.numericFormatting}
${
  creatorProfile.fewShotExamples && creatorProfile.fewShotExamples.length > 0
    ? `- **Authentic Sentence Cadence Examples (Mimic This Rhythm, Not Exact Words):**\n${creatorProfile.fewShotExamples.map(ex => `  * "${ex}"`).join("\n")}\n`
    : ""
}- **Forbidden Tropes (AVOID LIST):**
${creatorProfile.avoidList.map(item => `  * ${item}`).join("\n")}

### 2. STRICT PACING & WORD-COUNT MATH (150 WPM = 2.5 Words/Second)
Never assign arbitrary timestamps or leave dead air. Your spoken word count in each section MUST mathematically match the timestamp duration at 2.5 words per second:
- **[00:00 - 00:03] HOOK (3 seconds — \`hook0to3s\`):** Strictly 7 to 9 punchy words. Must trigger an immediate curiosity gap. Zero greetings.
- **[00:03 - 00:15] RAPID ESCALATION (12 seconds — \`escalation3to15s\`):** Strictly 28 to 32 words. Short, staccato sentences showing the contrast between normal reality and the hidden crisis. Include one \`[Pause]\`.
- **[00:15 - 00:48] CORE REVEAL / CLIMAX (33 seconds — \`climax15to50s\`):** Strictly 80 to 90 words. Step-by-step breakdown + 1 tangible everyday physical analogy + the exact numeric/scientific payoff written in clean digits with units (e.g., '300,000 kilometers per second', '8 minutes and 20 seconds').
- **[00:48 - 00:55] INFINITE LOOP ENDING (7 seconds — \`infiniteLoop50to60s\`):** Strictly 15 to 18 words.

### 3. THE SEAMLESS INFINITE LOOP LAW (GRAMMATICAL LOOP VALIDATION)
1. Write \`[00:00 - 00:03] HOOK\` (\`hook0to3s\`) FIRST.
2. Copy the exact text of \`hook0to3s\` into your scratchpad (\`loopBridgePreview\`).
3. Construct \`[00:48 - 00:55] INFINITE LOOP ENDING\` (\`infiniteLoop50to60s\`) so that the final words of \`infiniteLoop50to60s\` flow directly into the first word of \`hook0to3s\` to form a 100% grammatically flawless, unbroken sentence when read out loud!
- **BAD LOOP:** "...because until that final photon reaches your eyes..." -> "If the Sun vanished right now..." (Broken grammar: "because until... if").
- **GOOD LOOP:** "...which means you wouldn't even know the disaster has begun, even" -> "If the Sun vanished right now, you wouldn't know for 8 minutes." (Combined: "...which means you wouldn't even know the disaster has begun, even if the Sun vanished right now, you wouldn't know for 8 minutes.")
- Verify this in \`loopBridgePreview\` by writing \`"[infiniteLoop50to60s] [hook0to3s]"\` together and checking that there is no period at the seam and the grammar is 100% unbroken.

${fullDnaPrompt ? `\n### 4. EXTENDED CREATOR INTELLIGENCE REFERENCE\n${fullDnaPrompt}` : ""}

${URDU_CONVERSATIONAL_RETENTION_RULE}
`.trim();

/**
 * STAGE 1 RULES: High-Retention Standalone Segment Extraction
 */
export const STAGE_1_EXTRACTION_RULES = `
STAGE 1 — HIGH-RETENTION SEGMENT EXTRACTION:
- Scan the entire source script and isolate the 3 strongest standalone micro-narratives, shocking scientific/historical paradoxes, or high-stakes mechanisms.
- COLD VIEWER RULE: Each selected Short MUST make 100% logical sense to a cold viewer scrolling on YouTube Shorts, Reels, or TikTok WITHOUT requiring prior context from the long video.
- DIVERSITY RULE: Pick 3 distinct angles or moments from different parts of the script.
`.trim();

/**
 * STAGE 2 RULES: 55-Second Vertical Script Restructuring (Strict 2.5 WPS Word-Count Math)
 */
export const buildStage2VerticalStructureRules = (
  blueprint: ShortClipperStyleBlueprint,
  isBlendMode: boolean
): string => `
STAGE 2 — 55-SECOND VERTICAL SCRIPT RESTRUCTURING (STRICT 2.5 WORDS/SECOND MATH = 130–150 WORDS PER SHORT):
Rewrite each of the 3 extracted segments using ${blueprint.name}'s authentic voice${
  isBlendMode ? " + Blend Infusions" : ""
} into this exact 4-part structure:
  1. [00:00 - 00:03] hook0to3s (3 seconds = strictly 7 to 9 words):
     - Write this FIRST. Must trigger an immediate curiosity gap in 7 to 9 words.
     - Zero slow introductions or greetings ("Namaskar dosto", "Hello friends", "Welcome back" are strictly banned).
  2. [00:03 - 00:15] escalation3to15s (12 seconds = strictly 28 to 32 words):
     - Short, staccato sentences (under 10 words per sentence) showing the contrast between normal reality and the hidden crisis.
     - Include exactly one [Pause] marker.
  3. [00:15 - 00:48] climax15to50s (33 seconds = strictly 80 to 90 words):
     - Step-by-step breakdown using authentic transitions ("${blueprint.transitions}").
     - Include 1 tangible everyday physical analogy (${blueprint.analogyRule}).
     - Deliver the exact numeric/scientific payoff using clean digits with units (e.g., '300,000 kilometers per second', '8 minutes and 20 seconds').
     - Authority Framing: ${blueprint.authorityFraming}
  4. [00:48 - 00:55] infiniteLoop50to60s (7 seconds = strictly 15 to 18 words):
     - Construct this so that reading [infiniteLoop50to60s] + [hook0to3s] out loud forms a single, unbroken, grammatically flawless sentence. Do NOT end with a hard stop if it continues into the first word of the hook.
     - Record the combined seam sentence in 'loopBridgePreview' to prove grammatical continuity.
`.trim();

/**
 * STAGE 3 RULES: 9:16 Vertical Storyboard Image Prompts
 */
export const STAGE_3_VERTICAL_STORYBOARD_RULES = `
STAGE 3 — 9:16 VERTICAL STORYBOARD IMAGE PROMPTS:
- For EACH of the 3 Shorts, generate 5 to 6 storyboard visual prompts timed across the 55-second arc (e.g., "00:00-00:03", "00:03-00:15", "00:15-00:26", "00:26-00:37", "00:37-00:48", "00:48-00:55").
- Every 'visualPrompt' MUST be designed for 9:16 vertical portrait framing and incorporate: "${VERTICAL_SAFE_ZONE_PROMPT_RULE}"
- Also provide a short punchy 2-5 word 'captionOverlay' for each storyboard frame.
`.trim();

/**
 * Resolves the effective Creator Style Blueprint & System Instruction for Shorts Clipper
 */
export const resolveClipperCreatorStyle = (
  longFormScriptText: string,
  config: GeneratorConfig,
  selectedCreator?: CreatorProfile | CreatorStyleSchema | ShortClipperStyleBlueprint | string
): {
  effectiveCreator: CreatorProfile;
  creatorBlueprint: CreatorStyleSchema;
  styleSystemPrompt: string;
  voiceCard: string;
  creatorAppliedLabel: string;
} => {
  const initialSchema = creatorRegistry.get(
    selectedCreator || config.selectedStyleId
  );
  const initialProfile: CreatorProfile =
    initialSchema.profile ||
    CREATORS.find(c => c.id === initialSchema.id) ||
    CREATORS[0];

  let effectiveCreator: CreatorProfile = initialProfile;
  let dnaPrompt = "";

  if (config.writingMode === "auto") {
    const autoPick = AutoChooser.selectBestCreator(longFormScriptText, CREATORS);
    effectiveCreator = autoPick.creator;
    dnaPrompt = compileCreatorDNA(effectiveCreator, {
      ...config,
      duration: "60 Seconds (Shorts)",
      platform: "YouTube Shorts"
    });
  } else if (config.writingMode === "blend") {
    const primarySchema = creatorRegistry.get(
      config.blendConfig?.primaryCreatorId || initialProfile
    );
    const primary = primarySchema.profile || initialProfile;
    effectiveCreator = primary;
    const secondaries = CREATORS.filter(
      c =>
        c.id !== primary.id &&
        (config.blendConfig?.secondaryCreatorIds || []).includes(c.id)
    );
    dnaPrompt = CreatorBlender.generateBlendPrompt(primary, secondaries, {
      ...config,
      duration: "60 Seconds (Shorts)",
      platform: "YouTube Shorts"
    });
  } else {
    dnaPrompt = compileCreatorDNA(effectiveCreator, {
      ...config,
      duration: "60 Seconds (Shorts)",
      platform: "YouTube Shorts"
    });
  }

  const creatorBlueprint =
    config.writingMode === "manual" &&
    selectedCreator &&
    typeof selectedCreator === "object" &&
    "vocalCadence" in selectedCreator
      ? creatorRegistry.get(selectedCreator)
      : creatorRegistry.get(effectiveCreator);

  const styleSystemPrompt = buildShortClipperSystemPrompt(
    creatorBlueprint,
    dnaPrompt
  );
  const voiceCard = compileCreatorVoiceCard(effectiveCreator);

  const creatorAppliedLabel =
    config.writingMode === "blend"
      ? `${effectiveCreator.name} (Blend Studio)`
      : config.writingMode === "auto"
      ? `${effectiveCreator.name} (Auto-Matched)`
      : effectiveCreator.name;

  return {
    effectiveCreator,
    creatorBlueprint,
    styleSystemPrompt,
    voiceCard,
    creatorAppliedLabel
  };
};

/**
 * Builds the complete prompt for the 4-stage Long-to-Short Viral Extraction & 55s Vertical Rewriter
 */
export const buildShortsClipperPrompt = (
  longFormScriptText: string,
  config: GeneratorConfig,
  effectiveCreator: CreatorProfile,
  voiceCard: string,
  creatorBlueprint?: ShortClipperStyleBlueprint
): string => {
  const blueprint =
    creatorBlueprint || extractShortClipperStyleBlueprint(effectiveCreator);

  const preGenRules = executePreGenerationRules({
    creator: effectiveCreator,
    config,
    targetLanguage: config.language
  });

  return `
${preGenRules}

====================================================================
MODULE 1: LONG-TO-SHORT VIRAL EXTRACTION & 55s VERTICAL REWRITER
====================================================================
Target Output Language: ${config.language}${
    config.arabicDialect && /arabic/i.test(config.language)
      ? ` (${config.arabicDialect})`
      : ""
  }
Language Adaptation Rule: ${blueprint.languageRule}
Rewrite Aggressiveness / Tone Intensity: ${config.rewriteAggressiveness}
Transformation Angle: ${config.transformationType}

${voiceCard}

TASK: Process the provided long-form script through this mandatory pipeline and output EXACTLY 3 standalone Viral Vertical Shorts (50–60 seconds each at 150 WPM / 2.5 words per second):

${STAGE_1_EXTRACTION_RULES}

${buildStage2VerticalStructureRules(
    blueprint,
    config.writingMode === "blend"
  )}

${STAGE_3_VERTICAL_STORYBOARD_RULES}

SOURCE LONG-FORM SCRIPT TO EXTRACT FROM:
"""
${longFormScriptText.slice(0, 100000)}
"""
`.trim();
};
