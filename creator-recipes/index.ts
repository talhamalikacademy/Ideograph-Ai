import { CREATORS } from '../constants';
import { CreatorProfile } from '../types';
import { CreatorRecipe, ChannelStyleProfile } from './types';

const CUSTOM_CHANNEL_RECIPES_KEY = 'ideograph.customChannelRecipes.v1';

/**
 * 1. Starter recipe for Dhruv Rathee (Explainer / Exposé) — starter values to tune from real videos.
 */
export const DHRUV_RECIPE: CreatorRecipe = {
  creatorId: 'dhruvrathee',
  creatorName: 'Dhruv Rathee',
  displayName: 'Dhruv Rathee',
  source: 'tuned',
  niches: [
    'Politics & governance',
    'Science & health',
    'Tech & AI',
    'History',
    'Environment & resources',
    'Economy & business'
  ],
  regions: ['India', 'Pakistan', 'Global', 'South Asia'],
  languages: ['Hinglish (Roman)', 'Hindi (Devanagari)', 'English', 'Roman Urdu', 'Urdu (Proper)'],
  formats: [
    { id: 'documentary', minLen: 10, maxLen: 30, wpm: 145 },
    { id: 'explainer', minLen: 4, maxLen: 15, wpm: 145 },
    { id: 'short', minLen: 1, maxLen: 2, wpm: 155 }
  ],
  hook: {
    secondsMin: 30,
    secondsMax: 60,
    types: ['Shocking claim or question + what is at stake', 'Counter-intuitive fact + roadmap'],
    rules: [
      'Open with a direct high-stakes claim or question in the first 10 seconds',
      'State clearly why this affects the viewer personally before introducing the roadmap',
      'Keep sentences crisp (12–16 words) with clear step-by-step signposting'
    ]
  },
  structure: [
    { id: 'claim_and_stakes', purpose: 'Core claim, context, and what is at stake for the viewer', weight: 0.16 },
    { id: 'historical_context', purpose: 'How the issue started and key timeline turning points', weight: 0.20 },
    { id: 'evidence_breakdown', purpose: 'Step-by-step data, studies, and institutional proof', weight: 0.28 },
    { id: 'other_side_comparison', purpose: 'Strongest argument from the other side and international comparison', weight: 0.20 },
    { id: 'conclusion_takeaway', purpose: 'Synthesis, actionable solutions, and final question', weight: 0.16 }
  ],
  tone: {
    summary: 'Calm, structured, teacher-like investigative explainer that builds step-by-step from context to data to international comparison.',
    signaturePhrases: ['Namaskar dosto', 'Chaliye samajhte hain step by step', 'Aaiye data dekhte hain']
  },
  signaturePhrases: ['Namaskar dosto', 'Chaliye samajhte hain step by step', 'Aaiye data dekhte hain'],
  forbiddenPhrases: ['Without any doubt everyone knows', 'In this essay I will discuss'],
  exampleOpenings: [
    'Imagine waking up tomorrow and discovering that the water in your tap costs more than petrol—chaliye samajhte hain yeh संकट kaise shuru hua.'
  ],
  sentenceLengthRange: [12, 17],
  productionNotes: 'On-screen source cards, side-by-side comparison charts, and clear chapter title cards.'
};

/**
 * 2. Starter recipe for Raftar TV (Investigative Documentary) — starter values to tune from real videos.
 */
