import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CreatorStyleSchema,
  GeneratorConfig,
  ScriptData,
  ShortsClipperPackage
} from '../types';
import {
  CREATORS,
  creatorRegistry,
  LANGUAGES,
  ARABIC_DIALECTS,
  TRANSFORMATION_TYPES,
  getLanguageClass
} from '../constants';
import {
  generateVerticalShortsFromLongScript,
  generateVerticalVisualPreview,
  downloadTextFile
} from '../services/geminiService';
import { parseDocument } from '../services/fileParser';
import Avatar from './Avatar';
import {
  Scissors,
  User,
  Compass,
  Combine,
  ChevronDown,
  Check,
  Languages,
  Sparkles,
  Loader2,
  Upload,
  FileText,
  Copy,
  Download,
  Image as ImageIcon,
  Clock,
  Repeat,
  Zap,
  TrendingUp,
  Smartphone,
  Sliders,
  Info,
  Lightbulb,
  X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

/* ============================================================================
 * DESIGN NOTES
 * ----------------------------------------------------------------------------
 * - Every surface, text and border colour comes from getTokens(), so dark and
 *   light mode are handled in one place instead of per element.
 * - Touch targets are at least 44px. Nothing is smaller than 12px text.
 * - Mobile: sticky action bar, one Short at a time (tabs), storyboard collapsed.
 * - Desktop: sticky controls column, all 3 Shorts side by side.
 * - Motion: one reveal for the results. Everything else responds to a click.
 *   Reduced-motion users get no animation.
 * ========================================================================== */

interface ShortsClipperStudioProps {
  config: GeneratorConfig;
  setConfig: React.Dispatch<React.SetStateAction<GeneratorConfig>>;
  currentScript: ScriptData | null;
  isDarkMode: boolean;
  apiKey?: string;
}

type ShortItem = ShortsClipperPackage['shorts'][number];
type Frame = ShortItem['storyboardFrames'][number];
type PartKey = 'hook0to3s' | 'escalation3to15s' | 'climax15to50s' | 'infiniteLoop50to60s';

/** Keep in sync with the default cap in CreatorBlender (maxSecondaries). */
const MAX_SECONDARIES = 3;

const PIPELINE: Array<{ title: string; body: string }> = [
  {
    title: 'Cold-viewer isolation',
    body: 'Picks moments a first-time viewer can follow with no context.'
  },
  {
    title: '2.5 WPS pacing math',
    body: 'Matches word counts to exact timestamps at 150 WPM (2.5 words/sec) with zero dead air.'
  },
  {
    title: 'Seamless grammar loop',
    body: 'Constructs the ending so [ENDING] + [HOOK] reads as one unbroken sentence.'
  },
  {
    title: '9:16 storyboard',
    body: 'Adds timed vertical frames with captions and image prompts you can render.'
  }
];

const PARTS: Array<{
  key: PartKey;
  time: string;
  targetWords: string;
  label: string;
  explain: string;
  icon: LucideIcon;
  box: string;
  labelLight: string;
  labelDark: string;
  emphasis?: boolean;
}> = [
  {
    key: 'hook0to3s',
    time: '00:00 - 00:03',
    targetWords: '7–9 words',
    label: 'Pattern-interrupt hook',
    explain: '3 seconds = strictly 7 to 9 punchy words. Triggers an immediate curiosity gap.',
    icon: Zap,
    box: 'bg-rose-500/10 border-rose-500/25',
    labelLight: 'text-rose-700',
    labelDark: 'text-rose-300',
    emphasis: true
  },
  {
    key: 'escalation3to15s',
    time: '00:03 - 00:15',
    targetWords: '28–32 words',
    label: 'Rapid escalation',
    explain: '12 seconds = strictly 28 to 32 words. Short staccato sentences + one [Pause].',
    icon: TrendingUp,
    box: 'bg-amber-500/10 border-amber-500/25',
    labelLight: 'text-amber-700',
    labelDark: 'text-amber-300'
  },
  {
    key: 'climax15to50s',
    time: '00:15 - 00:48',
    targetWords: '80–90 words',
    label: 'Core reveal / Climax',
    explain: '33 seconds = strictly 80 to 90 words. Step-by-step breakdown + 1 physical analogy + clean numeric payoff.',
    icon: Sparkles,
    box: 'bg-indigo-500/10 border-indigo-500/25',
    labelLight: 'text-indigo-700',
    labelDark: 'text-indigo-300'
  },
  {
    key: 'infiniteLoop50to60s',
    time: '00:48 - 00:55',
    targetWords: '15–18 words',
    label: 'Infinite loop ending',
    explain: '7 seconds = strictly 15 to 18 words. Flows grammatically into the first word of the hook.',
    icon: Repeat,
    box: 'bg-emerald-500/10 border-emerald-500/25',
    labelLight: 'text-emerald-700',
    labelDark: 'text-emerald-300',
    emphasis: true
  }
];

const MODES: Array<{ id: string; label: string; icon: LucideIcon; desc: string }> = [
  { id: 'manual', label: 'Manual', icon: User, desc: 'You pick one creator voice.' },
  { id: 'auto', label: 'Auto match', icon: Compass, desc: 'The app picks the creator style that fits your script.' },
  {
    id: 'blend',
    label: 'Blend studio',
    icon: Combine,
    desc: `One main voice plus up to ${MAX_SECONDARIES} flavor voices. The main voice keeps the hook, structure and ending.`
  }
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-0';

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
    : 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  field: dark
    ? 'bg-black/20 border-white/10 text-white focus:border-indigo-400'
    : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500',
  option: dark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'
});
type Tokens = ReturnType<typeof getTokens>;

const btnBase = clsx(
  'inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl px-4 text-sm font-bold',
  'transition-colors active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  focusRing
);

/* ----------------------------------------------------------------------------
 * Text builders (shared by Copy and Download so the two never drift apart)
 * -------------------------------------------------------------------------- */

