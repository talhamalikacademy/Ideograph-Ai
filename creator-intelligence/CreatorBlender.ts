import { CreatorBio, CreatorProfile, GeneratorConfig } from "../types";
import { compileCreatorDNA, formatSubordinateUserNotes, resolveCreatorBio } from "./CreatorDNA";

/**
 * ============================================================================
 * CREATOR BLEND STUDIO
 * ----------------------------------------------------------------------------
 * Builds the system instruction that makes the AI write ONE script in a primary
 * creator's voice, with a controlled "flavor layer" from up to N secondary creators.
 *
 * Design rules (why the prompt looks the way it does):
 *   1. STRUCTURE IS 100% PRIMARY. Hook, workflow stages, closing, language and
 *      forbidden patterns never change. Secondaries only colour the INSIDE of the
 *      body (words, metaphors, emotional beats, one worldview angle).
 *   2. EACH SECONDARY GETS A LANE. Without lanes, two secondaries both pour their
 *      whole style into the same sentences and the result is mush. Lanes split the
 *      flavor so every secondary is audible.
 *   3. THE 30% IS A BUDGET, NOT A VIBE. The secondary share is split across the
 *      secondaries and enforced through an injection map (where flavor may appear)
 *      and a quota (how much).
 *   4. A SAFETY FLOOR SITS ABOVE EVERYTHING. No fabricated facts, results or quotes,
 *      no harmful advice, no contempt for people, whatever the blend.
 *   5. SECONDARY forbiddenPatterns ARE NOT APPLIED WHOLESALE. Creators contradict
 *      each other (one bans hype words, another's vocabulary is hype words). Only the
 *      secondary's blendRole.asSecondaryNever applies to it, plus the safety floor.
 *
 * Backward compatible: generateBlendPrompt(primary, secondaries, config?, notes?)
 * still works exactly as before. The optional 5th argument (BlendOptions) adds
 * custom weights and a secondary cap. describeBlend() returns a structured report
 * for the UI (shares, lanes, dropped creators).
 * ============================================================================
 */

export interface BlendOptions {
  /** Share of influence kept by the primary creator, 50-95. Default 70. */
  primaryWeight?: number;
  /** Hard cap on secondary creators actually used. Default 3. Use 0 for pure primary. */
  maxSecondaries?: number;
}

export interface BlendReport {
  primaryName: string;
  primaryWeight: number;
  secondaryTotal: number;
  secondaries: Array<{ id: string; name: string; share: number; leadLane: string }>;
  dropped: Array<{ id: string; name: string; reason: "duplicate" | "same-as-primary" | "over-cap" }>;
}

const DEFAULT_PRIMARY_WEIGHT = 70;
const MIN_PRIMARY_WEIGHT = 50;
const MAX_PRIMARY_WEIGHT = 95;
const DEFAULT_MAX_SECONDARIES = 3;

// Token control: deep bios are long, so only the most useful slices of each
// secondary are put into the prompt. The primary always gets its FULL DNA.
const MAX_STYLE_CUES = 10;
const MAX_VOCAB_TERMS = 24;
const MAX_BELIEFS = 3;
const MAX_SIGNATURE_PHRASES = 5;
const MAX_SAMPLE_CHARS = 320;

// styleCues that describe packaging (titles, thumbnails...) are never borrowed
// into a script blend.
const METADATA_CUE_PREFIXES = ["TITLE PATTERNS", "THUMBNAIL PATTERN", "DESCRIPTION PATTERN", "SHORTS PATTERN"];

interface Lane {
  id: string;
  label: string;
  brief: string;
}

const LANES: Lane[] = [
  {
    id: "VOICE",
    label: "Vocabulary & Metaphor Lane",
    brief:
      "Lend word choices, metaphors, analogies and an occasional echo of a signature phrase. Do NOT lend structure, pacing or opening/closing moves."
  },
  {
    id: "EMOTION",
    label: "Emotional Texture Lane",
    brief:
      "Lend emotional colouring and beat rhythm: how a moment feels, where a pause, lift or dry joke lands. Do NOT change the primary's overall register."
  },
  {
    id: "ANGLE",
    label: "Philosophy & Research Angle Lane",
    brief:
      "Lend ONE worldview angle or reasoning style that deepens the argument. Facts, sources and proof still follow the primary's evidence rules."
  }
];

