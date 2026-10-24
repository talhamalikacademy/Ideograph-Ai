/**
 * ============================================================================
 * DHRUV RATHEE — ANALYTICAL, FORENSIC & EMPIRICAL EXPLAINER ALGORITHM
 * (`src/data/creatorAlgos/dhruvRatheeAlgo.ts`)
 * ----------------------------------------------------------------------------
 * EXCLUSIVE TO DHRUV RATHEE:
 * Defines Dhruv Rathee's analytical explainer algorithm, inverse-proportional
 * contrast hooks, forensic dated timelines, plain-language 2-sentence mechanism
 * analogies, and empirical source attribution.
 * ============================================================================
 */

import {
  SCIENCE_AI_TRAINED_ALGO_DNA,
  STEP_BY_STEP_CREATOR_SCRIPT_ALGORITHM,
  DHRUV_UNIVERSAL_SPOKEN_WORD_BANK
} from "../creatorTranscripts/dhruv_rathee.js";

export {
  SCIENCE_AI_TRAINED_ALGO_DNA,
  STEP_BY_STEP_CREATOR_SCRIPT_ALGORITHM,
  DHRUV_UNIVERSAL_SPOKEN_WORD_BANK
};

export const buildDhruvRatheeDedicatedAlgoBlock = (
  userTopic: string = "",
  targetLanguage: string = "Urdu (Proper)"
): string => {
  const cleanTopic = (userTopic || "the user's topic").trim();
  const isPureUrdu =
    targetLanguage === "Urdu (Proper)" ||
    (/urdu/i.test(targetLanguage) && !/roman/i.test(targetLanguage));
  const isRoman = /roman|hinglish|hindi/i.test(targetLanguage);

  const connectorsSample = isPureUrdu
    ? DHRUV_UNIVERSAL_SPOKEN_WORD_BANK.urduConnectorsAndWords.slice(0, 12).join(" | ")
    : isRoman
    ? DHRUV_UNIVERSAL_SPOKEN_WORD_BANK.hinglishConnectorsAndWords.slice(0, 12).join(" | ")
    : DHRUV_UNIVERSAL_SPOKEN_WORD_BANK.englishConnectorsAndWords.slice(0, 12).join(" | ");

  return `
================================================================================
[DHRUV RATHEE DEDICATED CREATOR ALGORITHM (\`src/data/creatorAlgos/dhruvRatheeAlgo.ts\`) — FORENSIC TIMELINE & FIRST-PRINCIPLES EXPLAINER]
Active Topic: "${cleanTopic}" | Active Language: ${targetLanguage}
================================================================================
1. DHRUV RATHEE HOOK & OPENING CADENCE (STRICTLY ANALYTICAL / FORENSIC — ZERO POETIC IDIOMS):
   - Open at [00:00] with either:
     * **Mode A (Science / Tech / Economy Explainer):** A bold, counter-intuitive claim on "${cleanTopic}" + Inverse-Proportional Contrast ("جتنا زیادہ [فیکٹر اے]... اتنا ہی کم [نتیجہ بی]" / "Jitna zyada [Factor A]... utna hi kam [Outcome B]") + Immediate Study/Report Proof ([CLAIM-1]) + "نمسکار دوستو!" + Step-by-Step Roadmap ("آئیے آج کی اس ویڈیو میں اس کے پیچھے کے پورے سسٹم کو اسٹیپ بائی اسٹیپ سمجھتے ہیں").
     * **Mode B (Politics / Investigative Scandal / Protest Exposé):** Open directly on an exact dated & timed forensic scene ("20 جولائی، صبح کے ٹھیک چار بج کر چالیس منٹ..." / Exact date, location, and eyewitness anomaly) + escalate with verifiable timeline evidence before the roadmap.
2. PLAIN-LANGUAGE MECHANISM + 2-SENTENCE PHYSICAL ANALOGY:
   - Whenever explaining a scientific, economic, or legal mechanism in "${cleanTopic}", bridge with "جن لوگوں کو اس کی بنیادی سمجھ نہیں ہے، ان کے لیے آسان لفظوں میں بتاتا ہوں..." and follow with a 2-sentence cause-and-effect everyday analogy.
3. NUMBERED STRUCTURAL DRIVERS & PRE-EMPTED OBJECTIONS:
   - Break complex causes into numbered signposts ("اس کے پیچھے دو بنیادی وجوہات ہیں۔ پہلی وجہ یہ کہ... دوسرا سبب یہ ہے کہ...", "پوائنٹ نمبر ون... پوائنٹ نمبر ٹو...").
   - Pre-empt viewer doubts out loud ("لیکن ایک منٹ رکو — یہاں ایک بڑا سوال کھڑا ہوتا ہے...").
4. SIGNATURE SPOKEN CONNECTORS FOR DHRUV RATHEE:
   - ${connectorsSample}
================================================================================
`.trim();
};
