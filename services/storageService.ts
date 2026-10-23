import { SavedScript, ScriptData, AnalysisData, CreatorProfile, UsageStats, ScriptSegment } from "../types";
import { CREATORS } from "../constants";

const STORAGE_KEY = 'ideograph_history_v1';
const LEGACY_STORAGE_KEY = 'viralscript_history_v1';
const USAGE_KEY = 'ideograph_daily_usage';
const LEGACY_USAGE_KEY = 'viralscript_daily_usage';
const MIGRATION_KEY = 'ideograph_migrated_v1';

// Session-only memory store for base64 generated images (until Phase 12 IndexedDB)
const sessionImageStore = new Map<string, string>();

const getImageCacheKey = (scriptId: string, segmentIndex: number): string =>
  `${scriptId}::seg_${segmentIndex}`;

const isQuotaExceededError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; code?: number; message?: string };
  return (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    e.code === 22 ||
    e.code === 1014 ||
    Boolean(e.message && e.message.toLowerCase().includes('quota'))
  );
};

const emitStorageWarning = (message: string) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ideograph:storage-warning', { detail: { message } }));
  }
};

const runOneTimeMigration = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    if (localStorage.getItem(MIGRATION_KEY) === 'true') return;

    const currentHistory = localStorage.getItem(STORAGE_KEY);
    const legacyHistory = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!currentHistory && legacyHistory) {
      // Strip any legacy base64 images during migration so quota is respected
      try {
        const parsed = JSON.parse(legacyHistory) as SavedScript[];
        const cleaned = parsed.map(item => stripImagesForStorage(item));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
      } catch {
        localStorage.setItem(STORAGE_KEY, legacyHistory);
      }
    }

    const currentUsage = localStorage.getItem(USAGE_KEY);
    const legacyUsage = localStorage.getItem(LEGACY_USAGE_KEY);
    if (!currentUsage && legacyUsage) {
      localStorage.setItem(USAGE_KEY, legacyUsage);
    }

    localStorage.setItem(MIGRATION_KEY, 'true');
  } catch (err) {
    console.warn('Storage migration skipped:', err);
  }
};

const stripImagesForStorage = (entry: SavedScript): SavedScript => {
  const segments: ScriptSegment[] = (entry.segments || []).map((seg, idx) => {
    if (seg.generatedImageUrl) {
      sessionImageStore.set(getImageCacheKey(entry.id, idx), seg.generatedImageUrl);
    }
    const hasImg = Boolean(
      seg.generatedImageUrl ||
        seg.hasImage ||
        sessionImageStore.has(getImageCacheKey(entry.id, idx))
    );
    const { generatedImageUrl: _omitted, ...rest } = seg;
    return {
      ...rest,
      hasImage: hasImg
    };
  });

  return {
    ...entry,
    segments
  };
};

const fixUrduNamaskarTypo = (text?: string): string => {
  if (!text) return text || '';
  return text
    .replace(/نمکار\s+دوستو/g, 'نمسکار دوستو')
    .replace(/نمکار/g, 'نمسکار')
    .replace(/نامسکار/g, 'نمسکار')
    .replace(/نمس\s+کار/g, 'نمسکار');
};

const rehydrateSessionImages = (entry: SavedScript): SavedScript => {
  const segments: ScriptSegment[] = (entry.segments || []).map((seg, idx) => {
    const cachedUrl = sessionImageStore.get(getImageCacheKey(entry.id, idx));
    const fixedSeg: ScriptSegment = {
      ...seg,
      audio: fixUrduNamaskarTypo(seg.audio),
      visual: fixUrduNamaskarTypo(seg.visual)
    };
    if (cachedUrl) {
      return {
        ...fixedSeg,
        hasImage: true,
        generatedImageUrl: cachedUrl
      };
    }
    return fixedSeg;
  });
  return {
    ...entry,
    title: fixUrduNamaskarTypo(entry.title),
    segments,
    ctas: Array.isArray(entry.ctas) ? entry.ctas.map(fixUrduNamaskarTypo) : entry.ctas
  };
};

