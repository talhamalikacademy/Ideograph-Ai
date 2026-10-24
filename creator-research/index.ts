import { FactType, ResearchStyle, ResearchScope } from './types';
import { DHRUV_RESEARCH_STYLE } from './dhruv.research';
import { NITISH_RESEARCH_STYLE } from './nitish.research';
import { RAFTAR_RESEARCH_STYLE } from './raftar.research';
import { THYNKWHY_RESEARCH_STYLE } from './thynkwhy.research';
import { MRBEAST_RESEARCH_STYLE } from './mrbeast.research';
import { HORMOZI_RESEARCH_STYLE } from './hormozi.research';
import { IMAN_RESEARCH_STYLE } from './iman.research';
import {
  EMPTY_STYLE_SLOT,
  createResearchStyleFromProfile,
  CustomChannelStyleInput
} from './_template.research';
import { formatFactTypePlainLabel } from './prompt';
import { VoiceSelectionState } from '../creator-recipes/types';
import { getCustomChannelRecipes } from '../creator-recipes';

export * from './types';
export * from './regions';
export * from './prompt';
export {
  DHRUV_RESEARCH_STYLE,
  NITISH_RESEARCH_STYLE,
  RAFTAR_RESEARCH_STYLE,
  THYNKWHY_RESEARCH_STYLE,
  MRBEAST_RESEARCH_STYLE,
  HORMOZI_RESEARCH_STYLE,
  IMAN_RESEARCH_STYLE,
  EMPTY_STYLE_SLOT,
  createResearchStyleFromProfile
};
export type { CustomChannelStyleInput };

const BUILT_IN_STYLES: ResearchStyle[] = [
  DHRUV_RESEARCH_STYLE,
  NITISH_RESEARCH_STYLE,
  RAFTAR_RESEARCH_STYLE,
  THYNKWHY_RESEARCH_STYLE,
  MRBEAST_RESEARCH_STYLE,
  HORMOZI_RESEARCH_STYLE,
  IMAN_RESEARCH_STYLE
];

export interface StyleValidationReportItem {
  creatorId: string;
  displayName: string;
  sourcePrioritySumBefore: number;
  factScoringSumBefore: number;
  normalized: boolean;
  minFactsPer5Min: Partial<Record<FactType, number>>;
}

function normalizeAndComputeMinFacts(style: ResearchStyle): {
  normalizedStyle: ResearchStyle;
  report: StyleValidationReportItem;
} {
  const spSum = style.sourcePriority.reduce((acc, s) => acc + s.weight, 0);
  const fsSum =
    style.factScoring.credibility +
    style.factScoring.novelty +
    style.factScoring.storyValue +
    style.factScoring.relevance;

  let normalized = false;
  const nextSourcePriority = style.sourcePriority.map(s => ({ ...s }));
  if (Math.abs(spSum - 1) > 0.01 && spSum > 0) {
    console.warn(
      `[ResearchStyle] ${style.creatorId}: sourcePriority weights summed to ${spSum.toFixed(
        3
      )}, normalizing to 1.0`
    );
    normalized = true;
    nextSourcePriority.forEach(s => {
      s.weight = Number((s.weight / spSum).toFixed(4));
    });
  }

  const nextFactScoring = { ...style.factScoring };
  if (Math.abs(fsSum - 1) > 0.01 && fsSum > 0) {
    console.warn(
      `[ResearchStyle] ${style.creatorId}: factScoring weights summed to ${fsSum.toFixed(
        3
      )}, normalizing to 1.0`
    );
    normalized = true;
    nextFactScoring.credibility = Number((nextFactScoring.credibility / fsSum).toFixed(4));
    nextFactScoring.novelty = Number((nextFactScoring.novelty / fsSum).toFixed(4));
    nextFactScoring.storyValue = Number((nextFactScoring.storyValue / fsSum).toFixed(4));
    nextFactScoring.relevance = Number((nextFactScoring.relevance / fsSum).toFixed(4));
  }

  const minFactsPer5Min: Partial<Record<FactType, number>> = {
    ...(style.minFactsPer5Min || {})
  };
  for (const sp of nextSourcePriority) {
    if (minFactsPer5Min[sp.type] === undefined) {
      const computed = Math.round(14 * sp.weight);
      minFactsPer5Min[sp.type] = sp.weight >= 0.05 ? Math.max(1, computed) : Math.max(0, computed);
    }
  }

  const normalizedStyle: ResearchStyle = {
    ...style,
    sourcePriority: nextSourcePriority,
    factScoring: nextFactScoring,
    minFactsPer5Min
  };

  return {
    normalizedStyle,
    report: {
      creatorId: style.creatorId,
      displayName: style.displayName,
      sourcePrioritySumBefore: Number(spSum.toFixed(3)),
      factScoringSumBefore: Number(fsSum.toFixed(3)),
      normalized,
      minFactsPer5Min
    }
  };
}

