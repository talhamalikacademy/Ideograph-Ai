import { ScriptFormatType } from '../services/budget';

export const TOPIC_NICHES = [
  'Politics & governance',
  'Economy & business',
  'Society & crime',
  'History',
  'Science & health',
  'Tech & AI',
  'Education & careers',
  'Environment & resources',
  'Culture & entertainment',
  'Other'
] as const;

export type TopicNiche = (typeof TOPIC_NICHES)[number];

export interface CreatorRecipeChapterBlueprint {
  id: string;
  purpose: string;
  weight: number; // share of total script (sums to 1.0)
}

export interface CreatorRecipe {
  creatorId: string;
  creatorName: string;
  displayName?: string;
  source: 'tuned' | 'profile_derived' | 'default' | 'user_channel';
  niches: string[];
  regions: string[];
  languages: string[];
  formats: {
    id: ScriptFormatType;
    minLen: number;
    maxLen: number;
    wpm: number;
  }[];
  hook: {
    secondsMin: number;
    secondsMax: number;
    types: string[];
    rules: string[];
  };
  structure: CreatorRecipeChapterBlueprint[];
  tone?: {
    summary: string;
    signaturePhrases: string[];
  };
  signaturePhrases?: string[];
  forbiddenPhrases?: string[];
  exampleOpenings?: string[];
  sentenceLengthRange?: [number, number];
  productionNotes?: string;
}

export interface ChannelStyleProfile {
  id: string;
  name: string;
  language: string;
  toneSummary: string;
  hookRule: string;
  structureSteps: string[];
  signaturePhrases: string[];
  forbiddenPhrases: string[];
  sentenceLengthRange: [number, number];
}

export interface BlendRoleConfig {
  creatorIds: string[]; // 2 to 3 creator IDs
  hookCreatorId: string;
  structureCreatorId: string;
  toneCreatorId: string;
  chosenLanguage?: string;
}

export interface VoiceSelectionState {
  mode: 'pick' | 'blend' | 'auto';
  pickedCreatorId: string;
  blend: BlendRoleConfig;
  autoMatchedCreatorId?: string;
}

export interface CreatorMatchResult {
  creatorId: string;
  creatorName: string;
  score: number;
  reasons: string[];
  whyLine: string;
  recipe: CreatorRecipe;
}
