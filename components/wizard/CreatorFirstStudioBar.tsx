import React, { useState, useMemo, useEffect } from "react";
import {
  Sparkles,
  User,
  Combine,
  BookOpen,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Loader2,
  Play,
  Plus,
  Zap,
  Layers,
  Info,
  X
} from "lucide-react";
import {
  GeneratorConfig,
  Dossier,
  ResearchConfig,
  MySourcesState,
  ChapterOutlineItem,
  WrittenChapterResult,
  ScriptData
} from "../../types";
import {
  TOPIC_NICHES,
  TopicNiche,
  VoiceSelectionState
} from "../../creator-recipes/types";
import { getAllCreatorRecipes } from "../../creator-recipes";
import {
  resolveRecipe,
  describeRecipe,
  matchCreators
} from "../../creator-recipes/resolve";
import {
  resolveResearchStyle,
  describeResearchStyle
} from "../../creator-research";
import {
  runResearchPipeline,
  toLegacyDossier
} from "../../services/researchEngine";
import {
  buildWriterBrief,
  computeResearchUsedReport
} from "../../services/writerBrief";
import {
  computeBudget,
  FORMAT_DURATION_PRESETS,
  FORMAT_DEFAULT_DEPTH,
  ScriptFormatType
} from "../../services/budget";
import {
  parseDurationToMinutes,
  formatMinutesToDurationLabel
} from "../../services/researchTargets";
import { ResearchStep } from "../research/ResearchStep";
import { DossierReview } from "../research/DossierReview";
import {
  runResearch,
  findMoreLikeCard,
  runChapterGapFill,
  ResearchProgressUpdate
} from "../../services/researchService";
import {
  buildOutline,
  writeChapter,
  writeHook,
  stitchChapters,
  buildProductionScript
} from "../../services/longFormService";
import { generateBeatPlan, runScriptQAPass } from "../../services/scriptService";
import { LibraryModal } from "../LibraryModal";

interface CreatorFirstStudioBarProps {
  config: GeneratorConfig;
  setConfig: React.Dispatch<React.SetStateAction<GeneratorConfig>>;
  apiKey?: string;
  onQuickCreate: () => void;
  onCompleteLongFormScript: (scriptData: ScriptData) => void;
  isGenerating: boolean;
}