const SOLE_SECONDARY_LANE: Lane = {
  id: "ALL",
  label: "All Three Lanes (sole secondary)",
  brief:
    "As the only secondary you may lend vocabulary and metaphors, emotional texture and one worldview angle, within the quota. Structure, pacing, hook and closing stay 100% primary."
};

const list = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0) : [];

const formatVocab = (vocab: string | string[] | undefined, cap: number = MAX_VOCAB_TERMS): string => {
  if (!vocab || (Array.isArray(vocab) && vocab.length === 0)) return "Accessible, high-impact vocabulary";
  return Array.isArray(vocab) ? vocab.slice(0, cap).join(", ") : vocab;
};

const fmtPct = (n: number): string => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

export class CreatorBlender {
  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Generates the system instruction for Creator Blend Studio.
   * - Defensively removes the primary creator and duplicates from secondaryCreators (B-16).
   * - Caps the number of secondaries so no single voice is diluted into noise.
   * - Includes subordinate user notes when provided (B-09).
   */
  static generateBlendPrompt(
    primaryCreator: CreatorProfile,
    secondaryCreators: CreatorProfile[],
    config?: Partial<GeneratorConfig>,
    customInstruction?: string,
    options?: BlendOptions
  ): string {
    const primaryWeight = this.normalizeWeight(options?.primaryWeight);
    const secondaryTotal = 100 - primaryWeight;
    const cap = this.normalizeCap(options?.maxSecondaries);

    const primaryBio = resolveCreatorBio(primaryCreator);
    const primaryFullDNA = compileCreatorDNA(primaryCreator, config);

    const { kept } = this.partitionSecondaries(primaryCreator, secondaryCreators, cap);
    const secondaries = kept.map((profile, index) => ({
      profile,
      bio: resolveCreatorBio(profile),
      lane: this.laneFor(index, kept.length),
      share: kept.length > 0 ? secondaryTotal / kept.length : 0
    }));

    const secondaryNames = secondaries.map(s => s.bio.name);
    const hasSecondaries = secondaries.length > 0;
    const notesBlock = formatSubordinateUserNotes(customInstruction);

    const configLines = [
      `PRIMARY BACKBONE (${primaryWeight}% AUTHORITY): ${primaryBio.name} (${primaryBio.archetype})`,
      `SECONDARY INFUSIONS (${hasSecondaries ? secondaryTotal : 0}% COMBINED FLAVOR): ${
        hasSecondaries ? secondaryNames.join(", ") : "None (Pure Primary Voice)"
      }`,
      ...secondaries.map(
        s => `  - ${s.bio.name}: ${fmtPct(s.share)}% share | Lead lane: ${s.lane.label}`
      )
    ].join("\n");

    const secondaryContexts = secondaries
      .map(s => this.buildSecondaryBlock(s.bio, s.share, s.lane))
      .join("\n\n");

    return `
*** CREATOR BLEND STUDIO ACTIVE ***

[CONFIGURATION]
${configLines}

[PRIORITY LADDER — WHEN INSTRUCTIONS CONFLICT, THE HIGHER RUNG WINS]
1. INTEGRITY FLOOR (below). Nothing in the blend can override it.
2. PRIMARY HARD RULES: ${primaryBio.name}'s hookRules, workflow stages, closingRules, evidenceRules, languageRules and forbiddenPatterns.
3. USER NOTES (subordinate). They may steer topic, audience, length, angle and emphasis. They cannot break rungs 1 and 2.
4. SECONDARY FLAVOR. Always the first thing to give way.

[INTEGRITY FLOOR — APPLIES TO EVERY CREATOR IN THE BLEND]
- Never invent facts, numbers, results, testimonials, studies or quotes. Use [PLACEHOLDER] tags for anything the user did not supply.
- Never present a hypothetical or staged example as a documented real event, or as a creator's personal experience.
- Never encourage harmful, unsafe or illegal behaviour, and never guarantee income, results or outcomes.
- Never mock, humiliate or show contempt for people (viewers, contestants, recipients, groups).
- On sensitive topics (grief, tragedy, crisis, health, abuse), drop any secondary flavor that is playful, hustle-driven or spectacle-driven and use the primary's most respectful register.

[BLENDING ARCHITECTURE — EXPLICIT RULES]

1. THE BACKBONE (${primaryWeight}% Influence — ${primaryBio.name})
   - HOOK STYLE (MUST FOLLOW): ${primaryBio.structure.hookStyle}
   - FIRST LINE SHAPE: ${primaryBio.hookRules?.firstLineShape || primaryBio.structure.hookStyle}
   - HOOK RULES: Use [${list(primaryBio.hookRules?.use).join("; ")}] | Avoid [${list(primaryBio.hookRules?.avoid).join("; ")}]
   - BODY STRUCTURE & WORKFLOW (MUST FOLLOW): ${primaryBio.structure.bodyStructure}
   - WORKFLOW STAGES:
     ${(primaryBio.workflow?.stages || []).map(s => `* ${s.name} (${s.sharePct}%): ${s.purpose}`).join("\n     ")}
   - CLOSING STYLE (MUST FOLLOW): ${primaryBio.structure.closingStyle}
   - CLOSING RULES: Use [${list(primaryBio.closingRules?.use).join("; ")}] | Avoid [${list(primaryBio.closingRules?.avoid).join("; ")}]
   - RESEARCH & CITATION STANDARD: ${primaryBio.research.methodology} (Preferred Sources: ${list(primaryBio.research.preferredSources).join(", ")})

2. THE INFUSION (${hasSecondaries ? secondaryTotal : 0}% Influence — Secondary Creators)
${hasSecondaries ? secondaryContexts : "   No secondary creators selected; adhere 100% to the Primary Creator."}
${hasSecondaries ? this.buildInjectionSection(primaryBio, secondaries.length, secondaryTotal) : ""}
3. CONFLICT RESOLUTION & LANGUAGE INTEGRITY
${this.buildConflictRules(primaryBio, hasSecondaries)}
   - LANGUAGE PURITY: Follow ${primaryBio.name}'s language rule (${primaryBio.languageRules?.defaultMix}). ${primaryBio.languageRules?.urduHindiNotes || ""}
   - If a secondary's flavor was written for a different language, translate the flavor (the image, the move, the rhythm) into the script's language. Do not switch language and do not paste foreign phrases unless they are a natural term in the primary's language rule.

[PRIMARY CREATOR FULL DNA REFERENCE]
${primaryFullDNA}
${notesBlock ? `\n${notesBlock}\n` : ""}
[SILENT SELF-CHECK BEFORE OUTPUT — DO NOT PRINT THIS LIST]
- Does the first line match ${primaryBio.name}'s first-line shape and obey every hook rule?
- Do the stages appear in ${primaryBio.name}'s order with roughly their time shares, with no extra stage invented?
- Does the last line belong to ${primaryBio.name}'s closing, with no secondary flavor in it?
- ${hasSecondaries ? "Is every secondary audible at least once in the body, inside its lane, within its quota and never in the hook or final line?" : "Is the script 100% in the primary voice?"}
- Is any forbidden pattern, banned phrase or integrity-floor rule broken? Is every number either supplied or a [PLACEHOLDER]?
- Is the language exactly the primary's language rule, with no stray scripts or mixed registers?
- Fix any failure silently, then output.

[OUTPUT REQUIREMENT]
You must populate the 'blendMetadata' field in the JSON response:
- primaryCreator: "${primaryBio.name}"
- secondaryCreators: ${JSON.stringify(secondaryNames)}
- blendRatio: A concise description of how the styles were synthesized with the real percentages (e.g., "${primaryWeight}% ${primaryBio.name} structure & hook${
      hasSecondaries
        ? ` with ${secondaryTotal}% ${secondaries.map(s => `${s.bio.name} (${s.lane.id.toLowerCase()})`).join(" + ")} flavor`
        : ""
    }"). Mention what each secondary actually contributed. Do not add any new fields beyond the ones defined in the schema.

Proceed to write the blended script package now.
`.trim();
  }

