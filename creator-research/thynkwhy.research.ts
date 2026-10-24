// Style-inspired starter values. Tune after watching 3 to 5 real videos.
import { ResearchStyle, DEFAULT_BUDGET_BY_MODE } from './types';

export const THYNKWHY_RESEARCH_STYLE: ResearchStyle = {
  creatorId: 'thynkwhy',
  displayName: 'ThynkWhy-style society and story documentary',
  source: 'starter',
  intent: "Explain a social issue or a person's story through psychology, real stories and expert views.",
  audience: 'Viewers who like storytelling documentaries about society and people.',
  researchMode: 'full_dossier',
  defaultScope: 'ground',
  questionSet: [
    'Who are the real people in this story and what happened to them?',
    'What do named experts (with credentials) say about why people behave this way?',
    'What does data say about how common this is?',
    'What is the cultural or historical background?',
    'Which real-life examples show it clearly?',
    'What question or lesson is left at the end?'
  ],
  sourcePriority: [
    {
      type: 'expert_views',
      weight: 0.25,
      examples: ['Psychologists', 'Sociologists', 'Researchers', 'University studies']
    },
    {
      type: 'official_data',
      weight: 0.20,
      examples: ['Social and demographic statistics', 'Public health and institutional data']
    },
    {
      type: 'news',
      weight: 0.20,
      examples: ['Feature journalism and documented case reports']
    },
    {
      type: 'public_voices',
      weight: 0.20,
      examples: ['Real stories, interviews, and personal accounts (labelled)']
    },
    {
      type: 'books_history',
      weight: 0.15,
      examples: ['Cultural history, psychology books, and biographies']
    }
  ],
  evidenceRules: [
    'An expert needs name, credential and where they said it.',
    'A real-life story needs its source.',
    'Biographical facts about a person need 2 sources.',
    'Never diagnose a real living person.'
  ],
  avoid: [
    'gossip',
    'amateur psychology about named living people',
    '"untold facts" with no source'
  ],
  queryTemplates: [
    {
      type: 'expert_views',
      templates: [
        '{topic} psychologist OR sociologist explains',
        '{topic} university study behaviour'
      ]
    },
    {
      type: 'public_voices',
      templates: [
        '{topic} real story interview {region}',
        '{topic} personal account {region}'
      ]
    },
    {
      type: 'official_data',
      templates: [
        '{topic} {region} statistics'
      ]
    },
    {
      type: 'news',
      templates: [
        '{topic} feature report {region}'
      ]
    },
    {
      type: 'books_history',
      templates: [
        '{topic} cultural history background'
      ]
    }
  ],
  factScoring: {
    credibility: 0.25,
    novelty: 0.20,
    storyValue: 0.35,
    relevance: 0.20
  },
  claimPolicy: {
    strictness: 'strict',
    namedEntityRule: true,
    resultsClaimCheck: false,
    sensitiveTopicFlag: false
  },
  budget: DEFAULT_BUDGET_BY_MODE.full_dossier,
  uiLabels: {
    title: 'Story and society research',
    startButton: 'Start research',
    showScope: true,
    canSkip: false,
    tabs: [
      { id: 'all', label: 'All facts', types: [] },
      { id: 'experts', label: 'Experts', types: ['expert_views', 'global_studies', 'study'] },
      { id: 'real_stories', label: 'Real stories', types: ['public_voices', 'public_voice'] },
      { id: 'data', label: 'Data', types: ['official_data', 'stat', 'policy'] },
      { id: 'news', label: 'News', types: ['news', 'event'] },
      { id: 'background', label: 'Background', types: ['books_history', 'book'] }
    ],
    sourceToggles: [
      { id: 'expert_views', label: 'Expert views', mapsTo: 'expert_views' },
      { id: 'official_data', label: 'Official data', mapsTo: 'official_data' },
      { id: 'news', label: 'News', mapsTo: 'news' },
      { id: 'public_voices', label: 'Real stories', mapsTo: 'public_voices' },
      { id: 'books_history', label: 'Books and history', mapsTo: 'books_history' }
    ]
  },
  writerNotes: [
    'Introduce each expert with name and credential.',
    'Say where each real story comes from.',
    'Keep stories human; do not turn people into case numbers.'
  ],
  systemPromptBlock:
    'You are the research lead for a society and storytelling documentary. Find the real people and stories first, then named experts with credentials, then data that shows how common the issue is, then cultural and historical background. Every expert needs a name and credential. Every story needs a source. Never diagnose or judge a real living person.'
};
