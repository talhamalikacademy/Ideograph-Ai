import { FactType } from '../types';

export type { FactType };

export type ResearchScope = 'ground' | 'abroad' | 'both';
export type ResearchMode = 'full_dossier' | 'playbook' | 'concept_lab' | 'hybrid';
export type Depth = 'quick' | 'standard' | 'deep';

export interface ResearchStyle {
  creatorId: string;
  displayName: string;
  source: 'starter' | 'creator-file' | 'user';
  intent: string;
  audience: string;
  researchMode: ResearchMode;
  defaultScope: ResearchScope;
  questionSet: string[];
  sourcePriority: { type: FactType; weight: number; examples: string[] }[];
  minFactsPer5Min?: Partial<Record<FactType, number>>;
  evidenceRules: string[];
  avoid: string[];
  queryTemplates: { type: FactType; templates: string[] }[];
  factScoring: {
    credibility: number;
    novelty: number;
    storyValue: number;
    relevance: number;
  };
  claimPolicy: {
    strictness: 'light' | 'standard' | 'strict';
    namedEntityRule: boolean;
    resultsClaimCheck: boolean;
    sensitiveTopicFlag: boolean;
  };
  budget: {
    queries: Record<Depth, number>;
    estimatedMinutes: Record<Depth, [number, number]>;
  };
  uiLabels: {
    title: string;
    startButton: string;
    tabs: { id: string; label: string; types: FactType[] }[];
    sourceToggles: { id: string; label: string; mapsTo: FactType }[];
    showScope: boolean;
    canSkip: boolean;
  };
  writerNotes: string[];
  systemPromptBlock: string;
}

export const DEFAULT_BUDGET_BY_MODE: Record<
  Exclude<ResearchMode, 'hybrid'>,
  {
    queries: Record<Depth, number>;
    estimatedMinutes: Record<Depth, [number, number]>;
  }
> = {
  full_dossier: {
    queries: { quick: 10, standard: 24, deep: 40 },
    estimatedMinutes: { quick: [0.5, 1], standard: [1, 3], deep: [2, 5] }
  },
  playbook: {
    queries: { quick: 8, standard: 16, deep: 24 },
    estimatedMinutes: { quick: [0.5, 1], standard: [1, 2], deep: [1.5, 3] }
  },
  concept_lab: {
    queries: { quick: 6, standard: 10, deep: 14 },
    estimatedMinutes: { quick: [0.5, 1], standard: [0.5, 1], deep: [1, 2] }
  }
};
