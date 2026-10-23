import { DevilsAdvocateReport } from "../types";
import {
  executeArgumentCheckerResearch,
  ArgumentCheckMode
} from "../argument-checker";

export * from "../argument-checker";

/**
 * MODULE 4: "Argument & Fact Checker" (Standalone Deep-Research System)
 * Connects the UI & services layer directly to `/argument-checker/argumentCheckerLogic.ts`.
 */
export const runDevilsAdvocateResearch = async (
  inputContent: string,
  mode: ArgumentCheckMode,
  apiKey?: string,
  signal?: AbortSignal
): Promise<DevilsAdvocateReport> => {
  return executeArgumentCheckerResearch(inputContent, mode, apiKey, signal);
};
