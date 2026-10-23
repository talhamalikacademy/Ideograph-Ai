import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DevilsAdvocateReport, ScriptData } from '../types';
import { runDevilsAdvocateResearch } from '../services/geminiService';
import { parseDocument } from '../services/fileParser';
import {
  Scale,
  ShieldAlert,
  Globe,
  CheckCircle2,
  Upload,
  FileText,
  Search,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  PlusCircle,
  BookOpen,
  Info,
  Sparkles,
  Trash2,
  Lightbulb,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface DevilsAdvocateLabProps {
  currentScript: ScriptData | null;
  onInsertBridgeIntoScript?: (paragraph: string) => void;
  isDarkMode: boolean;
  apiKey?: string;
}

const SCRIPT_CHECKER_TOOLTIP =
  'Paste or upload your full draft video script here. This checker scans your script sentence-by-sentence to flag unverified statistics, emotional bias, or one-sided claims, then searches the live web to verify facts and write balanced fixes.';

const TOPIC_GENERATOR_TOOLTIP =
  'Paste any video topic, thesis statement, or controversial question before you start writing. This generator researches the strongest opposing arguments, real-world counter-evidence, and expert critiques so you can build an unshakeable, objective script from scratch.';

/**
 * TYPE SYSTEM (one scale, used everywhere)
 *  - Sora (font-display)        → headings, card titles, buttons, labels   (bold, geometric, very legible)
 *  - Newsreader (font-editorial)→ the quoted claim being checked           (reads like a pull-quote)
 *  - Plus Jakarta Sans (sans)   → explanations / evidence / body           (14px mobile → 15px desktop, relaxed leading)
 *  - JetBrains Mono (font-mono) → numbers only (score, counts)
 * Long URLs / words always wrap instead of overflowing on small screens.
 */
const T = {
  sectionTitle:
    'font-display text-[1.35rem] sm:text-2xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white',
  cardTitle:
    'font-display text-[16px] sm:text-[17px] font-bold leading-snug tracking-tight text-slate-900 dark:text-white [overflow-wrap:anywhere]',
  label:
    'font-display text-[12px] sm:text-[13px] font-bold tracking-tight [overflow-wrap:anywhere]',
  body:
    'text-[14px] sm:text-[15px] leading-[1.75] font-medium text-slate-600 dark:text-slate-300 [overflow-wrap:anywhere]',
  quote:
    'font-editorial text-[17px] sm:text-[19px] leading-[1.45] font-semibold text-slate-900 dark:text-slate-50 [overflow-wrap:anywhere]',
  meta: 'text-[12px] sm:text-[13px] font-semibold text-slate-500 dark:text-slate-400 [overflow-wrap:anywhere]',
  note: 'text-[12.5px] sm:text-[13.5px] leading-relaxed font-medium text-slate-500 dark:text-slate-400'
};

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';

/* ============================================================================
 * DESIGN NOTES
 * ----------------------------------------------------------------------------
 * - Every surface, text and border colour comes from getTokens(), so dark and
 *   light mode are handled in one place.
 * - Boxes are separated by a surface tone and a hairline border, with padding
 *   that stays close to the text size (no oversized empty cards).
 * - Touch targets are at least 44px. Nothing is smaller than 12px text.
 * - Mobile: sticky action bar and a help bottom sheet.
 *   Desktop: run button sits in the input footer, help opens as a dialog.
 * - Motion: one reveal for the report. Everything else answers a click.
 * ========================================================================== */

const getTokens = (dark: boolean) => ({
  surface: dark ? 'bg-[#0f172a]/80 border-white/10' : 'bg-white border-slate-200',
  panel: dark ? 'bg-[#1e293b] border-white/10' : 'bg-white border-slate-200',
  popover: dark ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200',
  inset: dark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200',
  hoverRow: dark ? 'hover:bg-white/5' : 'hover:bg-slate-100',
  text: dark ? 'text-white' : 'text-slate-900',
  body: dark ? 'text-slate-200' : 'text-slate-700',
  muted: dark ? 'text-slate-400' : 'text-slate-600',
  line: dark ? 'border-white/10' : 'border-slate-200',
  chip: dark ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-slate-100 text-slate-700 border-slate-200',
  ghostBtn: dark
    ? 'bg-white/10 text-white hover:bg-white/15'
    : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
});
type Tokens = ReturnType<typeof getTokens>;

const btnBase = clsx(
  'inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl px-4 text-[13px] font-bold',
  'transition-colors active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  FOCUS_RING
);

type InputMode = 'script' | 'topic';

/** The two checker modes. Class strings are written out in full so Tailwind can see them. */
const MODES: Array<{
  id: InputMode;
  title: string;
  short: string;
  desc: string;
  tip: string;
  icon: LucideIcon;
  activeDark: string;
  activeLight: string;
  hoverBorder: string;
  iconOn: string;
  infoOn: string;
  infoHover: string;
  tipTitle: string;
  accent: string;
  accentDark: string;
}> = [
  {
    id: 'script',
    title: 'Script Fact & Bias Checker',
    short: 'Script checker',
    desc: 'Check a draft script sentence-by-sentence for weak claims & bias',
    tip: SCRIPT_CHECKER_TOOLTIP,
    icon: FileText,
    activeDark: 'bg-sky-500/15 border-sky-500 ring-1 ring-sky-500 shadow-lg shadow-sky-500/15',
    activeLight: 'bg-white border-sky-500 ring-1 ring-sky-500 shadow-lg shadow-sky-500/15',
    hoverBorder: 'hover:border-sky-400/60',
    iconOn: 'bg-sky-500 text-white shadow-md shadow-sky-500/30',
    infoOn: 'bg-sky-500 text-white',
    infoHover: 'hover:bg-sky-500/20 hover:text-sky-500',
    tipTitle: 'text-sky-400',
    accent: 'text-sky-600',
    accentDark: 'text-sky-400'
  },
  {
    id: 'topic',
    title: 'Topic Counter-Argument Generator',
    short: 'Topic generator',
    desc: 'Research opposing arguments & facts for any topic or thesis',
    tip: TOPIC_GENERATOR_TOOLTIP,
    icon: Globe,
    activeDark: 'bg-indigo-500/15 border-indigo-500 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/15',
    activeLight: 'bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-lg shadow-indigo-500/15',
    hoverBorder: 'hover:border-indigo-400/60',
    iconOn: 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30',
    infoOn: 'bg-indigo-500 text-white',
    infoHover: 'hover:bg-indigo-500/20 hover:text-indigo-500',
    tipTitle: 'text-indigo-400',
    accent: 'text-indigo-600',
    accentDark: 'text-indigo-400'
  }
];

const PANELS: Array<{ title: string; body: string }> = [
  { title: 'Bias & vulnerability audit', body: 'Flags weak, one-sided or unverified sentences with a suggested balanced fix.' },
  { title: 'Counter-arguments', body: 'The strongest opposing case for each claim, with evidence and a source link.' },
  { title: 'Fact-backed defense', body: 'Verified facts you can use to answer each counter-argument.' },
  { title: 'Script blocks', body: 'Paragraphs you can copy or insert straight into your script.' }
];

/* ============================================================================
 * HOW IT WORKS DIALOG
 * Bottom sheet on phones, centered dialog on larger screens.
 * ========================================================================== */

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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checker-help-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm motion-reduce:backdrop-blur-none"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={clsx(
          'relative w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar',
          'rounded-t-[2rem] sm:rounded-[2rem] border shadow-2xl',
          'animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 motion-reduce:animate-none',
          t.panel
        )}
      >
        <div
          className={clsx(
            'sticky top-0 z-10 flex items-start justify-between gap-4 px-5 sm:px-8 pt-5 sm:pt-7 pb-4 border-b backdrop-blur',
            t.line,
            isDarkMode ? 'bg-[#1e293b]/95' : 'bg-white/95'
          )}
        >
          <div className="min-w-0">
            <div className="mx-auto sm:hidden mb-3 h-1.5 w-10 rounded-full bg-slate-400/40" aria-hidden="true" />
            <h3 id="checker-help-title" className={clsx('font-display text-xl sm:text-2xl font-extrabold tracking-tight', t.text)}>
              How Argument & Fact Checker works
            </h3>
            <p className={clsx('mt-1 text-sm', t.muted)}>One script or topic in. A sourced audit and ready-to-use fixes out.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close help"
            className={clsx('shrink-0 w-11 h-11 rounded-full flex items-center justify-center', t.ghostBtn, FOCUS_RING)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 sm:px-8 py-6 space-y-7 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <section>
            <h4 className={clsx('font-display text-base font-bold mb-2', t.text)}>What this page does</h4>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
              It stress-tests your video before you publish. It checks claims against live web sources, finds the
              strongest opposing arguments, and gives you balanced paragraphs to add. It does not use creator styles or
              personas, so the result stays objective.
            </p>
          </section>

          <section>
            <h4 className={clsx('font-display text-base font-bold mb-3', t.text)}>How to use it</h4>
            <ol className="space-y-3">
              {[
                { title: 'Pick a tool', body: 'Script checker audits a full draft. Topic generator researches the other side of any thesis.' },
                { title: 'Add your text', body: 'Paste it, tap Import Editor Script to use the script you have open, or upload a .TXT, .DOCX or .PDF file.' },
                { title: 'Run the check', body: 'Tap the main button. The report appears below the editor.' }
              ].map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-sky-600 text-white text-sm font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className={clsx('text-sm font-bold', t.text)}>{step.title}</div>
                    <p className={clsx('text-sm leading-relaxed', t.muted)}>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h4 className={clsx('font-display text-base font-bold mb-3', t.text)}>What the report contains</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PANELS.map(p => (
                <li key={p.title} className={clsx('rounded-2xl border p-3.5', t.inset)}>
                  <div className={clsx('text-sm font-bold mb-0.5', t.text)}>{p.title}</div>
                  <p className={clsx('text-sm leading-relaxed', t.muted)}>{p.body}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className={clsx('rounded-2xl border p-4', t.inset)}>
            <h4 className={clsx('font-display text-base font-bold mb-2 flex items-center gap-2', t.text)}>
              <Lightbulb size={16} className="text-amber-500" /> Good to know
            </h4>
            <ul className={clsx('text-sm leading-relaxed space-y-1.5 list-disc pl-5', t.body)}>
              <li>Your text stays in the box until you clear it, so you can switch tools and run again.</li>
              <li>Insert adds a block to your open Script Editor. Copy puts it on your clipboard.</li>
              <li>Open the source links to confirm a fact before you publish.</li>
            </ul>
          </section>
        </div>

        <div
          className={clsx(
            'sticky bottom-0 px-5 sm:px-8 py-4 border-t backdrop-blur',
            t.line,
            isDarkMode ? 'bg-[#1e293b]/95' : 'bg-white/95'
          )}
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <button type="button" onClick={onClose} className={clsx(btnBase, 'w-full text-[14px] bg-sky-600 text-white hover:bg-sky-500')}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * LOADING SKELETON (shown while researching; no fake progress numbers)
 * ========================================================================== */

const ReportSkeleton: React.FC<{ t: Tokens }> = ({ t }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-hidden="true">
    {[0, 1].map(i => (
      <div
        key={i}
        className={clsx('rounded-2xl border p-4 space-y-3 animate-pulse motion-reduce:animate-none', t.surface, i === 1 && 'hidden md:block')}
      >
        <div className={clsx('h-3.5 rounded-full w-1/3', t.inset)} />
        <div className={clsx('h-16 rounded-xl', t.inset)} />
        <div className={clsx('h-3 rounded-full w-full', t.inset)} />
        <div className={clsx('h-3 rounded-full w-4/5', t.inset)} />
      </div>
    ))}
  </div>
);

/**
 * MODULE 4: "Argument & Fact Checker" (Standalone Deep-Research & Bias Balancer System)
 * STRICT UI ISOLATION: Zero Creator Style buttons, zero persona toggles, and zero Style Blender sliders.
 * Operates as a 100% objective, style-agnostic investigative stress-testing and live web research engine.
 */
const DevilsAdvocateLab: React.FC<DevilsAdvocateLabProps> = ({
  currentScript,
  onInsertBridgeIntoScript,
  isDarkMode,
  apiKey
}) => {
  const t = getTokens(isDarkMode);

  const [inputMode, setInputMode] = useState<'script' | 'topic'>('script');
  const [activeTooltip, setActiveTooltip] = useState<'script' | 'topic' | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>(() => {
    if (currentScript?.segments?.length) {
      return currentScript.segments.map(s => s.audio).join('\n\n');
    }
    return '';
  });
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isResearching, setIsResearching] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [report, setReport] = useState<DevilsAdvocateReport | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertedId, setInsertedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const modesRef = useRef<HTMLDivElement>(null);

  const closeHelp = useCallback(() => setShowHelp(false), []);

  // UI only: bring the finished report into view (important on phones where it renders below the fold)
  useEffect(() => {
    if (report && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [report]);

  // UI only: close the info popover on outside tap or Escape
  useEffect(() => {
    if (!activeTooltip) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (modesRef.current && !modesRef.current.contains(e.target as Node)) setActiveTooltip(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveTooltip(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [activeTooltip]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const parsed = await parseDocument(file);
      setInputText(prev => (prev ? `${prev}\n\n${parsed}` : parsed));
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to read uploaded file.');
    } finally {
      setIsUploading(false);
      // Reset so choosing the same file again still triggers onChange
      input.value = '';
    }
  };

  const handleImportCurrentDraft = () => {
    if (!currentScript?.segments?.length) return;
    setInputMode('script');
    setInputText(currentScript.segments.map(s => s.audio).join('\n\n'));
  };

  const handleRunDeepResearch = async () => {
    if (!inputText.trim() || isResearching) return;
    setIsResearching(true);
    setErrorMessage(null);
    try {
      const result = await runDevilsAdvocateResearch(inputText, inputMode, apiKey);
      setReport(result);
    } catch (err: any) {
      console.error('Argument Checker research failed:', err);
      setErrorMessage(err?.message || 'Failed to complete grounded web research.');
    } finally {
      setIsResearching(false);
    }
  };

  const handleCopyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setErrorMessage('Could not copy automatically. Select the text and copy it manually.');
    }
  };

  const handleInsertBridge = (paragraph: string, id: string) => {
    if (!onInsertBridgeIntoScript) return;
    onInsertBridgeIntoScript(paragraph);
    setInsertedId(id);
    setTimeout(() => setInsertedId(null), 2500);
  };

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const objectivityPct = report
    ? Math.max(0, Math.min(100, Number(report.overallObjectivityScore) || 0))
    : 0;
  const hasEditorScript = !!currentScript && currentScript.segments?.length > 0;
  const canRun = !isResearching && inputText.trim().length > 0;
  const activeMode = MODES.find(m => m.id === inputMode) || MODES[0];
  const showSteps = !report && !isResearching;

  const sectionShell = clsx('rounded-3xl border p-4 sm:p-5 md:p-6 space-y-4 shadow-sm', t.surface);

  const runLabelLong = inputMode === 'script' ? 'Check Script & Build Rebuttals' : 'Generate Counter-Arguments & Rebuttals';
  const runLabelShort = inputMode === 'script' ? 'Check script' : 'Generate';

  const runGradient =
    inputMode === 'script'
      ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 hover:shadow-sky-500/30'
      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/30';

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-12 sm:pb-16 animate-in fade-in slide-in-from-bottom-8 duration-700 motion-reduce:animate-none space-y-6 sm:space-y-8">
      <HowItWorksDialog open={showHelp} onClose={closeHelp} isDarkMode={isDarkMode} />

      {/* ============================ HEADER ============================ */}
      <header className="text-center relative z-20 px-2">
        <h2
          className={clsx(
            'text-3xl sm:text-5xl lg:text-6xl font-black mb-2.5 sm:mb-3 tracking-tight leading-[1.1] bg-clip-text text-transparent bg-gradient-to-r animate-gradient motion-reduce:animate-none',
            isDarkMode ? 'from-white via-sky-300 to-white' : 'from-slate-900 via-sky-600 to-slate-900'
          )}
          style={{ backgroundSize: '200% auto' }}
        >
          Argument & Fact Checker
        </h2>
        <p className={clsx('text-xs sm:text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed', t.muted)}>
          Verify claims, uncover blind spots, and generate live web-backed counter-arguments & rebuttals.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className={clsx(
              btnBase,
              'border border-sky-500/50 hover:bg-sky-500/10',
              isDarkMode ? 'text-sky-300' : 'text-sky-600'
            )}
          >
            <Info size={17} /> How this page works
          </button>

          <span
            className={clsx('inline-flex items-center gap-2 min-h-[44px] rounded-xl border px-4 text-[13px] font-semibold', t.chip)}
          >
            <activeMode.icon size={16} className={clsx('shrink-0', isDarkMode ? activeMode.accentDark : activeMode.accent)} />
            <span className="truncate max-w-[14rem]">Tool: {activeMode.short}</span>
          </span>
        </div>
      </header>

      {/* ============================ TOOL PICKER ============================ */}
      <div ref={modesRef} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto w-full text-left" role="group" aria-label="Choose a tool">
        {MODES.map(mode => {
          const Icon = mode.icon;
          const active = inputMode === mode.id;
          return (
            <div key={mode.id} className="relative">
              <button
                type="button"
                onClick={() => setInputMode(mode.id)}
                aria-pressed={active}
                className={clsx(
                  'w-full min-h-[76px] p-3.5 pr-14 rounded-2xl border transition-colors flex items-start gap-3 text-left',
                  FOCUS_RING,
                  active
                    ? isDarkMode
                      ? mode.activeDark
                      : mode.activeLight
                    : clsx(t.surface, mode.hoverBorder, 'opacity-85 hover:opacity-100')
                )}
              >
                <span
                  className={clsx(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    active ? mode.iconOn : isDarkMode ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-500'
                  )}
                >
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className={clsx('block font-display font-extrabold text-[15px] tracking-tight leading-snug', t.text)}>
                    {mode.title}
                  </span>
                  <span className={clsx('block text-[13px] leading-snug font-medium mt-0.5', t.muted)}>{mode.desc}</span>
                </span>
              </button>

              {/* Info button sits beside the card button, not inside it */}
              <button
                type="button"
                onMouseEnter={() => setActiveTooltip(mode.id)}
                onMouseLeave={() => setActiveTooltip(null)}
                onClick={() => setActiveTooltip(prev => (prev === mode.id ? null : mode.id))}
                aria-expanded={activeTooltip === mode.id}
                aria-label={`Info about ${mode.title}`}
                title={mode.id === 'script' ? 'What is this tester for?' : 'What is this generator for?'}
                className={clsx(
                  'absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                  FOCUS_RING,
                  activeTooltip === mode.id
                    ? mode.infoOn
                    : clsx(isDarkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-500', mode.infoHover)
                )}
              >
                <Info size={16} />
              </button>

              {activeTooltip === mode.id && (
                <div
                  role="tooltip"
                  onMouseEnter={() => setActiveTooltip(mode.id)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className={clsx(
                    'absolute left-0 right-0 sm:left-auto sm:right-0 sm:w-80 top-full mt-2 p-4 rounded-2xl border shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-150 motion-reduce:animate-none',
                    isDarkMode ? 'bg-[#0f172a] border-white/15 text-slate-200' : 'bg-slate-900 border-slate-800 text-white'
                  )}
                >
                  <div className={clsx('font-display font-bold text-[13px] mb-1.5 flex items-center gap-1.5', mode.tipTitle)}>
                    <Info size={13} /> What to paste & how it works
                  </div>
                  <p className="text-[13.5px] leading-relaxed font-medium">{mode.tip}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ============================ QUICK STEPS (empty state) ============================ */}
      {showSteps && (
        <ol className="grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto w-full" aria-label="Quick start">
          {[
            { title: 'Pick a tool', body: 'Script or topic.' },
            { title: 'Add text', body: 'Paste, import or upload.' },
            { title: 'Run check', body: 'Get a sourced report.' }
          ].map((step, i) => (
            <li key={step.title} className={clsx('rounded-2xl border p-3 sm:p-3.5', t.surface)}>
              <div className="flex items-center gap-2">
                <span className="shrink-0 w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className={clsx('font-display text-[13px] sm:text-sm font-bold leading-tight', t.text)}>{step.title}</span>
              </div>
              <p className={clsx('hidden sm:block text-[13px] mt-1', t.muted)}>{step.body}</p>
            </li>
          ))}
        </ol>
      )}

      {/* ============================ INPUT WORKSPACE ============================ */}
      <section
        aria-labelledby="checker-input-heading"
        className={clsx(
          'rounded-3xl border shadow-xl overflow-hidden transition-colors focus-within:border-sky-500/60',
          t.surface
        )}
      >
        {/* Top bar: active tool + actions */}
        <div className={clsx('px-4 sm:px-6 py-4 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-3', t.line)}>
          <div className="space-y-1 min-w-0">
            <h3
              id="checker-input-heading"
              className="flex items-center gap-2 font-display text-[14px] sm:text-[15px] font-extrabold tracking-tight"
            >
              {inputMode === 'script' ? (
                <>
                  <FileText size={16} className="shrink-0 text-sky-500" />
                  <span className="text-sky-600 dark:text-sky-400">Script Fact & Bias Checker is on</span>
                </>
              ) : (
                <>
                  <Globe size={16} className="shrink-0 text-indigo-500" />
                  <span className="text-indigo-600 dark:text-indigo-400">Topic Counter-Argument Generator is on</span>
                </>
              )}
            </h3>
            <p className={T.note}>
              {inputMode === 'script'
                ? 'Paste your draft script below to spot unverified claims, bias, and get ready-to-use balanced fixes.'
                : 'Paste any topic, claim, or thesis below to uncover the strongest counter-arguments and verified rebuttals.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch gap-2 shrink-0">
            {hasEditorScript && (
              <button
                type="button"
                onClick={handleImportCurrentDraft}
                className={clsx(
                  btnBase,
                  'col-span-2 sm:col-span-1 bg-sky-500/10 border border-sky-500/25 hover:bg-sky-500/20 group',
                  isDarkMode ? 'text-sky-300' : 'text-sky-700'
                )}
              >
                <Sparkles size={15} className="shrink-0 transition-transform duration-300 group-hover:rotate-12" />
                <span>Import Editor Script</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={clsx(
                btnBase,
                'border group',
                isDarkMode ? 'bg-white/5 text-slate-200 border-white/10 hover:bg-white/10' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
                inputText.trim().length === 0 && 'col-span-2 sm:col-span-1'
              )}
            >
              {isUploading ? (
                <Loader2 size={15} className="animate-spin shrink-0" />
              ) : (
                <Upload size={15} className="shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" />
              )}
              <span>{isUploading ? 'Reading file...' : 'Upload File'}</span>
            </button>
            {inputText.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className={clsx(btnBase, t.muted, 'hover:text-rose-500 hover:bg-rose-500/10 group')}
                title="Clear input"
                aria-label="Clear input"
              >
                <Trash2 size={15} className="shrink-0 transition-transform duration-300 group-hover:-rotate-12" />
                <span>Clear</span>
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".txt,.docx,.pdf"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        <label htmlFor="checker-input" className="sr-only">
          {inputMode === 'script' ? 'Paste your full draft script' : 'Paste your topic or thesis'}
        </label>
        <textarea
          id="checker-input"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder={
            inputMode === 'script'
              ? 'Paste your full draft script here. We will check every claim against live web sources, flag biased or weak sentences, and generate balanced fixes...'
              : 'Paste your video topic, controversial question, or thesis here (e.g., "Will AI replace software engineers by 2030?") to generate opposing arguments and fact-backed rebuttals...'
          }
          className={clsx(
            'w-full p-4 sm:p-6 bg-transparent border-none resize-y focus:ring-0 outline-none leading-[1.75] font-medium text-[16px] md:text-[17px] min-h-[200px] sm:min-h-[260px]',
            isDarkMode ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
          )}
          dir="auto"
        />

        <div className={clsx('px-4 sm:px-6 py-3.5 border-t flex flex-col md:flex-row md:items-center justify-between gap-3', t.line, isDarkMode ? 'bg-black/20' : 'bg-slate-50/70')}>
          <div className={clsx('flex flex-wrap items-center justify-between md:justify-start gap-x-4 gap-y-1.5 text-[13px] font-semibold', t.muted)}>
            <span className="flex items-center gap-1.5">
              <Search size={15} className="text-sky-500 shrink-0" />
              <span>Live Google Search fact-checking & counter-research</span>
            </span>
            <span className="font-mono font-bold tabular-nums">
              {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
            </span>
          </div>

          {/* Run button */}
          <button
            type="button"
            onClick={handleRunDeepResearch}
            disabled={isResearching || !inputText.trim()}
            aria-busy={isResearching}
            className={clsx(
              'ig-generate group relative overflow-hidden flex w-full md:w-auto min-h-[52px] px-7 py-3 rounded-2xl font-display font-extrabold text-base tracking-tight text-white shadow-xl transition-all duration-300 hover:shadow-2xl items-center justify-center gap-2.5 disabled:opacity-50 disabled:pointer-events-none',
              FOCUS_RING,
              runGradient
            )}
          >
            <span
              aria-hidden
              className="ig-shine absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 pointer-events-none opacity-0 group-hover:opacity-100"
            />
            {isResearching ? (
              <>
                <Loader2 size={19} className="animate-spin shrink-0 relative z-10" />
                <span className="relative z-10">Checking live web sources...</span>
              </>
            ) : (
              <>
                <Scale size={19} className="shrink-0 relative z-10 transition-transform duration-300 group-hover:-rotate-6" />
                <span className="relative z-10">{runLabelLong}</span>
              </>
            )}
          </button>
        </div>
      </section>

      {errorMessage && (
        <div role="alert" className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
          <p className="flex-1 text-rose-600 dark:text-rose-400 text-[14px] leading-relaxed font-semibold [overflow-wrap:anywhere]">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error"
            className={clsx('shrink-0 w-9 h-9 -m-1 rounded-full flex items-center justify-center hover:bg-rose-500/15', FOCUS_RING)}
          >
            <X size={16} className="text-rose-600 dark:text-rose-400" />
          </button>
        </div>
      )}

      {/* ============================ LOADING ============================ */}
      {isResearching && (
        <div className="space-y-4" role="status" aria-live="polite">
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-sky-500 shrink-0" />
            <div>
              <div className={clsx('font-display text-base font-bold', t.text)}>Checking live web sources</div>
              <div className={clsx('text-sm', t.muted)}>Long scripts can take a minute. Keep this tab open.</div>
            </div>
          </div>
          <ReportSkeleton t={t} />
        </div>
      )}

      {/* ============================ REPORT ============================ */}
      {report && !isResearching && (
        <div
          ref={reportRef}
          className="scroll-mt-20 space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none"
        >
          {/* Executive summary */}
          <div className={clsx('p-4 sm:p-5 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm', t.surface)}>
            <div className="min-w-0">
              <div className="font-display text-[13px] sm:text-sm font-bold text-sky-600 dark:text-sky-400 mb-1">
                Fact & argument audit complete
              </div>
              <p className="font-display text-[17px] sm:text-xl font-bold leading-snug tracking-tight text-slate-900 dark:text-white [overflow-wrap:anywhere]">
                {report.inputSummary}
              </p>
            </div>
            <div className="w-full md:w-60 shrink-0 rounded-2xl bg-sky-500/[0.07] dark:bg-sky-400/[0.08] border border-sky-500/15 p-3.5">
              <div className="font-mono text-3xl font-black text-sky-600 dark:text-sky-400 tabular-nums leading-none">
                {report.overallObjectivityScore}/100
              </div>
              <div
                className="mt-3 h-2 w-full rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden"
                role="progressbar"
                aria-valuenow={objectivityPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Objectivity and rigor score"
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-1000 ease-out motion-reduce:transition-none"
                  style={{ width: `${objectivityPct}%` }}
                />
              </div>
              <div className="mt-2 text-[12.5px] font-semibold text-slate-500 dark:text-slate-400">Objectivity & rigor score</div>
            </div>
          </div>

          {/* PANEL 1: Bias & vulnerability audit */}
          <section className={sectionShell}>
            <div className={clsx('flex flex-wrap items-end justify-between gap-3 border-b pb-3.5', t.line)}>
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1 font-display text-[12px] sm:text-[13px] font-bold">
                  Step 1 • Weak claims & bias flags
                </span>
                <h3 className={clsx(T.sectionTitle, 'mt-2')}>Bias & Vulnerability Audit</h3>
              </div>
              <span className="font-mono text-[13px] font-bold tabular-nums text-slate-500 dark:text-slate-400">
                {report.vulnerabilities.length} flags detected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {report.vulnerabilities.map(vuln => {
                const isHighRisk = vuln.severity.includes('High');
                const isMedRisk = vuln.severity.includes('Medium');
                return (
                  <div
                    key={vuln.id}
                    className={clsx(
                      'p-3.5 sm:p-4 rounded-2xl border border-l-4 space-y-3 min-w-0',
                      isHighRisk
                        ? 'border-l-rose-500 dark:border-l-rose-500'
                        : isMedRisk
                        ? 'border-l-amber-500 dark:border-l-amber-500'
                        : 'border-l-emerald-500 dark:border-l-emerald-500',
                      t.inset
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={clsx(T.label, 'text-slate-600 dark:text-slate-300')}>{vuln.issueType}</span>
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-display text-[12px] font-bold',
                          isHighRisk
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : isMedRisk
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        )}
                      >
                        <ShieldAlert size={13} className="shrink-0" />
                        <span>{vuln.severity}</span>
                      </span>
                    </div>

                    <blockquote
                      dir="auto"
                      className={clsx(T.quote, 'rounded-xl bg-black/[0.04] dark:bg-white/[0.06] px-3.5 py-2.5')}
                    >
                      “{vuln.sentenceOrClaim}”
                    </blockquote>

                    <p dir="auto" className={T.body}>
                      {vuln.explanation}
                    </p>

                    <div className={clsx('pt-3 border-t', t.line)}>
                      <div className="font-display text-[13px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="shrink-0" />
                        <span>Suggested balanced fix</span>
                      </div>
                      <p
                        dir="auto"
                        className="text-[14px] sm:text-[15px] leading-[1.7] font-semibold text-slate-800 dark:text-slate-100 [overflow-wrap:anywhere]"
                      >
                        {vuln.suggestedNeutralFix}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* PANEL 2 & 3: Steelman counter-arguments and defense */}
          <section className={sectionShell}>
            <div className={clsx('border-b pb-3.5', t.line)}>
              <span className="inline-flex items-center rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 px-3 py-1 font-display text-[12px] sm:text-[13px] font-bold">
                Step 2 & 3 • Opposing arguments vs. your fact-backed defense
              </span>
              <h3 className={clsx(T.sectionTitle, 'mt-2')}>Counter-Arguments & Rebuttal Matrix</h3>
              <p className={clsx(T.note, 'mt-1.5 max-w-2xl')}>
                The red side shows the strongest opposing argument; the green side gives you verified facts to defend your script.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {report.steelmanAndRebuttalMatrix.map((pair, idx) => (
                <div key={pair.id} className={clsx('grid grid-cols-1 lg:grid-cols-2 rounded-2xl border overflow-hidden', t.line)}>
                  {/* Panel 2: Steelman counter-argument */}
                  <div className={clsx('p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-l-4 border-l-rose-500 dark:border-l-rose-500 bg-rose-500/[0.04] space-y-3 min-w-0', t.line)}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-display text-[13px] sm:text-sm font-extrabold text-rose-600 dark:text-rose-400">
                        {String(idx + 1).padStart(2, '0')}. Strongest counter-argument
                      </span>
                      <span className="inline-flex rounded-full bg-rose-500/10 px-2.5 py-1 font-display text-[12px] font-bold text-rose-700 dark:text-rose-300 [overflow-wrap:anywhere]">
                        {pair.opposingSchoolOfThought}
                      </span>
                    </div>
                    <h4 dir="auto" className={T.cardTitle}>
                      {pair.steelmanCounterArgument}
                    </h4>
                    <p dir="auto" className={T.body}>
                      {pair.supportingEvidenceAndData}
                    </p>
                    {pair.counterSourceUrl && (
                      <a
                        href={pair.counterSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={clsx(
                          'group inline-flex items-center gap-1.5 max-w-full min-h-[44px] rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 text-[13px] font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 hover:border-sky-500/60 transition-colors',
                          FOCUS_RING
                        )}
                      >
                        <ExternalLink size={13} className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        <span className="truncate">{pair.counterSourceTitle || 'Verified Opposing Source'}</span>
                      </a>
                    )}
                  </div>

                  {/* Panel 3: Creator defense and rebuttal */}
                  <div className="p-4 sm:p-5 border-l-4 border-l-emerald-500 dark:border-l-emerald-500 bg-emerald-500/[0.04] space-y-3 min-w-0">
                    <span className="font-display text-[13px] sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="shrink-0" />
                      <span>Fact-backed defense & rebuttal</span>
                    </span>
                    <h4 dir="auto" className={T.cardTitle}>
                      {pair.creatorDefenseAndRebuttal}
                    </h4>
                    <p dir="auto" className={T.body}>
                      {pair.defenseCounterStatistics}
                    </p>
                    {pair.defenseSourceUrl && (
                      <a
                        href={pair.defenseSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={clsx(
                          'group inline-flex items-center gap-1.5 max-w-full min-h-[44px] rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 text-[13px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-colors',
                          FOCUS_RING
                        )}
                      >
                        <ExternalLink size={13} className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        <span className="truncate">{pair.defenseSourceTitle || 'Verified Rebuttal Source'}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PANEL 4: Ready-to-insert script blocks */}
          <section className={sectionShell}>
            <div className={clsx('border-b pb-3.5', t.line)}>
              <span className="inline-flex items-center rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-3 py-1 font-display text-[12px] sm:text-[13px] font-bold">
                Step 4 • Copy-paste script paragraphs
              </span>
              <h3 className={clsx(T.sectionTitle, 'mt-2')}>Ready-to-Insert Balanced Script Blocks</h3>
              <p className={clsx(T.note, 'mt-1.5 max-w-2xl')}>
                Drop these paragraphs directly into your script to address critics fairly and boost viewer trust.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {report.bulletproofBridgeBlocks.map(block => (
                <div key={block.id} className={clsx('p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between gap-3.5 min-w-0', t.inset)}>
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-display text-[14px] sm:text-[15px] font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400 [overflow-wrap:anywhere]">
                        {block.label}
                      </span>
                      <span className="inline-flex rounded-full bg-slate-200/80 dark:bg-white/10 px-2.5 py-1 font-display text-[12px] font-bold text-slate-600 dark:text-slate-300 [overflow-wrap:anywhere]">
                        {block.targetPlacement}
                      </span>
                    </div>
                    <p
                      dir="auto"
                      className="font-editorial text-[16.5px] sm:text-[17.5px] font-medium leading-[1.65] text-slate-800 dark:text-slate-100 [overflow-wrap:anywhere]"
                    >
                      “{block.scriptParagraph}”
                    </p>
                    <p className={T.meta}>
                      <span className="font-bold text-slate-700 dark:text-slate-200">Disarms:</span> {block.disarmsCriticism}
                    </p>
                  </div>

                  <div className={clsx('grid grid-cols-2 gap-2 pt-3 border-t', t.line)}>
                    <button
                      type="button"
                      onClick={() => handleCopyText(block.scriptParagraph, block.id)}
                      className={clsx(
                        btnBase,
                        'bg-indigo-600 hover:bg-indigo-500 text-white group',
                        currentScript && onInsertBridgeIntoScript ? 'col-span-1' : 'col-span-2'
                      )}
                    >
                      {copiedId === block.id ? (
                        <>
                          <Check size={15} className="animate-in zoom-in duration-200 motion-reduce:animate-none" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={15} className="transition-transform duration-300 group-hover:-rotate-6" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    {currentScript && onInsertBridgeIntoScript && (
                      <button
                        type="button"
                        onClick={() => handleInsertBridge(block.scriptParagraph, block.id)}
                        className={clsx(
                          btnBase,
                          'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 group'
                        )}
                        title="Insert this balance block into your active Script Editor"
                      >
                        {insertedId === block.id ? (
                          <>
                            <Check size={15} className="animate-in zoom-in duration-200 motion-reduce:animate-none" />
                            <span>Inserted</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle size={15} className="transition-transform duration-300 group-hover:rotate-90" />
                            <span>Insert</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Verified web grounding sources */}
            {report.groundedSources && report.groundedSources.length > 0 && (
              <div className={clsx('pt-4 border-t', t.line)}>
                <div className="font-display text-[14px] sm:text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white mb-2.5 flex items-center gap-2">
                  <BookOpen size={16} className="text-sky-500 shrink-0" />
                  <span>Live web sources ({report.groundedSources.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.groundedSources.map((src, i) => (
                    <a
                      key={i}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={clsx(
                        'group inline-flex items-center gap-1.5 max-w-full min-h-[44px] rounded-full border px-3.5 text-[13px] font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-500/10 hover:border-sky-500/40 transition-colors',
                        t.chip,
                        FOCUS_RING
                      )}
                    >
                      <ExternalLink size={13} className="shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      <span className="truncate">{src.title || src.uri}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default DevilsAdvocateLab;