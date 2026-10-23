import React, { useState, useEffect } from 'react';
import { 
  X, 
  Moon, 
  Sun, 
  Key, 
  MessageSquare, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  Check 
} from 'lucide-react';
import clsx from 'clsx';
import { getApiKeyStatus } from '../services/apiKey';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  customPrompt: string;
  onCustomPromptChange: (prompt: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onToggleTheme,
  apiKey,
  onApiKeyChange,
  customPrompt,
  onCustomPromptChange,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const keyStatus = getApiKeyStatus(apiKey);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Container: Bottom sheet on mobile, centered card on desktop */}
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        className={clsx(
          "w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border transition-all duration-300 overflow-hidden flex flex-col max-h-[90vh]",
          isDarkMode
            ? "bg-slate-900/95 text-slate-100 border-slate-800 shadow-black/60"
            : "bg-white text-slate-900 border-slate-200/80 shadow-slate-900/10"
        )}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Header */}
        <div className={clsx(
          "flex items-center justify-between px-6 py-5 border-b",
          isDarkMode ? "border-slate-800/80" : "border-slate-100"
        )}>
          <div className="flex items-center gap-3.5">
            <div className={clsx(
              "p-2.5 rounded-2xl flex items-center justify-center border",
              isDarkMode 
                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
                : "bg-indigo-50 border-indigo-100 text-indigo-600"
            )}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-lg sm:text-xl font-bold tracking-tight">
                Workspace Preferences
              </h2>
              <p className={clsx(
                "text-xs sm:text-sm",
                isDarkMode ? "text-slate-400" : "text-slate-500"
              )}>
                Customize your interface, API credentials, and AI behavior
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close settings"
            className={clsx(
              "p-2 rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500",
              isDarkMode
                ? "text-slate-400 hover:text-white hover:bg-slate-800"
                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            )}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* 1. Appearance Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className={clsx(
                "text-xs font-semibold uppercase tracking-wider",
                isDarkMode ? "text-slate-400" : "text-slate-500"
              )}>
                Appearance & Theme
              </span>
            </div>

            <div
              onClick={onToggleTheme}
              role="switch"
              aria-checked={isDarkMode}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleTheme();
                }
              }}
              className={clsx(
                "group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all duration-200 border select-none",
                isDarkMode
                  ? "bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70"
                  : "bg-slate-50/70 border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/70"
              )}
            >
              <div className="flex items-center gap-3.5">
                <div className={clsx(
                  "p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-105",
                  isDarkMode 
                    ? "bg-indigo-500/15 text-indigo-400" 
                    : "bg-amber-500/15 text-amber-600"
                )}>
                  {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {isDarkMode ? 'Dark Interface' : 'Light Interface'}
                  </p>
                  <p className={clsx(
                    "text-xs mt-0.5",
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  )}>
                    {isDarkMode 
                      ? 'Low-glare palette designed for night & low-light focus' 
                      : 'High-contrast daylight view for crisp readability'}
                  </p>
                </div>
              </div>

              {/* Animated Pill Switch */}
              <div className={clsx(
                "w-12 h-7 rounded-full p-1 transition-colors duration-200 relative shrink-0",
                isDarkMode ? "bg-indigo-600" : "bg-slate-300"
              )}>
                <div className={clsx(
                  "w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200",
                  isDarkMode ? "translate-x-5" : "translate-x-0"
                )} />
              </div>
            </div>
          </div>

          {/* 2. Gemini API Configuration */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label 
                htmlFor="gemini-api-key"
                className={clsx(
                  "text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5",
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                )}
              >
                <Key size={14} className="text-indigo-500" />
                Gemini API Key
              </label>
              <div className="flex items-center gap-2">
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => onApiKeyChange('')}
                    className="text-[11px] font-semibold text-rose-500 hover:text-rose-400 transition-colors"
                  >
                    Clear Saved Key
                  </button>
                )}
                <span className={clsx(
                  "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full",
                  keyStatus === 'custom'
                    ? isDarkMode ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-700"
                    : keyStatus === 'env'
                    ? isDarkMode ? "bg-indigo-500/15 text-indigo-300" : "bg-indigo-50 text-indigo-700"
                    : isDarkMode ? "bg-amber-500/15 text-amber-300" : "bg-amber-50 text-amber-700"
                )}>
                  <ShieldCheck size={12} />
                  {keyStatus === 'custom'
                    ? "Custom Key Saved (Browser)"
                    : keyStatus === 'env'
                    ? "System Environment Key Active"
                    : keyStatus === 'invalid_custom'
                    ? "Key Too Short / Invalid"
                    : "No API Key Configured"}
                </span>
              </div>
            </div>

            <p className={clsx(
              "text-xs leading-relaxed",
              isDarkMode ? "text-slate-400" : "text-slate-500"
            )}>
              Provide your personal Google Gemini key to override system rate limits. Persisted automatically in your browser's local storage.
            </p>

            <div className="relative">
              <input
                id="gemini-api-key"
                type={showApiKey ? "text" : "password"}
                placeholder="AIzaSyYourGeminiKeyHere..."
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                className={clsx(
                  "w-full pl-4 pr-11 py-3 rounded-xl border text-sm font-mono transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
                  isDarkMode
                    ? "bg-slate-950/60 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-indigo-500"
                    : "bg-slate-50/60 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500"
                )}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
                className={clsx(
                  "absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors",
                  isDarkMode
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                )}
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* 3. Custom Persona & Topic Guidance */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label 
                htmlFor="custom-prompt-input"
                className={clsx(
                  "text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5",
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                )}
              >
                <MessageSquare size={14} className="text-indigo-500" />
                Topic & Persona Guidance
              </label>

              {/* Mode badges */}
              <div className="flex items-center gap-1">
                {['Manual', 'Auto', 'Blend'].map((mode) => (
                  <span
                    key={mode}
                    className={clsx(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-md border",
                      isDarkMode
                        ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
                        : "bg-indigo-50 border-indigo-100 text-indigo-700"
                    )}
                  >
                    {mode}
                  </span>
                ))}
              </div>
            </div>

            <p className={clsx(
              "text-xs leading-relaxed",
              isDarkMode ? "text-slate-400" : "text-slate-500"
            )}>
              Set domain context, tone instructions, or background rules. These notes guide the output while respecting primary creator style rules.
            </p>

            <div className="relative">
              <textarea
                id="custom-prompt-input"
                rows={4}
                placeholder="e.g., Focus on B2B SaaS examples, keep explanations concise, avoid buzzwords..."
                value={customPrompt}
                onChange={(e) => onCustomPromptChange(e.target.value)}
                className={clsx(
                  "w-full px-4 py-3 rounded-xl border text-sm transition-all duration-150 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed",
                  isDarkMode
                    ? "bg-slate-950/60 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-indigo-500"
                    : "bg-slate-50/60 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500"
                )}
              />
              <div className={clsx(
                "flex justify-between items-center mt-1.5 text-[11px]",
                isDarkMode ? "text-slate-500" : "text-slate-400"
              )}>
                <span>Applies across all generation modes</span>
                <span>{customPrompt.length} characters</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={clsx(
          "px-6 py-4 border-t flex items-center justify-between gap-3",
          isDarkMode ? "bg-slate-900/50 border-slate-800/80" : "bg-slate-50/80 border-slate-100"
        )}>
          <span className={clsx(
            "text-xs hidden sm:inline-block",
            isDarkMode ? "text-slate-500" : "text-slate-400"
          )}>
            Changes are saved automatically
          </span>

          <button
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            <Check size={16} />
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;