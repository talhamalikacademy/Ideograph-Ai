import { CreatorProfile, GeneratorConfig } from "../types";
import {
  getLanguagePolicyMatrix,
  getHookCalibrationDirective,
  buildStage3PacingAndSpeedEngine,
  assembleFourStageCreatorPipeline,
  assembleTwoLayerCreatorPrompt,
  sanitizeCreatorVocabulary,
  sanitizeScriptSegmentsVocabulary,
  sanitizeScriptDataPackage,
  enforcePureUrduScriptNoLatinLeak,
  sanitizePlagiarizedHookSentences,
  LANGUAGE_POLICY_PROFILES,
  DHRUV_RATHEE_LEXICAL_REPLACEMENTS,
  DHRUV_TRUE_URDISH_GOLDEN_SCENES,
  DHRUV_HOOK_ARCHITECTURE_MATRIX,
  resolvePolicyProfileKey,
  DHRUV_SUB_GENRE_BLUEPRINTS,
  DHRUV_RATHEE_TRANSCRIPTS,
  THYNKWHY_SUB_GENRE_BLUEPRINTS,
  THYNKWHY_TRANSCRIPTS,
  OTHER_CREATOR_TRANSCRIPT_PACKS,
  getSubGenreBlueprintsForCreator,
  matchCreatorSubGenreAndTranscript,
  compileCreatorTranscriptAndSubGenreBlock,
  buildAntiPlagiarismDirective
} from "./languagePolicies";
import {
  TRANSCRIPT_NON_VERBATIM_ANALYSIS_RULE,
  SCIENCE_AI_TRAINED_ALGO_DNA,
  STEP_BY_STEP_CREATOR_SCRIPT_ALGORITHM,
  DHRUV_UNIVERSAL_SPOKEN_WORD_BANK
} from "../src/data/creatorTranscripts";

export {
  TRANSCRIPT_NON_VERBATIM_ANALYSIS_RULE,
  SCIENCE_AI_TRAINED_ALGO_DNA,
  STEP_BY_STEP_CREATOR_SCRIPT_ALGORITHM,
  DHRUV_UNIVERSAL_SPOKEN_WORD_BANK
};

export {
  getLanguagePolicyMatrix,
  getHookCalibrationDirective,
  buildStage3PacingAndSpeedEngine,
  assembleFourStageCreatorPipeline,
  assembleTwoLayerCreatorPrompt,
  sanitizeCreatorVocabulary,
  sanitizeScriptSegmentsVocabulary,
  sanitizeScriptDataPackage,
  enforcePureUrduScriptNoLatinLeak,
  sanitizePlagiarizedHookSentences,
  LANGUAGE_POLICY_PROFILES,
  DHRUV_RATHEE_LEXICAL_REPLACEMENTS,
  DHRUV_TRUE_URDISH_GOLDEN_SCENES,
  DHRUV_HOOK_ARCHITECTURE_MATRIX,
  resolvePolicyProfileKey,
  DHRUV_SUB_GENRE_BLUEPRINTS,
  DHRUV_RATHEE_TRANSCRIPTS,
  THYNKWHY_SUB_GENRE_BLUEPRINTS,
  THYNKWHY_TRANSCRIPTS,
  OTHER_CREATOR_TRANSCRIPT_PACKS,
  getSubGenreBlueprintsForCreator,
  matchCreatorSubGenreAndTranscript,
  compileCreatorTranscriptAndSubGenreBlock,
  buildAntiPlagiarismDirective
};

export interface UrduBannedWordRule {
  bannedNastaliq: string;
  bannedRoman: string;
  spokenNastaliq: string;
  spokenRoman: string;
}

export const BANNED_FORMAL_URDU_REPLACEMENTS: UrduBannedWordRule[] =
  DHRUV_RATHEE_LEXICAL_REPLACEMENTS.map(r => ({
    bannedNastaliq: r.bannedPhrase,
    bannedRoman: r.bannedRoman || "",
    spokenNastaliq: r.replacement,
    spokenRoman: r.replacementRoman || r.replacement
  }));

/**
 * Section 5: Urdu & Roman Urdu / Conversational Language & Script-Purity Rule (Critical for Retention & BiDi)
 */
