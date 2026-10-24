import React, { useState, useEffect } from 'react';
import { ResearchConfig, MySourcesState } from '../../types';
import { computeTargets, ResearchDepth } from '../../services/researchTargets';
import { ResearchProgressUpdate } from '../../services/researchService';
import { MySourcesPanel } from './MySourcesPanel';
import {
  ResearchStyle,
  ResearchScope,
  describeResearchStyle,
  getResearchStyleByCreatorId
} from '../../creator-research';
import { rewriteQuestionsForTopic, buildSmartTopicQuestions } from '../../services/researchEngine';
import {
  Loader2,
  Search,
  X,
  ArrowLeft,
  FastForward,
  Sparkles,
  Plus,
  Trash2,
  Sliders
} from 'lucide-react';
import clsx from 'clsx';

export interface ResearchStepProps {
  topic: string;
  durationMinutes: number;
  onDurationChange?: (mins: number) => void;
  config?: ResearchConfig;
  onConfigChange?: (next: ResearchConfig) => void;
  researchConfig?: ResearchConfig;
  onChangeResearchConfig?: (next: ResearchConfig) => void;
  mySources: MySourcesState;
  onMySourcesChange?: (next: MySourcesState) => void;
  onChangeMySources?: (next: MySourcesState) => void;
  onQuestionsSync?: (questions: string[], mode: 'auto_topic' | 'custom' | 'none') => void;
  onRunResearch?: (extraOptions?: {
    scopeMode?: 'local' | 'global' | 'both';
    scope?: ResearchScope;
    togglesLevel?: Record<string, 0 | 0.5 | 1 | 1.5>;
    customQuestions?: string[];
    questionMode?: 'auto_topic' | 'custom' | 'none';
    includeTerms?: string[];
    avoidTerms?: string[];
    userPlaybookNotes?: string;
    conceptPremise?: string;
    conceptStakes?: string;
    conceptEscalation?: string;
  }) => void;
  onStartResearch?: () => void;
  onCancelResearch?: () => void;
  onSkipToScript?: () => void;
  onBack?: () => void;
  isResearching: boolean;
  progress: ResearchProgressUpdate | null;
  hasExistingDossier?: boolean;
  isDarkMode?: boolean;
  apiKey?: string;
  researchStyle?: ResearchStyle;
}

const MULTIPLIER_OPTIONS: { label: string; value: 0 | 0.5 | 1 | 1.5 }[] = [
  { label: 'Off', value: 0 },
  { label: 'Less', value: 0.5 },
  { label: 'Normal', value: 1 },
  { label: 'More', value: 1.5 }
];