const safeWriteHistory = (history: SavedScript[]): boolean => {
  const stripped = history.map(stripImagesForStorage);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
    return true;
  } catch (err) {
    if (isQuotaExceededError(err)) {
      // Try progressively trimming oldest scripts
      const copy = [...stripped];
      while (copy.length > 1) {
        copy.pop();
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
          emitStorageWarning(
            'Storage was near capacity; oldest history items were trimmed. Export your history to keep backups.'
          );
          return true;
        } catch (retryErr) {
          if (!isQuotaExceededError(retryErr)) break;
        }
      }
      emitStorageWarning('Storage is full. Export your history or delete old scripts.');
      return false;
    }
    console.error('Failed to write history to localStorage:', err);
    return false;
  }
};

export const saveScriptToHistory = (
  script: ScriptData,
  creator: CreatorProfile,
  analysis?: AnalysisData
): SavedScript => {
  runOneTimeMigration();
  const history = getHistory();

  // Preserve auto-matched or script-resolved creator metadata instead of overwriting with default selectedCreator
  const resolvedCreator =
    (script.creatorId && CREATORS.find(c => c.id === script.creatorId || c.bio.id === script.creatorId)) ||
    creator;

  const effectiveCreatorId = script.creatorId || resolvedCreator.id;
  const effectiveCreatorName = script.creatorName || resolvedCreator.name;
  const effectiveCreatorStyle = script.creatorStyle || resolvedCreator.style;

  let newEntry: SavedScript;
  const existingIndex = script.id ? history.findIndex(h => h.id === script.id) : -1;

  if (existingIndex >= 0) {
    newEntry = {
      ...history[existingIndex],
      ...script,
      creatorId: effectiveCreatorId,
      creatorName: effectiveCreatorName,
      creatorStyle: effectiveCreatorStyle,
      analysis: analysis || history[existingIndex].analysis
    };
    history[existingIndex] = newEntry;
  } else {
    newEntry = {
      ...script,
      id: script.id || crypto.randomUUID(),
      createdAt: script.createdAt || new Date().toISOString(),
      creatorId: effectiveCreatorId,
      creatorName: effectiveCreatorName,
      creatorStyle: effectiveCreatorStyle,
      analysis: analysis
    };
    history.unshift(newEntry);
  }

  safeWriteHistory(history);
  return rehydrateSessionImages(newEntry);
};

export const getHistory = (): SavedScript[] => {
  runOneTimeMigration();
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedScript[];
    return Array.isArray(parsed) ? parsed.map(rehydrateSessionImages) : [];
  } catch (e) {
    console.error('Failed to parse history', e);
    return [];
  }
};

export const deleteScriptFromHistory = (id: string) => {
  runOneTimeMigration();
  const history = getHistory();
  const filtered = history.filter(s => s.id !== id);
  safeWriteHistory(filtered);
};

export const incrementDailyUsage = () => {
  runOneTimeMigration();
  const today = new Date().toISOString().split('T')[0];
  let stats: UsageStats = { date: today, count: 0 };

  try {
    const raw = localStorage.getItem(USAGE_KEY) || localStorage.getItem(LEGACY_USAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        stats = parsed;
      }
    }
  } catch {
    // ignore
  }

  stats.count += 1;
  try {
    localStorage.setItem(USAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore quota error on usage counter
  }
  return stats.count;
};

export const getDailyUsage = (): number => {
  runOneTimeMigration();
  const today = new Date().toISOString().split('T')[0];
  try {
    const raw = localStorage.getItem(USAGE_KEY) || localStorage.getItem(LEGACY_USAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.date === today) {
        return parsed.count;
      }
    }
  } catch {
    // ignore
  }
  return 0;
};

export const checkLimit = (_plan?: 'free' | 'pro'): boolean => {
  // All features and scripts are unlocked with no 3-script daily cap
  return true;
};