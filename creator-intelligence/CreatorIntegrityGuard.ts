import { CreatorBio, CreatorProfile } from "../types";

/**
 * ============================================================================
 * CREATOR INTEGRITY GUARD & AI READ/TRAIN ACCESS CONTROLLER
 * ============================================================================
 * Enforces a strict backend-level READ-ONLY / ZERO-EDIT permission model for:
 *   - All Creator DNA files in `/creators/*.ts` (e.g., `dhruv.ts`, `nitish.ts`, etc.)
 *   - All Creator Intelligence files in `/creator-intelligence/*.ts`
 *     (`CreatorDNA.ts`, `AutoChooser.ts`, `CreatorBlender.ts`, `CreatorStyleLint.ts`,
 *      `ThumbnailEngine.ts`, `CreatorIntegrityGuard.ts`)
 *
 * 1. FULL READ, STYLE-TRAINING & GENERATION USAGE (ALLOWED = TRUE):
 *    AI models and backend generation services have 100% unrestricted READ access
 *    to every Creator DNA file (`/creators/*.ts`) and Creator Intelligence file
 *    (`/creator-intelligence/*.ts`). Models may read them and use their logic,
 *    words, signature phrases, vocabulary banks, transitions, and structural
 *    blueprints to generate scripts, shorts, blends, titles, and hooks.
 *
 * 2. BACKEND-LEVEL SOURCE FILE & MEMORY WRITE-PROTECTION (EDIT = FALSE):
 *    Neither `/creators/*.ts` (such as `dhruv.ts` or `nitish.ts`) nor
 *    `/creator-intelligence/*.ts` are editable at the backend or AI agent level.
 *    Not a single word in these files may be edited, modified, summarized, or
 *    overwritten. Every CreatorBio and CreatorProfile object is recursively frozen
 *    in memory (`deepFreeze`) and verified with an FNV-1a checksum at runtime.
 * ============================================================================
 */

export const AI_MODEL_CREATOR_LOCK_POLICY = Object.freeze({
  protectedDirectories: Object.freeze(["/creators/", "/creator-intelligence/"]),
  protectedDirectory: "/creators/",
  protectedFiles: Object.freeze([
    "/creators/dhruv.ts",
    "/creators/nitish.ts",
    "/creators/thynkwhy.ts",
    "/creators/mrbeast.ts",
    "/creators/naval.ts",
    "/creators/raftar.ts",
    "/creators/hormozi.ts",
    "/creators/peterson.ts",
    "/creators/veritasium.ts",
    "/creators/iman.ts",
    "/creators/sharan.ts"
  ]),
  protectedCreatorIntelligenceFiles: Object.freeze([
    "/creator-intelligence/CreatorDNA.ts",
    "/creator-intelligence/AutoChooser.ts",
    "/creator-intelligence/CreatorBlender.ts",
    "/creator-intelligence/CreatorStyleLint.ts",
    "/creator-intelligence/ThumbnailEngine.ts",
    "/creator-intelligence/CreatorIntegrityGuard.ts"
  ]),
  allowDirectAiEdit: false,
  allowBackendLevelEdit: false,
  requireExplicitUserPermission: true,
  // Explicitly grant AI models full read, style-training, and generation usage permissions ONLY
  permissions: Object.freeze({
    readCreatorDocument: true,
    readCreatorIntelligenceFiles: true,
    trainAndConditionOnCreatorStyle: true,
    copyAndUseCreatorWordsInScripts: true,
    useSignaturePhrasesAndVocabularyInApp: true,
    useCreatorIntelligenceToGenerate: true,
    modifyOrOverwriteSourceDocument: false,
    modifyOrOverwriteCreatorIntelligenceFiles: false,
    editSingleWordAtBackendLevel: false
  }),
  policyStatement:
    "STRICT READ-ONLY / ZERO-EDIT BACKEND LOCK: Just like /creators/dhruv.ts and /creators/nitish.ts, all Creator Profile files (/creators/*.ts) and all Creator Intelligence files (/creator-intelligence/*.ts) are strictly non-editable at the backend level. AI models may ONLY read these files and use them to generate scripts and outputs — not a single word may be edited, modified, or overwritten."
});

