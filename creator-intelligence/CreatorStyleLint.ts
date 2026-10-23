import { CreatorProfile, ScriptData } from "../types";
import { DURATION_MAPPING } from "../constants";
import { resolveCreatorBio } from "./CreatorDNA";
import { extractCreatorUsableLexicon } from "./CreatorIntegrityGuard";
import { findLeakedPlaceholders } from "../services/scriptService";

export interface StyleLintViolation {
  type: 'ai_slop' | 'placeholder_leak' | 'hook_violation' | 'closing_violation' | 'duration_drift';
  severity: 'warning' | 'error';
  message: string;
  segmentIndex?: number;
}

export interface StyleFidelityReport {
  creatorId: string;
  creatorName: string;
  fidelityScore: number; // 0 - 100
  matchedLexiconTerms: string[];
  violations: StyleLintViolation[];
}

const GENERIC_AI_SLOP_PHRASES = [
  "in today's video",
  "welcome back to my channel",
  "without further ado",
  "delve into",
  "testament to",
  "rich tapestry",
  "in conclusion",
  "to sum up",
  "let's dive right in"
];

/**
 * Audits a generated ScriptData object against the selected creator's DNA rules,
 * lexicon, duration targets, and anti-slop constraints without mutating any creator files.
 */
export function auditScriptStyleFidelity(
  script: ScriptData,
  creator: CreatorProfile
): StyleFidelityReport {
  const bio = resolveCreatorBio(creator);
  const lexicon = extractCreatorUsableLexicon(creator);
  const violations: StyleLintViolation[] = [];
  const segments = script.segments || [];

  const fullAudio = segments.map(s => s.audio || "").join(" ");
  const lowerAudio = fullAudio.toLowerCase();

  // 1. Check for generic AI slop phrases
  segments.forEach((seg, idx) => {
    const segLower = (seg.audio || "").toLowerCase();
    for (const phrase of GENERIC_AI_SLOP_PHRASES) {
      if (segLower.includes(phrase)) {
        violations.push({
          type: 'ai_slop',
          severity: 'warning',
          message: `Generic AI phrase detected ("${phrase}") in segment ${idx + 1}.`,
          segmentIndex: idx
        });
      }
    }

    // 2. Check for leaked bracketed placeholders
    const leaked = [
      ...findLeakedPlaceholders(seg.audio || ""),
      ...findLeakedPlaceholders(seg.visual || "")
    ];
    if (leaked.length > 0) {
      violations.push({
        type: 'placeholder_leak',
        severity: 'error',
        message: `Unfilled template placeholder(s) ${leaked.join(", ")} in segment ${idx + 1}.`,
        segmentIndex: idx
      });
    }
  });

  // 3. Check opening segment against creator hook anti-patterns
  if (segments.length > 0) {
    const firstAudio = (segments[0].audio || "").toLowerCase();
    if (
      (creator.id === 'dhruv' || creator.id === 'dhruvrathee') &&
      (firstAudio.includes("you won't believe") || firstAudio.includes("shocking truth revealed"))
    ) {
      violations.push({
        type: 'hook_violation',
        severity: 'warning',
        message: `Opening segment uses tabloid shock phrasing discouraged by ${creator.name}'s hook rules.`,
        segmentIndex: 0
      });
    }
  }

  // 4. Check duration spoken word count alignment
  const durationInfo = script.duration ? DURATION_MAPPING[script.duration] : undefined;
  if (durationInfo && durationInfo.minWords > 0) {
    const wordCount = fullAudio
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    if (wordCount < Math.floor(durationInfo.minWords * 0.5)) {
      violations.push({
        type: 'duration_drift',
        severity: 'warning',
        message: `Script has ${wordCount} spoken words, below the ~${durationInfo.minWords}-word target for ${script.duration}.`
      });
    }
  }

  // 5. Measure Creator Lexicon & Signature Phrase usage
  const candidateTerms = Array.from(
    new Set([
      ...lexicon.vocabulary,
      ...lexicon.signaturePhrases,
      ...lexicon.genreKeywords
    ])
  ).filter(term => term && term.length >= 3);

  const matchedLexiconTerms = candidateTerms.filter(term =>
    lowerAudio.includes(term.toLowerCase())
  );

  // Calculate 0-100 fidelity score
  let score = 88;
  score += Math.min(12, matchedLexiconTerms.length * 3);
  for (const v of violations) {
    score -= v.severity === 'error' ? 15 : 6;
  }
  const fidelityScore = Math.max(20, Math.min(100, score));

  return {
    creatorId: creator.id,
    creatorName: bio.name,
    fidelityScore,
    matchedLexiconTerms: matchedLexiconTerms.slice(0, 12),
    violations
  };
}