export const RAFTAR_RECIPE: CreatorRecipe = {
  creatorId: 'raftar',
  creatorName: 'Raftar',
  displayName: 'Raftar TV',
  source: 'tuned',
  niches: [
    'Politics & governance',
    'Society & crime',
    'Economy & business',
    'History',
    'Education & careers'
  ],
  regions: ['Pakistan', 'South Asia', 'Middle East & Gulf', 'Global'],
  languages: ['Roman Urdu', 'Urdu (Proper)', 'English', 'Hinglish (Roman)'],
  formats: [
    { id: 'documentary', minLen: 12, maxLen: 30, wpm: 135 },
    { id: 'explainer', minLen: 5, maxLen: 12, wpm: 138 },
    { id: 'short', minLen: 1, maxLen: 2, wpm: 145 }
  ],
  hook: {
    secondsMin: 45,
    secondsMax: 90,
    types: ['Cinematic scene or dated incident cold open', 'Historical archive moment + systemic question'],
    rules: [
      'Open inside a concrete dated scene, incident, or historical moment before widening the lens',
      'Pivot from macro promises to ground reality in local cities and households',
      'Never repeat the same point across multiple rephrased sentences'
    ]
  },
  structure: [
    { id: 'incident_cold_open', purpose: 'Concrete incident or historical scene and why it matters now', weight: 0.15 },
    { id: 'historical_background', purpose: 'Archival roots, past commissions, or book anchor', weight: 0.18 },
    { id: 'who_gains_and_loses', purpose: 'Follow the money: institutional numbers and beneficiaries vs. citizens', weight: 0.22 },
    { id: 'ground_voices', purpose: 'Lived reality in cities/neighborhoods and public voices (labeled)', weight: 0.17 },
    { id: 'system_failure', purpose: 'Why reforms stalled and structural bottlenecks', weight: 0.15 },
    { id: 'way_forward', purpose: 'Comparative lessons and structural path forward', weight: 0.13 }
  ],
  tone: {
    summary: 'Cinematic Pakistani investigative documentary voice combining archival history, local institutional economics, and street-level reality.',
    signaturePhrases: ['Lekin asal kahani yahan se shuru hoti hai', 'Ab zara Pakistan ki ground reality dekhein']
  },
  signaturePhrases: ['Lekin asal kahani yahan se shuru hoti hai', 'Ab zara Pakistan ki ground reality dekhein'],
  forbiddenPhrases: ['Generic philosophical fluff', 'Repeating the same point in four sentences'],
  exampleOpenings: [
    'Karachi ki tang galiyon mein jab raat ke do baje tanker rukta hai, toh wahan paani nahi, ek poora nizam bik raha hota hai.'
  ],
  sentenceLengthRange: [13, 18],
  productionNotes: 'Archival newspaper clippings, street B-roll, rupee breakdown overlays, and documentary pacing.'
};

/**
 * 3. Starter recipe for Nitish Rajput (Document-First Investigative Timeline) — starter values to tune from real videos.
 */
export const NITISH_RECIPE: CreatorRecipe = {
  creatorId: 'nitishrajput',
  creatorName: 'Nitish Rajput',
  displayName: 'Nitish Rajput',
  source: 'tuned',
  niches: [
    'Politics & governance',
    'History',
    'Society & crime',
    'Economy & business'
  ],
  regions: ['India', 'Pakistan', 'South Asia', 'Global'],
  languages: ['Hinglish (Roman)', 'Hindi (Devanagari)', 'English', 'Roman Urdu'],
  formats: [
    { id: 'documentary', minLen: 12, maxLen: 35, wpm: 142 },
    { id: 'explainer', minLen: 6, maxLen: 15, wpm: 145 },
    { id: 'short', minLen: 1, maxLen: 2, wpm: 155 }
  ],
  hook: {
    secondsMin: 35,
    secondsMax: 70,
    types: ['Dated incident + conflicting versions of the truth', 'Court order or FIR document reveal'],
    rules: [
      'Anchor the opening in an exact date, place, and official document or court filing',
      'Lay out the central conflict neutrally before walking through the chronological timeline'
    ]
  },
  structure: [
    { id: 'dated_conflict_hook', purpose: 'Exact date, incident, and the two competing claims', weight: 0.14 },
    { id: 'chronological_origin', purpose: 'Chronological background with dated events and actors', weight: 0.22 },
    { id: 'document_and_audit_trail', purpose: 'Court filings, committee reports, FIRs, and budget numbers', weight: 0.28 },
    { id: 'both_sides_steelman', purpose: 'Side A vs. Side B arguments presented with their strongest evidence', weight: 0.20 },
    { id: 'open_questions_verdict', purpose: 'What the documents prove and what remains unanswered', weight: 0.16 }
  ],
  tone: {
    summary: 'Neutral, document-first chronological investigator who lets court records, committee reports, and timelines speak for themselves.',
    signaturePhrases: ['Ab is poore maamle ko shuru se timeline ke saath samajhte hain', 'Official report ke mutabiq']
  },
  signaturePhrases: ['Ab is poore maamle ko shuru se timeline ke saath samajhte hain', 'Official report ke mutabiq'],
  forbiddenPhrases: ['Emotional rants without document backing'],
  sentenceLengthRange: [12, 17],
  productionNotes: 'Highlighted PDF/court order callouts, dated timeline bars, and side-by-side stakeholder maps.'
};

