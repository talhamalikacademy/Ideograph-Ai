import React, { useEffect, useState } from 'react';
import { CreatorProfile, GeneratorConfig } from '../types';
import { DURATION_PACING_MATRIX } from '../constants';
import { matchCreatorSubGenreAndTranscript } from '../src/data/creatorTranscripts';
import Avatar from './Avatar';
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  BrainCircuit,
  Clock,
  Globe,
  FileText,
  Layers,
  ShieldCheck,
  Flame
} from 'lucide-react';
import clsx from 'clsx';

interface ScriptGenerationLoaderProps {
  creator: CreatorProfile;
  config: GeneratorConfig;
  isDarkMode: boolean;
  backendStep: number;
  backendLabel?: string;
  backendPercent: number;
  isComplete: boolean;
}

const ScriptGenerationLoader: React.FC<ScriptGenerationLoaderProps> = ({
  creator,
  config,
  isDarkMode,
  backendLabel,
  backendPercent,
  isComplete
}) => {
  const [displayPercent, setDisplayPercent] = useState<number>(4);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const pacing =
    DURATION_PACING_MATRIX[config.duration] ||
    DURATION_PACING_MATRIX['60 Seconds (Shorts)'];

  const matchedRoute = matchCreatorSubGenreAndTranscript(
    creator,
    config.topicOrScript,
    config.subGenreId || 'auto'
  );

  const is20MinDoc = /20\s*min|15\s*min|full\s*doc/i.test(config.duration || '');
  const is5To10Min = /5\s*min|10\s*min|standard|deep/i.test(config.duration || '');
  const expectedWindowLabel = is20MinDoc
    ? '~2 Mins (4,000–5,000 Words Deep Doc)'
    : is5To10Min
    ? '~1 Min (Multi-Scene Deep Dive)'
    : '~40 Sec (High-Retention Short)';

  const isAutoMode = config.writingMode === 'auto';

  const GENERATION_PILLARS = [
    {
      id: 0,
      title: isAutoMode
        ? 'Pillar 1: Deep Topic Research & Autonomous Creator Discovery'
        : `Pillar 1: Analyzing ${creator.name} Bio & Core DNA`,
      detail: isAutoMode
        ? 'Researching topic domain, intent & emotional tone across all 11 creator profiles to choose the best creator'
        : `Reading /creators/${creator.id}.ts — locking philosophy, hook skeleton, research & workflow stages`,
      icon: BrainCircuit
    },
    {
      id: 1,
      title: isAutoMode
        ? 'Pillar 2: Locking Chosen Creator Bio & Authentic Transcript Corpus'
        : 'Pillar 2: Sub-Genre Transcript & Vocal Aggression Routing',
      detail: isAutoMode
        ? 'Loading the topic-matched creator bio file and authentic speech mechanics (zero pre-selected bias)'
        : `Matched "${matchedRoute.blueprint.title}" (${matchedRoute.blueprint.aggressionScore}) — extracting EN / UR / HI transcript cadence`,
      icon: FileText
    },
    {
      id: 2,
      title: 'Pillar 3: Layer-2 Language Policy & Pacing Blend',
      detail: `Applying ${config.language} lexical substitution matrix, 12–18 word staccato rhythm & Single Thread Law`,
      icon: Globe
    },
    {
      id: 3,
      title: 'Pillar 4: Synthesizing Broadcast Script & Live Grounding',
      detail: `Writing ${pacing.minScenes}–${pacing.maxScenes} scenes (${pacing.targetWords} spoken words), [CLAIM-X] & [INFOGRAPHIC-X] blueprints`,
      icon: Layers
    },
    {
      id: 4,
      title: 'Final Audit: Lexical Sanitizer & 100% Fidelity Lock',
      detail: 'Running post-generation vocabulary safety net & verifying scene word depth before opening studio',
      icon: ShieldCheck
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => (isComplete ? prev : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isComplete]);

  useEffect(() => {
    if (isComplete) {
      setDisplayPercent(100);
      return;
    }

    const speedFactor = is20MinDoc ? 0.55 : is5To10Min ? 0.8 : 1.15;

    const interval = setInterval(() => {
      setDisplayPercent(prev => {
        if (isComplete) return 100;

        if (prev < backendPercent) {
          const delta = backendPercent - prev;
          return Math.min(99, prev + Math.max(0.35 * speedFactor, delta * 0.12));
        }

        if (prev < 78) {
          return prev + 0.3 * speedFactor;
        }
        if (prev < 92) {
          return prev + 0.15 * speedFactor;
        }
        if (prev < 99) {
          return prev + 0.05 * speedFactor;
        }

        return prev;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [backendPercent, isComplete, is20MinDoc, is5To10Min]);

  const roundedPercent = isComplete
    ? 100
    : Math.min(99, Math.max(4, Math.round(displayPercent)));

  const activeStepIndex = isComplete
    ? GENERATION_PILLARS.length
    : roundedPercent < 22
    ? 0
    : roundedPercent < 42
    ? 1
    : roundedPercent < 64
    ? 2
    : roundedPercent < 88
    ? 3
    : 4;

  return (
    <div className="flex-1 flex items-center justify-center py-8 px-4 animate-in fade-in duration-500 font-sans">
      <div
        className={clsx(
          'w-full max-w-3xl rounded-[2rem] border p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-colors',
          isDarkMode
            ? 'bg-[#0f172a]/95 border-white/10 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        )}
      >
        {/* Ambient Gradient Glow */}
        <div
          className="absolute -top-28 -right-28 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: creator.hex || '#6366f1' }}
        />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {config.writingMode === 'auto' ? (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
                <BrainCircuit size={28} className="animate-pulse" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-indigo-500/50 shadow-lg shrink-0">
                <Avatar creator={creator} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-500 mb-0.5">
                {config.writingMode === 'auto'
                  ? '4-Pillar Auto-Match Engine'
                  : config.writingMode === 'blend'
                  ? '4-Pillar Creator Blend Studio'
                  : '4-Pillar Sequential Creator DNA Engine'}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {isComplete
                  ? 'Broadcast Script Package Ready!'
                  : `Crafting ${config.writingMode === 'auto' ? 'Optimal Creator' : creator.name} Script...`}
              </h2>
            </div>
          </div>

          {/* Numeric Percentage Display */}
          <div className="sm:text-right shrink-0 flex sm:block items-baseline justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200/60 dark:border-white/10">
            <div className="text-4xl font-black font-mono tabular-nums tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400">
              {roundedPercent}%
            </div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-60">
              {isComplete ? '100% Complete' : expectedWindowLabel}
            </div>
          </div>
        </div>

        {/* Unboxed Clean Metadata Line */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-6">
          <span className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
            <Clock size={14} className="text-indigo-500" />
            {config.duration}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
            <Flame size={14} className="text-amber-500" />
            {isAutoMode
              ? 'AI Topic-Driven Creator Selection'
              : `${matchedRoute.blueprint.title} (${matchedRoute.blueprint.aggressionScore})`}
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
            <Globe size={14} className="text-purple-500" />
            {config.enableDualScript && config.secondaryLanguage
              ? `${config.language} + ${config.secondaryLanguage}`
              : config.language}
          </span>
          {pacing && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {pacing.minScenes}–{pacing.maxScenes} Scenes ({pacing.targetWords} Words)
              </span>
            </>
          )}
        </div>

        {/* Smooth Progress Bar */}
        <div className="w-full h-3.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden mb-8 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300 ease-out"
            style={{ width: `${roundedPercent}%` }}
          />
        </div>

        {/* 4-Pillar Sequential Pipeline */}
        <div className="space-y-3">
          {GENERATION_PILLARS.map((step, index) => {
            const isStepDone = isComplete || index < activeStepIndex;
            const isStepCurrent = !isComplete && index === activeStepIndex;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className={clsx(
                  'flex items-start gap-3.5 p-4 rounded-2xl border transition-all duration-300',
                  isStepCurrent
                    ? isDarkMode
                      ? 'bg-indigo-500/10 border-indigo-500/40 shadow-lg shadow-indigo-500/5 scale-[1.01]'
                      : 'bg-indigo-50/80 border-indigo-300 shadow-sm scale-[1.01]'
                    : isStepDone
                    ? isDarkMode
                      ? 'bg-emerald-500/5 border-emerald-500/20 opacity-90'
                      : 'bg-emerald-50/50 border-emerald-200/70 opacity-90'
                    : isDarkMode
                    ? 'bg-white/[0.02] border-white/5 opacity-45'
                    : 'bg-slate-50 border-slate-200/60 opacity-50'
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {isStepDone ? (
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                      <CheckCircle2 size={17} />
                    </div>
                  ) : isStepCurrent ? (
                    <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md">
                      <Loader2 size={17} className="animate-spin" />
                    </div>
                  ) : (
                    <div
                      className={clsx(
                        'w-8 h-8 rounded-xl flex items-center justify-center',
                        isDarkMode ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-500'
                      )}
                    >
                      <StepIcon size={16} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={clsx(
                        'text-sm sm:text-base font-bold',
                        isStepCurrent
                          ? 'text-indigo-600 dark:text-indigo-300'
                          : isStepDone
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : ''
                      )}
                    >
                      {step.title}
                    </h4>
                    <span className="text-[11px] font-bold uppercase tracking-wider shrink-0 opacity-75">
                      {isStepDone ? 'Done' : isStepCurrent ? 'Active' : 'Queued'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm opacity-75 mt-0.5 leading-relaxed">
                    {isStepCurrent && backendLabel ? backendLabel : step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Status Line */}
        <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold opacity-70">
          <span className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-500" />
            Bio Read-Only Lock • Tri-Lingual Transcript Corpus • Layer-2 Language Policy
          </span>
          <span className="font-mono tabular-nums">
            Pillar {Math.min(activeStepIndex + 1, GENERATION_PILLARS.length)} of {GENERATION_PILLARS.length} • {elapsedSeconds}s elapsed
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScriptGenerationLoader;
