// Style-inspired starter values. Tune after watching 3 to 5 real videos.
import { ResearchStyle, DEFAULT_BUDGET_BY_MODE } from './types';

export const DHRUV_RESEARCH_STYLE: ResearchStyle = {
  creatorId: 'dhruvrathee',
  displayName: 'Dhruv-style explainer',
  source: 'starter',
  intent: 'Explain a topic so the viewer understands it and trusts the facts enough to share.',
  audience: 'General viewers who want clear explanations backed by data.',
  researchMode: 'full_dossier',
  defaultScope: 'both',
  questionSet: [
    'What exactly is being claimed, and by whom?',
    'What do official numbers say, and how did they change over time?',
    'What do studies and experts outside the country say?',
    'How do 3 to 5 comparable countries or cases handle the same issue?',
    'What is the strongest argument from the other side?',
    'What do we still not know?'
  ],
  sourcePriority: [
    {
      type: 'official_data',
      weight: 0.30,
      examples: ['National statistics office', 'Ministry reports', 'Central bank', 'Parliament records']
    },
    {
      type: 'global_studies',
      weight: 0.30,
      examples: ['Peer-reviewed papers', 'World Bank', 'IMF', 'WHO', 'OECD']
    },
    {
      type: 'news',
      weight: 0.25,
      examples: ['Major newspapers', 'Wire services', 'Verified fact-check reports']
    },
    {
      type: 'books_history',
      weight: 0.10,
      examples: ['Published history and policy books', 'Archival background']
    },
    {
      type: 'public_voices',
      weight: 0.05,
      examples: ['Citizen experiences and public forum reactions (labelled unverified)']
    }
  ],
  evidenceRules: [
    'Keep fact and opinion apart and label opinions.',
    'Every key number needs source name, year and link.',
    'Key numbers need a second independent source when one exists.',
    'Prefer the original data over an article about the data.',
    'If numbers disagree, show both and say why.'
  ],
  avoid: [
    'opinions without a source',
    'single-source headline numbers',
    'data with no date',
    'social media as proof'
  ],
  queryTemplates: [
    {
      type: 'official_data',
      templates: [
        '{topic} official statistics {region} latest year',
        '{topic} government report data table {region}'
      ]
    },
    {
      type: 'global_studies',
      templates: [
        '{topic} peer reviewed study',
        '{topic} cross-country comparison {countries}'
      ]
    },
    {
      type: 'news',
      templates: [
        '{topic} investigation {year}',
        '{topic} fact check'
      ]
    },
    {
      type: 'books_history',
      templates: [
        '{topic} historical background timeline {region}'
      ]
    },
    {
      type: 'public_voices',
      templates: [
        '{topic} public reaction {region}'
      ]
    }
  ],
  factScoring: {
    credibility: 0.40,
    novelty: 0.15,
    storyValue: 0.15,
    relevance: 0.30
  },
  claimPolicy: {
    strictness: 'strict',
    namedEntityRule: true,
    resultsClaimCheck: false,
    sensitiveTopicFlag: false
  },
  budget: DEFAULT_BUDGET_BY_MODE.full_dossier,
  uiLabels: {
    title: 'Research and fact base',
    startButton: 'Start research',
    showScope: true,
    canSkip: false,
    tabs: [
      { id: 'all', label: 'Key facts', types: [] },
      { id: 'official_numbers', label: 'Official numbers', types: ['official_data', 'stat', 'policy'] },
      { id: 'studies_comparisons', label: 'Studies and comparisons', types: ['global_studies', 'study', 'counter'] },
      { id: 'news', label: 'News', types: ['news', 'event'] },
      { id: 'background_voices', label: 'Background and voices', types: ['books_history', 'public_voices', 'book', 'public_voice'] }
    ],
    sourceToggles: [
      { id: 'official_data', label: 'Official data', mapsTo: 'official_data' },
      { id: 'global_studies', label: 'Global studies', mapsTo: 'global_studies' },
      { id: 'news', label: 'News', mapsTo: 'news' },
      { id: 'books_history', label: 'Books and history', mapsTo: 'books_history' },
      { id: 'public_voices', label: 'Public voices', mapsTo: 'public_voices' }
    ]
  },
  writerNotes: [
    'Show the source name on screen with every key number.',
    'Put the other side before the conclusion.',
    'Say what is not known.'
  ],
  systemPromptBlock:
    'You are the research lead for an explainer-style video. The goal is that the viewer understands the topic and can trust every number. First find what exactly is claimed. Then collect official numbers over time, then outside studies and country comparisons, then the best argument from the other side. Keep fact and opinion apart. Never rely on one source for a key number if a second exists.'
};