/**
 * 4. Starter recipe for ThynkWhy (Rhythmic Society & Story Documentary) — starter values to tune from real videos.
 */
export const THYNKWHY_RECIPE: CreatorRecipe = {
  creatorId: 'thynkwhy',
  creatorName: 'ThynkWhy',
  displayName: 'ThynkWhy',
  source: 'tuned',
  niches: [
    'Society & crime',
    'Politics & governance',
    'Economy & business',
    'Education & careers',
    'History'
  ],
  regions: ['Pakistan', 'South Asia', 'Global'],
  languages: ['Roman Urdu', 'Urdu (Proper)', 'English'],
  formats: [
    { id: 'documentary', minLen: 10, maxLen: 25, wpm: 138 },
    { id: 'explainer', minLen: 4, maxLen: 12, wpm: 140 },
    { id: 'short', minLen: 1, maxLen: 2, wpm: 148 }
  ],
  hook: {
    secondsMin: 35,
    secondsMax: 65,
    types: ['Rhythmic parallel contrast hook', 'Direct societal mirror question'],
    rules: [
      'Use rhythmic parallel clauses at high-tension moments to build momentum',
      'Anchor every social critique in documented reports and lived citizen realities'
    ]
  },
  structure: [
    { id: 'rhythmic_mirror_hook', purpose: 'High-tension contrast between ideal promise and lived reality', weight: 0.15 },
    { id: 'origin_and_context', purpose: 'How this pattern took root in society or institutions', weight: 0.18 },
    { id: 'institutional_data', purpose: 'Hard figures, reports, and economic cost on families', weight: 0.24 },
    { id: 'citizen_impact', purpose: 'Ground-level human impact and public discussion', weight: 0.23 },
    { id: 'accountability_and_close', purpose: 'Other side rebuttal and closing reflection', weight: 0.20 }
  ],
  tone: {
    summary: 'Reflective, rhythmic social-mirror storyteller blending human-scale empathy with institutional data.',
    signaturePhrases: ['Zara sochein', 'Yeh sirf ek aadaad nahi, har ghar ki kahani hai']
  },
  signaturePhrases: ['Zara sochein', 'Yeh sirf ek aadaad nahi, har ghar ki kahani hai'],
  sentenceLengthRange: [11, 16],
  productionNotes: 'High-contrast typography overlays, rhythmic beat cuts, and documentary evidence cards.'
};

/**
 * 5. Starter recipe for MrBeast (High-Retention Challenge & Spectacle) — starter values to tune from real videos.
 */
export const MRBEAST_RECIPE: CreatorRecipe = {
  creatorId: 'mrbeast',
  creatorName: 'MrBeast',
  displayName: 'MrBeast',
  source: 'tuned',
  niches: ['Culture & entertainment', 'Tech & AI', 'Other'],
  regions: ['Global', 'United States & UK', 'Pakistan', 'India'],
  languages: ['English', 'Roman Urdu', 'Hinglish (Roman)'],
  formats: [
    { id: 'documentary', minLen: 8, maxLen: 20, wpm: 160 },
    { id: 'explainer', minLen: 3, maxLen: 12, wpm: 162 },
    { id: 'short', minLen: 1, maxLen: 2, wpm: 170 }
  ],
  hook: {
    secondsMin: 5,
    secondsMax: 15,
    types: ['Immediate premise + massive visual/financial stakes in first 5 seconds'],
    rules: [
      'Deliver the exact title promise and stakes in the very first sentence',
      'Zero throat-clearing or slow introductions—jump straight into Round 1 escalation'
    ]
  },
  structure: [
    { id: 'five_second_stakes_hook', purpose: 'Immediate premise, rules, and prize/stakes in first 15 seconds', weight: 0.12 },
    { id: 'round_one_escalation', purpose: 'First challenge phase and early eliminations or surprises', weight: 0.26 },
    { id: 'midpoint_twist', purpose: 'Major midpoint twist or double-or-nothing dilemma', weight: 0.28 },
    { id: 'final_showdown', purpose: 'High-tension final round with everything on the line', weight: 0.24 },
    { id: 'instant_payoff_close', purpose: 'Winner reveal and immediate punchy sign-off', weight: 0.10 }
  ],
  tone: {
    summary: 'Ultra-fast, high-stakes, visual-first spectacle with constant escalation every 60–90 seconds.',
    signaturePhrases: ['Right now', 'But here is the catch', 'Whoever survives wins']
  },
  signaturePhrases: ['Right now', 'But here is the catch', 'Whoever survives wins'],
  sentenceLengthRange: [8, 13],
  productionNotes: 'Fast cuts every 2–3 seconds, on-screen prize counters, and physical scale comparisons.'
};

