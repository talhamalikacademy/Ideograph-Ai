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
import {
  RAFTAR_SUB_GENRE_BLUEPRINTS,
  RAFTAR_GENRE_HIERARCHY,
  RAFTAR_TRANSCRIPTS,
  RAFTAR_STEP_BY_STEP_SCRIPT_ALGORITHM,
  RAFTAR_UNIVERSAL_SPOKEN_WORD_BANK,
  RAFTAR_SULTANAT_E_ZARDARIYA_VERBATIM,
  matchRaftarSubGenreAndTranscript
} from "./raftar.js";
import { OTHER_CREATOR_TRANSCRIPT_PACKS } from "./other_creators.js";
import {
  getCreatorAlgorithmDirective,
  THYNKWHY_RHYTHMIC_CADENCE_PATTERNS,
  buildThynkWhyDeepRhythmicAlgoBlock,
  buildDhruvRatheeDedicatedAlgoBlock,
  buildOtherCreatorDedicatedAlgoBlock
} from "../creatorAlgos";

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
  RAFTAR_SUB_GENRE_BLUEPRINTS,
  RAFTAR_GENRE_HIERARCHY,
  RAFTAR_TRANSCRIPTS,
  RAFTAR_STEP_BY_STEP_SCRIPT_ALGORITHM,
  RAFTAR_UNIVERSAL_SPOKEN_WORD_BANK,
  RAFTAR_SULTANAT_E_ZARDARIYA_VERBATIM,
  OTHER_CREATOR_TRANSCRIPT_PACKS,
  matchDhruvSubGenreAndTranscript,
  matchThynkWhySubGenreAndTranscript,
  matchRaftarSubGenreAndTranscript,
  getCreatorAlgorithmDirective,
  THYNKWHY_RHYTHMIC_CADENCE_PATTERNS,
  buildThynkWhyDeepRhythmicAlgoBlock,
  buildDhruvRatheeDedicatedAlgoBlock,
  buildOtherCreatorDedicatedAlgoBlock
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
 * Returns true ONLY when the active creator is Raftar TV.
 */
export const isRaftarCreator = (
  creatorOrId?: CreatorProfile | string | null
): boolean => {
  return normalizeCreatorTranscriptKey(creatorOrId) === "raftar";
};

/**
 * Returns true when the active creator has a dedicated Genre Hierarchy step in the UI
 * (Dhruv Rathee's 5 Genres, ThynkWhy's 5 Genres, or Raftar TV's 6 Genres).
 */
export const hasCreatorGenreHierarchy = (
  creatorOrId?: CreatorProfile | string | null
): boolean => {
  const key = normalizeCreatorTranscriptKey(creatorOrId);
  return key === "dhruvrathee" || key === "thynkwhy" || key === "raftar";
};

/**
 * Returns the isolated Genre Blueprint Cards for the active creator:
 * - Dhruv Rathee -> DHRUV_SUB_GENRE_BLUEPRINTS (Dhruv's 5 genres ONLY)
 * - ThynkWhy     -> THYNKWHY_SUB_GENRE_BLUEPRINTS (ThynkWhy's 5 genres ONLY)
 * - Raftar TV    -> RAFTAR_SUB_GENRE_BLUEPRINTS (Raftar TV's 6 genres ONLY)
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
  if (key === "raftar") {
    return RAFTAR_SUB_GENRE_BLUEPRINTS as SubGenreBlueprintCard[];
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
 * Returns the full 6-Genre -> Video Title -> [English, Hinglish, Urdu] Hierarchy
 * for Raftar TV (or an empty array for other creators).
 */
