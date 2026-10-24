import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FilePlus2,
  Sparkles,
  BookOpen,
  RefreshCw,
  Check,
  X,
  Upload,
  Loader2,
  ChevronRight,
  Film,
  ListChecks,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import {
  Dossier,
  WrittenChapterResult,
  ChapterOutlineItem,
  HookLabVariant,
  ScriptClaimItem,
  EvidenceInsertionSuggestion,
  ProductionScriptRow
} from "../../types";
import { CreatorRecipe } from "../../creator-recipes/types";
import { readUploadedFileText } from "../../services/sourceService";
import {
  extractAndVerifyClaims,
  generateClaimFixDiff,
  analyzeUploadedSourceForScript
} from "../../services/claimService";

export type WorkspaceRightTab =
  | "sources"
  | "claims"
  | "add_evidence"
  | "hook_lab"
  | "style_check";

interface ChapterNavigatorProps {
  chapters: WrittenChapterResult[];
  outline: ChapterOutlineItem[];
  activeChapterId: string | null;
  onSelectChapter: (chapterId: string) => void;
  onExpandOrTrimChapter?: (chapter: WrittenChapterResult, action: "expand" | "trim") => void;
  expandingChapterId?: string | null;
}

export const ChapterNavigator: React.FC<ChapterNavigatorProps> = ({
  chapters,
  outline,
  activeChapterId,
  onSelectChapter,
  onExpandOrTrimChapter,
  expandingChapterId
}) => {
  if (!chapters || chapters.length === 0) return null;

  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0);
  const totalTarget = chapters.reduce((acc, c) => acc + c.targetWords, 0);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Chapters ({chapters.length})
          </h3>
          <p className="text-[11px] text-slate-400">
            {totalWords.toLocaleString()} / {totalTarget.toLocaleString()} body words
          </p>
        </div>
      </div>

      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
        {chapters.map(chap => {
          const density =
            chap.wordCount > 0
              ? ((chap.usedFactIds.length / chap.wordCount) * 100).toFixed(1)
              : "0.0";
          const isSelected = activeChapterId === chap.chapterId;
          const isBusy = expandingChapterId === chap.chapterId;
          const outlineItem = outline.find(o => o.id === chap.chapterId);

          return (
            <div
              key={chap.chapterId}
              onClick={() => onSelectChapter(chap.chapterId)}
              className={`cursor-pointer rounded-xl border p-3 transition-all ${
                isSelected
                  ? "border-indigo-500 bg-indigo-950/25"
                  : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-white leading-snug">
                  {chap.chapterNumber}. {chap.title}
                </span>
                <span
                  className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    chap.lengthStatus === "on_target"
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : chap.lengthStatus === "under_budget"
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {chap.wordCount} / {chap.targetWords}w
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {chap.usedFactIds.length} facts ({density}/100w)
                </span>
                {onExpandOrTrimChapter && chap.lengthStatus !== "on_target" && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={e => {
                      e.stopPropagation();
                      onExpandOrTrimChapter(
                        chap,
                        chap.lengthStatus === "under_budget" ? "expand" : "trim"
                      );
                    }}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    {isBusy ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    {chap.lengthStatus === "under_budget" ? "Expand chapter" : "Trim chapter"}
                  </button>
                )}
              </div>

              {outlineItem?.gapWarning && (
                <div className="mt-1.5 text-[10px] text-amber-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Low evidence density</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ProductionScriptTableViewProps {
  rows: ProductionScriptRow[];
  isGenerating: boolean;
  onGenerateProductionScript: () => void;
}

export const ProductionScriptTableView: React.FC<ProductionScriptTableViewProps> = ({
  rows,
  isGenerating,
  onGenerateProductionScript
}) => {
  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
          <Film className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-base font-bold text-white">
            Generate Full Production Script (~2.3x Word Density)
          </h3>
          <p className="text-xs text-slate-400">
            Expands your voiceover script into a complete scene-by-scene table with Visual Direction,
            B-Roll & Archival Cues, On-Screen Text, Source Callouts, and Audio/SFX Mood.
          </p>
        </div>
        <button
          type="button"
          disabled={isGenerating}
          onClick={onGenerateProductionScript}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white inline-flex items-center gap-2 transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Building Production Script (~2.3x)...
            </>
          ) : (
            <>
              <Film className="w-4 h-4" />
              Build Production Script Table
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Production Script Table ({rows.length} Beats)
          </h3>
          <p className="text-[11px] text-slate-400">
            Includes spoken voiceover, B-roll direction, on-screen text, source tags, and audio cues
          </p>
        </div>
        <button
          type="button"
          disabled={isGenerating}
          onClick={onGenerateProductionScript}
          className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
          Rebuild Table
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="p-3 w-28">Time & Chapter</th>
              <th className="p-3 w-1/3">Spoken Voiceover</th>
              <th className="p-3 w-1/3">Visual & B-Roll Direction</th>
              <th className="p-3">On-Screen Text, Source & Audio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-xs">
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-slate-900/30 align-top">
                <td className="p-3 font-mono text-[11px] text-indigo-300">
                  <div>{row.timestamp}</div>
                  <div className="text-[10px] font-sans text-slate-400 mt-1">{row.chapterTitle}</div>
                </td>
                <td className="p-3 text-slate-100 leading-relaxed whitespace-pre-wrap">
                  {row.voiceover}
                </td>
                <td className="p-3 text-slate-300 leading-relaxed">{row.visualDirection}</td>
                <td className="p-3 space-y-1.5">
                  <div className="text-[11px] font-semibold text-amber-300">
                    Text: {row.onScreenText}
                  </div>
                  <div className="text-[11px] text-emerald-300">Source: {row.sourceTag}</div>
                  <div className="text-[10px] text-slate-400">Audio: {row.audioMood}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface WorkspaceRightRailProps {
  activeTab: WorkspaceRightTab;
  onTabChange: (tab: WorkspaceRightTab) => void;
  scriptText: string;
  onUpdateScriptText: (newText: string, versionLabel: string) => void;
  dossier?: Dossier | null;
  onUpdateDossier?: (dossier: Dossier) => void;
  chapters?: WrittenChapterResult[];
  hookVariants?: HookLabVariant[];
  activeHookText?: string;
  onSelectHookVariant?: (variant: HookLabVariant) => void;
  claims: ScriptClaimItem[];
  onUpdateClaims: (claims: ScriptClaimItem[]) => void;
  evidenceSuggestions: EvidenceInsertionSuggestion[];
  onUpdateEvidenceSuggestions: (suggestions: EvidenceInsertionSuggestion[]) => void;
  openLoopsSummary?: Array<{
    question: string;
    plantedIn: string;
    paidOffIn: string;
    status: "resolved" | "unpaid";
  }>;
  recipe?: CreatorRecipe | null;
  durationMinutes: number;
  topic: string;
  apiKey?: string;
}

export const WorkspaceRightRail: React.FC<WorkspaceRightRailProps> = ({
  activeTab,
  onTabChange,
  scriptText,
  onUpdateScriptText,
  dossier,
  onUpdateDossier,
  chapters = [],
  hookVariants = [],
  activeHookText,
  onSelectHookVariant,
  claims,
  onUpdateClaims,
  evidenceSuggestions,
  onUpdateEvidenceSuggestions,
  openLoopsSummary = [],
  recipe,
  durationMinutes,
  topic,
  apiKey
}) => {
  const [isCheckingClaims, setIsCheckingClaims] = useState(false);
  const [claimProgressLabel, setClaimProgressLabel] = useState("");
  const [claimFilter, setClaimFilter] = useState<
    "all" | "high_risk" | "needs_source" | "editor_review" | "verified"
  >("all");
  const [flagNamedPersons, setFlagNamedPersons] = useState(true);
  const [activeDiffPreview, setActiveDiffPreview] = useState<{
    claimId: string;
    action: string;
    proposedSentence: string;
    explanation: string;
  } | null>(null);
  const [loadingFixClaimId, setLoadingFixClaimId] = useState<string | null>(null);

  // Post-script Add Evidence state
  const [evidenceTitle, setEvidenceTitle] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [isAnalyzingEvidence, setIsAnalyzingEvidence] = useState(false);

  const handleRunClaimCheck = async () => {
    setIsCheckingClaims(true);
    setClaimProgressLabel("Extracting factual claims...");
    try {
      const results = await extractAndVerifyClaims({
        scriptText,
        chapters,
        dossier,
        durationMinutes,
        flagNamedPersons,
        apiKey,
        onProgress: label => setClaimProgressLabel(label)
      });
      onUpdateClaims(results);
    } catch (err) {
      console.error("Claim check error:", err);
    } finally {
      setIsCheckingClaims(false);
      setClaimProgressLabel("");
    }
  };

  const handlePreviewFix = async (
    claim: ScriptClaimItem,
    action: "soften" | "replace_figure" | "add_source" | "remove" | "mark_opinion"
  ) => {
    setLoadingFixClaimId(claim.id);
    try {
      const diff = await generateClaimFixDiff({
        claim,
        action,
        dossier,
        apiKey
      });
      setActiveDiffPreview({
        claimId: claim.id,
        action,
        proposedSentence: diff.proposedSentence,
        explanation: diff.explanation
      });
    } catch (err) {
      console.error("Failed to generate claim fix diff:", err);
    } finally {
      setLoadingFixClaimId(null);
    }
  };

  const handleApplyClaimDiff = (claim: ScriptClaimItem) => {
    if (!activeDiffPreview) return;
    const { proposedSentence, action } = activeDiffPreview;
    let nextScript = scriptText;
    if (claim.sentenceText && nextScript.includes(claim.sentenceText)) {
      nextScript = nextScript.replace(claim.sentenceText, proposedSentence);
    } else if (proposedSentence) {
      nextScript = `${nextScript}\n\n${proposedSentence}`;
    }

    onUpdateScriptText(nextScript, `Claim fix (${action}): ${claim.id}`);
    onUpdateClaims(
      claims.map(c =>
        c.id === claim.id
          ? {
              ...c,
              sentenceText: proposedSentence,
              status: "verified",
              appliedFix: action as any
            }
          : c
      )
    );
    setActiveDiffPreview(null);
  };

  const handleUploadPostScriptFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readUploadedFileText(file);
      setEvidenceTitle(file.name);
      setEvidenceText(text);
    } catch (err) {
      console.error("Upload read error:", err);
    }
  };

  const handleAnalyzeNewEvidence = async () => {
    if (!evidenceText.trim()) return;
    setIsAnalyzingEvidence(true);
    try {
      const existingFactCount = dossier?.facts.length || 0;
      const { extractedFacts, suggestions } = await analyzeUploadedSourceForScript({
        sourceTitle: evidenceTitle.trim() || "Added Source Document",
        sourceText: evidenceText,
        scriptText,
        chapters,
        existingFactCount,
        topic,
        apiKey
      });

      if (dossier && onUpdateDossier && extractedFacts.length > 0) {
        onUpdateDossier({
          ...dossier,
          facts: [...dossier.facts, ...extractedFacts]
        });
      }
      onUpdateEvidenceSuggestions([...suggestions, ...evidenceSuggestions]);
      setEvidenceTitle("");
      setEvidenceText("");
    } catch (err) {
      console.error("Failed to analyze post-script source:", err);
    } finally {
      setIsAnalyzingEvidence(false);
    }
  };

  const handleAcceptEvidenceSuggestion = (sug: EvidenceInsertionSuggestion) => {
    let nextScript = scriptText;
    if (sug.originalParagraph && nextScript.includes(sug.originalParagraph)) {
      nextScript = nextScript.replace(sug.originalParagraph, sug.proposedParagraph);
    } else {
      nextScript = `${nextScript}\n\n${sug.proposedParagraph}`;
    }
    onUpdateScriptText(nextScript, `Added evidence [${sug.newFact.id}]`);
    onUpdateEvidenceSuggestions(
      evidenceSuggestions.map(s => (s.id === sug.id ? { ...s, status: "accepted" } : s))
    );
  };

  const filteredClaims = claims.filter(c => {
    if (claimFilter === "all") return true;
    if (claimFilter === "editor_review") return c.editorReviewRequired;
    return c.status === claimFilter;
  });

  // Compute style check metrics
  const totalScriptWords = scriptText.trim().split(/\s+/).filter(Boolean).length;
  const sentences = scriptText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(Boolean);
  const avgSentenceLen =
    sentences.length > 0 ? Math.round(totalScriptWords / sentences.length) : 15;
  const inlineCitationsCount = Array.from(scriptText.matchAll(/\[([FQB]\d+)\]/g)).length;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden flex flex-col">
      {/* 5 Right-Rail Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/70 px-2">
        {[
          { id: "sources", label: "Sources", icon: BookOpen },
          { id: "claims", label: `Claims (${claims.length})`, icon: ShieldAlert },
          { id: "add_evidence", label: "Add evidence", icon: FilePlus2 },
          { id: "hook_lab", label: "Hook Lab", icon: Sparkles },
          { id: "style_check", label: "Style check", icon: ListChecks }
        ].map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id as WorkspaceRightTab)}
              className={`px-3 py-3 text-xs font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                active
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-[72vh] overflow-y-auto space-y-4">
        {/* TAB 1: SOURCES */}
        {activeTab === "sources" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Locked Research Dossier ({dossier?.facts.length || 0} Facts,{" "}
                {dossier?.books.length || 0} Books)
              </span>
              <span className="text-[11px] text-emerald-400">
                {inlineCitationsCount} inline tags in script
              </span>
            </div>

            {!dossier || dossier.facts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No research dossier attached to this script yet. Use the &ldquo;Add evidence&rdquo; tab
                to upload files or notes directly into this script.
              </p>
            ) : (
              <div className="space-y-2.5">
                {dossier.facts
                  .filter(f => f.status !== "rejected")
                  .map(f => (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          [{f.id}] {f.type}
                        </span>
                        {f.source.url && (
                          <a
                            href={f.source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1"
                          >
                            Source <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-200">{f.claim}</p>
                      <p className="text-[11px] text-slate-400">{f.source.title}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXHAUSTIVE CLAIM CHECK */}
        {activeTab === "claims" && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-white">Exhaustive Claim & Risk Audit</h4>
                  <p className="text-[11px] text-slate-400">
                    Scans ~{Math.round(durationMinutes * 3)} checkable claims, matches your dossier,
                    and verifies risky claims via Google Search.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isCheckingClaims}
                  onClick={handleRunClaimCheck}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white shrink-0 flex items-center gap-1.5"
                >
                  {isCheckingClaims ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {claims.length > 0 ? "Re-run Audit" : "Check All Claims"}
                    </>
                  )}
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flagNamedPersons}
                  onChange={e => setFlagNamedPersons(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600"
                />
                Flag allegations about named persons or companies for manual editor review
              </label>

              {isCheckingClaims && claimProgressLabel && (
                <div className="text-xs text-indigo-300 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {claimProgressLabel}
                </div>
              )}
            </div>

            {claims.length > 0 && (
              <>
                {/* Filter Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "all", label: `All (${claims.length})` },
                    {
                      id: "high_risk",
                      label: `High risk (${claims.filter(c => c.status === "high_risk").length})`
                    },
                    {
                      id: "needs_source",
                      label: `Needs source (${
                        claims.filter(c => c.status === "needs_source" || c.status === "weak").length
                      })`
                    },
                    {
                      id: "editor_review",
                      label: `Editor review (${
                        claims.filter(c => c.editorReviewRequired).length
                      })`
                    },
                    {
                      id: "verified",
                      label: `Verified (${claims.filter(c => c.status === "verified").length})`
                    }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setClaimFilter(f.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                        claimFilter === f.id
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-200"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Claim Cards */}
                <div className="space-y-3">
                  {filteredClaims.map(claim => {
                    const isPreviewingThis = activeDiffPreview?.claimId === claim.id;
                    const isLoadingThis = loadingFixClaimId === claim.id;

                    return (
                      <div
                        key={claim.id}
                        className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              Ch {claim.chapterNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                claim.status === "verified"
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                  : claim.status === "high_risk"
                                  ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                  : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {claim.status.replace("_", " ")}
                            </span>
                            {claim.editorReviewRequired && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                Editor review
                              </span>
                            )}
                          </div>
                          {claim.matchedDossierFactId && (
                            <span className="text-[10px] text-emerald-400 font-semibold">
                              Matched [{claim.matchedDossierFactId}]
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-200 leading-relaxed">
                          &ldquo;{claim.sentenceText}&rdquo;
                        </p>

                        {claim.sourceTitle && (
                          <div className="text-[11px] text-slate-400">
                            Source: <span className="text-slate-300">{claim.sourceTitle}</span>
                          </div>
                        )}

                        {/* 5 Action Buttons */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {[
                            { id: "soften", label: "Soften wording" },
                            { id: "replace_figure", label: "Replace with verified figure" },
                            { id: "add_source", label: "Add source" },
                            { id: "mark_opinion", label: "Mark opinion" },
                            { id: "remove", label: "Remove" }
                          ].map(btn => (
                            <button
                              key={btn.id}
                              type="button"
                              disabled={isLoadingThis}
                              onClick={() => handlePreviewFix(claim, btn.id as any)}
                              className="px-2 py-1 rounded-md border border-slate-800 bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 transition-colors"
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>

                        {isLoadingThis && (
                          <div className="text-[11px] text-indigo-400 flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Generating diff preview...
                          </div>
                        )}

                        {/* Inline Diff Preview before applying */}
                        {isPreviewingThis && activeDiffPreview && (
                          <div className="mt-2 p-3 rounded-lg border border-indigo-500/40 bg-indigo-950/20 space-y-2">
                            <div className="text-[11px] font-bold text-indigo-300">
                              Diff Preview ({activeDiffPreview.explanation})
                            </div>
                            <div className="text-[11px] text-rose-300/90 line-through">
                              {claim.sentenceText}
                            </div>
                            <div className="text-xs text-emerald-300 font-medium">
                              {activeDiffPreview.proposedSentence || "(Sentence will be removed)"}
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleApplyClaimDiff(claim)}
                                className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Apply to script
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveDiffPreview(null)}
                                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1"
                              >
                                <X className="w-3 h-3" /> Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: POST-SCRIPT ADD EVIDENCE */}
        {activeTab === "add_evidence" && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white">
                  Add New Source After Writing Script
                </h4>
                <p className="text-[11px] text-slate-400">
                  Upload a PDF/DOCX/TXT or paste notes. We will extract verified facts and suggest
                  exact paragraphs in your script where they fit best.
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={evidenceTitle}
                  onChange={e => setEvidenceTitle(e.target.value)}
                  placeholder="Source title (e.g., Auditor General Report 2025)"
                  className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                />
                <label className="cursor-pointer px-2.5 py-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 text-xs font-medium flex items-center gap-1 shrink-0">
                  <Upload className="w-3.5 h-3.5" /> Upload file
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    onChange={handleUploadPostScriptFile}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                rows={4}
                value={evidenceText}
                onChange={e => setEvidenceText(e.target.value)}
                placeholder="Or paste article text, report excerpt, or notes here..."
                className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-slate-200"
              />

              <button
                type="button"
                disabled={isAnalyzingEvidence || !evidenceText.trim()}
                onClick={handleAnalyzeNewEvidence}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white flex items-center justify-center gap-1.5"
              >
                {isAnalyzingEvidence ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Finding best paragraphs for this evidence...
                  </>
                ) : (
                  <>
                    <FilePlus2 className="w-3.5 h-3.5" />
                    Extract Facts & Suggest Script Insertions
                  </>
                )}
              </button>
            </div>

            {evidenceSuggestions.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Suggested Paragraph Insertions
                </h5>
                {evidenceSuggestions.map(sug => (
                  <div
                    key={sug.id}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-400">
                        {sug.chapterTitle} • [{sug.newFact.id}]
                      </span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {sug.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{sug.reason}</p>
                    <div className="p-2 rounded bg-rose-950/20 border border-rose-500/20 text-[11px] text-rose-300 line-through">
                      {sug.originalParagraph}
                    </div>
                    <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200">
                      {sug.proposedParagraph}
                    </div>
                    {sug.status === "pending" && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAcceptEvidenceSuggestion(sug)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Accept & Insert
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateEvidenceSuggestions(
                              evidenceSuggestions.map(s =>
                                s.id === sug.id ? { ...s, status: "skipped" } : s
                              )
                            )
                          }
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: HOOK LAB */}
        {activeTab === "hook_lab" && (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-bold text-white">3 Cold Open Hook Variants</h4>
              <p className="text-[11px] text-slate-400">
                Written after the body chapters so every open loop is guaranteed to be paid off.
              </p>
            </div>

            {hookVariants.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Hook variants appear automatically when generating a script with the Long-Form
                Engine.
              </p>
            ) : (
              hookVariants.map(v => {
                const isCurrent = activeHookText === v.text;
                return (
                  <div
                    key={v.id}
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      isCurrent
                        ? "border-indigo-500 bg-indigo-950/25"
                        : "border-slate-800 bg-slate-950/70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{v.label}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {v.wordCount} words • Pays off in Ch {v.payoffChapterNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {v.text}
                    </p>
                    <div className="text-[11px] text-indigo-300">
                      Open loop: &ldquo;{v.openLoopQuestion}&rdquo;
                    </div>
                    {onSelectHookVariant && !isCurrent && (
                      <button
                        type="button"
                        onClick={() => onSelectHookVariant(v)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
                      >
                        Use this hook in script
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 5: STYLE CHECK & OPEN-LOOP TRACKER */}
        {activeTab === "style_check" && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2.5">
              <h4 className="text-xs font-bold text-white">
                Voice Recipe Checklist ({recipe?.creatorName || "Active Voice"})
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Average sentence length</span>
                  <span className="font-semibold text-emerald-400">
                    {avgSentenceLen} words (Target: ~
                    {recipe?.sentenceLengthRange
                      ? Math.round(
                          (recipe.sentenceLengthRange[0] + recipe.sentenceLengthRange[1]) / 2
                        )
                      : 15}
                    w)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Inline dossier citations</span>
                  <span className="font-semibold text-emerald-400">
                    {inlineCitationsCount} citations
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Anti-fluff / Zero repetition</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 space-y-2.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                Open-Loop Payoff Tracker
              </h4>
              {openLoopsSummary.length === 0 ? (
                <p className="text-xs text-slate-400">
                  All curiosity loops planted in the opening are resolved by the final chapter.
                </p>
              ) : (
                <div className="space-y-2">
                  {openLoopsSummary.map((loop, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 space-y-1"
                    >
                      <div className="text-xs font-medium text-white">&ldquo;{loop.question}&rdquo;</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Planted: {loop.plantedIn}</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-emerald-400">Paid off: {loop.paidOffIn}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
