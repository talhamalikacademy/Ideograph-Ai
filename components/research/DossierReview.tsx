import React, { useState, useMemo } from 'react';
import {
  Dossier,
  FactCard,
  QuoteCard,
  BookRef,
  CardStatus,
  FactType
} from '../../types';
import {
  ResearchStyle,
  getResearchStyleByCreatorId
} from '../../creator-research';
import { searchForSingleGapOrSecondSource } from '../../services/researchEngine';
import {
  Check,
  X,
  Pin,
  Edit2,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  Plus,
  RefreshCw,
  Lock,
  ArrowLeft,
  Loader2,
  Calendar,
  Search
} from 'lucide-react';
import clsx from 'clsx';

export interface DossierReviewProps {
  dossier: Dossier;
  onUpdateDossier?: (next: Dossier) => void;
  onDossierChange?: (next: Dossier) => void;
  onFindMoreLikeCard: (card: FactCard) => Promise<void>;
  onResearchMore?: () => void;
  onRunMoreResearch?: () => void;
  onLockAndContinue?: () => void;
  onLockAndGenerate?: () => void;
  onBack?: () => void;
  isResearchingMore?: boolean;
  isGeneratingBeatPlan?: boolean;
  findingMoreCardId: string | null;
  isDarkMode?: boolean;
  researchStyle?: ResearchStyle;
  apiKey?: string;
}