const VALIDATED_BUILT_IN_STYLES: ResearchStyle[] = BUILT_IN_STYLES.map(
  s => normalizeAndComputeMinFacts(s).normalizedStyle
);

export function validateAllStyles(): StyleValidationReportItem[] {
  return BUILT_IN_STYLES.map(s => normalizeAndComputeMinFacts(s).report);
}

export function getAllResearchStyles(): ResearchStyle[] {
  const customRecipes = getCustomChannelRecipes();
  const customStyles = customRecipes.map(r =>
    normalizeAndComputeMinFacts(
      createResearchStyleFromProfile({
        creatorId: r.creatorId,
        creatorName: r.creatorName
      })
    ).normalizedStyle
  );
  return [...customStyles, ...VALIDATED_BUILT_IN_STYLES];
}

export function getResearchStyleByCreatorId(creatorId?: string): ResearchStyle {
  const all = getAllResearchStyles();
  if (!creatorId) return DHRUV_RESEARCH_STYLE;
  const clean = creatorId.toLowerCase().trim();

  if (clean.includes('dhruv')) return DHRUV_RESEARCH_STYLE;
  if (clean.includes('nitish')) return NITISH_RESEARCH_STYLE;
  if (clean.includes('raftar')) return RAFTAR_RESEARCH_STYLE;
  if (clean.includes('thynkwhy') || clean.includes('thinkwhy')) return THYNKWHY_RESEARCH_STYLE;
  if (clean.includes('mrbeast') || clean.includes('beast')) return MRBEAST_RESEARCH_STYLE;
  if (clean.includes('hormozi')) return HORMOZI_RESEARCH_STYLE;
  if (clean.includes('iman') || clean.includes('sharan')) return IMAN_RESEARCH_STYLE;

  const exact = all.find(
    s =>
      s.creatorId.toLowerCase() === clean ||
      s.displayName.toLowerCase() === clean ||
      s.creatorId.toLowerCase().includes(clean)
  );
  return exact || DHRUV_RESEARCH_STYLE;
}

const STRICTNESS_ORDER: Record<'light' | 'standard' | 'strict', number> = {
  light: 1,
  standard: 2,
  strict: 3
};

/**
 * Resolves a single effective ResearchStyle for Manual (Pick), Auto, or Blend (2 to 3 creators).
 */
