import { CreatorProfile } from "../../types";
import {
  TRANSCRIPT_NON_VERBATIM_ANALYSIS_RULE,
  SCIENCE_AI_TRAINED_ALGO_DNA,
  STEP_BY_STEP_CREATOR_SCRIPT_ALGORITHM,
  DHRUV_UNIVERSAL_SPOKEN_WORD_BANK,
  DHRUV_SUB_GENRE_BLUEPRINTS,
  DHRUV_GENRE_HIERARCHY,
  DHRUV_RATHEE_TRANSCRIPTS,
  matchDhruvSubGenreAndTranscript
} from "./dhruv_rathee.js";
import {
  THYNKWHY_SUB_GENRE_BLUEPRINTS,
  THYNKWHY_GENRE_HIERARCHY,
  THYNKWHY_TRANSCRIPTS,
  THYNKWHY_STEP_BY_STEP_SCRIPT_ALGORITHM,
  THYNKWHY_UNIVERSAL_SPOKEN_WORD_BANK,
  THYNKWHY_MUAZZAM_SHAH_MANIFESTO_VERBATIM,
  THYNKWHY_DIGITAL_HEERA_MANDI_EXPOSE_VERBATIM,
  THYNKWHY_MILITARY_GEOPOLITICS_NARRATIVE_WARFARE_VERBATIM,
  matchThynkWhySubGenreAndTranscript
} from "./thynkwhy.js";
import { OTHER_CREATOR_TRANSCRIPT_PACKS } from "./other_creators.js";

export interface SubGenreBlueprintCard {
  id: string;
  cardNumber: number;
  genreTag?: string;
  title: string;
  aggressionScore: string;
  aggressionAndTone: string;
  signatureWordingAndPacing: string;
  topicTriggers: string[];
}

export interface TrilingualTranscriptSet {
  englishTranscript: string;
  urduTranscript: string;
  romanUrduTranscript?: string;
  hindiTranscript: string;
}

export interface DhruvGenreVideoEntry {
  id: string;
  subGenreId: string;
  genreTag: string;
  videoTitle: string;
  topicDomain: string;
  aggressionScore: string;
  englishTranscribe: string;
  hinglishTranscribe: string;
  urduTranscribe: string;
  deepWordBank: {
    urdu: string[];
    hinglish: string[];
    english: string[];
  };
}

export interface DhruvGenreHierarchySection {
  genreId: string;
  genreTag: string;
  genreTitle: string;
  aggressionScore: string;
  videos: DhruvGenreVideoEntry[];
}

export interface CreatorTranscriptRecord {
  id: string;
  subGenreId: string;
  genreTag?: string;
  videoTitle: string;
  topicDomain: string;
  aggressionScore: string;
  sourceScriptLanguage: string;
  trilingualTranscripts: TrilingualTranscriptSet;
  englishTranscribe?: string;
  hinglishTranscribe?: string;
  urduTranscribe?: string;
  deepWordBank?: {
    urdu: string[];
    hinglish: string[];
    english: string[];
  };
  rawTranscriptExcerpt: string;
  openingMechanics: {
    visceralStatementFormula: string;
    inverseCorrelationFormula: string;
    uncomfortableTruthBridge: string;
    expectationVsRealityParadox: string;
    nostalgiaMemorySelfTest: string;
    inconvenientQuestionPivot: string;
  };
  realTimeTransitions: string[];
  englishMixExamples: string[];
  closingMechanics: {
    antiBoycottNuance: string;
    practicalProtocol: string;
    finalMetaphorAndQuestion: string;
  };
}

export {
  TRANSCRIPT_NON_VERBATIM_ANALYSIS_RULE,
  SCIENCE_AI_TRAINED_ALGO_DNA,
  STEP_BY_STEP_CREATOR_SCRIPT_ALGORITHM,
  DHRUV_UNIVERSAL_SPOKEN_WORD_BANK,
  DHRUV_SUB_GENRE_BLUEPRINTS,
  DHRUV_GENRE_HIERARCHY,
  DHRUV_RATHEE_TRANSCRIPTS,
  THYNKWHY_SUB_GENRE_BLUEPRINTS,
  THYNKWHY_GENRE_HIERARCHY,
  THYNKWHY_TRANSCRIPTS,
  THYNKWHY_STEP_BY_STEP_SCRIPT_ALGORITHM,
  THYNKWHY_UNIVERSAL_SPOKEN_WORD_BANK,
  THYNKWHY_MUAZZAM_SHAH_MANIFESTO_VERBATIM,
  THYNKWHY_DIGITAL_HEERA_MANDI_EXPOSE_VERBATIM,
  THYNKWHY_MILITARY_GEOPOLITICS_NARRATIVE_WARFARE_VERBATIM,
  OTHER_CREATOR_TRANSCRIPT_PACKS,
  matchDhruvSubGenreAndTranscript,
  matchThynkWhySubGenreAndTranscript
};