  /**
   * Structured summary of what generateBlendPrompt would use. Meant for the UI:
   * show shares, lanes, and warn when creators were dropped (duplicate, primary, cap).
   */
  static describeBlend(
    primaryCreator: CreatorProfile,
    secondaryCreators: CreatorProfile[],
    options?: BlendOptions
  ): BlendReport {
    const primaryWeight = this.normalizeWeight(options?.primaryWeight);
    const secondaryTotal = 100 - primaryWeight;
    const cap = this.normalizeCap(options?.maxSecondaries);
    const { kept, dropped } = this.partitionSecondaries(primaryCreator, secondaryCreators, cap);

    return {
      primaryName: resolveCreatorBio(primaryCreator).name,
      primaryWeight,
      secondaryTotal: kept.length > 0 ? secondaryTotal : 0,
      secondaries: kept.map((profile, index) => ({
        id: profile.id,
        name: resolveCreatorBio(profile).name,
        share: kept.length > 0 ? Math.round((secondaryTotal / kept.length) * 10) / 10 : 0,
        leadLane: this.laneFor(index, kept.length).label
      })),
      dropped
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private static normalizeWeight(weight?: number): number {
    if (typeof weight !== "number" || !Number.isFinite(weight)) return DEFAULT_PRIMARY_WEIGHT;
    return Math.min(MAX_PRIMARY_WEIGHT, Math.max(MIN_PRIMARY_WEIGHT, Math.round(weight)));
  }

  private static normalizeCap(cap?: number): number {
    if (typeof cap !== "number" || !Number.isFinite(cap) || cap < 0) return DEFAULT_MAX_SECONDARIES;
    return Math.floor(cap);
  }

  private static partitionSecondaries(
    primary: CreatorProfile,
    secondaries: CreatorProfile[],
    cap: number
  ): { kept: CreatorProfile[]; dropped: BlendReport["dropped"] } {
    const seen = new Set<string>([primary.id]);
    const kept: CreatorProfile[] = [];
    const dropped: BlendReport["dropped"] = [];

    for (const c of secondaries ?? []) {
      if (!c) continue;
      if (c.id === primary.id) {
        dropped.push({ id: c.id, name: c.name, reason: "same-as-primary" });
        continue;
      }
      if (seen.has(c.id)) {
        dropped.push({ id: c.id, name: c.name, reason: "duplicate" });
        continue;
      }
      seen.add(c.id);
      if (kept.length >= cap) {
        dropped.push({ id: c.id, name: c.name, reason: "over-cap" });
        continue;
      }
      kept.push(c);
    }
    return { kept, dropped };
  }

  private static laneFor(index: number, total: number): Lane {
    if (total <= 1) return SOLE_SECONDARY_LANE;
    return LANES[index % LANES.length];
  }

  /** One secondary creator's flavor pack, trimmed so deep bios do not flood the prompt. */
  private static buildSecondaryBlock(bio: CreatorBio, share: number, lane: Lane): string {
    const cues = list(bio.styleCues)
      .filter(cue => !METADATA_CUE_PREFIXES.some(prefix => cue.startsWith(prefix)))
      .slice(0, MAX_STYLE_CUES);
    const beliefs = list(bio.philosophy?.coreBeliefs).slice(0, MAX_BELIEFS);
    const phrases = list(bio.signaturePhrases).slice(0, MAX_SIGNATURE_PHRASES);
    const contributions = list(bio.blendRole?.asSecondaryContribute);
    const guardrails = list(bio.blendRole?.asSecondaryNever);
    const sample = this.flavorSample(bio);

    return `
   [SECONDARY INFLUENCE (${fmtPct(share)}% FLAVOR LAYER): ${bio.name} (${bio.archetype})]
   - LEAD LANE: ${lane.label}. ${lane.brief}
   - Tone & Emotional Flavor: ${bio.voice.tone} | Emotional Range: ${bio.voice.emotionalRange}
   - Pacing Nuance (accent only, never the script's base pace): ${bio.voice.pacing}
   - Vocabulary & Metaphor Bank: ${formatVocab(bio.voice.vocabulary)}
   - Philosophical Angle to Weave In: ${beliefs.join(" | ")}
   - Research Perspective: ${bio.research.methodology} (Sources: ${list(bio.research.preferredSources).join(", ")})
   - Style Cues to Borrow: ${cues.join(" | ")}
   - Signature Phrase TEMPLATES (adapt, never copy brackets; at most one echo per ~300 words): ${phrases.join(" | ")}
   - Blend Contributions (DO USE): ${contributions.join(" | ")}
   - Blend Guardrails (NEVER DO AS SECONDARY): ${guardrails.join(" | ")}${
      sample
        ? `\n   - FLAVOR SAMPLE (rhythm and texture only; never copy words or placeholders; its language may differ from the script's): "${sample}"`
        : ""
    }
    `.trimEnd();
  }

  /** Picks one short narration example from the secondary's few-shot set, if any exist. */
  private static flavorSample(bio: CreatorBio): string {
    const engine = bio.deepGenreEngine as
      | { schemaFewShotExamples?: Array<{ narration?: string }> }
      | undefined;
    const examples = Array.isArray(engine?.schemaFewShotExamples) ? engine!.schemaFewShotExamples! : [];
    const usable = examples
      .map(e => (typeof e?.narration === "string" ? e.narration.trim() : ""))
      .filter(text => text.length > 0 && text.length <= MAX_SAMPLE_CHARS);
    if (usable.length === 0) return "";
    return usable[Math.floor(usable.length / 2)].replace(/"/g, "'");
  }

  /** Where in the primary's workflow the secondary flavor may appear, and how much. */
  private static buildInjectionSection(primaryBio: CreatorBio, secondaryCount: number, secondaryTotal: number): string {
    const stages = primaryBio.workflow?.stages || [];

    const zoneLines =
      stages.length > 0
        ? stages
            .map((stage, i) => {
              if (i === 0) {
                return `* ${stage.name}: HOOK ZONE. Primary only. A secondary may lend at most one word-level touch (one vocabulary item or image). No secondary phrasing in the first line and no secondary structure.`;
              }
              if (i === stages.length - 1) {
                return `* ${stage.name}: CLOSE ZONE. Primary only. No secondary flavor in the final line.`;
              }
              return `* ${stage.name}: BODY ZONE. Secondary flavor allowed inside each secondary's lane and quota.`;
            })
            .join("\n     ")
        : `* Opening: HOOK ZONE, primary only.\n     * Middle: BODY ZONE, secondary flavor allowed within lanes and quota.\n     * Final line: CLOSE ZONE, primary only.`;

    return `
   [INJECTION MAP — WHERE SECONDARY FLAVOR IS ALLOWED]
     ${zoneLines}

   [QUOTA — THE ${secondaryTotal}% IS A BUDGET]
   - The ${secondaryTotal}% counts texture (word choice, metaphor, emotional colour, one angle), not structure. Structure is 100% primary.
   - Roughly ${secondaryTotal}% of the sentences in the BODY ZONES should carry some secondary flavor, split ${secondaryCount > 1 ? "evenly between the secondaries" : "to the one secondary"}, spread across the body (not clustered).
   - Every secondary must be audible at least once in the body. No secondary may exceed its share or take over a whole section.
   - Two secondaries must not borrow the same device twice in a row. Keep their lanes distinct.
   - A secondary device (an equation, a countdown, a ladder, a pause) may live only as a sub-element INSIDE a primary stage. It never becomes a new stage.`.trimEnd();
  }