export const DossierReview: React.FC<DossierReviewProps> = ({
  dossier,
  onUpdateDossier,
  onDossierChange,
  onFindMoreLikeCard,
  onResearchMore,
  onRunMoreResearch,
  onLockAndContinue,
  onLockAndGenerate,
  onBack,
  isResearchingMore = false,
  isGeneratingBeatPlan = false,
  findingMoreCardId,
  isDarkMode = false,
  researchStyle,
  apiKey
}) => {
  const activeStyle = researchStyle || getResearchStyleByCreatorId('raftar');
  const [activeTabId, setActiveTabId] = useState<string>('all');
  const [sortByDate, setSortByDate] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editClaimText, setEditClaimText] = useState('');
  const [editValueText, setEditValueText] = useState('');

  // Second source / gap search state
  const [searchingGapOrSecondId, setSearchingGapOrSecondId] = useState<string | null>(null);

  // Book passage paste state
  const [openBookPassageId, setOpenBookPassageId] = useState<string | null>(null);
  const [bookPassageDraft, setBookPassageDraft] = useState('');

  // Add a fact by hand form state
  const [showAddFactForm, setShowAddFactForm] = useState(false);
  const [newFactClaim, setNewFactClaim] = useState('');
  const [newFactValue, setNewFactValue] = useState('');
  const [newFactSource, setNewFactSource] = useState('');
  const [newFactType, setNewFactType] = useState<FactType>(
    activeStyle.sourcePriority[0]?.type || 'official_data'
  );

  const updateDossier = (next: Dossier) => {
    onUpdateDossier?.(next);
    onDossierChange?.(next);
  };

  const triggerMoreResearch = () => {
    onResearchMore?.();
    onRunMoreResearch?.();
  };

  const triggerLockAndContinue = () => {
    onLockAndContinue?.();
    onLockAndGenerate?.();
  };

  const approvedOrPinnedFacts = dossier.facts.filter(
    f => f.status === 'approved' || f.status === 'pinned' || f.status === 'edited'
  );
  const approvedCount = approvedOrPinnedFacts.length;
  const neededCount = Math.max(1, dossier.targetFactCount || 10);
  const coveragePct = Math.min(100, Math.round((approvedCount / neededCount) * 100));
  const meetsMinimumThreshold = approvedCount >= Math.ceil(neededCount * 0.4) || approvedCount >= 2;

  const counterFacts = dossier.facts.filter(
    f => f.stance === 'counter' || f.type === 'counter' || f.type === 'other_side'
  );

  // Dynamic creator-specific tabs from activeStyle.uiLabels.tabs
  const styleTabs = useMemo(() => {
    const baseTabs = Array.isArray(activeStyle.uiLabels.tabs) ? activeStyle.uiLabels.tabs : [];
    return baseTabs.map(tab => {
      const count = dossier.facts.filter(f => tab.types.includes(f.type)).length;
      return {
        ...tab,
        count
      };
    });
  }, [activeStyle.uiLabels.tabs, dossier.facts]);

  const filteredFacts = useMemo(() => {
    let list = [...dossier.facts];
    const matchedStyleTab = styleTabs.find(t => t.id === activeTabId);
    if (matchedStyleTab) {
      list = list.filter(f => matchedStyleTab.types.includes(f.type));
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(
        f =>
          f.claim.toLowerCase().includes(q) ||
          (f.value || '').toLowerCase().includes(q) ||
          (f.source.title || '').toLowerCase().includes(q)
      );
    }
    if (sortByDate) {
      list.sort((a, b) => {
        const yearA = Number(a.figure?.year || a.date || a.source.year || 0);
        const yearB = Number(b.figure?.year || b.date || b.source.year || 0);
        return yearA - yearB;
      });
    }
    return list;
  }, [dossier.facts, activeTabId, styleTabs, searchFilter, sortByDate]);

  // Plain-language quality meter summary
  const numbersCount = approvedOrPinnedFacts.filter(
    f =>
      Boolean(f.value) ||
      Boolean(f.figure?.value) ||
      f.type === 'official_data' ||
      f.type === 'stat' ||
      f.type === 'benchmarks'
  ).length;
  const booksCount = dossier.books.filter(
    b => b.status === 'approved' || b.status === 'pinned'
  ).length;
  const firstGap = dossier.gaps[0] || 'None';

  const updateFactStatus = (id: string, status: CardStatus) => {
    updateDossier({
      ...dossier,
      facts: dossier.facts.map(f => (f.id === id ? { ...f, status } : f))
    });
  };

  const updateQuoteStatus = (id: string, status: CardStatus) => {
    updateDossier({
      ...dossier,
      quotes: dossier.quotes.map(q => (q.id === id ? { ...q, status } : q))
    });
  };

  const updateBookStatus = (id: string, status: CardStatus) => {
    updateDossier({
      ...dossier,
      books: dossier.books.map(b => (b.id === id ? { ...b, status } : b))
    });
  };

  const handleSaveBookPassage = (bookId: string) => {
    const clean = bookPassageDraft.trim();
    if (!clean) return;
    updateDossier({
      ...dossier,
      books: dossier.books.map(b =>
        b.id === bookId
          ? {
              ...b,
              sourceLevel: 'user_text',
              excerptText: clean,
              verifiedPassage: clean,
              status: 'pinned'
            }
          : b
      )
    });
    setOpenBookPassageId(null);
    setBookPassageDraft('');
  };

  const startEditFact = (card: FactCard) => {
    setEditingFactId(card.id);
    setEditClaimText(card.claim);
    setEditValueText(card.value || '');
  };

  const saveEditFact = (id: string) => {
    if (!editClaimText.trim()) return;
    updateDossier({
      ...dossier,
      facts: dossier.facts.map(f =>
        f.id === id
          ? {
              ...f,
              claim: editClaimText.trim(),
              statement: editClaimText.trim(),
              value: editValueText.trim() || undefined,
              editedByUser: true,
              status: f.status === 'rejected' ? 'approved' : f.status
            }
          : f
      )
    });
    setEditingFactId(null);
  };

  const handleAddManualFact = () => {
    if (!newFactClaim.trim()) return;
    const nextIdx = dossier.facts.length + 1;
    const manualCard: FactCard = {
      id: `F${nextIdx}`,
      type: newFactType,
      claim: newFactClaim.trim(),
      statement: newFactClaim.trim(),
      value: newFactValue.trim() || undefined,
      snippet: newFactClaim.trim().split(/\s+/).slice(0, 25).join(' '),
      source: {
        id: `SRC-MANUAL-${nextIdx}`,
        title: newFactSource.trim() || 'User Added Fact',
        origin: 'user_paste',
        verified: true
      },
      confidence: 'high',
      strength: 'strong',
      status: 'pinned'
    };

    updateDossier({
      ...dossier,
      facts: [manualCard, ...dossier.facts]
    });
    setNewFactClaim('');
    setNewFactValue('');
    setNewFactSource('');
    setShowAddFactForm(false);
  };

  const handleFindSecondSource = async (card: FactCard) => {
    setSearchingGapOrSecondId(card.id);
    try {
      const more = await searchForSingleGapOrSecondSource({
        queryText: `${card.claim} ${card.value || ''}`,
        topic: dossier.topic,
        region: 'Pakistan',
        style: activeStyle,
        existingCount: dossier.facts.length,
        apiKey
      });
      if (more.length > 0) {
        updateDossier({
          ...dossier,
          facts: dossier.facts.map(f =>
            f.id === card.id
              ? {
                  ...f,
                  strength: 'strong',
                  confidence: 'high',
                  secondSourceUrl: more[0].source.url
                }
              : f
          )
        });
      }
    } finally {
      setSearchingGapOrSecondId(null);
    }
  };

  const handleSearchForGap = async (gapText: string, gapIdx: number) => {
    const key = `GAP-${gapIdx}`;
    setSearchingGapOrSecondId(key);
    try {
      const found = await searchForSingleGapOrSecondSource({
        queryText: gapText,
        topic: dossier.topic,
        region: 'Pakistan',
        style: activeStyle,
        existingCount: dossier.facts.length,
        apiKey
      });
      if (found.length > 0) {
        updateDossier({
          ...dossier,
          facts: [...found, ...dossier.facts],
          gaps: dossier.gaps.filter((_, i) => i !== gapIdx)
        });
      }
    } finally {
      setSearchingGapOrSecondId(null);
    }
  };

  const renderStrengthBadge = (card: FactCard) => {
    const strength =
      card.strength ||
      (card.confidence === 'high' ? 'strong' : card.confidence === 'medium' ? 'ok' : 'weak');
    if (strength === 'strong') {
      return <span className="text-emerald-600 dark:text-emerald-400 font-bold">Strong</span>;
    }
    if (strength === 'ok') {
      return <span className="text-sky-600 dark:text-sky-400 font-semibold">OK</span>;
    }
    return <span className="text-amber-600 dark:text-amber-400 font-semibold">Weak</span>;
  };

  const inactiveActionBtnCls = isDarkMode
    ? 'bg-white/5 text-slate-300 hover:bg-white/10'
    : 'bg-slate-100 text-slate-700 hover:bg-slate-200';

  const renderFactCard = (card: FactCard) => {
    const isEditing = editingFactId === card.id;
    const isFindingMore = findingMoreCardId === card.id;
    const isFindingSecond = searchingGapOrSecondId === card.id;
    const isUnverifiedVoice =
      card.type === 'public_voices' ||
      card.type === 'public_voice' ||
      card.label === 'unverified_voice' ||
      !card.source.verified;
    const isOpinion = card.label === 'opinion' || card.stance === 'counter' || card.type === 'counter';
    const isIdea = card.label === 'idea' || activeStyle.researchMode === 'concept_lab';

    return (
      <div
        key={card.id}
        className={clsx(
          'rounded-2xl border p-4 sm:p-5 transition-all space-y-2.5 shadow-sm',
          card.status === 'rejected' || card.status === 'removed'
            ? 'opacity-45 bg-slate-100/40 dark:bg-black/10 border-slate-200 dark:border-white/5'
            : card.status === 'pinned'
            ? isDarkMode
              ? 'bg-indigo-950/30 border-indigo-500/50'
              : 'bg-indigo-50/70 border-indigo-300'
            : isDarkMode
            ? 'bg-[#0f172a] border-white/10'
            : 'bg-white border-slate-200'
        )}
      >
        {/* Top Metadata Line */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className={clsx('flex flex-wrap items-center gap-1.5', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">[{card.id}]</span>
            <span>·</span>
            <span className="capitalize font-semibold">{card.type.replace(/_/g, ' ')}</span>
            <span>·</span>
            {renderStrengthBadge(card)}
            {card.value && (
              <>
                <span>·</span>
                <span className="font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {card.value}
                </span>
              </>
            )}
            {(card.date || card.source.year) && (
              <>
                <span>·</span>
                <span>{card.date || card.source.year}</span>
              </>
            )}
            {(card.location || card.place) && (
              <>
                <span>·</span>
                <span>{card.location || card.place}</span>
              </>
            )}
            {isUnverifiedVoice && (
              <>
                <span>·</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">Unverified voice</span>
              </>
            )}
            {isOpinion && (
              <>
                <span>·</span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">Opinion / Counter</span>
              </>
            )}
            {isIdea && (
              <>
                <span>·</span>
                <span className="font-semibold text-pink-600 dark:text-pink-400">Idea</span>
              </>
            )}
          </div>

          <div className="text-xs font-bold">
            {card.status === 'pinned' && <span className="text-indigo-600 dark:text-indigo-400">★ Must-Use</span>}
            {card.status === 'approved' && <span className="text-emerald-600 dark:text-emerald-400">Kept</span>}
            {card.status === 'edited' && <span className="text-sky-600 dark:text-sky-400">Edited</span>}
            {card.status === 'pending' && <span className="text-amber-600 dark:text-amber-400">Needs Review</span>}
            {(card.status === 'rejected' || card.status === 'removed') && (
              <span className="text-rose-500">Skipped</span>
            )}
          </div>
        </div>

        {/* Claim or Inline Editor */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              rows={2}
              value={editClaimText}
              onChange={e => setEditClaimText(e.target.value)}
              className={clsx(
                'w-full rounded-xl border p-2.5 text-sm outline-none',
                isDarkMode ? 'bg-black/30 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
              )}
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editValueText}
                onChange={e => setEditValueText(e.target.value)}
                placeholder="Exact number / % / date (optional)"
                className={clsx(
                  'flex-1 rounded-xl border px-3 py-1.5 text-xs outline-none',
                  isDarkMode ? 'bg-black/30 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                )}
              />
              <button
                type="button"
                onClick={() => saveEditFact(card.id)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingFactId(null)}
                className={clsx('px-3 py-1.5 rounded-xl text-xs font-semibold', inactiveActionBtnCls)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className={clsx('text-sm sm:text-base font-semibold leading-relaxed', isDarkMode ? 'text-white' : 'text-slate-900')}>
            {card.claim}
          </p>
        )}

        {/* Conflict Warning if detected */}
        {card.conflictNote && (
          <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>{card.conflictNote}</span>
          </div>
        )}

        {/* Snippet & Source Line */}
        <div className={clsx('text-xs space-y-1', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
          {card.snippet && card.snippet !== card.claim && (
            <p className="italic">&ldquo;{card.snippet}&rdquo;</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold">Source: {card.source.title}</span>
            {card.source.url && (
              <a
                href={card.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                <span>{card.source.domain || 'Open link'}</span>
                <ExternalLink size={12} />
              </a>
            )}
            {card.secondSourceUrl && (
              <a
                href={card.secondSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>· Verified by 2nd source</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={clsx('pt-2.5 border-t flex flex-wrap items-center justify-between gap-2', isDarkMode ? 'border-white/10' : 'border-slate-200')}>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => updateFactStatus(card.id, 'approved')}
              className={clsx(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors',
                card.status === 'approved'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : inactiveActionBtnCls
              )}
            >
              <Check size={13} />
              <span>Keep</span>
            </button>

            <button
              type="button"
              onClick={() =>
                updateFactStatus(card.id, card.status === 'pinned' ? 'approved' : 'pinned')
              }
              className={clsx(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors',
                card.status === 'pinned'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : inactiveActionBtnCls
              )}
            >
              <Pin size={13} />
              <span>{card.status === 'pinned' ? '★ Must-Use' : 'Star (Must-Use)'}</span>
            </button>

            <button
              type="button"
              onClick={() => startEditFact(card)}
              className={clsx('inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold', inactiveActionBtnCls)}
            >
              <Edit2 size={13} />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => updateFactStatus(card.id, 'rejected')}
              className={clsx(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors',
                card.status === 'rejected' || card.status === 'removed'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : inactiveActionBtnCls
              )}
            >
              <X size={13} />
              <span>Skip</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {(card.strength === 'weak' || card.confidence === 'low' || !card.secondSourceUrl) && (
              <button
                type="button"
                onClick={() => handleFindSecondSource(card)}
                disabled={isFindingSecond}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
              >
                {isFindingSecond ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Search size={13} />
                )}
                <span>Find a second source</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onFindMoreLikeCard(card)}
              disabled={isFindingMore}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/15"
            >
              {isFindingMore ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>{isFindingMore ? 'Finding...' : 'Find more like this'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Quality Meter in Plain Words */}
      <div
        className={clsx(
          'rounded-[2rem] border p-5 sm:p-6 space-y-3 shadow-sm',
          isDarkMode ? 'bg-[#0f172a]/90 border-white/10' : 'bg-white border-slate-200/90'
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className={clsx('font-display text-base sm:text-lg font-extrabold', isDarkMode ? 'text-white' : 'text-slate-900')}>
              {approvedCount} of {neededCount} facts ready ({activeStyle.displayName})
            </div>
            <div className={clsx('text-xs sm:text-sm mt-0.5', isDarkMode ? 'text-slate-300' : 'text-slate-600')}>
              {numbersCount >= 3 ? `Strong on numbers (${numbersCount})` : 'Light on numbers'} ·{' '}
              {booksCount >= 1 ? `Books ready (${booksCount})` : 'Light on books'} ·{' '}
              {dossier.gaps.length > 0 ? `Missing: ${firstGap}` : 'All key questions covered'}
            </div>
          </div>
          <div className="font-mono text-sm sm:text-base font-extrabold tabular-nums text-indigo-600 dark:text-indigo-400">
            {coveragePct}% ready
          </div>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
          <div
            className={clsx(
              'h-full transition-all duration-300',
              coveragePct >= 80
                ? 'bg-emerald-500'
                : coveragePct >= 60
                ? 'bg-indigo-600'
                : 'bg-amber-500'
            )}
            style={{ width: `${Math.max(5, coveragePct)}%` }}
          />
        </div>
      </div>

      {/* Dynamic Creator Tabs + Search + Sort by Date + Add a Fact by Hand */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className={clsx(
            'flex flex-wrap items-center gap-1 p-1.5 rounded-2xl border',
            isDarkMode ? 'bg-black/30 border-white/10' : 'bg-slate-100 border-slate-200'
          )}
        >
          <button
            type="button"
            onClick={() => setActiveTabId('all')}
            className={clsx(
              'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors',
              activeTabId === 'all'
                ? isDarkMode
                  ? 'bg-[#1e293b] text-white shadow-sm'
                  : 'bg-white text-slate-900 shadow-sm'
                : isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            All Facts ({dossier.facts.length})
          </button>

          {styleTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabId(tab.id)}
              className={clsx(
                'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors',
                activeTabId === tab.id
                  ? isDarkMode
                    ? 'bg-[#1e293b] text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-sm'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {tab.label} ({tab.count})
            </button>
          ))}

          <button
            type="button"
            onClick={() => setActiveTabId('books_quotes')}
            className={clsx(
              'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors',
              activeTabId === 'books_quotes'
                ? isDarkMode
                  ? 'bg-[#1e293b] text-white shadow-sm'
                  : 'bg-white text-slate-900 shadow-sm'
                : isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Books &amp; Quotes ({dossier.books.length + dossier.quotes.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTabId('other_side')}
            className={clsx(
              'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors',
              activeTabId === 'other_side'
                ? isDarkMode
                  ? 'bg-[#1e293b] text-white shadow-sm'
                  : 'bg-white text-slate-900 shadow-sm'
                : isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Other Side ({counterFacts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTabId('gaps')}
            className={clsx(
              'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors',
              activeTabId === 'gaps'
                ? isDarkMode
                  ? 'bg-[#1e293b] text-white shadow-sm'
                  : 'bg-white text-slate-900 shadow-sm'
                : isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Still Missing ({dossier.gaps.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Search facts or sources..."
            className={clsx(
              'rounded-xl border px-3.5 py-2 text-xs sm:text-sm outline-none w-48',
              isDarkMode ? 'bg-black/30 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
            )}
          />

          <button
            type="button"
            onClick={() => setSortByDate(prev => !prev)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold transition-colors',
              sortByDate
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : isDarkMode
                ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            )}
          >
            <Calendar size={14} />
            <span>Sort by date</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddFactForm(prev => !prev)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
          >
            <Plus size={14} />
            <span>+ Add my own fact</span>
          </button>
        </div>
      </div>

      {/* Inline Add a Fact by Hand Form */}
      {showAddFactForm && (
        <div
          className={clsx(
            'rounded-2xl border p-5 space-y-3',
            isDarkMode ? 'bg-[#1e293b]/90 border-indigo-500/40' : 'bg-indigo-50/70 border-indigo-200'
          )}
        >
          <div className={clsx('text-sm font-extrabold', isDarkMode ? 'text-white' : 'text-slate-900')}>
            Add your own fact (pinned as ★ Must-Use automatically)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={newFactClaim}
              onChange={e => setNewFactClaim(e.target.value)}
              placeholder="Write 1 clear factual sentence..."
              className={clsx(
                'sm:col-span-2 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none',
                isDarkMode ? 'bg-black/30 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
              )}
            />
            <input
              type="text"
              value={newFactValue}
              onChange={e => setNewFactValue(e.target.value)}
              placeholder="Exact number / % / date (optional)"
              className={clsx(
                'rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none',
                isDarkMode ? 'bg-black/30 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
              )}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={newFactType}
              onChange={e => setNewFactType(e.target.value as FactType)}
              className={clsx(
                'rounded-xl border px-3 py-2.5 text-xs sm:text-sm font-bold outline-none',
                isDarkMode ? 'bg-black/30 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
              )}
            >
              <option value="official_data">Official Numbers &amp; Data</option>
              <option value="official_documents">Laws, Courts &amp; Documents</option>
              <option value="news">News &amp; Dated Events</option>
              <option value="books_history">Books &amp; History</option>
              <option value="global_studies">Studies &amp; Comparisons</option>
              <option value="benchmarks">Case Study / Benchmarks</option>
              <option value="public_voices">Public Voices</option>
              <option value="user_material">My Material</option>
            </select>
            <input
              type="text"
              value={newFactSource}
              onChange={e => setNewFactSource(e.target.value)}
              placeholder="Source name (e.g., Official Report 2025)"
              className={clsx(
                'flex-1 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none',
                isDarkMode ? 'bg-black/30 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
              )}
            />
            <button
              type="button"
              onClick={handleAddManualFact}
              disabled={!newFactClaim.trim()}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Save &amp; Star Fact
            </button>
          </div>
        </div>
      )}

      {/* FACTS TABS (All or Creator-Specific Filter Tab) */}
      {activeTabId !== 'books_quotes' && activeTabId !== 'other_side' && activeTabId !== 'gaps' && (
        <div className="space-y-3">
          {filteredFacts.length === 0 ? (
            <div className={clsx('rounded-2xl border p-8 text-center text-sm', isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 bg-white text-slate-600')}>
              No facts in this tab yet. Click &ldquo;Research more&rdquo; or &ldquo;+ Add my own fact&rdquo;.
            </div>
          ) : (
            filteredFacts.map(renderFactCard)
          )}
        </div>
      )}

      {/* TAB: BOOKS & QUOTES */}
      {activeTabId === 'books_quotes' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className={clsx('font-display text-sm font-extrabold', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
              Books ({dossier.books.length})
            </h3>
            {dossier.books.length === 0 ? (
              <p className={clsx('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                No books in this plan yet.
              </p>
            ) : (
              dossier.books.map((book: BookRef) => {
                const isPassageOpen = openBookPassageId === book.id;
                return (
                  <div
                    key={book.id}
                    className={clsx(
                      'rounded-2xl border p-4 sm:p-5 space-y-2.5 shadow-sm',
                      book.status === 'rejected'
                        ? 'opacity-45'
                        : isDarkMode
                        ? 'bg-[#0f172a] border-white/10'
                        : 'bg-white border-slate-200'
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className={clsx('flex flex-wrap items-center gap-1.5', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">[{book.id}]</span>
                        <span>·</span>
                        <span>{(book.authors || [book.author]).filter(Boolean).join(', ')}</span>
                        {book.year && (
                          <>
                            <span>·</span>
                            <span>{book.year}</span>
                          </>
                        )}
                        <span>·</span>
                        <span className={book.sourceLevel === 'user_text' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                          {book.sourceLevel === 'user_text'
                            ? 'User passage provided (Direct quotes <25w allowed)'
                            : 'Metadata only — paste passage to quote directly'}
                        </span>
                      </div>
                    </div>
                    <div className={clsx('text-base font-extrabold', isDarkMode ? 'text-white' : 'text-slate-900')}>
                      {book.title}
                    </div>
                    <p className={clsx('text-xs sm:text-sm', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
                      {book.coreIdeaForTopic || book.relevance}
                    </p>

                    {isPassageOpen && (
                      <div className={clsx('space-y-2 pt-2 border-t', isDarkMode ? 'border-white/10' : 'border-slate-200')}>
                        <textarea
                          rows={2}
                          value={bookPassageDraft}
                          onChange={e => setBookPassageDraft(e.target.value)}
                          placeholder="Paste exact passage from this book (<25 words for quotes)..."
                          className={clsx(
                            'w-full rounded-xl border p-2.5 text-xs outline-none',
                            isDarkMode ? 'border-white/15 bg-black/30 text-white' : 'border-slate-300 bg-white text-slate-900'
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveBookPassage(book.id)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white"
                        >
                          Save verified passage
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => updateBookStatus(book.id, 'approved')}
                        className={clsx(
                          'px-3 py-1.5 rounded-xl text-xs font-bold',
                          book.status === 'approved' ? 'bg-emerald-600 text-white' : inactiveActionBtnCls
                        )}
                      >
                        Keep
                      </button>
                      <button
                        type="button"
                        onClick={() => updateBookStatus(book.id, 'pinned')}
                        className={clsx(
                          'px-3 py-1.5 rounded-xl text-xs font-bold',
                          book.status === 'pinned' ? 'bg-indigo-600 text-white' : inactiveActionBtnCls
                        )}
                      >
                        Star
                      </button>
                      <button
                        type="button"
                        onClick={() => updateBookStatus(book.id, 'rejected')}
                        className={clsx(
                          'px-3 py-1.5 rounded-xl text-xs font-bold',
                          book.status === 'rejected' ? 'bg-rose-600 text-white' : inactiveActionBtnCls
                        )}
                      >
                        Skip
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenBookPassageId(isPassageOpen ? null : book.id)
                        }
                        className={clsx(
                          'px-3 py-1.5 rounded-xl text-xs font-bold border',
                          isDarkMode
                            ? 'border-white/15 text-indigo-300 hover:bg-white/5'
                            : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                        )}
                      >
                        {isPassageOpen ? 'Cancel' : 'Paste passage from this book'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-3 pt-2">
            <h3 className={clsx('font-display text-sm font-extrabold', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
              Quotes ({dossier.quotes.length})
            </h3>
            {dossier.quotes.map((q: QuoteCard) => (
              <div
                key={q.id}
                className={clsx(
                  'rounded-2xl border p-4 sm:p-5 space-y-2 shadow-sm',
                  q.status === 'rejected'
                    ? 'opacity-45'
                    : isDarkMode
                    ? 'bg-[#0f172a] border-white/10'
                    : 'bg-white border-slate-200'
                )}
              >
                <div className={clsx('flex items-center justify-between text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                  <span>
                    <strong className="font-mono text-indigo-600 dark:text-indigo-400">[{q.id}]</strong> · {q.speaker} · {q.workOrContext || q.roleOrContext}
                    {q.verifiedExactText ? ' · Verified (<25 words)' : ' · Check at source (Paraphrase)'}
                  </span>
                </div>
                <p className={clsx('text-sm sm:text-base italic font-semibold', isDarkMode ? 'text-white' : 'text-slate-900')}>
                  &ldquo;{q.quote}&rdquo;
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => updateQuoteStatus(q.id, 'approved')}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-xs font-bold',
                      q.status === 'approved' ? 'bg-emerald-600 text-white' : inactiveActionBtnCls
                    )}
                  >
                    Keep
                  </button>
                  <button
                    type="button"
                    onClick={() => updateQuoteStatus(q.id, 'pinned')}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-xs font-bold',
                      q.status === 'pinned' ? 'bg-indigo-600 text-white' : inactiveActionBtnCls
                    )}
                  >
                    Star
                  </button>
                  <button
                    type="button"
                    onClick={() => updateQuoteStatus(q.id, 'rejected')}
                    className={clsx(
                      'px-3 py-1.5 rounded-xl text-xs font-bold',
                      q.status === 'rejected' ? 'bg-rose-600 text-white' : inactiveActionBtnCls
                    )}
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: THE OTHER SIDE */}
      {activeTabId === 'other_side' && (
        <div className="space-y-3">
          <p className={clsx('text-xs sm:text-sm', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
            Strongest opposing arguments or alternative explanations. Choose which ones to keep or skip in your script.
          </p>
          {counterFacts.length === 0 ? (
            <div className={clsx('rounded-2xl border p-6 text-center text-sm', isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 bg-white text-slate-600')}>
              No counter-arguments collected yet.
            </div>
          ) : (
            counterFacts.map(renderFactCard)
          )}
        </div>
      )}

      {/* TAB: STILL MISSING */}
      {activeTabId === 'gaps' && (
        <div className="space-y-3">
          {dossier.gaps.length === 0 ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-700 dark:text-emerald-300 font-bold">
              All target research questions meet coverage requirements for this video duration.
            </div>
          ) : (
            dossier.gaps.map((gap, i) => {
              const isSearchingThis = searchingGapOrSecondId === `GAP-${i}`;
              return (
                <div
                  key={i}
                  className={clsx(
                    'rounded-2xl border p-4 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2.5',
                    isDarkMode
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                      : 'border-amber-300 bg-amber-50 text-amber-900'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
                    <span className="font-semibold">{gap}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSearchForGap(gap, i)}
                      disabled={isSearchingThis}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {isSearchingThis ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Search size={13} />
                      )}
                      <span>Search for this</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddFactForm(true)}
                      className={clsx('px-3 py-2 rounded-xl text-xs font-bold', inactiveActionBtnCls)}
                    >
                      Add by hand
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className={clsx('flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t', isDarkMode ? 'border-white/10' : 'border-slate-200')}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className={clsx(
              'inline-flex items-center justify-center gap-2 min-h-[50px] px-5 rounded-2xl border text-sm font-bold transition-colors w-full sm:w-auto',
              isDarkMode
                ? 'bg-[#1e293b] border-white/10 text-white hover:bg-white/10'
                : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
            )}
          >
            <ArrowLeft size={16} />
            <span>Back to Research Plan</span>
          </button>
        ) : (
          <div className={clsx('text-xs sm:text-sm font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
            Keep or star facts to lock them into your chapter outline
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={triggerMoreResearch}
            disabled={isResearchingMore}
            className={clsx(
              'inline-flex items-center justify-center gap-2 min-h-[50px] px-5 rounded-2xl border text-sm font-bold transition-colors w-full sm:w-auto',
              isDarkMode
                ? 'border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/15'
                : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            )}
          >
            {isResearchingMore ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            <span>Research More</span>
          </button>

          <button
            type="button"
            onClick={triggerLockAndContinue}
            disabled={!meetsMinimumThreshold || isGeneratingBeatPlan}
            className="inline-flex items-center justify-center gap-2.5 min-h-[52px] px-8 rounded-2xl text-sm sm:text-base font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white hover:opacity-95 shadow-xl disabled:opacity-50 w-full sm:w-auto"
          >
            {isGeneratingBeatPlan ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Lock size={17} />
            )}
            <span>
              {isGeneratingBeatPlan
                ? 'Building Chapter Outline...'
                : `Lock ${approvedCount} Facts & Build Chapter Outline`}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default DossierReview;
