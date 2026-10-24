import React, { useCallback, useRef, useState, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  CreatorProfile,
  GeneratorConfig,
  UserPlan,
  TopicSuggestion,
  ReferenceImage,
  ResearchConfig,
  ResearchEngineMode,
  AgencyResearchDossier,
  ScriptData,
  Dossier,
  MySourcesState,
  ChapterOutlineItem,
  WrittenChapterResult
} from '../types';
import {
  LANGUAGES,
  DURATIONS,
  PLATFORMS,
  CREATORS,
  getLanguageClass,
  ARABIC_DIALECTS,
  TEMPLATES,
  DURATION_PACING_MATRIX
} from '../constants';
import {
  Loader2,
  Upload,
  Wand2,
  User,
  Check,
  Languages,
  DollarSign,
  Sparkles,
  BrainCircuit,
  Lightbulb,
  Image as ImageIcon,
  X,
  LayoutTemplate,
  Clock,
  Layers,
  Compass,
  Combine,
  AlertTriangle,
  FileText,
  Info,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Scissors,
  Scale,
  Flame,
  LayoutGrid,
  Home,
  BookOpen,
  Database,
  MessageSquare,
  Globe,
  ShieldCheck,
  Target,
  Plus,
  Search,
  Play,
  FastForward,
  ChevronDown,
  ChevronUp,
  Copy
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import {
  analyzeTopicWithGemini,
  detectTopicVideoCategory,
  detectTopicNiche,
  VideoFormatCategory,
  harvestAgencyResearchDossier,
  DEFAULT_AGENCY_RESEARCH_CONFIG
} from '../services/geminiService';
import {
  isDhruvRatheeCreator,
  isThynkWhyCreator,
  isRaftarCreator,
  hasCreatorGenreHierarchy,
  getSubGenreBlueprintsForCreator,
  matchCreatorSubGenreAndTranscript
} from '../src/data/creatorTranscripts';
import { resolveCreatorResearchRegion } from '../services/researchTargets';
import Avatar from './Avatar';
import { LibraryModal } from './LibraryModal';
import {
  TOPIC_NICHES,
  TopicNiche,
  VoiceSelectionState
} from '../creator-recipes/types';
import { getAllCreatorRecipes } from '../creator-recipes';
import {
  resolveRecipe,
  describeRecipe,
  matchCreators
} from '../creator-recipes/resolve';
import {
  resolveResearchStyle,
  describeResearchStyle
} from '../creator-research';
import {
  runResearchPipeline,
  toLegacyDossier,
  buildSmartTopicQuestions
} from '../services/researchEngine';
import {
  buildWriterBrief,
  computeResearchUsedReport
} from '../services/writerBrief';
import {
  computeBudget,
  FORMAT_DEFAULT_DEPTH,
  ScriptFormatType
} from '../services/budget';
import {
  parseDurationToMinutes,
  formatMinutesToDurationLabel
} from '../services/researchTargets';
import { ResearchStep } from './research/ResearchStep';
import { DossierReview } from './research/DossierReview';
import {
  runResearch,
  findMoreLikeCard,
  runChapterGapFill,
  ResearchProgressUpdate
} from '../services/researchService';
import {
  buildOutline,
  writeChapter,
  writeHook,
  stitchChapters,
  buildProductionScript
} from '../services/longFormService';
import { generateBeatPlan, runScriptQAPass } from '../services/scriptService';

const MAX_IMPORT_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_PDF_PAGES = 200;

type ModeDef = { id: 'manual' | 'auto' | 'blend'; label: string; subtitle: string; icon: LucideIcon; desc: string };

const MODES: ModeDef[] = [
  {
    id: 'manual',
    label: 'Choose a Creator',
    subtitle: 'Manual Persona Lock',
    icon: User,
    desc: 'Pick your preferred creator voice directly—locks their exact Bio DNA, Sub-Genre transcripts, and Language Policy.'
  },
  {
    id: 'auto',
    label: 'Auto Choose',
    subtitle: 'AI Topic-to-Creator Match',
    icon: Compass,
    desc: 'AI analyzes your topic domain, emotional stakes, and structure to automatically select the ideal creator.'
  },
  {
    id: 'blend',
    label: 'Blend Style',
    subtitle: 'Multi-Creator Synthesis',
    icon: Combine,
    desc: 'Anchor your script in one Primary Creator voice and blend up to 3 Secondary creator flavors or assign Hook, Structure & Tone roles.'
  }
];

const MAX_SECONDARIES = 3;

const FEATURED_LANGUAGES = [
  { id: 'English', label: 'English', sub: 'Global Broadcast' },
  { id: 'Roman Urdu', label: 'Roman Urdu', sub: 'Spoken Urdish + English Terms' },
  { id: 'Urdu (Proper)', label: 'Urdu (Nastaliq)', sub: 'اردو اسکرپٹ + انگلش الفاظ' },
  { id: 'Urdu (Roman + Script)', label: 'Urdu Dual Track', sub: 'Roman + [اردو] Side-by-Side' },
  { id: 'Hinglish (Roman)', label: 'Hinglish (Roman)', sub: 'Conversational Hindi + English' },
  { id: 'Hindi (Devanagari)', label: 'Hindi (हिन्दी)', sub: 'Devanagari Infotainment' },
  { id: 'Arabic', label: 'Arabic (العربية)', sub: 'Fusha & Regional Dialects' }
];

const DURATION_SYNTHESIS_META: Record<string, { timeBadge: string; depthBadge: string }> = {
  '30 Seconds (Fast)': { timeBadge: '~35s API Synthesis', depthBadge: '85–110 Words • 3 Scenes' },
  '60 Seconds (Shorts)': { timeBadge: '~40s API Synthesis', depthBadge: '170–210 Words • 3–4 Scenes' },
  '2 Minutes (Explainer)': { timeBadge: '~45s API Synthesis', depthBadge: '400–600 Words • 4–6 Scenes' },
  '5 Minutes (Deep Dive)': { timeBadge: '~1 Min API Synthesis', depthBadge: '750–1,000 Words • 6–8 Scenes' },
  '10 Minutes (Mini-Doc)': { timeBadge: '~90s API Synthesis', depthBadge: '1,800–2,000+ Words • 10–12 Scenes' },
  '20 Minutes (Full Documentary)': { timeBadge: '~2 Min API Synthesis', depthBadge: '4,000–5,000 Words • 18–22 Scenes' },
  'Match Original Length': { timeBadge: 'Dynamic Synthesis', depthBadge: 'Matches Imported Draft Length' }
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-0';

const getTokens = (dark: boolean) => ({
  surface: dark ? 'bg-[#0f172a]/90 border-white/10' : 'bg-white border-slate-200/90',
  panel: dark ? 'bg-[#1e293b]/90 border-white/10' : 'bg-white border-slate-200',
  popover: dark ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200',
  inset: dark ? 'bg-black/25 border-white/10' : 'bg-slate-50 border-slate-200/80',
  hoverRow: dark ? 'hover:bg-white/5' : 'hover:bg-slate-100',
  text: dark ? 'text-white' : 'text-slate-900',
  body: dark ? 'text-slate-200' : 'text-slate-700',
  muted: dark ? 'text-slate-400' : 'text-slate-600',
  line: dark ? 'border-white/10' : 'border-slate-200',
  chip: dark ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-slate-100 text-slate-700 border-slate-200',
  ghostBtn: dark
    ? 'bg-white/10 text-white hover:bg-white/15'
    : 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  field: dark
    ? 'bg-black/25 border-white/15 text-white placeholder-slate-500 focus:border-indigo-400'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500',
  option: dark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
});

const btnBase = clsx(
  'inline-flex items-center justify-center gap-2 min-h-[46px] rounded-2xl px-5 text-sm font-bold',
  'transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
  focusRing
);

interface HowItWorksDialogProps {
  open: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

const HowItWorksDialog: React.FC<HowItWorksDialogProps> = ({ open, onClose, isDarkMode }) => {
  const t = getTokens(isDarkMode);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const steps = [
    {
      title: 'Step 1: Describe your idea or import a document',
      body: 'Write your topic, paste a draft, or import a PDF, DOCX, or TXT file. Use AI Angle Discovery to find 5 strong angles.'
    },
    {
      title: 'Step 2: Choose a Creator, Auto Choose, or Blend Style',
      body: 'Lock a single creator bio with logos, let AI auto-match your topic, or blend creators by Hook, Structure, and Tone.'
    },
    {
      title: 'Step 3: Select Duration, Niche, Format & Sponsor details',
      body: 'Pick your target duration, topic niche, voiceover/production mode, and optional sponsor callout.'
    },
    {
      title: 'Step 4: Research, Sources & Chapter Outline',
      body: 'Gather verified facts, Pakistani/regional data, books, and quotes, review your dossier cards, and build your chapter-by-chapter outline.'
    },
    {
      title: 'Step 5: Pick Single or Dual Language & Generate',
      body: 'Choose English, Roman Urdu, Proper Urdu, Hindi, Hinglish, or Dual-Language mode and generate your script.'
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-help-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={clsx(
          'relative w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar',
          'rounded-t-[2rem] sm:rounded-[2rem] border shadow-2xl',
          'animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300',
          t.panel
        )}
      >
        <div
          className={clsx(
            'sticky top-0 z-10 flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 pb-4 border-b backdrop-blur',
            t.line,
            isDarkMode ? 'bg-[#1e293b]/95' : 'bg-white/95'
          )}
        >
          <div>
            <h3 id="create-help-title" className={clsx('font-display text-xl sm:text-2xl font-extrabold tracking-tight', t.text)}>
              How Ideograph Studio Works
            </h3>
            <p className={clsx('mt-1 text-sm', t.muted)}>
              4-Pillar Creator Bio + Research Engine + Chapter Outline + Layer-2 Language Policy
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close help"
            className={clsx('shrink-0 w-10 h-10 rounded-full flex items-center justify-center', t.ghostBtn, focusRing)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 sm:px-8 py-6 space-y-6">
          <ol className="space-y-4">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-3.5">
                <span className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-sm font-extrabold flex items-center justify-center shadow">
                  {i + 1}
                </span>
                <div>
                  <div className={clsx('text-sm sm:text-base font-bold', t.text)}>{step.title}</div>
                  <p className={clsx('text-xs sm:text-sm leading-relaxed mt-0.5', t.muted)}>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div
          className={clsx(
            'sticky bottom-0 px-6 sm:px-8 py-4 border-t backdrop-blur',
            t.line,
            isDarkMode ? 'bg-[#1e293b]/95' : 'bg-white/95'
          )}
        >
          <button
            type="button"
            onClick={onClose}
            className={clsx(btnBase, 'w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-95')}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

const Switch: React.FC<{ on: boolean; tone?: 'indigo' | 'blue' }> = ({ on, tone = 'indigo' }) => (
  <span
    aria-hidden="true"
    className={clsx(
      'relative inline-block w-11 h-6 rounded-full shrink-0 transition-colors duration-200',
      on ? (tone === 'blue' ? 'bg-blue-500' : 'bg-indigo-600') : 'bg-slate-300 dark:bg-white/15'
    )}
  >
    <span
      className={clsx(
        'absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
        on && 'translate-x-5'
      )}
    />
  </span>
);

interface CreationFormProps {
  config: GeneratorConfig;
  setConfig: React.Dispatch<React.SetStateAction<GeneratorConfig>>;
  onGenerate: () => void;
  isGenerating: boolean;
  creator: CreatorProfile;
  isDarkMode: boolean;
  userPlan?: UserPlan;
  apiKey?: string;
  onOpenClipper?: () => void;
  onOpenArgumentChecker?: () => void;
  onOpenTemplates?: () => void;
  onLongFormScriptComplete?: (scriptData: ScriptData) => void;
}

const CreationForm: React.FC<CreationFormProps> = ({
  config,
  setConfig,
  onGenerate,
  isGenerating,
  isDarkMode,
  apiKey,
  onOpenClipper,
  onOpenArgumentChecker,
  onOpenTemplates,
  onLongFormScriptComplete
}) => {
  const t = getTokens(isDarkMode);
  const topAnchorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const latestImagesRef = useRef<ReferenceImage[]>(config.referenceImages || []);
  const [isUploading, setIsUploading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showVoiceDrawer, setShowVoiceDrawer] = useState(false);
  const [importNotice, setImportNotice] = useState<{ type: 'info' | 'warning' | 'error'; message: string } | null>(null);

  // Guided Wizard Step:
  // 0 = Professional Homepage Hub (3 Big Feature Boxes: Write a Script, Shorts Clipper, Argument Checker)
  // 1 = Step 1: Define Your Video Topic & Target Criteria
  // 2 = Step 2: Choose Creator Style (Manual with Logos / Auto Match Top 3 / Role-Based Blend)
  // 3 = Step 3: Choose Duration, Format, Niche & Sponsor Details
  // 4 = Step 4: Choose Video Sub-Genre Style & Transcript Routing (when creator has 5-Genre Hierarchy)
  // 5 = Step 5: Research Plan, Sources, Dossier Review & Chapter Outline (Dedicated Section before Script Generation)
  // 6 = Step 6: Choose Output Language (Single or Dual) & Generate Script
  const [wizardStep, setWizardStep] = useState<number>(() =>
    config.templateId || config.topicOrScript.trim() ? 1 : 0
  );

  // Sub-view inside Step 5 (Research & Chapter Outline)
  const [researchSubView, setResearchSubView] = useState<'plan_and_dossier' | 'outline_and_checklist'>('plan_and_dossier');

  // Smart Input & 5-Angle Discovery State
  const [isAnalyzingTopic, setIsAnalyzingTopic] = useState(false);
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSuggestion[]>([]);
  const [selectedAngleIndices, setSelectedAngleIndices] = useState<number[]>([]);
  const [hasShownSuggestions, setHasShownSuggestions] = useState(false);
  const [videoFormatOverride, setVideoFormatOverride] = useState<VideoFormatCategory>('auto');

  // Legacy Pre-Script 5-Part Agency Research Dossier State (preserved)
  const [isHarvestingDossier, setIsHarvestingDossier] = useState(false);

  // Phase A/B & Research Style System State
  const [voiceSelection, setVoiceSelection] = useState<VoiceSelectionState>(() => ({
    mode:
      config.writingMode === 'blend'
        ? 'blend'
        : config.writingMode === 'auto'
        ? 'auto'
        : 'pick',
    pickedCreatorId: config.selectedStyleId || 'raftar',
    blend: {
      creatorIds: [
        config.blendConfig?.primaryCreatorId || 'dhruv-rathee',
        config.blendConfig?.secondaryCreatorIds?.[0] || 'raftar'
      ],
      hookCreatorId: config.blendConfig?.primaryCreatorId || 'dhruv-rathee',
      structureCreatorId: config.blendConfig?.secondaryCreatorIds?.[0] || 'raftar',
      toneCreatorId: config.blendConfig?.primaryCreatorId || 'thynkwhy'
    }
  }));

  const userManuallySelectedNicheRef = useRef<boolean>(Boolean(config.selectedNiche));
  const [selectedNiche, setSelectedNiche] = useState<TopicNiche>(() => {
    if (config.selectedNiche) return config.selectedNiche as TopicNiche;
    const initialTopic = (config.shortTopic || config.topicOrScript || '').trim();
    if (initialTopic) return detectTopicNiche(initialTopic);
    return 'Economy & business';
  });
  const [videoFormat, setVideoFormat] = useState<'Documentary' | 'Explainer' | 'Short'>(
    config.videoFormatMode || 'Documentary'
  );
  const formatKey: ScriptFormatType = videoFormat.toLowerCase() as ScriptFormatType;

  const [durationMinutes, setDurationMinutes] = useState<number>(() =>
    config.durationMinutes || parseDurationToMinutes(config.duration || '10 Minutes (Mini-Doc)')
  );
  const [outputMode, setOutputMode] = useState<'voiceover_only' | 'voiceover_and_production'>(
    config.outputScriptMode || 'voiceover_and_production'
  );

  // Research Plan State
  const [researchConfig, setResearchConfig] = useState<ResearchConfig>(() => ({
    depth: FORMAT_DEFAULT_DEPTH[formatKey] || 'deep',
    region: config.researchV2Config?.region || 'Pakistan',
    sources: {
      officialDataAndReports: true,
      newsAndInvestigations: true,
      booksAndHistory: true,
      globalStudiesAndCounter: true,
      publicVoices: true
    }
  }));

  const [mySources, setMySources] = useState<MySourcesState>(
    () =>
      config.mySources || {
        uploadedFiles: [],
        pastedLinks: [],
        pastedTexts: [],
        selectedBooks: [],
        selectedQuotes: [],
        extractedFacts: [],
        extractedQuotes: []
      }
  );

  const [dossier, setDossier] = useState<Dossier | null>(() => config.dossier || null);
  const [isResearching, setIsResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState<ResearchProgressUpdate | null>(null);
  const [findingMoreCardId, setFindingMoreCardId] = useState<string | null>(null);
  const [isGeneratingBeatPlan, setIsGeneratingBeatPlan] = useState(false);

  // Chapter Outline & Sequential Script State
  const [outline, setOutline] = useState<ChapterOutlineItem[]>(
    () => config.chapterOutline || []
  );
  const [isBuildingOutline, setIsBuildingOutline] = useState(false);
  const [fillingGapChapterId, setFillingGapChapterId] = useState<string | null>(null);
  const [isWritingChapters, setIsWritingChapters] = useState(false);
  const [chapterWriteStatus, setChapterWriteStatus] = useState<string>('');
  const [chapterWritePercent, setChapterWritePercent] = useState<number>(0);

  // Step 4 Transcript & Start/End Architecture Reader state
  const [showTranscriptReader, setShowTranscriptReader] = useState<boolean>(true);
  const [transcriptReaderLang, setTranscriptReaderLang] = useState<'hinglish' | 'urdu' | 'english'>('hinglish');
  const [selectedTranscriptIndex, setSelectedTranscriptIndex] = useState<number>(0);
  const [copiedTranscript, setCopiedTranscript] = useState<boolean>(false);

  // Synchronized Short Topic + Target Criteria helpers
  const shortTopicValue = config.shortTopic ?? '';
  const targetCriteriaValue = config.targetCriteria ?? '';

  const allRecipes = useMemo(() => getAllCreatorRecipes(), [showLibrary]);
  const budget = useMemo(() => computeBudget(durationMinutes, 140), [durationMinutes]);

  const topicText = (shortTopicValue || config.topicOrScript || '').trim();
  const angleText = (targetCriteriaValue || '').trim();

  // Keep voiceSelection synced when config.writingMode or config.selectedStyleId changes
  useEffect(() => {
    const mappedMode =
      config.writingMode === 'blend'
        ? 'blend'
        : config.writingMode === 'auto'
        ? 'auto'
        : 'pick';
    setVoiceSelection(prev => ({
      ...prev,
      mode: mappedMode,
      pickedCreatorId: config.selectedStyleId || prev.pickedCreatorId
    }));
  }, [config.writingMode, config.selectedStyleId]);

  // Keep durationMinutes synced when config.duration changes
  useEffect(() => {
    const parsed = parseDurationToMinutes(config.duration || '10 Minutes (Mini-Doc)');
    if (parsed && parsed !== durationMinutes) {
      setDurationMinutes(parsed);
    }
  }, [config.duration]);

  // Auto-match top 3 creators deterministically
  const matchResult = useMemo(() => {
    return matchCreators({
      niche: selectedNiche,
      topic: `${topicText} ${angleText}`,
      region: researchConfig.region,
      language: config.language || 'Roman Urdu',
      format: formatKey,
      minutes: durationMinutes
    });
  }, [
    selectedNiche,
    topicText,
    angleText,
    researchConfig.region,
    config.language,
    formatKey,
    durationMinutes
  ]);

  const autoMatches = matchResult.topMatches;

  const effectiveVoiceSelection: VoiceSelectionState = useMemo(() => {
    if (voiceSelection.mode === 'auto' && autoMatches.length > 0) {
      return {
        ...voiceSelection,
        autoMatchedCreatorId: autoMatches[0].creatorId
      };
    }
    return voiceSelection;
  }, [voiceSelection, autoMatches]);

  const resolvedVoice = useMemo(
    () => resolveRecipe(effectiveVoiceSelection, durationMinutes),
    [effectiveVoiceSelection, durationMinutes]
  );

  // Resolve ResearchStyle (single source of truth for research & verification)
  const activeResearchStyle = useMemo(
    () =>
      resolveResearchStyle(
        effectiveVoiceSelection,
        config.researchScope,
        durationMinutes
      ),
    [effectiveVoiceSelection, config.researchScope, durationMinutes]
  );

  const voiceDescriptionLines = useMemo(
    () => describeRecipe(resolvedVoice.recipe),
    [resolvedVoice.recipe]
  );

  const researchStyleLines = useMemo(
    () => describeResearchStyle(activeResearchStyle, config.researchScope),
    [activeResearchStyle, config.researchScope]
  );

  const [extraWriterInstructions, setExtraWriterInstructions] = useState<string>(
    () => config.extraWriterInstructions || ''
  );

  const [researchUsedSummary, setResearchUsedSummary] = useState<{
    usedCount: number;
    totalApprovedCount: number;
    unusedFacts: { id: string; claim: string }[];
  } | null>(null);

  // "Before we write" editable 8-line checklist state
  const writerBrief = useMemo(
    () =>
      buildWriterBrief({
        style: activeResearchStyle,
        recipe: resolvedVoice.recipe,
        approvedFacts: dossier?.facts || [],
        budget,
        scope: config.researchScope || activeResearchStyle.defaultScope,
        gaps: dossier?.gaps || [],
        winningLens: dossier?.winningLens,
        extraUserInstructions: extraWriterInstructions
      }),
    [
      activeResearchStyle,
      resolvedVoice.recipe,
      dossier,
      budget,
      config.researchScope,
      extraWriterInstructions
    ]
  );

  const [editableBriefLines, setEditableBriefLines] = useState<string[]>(() =>
    writerBrief.userChecklist.map(c => `${c.label}: ${c.text}`)
  );

  useEffect(() => {
    setEditableBriefLines(
      writerBrief.userChecklist.map(c => `${c.label}: ${c.text}`)
    );
  }, [writerBrief]);

  const composeTopicOrScript = (nextShortTopic: string, nextTargetCriteria: string): string => {
    const cleanShort = nextShortTopic.trim();
    const cleanCriteria = nextTargetCriteria.trim();
    if (cleanShort && cleanCriteria) {
      return `VIDEO TOPIC / WORKING TITLE: ${cleanShort}\n\nTARGET ANGLE, CRITERIA & KEY POINTS TO COVER:\n${cleanCriteria}`;
    }
    return cleanShort || cleanCriteria;
  };

  const handleShortTopicChange = (nextShort: string) => {
    if (!userManuallySelectedNicheRef.current && nextShort.trim().length >= 3) {
      const autoNiche = detectTopicNiche(nextShort);
      setSelectedNiche(autoNiche);
    }
    setConfig(prev => {
      const currentCriteria = prev.targetCriteria ?? '';
      const autoNiche =
        !userManuallySelectedNicheRef.current && nextShort.trim().length >= 3
          ? detectTopicNiche(nextShort)
          : (prev.selectedNiche as TopicNiche) || 'Economy & business';
      return {
        ...prev,
        shortTopic: nextShort,
        selectedNiche: autoNiche,
        topicOrScript: composeTopicOrScript(nextShort, currentCriteria),
        agencyDossier: undefined
      };
    });
    if (hasShownSuggestions) {
      setTopicSuggestions([]);
      setSelectedAngleIndices([]);
      setHasShownSuggestions(false);
    }
  };

  const handleTargetCriteriaChange = (nextCriteria: string) => {
    const currentShort = config.shortTopic ?? '';
    if (!userManuallySelectedNicheRef.current && !currentShort.trim() && nextCriteria.trim().length >= 3) {
      const autoNiche = detectTopicNiche(nextCriteria);
      setSelectedNiche(autoNiche);
    }
    setConfig(prev => {
      const currentShort = prev.shortTopic ?? '';
      const autoNiche =
        !userManuallySelectedNicheRef.current && !currentShort.trim() && nextCriteria.trim().length >= 3
          ? detectTopicNiche(nextCriteria)
          : (prev.selectedNiche as TopicNiche) || 'Economy & business';
      return {
        ...prev,
        targetCriteria: nextCriteria,
        selectedNiche: autoNiche,
        topicOrScript: composeTopicOrScript(currentShort, nextCriteria),
        agencyDossier: undefined
      };
    });
  };

  const isScriptMode = config.topicOrScript.length > 200;
  const wordCount = config.topicOrScript.trim() ? config.topicOrScript.trim().split(/\s+/).length : 0;
  const truncationThreshold = config.writingMode === 'auto' ? 30000 : 500000;
  const willTruncate = config.topicOrScript.length > truncationThreshold;

  const closeHelp = useCallback(() => setShowHelp(false), []);

  // Jump to Step 1 automatically if user loaded a template
  useEffect(() => {
    if (config.templateId && wizardStep === 0) {
      setWizardStep(1);
    }
  }, [config.templateId, wizardStep]);

  // Keep ref updated for unmount cleanup (B-30)
  useEffect(() => {
    latestImagesRef.current = config.referenceImages || [];
  }, [config.referenceImages]);

  // Revoke object URLs on unmount (B-30)
  useEffect(() => {
    return () => {
      latestImagesRef.current.forEach(img => {
        if (img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
    };
  }, []);

  const currentCreator = CREATORS.find(c => c.id === config.selectedStyleId) || CREATORS[0];
  const hasGenreStep = config.writingMode !== 'auto' && hasCreatorGenreHierarchy(currentCreator);
  const activeTemplate = config.templateId ? TEMPLATES.find(tpl => tpl.id === config.templateId) : undefined;

  // Strict Idea-First Gate: Never allow advancing past Idea page if no idea is written
  useEffect(() => {
    if (wizardStep > 1 && !config.topicOrScript.trim()) {
      setWizardStep(1);
    }
  }, [wizardStep, config.topicOrScript]);

  // Never show Step 4 when a creator without a 5-Genre Hierarchy is selected
  useEffect(() => {
    if (wizardStep === 4 && !hasGenreStep) {
      setWizardStep(5);
    }
  }, [wizardStep, hasGenreStep]);

  // Always scroll to the very top whenever moving to the next/previous step in the studio
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const scrollAllToTop = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } catch {
        window.scrollTo(0, 0);
      }
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const rootEl = document.getElementById('root');
      if (rootEl) rootEl.scrollTop = 0;
      const mainEl = document.querySelector('main');
      if (mainEl) mainEl.scrollTop = 0;
    };

    scrollAllToTop();
    const rafId = window.requestAnimationFrame(scrollAllToTop);
    return () => window.cancelAnimationFrame(rafId);
  }, [wizardStep]);

  // Sponsor validation (B-31)
  const isSponsorInvalid = Boolean(
    config.sponsorInfo?.enabled &&
      (!config.sponsorInfo.name?.trim() || !config.sponsorInfo.message?.trim())
  );

  const updateConfig = (key: keyof GeneratorConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    if (key === 'topicOrScript' && hasShownSuggestions) {
      setTopicSuggestions([]);
      setHasShownSuggestions(false);
    }
  };

  const activeResearchConfig: ResearchConfig = config.researchConfig || DEFAULT_AGENCY_RESEARCH_CONFIG;

  const setResearchEngineMode = (mode: ResearchEngineMode) => {
    const modePresets: Record<ResearchEngineMode, ResearchConfig['sources']> = {
      pakistani_ground_expose: {
        booksAndHistoricalParables: true,
        localPakistaniAndRegionalData: true,
        redditAndCitizenGroundVoices: true,
        globalStudiesAndCounterArguments: false
      },
      books_archival_parables: {
        booksAndHistoricalParables: true,
        localPakistaniAndRegionalData: true,
        redditAndCitizenGroundVoices: false,
        globalStudiesAndCounterArguments: true
      },
      global_scientific_audit: {
        booksAndHistoricalParables: false,
        localPakistaniAndRegionalData: false,
        redditAndCitizenGroundVoices: false,
        globalStudiesAndCounterArguments: true
      },
      full_agency_harvester: {
        booksAndHistoricalParables: true,
        localPakistaniAndRegionalData: true,
        redditAndCitizenGroundVoices: true,
        globalStudiesAndCounterArguments: true
      }
    };
    setConfig(prev => ({
      ...prev,
      agencyDossier: undefined,
      researchConfig: {
        depth: 'deep_agency',
        mode,
        sources: modePresets[mode]
      }
    }));
  };

  const toggleResearchSource = (sourceKey: keyof ResearchConfig['sources']) => {
    setConfig(prev => {
      const current = prev.researchConfig || DEFAULT_AGENCY_RESEARCH_CONFIG;
      return {
        ...prev,
        agencyDossier: undefined,
        researchConfig: {
          ...current,
          depth: 'deep_agency',
          sources: {
            ...current.sources,
            [sourceKey]: !current.sources[sourceKey]
          }
        }
      };
    });
  };

  const handleHarvestPreScriptDossier = async () => {
    const queryTopic = (shortTopicValue || config.topicOrScript).trim();
    if (!queryTopic) return;
    setIsHarvestingDossier(true);
    setImportNotice(null);
    try {
      const dossierRes: AgencyResearchDossier = await harvestAgencyResearchDossier({
        shortTopic: shortTopicValue,
        targetCriteria: targetCriteriaValue,
        topicOrScript: config.topicOrScript,
        creatorName: currentCreator.name,
        creatorId: currentCreator.id,
        researchConfig: activeResearchConfig,
        apiKey
      });
      setConfig(prev => ({ ...prev, agencyDossier: dossierRes }));
    } catch (err: any) {
      console.error('Agency Dossier Harvester failed:', err);
      setImportNotice({
        type: 'error',
        message: err?.message || 'Could not harvest pre-script dossier. Please check your Gemini API key in Settings.'
      });
    } finally {
      setIsHarvestingDossier(false);
    }
  };

  const handlePrimaryCreatorSelect = (creatorId: string) => {
    const isAgencyInvestigativeCreator = ['raftar', 'thynkwhy', 'dhruvrathee', 'nitishrajput'].some(id =>
      creatorId.toLowerCase().includes(id)
    );
    const resolvedRegionScope = resolveCreatorResearchRegion(
      creatorId,
      shortTopicValue || config.topicOrScript
    );
    const targetRegionLabel =
      resolvedRegionScope === 'india_and_global'
        ? 'India'
        : resolvedRegionScope === 'pakistan'
        ? 'Pakistan'
        : 'Global';

    setResearchConfig(prev => ({
      ...prev,
      region: targetRegionLabel
    }));

    setVoiceSelection(prev => ({
      ...prev,
      pickedCreatorId: creatorId,
      blend: {
        ...prev.blend,
        hookCreatorId: creatorId
      }
    }));
    setConfig(prev => ({
      ...prev,
      selectedStyleId: creatorId,
      subGenreId: 'auto',
      blendConfig: {
        primaryCreatorId: creatorId,
        secondaryCreatorIds: prev.blendConfig.secondaryCreatorIds.filter(id => id !== creatorId)
      },
      researchConfig: isAgencyInvestigativeCreator
        ? {
            depth: 'deep_agency',
            mode: 'full_agency_harvester',
            region: targetRegionLabel,
            sources: {
              booksAndHistoricalParables: true,
              localPakistaniAndRegionalData: true,
              redditAndCitizenGroundVoices: true,
              globalStudiesAndCounterArguments: true
            }
          }
        : prev.researchConfig || DEFAULT_AGENCY_RESEARCH_CONFIG
    }));
  };

  const handleSelectMinutes = (mins: number) => {
    const clamped = Math.max(1, Math.min(60, mins));
    setDurationMinutes(clamped);
    setConfig(prev => ({
      ...prev,
      durationMinutes: clamped,
      duration: formatMinutesToDurationLabel(clamped)
    }));
  };

  const handleRunResearch = async (extraOptions?: {
    scopeMode?: 'local' | 'global' | 'both';
    scope?: 'ground' | 'abroad' | 'both';
    togglesLevel?: Record<string, 0 | 0.5 | 1 | 1.5>;
    customQuestions?: string[];
    questionMode?: 'auto_topic' | 'custom' | 'none';
    includeTerms?: string[];
    avoidTerms?: string[];
    userPlaybookNotes?: string;
    conceptPremise?: string;
    conceptStakes?: string;
    conceptEscalation?: string;
  }) => {
    setIsResearching(true);
    try {
      const effectiveDepth =
        researchConfig.depth === 'quick' ||
        researchConfig.depth === 'standard' ||
        researchConfig.depth === 'deep'
          ? researchConfig.depth
          : 'standard';

      const effectiveScope =
        extraOptions?.scope ||
        (extraOptions?.scopeMode === 'local'
          ? 'ground'
          : extraOptions?.scopeMode === 'global'
          ? 'abroad'
          : activeResearchStyle.defaultScope);

      const resolvedQuestionMode = extraOptions?.questionMode || 'auto_topic';
      const resolvedQuestions =
        resolvedQuestionMode === 'none'
          ? []
          : extraOptions?.customQuestions && extraOptions.customQuestions.length > 0
          ? extraOptions.customQuestions
          : buildSmartTopicQuestions({
              topic: topicText || 'Investigative Documentary Topic',
              brief: angleText || topicText,
              style: activeResearchStyle,
              region: researchConfig.region || 'Pakistan'
            });

      const pipelineResult = await runResearchPipeline({
        topic: topicText || 'Investigative Documentary Topic',
        brief: angleText || topicText,
        angles: angleText ? [angleText] : [],
        minutes: durationMinutes,
        format: videoFormat,
        depth: effectiveDepth,
        scope: effectiveScope,
        style: activeResearchStyle,
        questions: resolvedQuestions,
        includeWords: extraOptions?.includeTerms || [],
        avoidWords: extraOptions?.avoidTerms || [],
        togglesLevel: extraOptions?.togglesLevel || {},
        userSources: [],
        userStoriesAndNumbers: extraOptions?.userPlaybookNotes,
        conceptInputs: {
          idea: extraOptions?.conceptPremise,
          budgetOrLimits: extraOptions?.conceptEscalation,
          prizeOrStakes: extraOptions?.conceptStakes
        },
        narrationLanguage: config.language || 'Roman Urdu',
        region: researchConfig.region || 'Pakistan',
        apiKey,
        onProgress: p =>
          setResearchProgress({
            stage: 'collecting',
            label: p.message,
            completedQueries: p.searchingDone,
            totalQueries: Math.max(1, p.searchingTotal),
            factsFoundSoFar: p.factsFound,
            percent: Math.round(
              (p.searchingDone / Math.max(1, p.searchingTotal)) * 100
            )
          })
      });

      const resultDossier = toLegacyDossier(pipelineResult, {
        topic: topicText || 'Investigative Documentary Topic',
        angle: angleText || topicText,
        minutes: durationMinutes
      });

      setDossier(resultDossier);
      setConfig(prev => ({
        ...prev,
        dossier: resultDossier,
        mySources,
        researchV2Config: researchConfig,
        researchScope: effectiveScope,
        researchPlanOverrides: {
          toggles: extraOptions?.togglesLevel,
          questions: resolvedQuestions,
          questionMode: resolvedQuestionMode,
          includeWords: extraOptions?.includeTerms,
          avoidWords: extraOptions?.avoidTerms,
          depth: effectiveDepth,
          userStoriesAndNumbers: extraOptions?.userPlaybookNotes,
          conceptIdea: extraOptions?.conceptPremise,
          conceptBudget: extraOptions?.conceptEscalation,
          conceptPrize: extraOptions?.conceptStakes
        }
      }));
    } catch (err) {
      console.error('Research pipeline fallback:', err);
      try {
        const fallbackDossier = await runResearch({
          topic: topicText || 'Investigative Documentary Topic',
          angle: angleText || topicText,
          durationMinutes,
          language: config.language || 'Roman Urdu',
          config: researchConfig,
          mySources,
          recipe: resolvedVoice.recipe,
          apiKey,
          onProgress: state => setResearchProgress(state)
        });
        setDossier(fallbackDossier);
        setConfig(prev => ({
          ...prev,
          dossier: fallbackDossier,
          mySources,
          researchV2Config: researchConfig
        }));
      } catch (innerErr) {
        console.error('Fallback research error:', innerErr);
      }
    } finally {
      setIsResearching(false);
    }
  };

  const handleFindMoreLikeCard = async (card: any) => {
    if (!dossier) return;
    setFindingMoreCardId(card.id);
    try {
      const moreFacts = await findMoreLikeCard({
        card,
        topic: topicText || dossier.topic,
        region: researchConfig.region,
        existingCount: dossier.facts.length,
        apiKey
      });
      if (moreFacts.length > 0) {
        const nextDossier: Dossier = {
          ...dossier,
          facts: [...dossier.facts, ...moreFacts]
        };
        setDossier(nextDossier);
        setConfig(prev => ({ ...prev, dossier: nextDossier }));
      }
    } catch (err) {
      console.error('Find more error:', err);
    } finally {
      setFindingMoreCardId(null);
    }
  };

  const handleLockDossierAndBuildOutline = async () => {
    if (!dossier) return;
    setIsGeneratingBeatPlan(true);
    setIsBuildingOutline(true);
    try {
      const beatPlan = await generateBeatPlan({
        dossier,
        durationMinutes,
        language: config.language || 'Roman Urdu',
        creatorName: resolvedVoice.recipe.creatorName,
        apiKey
      });
      const lockedDossier: Dossier = {
        ...dossier,
        lockedAt: new Date().toISOString()
      };
      setDossier(lockedDossier);

      const activeQuestionsForOutline =
        config.researchPlanOverrides?.questionMode === 'none'
          ? []
          : config.researchPlanOverrides?.questions;

      const generatedOutline = await buildOutline({
        topic: topicText || dossier.topic,
        angle: angleText || dossier.angle,
        language: config.language || 'Roman Urdu',
        recipe: resolvedVoice.recipe,
        dossier: lockedDossier,
        budget,
        questions: activeQuestionsForOutline,
        apiKey
      });
      setOutline(generatedOutline);
      setConfig(prev => ({
        ...prev,
        dossier: lockedDossier,
        beatPlan,
        chapterOutline: generatedOutline
      }));
      setResearchSubView('outline_and_checklist');
    } catch (err) {
      console.error('Outline build error:', err);
    } finally {
      setIsGeneratingBeatPlan(false);
      setIsBuildingOutline(false);
    }
  };

  const handleFillChapterGap = async (chapter: ChapterOutlineItem) => {
    if (!dossier) return;
    setFillingGapChapterId(chapter.id);
    try {
      const needed = Math.max(2, 3 - chapter.assignedFactIds.length);
      const newFacts = await runChapterGapFill({
        chapterTitle: chapter.title,
        chapterPurpose: chapter.purpose,
        topic: topicText || dossier.topic,
        region: researchConfig.region,
        existingFactCount: dossier.facts.length,
        neededFacts: needed,
        apiKey
      });

      if (newFacts.length > 0) {
        const updatedDossier: Dossier = {
          ...dossier,
          facts: [...dossier.facts, ...newFacts]
        };
        const updatedOutline = outline.map(o =>
          o.id === chapter.id
            ? {
                ...o,
                assignedFactIds: [...o.assignedFactIds, ...newFacts.map(f => f.id)],
                gapWarning: undefined
              }
            : o
        );
        setDossier(updatedDossier);
        setOutline(updatedOutline);
        setConfig(prev => ({
          ...prev,
          dossier: updatedDossier,
          chapterOutline: updatedOutline
        }));
      }
    } catch (err) {
      console.error('Chapter gap fill error:', err);
    } finally {
      setFillingGapChapterId(null);
    }
  };

  const handleMoveChapter = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= outline.length) return;
    const next = [...outline];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    const renumbered = next.map((c, idx) => ({
      ...c,
      chapterNumber: idx + 1,
      id: `CHAP-${idx + 1}`
    }));
    setOutline(renumbered);
  };

  const handleWriteFullLongFormDocumentary = async () => {
    if (!dossier) return;
    setIsWritingChapters(true);
    setChapterWritePercent(5);

    try {
      let activeOutline = outline;
      if (activeOutline.length === 0) {
        setChapterWriteStatus('Building chapter outline & assigning facts...');
        const activeQuestionsForOutline =
          config.researchPlanOverrides?.questionMode === 'none'
            ? []
            : config.researchPlanOverrides?.questions;
        activeOutline = await buildOutline({
          topic: topicText || dossier.topic,
          angle: angleText || dossier.angle,
          language: config.language || 'Roman Urdu',
          recipe: resolvedVoice.recipe,
          dossier,
          budget,
          questions: activeQuestionsForOutline,
          apiKey
        });
        setOutline(activeOutline);
      }

      const writtenChapters: WrittenChapterResult[] = [];
      const storySoFar: string[] = [];
      const usedLedger = {
        factIds: [] as string[],
        quoteIds: [] as string[],
        bookIds: [] as string[],
        keyPhrases: [] as string[]
      };

      const customContractInstruction = `${writerBrief.modelInstruction}\n\nUSER-EDITED CHECKLIST:\n${editableBriefLines
        .map((l, idx) => `${idx + 1}. ${l}`)
        .join('\n')}${
        extraWriterInstructions.trim()
          ? `\n\nEXTRA USER INSTRUCTIONS:\n${extraWriterInstructions.trim()}`
          : ''
      }`;

      for (let i = 0; i < activeOutline.length; i++) {
        const chap = activeOutline[i];
        const pct = Math.round(10 + (i / activeOutline.length) * 65);
        setChapterWritePercent(pct);
        setChapterWriteStatus(
          `Writing Chapter ${chap.chapterNumber} of ${activeOutline.length}: "${chap.title}" (~${chap.targetWords} words)...`
        );

        const result = await writeChapter({
          chapter: chap,
          chapterIndex: i,
          totalChapters: activeOutline.length,
          topic: topicText || dossier.topic,
          angle: `${angleText || dossier.angle}\n\n${customContractInstruction}`,
          language: config.language || 'Roman Urdu',
          recipe: resolvedVoice.recipe,
          dossier,
          storySoFar,
          usedLedger,
          apiKey
        });

        writtenChapters.push(result);
        storySoFar.push(result.summary2Lines);
        usedLedger.factIds.push(...result.usedFactIds);
        usedLedger.quoteIds.push(...result.usedQuoteIds);
        usedLedger.bookIds.push(...result.usedBookIds);
      }

      setChapterWritePercent(80);
      setChapterWriteStatus(
        'Writing Cold Open Hook Variants (using finished chapter summaries so every promise is paid off)...'
      );

      const hookData = await writeHook({
        topic: topicText || dossier.topic,
        angle: angleText || dossier.angle,
        language: config.language || 'Roman Urdu',
        recipe: resolvedVoice.recipe,
        chapterResults: writtenChapters,
        dossier,
        apiKey
      });

      setChapterWritePercent(90);
      setChapterWriteStatus('Stitching chapters & checking length, citations, and open loops...');

      const stitched = stitchChapters({
        hookText: hookData.activeHookText,
        hookVariants: hookData.variants,
        chapterResults: writtenChapters,
        outline: activeOutline
      });

      let productionRows = undefined;
      if (outputMode === 'voiceover_and_production') {
        setChapterWritePercent(95);
        setChapterWriteStatus(
          'Building ~2.3x Production Script table (B-roll, visuals, on-screen text)...'
        );
        productionRows = await buildProductionScript({
          topic: topicText || dossier.topic,
          language: config.language || 'Roman Urdu',
          hookText: hookData.activeHookText,
          chapterResults: writtenChapters,
          dossier,
          recipe: resolvedVoice.recipe,
          apiKey
        });
      }

      const qaReport = runScriptQAPass({
        scriptText: stitched.fullVoiceoverText,
        dossier,
        durationMinutes
      });

      const usedReport = computeResearchUsedReport({
        approvedFacts: dossier.facts,
        chapters: writtenChapters,
        hookText: hookData.activeHookText
      });

      setResearchUsedSummary({
        usedCount: usedReport.usedCount,
        totalApprovedCount: usedReport.totalApprovedCount,
        unusedFacts: usedReport.unusedFacts.map(f => ({ id: f.id, claim: f.claim }))
      });

      const segments = [
        {
          visual: 'Cold Open Hook — High-contrast documentary opening frame',
          audio: hookData.activeHookText
        },
        ...writtenChapters.map(c => ({
          visual: c.visualCue || `Chapter ${c.chapterNumber}: ${c.title}`,
          audio: c.text
        }))
      ];

      const summaryLine = `Used ${usedReport.usedCount} of ${usedReport.totalApprovedCount} approved facts`;

      const finalScriptData: ScriptData = {
        id: `DOC-${Date.now()}`,
        title: topicText || dossier.topic || 'Investigative Documentary',
        detectedIntent: activeResearchStyle.intent,
        targetAudience: activeResearchStyle.audience,
        segments,
        ctas: [
          `${writtenChapters[writtenChapters.length - 1]?.summary2Lines || ''} (${summaryLine})`
        ],
        createdAt: new Date().toISOString(),
        creatorId: resolvedVoice.recipe.creatorId.replace('custom-', ''),
        creatorName: resolvedVoice.recipe.creatorName,
        creatorStyle: activeResearchStyle.displayName,
        language: config.language || 'Roman Urdu',
        duration: formatMinutesToDurationLabel(durationMinutes),
        type: config.platform || 'YouTube Long Form',
        topic: topicText || dossier.topic,
        dossier,
        qaReport,
        chapterOutline: activeOutline,
        chapters: writtenChapters,
        hookVariants: hookData.variants,
        productionRows,
        versions: [
          {
            id: `VER-${Date.now()}`,
            label: `Initial ${durationMinutes}-min ${resolvedVoice.recipe.creatorName} script (${stitched.totalWords} words · ${summaryLine})`,
            timestamp: new Date().toISOString(),
            scriptText: stitched.fullVoiceoverText,
            wordCount: stitched.totalWords,
            segments,
            chapters: writtenChapters,
            productionRows
          }
        ]
      };

      setChapterWritePercent(100);
      setChapterWriteStatus('Complete! Opening Script Workspace...');
      if (onLongFormScriptComplete) {
        onLongFormScriptComplete(finalScriptData);
      } else {
        onGenerate();
      }
    } catch (err) {
      console.error('Long-form script writer error:', err);
    } finally {
      setIsWritingChapters(false);
    }
  };

  const detectedFormatCategory = detectTopicVideoCategory(
    shortTopicValue || config.topicOrScript,
    config.writingMode === 'auto' ? undefined : config.selectedStyleId
  );
  const effectiveVideoCategory: Exclude<VideoFormatCategory, 'auto'> =
    videoFormatOverride === 'auto' ? detectedFormatCategory : videoFormatOverride;

  const isDocumentaryCreatorSelected =
    config.writingMode !== 'auto' &&
    ['raftar', 'thynkwhy', 'dhruvrathee', 'nitishrajput', 'veritasium'].some(id =>
      config.selectedStyleId.toLowerCase().includes(id)
    );
  const isDocumentaryContext =
    effectiveVideoCategory === 'documentary' || isDocumentaryCreatorSelected;

  const handleSmartAnalyze = async (
    overrideShortTopic?: string,
    overrideCategory?: VideoFormatCategory
  ) => {
    const queryTopic = (overrideShortTopic ?? (shortTopicValue || config.topicOrScript)).trim();
    if (!queryTopic || queryTopic.length < 3) return;
    setIsAnalyzingTopic(true);
    setImportNotice(null);
    try {
      const categoryToUse = overrideCategory ?? effectiveVideoCategory;
      const suggestions = await analyzeTopicWithGemini(
        queryTopic,
        config.platform,
        apiKey,
        undefined,
        {
          targetCriteria: targetCriteriaValue,
          videoCategory: categoryToUse,
          creatorId: config.writingMode === 'auto' ? undefined : config.selectedStyleId
        }
      );
      setTopicSuggestions(suggestions);
      setSelectedAngleIndices([]);
      setHasShownSuggestions(true);
    } catch (e: any) {
      console.error('Smart Analysis Failed', e);
      setImportNotice({
        type: 'error',
        message: e?.message || 'Could not discover video angles. Please check your Gemini API key in Settings.'
      });
    } finally {
      setIsAnalyzingTopic(false);
    }
  };

  const toggleAngleCardSelection = (suggestion: TopicSuggestion, idx: number) => {
    const angleHeader = `[${suggestion.angleCategory || `Angle ${idx + 1}`}] ${suggestion.refinedTopic}`;
    const bulletPoints = (suggestion.criteriaPoints || []).map(pt => `• ${pt}`).join('\n');
    const proofLine = suggestion.pakistaniOrGroundProofPreview
      ? `• Ground Proof / Data Sources: ${suggestion.pakistaniOrGroundProofPreview}`
      : '';
    const formattedBlock = [
      angleHeader,
      `Thesis: ${suggestion.reason}`,
      bulletPoints,
      proofLine
    ]
      .filter(Boolean)
      .join('\n');

    const alreadySelected = selectedAngleIndices.includes(idx);
    let nextIndices: number[];
    let nextCriteria = targetCriteriaValue.trim();

    if (alreadySelected) {
      nextIndices = selectedAngleIndices.filter(i => i !== idx);
      nextCriteria = nextCriteria.replace(formattedBlock, '').replace(/\n{3,}/g, '\n\n').trim();
    } else {
      nextIndices = [...selectedAngleIndices, idx];
      nextCriteria = nextCriteria ? `${nextCriteria}\n\n${formattedBlock}` : formattedBlock;
    }

    setSelectedAngleIndices(nextIndices);
    const nextShort = shortTopicValue.trim() || suggestion.refinedTopic;
    setConfig(prev => ({
      ...prev,
      shortTopic: nextShort,
      targetCriteria: nextCriteria,
      topicOrScript: composeTopicOrScript(nextShort, nextCriteria),
      agencyDossier: undefined
    }));
  };

  const handleSponsorChange = (key: string, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      sponsorInfo: {
        enabled: prev.sponsorInfo?.enabled ?? false,
        name: prev.sponsorInfo?.name ?? '',
        product: prev.sponsorInfo?.product ?? '',
        message: prev.sponsorInfo?.message ?? '',
        disclosure: prev.sponsorInfo?.disclosure ?? true,
        [key]: value
      }
    }));
  };

  const toggleSecondaryCreator = (creatorId: string) => {
    if (creatorId === config.selectedStyleId) return;
    const current = config.blendConfig.secondaryCreatorIds.filter(id => id !== config.selectedStyleId);
    const isSelected = current.includes(creatorId);
    let newSelection: string[] = [];

    if (isSelected) {
      newSelection = current.filter(id => id !== creatorId);
    } else {
      if (current.length >= MAX_SECONDARIES) return;
      newSelection = [...current, creatorId];
    }

    setVoiceSelection(prev => ({
      ...prev,
      blend: {
        ...prev.blend,
        structureCreatorId: newSelection[0] || prev.blend.structureCreatorId,
        toneCreatorId: newSelection[1] || newSelection[0] || prev.blend.toneCreatorId,
        creatorIds: [config.selectedStyleId, ...newSelection]
      }
    }));

    setConfig(prev => ({
      ...prev,
      blendConfig: {
        ...prev.blendConfig,
        primaryCreatorId: prev.selectedStyleId,
        secondaryCreatorIds: newSelection
      }
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportNotice(null);

    if (file.size > MAX_IMPORT_BYTES) {
      setImportNotice({
        type: 'error',
        message: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum supported size is 15 MB.`
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    let extractedText = '';

    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        if (pdf.numPages > MAX_PDF_PAGES) {
          setImportNotice({
            type: 'error',
            message: `This PDF has ${pdf.numPages} pages (limit is ${MAX_PDF_PAGES} pages). Please upload a shorter document or paste the relevant section.`
          });
          return;
        }

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str || '').join(' ').trim();
          if (pageText) {
            extractedText += pageText + '\n\n';
          }
        }

        if (!extractedText.trim()) {
          setImportNotice({
            type: 'warning',
            message:
              'Scanned PDF detected (no selectable text layer found). Please paste the text or upload a text-based PDF/DOCX.'
          });
          return;
        }
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.toLowerCase().endsWith('.docx')
      ) {
        const mammothModule = await import('mammoth');
        const mammothLib = mammothModule.default || mammothModule;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammothLib.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        extractedText = await file.text();
      } else {
        setImportNotice({
          type: 'error',
          message: 'Unsupported file format. Please upload a PDF, DOCX, or TXT file.'
        });
        return;
      }

      const cleaned = extractedText.trim();
      if (cleaned) {
        const words = cleaned.split(/\s+/).length;
        const nextShort = shortTopicValue.trim() || file.name.replace(/\.[^.]+$/, '');
        setConfig(prev => ({
          ...prev,
          shortTopic: nextShort,
          targetCriteria: cleaned,
          topicOrScript: composeTopicOrScript(nextShort, cleaned),
          duration: 'Match Original Length',
          transformationType: 'Full Rewrite',
          agencyDossier: undefined
        }));
        setImportNotice({
          type: cleaned.length > truncationThreshold ? 'warning' : 'info',
          message:
            cleaned.length > truncationThreshold
              ? `Imported ${words.toLocaleString()} words (${cleaned.length.toLocaleString()} chars) from "${file.name}". Note: Input exceeds ${truncationThreshold.toLocaleString()} chars and will be truncated during generation.`
              : `Imported ${words.toLocaleString()} words (${cleaned.length.toLocaleString()} chars) from "${file.name}" into your Target Criteria & Notes.`
        });
      } else {
        setImportNotice({
          type: 'warning',
          message: 'No readable text could be extracted from this file.'
        });
      }
    } catch (error: any) {
      console.error(error);
      setImportNotice({
        type: 'error',
        message: `Could not read "${file.name}". Please try a TXT/DOCX file or paste the text directly.`
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: ReferenceImage[] = [];
    const MAX_IMAGES = 4;
    const currentCount = config.referenceImages?.length || 0;
    const remainingSlots = MAX_IMAGES - currentCount;

    if (remainingSlots <= 0) {
      setImportNotice({
        type: 'warning',
        message: 'Maximum 4 reference images allowed.'
      });
      return;
    }

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const rawBase64 = base64String.split(',')[1];

        newImages.push({
          id: crypto.randomUUID(),
          data: rawBase64,
          mimeType: file.type,
          previewUrl: URL.createObjectURL(file)
        });
      } catch (err) {
        console.error('Failed to process image', err);
      }
    }

    updateConfig('referenceImages', [...(config.referenceImages || []), ...newImages]);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeImage = (id: string) => {
    const target = (config.referenceImages || []).find(img => img.id === id);
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
    }
    updateConfig('referenceImages', (config.referenceImages || []).filter(img => img.id !== id));
  };

  const clearTemplate = () => {
    setConfig(prev => ({
      ...prev,
      templateId: undefined,
      templateOutline: undefined
    }));
  };

  const secondaryIds = config.blendConfig.secondaryCreatorIds.filter(id => id !== config.selectedStyleId);
  const atSecondaryLimit = secondaryIds.length >= MAX_SECONDARIES;
  const refCount = config.referenceImages?.length || 0;

  const creatorSubGenres = getSubGenreBlueprintsForCreator(currentCreator);
  const autoDetectedRoute = matchCreatorSubGenreAndTranscript(
    currentCreator,
    config.topicOrScript,
    'auto'
  );

  const noticeTone =
    importNotice?.type === 'error'
      ? 'bg-rose-500/10 border-rose-500/30 ' + (isDarkMode ? 'text-rose-300' : 'text-rose-700')
      : importNotice?.type === 'warning'
      ? 'bg-amber-500/10 border-amber-500/30 ' + (isDarkMode ? 'text-amber-300' : 'text-amber-800')
      : 'bg-emerald-500/10 border-emerald-500/30 ' + (isDarkMode ? 'text-emerald-300' : 'text-emerald-800');

  /* ==========================================================================
   * STAGE 0: PROFESSIONAL HOMEPAGE HUB (3 BIG INTERACTIVE BOXES)
   * ======================================================================== */
  if (wizardStep === 0) {
    return (
      <div ref={topAnchorRef} className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12 font-sans">
        <HowItWorksDialog open={showHelp} onClose={closeHelp} isDarkMode={isDarkMode} />

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
          {/* Hero Heading with Continuous Animation */}
          <header className="text-center max-w-4xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-3">
              <Sparkles size={15} className="animate-spin" style={{ animationDuration: '8s' }} />
              <span>4-Pillar Creator Bio • Research Engine • Layer-2 Language Policy</span>
            </div>

            <h1
              className={clsx(
                'font-display text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-4',
                'bg-clip-text text-transparent bg-gradient-to-r animate-gradient',
                isDarkMode
                  ? 'from-white via-indigo-300 to-purple-300'
                  : 'from-slate-900 via-indigo-600 to-purple-700'
              )}
            >
              Ideograph Studio
            </h1>

            <p
              className={clsx(
                'text-base sm:text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed',
                t.muted
              )}
            >
              Turn any raw idea, research topic, or draft into a broadcast-ready creator script, viral vertical Shorts, or stress-tested investigative argument.
            </p>
          </header>

          {/* 3 Main Interactive Studio Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Box 1: Write a Script */}
            <button
              type="button"
              onClick={() => setWizardStep(1)}
              className={clsx(
                'group relative text-left rounded-[2rem] border p-7 sm:p-8 transition-all duration-300',
                'hover:-translate-y-1.5 hover:shadow-2xl hover:border-indigo-500/60 flex flex-col justify-between min-h-[290px]',
                isDarkMode
                  ? 'bg-gradient-to-br from-[#0f172a] via-[#131c36] to-indigo-950/40 border-white/10 shadow-xl shadow-black/30'
                  : 'bg-gradient-to-br from-white via-indigo-50/40 to-purple-50/50 border-slate-200/90 shadow-lg',
                focusRing
              )}
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Wand2 size={26} />
                </div>
                <h2 className={clsx('font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-2.5', t.text)}>
                  Write a Script
                </h2>
                <p className={clsx('text-sm sm:text-base leading-relaxed', t.muted)}>
                  Craft a complete creator script step-by-step: describe your idea, pick or blend a creator with logos, set duration &amp; budget, run deep research &amp; chapter outlines, and generate in any language.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-sm font-extrabold text-indigo-500 dark:text-indigo-400">
                <span>Start Guided Script Studio</span>
                <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </button>

            {/* Box 2: Shorts Clipper */}
            <button
              type="button"
              onClick={() => onOpenClipper?.()}
              className={clsx(
                'group relative text-left rounded-[2rem] border p-7 sm:p-8 transition-all duration-300',
                'hover:-translate-y-1.5 hover:shadow-2xl hover:border-purple-500/60 flex flex-col justify-between min-h-[290px]',
                isDarkMode
                  ? 'bg-gradient-to-br from-[#0f172a] via-[#1b1536] to-purple-950/40 border-white/10 shadow-xl shadow-black/30'
                  : 'bg-gradient-to-br from-white via-purple-50/40 to-pink-50/50 border-slate-200/90 shadow-lg',
                focusRing
              )}
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Scissors size={26} />
                </div>
                <h2 className={clsx('font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-2.5', t.text)}>
                  Shorts Clipper
                </h2>
                <p className={clsx('text-sm sm:text-base leading-relaxed', t.muted)}>
                  Convert any long-form script or draft into high-retention 9:16 vertical Shorts &amp; Reels with standalone hooks, pacing, and safe-zone visuals.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-sm font-extrabold text-purple-500 dark:text-purple-400">
                <span>Open Shorts Clipper</span>
                <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </button>

            {/* Box 3: Argument Checker */}
            <button
              type="button"
              onClick={() => onOpenArgumentChecker?.()}
              className={clsx(
                'group relative text-left rounded-[2rem] border p-7 sm:p-8 transition-all duration-300',
                'hover:-translate-y-1.5 hover:shadow-2xl hover:border-sky-500/60 flex flex-col justify-between min-h-[290px]',
                isDarkMode
                  ? 'bg-gradient-to-br from-[#0f172a] via-[#0f2438] to-sky-950/40 border-white/10 shadow-xl shadow-black/30'
                  : 'bg-gradient-to-br from-white via-sky-50/40 to-emerald-50/50 border-slate-200/90 shadow-lg',
                focusRing
              )}
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Scale size={26} />
                </div>
                <h2 className={clsx('font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-2.5', t.text)}>
                  Argument Checker
                </h2>
                <p className={clsx('text-sm sm:text-base leading-relaxed', t.muted)}>
                  Stress-test your script claims against Devil&apos;s Advocate counter-arguments, logic gaps, and generate balanced investigative bridge paragraphs.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-sm font-extrabold text-sky-500 dark:text-sky-400">
                <span>Open Argument Checker</span>
                <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* Secondary Actions Bar */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {onOpenTemplates && (
              <button
                type="button"
                onClick={onOpenTemplates}
                className={clsx(
                  btnBase,
                  'border',
                  isDarkMode
                    ? 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
                )}
              >
                <LayoutGrid size={17} className="text-purple-500" />
                <span>Browse Script Templates</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowLibrary(true)}
              className={clsx(
                btnBase,
                'border border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10',
                isDarkMode && 'text-emerald-300'
              )}
            >
              <BookOpen size={17} />
              <span>Library &amp; My Channel Style</span>
            </button>
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className={clsx(
                btnBase,
                'border border-indigo-500/40 text-indigo-500 hover:bg-indigo-500/10',
                isDarkMode && 'text-indigo-300'
              )}
            >
              <Info size={17} />
              <span>How the 4-Pillar Engine Works</span>
            </button>
          </div>
        </div>
        <LibraryModal
          isOpen={showLibrary}
          onClose={() => setShowLibrary(false)}
          apiKey={apiKey}
          isDarkMode={isDarkMode}
          onSelectVoiceRecipe={recipeId => handlePrimaryCreatorSelect(recipeId)}
        />
      </div>
    );
  }

  // Step Hierarchy Pills for Guided Wizard
  const wizardStepsList = [
    { step: 1, label: '1. Topic & Angles', icon: Target },
    { step: 2, label: '2. Creator Style', icon: User },
    { step: 3, label: '3. Duration & Budget', icon: Clock },
    ...(hasGenreStep ? [{ step: 4, label: '4. Genre Blueprint', icon: Flame }] : []),
    {
      step: 5,
      label: `${hasGenreStep ? '5' : '4'}. Research & Outline${dossier ? ` (${dossier.facts.length})` : ''}`,
      icon: BookOpen
    },
    {
      step: 6,
      label: `${hasGenreStep ? '6' : '5'}. Language & Generate`,
      icon: Wand2
    }
  ];

  /* ==========================================================================
   * STEPS 1–6: GUIDED MULTI-PAGE SCRIPT CREATION WIZARD
   * ======================================================================== */
  return (
    <div ref={topAnchorRef} className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 font-sans">
      <HowItWorksDialog open={showHelp} onClose={closeHelp} isDarkMode={isDarkMode} />

      {/* Top Navigation & Clean Step Hierarchy Bar */}
      <div className="mb-6 sm:mb-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setWizardStep(0)}
              className={clsx(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold border transition-all',
                t.panel,
                t.text,
                t.hoverRow,
                focusRing
              )}
            >
              <Home size={16} className="text-indigo-500" />
              <span>Studio Home</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLibrary(true)}
              className={clsx(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold border transition-all',
                isDarkMode
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
                focusRing
              )}
            >
              <BookOpen size={16} className="text-emerald-500" />
              <span>Library &amp; My Channel Style</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold">
            <span className={t.muted}>Active Voice:</span>
            <span className={clsx('font-extrabold', t.text)}>
              {config.writingMode === 'auto'
                ? `Auto Match (${autoMatches[0]?.creatorName || currentCreator.name})`
                : config.writingMode === 'blend'
                ? `${resolvedVoice.recipe.creatorName}`
                : resolvedVoice.recipe.creatorName}
            </span>
            <span aria-hidden="true" className={t.muted}>·</span>
            <span className="font-bold text-indigo-500">{config.duration}</span>
          </div>
        </div>

        {/* Clean Step Hierarchy Pills (Light/Dark Theme-Aware) */}
        <div
          className={clsx(
            'rounded-[1.75rem] border p-2 sm:p-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2 shadow-sm',
            t.surface
          )}
        >
          {wizardStepsList.map(item => {
            const Icon = item.icon;
            const active = wizardStep === item.step;
            const disabled = item.step > 1 && !config.topicOrScript.trim();
            return (
              <button
                key={item.step}
                type="button"
                disabled={disabled}
                onClick={() => setWizardStep(item.step)}
                className={clsx(
                  'flex-1 min-w-[135px] min-h-[44px] px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2',
                  focusRing,
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : clsx(t.inset, t.text, t.hoverRow),
                  disabled && 'opacity-45 cursor-not-allowed'
                )}
              >
                <Icon size={15} className={active ? 'text-white' : 'text-indigo-500'} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
       * STEP 1: VIDEO TOPIC, TARGET CRITERIA & SMART FORMAT-AWARE ANGLE FINDER
       * ================================================================== */}
      {wizardStep === 1 && (
        <section
          key="step-1"
          className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6"
          aria-labelledby="step1-heading"
        >
          <div className="text-center max-w-3xl mx-auto mb-2">
            <div className="text-xs font-extrabold uppercase tracking-widest text-indigo-500 mb-1">
              Step 1 · Video Topic, Target Criteria &amp; Smart Angle Finder
            </div>
            <h2
              id="step1-heading"
              className={clsx('font-display text-2xl sm:text-4xl font-black tracking-tight', t.text)}
            >
              Define Your Video Topic &amp; Target Criteria
            </h2>
            <p className={clsx('mt-1.5 text-sm sm:text-base', t.muted)}>
              Enter your working title and what you want to cover—whether it&apos;s a high-stakes challenge (MrBeast), business playbook (Hormozi), science explainer, or investigative documentary.
            </p>
          </div>

          {activeTemplate && (
            <div
              className={clsx(
                'p-4 rounded-2xl border flex items-start justify-between gap-3',
                isDarkMode
                  ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              )}
            >
              <div className="space-y-1 min-w-0">
                <div className="font-bold flex items-start gap-2 text-sm">
                  <FileText size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <span>Template Blueprint Active: {activeTemplate.title}</span>
                </div>
                <p className="text-xs sm:text-sm opacity-90">
                  The structural outline is attached automatically. Enter your topic title and target criteria below.
                </p>
              </div>
              <button
                type="button"
                onClick={clearTemplate}
                className={clsx('shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:bg-indigo-500/20', focusRing)}
                title="Remove template"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {importNotice && (
            <div
              role={importNotice.type === 'error' ? 'alert' : 'status'}
              className={clsx('px-4 py-3 rounded-2xl border flex items-start justify-between gap-3', noticeTone)}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {importNotice.type === 'info' ? (
                  <CheckCircle2 size={17} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={17} className="shrink-0 mt-0.5" />
                )}
                <span className="text-sm font-semibold leading-relaxed">{importNotice.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setImportNotice(null)}
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <div className={clsx('rounded-[2rem] border shadow-xl overflow-hidden flex flex-col divide-y', t.surface, t.line)}>
            {/* SUB-SECTION 1A: SHORT VIDEO TOPIC OR WORKING TITLE BAR */}
            <div className="p-5 sm:p-7 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label
                  htmlFor="creation-short-topic"
                  className={clsx('font-display flex items-center gap-2 text-base sm:text-lg font-extrabold', t.text)}
                >
                  <Target size={19} className="text-indigo-500 shrink-0" />
                  <span>1. Video Topic or Working Title</span>
                </label>
              </div>

              <input
                id="creation-short-topic"
                type="text"
                maxLength={160}
                value={shortTopicValue}
                onChange={e => handleShortTopicChange(e.target.value)}
                placeholder="e.g., Surviving 50 Hours in Antarctica, How to Scale a Business, Scarcity of Water in Pakistan..."
                className={clsx(
                  'w-full min-h-[52px] rounded-2xl border px-4 sm:px-5 text-base sm:text-lg font-semibold outline-none transition-all',
                  t.field,
                  getLanguageClass(config.language),
                  focusRing
                )}
                dir="auto"
              />
            </div>

            {/* SUB-SECTION 1B: TARGET ANGLE, CRITERIA & KEY POINTS TO COVER (FOCUSED BOX) */}
            <div className="p-5 sm:p-7 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label
                    htmlFor="creation-target-criteria"
                    className={clsx('font-display flex items-center gap-2 text-base sm:text-lg font-extrabold', t.text)}
                  >
                    <FileText size={18} className="text-indigo-500 shrink-0" />
                    <span>2. Your Target Angle, Criteria &amp; Key Points to Cover (Optional Draft / Notes)</span>
                  </label>
                  <p className={clsx('text-xs sm:text-sm mt-0.5', t.muted)}>
                    Write what you want inside the video (key points, challenge rules, business framework, or investigative criteria—or import PDF/DOCX notes).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={clsx(
                      btnBase,
                      'min-h-[40px] px-4 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 whitespace-nowrap',
                      isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                    )}
                  >
                    {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                    <span>Import PDF / DOCX / TXT</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              <textarea
                id="creation-target-criteria"
                value={targetCriteriaValue || (!shortTopicValue ? config.topicOrScript : '')}
                onChange={e => handleTargetCriteriaChange(e.target.value)}
                placeholder="Write your target points, structure, or notes here—or use the Angle Finder below after entering your topic..."
                className={clsx(
                  'w-full p-4 sm:p-5 rounded-2xl border resize-y outline-none leading-relaxed',
                  'text-sm sm:text-base font-medium min-h-[160px] sm:min-h-[190px]',
                  t.field,
                  getLanguageClass(config.language),
                  focusRing
                )}
                dir="auto"
              />
            </div>

            {/* SUB-SECTION 1C: SMART TOPIC MATCH & ANGLE DISCOVERY BAR (APPEARS AFTER TOPIC/CRITERIA WRITTEN) */}
            {(shortTopicValue.trim().length >= 3 || config.topicOrScript.trim().length >= 3) && (
              <div className="p-5 sm:p-7 space-y-4 bg-indigo-500/[0.03]">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-500">
                        Smart Topic Match:
                      </span>
                      <span
                        className={clsx(
                          'text-xs font-extrabold px-2.5 py-1 rounded-lg border',
                          effectiveVideoCategory === 'documentary'
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-500'
                            : effectiveVideoCategory === 'challenge_entertainment'
                            ? 'bg-pink-500/15 border-pink-500/40 text-pink-500'
                            : effectiveVideoCategory === 'business_finance'
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500'
                            : 'bg-sky-500/15 border-sky-500/40 text-sky-500'
                        )}
                      >
                        {effectiveVideoCategory === 'documentary'
                          ? 'Documentary & Investigative Exposé'
                          : effectiveVideoCategory === 'challenge_entertainment'
                          ? 'Challenge & Viral Entertainment (MrBeast Style)'
                          : effectiveVideoCategory === 'business_finance'
                          ? 'Business, Wealth & Actionable Finance'
                          : 'Science, Psychology & Philosophy'}
                      </span>
                    </div>
                    <p className={clsx('text-xs', t.muted)}>
                      {effectiveVideoCategory === 'documentary'
                        ? 'Your topic matches a Documentary / Investigation—unlock 5 investigative documentary angles or switch format below.'
                        : effectiveVideoCategory === 'challenge_entertainment'
                        ? 'Your topic matches a High-Retention Challenge / Entertainment video—discover 5 spectacle & escalation angles.'
                        : effectiveVideoCategory === 'business_finance'
                        ? 'Your topic matches Business & Finance—discover 5 high-ROI frameworks & wealth angles.'
                        : 'Your topic matches Science & Philosophy—discover 5 paradox & first-principles angles.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Choose video format style"
                      value={videoFormatOverride}
                      onChange={e => {
                        const nextCat = e.target.value as VideoFormatCategory;
                        setVideoFormatOverride(nextCat);
                      }}
                      className={clsx(
                        'min-h-[44px] rounded-xl border px-3 text-xs sm:text-sm font-bold outline-none cursor-pointer',
                        t.field,
                        focusRing
                      )}
                    >
                      <option value="auto" className={t.option}>
                        Auto-Detect Format from Topic
                      </option>
                      <option value="documentary" className={t.option}>
                        Documentary &amp; Investigation
                      </option>
                      <option value="challenge_entertainment" className={t.option}>
                        Challenge &amp; Entertainment (MrBeast)
                      </option>
                      <option value="business_finance" className={t.option}>
                        Business, Sales &amp; Finance (Hormozi/Sharan)
                      </option>
                      <option value="science_philosophy" className={t.option}>
                        Science &amp; Philosophy (Veritasium/Naval)
                      </option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleSmartAnalyze(undefined, effectiveVideoCategory)}
                      disabled={isAnalyzingTopic}
                      className={clsx(
                        btnBase,
                        'min-h-[44px] px-5 shrink-0 whitespace-nowrap bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:opacity-95'
                      )}
                    >
                      {isAnalyzingTopic ? (
                        <Loader2 size={16} className="animate-spin shrink-0" />
                      ) : (
                        <BrainCircuit size={16} className="shrink-0" />
                      )}
                      <span>
                        {isAnalyzingTopic
                          ? 'Analyzing Topic & Criteria...'
                          : effectiveVideoCategory === 'documentary'
                          ? 'Discover 5 Documentary Angles'
                          : effectiveVideoCategory === 'challenge_entertainment'
                          ? 'Discover 5 Viral Challenge Angles'
                          : effectiveVideoCategory === 'business_finance'
                          ? 'Discover 5 Business & Finance Angles'
                          : 'Discover 5 Science & Paradox Angles'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* AI 5-ANGLE MATRIX RESULTS */}
                {topicSuggestions.length > 0 && (
                  <div className="pt-3 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className={clsx('flex items-center gap-2 text-xs sm:text-sm font-extrabold', t.text)}>
                        <Lightbulb size={17} className="text-amber-500 shrink-0" />
                        <span>
                          Click 1 or Multiple Angle Cards to Append into Your Target Criteria Above
                        </span>
                      </div>
                      <span className={clsx('text-xs font-mono font-bold tabular-nums', t.muted)}>
                        {selectedAngleIndices.length} angle{selectedAngleIndices.length === 1 ? '' : 's'} active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {topicSuggestions.map((s, i) => {
                        const isSelected = selectedAngleIndices.includes(i);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleAngleCardSelection(s, i)}
                            className={clsx(
                              'text-left rounded-2xl border p-4 sm:p-5 transition-all flex flex-col justify-between gap-3',
                              focusRing,
                              isSelected
                                ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/40 shadow-md'
                                : clsx(t.inset, 'hover:border-indigo-500/60')
                            )}
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-extrabold text-indigo-500 dark:text-indigo-400">
                                  {s.angleCategory || `Angle ${s.angleNumber || i + 1} · ${s.type}`}
                                </span>
                                <span
                                  className={clsx(
                                    'shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md',
                                    isSelected
                                      ? 'bg-indigo-600 text-white'
                                      : isDarkMode
                                      ? 'bg-white/10 text-slate-300'
                                      : 'bg-slate-200/80 text-slate-700'
                                  )}
                                >
                                  {isSelected ? <Check size={12} /> : <Plus size={12} />}
                                  <span>{isSelected ? 'Added' : 'Use Angle'}</span>
                                </span>
                              </div>

                              <div className={clsx('text-sm sm:text-base font-extrabold leading-snug', t.text)}>
                                {s.refinedTopic}
                              </div>

                              <p className={clsx('text-xs sm:text-sm leading-relaxed', t.body)}>
                                {s.reason}
                              </p>

                              {s.criteriaPoints && s.criteriaPoints.length > 0 && (
                                <ul className={clsx('space-y-1 pt-1 text-xs leading-relaxed', t.muted)}>
                                  {s.criteriaPoints.map((pt, pIdx) => (
                                    <li key={pIdx} className="flex items-start gap-1.5">
                                      <span className="text-indigo-500 font-bold">·</span>
                                      <span>{pt}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {s.pakistaniOrGroundProofPreview && (
                              <div className={clsx('pt-2.5 border-t text-[11px] font-medium', t.line, t.muted)}>
                                <strong className={t.text}>Proof &amp; Elements:</strong> {s.pakistaniOrGroundProofPreview}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className={clsx('px-5 sm:px-7 py-4 flex flex-wrap items-center justify-between gap-3', t.line)}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className={clsx(
                    btnBase,
                    'min-h-[42px] border',
                    refCount > 0
                      ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500'
                      : clsx(t.ghostBtn, t.line)
                  )}
                >
                  <ImageIcon size={16} />
                  <span>Add Visual Context</span>
                  {refCount > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs font-extrabold tabular-nums">
                      {refCount}
                    </span>
                  )}
                </button>
                <input
                  type="file"
                  ref={imageInputRef}
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                />
              </div>

              <div className="flex items-center gap-3">
                {willTruncate && (
                  <span className="text-xs font-bold text-amber-500">
                    Truncates at {truncationThreshold.toLocaleString()} chars
                  </span>
                )}
                <span className={clsx('text-sm font-bold font-mono tabular-nums', t.muted)}>
                  {wordCount.toLocaleString()} words · {config.topicOrScript.length.toLocaleString()} chars
                </span>
              </div>
            </div>
          </div>

          {/* Reference Image Previews */}
          {config.referenceImages && config.referenceImages.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 px-1">
              {config.referenceImages.map(img => (
                <div
                  key={img.id}
                  className={clsx('relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl overflow-hidden border shadow-md', t.line)}
                >
                  <img src={img.previewUrl} alt="Reference preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-500"
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Step 1 Footer Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setWizardStep(0)}
              className={clsx(btnBase, 'w-full sm:w-auto border', t.panel, t.text, t.hoverRow)}
            >
              <ArrowLeft size={17} />
              <span>Back to Home</span>
            </button>

            <button
              type="button"
              onClick={() => setWizardStep(2)}
              disabled={!config.topicOrScript.trim()}
              className={clsx(
                btnBase,
                'w-full sm:w-auto min-h-[52px] px-8 text-base font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-xl hover:opacity-95'
              )}
            >
              <span>Continue to Creator Style</span>
              <ArrowRight size={19} />
            </button>
          </div>
        </section>
      )}

      {/* ====================================================================
       * STEP 2: CHOOSE A CREATOR (WITH LOGOS, ROLE BLEND, AUTO MATCH & VOICE DRAWER)
       * ================================================================== */}
      {wizardStep === 2 && (
        <section
          key="step-2"
          className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6"
          aria-labelledby="step2-heading"
        >
          <div className="text-center max-w-3xl mx-auto">
            <div className="text-xs font-extrabold uppercase tracking-widest text-indigo-500 mb-1">
              Step 2 · Creator Voice Persona &amp; Style Engine
            </div>
            <h2
              id="step2-heading"
              className={clsx('font-display text-2xl sm:text-4xl font-black tracking-tight', t.text)}
            >
              Choose Your Creator Style
            </h2>
            <p className={clsx('mt-1.5 text-sm sm:text-base', t.muted)}>
              Pick a single creator persona with their signature voice &amp; research style, let AI auto-match your topic, or blend creators by Hook, Structure &amp; Tone.
            </p>

            {/* Big Action Buttons for Voice Details & My Channel Style Library */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowVoiceDrawer(true)}
                className={clsx(
                  btnBase,
                  'border',
                  isDarkMode
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/25'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                )}
              >
                <Info size={17} />
                <span>How This Voice Works ({resolvedVoice.recipe.creatorName})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLibrary(true)}
                className={clsx(
                  btnBase,
                  'border',
                  isDarkMode
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                )}
              >
                <BookOpen size={17} />
                <span>My Channel Style &amp; Quotes Library</span>
              </button>
            </div>
          </div>

          {/* 3 Fade-In Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="radiogroup" aria-label="Writing mode">
            {MODES.map(mode => {
              const Icon = mode.icon;
              const active = config.writingMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => updateConfig('writingMode', mode.id)}
                  className={clsx(
                    'text-left rounded-[1.75rem] border p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between',
                    focusRing,
                    active
                      ? mode.id === 'blend'
                        ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-400 text-white shadow-xl scale-[1.01]'
                        : 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-xl scale-[1.01]'
                      : clsx(t.panel, t.text, 'hover:border-indigo-500/50')
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div
                        className={clsx(
                          'w-11 h-11 rounded-2xl flex items-center justify-center',
                          active ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-500'
                        )}
                      >
                        <Icon size={22} />
                      </div>
                      {active && (
                        <span className="text-xs font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-lg">
                          Selected
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-lg sm:text-xl font-extrabold">{mode.label}</h3>
                    <div className={clsx('text-xs font-bold mb-2', active ? 'text-indigo-100' : 'text-indigo-500')}>
                      {mode.subtitle}
                    </div>
                    <p className={clsx('text-xs sm:text-sm leading-relaxed', active ? 'text-white/90' : t.muted)}>
                      {mode.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Creator Selection Grid (shown in Manual & Blend modes) */}
          {config.writingMode !== 'auto' ? (
            <div className={clsx('rounded-[2rem] border p-5 sm:p-7 space-y-6 shadow-sm', t.surface)}>
              <div>
                <h3 className={clsx('font-display text-lg font-extrabold mb-1', t.text)}>
                  {config.writingMode === 'blend'
                    ? '1. Select Primary Creator Voice (Base Bio & Structure)'
                    : 'Select Target Creator Persona'}
                </h3>
                <p className={clsx('text-xs sm:text-sm mb-4', t.muted)}>
                  All creator bio files, logos, and dedicated research styles are pre-loaded and ready.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {CREATORS.map(c => {
                    const selected = config.selectedStyleId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handlePrimaryCreatorSelect(c.id)}
                        className={clsx(
                          'rounded-2xl border p-4 text-left transition-all duration-200 flex items-center gap-3.5',
                          focusRing,
                          selected
                            ? 'bg-gradient-to-r from-indigo-600/15 to-purple-600/15 border-indigo-500 ring-2 ring-indigo-500/40 shadow-md'
                            : clsx(t.inset, t.hoverRow)
                        )}
                      >
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/15 shrink-0">
                          <Avatar creator={c} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={clsx('font-display font-extrabold text-sm sm:text-base truncate', t.text)}>
                              {c.name}
                            </span>
                            {selected && (
                              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                <Check size={12} />
                              </span>
                            )}
                          </div>
                          <span className={clsx('block text-xs truncate mt-0.5', t.muted)}>{c.style}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secondary Blend Voices + Role-Based Blend Assignment */}
              {config.writingMode === 'blend' && (
                <div className={clsx('pt-6 border-t space-y-6', t.line)}>
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h4 className={clsx('font-display text-base font-extrabold flex items-center gap-2', t.text)}>
                        <Layers size={17} className="text-purple-500" />
                        <span>2. Choose Secondary Flavor Voices (Up to {MAX_SECONDARIES})</span>
                      </h4>
                      <span className="text-xs font-extrabold font-mono text-purple-500">
                        {secondaryIds.length} / {MAX_SECONDARIES} Selected
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 mt-3">
                      {CREATORS.filter(c => c.id !== config.selectedStyleId).map(c => {
                        const isSelected = config.blendConfig.secondaryCreatorIds.includes(c.id);
                        const blocked = atSecondaryLimit && !isSelected;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => toggleSecondaryCreator(c.id)}
                            disabled={blocked}
                            className={clsx(
                              'rounded-2xl p-3 border text-left transition-all flex items-center gap-2.5',
                              focusRing,
                              isSelected
                                ? 'border-purple-500 bg-purple-500/15 ring-1 ring-purple-500'
                                : clsx(t.inset, t.hoverRow),
                              blocked && 'opacity-40 cursor-not-allowed'
                            )}
                          >
                            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
                              <Avatar creator={c} className="w-full h-full object-cover" />
                            </div>
                            <span className={clsx('text-xs font-bold truncate flex-1', t.text)}>{c.name}</span>
                            {isSelected && <Check size={14} className="text-purple-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Role-Based Creator Blend + 5-Line Blend Preview Card */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                    <div className={clsx('p-5 rounded-2xl border space-y-3.5', t.inset)}>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-500">
                        3. Role-Based Creator Blend (Hook · Structure · Tone)
                      </h4>
                      {[
                        { key: 'hookCreatorId', label: 'Hook & Opening from' },
                        { key: 'structureCreatorId', label: 'Body Chapter Structure & Research from' },
                        { key: 'toneCreatorId', label: 'Language, Sentence Rhythm & Tone from' }
                      ].map(role => (
                        <div key={role.key}>
                          <label className={clsx('block text-xs font-bold mb-1', t.text)}>
                            {role.label}
                          </label>
                          <select
                            value={(voiceSelection.blend as any)?.[role.key] || 'dhruv-rathee'}
                            onChange={e => {
                              const val = e.target.value;
                              setVoiceSelection(prev => {
                                const nextBlend = {
                                  ...prev.blend,
                                  [role.key]: val
                                };
                                nextBlend.creatorIds = Array.from(
                                  new Set([
                                    nextBlend.hookCreatorId,
                                    nextBlend.structureCreatorId,
                                    nextBlend.toneCreatorId
                                  ])
                                );
                                return {
                                  ...prev,
                                  blend: nextBlend
                                };
                              });
                            }}
                            className={clsx('w-full min-h-[42px] rounded-xl border px-3 py-2 text-xs sm:text-sm font-bold outline-none', t.field)}
                          >
                            {allRecipes.map(r => (
                              <option key={r.creatorId} value={r.creatorId} className={t.option}>
                                {r.creatorName} ({r.languages[0] || 'Multi'})
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}

                      {resolvedVoice.languageMismatchWarning && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-300 space-y-2">
                          <div className="flex items-start gap-2 font-semibold">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{resolvedVoice.languageMismatchWarning}</span>
                          </div>
                          {resolvedVoice.needsNarrationLanguage && (
                            <div>
                              <label className="block text-[11px] font-bold mb-1">
                                Which language should the final script be in?
                              </label>
                              <select
                                value={voiceSelection.blend.chosenLanguage || config.language || 'Roman Urdu'}
                                onChange={e => {
                                  const nextLang = e.target.value;
                                  setVoiceSelection(prev => ({
                                    ...prev,
                                    blend: {
                                      ...prev.blend,
                                      chosenLanguage: nextLang
                                    }
                                  }));
                                  setConfig(prev => ({ ...prev, language: nextLang }));
                                }}
                                className={clsx('w-full rounded-xl border px-2.5 py-1.5 text-xs font-bold', t.field)}
                              >
                                {resolvedVoice.availableLanguages.map(lang => (
                                  <option key={lang} value={lang} className={t.option}>
                                    {lang}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div
                      className={clsx(
                        'p-5 rounded-2xl border space-y-2.5',
                        isDarkMode
                          ? 'border-indigo-500/30 bg-indigo-950/20'
                          : 'border-indigo-200 bg-indigo-50/60'
                      )}
                    >
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-500">
                        5-Line Blend Preview Card
                      </h4>
                      <ul className={clsx('space-y-2 text-xs sm:text-sm', t.body)}>
                        {resolvedVoice.summaryLines.map((line, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-500 font-extrabold">{idx + 1}.</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={clsx('rounded-[2rem] border p-6 sm:p-8 space-y-6 shadow-sm', t.surface)}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg">
                    <BrainCircuit size={26} />
                  </div>
                  <div>
                    <h3 className={clsx('font-display text-lg sm:text-xl font-extrabold mb-1', t.text)}>
                      AI Auto-Match Intelligence Enabled
                    </h3>
                    <p className={clsx('text-xs sm:text-sm leading-relaxed', t.muted)}>
                      Scored across Niche ({selectedNiche}), Format ({videoFormat}), Language ({config.language}), Duration ({durationMinutes}m), and Topic keywords.
                    </p>
                  </div>
                </div>

                {autoMatches.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig('writingMode', 'blend');
                      setVoiceSelection({
                        mode: 'blend',
                        pickedCreatorId: autoMatches[0].creatorId,
                        blend: {
                          hookCreatorId: autoMatches[0].creatorId,
                          structureCreatorId: autoMatches[1].creatorId,
                          toneCreatorId: autoMatches[0].creatorId,
                          creatorIds: [autoMatches[0].creatorId, autoMatches[1].creatorId]
                        }
                      });
                    }}
                    className={clsx(
                      btnBase,
                      'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:opacity-95 shrink-0'
                    )}
                  >
                    <Combine size={17} />
                    <span>
                      Blend Top 2 ({autoMatches[0].creatorName} + {autoMatches[1].creatorName})
                    </span>
                  </button>
                )}
              </div>

              {/* Top 3 Matched Creators with Avatar Logos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {autoMatches.map((m, idx) => {
                  const matchedCreatorProfile =
                    CREATORS.find(
                      c =>
                        c.id.toLowerCase().includes(m.creatorId.replace('-rathee', '').replace('-rajput', '').replace('-gadzhi', '')) ||
                        m.creatorName.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])
                    ) || CREATORS[0];

                  return (
                    <div
                      key={m.creatorId}
                      className={clsx(
                        'rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-3 transition-all',
                        idx === 0
                          ? 'bg-gradient-to-br from-indigo-600/15 to-purple-600/15 border-indigo-500 ring-2 ring-indigo-500/40 shadow-md'
                          : t.inset
                      )}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/15 shrink-0">
                              <Avatar creator={matchedCreatorProfile} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <div className={clsx('font-display font-extrabold text-sm sm:text-base truncate', t.text)}>
                                #{idx + 1} {m.creatorName}
                              </div>
                              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                                {m.score}% Match
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className={clsx('text-xs leading-relaxed', t.body)}>{m.whyLine}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          updateConfig('writingMode', 'manual');
                          handlePrimaryCreatorSelect(matchedCreatorProfile.id);
                        }}
                        className={clsx(
                          'w-full py-2 px-3 rounded-xl text-xs font-extrabold border transition-colors',
                          idx === 0
                            ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500'
                            : clsx(t.panel, t.text, t.hoverRow)
                        )}
                      >
                        Lock {m.creatorName}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DOCUMENTARY RESEARCH PLAN & SOURCE FINDER CARD (ALWAYS VISIBLE IN STEP 2) */}
          {(() => {
            const step2RegionScope = resolveCreatorResearchRegion(
              currentCreator.id,
              shortTopicValue || config.topicOrScript
            );
            const step2Layer2Label =
              step2RegionScope === 'india_and_global'
                ? 'Layer 2: Ground-Level Data & Indian Institutions (CAG, PRS, RBI, Parliamentary Records)'
                : step2RegionScope === 'pakistan'
                ? 'Layer 2: Ground-Level Data & Local Institutions (PIDE, PBS, KWSB, Court Records)'
                : 'Layer 2: Institutional Reports & Official Filings (World Bank, SEC, OECD, Bureau Records)';

            const step2Layer3Label =
              step2RegionScope === 'india_and_global'
                ? 'Layer 3: Grassroots Indian Reddit (r/india, r/delhi) & Citizen Discussions'
                : step2RegionScope === 'pakistan'
                ? 'Layer 3: Grassroots Pakistani Reddit (r/pakistan, r/karachi) & Street Realities'
                : 'Layer 3: Grassroots Citizen & Online Community Discussions';

            const activeSources = activeResearchConfig.sources || {
              booksAndHistoricalParables: true,
              localPakistaniAndRegionalData: true,
              redditAndCitizenGroundVoices: true,
              globalStudiesAndCounterArguments: true
            };

            return (
              <div className={clsx('rounded-[2rem] border p-5 sm:p-7 space-y-6 shadow-sm', t.surface)}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className={clsx('font-display text-lg sm:text-xl font-extrabold flex items-center gap-2.5', t.text)}>
                      <Layers size={20} className="text-indigo-500" />
                      <span>Documentary Research Plan &amp; Source Finder</span>
                    </h3>
                    <p className={clsx('text-xs sm:text-sm mt-0.5', t.muted)}>
                      Harvest book anchors, institutional records, and citizen ground voices before script generation.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border',
                        step2RegionScope === 'india_and_global'
                          ? 'border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400'
                          : step2RegionScope === 'pakistan'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      )}
                    >
                      <Globe size={13} />
                      <span>
                        Scope:{' '}
                        {step2RegionScope === 'india_and_global'
                          ? 'India & Global'
                          : step2RegionScope === 'pakistan'
                          ? 'Pakistan'
                          : 'Global'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* 4 Layer Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {/* Layer 1: Books & Parables */}
                  <button
                    type="button"
                    onClick={() => toggleResearchSource('booksAndHistoricalParables')}
                    className={clsx(
                      'p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3',
                      focusRing,
                      activeSources.booksAndHistoricalParables
                        ? 'border-indigo-500/50 bg-indigo-500/10'
                        : clsx(t.inset, 'opacity-70')
                    )}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className={clsx('font-extrabold text-xs sm:text-sm flex items-center gap-2', t.text)}>
                        <BookOpen size={15} className="text-indigo-500 shrink-0" />
                        <span>Layer 1: Books, Memoirs &amp; Historical Parables</span>
                      </div>
                      <p className={clsx('text-xs leading-relaxed', t.muted)}>
                        George Orwell&apos;s 1984, Clever Hans Commission, Alif Laila, Shahabnama &amp; timeless allegories.
                      </p>
                    </div>
                    <Switch on={Boolean(activeSources.booksAndHistoricalParables)} tone="indigo" />
                  </button>

                  {/* Layer 2: Institutional Data */}
                  <button
                    type="button"
                    onClick={() => toggleResearchSource('localPakistaniAndRegionalData')}
                    className={clsx(
                      'p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3',
                      focusRing,
                      activeSources.localPakistaniAndRegionalData
                        ? 'border-indigo-500/50 bg-indigo-500/10'
                        : clsx(t.inset, 'opacity-70')
                    )}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className={clsx('font-extrabold text-xs sm:text-sm flex items-center gap-2', t.text)}>
                        <Database size={15} className="text-indigo-500 shrink-0" />
                        <span className="truncate">{step2Layer2Label}</span>
                      </div>
                      <p className={clsx('text-xs leading-relaxed', t.muted)}>
                        {step2RegionScope === 'india_and_global'
                          ? 'CAG audits, PRS Legislative Research, RBI bulletins & parliamentary data.'
                          : step2RegionScope === 'pakistan'
                          ? 'PIDE, PBS, State Bank, NEPRA, KWSB & neighborhood geography.'
                          : 'World Bank, IMF, SEC filings, OECD reports & official gazettes.'}
                      </p>
                    </div>
                    <Switch on={Boolean(activeSources.localPakistaniAndRegionalData)} tone="indigo" />
                  </button>

                  {/* Layer 3: Grassroots Citizen & Reddit */}
                  <button
                    type="button"
                    onClick={() => toggleResearchSource('redditAndCitizenGroundVoices')}
                    className={clsx(
                      'p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3',
                      focusRing,
                      activeSources.redditAndCitizenGroundVoices
                        ? 'border-indigo-500/50 bg-indigo-500/10'
                        : clsx(t.inset, 'opacity-70')
                    )}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className={clsx('font-extrabold text-xs sm:text-sm flex items-center gap-2', t.text)}>
                        <MessageSquare size={15} className="text-indigo-500 shrink-0" />
                        <span className="truncate">{step2Layer3Label}</span>
                      </div>
                      <p className={clsx('text-xs leading-relaxed', t.muted)}>
                        Citizen lived frustrations, utility routines, degree employment bottlenecks &amp; street proverbs.
                      </p>
                    </div>
                    <Switch on={Boolean(activeSources.redditAndCitizenGroundVoices)} tone="indigo" />
                  </button>

                  {/* Layer 4: Global Empirical Benchmarks */}
                  <button
                    type="button"
                    onClick={() => toggleResearchSource('globalStudiesAndCounterArguments')}
                    className={clsx(
                      'p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3',
                      focusRing,
                      activeSources.globalStudiesAndCounterArguments
                        ? 'border-indigo-500/50 bg-indigo-500/10'
                        : clsx(t.inset, 'opacity-70')
                    )}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className={clsx('font-extrabold text-xs sm:text-sm flex items-center gap-2', t.text)}>
                        <ShieldCheck size={15} className="text-indigo-500 shrink-0" />
                        <span>Layer 4: Global Scientific Studies &amp; Benchmarks</span>
                      </div>
                      <p className={clsx('text-xs leading-relaxed', t.muted)}>
                        Peer-reviewed studies (Nature, MIT, WHO, Lancet) and cross-country empirical comparisons.
                      </p>
                    </div>
                    <Switch on={Boolean(activeSources.globalStudiesAndCounterArguments)} tone="indigo" />
                  </button>
                </div>

                {/* Pre-Harvest Dossier Action & Summary Box */}
                {config.agencyDossier ? (
                  <div
                    className={clsx(
                      'p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
                      isDarkMode
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-emerald-50/80 border-emerald-200'
                    )}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={17} />
                        <span>5-Part Agency Research Dossier Pre-Harvested</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {config.agencyDossier.bookAndParableAnchor?.length || 0} Book Anchors •{' '}
                        {config.agencyDossier.localInstitutionalData?.length || 0} Institutional Data Points •{' '}
                        {config.agencyDossier.grassrootsAndRedditVoices?.length || 0} Citizen Voices •{' '}
                        {config.agencyDossier.globalScientificBenchmarks?.length || 0} Global Studies •{' '}
                        {config.agencyDossier.nonRepetitiveFactPlan?.length || 0} Scene Beats
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleHarvestPreScriptDossier}
                      disabled={isHarvestingDossier}
                      className={clsx(
                        btnBase,
                        'border text-xs px-4 py-2 shrink-0',
                        isDarkMode
                          ? 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                          : 'border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                      )}
                    >
                      {isHarvestingDossier ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      <span>{isHarvestingDossier ? 'Re-harvesting...' : 'Re-Harvest Pre-Script Dossier'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className={clsx('text-xs', t.muted)}>
                      Click to execute live Google Search grounding across the active layers before generating.
                    </p>
                    <button
                      type="button"
                      onClick={handleHarvestPreScriptDossier}
                      disabled={isHarvestingDossier || !config.topicOrScript.trim()}
                      className={clsx(
                        btnBase,
                        'w-full sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:opacity-95 disabled:opacity-50'
                      )}
                    >
                      {isHarvestingDossier ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Harvesting 5-Layer Evidence...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} />
                          <span>Harvest Pre-Script Dossier (Grounded)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Step 2 Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setWizardStep(1)}
              className={clsx(btnBase, 'w-full sm:w-auto border', t.panel, t.text, t.hoverRow)}
            >
              <ArrowLeft size={17} />
              <span>Back to Topic &amp; Angles</span>
            </button>

            <button
              type="button"
              onClick={() => setWizardStep(3)}
              className={clsx(
                btnBase,
                'w-full sm:w-auto min-h-[52px] px-8 text-base font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-xl hover:opacity-95'
              )}
            >
              <span>Continue to Duration &amp; Budget</span>
              <ArrowRight size={19} />
            </button>
          </div>
        </section>
      )}

      {/* ====================================================================
       * STEP 3: DURATION, FORMAT, NICHE, LIVE BUDGET & SPONSOR INTEGRATION
       * ================================================================== */}
      {wizardStep === 3 && (
        <section
          key="step-3"
          className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6"
          aria-labelledby="step3-heading"
        >
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-extrabold uppercase tracking-widest text-indigo-500 mb-1">
              Step 3 · Pacing, Word Budget, Niche &amp; Sponsorship
            </div>
            <h2
              id="step3-heading"
              className={clsx('font-display text-2xl sm:text-4xl font-black tracking-tight', t.text)}
            >
              Choose Duration, Format &amp; Sponsor
            </h2>
            <p className={clsx('mt-1.5 text-sm sm:text-base', t.muted)}>
              1-Min Shorts synthesize in ~40s, 5-Min Deep Dives in ~1 min, and 20-Min Full Documentaries deliver 4,000–5,000 spoken words.
            </p>
          </div>

          {/* Interactive Duration Cards */}
          <div className={clsx('rounded-[2rem] border p-5 sm:p-7 space-y-6 shadow-sm', t.surface)}>
            <div>
              <h3 className={clsx('font-display text-base sm:text-lg font-extrabold flex items-center gap-2 mb-3', t.text)}>
                <Clock size={18} className="text-indigo-500" />
                <span>Select Target Script Duration &amp; Word Count</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {DURATIONS.map(d => {
                  const selected = config.duration === d;
                  const meta = DURATION_SYNTHESIS_META[d] || {
                    timeBadge: 'Deep Synthesis',
                    depthBadge: 'Full Scene Depth'
                  };
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        updateConfig('duration', d);
                        const mins = parseDurationToMinutes(d);
                        setDurationMinutes(mins);
                        setVideoFormat(mins <= 2 ? 'Short' : mins <= 8 ? 'Explainer' : 'Documentary');
                      }}
                      className={clsx(
                        'rounded-2xl border p-4 text-left transition-all duration-200 flex flex-col justify-between',
                        focusRing,
                        selected
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-lg scale-[1.01]'
                          : clsx(t.inset, t.text, t.hoverRow)
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-display font-extrabold text-sm sm:text-base">{d}</span>
                          {selected && <Check size={16} className="shrink-0" />}
                        </div>
                        <div
                          className={clsx(
                            'text-xs font-bold font-mono',
                            selected ? 'text-indigo-100' : 'text-indigo-500 dark:text-indigo-400'
                          )}
                        >
                          {meta.depthBadge}
                        </div>
                      </div>
                      <div
                        className={clsx(
                          'mt-3 pt-2 border-t text-[11px] font-semibold',
                          selected ? 'border-white/20 text-white/90' : clsx(t.line, t.muted)
                        )}
                      >
                        {meta.timeBadge}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Word, Scene & Chapter Budget Banner */}
            <div
              className={clsx(
                'rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                isDarkMode
                  ? 'border-indigo-500/30 bg-indigo-950/25 text-indigo-200'
                  : 'border-indigo-200 bg-indigo-50/70 text-indigo-950'
              )}
            >
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-500 mb-0.5">
                  Live Production Budget ({durationMinutes} Min)
                </div>
                <div className="text-xs sm:text-sm font-bold">
                  {budget.liveSummaryLine}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  aria-label="Output Script Mode"
                  value={outputMode}
                  onChange={e => {
                    const next = e.target.value as 'voiceover_only' | 'voiceover_and_production';
                    setOutputMode(next);
                    setConfig(prev => ({ ...prev, outputScriptMode: next }));
                  }}
                  className={clsx('min-h-[42px] rounded-xl border px-3 text-xs font-bold outline-none cursor-pointer', t.field)}
                >
                  <option value="voiceover_and_production" className={t.option}>
                    Voiceover + Production Script (~2.3x words)
                  </option>
                  <option value="voiceover_only" className={t.option}>
                    Voiceover Narration Only
                  </option>
                </select>
              </div>
            </div>

            {/* Topic Niche Selector */}
            <div className={clsx('pt-5 border-t', t.line)}>
              <label className={clsx('flex items-center gap-2 text-sm font-extrabold mb-2.5', t.text)}>
                <Compass size={16} className="text-indigo-500" />
                <span>Topic Niche (Tunes Research Sources &amp; Creator Pacing)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {TOPIC_NICHES.map(niche => {
                  const active = selectedNiche === niche;
                  return (
                    <button
                      key={niche}
                      type="button"
                      onClick={() => {
                        userManuallySelectedNicheRef.current = true;
                        setSelectedNiche(niche);
                        setConfig(prev => ({ ...prev, selectedNiche: niche }));
                      }}
                      className={clsx(
                        'min-h-[40px] px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all',
                        focusRing,
                        active
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                          : clsx(t.inset, t.text, t.hoverRow)
                      )}
                    >
                      {niche}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Platform Format Selector */}
            <div className={clsx('pt-5 border-t', t.line)}>
              <label htmlFor="creation-format" className={clsx('flex items-center gap-2 text-sm font-extrabold mb-2.5', t.text)}>
                <LayoutTemplate size={16} className="text-purple-500" />
                <span>Target Platform Format</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {PLATFORMS.map(p => {
                  const active = config.platform === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateConfig('platform', p)}
                      className={clsx(
                        'min-h-[44px] px-3 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-all',
                        focusRing,
                        active
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow'
                          : clsx(t.inset, t.text, t.hoverRow)
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sponsor Integration Card */}
          <div
            className={clsx(
              'rounded-[2rem] border p-5 sm:p-7 transition-colors shadow-sm',
              config.sponsorInfo?.enabled
                ? isDarkMode
                  ? 'bg-blue-950/20 border-blue-500/40'
                  : 'bg-blue-50/70 border-blue-200'
                : t.surface
            )}
          >
            <button
              type="button"
              role="switch"
              aria-checked={!!config.sponsorInfo?.enabled}
              onClick={() => handleSponsorChange('enabled', !config.sponsorInfo?.enabled)}
              className={clsx('w-full flex items-center justify-between gap-4 text-left', focusRing)}
            >
              <div>
                <div className={clsx('font-display text-base sm:text-lg font-extrabold flex items-center gap-2', t.text)}>
                  <DollarSign size={18} className="text-blue-500" />
                  <span>Sponsor Integration (Optional)</span>
                </div>
                <p className={clsx('text-xs sm:text-sm mt-0.5', t.muted)}>
                  Weave a natural mid-roll sponsor bridge with Brand Name, Product Name, and Key Message.
                </p>
              </div>
              <Switch on={!!config.sponsorInfo?.enabled} tone="blue" />
            </button>

            {config.sponsorInfo?.enabled && (
              <div className="mt-5 pt-5 border-t border-blue-500/20 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
                <div>
                  <label className={clsx('block text-xs font-bold mb-1.5', t.text)}>Sponsor Brand Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., NordVPN, Audible, Notion"
                    value={config.sponsorInfo?.name || ''}
                    onChange={e => handleSponsorChange('name', e.target.value)}
                    className={clsx('w-full min-h-[46px] rounded-xl border px-3.5 text-sm font-medium outline-none', t.field)}
                  />
                </div>
                <div>
                  <label className={clsx('block text-xs font-bold mb-1.5', t.text)}>Product or Service Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Threat Protection Pro"
                    value={config.sponsorInfo?.product || ''}
                    onChange={e => handleSponsorChange('product', e.target.value)}
                    className={clsx('w-full min-h-[46px] rounded-xl border px-3.5 text-sm font-medium outline-none', t.field)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={clsx('block text-xs font-bold mb-1.5', t.text)}>Key Sponsor Message / Callout *</label>
                  <input
                    type="text"
                    placeholder="e.g., Use link in description for 4 months free + 30-day money-back guarantee"
                    value={config.sponsorInfo?.message || ''}
                    onChange={e => handleSponsorChange('message', e.target.value)}
                    className={clsx('w-full min-h-[46px] rounded-xl border px-3.5 text-sm font-medium outline-none', t.field)}
                  />
                </div>
                <label className={clsx('sm:col-span-2 flex items-center gap-3 text-sm font-medium cursor-pointer', t.body)}>
                  <input
                    type="checkbox"
                    checked={config.sponsorInfo?.disclosure !== false}
                    onChange={e => handleSponsorChange('disclosure', e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Include natural sponsorship disclosure line (&ldquo;Sponsored by...&rdquo;)</span>
                </label>
                {isSponsorInvalid && (
                  <p role="alert" className="sm:col-span-2 text-xs font-bold text-amber-500">
                    Please enter both Brand Name and Key Sponsor Message to continue with a sponsor.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Step 3 Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setWizardStep(2)}
              className={clsx(btnBase, 'w-full sm:w-auto border', t.panel, t.text, t.hoverRow)}
            >
              <ArrowLeft size={17} />
              <span>Back to Creator Style</span>
            </button>

            <button
              type="button"
              onClick={() => setWizardStep(hasGenreStep ? 4 : 5)}
              disabled={isSponsorInvalid}
              className={clsx(
                btnBase,
                'w-full sm:w-auto min-h-[52px] px-8 text-base font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-xl hover:opacity-95'
              )}
            >
              <span>
                {hasGenreStep
                  ? `Continue to ${currentCreator.name} Genres`
                  : 'Continue to Research & Outline'}
              </span>
              <ArrowRight size={19} />
            </button>
          </div>
        </section>
      )}

      {/* ====================================================================
       * STEP 4: CREATOR-ISOLATED 5-GENRE & 3-LANGUAGE TRANSCRIPT HIERARCHY
       * (Active for Dhruv Rathee's 5 Genres OR ThynkWhy's 5 Genres)
       * ================================================================== */}
      {wizardStep === 4 && hasGenreStep && (
        <section
          key="step-4"
          className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6"
          aria-labelledby="step4-heading"
        >
          <div className="text-center max-w-3xl mx-auto">
            <div className="text-xs font-extrabold uppercase tracking-widest text-indigo-500 mb-1">
              {currentCreator.name} Genre &amp; Non-Verbatim Wording Routing
            </div>
            <h2
              id="step4-heading"
              className={clsx('font-display text-2xl sm:text-4xl font-black tracking-tight', t.text)}
            >
              Choose {currentCreator.name} Genre Blueprint
            </h2>
            <p className={clsx('mt-1.5 text-sm sm:text-base', t.muted)}>
              Matches your topic to {currentCreator.name}&apos;s exact genre vocal tone and connector vocabulary across English, Hinglish, and Urdu while crafting 100% original sentences.
            </p>
          </div>

          {/* 5 Genre Cards Grid (Isolated per Creator) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creatorSubGenres.map(bp => {
              const isExplicitlySelected = config.subGenreId === bp.id;
              const isAutoMatched =
                (!config.subGenreId || config.subGenreId === 'auto') &&
                autoDetectedRoute.blueprint.id === bp.id;
              const isHighlighted = isExplicitlySelected || isAutoMatched;

              return (
                <button
                  key={bp.id}
                  type="button"
                  onClick={() => updateConfig('subGenreId', bp.id)}
                  className={clsx(
                    'rounded-[1.75rem] border p-5 sm:p-6 text-left transition-all duration-300 flex flex-col justify-between',
                    focusRing,
                    isHighlighted
                      ? 'bg-gradient-to-br from-indigo-600/20 via-purple-600/15 to-pink-600/10 border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl scale-[1.01]'
                      : clsx(t.surface, t.hoverRow)
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-500">
                        <Flame size={14} />
                        Tag: {bp.genreTag || bp.title} • {bp.aggressionScore}
                      </span>
                      {isAutoMatched && (
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-500">
                          Auto-Matched from Topic
                        </span>
                      )}
                      {isExplicitlySelected && (
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-400">
                          Selected Genre
                        </span>
                      )}
                    </div>

                    <h3 className={clsx('font-display text-lg sm:text-xl font-extrabold mb-1.5', t.text)}>
                      {bp.title}
                    </h3>
                    <p className={clsx('text-xs sm:text-sm font-semibold mb-3', t.body)}>
                      {bp.aggressionAndTone}
                    </p>
                    <p className={clsx('text-xs leading-relaxed', t.muted)}>
                      {bp.signatureWordingAndPacing}
                    </p>
                  </div>

                  <div className={clsx('mt-4 pt-3 border-t flex items-center justify-between text-[11px] font-bold', t.line)}>
                    <span className={t.muted}>
                      Triggers: {bp.topicTriggers.slice(0, 5).join(', ')}
                    </span>
                    <span className="text-emerald-500 shrink-0 ml-2">English • Hinglish • Urdu</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Auto-Select Sub-Genre Button Card */}
          <div className={clsx('rounded-[1.75rem] border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4', t.surface)}>
            <div>
              <div className={clsx('font-display text-base sm:text-lg font-extrabold flex items-center gap-2', t.text)}>
                <Sparkles size={18} className="text-indigo-500" />
                <span>Auto-Select Genre from Your Topic</span>
              </div>
              <p className={clsx('text-xs sm:text-sm mt-0.5', t.muted)}>
                Detected from your topic:{' '}
                <strong className={t.text}>{autoDetectedRoute.blueprint.title}</strong> ({autoDetectedRoute.blueprint.aggressionScore})
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateConfig('subGenreId', 'auto')}
              className={clsx(
                btnBase,
                (!config.subGenreId || config.subGenreId === 'auto')
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                  : clsx('border', t.inset, t.text, t.hoverRow)
              )}
            >
              <Check size={16} />
              <span>
                {!config.subGenreId || config.subGenreId === 'auto'
                  ? 'Auto-Select Active'
                  : 'Switch to Auto-Select'}
              </span>
            </button>
          </div>

          {/* ====================================================================
           * BACKEND REFERENCE ARCHITECTURE & BENCHMARK TITLES (INTERNAL ENGINE — NO RAW TRANSCRIPTS SHOWN)
           * ================================================================== */}
          {(() => {
            const step4ActiveRoute = matchCreatorSubGenreAndTranscript(
              currentCreator,
              config.topicOrScript,
              config.subGenreId || 'auto'
            );
            const step4Videos = step4ActiveRoute.genreVideos || [];
            if (!step4Videos.length) return null;

            return (
              <div className={clsx('rounded-[1.75rem] border p-5 sm:p-6 space-y-4 transition-all duration-300', t.surface)}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={clsx('font-display text-base sm:text-lg font-extrabold', t.text)}>
                          Backend Style Calibration: {step4ActiveRoute.blueprint.title}
                        </h3>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 border border-indigo-500/30">
                          {step4Videos.length} Reference Benchmarks Active in Backend
                        </span>
                      </div>
                      <p className={clsx('text-xs mt-0.5', t.muted)}>
                        Full reference transcripts stay strictly in the backend engine to guide {currentCreator.name}&apos;s opening hook, transition rhythm, and closing verdict—without exposing or copying raw video scripts.
                      </p>
                    </div>
                  </div>
                </div>

                {/* High-Level Reference Ideas / Titles Only (No Verbatim Transcripts) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {step4Videos.map((vid, idx) => (
                    <div
                      key={vid.videoTitle || idx}
                      className={clsx('p-3.5 rounded-2xl border flex flex-col justify-between gap-1.5', t.inset)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-500">
                          Reference Style #{idx + 1}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-500">
                          {vid.genreTag || 'Documentary'}
                        </span>
                      </div>
                      <div className={clsx('text-xs sm:text-sm font-extrabold leading-snug', t.text)}>
                        {vid.videoTitle}
                      </div>
                      <div className={clsx('text-[11px]', t.muted)}>
                        Used internally by backend for scene transitions, opening hook cadence &amp; ending structure.
                      </div>
                    </div>
                  ))}
                </div>

                {isThynkWhyCreator(currentCreator) && (
                  <div className={clsx('p-3.5 rounded-2xl border text-xs leading-relaxed', t.inset, t.body)}>
                    <strong className="text-indigo-500">Backend Start &amp; End Architecture (Zero Poetry Law):</strong> Opens with a concrete historical incident, media quote contrast, or 3 real named people tied to your topic (never rhyming couplets), and ends with a sharp historical verdict and self-accountability question.
                  </div>
                )}
              </div>
            );
          })()}

          {/* Step 4 Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setWizardStep(3)}
              className={clsx(btnBase, 'w-full sm:w-auto border', t.panel, t.text, t.hoverRow)}
            >
              <ArrowLeft size={17} />
              <span>Back to Duration</span>
            </button>

            <button
              type="button"
              onClick={() => setWizardStep(5)}
              className={clsx(
                btnBase,
                'w-full sm:w-auto min-h-[52px] px-8 text-base font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-xl hover:opacity-95'
              )}
            >
              <span>Continue to Research &amp; Outline</span>
              <ArrowRight size={19} />
            </button>
          </div>
        </section>
      )}

      {/* ====================================================================
       * STEP 5: DEDICATED RESEARCH, SOURCES, DOSSIER REVIEW & CHAPTER OUTLINE
       * (Clean Light/Dark Theme Cards & Big Buttons — right before Script Generation)
       * ================================================================== */}
      {wizardStep === 5 && (
        <section
          key="step-5-research"
          className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6"
          aria-labelledby="step5-research-heading"
        >
          <div className="text-center max-w-3xl mx-auto">
            <div className="text-xs font-extrabold uppercase tracking-widest text-indigo-500 mb-1">
              {hasGenreStep ? 'Step 5' : 'Step 4'} · Creator Research Engine, Sources &amp; Chapter Outline
            </div>
            <h2
              id="step5-research-heading"
              className={clsx('font-display text-2xl sm:text-4xl font-black tracking-tight', t.text)}
            >
              Research Sources &amp; Chapter Outline
            </h2>
            <p className={clsx('mt-1.5 text-sm sm:text-base', t.muted)}>
              Gather verified facts, Pakistani/regional data, books, and quotes in {activeResearchStyle.displayName}&apos;s research style, or skip straight to language &amp; script generation.
            </p>
          </div>

          {/* Big 2-Card Section Switcher: (1) Research Plan & Dossier Review vs (2) Before We Write & Chapter Outline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setResearchSubView('plan_and_dossier')}
              className={clsx(
                'rounded-[1.75rem] border p-5 sm:p-6 text-left transition-all flex items-start gap-4',
                focusRing,
                researchSubView === 'plan_and_dossier'
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-xl scale-[1.01]'
                  : clsx(t.panel, t.text, 'hover:border-indigo-500/50')
              )}
            >
              <div
                className={clsx(
                  'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                  researchSubView === 'plan_and_dossier'
                    ? 'bg-white/20 text-white'
                    : 'bg-indigo-500/10 text-indigo-500'
                )}
              >
                <Search size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg sm:text-xl font-extrabold">
                    1. Research Plan &amp; Fact Finder
                  </h3>
                  {dossier && (
                    <span
                      className={clsx(
                        'text-xs font-extrabold px-2.5 py-0.5 rounded-lg',
                        researchSubView === 'plan_and_dossier'
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      )}
                    >
                      {dossier.facts.length} Facts
                    </span>
                  )}
                </div>
                <p
                  className={clsx(
                    'text-xs sm:text-sm mt-1 leading-relaxed',
                    researchSubView === 'plan_and_dossier' ? 'text-white/90' : t.muted
                  )}
                >
                  Choose Ground vs. Abroad, Depth, Source Priorities, My Sources (PDF/Links/Books/Quotes), and review your collected Fact Cards.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setResearchSubView('outline_and_checklist')}
              className={clsx(
                'rounded-[1.75rem] border p-5 sm:p-6 text-left transition-all flex items-start gap-4',
                focusRing,
                researchSubView === 'outline_and_checklist'
                  ? 'bg-gradient-to-br from-purple-600 to-pink-600 border-purple-400 text-white shadow-xl scale-[1.01]'
                  : clsx(t.panel, t.text, 'hover:border-purple-500/50')
              )}
            >
              <div
                className={clsx(
                  'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                  researchSubView === 'outline_and_checklist'
                    ? 'bg-white/20 text-white'
                    : 'bg-purple-500/10 text-purple-500'
                )}
              >
                <Layers size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg sm:text-xl font-extrabold">
                    2. Checklist &amp; Chapter Outline
                  </h3>
                  <span
                    className={clsx(
                      'text-xs font-extrabold px-2.5 py-0.5 rounded-lg',
                      researchSubView === 'outline_and_checklist'
                        ? 'bg-white/20 text-white'
                        : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                    )}
                  >
                    {outline.length || budget.averageChapters} Chapters
                  </span>
                </div>
                <p
                  className={clsx(
                    'text-xs sm:text-sm mt-1 leading-relaxed',
                    researchSubView === 'outline_and_checklist' ? 'text-white/90' : t.muted
                  )}
                >
                  Review the 8-line &ldquo;Before we write&rdquo; checklist, build or reorder your chapter outline, and write your full multi-pass script.
                </p>
              </div>
            </button>
          </div>

          {/* SUB-VIEW 1: RESEARCH PLAN & DOSSIER REVIEW */}
          {researchSubView === 'plan_and_dossier' && (
            <div className="space-y-6">
              <ResearchStep
                topic={topicText || 'Documentary Investigation'}
                durationMinutes={durationMinutes}
                onDurationChange={handleSelectMinutes}
                config={researchConfig}
                onConfigChange={setResearchConfig}
                mySources={mySources}
                onMySourcesChange={setMySources}
                onQuestionsSync={(qs, mode) =>
                  setConfig(prev => ({
                    ...prev,
                    researchPlanOverrides: {
                      ...prev.researchPlanOverrides,
                      questions: qs,
                      questionMode: mode
                    }
                  }))
                }
                onRunResearch={handleRunResearch}
                onSkipToScript={() => setWizardStep(6)}
                isResearching={isResearching}
                progress={researchProgress}
                hasExistingDossier={Boolean(dossier)}
                isDarkMode={isDarkMode}
                researchStyle={activeResearchStyle}
                apiKey={apiKey}
              />

              {dossier && (
                <DossierReview
                  dossier={dossier}
                  onDossierChange={next => {
                    setDossier(next);
                    setConfig(prev => ({ ...prev, dossier: next }));
                  }}
                  onLockAndGenerate={handleLockDossierAndBuildOutline}
                  onRunMoreResearch={() => handleRunResearch()}
                  onFindMoreLikeCard={handleFindMoreLikeCard}
                  findingMoreCardId={findingMoreCardId}
                  isGeneratingBeatPlan={isGeneratingBeatPlan}
                  isDarkMode={isDarkMode}
                  researchStyle={activeResearchStyle}
                  apiKey={apiKey}
                />
              )}
            </div>
          )}

          {/* SUB-VIEW 2: BEFORE WE WRITE CHECKLIST + CHAPTER OUTLINE & SEQUENTIAL WRITER */}
          {researchSubView === 'outline_and_checklist' && (
            <div className="space-y-6">
              {/* Editable 8-Line "Before we write" Checklist Card */}
              <div className={clsx('rounded-[2rem] border p-5 sm:p-7 space-y-4 shadow-sm', t.surface)}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-500">
                      Writer Brief · {activeResearchStyle.displayName}
                    </div>
                    <h3 className={clsx('font-display text-lg sm:text-xl font-extrabold', t.text)}>
                      Before We Write (Editable 8-Line Checklist)
                    </h3>
                  </div>
                  <span className={clsx('text-xs font-mono font-bold', t.muted)}>
                    {budget.liveSummaryLine}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {editableBriefLines.map((line, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-extrabold text-indigo-500 w-5">
                        {i + 1}.
                      </span>
                      <input
                        type="text"
                        value={line}
                        onChange={e => {
                          const val = e.target.value;
                          setEditableBriefLines(prev =>
                            prev.map((item, idx) => (idx === i ? val : item))
                          );
                        }}
                        className={clsx(
                          'flex-1 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-medium outline-none',
                          t.field
                        )}
                      />
                    </div>
                  ))}
                </div>

                <div className={clsx('pt-4 border-t', t.line)}>
                  <label className={clsx('block text-xs sm:text-sm font-extrabold mb-1.5', t.text)}>
                    Extra instructions from me (optional)
                  </label>
                  <input
                    type="text"
                    value={extraWriterInstructions}
                    onChange={e => {
                      const val = e.target.value;
                      setExtraWriterInstructions(val);
                      setConfig(prev => ({ ...prev, extraWriterInstructions: val }));
                    }}
                    placeholder="e.g., Keep the opening scene in Orangi Town, emphasize the 1997 Mexico City reform comparison..."
                    className={clsx(
                      'w-full rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-medium outline-none',
                      t.field
                    )}
                  />
                </div>
              </div>

              {/* Long-Form Chapter Outline & Multi-Pass Script Card */}
              <div className={clsx('rounded-[2rem] border p-5 sm:p-7 space-y-5 shadow-sm', t.surface)}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h3 className={clsx('font-display text-lg sm:text-xl font-extrabold', t.text)}>
                      Chapter Outline &amp; Sequential Multi-Pass Script Writer
                    </h3>
                    <p className={clsx('text-xs sm:text-sm mt-0.5', t.muted)}>
                      Each chapter is written in its own dedicated pass with assigned facts ([F12]), Story-So-Far continuity, and anti-repetition checks.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={isBuildingOutline || !dossier}
                      onClick={handleLockDossierAndBuildOutline}
                      className={clsx(
                        btnBase,
                        'border',
                        t.inset,
                        t.text,
                        t.hoverRow
                      )}
                    >
                      {isBuildingOutline ? (
                        <Loader2 size={16} className="animate-spin text-indigo-500" />
                      ) : (
                        <Layers size={16} className="text-indigo-500" />
                      )}
                      <span>{outline.length > 0 ? 'Rebuild Chapter Outline' : 'Build Chapter Outline'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isWritingChapters || !dossier}
                      onClick={handleWriteFullLongFormDocumentary}
                      className={clsx(
                        btnBase,
                        'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:opacity-95'
                      )}
                    >
                      {isWritingChapters ? (
                        <>
                          <Loader2 size={17} className="animate-spin" />
                          <span>Writing Chapters...</span>
                        </>
                      ) : (
                        <>
                          <Play size={17} />
                          <span>
                            Write Full {durationMinutes}-Min Script ({budget.voiceoverWords.toLocaleString()} words)
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {!dossier && (
                  <div
                    className={clsx(
                      'p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm',
                      isDarkMode
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                        : 'border-amber-300 bg-amber-50 text-amber-900'
                    )}
                  >
                    <span className="font-semibold">
                      Run &ldquo;1. Research Plan &amp; Fact Finder&rdquo; first so every chapter has verified facts, quotes, and books assigned to it—or continue directly to Language &amp; Generate below.
                    </span>
                    <button
                      type="button"
                      onClick={() => setResearchSubView('plan_and_dossier')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white shrink-0"
                    >
                      Open Research Plan
                    </button>
                  </div>
                )}

                {isWritingChapters && (
                  <div
                    className={clsx(
                      'p-5 rounded-2xl border space-y-2.5',
                      isDarkMode
                        ? 'border-indigo-500/40 bg-indigo-950/30 text-indigo-200'
                        : 'border-indigo-200 bg-indigo-50 text-indigo-900'
                    )}
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                        {chapterWriteStatus}
                      </span>
                      <span>{chapterWritePercent}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                        style={{ width: `${chapterWritePercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {researchUsedSummary && (
                  <div
                    className={clsx(
                      'p-4 sm:p-5 rounded-2xl border space-y-2',
                      isDarkMode
                        ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                    )}
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm font-extrabold">
                      <span>
                        Research used: {researchUsedSummary.usedCount} of{' '}
                        {researchUsedSummary.totalApprovedCount} approved facts cited in script
                      </span>
                      <span>{researchUsedSummary.unusedFacts.length} unused</span>
                    </div>
                  </div>
                )}

                {outline.length > 0 && (
                  <div className="space-y-3">
                    {outline.map((chap, idx) => (
                      <div
                        key={chap.id}
                        className={clsx('p-4 sm:p-5 rounded-2xl border space-y-2.5', t.inset)}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 flex-1 min-w-[220px]">
                            <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                              Ch {chap.chapterNumber}
                            </span>
                            <input
                              type="text"
                              value={chap.title}
                              onChange={e => {
                                const val = e.target.value;
                                setOutline(prev =>
                                  prev.map(o => (o.id === chap.id ? { ...o, title: val } : o))
                                );
                              }}
                              className={clsx(
                                'flex-1 bg-transparent border-b border-transparent focus:border-indigo-500 text-sm font-extrabold focus:outline-none',
                                t.text
                              )}
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={clsx('text-xs font-medium', t.muted)}>
                              Target: <strong className={t.text}>{chap.targetWords}w</strong> ({chap.weightPct}%)
                            </span>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              {chap.assignedFactIds.length} facts
                            </span>
                            <button
                              type="button"
                              onClick={() => handleMoveChapter(idx, -1)}
                              disabled={idx === 0}
                              className={clsx('p-1.5 rounded-lg disabled:opacity-30', t.ghostBtn)}
                              title="Move chapter up"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveChapter(idx, 1)}
                              disabled={idx === outline.length - 1}
                              className={clsx('p-1.5 rounded-lg disabled:opacity-30', t.ghostBtn)}
                              title="Move chapter down"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={chap.purpose}
                          onChange={e => {
                            const val = e.target.value;
                            setOutline(prev =>
                              prev.map(o => (o.id === chap.id ? { ...o, purpose: val } : o))
                            );
                          }}
                          className={clsx('w-full rounded-xl px-3.5 py-2 text-xs sm:text-sm border outline-none', t.field)}
                        />

                        {chap.gapWarning && (
                          <div className="flex items-center justify-between gap-2 pt-1 text-xs text-amber-600 dark:text-amber-300 font-semibold">
                            <span className="flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 shrink-0" />
                              {chap.gapWarning}
                            </span>
                            <button
                              type="button"
                              disabled={fillingGapChapterId === chap.id}
                              onClick={() => handleFillChapterGap(chap)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1 shrink-0"
                            >
                              {fillingGapChapterId === chap.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                              Fill chapter gap
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5 Footer Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setWizardStep(hasGenreStep ? 4 : 3)}
              className={clsx(btnBase, 'w-full sm:w-auto border', t.panel, t.text, t.hoverRow)}
            >
              <ArrowLeft size={17} />
              <span>{hasGenreStep ? `Back to ${currentCreator.name} Genres` : 'Back to Duration & Budget'}</span>
            </button>

            <button
              type="button"
              onClick={() => setWizardStep(6)}
              className={clsx(
                btnBase,
                'w-full sm:w-auto min-h-[52px] px-8 text-base font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-xl hover:opacity-95'
              )}
            >
              <span>Continue to Language &amp; Generate Script</span>
              <ArrowRight size={19} />
            </button>
          </div>
        </section>
      )}

      {/* ====================================================================
       * STEP 6: LANGUAGE SELECTION (SINGLE OR DUAL) & FINAL GENERATE LAUNCH
       * ================================================================== */}
      {wizardStep === 6 && (
        <section
          key="step-6"
          className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6"
          aria-labelledby="step6-heading"
        >
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-extrabold uppercase tracking-widest text-indigo-500 mb-1">
              {hasGenreStep ? 'Step 6' : 'Step 5'} · Layer-2 Language Policy &amp; Broadcast Launch
            </div>
            <h2
              id="step6-heading"
              className={clsx('font-display text-2xl sm:text-4xl font-black tracking-tight', t.text)}
            >
              Choose Language &amp; Generate Script
            </h2>
            <p className={clsx('mt-1.5 text-sm sm:text-base', t.muted)}>
              Select one output language or enable Dual-Language mode to generate two synchronized scripts at once.
            </p>
          </div>

          {/* Language Cards & Dual Language Toggle */}
          <div className={clsx('rounded-[2rem] border p-5 sm:p-7 space-y-6 shadow-sm', t.surface)}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60 dark:border-white/10">
              <div>
                <h3 className={clsx('font-display text-lg font-extrabold flex items-center gap-2', t.text)}>
                  <Languages size={19} className="text-indigo-500" />
                  <span>Primary Output Language</span>
                </h3>
                <p className={clsx('text-xs sm:text-sm', t.muted)}>
                  Layer-2 Linguistic Policy automatically enforces spoken conversational cadence and English technical terms.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={!!config.enableDualScript}
                onClick={() => {
                  const nextEnabled = !config.enableDualScript;
                  updateConfig('enableDualScript', nextEnabled);
                  if (nextEnabled && (!config.secondaryLanguage || config.secondaryLanguage === config.language)) {
                    const fallback = config.language === 'English' ? 'Urdu (Proper)' : 'English';
                    updateConfig('secondaryLanguage', fallback);
                  }
                }}
                className={clsx(
                  'inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-extrabold transition-all',
                  config.enableDualScript
                    ? 'bg-indigo-500/15 border-indigo-500 text-indigo-500 dark:text-indigo-400'
                    : clsx(t.inset, t.text),
                  focusRing
                )}
              >
                <span>Dual Language Mode</span>
                <Switch on={!!config.enableDualScript} />
              </button>
            </div>

            {/* Featured Language Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FEATURED_LANGUAGES.map(lang => {
                const selected = config.language === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      updateConfig('language', lang.id);
                      if (config.enableDualScript && config.secondaryLanguage === lang.id) {
                        updateConfig('secondaryLanguage', lang.id === 'English' ? 'Urdu (Proper)' : 'English');
                      }
                    }}
                    className={clsx(
                      'rounded-2xl border p-4 text-left transition-all flex items-center justify-between gap-3',
                      focusRing,
                      selected
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-lg'
                        : clsx(t.inset, t.text, t.hoverRow)
                    )}
                  >
                    <div>
                      <div className="font-display font-extrabold text-sm sm:text-base">{lang.label}</div>
                      <div className={clsx('text-xs mt-0.5', selected ? 'text-indigo-100' : t.muted)}>
                        {lang.sub}
                      </div>
                    </div>
                    {selected && <Check size={17} className="shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* All 21 Languages Dropdown + Optional Arabic Dialect + Optional 2nd Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="creation-language-all" className={clsx('block text-xs font-extrabold uppercase tracking-wider mb-1.5', t.muted)}>
                  All Supported Languages ({LANGUAGES.length})
                </label>
                <select
                  id="creation-language-all"
                  value={config.language}
                  onChange={e => {
                    const newPrimary = e.target.value;
                    updateConfig('language', newPrimary);
                    if (config.enableDualScript && config.secondaryLanguage === newPrimary) {
                      updateConfig('secondaryLanguage', newPrimary === 'English' ? 'Urdu (Proper)' : 'English');
                    }
                  }}
                  className={clsx('w-full min-h-[46px] rounded-xl border px-3.5 text-sm font-bold outline-none cursor-pointer', t.field, focusRing)}
                >
                  {LANGUAGES.map(l => (
                    <option key={l} value={l} className={t.option}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {config.language === 'Arabic' && (
                <div>
                  <label htmlFor="creation-dialect" className={clsx('block text-xs font-extrabold uppercase tracking-wider mb-1.5', t.muted)}>
                    Arabic Dialect
                  </label>
                  <select
                    id="creation-dialect"
                    value={config.arabicDialect || ARABIC_DIALECTS[0]}
                    onChange={e => updateConfig('arabicDialect', e.target.value)}
                    className={clsx('w-full min-h-[46px] rounded-xl border px-3.5 text-sm font-bold outline-none cursor-pointer', t.field, focusRing)}
                  >
                    {ARABIC_DIALECTS.map(d => (
                      <option key={d} value={d} className={t.option}>
                        {d} Dialect
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {config.enableDualScript && (
                <div>
                  <label htmlFor="creation-second-language" className="block text-xs font-extrabold uppercase tracking-wider text-indigo-500 mb-1.5">
                    2nd Synchronized Language (Side-by-Side)
                  </label>
                  <select
                    id="creation-second-language"
                    value={config.secondaryLanguage || (config.language === 'English' ? 'Urdu (Proper)' : 'English')}
                    onChange={e => updateConfig('secondaryLanguage', e.target.value)}
                    className={clsx('w-full min-h-[46px] rounded-xl border px-3.5 text-sm font-bold outline-none cursor-pointer', t.field, focusRing)}
                  >
                    {LANGUAGES.filter(l => l !== config.language).map(l => (
                      <option key={l} value={l} className={t.option}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Step 6 Final Generate Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => setWizardStep(5)}
              className={clsx(btnBase, 'w-full sm:w-auto border', t.panel, t.text, t.hoverRow)}
            >
              <ArrowLeft size={17} />
              <span>Back to Research &amp; Outline</span>
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {dossier && (
                <button
                  type="button"
                  onClick={handleWriteFullLongFormDocumentary}
                  disabled={isWritingChapters || isGenerating}
                  className={clsx(
                    btnBase,
                    'w-full sm:w-auto min-h-[58px] px-7 text-sm sm:text-base font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xl hover:opacity-95'
                  )}
                >
                  {isWritingChapters ? (
                    <Loader2 size={20} className="animate-spin shrink-0" />
                  ) : (
                    <Play size={20} className="shrink-0" />
                  )}
                  <span>
                    {isWritingChapters
                      ? `Writing Chapter Script (${chapterWritePercent}%)...`
                      : `Write Multi-Pass Chapter Script (${budget.voiceoverWords.toLocaleString()}w)`}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={onGenerate}
                disabled={isGenerating || isWritingChapters || !config.topicOrScript.trim() || isSponsorInvalid}
                className={clsx(
                  'w-full sm:w-auto min-h-[58px] px-10 rounded-2xl font-display font-black text-base sm:text-lg tracking-tight text-white shadow-2xl transition-all duration-200',
                  'inline-flex items-center justify-center gap-3',
                  'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:scale-[1.01] hover:shadow-indigo-500/40',
                  'disabled:opacity-50 disabled:pointer-events-none',
                  focusRing
                )}
              >
                {isGenerating ? (
                  <Loader2 size={22} className="animate-spin shrink-0" />
                ) : (
                  <Wand2 size={22} className="shrink-0" />
                )}
                <span>
                  {isGenerating
                    ? 'Generating Broadcast Script...'
                    : config.writingMode === 'auto'
                    ? 'Auto-Match & Generate Script'
                    : config.writingMode === 'blend'
                    ? 'Blend Voices & Generate Script'
                    : `Generate ${currentCreator.name} Script`}
                </span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* HOW THIS VOICE & RESEARCH STYLE WORKS MODAL (Light/Dark Theme-Aware) */}
      {showVoiceDrawer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className={clsx(
              'w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-[2rem] border p-6 sm:p-8 shadow-2xl space-y-5',
              t.panel
            )}
          >
            <div className={clsx('flex items-start justify-between gap-4 pb-4 border-b', t.line)}>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-500">
                  Voice &amp; Research Blueprint
                </div>
                <h3 className={clsx('font-display text-xl sm:text-2xl font-extrabold mt-0.5', t.text)}>
                  {resolvedVoice.recipe.creatorName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceDrawer(false)}
                className={clsx('w-10 h-10 rounded-full flex items-center justify-center', t.ghostBtn)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-500">
                Voice &amp; Chapter Structure (5 Rules)
              </div>
              {voiceDescriptionLines.map((line, i) => (
                <div
                  key={i}
                  className={clsx('p-3.5 rounded-2xl border text-xs sm:text-sm font-medium', t.inset, t.body)}
                >
                  {line}
                </div>
              ))}

              <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-500 pt-2">
                Research Plan ({activeResearchStyle.displayName})
              </div>
              {researchStyleLines.map((line, i) => (
                <div
                  key={`res-${i}`}
                  className={clsx('p-3.5 rounded-2xl border text-xs sm:text-sm font-medium', t.inset, t.body)}
                >
                  {line}
                </div>
              ))}
            </div>

            <div className={clsx('pt-4 border-t', t.line)}>
              <button
                type="button"
                onClick={() => setShowVoiceDrawer(false)}
                className={clsx(btnBase, 'w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white')}
              >
                Close Blueprint
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIBRARY & MY CHANNEL STYLE MODAL */}
      <LibraryModal
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        apiKey={apiKey}
        isDarkMode={isDarkMode}
        onSelectVoiceRecipe={recipeId => handlePrimaryCreatorSelect(recipeId)}
      />
    </div>
  );
};

export default CreationForm;