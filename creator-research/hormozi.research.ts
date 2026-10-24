// Style-inspired starter values. Tune after watching 3 to 5 real videos.
import { ResearchStyle, DEFAULT_BUDGET_BY_MODE } from './types';

export const HORMOZI_RESEARCH_STYLE: ResearchStyle = {
  creatorId: 'hormozi',
  displayName: 'Hormozi-style playbook',
  source: 'starter',
  intent: 'Give the viewer a framework they can act on today, backed by real numbers and proof.',
  audience: 'Business and self-improvement viewers.',
  researchMode: 'playbook',
  defaultScope: 'both',
  questionSet: [
    'Who is the viewer, and how aware are they of the problem (unaware, problem-aware, solution-aware, product-aware)?',
    'What is the one framework or rule, in plain steps?',
    "Which numbers or solved example show it working (the user's own first)?",
    'What do studies or books say for or against it?',
    'What objections will viewers raise, and what is the honest answer?',
    'What are the realistic results and limits?'
  ],
  sourcePriority: [
    {
      type: 'user_material',
      weight: 0.30,
      examples: ['Your own real numbers, client results, and solved math examples']
    },
    {
      type: 'global_studies',
      weight: 0.35,
      examples: ['Business studies, behavioral research, and published books']
    },
    {
      type: 'benchmarks',
      weight: 0.20,
      examples: ['Industry conversion rates, margins, CAC/LTV and market benchmarks']
    },
    {
      type: 'public_voices',
      weight: 0.10,
      examples: ['Common audience objections and real bottlenecks']
    },
    {
      type: 'news',
      weight: 0.05,
      examples: ['Recent market shifts and business reports']
    }
  ],
  evidenceRules: [
    "The user's own numbers and stories come first.",
    'Every framework gets one solved numeric example.',
    'No made-up case studies: use [NEEDS YOUR DATA].',
    'Results claims only from the user’s verified numbers, with a "results vary" note.'
  ],
  avoid: [
    'news-cycle topics',
    'abstract theory with no example',
    'hype words (guaranteed, easy money)'
  ],
  queryTemplates: [
    {
      type: 'global_studies',
      templates: [
        '{topic} research study evidence',
        '{topic} book framework'
      ]
    },
    {
      type: 'benchmarks',
      templates: [
        '{topic} industry benchmark {year}'
      ]
    },
    {
      type: 'public_voices',
      templates: [
        '{topic} common objections'
      ]
    },
    {
      type: 'news',
      templates: [
        '{topic} market report {year}'
      ]
    }
  ],
  factScoring: {
    credibility: 0.25,
    novelty: 0.15,
    storyValue: 0.25,
    relevance: 0.35
  },
  claimPolicy: {
    strictness: 'standard',
    namedEntityRule: false,
    resultsClaimCheck: true,
    sensitiveTopicFlag: false
  },
  budget: DEFAULT_BUDGET_BY_MODE.playbook,
  uiLabels: {
    title: 'Frameworks and proof',
    startButton: 'Build the playbook',
    showScope: true,
    canSkip: false,
    tabs: [
      { id: 'all', label: 'Playbook', types: [] },
      { id: 'your_numbers', label: 'Your numbers', types: ['user_material'] },
      { id: 'studies_books', label: 'Studies and books', types: ['global_studies', 'books_history', 'study', 'book'] },
      { id: 'benchmarks', label: 'Benchmarks', types: ['benchmarks', 'official_data', 'stat'] },
      { id: 'objections', label: 'Objections', types: ['public_voices', 'public_voice', 'counter'] },
      { id: 'news', label: 'News', types: ['news', 'event'] }
    ],
    sourceToggles: [
      { id: 'user_material', label: 'Your stories and numbers', mapsTo: 'user_material' },
      { id: 'global_studies', label: 'Studies and books', mapsTo: 'global_studies' },
      { id: 'benchmarks', label: 'Benchmarks', mapsTo: 'benchmarks' },
      { id: 'public_voices', label: 'Objections', mapsTo: 'public_voices' },
      { id: 'news', label: 'News', mapsTo: 'news' }
    ]
  },
  writerNotes: [
    'Pick the hook by viewer awareness: unaware = curiosity, problem-aware = pain, solution-aware = promise, product-aware = proof.',
    'Show one solved numeric example per framework.',
    'Add a "results vary" line wherever results are mentioned.'
  ],
  systemPromptBlock:
    "You are the research lead for an action-first playbook video. Start with the user's own stories and numbers. Then find studies and books that support or challenge the framework, industry benchmarks, and the objections viewers will raise. Every framework needs one solved numeric example. If real numbers are missing, write [NEEDS YOUR DATA]. Never invent a case study or promise results."
};
