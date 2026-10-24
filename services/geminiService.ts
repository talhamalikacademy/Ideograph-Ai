/**
 * Unified facade re-exporting all modular domain services and LLM helpers.
 * Preserves 100% backward compatibility with all existing imports across the app.
 */
export * from "./schemas";
export * from "./languagePolicies";
export * from "./preGenerationRules";
export * from "./scriptService";
export * from "./analysisService";
export * from "./packagingService";
export {
  generateVisualPreview,
  editGeneratedImage,
  generateVerticalVisualPreview
} from "./visualService";
export * from "./clipperService";
export * from "./ttsAndCueService";
export * from "./devilsAdvocateService";
export * from "./exportService";
export * from "./budget";
export * from "./researchTargets";
export * from "./sourceService";
export * from "./researchService";
export * from "./longFormService";
export * from "./claimService";
export {
  sanitizeCitationsWithGrounding,
  sanitizeCitationsFromSources,
  runGroundedJson
} from "../llm/groundedJson";



