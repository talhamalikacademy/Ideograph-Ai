export type ScriptFormatType = 'documentary' | 'explainer' | 'short';

export interface ScriptBudget {
  minutes: number;
  wpm: number;
  voiceoverWords: number;
  chaptersRange: [number, number];
  averageChapters: number;
  wordsPerChapter: number;
  claims: number;
  productionWords: number;
  liveSummaryLine: string;
}

/**
 * Pure function computing voiceover word budget, chapter count, words per chapter,
 * checkable claims (~3/min), and full production script words (~2.3x voiceover).
 */
export function computeBudget(minutes: number, wpm: number = 140): ScriptBudget {
  const safeMinutes = Math.max(0.5, Number.isFinite(minutes) ? minutes : 10);
  const safeWpm = Math.max(100, Math.min(180, Number.isFinite(wpm) ? wpm : 140));
  const voiceoverWords = Math.round(safeMinutes * safeWpm);

  let minChapters: number;
  let maxChapters: number;
  if (safeMinutes <= 2) {
    minChapters = 1;
    maxChapters = 2;
  } else if (safeMinutes <= 5) {
    minChapters = 2;
    maxChapters = 3;
  } else {
    minChapters = Math.floor(safeMinutes / 5) + 1;
    maxChapters = Math.floor(safeMinutes / 5) + 2;
  }

  const chaptersRange: [number, number] = [minChapters, maxChapters];
  const averageChapters = (minChapters + maxChapters) / 2;
  const wordsPerChapter = Math.round(voiceoverWords / Math.max(1, averageChapters));
  const claims = Math.max(3, Math.round(safeMinutes * 3));
  const productionWords = Math.round(voiceoverWords * 2.3);

  const chapterText =
    minChapters === maxChapters
      ? `${minChapters} chapter${minChapters === 1 ? '' : 's'}`
      : `${minChapters}–${maxChapters} chapters`;

  const liveSummaryLine = `${safeMinutes} min: about ${voiceoverWords.toLocaleString()} words (~${productionWords.toLocaleString()} production script words), ${chapterText}, about ${claims} claims to check`;

  return {
    minutes: safeMinutes,
    wpm: safeWpm,
    voiceoverWords,
    chaptersRange,
    averageChapters: Math.round(averageChapters),
    wordsPerChapter,
    claims,
    productionWords,
    liveSummaryLine
  };
}

export const FORMAT_DURATION_PRESETS: Record<ScriptFormatType, number[]> = {
  documentary: [10, 15, 20, 25, 30],
  explainer: [3, 5, 8, 10, 12],
  short: [1, 2]
};

export const FORMAT_DEFAULT_DEPTH: Record<ScriptFormatType, 'quick' | 'standard' | 'deep'> = {
  documentary: 'deep',
  explainer: 'standard',
  short: 'quick'
};
