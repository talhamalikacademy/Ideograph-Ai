export {
  THYNKWHY_SUB_GENRE_BLUEPRINTS,
  THYNKWHY_GENRE_HIERARCHY,
  THYNKWHY_TRANSCRIPTS,
  THYNKWHY_STEP_BY_STEP_SCRIPT_ALGORITHM,
  THYNKWHY_UNIVERSAL_SPOKEN_WORD_BANK,
  THYNKWHY_MUAZZAM_SHAH_MANIFESTO_VERBATIM,
  THYNKWHY_DIGITAL_HEERA_MANDI_EXPOSE_VERBATIM,
  THYNKWHY_MILITARY_GEOPOLITICS_NARRATIVE_WARFARE_VERBATIM,
  matchThynkWhySubGenreAndTranscript,
  isThynkWhyCreator,
  getThynkWhyGenreHierarchy,
  getSubGenreBlueprintsForCreator,
  matchCreatorSubGenreAndTranscript,
  compileCreatorTranscriptAndSubGenreBlock,
  normalizeCreatorTranscriptKey
} from "../src/data/creatorTranscripts";

export type {
  SubGenreBlueprintCard,
  CreatorTranscriptRecord,
  TrilingualTranscriptSet,
  DhruvGenreVideoEntry,
  DhruvGenreHierarchySection
} from "../src/data/creatorTranscripts";
