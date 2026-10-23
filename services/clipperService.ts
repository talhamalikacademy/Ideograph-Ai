import {
  CreatorProfile,
  CreatorStyleSchema,
  GeneratorConfig,
  ShortClipperStyleBlueprint,
  ShortsClipperPackage
} from "../types";
import { executeShortsClipperPipeline } from "../shorts-clipper";

export * from "../shorts-clipper";

/**
 * MODULE 1: One-Click Shorts/Reels Clipper
 * Connects the UI & services layer directly to `/shorts-clipper/clipperLogic.ts` and `/shorts-clipper/clipperRules.ts`.
 */
export const generateVerticalShortsFromLongScript = async (
  longFormScriptText: string,
  config: GeneratorConfig,
  selectedCreator:
    | CreatorProfile
    | CreatorStyleSchema
    | ShortClipperStyleBlueprint
    | string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<ShortsClipperPackage> => {
  return executeShortsClipperPipeline(
    longFormScriptText,
    config,
    selectedCreator,
    apiKey,
    signal
  );
};