/**
 * Normalizes any CreatorProfile or string ID across all 11 studio creators.
 */
export const normalizeCreatorTranscriptKey = (
  creatorOrId?: CreatorProfile | string | null
): string => {
  const raw =
    typeof creatorOrId === "string"
      ? creatorOrId
      : creatorOrId?.id || creatorOrId?.bio?.id || creatorOrId?.name || "dhruvrathee";
  const clean = raw.toLowerCase().replace(/[\s_@-]+/g, "");

  if (clean.includes("dhruv") || clean.includes("analyticalexplainer")) return "dhruvrathee";
  if (clean.includes("thynkwhy") || clean.includes("thinkwhy")) return "thynkwhy";
  if (clean.includes("nitish")) return "nitishrajput";
  if (clean.includes("raftar")) return "raftar";
  if (clean.includes("veritasium") || clean.includes("derekmuller")) return "veritasium";
  if (clean.includes("mrbeast") || clean.includes("jimmydonaldson")) return "mrbeast";
  if (clean.includes("hormozi")) return "alexhormozi";
  if (clean.includes("naval")) return "navalravikant";
  if (clean.includes("peterson") || clean === "jbp") return "jordanpeterson";
  if (clean.includes("iman") || clean.includes("gadzhi")) return "imangadzhi";
  if (clean.includes("sharan") || clean.includes("hegde")) return "sharanhegde";
  return clean || "dhruvrathee";
};

/**
 * Returns true ONLY when the active creator is Dhruv Rathee.
 */
export const isDhruvRatheeCreator = (
  creatorOrId?: CreatorProfile | string | null
): boolean => {
  return normalizeCreatorTranscriptKey(creatorOrId) === "dhruvrathee";
};

/**
 * Returns true ONLY when the active creator is ThynkWhy.
 */
export const isThynkWhyCreator = (
  creatorOrId?: CreatorProfile | string | null
): boolean => {
  return normalizeCreatorTranscriptKey(creatorOrId) === "thynkwhy";
};

/**
 * Returns true when the active creator has a dedicated 5-Genre Hierarchy step in the UI
 * (Dhruv Rathee or ThynkWhy).
 */
export const hasCreatorGenreHierarchy = (
  creatorOrId?: CreatorProfile | string | null
): boolean => {
  const key = normalizeCreatorTranscriptKey(creatorOrId);
  return key === "dhruvrathee" || key === "thynkwhy";
};

/**
 * Returns the isolated 5 Genre Blueprint Cards for the active creator:
 * - Dhruv Rathee -> DHRUV_SUB_GENRE_BLUEPRINTS (Dhruv's 5 genres ONLY)
 * - ThynkWhy     -> THYNKWHY_SUB_GENRE_BLUEPRINTS (ThynkWhy's 5 genres ONLY)
 * - Others       -> []
 */
export const getSubGenreBlueprintsForCreator = (
  creatorOrId?: CreatorProfile | string | null
): SubGenreBlueprintCard[] => {
  const key = normalizeCreatorTranscriptKey(creatorOrId);
  if (key === "dhruvrathee") {
    return DHRUV_SUB_GENRE_BLUEPRINTS as SubGenreBlueprintCard[];
  }
  if (key === "thynkwhy") {
    return THYNKWHY_SUB_GENRE_BLUEPRINTS as SubGenreBlueprintCard[];
  }
  return [];
};

/**
 * Returns the full Genre -> Video Title -> [English, Hinglish, Urdu] Hierarchy
 * for Dhruv Rathee (or an empty array for other creators).
 */
