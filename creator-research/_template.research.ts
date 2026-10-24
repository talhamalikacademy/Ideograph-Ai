// Style-inspired starter values. Tune after watching 3 to 5 real videos.
import { ResearchStyle, DEFAULT_BUDGET_BY_MODE } from './types';

export interface CustomChannelStyleInput {
  creatorId: string;
  creatorName: string;
  intent?: string;
  audience?: string;
  defaultScope?: 'ground' | 'abroad' | 'both';
}

export const EMPTY_STYLE_SLOT: ResearchStyle = {
  creatorId: 'custom_slot',
  displayName: 'My Channel Style',
  source: 'user',
  intent: 'Follow the channel voice and gather clear, link-backed research notes.',
  audience: 'Channel viewers who expect consistent evidence and clear storytelling.',
  researchMode: 'full_dossier',
  defaultScope: 'both',
  questionSet: [
    'What is the core claim or question behind this topic?',
    'What do official statistics and reports show?',
    'What are the key events or timeline turning points?',
    'What do independent studies or international comparisons show?',
    'What is the strongest argument from the other side?',
    'What practical takeaway or open question remains?'
  ],
  sourcePriority: [
    {
      type: 'official_data',
      weight: 0.25,
      examples: ['Official data tables, statistics offices, and regulator reports']
    },
    {
      type: 'news',
      weight: 0.25,
      examples: ['Investigative journalism and reputable news outlets']
    },
    {
      type: 'global_studies',
      weight: 0.20,
      examples: ['University studies and cross-country comparisons']
    },
    {
      type: 'books_history',
      weight: 0.15,
      examples: ['Published books and historical background']
    },
    {
      type: 'public_voices',
      weight: 0.15,
      examples: ['Real-world experiences and public discussion (labelled unverified)']
    }
  ],
  evidenceRules: [
    'Every key number needs source name, year and link.',
    'Keep fact and opinion apart and label opinions.',
    'Public voices are labelled "unverified" and written as "people say".'
  ],
  avoid: [
    'opinions without a source',
    'data with no date',
    'social media posts presented as verified proof'
  ],
  queryTemplates: [
    {
      type: 'official_data',
      templates: ['{topic} official statistics {region} {year}']
    },
    {
      type: 'news',
      templates: ['{topic} investigation report {region}']
    },
    {
      type: 'global_studies',
      templates: ['{topic} study comparison {countries}']
    },
    {
      type: 'books_history',
      templates: ['{topic} history book background']
    },
    {
      type: 'public_voices',
      templates: ['{topic} public discussion {region}']
    }
  ],
  factScoring: {
    credibility: 0.35,
    novelty: 0.20,
    storyValue: 0.20,
    relevance: 0.25
  },
  claimPolicy: {
    strictness: 'standard',
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
      { id: 'all', label: 'All facts', types: [] },
      { id: 'official', label: 'Official data', types: ['official_data', 'official_documents', 'stat', 'policy'] },
      { id: 'news', label: 'News', types: ['news', 'event'] },
      { id: 'studies', label: 'Studies', types: ['global_studies', 'expert_views', 'study', 'counter'] },
      { id: 'books_voices', label: 'Books and voices', types: ['books_history', 'public_voices', 'book', 'public_voice'] }
    ],
    sourceToggles: [
      { id: 'official_data', label: 'Official data', mapsTo: 'official_data' },
      { id: 'news', label: 'News', mapsTo: 'news' },
      { id: 'global_studies', label: 'Global studies', mapsTo: 'global_studies' },
      { id: 'books_history', label: 'Books and history', mapsTo: 'books_history' },
      { id: 'public_voices', label: 'Public voices', mapsTo: 'public_voices' }
    ]
  },
  writerNotes: [
    'Follow the user channel house voice.',
    'Cite every key number with its source tag.'
  ],
  systemPromptBlock:
    "You are the research lead following the user's own house voice. Collect balanced official data, news investigations, studies, historical context, and public voices (always labelled unverified). Every fact must come from retrieved text with a real URL or user upload."
};

export function createResearchStyleFromProfile(profile: CustomChannelStyleInput): ResearchStyle {
  return {
    ...EMPTY_STYLE_SLOT,
    creatorId: profile.creatorId || 'custom_channel',
    displayName: `${profile.creatorName || 'My Channel'} style`,
    source: 'user',
    intent: profile.intent || EMPTY_STYLE_SLOT.intent,
    audience: profile.audience || EMPTY_STYLE_SLOT.audience,
    defaultScope: profile.defaultScope || 'both',
    systemPromptBlock: `You are the research lead following the house voice of "${
      profile.creatorName || 'My Channel'
    }". Collect balanced official data, news investigations, studies, historical context, and public voices (labelled unverified). Use ONLY retrieved text; if you cannot find a fact, say so.`
  };
}
