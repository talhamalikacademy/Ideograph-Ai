import { ScriptFormatType } from '../services/budget';
import {
  CreatorRecipe,
  VoiceSelectionState,
  CreatorMatchResult
} from './types';
import { getAllCreatorRecipes, getRecipeByCreatorId } from './index';
import {
  getResearchStyleByCreatorId,
  resolveResearchStyle,
  describeResearchStyle
} from '../creator-research';

export interface ResolvedRecipeResult {
  recipe: CreatorRecipe;
  needsNarrationLanguage?: boolean;
  languageMismatchWarning?: string;
  availableLanguages: string[];
  summaryLines: string[];
}

/**
 * Returns 5 plain-language lines describing how a resolved recipe works
 * (reading research & verification rules exclusively from ResearchStyle).
 */
export function describeRecipe(recipe: CreatorRecipe): string[] {
  const researchStyle = getResearchStyleByCreatorId(recipe.creatorId);
  const styleLines = describeResearchStyle(researchStyle);

  const hookLine = `Hook (${recipe.hook.secondsMin}–${recipe.hook.secondsMax}s): ${
    recipe.hook.types[0] || 'Direct high-stakes opening'
  }.`;

  const structureLine = `Chapter flow (${recipe.structure.length} chapters): ${recipe.structure
    .map(s => s.purpose.split(':')[0])
    .join(' → ')}.`;

  const researchLine = styleLines[1]; // "Looks first at: ..."
  const languageLine = `Supported narration languages: ${recipe.languages.slice(0, 4).join(', ')}.`;
  const verificationLine = styleLines[3]; // "Proof level: ..."

  return [hookLine, structureLine, researchLine, languageLine, verificationLine];
}

/**
 * Resolves a single effective CreatorRecipe from Pick, Blend (2–3 creators with role ownership), or Auto.
 */
export function resolveRecipe(
  selection: VoiceSelectionState,
  minutes: number = 10
): ResolvedRecipeResult {
  if (selection.mode === 'pick' || selection.mode === 'auto') {
    const targetId =
      selection.mode === 'auto'
        ? selection.autoMatchedCreatorId || selection.pickedCreatorId
        : selection.pickedCreatorId;
    const base = getRecipeByCreatorId(targetId);
    return {
      recipe: base,
      needsNarrationLanguage: false,
      availableLanguages: base.languages,
      summaryLines: describeRecipe(base)
    };
  }

  // Blend mode (2–3 creators, each role owned by one creator)
  const hookRecipe = getRecipeByCreatorId(selection.blend.hookCreatorId);
  const structureRecipe = getRecipeByCreatorId(selection.blend.structureCreatorId);
  const toneRecipe = getRecipeByCreatorId(selection.blend.toneCreatorId);

  const selectedRecipes = Array.from(
    new Set([
      hookRecipe.creatorId,
      structureRecipe.creatorId,
      toneRecipe.creatorId,
      ...(selection.blend.creatorIds || [])
    ])
  )
    .slice(0, 3)
    .map(id => getRecipeByCreatorId(id));

  const primaryLangs = new Set(selectedRecipes.map(r => r.languages[0]));
  const needsNarrationLanguage = primaryLangs.size > 1;
  const languageMismatchWarning = needsNarrationLanguage
    ? `Note: ${selectedRecipes.map(r => r.creatorName).join(' and ')} typically use different default languages (${Array.from(primaryLangs).join(' vs. ')}). Choose which language the final script should be in below.`
    : undefined;

  const resolvedResearch = resolveResearchStyle(selection, undefined, minutes);
  const researchLines = describeResearchStyle(resolvedResearch);

  const chosenLang = selection.blend.chosenLanguage;
  const effectiveLanguages = chosenLang
    ? [chosenLang, ...toneRecipe.languages.filter(l => l !== chosenLang)]
    : toneRecipe.languages;

  const blendedRecipe: CreatorRecipe = {
    creatorId: toneRecipe.creatorId,
    creatorName: `${hookRecipe.creatorName} (Hook) + ${structureRecipe.creatorName} (Structure) + ${toneRecipe.creatorName} (Tone)`,
    displayName: `${hookRecipe.creatorName} + ${structureRecipe.creatorName} + ${toneRecipe.creatorName}`,
    source: 'tuned',
    niches: Array.from(new Set(selectedRecipes.flatMap(r => r.niches))),
    regions: Array.from(new Set(selectedRecipes.flatMap(r => r.regions))),
    languages: effectiveLanguages,
    formats: structureRecipe.formats,
    hook: hookRecipe.hook,
    structure: structureRecipe.structure,
    tone: toneRecipe.tone,
    signaturePhrases: toneRecipe.signaturePhrases,
    forbiddenPhrases: Array.from(
      new Set(selectedRecipes.flatMap(r => r.forbiddenPhrases || []))
    ),
    sentenceLengthRange: toneRecipe.sentenceLengthRange,
    productionNotes: `${hookRecipe.creatorName} hook style + ${structureRecipe.creatorName} chapter structure + ${toneRecipe.creatorName} vocal cadence.`
  };

  const blendLines = [
    `Hook style from ${hookRecipe.creatorName} (${hookRecipe.hook.secondsMin}–${hookRecipe.hook.secondsMax}s: ${hookRecipe.hook.types[0]}).`,
    `Chapter structure from ${structureRecipe.creatorName} (${structureRecipe.structure.length} chapters).`,
    `Language & vocal tone from ${toneRecipe.creatorName}${chosenLang ? ` (${chosenLang})` : ''}.`,
    researchLines[1],
    researchLines[3]
  ];

  return {
    recipe: blendedRecipe,
    needsNarrationLanguage,
    languageMismatchWarning,
    availableLanguages: Array.from(new Set(selectedRecipes.flatMap(r => r.languages))),
    summaryLines: blendLines
  };
}