const buildCopyText = (s: ShortItem): string => {
  const st = s.sectionTimings;
  return `${s.title}\n\n[${st?.hookRange || '00:00 - 00:03'}] HOOK (${st?.hookWords ?? 8}w):\n${s.hook0to3s}\n\n[${st?.escalationRange || '00:03 - 00:15'}] RAPID ESCALATION (${st?.escalationWords ?? 30}w):\n${s.escalation3to15s}\n\n[${st?.climaxRange || '00:15 - 00:48'}] CORE REVEAL / CLIMAX (${st?.climaxWords ?? 85}w):\n${s.climax15to50s}\n\n[${st?.loopRange || '00:48 - 00:55'}] INFINITE LOOP ENDING (${st?.loopWords ?? 16}w):\n${s.infiniteLoop50to60s}`;
};

const buildDownloadText = (s: ShortItem, index: number, creatorApplied: string): string => {
  const st = s.sectionTimings;
  return [
    `VIRAL SHORT #${index + 1}: ${s.title}`,
    `Creator Voice: ${creatorApplied}`,
    `Spoken Words: ${s.wordCount} (~${s.estimatedSeconds}s @ 150 WPM / 2.5 WPS)`,
    `Extraction Rationale: ${s.extractionRationale}`,
    ``,
    `[${st?.hookRange || '00:00 - 00:03'}] 3-SECOND PATTERN-INTERRUPT HOOK (${st?.hookWords ?? 8} words):`,
    s.hook0to3s,
    ``,
    `[${st?.escalationRange || '00:03 - 00:15'}] RAPID ESCALATION (${st?.escalationWords ?? 30} words):`,
    s.escalation3to15s,
    ``,
    `[${st?.climaxRange || '00:15 - 00:48'}] THE CORE REVEAL / CLIMAX (${st?.climaxWords ?? 85} words):`,
    s.climax15to50s,
    ``,
    `[${st?.loopRange || '00:48 - 00:55'}] THE INFINITE LOOP ENDING (${st?.loopWords ?? 16} words):`,
    s.infiniteLoop50to60s,
    ``,
    `--- SEAMLESS INFINITE LOOP GRAMMAR CHECK ---`,
    s.loopBridgePreview || `${s.infiniteLoop50to60s} -> ${s.hook0to3s}`,
    ``,
    `--- 9:16 VERTICAL STORYBOARD PROMPTS ---`,
    ...s.storyboardFrames.map(
      f => `${f.timeRange} | Caption: "${f.captionOverlay}"\nPrompt: ${f.visualPrompt}`
    )
  ].join('\n');
};

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
      aria-labelledby="shorts-help-title"
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
        {/* Sticky header keeps the close button reachable while scrolling */}
        <div
          className={clsx(
            'sticky top-0 z-10 flex items-start justify-between gap-4 px-5 sm:px-8 pt-5 sm:pt-7 pb-4 border-b backdrop-blur',
            t.line,
            isDarkMode ? 'bg-[#1e293b]/95' : 'bg-white/95'
          )}
        >
          <div className="min-w-0">
            <div
              className="mx-auto sm:hidden mb-3 h-1.5 w-10 rounded-full bg-slate-400/40"
              aria-hidden="true"
            />
            <h3 id="shorts-help-title" className={clsx('text-xl sm:text-2xl font-black tracking-tight', t.text)}>
              How Shorts Clipper works
            </h3>
            <p className={clsx('mt-1 text-sm', t.muted)}>
              One long script in. Three ready-to-post Shorts out.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close help"
            className={clsx('shrink-0 w-11 h-11 rounded-full flex items-center justify-center', t.ghostBtn, focusRing)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 sm:px-8 py-6 space-y-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
          {/* What it does */}
          <section>
            <h4 className={clsx('text-base font-bold mb-2', t.text)}>What this page does</h4>
            <p className={clsx('text-sm sm:text-base leading-relaxed', t.body)}>
              Paste a long script or transcript, for example a 10 to 20 minute video. The app finds the strongest
              moments and rewrites them as 3 standalone Shorts of about 60 seconds each, in the creator voice you
              choose. Every Short comes with a 9:16 vertical storyboard you can turn into preview images.
            </p>
          </section>

          {/* How to use it: a real sequence, so numbers are meaningful */}
          <section>
            <h4 className={clsx('text-base font-bold mb-3', t.text)}>How to use it</h4>
            <ol className="space-y-3">
              {[
                {
                  title: 'Add your script',
                  body: 'Paste it, tap Import from editor to use the script you already have open, or upload a .TXT, .DOCX or .PDF file.'
                },
                {
                  title: 'Pick a voice',
                  body: 'Manual uses one creator. Auto match chooses for you. Blend studio mixes one main voice with up to three flavor voices. Then set the language and tone.'
                },
                {
                  title: 'Extract your Shorts',
                  body: 'Tap Extract and generate 3 viral Shorts. Results appear below the editor.'
                }
              ].map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
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

          {/* Pipeline */}
          <section>
            <h4 className={clsx('text-base font-bold mb-3', t.text)}>What happens behind the scenes</h4>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PIPELINE.map((stage, i) => (
                <li key={stage.title} className={clsx('rounded-2xl border p-4', t.inset)}>
                  <div className={clsx('text-sm font-bold mb-1', t.text)}>
                    Stage {i + 1}: {stage.title}
                  </div>
                  <p className={clsx('text-sm leading-relaxed', t.muted)}>{stage.body}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Anatomy of a Short */}
          <section>
            <h4 className={clsx('text-base font-bold mb-3', t.text)}>What each Short contains</h4>
            <ul className="space-y-2.5">
              {PARTS.map(part => {
                const Icon = part.icon;
                return (
                  <li key={part.key} className={clsx('flex items-start gap-3 rounded-2xl border p-3.5', part.box)}>
                    <Icon
                      size={18}
                      className={clsx('mt-0.5 shrink-0', isDarkMode ? part.labelDark : part.labelLight)}
                    />
                    <div className="min-w-0">
                      <div className={clsx('text-sm font-bold', isDarkMode ? part.labelDark : part.labelLight)}>
                        {part.label}
                        <span className={clsx('ml-2 font-medium tabular-nums', t.muted)}>{part.time}</span>
                      </div>
                      <p className={clsx('text-sm', t.body)}>{part.explain}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Tips */}
          <section className={clsx('rounded-2xl border p-4 sm:p-5', t.inset)}>
            <h4 className={clsx('text-base font-bold mb-2 flex items-center gap-2', t.text)}>
              <Lightbulb size={16} className="text-amber-500" /> Good to know
            </h4>
            <ul className={clsx('text-sm leading-relaxed space-y-1.5 list-disc pl-5', t.body)}>
              <li>Storyboard images are optional. Render one frame at a time or all frames for a Short.</li>
              <li>Copy a Short to your clipboard or download it as a .TXT file.</li>
              <li>In Blend studio the main voice always keeps the hook, the structure and the closing line.</li>
              <li>Your script stays in the box until you clear it, so you can change the voice and extract again.</li>
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
          <button
            type="button"
            onClick={onClose}
            className={clsx(btnBase, 'w-full bg-indigo-600 text-white hover:bg-indigo-500')}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
 * LOADING SKELETON (shown while extracting; no fake progress numbers)
 * ========================================================================== */

const ShortSkeleton: React.FC<{ t: Tokens; className?: string }> = ({ t, className }) => (
  <div
    className={clsx('rounded-3xl border p-5 space-y-4 animate-pulse motion-reduce:animate-none', t.surface, className)}
    aria-hidden="true"
  >
    <div className="flex items-center gap-3">
      <div className={clsx('w-9 h-9 rounded-xl', t.inset)} />
      <div className="flex-1 space-y-2">
        <div className={clsx('h-3.5 rounded-full w-3/4', t.inset)} />
        <div className={clsx('h-3 rounded-full w-1/3', t.inset)} />
      </div>
    </div>
    {[0, 1, 2, 3].map(i => (
      <div key={i} className={clsx('rounded-2xl h-20', t.inset)} />
    ))}
  </div>
);

/* ============================================================================
 * SHORT CARD
 * ========================================================================== */

interface ShortCardProps {
  short: ShortItem;
  index: number;
  isDarkMode: boolean;
  languageClass: string;
  copied: boolean;
  storyboardOpen: boolean;
  generatingAll: boolean;
  className?: string;
  onCopy: () => void;
  onDownload: () => void;
  onToggleStoryboard: () => void;
  onGenerateFrame: (frameIdx: number) => void;
  onGenerateAll: () => void;
}

const ShortCard: React.FC<ShortCardProps> = ({
  short,
  index,
  isDarkMode,
  languageClass,
  copied,
  storyboardOpen,
  generatingAll,
  className,
  onCopy,
  onDownload,
  onToggleStoryboard,
  onGenerateFrame,
  onGenerateAll
}) => {
  const t = getTokens(isDarkMode);
  const frames: Frame[] = short.storyboardFrames || [];
  const storyboardId = `storyboard-${short.id}`;

  return (
    <article
      className={clsx('flex-col rounded-3xl border p-4 sm:p-5 shadow-xl min-w-0', t.surface, t.text, className)}
      aria-label={`Short ${index + 1}: ${short.title}`}
    >
      {/* Header */}
      <header className={clsx('pb-4 mb-4 border-b', t.line)}>
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center font-black text-sm">
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-base leading-snug break-words">{short.title}</h4>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span
                className={clsx(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 tabular-nums',
                  isDarkMode
                    ? 'border-emerald-400/30 text-emerald-300 bg-emerald-500/10'
                    : 'border-emerald-600/30 text-emerald-700 bg-emerald-50'
                )}
              >
                <Clock size={12} /> About {short.estimatedSeconds} seconds
              </span>
              <span className={clsx('inline-flex items-center rounded-full border px-2.5 py-1 tabular-nums', t.chip)}>
                {short.wordCount} words
              </span>
              <span className={clsx('inline-flex items-center gap-1 rounded-full border px-2.5 py-1', t.chip)}>
                <Smartphone size={12} /> 9:16
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Why this moment */}
      <div className={clsx('rounded-2xl border p-3.5 mb-4', t.inset)}>
        <div className={clsx('text-xs font-bold mb-1', t.muted)}>Why this moment was chosen</div>
        <p className={clsx('text-sm leading-relaxed', t.body)}>{short.extractionRationale}</p>
      </div>

      {/* The four timed parts (2.5 Words/Sec Math) */}
      <div className={clsx('space-y-3 flex-1', languageClass)} dir="auto">
        {PARTS.map(part => {
          const Icon = part.icon;
          const text = short[part.key];
          const st = short.sectionTimings;
          const dynamicTime =
            part.key === 'hook0to3s'
              ? st?.hookRange || part.time
              : part.key === 'escalation3to15s'
              ? st?.escalationRange || part.time
              : part.key === 'climax15to50s'
              ? st?.climaxRange || part.time
              : st?.loopRange || part.time;
          const dynamicWords =
            part.key === 'hook0to3s'
              ? st?.hookWords
              : part.key === 'escalation3to15s'
              ? st?.escalationWords
              : part.key === 'climax15to50s'
              ? st?.climaxWords
              : st?.loopWords;

          return (
            <section key={part.key} className={clsx('rounded-2xl border p-3.5', part.box)}>
              <div
                className={clsx(
                  'flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-1.5 text-xs font-bold',
                  isDarkMode ? part.labelDark : part.labelLight
                )}
                dir="ltr"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon size={13} /> {part.label}
                </span>
                <span className="tabular-nums font-semibold opacity-90">
                  [{dynamicTime}] • {dynamicWords !== undefined ? `${dynamicWords}w` : part.targetWords}
                </span>
              </div>
              <p
                className={clsx(
                  'text-sm sm:text-[15px] leading-relaxed break-words',
                  part.emphasis ? 'font-semibold' : '',
                  t.body
                )}
              >
                {text}
              </p>
            </section>
          );
        })}

        {/* Seamless Grammatical Loop Seam Verification */}
        <div
          className={clsx(
            'rounded-2xl border p-3 text-xs leading-relaxed',
            isDarkMode
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
              : 'bg-emerald-50/80 border-emerald-500/30 text-emerald-900'
          )}
          dir="auto"
        >
          <div className="flex items-center gap-1.5 font-bold mb-1 text-[11px] uppercase tracking-wider opacity-85" dir="ltr">
            <Repeat size={12} /> Seamless Loop Seam ([Ending] + [Hook])
          </div>
          <p className="italic font-medium break-words">
            "{short.loopBridgePreview || `${short.infiniteLoop50to60s} ➔ ${short.hook0to3s}`}"
          </p>
        </div>
      </div>

      {/* Storyboard (collapsed by default so phones are not a wall of scrolling) */}
      <div className={clsx('mt-5 pt-4 border-t', t.line)}>
        <button
          type="button"
          onClick={onToggleStoryboard}
          aria-expanded={storyboardOpen}
          aria-controls={storyboardId}
          className={clsx(
            'w-full min-h-[44px] flex items-center justify-between gap-3 rounded-xl px-3 text-left',
            t.hoverRow,
            focusRing
          )}
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <ImageIcon size={16} className="text-indigo-500 shrink-0" />
            Vertical storyboard
            <span className={clsx('font-medium', t.muted)}>({frames.length} frames)</span>
          </span>
          <ChevronDown
            size={18}
            className={clsx('shrink-0 transition-transform motion-reduce:transition-none', storyboardOpen && 'rotate-180')}
          />
        </button>

        {storyboardOpen && (
          <div id={storyboardId} className="mt-3 space-y-3">
            <button
              type="button"
              onClick={onGenerateAll}
              disabled={generatingAll}
              className={clsx(btnBase, 'w-full text-indigo-500 border border-indigo-500/40 hover:bg-indigo-500/10')}
            >
              {generatingAll ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Rendering all frames...
                </>
              ) : (
                <>
                  <ImageIcon size={16} /> Render all frames
                </>
              )}
            </button>

            {frames.map((frame, frameIdx) => (
              <div key={frame.id} className={clsx('rounded-2xl border p-3.5 space-y-2.5', t.inset)}>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                  <span className="font-bold text-indigo-500 tabular-nums">{frame.timeRange}</span>
                  {frame.captionOverlay && (
                    <span className={clsx('font-semibold break-words', t.body)}>Caption: "{frame.captionOverlay}"</span>
                  )}
                </div>
                <p className={clsx('text-xs leading-relaxed break-words', t.muted)}>{frame.visualPrompt}</p>

                {frame.generatedImageUrl ? (
                  <div
                    className={clsx(
                      'relative mx-auto w-44 sm:w-48 aspect-[9/16] rounded-2xl overflow-hidden border shadow-lg',
                      t.line
                    )}
                  >
                    <img
                      src={frame.generatedImageUrl}
                      alt={frame.captionOverlay || `Frame at ${frame.timeRange}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Safe-zone guides: platform UI covers the top 15% and bottom 25% */}
                    <div className="absolute inset-x-0 top-0 h-[15%] bg-black/35 flex items-center justify-center text-[11px] font-semibold text-white/80">
                      Top safe zone
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-[25%] bg-black/45 flex items-center justify-center px-2 text-center text-xs font-bold text-white">
                      {frame.captionOverlay}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onGenerateFrame(frameIdx)}
                    disabled={frame.isGeneratingImage}
                    className={clsx(
                      'w-full min-h-[44px] rounded-xl text-sm font-bold flex items-center justify-center gap-2',
                      'text-sky-600 hover:bg-sky-500/10 disabled:opacity-60',
                      isDarkMode && 'text-sky-300',
                      focusRing
                    )}
                  >
                    {frame.isGeneratingImage ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Rendering frame...
                      </>
                    ) : (
                      <>
                        <ImageIcon size={15} /> Render this frame
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={clsx('mt-5 pt-4 border-t flex items-center gap-2', t.line)}>
        <button
          type="button"
          onClick={onCopy}
          className={clsx(btnBase, 'flex-1 bg-indigo-600 text-white hover:bg-indigo-500')}
        >
          {copied ? (
            <>
              <Check size={16} /> Copied
            </>
          ) : (
            <>
              <Copy size={16} /> Copy script
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onDownload}
          className={clsx(btnBase, t.ghostBtn)}
          title="Download this Short as a .TXT file"
        >
          <Download size={16} /> <span>.TXT</span>
        </button>
      </div>
    </article>
  );
};

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

const ShortsClipperStudio: React.FC<ShortsClipperStudioProps> = ({
  config,
  setConfig,
  currentScript,
  isDarkMode,
  apiKey
}) => {
  const t = getTokens(isDarkMode);

  const [sourceScriptText, setSourceScriptText] = useState<string>(() => {
    if (currentScript?.segments?.length) {
      return currentScript.segments.map(s => s.audio).join('\n\n');
    }
    return '';
  });
  const [showStyleSelector, setShowStyleSelector] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clipperResult, setClipperResult] = useState<ShortsClipperPackage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeShort, setActiveShort] = useState<number>(0);
  const [openStoryboards, setOpenStoryboards] = useState<Record<string, boolean>>({});
  const [generatingAll, setGeneratingAll] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const styleMenuRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const closeHelp = useCallback(() => setShowHelp(false), []);

  const allCreatorSchemas = useMemo(() => creatorRegistry.getAll(), []);
  const currentCreatorSchema: CreatorStyleSchema = useMemo(
    () => creatorRegistry.get(config.selectedStyleId),
    [config.selectedStyleId]
  );
  const currentCreator =
    currentCreatorSchema.profile ||
    CREATORS.find(c => c.id === currentCreatorSchema.id) ||
    CREATORS[0];
  const secondaryIds = config.blendConfig.secondaryCreatorIds;
  const atSecondaryLimit = secondaryIds.length >= MAX_SECONDARIES;

  const wordCount = useMemo(
    () => (sourceScriptText.trim() ? sourceScriptText.trim().split(/\s+/).length : 0),
    [sourceScriptText]
  );
  const canExtract = !isExtracting && sourceScriptText.trim().length > 0;
  const hasEditorScript = !!currentScript && currentScript.segments?.length > 0;

  const voiceSummary =
    config.writingMode === 'auto'
      ? 'Auto match'
      : config.writingMode === 'blend'
      ? `${currentCreator.name} + ${secondaryIds.length} flavor`
      : currentCreator.name;

  /* Close the creator menu on outside click or Escape */
  useEffect(() => {
    if (!showStyleSelector) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (styleMenuRef.current && !styleMenuRef.current.contains(e.target as Node)) {
        setShowStyleSelector(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowStyleSelector(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showStyleSelector]);

  /* ------------------------------ config handlers ------------------------------ */

  const updateConfig = (field: keyof GeneratorConfig, value: any) => {
    setConfig(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'selectedStyleId') {
        const cleanedSecondaries = prev.blendConfig.secondaryCreatorIds.filter(id => id !== value);
        next.blendConfig = {
          ...prev.blendConfig,
          primaryCreatorId: value,
          secondaryCreatorIds: cleanedSecondaries
        };
      }
      return next;
    });
  };

  const toggleSecondaryCreator = (id: string) => {
    if (id === config.selectedStyleId) return;
    const current = config.blendConfig.secondaryCreatorIds;
    const exists = current.includes(id);
    if (!exists && current.length >= MAX_SECONDARIES) return;
    const updated = exists ? current.filter(c => c !== id) : [...current, id];
    setConfig(prev => ({
      ...prev,
      blendConfig: { ...prev.blendConfig, secondaryCreatorIds: updated }
    }));
  };

  /* ------------------------------- input handlers ------------------------------ */

  const handleImportCurrentEditor = () => {
    if (!currentScript || !currentScript.segments?.length) return;
    const fullText = currentScript.segments
      .map((s, idx) => `[Scene ${idx + 1}]\nVisual: ${s.visual}\nNarration: ${s.audio}`)
      .join('\n\n');
    setSourceScriptText(fullText);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const text = await parseDocument(file);
      setSourceScriptText(prev => (prev ? `${prev}\n\n${text}` : text));
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not read that file. Try a .TXT, .DOCX or .PDF file.');
    } finally {
      setIsUploading(false);
      // Reset so choosing the same file again still triggers onChange
      input.value = '';
    }
  };

  /* ------------------------------- extraction ---------------------------------- */

  const handleExtractShorts = async () => {
    if (!canExtract) return;
    setIsExtracting(true);
    setErrorMessage(null);
    try {
      const pkg = await generateVerticalShortsFromLongScript(
        sourceScriptText,
        config,
        currentCreatorSchema,
        apiKey
      );
      setClipperResult(pkg);
      setActiveShort(0);
      setOpenStoryboards({});
      setGeneratingAll({});
      // On phones the results sit far below the button, so bring them into view
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    } catch (err: any) {
      console.error('Shorts Clipper error:', err);
      setErrorMessage(err?.message || 'Could not extract Shorts. Check your script and API key, then try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  /* ------------------------------ storyboard frames ---------------------------- */

  const patchFrame = (shortIdx: number, frameIdx: number, patch: Partial<Frame>) => {
    setClipperResult(prev => {
      if (!prev) return prev;
      const nextShorts = [...prev.shorts];
      const nextFrames = [...nextShorts[shortIdx].storyboardFrames];
      nextFrames[frameIdx] = { ...nextFrames[frameIdx], ...patch };
      nextShorts[shortIdx] = { ...nextShorts[shortIdx], storyboardFrames: nextFrames };
      return { ...prev, shorts: nextShorts };
    });
  };

  const handleGenerateVerticalFrame = async (shortIdx: number, frameIdx: number) => {
    if (!clipperResult) return;
    const targetFrame = clipperResult.shorts[shortIdx]?.storyboardFrames[frameIdx];
    if (!targetFrame || targetFrame.isGeneratingImage) return;

    patchFrame(shortIdx, frameIdx, { isGeneratingImage: true });
    try {
      const dataUrl = await generateVerticalVisualPreview(targetFrame.visualPrompt, apiKey);
      patchFrame(shortIdx, frameIdx, { generatedImageUrl: dataUrl, isGeneratingImage: false });
    } catch (err) {
      console.error('Failed to generate 9:16 frame:', err);
      patchFrame(shortIdx, frameIdx, { isGeneratingImage: false });
      setErrorMessage('One storyboard frame could not be rendered. Try that frame again.');
    }
  };

  const handleGenerateAllFramesForShort = async (shortIdx: number) => {
    if (!clipperResult) return;
    const target = clipperResult.shorts[shortIdx];
    if (!target || generatingAll[target.id]) return;

    setGeneratingAll(prev => ({ ...prev, [target.id]: true }));
    try {
      const frames = target.storyboardFrames || [];
      for (let i = 0; i < frames.length; i++) {
        if (!frames[i].generatedImageUrl) {
          await handleGenerateVerticalFrame(shortIdx, i);
        }
      }
    } finally {
      setGeneratingAll(prev => ({ ...prev, [target.id]: false }));
    }
  };

  /* --------------------------------- output actions ---------------------------- */

  const handleCopyShort = async (shortIdx: number) => {
    if (!clipperResult) return;
    const s = clipperResult.shorts[shortIdx];
    try {
      await navigator.clipboard.writeText(buildCopyText(s));
      setCopiedId(s.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setErrorMessage('Could not copy automatically. Use the .TXT download instead.');
    }
  };

  const handleDownloadShortTxt = (shortIdx: number) => {
    if (!clipperResult) return;
    const s = clipperResult.shorts[shortIdx];
    const cleanName = s.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    downloadTextFile(buildDownloadText(s, shortIdx, clipperResult.creatorApplied), `${cleanName}_short.txt`);
  };

  const toggleStoryboard = (id: string) =>
    setOpenStoryboards(prev => ({ ...prev, [id]: !prev[id] }));

  /* ------------------------------ shared UI pieces ----------------------------- */

  const ExtractLabel = isExtracting ? (
    <>
      <Loader2 size={20} className="animate-spin shrink-0" />
      <span>Extracting...</span>
    </>
  ) : (
    <>
      <Scissors size={20} className="shrink-0" />
      <span>Extract and generate 3 viral Shorts</span>
    </>
  );

  const extractButtonClasses = clsx(
    'min-h-[52px] rounded-2xl px-5 font-black text-base shadow-xl transition-transform active:scale-[0.98]',
    'inline-flex items-center justify-center gap-2.5 text-white',
    'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110',
    'disabled:opacity-50 disabled:pointer-events-none',
    isExtracting && 'cursor-wait',
    focusRing
  );

  const showSteps = !clipperResult && !isExtracting;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 pb-12 sm:pb-16">
      <HowItWorksDialog open={showHelp} onClose={closeHelp} isDarkMode={isDarkMode} />

      {/* ============================ HEADER ============================ */}
      <header className="text-center mb-6 sm:mb-10 px-2">
        <h2
          className={clsx(
            'text-3xl sm:text-5xl lg:text-6xl font-black mb-2.5 sm:mb-3 tracking-tight leading-[1.1] bg-clip-text text-transparent bg-gradient-to-r animate-gradient motion-reduce:animate-none',
            isDarkMode ? 'from-white via-indigo-300 to-white' : 'from-slate-900 via-indigo-600 to-slate-900'
          )}
          style={{ backgroundSize: '200% auto' }}
        >
          Turn scripts into viral Shorts
        </h2>
        <p className={clsx('text-xs sm:text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed', t.muted)}>
          Paste a long script. Get 3 standalone 60-second Shorts with 9:16 storyboards.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className={clsx(
              btnBase,
              'border border-indigo-500/50 text-indigo-500 hover:bg-indigo-500/10',
              isDarkMode && 'text-indigo-300'
            )}
          >
            <Info size={17} /> How this page works
          </button>

          <span
            className={clsx(
              'inline-flex items-center gap-2 min-h-[44px] rounded-xl border px-4 text-sm font-semibold',
              t.chip
            )}
          >
            {config.writingMode === 'blend' ? (
              <Combine size={16} className="text-purple-500 shrink-0" />
            ) : config.writingMode === 'auto' ? (
              <Compass size={16} className="text-indigo-500 shrink-0" />
            ) : (
              <User size={16} className="text-indigo-500 shrink-0" />
            )}
            <span className="truncate max-w-[14rem]">Voice: {voiceSummary}</span>
          </span>
        </div>
      </header>

      {/* ============================ QUICK STEPS (empty state) ============================ */}
      {showSteps && (
        <ol className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8" aria-label="Quick start">
          {[
            { title: 'Add script', body: 'Paste, import or upload.' },
            { title: 'Pick a voice', body: 'Manual, auto or blend.' },
            { title: 'Extract', body: 'Get 3 Shorts to copy.' }
          ].map((step, i) => (
            <li key={step.title} className={clsx('rounded-2xl border p-3 sm:p-4', t.surface)}>
              <div className="flex items-center gap-2 mb-1">
                <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className={clsx('text-sm font-bold leading-tight', t.text)}>{step.title}</span>
              </div>
              <p className={clsx('hidden sm:block text-sm', t.muted)}>{step.body}</p>
            </li>
          ))}
        </ol>
      )}

      {/* ============================ MAIN GRID ============================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* -------- LEFT: script input -------- */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 min-w-0" aria-labelledby="script-heading">
          <div
            className={clsx(
              'rounded-3xl border shadow-xl overflow-hidden flex flex-col transition-colors',
              'focus-within:border-indigo-500',
              t.surface
            )}
          >
            <div
              className={clsx(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b',
                t.line
              )}
            >
              <h3 id="script-heading" className={clsx('flex items-center gap-2 text-base font-bold', t.text)}>
                <FileText size={18} className="text-indigo-500 shrink-0" />
                Long-form script
              </h3>

              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                {hasEditorScript && (
                  <button
                    type="button"
                    onClick={handleImportCurrentEditor}
                    className={clsx(
                      btnBase,
                      'col-span-2 sm:col-span-1 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20',
                      isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                    )}
                  >
                    <Sparkles size={15} className="shrink-0" /> Import from editor
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={clsx(
                    btnBase,
                    'bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20',
                    isDarkMode ? 'text-indigo-300' : 'text-indigo-700',
                    !(sourceScriptText.length > 0) && 'col-span-2 sm:col-span-1'
                  )}
                >
                  {isUploading ? (
                    <Loader2 size={15} className="animate-spin shrink-0" />
                  ) : (
                    <Upload size={15} className="shrink-0" />
                  )}
                  <span>Upload file</span>
                </button>
                {sourceScriptText.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSourceScriptText('')}
                    className={clsx(btnBase, t.ghostBtn)}
                    aria-label="Clear script"
                  >
                    <X size={15} className="shrink-0" /> Clear
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            <label htmlFor="shorts-source-script" className="sr-only">
              Paste your long-form script or transcript
            </label>
            <textarea
              id="shorts-source-script"
              value={sourceScriptText}
              onChange={e => setSourceScriptText(e.target.value)}
              placeholder="Paste a 10 to 20 minute script or transcript here. You can also import from the editor or upload a .TXT, .DOCX or .PDF file."
              className={clsx(
                'w-full p-4 sm:p-6 lg:p-8 bg-transparent border-none resize-y focus:ring-0 outline-none',
                'leading-relaxed text-base lg:text-lg font-medium min-h-[240px] sm:min-h-[340px] lg:min-h-[420px]',
                t.text,
                isDarkMode ? 'placeholder-slate-500' : 'placeholder-slate-400',
                getLanguageClass(config.language)
              )}
              dir="auto"
            />

            <div
              className={clsx(
                'px-4 sm:px-6 py-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2.5',
                t.line
              )}
            >
              <ol className="flex flex-wrap gap-1.5" aria-label="Processing pipeline">
                {PIPELINE.map((stage, i) => (
                  <li
                    key={stage.title}
                    className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', t.chip)}
                  >
                    <span className="text-indigo-500 font-bold">{i + 1}</span>
                    {stage.title}
                  </li>
                ))}
              </ol>
              <span className={clsx('text-sm font-bold tabular-nums shrink-0', t.muted)}>
                {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30"
            >
              <p className={clsx('flex-1 text-sm font-semibold leading-relaxed', isDarkMode ? 'text-rose-300' : 'text-rose-700')}>
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                aria-label="Dismiss error"
                className={clsx('shrink-0 w-9 h-9 -m-1 rounded-full flex items-center justify-center hover:bg-rose-500/15', focusRing)}
              >
                <X size={16} className={isDarkMode ? 'text-rose-300' : 'text-rose-700'} />
              </button>
            </div>
          )}
        </section>

        {/* -------- RIGHT: controls (sticky on desktop) -------- */}
        <aside
          className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 min-w-0 lg:sticky lg:top-4 lg:self-start"
          aria-label="Voice and output settings"
        >
          {/* Writing mode */}
          <div className="space-y-2.5">
            <h3 className={clsx('text-sm font-bold', t.text)}>Writing mode</h3>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Writing mode">
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
                      'min-h-[72px] flex flex-col items-center justify-center gap-1.5 px-1.5 py-3 rounded-2xl border text-center transition-colors',
                      focusRing,
                      active
                        ? mode.id === 'blend'
                          ? 'bg-purple-600 border-purple-500 text-white shadow-lg'
                          : mode.id === 'auto'
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                          : clsx(
                              'border-indigo-500 ring-1 ring-indigo-500 shadow-lg',
                              isDarkMode ? 'bg-white/10 text-white' : 'bg-white text-slate-900'
                            )
                        : clsx(t.panel, t.muted, t.hoverRow)
                    )}
                  >
                    <Icon size={20} className={active ? (mode.id === 'manual' ? 'text-indigo-500' : 'text-white') : ''} />
                    <span className="text-sm font-bold leading-tight">{mode.label}</span>
                  </button>
                );
              })}
            </div>
            <p className={clsx('text-sm leading-relaxed', t.muted)} aria-live="polite">
              {MODES.find(m => m.id === config.writingMode)?.desc}
            </p>
          </div>

          {/* Creator picker (hidden in Auto match, where the app chooses) */}
          {config.writingMode !== 'auto' && (
            <div className={clsx('rounded-3xl border p-4 sm:p-5', t.panel)}>
              <h3 className={clsx('text-sm font-bold mb-3 flex items-center gap-2', t.text)}>
                <User size={15} className={config.writingMode === 'blend' ? 'text-purple-500' : 'text-indigo-500'} />
                {config.writingMode === 'blend' ? 'Main voice (70% of the style)' : 'Creator voice'}
              </h3>

              <div className="relative" ref={styleMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowStyleSelector(v => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={showStyleSelector}
                  className={clsx(
                    'w-full min-h-[56px] flex items-center justify-between gap-3 rounded-2xl border p-2 pr-3 text-left',
                    t.inset,
                    t.hoverRow,
                    focusRing
                  )}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className={clsx('w-11 h-11 shrink-0 rounded-xl overflow-hidden border-2', t.line)}>
                      <Avatar creator={currentCreator} className="w-full h-full object-cover" />
                    </span>
                    <span className="min-w-0">
                      <span className={clsx('block text-base font-bold truncate', t.text)}>{currentCreator.name}</span>
                      <span className={clsx('block text-xs truncate', t.muted)}>{currentCreator.style}</span>
                    </span>
                  </span>
                  <ChevronDown
                    size={18}
                    className={clsx('shrink-0 transition-transform motion-reduce:transition-none', showStyleSelector && 'rotate-180', t.muted)}
                  />
                </button>

                {showStyleSelector && (
                  <div
                    role="listbox"
                    aria-label="Choose a creator"
                    className={clsx(
                      'absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl max-h-72 overflow-y-auto z-50 p-2 space-y-1 custom-scrollbar',
                      t.popover
                    )}
                  >
                    {allCreatorSchemas.map(schema => {
                      const c = schema.profile || CREATORS.find(cr => cr.id === schema.id) || CREATORS[0];
                      const selected = schema.id === currentCreatorSchema.id;
                      return (
                        <button
                          key={schema.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => {
                            updateConfig('selectedStyleId', schema.id);
                            setShowStyleSelector(false);
                          }}
                          className={clsx(
                            'w-full min-h-[48px] flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors',
                            focusRing,
                            selected ? 'bg-indigo-600 text-white' : clsx(t.hoverRow, t.text)
                          )}
                        >
                          <Avatar creator={c} className="w-8 h-8 shrink-0 rounded-lg object-cover" />
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-bold truncate">{schema.name}</span>
                            <span className={clsx('block text-xs truncate', selected ? 'text-indigo-100' : t.muted)}>
                              {schema.archetype}
                            </span>
                          </span>
                          {selected && <Check size={16} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Creator Style Blueprint Summary */}
              <div className={clsx('mt-3 rounded-2xl border p-3 text-xs space-y-1.5', t.inset)}>
                <div className="flex items-center justify-between gap-2">
                  <span className={clsx('font-bold uppercase tracking-wider text-[10px]', t.muted)}>
                    Active Style DNA Blueprint
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 font-bold text-[10px]">
                    {currentCreatorSchema.avoidList.length} guardrails
                  </span>
                </div>
                <p className={clsx('leading-snug line-clamp-2', t.muted)}>
                  <strong className={t.text}>Cadence:</strong> {currentCreatorSchema.vocalCadence}
                </p>
                <p className={clsx('leading-snug line-clamp-2', t.muted)}>
                  <strong className={t.text}>Analogy Rule:</strong> {currentCreatorSchema.analogyRule}
                </p>
              </div>

              {config.writingMode === 'blend' && (
                <div className={clsx('mt-5 pt-5 border-t', t.line)}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h4 className={clsx('text-sm font-bold flex items-center gap-2', t.text)}>
                      <Combine size={15} className="text-purple-500" />
                      Flavor voices (30% of the style)
                    </h4>
                    <span
                      className={clsx(
                        'shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold tabular-nums',
                        atSecondaryLimit
                          ? 'border-purple-500/50 text-purple-500'
                          : clsx(t.chip)
                      )}
                    >
                      {secondaryIds.length} of {MAX_SECONDARIES}
                    </span>
                  </div>
                  <p className={clsx('text-sm mb-3', t.muted)}>
                    Pick up to {MAX_SECONDARIES}. They add vocabulary and emotion, not structure.
                  </p>

                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-4 gap-2 max-h-56 overflow-y-auto custom-scrollbar p-1">
                    {CREATORS.filter(c => c.id !== config.selectedStyleId).map(c => {
                      const isSelected = secondaryIds.includes(c.id);
                      const blocked = atSecondaryLimit && !isSelected;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleSecondaryCreator(c.id)}
                          aria-pressed={isSelected}
                          disabled={blocked}
                          title={blocked ? `Limit of ${MAX_SECONDARIES} reached` : c.name}
                          className={clsx(
                            'relative min-h-[76px] rounded-xl p-1.5 border transition-colors flex flex-col items-center justify-center gap-1.5',
                            focusRing,
                            isSelected
                              ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
                              : clsx('border-transparent', t.hoverRow),
                            blocked && 'opacity-40 cursor-not-allowed'
                          )}
                        >
                          <span className="w-10 h-10 rounded-lg overflow-hidden">
                            <Avatar creator={c} className="w-full h-full object-cover" />
                          </span>
                          <span className={clsx('text-xs font-semibold truncate w-full text-center', t.text)}>
                            {c.name.split(' ')[0]}
                          </span>
                          {isSelected && (
                            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center">
                              <Check size={10} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Language and tone */}
          <div className={clsx('rounded-3xl border p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4', t.panel)}>
            <div>
              <label
                htmlFor="shorts-language"
                className={clsx('flex items-center gap-1.5 text-sm font-bold mb-2', t.text)}
              >
                <Languages size={15} className="text-indigo-500" /> Language
              </label>
              <select
                id="shorts-language"
                value={config.language}
                onChange={e => updateConfig('language', e.target.value)}
                className={clsx('w-full min-h-[44px] rounded-xl border px-3 text-sm font-semibold outline-none cursor-pointer', t.field, focusRing)}
              >
                {LANGUAGES.map(l => (
                  <option key={l} value={l} className={t.option}>
                    {l}
                  </option>
                ))}
              </select>
              {config.language === 'Arabic' && (
                <>
                  <label htmlFor="shorts-dialect" className="sr-only">
                    Arabic dialect
                  </label>
                  <select
                    id="shorts-dialect"
                    value={config.arabicDialect || ARABIC_DIALECTS[0]}
                    onChange={e => updateConfig('arabicDialect', e.target.value)}
                    className={clsx(
                      'mt-2 w-full min-h-[44px] rounded-xl border px-3 text-sm font-semibold outline-none cursor-pointer',
                      t.field,
                      focusRing
                    )}
                  >
                    {ARABIC_DIALECTS.map(d => (
                      <option key={d} value={d} className={t.option}>
                        {d}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            <div>
              <label
                htmlFor="shorts-tone"
                className={clsx('flex items-center gap-1.5 text-sm font-bold mb-2', t.text)}
              >
                <Sliders size={15} className="text-indigo-500" /> Tone and focus
              </label>
              <select
                id="shorts-tone"
                value={config.transformationType}
                onChange={e => updateConfig('transformationType', e.target.value)}
                className={clsx('w-full min-h-[44px] rounded-xl border px-3 text-sm font-semibold outline-none cursor-pointer', t.field, focusRing)}
              >
                {TRANSFORMATION_TYPES.map(tt => (
                  <option key={tt.id} value={tt.id} className={t.option}>
                    {tt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action button */}
          <div>
            <button
              type="button"
              onClick={handleExtractShorts}
              disabled={!canExtract}
              className={clsx(extractButtonClasses, 'w-full')}
            >
              {ExtractLabel}
            </button>
            {!sourceScriptText.trim() && (
              <p className={clsx('mt-2 text-sm text-center', t.muted)}>Add a script to start.</p>
            )}
          </div>
        </aside>
      </div>

      {/* ============================ RESULTS ============================ */}
      <div ref={resultsRef} className="scroll-mt-4">
        {isExtracting && (
          <div className="pt-10 space-y-5" role="status" aria-live="polite">
            <div className="flex items-center gap-3">
              <Loader2 size={20} className="animate-spin text-indigo-500 shrink-0" />
              <div>
                <div className={clsx('text-base font-bold', t.text)}>Extracting your Shorts</div>
                <div className={clsx('text-sm', t.muted)}>Long scripts can take a minute. Keep this tab open.</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
              <ShortSkeleton t={t} />
              <ShortSkeleton t={t} className="hidden md:block" />
              <ShortSkeleton t={t} className="hidden xl:block" />
            </div>
          </div>
        )}

        {clipperResult && !isExtracting && (
          <div className="pt-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none">
            <div className={clsx('pb-4 border-b', t.line)}>
              <p className={clsx('text-sm font-bold', isDarkMode ? 'text-emerald-300' : 'text-emerald-700')}>
                Your 3 Shorts are ready. Voice: {clipperResult.creatorApplied}
              </p>
              <h3 className={clsx('mt-1 text-xl sm:text-2xl font-black tracking-tight', t.text)}>
                {clipperResult.sourceSummary}
              </h3>
            </div>

            {/* Phone: one Short at a time. Tablet and up: all Shorts together. */}
            <div
              role="tablist"
              aria-label="Choose a Short"
              className={clsx('md:hidden grid gap-2', clipperResult.shorts.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}
            >
              {clipperResult.shorts.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={activeShort === i}
                  onClick={() => setActiveShort(i)}
                  className={clsx(
                    'min-h-[48px] rounded-xl border px-2 text-sm font-bold transition-colors',
                    focusRing,
                    activeShort === i
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                      : clsx(t.panel, t.muted, t.hoverRow)
                  )}
                >
                  Short {i + 1}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 items-start">
              {clipperResult.shorts.map((shortItem, shortIdx) => (
                <ShortCard
                  key={shortItem.id}
                  short={shortItem}
                  index={shortIdx}
                  isDarkMode={isDarkMode}
                  languageClass={getLanguageClass(config.language)}
                  copied={copiedId === shortItem.id}
                  storyboardOpen={!!openStoryboards[shortItem.id]}
                  generatingAll={!!generatingAll[shortItem.id]}
                  className={activeShort === shortIdx ? 'flex' : 'hidden md:flex'}
                  onCopy={() => handleCopyShort(shortIdx)}
                  onDownload={() => handleDownloadShortTxt(shortIdx)}
                  onToggleStoryboard={() => toggleStoryboard(shortItem.id)}
                  onGenerateFrame={frameIdx => handleGenerateVerticalFrame(shortIdx, frameIdx)}
                  onGenerateAll={() => {
                    setOpenStoryboards(prev => ({ ...prev, [shortItem.id]: true }));
                    handleGenerateAllFramesForShort(shortIdx);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortsClipperStudio;