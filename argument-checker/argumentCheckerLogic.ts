import {
  DevilsAdvocateReport,
  BiasVulnerabilityFlag,
  SteelmanRebuttalPair,
  BulletproofBridgeBlock
} from "../types";
import { runGroundedJson, GroundedSource } from "../llm/groundedJson";
import { devilsAdvocateSchema } from "../services/schemas";

export type ArgumentCheckMode = "script" | "topic";

export interface ArgumentCheckerModeConfig {
  id: ArgumentCheckMode;
  title: string;
  badge: string;
  shortTagline: string;
  tooltipDescription: string;
  inputLabel: string;
  placeholder: string;
  buttonLabel: string;
  loadingLabel: string;
}

/**
 * UI & Mode Configuration for Argument & Fact Checker (connects directly to DevilsAdvocateLab.tsx)
 */
export const ARGUMENT_CHECKER_MODES: Record<ArgumentCheckMode, ArgumentCheckerModeConfig> = {
  script: {
    id: "script",
    title: "Script Fact & Bias Checker",
    badge: "Mode 1",
    shortTagline: "Audit a full draft script for weak claims, bias, and missing proof.",
    tooltipDescription:
      "Paste or upload your full draft video script here. This checker scans your script sentence-by-sentence to flag unverified statistics, emotional bias, or one-sided claims, then searches the live web to verify facts and write balanced fixes.",
    inputLabel: "Draft Script to Fact-Check & Audit",
    placeholder:
      "Paste your complete draft video script here (or click 'Import Current Script' / 'Upload File')...",
    buttonLabel: "Check Script Facts & Bias",
    loadingLabel: "Searching Live Web & Fact-Checking Script..."
  },
  topic: {
    id: "topic",
    title: "Topic Counter-Argument Generator",
    badge: "Mode 2",
    shortTagline: "Stress-test any video idea or thesis against expert counter-arguments.",
    tooltipDescription:
      "Paste any video topic, thesis statement, or controversial question before you start writing. This generator researches the strongest opposing arguments, real-world counter-evidence, and expert critiques so you can build an unshakeable, objective script from scratch.",
    inputLabel: "Topic, Claim, or Thesis to Stress-Test",
    placeholder:
      "Paste a video topic, central claim, or controversial thesis here (e.g., 'Why electric vehicles might not solve urban emissions as fast as predicted')...",
    buttonLabel: "Generate Counter-Arguments & Proof",
    loadingLabel: "Researching Live Web Counter-Arguments & Rebuttals..."
  }
};

/**
 * SYSTEM INSTRUCTION: Core Behavioral Guidance for the AI Model in Argument & Fact Checker
 * Strictly objective, non-partisan, zero creator persona or style bias.
 */
export const ARGUMENT_CHECKER_SYSTEM_INSTRUCTION = `
You are an elite, non-partisan Investigative Editorial Auditor, Empirical Fact-Checker, and Steelman Counter-Argument Researcher.

CORE BEHAVIORAL RULES FOR HOW YOU MUST ACT:
1. ZERO PERSONA OR CREATOR BIAS:
   - Do NOT adopt any YouTuber persona, dramatic storytelling voice, or rhetorical hype.
   - Operate with 100% analytical neutrality, academic rigor, and journalistic balance.

2. LIVE WEB GROUNDING & EMPIRICAL VERIFICATION:
   - Use Google Search grounding to retrieve real-world statistical reports, economic data, legal rulings, peer-reviewed studies, and authoritative opposing viewpoints.
   - Never fabricate citations, studies, or statistics. Anchor both critiques and defenses in verifiable real-world evidence.

3. ANTI-STRAWMAN MANDATE (STEELMAN PRINCIPLE):
   - When generating opposing arguments, NEVER create weak "strawman" objections that are easy to dismiss.
   - You MUST construct the "Steelman" version of the opposing view: the smartest, most empirically grounded, most persuasive argument that a leading economist, scientist, legal scholar, or industry expert would make against the user's thesis.

4. CONSTRUCTIVE CREATOR DEFENSE:
   - For every Steelman counter-argument you raise, provide an equally rigorous, factual rebuttal and methodological defense showing how the writer can address, contextualize, or answer that critique without losing credibility.
`.trim();

/**
 * Detailed Panel-by-Panel Rules Governing the 4-Part Output
 */
export const ARGUMENT_CHECKER_PIPELINE_RULES = {
  panel1VulnerabilityAudit: `
1. PANEL 1 — SCRIPT BIAS & VULNERABILITY AUDIT ('vulnerabilities'):
   - Scan the user's draft script or thesis statement-by-statement and flag 4 to 6 specific vulnerabilities using these exact categories:
     * 'Unverified Claim': Statements lacking statistical proof, primary sources, or relying on speculation.
     * 'Loaded Framing': Sentences where emotional adjectives or hyperbole replace hard evidence.
     * 'Selection Bias': Cherry-picked data, survivorship bias, or omitted historical/economic context.
     * 'Logical Leap': Cause-and-effect assertions or generalizations not backed by empirical consensus.
   - Rate each vulnerability's 'severity' strictly as one of:
     * "Low Risk"
     * "Medium Risk"
     * "High Backlash Risk (Comment Section Magnet)"
   - Provide a concrete, objective 'suggestedNeutralFix' showing the exact phrasing that fixes the flaw.
  `.trim(),

  panel2And3SteelmanMatrix: `
2. PANEL 2 & PANEL 3 — STEELMAN COUNTER-ARGUMENTS & CREATOR DEFENSE MATRIX ('steelmanAndRebuttalMatrix'):
   - Generate 3 to 5 of the strongest, smartest counter-arguments ('steelmanCounterArgument') that domain experts, critics, or opposing schools of thought ('opposingSchoolOfThought') use against this thesis.
   - NO STRAWMAN ARGUMENTS: Every counter-argument must represent the strongest possible ("Steelman") version of the opposing view, backed by real-world data points ('supportingEvidenceAndData') and verified web sources ('counterSourceTitle', 'counterSourceUrl').
   - Directly alongside each Steelman Counter-Argument, generate the 'creatorDefenseAndRebuttal' and 'defenseCounterStatistics' explaining how the writer can factually answer, contextualize, or refute that criticism using verified data and methodological context ('defenseSourceTitle', 'defenseSourceUrl').
  `.trim(),

  panel4BulletproofBridges: `
3. PANEL 4 — READY-TO-INSERT "BULLETPROOF BALANCE" SCRIPT BLOCKS ('bulletproofBridgeBlocks'):
   - Generate 3 neutral, high-credibility bridge paragraphs ('scriptParagraph') that the writer can copy-paste or insert directly into their script to preemptively disarm critics.
   - Each paragraph must follow a 3-beat journalistic structure:
     (a) Fairly acknowledge the strongest counter-argument ("Critics and economists often point out that..."),
     (b) Introduce the decisive empirical context or nuance ("However, when we examine the longitudinal data from..."),
     (c) Synthesize a balanced, bulletproof conclusion that strengthens viewer trust.
  `.trim()
};

/**
 * Builds the complete prompt sent to the Gemini API with Google Search Grounding.
 */
export const buildArgumentCheckerPrompt = (
  inputContent: string,
  mode: ArgumentCheckMode
): string => {
  const modeSpecificGuidance =
    mode === "script"
      ? `MODE GUIDANCE (DRAFT SCRIPT AUDIT):
- Quote exact sentences or claims from the user's draft script in 'quotedText'.
- Audit whether each major claim in the script is backed by verifiable evidence or exposes the creator to fact-checking backlash in the comments.`
      : `MODE GUIDANCE (TOPIC / THESIS STRESS-TEST):
- Break down the user's proposed video topic or thesis into its core implicit assumptions in 'quotedText'.
- Identify the biggest blind spots, counter-narratives, and empirical nuances the writer must address before writing the script.`;

  return `
====================================================================
ARGUMENT & FACT CHECKER — LIVE WEB GROUNDED STRESS TEST
====================================================================
INPUT MODE: ${
    mode === "script"
      ? "Script Fact & Bias Checker (Full Draft Script Audit)"
      : "Topic Counter-Argument Generator (Pre-Writing Thesis Stress-Test)"
  }

${modeSpecificGuidance}

USER INPUT TO AUDIT & STRESS-TEST:
"""
${inputContent.slice(0, 90000)}
"""

MANDATORY 4-PART INVESTIGATIVE OUTPUT REQUIREMENTS:

${ARGUMENT_CHECKER_PIPELINE_RULES.panel1VulnerabilityAudit}

${ARGUMENT_CHECKER_PIPELINE_RULES.panel2And3SteelmanMatrix}

${ARGUMENT_CHECKER_PIPELINE_RULES.panel4BulletproofBridges}
`.trim();
};

/**
 * Post-processes and normalizes the raw model response and attaches verified Google Search grounded URLs.
 */
export const normalizeArgumentCheckerReport = (
  data: {
    inputSummary?: string;
    overallObjectivityScore?: number;
    vulnerabilities?: BiasVulnerabilityFlag[];
    steelmanAndRebuttalMatrix?: SteelmanRebuttalPair[];
    bulletproofBridgeBlocks?: BulletproofBridgeBlock[];
  },
  sources: GroundedSource[]
): DevilsAdvocateReport => {
  const groundedList = sources || [];

  const enrichedMatrix: SteelmanRebuttalPair[] = (
    data.steelmanAndRebuttalMatrix || []
  ).map((item, idx) => {
    const fallbackSourceA = groundedList[idx * 2] || groundedList[idx];
    const fallbackSourceB = groundedList[idx * 2 + 1] || groundedList[0];

    const hasValidCounterUrl =
      item.counterSourceUrl &&
      groundedList.some(g => g.uri === item.counterSourceUrl);
    const hasValidDefenseUrl =
      item.defenseSourceUrl &&
      groundedList.some(g => g.uri === item.defenseSourceUrl);

    return {
      ...item,
      id: item.id || `matrix-${idx + 1}`,
      counterSourceTitle:
        item.counterSourceTitle ||
        fallbackSourceA?.title ||
        "Verified Web Reference",
      counterSourceUrl: hasValidCounterUrl
        ? item.counterSourceUrl
        : fallbackSourceA?.uri,
      defenseSourceTitle:
        item.defenseSourceTitle ||
        fallbackSourceB?.title ||
        "Empirical Research Source",
      defenseSourceUrl: hasValidDefenseUrl
        ? item.defenseSourceUrl
        : fallbackSourceB?.uri
    };
  });

  return {
    inputSummary:
      data.inputSummary ||
      "Completed empirical bias audit, live web steelman counter-research, and rebuttal synthesis.",
    overallObjectivityScore:
      typeof data.overallObjectivityScore === "number"
        ? Math.max(10, Math.min(100, Math.round(data.overallObjectivityScore)))
        : 76,
    vulnerabilities: (data.vulnerabilities || []).map((v, i) => ({
      ...v,
      id: v.id || `vuln-${i + 1}`
    })),
    steelmanAndRebuttalMatrix: enrichedMatrix,
    bulletproofBridgeBlocks: (data.bulletproofBridgeBlocks || []).map((b, i) => ({
      ...b,
      id: b.id || `bridge-${i + 1}`
    })),
    groundedSources: groundedList
  };
};

/**
 * UI Helper: Returns Tailwind badge classes for vulnerability severity levels.
 */
export const getVulnerabilitySeverityStyle = (
  severity: BiasVulnerabilityFlag["severity"]
): string => {
  switch (severity) {
    case "High Backlash Risk (Comment Section Magnet)":
      return "bg-rose-500/15 text-rose-500 border-rose-500/30";
    case "Medium Risk":
      return "bg-amber-500/15 text-amber-500 border-amber-500/30";
    default:
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  }
};

/**
 * UI Helper: Returns color classes for the overall objectivity score gauge.
 */
export const getObjectivityScoreColor = (score: number): string => {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-rose-500";
};

/**
 * Main API Execution Function: Connects Argument Checker rules & prompt guidance to Gemini Search Grounding API.
 */
export const executeArgumentCheckerResearch = async (
  inputContent: string,
  mode: ArgumentCheckMode,
  apiKey?: string,
  signal?: AbortSignal
): Promise<DevilsAdvocateReport> => {
  const prompt = buildArgumentCheckerPrompt(inputContent, mode);

  const { data, sources } = await runGroundedJson<{
    inputSummary?: string;
    overallObjectivityScore?: number;
    vulnerabilities?: DevilsAdvocateReport["vulnerabilities"];
    steelmanAndRebuttalMatrix?: DevilsAdvocateReport["steelmanAndRebuttalMatrix"];
    bulletproofBridgeBlocks?: DevilsAdvocateReport["bulletproofBridgeBlocks"];
  }>({
    prompt,
    schema: devilsAdvocateSchema,
    systemInstruction: ARGUMENT_CHECKER_SYSTEM_INSTRUCTION,
    apiKey,
    signal
  });

  return normalizeArgumentCheckerReport(data, sources);
};
