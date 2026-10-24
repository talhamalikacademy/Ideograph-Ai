import React, { useState, useEffect } from 'react';
import ScriptEditor from './components/ScriptEditor';
import BoostPanel from './components/BoostPanel';
import CreationForm from './components/CreationForm';
import SettingsModal from './components/SettingsModal';
import HistoryModal from './components/HistoryModal';
import TemplateGrid from './components/TemplateGrid';
import ScriptGenerationLoader from './components/ScriptGenerationLoader';
import ShortsClipperStudio from './components/ShortsClipperStudio';
import DevilsAdvocateLab from './components/DevilsAdvocateLab';
import { CREATORS, TEMPLATES } from './constants';
import { ScriptData, AnalysisData, AppState, SavedScript, GeneratorConfig, Template } from './types';
import { Zap, ChevronLeft, History, Settings, PenTool, AlertTriangle, X, Scissors, Scale, FileText, Wand2, LayoutGrid } from 'lucide-react';
import { generateScriptWithGemini, analyzeScriptWithGemini, extendScriptWithGemini, enhanceScriptWithGemini } from './services/geminiService';
import { resolveApiKey, getStoredApiKey, saveStoredApiKey } from './services/apiKey';
import { saveScriptToHistory, getHistory, deleteScriptFromHistory, incrementDailyUsage } from './services/storageService';
import clsx from 'clsx';

const THEME_STORAGE_KEY = 'ideograph.theme.v2';

const getInitialDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
  } catch {
    // ignore storage errors
  }
  return false;
};

