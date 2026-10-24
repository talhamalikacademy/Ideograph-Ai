/**
 * ============================================================================
 * UNIFIED CREATOR ALGORITHM ROUTER (`src/data/creatorAlgos/index.ts`)
 * ----------------------------------------------------------------------------
 * Routes each creator strictly to its own isolated algorithm module:
 *   - `dhruvrathee` -> `dhruvRatheeAlgo.ts` (Analytical, Forensic, Inverse-Contrast & First-Principles)
 *   - `thynkwhy`    -> `thynkwhyAlgo.ts`    (Rhythmic Rhyming Verb-Chains in Hooks, High-Aggression Targeting & Philosophical 'Why')
 *   - All Others    -> `otherCreatorsAlgo.ts`
 * ============================================================================
 */

import { CreatorProfile } from "../../types";
import {
  THYNKWHY_RHYTHMIC_CADENCE_PATTERNS,
  buildThynkWhyDeepRhythmicAlgoBlock
} from "./thynkwhyAlgo";
import {
  buildDhruvRatheeDedicatedAlgoBlock,
  SCIENCE_AI_TRAINED_ALGO_DNA,
  STEP_BY_STEP_CREATOR_SCRIPT_ALGORITHM,
  DHRUV_UNIVERSAL_SPOKEN_WORD_BANK
} from "./dhruvRatheeAlgo";
import {
  OTHER_CREATOR_ALGO_MAP,
  buildOtherCreatorDedicatedAlgoBlock
} from "./otherCreatorsAlgo";

export {
  THYNKWHY_RHYTHMIC_CADENCE_PATTERNS,
  buildThynkWhyDeepRhythmicAlgoBlock,
  buildDhruvRatheeDedicatedAlgoBlock,
  SCIENCE_AI_TRAINED_ALGO_DNA,
  STEP_BY_STEP_CREATOR_SCRIPT_ALGORITHM,
  DHRUV_UNIVERSAL_SPOKEN_WORD_BANK,
  OTHER_CREATOR_ALGO_MAP,
  buildOtherCreatorDedicatedAlgoBlock
};

export const resolveCreatorAlgoKey = (
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
 * Returns the dedicated Creator Algorithm Directive strictly for the selected creator.
 */
export const getCreatorAlgorithmDirective = (options: {
  creator?: CreatorProfile | string | null;
  topic?: string;
  targetLanguage?: string;
}): string => {
  const key = resolveCreatorAlgoKey(options.creator);
  const topic = options.topic || "";
  const lang = options.targetLanguage || "Urdu (Proper)";

  if (key === "thynkwhy") {
    return buildThynkWhyDeepRhythmicAlgoBlock(topic, lang);
  }
  if (key === "dhruvrathee") {
    return buildDhruvRatheeDedicatedAlgoBlock(topic, lang);
  }
  return buildOtherCreatorDedicatedAlgoBlock(key, topic, lang);
};
