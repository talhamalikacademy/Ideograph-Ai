export type ResearchDepth = 'quick' | 'standard' | 'deep';

export interface ResearchTargets {
  words: number;
  factsNeeded: number;
  rawToFetch: number;
  minPerType: {
    official: number;
    news: number;
    book: number;
    quote: number;
    public_voice: number;
    counter: number;
  };
}

export function computeTargets(
  durationMin: number,
  depth: ResearchDepth = 'standard'
): ResearchTargets {
  const safeMin = Math.max(0.5, Number.isFinite(durationMin) ? durationMin : 5);
  const words = Math.round(safeMin * 140);
  const mult = depth === 'quick' ? 0.7 : depth === 'deep' ? 1.35 : 1;
  const factsNeeded = Math.max(4, Math.round(safeMin * 3 * mult));
  const rawToFetch = Math.ceil(factsNeeded * 1.6);

  return {
    words,
    factsNeeded,
    rawToFetch,
    minPerType: {
      official: Math.max(1, Math.round(factsNeeded * 0.3)),
      news: Math.max(1, Math.round(factsNeeded * 0.25)),
      book: safeMin >= 3 ? Math.max(1, Math.round(safeMin / 5)) : 0,
      quote: safeMin >= 2 ? Math.max(1, Math.round(safeMin / 4)) : 1,
      public_voice: safeMin >= 3 ? Math.max(1, Math.round(safeMin / 4)) : 0,
      counter: safeMin >= 4 ? Math.max(1, Math.round(safeMin / 5)) : 0
    }
  };
}

/**
 * Maps duration chips or legacy duration strings to minutes.
 */
export function parseDurationToMinutes(durationStr?: string, explicitMinutes?: number): number {
  if (typeof explicitMinutes === 'number' && explicitMinutes > 0) {
    return explicitMinutes;
  }
  if (!durationStr) return 5;
  const s = durationStr.toLowerCase();
  if (s.includes('30 sec')) return 1;
  if (s.includes('60 sec') || s.includes('1 min')) return 1;
  const minMatch = s.match(/(\d+(?:\.\d+)?)\s*min/i);
  if (minMatch) {
    return Math.max(1, Math.round(parseFloat(minMatch[1])));
  }
  const numMatch = s.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch) {
    return Math.max(1, Math.round(parseFloat(numMatch[1])));
  }
  return 5;
}

/**
 * Maps numeric minutes to the closest studio duration label so existing pacing logic works seamlessly.
 */
export function formatMinutesToDurationLabel(minutes: number): string {
  if (minutes <= 1) return '60 Seconds (Shorts)';
  if (minutes <= 2) return '2 Minutes (Explainer)';
  if (minutes <= 6) return '5 Minutes (Deep Dive)';
  if (minutes <= 12) return '10 Minutes (Mini-Doc)';
  return '20 Minutes (Full Documentary)';
}

export const DURATION_MINUTE_PRESETS = [1, 2, 3, 5, 8, 10, 15] as const;

export const FOCUS_REGIONS = [
  'Pakistan',
  'India',
  'Global',
  'Middle East & Gulf',
  'United States & UK',
  'South Asia',
  'Europe'
] as const;

export type CreatorResearchRegion = 'pakistan' | 'india_and_global' | 'global';

/**
 * Resolves whether research should pull Pakistani, Indian & Global, or purely Global institutions.
 * Stops Indian/Global creators (Dhruv Rathee, Nitish Rajput) from querying Pakistani institutions unless
 * the topic explicitly mentions Pakistan.
 */
export function resolveCreatorResearchRegion(
  creatorId?: string,
  topicText: string = ''
): CreatorResearchRegion {
  const text = (topicText || '').toLowerCase();
  const cId = (creatorId || '').toLowerCase().replace(/[\s_@-]+/g, '');

  // 1. If topic explicitly mentions Pakistan, route to Pakistani ground data
  const hasPakistanTopic =
    /\b(pakistan|pakistani|karachi|lahore|islamabad|rawalpindi|peshawar|quetta|faisalabad|multan|sialkot|gwadar|cpec|kwsb|wasa|wapda|nepra|pide|pbs|p@sha|hrcp|nadra|fia|indus river|indus basin|orangi|lyari|kati pahari|imran khan|nawaz sharif|shehbaz|bilawal|zardari|army chief|pak army|pti|pmln|ppp|mqm)\b/i.test(
      text
    );

  if (hasPakistanTopic) {
    return 'pakistan';
  }

  // 2. Creator identity routing when topic does NOT mention Pakistan
  if (cId.includes('dhruv') || cId.includes('nitish')) {
    return 'india_and_global';
  }

  if (cId.includes('raftar')) {
    return 'pakistan';
  }

  // 3. All other global creators default to global
  return 'global';
}