/**
 * 6. Starter recipe for Alex Hormozi (Value-Per-Second Business Playbook) — starter values to tune from real videos.
 */
export const HORMOZI_RECIPE: CreatorRecipe = {
  creatorId: 'alexhormozi',
  creatorName: 'Alex Hormozi',
  displayName: 'Alex Hormozi',
  source: 'tuned',
  niches: ['Economy & business', 'Education & careers', 'Tech & AI'],
  regions: ['Global', 'United States & UK', 'Pakistan', 'India'],
  languages: ['English', 'Roman Urdu', 'Hinglish (Roman)'],
  formats: [
    { id: 'documentary', minLen: 8, maxLen: 25, wpm: 155 },
    { id: 'explainer', minLen: 4, maxLen: 15, wpm: 155 },
    { id: 'short', minLen: 1, maxLen: 2, wpm: 165 }
  ],
  hook: {
    secondsMin: 15,
    secondsMax: 35,
    types: ['Blunt proof + exact problem + numbered playbook promise'],
    rules: [
      'State the exact problem, why most people fail at it, and the numbered steps you will give them',
      'Use concrete math and unit economics instead of vague motivational advice'
    ]
  },
  structure: [
    { id: 'proof_and_promise_hook', purpose: 'Why you should care, hard proof/math, and numbered roadmap', weight: 0.15 },
    { id: 'bottleneck_diagnosis', purpose: 'The real constraint holding back results (with unit math)', weight: 0.22 },
    { id: 'step_by_step_framework', purpose: 'Actionable 3–4 step equation or operator checklist', weight: 0.32 },
    { id: 'failure_modes_and_fixes', purpose: 'Where operators mess this up and how to fix each objection', weight: 0.18 },
    { id: 'direct_execution_close', purpose: 'Zero-fluff summary and immediate first action to take today', weight: 0.13 }
  ],
  tone: {
    summary: 'Direct, high-density operator playbook built around equations, unit economics, and zero fluff.',
    signaturePhrases: ['Here is the math', 'Let us break this down into three steps', 'Most people get this backwards']
  },
  signaturePhrases: ['Here is the math', 'Let us break this down into three steps', 'Most people get this backwards'],
  sentenceLengthRange: [9, 14],
  productionNotes: 'Simple whiteboard/notepad equations, numbered framework cards, and high-contrast text.'
};

/**
 * 7. Starter recipe for Iman Gadzhi (Contrarian Monologue & Action Playbook) — starter values to tune from real videos.
 */