export const URDU_CONVERSATIONAL_RETENTION_RULE = `
### 5. URDU & ROMAN URDU / CONVERSATIONAL LANGUAGE & SCRIPT-PURITY RULE
If generating or translating into Urdu (Nastaliq) or Roman Urdu / Hinglish:
- **TOPIC-FIRST ANCHORING & ZERO PLAGIARISM AT [00:00]:**
  * NEVER copy or recycle opening lines, metaphors, or hooks from reference transcripts.
  * Sentence #1 and Sentence #2 MUST be 100% original and lock directly onto the user's exact topic, subject, and timeframe.
- **100% PURE URDU SCRIPT CHARACTER RENDERING WHEN URDU SCRIPT (\`Urdu (Proper)\`) IS SELECTED (ZERO LATIN LEAK):**
  * When writing in Urdu Script (\`Urdu (Proper)\`), NEVER output Latin English words (\`A-Z\`) inside Urdu sentences because mixing Latin letters with RTL Urdu breaks the Unicode Bidirectional reading order!
  * **EXACT SPELLING OF "نمسکار" (NAMASKAR):** Whenever writing "Namaskar" in Urdu Script, ALWAYS spell it with 'س' as **"نمسکار"** (ن-م-س-ک-ا-ر -> "نمسکار دوستو!"). NEVER misspell it as "نمکار" or "نامسکار".
  * Write conversational technical/modern English terms in **Urdu Script characters** (for example: \`اے آئی\`, \`الگورتھم\`, \`انٹیلیجنس\`, \`ریسرچ\`, \`اسٹڈی\`, \`سسٹم\`, \`اسٹیپ بائی اسٹیپ\`, \`پرمننٹلی\`).
  * NEVER write parenthetical Latin clarifications like \`(permanently)\` or \`(slow)\` in Urdu Script mode.
- **BAN Formal/News-Anchor Urdu:** Never use heavy, literary, or archaic words like "اشتعال انگیزی" (use "لوگوں کو بھڑکانا"), "انکشاف" (use "سچائی سامنے آنا"), "شواہد" (use "ثبوت"), "آغاز" (use "شروع"), "وباؤں" (use "خطرناک پینڈیمکس"), "سنگین" (use "سیریس"), "تخلیق" (use "کریٹیویٹی"), "خبردار" (use "وارننگ"), "بغاوت" (use "کنٹرول سے باہر ہونا"), "مستقل طور پر" (use "ہمیشہ کے لیے"), "عہدے سے استعفیٰ" (use "اپنی پوزیشن سے ریزائن"), "ریاضی دانوں" (use "میتھمیٹیشنز"), "صنعتی انقلاب" (use "انڈسٹریل ریوولوشن"), "غیر متوقع" (use "ان پریڈکٹیبل"), "شائع" (use "پبلش"), "سادہ لوح" (use "معصوم"), "ہوبہو" (use "بالکل سیم ٹو سیم"), "تمثیل" (use "ایگزامپل"), "موازنہ" (use "کمپیریزن"), or "خود مختار" (use "آٹونومس").
- **Sentence Length & Pacing Cap:** Maximum 14 to 18 words per sentence (average 12–16 words). Never write 30+ word run-on sentences.
- **Single Thread Law, Causal Bridges & Inline [CLAIM-X] Verification:** Every body paragraph must directly prove the Hook's central claim (\`activeThesis\`), open with an explicit Causal Bridge, and attach an inline \`[CLAIM-X]\` or \`[PAPER-X]\` marker whenever a factual claim, institutional debate, prediction, statistic, or study is stated.
`.trim();

export const UNIVERSAL_CREATOR_PRE_GENERATION_RULES: string[] = [
  TRANSCRIPT_NON_VERBATIM_ANALYSIS_RULE,
  URDU_CONVERSATIONAL_RETENTION_RULE,
  `### UNIVERSAL SPOKEN CLARITY, PACING & THREAD-LOCK GATE (ALL CREATORS)
- Write strictly for the HUMAN EAR (12–18 words per sentence max), never like a newspaper editorial, Wikipedia article, or tired morning-show host.
- ANALYZE reference transcripts for cadence, word choice, and rhythm ONLY—NEVER copy exact sentences, metaphors, or hooks from reference transcripts.
- Sentence #1 at [00:00] MUST be 100% original and directly anchor onto the user's exact topic, subject, and timeframe.
- Every complex concept, number, or scientific/economic/psychological mechanism must be followed immediately by a 2-sentence cause-and-effect physical analogy, never a 1-line cliché simile.
- Lock the Hook's central claim as activeThesis and ensure every body paragraph opens with a Causal Connector and includes an inline [CLAIM-X] verification marker for every factual/institutional/prediction claim.`
];

export const isUrduOrConversationalSouthAsianLanguage = (language?: string): boolean => {
  if (!language) return false;
  return /urdu|hinglish|hindi/i.test(language);
};

/**
 * Executes before any AI script generation, translation, extension, enhancement,
 * or Shorts Clipper call for ANY creator.
 */
export const executePreGenerationRules = (options: {
  creator?: CreatorProfile;
  config?: Partial<GeneratorConfig>;
  targetLanguage?: string;
  includeCreatorTranscriptCorpus?: boolean;
}): string => {
  const effectiveLang = options.targetLanguage || options.config?.language || "English";
  const effectiveDuration = options.config?.duration || "5 Minutes (Standard)";
  const effectiveTopic = options.config?.topicOrScript || "";
  const effectiveSubGenreId = options.config?.subGenreId || "auto";
  const creatorName = options.creator?.name || "Active Creator";

  const effectiveSecondaryLang =
    options.config?.enableDualScript && options.config?.secondaryLanguage
      ? options.config.secondaryLanguage
      : "";

  const antiPlagiarismDirective = buildAntiPlagiarismDirective(effectiveTopic);

  const transcriptAndSubGenreBlock = options.includeCreatorTranscriptCorpus
    ? compileCreatorTranscriptAndSubGenreBlock({
        creator: options.creator,
        topic: effectiveTopic,
        targetLanguage: effectiveLang,
        secondaryLanguage: effectiveSecondaryLang,
        subGenreId: effectiveSubGenreId
      })
    : "";

  const stages2To4Matrix = options.creator
    ? getLanguagePolicyMatrix(
        options.creator,
        effectiveLang,
        effectiveDuration,
        effectiveTopic
      )
    : "";

  return `
============================================================================
[PRE-GENERATION EXECUTION GATE — MANDATORY GLOBAL RULES FOR: ${creatorName.toUpperCase()}]
Active Output Language: ${effectiveLang}
============================================================================
${antiPlagiarismDirective}

${UNIVERSAL_CREATOR_PRE_GENERATION_RULES.join("\n\n")}
${transcriptAndSubGenreBlock ? `\n${transcriptAndSubGenreBlock}\n` : ""}
${stages2To4Matrix ? `\n${stages2To4Matrix}\n` : ""}
============================================================================
`.trim();
};