  /** The explicit arbitration rules between primary and secondaries. */
  private static buildConflictRules(primaryBio: CreatorBio, hasSecondaries: boolean): string {
    const base = [
      `   - ${primaryBio.name}'s hookRules, workflow stages, closingRules, evidenceRules and forbiddenPatterns ALWAYS win if a conflict arises.`
    ];
    if (!hasSecondaries) return base.join("\n");

    return [
      ...base,
      `   - STRUCTURE: only ${primaryBio.name}'s stages, in their order. Secondary structures are ignored.`,
      `   - HOOK AND CLOSING: ${primaryBio.name} only. A secondary never changes the opening move, the first line or the last line.`,
      `   - PACING: the base pace, sentence length and cut rhythm are ${primaryBio.name}'s. A secondary's pacing may appear only as a one or two sentence accent (slow one line for weight, or speed up one list), then return to the base pace.`,
      `   - TONE: ${primaryBio.name}'s register stays. A secondary's tone shows up as emotional colouring inside single lines, never as a register switch mid-script.`,
      `   - VOCABULARY: if a secondary's word or phrase contradicts ${primaryBio.name}'s forbiddenPatterns or voice, skip it. Never use a word the primary bans.`,
      `   - EVIDENCE: ${primaryBio.name}'s evidenceRules apply. A secondary's research perspective supplies framing only, never new facts.`,
      `   - SPONSOR / CTA: ${primaryBio.name}'s rules apply. A secondary's sponsor or CTA style is ignored.`,
      `   - SECONDARY GUARDRAILS: honour each secondary's "NEVER DO AS SECONDARY" list. Do not apply a secondary's other forbidden patterns to the primary's own voice.`,
      `   - SAME WORD, DIFFERENT USE: when primary and secondary share a term (for example "protocol" or "math"), use it the primary's way.`
    ].join("\n");
  }
}