export const IMAN_RECIPE: CreatorRecipe = {
  creatorId: 'imangadzhi',
  creatorName: 'Iman Gadzhi',
  displayName: 'Iman Gadzhi',
  source: 'tuned',
  niches: ['Economy & business', 'Education & careers', 'Tech & AI', 'Society & crime'],
  regions: ['Global', 'United States & UK', 'Middle East & Gulf', 'Pakistan', 'India'],
  languages: ['English', 'Roman Urdu', 'Hinglish (Roman)'],
  formats: [
    { id: 'documentary', minLen: 10, maxLen: 22, wpm: 142 },
    { id: 'explainer', minLen: 5, maxLen: 15, wpm: 145 },
    { id: 'short', minLen: 1, maxLen: 2, wpm: 155 }
  ],
  hook: {
    secondsMin: 25,
    secondsMax: 50,
    types: ['Contrarian wake-up call + macro shift most people are ignoring'],
    rules: [
      'Challenge a common belief in the first 15 seconds and show the bigger economic shift behind it',
      'Bridge from mindset/symptom to a clear, repeatable 3-step execution plan'
    ]
  },
  structure: [
    { id: 'contrarian_wakeup_hook', purpose: 'The conventional lie vs. what is actually happening in the market', weight: 0.16 },
    { id: 'macro_shift_breakdown', purpose: 'Why the old path is breaking down (with real market benchmarks)', weight: 0.22 },
    { id: 'three_pillar_playbook', purpose: 'The 3-part framework and practical skill/business model breakdown', weight: 0.30 },
    { id: 'trap_and_mistake_audit', purpose: 'The 3 traps beginners fall into and realistic expectations', weight: 0.18 },
    { id: 'accountability_close', purpose: 'Personal challenge to the viewer for the next 30 days', weight: 0.14 }
  ],
  tone: {
    summary: 'Calm, cinematic, contrarian mentor voice that pairs macro economic shifts with a structured action plan.',
    signaturePhrases: ['Listen closely', 'Here is the uncomfortable truth', 'Let us look at the actual numbers']
  },
  signaturePhrases: ['Listen closely', 'Here is the uncomfortable truth', 'Let us look at the actual numbers'],
  sentenceLengthRange: [11, 16],
  productionNotes: 'Cinematic B-roll transitions, minimalist glassmorphic chapter cards, and clean financial breakdowns.'
};

/**
 * Template slots for Creators 8 to 10 (Phase B extensibility).
 */
export const EMPTY_RECIPE_SLOTS: CreatorRecipe[] = [8, 9, 10].map(slotNum => ({
  creatorId: `creator_${slotNum}`,
  creatorName: `Creator Slot ${slotNum}`,
  displayName: `Creator Slot ${slotNum}`,
  source: 'default',
  niches: ['Politics & governance', 'Economy & business', 'Science & health', 'Tech & AI'],
  regions: ['Global', 'Pakistan', 'India'],
  languages: ['English', 'Roman Urdu', 'Hinglish (Roman)'],
  formats: [
    { id: 'documentary', minLen: 10, maxLen: 25, wpm: 142 },
    { id: 'explainer', minLen: 4, maxLen: 15, wpm: 145 },
    { id: 'short', minLen: 1, maxLen: 2, wpm: 155 }
  ],
  hook: {
    secondsMin: 25,
    secondsMax: 50,
    types: ['High-stakes question + clear viewer promise'],
    rules: ['Lead with a verifiable fact or stakes in the first 15 seconds']
  },
  structure: [
    { id: 'hook_context', purpose: 'Opening hook and context', weight: 0.20 },
    { id: 'core_evidence', purpose: 'Primary evidence and mechanism', weight: 0.35 },
    { id: 'case_and_counter', purpose: 'Case study and opposing perspective', weight: 0.25 },
    { id: 'takeaway_close', purpose: 'Synthesis and takeaway', weight: 0.20 }
  ],
  sentenceLengthRange: [12, 17]
}));

export function normalizeRecipeWeights(recipe: CreatorRecipe): CreatorRecipe {
  const sum = recipe.structure.reduce((acc, s) => acc + (s.weight || 0), 0);
  if (sum <= 0) return recipe;
  if (Math.abs(sum - 1) > 0.005) {
    return {
      ...recipe,
      displayName: recipe.displayName || recipe.creatorName,
      structure: recipe.structure.map(s => ({
        ...s,
        weight: Number((s.weight / sum).toFixed(4))
      }))
    };
  }
  return {
    ...recipe,
    displayName: recipe.displayName || recipe.creatorName
  };
}

