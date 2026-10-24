import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ScriptData,
  CreatorProfile,
  TypographyConfig,
  SimulationResult,
  Citation,
  DirectorPlan,
  ExperimentVariant,
  VerifiedClaimOrPaperItem,
  InfographicBlueprintItem,
  ScriptClaimItem,
  EvidenceInsertionSuggestion,
  WrittenChapterResult,
  HookLabVariant
} from '../types';
import {
  Video, Mic, Zap, Loader2, PlusCircle, Clock, Type, Sparkles, Wand2, Download, Undo2,
  Users, BookOpen, Film, FlaskConical, Copy, FileText, Image as ImageIcon, X, Send, Edit2,
  Printer, Check, ChevronDown, FileCode, Languages, Columns, Eye, EyeOff, Volume2, Music,
  RotateCw, AlertTriangle, ShieldCheck, ExternalLink, Search, BarChart3, FileCheck2
} from 'lucide-react';
import clsx from 'clsx';
import { getLanguageClass, DEFAULT_TYPOGRAPHY, LANGUAGES } from '../constants';
import TypographyPanel from './TypographyPanel';
import SourcePanel from './SourcePanel';
import SimulationPanel from './SimulationPanel';
import DirectorPanel from './DirectorPanel';
import ExperimentPanel from './ExperimentPanel';
import EvidencePanel from './EvidencePanel';
import CanvasModal from './CanvasModal';
import ScratchVoiceoverBar from './ScratchVoiceoverBar';
import {
  enhanceScriptWithGemini,
  translateScriptWithGemini,
  simulateAudienceResponse,
  generateDirectorPlan,
  generateExperimentVariants,
  generateEvidenceMap,
  generateVisualPreview,
  editGeneratedImage,
  extendVisualSequence,
  findLeakedPlaceholders,
  autoMapSfxAndBgmCues,
  parseAudioTextIntoTokens,
  calculateExactSpokenRuntime,
  stripAudioCuesAndBrackets
} from '../services/geminiService';
import {
  formatScriptAsText,
  formatScriptAsMarkdown,
  formatNarrationOnly,
  downloadTextFile,
  exportScriptAsPdf,
  exportScriptAsDocx,
  exportScriptAsJson
} from '../services/exportService';
import { auditScriptStyleFidelity } from '../creator-intelligence/CreatorStyleLint';
import { parseCanvasTextToSegments } from '../services/canvasService';
import {
  ChapterNavigator,
  ProductionScriptTableView,
  WorkspaceRightRail,
  WorkspaceRightTab
} from './workspace/WorkspacePanels';
import { expandOrTrimChapter, buildProductionScript } from '../services/longFormService';
import { getCreatorRecipeById } from '../creator-recipes';
import { parseDurationToMinutes } from '../services/researchTargets';

/* ──────────────────────────────────────────────────────────────
   Props
   ────────────────────────────────────────────────────────────── */
interface ScriptEditorProps {
  script: ScriptData;
  creator: CreatorProfile;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  hasAnalysis: boolean;
  onRetry: () => void;
  onExtend: () => void;
  isExtending: boolean;
  isDarkMode: boolean;
  apiKey?: string;
  onUpdateScript: (updatedScript: ScriptData) => void;
}

/* ──────────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────────── */
const calculateHeuristics = (script: ScriptData) => {
  if (!script || !script.segments?.length) {
    return { wordCount: 0, estSeconds: 0, hookWords: 0, hasHookQuestionOrNumber: false };
  }
  const runtime = calculateExactSpokenRuntime(script.segments, 1.0, 145);
  const firstAudio = stripAudioCuesAndBrackets(script.segments[0]?.audio || '');
  const hookWords = firstAudio.trim() ? firstAudio.trim().split(/\s+/).length : 0;
  const hasHookQuestionOrNumber = /[?؟]|\d/.test(firstAudio);
  return {
    wordCount: runtime.spokenWords,
    estSeconds: runtime.totalEstimatedSeconds,
    hookWords,
    hasHookQuestionOrNumber
  };
};

const formatDuration = (seconds: number) => {
  const t = Math.max(0, Math.round(seconds || 0));
  return t >= 60 ? `${Math.floor(t / 60)}m ${t % 60}s` : `${t}s`;
};

const countWords = (text: string) => {
  const clean = stripAudioCuesAndBrackets(text || '').trim();
  return clean ? clean.split(/\s+/).length : 0;
};

/** Converts a typography font-size (number | "18px" | "1.125rem") to px. */
const toPx = (value: unknown, fallback = 18) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value ?? '').trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  return /r?em$/.test(raw) ? n * 16 : n;
};

/* ──────────────────────────────────────────────────────────────
   Small reusable UI pieces
   ────────────────────────────────────────────────────────────── */
type Tone = 'neutral' | 'indigo' | 'purple' | 'amber';

const TONE_STYLES: Record<Tone, { idle: string; active: string }> = {
  neutral: {
    idle:
      'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-200 dark:border-white/10 dark:hover:bg-white/10',
    active:
      'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
  },
  indigo: {
    idle:
      'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/20 dark:text-indigo-300',
    active: 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-500'
  },
  purple: {
    idle:
      'bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20 dark:text-purple-300',
    active: 'bg-purple-600 text-white border-purple-600 hover:bg-purple-500'
  },
  amber: {
    idle:
      'bg-amber-500/10 text-amber-700 border-amber-500/25 hover:bg-amber-500/20 dark:text-amber-300',
    active:
      'bg-amber-500/25 text-amber-800 border-amber-500/40 hover:bg-amber-500/30 dark:text-amber-200'
  }
};

interface ToolButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  tone?: Tone;
  active?: boolean;
  /** Shows only the icon below the `sm` breakpoint (label stays for screen readers). */
  iconOnlyOnMobile?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  label,
  tone = 'neutral',
  active = false,
  iconOnlyOnMobile = false,
  className,
  ...rest
}) => (
  <button
    type="button"
    {...rest}
    className={clsx(
      'inline-flex shrink-0 touch-manipulation select-none items-center justify-center gap-1.5 whitespace-nowrap',
      'h-10 rounded-xl border px-3.5 text-[13px] font-semibold transition-colors sm:h-9 sm:px-3',
      'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60',
      active ? TONE_STYLES[tone].active : TONE_STYLES[tone].idle,
      iconOnlyOnMobile && 'w-10 px-0 sm:w-auto sm:px-3',
      className
    )}
  >
    {icon}
    <span className={clsx(iconOnlyOnMobile && 'sr-only sm:not-sr-only')}>{label}</span>
  </button>
);

const Chip: React.FC<{ className?: string; title?: string; children: React.ReactNode }> = ({
  className,
  title,
  children
}) => (
  <span
    title={title}
    className={clsx(
      'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
      className
    )}
  >
    {children}
  </span>
);

const InlineAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  done?: boolean;
}> = ({ icon, label, onClick, done }) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      'inline-flex h-9 touch-manipulation items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors sm:h-8',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60',
      done
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300'
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const MenuItem: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc?: string;
  ext?: string;
  onClick: () => void;
}> = ({ icon, title, desc, ext, onClick }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className="group flex w-full touch-manipulation items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none dark:hover:bg-white/10 dark:focus-visible:bg-white/10 sm:py-2"
  >
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 dark:bg-white/5">
      {icon}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
      {desc && (
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{desc}</span>
      )}
    </span>
    {ext && (
      <span className="shrink-0 font-mono text-[10px] font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200">
        {ext}
      </span>
    )}
  </button>
);

const PANEL_META = {
  simulate: { title: 'Audience simulation', icon: Users },
  evidence: { title: 'Evidence & fact map', icon: BookOpen },
  director: { title: 'AI director plan', icon: Film },
  experiment: { title: 'Hook A/B experiments', icon: FlaskConical }
} as const;

type PanelKey = keyof typeof PANEL_META;