export const getRaftarGenreHierarchy = (
  creatorOrId?: CreatorProfile | string | null
): DhruvGenreHierarchySection[] => {
  if (!isRaftarCreator(creatorOrId)) {
    return [];
  }
  return RAFTAR_GENRE_HIERARCHY as DhruvGenreHierarchySection[];
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
  isRaftar?: boolean;
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
      isRaftar: false,
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
      isRaftar: false,
      blueprint: matched.blueprint as SubGenreBlueprintCard,
      genreSection: matched.genreSection as DhruvGenreHierarchySection,
      genreVideos: matched.genreVideos as DhruvGenreVideoEntry[],
      transcript: matched.transcript as CreatorTranscriptRecord,
      allBlueprints: THYNKWHY_SUB_GENRE_BLUEPRINTS as SubGenreBlueprintCard[]
    };
  }

  if (key === "raftar") {
    const matched = matchRaftarSubGenreAndTranscript(topic, explicitSubGenreId);
    return {
      creatorKey: key,
      isDhruv: false,
      isThynkWhy: false,
      isRaftar: true,
      blueprint: matched.blueprint as SubGenreBlueprintCard,
      genreSection: matched.genreSection as DhruvGenreHierarchySection,
      genreVideos: matched.genreVideos as DhruvGenreVideoEntry[],
      transcript: matched.transcript as CreatorTranscriptRecord,
      allBlueprints: RAFTAR_SUB_GENRE_BLUEPRINTS as SubGenreBlueprintCard[]
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
### CRITICAL LAW: ZERO TRANSCRIPT PLAGIARISM (ABSTRACT STYLE & RHYTHM TRANSFER ONLY)
Reference transcripts exist ONLY to calibrate vocal cadence (12 to 18 words per sentence), conversational register, rhythmic parallel clauses, and transition bridges:
1. NEVER copy, paraphrase, or recycle sentences, opening hooks, dates, case studies, or analogies from reference transcripts.
2. NEVER start a script with past-video hooks or facts (such as the November 2022 OpenAI release date, reaching 1 million / 10 lakh users in 5 days compared to Netflix and Facebook, writing poems and coding vs Google Search, the 10-year phone number memory test, or MIT 54-participant essay tests) UNLESS the user explicitly asked for those exact historical facts inside "${cleanTopic}".
3. Your VERY FIRST SENTENCE (00:00) MUST be 100% original and lock directly onto the user's exact topic, entities, and timeframe: "${cleanTopic}".
4. Every analogy, statistic, and example in your script must be invented strictly for "${cleanTopic}". Never output literal bracketed mask tokens like [PAST_VIDEO_DATE] or [PAST_VIDEO_METRIC] in your final script.
`.trim();
};

/**
 * Masks past-video specific dates, numbers, and case-study nouns when projecting a reference
 * transcript into the LLM prompt so the model absorbs 100% of the creator's spoken cadence,
 * connectors, and rhythmic parallel sentence structures WITHOUT copying past video facts into the Hook.
 * (Note: The underlying transcript files `dhruv_rathee.js` and `thynkwhy.js` remain 100% verbatim and untouched.)
 */
const maskPastVideoTopicFactsForStyleReading = (
  rawTranscript: string,
  userTopic: string = ""
): string => {
  if (!rawTranscript) return "";
  const lowerTopic = (userTopic || "").toLowerCase();
  let masked = rawTranscript;

  // Mask November 2022 / 5-day 1 million (10 lakh) Netflix/Facebook record unless user topic explicitly asks for 2022 ChatGPT launch history
  if (!lowerTopic.includes("2022") && !lowerTopic.includes("netflix")) {
    masked = masked
      .replace(/نومبر\s*2022/g, "[ماضی کی تاریخ]")
      .replace(/November\s*2022/gi, "[PAST_DATE]")
      .replace(/دس لاکھ صارفین تک پہنچنے میں نیٹ فلکس کو ساڑھے تین سال لگے تھے، فیس بک کو دس مہینے اور انسٹاگرام کو ڈھائی مہینے لگے تھے—لیکن چیٹ جی پی ٹی نے صرف پانچ دنوں کے اندر دس لاکھ صارفین کا ہدف پورا کر لیا!/g, "[پلیٹ فارم اے کو یہ ہدف پورا کرنے میں سالوں لگے تھے، لیکن اس نئے سسٹم نے صرف چند دنوں کے اندر ریکارڈ توڑ دیا!]")
      .replace(/1 million users tak pahunchne mein Netflix ko 3\.5 saal ka samay laga tha, Facebook ko 10 mahine lage the, Instagram ko 2\.5 mahine lage the—lekin ChatGPT ne yeh 1 million users ka benchmark sirf aur sirf 5 dino mein cross kar diya!/gi, "[Platform A ko is benchmark tak pahunchne mein saalon lage the—lekin is naye system ne yeh record kuch hi dino mein cross kar diya!]")
      .replace(/while reaching one million active users required three and a half years for Netflix, ten months for Facebook, and two and a half months for Instagram, ChatGPT achieved that exact benchmark in precisely five days\./gi, "[while reaching that benchmark required years for legacy platforms, this system achieved that exact milestone in record time.]");
  }

  // Mask 10-year phone-number memory opening test unless user topic explicitly mentions phone numbers
  if (!lowerTopic.includes("phone number") && !lowerTopic.includes("فون نمبر")) {
    masked = masked
      .replace(/AI آپ کے دماغ کو دھیرے دھیرے کھوکھلا کیے جا رہا ہے۔/g, "[موجودہ ٹاپک کا پہلا تیز اور چونکا دینے والا دعویٰ]۔")
      .replace(/AI aapke dimagh ko dheere-dheere khokhla kiye ja raha hai\./gi, "[User topic ka pehla sharp aur bold claim].")
      .replace(/AI is slowly hollowing out your brain\./gi, "[ Sharp opening claim directly on the user's topic ].")
      .replace(/آج سے قریب 10 سال پہلے یاد کر کے دیکھو دوستو—آپ کو کتنے فون نمبرز زبانی یاد تھے؟[^!]+!/g, "آج سے کچھ سال پہلے کا موازنہ کر کے دیکھو دوستو—[روزمرہ زندگی کی تبدیلی کی مثال]!");
  }

  return masked;
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
          `[WARNING — STYLE, RHYTHM & CONNECTOR REFERENCE ONLY: Do NOT copy any facts, dates, or case studies from this reference video into "${userTopic}"]`,
          maskPastVideoTopicFactsForStyleReading(activeLanguageTranscript, userTopic)
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

${getCreatorAlgorithmDirective({
  creator: options.creator,
  topic: userTopic,
  targetLanguage: lang
})}

4. SELECTED GENRE TRANSCRIPTS IN ACTIVE LANGUAGE (${activeTranscriptFieldLabel}) — READ FOR VOCAL CADENCE, FORENSIC TIMELINE FLOW & TRANSITION STYLE ONLY (NEVER COPY PAST VIDEO TOPICS, DATES, NAMES, OR SENTENCES VERBATIM; WRITE 100% FOR "${userTopic}"):
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
          `[WARNING — RHYTHMIC WORD-BLENDING & PARALLEL CLAUSE REFERENCE ONLY: Do NOT copy past video facts or names verbatim into "${userTopic}"]`,
          maskPastVideoTopicFactsForStyleReading(activeLanguageTranscript, userTopic)
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
[PILLAR 2: THYNKWHY (MUAZZAM SHAH) 5-GENRE INVESTIGATIVE DOCUMENTARY & PHILOSOPHICAL DNA ENGINE]
Active ThynkWhy Genre: [${genreTag.toUpperCase()}] (${blueprint.title}) | Target Language: ${lang} (${activeTranscriptFieldLabel})
Genre Domain: ${blueprint.aggressionAndTone}
Corpus Calibrated: ${extractedDna.corpusCount} Genre Videos (${extractedDna.corpusTitles.join(" | ")})
================================================================================
${antiPlagiarismBlock}

1. THYNKWHY 3-FORMULA STARTING HOOK ARCHITECTURE (TAILORED 100% TO "${userTopic}"):
   - ThynkWhy starts are NEVER abstract poems or vague musings. Choose EXACTLY ONE of these 3 formulas derived directly from real transcripts:
     * Formula A (Dated Incident / Historical Raid Cold Open): Open inside a concrete dated scene (e.g., General Zia-ul-Haq's grand operation in Lahore's Heera Mandi with people fleeing under curfew, or the furnace of Babylon) anchored 100% on "${userTopic}", then pivot: "پہلے یہ کوٹھوں پر محفلیں سجاتی تھیں، اب کوٹھے صرف ایک کلک کے فاصلے پر آ چکے ہیں!"
     * Formula B (Sensational Media Quote vs. Street Reality Contrast): Open with sensational TV studio screaming anchor quotes, then contrast with street-level reality ("خوشی کی بات یہ ہے کہ... یہ آوازیں ٹی وی اسٹوڈیوز کی تھیں جن کے اینکرز ایئر کنڈیشنڈ اسٹوڈیوز میں بیٹھ کر گلا پھاڑ پھاڑ کر چیخ رہے تھے... مگر عین اسی لمحے اصل سڑکوں پر لوگ اطمینان سے چائے پی رہے تھے!").
     * Formula C (Three Named Interconnected Case Studies): Introduce 3 real people of different ages/cities affected by this crisis (e.g., 16-year-old student Kajol in Chandigarh hospital, 21-year-old Sajid in hospital, Daphne in Vegas) and ask what common predatory system connects them.
   - Hook Culmination Question: The hook MUST close with an inescapable question of personal agency or why:
     "کیا آج ہم اپنے حصے کا کام کر رہے ہیں؟ آپ کا نہیں معلوم، مگر میرے پاس اس سوال کا جواب ہے۔" / "Kya aaj hum apne hissay ka kaam kar rahe hain? Aapka nahi pata, magar mere paas is sawal ka jawab hai."
   - IMPORTANT: Never use Dhruv Rathee's greeting ("Namaskar dosto!"). Maintain ThynkWhy's high-gravitas (8.5–9/10), investigative, brotherly, and philosophical documentary voice.

2. STRICT ANTI-POETRY & ANTI-RHYME LAW (ZERO POETRY / ZERO RHYMING COUPLETS — EXCLUSIVE TO THYNKWHY):
   - ABSOLUTE BAN ON POETRY: ThynkWhy (Muazzam Shah) is an investigative documentary filmmaker, NOT an Urdu poet. NEVER write rhyming poetry, couplets, ghazals, or song-like verses (ہم قافیہ شاعری یا اشعار قطعی ممنوع ہیں).
   - Sentences must NOT end in matching rhyming words like a poem. Every factual, historical, and investigative sentence must be spoken naturally for the human ear.
   - Conversational Spoken Brotherly Delivery: Blend literary Urdu depth with warm spoken brotherly cadence:
     * "او بھائی، بولنا تو بعد کا مرحلہ ہے، اس سے پہلے سوچنا ضروری ہے کہ بولنا کیا ہے!" ("Oh bhai, bolna agla step hai! Us se pehle soch lo ke bolna kya hai!")
     * "بات ہوگی ڈنکے کی چوٹ پر، اور چوٹ لگنے پر تھوڑا درد تو ہوگا، مگر یقین مانیے مقصد درد پہنچانا نہیں بلکہ درد پر مرہم رکھنا ہے!" ("Baat hogi danke ki chot par, aur chot lagne par thoda dard toh hoga yaar, magar yaqeen karein maqsad dard pohanchana nahi, dard par marham rakhna hai!")
     * "تھوڑا سا غور کرو تو سمجھ آئے گا..." ("Thoda sa ghour karo toh samajh aayega...")
     * "اپنے حصے کا کام..." ("Apne hissay ka kaam...")
   - Connect Evidence to Real Books, Memoirs & Insider Testimonies:
     Cite real memoirs (like Qudratullah Shahab's 'Shahab Nama'), official audit data, hospital statistics, or whistleblower confessions.
   - Measured Corpus Sentence Length: Average ${extractedDna.measuredAvgWordsPerSentence} words per sentence (12 to 18 words per sentence).
   - Signature Genre Pacing Mechanics: ${blueprint.signatureWordingAndPacing}

3. THYNKWHY AUTHENTIC ENDING VERDICTS (NOT A POEM!):
   - Never close with a rhyming stanza. Close with a historical verdict on the predatory system or media deception, culminating in a piercing self-accountability question:
     * Ending Verdict 1 (Historical Law & Society Awakening): "تاریخ کا ایک اٹل قانون ہے... جب کوئی قوم حقائق سے آنکھیں چرا کر اپنے ہی بنائے ہوئے جھوٹے بیانیے کے نشے میں مبتلا ہو جائے، تو اس کا غرور اسی طرح آسمان سے زمین پر آ گرتا ہے۔ سوال یہ ہے کہ کیا خطے کا میڈیا اور عوام اس جنگی جنون کے پیچھے چھپی سیاسی دوکانداری کو کبھی سمجھ پائیں گے؟ سوچیے گا ضرور!"
     * Ending Verdict 2 (Critical Thinking & The Power of Why): "ضروری ہے کہ آپ کے اندر ایک سچی سوچ پیدا ہو، کیونکہ سوچ ہی سوال کو جنم دیتی ہے۔ وہ سوال جو آپ کو غلط راستے پر جانے سے روک دے؛ وہ سوال جو آپ کو حق کی راہ پر گامزن کر دے؛ وہ سوال جو آپ کی فکر بدل دے اور نیا راستہ دکھائے... اگلی دستاویزی فلم اس سے بھی زیادہ چونکا دینے والی ہوگی۔ تب تک کے لیے خدا حافظ!"
     * Ending Verdict 3 (Personal Responsibility & Action): "یہ صرف کسی ایک فرد کا مسئلہ نہیں، یہ ہمارے گھروں کے اندر داخل ہو چکی وہ آگ ہے جسے ہم نے خود اسکرینوں کی صورت میں اپنے بچوں کے ہاتھ میں پکڑا دیا ہے۔ سوال یہ ہے کہ کیا ہم اب بھی خاموش تماشائی بنے رہیں گے یا اپنے حصے کا کام کریں گے؟ فیصلہ آپ کے ہاتھ میں ہے!"

4. THYNKWHY VOCABULARY & SPOKEN CONNECTORS:
${thynkwhyConnectorsBlock}

${THYNKWHY_STEP_BY_STEP_SCRIPT_ALGORITHM}

${getCreatorAlgorithmDirective({
  creator: options.creator,
  topic: userTopic,
  targetLanguage: lang
})}

5. SELECTED GENRE TRANSCRIPTS IN ACTIVE LANGUAGE (${activeTranscriptFieldLabel}) — READ FOR CONCRETE STARTING INCIDENTS, EVIDENCE CONNECTIONS, AND ENDING VERDICTS ONLY (NEVER WRITE POETRY; WRITE 100% FOR "${userTopic}"):
${selectedLanguageGenreTranscriptsBlock}
================================================================================
`.trim();
  }

  // ==========================================================================
  // CASE C: RAFTAR TV SELECTED -> 6-GENRE HIERARCHY, ARYAN ZERO-REPETITION STANDARD & SELECTED-LANGUAGE TRANSCRIPT READER
  // ==========================================================================
  if (matched.isRaftar && matched.genreSection && matched.genreVideos?.length) {
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
          `--- [RAFTAR TV GENRE VIDEO #${idx + 1}: "${video.videoTitle}" | Selected Language Stream: ${activeTranscriptFieldLabel}] ---`,
          `[Genre Tag]: ${video.genreTag} | [Tone & Gravitas]: ${video.aggressionScore}`,
          `[WARNING — INVESTIGATIVE CADENCE & ARCHIVAL FLOW REFERENCE ONLY: Do NOT copy past video facts or sentences verbatim into "${userTopic}"]`,
          maskPastVideoTopicFactsForStyleReading(activeLanguageTranscript, userTopic)
        ].join("\n");
      })
      .join("\n\n");

    const raftarConnectorsBlock = isPureUrduScript
      ? `   • Allowed Raftar TV Investigative Urdu Connectors (100% Pure Urdu Nastaliq — Zero Latin Letters):
     ${RAFTAR_UNIVERSAL_SPOKEN_WORD_BANK.urduConnectorsAndWords.map(w => `"${w}"`).join(" | ")}
   • Genre-Specific Urdu Investigative Phrases ('${genreTag}'):
     ${extractedDna.mergedUrduWords.map(w => `"${w}"`).join(" | ")}`
      : isRomanOrHinglish
      ? `   • Allowed Raftar TV Spoken Roman Urdu / Urdish Investigative Connectors:
     ${RAFTAR_UNIVERSAL_SPOKEN_WORD_BANK.hinglishConnectorsAndWords.map(w => `"${w}"`).join(" | ")}
   • Genre-Specific Roman Urdu / Urdish Phrases ('${genreTag}'):
     ${extractedDna.mergedHinglishWords.map(w => `"${w}"`).join(" | ")}`
      : `   • Allowed Raftar TV Broadcast English Documentary Connectors:
     ${RAFTAR_UNIVERSAL_SPOKEN_WORD_BANK.englishConnectorsAndWords.map(w => `"${w}"`).join(" | ")}
   • Genre-Specific English Phrases ('${genreTag}'):
     ${extractedDna.mergedEnglishWords.map(w => `"${w}"`).join(" | ")}`;

    return `
================================================================================
[PILLAR 2: RAFTAR TV (@raftartv) 6-GENRE INVESTIGATIVE & ARCHIVAL DNA ENGINE]
Active Raftar TV Genre: [${genreTag.toUpperCase()}] (${blueprint.title}) | Target Language: ${lang} (${activeTranscriptFieldLabel})
Genre Sub-Pillars: ${blueprint.aggressionAndTone}
Corpus Calibrated: ${extractedDna.corpusCount} Genre Videos (${extractedDna.corpusTitles.join(" | ")})
================================================================================
${antiPlagiarismBlock}

1. RAFTAR TV LITERARY PARABLE OR ARCHIVAL CHRONOLOGY HOOK (TAILORED 100% TO "${userTopic}"):
   - [Beat 1 — Literary Parable or Dated Archival Scene]: Open with a haunting literary/historical parable (like Alif Laila's Tasemah-Pa / Old Man of the Sea, George Orwell's 1984, or the 1904 Clever Hans illusion) OR a dated archival flashpoint ("کہانی کی شروعات ہوتی ہے...") anchored 100% on "${userTopic}".
   - [Beat 2 — Official Claim vs. Ground Reality]: Contrast the official state/corporate narrative with hard Pakistani/regional institutional numbers (PIDE, PBS, HRCP, P@SHA, NEPRA, KWSB, IMF) and Rupee economics ([CLAIM-1]).
   - [Beat 3 — Follow-the-Money & Street Geography]: Name exact neighborhoods (Lyari, Kati Pahari, Orangi Town, Korangi, Clifton/DHA, Lahore, Constitution Avenue) and trace who profits from keeping the system broken.
   - IMPORTANT: Never use Dhruv Rathee's greeting ("Namaskar dosto!"). Maintain Raftar TV's high-authority investigative newsroom documentary voice.

2. ARYAN'S ANTI-FLUFF & ZERO-REPETITION STANDARD (OCTOBER 2026 RAFTAR TV BENCHMARK):
   - ZERO GENERIC PHILOSOPHICAL FLUFF: Never write vague philosophical essays ("Script ke andar bohot si generic cheezein hain, koi khaas baat nahi hui").
   - ZERO IDEA REPETITION: Never repeat the same idea in 4–5 differently worded sentences to pad length ("Ek hi baat ko lamba karne ke liye chaar-paanch jumlon mein repeat nahi karna"). Every 3 sentences MUST advance the investigation with a new dated event, report, Rupee figure, or named institutional actor.
   - Measured Corpus Sentence Length: Average ${extractedDna.measuredAvgWordsPerSentence} words per sentence (12 to 18 words per sentence).
   - Signature Genre Pacing Mechanics: ${blueprint.signatureWordingAndPacing}

3. RAFTAR TV INVESTIGATIVE VOCABULARY & PHRASE BANK:
${raftarConnectorsBlock}

${RAFTAR_STEP_BY_STEP_SCRIPT_ALGORITHM}

${getCreatorAlgorithmDirective({
  creator: options.creator,
  topic: userTopic,
  targetLanguage: lang
})}

4. SELECTED GENRE TRANSCRIPTS IN ACTIVE LANGUAGE (${activeTranscriptFieldLabel}) — READ FOR ARCHIVAL PACING, FOLLOW-THE-MONEY STRUCTURE & CONNECTOR CADENCE ONLY (NEVER COPY PAST VIDEO TOPICS, NAMES, OR SENTENCES VERBATIM; WRITE 100% FOR "${userTopic}"):
${selectedLanguageGenreTranscriptsBlock}
================================================================================
`.trim();
  }

  // ==========================================================================
  // CASE D: ALL OTHER CREATORS (NITISH, VERITASIUM, MRBEAST, HORMOZI, NAVAL, PETERSON, IMAN, SHARAN)
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

${getCreatorAlgorithmDirective({
  creator: options.creator,
  topic: userTopic,
  targetLanguage: lang
})}
================================================================================
`.trim();
};
