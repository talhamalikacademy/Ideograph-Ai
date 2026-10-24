// Style-inspired starter values. Tune after watching 3 to 5 real videos.
import { ResearchStyle, DEFAULT_BUDGET_BY_MODE } from './types';

export const MRBEAST_RESEARCH_STYLE: ResearchStyle = {
  creatorId: 'mrbeast',
  displayName: 'MrBeast-style concept video',
  source: 'starter',
  intent: 'Make an idea people click and watch to the end; verify only what must be true in the real world.',
  audience: 'Broad audience with short attention.',
  researchMode: 'concept_lab',
  defaultScope: 'both',
  questionSet: [
    'Have similar videos been made, and what made the best ones work?',
    'What is the stakes ladder (what rises at each step)?',
    'What are the real costs, prizes, rules, permits and safety needs?',
    'Is it possible within the time and budget?',
    'What would keep a viewer watching past minute 3?',
    'What could go wrong legally or for safety?'
  ],
  sourcePriority: [
    {
      type: 'format_reference',
      weight: 0.35,
      examples: ['Similar high-retention video concepts', 'Challenge formats that worked']
    },
    {
      type: 'feasibility_safety',
      weight: 0.30,
      examples: ['Real-world costs, permits, rules, safety and legal constraints']
    },
    {
      type: 'audience_interest',
      weight: 0.20,
      examples: ['Audience curiosity hooks and retention escalation beats']
    },
    {
      type: 'user_material',
      weight: 0.15,
      examples: ['Your own budget, prize, and challenge rules']
    }
  ],
  evidenceRules: [
    'Verify only real-world facts: cost, prize, time, rules, safety, legal.',
    'Creative choices are "ideas", never "facts".',
    "The user's own budget and plan outrank web results."
  ],
  avoid: [
    'long factual research',
    'history essays',
    'anything that slows the first minute'
  ],
  queryTemplates: [
    {
      type: 'format_reference',
      templates: [
        '{topic} similar video concept',
        '{topic} challenge format that worked'
      ]
    },
    {
      type: 'feasibility_safety',
      templates: [
        '{topic} rules permit safety requirements',
        '{topic} cost estimate'
      ]
    },
    {
      type: 'audience_interest',
      templates: [
        '{topic} why people watch high stakes challenge'
      ]
    }
  ],
  factScoring: {
    credibility: 0.15,
    novelty: 0.30,
    storyValue: 0.30,
    relevance: 0.25
  },
  claimPolicy: {
    strictness: 'light',
    namedEntityRule: false,
    resultsClaimCheck: false,
    sensitiveTopicFlag: false
  },
  budget: DEFAULT_BUDGET_BY_MODE.concept_lab,
  uiLabels: {
    title: 'Concept check',
    startButton: 'Run concept check',
    showScope: false,
    canSkip: true,
    tabs: [
      { id: 'all', label: 'Concept sheet', types: [] },
      { id: 'similar_formats', label: 'Similar formats', types: ['format_reference', 'event'] },
      { id: 'rules_safety', label: 'Rules and safety', types: ['feasibility_safety', 'official_data', 'stat'] },
      { id: 'audience', label: 'Audience', types: ['audience_interest', 'public_voices'] },
      { id: 'your_plan', label: 'Your plan', types: ['user_material'] }
    ],
    sourceToggles: [
      { id: 'format_reference', label: 'Similar formats', mapsTo: 'format_reference' },
      { id: 'feasibility_safety', label: 'Cost, rules and safety', mapsTo: 'feasibility_safety' },
      { id: 'audience_interest', label: 'Audience interest', mapsTo: 'audience_interest' },
      { id: 'user_material', label: 'Your plan', mapsTo: 'user_material' }
    ]
  },
  writerNotes: [
    'Label creative choices as ideas, not facts.',
    'Put real costs and rules on screen as numbers.',
    'The writer must follow the hook length and structure from the recipe.'
  ],
  systemPromptBlock:
    'You are helping design a high-retention video concept, not writing an essay. Keep research short: find similar formats and what worked, build a stakes ladder, check real cost, rules and safety, and plan what keeps viewers past the 3-minute mark. Verify only real-world numbers and safety or legal facts. Everything creative is an "idea", not a "fact".'
};