/* ──────────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────────── */
const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script,
  creator,
  onAnalyze,
  isAnalyzing,
  hasAnalysis,
  onExtend,
  isExtending,
  isDarkMode,
  apiKey,
  onUpdateScript
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [originalVersion, setOriginalVersion] = useState<ScriptData | null>(null);

  // Typography
  const [typography, setTypography] = useState<TypographyConfig>(DEFAULT_TYPOGRAPHY);
  const [showTypography, setShowTypography] = useState(false);

  // Export / clipboard
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Multi-language & dual view
  const primaryLang = script.language || 'English';
  const translations = script.translations || {};
  const translatedLangList = Object.keys(translations);

  const [showLanguageStudio, setShowLanguageStudio] = useState<boolean>(() =>
    Boolean(script.secondaryLanguage || Object.keys(script.translations || {}).length > 0)
  );
  const [selectedTargetLang, setSelectedTargetLang] = useState<string>(() => {
    if (script.secondaryLanguage && script.secondaryLanguage !== primaryLang) {
      return script.secondaryLanguage;
    }
    const existing = Object.keys(script.translations || {})[0];
    if (existing) return existing;
    return primaryLang === 'English' ? 'Urdu (Proper)' : 'English';
  });
  const [languageViewMode, setLanguageViewMode] = useState<'original' | 'translated' | 'dual'>(() =>
    script.secondaryLanguage && script.translations?.[script.secondaryLanguage] ? 'dual' : 'original'
  );
  const [isTranslatingScript, setIsTranslatingScript] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Karaoke highlighting & auto-scroll
  const [activeKaraokeScene, setActiveKaraokeScene] = useState<number | null>(null);
  const [activeKaraokeWordIdx, setActiveKaraokeWordIdx] = useState<number | null>(null);
  const sceneRowRefs = useRef<{ [key: number]: HTMLElement | null }>({});

  // SFX & BGM cues
  const [isMappingCues, setIsMappingCues] = useState<boolean>(false);
  const [showAudioCues, setShowAudioCues] = useState<boolean>(true);
  const [hasAudioCuesInScript, setHasAudioCuesInScript] = useState<boolean>(() =>
    Boolean(script.segments?.some(s => /\[\s*(?:SFX|BGM)\s*:/i.test(s.audio || '')))
  );

  // Panels, sources, canvas, images
  const [showSources, setShowSources] = useState(false);
  const [isExtendingVisuals, setIsExtendingVisuals] = useState(false);
  const [activePanel, setActivePanel] = useState<'none' | PanelKey>('none');
  const [isProcessingPanel, setIsProcessingPanel] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [editPrompts, setEditPrompts] = useState<{ [key: number]: string }>({});
  const [isEditingMap, setIsEditingMap] = useState<{ [key: number]: boolean }>({});

  const [simulationData, setSimulationData] = useState<SimulationResult | null>(null);
  const [evidenceData, setEvidenceData] = useState<Citation[]>([]);
  const [directorData, setDirectorData] = useState<DirectorPlan | null>(null);
  const [experimentData, setExperimentData] = useState<ExperimentVariant[]>([]);
  const [focusedMarkerId, setFocusedMarkerId] = useState<string | null>(null);
  const [inspectedMarkerId, setInspectedMarkerId] = useState<string | null>(null);

  const claimsRegistry = useMemo<VerifiedClaimOrPaperItem[]>(
    () =>
      script.claimsAndPapersRegistry ||
      script.researchPayload?.claimsAndPapersRegistry ||
      [],
    [script.claimsAndPapersRegistry, script.researchPayload]
  );

  const infographicsRegistry = useMemo<InfographicBlueprintItem[]>(
    () =>
      script.infographicsBlueprint ||
      script.researchPayload?.infographicsBlueprint ||
      [],
    [script.infographicsBlueprint, script.researchPayload]
  );

  const glossaryRegistry = useMemo(
    () =>
      script.scientificGlossary ||
      script.researchPayload?.scientificGlossary ||
      [],
    [script.scientificGlossary, script.researchPayload]
  );

  const heuristics = useMemo(() => calculateHeuristics(script), [script]);
  const styleReport = useMemo(() => auditScriptStyleFidelity(script, creator), [script, creator]);
  const langClass = useMemo(() => getLanguageClass(script.language), [script.language]);

  // Workspace state for Long-Form Chapters, Claims, Post-Script Evidence, Hook Lab & Versions
  const [showWorkspaceSuite, setShowWorkspaceSuite] = useState<boolean>(() =>
    Boolean(script.writtenChapters?.length || script.dossier)
  );
  const [workspaceCenterView, setWorkspaceCenterView] = useState<'scenes' | 'production_table'>('scenes');
  const [workspaceRightTab, setWorkspaceRightTab] = useState<WorkspaceRightTab>('claims');
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    script.writtenChapters?.[0]?.chapterId || null
  );
  const [expandingChapterId, setExpandingChapterId] = useState<string | null>(null);
  const [isBuildingProdTable, setIsBuildingProdTable] = useState(false);
  const [claimsList, setClaimsList] = useState<ScriptClaimItem[]>(script.claimsList || []);
  const [evidenceSuggestions, setEvidenceSuggestions] = useState<EvidenceInsertionSuggestion[]>(
    script.evidenceSuggestions || []
  );
  const [showVersionsMenu, setShowVersionsMenu] = useState(false);

  const segments = useMemo(() => {
    if (script.segments && script.segments.length > 0) return script.segments;
    if (script.writtenChapters && script.writtenChapters.length > 0) {
      const derived = [];
      if (script.Hook) {
        derived.push({
          visual: 'Cold Open — Cinematic documentary hook & archival title card',
          audio: script.Hook
        });
      }
      script.writtenChapters.forEach(ch => {
        derived.push({
          visual: `Chapter ${ch.chapterNumber}: ${ch.title} — Documentary evidence & B-roll sequence`,
          audio: ch.text
        });
      });
      return derived;
    }
    if (script.script) {
      return parseCanvasTextToSegments(script.script, []);
    }
    return [];
  }, [script.segments, script.writtenChapters, script.Hook, script.script]);

  const activeTranslation = translations[selectedTargetLang];
  const isDualView = languageViewMode === 'dual' && Boolean(activeTranslation);
  const isTranslatedView = languageViewMode === 'translated' && Boolean(activeTranslation);

  /** Fluid narration type: never below ~16px on phones, never above the user's chosen size. */
  const narrationStyle = useMemo<React.CSSProperties>(() => {
    const max = Math.max(toPx(typography.fontSize), 14);
    const min = Math.min(max, 16);
    return {
      fontFamily: typography.fontFamily,
      fontSize: `clamp(${min}px, 1.1vw + 11px, ${max}px)`,
      lineHeight: typography.lineHeight,
      letterSpacing: typography.letterSpacing
    };
  }, [typography]);

  /* ───────── Effects ───────── */
  useEffect(() => {
    setHasAudioCuesInScript(
      Boolean(script.segments?.some(s => /\[\s*(?:SFX|BGM)\s*:/i.test(s.audio || '')))
    );
  }, [script.segments]);

  useEffect(() => {
    const hasPreloadedDual = Boolean(
      script.secondaryLanguage && script.translations?.[script.secondaryLanguage]
    );
    const existingKeys = Object.keys(script.translations || {});
    if (hasPreloadedDual && script.secondaryLanguage) {
      setShowLanguageStudio(true);
      setSelectedTargetLang(script.secondaryLanguage);
      setLanguageViewMode('dual');
    } else if (existingKeys.length > 0) {
      setShowLanguageStudio(true);
      setSelectedTargetLang(existingKeys[0]);
    } else {
      setLanguageViewMode('original');
      setSelectedTargetLang((script.language || 'English') === 'English' ? 'Urdu (Proper)' : 'English');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script.id]);

  // Close export menu on outside click / Escape
  useEffect(() => {
    if (!showExportMenu) return;
    const onDown = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExportMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowExportMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [showExportMenu]);

  // Close side panel / sheet on Escape
  useEffect(() => {
    if (activePanel === 'none') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePanel('none');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [activePanel]);

  /* ───────── Karaoke / cues ───────── */
  const handleActiveKaraokeChange = (sceneIdx: number | null, wordIdx: number | null = null) => {
    setActiveKaraokeScene(prev => {
      if (sceneIdx !== null && sceneIdx !== prev && sceneRowRefs.current[sceneIdx]) {
        sceneRowRefs.current[sceneIdx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return sceneIdx;
    });
    setActiveKaraokeWordIdx(wordIdx);
  };

  const handleAutoMapAudioCues = async () => {
    if (isMappingCues) return;
    setIsMappingCues(true);
    try {
      setOriginalVersion(script);
      const mappedScript = await autoMapSfxAndBgmCues(script, creator, apiKey);
      onUpdateScript(mappedScript);
      setShowAudioCues(true);
    } catch (err) {
      console.error('Failed to auto-map SFX & BGM cues:', err);
    } finally {
      setIsMappingCues(false);
    }
  };

  /* ───────── Translation ───────── */
  const handleGenerateLanguagePreview = async (targetLangOverride?: string, forceRegenerate = false) => {
    const langToGenerate = targetLangOverride || selectedTargetLang;
    if (!langToGenerate || langToGenerate === primaryLang || isTranslatingScript) return;

    if (translations[langToGenerate] && !forceRegenerate) {
      setSelectedTargetLang(langToGenerate);
      setLanguageViewMode('translated');
      return;
    }

    setIsTranslatingScript(true);
    setTranslationError(null);
    try {
      const translatedVariant = await translateScriptWithGemini(script, langToGenerate, creator, apiKey);
      onUpdateScript({
        ...script,
        secondaryLanguage: langToGenerate,
        translations: { ...(script.translations || {}), [langToGenerate]: translatedVariant }
      });
      setSelectedTargetLang(langToGenerate);
      setLanguageViewMode('translated');
      setShowLanguageStudio(true);
    } catch (err: any) {
      console.error('Failed to generate script in target language:', err);
      setTranslationError(err?.message || `Failed to generate script in ${langToGenerate}.`);
    } finally {
      setIsTranslatingScript(false);
    }
  };

  const effectiveScriptForExport = useMemo<ScriptData>(() => {
    if (!activeTranslation || languageViewMode === 'original') return script;
    if (languageViewMode === 'translated') {
      return {
        ...script,
        title: activeTranslation.title || script.title,
        language: activeTranslation.language,
        ctas: activeTranslation.ctas || script.ctas,
        segments: (script.segments || []).map((seg, i) => ({
          ...seg,
          visual: activeTranslation.segments[i]?.visual || seg.visual,
          audio: activeTranslation.segments[i]?.audio || seg.audio
        }))
      };
    }
    return {
      ...script,
      title: `${script.title} (${primaryLang} + ${activeTranslation.language})`,
      language: `${primaryLang} + ${activeTranslation.language}`,
      segments: (script.segments || []).map((seg, i) => ({
        ...seg,
        audio: `[${primaryLang}]\n${seg.audio}\n\n[${activeTranslation.language}]\n${activeTranslation.segments[i]?.audio || ''}`
      }))
    };
  }, [script, activeTranslation, languageViewMode, primaryLang]);

  const activeVoiceoverSegments = useMemo(() => {
    if (languageViewMode === 'translated' && activeTranslation) {
      return (script.segments || []).map((seg, i) => ({
        visual: activeTranslation.segments[i]?.visual || seg.visual,
        audio: activeTranslation.segments[i]?.audio || seg.audio
      }));
    }
    return script.segments || [];
  }, [script.segments, languageViewMode, activeTranslation]);

  const activeVoiceoverLanguage =
    languageViewMode === 'translated' && activeTranslation ? activeTranslation.language : primaryLang;

  /* ───────── Copy & export ───────── */
  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const exportBaseName = () =>
    (effectiveScriptForExport.title || script.topic || 'script')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();

  const handleExportText = () => {
    downloadTextFile(
      formatScriptAsText(effectiveScriptForExport, creator),
      `${exportBaseName()}.txt`,
      'text/plain;charset=utf-8'
    );
    setShowExportMenu(false);
  };
  const handleExportMarkdown = () => {
    downloadTextFile(
      formatScriptAsMarkdown(effectiveScriptForExport, creator),
      `${exportBaseName()}.md`,
      'text/markdown;charset=utf-8'
    );
    setShowExportMenu(false);
  };
  const handleExportPdf = () => {
    exportScriptAsPdf(effectiveScriptForExport, creator, typography);
    setShowExportMenu(false);
  };
  const handleExportDocx = () => {
    exportScriptAsDocx(effectiveScriptForExport, creator);
    setShowExportMenu(false);
  };
  const handleExportJson = () => {
    exportScriptAsJson(effectiveScriptForExport);
    setShowExportMenu(false);
  };

  const handleExportFactCheckLog = () => {
    const lines = [
      `# Fact-Check & Claim Audit Log: ${script.title || script.topic || 'Script'}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Total Claims Audited: ${claimsList.length}`,
      ''
    ];
    claimsList.forEach(c => {
      lines.push(
        `### [${c.id}] Chapter ${c.chapterNumber} — Status: ${c.status.toUpperCase()}${
          c.editorReviewRequired ? ' (EDITOR REVIEW REQUIRED)' : ''
        }`
      );
      lines.push(`- **Sentence:** "${c.sentenceText}"`);
      if (c.matchedDossierFactId) lines.push(`- **Dossier Match:** [${c.matchedDossierFactId}]`);
      if (c.sourceTitle) lines.push(`- **Source:** ${c.sourceTitle}${c.sourceUrl ? ` (${c.sourceUrl})` : ''}`);
      lines.push('');
    });
    downloadTextFile(lines.join('\n'), `${exportBaseName()}_fact_check_log.md`, 'text/markdown;charset=utf-8');
    setShowExportMenu(false);
  };

  const handleExportSourcesAppendix = () => {
    const d = script.dossier;
    const lines = [
      `# Research Dossier & Sources Appendix: ${script.title || script.topic || 'Script'}`,
      ''
    ];
    if (d) {
      lines.push(`## Verified Facts (${d.facts.length})`);
      d.facts.forEach(f => {
        lines.push(`- **[${f.id}] (${f.type})** ${f.claim}${f.value ? ` — *${f.value}*` : ''} | Source: ${f.source.title}${f.source.url ? ` (${f.source.url})` : ''}`);
      });
      lines.push('', `## Books (${d.books.length})`);
      d.books.forEach(b => {
        lines.push(`- **[${b.id}]** *${b.title}* by ${b.author} (${b.sourceLevel}) — ${b.relevance}`);
      });
      lines.push('', `## Quotes (${d.quotes.length})`);
      d.quotes.forEach(q => {
        lines.push(`- **[${q.id}]** "${q.quote}" — ${q.speaker} (${q.source.title})`);
      });
    }
    downloadTextFile(lines.join('\n'), `${exportBaseName()}_sources_appendix.md`, 'text/markdown;charset=utf-8');
    setShowExportMenu(false);
  };

  const handleExportProductionTable = () => {
    const rows = script.productionScriptRows || [];
    const lines = [
      `# Production Script (~2.3x): ${script.title || script.topic || 'Script'}`,
      '',
      '| Timestamp | Chapter | Spoken Voiceover | Visual & B-Roll Direction | On-Screen Text | Source Tag | Audio Mood |',
      '|---|---|---|---|---|---|---|'
    ];
    rows.forEach(r => {
      lines.push(
        `| ${r.timestamp} | ${r.chapterTitle} | ${r.voiceover.replace(/\n/g, ' ')} | ${r.visualDirection} | ${r.onScreenText} | ${r.sourceTag} | ${r.audioMood} |`
      );
    });
    downloadTextFile(lines.join('\n'), `${exportBaseName()}_production_script.md`, 'text/markdown;charset=utf-8');
    setShowExportMenu(false);
  };

  const downloadItems = [
    { key: 'txt', icon: <FileText size={16} className="text-blue-500" />, title: 'Voiceover / Clean text', desc: 'Plain text with scene cues', ext: '.TXT', onClick: handleExportText },
    { key: 'prod', icon: <Film size={16} className="text-purple-500" />, title: 'Production script (~2.3x)', desc: 'Visuals, B-roll, on-screen text & audio', ext: '.MD', onClick: handleExportProductionTable },
    { key: 'claims', icon: <ShieldCheck size={16} className="text-emerald-500" />, title: 'Fact-check log', desc: 'Claim audit statuses & sources', ext: '.MD', onClick: handleExportFactCheckLog },
    { key: 'appendix', icon: <BookOpen size={16} className="text-amber-500" />, title: 'Sources appendix', desc: 'All dossier facts, books & quotes', ext: '.MD', onClick: handleExportSourcesAppendix },
    { key: 'pdf', icon: <Printer size={16} className="text-rose-500" />, title: 'PDF document', desc: 'Print or save styled script', ext: '.PDF', onClick: handleExportPdf },
    { key: 'doc', icon: <FileText size={16} className="text-indigo-500" />, title: 'Word document', desc: 'Formatted production table', ext: '.DOC', onClick: handleExportDocx },
    { key: 'md', icon: <FileCode size={16} className="text-emerald-500" />, title: 'Markdown', desc: 'Structured tables for Notion', ext: '.MD', onClick: handleExportMarkdown },
    { key: 'json', icon: <FileCode size={16} className="text-amber-500" />, title: 'JSON data package', desc: 'Raw structured script data', ext: '.JSON', onClick: handleExportJson }
  ];

  /* ───────── Script actions ───────── */
  const handleEnhanceScript = async () => {
    if (isEnhancing) return;
    setIsEnhancing(true);
    try {
      setOriginalVersion(script);
      const log = await enhanceScriptWithGemini(script, creator, apiKey);
      const mergedSegments =
        log.enhancedSegments && log.enhancedSegments.length > 0
          ? log.enhancedSegments.map((enh, idx) => ({
              ...(script.segments[idx] || {}),
              visual: enh.visual,
              audio: enh.audio
            }))
          : script.segments;
      onUpdateScript({ ...script, segments: mergedSegments, enhancementLog: log });
    } catch (e) {
      console.error('Failed to enhance script:', e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUndoEnhance = () => {
    if (!originalVersion) return;
    onUpdateScript(originalVersion);
    setOriginalVersion(null);
  };

  const handleExtendVisuals = async () => {
    if (isExtendingVisuals) return;
    setIsExtendingVisuals(true);
    try {
      onUpdateScript(await extendVisualSequence(script, apiKey));
    } catch (e) {
      console.error('Failed to extend visual sequence:', e);
    } finally {
      setIsExtendingVisuals(false);
    }
  };

  const handleGenerateImage = async (index: number) => {
    const segment = segments[index];
    if (!segment || segment.isGeneratingImage || segment.generatedImageUrl) return;

    let newSegments = [...segments];
    newSegments[index] = { ...segment, isGeneratingImage: true };
    onUpdateScript({ ...script, segments: newSegments });

    try {
      const imageUrl = await generateVisualPreview(segment.visual, apiKey);
      newSegments = [...newSegments];
      newSegments[index] = { ...segment, generatedImageUrl: imageUrl, isGeneratingImage: false };
      onUpdateScript({ ...script, segments: newSegments });
    } catch (e) {
      console.error(e);
      newSegments = [...newSegments];
      newSegments[index] = { ...segment, isGeneratingImage: false };
      onUpdateScript({ ...script, segments: newSegments });
    }
  };

  const handleEditImage = async (index: number) => {
    const segment = segments[index];
    const prompt = editPrompts[index];
    if (!segment?.generatedImageUrl || !prompt?.trim() || isEditingMap[index]) return;
    setIsEditingMap(prev => ({ ...prev, [index]: true }));
    try {
      const newImageUrl = await editGeneratedImage(segment.generatedImageUrl, prompt, apiKey);
      const newSegments = [...segments];
      newSegments[index] = { ...segment, generatedImageUrl: newImageUrl };
      onUpdateScript({ ...script, segments: newSegments });
      setEditPrompts(prev => ({ ...prev, [index]: '' }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsEditingMap(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleCanvasSave = (newText: string) => {
    const updatedSegments = parseCanvasTextToSegments(newText, script.segments || []);
    onUpdateScript({ ...script, segments: updatedSegments, userEditedScript: newText });
  };

  const handleApplyMicroFix = (original: string, fix: string) => {
    if (!original || !fix) return;
    const updatedSegments = (script.segments || []).map(seg =>
      seg.audio && seg.audio.includes(original) ? { ...seg, audio: seg.audio.replace(original, fix) } : seg
    );
    onUpdateScript({ ...script, segments: updatedSegments });
  };

  const handleApplyExperimentVariant = (variant: ExperimentVariant) => {
    if (!script.segments || script.segments.length === 0) return;
    const updatedSegments = [...script.segments];
    updatedSegments[0] = {
      ...script.segments[0],
      rewriteSuggestion: `[${variant.type} Variant — ${variant.confidence}% confidence]: ${variant.reason}`
    };
    onUpdateScript({ ...script, segments: updatedSegments });
  };

  const togglePanel = async (panel: 'none' | PanelKey, forceReload = false) => {
    if (activePanel === panel && !forceReload) {
      setActivePanel('none');
      return;
    }
    setActivePanel(panel);
    setPanelError(null);
    if (panel === 'none') return;

    const run = async (task: () => Promise<void>, fallbackMsg: string) => {
      setIsProcessingPanel(true);
      try {
        await task();
      } catch (e: any) {
        console.error(e);
        setPanelError(e?.message || fallbackMsg);
      } finally {
        setIsProcessingPanel(false);
      }
    };

    if (panel === 'simulate' && (!simulationData || forceReload)) {
      await run(async () => setSimulationData(await simulateAudienceResponse(script, apiKey)), 'Failed to run simulation.');
    }
    if (
      panel === 'evidence' &&
      ((evidenceData.length === 0 &&
        claimsRegistry.length === 0 &&
        (script.citations || []).length === 0) ||
        forceReload)
    ) {
      await run(async () => {
        const mapped = await generateEvidenceMap(script, apiKey);
        setEvidenceData(mapped.length > 0 ? mapped : script.citations || []);
      }, 'Failed to verify evidence.');
    }
    if (panel === 'director' && (!directorData || forceReload)) {
      await run(async () => setDirectorData(await generateDirectorPlan(script, apiKey)), 'Failed to generate director plan.');
    }
    if (panel === 'experiment' && (experimentData.length === 0 || forceReload)) {
      await run(
        async () => setExperimentData(await generateExperimentVariants(script, creator, apiKey)),
        'Failed to generate A/B hook variants.'
      );
    }
  };

  const handleMarkerClick = (markerId: string) => {
    const cleanId = markerId.replace(/^\[|\]$/g, '').trim().toUpperCase();
    setInspectedMarkerId(cleanId);
    setFocusedMarkerId(cleanId);
  };

  const isRtlLanguage = (lang?: string, text?: string): boolean => {
    if (lang && /roman/i.test(lang) && !/script/i.test(lang)) {
      return false;
    }
    if (/urdu\s*\(proper\)|urdu\s*\(nastaliq\)|arabic/i.test(lang || '')) {
      return true;
    }
    return /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text || '');
  };

  /* ───────── Narration rendering (cue pills + Click-to-Verify markers + karaoke) ───────── */
  const renderNarrationWithCues = (
    rawAudio: string,
    sceneIndex: number,
    karaoke = true,
    isRtl = false
  ): React.ReactNode => {
    const tokens = parseAudioTextIntoTokens(rawAudio || '');
    const isCurrentKaraokeScene = karaoke && activeKaraokeScene === sceneIndex;
    let runningWordCounter = 0;

    return tokens.map((token, tIdx) => {
      if (token.type === 'pause') {
        if (!showAudioCues) return null;
        return (
          <bdi key={`pause-${tIdx}`} dir="ltr">
            <span
              contentEditable={false}
              className="mx-1 my-0.5 inline-flex select-none items-center gap-1 rounded-full border border-slate-300/80 bg-slate-100/90 px-2 py-0.5 align-middle font-sans text-[11px] font-semibold text-slate-600 dark:border-white/15 dark:bg-white/10 dark:text-slate-300"
              title="Spoken cadence pause (+1.5s)"
            >
              <span>{isRtl ? '⏸ وقفہ' : '⏸ Pause'}</span>
            </span>
          </bdi>
        );
      }

      if (token.type === 'sfx' || token.type === 'bgm') {
        if (!showAudioCues) return null;
        const isSfx = token.type === 'sfx';
        return (
          <bdi key={`cue-${tIdx}`} dir="ltr">
            <span
              contentEditable={false}
              className={clsx(
                'mx-0.5 my-0.5 inline-flex max-w-full select-none items-center gap-1 rounded-full border px-2.5 py-0.5 align-middle text-xs font-semibold',
                isSfx
                  ? 'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'border-purple-500/30 bg-purple-500/15 text-purple-700 dark:text-purple-300'
              )}
              title={`${isSfx ? 'Sound effect' : 'Background music'} cue (ignored by voiceover and runtime counter)`}
            >
              <span className="break-words">
                {isSfx ? '🔊 SFX: ' : '🎵 BGM: '}
                {token.content}
              </span>
            </span>
          </bdi>
        );
      }

      if (token.type === 'claim' || token.type === 'paper' || token.type === 'infographic') {
        const markerId = token.content.toUpperCase();
        const isClaim = token.type === 'claim';
        const isPaper = token.type === 'paper';
        const matchedClaim = claimsRegistry.find(c => c.id.toUpperCase() === markerId);
        const matchedInfographic = infographicsRegistry.find(i => i.id.toUpperCase() === markerId);
        const tooltipLabel = matchedClaim
          ? `Click to verify: ${matchedClaim.sourceTitle} (${matchedClaim.institutionOrJournal}, ${matchedClaim.publicationYear})`
          : matchedInfographic
          ? `Click to inspect chart blueprint: ${matchedInfographic.onScreenTitle} (${matchedInfographic.chartType})`
          : `Click to verify ${markerId} in Live Research Inspector`;

        return (
          <bdi key={`marker-${tIdx}`} dir="ltr">
            <button
              type="button"
              onClick={() => handleMarkerClick(markerId)}
              title={tooltipLabel}
              className={clsx(
                'mx-1 my-0.5 inline-flex select-none items-center gap-1 rounded-md border px-2 py-0.5 align-middle font-mono text-[11px] font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs',
                isPaper
                  ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-700 hover:bg-indigo-500/25 dark:text-indigo-300'
                  : isClaim
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300'
                  : 'border-amber-500/40 bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300'
              )}
            >
              {isPaper ? (
                <FileCheck2 size={11} className="shrink-0" />
              ) : isClaim ? (
                <ShieldCheck size={11} className="shrink-0" />
              ) : (
                <BarChart3 size={11} className="shrink-0" />
              )}
              <span>[{markerId}]</span>
            </button>
          </bdi>
        );
      }

      if (!isCurrentKaraokeScene || activeKaraokeWordIdx === null) {
        return <React.Fragment key={`txt-${tIdx}`}>{token.content}</React.Fragment>;
      }

      const wordParts = token.content.split(/(\s+)/);
      return (
        <React.Fragment key={`txt-${tIdx}`}>
          {wordParts.map((part, wIdx) => {
            if (!part || /^\s+$/.test(part)) return <React.Fragment key={`ws-${wIdx}`}>{part}</React.Fragment>;
            const thisWordIndex = runningWordCounter++;
            const isHighlighted = Math.abs(thisWordIndex - activeKaraokeWordIdx) <= 1;
            const isSpokenAlready = thisWordIndex < activeKaraokeWordIdx - 1;
            return (
              <span
                key={`w-${wIdx}`}
                className={clsx(
                  'rounded px-0.5 transition-colors duration-150 [box-decoration-break:clone] motion-reduce:transition-none',
                  isHighlighted
                    ? 'bg-indigo-500 font-bold text-white shadow-sm'
                    : isSpokenAlready && 'text-indigo-600 dark:text-indigo-300'
                )}
              >
                {part}
              </span>
            );
          })}
        </React.Fragment>
      );
    });
  };

  /** One narration cell (used once in standard view, twice in dual view). */
  const renderNarrationCell = (o: {
    idx: number;
    audio: string;
    label: string;
    language?: string;
    langCls: string;
    karaoke: boolean;
    active: boolean;
    translated?: boolean;
    copyKey: string;
    leaked: string[];
  }) => {
    const words = countWords(o.audio);
    const isRtl = isRtlLanguage(o.language, o.audio);
    const cellStyle: React.CSSProperties = isRtl
      ? {
          fontSize: narrationStyle.fontSize,
          lineHeight: '2.35',
          letterSpacing: '0px'
        }
      : narrationStyle;

    return (
      <div
        className={clsx(
          'min-w-0 p-4 transition-colors sm:p-5',
          o.active
            ? 'bg-indigo-50 dark:bg-indigo-500/10'
            : o.translated
            ? 'bg-indigo-50/40 dark:bg-[#162032]/90'
            : 'bg-white dark:bg-[#162032]'
        )}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Mic size={12} className="shrink-0" />
            <span className="truncate">{o.label}</span>
            <span className="shrink-0 font-normal opacity-70">{words} words</span>
          </span>
          <div className="-mr-1.5 flex shrink-0 items-center gap-1">
            {o.active && o.karaoke && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 motion-safe:animate-pulse">
                <Volume2 size={12} /> Speaking
              </span>
            )}
            <InlineAction
              icon={copyFeedback === o.copyKey ? <Check size={13} /> : <Copy size={13} />}
              label={copyFeedback === o.copyKey ? 'Copied' : 'Copy'}
              done={copyFeedback === o.copyKey}
              onClick={() => handleCopy(stripAudioCuesAndBrackets(o.audio), o.copyKey)}
            />
          </div>
        </div>

        <p
          dir={isRtl ? 'rtl' : 'ltr'}
          className={clsx(
            'whitespace-pre-line break-words font-medium text-slate-800 dark:text-slate-100',
            o.langCls,
            isRtl && 'text-right leading-[2.4]'
          )}
          style={cellStyle}
        >
          {renderNarrationWithCues(o.audio, o.idx, o.karaoke, isRtl)}
        </p>

        {o.leaked.length > 0 && (
          <div className="mt-3 inline-flex max-w-full items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/15 px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            <AlertTriangle size={13} className="mt-px shrink-0" />
            <span className="break-words">Placeholder detected: {o.leaked.join(', ')}</span>
          </div>
        )}
      </div>
    );
  };

  /* ───────── Derived layout values ───────── */
  const gridCols = isDualView ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2';
  const visualSpan = isDualView ? 'md:col-span-2 lg:col-span-1' : '';
  const panelOpen = activePanel !== 'none';
  const panelMeta = activePanel !== 'none' ? PANEL_META[activePanel] : null;
  const standardLangLabel = isTranslatedView && activeTranslation ? activeTranslation.language : primaryLang;

  /* ──────────────────────────────────────────────────────────
     Render
     ────────────────────────────────────────────────────────── */
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl transition-colors dark:border-white/5 dark:bg-[#162032] sm:rounded-3xl sm:shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      {/* ═════════ HEADER ═════════ */}
      <header className="relative z-30 space-y-2.5 border-b border-slate-200 px-3 py-3 dark:border-white/5 sm:px-5 lg:px-6">
        {/* Tier 1: title, status, primary actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-slate-900 dark:text-white sm:text-lg">Script Editor</h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {script.isDemo && (
                <Chip className="border-amber-500/30 bg-amber-500/20 text-amber-700 dark:text-amber-300">Demo sample</Chip>
              )}
              <Chip
                className="border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                title="Spoken words (SFX/BGM cues excluded)"
              >
                <Mic size={12} /> {heuristics.wordCount} words
              </Chip>
              <Chip
                className="border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                title="Estimated spoken runtime"
              >
                <Clock size={12} /> ~{formatDuration(heuristics.estSeconds)}
              </Chip>
              <Chip
                className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                title={`Creator DNA fidelity for ${creator.name}${
                  styleReport.matchedLexiconTerms.length
                    ? ` • Lexicon matched: ${styleReport.matchedLexiconTerms.join(', ')}`
                    : ''
                }`}
              >
                <ShieldCheck size={12} /> DNA {styleReport.fidelityScore}%
              </Chip>
              {(claimsRegistry.length > 0 || infographicsRegistry.length > 0 || glossaryRegistry.length > 0) && (
                <button
                  type="button"
                  onClick={() => togglePanel('evidence')}
                  title="Click to inspect verified live research claims, papers, infographics, and scientific glossary"
                  className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-500/20 dark:text-blue-300 transition-colors cursor-pointer"
                >
                  <BookOpen size={12} />
                  <span>
                    Live Research ({claimsRegistry.length} Claims · {infographicsRegistry.length} Charts)
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Workspace Suite Toggle (Chapters, Claims, Add Evidence, Hook Lab, Production 2.3x) */}
            <ToolButton
              icon={<ShieldCheck size={15} />}
              label={showWorkspaceSuite ? 'Hide Studio Panels' : 'Claims, Hook Lab & 2.3x View'}
              tone="indigo"
              active={showWorkspaceSuite}
              onClick={() => setShowWorkspaceSuite(v => !v)}
              title="Toggle Chapter Navigator, Exhaustive Claim Check, Post-Script Evidence, Hook Lab & 2.3x Production Table"
            />

            {/* Versions History Dropdown */}
            {script.versions && script.versions.length > 0 && (
              <div className="relative">
                <ToolButton
                  icon={<Clock size={15} />}
                  label={`Versions (${script.versions.length})`}
                  tone="neutral"
                  active={showVersionsMenu}
                  onClick={() => setShowVersionsMenu(v => !v)}
                  title="Restore a saved version snapshot"
                />
                {showVersionsMenu && (
                  <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-[#162032]">
                    <div className="px-2.5 py-1 text-xs font-bold text-slate-400">
                      Saved Script Versions
                    </div>
                    {script.versions.map(ver => (
                      <button
                        key={ver.id}
                        type="button"
                        onClick={() => {
                          const updatedSegs = parseCanvasTextToSegments(ver.scriptText, segments);
                          onUpdateScript({
                            ...script,
                            script: ver.scriptText,
                            segments: updatedSegs
                          });
                          setShowVersionsMenu(false);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-xs"
                      >
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {ver.label}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {ver.wordCount} words • {new Date(ver.timestamp).toLocaleTimeString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <ToolButton
              icon={<Type size={15} />}
              label="Text style"
              iconOnlyOnMobile
              active={showTypography}
              aria-pressed={showTypography}
              onClick={() => setShowTypography(v => !v)}
              title="Typography settings"
            />

            {/* Export */}
            <div className="relative" ref={exportRef}>
              <ToolButton
                icon={<Download size={15} />}
                label="Export"
                tone="neutral"
                active={showExportMenu}
                aria-haspopup="menu"
                aria-expanded={showExportMenu}
                onClick={() => setShowExportMenu(v => !v)}
                title="Export script"
                className="pr-2.5"
              />
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40 bg-slate-900/50 sm:hidden" onClick={() => setShowExportMenu(false)} aria-hidden="true" />
                  <div
                    role="menu"
                    className={clsx(
                      'z-50 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-[#162032]',
                      // mobile: bottom sheet
                      'fixed inset-x-3 bottom-3 max-h-[80dvh] pb-[calc(0.5rem+env(safe-area-inset-bottom))]',
                      // ≥ sm: popover under the button
                      'sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-[70vh] sm:w-72 sm:pb-2',
                      'motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-150'
                    )}
                  >
                    <div className="px-2.5 pb-1 pt-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">Download</div>
                    {downloadItems.map(item => (
                      <MenuItem key={item.key} icon={item.icon} title={item.title} desc={item.desc} ext={item.ext} onClick={item.onClick} />
                    ))}

                    <div className="my-1.5 border-t border-slate-100 dark:border-white/10" />
                    <div className="px-2.5 pb-1 pt-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">Copy to clipboard</div>

                    <MenuItem
                      icon={copyFeedback === 'all' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-slate-400" />}
                      title={copyFeedback === 'all' ? 'Copied full script' : 'Copy full script'}
                      desc="Scenes, visuals and narration"
                      onClick={() => handleCopy(formatScriptAsText(effectiveScriptForExport, creator), 'all')}
                    />
                    <MenuItem
                      icon={copyFeedback === 'audio' ? <Check size={16} className="text-emerald-500" /> : <Mic size={16} className="text-slate-400" />}
                      title={copyFeedback === 'audio' ? 'Copied narration' : 'Copy narration only'}
                      desc="Spoken text without visuals"
                      onClick={() => handleCopy(formatNarrationOnly(effectiveScriptForExport), 'audio')}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tier 2: tools (scrolls on phones, wraps from md up) */}
        <div
          role="toolbar"
          aria-label="Script tools"
          className={clsx(
            '-mx-3 flex items-center gap-2 overflow-x-auto scrollbar-hide sm:-mx-5',
            'pl-3 pr-8 sm:pl-5',
            'md:mx-0 md:flex-wrap md:overflow-visible md:p-0',
            'max-md:[mask-image:linear-gradient(to_right,black_calc(100%_-_28px),transparent)]'
          )}
        >
          <ToolButton
            icon={<Edit2 size={15} />}
            label="Canvas"
            tone="indigo"
            onClick={() => setShowCanvas(true)}
            title="Open canvas editor"
          />
          <ToolButton
            icon={copyFeedback === 'quick-copy' ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
            label={copyFeedback === 'quick-copy' ? 'Copied' : 'Copy'}
            onClick={() => handleCopy(formatNarrationOnly(effectiveScriptForExport), 'quick-copy')}
            title="Copy spoken narration to clipboard"
          />
          <ToolButton
            icon={isTranslatingScript ? <Loader2 size={15} className="animate-spin" /> : <Languages size={15} />}
            label={translatedLangList.length > 0 ? `Languages (${translatedLangList.length + 1})` : 'Languages'}
            tone="indigo"
            active={showLanguageStudio}
            aria-pressed={showLanguageStudio}
            onClick={() => setShowLanguageStudio(v => !v)}
            title="Preview in other languages or compare side by side"
          />
          <ToolButton
            icon={isEnhancing ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
            label={isEnhancing ? 'Polishing…' : 'Polish'}
            tone="purple"
            disabled={isEnhancing}
            onClick={handleEnhanceScript}
            title="Polish and enhance the script with Creator DNA"
          />
          {originalVersion && (
            <ToolButton
              icon={<Undo2 size={15} />}
              label="Undo"
              onClick={handleUndoEnhance}
              title="Revert to the previous version"
            />
          )}
          <ToolButton
            icon={isMappingCues ? <Loader2 size={15} className="animate-spin" /> : <Music size={15} />}
            label={isMappingCues ? 'Mapping cues…' : 'SFX & BGM cues'}
            tone="amber"
            active={hasAudioCuesInScript}
            disabled={isMappingCues}
            onClick={handleAutoMapAudioCues}
            title="Scan emotional beats and add [SFX] and [BGM] cues without changing any spoken words"
          />
          {hasAudioCuesInScript && (
            <ToolButton
              icon={showAudioCues ? <Eye size={15} /> : <EyeOff size={15} />}
              label={showAudioCues ? 'Hide cues' : 'Show cues'}
              aria-pressed={showAudioCues}
              onClick={() => setShowAudioCues(v => !v)}
              title={showAudioCues ? 'Hide SFX and BGM badges' : 'Show SFX and BGM badges'}
            />
          )}
          <ToolButton
            icon={isAnalyzing ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
            label={isAnalyzing ? 'Auditing…' : 'Boost audit'}
            tone="amber"
            active={hasAnalysis}
            disabled={isAnalyzing}
            onClick={onAnalyze}
            title="Run viral retention and hook audit"
          />

          <span className="mx-1 hidden h-6 w-px shrink-0 bg-slate-200 dark:bg-white/10 sm:block" aria-hidden="true" />

          {(Object.keys(PANEL_META) as PanelKey[]).map(key => {
            const Icon = PANEL_META[key].icon;
            const shortLabel = { simulate: 'Audience', evidence: 'Evidence', director: 'Director', experiment: 'A/B hooks' }[key];
            return (
              <ToolButton
                key={key}
                icon={<Icon size={15} />}
                label={shortLabel}
                tone="indigo"
                active={activePanel === key}
                aria-pressed={activePanel === key}
                onClick={() => togglePanel(key)}
                title={PANEL_META[key].title}
              />
            );
          })}
        </div>
      </header>

      {/* ═════════ VOICEOVER BAR ═════════ */}
      <ScratchVoiceoverBar
        segments={activeVoiceoverSegments}
        creator={creator}
        language={activeVoiceoverLanguage}
        scriptTitle={script.title || script.topic || 'script'}
        apiKey={apiKey}
        onActiveSceneChange={handleActiveKaraokeChange}
      />

      {/* ═════════ LANGUAGE STUDIO ═════════ */}
      {showLanguageStudio && (
        <section
          aria-label="Language studio"
          className="z-20 flex flex-col gap-3 border-b border-slate-200 bg-slate-50/90 px-3 py-3 dark:border-white/10 dark:bg-[#0f172a]/95 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-6 motion-safe:animate-in motion-safe:slide-in-from-top-2 motion-safe:duration-200"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm dark:border-white/10 dark:bg-[#1e293b] sm:h-9">
              <Languages size={14} className="shrink-0 text-indigo-500" />
              <span className="shrink-0 text-xs font-semibold text-slate-400">Target</span>
              <select
                value={selectedTargetLang}
                onChange={e => {
                  const nextLang = e.target.value;
                  setSelectedTargetLang(nextLang);
                  if (translations[nextLang] && languageViewMode === 'original') setLanguageViewMode('translated');
                }}
                disabled={isTranslatingScript}
                className="min-w-0 flex-1 cursor-pointer bg-transparent text-base font-semibold text-slate-900 outline-none dark:text-white sm:text-sm"
              >
                {LANGUAGES.filter(l => l !== primaryLang).map(lang => (
                  <option key={lang} value={lang} className="dark:bg-slate-800">
                    {lang} {translations[lang] ? '✓' : ''}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => handleGenerateLanguagePreview(selectedTargetLang, Boolean(activeTranslation))}
              disabled={isTranslatingScript}
              className={clsx(
                'inline-flex h-10 touch-manipulation items-center justify-center gap-1.5 rounded-xl px-4 text-[13px] font-semibold shadow-sm transition-colors sm:h-9',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60',
                isTranslatingScript
                  ? 'cursor-wait bg-indigo-500/20 text-indigo-500'
                  : activeTranslation
                  ? 'bg-slate-200/80 text-slate-700 hover:bg-slate-300 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500'
              )}
            >
              {isTranslatingScript ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Translating…</span>
                </>
              ) : activeTranslation ? (
                <>
                  <RotateCw size={13} />
                  <span>Regenerate</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Generate preview</span>
                </>
              )}
            </button>

            {translatedLangList.length > 1 && (
              <div className="flex flex-wrap items-center gap-1 sm:border-l sm:border-slate-200 sm:pl-2 dark:sm:border-white/10">
                {translatedLangList.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setSelectedTargetLang(lang);
                      if (languageViewMode === 'original') setLanguageViewMode('translated');
                    }}
                    className={clsx(
                      'h-9 rounded-lg px-3 text-xs font-semibold transition-colors sm:h-8',
                      selectedTargetLang === lang
                        ? 'border border-indigo-500/30 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                        : 'text-slate-500 hover:bg-slate-200/60 dark:hover:bg-white/5'
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}

            {translationError && (
              <span role="alert" className="flex items-start gap-1.5 text-xs font-semibold text-rose-500">
                <AlertTriangle size={13} className="mt-px shrink-0" />
                <span className="break-words">{translationError}</span>
              </span>
            )}
          </div>

          {activeTranslation && (
            <div
              role="radiogroup"
              aria-label="Language view"
              className="grid grid-cols-3 gap-1 rounded-xl border border-slate-300/60 bg-slate-200/70 p-1 dark:border-white/10 dark:bg-black/40 lg:inline-grid"
            >
              {([
                { mode: 'original', icon: <Eye size={14} />, short: 'Original', long: ` (${primaryLang})` },
                { mode: 'translated', icon: <Languages size={14} />, short: activeTranslation.language, long: '' },
                { mode: 'dual', icon: <Columns size={14} />, short: 'Dual', long: ' side-by-side' }
              ] as const).map(opt => {
                const selected = languageViewMode === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setLanguageViewMode(opt.mode)}
                    className={clsx(
                      'inline-flex h-10 min-w-0 touch-manipulation items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold transition-all sm:h-9 sm:px-3',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60',
                      selected
                        ? opt.mode === 'dual'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-slate-900 shadow-sm dark:bg-[#1e293b] dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    )}
                  >
                    <span className="hidden shrink-0 sm:inline">{opt.icon}</span>
                    <span className="truncate">
                      {opt.short}
                      <span className="hidden xl:inline">{opt.long}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ═════════ MAIN AREA ═════════ */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Scrolling script column */}
        <div className="relative z-0 flex min-w-0 flex-1 flex-col overflow-y-auto scrollbar-hide">
          {showTypography && (
            <div className="sticky top-0 z-20">
              <TypographyPanel config={typography} setConfig={setTypography} />
            </div>
          )}

          {/* ═════════ LONG-FORM WORKSPACE SUITE (CHAPTERS, 2.3x PRODUCTION SCRIPT, CLAIMS, ADD EVIDENCE, HOOK LAB) ═════════ */}
          {showWorkspaceSuite && (
            <div className="border-b border-slate-200 bg-slate-950/95 p-4 text-slate-100 dark:border-white/10">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWorkspaceCenterView('scenes')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      workspaceCenterView === 'scenes'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Voiceover Script View
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkspaceCenterView('production_table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      workspaceCenterView === 'production_table'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Production Script Table (~2.3x Words)
                  </button>
                </div>
                <span className="text-xs text-slate-400">
                  Use the right-hand tabs to audit Claims (~3/min), upload post-script Evidence, or test 3 Hook Lab openings.
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Rail: Chapter Navigator (if chapters exist) */}
                {script.writtenChapters && script.writtenChapters.length > 0 && (
                  <div className="lg:col-span-4">
                    <ChapterNavigator
                      chapters={script.writtenChapters}
                      outline={script.chapterOutline || []}
                      activeChapterId={activeChapterId}
                      onSelectChapter={cid => setActiveChapterId(cid)}
                      expandingChapterId={expandingChapterId}
                      onExpandOrTrimChapter={async (chap, action) => {
                        setExpandingChapterId(chap.chapterId);
                        try {
                          const outlineItem = (script.chapterOutline || []).find(
                            o => o.id === chap.chapterId
                          ) || {
                            id: chap.chapterId,
                            chapterNumber: chap.chapterNumber,
                            title: chap.title,
                            purpose: chap.summary2Lines,
                            weightPct: 15,
                            targetWords: chap.targetWords,
                            assignedFactIds: chap.usedFactIds,
                            assignedQuoteIds: chap.usedQuoteIds,
                            assignedBookIds: chap.usedBookIds
                          };
                          const updatedChap = await expandOrTrimChapter({
                            chapterResult: chap,
                            chapterOutline: outlineItem,
                            action,
                            language: script.language || 'Roman Urdu',
                            recipe: getCreatorRecipeById(creator.id),
                            dossier: script.dossier || {
                              topic: script.title,
                              angle: script.title,
                              durationMinutes: 15,
                              targetWordCount: 2100,
                              targetFactCount: 20,
                              facts: [],
                              quotes: [],
                              books: [],
                              gaps: []
                            },
                            apiKey
                          });
                          const nextChaps = (script.writtenChapters || []).map(c =>
                            c.chapterId === chap.chapterId ? updatedChap : c
                          );
                          const nextScriptText = [
                            `### [COLD OPEN HOOK]\n\n${script.Hook || ''}`,
                            ...nextChaps.map(
                              c => `### Chapter ${c.chapterNumber}: ${c.title}\n\n${c.text}`
                            )
                          ].join('\n\n---\n\n');
                          onUpdateScript({
                            ...script,
                            script: nextScriptText,
                            writtenChapters: nextChaps,
                            versions: [
                              {
                                id: `VER-${Date.now()}`,
                                label: `${action === 'expand' ? 'Expanded' : 'Trimmed'} Ch ${
                                  chap.chapterNumber
                                } (${updatedChap.wordCount}w)`,
                                timestamp: Date.now(),
                                scriptText: nextScriptText,
                                wordCount: nextScriptText.split(/\s+/).length
                              },
                              ...(script.versions || [])
                            ]
                          });
                        } finally {
                          setExpandingChapterId(null);
                        }
                      }}
                    />
                  </div>
                )}

                {/* Right Rail: Sources | Claims | Add Evidence | Hook Lab | Style Check */}
                <div
                  className={
                    script.writtenChapters && script.writtenChapters.length > 0
                      ? 'lg:col-span-8'
                      : 'lg:col-span-12'
                  }
                >
                  <WorkspaceRightRail
                    activeTab={workspaceRightTab}
                    onTabChange={setWorkspaceRightTab}
                    scriptText={
                      script.script ||
                      segments.map(s => s.audio).join('\n\n')
                    }
                    onUpdateScriptText={(newText, versionLabel) => {
                      const nextSegs = parseCanvasTextToSegments(newText, segments);
                      onUpdateScript({
                        ...script,
                        script: newText,
                        segments: nextSegs,
                        versions: [
                          {
                            id: `VER-${Date.now()}`,
                            label: versionLabel,
                            timestamp: Date.now(),
                            scriptText: newText,
                            wordCount: newText.split(/\s+/).length
                          },
                          ...(script.versions || [])
                        ]
                      });
                    }}
                    dossier={script.dossier}
                    onUpdateDossier={nextDossier =>
                      onUpdateScript({ ...script, dossier: nextDossier })
                    }
                    chapters={script.writtenChapters}
                    hookVariants={script.hookVariants}
                    activeHookText={script.Hook}
                    onSelectHookVariant={(variant: HookLabVariant) => {
                      const nextScriptText = (script.script || '').replace(
                        script.Hook || '',
                        variant.text
                      );
                      onUpdateScript({
                        ...script,
                        Hook: variant.text,
                        script: nextScriptText,
                        activeHookVariantId: variant.id,
                        versions: [
                          {
                            id: `VER-${Date.now()}`,
                            label: `Switched Hook to ${variant.label}`,
                            timestamp: Date.now(),
                            scriptText: nextScriptText,
                            wordCount: nextScriptText.split(/\s+/).length
                          },
                          ...(script.versions || [])
                        ]
                      });
                    }}
                    claims={claimsList}
                    onUpdateClaims={nextClaims => {
                      setClaimsList(nextClaims);
                      onUpdateScript({ ...script, claimsList: nextClaims });
                    }}
                    evidenceSuggestions={evidenceSuggestions}
                    onUpdateEvidenceSuggestions={nextSugs => {
                      setEvidenceSuggestions(nextSugs);
                      onUpdateScript({ ...script, evidenceSuggestions: nextSugs });
                    }}
                    openLoopsSummary={script.openLoopsSummary}
                    recipe={getCreatorRecipeById(creator.id)}
                    durationMinutes={parseDurationToMinutes(script.duration || '15 Minutes')}
                    topic={script.topic || script.title || 'Documentary'}
                    apiKey={apiKey}
                  />
                </div>
              </div>

              {workspaceCenterView === 'production_table' && (
                <div className="mt-4">
                  <ProductionScriptTableView
                    rows={script.productionScriptRows || []}
                    isGenerating={isBuildingProdTable}
                    onGenerateProductionScript={async () => {
                      setIsBuildingProdTable(true);
                      try {
                        const chaps: WrittenChapterResult[] =
                          script.writtenChapters && script.writtenChapters.length > 0
                            ? script.writtenChapters
                            : segments.map((s, i) => ({
                                chapterId: `CHAP-${i + 1}`,
                                chapterNumber: i + 1,
                                title: `Section ${i + 1}`,
                                text: s.audio,
                                wordCount: countWords(s.audio),
                                targetWords: countWords(s.audio),
                                summary2Lines: s.visual,
                                usedFactIds: [],
                                usedQuoteIds: [],
                                usedBookIds: [],
                                lengthStatus: 'on_target'
                              }));
                        const rows = await buildProductionScript({
                          topic: script.topic || script.title || 'Documentary',
                          language: script.language || 'Roman Urdu',
                          hookText: script.Hook || segments[0]?.audio || '',
                          chapterResults: chaps,
                          dossier: script.dossier || {
                            topic: script.title,
                            angle: script.title,
                            durationMinutes: 15,
                            targetWordCount: 2100,
                            targetFactCount: 20,
                            facts: [],
                            quotes: [],
                            books: [],
                            gaps: []
                          },
                          recipe: getCreatorRecipeById(creator.id),
                          apiKey
                        });
                        onUpdateScript({ ...script, productionScriptRows: rows });
                      } finally {
                        setIsBuildingProdTable(false);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Dual-view episode titles */}
          {isDualView && activeTranslation && (
            <div className="grid grid-cols-1 border-b border-slate-200 bg-slate-50/60 dark:border-white/5 dark:bg-white/[0.02] md:grid-cols-2">
              <div className="px-4 py-3 sm:px-5">
                <div className="text-xs font-semibold text-slate-400">Episode title</div>
                <div
                  dir={isRtlLanguage(primaryLang, script.title) ? 'rtl' : 'ltr'}
                  className={clsx(
                    'mt-0.5 text-sm font-bold text-slate-900 dark:text-white',
                    langClass,
                    isRtlLanguage(primaryLang, script.title) && 'text-right leading-[2.2]'
                  )}
                >
                  {script.title}
                </div>
              </div>
              <div className="border-t border-slate-200 bg-indigo-500/[0.03] px-4 py-3 dark:border-white/5 sm:px-5 md:border-l md:border-t-0">
                <div className="text-xs font-semibold text-indigo-500/80">Translated title</div>
                <div
                  dir={isRtlLanguage(activeTranslation.language, activeTranslation.title || script.title) ? 'rtl' : 'ltr'}
                  className={clsx(
                    'mt-0.5 text-sm font-bold text-indigo-700 dark:text-indigo-300',
                    getLanguageClass(activeTranslation.language),
                    isRtlLanguage(activeTranslation.language, activeTranslation.title || script.title) && 'text-right leading-[2.2]'
                  )}
                >
                  {activeTranslation.title || script.title}
                </div>
              </div>
            </div>
          )}

          {/* Column headers (tablet & desktop) */}
          <div
            className={clsx(
              'sticky top-0 z-10 hidden border-b border-slate-200 bg-slate-100/95 backdrop-blur dark:border-white/10 dark:bg-[#0f172a]/95 md:grid',
              gridCols
            )}
          >
            <div className={clsx('flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400', visualSpan)}>
              <Video size={14} className="text-sky-500" />
              Visual direction
              <span className="font-normal opacity-70">{segments.length} scenes</span>
            </div>
            <div className="flex items-center justify-between gap-2 px-5 py-1.5">
              <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                <span className={clsx('h-2 w-2 shrink-0 rounded-full', isDualView ? 'bg-emerald-500' : 'bg-indigo-500')} />
                <span className="truncate">{isDualView ? `Original · ${primaryLang}` : `Narration · ${standardLangLabel}`}</span>
              </span>
              <InlineAction
                icon={copyFeedback === 'col-main' ? <Check size={13} /> : <Copy size={13} />}
                label={copyFeedback === 'col-main' ? 'Copied' : 'Copy all'}
                done={copyFeedback === 'col-main'}
                onClick={() =>
                  handleCopy(formatNarrationOnly(isDualView ? script : effectiveScriptForExport), 'col-main')
                }
              />
            </div>
            {isDualView && activeTranslation && (
              <div className="flex items-center justify-between gap-2 bg-indigo-500/5 px-5 py-1.5">
                <span className="flex min-w-0 items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-300">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                  <span className="truncate">Translated · {activeTranslation.language}</span>
                </span>
                <InlineAction
                  icon={copyFeedback === 'col-trans' ? <Check size={13} /> : <Copy size={13} />}
                  label={copyFeedback === 'col-trans' ? 'Copied' : 'Copy all'}
                  done={copyFeedback === 'col-trans'}
                  onClick={() => handleCopy(activeTranslation.segments.map(s => s.audio).join('\n\n'), 'col-trans')}
                />
              </div>
            )}
          </div>

          {/* ───── Scene rows ───── */}
          <div className="divide-y divide-slate-200 dark:divide-white/5">
            {segments.length === 0 && (
              <div className="px-6 py-16 text-center">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No scenes yet</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Generate or paste a script, or open the canvas to start writing.
                </p>
              </div>
            )}

            {segments.map((seg, idx) => {
              const trans = activeTranslation?.segments[idx];
              const displayVisual = isTranslatedView && trans?.visual ? trans.visual : seg.visual;
              const displayAudio = isTranslatedView && trans?.audio ? trans.audio : seg.audio;
              const leaked = seg.leakedPlaceholders || findLeakedPlaceholders(displayAudio || '');
              const isActive = activeKaraokeScene === idx;

              return (
                <article
                  key={idx}
                  ref={el => {
                    sceneRowRefs.current[idx] = el;
                  }}
                  aria-label={`Scene ${idx + 1}`}
                  className={clsx('relative grid grid-cols-1', gridCols)}
                >
                  {isActive && <span aria-hidden="true" className="absolute inset-y-0 left-0 z-[1] w-1 bg-indigo-500" />}

                  {/* Visual */}
                  <div className={clsx('min-w-0 bg-slate-50 p-4 dark:bg-[#0f172a] sm:p-5', visualSpan)}>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-md bg-sky-500/15 px-1 text-[11px] font-bold text-sky-700 dark:text-sky-300">
                        {idx + 1}
                      </span>
                      Visual
                    </div>
                    <p className="break-words font-mono text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 sm:text-sm">
                      {renderNarrationWithCues(displayVisual, idx, false)}
                    </p>

                    {seg.generatedImageUrl ? (
                      <figure className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-900 dark:border-white/10">
                        <img
                          src={seg.generatedImageUrl}
                          alt={`Scene ${idx + 1} preview`}
                          loading="lazy"
                          className="block h-auto w-full"
                        />
                        <div className="flex gap-2 bg-slate-900/90 p-2">
                          <input
                            type="text"
                            aria-label={`Describe an edit for scene ${idx + 1} image`}
                            placeholder="Describe an edit…"
                            value={editPrompts[idx] || ''}
                            onChange={e => setEditPrompts(prev => ({ ...prev, [idx]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleEditImage(idx);
                            }}
                            className="h-10 min-w-0 flex-1 rounded-lg bg-white/10 px-3 text-base text-white outline-none placeholder:text-white/50 focus:ring-2 focus:ring-indigo-400/60 sm:text-sm"
                          />
                          <button
                            type="button"
                            aria-label="Apply image edit"
                            onClick={() => handleEditImage(idx)}
                            disabled={isEditingMap[idx] || !(editPrompts[idx] || '').trim()}
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-500 text-white transition-colors hover:bg-indigo-400 disabled:opacity-50"
                          >
                            {isEditingMap[idx] ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                          </button>
                        </div>
                      </figure>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleGenerateImage(idx)}
                        disabled={seg.isGeneratingImage}
                        className="mt-3 inline-flex h-10 touch-manipulation items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 disabled:opacity-60 dark:text-sky-300 sm:h-9"
                      >
                        {seg.isGeneratingImage ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                        {seg.isGeneratingImage ? 'Generating…' : 'Generate preview'}
                      </button>
                    )}
                  </div>

                  {/* Narration */}
                  {isDualView && activeTranslation ? (
                    <>
                      {renderNarrationCell({
                        idx,
                        audio: seg.audio,
                        label: `Original · ${primaryLang}`,
                        language: primaryLang,
                        langCls: langClass,
                        karaoke: true,
                        active: isActive,
                        copyKey: `scene-${idx}-o`,
                        leaked
                      })}
                      {renderNarrationCell({
                        idx,
                        audio: trans?.audio || seg.audio,
                        label: `Translated · ${activeTranslation.language}`,
                        language: activeTranslation.language,
                        langCls: getLanguageClass(activeTranslation.language),
                        karaoke: false,
                        active: false,
                        translated: true,
                        copyKey: `scene-${idx}-t`,
                        leaked: []
                      })}
                    </>
                  ) : (
                    renderNarrationCell({
                      idx,
                      audio: displayAudio,
                      label: `Narration · ${standardLangLabel}`,
                      language: standardLangLabel,
                      langCls: isTranslatedView && activeTranslation ? getLanguageClass(activeTranslation.language) : langClass,
                      karaoke: true,
                      active: isActive,
                      copyKey: `scene-${idx}-o`,
                      leaked
                    })
                  )}
                </article>
              );
            })}
          </div>

          {/* ───── Extend actions ───── */}
          <div className="flex flex-col gap-3 p-4 pb-8 sm:p-5 sm:pb-10 md:flex-row">
            <button
              type="button"
              onClick={handleExtendVisuals}
              disabled={isExtendingVisuals}
              className={clsx(
                'flex min-h-[3rem] flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-sm font-semibold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60',
                isExtendingVisuals
                  ? 'cursor-wait border-sky-500/50 bg-sky-500/10 text-sky-500'
                  : 'border-slate-300 text-slate-500 hover:border-sky-500 hover:text-sky-600 dark:border-white/10 dark:text-slate-400'
              )}
            >
              {isExtendingVisuals ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Extending scene list…
                </>
              ) : (
                <>
                  <PlusCircle size={16} /> Extend visual sequence
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onExtend}
              disabled={isExtending}
              className={clsx(
                'flex min-h-[3rem] flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 text-sm font-semibold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60',
                isExtending
                  ? 'cursor-wait border-indigo-500/50 bg-indigo-500/10 text-indigo-500'
                  : 'border-slate-300 text-slate-500 hover:border-indigo-500 hover:text-indigo-600 dark:border-white/10 dark:text-slate-400'
              )}
            >
              {isExtending ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Generating continuation…
                </>
              ) : (
                <>
                  <PlusCircle size={16} /> Extend script
                </>
              )}
            </button>
          </div>

          {script.citations && script.citations.length > 0 && (
            <SourcePanel citations={script.citations} isVisible={showSources} onToggle={() => setShowSources(v => !v)} />
          )}
        </div>

        {/* ───── Analysis panel: bottom sheet (< lg) / docked sidebar (≥ lg) ───── */}
        {panelOpen && (
          <button
            type="button"
            aria-label="Close panel"
            onClick={() => setActivePanel('none')}
            className="fixed inset-0 z-40 cursor-default bg-slate-900/50 lg:hidden"
          />
        )}
        <aside
          aria-hidden={!panelOpen}
          aria-label={panelMeta?.title || 'Analysis panel'}
          className={clsx(
            'flex flex-col overflow-hidden border-slate-200 bg-slate-50 transition-all duration-300 ease-out dark:border-white/10 dark:bg-[#0f172a] motion-reduce:transition-none',
            // phone / tablet: bottom sheet
            'fixed inset-x-0 bottom-0 z-50 h-[85dvh] rounded-t-3xl border-t shadow-2xl',
            // laptop+: docked sidebar
            'lg:static lg:z-20 lg:h-auto lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none',
            panelOpen
              ? 'translate-y-0 lg:w-80 xl:w-96'
              : 'invisible translate-y-full lg:w-0 lg:translate-y-0 lg:border-l-0'
          )}
        >
          <div className="flex h-full w-full min-w-0 flex-col pb-[env(safe-area-inset-bottom)] lg:w-80 xl:w-96">
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-300 dark:bg-white/20 lg:hidden" aria-hidden="true" />
            <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4 dark:border-white/10">
              <h3 className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                {panelMeta && <panelMeta.icon size={16} className="shrink-0 text-indigo-500" />}
                <span className="truncate">{panelMeta?.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                aria-label="Close panel"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-slate-500 transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 dark:text-slate-300 dark:hover:bg-white/10 sm:h-9 sm:w-9"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {isProcessingPanel ? (
                <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-4 p-8 text-center">
                  <Loader2 size={32} className="animate-spin text-indigo-500" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Processing…</p>
                </div>
              ) : panelError ? (
                <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-4 p-6 text-center">
                  <AlertTriangle size={28} className="text-amber-500" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">{panelError}</p>
                  <button
                    type="button"
                    onClick={() => togglePanel(activePanel, true)}
                    className="h-10 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  {activePanel === 'simulate' && simulationData && (
                    <SimulationPanel data={simulationData} onApplyMicroFix={handleApplyMicroFix} />
                  )}
                  {activePanel === 'evidence' && (
                    <EvidencePanel
                      data={evidenceData.length > 0 ? evidenceData : script.citations || []}
                      script={script}
                      focusedMarkerId={focusedMarkerId}
                      onSelectMarker={setFocusedMarkerId}
                    />
                  )}
                  {activePanel === 'director' && directorData && <DirectorPanel data={directorData} />}
                  {activePanel === 'experiment' && experimentData.length > 0 && (
                    <ExperimentPanel data={experimentData} onApplyVariant={handleApplyExperimentVariant} />
                  )}
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ───── Interactive Click-to-Verify Source & Infographic Popover Modal ───── */}
      {inspectedMarkerId && (() => {
        const matchedClaim = claimsRegistry.find(
          c => c.id.toUpperCase() === inspectedMarkerId.toUpperCase()
        );
        const matchedInfographic = infographicsRegistry.find(
          i => i.id.toUpperCase() === inspectedMarkerId.toUpperCase()
        );
        const isPaper =
          matchedClaim?.type === 'research_paper' ||
          inspectedMarkerId.toUpperCase().startsWith('PAPER');
        const isChart =
          Boolean(matchedInfographic) ||
          inspectedMarkerId.toUpperCase().startsWith('INFOGRAPHIC');
        const hasValidUrl = (() => {
          if (!matchedClaim?.sourceUrl) return false;
          try {
            const u = new URL(matchedClaim.sourceUrl);
            return u.protocol === 'http:' || u.protocol === 'https:';
          } catch {
            return false;
          }
        })();
        const verifyQuery = matchedClaim
          ? `${matchedClaim.sourceTitle} ${matchedClaim.institutionOrJournal} ${matchedClaim.publicationYear}`.trim()
          : `${script.topic || script.title} ${inspectedMarkerId}`.trim();
        const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(verifyQuery)}`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(verifyQuery)}`;

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Verify ${inspectedMarkerId}`}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
            onClick={() => setInspectedMarkerId(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#0f172a] space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 font-mono text-xs font-bold',
                      isChart
                        ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        : isPaper
                        ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                        : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    )}
                  >
                    {isChart ? (
                      <BarChart3 size={13} />
                    ) : isPaper ? (
                      <FileCheck2 size={13} />
                    ) : (
                      <ShieldCheck size={13} />
                    )}
                    [{inspectedMarkerId}]
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {isChart
                      ? matchedInfographic?.chartType || 'Infographic Blueprint'
                      : isPaper
                      ? 'Peer-Reviewed Research Paper'
                      : 'Verified Factual Claim'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedMarkerId(null)}
                  className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                  aria-label="Close verification inspector"
                >
                  <X size={16} />
                </button>
              </div>

              {matchedInfographic ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {matchedInfographic.timestamp} • {matchedInfographic.chartType}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {matchedInfographic.onScreenTitle}
                    </h4>
                  </div>

                  {matchedInfographic.dataPoints?.length > 0 && (
                    <div className="rounded-xl bg-slate-100/90 dark:bg-white/5 p-3 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Exact X/Y Chart Data Points
                      </div>
                      <ul className="space-y-1 text-xs font-mono text-slate-800 dark:text-slate-200">
                        {matchedInfographic.dataPoints.map((pt, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {matchedInfographic.sourceCitationOnScreen && (
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-semibold">On-Screen Source Citation: </span>
                      {matchedInfographic.sourceCitationOnScreen}
                    </div>
                  )}

                  {matchedInfographic.editorAnimationNotes && (
                    <div className="text-xs italic text-slate-500 dark:text-slate-400 bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5">
                      <span className="font-semibold not-italic text-amber-600 dark:text-amber-400">
                        Editor Animation Cue:{' '}
                      </span>
                      {matchedInfographic.editorAnimationNotes}
                    </div>
                  )}
                </div>
              ) : matchedClaim ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {matchedClaim.institutionOrJournal} • {matchedClaim.publicationYear}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {matchedClaim.sourceTitle}
                    </h4>
                  </div>

                  {matchedClaim.spokenSentenceInScript && (
                    <blockquote className="border-l-2 border-indigo-500 pl-3 text-xs italic text-slate-600 dark:text-slate-300">
                      "{matchedClaim.spokenSentenceInScript}"
                    </blockquote>
                  )}

                  {matchedClaim.deepVerificationDetails && (
                    <div className="rounded-xl bg-slate-100/90 dark:bg-white/5 p-3 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                      {matchedClaim.deepVerificationDetails}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {hasValidUrl && (
                      <a
                        href={matchedClaim.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                      >
                        <ExternalLink size={13} /> Open Grounded Source
                      </a>
                    )}
                    <a
                      href={isPaper ? scholarUrl : googleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                    >
                      <Search size={13} /> {isPaper ? 'Verify on Google Scholar' : 'Verify on Google Search'}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Inspect and verify <span className="font-mono font-bold">[{inspectedMarkerId}]</span> across live web search sources or open the full Evidence Navigator drawer.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={isPaper ? scholarUrl : googleUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                    >
                      <Search size={13} /> {isPaper ? 'Search Google Scholar' : 'Verify on Google'}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    const targetId = inspectedMarkerId;
                    setInspectedMarkerId(null);
                    setFocusedMarkerId(targetId);
                    if (activePanel !== 'evidence') {
                      togglePanel('evidence');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <BookOpen size={13} /> Open Full Research & Evidence Drawer
                </button>
                <button
                  type="button"
                  onClick={() => setInspectedMarkerId(null)}
                  className="rounded-lg bg-slate-100 dark:bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <CanvasModal
        isOpen={showCanvas}
        onClose={() => setShowCanvas(false)}
        script={script}
        creator={creator}
        onSave={handleCanvasSave}
        isDarkMode={isDarkMode}
        apiKey={apiKey}
      />
    </div>
  );
};

export default ScriptEditor;