export function resolveResearchStyle(
  selection: VoiceSelectionState,
  scopeOverride?: ResearchScope,
  _minutes: number = 10
): ResearchStyle {
  if (selection.mode === 'pick' || selection.mode === 'auto') {
    const targetId =
      selection.mode === 'auto'
        ? selection.autoMatchedCreatorId || selection.pickedCreatorId
        : selection.pickedCreatorId;
    const base = getResearchStyleByCreatorId(targetId);
    return {
      ...base,
      defaultScope: scopeOverride || base.defaultScope
    };
  }

  // Blend mode: primary = Body structure creator, then Hook creator, then Language & tone creator
  const primaryStyle = getResearchStyleByCreatorId(selection.blend.structureCreatorId);
  const hookStyle = getResearchStyleByCreatorId(selection.blend.hookCreatorId);
  const toneStyle = getResearchStyleByCreatorId(selection.blend.toneCreatorId);

  // Role order: [primary, hook, tone]
  // Shares: 0.5 / 0.3 / 0.2 for 3 roles; if a creator holds two roles, combine their share
  const roleShares: { style: ResearchStyle; share: number }[] = [];
  const rawRoleAssign = [
    { style: primaryStyle, share: 0.5 },
    { style: hookStyle, share: 0.3 },
    { style: toneStyle, share: 0.2 }
  ];

  for (const item of rawRoleAssign) {
    const existing = roleShares.find(r => r.style.creatorId === item.style.creatorId);
    if (existing) {
      existing.share += item.share;
    } else {
      roleShares.push({ style: item.style, share: item.share });
    }
  }

  // If exactly 2 distinct creators and standard 2-creator split is preferred when 2 creators are selected
  if (roleShares.length === 2) {
    roleShares[0].share = 0.6;
    roleShares[1].share = 0.4;
  }

  const distinctStyles = roleShares.map(r => r.style);

  // Mode resolution: if mixing full_dossier with playbook or concept_lab -> 'hybrid'
  const modes = new Set(distinctStyles.map(s => s.researchMode));
  const resolvedMode =
    modes.size > 1 &&
    modes.has('full_dossier') &&
    (modes.has('playbook') || modes.has('concept_lab'))
      ? 'hybrid'
      : primaryStyle.researchMode;

  // Merge sourcePriority weights
  const weightMap = new Map<FactType, { weight: number; examples: Set<string> }>();
  for (const { style, share } of roleShares) {
    for (const sp of style.sourcePriority) {
      const current = weightMap.get(sp.type) || { weight: 0, examples: new Set<string>() };
      current.weight += share * sp.weight;
      sp.examples.forEach(ex => current.examples.add(ex));
      weightMap.set(sp.type, current);
    }
  }

  const totalMergedWeight =
    Array.from(weightMap.values()).reduce((acc, v) => acc + v.weight, 0) || 1;
  const mergedSourcePriority = Array.from(weightMap.entries())
    .map(([type, data]) => ({
      type,
      weight: Number((data.weight / totalMergedWeight).toFixed(4)),
      examples: Array.from(data.examples).slice(0, 5)
    }))
    .sort((a, b) => b.weight - a.weight);

  // Merge factScoring
  const rawScoring = { credibility: 0, novelty: 0, storyValue: 0, relevance: 0 };
  for (const { style, share } of roleShares) {
    rawScoring.credibility += share * style.factScoring.credibility;
    rawScoring.novelty += share * style.factScoring.novelty;
    rawScoring.storyValue += share * style.factScoring.storyValue;
    rawScoring.relevance += share * style.factScoring.relevance;
  }
  const scoringSum =
    rawScoring.credibility +
      rawScoring.novelty +
      rawScoring.storyValue +
      rawScoring.relevance || 1;

  // Claim policy = strictest of all
  let strictest: 'light' | 'standard' | 'strict' = 'light';
  for (const st of distinctStyles) {
    if (STRICTNESS_ORDER[st.claimPolicy.strictness] > STRICTNESS_ORDER[strictest]) {
      strictest = st.claimPolicy.strictness;
    }
  }
  const mergedClaimPolicy: ResearchStyle['claimPolicy'] = {
    strictness: strictest,
    namedEntityRule: distinctStyles.some(s => s.claimPolicy.namedEntityRule),
    resultsClaimCheck: distinctStyles.some(s => s.claimPolicy.resultsClaimCheck),
    sensitiveTopicFlag: distinctStyles.some(s => s.claimPolicy.sensitiveTopicFlag)
  };

  // Union of evidenceRules and avoid
  const mergedEvidenceRules = Array.from(
    new Set(distinctStyles.flatMap(s => s.evidenceRules))
  );
  const mergedAvoid = Array.from(new Set(distinctStyles.flatMap(s => s.avoid)));

  // QuestionSet: primary's questions first, then up to 3 extra from others
  const primaryQuestions = [...primaryStyle.questionSet];
  const extraQuestions = distinctStyles
    .slice(1)
    .flatMap(s => s.questionSet)
    .filter(q => !primaryQuestions.includes(q))
    .slice(0, 3);
  const mergedQuestions = [...primaryQuestions, ...extraQuestions];

  // Scope: if creators differ, use 'both'
  const scopes = new Set(distinctStyles.map(s => s.defaultScope));
  const mergedDefaultScope: ResearchScope =
    scopeOverride || (scopes.size > 1 ? 'both' : primaryStyle.defaultScope);

  // Union of tabs and sourceToggles by id
  const tabsById = new Map<string, { id: string; label: string; types: FactType[] }>();
  const togglesById = new Map<string, { id: string; label: string; mapsTo: FactType }>();
  for (const st of distinctStyles) {
    for (const tab of st.uiLabels.tabs) {
      if (!tabsById.has(tab.id)) {
        tabsById.set(tab.id, tab);
      }
    }
    for (const tog of st.uiLabels.sourceToggles) {
      if (!togglesById.has(tog.id)) {
        togglesById.set(tog.id, tog);
      }
    }
  }

  // Merge queryTemplates
  const templatesByType = new Map<FactType, Set<string>>();
  for (const st of distinctStyles) {
    for (const qt of st.queryTemplates) {
      const set = templatesByType.get(qt.type) || new Set<string>();
      qt.templates.forEach(t => set.add(t));
      templatesByType.set(qt.type, set);
    }
  }

  const secondaryPromptBlocks = distinctStyles
    .slice(1)
    .map(s => `[${s.displayName}]: ${s.systemPromptBlock}`)
    .join('\n');

  const mergedSystemPrompt = secondaryPromptBlocks
    ? `${primaryStyle.systemPromptBlock}\n\nUse only for tone and angle, not for source rules:\n${secondaryPromptBlocks}`
    : primaryStyle.systemPromptBlock;

  const blended: ResearchStyle = {
    creatorId: `${primaryStyle.creatorId}_blend`,
    displayName: `Blended research: ${primaryStyle.displayName} leads`,
    source: primaryStyle.source,
    intent: primaryStyle.intent,
    audience: primaryStyle.audience,
    researchMode: resolvedMode,
    defaultScope: mergedDefaultScope,
    questionSet: mergedQuestions,
    sourcePriority: mergedSourcePriority,
    evidenceRules: mergedEvidenceRules,
    avoid: mergedAvoid,
    queryTemplates: Array.from(templatesByType.entries()).map(([type, set]) => ({
      type,
      templates: Array.from(set)
    })),
    factScoring: {
      credibility: Number((rawScoring.credibility / scoringSum).toFixed(4)),
      novelty: Number((rawScoring.novelty / scoringSum).toFixed(4)),
      storyValue: Number((rawScoring.storyValue / scoringSum).toFixed(4)),
      relevance: Number((rawScoring.relevance / scoringSum).toFixed(4))
    },
    claimPolicy: mergedClaimPolicy,
    budget: primaryStyle.budget,
    uiLabels: {
      title: primaryStyle.uiLabels.title,
      startButton: primaryStyle.uiLabels.startButton,
      tabs: Array.from(tabsById.values()),
      sourceToggles: Array.from(togglesById.values()),
      showScope: distinctStyles.some(s => s.uiLabels.showScope),
      canSkip: distinctStyles.every(s => s.uiLabels.canSkip)
    },
    writerNotes: Array.from(new Set(distinctStyles.flatMap(s => s.writerNotes))),
    systemPromptBlock: mergedSystemPrompt
  };

  return normalizeAndComputeMinFacts(blended).normalizedStyle;
}