export const ResearchStep: React.FC<ResearchStepProps> = ({
  topic,
  durationMinutes,
  config,
  onConfigChange,
  researchConfig,
  onChangeResearchConfig,
  mySources,
  onMySourcesChange,
  onChangeMySources,
  onQuestionsSync,
  onRunResearch,
  onStartResearch,
  onCancelResearch,
  onSkipToScript,
  onBack,
  isResearching,
  progress,
  isDarkMode = false,
  apiKey,
  researchStyle
}) => {
  const activeStyle = researchStyle || getResearchStyleByCreatorId('raftar');

  const [scope, setScope] = useState<ResearchScope>(() => activeStyle.defaultScope || 'both');

  useEffect(() => {
    setScope(activeStyle.defaultScope || 'both');
  }, [activeStyle.creatorId, activeStyle.defaultScope]);

  const styleLines = describeResearchStyle(activeStyle, scope);

  const defaultDepthForStyle: ResearchDepth =
    activeStyle.researchMode === 'concept_lab'
      ? 'quick'
      : durationMinutes >= 15
      ? 'deep'
      : 'standard';

  const effectiveConfig: ResearchConfig = config ||
    researchConfig || {
      depth: defaultDepthForStyle,
      region: 'Pakistan',
      sources: {
        officialDataAndReports: true,
        newsAndInvestigations: true,
        booksAndHistory: true,
        globalStudiesAndCounter: true,
        publicVoices: true
      }
    };

  const updateConfig = (next: ResearchConfig) => {
    onConfigChange?.(next);
    onChangeResearchConfig?.(next);
  };

  const updateMySources = (next: MySourcesState) => {
    onMySourcesChange?.(next);
    onChangeMySources?.(next);
  };

  // Source toggles keyed by style.uiLabels.sourceToggles[].id with multipliers 0 | 0.5 | 1 | 1.5
  const [togglesLevel, setTogglesLevel] = useState<Record<string, 0 | 0.5 | 1 | 1.5>>(() => {
    const init: Record<string, 0 | 0.5 | 1 | 1.5> = {};
    for (const tog of activeStyle.uiLabels.sourceToggles) {
      init[tog.id] = 1;
    }
    return init;
  });

  useEffect(() => {
    setTogglesLevel(prev => {
      const next: Record<string, 0 | 0.5 | 1 | 1.5> = {};
      for (const tog of activeStyle.uiLabels.sourceToggles) {
        next[tog.id] = prev[tog.id] !== undefined ? prev[tog.id] : 1;
      }
      return next;
    });
  }, [activeStyle.creatorId]);

  const [questionMode, setQuestionMode] = useState<'auto_topic' | 'custom' | 'none'>('auto_topic');
  const [questions, setQuestions] = useState<string[]>(() =>
    buildSmartTopicQuestions({
      topic,
      brief: topic,
      style: activeStyle,
      region: effectiveConfig.region || 'Pakistan'
    })
  );
  const [isRewritingQuestions, setIsRewritingQuestions] = useState(false);

  const [includeWordsText, setIncludeWordsText] = useState('');
  const [avoidWordsText, setAvoidWordsText] = useState('');

  // Mode B (Playbook: Hormozi / Iman) personal stories & numbers box
  const [userPlaybookNotes, setUserPlaybookNotes] = useState('');

  // Mode C (Concept Lab: MrBeast) 3-input box
  const [conceptPremise, setConceptPremise] = useState(topic || '');
  const [conceptStakes, setConceptStakes] = useState('$10,000 prize or elimination');
  const [conceptEscalation, setConceptEscalation] = useState(
    'Phase 1: Easy start -> Phase 2: Twist at midpoint -> Phase 3: Final showdown'
  );

  // Automatically regenerate domain-matched topic questions whenever topic, creator style, or region changes (when in 'auto_topic' mode)
  useEffect(() => {
    if (questionMode === 'auto_topic') {
      const smartQs = buildSmartTopicQuestions({
        topic,
        brief: topic,
        style: activeStyle,
        region: effectiveConfig.region || 'Pakistan'
      });
      setQuestions(smartQs);
    }
  }, [activeStyle.creatorId, topic, effectiveConfig.region, questionMode]);

  // Continuously sync active questions and questionMode to parent CreationForm so script generation always uses them even if user skips research
  useEffect(() => {
    const activeQs = questionMode === 'none' ? [] : questions.map(q => q.trim()).filter(Boolean);
    onQuestionsSync?.(activeQs, questionMode);
  }, [questions, questionMode]);

  const activeDepth: ResearchDepth =
    effectiveConfig.depth === 'quick' ||
    effectiveConfig.depth === 'standard' ||
    effectiveConfig.depth === 'deep'
      ? effectiveConfig.depth
      : defaultDepthForStyle;

  const targets = computeTargets(durationMinutes, activeDepth);

  const depthQueries = activeStyle.budget.queries[activeDepth] || 16;
  const estMins = activeStyle.budget.estimatedMinutes[activeDepth] || [1, 2];

  const handleDepthChange = (depth: ResearchDepth) => {
    updateConfig({
      ...effectiveConfig,
      depth,
      durationMinutes
    });
  };

  const handleSetToggleMultiplier = (toggleId: string, val: 0 | 0.5 | 1 | 1.5) => {
    setTogglesLevel(prev => ({ ...prev, [toggleId]: val }));
  };

  const handleRewriteQuestions = async () => {
    if (!topic.trim()) return;
    setIsRewritingQuestions(true);
    try {
      const nextQs = await rewriteQuestionsForTopic({
        topic,
        brief: topic,
        style: activeStyle,
        region: effectiveConfig.region || 'Pakistan',
        apiKey
      });
      if (nextQs.length > 0) {
        setQuestions(nextQs);
        if (questionMode === 'none') {
          setQuestionMode('auto_topic');
        }
      }
    } finally {
      setIsRewritingQuestions(false);
    }
  };

  const handleTriggerResearch = () => {
    const includeTerms = includeWordsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const avoidTerms = avoidWordsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const legacyScopeMode: 'local' | 'global' | 'both' =
      scope === 'ground' ? 'local' : scope === 'abroad' ? 'global' : 'both';

    if (onRunResearch) {
      onRunResearch({
        scopeMode: legacyScopeMode,
        scope,
        togglesLevel,
        customQuestions: questionMode === 'none' ? [] : questions.filter(Boolean),
        questionMode,
        includeTerms,
        avoidTerms,
        userPlaybookNotes,
        conceptPremise,
        conceptStakes,
        conceptEscalation
      });
    } else if (onStartResearch) {
      onStartResearch();
    }
  };

  const fieldCls = clsx(
    'w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-colors',
    isDarkMode
      ? 'bg-black/25 border-white/15 text-white placeholder-slate-500 focus:border-indigo-400'
      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
  );

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header Card with ResearchStyle title, 5 plain lines, and disclaimer */}
      <div
        className={clsx(
          'rounded-[2rem] border p-5 sm:p-7 space-y-4 shadow-sm',
          isDarkMode ? 'bg-[#0f172a]/90 border-white/10' : 'bg-white border-slate-200/90'
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-500">
              Research Plan · {activeStyle.displayName}
            </div>
            <h2
              className={clsx(
                'font-display text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5',
                isDarkMode ? 'text-white' : 'text-slate-900'
              )}
            >
              {activeStyle.uiLabels.title}
            </h2>
            <p className={clsx('text-xs sm:text-sm mt-1', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
              {activeStyle.intent}
            </p>
          </div>
          <span
            className={clsx(
              'text-[11px] font-semibold px-3 py-1 rounded-xl border',
              isDarkMode
                ? 'bg-white/5 text-slate-300 border-white/10'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            )}
          >
            Style inspired by public work. Not affiliated.
          </span>
        </div>

        <ul
          className={clsx(
            'grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm pt-3 border-t',
            isDarkMode ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-700'
          )}
        >
          {styleLines.map((line, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-indigo-500 font-extrabold">·</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* MODE C: CONCEPT LAB (MrBeast style) */}
      {(activeStyle.researchMode === 'concept_lab' || activeStyle.researchMode === 'hybrid') && (
        <div
          className={clsx(
            'rounded-[2rem] border p-5 sm:p-7 space-y-4',
            isDarkMode ? 'bg-indigo-950/20 border-indigo-500/40' : 'bg-indigo-50/70 border-indigo-200'
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className={clsx('text-base sm:text-lg font-extrabold', isDarkMode ? 'text-white' : 'text-slate-900')}>
                Quick Concept &amp; Number Check
              </h3>
              <p className={clsx('text-xs sm:text-sm', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
                High-stakes challenges only need real scale comparisons, safety/cost checks, and a clear escalation plan.
              </p>
            </div>
            {activeStyle.uiLabels.canSkip && onSkipToScript && (
              <button
                type="button"
                onClick={onSkipToScript}
                className="text-xs sm:text-sm font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
              >
                <FastForward size={15} />
                <span>Skip research &amp; go straight to outline</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className={clsx('block text-xs font-bold mb-1.5', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
                1. Your concept idea
              </label>
              <input
                type="text"
                value={conceptPremise}
                onChange={e => setConceptPremise(e.target.value)}
                placeholder="e.g., 100 people compete inside a giant glass cube"
                className={fieldCls}
              />
            </div>
            <div>
              <label className={clsx('block text-xs font-bold mb-1.5', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
                2. Prize or stakes
              </label>
              <input
                type="text"
                value={conceptStakes}
                onChange={e => setConceptStakes(e.target.value)}
                placeholder="e.g., $100,000 cash or losing the island"
                className={fieldCls}
              />
            </div>
            <div>
              <label className={clsx('block text-xs font-bold mb-1.5', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
                3. Budget, rules &amp; escalation
              </label>
              <input
                type="text"
                value={conceptEscalation}
                onChange={e => setConceptEscalation(e.target.value)}
                placeholder="Round 1 -> Round 2 twist -> Final duel"
                className={fieldCls}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODE B: PLAYBOOK (Hormozi / Iman style) */}
      {(activeStyle.researchMode === 'playbook' || activeStyle.researchMode === 'hybrid') && (
        <div
          className={clsx(
            'rounded-[2rem] border p-5 sm:p-7 space-y-3',
            isDarkMode ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-emerald-50/70 border-emerald-200'
          )}
        >
          <div>
            <h3 className={clsx('text-base sm:text-lg font-extrabold', isDarkMode ? 'text-white' : 'text-slate-900')}>
              Your stories and numbers (Playbook Input)
            </h3>
            <p className={clsx('text-xs sm:text-sm', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
              We never invent fake client revenue or personal stories. Paste your real results, offer math, or examples here—or leave blank and the script will mark <code className="font-bold text-emerald-600 dark:text-emerald-400">[NEEDS YOUR DATA]</code> where your own example goes.
            </p>
          </div>
          <textarea
            rows={3}
            value={userPlaybookNotes}
            onChange={e => setUserPlaybookNotes(e.target.value)}
            placeholder="e.g., How we cut CAC from $120 to $38 in 60 days, 3-step offer stack, real client case study..."
            className={fieldCls}
          />
        </div>
      )}

      {/* MAIN CONTROLS: Scope, Depth, Source Priority Toggles, Questions & Include/Avoid */}
      <div
        className={clsx(
          'rounded-[2rem] border p-5 sm:p-7 space-y-6 shadow-sm',
          isDarkMode ? 'bg-[#0f172a]/90 border-white/10' : 'bg-white border-slate-200/90'
        )}
      >
        {/* Scope & Region Row */}
        {activeStyle.uiLabels.showScope && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={clsx('block text-xs sm:text-sm font-extrabold mb-2', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                1. Where to look (Ground vs. Abroad)
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {([
                  { id: 'ground' as ResearchScope, label: `Ground (${effectiveConfig.region || 'Local'})` },
                  { id: 'abroad' as ResearchScope, label: 'Abroad' },
                  { id: 'both' as ResearchScope, label: 'Both' }
                ]).map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScope(s.id)}
                    className={clsx(
                      'min-h-[44px] py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all',
                      scope === s.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-500 text-white shadow'
                        : isDarkMode
                        ? 'bg-black/25 border-white/10 text-slate-300 hover:bg-white/5'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={clsx('block text-xs sm:text-sm font-extrabold mb-2', isDarkMode ? 'text-slate-200' : 'text-slate-800')}>
                Primary Country / Region
              </label>
              <select
                value={effectiveConfig.region || 'Pakistan'}
                onChange={e =>
                  updateConfig({
                    ...effectiveConfig,
                    region: e.target.value
                  })
                }
                className={clsx(fieldCls, 'min-h-[44px] font-bold cursor-pointer')}
              >
                <option value="Pakistan">Pakistan</option>
                <option value="India">India</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="Gulf">UAE &amp; Gulf</option>
                <option value="Global">Global</option>
              </select>
            </div>
          </div>
        )}

        {/* Depth Selector + Live Budget Line */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <label className={clsx('font-display text-sm sm:text-base font-extrabold', isDarkMode ? 'text-white' : 'text-slate-900')}>
              2. How deep ({activeStyle.displayName} budget)
            </label>
            <span className="text-xs sm:text-sm font-mono font-bold text-indigo-500">
              {depthQueries} searches · ~{targets.factsNeeded} facts · ~{estMins[0]}–{estMins[1]} min
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['quick', 'standard', 'deep'] as const).map(d => {
              const selected = activeDepth === d;
              const qCount = activeStyle.budget.queries[d];
              const mRange = activeStyle.budget.estimatedMinutes[d];
              const fCount = computeTargets(durationMinutes, d).factsNeeded;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDepthChange(d)}
                  className={clsx(
                    'rounded-2xl border p-4 text-left transition-all',
                    selected
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-lg scale-[1.01]'
                      : isDarkMode
                      ? 'bg-black/25 border-white/10 text-slate-200 hover:bg-white/5'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                  )}
                >
                  <div className="font-display text-sm sm:text-base font-extrabold capitalize">
                    {d} (~{mRange[0]}–{mRange[1]}m)
                  </div>
                  <div className={clsx('text-xs mt-1 font-mono font-bold', selected ? 'text-indigo-100' : isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                    {qCount} searches · ~{fCount} facts
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Creator Source Toggles (Off = 0, Less = 0.5, Normal = 1, More = 1.5) */}
        <div>
          <div className={clsx('font-display text-sm sm:text-base font-extrabold mb-3', isDarkMode ? 'text-white' : 'text-slate-900')}>
            3. Source types to prioritize (Off · Less · Normal · More)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeStyle.uiLabels.sourceToggles.map(tog => {
              const currentMult = togglesLevel[tog.id] ?? 1;
              const priorityItem = activeStyle.sourcePriority.find(sp => sp.type === tog.mapsTo);
              const examplesLine = priorityItem?.examples?.slice(0, 3).join(', ') || tog.mapsTo.replace(/_/g, ' ');
              return (
                <div
                  key={tog.id}
                  className={clsx(
                    'rounded-2xl border p-4 flex flex-col justify-between gap-2.5 transition-all',
                    currentMult === 0
                      ? isDarkMode
                        ? 'opacity-60 bg-black/15 border-white/5'
                        : 'opacity-60 bg-slate-100 border-slate-200'
                      : isDarkMode
                      ? 'bg-black/25 border-white/10'
                      : 'bg-slate-50/80 border-slate-200/90'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <Sliders size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <div className={clsx('text-xs sm:text-sm font-extrabold', isDarkMode ? 'text-white' : 'text-slate-900')}>
                        {tog.label}
                      </div>
                      <p className={clsx('text-xs mt-0.5', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                        Examples: {examplesLine}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    {MULTIPLIER_OPTIONS.map(opt => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => handleSetToggleMultiplier(tog.id, opt.value)}
                        className={clsx(
                          'flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors',
                          currentMult === opt.value
                            ? opt.value === 0
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-indigo-600 text-white shadow-sm'
                            : isDarkMode
                            ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Editable Questions We Will Answer + 3-Mode Strategy */}
        <div className="space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <label className={clsx('font-display text-sm sm:text-base font-extrabold', isDarkMode ? 'text-white' : 'text-slate-900')}>
                4. Narrative Questions &amp; Topic Spine (How, When &amp; Where Questions Drive the Script)
              </label>
              <p className={clsx('text-xs mt-0.5', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                Questions are 100% matched to your topic domain (never generic templates) and flow directly into both Research &amp; Script Generation—or choose &ldquo;No Questions&rdquo; for pure topic-driven auto-flow.
              </p>
            </div>
            {questionMode !== 'none' && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRewriteQuestions}
                  disabled={isRewritingQuestions}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors',
                    isDarkMode
                      ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                  )}
                >
                  {isRewritingQuestions ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>AI Deep-Tailor Questions for Topic</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuestionMode('custom');
                    setQuestions(prev => [...prev, '']);
                  }}
                  className={clsx(
                    'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors',
                    isDarkMode
                      ? 'bg-white/10 border-white/10 text-slate-200 hover:bg-white/15'
                      : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                  )}
                >
                  <Plus size={14} />
                  <span>Add a question</span>
                </button>
              </div>
            )}
          </div>

          {/* 3-Mode Question Strategy Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {([
              {
                id: 'auto_topic' as const,
                title: 'Smart Topic Match (Auto)',
                desc: 'Auto-builds 4 domain-matched questions specifically for your topic (AI/Water, Business, Politics, Science, Challenge).'
              },
              {
                id: 'custom' as const,
                title: 'Custom Questions (Manual)',
                desc: 'Write or edit your own custom investigative questions for the writer to answer in the body chapters.'
              },
              {
                id: 'none' as const,
                title: 'No Questions (Topic Auto-Flow)',
                desc: 'Skip question lists completely—the writer structures the script 100% organically from your Topic & Criteria.'
              }
            ]).map(m => {
              const active = questionMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setQuestionMode(m.id);
                    if (m.id === 'auto_topic') {
                      setQuestions(
                        buildSmartTopicQuestions({
                          topic,
                          brief: topic,
                          style: activeStyle,
                          region: effectiveConfig.region || 'Pakistan'
                        })
                      );
                    }
                  }}
                  className={clsx(
                    'rounded-2xl border p-3.5 text-left transition-all',
                    active
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-500 text-white shadow-md'
                      : isDarkMode
                      ? 'bg-black/25 border-white/10 text-slate-300 hover:bg-white/5'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  )}
                >
                  <div className="text-xs sm:text-sm font-extrabold">{m.title}</div>
                  <div className={clsx('text-[11px] mt-1 leading-relaxed', active ? 'text-indigo-100' : isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                    {m.desc}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Logic Banner: How / When / Where / Which Questions Work */}
          <div
            className={clsx(
              'rounded-2xl border p-3.5 text-xs leading-relaxed grid grid-cols-1 md:grid-cols-3 gap-3',
              isDarkMode ? 'bg-indigo-950/25 border-indigo-500/30 text-slate-300' : 'bg-indigo-50/70 border-indigo-200 text-slate-700'
            )}
          >
            <div>
              <span className="font-extrabold text-indigo-500 block mb-0.5">WHEN &amp; WHERE USED:</span>
              Active in both <strong>Fact Research</strong> and <strong>Script Generation</strong> (even if you click Skip Research). Answered organically in <strong>Body Scenes (Scenes 2 to N-1)</strong> so the opening Hook and closing Verdict stay 100% intact.
            </div>
            <div>
              <span className="font-extrabold text-indigo-500 block mb-0.5">WHICH QUESTIONS MATCH:</span>
              Automatically detects your exact topic domain (e.g. Resource/Water &amp; AI, Business Scaling, Political Power, Science, or Challenge) and never injects unrelated character templates.
            </div>
            <div>
              <span className="font-extrabold text-indigo-500 block mb-0.5">HOW WRITER ANSWERS THEM:</span>
              Woven as natural documentary narrative transitions in {activeStyle.displayName}&apos;s voice—never read aloud as a robotic Q&amp;A list.
            </div>
          </div>

          {questionMode === 'none' ? (
            <div
              className={clsx(
                'rounded-2xl border p-4 text-xs sm:text-sm font-semibold',
                isDarkMode ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              )}
            >
              No Questions Mode Active: The script writer will structure all chapters directly from your Topic Title, Target Criteria, and {activeStyle.displayName}&apos;s narrative arc without any fixed question list.
            </div>
          ) : (
            <div className="space-y-2.5">
              {questions.map((q, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-extrabold text-indigo-500 w-5">{idx + 1}.</span>
                  <input
                    type="text"
                    value={q}
                    onChange={e => {
                      const val = e.target.value;
                      setQuestionMode('custom');
                      setQuestions(prev => prev.map((item, i) => (i === idx ? val : item)));
                    }}
                    placeholder="Enter a specific question for this topic..."
                    className={fieldCls}
                  />
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuestionMode('custom');
                        setQuestions(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="p-2 text-slate-400 hover:text-rose-500"
                      title="Remove question"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Words to Include / Avoid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={clsx('block text-xs font-bold mb-1.5', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
              Words to always include (comma-separated)
            </label>
            <input
              type="text"
              value={includeWordsText}
              onChange={e => setIncludeWordsText(e.target.value)}
              placeholder="e.g., KWSB, 1997 reform, Orangi Town"
              className={fieldCls}
            />
          </div>
          <div>
            <label className={clsx('block text-xs font-bold mb-1.5', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
              Words to avoid (comma-separated)
            </label>
            <input
              type="text"
              value={avoidWordsText}
              onChange={e => setAvoidWordsText(e.target.value)}
              placeholder="e.g., partisan slogans, unverified rumors"
              className={fieldCls}
            />
          </div>
        </div>
      </div>

      {/* My Sources Panel */}
      <MySourcesPanel
        topic={topic}
        mySources={mySources}
        onChangeMySources={updateMySources}
        isDarkMode={isDarkMode}
        apiKey={apiKey}
      />

      {/* Live Progress Bar when Researching */}
      {isResearching && progress && (
        <div
          className={clsx(
            'rounded-[2rem] border p-5 sm:p-6 space-y-3',
            isDarkMode ? 'bg-indigo-950/30 border-indigo-500/40' : 'bg-indigo-50 border-indigo-200'
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
              <Loader2 size={18} className="animate-spin shrink-0" />
              <span>{progress.label}</span>
            </div>
            {onCancelResearch && (
              <button
                type="button"
                onClick={onCancelResearch}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
            )}
          </div>
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
              style={{ width: `${Math.max(8, Math.min(100, progress.percent))}%` }}
            />
          </div>
          <div className={clsx('flex items-center justify-between text-xs font-mono font-bold tabular-nums', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
            <span>
              Searches: {progress.completedQueries}/{progress.totalQueries}
            </span>
            <span>{progress.factsFoundSoFar} facts collected</span>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={isResearching}
            className={clsx(
              'inline-flex items-center justify-center gap-2 min-h-[50px] px-6 rounded-2xl border text-sm font-bold transition-colors w-full sm:w-auto',
              isDarkMode
                ? 'bg-[#1e293b] border-white/10 text-white hover:bg-white/10'
                : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
            )}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        ) : (
          <div className={clsx('text-xs sm:text-sm font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
            Ready to run {activeStyle.displayName} research ({depthQueries} searches)
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {onSkipToScript && (
            <button
              type="button"
              onClick={onSkipToScript}
              disabled={isResearching}
              className={clsx(
                'inline-flex items-center justify-center gap-2 min-h-[50px] px-5 rounded-2xl border text-sm font-bold transition-colors w-full sm:w-auto',
                isDarkMode
                  ? 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              )}
            >
              <FastForward size={15} />
              <span>Skip Research</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleTriggerResearch}
            disabled={isResearching}
            className="inline-flex items-center justify-center gap-2.5 min-h-[52px] px-8 rounded-2xl text-sm sm:text-base font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white hover:opacity-95 shadow-xl disabled:opacity-50 w-full sm:w-auto"
          >
            {isResearching ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
            <span>
              {isResearching
                ? 'Running Research & Gathering Facts...'
                : activeStyle.uiLabels.startButton || 'Start Research & Gather Facts'}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ResearchStep;