export const CREATOR_INTELLIGENCE_LOCK_POLICY = AI_MODEL_CREATOR_LOCK_POLICY;

/**
 * Computes a deterministic FNV-1a 32-bit fingerprint of a creator's serialized bio
 * to detect any unauthorized runtime mutation of the source profile.
 */
export function computeCreatorFingerprint(bio: CreatorBio): string {
  const serialized = JSON.stringify(bio);
  let hash = 0x811c9dc5;
  for (let i = 0; i < serialized.length; i++) {
    hash ^= serialized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Recursively freezes an object and all of its nested arrays/properties
 * so that the source document and intelligence modules can be freely read
 * and used by the AI to generate outputs while remaining 100% locked against
 * in-place mutation of even a single word.
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Object.isFrozen(obj)) {
    return obj;
  }

  Object.freeze(obj);

  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as Record<string, any>)[prop];
    if (
      value !== null &&
      (typeof value === "object" || typeof value === "function") &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value);
    }
  });

  return obj;
}

// Registry of boot-time fingerprints for every creator
const BOOT_FINGERPRINTS = new Map<string, string>();

/**
 * Locks source profiles against mutation while registering them for full AI read/generation access.
 */
export function lockCreatorProfiles(creators: CreatorProfile[]): CreatorProfile[] {
  creators.forEach((creator) => {
    const fingerprint = computeCreatorFingerprint(creator.bio);
    BOOT_FINGERPRINTS.set(creator.id, fingerprint);
    deepFreeze(creator.bio);
    deepFreeze(creator);
  });
  return creators;
}

/**
 * Locks any Creator Intelligence module or configuration object in memory
 * so it can only be read and executed for script generation, never mutated at runtime.
 */
export function lockCreatorIntelligenceModule<T extends object>(moduleExport: T): Readonly<T> {
  return deepFreeze(moduleExport);
}

/**
 * Verifies that the original CreatorProfile source document has not been mutated,
 * and returns a read-only reference for AI training and script generation.
 */
export function verifyCreatorContextIntegrity(creator: CreatorProfile): Readonly<CreatorBio> {
  const expected = BOOT_FINGERPRINTS.get(creator.id);
  if (expected) {
    const current = computeCreatorFingerprint(creator.bio);
    if (current !== expected) {
      throw new Error(
        `[CreatorIntegrityGuard] SECURITY VIOLATION: The source file context for creator "${creator.name}" was altered without permission (Expected hash ${expected}, got ${current}). Not a single word of Creator DNA or Creator Intelligence may be edited.`
      );
    }
  }
  return deepFreeze(creator.bio);
}

/**
 * Extracts the complete lexicon of words, signature phrases, reserved genre keywords,
 * and stylistic expressions from a creator's document so the AI model can freely
 * read and use them inside generated scripts and app features without mutating the source.
 */
export function extractCreatorUsableLexicon(creator: CreatorProfile): {
  vocabulary: string[];
  signaturePhrases: string[];
  genreKeywords: string[];
  styleCues: string[];
} {
  const bio = verifyCreatorContextIntegrity(creator);
  const vocabList = Array.isArray(bio.voice?.vocabulary)
    ? [...bio.voice.vocabulary]
    : (bio.voice?.vocabulary || "")
        .split(/[,;.]/)
        .map(s => s.trim())
        .filter(Boolean);

  const sigPhrases = [
    ...(bio.signaturePhrases || []),
    ...(bio.voice?.signaturePhrases || [])
  ];

  const genreKeywords: string[] = [];
  if (bio.deepGenreEngine?.genreBlueprints) {
    Object.values(bio.deepGenreEngine.genreBlueprints).forEach(bp => {
      bp.reservedKeywords.forEach(kw => {
        if (!genreKeywords.includes(kw)) genreKeywords.push(kw);
      });
    });
  }

  return {
    vocabulary: vocabList,
    signaturePhrases: sigPhrases,
    genreKeywords,
    styleCues: [...(bio.styleCues || [])]
  };
}
