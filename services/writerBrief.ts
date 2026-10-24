import { FactCard, WrittenChapterResult } from "../types";
import { CreatorRecipe } from "../creator-recipes/types";
import {
  ResearchStyle,
  ResearchScope,
  formatFactTypePlainLabel,
  formatClaimPolicyPlainSentence
} from "../creator-research";
import { ScriptBudget } from "./budget";

export interface WriterChecklistItem {
  id:
    | 'voice'
    | 'hook'
    | 'structure'
    | 'research_rules'
    | 'proof_rules'
    | 'length'
    | 'facts_available'
    | 'still_missing';
  label: string;
  text: string;
}

export interface WriterBriefResult {
  userChecklist: WriterChecklistItem[];
  modelInstruction: string;
}

export function buildWriterBrief(options: {
  style: ResearchStyle;
  recipe: CreatorRecipe;
  approvedFacts: FactCard[];
  budget: ScriptBudget;
  scope: ResearchScope;
  gaps?: string[];
  winningLens?: string;
  customChecklistOverrides?: Partial<Record<WriterChecklistItem['id'], string>>;
  extraUserInstructions?: string;
}): WriterBriefResult {
  const {
    style,
    recipe,
    approvedFacts,
    budget,
    scope,
    gaps = [],
    winningLens,
    customChecklistOverrides = {},
    extraUserInstructions = ''
  } = options;

  // Count approved facts by type
  const countsByType = new Map<string, number>();
  for (const f of approvedFacts) {
    if (f.status === 'removed' || f.status === 'rejected') continue;
    const label = formatFactTypePlainLabel(f.type);
    countsByType.set(label, (countsByType.get(label) || 0) + 1);
  }

  const factsSummaryLine =
    countsByType.size > 0
      ? Array.from(countsByType.entries())
          .map(([lbl, cnt]) => `${cnt} ${lbl}`)
          .join(', ')
      : 'No approved facts yet (script will mark missing facts clearly)';

  const defaultChecklist: WriterChecklistItem[] = [
    {
      id: 'voice',
      label: 'Voice',
      text: `${recipe.creatorName} (${style.displayName}) — ${style.intent}`
    },
    {
      id: 'hook',
      label: 'Hook',
      text: `${recipe.hook.secondsMin} to ${recipe.hook.secondsMax} seconds — ${
        recipe.hook.types[0] || 'Direct opening'
      }`
    },
    {
      id: 'structure',
      label: 'Structure',
      text: recipe.structure.map((s, i) => `${i + 1}. ${s.purpose.split(':')[0]}`).join(' → ')
    },
    {
      id: 'research_rules',
      label: 'Research rules',
      text: style.evidenceRules.join(' ')
    },
    {
      id: 'proof_rules',
      label: 'Proof rules',
      text: formatClaimPolicyPlainSentence(style.claimPolicy)
    },
    {
      id: 'length',
      label: 'Length',
      text: `About ${budget.voiceoverWords.toLocaleString()} spoken words across ${budget.averageChapters} chapters (${budget.minutes} minutes)`
    },
    {
      id: 'facts_available',
      label: 'Facts available',
      text: `${approvedFacts.length} total (${factsSummaryLine})`
    },
    {
      id: 'still_missing',
      label: 'What is still missing',
      text:
        gaps.length > 0
          ? gaps.slice(0, 3).join(' | ')
          : approvedFacts.length === 0
          ? style.researchMode === 'playbook'
            ? 'No user numbers added yet — will use [NEEDS YOUR DATA]'
            : 'Research skipped or empty — will use [NEEDS DATA]'
          : 'All core questions have supporting facts'
    }
  ];

  const userChecklist = defaultChecklist.map(item => ({
    ...item,
    text:
      customChecklistOverrides[item.id] !== undefined
        ? customChecklistOverrides[item.id]!
        : item.text
  }));

  const missingMarkerExample =
    style.researchMode === 'playbook'
      ? '[NEEDS YOUR DATA: insert your real figure or client result here]'
      : '[NEEDS DATA: what is missing]';

  const modelInstruction = [
    '=== RESEARCH-TO-WRITER CONTRACT (HARD RULES) ===',
    `1. VOICE & STRUCTURE: ${userChecklist.find(c => c.id === 'voice')?.text}`,
    `2. HOOK RULE: ${userChecklist.find(c => c.id === 'hook')?.text}`,
    `3. CHAPTER FLOW: ${userChecklist.find(c => c.id === 'structure')?.text}`,
    `4. LENGTH TARGET: ${userChecklist.find(c => c.id === 'length')?.text} (Scope: ${scope})`,
    winningLens
      ? `5. SUPPORTED LENS: Follow the lens supported by the research ("${winningLens}"). Do not assume an unsupported theme.`
      : '5. LENS RULE: Do not assume a pre-set theme; let the approved facts drive the narrative.',
    '6. USE APPROVED FACTS ONLY: Use facts ONLY from the approved FactCards provided. Tag every sentence that uses a fact with its id, like [F12].',
    `7. MISSING FACTS RULE: Never invent a number, case study, quote, or source. If a number or fact is missing, write ${missingMarkerExample}.`,
    '8. PUBLIC VOICES RULE: Whenever using a public_voices / unverified_voice fact, write "people say" or "people online say". Never state it as a verified statistic.',
    `9. EVIDENCE RULES: ${userChecklist.find(c => c.id === 'research_rules')?.text}`,
    `10. AVOID: ${style.avoid.join(' | ')}`,
    `11. WRITER NOTES: ${style.writerNotes.join(' | ')}`,
    `12. CLAIM POLICY (${style.claimPolicy.strictness.toUpperCase()}):`,
    style.claimPolicy.strictness === 'strict'
      ? '   - Every number and key claim MUST carry its [F#] source tag and name the source in prose.'
      : '   - Cite [F#] tags wherever facts are used.',
    style.claimPolicy.namedEntityRule
      ? '   - NAMED ENTITY RULE: Soften any accusation against a named person or organization unless at least 2 independent sources ([F#]) are tagged on that sentence.'
      : '',
    style.claimPolicy.resultsClaimCheck
      ? '   - RESULTS CLAIM RULE: Add a clear "results vary" note wherever income, business, or performance outcomes are mentioned.'
      : '',
    style.claimPolicy.sensitiveTopicFlag
      ? '   - SENSITIVE TOPIC RULE: Prefix any paragraph making sensitive security, political, or court allegations with "[Editor review]".'
      : '',
    '13. QUOTES RULE: Keep direct quotes under 25 words, and use ONLY quotes from FactCards/QuoteCards where quote.verified is true (or mark web quotes with "check at source").',
    '14. NO-REPEAT RULE: Do not repeat facts, examples, numbers, or phrases already used in earlier chapters.',
    extraUserInstructions.trim()
      ? `15. EXTRA USER INSTRUCTIONS: ${extraUserInstructions.trim()}`
      : ''
  ]
    .filter(Boolean)
    .join('\n');

  return {
    userChecklist,
    modelInstruction
  };
}

export function computeResearchUsedReport(options: {
  approvedFacts: FactCard[];
  chapters: WrittenChapterResult[];
  hookText?: string;
}): {
  usedFacts: FactCard[];
  unusedFacts: FactCard[];
  usedCount: number;
  totalApprovedCount: number;
} {
  const { approvedFacts, chapters, hookText = '' } = options;
  const active = approvedFacts.filter(
    f => f.status === 'approved' || f.status === 'pinned' || f.status === 'edited'
  );

  const usedIds = new Set<string>();
  const combinedText = [hookText, ...chapters.map(c => c.text)].join('\n');

  for (const m of combinedText.matchAll(/\[(F[\w\-]+)\]/g)) {
    usedIds.add(m[1]);
  }
  for (const chap of chapters) {
    (chap.usedFactIds || []).forEach(id => usedIds.add(id));
  }

  const usedFacts = active.filter(f => usedIds.has(f.id));
  const unusedFacts = active.filter(f => !usedIds.has(f.id));

  return {
    usedFacts,
    unusedFacts,
    usedCount: usedFacts.length,
    totalApprovedCount: active.length
  };
}