export const CreatorFirstStudioBar: React.FC<CreatorFirstStudioBarProps> = ({
  config,
  setConfig,
  apiKey,
  onQuickCreate,
  onCompleteLongFormScript,
  isGenerating
}) => {
  const [lane, setLane] = useState<"studio" | "quick">(config.laneMode || "studio");
  const [activeStudioTab, setActiveStudioTab] = useState<
    "voice" | "format_budget" | "research" | "outline_script"
  >("voice");
  const [showVoiceDrawer, setShowVoiceDrawer] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);

  // Voice Selection State
  const [voiceSelection, setVoiceSelection] = useState<VoiceSelectionState>(() => ({
    mode:
      config.writingMode === "blend"
        ? "blend"
        : config.writingMode === "auto"
        ? "auto"
        : "pick",
    pickedCreatorId: config.selectedStyleId || "raftar",
    blend: {
      creatorIds: [
        config.blendConfig?.primaryCreatorId || "dhruv-rathee",
        config.blendConfig?.secondaryCreatorIds?.[0] || "raftar"
      ],
      hookCreatorId: config.blendConfig?.primaryCreatorId || "dhruv-rathee",
      structureCreatorId: config.blendConfig?.secondaryCreatorIds?.[0] || "raftar",
      toneCreatorId: config.blendConfig?.primaryCreatorId || "thynkwhy"
    }
  }));

  const [selectedNiche, setSelectedNiche] = useState<TopicNiche>(
    (config.selectedNiche as TopicNiche) || "Politics & governance"
  );
  const [videoFormat, setVideoFormat] = useState<"Documentary" | "Explainer" | "Short">(
    config.videoFormatMode || "Documentary"
  );
  const formatKey: ScriptFormatType = videoFormat.toLowerCase() as ScriptFormatType;

  const [durationMinutes, setDurationMinutes] = useState<number>(() =>
    config.durationMinutes || parseDurationToMinutes(config.duration || "15 Minutes")
  );
  const [outputMode, setOutputMode] = useState<"voiceover_only" | "voiceover_and_production">(
    config.outputScriptMode || "voiceover_and_production"
  );

  // Research Plan State
  const [researchConfig, setResearchConfig] = useState<ResearchConfig>(() => ({
    depth: FORMAT_DEFAULT_DEPTH[formatKey] || "deep",
    region: config.researchV2Config?.region || "Pakistan",
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

  // Step 5: Chapter Outline & Script State
  const [outline, setOutline] = useState<ChapterOutlineItem[]>(
    () => config.chapterOutline || []
  );
  const [isBuildingOutline, setIsBuildingOutline] = useState(false);
  const [fillingGapChapterId, setFillingGapChapterId] = useState<string | null>(null);
  const [isWritingChapters, setIsWritingChapters] = useState(false);
  const [chapterWriteStatus, setChapterWriteStatus] = useState<string>("");
  const [chapterWritePercent, setChapterWritePercent] = useState<number>(0);

  const allRecipes = useMemo(() => getAllCreatorRecipes(), [showLibraryModal]);
  const budget = useMemo(() => computeBudget(durationMinutes, 140), [durationMinutes]);

  const topicText = (config.shortTopic || config.topicOrScript || "").trim();
  const angleText = (config.targetCriteria || "").trim();

  // Auto-match top 3 creators deterministically
  const matchResult = useMemo(() => {
    return matchCreators({
      niche: selectedNiche,
      topic: `${topicText} ${angleText}`,
      region: researchConfig.region,
      language: config.language || "Roman Urdu",
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
    if (voiceSelection.mode === "auto" && autoMatches.length > 0) {
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
    () => config.extraWriterInstructions || ""
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
    scopeMode?: "local" | "global" | "both";
    scope?: "ground" | "abroad" | "both";
    togglesLevel?: Record<string, 0 | 0.5 | 1 | 1.5>;
    customQuestions?: string[];
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
        researchConfig.depth === "quick" ||
        researchConfig.depth === "standard" ||
        researchConfig.depth === "deep"
          ? researchConfig.depth
          : "standard";

      const effectiveScope =
        extraOptions?.scope ||
        (extraOptions?.scopeMode === "local"
          ? "ground"
          : extraOptions?.scopeMode === "global"
          ? "abroad"
          : activeResearchStyle.defaultScope);

      const pipelineResult = await runResearchPipeline({
        topic: topicText || "Investigative Documentary Topic",
        brief: angleText || topicText,
        angles: angleText ? [angleText] : [],
        minutes: durationMinutes,
        format: videoFormat,
        depth: effectiveDepth,
        scope: effectiveScope,
        style: activeResearchStyle,
        questions:
          extraOptions?.customQuestions && extraOptions.customQuestions.length > 0
            ? extraOptions.customQuestions
            : activeResearchStyle.questionSet,
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
        narrationLanguage: config.language || "Roman Urdu",
        region: researchConfig.region || "Pakistan",
        apiKey,
        onProgress: p =>
          setResearchProgress({
            stage: "collecting",
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
        topic: topicText || "Investigative Documentary Topic",
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
          questions: extraOptions?.customQuestions,
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
      console.error("Research pipeline fallback:", err);
      try {
        const fallbackDossier = await runResearch({
          topic: topicText || "Investigative Documentary Topic",
          angle: angleText || topicText,
          durationMinutes,
          language: config.language || "Roman Urdu",
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
        console.error("Fallback research error:", innerErr);
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
      console.error("Find more error:", err);
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
        language: config.language || "Roman Urdu",
        creatorName: resolvedVoice.recipe.creatorName,
        apiKey
      });
      const lockedDossier: Dossier = {
        ...dossier,
        lockedAt: new Date().toISOString()
      };
      setDossier(lockedDossier);

      const generatedOutline = await buildOutline({
        topic: topicText || dossier.topic,
        angle: angleText || dossier.angle,
        language: config.language || "Roman Urdu",
        recipe: resolvedVoice.recipe,
        dossier: lockedDossier,
        budget,
        apiKey
      });
      setOutline(generatedOutline);
      setConfig(prev => ({
        ...prev,
        dossier: lockedDossier,
        beatPlan,
        chapterOutline: generatedOutline
      }));
      setActiveStudioTab("outline_script");
    } catch (err) {
      console.error("Outline build error:", err);
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
      console.error("Chapter gap fill error:", err);
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
        setChapterWriteStatus("Building chapter outline & assigning facts...");
        activeOutline = await buildOutline({
          topic: topicText || dossier.topic,
          angle: angleText || dossier.angle,
          language: config.language || "Roman Urdu",
          recipe: resolvedVoice.recipe,
          dossier,
          budget,
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
        .join("\n")}${
        extraWriterInstructions.trim()
          ? `\n\nEXTRA USER INSTRUCTIONS:\n${extraWriterInstructions.trim()}`
          : ""
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
          language: config.language || "Roman Urdu",
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
        "Writing Cold Open Hook Variants (using finished chapter summaries so every promise is paid off)..."
      );

      const hookData = await writeHook({
        topic: topicText || dossier.topic,
        angle: angleText || dossier.angle,
        language: config.language || "Roman Urdu",
        recipe: resolvedVoice.recipe,
        chapterResults: writtenChapters,
        dossier,
        apiKey
      });

      setChapterWritePercent(90);
      setChapterWriteStatus("Stitching chapters & checking length, citations, and open loops...");

      const stitched = stitchChapters({
        hookText: hookData.activeHookText,
        hookVariants: hookData.variants,
        chapterResults: writtenChapters,
        outline: activeOutline
      });

      let productionRows = undefined;
      if (outputMode === "voiceover_and_production") {
        setChapterWritePercent(95);
        setChapterWriteStatus(
          "Building ~2.3x Production Script table (B-roll, visuals, on-screen text)..."
        );
        productionRows = await buildProductionScript({
          topic: topicText || dossier.topic,
          language: config.language || "Roman Urdu",
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
          visual: "Cold Open Hook — High-contrast documentary opening frame",
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
        title: topicText || dossier.topic || "Investigative Documentary",
        detectedIntent: activeResearchStyle.intent,
        targetAudience: activeResearchStyle.audience,
        segments,
        ctas: [
          `${writtenChapters[writtenChapters.length - 1]?.summary2Lines || ""} (${summaryLine})`
        ],
        createdAt: new Date().toISOString(),
        creatorId: resolvedVoice.recipe.creatorId.replace("custom-", ""),
        creatorName: resolvedVoice.recipe.creatorName,
        creatorStyle: activeResearchStyle.displayName,
        language: config.language || "Roman Urdu",
        duration: formatMinutesToDurationLabel(durationMinutes),
        type: config.platform || "YouTube Long Form",
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
      setChapterWriteStatus("Complete! Opening Script Workspace...");
      onCompleteLongFormScript(finalScriptData);
    } catch (err) {
      console.error("Long-form script writer error:", err);
    } finally {
      setIsWritingChapters(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-indigo-500/25 bg-slate-950/90 text-slate-100 shadow-xl overflow-hidden">
      {/* Top Bar: Quick Lane vs Studio Lane Toggle + Voice Summary + Library Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setLane("studio");
                setConfig(prev => ({ ...prev, laneMode: "studio" }));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                lane === "studio"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Studio Lane (5-Step Documentary &amp; Research)
            </button>
            <button
              type="button"
              onClick={() => {
                setLane("quick");
                setConfig(prev => ({ ...prev, laneMode: "quick" }));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                lane === "quick"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Quick Lane (1-Click Fast Script)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowVoiceDrawer(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            How this voice works ({resolvedVoice.recipe.creatorName})
          </button>
          <button
            type="button"
            onClick={() => setShowLibraryModal(true)}
            className="px-3 py-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs font-bold text-indigo-300 flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            My Channel Style &amp; Quotes
          </button>
        </div>
      </div>

      {/* QUICK LANE */}
      {lane === "quick" ? (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Video Topic
              </label>
              <input
                type="text"
                value={config.shortTopic || config.topicOrScript || ""}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    shortTopic: e.target.value,
                    topicOrScript: e.target.value
                  }))
                }
                placeholder="e.g., Why Karachi's infrastructure collapsed despite trillions in budget"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Duration &amp; Budget
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[1, 5, 10, 15, 20, 25].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectMinutes(m)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border ${
                      durationMinutes === m
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="text-xs text-slate-300">
              <span className="font-bold text-indigo-400">Auto-Matched Voice:</span>{" "}
              {autoMatches[0]?.creatorName} — {budget.liveSummaryLine}
            </div>
            <button
              type="button"
              disabled={isGenerating || !topicText}
              onClick={onQuickCreate}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Create Script Now
            </button>
          </div>
        </div>
      ) : (
        /* STUDIO LANE: Creator-First Tabs */
        <div>
          <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-900/40 px-4">
            {[
              { id: "voice", label: "1. Voice & Role Blend", icon: User },
              {
                id: "format_budget",
                label: `2. Niche, Format & Budget (${durationMinutes}m)`,
                icon: Clock
              },
              {
                id: "research",
                label: `3. Research & Sources (${dossier?.facts.length || 0} facts)`,
                icon: BookOpen
              },
              {
                id: "outline_script",
                label: `4. Chapter Outline & Script (${budget.averageChapters} chapters)`,
                icon: FileText
              }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeStudioTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveStudioTab(tab.id as any)}
                  className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-2 transition-colors ${
                    active
                      ? "border-indigo-500 text-indigo-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-5 space-y-5">
            {/* TAB 1: VOICE & ROLE-BASED BLEND */}
            {activeStudioTab === "voice" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: "pick",
                      title: "Pick a creator",
                      desc: "Lock a single creator recipe or your custom My Channel Style."
                    },
                    {
                      id: "blend",
                      title: "Blend 2–3 creators",
                      desc: "Choose which creator drives the Hook, Body structure, and Language & tone."
                    },
                    {
                      id: "auto",
                      title: "Auto-pick",
                      desc: "Scores all creator recipes against your topic, niche, language, and duration."
                    }
                  ].map(card => {
                    const active = voiceSelection.mode === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          setVoiceSelection(prev => ({ ...prev, mode: card.id as any }));
                          setConfig(prev => ({
                            ...prev,
                            writingMode:
                              card.id === "blend"
                                ? "blend"
                                : card.id === "auto"
                                ? "auto"
                                : "manual"
                          }));
                        }}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          active
                            ? "border-indigo-500 bg-indigo-950/30"
                            : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{card.title}</span>
                          {active && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* PICK MODE */}
                {voiceSelection.mode === "pick" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {allRecipes.map(r => {
                      const active = voiceSelection.pickedCreatorId === r.creatorId;
                      return (
                        <button
                          key={r.creatorId}
                          type="button"
                          onClick={() => {
                            setVoiceSelection(prev => ({ ...prev, pickedCreatorId: r.creatorId }));
                            setConfig(prev => ({ ...prev, selectedStyleId: r.creatorId }));
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            active
                              ? "border-indigo-500 bg-indigo-950/30"
                              : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                          }`}
                        >
                          <div className="text-xs font-bold text-white truncate">
                            {r.creatorName}
                          </div>
                          <div className="text-[10px] text-indigo-300 mt-0.5">
                            {r.languages[0] || "Multi-language"}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-1">
                            {r.niches.slice(0, 2).join(" • ")}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* BLEND MODE: Role-Based Dropdowns + 5-Line Blend Preview */}
                {voiceSelection.mode === "blend" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                        Role-Based Creator Blend
                      </h4>
                      {[
                        { key: "hookCreatorId", label: "Hook & Opening from" },
                        { key: "structureCreatorId", label: "Body Chapter Structure & Research from" },
                        { key: "toneCreatorId", label: "Language, Sentence Rhythm & Tone from" }
                      ].map(role => (
                        <div key={role.key}>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            {role.label}
                          </label>
                          <select
                            value={(voiceSelection.blend as any)?.[role.key] || "dhruv-rathee"}
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
                            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                          >
                            {allRecipes.map(r => (
                              <option key={r.creatorId} value={r.creatorId}>
                                {r.creatorName} ({r.languages[0] || "Multi"})
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}

                      {resolvedVoice.languageMismatchWarning && (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{resolvedVoice.languageMismatchWarning}</span>
                          </div>
                          {resolvedVoice.needsNarrationLanguage && (
                            <div>
                              <label className="block text-[11px] font-bold text-amber-200 mb-1">
                                Which language should the final script be in?
                              </label>
                              <select
                                value={voiceSelection.blend.chosenLanguage || config.language || "Roman Urdu"}
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
                                className="w-full rounded-lg border border-amber-500/40 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                              >
                                {resolvedVoice.availableLanguages.map(lang => (
                                  <option key={lang} value={lang}>
                                    {lang}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/15 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                        5-Line Blend Preview Card
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-200">
                        {resolvedVoice.summaryLines.map((line, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-400 font-bold">{idx + 1}.</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* AUTO MODE: Deterministic Top 3 Matches */}
                {voiceSelection.mode === "auto" && (
                  <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/15 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                          Best Voice for This Topic
                        </h4>
                        <p className="text-xs text-slate-400">
                          Scored by Niche + Format + Language + Duration + Topic keywords
                        </p>
                      </div>
                      {autoMatches.length >= 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setVoiceSelection({
                              mode: "blend",
                              pickedCreatorId: autoMatches[0].creatorId,
                              blend: {
                                hookCreatorId: autoMatches[0].creatorId,
                                structureCreatorId: autoMatches[1].creatorId,
                                toneCreatorId: autoMatches[0].creatorId,
                                creatorIds: [autoMatches[0].creatorId, autoMatches[1].creatorId]
                              }
                            })
                          }
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5"
                        >
                          <Combine className="w-3.5 h-3.5" />
                          Blend Top 2 ({autoMatches[0].creatorName} + {autoMatches[1].creatorName})
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {autoMatches.map((m, idx) => (
                        <div
                          key={m.creatorId}
                          className={`p-3 rounded-xl border ${
                            idx === 0
                              ? "border-indigo-500 bg-indigo-950/40"
                              : "border-slate-800 bg-slate-900/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">
                              #{idx + 1} {m.creatorName}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-400">
                              {m.score}% match
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1">{m.whyLine}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: NICHE, FORMAT & LIVE BUDGET */}
            {activeStudioTab === "format_budget" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Topic Niche (Used for Voice Match &amp; Research Source Mix)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {TOPIC_NICHES.map(niche => (
                      <button
                        key={niche}
                        type="button"
                        onClick={() => {
                          setSelectedNiche(niche);
                          setConfig(prev => ({ ...prev, selectedNiche: niche }));
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          selectedNiche === niche
                            ? "bg-indigo-600/25 border-indigo-500 text-indigo-200 font-bold"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {niche}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Format
                    </label>
                    <div className="flex gap-1.5">
                      {(["Documentary", "Explainer", "Short"] as const).map(fmt => {
                        const fmtLower = fmt.toLowerCase() as ScriptFormatType;
                        return (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => {
                              setVideoFormat(fmt);
                              const presetMins = FORMAT_DURATION_PRESETS[fmtLower][1] || 15;
                              handleSelectMinutes(presetMins);
                              setResearchConfig(prev => ({
                                ...prev,
                                depth: FORMAT_DEFAULT_DEPTH[fmtLower]
                              }));
                              setConfig(prev => ({ ...prev, videoFormatMode: fmt }));
                            }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                              videoFormat === fmt
                                ? "bg-indigo-600 border-indigo-500 text-white"
                                : "bg-slate-900 border-slate-800 text-slate-400"
                            }`}
                          >
                            {fmt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Duration Presets (Minutes)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {FORMAT_DURATION_PRESETS[formatKey].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => handleSelectMinutes(mins)}
                          className={`px-3 py-2 rounded-lg text-xs font-bold border ${
                            durationMinutes === mins
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {mins} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Output Mode
                    </label>
                    <select
                      value={outputMode}
                      onChange={e => {
                        const next = e.target.value as any;
                        setOutputMode(next);
                        setConfig(prev => ({ ...prev, outputScriptMode: next }));
                      }}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                    >
                      <option value="voiceover_and_production">
                        Voiceover + Production Script (~2.3x words)
                      </option>
                      <option value="voiceover_only">Voiceover Narration Only</option>
                    </select>
                  </div>
                </div>

                {/* Live Budget Banner */}
                <div className="p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-950/20 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-indigo-200">
                    {budget.liveSummaryLine}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveStudioTab("research")}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
                  >
                    Continue to Step 3: Research &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: RESEARCH PLAN & REVIEW */}
            {activeStudioTab === "research" && (
              <div className="space-y-5">
                <ResearchStep
                  topic={topicText || "Documentary Investigation"}
                  durationMinutes={durationMinutes}
                  onDurationChange={handleSelectMinutes}
                  config={researchConfig}
                  onConfigChange={setResearchConfig}
                  mySources={mySources}
                  onMySourcesChange={setMySources}
                  onRunResearch={handleRunResearch}
                  onSkipToScript={() => setActiveStudioTab("outline_script")}
                  isResearching={isResearching}
                  progress={researchProgress}
                  hasExistingDossier={Boolean(dossier)}
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
                    researchStyle={activeResearchStyle}
                    apiKey={apiKey}
                  />
                )}
              </div>
            )}

            {/* TAB 4: BEFORE WE WRITE CHECKLIST + CHAPTER OUTLINE & SEQUENTIAL SCRIPT */}
            {activeStudioTab === "outline_script" && (
              <div className="space-y-4">
                {/* Editable 8-Line "Before we write" Checklist Card */}
                <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Before we write (Editable 8-line checklist)
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {activeResearchStyle.displayName}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {editableBriefLines.map((line, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-indigo-400 w-4">
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
                          className="flex-1 rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="block text-xs font-bold text-indigo-300 mb-1">
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
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Long-Form Chapter Outline &amp; Sequential Script Writer
                    </h3>
                    <p className="text-xs text-slate-400">
                      Each chapter is written in its own pass with assigned facts ([F12]),
                      Story-So-Far continuity, and anti-repetition checks.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isBuildingOutline || !dossier}
                      onClick={handleLockDossierAndBuildOutline}
                      className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                    >
                      {isBuildingOutline ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Layers className="w-3.5 h-3.5" />
                      )}
                      {outline.length > 0 ? "Rebuild Outline" : "Build Chapter Outline"}
                    </button>

                    <button
                      type="button"
                      disabled={isWritingChapters || !dossier}
                      onClick={handleWriteFullLongFormDocumentary}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      {isWritingChapters ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Writing Chapters...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Write Full {durationMinutes}-Min Script (
                          {budget.voiceoverWords.toLocaleString()} words)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {!dossier && (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 flex items-center justify-between">
                    <span>
                      Run Step 3 (Research &amp; Sources) first so every chapter has verified facts,
                      quotes, and books assigned to it.
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveStudioTab("research")}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 font-bold text-amber-100"
                    >
                      Go to Step 3: Research
                    </button>
                  </div>
                )}

                {isWritingChapters && (
                  <div className="p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/30 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-200">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        {chapterWriteStatus}
                      </span>
                      <span>{chapterWritePercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${chapterWritePercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {researchUsedSummary && (
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                      <span>
                        Research used: {researchUsedSummary.usedCount} of{" "}
                        {researchUsedSummary.totalApprovedCount} approved facts cited in script
                      </span>
                      <span>
                        {researchUsedSummary.unusedFacts.length} unused
                      </span>
                    </div>
                    {researchUsedSummary.unusedFacts.length > 0 && (
                      <div className="text-[11px] text-slate-300 space-y-1 pt-1 border-t border-emerald-500/20">
                        <div className="font-semibold text-slate-400">
                          Approved facts not yet used:
                        </div>
                        {researchUsedSummary.unusedFacts.slice(0, 5).map(u => (
                          <div key={u.id}>
                            <strong className="font-mono text-indigo-300">[{u.id}]</strong>{" "}
                            {u.claim}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {outline.length > 0 && (
                  <div className="space-y-2.5">
                    {outline.map((chap, idx) => (
                      <div
                        key={chap.id}
                        className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
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
                              className="flex-1 bg-transparent border-b border-transparent focus:border-indigo-500 text-xs font-bold text-white focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">
                              Target: <strong className="text-slate-200">{chap.targetWords}w</strong>{" "}
                              ({chap.weightPct}%)
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300">
                              {chap.assignedFactIds.length} facts
                            </span>
                            <button
                              type="button"
                              onClick={() => handleMoveChapter(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-400"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveChapter(idx, 1)}
                              disabled={idx === outline.length - 1}
                              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 text-slate-400"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
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
                          className="w-full bg-slate-950/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 border border-slate-800/80"
                        />

                        {chap.gapWarning && (
                          <div className="flex items-center justify-between gap-2 pt-1 text-xs text-amber-300">
                            <span className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              {chap.gapWarning}
                            </span>
                            <button
                              type="button"
                              disabled={fillingGapChapterId === chap.id}
                              onClick={() => handleFillChapterGap(chap)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[11px] font-bold text-amber-200 flex items-center gap-1 shrink-0"
                            >
                              {fillingGapChapterId === chap.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="w-3 h-3" />
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
            )}
          </div>
        </div>
      )}

      {/* HOW THIS VOICE WORKS DRAWER */}
      {showVoiceDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  {resolvedVoice.recipe.creatorName}
                </h3>
                <p className="text-xs text-indigo-400">How this voice &amp; research style works</p>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceDrawer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                Voice &amp; Structure
              </div>
              {voiceDescriptionLines.map((line, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300"
                >
                  {line}
                </div>
              ))}

              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 pt-2">
                Research Plan ({activeResearchStyle.displayName})
              </div>
              {researchStyleLines.map((line, i) => (
                <div
                  key={`res-${i}`}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300"
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LIBRARY & MY CHANNEL STYLE MODAL */}
      <LibraryModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        apiKey={apiKey}
        onSelectVoiceRecipe={recipeId => {
          setVoiceSelection(prev => ({
            ...prev,
            mode: "pick",
            pickedCreatorId: recipeId
          }));
        }}
      />
    </div>
  );
};