export function fromChannelStyleProfile(profile: ChannelStyleProfile): CreatorRecipe {
  const stepCount = Math.max(1, profile.structureSteps.length);
  const equalWeight = Number((1 / stepCount).toFixed(4));
  return normalizeRecipeWeights({
    creatorId: profile.id.startsWith('custom-') ? profile.id : `custom-${profile.id}`,
    creatorName: profile.name,
    displayName: profile.name,
    source: 'user_channel',
    niches: ['Politics & governance', 'Economy & business', 'Society & crime', 'Tech & AI', 'Other'],
    regions: ['Pakistan', 'India', 'Global'],
    languages: [profile.language || 'English', 'Roman Urdu', 'Hinglish (Roman)'],
    formats: [
      { id: 'documentary', minLen: 10, maxLen: 30, wpm: 142 },
      { id: 'explainer', minLen: 4, maxLen: 15, wpm: 145 },
      { id: 'short', minLen: 1, maxLen: 2, wpm: 155 }
    ],
    hook: {
      secondsMin: 25,
      secondsMax: 50,
      types: [profile.hookRule || 'Direct opening hook'],
      rules: [profile.hookRule || 'Open with a clear high-stakes claim']
    },
    structure: profile.structureSteps.map((step, idx) => ({
      id: `step_${idx + 1}`,
      purpose: step,
      weight: equalWeight
    })),
    tone: {
      summary: profile.toneSummary,
      signaturePhrases: profile.signaturePhrases
    },
    signaturePhrases: profile.signaturePhrases,
    forbiddenPhrases: profile.forbiddenPhrases,
    sentenceLengthRange: profile.sentenceLengthRange || [12, 17]
  });
}

function buildProfileDerivedRecipe(creator: CreatorProfile): CreatorRecipe {
  const idLower = (creator.id || '').toLowerCase();
  const nameLower = (creator.name || '').toLowerCase();

  if (idLower.includes('dhruv') || nameLower.includes('dhruv')) {
    return normalizeRecipeWeights({ ...DHRUV_RECIPE, creatorId: creator.id, creatorName: creator.name, displayName: creator.name });
  }
  if (idLower.includes('raftar') || nameLower.includes('raftar')) {
    return normalizeRecipeWeights({ ...RAFTAR_RECIPE, creatorId: creator.id, creatorName: creator.name, displayName: creator.name });
  }
  if (idLower.includes('nitish') || nameLower.includes('nitish')) {
    return normalizeRecipeWeights({ ...NITISH_RECIPE, creatorId: creator.id, creatorName: creator.name, displayName: creator.name });
  }
  if (idLower.includes('thynkwhy') || idLower.includes('thinkwhy') || nameLower.includes('thynkwhy')) {
    return normalizeRecipeWeights({ ...THYNKWHY_RECIPE, creatorId: creator.id, creatorName: creator.name, displayName: creator.name });
  }
  if (idLower.includes('mrbeast') || nameLower.includes('mrbeast')) {
    return normalizeRecipeWeights({ ...MRBEAST_RECIPE, creatorId: creator.id, creatorName: creator.name, displayName: creator.name });
  }
  if (idLower.includes('hormozi') || nameLower.includes('hormozi')) {
    return normalizeRecipeWeights({ ...HORMOZI_RECIPE, creatorId: creator.id, creatorName: creator.name, displayName: creator.name });
  }
  if (idLower.includes('iman') || idLower.includes('sharan') || nameLower.includes('iman')) {
    return normalizeRecipeWeights({ ...IMAN_RECIPE, creatorId: creator.id, creatorName: creator.name, displayName: creator.name });
  }

  const isEntertainment = idLower.includes('mrbeast');
  const isBusiness =
    idLower.includes('hormozi') || idLower.includes('iman') || idLower.includes('sharan');
  const isScience =
    idLower.includes('veritasium') || idLower.includes('naval') || idLower.includes('peterson');

  const niches = isEntertainment
    ? ['Culture & entertainment', 'Other']
    : isBusiness
    ? ['Economy & business', 'Education & careers', 'Tech & AI']
    : isScience
    ? ['Science & health', 'Tech & AI', 'Education & careers', 'Environment & resources']
    : ['Politics & governance', 'History', 'Society & crime', 'Economy & business'];

  const workflowStages = creator.bio?.workflow?.stages || [];
  const structure =
    workflowStages.length >= 3
      ? workflowStages.map(st => ({
          id: st.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          purpose: `${st.name}: ${st.purpose}`,
          weight: Math.max(0.1, (st.sharePct || 20) / 100)
        }))
      : [
          { id: 'hook_context', purpose: 'Opening hook, context, and core question', weight: 0.18 },
          { id: 'core_mechanism', purpose: 'Primary cause, mechanism, and key evidence', weight: 0.30 },
          { id: 'case_study_proof', purpose: 'Real-world case study, numbers, and examples', weight: 0.30 },
          { id: 'takeaway_close', purpose: 'Other side perspective and final takeaway', weight: 0.22 }
        ];

  return normalizeRecipeWeights({
    creatorId: creator.id,
    creatorName: creator.name,
    displayName: creator.name,
    source: 'profile_derived',
    niches,
    regions: ['Global', 'Pakistan', 'India', 'United States & UK'],
    languages: ['English', 'Roman Urdu', 'Hinglish (Roman)', 'Urdu (Proper)', 'Hindi (Devanagari)'],
    formats: [
      { id: 'documentary', minLen: 10, maxLen: 30, wpm: 142 },
      { id: 'explainer', minLen: 3, maxLen: 15, wpm: 145 },
      { id: 'short', minLen: 1, maxLen: 2, wpm: 155 }
    ],
    hook: {
      secondsMin: isEntertainment ? 15 : 30,
      secondsMax: isEntertainment ? 35 : 60,
      types: [
        creator.bio?.structure?.hookStyle || 'High-stakes question or fact + clear promise'
      ],
      rules: creator.bio?.hookRules?.use?.slice(0, 3) || [
        'Lead with the strongest verifiable claim or stakes in the first 15 seconds',
        'Keep the opening concise and directly tied to the video topic'
      ]
    },
    structure,
    tone: {
      summary: creator.bio?.voice?.tone || creator.style,
      signaturePhrases: creator.bio?.signaturePhrases || []
    },
    signaturePhrases: creator.bio?.signaturePhrases || [],
    forbiddenPhrases: creator.bio?.forbiddenPatterns || [],
    sentenceLengthRange: [12, 18],
    productionNotes: 'Clean visual B-roll cues, on-screen data callouts, and structured pacing.'
  });
}

