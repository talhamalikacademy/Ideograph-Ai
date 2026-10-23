import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CreatorProfile } from '../types';
import {
  calculateExactSpokenRuntime,
  formatSecondsToMMSS,
  synthesizeScratchVoiceoverWithGemini,
  stripAudioCuesAndBrackets
} from '../services/geminiService';
import {
  Play,
  Pause,
  Square,
  Volume2,
  Download,
  Gauge,
  Clock,
  Sparkles,
  Loader2,
  Radio
} from 'lucide-react';
import clsx from 'clsx';

interface ScratchVoiceoverBarProps {
  segments: Array<{ visual: string; audio: string }>;
  creator: CreatorProfile;
  language?: string;
  scriptTitle?: string;
  apiKey?: string;
  onActiveSceneChange?: (sceneIndex: number | null, activeWordIndex?: number | null) => void;
}

const GEMINI_CLOUD_VOICES = [
  { id: 'Kore', label: 'Kore (Documentary / Articulate)' },
  { id: 'Puck', label: 'Puck (Dynamic / High-Energy)' },
  { id: 'Charon', label: 'Charon (Deep / Investigative)' },
  { id: 'Fenrir', label: 'Fenrir (Bold / Authoritative)' },
  { id: 'Zephyr', label: 'Zephyr (Warm / Conversational)' }
];

