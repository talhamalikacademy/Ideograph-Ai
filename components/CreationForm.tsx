import React, { useCallback, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { CreatorProfile, GeneratorConfig, UserPlan, TopicSuggestion, ReferenceImage } from '../types';
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
  Scissors,
  Scale,
  Flame,
  LayoutGrid,
  Home
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { analyzeTopicWithGemini } from '../services/geminiService';
import {
  isDhruvRatheeCreator,
  isThynkWhyCreator,
  hasCreatorGenreHierarchy,
  getSubGenreBlueprintsForCreator,
  matchCreatorSubGenreAndTranscript
} from '../src/data/creatorTranscripts';
import Avatar from './Avatar';

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
    desc: 'Anchor your script in one Primary Creator voice and blend up to 3 Secondary creator flavors.'
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
      body: 'Write your topic, paste a draft, or import a PDF, DOCX, or TXT file. Use AI Refine to sharpen short hooks.'
    },
    {
      title: 'Step 2: Choose a Creator, Auto Choose, or Blend Style',
      body: 'Lock a single creator bio, let AI auto-match your topic, or blend a primary creator with up to 3 secondary voices.'
    },
    {
      title: 'Step 3: Select Duration, Format & Sponsor details',
      body: 'Pick from 30s Shorts (~40s synthesis), 5-Min Deep Dives (~1m), or 20-Min Full Documentaries (4,000–5,000 words), plus optional sponsor callouts.'
    },
    {
      title: 'Step 4: Choose Video Sub-Genre & Transcript Routing',
      body: 'Match your script to the exact sub-genre (Politics Exposé, Science & AI, Mystery Debunk, History & Culture, or Personal Finance) or let Auto-Select detect it from your topic.'
    },
    {
      title: 'Step 5: Pick Single or Dual Language & Generate',
      body: 'Choose English, Roman Urdu, Proper Urdu, Hindi, Hinglish, or Dual-Language mode and launch the 4-Pillar engine.'
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
              4-Pillar Creator Bio + Sub-Genre Transcript + Layer-2 Language Policy Engine
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
  onOpenTemplates
}) => {
  const t = getTokens(isDarkMode);
  const topAnchorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const latestImagesRef = useRef<ReferenceImage[]>(config.referenceImages || []);
  const [isUploading, setIsUploading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [importNotice, setImportNotice] = useState<{ type: 'info' | 'warning' | 'error'; message: string } | null>(null);

  // Guided Wizard Step:
  // 0 = Professional Homepage Hub (3 Big Feature Boxes: Write a Script, Shorts Clipper, Argument Checker)
  // 1 = Step 1: Describe Your Idea Deeply
  // 2 = Step 2: Choose Creator / Auto Choose / Blend Style
  // 3 = Step 3: Choose Duration, Format & Sponsor Details
  // 4 = Step 4: Choose Video Sub-Genre Style & Transcript Routing
  // 5 = Step 5: Choose Output Language (Single or Dual) & Generate Script
  const [wizardStep, setWizardStep] = useState<number>(() =>
    config.templateId || config.topicOrScript.trim() ? 1 : 0
  );
  const [previewVideoIdx, setPreviewVideoIdx] = useState<number>(0);
  const [previewLangTab, setPreviewLangTab] = useState<'english' | 'hinglish' | 'urdu'>('urdu');

  // Smart Input State
  const [isAnalyzingTopic, setIsAnalyzingTopic] = useState(false);
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSuggestion[]>([]);
  const [hasShownSuggestions, setHasShownSuggestions] = useState(false);

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
  const isDhruvSelected = config.writingMode !== 'auto' && isDhruvRatheeCreator(currentCreator);
  const isThynkWhySelected = config.writingMode !== 'auto' && isThynkWhyCreator(currentCreator);
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

  const handlePrimaryCreatorSelect = (creatorId: string) => {
    setConfig(prev => ({
      ...prev,
      selectedStyleId: creatorId,
      subGenreId: 'auto',
      blendConfig: {
        primaryCreatorId: creatorId,
        secondaryCreatorIds: prev.blendConfig.secondaryCreatorIds.filter(id => id !== creatorId)
      }
    }));
  };

  const handleSmartAnalyze = async () => {
    if (!config.topicOrScript || config.topicOrScript.length < 5) return;
    setIsAnalyzingTopic(true);
    setImportNotice(null);
    try {
      const suggestions = await analyzeTopicWithGemini(config.topicOrScript, config.platform, apiKey);
      setTopicSuggestions(suggestions);
      setHasShownSuggestions(true);
    } catch (e: any) {
      console.error('Smart Analysis Failed', e);
      setImportNotice({
        type: 'error',
        message: e?.message || 'Could not refine topic. Please check your Gemini API key in Settings.'
      });
    } finally {
      setIsAnalyzingTopic(false);
    }
  };

  const applySuggestion = (suggestion: TopicSuggestion) => {
    updateConfig('topicOrScript', suggestion.refinedTopic);
    setTopicSuggestions([]);
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
        updateConfig('topicOrScript', cleaned);
        updateConfig('duration', 'Match Original Length');
        updateConfig('transformationType', 'Full Rewrite');
        setImportNotice({
          type: cleaned.length > truncationThreshold ? 'warning' : 'info',
          message:
            cleaned.length > truncationThreshold
              ? `Imported ${words.toLocaleString()} words (${cleaned.length.toLocaleString()} chars) from "${file.name}". Note: Input exceeds ${truncationThreshold.toLocaleString()} chars and will be truncated during generation.`
              : `Imported ${words.toLocaleString()} words (${cleaned.length.toLocaleString()} chars) from "${file.name}".`
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
  const showRefine = config.topicOrScript.length > 10 && !isScriptMode;
  const refCount = config.referenceImages?.length || 0;

  const creatorSubGenres = getSubGenreBlueprintsForCreator(currentCreator);
  const autoDetectedRoute = matchCreatorSubGenreAndTranscript(
    currentCreator,
    config.topicOrScript,
    'auto'
  );
  const matchedSubGenreRoute = matchCreatorSubGenreAndTranscript(
    currentCreator,
    config.topicOrScript,
    config.subGenreId || 'auto'
  );

  const activePacingRule =
    DURATION_PACING_MATRIX[config.duration] || DURATION_PACING_MATRIX['60 Seconds (Shorts)'];

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
              <span>4-Pillar Creator Bio • Sub-Genre Transcripts • Layer-2 Language Engine</span>
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
                  Craft a complete creator script step-by-step: describe your idea, pick or blend a creator, set duration & sponsor, route by sub-genre, and generate in any language.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-sm font-extrabold text-indigo-500 dark:text-indigo-400">
                <span>Start 5-Step Script Studio</span>
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
                  Convert any long-form script or draft into high-retention 9:16 vertical Shorts & Reels with standalone hooks, pacing, and safe-zone visuals.
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
                  Stress-test your script claims against Devil's Advocate counter-arguments, logic gaps, and generate balanced investigative bridge paragraphs.
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
      </div>
    );
  }

  /* ==========================================================================
   * STEPS 1–5: GUIDED MULTI-PAGE SCRIPT CREATION WIZARD
   * ======================================================================== */
  return (
    <div ref={topAnchorRef} className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 font-sans">
      <HowItWorksDialog open={showHelp} onClose={closeHelp} isDarkMode={isDarkMode} />

      {/* Top Home Navigation Bar (Numbered Stepper Removed) */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setWizardStep(0)}
            className={clsx(
              'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all',
              t.panel,
              t.text,
              t.hoverRow,
              focusRing
            )}
          >
            <Home size={15} className="text-indigo-500" />
            <span>Studio Home</span>
          </button>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <span className={t.muted}>Active Voice:</span>
            <span className={clsx('font-extrabold', t.text)}>
              {config.writingMode === 'auto'
                ? 'Auto Match'
                : config.writingMode === 'blend'
                ? `${currentCreator.name} + ${secondaryIds.length} Blend`
                : currentCreator.name}
            </span>
            <span aria-hidden="true" className={t.muted}>·</span>
            <span className="font-bold text-indigo-500">{config.duration}</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
       * IDEA & RESEARCH BRIEF
       * ================================================================== */}
      {wizardStep === 1 && (
        <section
          key="step-1"
          className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-5"
          aria-labelledby="step1-heading"
        >
          <div className="text-center max-w-2xl mx-auto mb-2">
            <div className="text-xs font-extrabold uppercase tracking-widest text-indigo-500 mb-1">
              Idea &amp; Research Brief
            </div>
            <h2
              id="step1-heading"
              className={clsx('font-display text-2xl sm:text-4xl font-black tracking-tight', t.text)}
            >
              Describe Your Video Idea Deeply
            </h2>
            <p className={clsx('mt-1.5 text-sm sm:text-base', t.muted)}>
              Type your topic, paste a research brief or rough draft, or import a document.
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
                  The structural outline is attached automatically. Describe your specific topic below.
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

          <div className={clsx('rounded-[2rem] border shadow-xl overflow-hidden flex flex-col', t.surface)}>
            {/* Toolbar */}
            <div className={clsx('flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-7 py-4 border-b', t.line)}>
              <div className={clsx('font-display flex items-center gap-2 text-base font-extrabold', t.text)}>
                <FileText size={18} className="text-indigo-500 shrink-0" />
                <span>Topic, Research Notes, or Script Draft</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {showRefine && (
                  <button
                    type="button"
                    onClick={handleSmartAnalyze}
                    disabled={isAnalyzingTopic}
                    className={clsx(
                      btnBase,
                      'min-h-[40px] px-4 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20',
                      isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                    )}
                  >
                    {isAnalyzingTopic ? <Loader2 size={15} className="animate-spin" /> : <BrainCircuit size={15} />}
                    <span>AI Refine Idea</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={clsx(
                    btnBase,
                    'min-h-[40px] px-4 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20',
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

            {/* Deep Textarea */}
            <textarea
              id="creation-topic"
              value={config.topicOrScript}
              onChange={e => updateConfig('topicOrScript', e.target.value)}
              placeholder="Describe your video idea deeply (e.g., 'Why AI chatbots like ChatGPT are causing cognitive offloading and shrinking human memory—include MIT & Microsoft research')... or paste a full draft in English, Urdu, Hindi, Hinglish, or Arabic."
              className={clsx(
                'w-full p-5 sm:p-7 bg-transparent border-none resize-y focus:ring-0 outline-none leading-relaxed',
                'text-base sm:text-lg font-medium min-h-[260px] sm:min-h-[320px]',
                t.text,
                isDarkMode ? 'placeholder-slate-500' : 'placeholder-slate-400',
                getLanguageClass(config.language)
              )}
              dir="auto"
            />

            {/* AI Refine Suggestions */}
            {topicSuggestions.length > 0 && (
              <div className={clsx('border-t px-5 sm:px-7 py-4', t.line)}>
                <div className={clsx('flex items-center gap-2 text-sm font-bold mb-3', t.text)}>
                  <Lightbulb size={16} className="text-amber-500" /> Suggested High-Retention Angles
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {topicSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applySuggestion(s)}
                      className={clsx(
                        'text-left rounded-2xl border p-4 transition-all hover:border-indigo-500',
                        t.inset,
                        focusRing
                      )}
                    >
                      <span className="block text-xs font-extrabold uppercase tracking-wider text-indigo-500 mb-1">
                        {s.type}
                      </span>
                      <span className={clsx('block text-sm font-bold leading-snug', t.text)}>
                        {s.refinedTopic}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className={clsx('px-5 sm:px-7 py-4 border-t flex flex-wrap items-center justify-between gap-3', t.line)}>
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
       * STEP 2: CHOOSE A CREATOR / AUTO CHOOSE / BLEND STYLE
       * ================================================================== */}
      {wizardStep === 2 && (
        <section
          key="step-2"
          className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6"
          aria-labelledby="step2-heading"
        >
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-extrabold uppercase tracking-widest text-indigo-500 mb-1">
              Creator DNA &amp; Voice Intelligence
            </div>
            <h2
              id="step2-heading"
              className={clsx('font-display text-2xl sm:text-4xl font-black tracking-tight', t.text)}
            >
              Choose Your Writing Mode &amp; Creator
            </h2>
            <p className={clsx('mt-1.5 text-sm sm:text-base', t.muted)}>
              Pick one creator directly, let AI auto-match your topic, or blend multiple creator voices.
            </p>
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
            <div className={clsx('rounded-[2rem] border p-5 sm:p-7 space-y-6', t.surface)}>
              <div>
                <h3 className={clsx('font-display text-lg font-extrabold mb-1', t.text)}>
                  {config.writingMode === 'blend'
                    ? '1. Select Primary Creator Voice (Base Bio & Structure)'
                    : 'Select Target Creator Persona'}
                </h3>
                <p className={clsx('text-xs sm:text-sm mb-4', t.muted)}>
                  All creator bio files and speech mechanics are pre-loaded and read-only locked.
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
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/15 shrink-0">
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

              {/* Secondary Blend Voices */}
              {config.writingMode === 'blend' && (
                <div className={clsx('pt-6 border-t', t.line)}>
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
              )}
            </div>
          ) : (
            <div className={clsx('rounded-[2rem] border p-6 sm:p-8 flex items-start gap-4', t.surface)}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg">
                <BrainCircuit size={26} />
              </div>
              <div>
                <h3 className={clsx('font-display text-lg sm:text-xl font-extrabold mb-1', t.text)}>
                  AI Auto-Match Intelligence Enabled
                </h3>
                <p className={clsx('text-sm sm:text-base leading-relaxed', t.muted)}>
                  Your topic will be analyzed against all {CREATORS.length} creator profiles (Dhruv Rathee, ThynkWhy, Nitish Rajput, Veritasium, Raftar & more) to lock the ideal creator bio and sub-genre transcript automatically.
                </p>
              </div>
            </div>
          )}

          {/* Step 2 Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setWizardStep(1)}
              className={clsx(btnBase, 'w-full sm:w-auto border', t.panel, t.text, t.hoverRow)}
            >
              <ArrowLeft size={17} />
              <span>Back to Idea</span>
            </button>

            <button
              type="button"
              onClick={() => setWizardStep(3)}
              className={clsx(
                btnBase,
                'w-full sm:w-auto min-h-[52px] px-8 text-base font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-xl hover:opacity-95'
              )}
            >
              <span>Continue to Duration & Sponsor</span>
              <ArrowRight size={19} />
            </button>
          </div>
        </section>
      )}

      {/* ====================================================================
       * STEP 3: DURATION, FORMAT & SPONSOR INTEGRATION
       * ================================================================== */}
      {wizardStep === 3 && (
        <section
          key="step-3"
          className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6"
          aria-labelledby="step3-heading"
        >
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-extrabold uppercase tracking-widest text-indigo-500 mb-1">
              Pacing, Word Depth &amp; Sponsorship
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
          <div className={clsx('rounded-[2rem] border p-5 sm:p-7 space-y-5', t.surface)}>
            <h3 className={clsx('font-display text-base sm:text-lg font-extrabold flex items-center gap-2', t.text)}>
              <Clock size={18} className="text-indigo-500" />
              <span>Select Target Script Duration & Word Count</span>
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
                    onClick={() => updateConfig('duration', d)}
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
              'rounded-[2rem] border p-5 sm:p-7 transition-colors',
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
                  <span>Include natural sponsorship disclosure line ("Sponsored by...")</span>
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
              <span>Back to Creator</span>
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
                  ? `Continue to ${currentCreator.name} Genres & Transcripts`
                  : 'Continue to Language & Launch'}
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
              <span>Continue to Language &amp; Launch</span>
              <ArrowRight size={19} />
            </button>
          </div>
        </section>
      )}

      {/* ====================================================================
       * LANGUAGE SELECTION (SINGLE OR DUAL) & FINAL GENERATE LAUNCH
       * ================================================================== */}
      {wizardStep === 5 && (
        <section
          key="step-5"
          className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6"
          aria-labelledby="step5-heading"
        >
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-extrabold uppercase tracking-widest text-indigo-500 mb-1">
              Layer-2 Language Policy &amp; Broadcast Launch
            </div>
            <h2
              id="step5-heading"
              className={clsx('font-display text-2xl sm:text-4xl font-black tracking-tight', t.text)}
            >
              Choose Language & Generate Script
            </h2>
            <p className={clsx('mt-1.5 text-sm sm:text-base', t.muted)}>
              Select one output language or enable Dual-Language mode to generate two synchronized scripts at once.
            </p>
          </div>

          {/* Language Cards & Dual Language Toggle */}
          <div className={clsx('rounded-[2rem] border p-5 sm:p-7 space-y-6', t.surface)}>
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
                    ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400'
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

          {/* Step 5 Final Generate Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => setWizardStep(hasGenreStep ? 4 : 3)}
              className={clsx(btnBase, 'w-full sm:w-auto border', t.panel, t.text, t.hoverRow)}
            >
              <ArrowLeft size={17} />
              <span>{hasGenreStep ? `Back to ${currentCreator.name} Genres` : 'Back to Duration'}</span>
            </button>

            <button
              type="button"
              onClick={onGenerate}
              disabled={isGenerating || !config.topicOrScript.trim() || isSponsorInvalid}
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
        </section>
      )}
    </div>
  );
};

export default CreationForm;