const App: React.FC = () => {
  const [script, setScript] = useState<ScriptData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [isExtending, setIsExtending] = useState(false);
  const [isApplyingBoostFixes, setIsApplyingBoostFixes] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [storageBanner, setStorageBanner] = useState<string | null>(null);
  const [genProgress, setGenProgress] = useState<{
    step: number;
    label: string;
    percent: number;
    complete: boolean;
  }>({ step: 0, label: '', percent: 0, complete: false });
  
  // View State
  const [view, setView] = useState<'create' | 'history' | 'templates' | 'clipper' | 'devilsAdvocate'>('create');
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [isStudioNavHovered, setIsStudioNavHovered] = useState(false);
  const [searchQuery] = useState(''); 

  // Settings & Theme (B-28: persisted in localStorage, defaults to system preference)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialDarkMode);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKeyState] = useState<string>(getStoredApiKey);
  const [customPrompt, setCustomPromptState] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return window.localStorage.getItem('ideograph.customPrompt') || '';
    } catch {
      return '';
    }
  });

  const setApiKey = (nextKey: string) => {
    setApiKeyState(nextKey);
    saveStoredApiKey(nextKey);
  };

  const setCustomPrompt = (nextPrompt: string) => {
    setCustomPromptState(nextPrompt);
    try {
      if (nextPrompt.trim()) {
        window.localStorage.setItem('ideograph.customPrompt', nextPrompt);
      } else {
        window.localStorage.removeItem('ideograph.customPrompt');
      }
    } catch {
      // ignore storage errors
    }
  };

  // Modals
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState<SavedScript[]>([]);

  // Unified Config State
  const [generatorConfig, setGeneratorConfig] = useState<GeneratorConfig>({
    topicOrScript: '',
    shortTopic: '',
    targetCriteria: '',
    duration: '60 Seconds (Shorts)',
    language: 'English',
    expertise: 'Beginner',
    platform: 'YouTube Shorts',
    rewriteAggressiveness: 'Medium',
    transformationType: 'Full Rewrite',
    writingMode: 'manual',
    selectedStyleId: CREATORS[0].id,
    blendConfig: {
        primaryCreatorId: CREATORS[0].id,
        secondaryCreatorIds: []
    },
    researchConfig: {
      depth: 'deep_agency',
      mode: 'full_agency_harvester',
      region: 'India',
      sources: {
        booksAndHistoricalParables: true,
        localPakistaniAndRegionalData: true,
        redditAndCitizenGroundVoices: true,
        globalStudiesAndCounterArguments: true
      }
    }
  });

  const [showBoost, setShowBoost] = useState(false);

  // Derived Selected Creator (For Manual Mode, or Primary Blend, or Placeholder for Auto)
  const selectedCreator = CREATORS.find(c => c.id === generatorConfig.selectedStyleId) || CREATORS[0];

  // Active Creator for current script (preserves Auto-chosen creator instead of falling back to CREATORS[0])
  const activeScriptCreator =
    (script?.creatorId &&
      CREATORS.find(c => c.id === script.creatorId || c.bio.id === script.creatorId)) ||
    selectedCreator;

  // Apply Dark Mode Class & listen to system preference if user hasn't explicitly chosen (B-28)
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      try {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
          setIsDarkMode(e.matches);
        }
      } catch {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleToggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
      } catch {
        // ignore quota error
      }
      return next;
    });
  };

  // Listen for storage quota warnings (B-11)
  useEffect(() => {
    const onStorageWarning = (e: Event) => {
      const custom = e as CustomEvent<{ message?: string }>;
      if (custom.detail?.message) {
        setStorageBanner(custom.detail.message);
      }
    };
    window.addEventListener('ideograph:storage-warning', onStorageWarning);
    return () => window.removeEventListener('ideograph:storage-warning', onStorageWarning);
  }, []);

  // Load History
  useEffect(() => {
    setHistory(getHistory());
  }, [showHistoryModal]); 

  // Always reset scroll position to top when switching views, app states, or scripts
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const scrollToTop = () => {
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
    scrollToTop();
    const rafId = window.requestAnimationFrame(scrollToTop);
    return () => window.cancelAnimationFrame(rafId);
  }, [view, appState, script?.id]);

  // Script Sync Handler
  const handleScriptUpdate = (updatedScript: ScriptData) => {
      const targetCreator =
        (updatedScript.creatorId &&
          CREATORS.find(c => c.id === updatedScript.creatorId || c.bio.id === updatedScript.creatorId)) ||
        activeScriptCreator;
      setScript(updatedScript);
      saveScriptToHistory(updatedScript, targetCreator, analysis || undefined);
      setHistory(getHistory());
  };

  // Direct Script Generation Handler (Free & Unlimited for all creators and languages)
  const handleGenerateScript = async () => {
    setErrorBanner(null);

    try {
      resolveApiKey(apiKey);
    } catch (keyErr: any) {
      const msg = keyErr?.message || "No Gemini API key found. Please open Settings and paste your API key.";
      setErrorBanner(msg);
      setShowSettings(true);
      return;
    }

    setAppState(AppState.GENERATING_SCRIPT);
    setScript(null);
    setAnalysis(null);
    setShowBoost(false);
    setGenProgress({
      step: 0,
      label: 'Analyzing topic brief & narrative hooks...',
      percent: 5,
      complete: false
    });

    try {
      const generatedScript = await generateScriptWithGemini(
        generatorConfig, 
        selectedCreator, 
        apiKey,
        customPrompt,
        undefined,
        (step, label, percent) => {
          setGenProgress({
            step,
            label,
            percent,
            complete: percent >= 100
          });
        }
      );

      const resolvedCreator =
        (generatedScript.creatorId &&
          CREATORS.find(c => c.id === generatedScript.creatorId || c.bio.id === generatedScript.creatorId)) ||
        selectedCreator;
      
      incrementDailyUsage();
      const saved = saveScriptToHistory(generatedScript, resolvedCreator);

      // Show 100% completion state briefly before revealing script editor
      setGenProgress({
        step: 4,
        label: 'Script package complete! Opening studio editor...',
        percent: 100,
        complete: true
      });
      await new Promise(resolve => setTimeout(resolve, 450));
      
      setScript(saved); 
      setHistory(getHistory());
      setAppState(AppState.READY);
      
    } catch (e: any) {
      console.error(e);
      setAppState(AppState.IDLE);
      setErrorBanner(e.message || "Error generating script.");
    }
  };

  // B-10: Accept optional targetScript so handleExtend never analyzes a stale closure script
  const handleAnalyze = async (targetScript?: ScriptData) => {
     const scriptToAnalyze = targetScript || script;
     if (!scriptToAnalyze) return;
     setErrorBanner(null);
     setAppState(AppState.ANALYZING);
     setShowBoost(true);
     
     const creatorForAnalysis =
       (scriptToAnalyze.creatorId &&
         CREATORS.find(c => c.id === scriptToAnalyze.creatorId || c.bio.id === scriptToAnalyze.creatorId)) ||
       activeScriptCreator;

     try {
        const analysisData = await analyzeScriptWithGemini(scriptToAnalyze, apiKey);
        if (scriptToAnalyze.id) {
           const updated = saveScriptToHistory(scriptToAnalyze, creatorForAnalysis, analysisData);
           setScript(updated);
        }
        setAnalysis(analysisData);
        setAppState(AppState.READY);
     } catch(e: any) {
        console.error(e);
        setErrorBanner(e?.message || "Failed to analyze script.");
        setAppState(AppState.READY);
     }
  };

  const handleAutoApplyBoostFixes = async () => {
    if (!script) return;
    setErrorBanner(null);
    setIsApplyingBoostFixes(true);
    try {
      const log = await enhanceScriptWithGemini(script, activeScriptCreator, apiKey);
      const mergedSegments =
        log.enhancedSegments && log.enhancedSegments.length > 0
          ? log.enhancedSegments.map((enh, idx) => ({
              ...(script.segments[idx] || {}),
              visual: enh.visual,
              audio: enh.audio
            }))
          : script.segments;
      const updatedScript: ScriptData = {
        ...script,
        segments: mergedSegments,
        enhancementLog: log
      };
      const saved = saveScriptToHistory(updatedScript, activeScriptCreator, analysis || undefined);
      setScript(saved);
      setHistory(getHistory());
    } catch (e: any) {
      console.error(e);
      setErrorBanner(e?.message || 'Failed to apply optimizations.');
    } finally {
      setIsApplyingBoostFixes(false);
    }
  };

  const handleExtend = async () => {
    if (!script) return;
    setErrorBanner(null);
    setIsExtending(true);
    try {
      const extendedScript = await extendScriptWithGemini(script, activeScriptCreator, apiKey);
      
      setScript(extendedScript); 

      saveScriptToHistory(extendedScript, activeScriptCreator, analysis || undefined);
      setHistory(getHistory());

      // B-10: Pass extendedScript directly so handleAnalyze does not use pre-extension closure
      if (showBoost) {
          await handleAnalyze(extendedScript);
      }

    } catch (error: any) {
      console.error(error);
      setErrorBanner(error?.message || "Failed to extend script.");
    } finally {
      setIsExtending(false);
    }
  };

  const handleSelectFromHistory = (saved: SavedScript) => {
    setScript(saved);
    setAnalysis(saved.analysis || null);
    setGeneratorConfig(prev => ({ 
        ...prev, 
        topicOrScript: saved.topic, 
        platform: saved.type,
        selectedStyleId: saved.creatorId,
        writingMode: 'manual'
    }));
    setShowHistoryModal(false);
    setAppState(AppState.READY);
    setView('create'); 
  };

  // B-21: Load template into templateId/templateOutline instead of overwriting user source material with raw template body
  const handleLoadTemplate = (template: Template) => {
    setView('create');
    setGeneratorConfig(prev => ({ 
        ...prev, 
        templateId: template.id,
        templateOutline: template.content,
        topicOrScript: prev.topicOrScript.trim() ? prev.topicOrScript : `${template.title}: `,
        selectedStyleId: template.creatorId,
        blendConfig: {
          primaryCreatorId: template.creatorId,
          secondaryCreatorIds: prev.blendConfig.secondaryCreatorIds.filter(id => id !== template.creatorId)
        },
        writingMode: 'manual'
    }));
    setScript(null);
    setAppState(AppState.IDLE);
  };

  const handleDeleteFromHistory = (id: string) => {
    deleteScriptFromHistory(id);
    setHistory(getHistory());
    if (script?.id === id) { setScript(null); setAnalysis(null); setAppState(AppState.IDLE); }
  };

  const handleBack = () => {
    setAppState(AppState.IDLE);
    setScript(null);
    setView('create');
  };

  const handleInsertBridgeParagraph = (paragraph: string) => {
    if (!script) return;
    const updatedSegments = [
      ...(script.segments || []),
      {
        visual: 'Split-screen archival analysis showing opposing empirical evidence and balanced data comparison chart.',
        audio: paragraph
      }
    ];
    handleScriptUpdate({
      ...script,
      segments: updatedSegments
    });
  };

  return (
    <div className={clsx(
      "flex flex-col min-h-screen font-sans transition-colors selection:bg-purple-500/30",
      isDarkMode ? "bg-[#020617] text-slate-200" : "bg-slate-50 text-slate-900"
    )}>
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-50 backdrop-blur-md border-b dark:border-white/5 border-slate-200 bg-opacity-80 dark:bg-[#020617]/80 bg-white/80">
            <div className={clsx("mx-auto px-4 h-16 flex items-center justify-between transition-all duration-500 ease-in-out w-full max-w-[95vw]")}>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex items-center gap-3 text-left group focus:outline-none"
                        title="Return to Ideograph Studio Home"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                            <PenTool size={18} className="fill-white/20" />
                        </div>
                        <div>
                            <h1 className="font-display font-extrabold text-lg sm:text-xl tracking-tight leading-none">Ideograph</h1>
                            <span className="block text-[10px] font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                                Creator Script Studio
                            </span>
                        </div>
                    </button>

                    {!script && view !== 'create' && (
                        <button
                            type="button"
                            onClick={() => setView('create')}
                            className="ml-2 sm:ml-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-200/80 dark:bg-white/10 hover:bg-indigo-500 hover:text-white transition-all"
                        >
                            <ChevronLeft size={16} />
                            <span>Back to Home</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowHistoryModal(true)}
                        className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        title="History"
                    >
                        <History size={20} />
                    </button>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>
        </header>

        {/* Main Content Area */}
        <main className={clsx(
            "flex-1 w-full mx-auto p-4 md:p-6 overflow-hidden flex flex-col transition-all duration-500 ease-in-out",
            script ? "max-w-[96vw]" : "max-w-[95vw]"
        )}>
            {storageBanner && (
                <div className="mb-4 px-5 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-xs font-medium">
                        <AlertTriangle size={16} className="shrink-0 text-indigo-500" />
                        <span>{storageBanner}</span>
                    </div>
                    <button
                        onClick={() => setStorageBanner(null)}
                        className="p-1 rounded-lg hover:bg-indigo-500/20 transition-colors"
                        title="Dismiss"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {errorBanner && (
                <div className="mb-6 px-5 py-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 text-sm font-medium">
                        <AlertTriangle size={18} className="shrink-0 text-amber-500" />
                        <span>{errorBanner}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setShowSettings(true)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
                        >
                            Open Settings
                        </button>
                        <button
                            onClick={() => setErrorBanner(null)}
                            className="p-1.5 rounded-lg hover:bg-amber-500/20 transition-colors"
                            title="Dismiss"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
            
            {/* Top workspace tabs removed on main/idle page per user request: navigation happens via the 3 Homepage Hub Cards (Write a Script, Shorts Clipper, Argument Checker) */}

            {/* Active Script Studio Switcher Bar when a Script is Loaded */}
            {script && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <button onClick={handleBack} className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity">
                        <ChevronLeft size={16} /> Back to Studio
                    </button>

                    <nav
                        aria-label="Studio switcher"
                        onMouseEnter={() => setIsStudioNavHovered(true)}
                        onMouseLeave={() => setIsStudioNavHovered(false)}
                        className="group/studionav inline-flex items-center gap-1 sm:gap-1.5 bg-slate-200/80 dark:bg-white/5 p-1 rounded-xl border border-slate-300/60 dark:border-white/10 transition-all duration-300"
                    >
                        {([
                            { id: 'create' as const, label: 'Editor', icon: FileText, isActive: view !== 'clipper' && view !== 'devilsAdvocate', activeClass: 'text-slate-900 dark:text-white', iconColor: 'text-indigo-500' },
                            { id: 'clipper' as const, label: 'Shorts Clipper', icon: Scissors, isActive: view === 'clipper', activeClass: 'text-indigo-600 dark:text-indigo-300', iconColor: 'text-indigo-500' },
                            { id: 'devilsAdvocate' as const, label: 'Argument Checker', icon: Scale, isActive: view === 'devilsAdvocate', activeClass: 'text-sky-600 dark:text-sky-300', iconColor: 'text-sky-500' },
                        ]).map((tab) => {
                            const Icon = tab.icon;
                            const isExpanded = tab.isActive || isStudioNavHovered;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setView(tab.id)}
                                    title={tab.label}
                                    aria-label={tab.label}
                                    className={clsx(
                                        "rounded-lg text-xs font-bold transition-all duration-300 ease-out inline-flex items-center justify-center",
                                        isExpanded ? "px-3 sm:px-3.5 py-1.5" : "px-2.5 py-1.5",
                                        tab.isActive
                                            ? clsx("bg-white dark:bg-[#1e293b] shadow-sm", tab.activeClass)
                                            : "opacity-70 hover:opacity-100 hover:bg-white/40 dark:hover:bg-white/5"
                                    )}
                                >
                                    <Icon size={14} className={clsx("shrink-0", tab.isActive && tab.iconColor)} />
                                    <span
                                        className={clsx(
                                            "overflow-hidden whitespace-nowrap transition-all duration-300 ease-out",
                                            isExpanded
                                                ? "max-w-[140px] opacity-100 ml-1.5"
                                                : "max-w-0 opacity-0 ml-0"
                                        )}
                                    >
                                        {tab.label}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
            )}

            {/* RENDER LOGIC SWITCH */}
            {view === 'clipper' ? (
                <ShortsClipperStudio
                    config={generatorConfig}
                    setConfig={setGeneratorConfig}
                    currentScript={script}
                    isDarkMode={isDarkMode}
                    apiKey={apiKey}
                />
            ) : view === 'devilsAdvocate' ? (
                <DevilsAdvocateLab
                    currentScript={script}
                    onInsertBridgeIntoScript={script ? handleInsertBridgeParagraph : undefined}
                    isDarkMode={isDarkMode}
                    apiKey={apiKey}
                />
            ) : script ? (
                // EDITOR VIEW
                <div className="flex-1 flex flex-col relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex-1 flex flex-col lg:flex-row gap-6 h-auto min-h-0">
                        <div className="flex-1 h-full min-h-[500px]">
                            <ScriptEditor 
                                script={script} 
                                creator={activeScriptCreator} 
                                onAnalyze={() => handleAnalyze()}
                                isAnalyzing={appState === AppState.ANALYZING}
                                hasAnalysis={!!analysis}
                                onRetry={handleBack}
                                onExtend={handleExtend}
                                isExtending={isExtending}
                                isDarkMode={isDarkMode}
                                apiKey={apiKey}
                                onUpdateScript={handleScriptUpdate}
                            />
                        </div>
                        
                        <div className={`transition-all duration-500 ease-in-out flex-shrink-0 ${showBoost ? 'w-full lg:w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden hidden lg:block'}`}>
                            {analysis && (
                              <BoostPanel
                                analysis={analysis}
                                creator={activeScriptCreator}
                                isVisible={showBoost}
                                onAutoApplyFixes={handleAutoApplyBoostFixes}
                                isApplyingFixes={isApplyingBoostFixes}
                              />
                            )}
                        </div>
                    </div>

                    {/* Mobile Boost Toggle */}
                    {script && !showBoost && analysis && (
                        <button onClick={() => setShowBoost(true)} className="fixed right-6 bottom-6 p-4 rounded-full shadow-2xl text-[#020617] font-bold z-20 hover:scale-110 transition-transform" style={{ backgroundColor: activeScriptCreator.hex }}>
                            <Zap size={24} className="fill-current" />
                        </button>
                    )}
                    {script && showBoost && (
                         <button onClick={() => setShowBoost(false)} className={clsx("fixed right-6 bottom-24 p-2 bg-black/50 backdrop-blur rounded-lg text-white text-xs z-50 lg:hidden")}>Close Panel</button>
                    )}
                </div>
            ) : view === 'templates' ? (
                // TEMPLATES VIEW
                <TemplateGrid 
                    templates={TEMPLATES} 
                    creators={CREATORS} 
                    onSelect={handleLoadTemplate} 
                    isDarkMode={isDarkMode} 
                    searchQuery={searchQuery}
                />
            ) : (
                // CREATION FORM VIEW
                (appState as AppState) === AppState.GENERATING_SCRIPT ? (
                    <ScriptGenerationLoader
                        creator={selectedCreator}
                        config={generatorConfig}
                        isDarkMode={isDarkMode}
                        backendStep={genProgress.step}
                        backendLabel={genProgress.label}
                        backendPercent={genProgress.percent}
                        isComplete={genProgress.complete}
                    />
                ) : (
                    <CreationForm 
                        config={generatorConfig}
                        setConfig={setGeneratorConfig}
                        onGenerate={handleGenerateScript} 
                        isGenerating={appState === AppState.GENERATING_SCRIPT}
                        creator={selectedCreator}
                        isDarkMode={isDarkMode}
                        apiKey={apiKey}
                        onOpenClipper={() => setView('clipper')}
                        onOpenArgumentChecker={() => setView('devilsAdvocate')}
                        onOpenTemplates={() => setView('templates')}
                        onLongFormScriptComplete={(completedScript) => {
                            const resolvedCreator =
                                (completedScript.creatorId &&
                                    CREATORS.find(
                                        c => c.id === completedScript.creatorId || c.bio.id === completedScript.creatorId
                                    )) ||
                                selectedCreator;
                            incrementDailyUsage();
                            const saved = saveScriptToHistory(completedScript, resolvedCreator);
                            setScript(saved);
                            setHistory(getHistory());
                            setAppState(AppState.READY);
                        }}
                    />
                )
            )}
        </main>

        {/* Modals */}
        <SettingsModal 
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            isDarkMode={isDarkMode}
            onToggleTheme={handleToggleTheme}
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            customPrompt={customPrompt}
            onCustomPromptChange={setCustomPrompt}
        />
        <HistoryModal 
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            history={history}
            onSelectScript={handleSelectFromHistory}
            onDeleteScript={handleDeleteFromHistory}
            isDarkMode={isDarkMode}
        />

    </div>
  );
};

export default App;
