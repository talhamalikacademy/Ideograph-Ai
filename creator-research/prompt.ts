import { ResearchStyle, ResearchScope, FactType } from './types';
import { getRegionPack } from './regions';

export const LENS_RULE =
  'Never assume a theme (for example scarcity, mafia, corruption, elite capture). The planner proposes 3 to 5 candidate lenses FROM THE TOPIC and writes one question that would test each lens. Evidence decides which lens survives.';

export function formatFactTypePlainLabel(type: FactType): string {
  switch (type) {
    case 'official_data':
    case 'stat':
      return 'official data and numbers';
    case 'official_documents':
    case 'policy':
      return 'official documents and records';
    case 'news':
    case 'event':
      return 'news and investigations';
    case 'books_history':
    case 'book':
      return 'books and history';
    case 'global_studies':
    case 'study':
      return 'global studies and country comparisons';
    case 'expert_views':
      return 'named experts with credentials';
    case 'public_voices':
    case 'public_voice':
      return 'public voices and real stories (labelled unverified)';
    case 'user_material':
      return 'your own stories, files and numbers';
    case 'benchmarks':
      return 'industry and platform benchmarks';
    case 'format_reference':
      return 'similar video formats that worked';
    case 'feasibility_safety':
      return 'real-world costs, rules and safety';
    case 'audience_interest':
      return 'audience interest and retention beats';
    case 'counter':
    case 'other_side':
      return 'the strongest argument from the other side';
    default:
      return String(type).replace(/_/g, ' ');
  }
}

export function formatClaimPolicyPlainSentence(policy: ResearchStyle['claimPolicy']): string {
  const strictText =
    policy.strictness === 'strict'
      ? 'Strict proof: every key number and factual claim needs a named source, year, and link (and a second source when available).'
      : policy.strictness === 'standard'
      ? 'Standard proof: every number and factual claim must be backed by a source link or user material.'
      : 'Light proof: verify real-world costs, numbers, rules, and safety claims; label creative ideas clearly.';

  const extras: string[] = [];
  if (policy.namedEntityRule) {
    extras.push(
      'Any allegation about a named person or organization requires a primary document or two independent sources; otherwise soften the wording.'
    );
  }
  if (policy.resultsClaimCheck) {
    extras.push(
      'Income or result claims must come only from verified user numbers and include a "results vary" note.'
    );
  }
  if (policy.sensitiveTopicFlag) {
    extras.push(
      'Mark security, political, and court topics for manual editor review.'
    );
  }

  return [strictText, ...extras].join(' ');
}

export function buildResearchSystemPrompt(
  style: ResearchStyle,
  brief: string,
  scope: ResearchScope,
  stage: 'plan' | 'extract' | 'verify',
  region: string = 'Pakistan'
): string {
  const regionPack = getRegionPack(region);
  const prioritySentences = style.sourcePriority
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .map(
      sp =>
        `- ${formatFactTypePlainLabel(sp.type)} (${Math.round(sp.weight * 100)}%): e.g. ${sp.examples.join(', ')}`
    )
    .join('\n');

  const regionHintsLines = Object.entries(regionPack.examplesByType)
    .map(
      ([type, examples]) =>
        `- ${formatFactTypePlainLabel(type as FactType)}: ${(examples || []).join(', ')}`
    )
    .join('\n');

  const stageInstruction =
    stage === 'plan'
      ? 'STAGE: PLAN. Propose 3 to 5 candidate lenses directly from the topic (with 1 test question per lens) and generate specific, high-signal search queries tailored to the topic, scope, and source priorities.'
      : stage === 'extract'
      ? 'STAGE: EXTRACT. Extract one clear fact per card using ONLY the retrieved text. Include a short supporting evidenceText snippet (under 25 words), assign 0-to-1 sub-scores for credibility, novelty, storyValue, and relevance, label public voices as "unverified_voice" and opinions as "opinion". If a fact has no source URL or user source, do not output it.'
      : 'STAGE: VERIFY. Check top numeric and factual claims against a second independent source. If sources disagree on a number, record both figures clearly and explain why.';

  return [
    style.systemPromptBlock,
    '',
    `STAGE GOAL: ${stageInstruction}`,
    `INTENT: ${style.intent}`,
    `AUDIENCE: ${style.audience}`,
    `RESEARCH SCOPE: ${scope} (Target Region: ${region})`,
    brief ? `TOPIC BRIEF: ${brief}` : '',
    '',
    'CORE QUESTIONS TO ANSWER FIRST:',
    ...style.questionSet.map((q, i) => `${i + 1}. ${q}`),
    '',
    'SOURCE PRIORITIES:',
    prioritySentences,
    '',
    'EVIDENCE RULES:',
    ...style.evidenceRules.map(r => `- ${r}`),
    '',
    'WHAT TO AVOID:',
    ...style.avoid.map(a => `- ${a}`),
    '',
    `PROOF & CLAIM POLICY: ${formatClaimPolicyPlainSentence(style.claimPolicy)}`,
    '',
    `LENS RULE: ${LENS_RULE}`,
    '',
    `REGION HINTS FOR ${regionPack.name.toUpperCase()} (${regionPack.note}):`,
    regionHintsLines,
    '',
    'HONESTY RULE: Use ONLY retrieved text; if you cannot find it, say so. Never invent a source, URL, quote, number, or book.'
  ]
    .filter(Boolean)
    .join('\n');
}