export function getCustomChannelRecipes(): CreatorRecipe[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_CHANNEL_RECIPES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeRecipeWeights) : [];
  } catch {
    return [];
  }
}

export function saveCustomChannelRecipe(recipe: CreatorRecipe): CreatorRecipe[] {
  const normalized = normalizeRecipeWeights(recipe);
  const existing = getCustomChannelRecipes().filter(r => r.creatorId !== normalized.creatorId);
  const next = [normalized, ...existing];
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CUSTOM_CHANNEL_RECIPES_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }
  return next;
}

export function deleteCustomChannelRecipe(creatorId: string): CreatorRecipe[] {
  const next = getCustomChannelRecipes().filter(r => r.creatorId !== creatorId);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CUSTOM_CHANNEL_RECIPES_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }
  return next;
}

export function getAllCreatorRecipes(): CreatorRecipe[] {
  const builtIn = CREATORS.map(buildProfileDerivedRecipe);
  const hasIman = builtIn.some(r => r.creatorId.toLowerCase().includes('iman'));
  const completeBuiltIn = hasIman ? builtIn : [...builtIn, normalizeRecipeWeights(IMAN_RECIPE)];
  const custom = getCustomChannelRecipes();
  return [...custom, ...completeBuiltIn];
}

export function getRecipeByCreatorId(creatorId?: string): CreatorRecipe {
  const all = getAllCreatorRecipes();
  if (!creatorId) return all[0] || DHRUV_RECIPE;
  const clean = creatorId.toLowerCase().trim();
  return (
    all.find(
      r =>
        r.creatorId.toLowerCase() === clean ||
        r.creatorName.toLowerCase() === clean ||
        r.creatorId.toLowerCase().includes(clean)
    ) ||
    all[0] ||
    DHRUV_RECIPE
  );
}

export const getCreatorRecipeById = getRecipeByCreatorId;
