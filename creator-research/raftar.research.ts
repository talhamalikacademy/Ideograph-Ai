// Style-inspired starter values. Tune after watching 3 to 5 real videos.
import { ResearchStyle, DEFAULT_BUDGET_BY_MODE } from './types';

export const RAFTAR_RESEARCH_STYLE: ResearchStyle = {
  creatorId: 'raftar',
  displayName: 'Raftar-style ground documentary',
  source: 'starter',
  intent: 'Show the ground reality of a local issue so viewers understand how the system works and where it fails.',
  audience: 'Urdu-speaking viewers in Pakistan.',
  researchMode: 'full_dossier',
  defaultScope: 'ground',
  questionSet: [
    'What happened, where and when (a specific incident, city or neighbourhood)?',
    'What do official local numbers say, in rupees, with the year?',
    'Who gains and who loses?',
    'What do people on the ground say (labelled unverified)?',
    'What is the history behind it?',
    'Where did the system fail, and what would a fix look like (with examples from elsewhere)?'
  ],
  sourcePriority: [
    {
      type: 'official_data',
      weight: 0.25,
      examples: ['Statistics bureau', 'Central bank', 'Provincial departments', 'Regulators', 'Utilities']
    },
    {
      type: 'news',
      weight: 0.25,
      examples: ['Investigative newspaper reports', 'Ground reporting from cities and neighbourhoods']
    },
    {
      type: 'public_voices',
      weight: 0.20,
      examples: ['Resident complaints and local forums (always labelled unverified)']
    },
    {
      type: 'books_history',
      weight: 0.20,
      examples: ['Historical books, commission archives, and past policy records']
    },
    {
      type: 'global_studies',
      weight: 0.10,
      examples: ['International municipal or country solutions that fixed the same problem']
    }
  ],
  evidenceRules: [
    'Money in PKR with the year.',
    'Name the city and neighbourhood.',
    'Public voices are labelled "unverified" and written as "people say".',
    'An accusation needs a document or 2 sources.',
    'Mark security, political and court topics for editor review.'
  ],
  avoid: [
    'global theory with no local link',
    '"sources say" with no name',
    'copying a social post as proof'
  ],
  queryTemplates: [
    {
      type: 'official_data',
      templates: [
        '{topic} {region} official figures PKR {year}',
        '{topic} {region} report data'
      ]
    },
    {
      type: 'news',
      templates: [
        '{topic} {region} investigation',
        '{topic} {region} ground report'
      ]
    },
    {
      type: 'public_voices',
      templates: [
        '{topic} {region} residents complain',
        '{topic} {region} forum discussion'
      ]
    },
    {
      type: 'books_history',
      templates: [
        '{topic} {region} history'
      ]
    },
    {
      type: 'global_studies',
      templates: [
        '{topic} city reform case study comparison {countries}'
      ]
    }
  ],
  factScoring: {
    credibility: 0.30,
    novelty: 0.20,
    storyValue: 0.25,
    relevance: 0.25
  },
  claimPolicy: {
    strictness: 'strict',
    namedEntityRule: true,
    resultsClaimCheck: false,
    sensitiveTopicFlag: true
  },
  budget: DEFAULT_BUDGET_BY_MODE.full_dossier,
  uiLabels: {
    title: 'Ground research',
    startButton: 'Start ground research',
    showScope: true,
    canSkip: false,
    tabs: [
      { id: 'all', label: 'All facts', types: [] },
      { id: 'local_data', label: 'Local data', types: ['official_data', 'official_documents', 'stat', 'policy'] },
      { id: 'news', label: 'News', types: ['news', 'event'] },
      { id: 'voices', label: 'Voices', types: ['public_voices', 'public_voice'] },
      { id: 'history', label: 'History', types: ['books_history', 'book'] },
      { id: 'abroad', label: 'Abroad', types: ['global_studies', 'study', 'counter'] }
    ],
    sourceToggles: [
      { id: 'official_data', label: 'Local official data', mapsTo: 'official_data' },
      { id: 'news', label: 'News reports', mapsTo: 'news' },
      { id: 'public_voices', label: 'Public voices', mapsTo: 'public_voices' },
      { id: 'books_history', label: 'History', mapsTo: 'books_history' },
      { id: 'global_studies', label: 'Global comparison', mapsTo: 'global_studies' }
    ]
  },
  writerNotes: [
    'Use PKR and local place names.',
    'Write public voices as "people say".',
    'Flag sensitive paragraphs for editor review.'
  ],
  systemPromptBlock:
    'You are the research lead for a ground-reality documentary about a local issue. Start from a specific place or incident. Collect official local numbers in rupees with the year, then news investigations, then what residents say (always labelled unverified), then the history. Show who gains and who loses. Never present a social media post as proof. Mark security and political topics for editor review. When narration language is Urdu or Roman Urdu and scope includes ground, write about 30% of queries in Urdu script and the rest in English.'
};