/**
 * Deterministic IN-CODE scorer matching topic, niche, region, language, format, and duration
 * against all available CreatorRecipes. Returns top 3 matches and whether "Blend top 2" is recommended.
 */
export function matchCreators(options: {
  niche: string;
  topic: string;
  region: string;
  language: string;
  format: ScriptFormatType;
  minutes: number;
}): {
  topMatches: CreatorMatchResult[];
  suggestBlendTop2: boolean;
} {
  const { niche, topic, region, language, format, minutes } = options;
  const allRecipes = getAllCreatorRecipes();
  const topicLower = (topic || '').toLowerCase();

  const scored: CreatorMatchResult[] = allRecipes.map(recipe => {
    let score = 40;
    const reasons: string[] = [];
    const researchStyle = getResearchStyleByCreatorId(recipe.creatorId);

    // 1. Niche match (+25 pts)
    if (niche && recipe.niches.some(n => n.toLowerCase() === niche.toLowerCase())) {
      score += 25;
      reasons.push(`Strong fit for ${niche}`);
    }

    // 2. Region match (+15 pts)
    if (region && recipe.regions.some(r => r.toLowerCase() === region.toLowerCase())) {
      score += 15;
      if (researchStyle.defaultScope === 'ground' && region === 'Pakistan') {
        score += 8;
        reasons.push(`Deep local ${region} research focus`);
      } else {
        reasons.push(`Covers ${region} & international context`);
      }
    }

    // 3. Language match (+15 pts)
    if (
      language &&
      recipe.languages.some(l => l.toLowerCase().includes(language.toLowerCase().split(' ')[0]))
    ) {
      score += 15;
      reasons.push(`Native cadence in ${language}`);
    }

    // 4. Format & Duration range fit (+15 pts)
    const fmtSpec = recipe.formats.find(f => f.id === format);
    if (fmtSpec) {
      if (minutes >= fmtSpec.minLen && minutes <= fmtSpec.maxLen) {
        score += 15;
        reasons.push(`Ideal structure for ${minutes}-min ${format}`);
      } else {
        score += 7;
      }
    }

    // 5. Topic keyword affinity & domain specialization (+10 to +35 pts)
    const isBusinessTopic =
      /\b(scale|scaling|how to scale|business|businesses|startup|startups|entrepreneur|entrepreneurship|founder|sales|selling|revenue|profit|profits|margin|margins|marketing|funnel|conversion|leads|lead generation|client|clients|customer|customers|customer acquisition|b2b|saas|smma|agency|ecommerce|e-commerce|shopify|offer|offers|pricing|monetize|monetization|cashflow|investing|investor|stocks|stock market|wealth|crypto|real estate|dropshipping|cold call|growth|playbook|hiring|operations|roi|cac|ltv|high ticket)\b/i.test(
        topicLower
      );

    const isChallengeTopic =
      /\b(challenge|survive|surviving|last to leave|win|prize|24 hours|100 hours|50 hours|\$1 vs|\$10,000|\$100,000|\$1,000,000|extreme stunt|prank|world's largest|mrbeast)\b/i.test(
        topicLower
      );

    const isSciencePhilosophyTopic =
      /\b(physics|quantum|relativity|astrophysics|black hole|thermodynamics|paradox|biology|genetics|dna|evolution|neuroscience|brain|psychology|cognitive|philosophy|stoicism|stoic|meaning of life|naval|jordan peterson|veritasium|habits|atomic habits|discipline|mental models|consciousness|logic)\b/i.test(
        topicLower
      );

    const isPoliticalExposeTopic =
      /\b(pakistan|karachi|lahore|islamabad|imf|pide|mafia|cartel|history|military|politics|political|scandal|corruption|court|supreme court|judiciary|water mafia|electricity|ipp|rti|audit|report|constitution)\b/i.test(
        topicLower
      );

    if (isBusinessTopic) {
      if (recipe.creatorId.includes('hormozi')) {
        score += 32;
        reasons.push('Direct operator playbook for scaling, unit economics & bottlenecks');
      } else if (recipe.creatorId.includes('iman')) {
        score += 26;
        reasons.push('Contrarian business analysis & client acquisition');
      } else if (recipe.creatorId.includes('sharan')) {
        score += 24;
        reasons.push('Actionable business & financial frameworks');
      } else if (!isPoliticalExposeTopic) {
        score -= 8;
      }
    } else if (isChallengeTopic) {
      if (recipe.creatorId.includes('mrbeast')) {
        score += 35;
        reasons.push('High-retention challenge & concept design');
      } else {
        score -= 10;
      }
    } else if (isSciencePhilosophyTopic) {
      if (recipe.creatorId.includes('veritasium')) {
        score += 30;
        reasons.push('Evidence-first science breakdown & study analysis');
      } else if (recipe.creatorId.includes('naval') || recipe.creatorId.includes('peterson')) {
        score += 28;
        reasons.push('First-principles philosophy & human psychology');
      }
    } else if (isPoliticalExposeTopic) {
      if (recipe.creatorId.includes('raftar') || recipe.creatorId.includes('thynkwhy')) {
        score += 20;
        reasons.push('Ground-reality storytelling & investigative research');
      } else if (recipe.creatorId.includes('nitish')) {
        score += 22;
        reasons.push('Document-first analysis & audit reports');
      } else if (recipe.creatorId.includes('dhruv')) {
        score += 20;
        reasons.push('Evidence-first explainer & international comparison');
      }
    }

    const cappedScore = Math.min(99, score);
    const whyLine =
      reasons.slice(0, 3).join(' · ') ||
      `Balanced ${recipe.structure.length}-chapter structure for ${topic || 'this topic'}.`;

    return {
      creatorId: recipe.creatorId,
      creatorName: recipe.creatorName,
      score: cappedScore,
      reasons,
      whyLine,
      recipe
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const topMatches = scored.slice(0, 3);
  const suggestBlendTop2 =
    topMatches.length >= 2 && Math.abs(topMatches[0].score - topMatches[1].score) < 10;

  return {
    topMatches,
    suggestBlendTop2
  };
}
