// Style-inspired starter values. Tune after watching 3 to 5 real videos.
import { ResearchStyle, DEFAULT_BUDGET_BY_MODE } from './types';

export const IMAN_RESEARCH_STYLE: ResearchStyle = {
  creatorId: 'iman',
  displayName: 'Iman-style business playbook',
  source: 'starter',
  intent: 'Teach a step-by-step business or personal-brand method and connect with the viewer through a real journey.',
  audience: 'Viewers who want to learn a business skill and follow a journey.',
  researchMode: 'playbook',
  defaultScope: 'both',
  questionSet: [
    'What is the exact outcome, and what are the steps to get there?',
    'What did the user personally do and earn (real numbers, real timeline)?',
    'Which tools are needed, and what do they cost?',
    'What do trends and platform data say about this right now?',
    'What are common mistakes and honest limits?',
    'What will viewers ask or doubt?'
  ],
  sourcePriority: [
    {
      type: 'user_material',
      weight: 0.30,
      examples: ['Your own personal journey, timeline, and real numbers']
    },
    {
      type: 'news',
      weight: 0.20,
      examples: ['Current platform changes, AI/creator economy trends, and tool updates']
    },
    {
      type: 'global_studies',
      weight: 0.20,
      examples: ['Industry research, skill-market studies, and books']
    },
    {
      type: 'benchmarks',
      weight: 0.15,
      examples: ['Platform benchmarks, tool pricing, and realistic timelines']
    },
    {
      type: 'public_voices',
      weight: 0.15,
      examples: ['Common beginner questions, doubts, and pitfalls']
    }
  ],
  evidenceRules: [
    "Income and result claims only from the user's own verified numbers.",
    'Always add "results vary".',
    'Flag words like guaranteed, passive, easy, quit your job.',
    'Every step must be something the viewer can really do.',
    'Name each tool and say if it is paid.'
  ],
  avoid: [
    'guaranteed income',
    '"no experience needed" promises',
    'invented screenshots or proof'
  ],
  queryTemplates: [
    {
      type: 'news',
      templates: [
        '{topic} trend {year}',
        '{topic} platform change'
      ]
    },
    {
      type: 'benchmarks',
      templates: [
        '{topic} platform benchmark data'
      ]
    },
    {
      type: 'global_studies',
      templates: [
        '{topic} market growth study {year}'
      ]
    },
    {
      type: 'public_voices',
      templates: [
        '{topic} beginner questions'
      ]
    }
  ],
  factScoring: {
    credibility: 0.30,
    novelty: 0.15,
    storyValue: 0.25,
    relevance: 0.30
  },
  claimPolicy: {
    strictness: 'strict',
    namedEntityRule: false,
    resultsClaimCheck: true,
    sensitiveTopicFlag: false
  },
  budget: DEFAULT_BUDGET_BY_MODE.playbook,
  uiLabels: {
    title: 'Playbook research',
    startButton: 'Build the playbook',
    showScope: true,
    canSkip: false,
    tabs: [
      { id: 'all', label: 'Playbook', types: [] },
      { id: 'your_story', label: 'Your story', types: ['user_material'] },
      { id: 'trends', label: 'Trends', types: ['news', 'event'] },
      { id: 'studies', label: 'Studies', types: ['global_studies', 'books_history', 'study', 'book'] },
      { id: 'benchmarks', label: 'Benchmarks', types: ['benchmarks', 'official_data', 'stat'] },
      { id: 'audience_questions', label: 'Audience questions', types: ['public_voices', 'public_voice', 'counter'] }
    ],
    sourceToggles: [
      { id: 'user_material', label: 'Your stories and numbers', mapsTo: 'user_material' },
      { id: 'news', label: 'Trends', mapsTo: 'news' },
      { id: 'global_studies', label: 'Studies', mapsTo: 'global_studies' },
      { id: 'benchmarks', label: 'Platform benchmarks', mapsTo: 'benchmarks' },
      { id: 'public_voices', label: 'Audience questions', mapsTo: 'public_voices' }
    ]
  },
  writerNotes: [
    "Tell the journey with the user's own real details.",
    'Number the steps.',
    'Never promise income.'
  ],
  systemPromptBlock:
    "You are the research lead for a step-by-step business or personal-brand video. Start with the user's own journey and numbers. Then find current trends, platform benchmarks, and studies. List the tools and their costs. Flag any income promise. If numbers are missing, write [NEEDS YOUR DATA]. Never imply guaranteed results."
};