/**
 * Returns exactly 5 plain lines describing the ResearchStyle:
 * Goal / Looks first at / Region / Proof level / What you get.
 */
export function describeResearchStyle(
  style: ResearchStyle,
  activeScope?: ResearchScope
): [string, string, string, string, string] {
  const top3Types = style.sourcePriority
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map(sp => formatFactTypePlainLabel(sp.type))
    .join(', ');

  const scopeToUse = activeScope || style.defaultScope;
  const scopePlain =
    scopeToUse === 'ground'
      ? 'Ground (local numbers, cities, and resident voices first)'
      : scopeToUse === 'abroad'
      ? 'Abroad (outside studies and comparable countries first)'
      : 'Both (local facts combined with global comparisons)';

  const proofPlain =
    style.claimPolicy.strictness === 'strict'
      ? 'Strict (every key number and named claim needs source links)'
      : style.claimPolicy.strictness === 'standard'
      ? 'Standard (all numbers and claims backed by real sources or your data)'
      : 'Light (checks real-world costs, rules, and safety; creative beats marked as ideas)';

  const whatYouGetPlain =
    style.researchMode === 'playbook'
      ? 'Playbook with step-by-step frameworks, your numbers, and benchmarks'
      : style.researchMode === 'concept_lab'
      ? 'Concept sheet with similar formats, stakes ladder, and safety/cost check'
      : style.researchMode === 'hybrid'
      ? 'Blended research notes combining documentary facts and action frameworks'
      : 'Full research notes and fact base with source links';

  return [
    `Goal: ${style.intent}`,
    `Looks first at: ${top3Types}.`,
    `Region: ${scopePlain}.`,
    `Proof level: ${proofPlain}.`,
    `What you get: ${whatYouGetPlain}.`
  ];
}