const ScratchVoiceoverBar: React.FC<ScratchVoiceoverBarProps> = ({
  segments,
  creator,
  language = 'English',
  scriptTitle = 'script',
  apiKey,
  onActiveSceneChange
}) => {
  const [engineMode, setEngineMode] = useState<'web' | 'gemini'>('web');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [selectedGeminiVoice, setSelectedGeminiVoice] = useState<string>('Kore');
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoiceURI, setSelectedBrowserVoiceURI] = useState<string>('');

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSynthesizingCloud, setIsSynthesizingCloud] = useState<boolean>(false);
  const [synthProgressPct, setSynthProgressPct] = useState<number>(0);
  const [synthElapsedSec, setSynthElapsedSec] = useState<number>(0);
  const [currentElapsedSec, setCurrentElapsedSec] = useState<number>(0);
  const [cloudAudioUrl, setCloudAudioUrl] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const synthTimerIntervalRef = useRef<number | null>(null);
  const webSpeechSceneIdxRef = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  // Down-to-the-Second Runtime & Cadence Parser (automatically ignores [SFX: ...] and [BGM: ...] cues)
  const runtimeMetrics = useMemo(
    () => calculateExactSpokenRuntime(segments, speedMultiplier, 145),
    [segments, speedMultiplier]
  );

  // Estimated Gemini 3.8 TTS synthesis time based on spoken word count and language complexity
  const estimatedSynthTotalSec = useMemo(() => {
    const words = Math.max(10, runtimeMetrics.spokenWords);
    return Math.max(3.5, Math.min(28, Number((2.2 + (words / 100) * 1.6).toFixed(1))));
  }, [runtimeMetrics.spokenWords]);

  const coveredSynthWords = useMemo(() => {
    if (synthProgressPct >= 100) return runtimeMetrics.spokenWords;
    return Math.min(
      runtimeMetrics.spokenWords,
      Math.max(0, Math.round((synthProgressPct / 100) * runtimeMetrics.spokenWords))
    );
  }, [synthProgressPct, runtimeMetrics.spokenWords]);

  const clearSynthTimer = () => {
    if (synthTimerIntervalRef.current !== null) {
      window.clearInterval(synthTimerIntervalRef.current);
      synthTimerIntervalRef.current = null;
    }
  };

  const startSynthProgressTimer = () => {
    clearSynthTimer();
    setSynthElapsedSec(0);
    setSynthProgressPct(4);
    const startTs = performance.now();

    synthTimerIntervalRef.current = window.setInterval(() => {
      const elapsed = Number(((performance.now() - startTs) / 1000).toFixed(1));
      setSynthElapsedSec(elapsed);
      // Smooth asymptotic curve approaching 96% while waiting for Gemini 3.8 TTS audio payload
      const ratio = elapsed / estimatedSynthTotalSec;
      const computedPct = Math.min(96, Math.max(5, Math.round(96 * (1 - Math.exp(-1.85 * ratio)))));
      setSynthProgressPct(computedPct);
    }, 100);
  };

  const completeSynthProgressTo100 = () => {
    clearSynthTimer();
    setSynthProgressPct(100);
    window.setTimeout(() => {
      setIsSynthesizingCloud(false);
      setSynthProgressPct(0);
      setSynthElapsedSec(0);
    }, 900);
  };

  // Load Browser Native Google Web Speech Voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices() || [];
      setBrowserVoices(available);
      if (available.length > 0 && !selectedBrowserVoiceURI) {
        const langLower = language.toLowerCase();
        const preferred =
          available.find(
            v =>
              v.name.includes('Google') &&
              ((langLower.includes('hindi') && v.lang.startsWith('hi')) ||
                (langLower.includes('urdu') && (v.lang.startsWith('ur') || v.lang.startsWith('hi'))) ||
                (langLower.includes('english') && v.lang.startsWith('en')))
          ) ||
          available.find(v => v.name.includes('Google US English')) ||
          available.find(v => v.name.includes('Google UK English Male')) ||
          available.find(v => v.name.includes('Google हिन्दी')) ||
          available.find(v => v.name.includes('Google')) ||
          available[0];
        if (preferred) {
          setSelectedBrowserVoiceURI(preferred.voiceURI);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  // Reset cached cloud audio if script segments change
  useEffect(() => {
    setCloudAudioUrl(null);
    stopPlayback();
  }, [segments]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearSynthTimer();
      stopPlayback();
    };
  }, []);

  // Update active karaoke scene based on currentElapsedSec
  useEffect(() => {
    if (!isPlaying) return;
    const timing =
      runtimeMetrics.sceneTimings.find(
        t => currentElapsedSec >= t.startSecond && currentElapsedSec <= t.endSecond
      ) || runtimeMetrics.sceneTimings[runtimeMetrics.sceneTimings.length - 1];

    if (timing) {
      const sceneProgress =
        timing.durationSeconds > 0
          ? Math.max(0, Math.min(1, (currentElapsedSec - timing.startSecond) / timing.durationSeconds))
          : 0;
      const estimatedWordIdx = Math.floor(sceneProgress * timing.wordCount);
      onActiveSceneChange?.(timing.sceneIndex, estimatedWordIdx);
    }
  }, [currentElapsedSec, isPlaying, runtimeMetrics]);

  const clearTimer = () => {
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const stopPlayback = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    clearTimer();
    clearSynthTimer();
    setSynthProgressPct(0);
    setSynthElapsedSec(0);
    setCurrentElapsedSec(0);
    onActiveSceneChange?.(null, null);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const startElapsedTimer = () => {
    clearTimer();
    timerIntervalRef.current = window.setInterval(() => {
      setCurrentElapsedSec(prev => {
        if (prev >= runtimeMetrics.totalEstimatedSeconds) {
          return runtimeMetrics.totalEstimatedSeconds;
        }
        return Number((prev + 0.25).toFixed(2));
      });
    }, 250);
  };

  const playWebSpeechScene = (sceneIdx: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setTtsError('Browser Web Speech API not supported in this browser.');
      return;
    }
    if (sceneIdx >= segments.length) {
      stopPlayback();
      return;
    }

    webSpeechSceneIdxRef.current = sceneIdx;
    const rawSceneAudio = segments[sceneIdx]?.audio || '';
    const cleanSpoken = stripAudioCuesAndBrackets(rawSceneAudio);

    if (!cleanSpoken) {
      playWebSpeechScene(sceneIdx + 1);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanSpoken);
    utterance.rate = speedMultiplier;
    const matchedVoice = browserVoices.find(v => v.voiceURI === selectedBrowserVoiceURI);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    }

    const sceneTiming = runtimeMetrics.sceneTimings[sceneIdx];
    if (sceneTiming) {
      setCurrentElapsedSec(sceneTiming.startSecond);
    }
    onActiveSceneChange?.(sceneIdx, 0);

    utterance.onboundary = (event) => {
      if (event.name === 'word' && typeof event.charIndex === 'number') {
        const prefix = cleanSpoken.slice(0, event.charIndex);
        const wordIdx = prefix.trim() ? prefix.trim().split(/\s+/).length : 0;
        onActiveSceneChange?.(sceneIdx, wordIdx);
      }
    };

    utterance.onend = () => {
      if (!isPlayingRef.current) return;
      playWebSpeechScene(sceneIdx + 1);
    };

    utterance.onerror = () => {
      if (!isPlayingRef.current) return;
      playWebSpeechScene(sceneIdx + 1);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleTogglePlayPause = async () => {
    setTtsError(null);

    if (isPlaying) {
      // Pause active playback
      isPlayingRef.current = false;
      setIsPlaying(false);
      clearTimer();
      if (engineMode === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
      } else if (engineMode === 'gemini' && audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    // Resume or start playback
    if (engineMode === 'web') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.paused && currentElapsedSec > 0) {
          isPlayingRef.current = true;
          setIsPlaying(true);
          window.speechSynthesis.resume();
          startElapsedTimer();
          return;
        }
        window.speechSynthesis.cancel();
        isPlayingRef.current = true;
        setIsPlaying(true);
        startElapsedTimer();
        playWebSpeechScene(0);
      }
      return;
    }

    // Gemini Cloud TTS Engine (`gemini-3.8-flash-tts`)
    try {
      let urlToPlay = cloudAudioUrl;
      if (!urlToPlay) {
        setIsSynthesizingCloud(true);
        startSynthProgressTimer();
        const result = await synthesizeScratchVoiceoverWithGemini(
          segments,
          creator,
          selectedGeminiVoice,
          apiKey
        );
        urlToPlay = result.audioDataUrl;
        setCloudAudioUrl(urlToPlay);
        // Audio received, buffering into player (98%) before voice starts speaking (100%)
        setSynthProgressPct(98);
      } else {
        setIsSynthesizingCloud(true);
        setSynthProgressPct(98);
      }

      if (!audioRef.current) {
        audioRef.current = new Audio(urlToPlay);
      } else if (audioRef.current.src !== urlToPlay) {
        audioRef.current.src = urlToPlay;
      }

      audioRef.current.playbackRate = speedMultiplier;
      audioRef.current.onplaying = () => {
        // Snap to 100% the exact moment the voice begins speaking the words
        completeSynthProgressTo100();
      };
      audioRef.current.ontimeupdate = () => {
        if (!audioRef.current) return;
        const audioDur = audioRef.current.duration || runtimeMetrics.totalEstimatedSeconds || 1;
        const scaledElapsed =
          (audioRef.current.currentTime / audioDur) * runtimeMetrics.totalEstimatedSeconds;
        setCurrentElapsedSec(scaledElapsed);
      };
      audioRef.current.onended = () => {
        stopPlayback();
      };

      isPlayingRef.current = true;
      setIsPlaying(true);
      await audioRef.current.play();
      completeSynthProgressTo100();
    } catch (err: any) {
      console.error('Gemini Cloud TTS error, falling back to Browser Web Speech:', err);
      clearSynthTimer();
      setIsSynthesizingCloud(false);
      setSynthProgressPct(0);
      setSynthElapsedSec(0);
      setTtsError('Cloud TTS busy — switched to instant Web Speech preview.');
      setEngineMode('web');
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        isPlayingRef.current = true;
        setIsPlaying(true);
        startElapsedTimer();
        playWebSpeechScene(0);
      }
    }
  };

  const handleDownloadWav = async () => {
    setTtsError(null);
    try {
      let wavDataUrl = cloudAudioUrl;
      if (!wavDataUrl) {
        setIsSynthesizingCloud(true);
        startSynthProgressTimer();
        const result = await synthesizeScratchVoiceoverWithGemini(
          segments,
          creator,
          selectedGeminiVoice,
          apiKey
        );
        wavDataUrl = result.audioDataUrl;
        setCloudAudioUrl(wavDataUrl);
      }
      completeSynthProgressTo100();
      const link = document.createElement('a');
      const cleanName = (scriptTitle || 'scratch_voiceover')
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .toLowerCase();
      link.href = wavDataUrl;
      link.download = `${cleanName}_${selectedGeminiVoice.toLowerCase()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      clearSynthTimer();
      setIsSynthesizingCloud(false);
      setSynthProgressPct(0);
      setSynthElapsedSec(0);
      setTtsError(err?.message || 'Failed to synthesize WAV file.');
    }
  };

  return (
    <div className="border-b border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-[#0b1324] px-6 py-2.5 flex flex-col gap-2 z-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Play / Pause / Stop & Engine Mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleTogglePlayPause}
            disabled={(isSynthesizingCloud && synthProgressPct < 100) || segments.length === 0}
            className={clsx(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm tabular-nums',
              synthProgressPct === 100
                ? 'bg-emerald-600 text-white'
                : isPlaying
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-70'
            )}
            title="Play or Pause Scratch Voiceover (ignores [SFX] & [BGM] tags)"
          >
            {isSynthesizingCloud ? (
              synthProgressPct === 100 ? (
                <>
                  <Volume2 size={13} className="animate-bounce" />
                  <span>100% Ready — Speaking!</span>
                </>
              ) : (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>
                    Loading Gemini 3.8 TTS ({synthProgressPct}% • {synthElapsedSec.toFixed(1)}s)
                  </span>
                </>
              )
            ) : isPlaying ? (
              <>
                <Pause size={13} className="fill-current" />
                <span>Pause Voiceover</span>
              </>
            ) : (
              <>
                <Play size={13} className="fill-current" />
                <span>Play Scratch Voiceover</span>
              </>
            )}
          </button>

          {(isPlaying || currentElapsedSec > 0) && (
            <button
              onClick={stopPlayback}
              className="p-1.5 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-rose-500/20 hover:text-rose-500 transition-colors"
              title="Stop & Reset Voiceover"
            >
              <Square size={12} className="fill-current" />
            </button>
          )}

        {/* Engine Switcher: Instant Web Speech vs Gemini 3.8 Flash TTS */}
        <div className="flex items-center bg-white dark:bg-[#162032] p-0.5 rounded-xl border border-slate-200 dark:border-white/10 text-[11px] font-bold">
          <button
            onClick={() => {
              stopPlayback();
              setEngineMode('web');
            }}
            className={clsx(
              'px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1',
              engineMode === 'web'
                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
            title="Zero-latency browser native Google Web Speech engine"
          >
            <Radio size={11} />
            <span>Instant Web Speech</span>
          </button>
          <button
            onClick={() => {
              stopPlayback();
              setEngineMode('gemini');
            }}
            className={clsx(
              'px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1',
              engineMode === 'gemini'
                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            )}
            title="Expressive Gemini 3.8 Flash Cloud TTS engine"
          >
            <Sparkles size={11} />
            <span>Gemini 3.8 TTS</span>
          </button>
        </div>

        {/* Voice Persona / Language Selector */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-[#162032] border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1">
          <Volume2 size={13} className="text-indigo-500 shrink-0" />
          {engineMode === 'gemini' ? (
            <select
              value={selectedGeminiVoice}
              onChange={(e) => {
                setSelectedGeminiVoice(e.target.value);
                setCloudAudioUrl(null);
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer max-w-[190px]"
            >
              {GEMINI_CLOUD_VOICES.map(v => (
                <option key={v.id} value={v.id} className="dark:bg-slate-800">
                  {v.label}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedBrowserVoiceURI}
              onChange={(e) => setSelectedBrowserVoiceURI(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer max-w-[190px]"
            >
              {browserVoices.length === 0 ? (
                <option value="">System Default Voice ({language})</option>
              ) : (
                browserVoices.map(v => (
                  <option key={v.voiceURI} value={v.voiceURI} className="dark:bg-slate-800">
                    {v.name} ({v.lang})
                  </option>
                ))
              )}
            </select>
          )}
        </div>
      </div>

      {/* Right: Speed / WPM Slider, Exact Cadence Timer & Download WAV */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Speed / WPM Slider (0.8x - 1.5x) */}
        <div
          className="flex items-center gap-2 bg-white dark:bg-[#162032] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1"
          title={`Base 145 WPM + comma (+0.4s), sentence (+0.8s), paragraph/pause (+1.5s)`}
        >
          <Gauge size={13} className="text-emerald-500" />
          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200">
            {speedMultiplier.toFixed(1)}x ({runtimeMetrics.effectiveWpm} WPM)
          </span>
          <input
            type="range"
            min="0.8"
            max="1.5"
            step="0.1"
            value={speedMultiplier}
            onChange={(e) => {
              const nextSpeed = parseFloat(e.target.value);
              setSpeedMultiplier(nextSpeed);
              if (audioRef.current) {
                audioRef.current.playbackRate = nextSpeed;
              }
            }}
            className="w-20 accent-indigo-500 cursor-pointer h-1.5"
          />
        </div>

        {/* Live Timer: MM:SS / Total Estimated Runtime */}
        <div
          className="flex items-center gap-1.5 bg-white dark:bg-[#162032] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1 text-xs font-mono"
          title={`Spoken Words: ${runtimeMetrics.spokenWords} (excludes [SFX]/[BGM]) • Commas/Dashes: ${runtimeMetrics.commaAndDashCount} (+0.4s) • Sentences: ${runtimeMetrics.sentenceEndCount} (+0.8s) • Pauses: ${runtimeMetrics.paragraphAndPauseCount} (+1.5s)`}
        >
          <Clock size={13} className="text-indigo-500" />
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {formatSecondsToMMSS(currentElapsedSec)}
          </span>
          <span className="opacity-40">/</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {runtimeMetrics.formattedRuntime}
          </span>
          <span className="text-[10px] opacity-50 hidden xl:inline">
            ({runtimeMetrics.spokenWords}w spoken)
          </span>
        </div>

        {/* Download Scratch Audio .WAV */}
        <button
          onClick={handleDownloadWav}
          disabled={(isSynthesizingCloud && synthProgressPct < 100) || segments.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
          title="Download Scratch Voiceover as .WAV (synthesized via Gemini 3.8 Flash TTS)"
        >
          {isSynthesizingCloud && synthProgressPct < 100 ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Download size={13} />
          )}
          <span>Download .WAV</span>
        </button>

        {ttsError && (
          <span className="text-[11px] font-medium text-amber-500">{ttsError}</span>
        )}
      </div>
      </div>

      {/* Gemini 3.8 TTS Live Loading Timer & Word Coverage Progress Bar */}
      {isSynthesizingCloud && (
        <div
          className="w-full rounded-xl bg-white/90 dark:bg-[#162032] border border-indigo-500/25 px-3.5 py-2 flex flex-col gap-1.5 animate-in fade-in duration-200"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-300">
              <Sparkles size={12} className={synthProgressPct < 100 ? 'animate-spin' : ''} />
              {synthProgressPct === 100
                ? `Gemini 3.8 TTS Ready (${language}) — Voice Started Speaking!`
                : `Gemini 3.8 TTS Loading (${language}): Covering ${coveredSynthWords} / ${runtimeMetrics.spokenWords} words`}
            </span>
            <span className="font-bold tabular-nums text-slate-700 dark:text-slate-200">
              {synthProgressPct}% • {synthElapsedSec.toFixed(1)}s / ~{estimatedSynthTotalSec.toFixed(1)}s est.
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-150',
                synthProgressPct === 100
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500'
              )}
              style={{ width: `${synthProgressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ScratchVoiceoverBar;
