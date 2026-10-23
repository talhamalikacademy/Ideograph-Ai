import React, { useState, useEffect } from 'react';
import {
  Citation,
  ScriptData,
  VerifiedClaimOrPaperItem,
  InfographicBlueprintItem,
  ScientificGlossaryItem
} from '../types';
import {
  BookOpen,
  ShieldCheck,
  ExternalLink,
  Search,
  BarChart3,
  FlaskConical,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';

interface EvidencePanelProps {
  data: Citation[];
  script: ScriptData;
  focusedMarkerId?: string | null;
  onSelectMarker?: (markerId: string | null) => void;
}

const isValidHttpUrl = (url?: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

type EvidenceTab = 'all' | 'claims' | 'infographics' | 'glossary';

const EvidencePanel: React.FC<EvidencePanelProps> = ({
  data,
  script,
  focusedMarkerId,
  onSelectMarker
}) => {
  const [activeTab, setActiveTab] = useState<EvidenceTab>('all');

  const claimsRegistry: VerifiedClaimOrPaperItem[] =
    script.claimsAndPapersRegistry ||
    script.researchPayload?.claimsAndPapersRegistry ||
    [];

  const infographics: InfographicBlueprintItem[] =
    script.infographicsBlueprint ||
    script.researchPayload?.infographicsBlueprint ||
    [];

  const glossary: ScientificGlossaryItem[] =
    script.scientificGlossary ||
    script.researchPayload?.scientificGlossary ||
    [];

  useEffect(() => {
    if (!focusedMarkerId) return;
    const upper = focusedMarkerId.toUpperCase();
    if (upper.startsWith('INFOGRAPHIC')) {
      setActiveTab('infographics');
    } else if (upper.startsWith('CLAIM') || upper.startsWith('PAPER')) {
      setActiveTab('claims');
    }
  }, [focusedMarkerId]);

  const verifiedCitationCount = data.filter(c => c.isVerified && isValidHttpUrl(c.url)).length;
  const groundedClaimsCount = claimsRegistry.filter(
    c => c.isGroundedUrl || isValidHttpUrl(c.sourceUrl)
  ).length;
  const totalClaimsCount = claimsRegistry.length > 0 ? claimsRegistry.length : data.length;
  const totalGroundedCount = Math.max(verifiedCitationCount, groundedClaimsCount);

  return (
    <div className="p-5 space-y-5">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold flex items-center gap-2 dark:text-white text-slate-900">
            <BookOpen size={17} className="text-blue-500 shrink-0" />
            <span>Live Research & Evidence Inspector</span>
          </h3>
          {focusedMarkerId && (
            <button
              type="button"
              onClick={() => onSelectMarker?.(null)}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/25 transition-colors"
            >
              Showing {focusedMarkerId} · Clear
            </button>
          )}
        </div>
        <p className="text-xs opacity-60 mt-1">
          Click any inline <span className="font-mono font-semibold">[CLAIM-X]</span>,{' '}
          <span className="font-mono font-semibold">[PAPER-X]</span>, or{' '}
          <span className="font-mono font-semibold">[INFOGRAPHIC-X]</span> badge in the script to verify sources and chart blueprints.
        </p>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
          <div className="text-lg font-bold text-blue-500">{totalClaimsCount}</div>
          <div className="text-[9px] uppercase font-bold opacity-65">Claims / Papers</div>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <div className="text-lg font-bold text-emerald-500">{totalGroundedCount}</div>
          <div className="text-[9px] uppercase font-bold opacity-65">Web Grounded</div>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <div className="text-lg font-bold text-amber-500">{infographics.length}</div>
          <div className="text-[9px] uppercase font-bold opacity-65">Infographics</div>
        </div>
        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
          <div className="text-lg font-bold text-purple-500">{glossary.length}</div>
          <div className="text-[9px] uppercase font-bold opacity-65">Domain Terms</div>
        </div>
      </div>

      {/* Filter Tabs */}
      {(claimsRegistry.length > 0 || infographics.length > 0 || glossary.length > 0) && (
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-200/70 dark:bg-white/5 p-1 border border-slate-300/60 dark:border-white/10">
          {([
            { id: 'all', label: 'All' },
            { id: 'claims', label: `Sources (${totalClaimsCount})` },
            { id: 'infographics', label: `Charts (${infographics.length})` },
            { id: 'glossary', label: `Lexicon (${glossary.length})` }
          ] as const).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'h-8 rounded-lg text-[11px] font-bold transition-all truncate px-1.5',
                activeTab === tab.id
                  ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* 1. Verified Claims & Peer-Reviewed Papers Registry */}
      {(activeTab === 'all' || activeTab === 'claims') && claimsRegistry.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileCheck2 size={14} className="text-emerald-500" />
              Verified Claims & Peer-Reviewed Papers
            </h4>
          </div>

          {claimsRegistry.map((item, idx) => {
            const isFocused =
              focusedMarkerId &&
              item.id.toUpperCase() === focusedMarkerId.toUpperCase();
            const isPaper =
              item.type === 'research_paper' || item.id.toUpperCase().startsWith('PAPER');
            const hasDirectUrl = isValidHttpUrl(item.sourceUrl);
            const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(
              `${item.sourceTitle} ${item.institutionOrJournal} ${item.publicationYear}`.trim()
            )}`;
            const googleVerifyUrl = `https://www.google.com/search?q=${encodeURIComponent(
              `${item.sourceTitle} ${item.institutionOrJournal}`.trim()
            )}`;

            return (
              <div
                key={`claim-${item.id || 'item'}-${idx}`}
                className={clsx(
                  'p-4 rounded-xl border transition-all space-y-2.5',
                  isFocused
                    ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/40'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-blue-500/40'
                )}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border',
                      isPaper
                        ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    )}
                  >
                    [{item.id}] · {isPaper ? 'Peer-Reviewed Paper' : 'Verified Claim'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {item.institutionOrJournal} • {item.publicationYear}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {item.sourceTitle}
                </div>

                {item.spokenSentenceInScript && (
                  <blockquote className="text-xs italic text-slate-600 dark:text-slate-300 border-l-2 border-indigo-500/50 pl-2.5 py-0.5">
                    "{item.spokenSentenceInScript}"
                  </blockquote>
                )}

                {item.deepVerificationDetails && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-100/80 dark:bg-black/25 p-2.5 rounded-lg">
                    {item.deepVerificationDetails}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {hasDirectUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink size={12} /> Open Grounded Source
                    </a>
                  )}
                  <a
                    href={isPaper ? scholarUrl : googleVerifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <Search size={12} /> {isPaper ? 'Verify on Google Scholar' : 'Verify Source Online'}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Infographic Data Blueprints */}
      {(activeTab === 'all' || activeTab === 'infographics') && infographics.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <BarChart3 size={14} className="text-amber-500" />
            Infographic Data Blueprints
          </h4>

          {infographics.map((inf, idx) => {
            const isFocused =
              focusedMarkerId &&
              inf.id.toUpperCase() === focusedMarkerId.toUpperCase();

            return (
              <div
                key={`inf-${inf.id || 'chart'}-${idx}`}
                className={clsx(
                  'p-4 rounded-xl border transition-all space-y-2.5',
                  isFocused
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/40'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-amber-500/40'
                )}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
                    [{inf.id}] · {inf.chartType}
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                    {inf.timestamp}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {inf.onScreenTitle}
                </div>

                {inf.dataPoints && inf.dataPoints.length > 0 && (
                  <div className="space-y-1 bg-slate-100/80 dark:bg-black/25 p-2.5 rounded-lg">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Exact X/Y Data Points & Metrics
                    </div>
                    <ul className="space-y-1 text-xs font-mono text-slate-700 dark:text-slate-200">
                      {inf.dataPoints.map((dp, dpIdx) => (
                        <li key={`dp-${dpIdx}`} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{dp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {inf.sourceCitationOnScreen && (
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <span className="opacity-60">On-Screen Citation: </span>
                    {inf.sourceCitationOnScreen}
                  </div>
                )}

                {inf.editorAnimationNotes && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                    <span className="font-semibold not-italic text-amber-600 dark:text-amber-400">
                      Editor Motion Cue:{' '}
                    </span>
                    {inf.editorAnimationNotes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. High-Density Domain & Scientific Glossary */}
      {(activeTab === 'all' || activeTab === 'glossary') && glossary.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FlaskConical size={14} className="text-purple-500" />
            Domain & Scientific Lexicon Glossary
          </h4>

          <div className="space-y-2.5">
            {glossary.map((item, idx) => (
              <div
                key={`gloss-${item.term || 'term'}-${idx}`}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-300 flex items-center gap-1">
                    <Sparkles size={12} /> {item.term}
                  </span>
                  {item.usedInTimestamp && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500">
                      {item.usedInTimestamp}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.simpleDefinition}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Fallback / Additional Citations List */}
      {(activeTab === 'all' || activeTab === 'claims') &&
        claimsRegistry.length === 0 &&
        data.length > 0 && (
          <div className="space-y-3">
            {data.map((cite, i) => {
              const hasGroundedLink = Boolean(cite.isVerified && isValidHttpUrl(cite.url));
              const searchVerifyUrl = `https://www.google.com/search?q=${encodeURIComponent(
                `${cite.sourceName || ''} ${cite.context || ''}`.trim()
              )}`;

              return (
                <div
                  key={`cite-${cite.id || 'c'}-${i}`}
                  className="p-4 rounded-xl border dark:border-white/5 bg-white dark:bg-white/5 transition-all hover:border-blue-500/30"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className={clsx(
                        'text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1',
                        hasGroundedLink
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-amber-500/20 text-amber-500'
                      )}
                    >
                      {hasGroundedLink ? 'Verified Source' : 'Unverified Reference'}
                    </div>
                    <div className="text-[10px] opacity-50 uppercase flex items-center gap-1">
                      {cite.type}
                    </div>
                  </div>

                  <div className="mb-2">
                    <p className="text-xs italic opacity-70 mb-1">"{cite.context}"</p>
                    <div className="h-px bg-white/5 w-full my-2" />
                    <div className="text-sm font-bold dark:text-slate-200 text-slate-800">
                      {cite.sourceName}
                    </div>
                  </div>

                  {hasGroundedLink ? (
                    <a
                      href={cite.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                    >
                      <ExternalLink size={12} /> Open Grounded Source
                    </a>
                  ) : (
                    <a
                      href={searchVerifyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-amber-500 hover:underline"
                    >
                      <Search size={12} /> Search Google to Verify
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border dark:border-white/5 text-center">
        <ShieldCheck size={22} className="mx-auto mb-1.5 text-emerald-500 opacity-80" />
        <p className="text-[10px] opacity-65">
          Direct links are grounded via live Google Search metadata.
          <br />
          Click any inline claim or infographic tag in the script to inspect its proof.
        </p>
      </div>
    </div>
  );
};

export default EvidencePanel;
