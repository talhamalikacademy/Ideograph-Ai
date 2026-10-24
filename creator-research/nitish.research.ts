// Style-inspired starter values. Tune after watching 3 to 5 real videos.
import { ResearchStyle, DEFAULT_BUDGET_BY_MODE } from './types';

export const NITISH_RESEARCH_STYLE: ResearchStyle = {
  creatorId: 'nitish',
  displayName: 'Nitish-style document analysis',
  source: 'starter',
  intent: 'Go deep through documents and records so the viewer can think and question for themselves.',
  audience: 'Viewers who like detailed, document-backed analysis of politics, governance, history and social issues.',
  researchMode: 'full_dossier',
  defaultScope: 'both',
  questionSet: [
    'Which documents exist on this (reports, orders, RTI replies, audit reports, committee papers, court records)?',
    'What does each document literally say, who issued it, when, and on which page?',
    'What is the timeline, in order?',
    'Who gained and who lost, according to the documents?',
    'What do historians and books say about the background?',
    'What is missing, or contradicted by another document?'
  ],
  sourcePriority: [
    {
      type: 'official_documents',
      weight: 0.40,
      examples: ['RTI replies', 'Government and audit reports', 'Commission reports', 'Parliament and court records']
    },
    {
      type: 'news',
      weight: 0.20,
      examples: ['Investigative news reports referencing official records']
    },
    {
      type: 'books_history',
      weight: 0.20,
      examples: ['Historical books, memoirs, and archival timelines']
    },
    {
      type: 'global_studies',
      weight: 0.15,
      examples: ['International reports and policy comparisons']
    },
    {
      type: 'public_voices',
      weight: 0.05,
      examples: ['Firsthand eyewitness accounts (labelled unverified)']
    }
  ],
  evidenceRules: [
    'Every claim needs a document trail: name, issuer, date, page or section.',
    'A summary of a document is not evidence; find the document or label it "secondary".',
    'An accusation against a named person or organization needs a document or at least 2 independent sources, otherwise soften the wording.',
    'Keep dates in correct order.'
  ],
  avoid: [
    'rumours and unsourced chat-app claims',
    'timelines without dates',
    '"experts say" without names'
  ],
  queryTemplates: [
    {
      type: 'official_documents',
      templates: [
        '{topic} report pdf government {year}',
        '{topic} RTI reply OR audit report OR commission report',
        '{topic} committee report parliament {region}'
      ]
    },
    {
      type: 'news',
      templates: [
        '{topic} documents reveal investigation {region}'
      ]
    },
    {
      type: 'books_history',
      templates: [
        '{topic} history book author',
        '{topic} background timeline {region}'
      ]
    },
    {
      type: 'global_studies',
      templates: [
        '{topic} international policy comparison {countries}'
      ]
    }
  ],
  factScoring: {
    credibility: 0.45,
    novelty: 0.20,
    storyValue: 0.10,
    relevance: 0.25
  },
  claimPolicy: {
    strictness: 'strict',
    namedEntityRule: true,
    resultsClaimCheck: false,
    sensitiveTopicFlag: false
  },
  budget: DEFAULT_BUDGET_BY_MODE.full_dossier,
  uiLabels: {
    title: 'Document research',
    startButton: 'Find documents',
    showScope: true,
    canSkip: false,
    tabs: [
      { id: 'all', label: 'All facts', types: [] },
      { id: 'documents', label: 'Documents', types: ['official_documents', 'official_data', 'policy', 'stat'] },
      { id: 'news', label: 'News', types: ['news', 'event'] },
      { id: 'background', label: 'Background', types: ['books_history', 'book'] },
      { id: 'comparisons', label: 'Comparisons', types: ['global_studies', 'study', 'counter'] },
      { id: 'voices', label: 'Voices', types: ['public_voices', 'public_voice'] }
    ],
    sourceToggles: [
      { id: 'official_documents', label: 'Official documents', mapsTo: 'official_documents' },
      { id: 'news', label: 'News', mapsTo: 'news' },
      { id: 'books_history', label: 'Books and history', mapsTo: 'books_history' },
      { id: 'global_studies', label: 'Global comparison', mapsTo: 'global_studies' },
      { id: 'public_voices', label: 'Public voices', mapsTo: 'public_voices' }
    ]
  },
  writerNotes: [
    'Name the document (issuer and date) when you use its facts.',
    'Mark secondary summaries as secondary.',
    'Soften wording on named accusations unless the trail is complete.'
  ],
  systemPromptBlock:
    'You are the research lead for a document-first analysis video. Find the primary documents first and record issuer, date and page for each fact. Build the timeline from documents, then add news and books for background. A summary of a document is not proof. Never state an accusation against a named person or organization unless a document or two independent sources support it.'
};