export const getDhruvGenreHierarchy = (
  creatorOrId?: CreatorProfile | string | null
): DhruvGenreHierarchySection[] => {
  if (!isDhruvRatheeCreator(creatorOrId)) {
    return [];
  }
  return DHRUV_GENRE_HIERARCHY as DhruvGenreHierarchySection[];
};

/**
 * Returns the full Genre -> Video Title -> [English, Hinglish, Urdu] Hierarchy
 * for ThynkWhy (or an empty array for other creators).
 */
export const getThynkWhyGenreHierarchy = (
  creatorOrId?: CreatorProfile | string | null
): DhruvGenreHierarchySection[] => {
  if (!isThynkWhyCreator(creatorOrId)) {
    return [];
  }
  return THYNKWHY_GENRE_HIERARCHY as DhruvGenreHierarchySection[];
};

/**
 * Matches a user's topic (or explicit subGenreId override) to the active creator's
 * isolated Genre & Transcript Corpus.
 */
export const matchCreatorSubGenreAndTranscript = (
  creatorOrId?: CreatorProfile | string | null,
  topic: string = "",
  explicitSubGenreId: string = ""
): {
  creatorKey: string;
  isDhruv: boolean;
  isThynkWhy?: boolean;
  blueprint: SubGenreBlueprintCard;
  genreSection?: DhruvGenreHierarchySection;
  genreVideos?: DhruvGenreVideoEntry[];
  transcript: CreatorTranscriptRecord;
  allBlueprints: SubGenreBlueprintCard[];
} => {
  const key = normalizeCreatorTranscriptKey(creatorOrId);

  if (key === "dhruvrathee") {
    const matched = matchDhruvSubGenreAndTranscript(topic, explicitSubGenreId);
    return {
      creatorKey: key,
      isDhruv: true,
      isThynkWhy: false,
      blueprint: matched.blueprint as SubGenreBlueprintCard,
      genreSection: matched.genreSection as DhruvGenreHierarchySection,
      genreVideos: matched.genreVideos as DhruvGenreVideoEntry[],
      transcript: matched.transcript as CreatorTranscriptRecord,
      allBlueprints: DHRUV_SUB_GENRE_BLUEPRINTS as SubGenreBlueprintCard[]
    };
  }

  if (key === "thynkwhy") {
    const matched = matchThynkWhySubGenreAndTranscript(topic, explicitSubGenreId);
    return {
      creatorKey: key,
      isDhruv: false,
      isThynkWhy: true,
      blueprint: matched.blueprint as SubGenreBlueprintCard,
      genreSection: matched.genreSection as DhruvGenreHierarchySection,
      genreVideos: matched.genreVideos as DhruvGenreVideoEntry[],
      transcript: matched.transcript as CreatorTranscriptRecord,
      allBlueprints: THYNKWHY_SUB_GENRE_BLUEPRINTS as SubGenreBlueprintCard[]
    };
  }

  const creatorPack = (OTHER_CREATOR_TRANSCRIPT_PACKS as Record<string, any>)[key];
  const creatorBlueprints: SubGenreBlueprintCard[] =
    (creatorPack?.subGenreBlueprints as SubGenreBlueprintCard[]) || [];
  const transcripts: CreatorTranscriptRecord[] =
    (creatorPack?.transcripts as CreatorTranscriptRecord[]) || [];

  const lower = (topic || "").toLowerCase();
  let bestBlueprint =
    creatorBlueprints[0] || {
      id: `${key}_signature_style`,
      cardNumber: 1,
      title: "Creator Signature Documentary Style",
      aggressionScore: "Signature Cadence",
      aggressionAndTone: "Signature creator pacing and tone",
      signatureWordingAndPacing: "Follows creator bio file and authentic speech cadence.",
      topicTriggers: []
    };
  let bestScore = 0;

  for (const bp of creatorBlueprints) {
    let score = 0;
    for (const trigger of bp.topicTriggers || []) {
      if (lower.includes(trigger.toLowerCase())) {
        score += trigger.includes(" ") ? 3 : 2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestBlueprint = bp;
    }
  }

  const matchedTranscript =
    transcripts.find(t => t.subGenreId === bestBlueprint.id) ||
    transcripts[0] || {
      id: `${key}-default`,
      subGenreId: bestBlueprint.id,
      videoTitle: bestBlueprint.title,
      topicDomain: bestBlueprint.title,
      aggressionScore: bestBlueprint.aggressionScore,
      sourceScriptLanguage: "English / Urdu / Hinglish",
      trilingualTranscripts: {
        englishTranscript: "",
        urduTranscript: "",
        romanUrduTranscript: "",
        hindiTranscript: ""
      },
      rawTranscriptExcerpt: "",
      openingMechanics: {
        visceralStatementFormula: bestBlueprint.signatureWordingAndPacing,
        inverseCorrelationFormula: "",
        uncomfortableTruthBridge: "",
        expectationVsRealityParadox: "",
        nostalgiaMemorySelfTest: "",
        inconvenientQuestionPivot: ""
      },
      realTimeTransitions: [],
      englishMixExamples: [],
      closingMechanics: {
        antiBoycottNuance: "",
        practicalProtocol: "",
        finalMetaphorAndQuestion: ""
      }
    };

  return {
    creatorKey: key,
    isDhruv: false,
    isThynkWhy: false,
    blueprint: bestBlueprint,
    transcript: matchedTranscript,
    allBlueprints: []
  };
};

/**
 * Clean, topic-first Anti-Plagiarism Directive without repeating past-video hooks
 * (prevents the "Pink Elephant" attention trap).
 */
export const buildAntiPlagiarismDirective = (userTopic: string = ""): string => {
  const cleanTopic = (userTopic || "the user's specific topic").trim().slice(0, 300);
  return `
### CRITICAL LAW: ZERO TRANSCRIPT PLAGIARISM (ABSTRACT STYLE TRANSFER ONLY)
Reference transcripts exist ONLY to calibrate vocal cadence (12 to 18 words per sentence), conversational register, and transition bridges:
1. NEVER copy, paraphrase, or recycle sentences, hooks, case studies, or analogies from reference transcripts.
2. Your VERY FIRST SENTENCE (00:00) MUST be 100% original and lock directly onto the user's exact topic, entities, and timeframe: "${cleanTopic}".
3. Every analogy, statistic, and example in your script must be invented strictly for "${cleanTopic}".
`.trim();
};

/**
 * Extracts mathematical pacing metrics and transition word banks from the genre's
 * 3-language transcript corpus WITHOUT injecting raw copyable transcript sentences into the prompt.
 */
const extractAbstractGenreTranscriptDna = (
  videos: DhruvGenreVideoEntry[],
  isNastaliqUrdu: boolean,
  isRomanOrHinglish: boolean
) => {
  let totalSentences = 0;
  let totalWords = 0;

  const mergedUrduWords = new Set<string>();
  const mergedHinglishWords = new Set<string>();
  const mergedEnglishWords = new Set<string>();

  for (const video of videos) {
    const activeText = isNastaliqUrdu
      ? video.urduTranscribe
      : isRomanOrHinglish
      ? video.hinglishTranscribe
      : video.englishTranscribe;

    const sentences = (activeText || "")
      .split(/[.!?؟।]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);

    totalSentences += sentences.length;
    for (const s of sentences) {
      totalWords += s.split(/\s+/).filter(Boolean).length;
    }

    (video.deepWordBank?.urdu || []).forEach(w => {
      const cleanUrdu = w.replace(/\([A-Za-z0-9\s-]+\)/g, "").replace(/[A-Za-z]+/g, "").replace(/\s+/g, " ").trim();
      if (cleanUrdu) mergedUrduWords.add(cleanUrdu);
    });
    (video.deepWordBank?.hinglish || []).forEach(w => mergedHinglishWords.add(w));
    (video.deepWordBank?.english || []).forEach(w => mergedEnglishWords.add(w));
  }

  const measuredAvgWordsPerSentence =
    totalSentences > 0 ? Math.max(12, Math.min(16, Math.round(totalWords / totalSentences))) : 14;

  return {
    corpusCount: videos.length,
    corpusTitles: videos.map(v => v.videoTitle),
    measuredAvgWordsPerSentence,
    mergedUrduWords: Array.from(mergedUrduWords),
    mergedHinglishWords: Array.from(mergedHinglishWords),
    mergedEnglishWords: Array.from(mergedEnglishWords)
  };
};

/**
 * Compiles Pillar 2: The De-Lexicalized Genre Transcript DNA Extraction Block
 * isolated strictly to the active creator (Dhruv Rathee, ThynkWhy, or Other Creator).
 */
export const compileCreatorTranscriptAndSubGenreBlock = (options: {
  creator?: CreatorProfile | string | null;
  topic?: string;
  targetLanguage?: string;
  secondaryLanguage?: string;
  subGenreId?: string;
}): string => {
  const userTopic = (options.topic || "").trim() || "the user's topic";
  const matched = matchCreatorSubGenreAndTranscript(
    options.creator,
    userTopic,
    options.subGenreId || ""
  );

  const creatorName =
    typeof options.creator === "object" && options.creator?.name
      ? options.creator.name
      : matched.isDhruv
      ? "Dhruv Rathee"
      : matched.isThynkWhy
      ? "ThynkWhy"
      : "Creator";

  const lang = options.targetLanguage || "English";
  const secondLang = options.secondaryLanguage || "";
  const combinedLangCheck = `${lang} ${secondLang}`;

  const isPureUrduScript =
    lang === "Urdu (Proper)" ||
    (/urdu/i.test(lang) && !/roman/i.test(lang));
  const isRomanOrHinglish = /roman\s*urdu|hinglish|hindi/i.test(combinedLangCheck);

  const antiPlagiarismBlock = buildAntiPlagiarismDirective(userTopic);

  // ==========================================================================
  // CASE A: DHRUV RATHEE SELECTED -> DE-LEXICALIZED GENRE DNA & WORD BANK
  // ==========================================================================
  if (matched.isDhruv && matched.genreSection && matched.genreVideos?.length) {
    const genreTag = matched.genreSection.genreTag;
    const blueprint = matched.blueprint;
    const videos = matched.genreVideos;

    const extractedDna = extractAbstractGenreTranscriptDna(
      videos,
      isPureUrduScript,
      isRomanOrHinglish
    );

    const activeTranscriptFieldLabel = isPureUrduScript
      ? "urduTranscribe (Version 1: 100% Pure Urdu Nastaliq)"
      : isRomanOrHinglish
      ? "hinglishTranscribe (Version 2: Spoken Roman Urdu / Hinglish)"
      : "englishTranscribe (Version 3: Broadcast Standard English)";

    const selectedLanguageGenreTranscriptsBlock = videos
      .map((video, idx) => {
        const activeLanguageTranscript = isPureUrduScript
          ? video.urduTranscribe
          : isRomanOrHinglish
          ? video.hinglishTranscribe
          : video.englishTranscribe;
        return [
          `--- [DHRUV RATHEE GENRE VIDEO #${idx + 1}: "${video.videoTitle}" | Selected Language Stream: ${activeTranscriptFieldLabel}] ---`,
          `[Genre Tag]: ${video.genreTag} | [Tone & Aggression]: ${video.aggressionScore}`,
          activeLanguageTranscript
        ].join("\n");
      })
      .join("\n\n");

    const languageSpecificConnectorsBlock = isPureUrduScript
      ? `   • Allowed Spoken Urdu Connectors (100% Pure Urdu Script — ZERO Latin Characters Allowed):
     ${DHRUV_UNIVERSAL_SPOKEN_WORD_BANK.urduConnectorsAndWords.map(w => `"${w}"`).join(" | ")}
   • Genre-Specific Spoken Urdu Phrases (Extracted from ${extractedDna.corpusCount} '${genreTag}' Corpus Videos):
     ${extractedDna.mergedUrduWords.map(w => `"${w}"`).join(" | ")}`
      : isRomanOrHinglish
      ? `   • Allowed Conversational Hinglish / Roman Urdu Connectors:
     ${DHRUV_UNIVERSAL_SPOKEN_WORD_BANK.hinglishConnectorsAndWords.map(w => `"${w}"`).join(" | ")}
   • Genre-Specific Spoken Hinglish Connectors:
     ${extractedDna.mergedHinglishWords.map(w => `"${w}"`).join(" | ")}`
      : `   • Allowed Analytical English Connectors:
     ${DHRUV_UNIVERSAL_SPOKEN_WORD_BANK.englishConnectorsAndWords.map(w => `"${w}"`).join(" | ")}
   • Genre-Specific Analytical English Connectors:
     ${extractedDna.mergedEnglishWords.map(w => `"${w}"`).join(" | ")}`;

    return `
================================================================================
[PILLAR 2: DHRUV RATHEE GENRE TRANSCRIPT DNA ENGINE (CADENCE, TIMELINE PACING & PHRASE BANKS)]
Active Genre: [${genreTag.toUpperCase()}] (${blueprint.title}) | Target Language: ${lang} (${activeTranscriptFieldLabel})
Corpus Calibrated: ${extractedDna.corpusCount} Genre Videos (${extractedDna.corpusTitles.join(" | ")})
================================================================================
${antiPlagiarismBlock}

1. ABSTRACT HOOK FORMULA (TAILORED 100% TO "${userTopic}"):
   - [Beat 1]: Bold, counter-intuitive declarative claim or dated forensic cold-open directly addressing "${userTopic}".
   - [Beat 2]: Inverse-proportional or causal impact statement ("Jitna zyada [Topic Factor A]... utna hi [Topic Consequence B]") built strictly around "${userTopic}".
   - [Beat 3]: Immediate proof pivot citing a real study, official report, or historical record on "${userTopic}" ([CLAIM-1]).
   - [Beat 4]: Signature greeting ("Namaskar dosto!" / "نمسکار دوستو!") + step-by-step investigative roadmap.

2. PACING & SENTENCE-LENGTH MATH:
   - Genre Register: ${blueprint.aggressionAndTone}
   - Measured Corpus Sentence Length: Average ${extractedDna.measuredAvgWordsPerSentence} words per sentence (Strict ceiling: 12 to 18 words max per sentence).
   - Signature Genre Pacing Mechanics: ${blueprint.signatureWordingAndPacing}

3. CONVERSATIONAL VOCABULARY WEIGHT & TRANSITION PHRASE BANK:
${languageSpecificConnectorsBlock}

${STEP_BY_STEP_CREATOR_SCRIPT_ALGORITHM}

4. SELECTED GENRE TRANSCRIPTS IN ACTIVE LANGUAGE (${activeTranscriptFieldLabel}) — READ FOR VOCAL CADENCE, FORENSIC TIMELINE FLOW & TRANSITION STYLE ONLY (NEVER COPY PAST VIDEO TOPICS, NAMES, OR SENTENCES VERBATIM; WRITE 100% FOR "${userTopic}"):
${selectedLanguageGenreTranscriptsBlock}
===============================================================================
`.trim();
  }

  // ==========================================================================
  // CASE B: THYNKWHY SELECTED -> 5-GENRE HIERARCHY, RHYTHMIC PARALLEL CADENCE & SELECTED-LANGUAGE TRANSCRIPT READER
  // ==========================================================================
  if (matched.isThynkWhy && matched.genreSection && matched.genreVideos?.length) {
    const genreTag = matched.genreSection.genreTag;
    const blueprint = matched.blueprint;
    const videos = matched.genreVideos;

    const extractedDna = extractAbstractGenreTranscriptDna(
      videos,
      isPureUrduScript,
      isRomanOrHinglish
    );

    const activeTranscriptFieldLabel = isPureUrduScript
      ? "urduTranscribe (Version 1: 100% Pure Urdu Nastaliq)"
      : isRomanOrHinglish
      ? "hinglishTranscribe (Version 2: Spoken Roman Urdu / Urdish)"
      : "englishTranscribe (Version 3: Broadcast Standard English)";

    const selectedLanguageGenreTranscriptsBlock = videos
      .map((video, idx) => {
        const activeLanguageTranscript = isPureUrduScript
          ? video.urduTranscribe
          : isRomanOrHinglish
          ? video.hinglishTranscribe
          : video.englishTranscribe;
        return [
          `--- [THYNKWHY GENRE VIDEO #${idx + 1}: "${video.videoTitle}" | Selected Language Stream: ${activeTranscriptFieldLabel}] ---`,
          `[Genre Tag]: ${video.genreTag} | [Tone & Gravitas]: ${video.aggressionScore}`,
          activeLanguageTranscript
        ].join("\n");
      })
      .join("\n\n");

    const thynkwhyConnectorsBlock = isPureUrduScript
      ? `   • Allowed ThynkWhy Rhythmic & Parallel Urdu Connectors (100% Pure Urdu Nastaliq — Zero Latin Letters):
     ${THYNKWHY_UNIVERSAL_SPOKEN_WORD_BANK.urduConnectorsAndWords.map(w => `"${w}"`).join(" | ")}
   • Genre-Specific Urdu Rhythmic Phrases ('${genreTag}'):
     ${extractedDna.mergedUrduWords.map(w => `"${w}"`).join(" | ")}`
      : isRomanOrHinglish
      ? `   • Allowed ThynkWhy Spoken Roman Urdu / Urdish Rhythmic Connectors:
     ${THYNKWHY_UNIVERSAL_SPOKEN_WORD_BANK.hinglishConnectorsAndWords.map(w => `"${w}"`).join(" | ")}
   • Genre-Specific Roman Urdu / Urdish Phrases ('${genreTag}'):
     ${extractedDna.mergedHinglishWords.map(w => `"${w}"`).join(" | ")}`
      : `   • Allowed ThynkWhy Broadcast English Documentary Connectors:
     ${THYNKWHY_UNIVERSAL_SPOKEN_WORD_BANK.englishConnectorsAndWords.map(w => `"${w}"`).join(" | ")}
   • Genre-Specific English Phrases ('${genreTag}'):
     ${extractedDna.mergedEnglishWords.map(w => `"${w}"`).join(" | ")}`;

    return `
================================================================================
[PILLAR 2: THYNKWHY (MUAZZAM SHAH) 5-GENRE RHYTHMIC & PARABLE DNA ENGINE]
Active ThynkWhy Genre: [${genreTag.toUpperCase()}] (${blueprint.title}) | Target Language: ${lang} (${activeTranscriptFieldLabel})
Genre Domain: ${blueprint.aggressionAndTone}
Corpus Calibrated: ${extractedDna.corpusCount} Genre Videos (${extractedDna.corpusTitles.join(" | ")})
================================================================================
${antiPlagiarismBlock}

1. THYNKWHY PARABLE, HISTORICAL-CONTRAST & MIRROR HOOK ARCHITECTURE (TAILORED 100% TO "${userTopic}"):
   - [Beat 1 — Parable / Allegory or Historical-to-Modern Contrast Scene]: Open with a vivid historical/moral parable (تمثیلی آغاز — like the little sparrow over Nimrod's fire) OR a stark historical-to-modern contrast scene ("پہلے رقاصائیں کوٹھوں پر محفلیں سجاتی تھیں، اب کوٹھے صرف ایک کلک کے فاصلے پر آ چکے ہیں") anchored 100% on "${userTopic}".
   - [Beat 2 — Personal Moral Agency or Interconnected Case Studies]: Pivot to a piercing self-accountability question ("کیا آج ہم اپنے حصے کا کام کر رہے ہیں؟") OR weave 3 interconnected real-world case studies ("یہ سب کیسے ہو رہا ہے؟ اسے سمجھنے کے لیے تین کرداروں کی سچی کہانیوں کو دیکھنا ہوگا") strictly for "${userTopic}".
   - [Beat 3 — Unraveling the 'Why' (کیوں کی کھوج)]: Contrast superficial noise ("میں ٹی وی چینلز والی ڈرامے بازی نہیں کروں گا۔ بولنا تو بعد کا مرحلہ ہے، اس سے پہلے سوچنا ضروری ہے کہ بولنا کیا ہے!") with the deeper truth and verified evidence ([CLAIM-1]).
   - IMPORTANT: Never use Dhruv Rathee's greeting ("Namaskar dosto!"). Maintain ThynkWhy's high-gravitas (8.5–9/10), investigative, brotherly, and philosophical documentary voice.

2. NON-CLINICAL RHYTHMIC & RHYMING PARALLEL CLAUSES (ہم قافیہ و ہم آہنگ جملے — EXCLUSIVE TO THYNKWHY):
   - ZERO DRY CLINICAL SCIENCE JARGON: Do NOT write ThynkWhy like a laboratory biology/physics textbook. Instead of clinical jargon, ThynkWhy's signature power comes from **rhythmic, matching, and parallel clauses** where consecutive phrases rhyme or echo each other's cadence:
     * Urdu Rhythm Pattern: "کہانیاں سنا کر زمانہ بدلنے آیا ہے، معاشرے کی منفی سوچ کو مثبت سوچ سے بدلنے آیا ہے۔ ہر ضروری معلومات آپ تک پہنچانے آیا ہے، سینہ بہ سینہ علم بڑھانے کا سلسلہ آپ سے جوڑنے آیا ہے۔"
     * Urdu Parallel Triplet: "نہ پڑھائی کی محنت، نہ اچھے نمبر لانے کا دباؤ، اور نہ نوکری کے لیے ڈگری کی محتاجی!" ("Na padhai par focus karne ki zaroorat, na ache marks ka pressure, aur na naukri ke liye degree ki pareshani!")
     * Urdu Contrast Rhythm: "بات ہوگی ڈنکے کی چوٹ پر، اور چوٹ لگنے پر تھوڑا درد تو ہوگا، مگر یقین مانیے مقصد درد پہنچانا نہیں بلکہ درد پر مرہم رکھنا اور معاشرہ سنوارنا ہے۔"
     * Rhyming Couplet Cadence: "مگر آج یہ مقصد کہیں کھو گیا ہے، زندگی کا مقصد سو گیا ہے۔" ("Magar aaj yeh Why kahin kho gaya hai, zindagi ka maqsad so gaya hai.")
     * Crescendo Question Cadence: "وہ سوال جو آپ کو غلط راستے پر جانے سے روک دے؛ وہ سوال جو آپ کو حق کی راہ پر گامزن کر دے؛ وہ سوال جو آپ کی فکر بدل دے اور نیا راستہ دکھائے!"
   - Measured Corpus Sentence Length: Average ${extractedDna.measuredAvgWordsPerSentence} words per sentence (12 to 18 words per sentence).
   - Signature Genre Pacing Mechanics: ${blueprint.signatureWordingAndPacing}

3. THYNKWHY RHYTHMIC VOCABULARY & BLENDED PHRASE BANK:
${thynkwhyConnectorsBlock}

${THYNKWHY_STEP_BY_STEP_SCRIPT_ALGORITHM}

4. SELECTED GENRE TRANSCRIPTS IN ACTIVE LANGUAGE (${activeTranscriptFieldLabel}) — READ FOR RHYTHMIC WORD-BLENDING, PARALLEL CLAUSE FLOW & STORYTELLING CADENCE ONLY (NEVER COPY PAST VIDEO TOPICS, NAMES, OR SENTENCES VERBATIM; WRITE 100% FOR "${userTopic}"):
${selectedLanguageGenreTranscriptsBlock}
================================================================================
`.trim();
  }

  // ==========================================================================
  // CASE C: ALL OTHER CREATORS (NITISH, VERITASIUM, MRBEAST, HORMOZI, NAVAL, PETERSON, IMAN, SHARAN, RAFTAR)
  // ==========================================================================
  const { blueprint, transcript } = matched;
  const transitions = (transcript?.realTimeTransitions || []).join(" | ");
  const mixExamples = (transcript?.englishMixExamples || []).join(" | ");

  return `
================================================================================
[PILLAR 2: CREATOR CADENCE & TRANSITION ENGINE — ${creatorName.toUpperCase()}]
Profile Style: ${blueprint.title} | Target Language: ${lang}
================================================================================
${antiPlagiarismBlock}

1. CREATOR SIGNATURE VOICE & PACING DNA (${creatorName}):
   - Tone & Register: ${blueprint.aggressionAndTone}
   - Signature Wording & Pacing: ${blueprint.signatureWordingAndPacing}
   - Sentence Length Law: Average 12 to 16 words per sentence (maximum 18 words per sentence).
   ${transitions ? `- Signature Transitions: ${transitions}` : ""}
   ${mixExamples ? `- Key Vocabulary Register: ${mixExamples}` : ""}

2. TOPIC-FIRST ANCHORING & CREATOR ISOLATION:
   - Sentence #1 and Sentence #2 at [00:00] MUST immediately anchor onto "${userTopic}" using ${creatorName}'s authentic opening style.
   - Do NOT use greetings or catchphrases belonging to other creators (never use "Namaskar dosto!" unless the creator is Dhruv Rathee).
================================================================================
`.trim();
};
