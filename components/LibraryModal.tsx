import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  BookOpen,
  Quote,
  Trash2,
  Plus,
  Check,
  Upload,
  FileText,
  UserCheck,
  Loader2
} from "lucide-react";
import { CreatorRecipe, TOPIC_NICHES, TopicNiche } from "../creator-recipes/types";
import {
  getCustomChannelRecipes,
  saveCustomChannelRecipe,
  deleteCustomChannelRecipe
} from "../creator-recipes";
import { QUOTES_LIBRARY, readUploadedFileText } from "../services/sourceService";
import { getAiClient, cleanAndParseJSON } from "../services/aiClient";
import { Type, Schema } from "@google/genai";
import clsx from "clsx";

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey?: string;
  onSelectVoiceRecipe?: (recipeId: string) => void;
  isDarkMode?: boolean;
}

const extractedRecipeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hookType: { type: Type.STRING },
    hookSecMin: { type: Type.NUMBER },
    hookSecMax: { type: Type.NUMBER },
    productionNotes: { type: Type.STRING },
    avgSentenceWords: { type: Type.NUMBER },
    signaturePhrases: { type: Type.ARRAY, items: { type: Type.STRING } },
    hookRules: { type: Type.ARRAY, items: { type: Type.STRING } },
    chapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          purpose: { type: Type.STRING },
          weight: { type: Type.NUMBER }
        },
        required: ["id", "purpose", "weight"]
      }
    }
  },
  required: [
    "hookType",
    "hookSecMin",
    "hookSecMax",
    "productionNotes",
    "avgSentenceWords",
    "signaturePhrases",
    "hookRules",
    "chapters"
  ]
};

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSelectVoiceRecipe,
  isDarkMode = false
}) => {
  const [activeTab, setActiveTab] = useState<"channel_style" | "quotes">("channel_style");
  const [customRecipes, setCustomRecipes] = useState<CreatorRecipe[]>([]);
  const [channelName, setChannelName] = useState("");
  const [primaryLang, setPrimaryLang] = useState<string>("Roman Urdu");
  const [selectedNiches, setSelectedNiches] = useState<TopicNiche[]>(["Society & crime"]);
  const [sampleScripts, setSampleScripts] = useState<string[]>(["", "", ""]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomRecipes(getCustomChannelRecipes());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleNiche = (niche: TopicNiche) => {
    setSelectedNiches(prev =>
      prev.includes(niche)
        ? prev.length > 1
          ? prev.filter(n => n !== niche)
          : prev
        : [...prev, niche]
    );
  };

  const handleUploadSampleFile = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readUploadedFileText(file);
      setSampleScripts(prev => {
        const next = [...prev];
        next[index] = text.slice(0, 15000);
        return next;
      });
    } catch (err: any) {
      setErrorMsg(err?.message || "Could not read file.");
    }
  };

  const handleBuildHouseStyle = async () => {
    const nonEmptySamples = sampleScripts.map(s => s.trim()).filter(Boolean);
    if (!channelName.trim()) {
      setErrorMsg("Please enter a name for your channel style.");
      return;
    }
    if (nonEmptySamples.length === 0) {
      setErrorMsg("Please paste or upload at least 1 past script sample (3–5 recommended).");
      return;
    }

    setErrorMsg(null);
    setIsExtracting(true);
    try {
      const ai = getAiClient(apiKey);
      const prompt = `
        Analyze these ${nonEmptySamples.length} past video scripts from the channel "${channelName.trim()}" and extract a reusable CreatorRecipe voice profile.

        PAST SCRIPT SAMPLES:
        ${nonEmptySamples.map((s, i) => `--- SAMPLE ${i + 1} ---\n${s.slice(0, 6000)}`).join("\n\n")}

        Extract:
        - hookType (1-sentence description of how the hook opens)
        - hookSecMin (30 to 45) and hookSecMax (45 to 65)
        - productionNotes (1-sentence description of narrator persona, pacing, and visual tone)
        - avgSentenceWords (typical sentence length, e.g., 14)
        - signaturePhrases (4 to 6 signature transition phrases used by this writer)
        - hookRules (3 rules this voice follows)
        - chapters (5 typical chapter stages with id, purpose, and weight summing to 1.0)
      `;

      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: extractedRecipeSchema,
          temperature: 0.25
        }
      });

      const parsed = cleanAndParseJSON(res.text || "{}") as any;
      const avgSent = parsed.avgSentenceWords || 15;

      const newRecipe: CreatorRecipe = {
        creatorId: `custom-${Date.now()}`,
        creatorName: `${channelName.trim()} (My Channel Style)`,
        source: "user_channel",
        niches: selectedNiches,
        regions: ["Pakistan", "India", "Global"],
        languages: [primaryLang, "English", "Roman Urdu", "Hinglish (Roman)"],
        formats: [
          { id: "documentary", minLen: 10, maxLen: 30, wpm: 140 },
          { id: "explainer", minLen: 3, maxLen: 15, wpm: 145 },
          { id: "short", minLen: 1, maxLen: 2, wpm: 155 }
        ],
        hook: {
          secondsMin: parsed.hookSecMin || 35,
          secondsMax: parsed.hookSecMax || 55,
          types: [parsed.hookType || "High-stakes investigative opening"],
          rules: parsed.hookRules || [
            "Open directly with a concrete question or real event",
            "Plant an open loop paid off in Chapter 2"
          ]
        },
        structure:
          Array.isArray(parsed.chapters) && parsed.chapters.length >= 3
            ? parsed.chapters
            : [
                { id: "hook_context", purpose: "Cold Open & Core Question", weight: 0.15 },
                { id: "history_origin", purpose: "How It Started & Historical Context", weight: 0.2 },
                { id: "core_evidence", purpose: "Primary Evidence & Data Breakdown", weight: 0.3 },
                { id: "deeper_mechanism", purpose: "Systemic Mechanism & Counter-View", weight: 0.2 },
                { id: "final_takeaway", purpose: "The Takeaway & Citizen Question", weight: 0.15 }
              ],
        signaturePhrases: parsed.signaturePhrases || [
          "Now look closely at this:",
          "Here is where the story changes:"
        ],
        sentenceLengthRange: [Math.max(10, avgSent - 3), avgSent + 3],
        productionNotes:
          parsed.productionNotes || "Custom house voice built from your past scripts."
      };

      const updated = saveCustomChannelRecipe(newRecipe);
      setCustomRecipes(updated);
      setChannelName("");
      setSampleScripts(["", "", ""]);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to analyze scripts.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDeleteCustom = (id: string) => {
    const updated = deleteCustomChannelRecipe(id);
    setCustomRecipes(updated);
  };

  const fieldCls = isDarkMode
    ? "w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 focus:outline-none"
    : "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className={clsx(
          "w-full max-w-4xl rounded-[2rem] border shadow-2xl overflow-hidden my-8",
          isDarkMode
            ? "border-white/10 bg-[#0f172a] text-white"
            : "border-slate-200 bg-white text-slate-900"
        )}
      >
        <div
          className={clsx(
            "flex items-center justify-between border-b px-6 py-5",
            isDarkMode ? "border-white/10 bg-[#1e293b]/70" : "border-slate-200 bg-slate-50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold">Creator Library &amp; My Channel Style</h2>
              <p className={clsx("text-xs sm:text-sm", isDarkMode ? "text-slate-400" : "text-slate-600")}>
                Build your own house voice from past scripts or browse reusable quotes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={clsx(
              "p-2.5 rounded-xl transition-colors",
              isDarkMode
                ? "text-slate-400 hover:text-white hover:bg-white/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/70"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className={clsx(
            "flex border-b px-6",
            isDarkMode ? "border-white/10 bg-[#1e293b]/40" : "border-slate-200 bg-slate-50/60"
          )}
        >
          <button
            onClick={() => setActiveTab("channel_style")}
            className={clsx(
              "px-4 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2",
              activeTab === "channel_style"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : isDarkMode
                ? "border-transparent text-slate-400 hover:text-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            <UserCheck className="w-4 h-4" />
            My Channel Style ({customRecipes.length})
          </button>
          <button
            onClick={() => setActiveTab("quotes")}
            className={clsx(
              "px-4 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2",
              activeTab === "quotes"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : isDarkMode
                ? "border-transparent text-slate-400 hover:text-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            <Quote className="w-4 h-4" />
            Quotes Library ({QUOTES_LIBRARY.length})
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {activeTab === "channel_style" ? (
            <>
              {customRecipes.length > 0 && (
                <div className="space-y-3">
                  <h3 className={clsx("text-xs font-extrabold uppercase tracking-wider", isDarkMode ? "text-slate-400" : "text-slate-600")}>
                    Your Saved Channel Voices
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {customRecipes.map(recipe => (
                      <div
                        key={recipe.creatorId}
                        className={clsx(
                          "p-4 rounded-2xl border flex flex-col justify-between gap-3",
                          isDarkMode
                            ? "border-indigo-500/30 bg-indigo-950/20"
                            : "border-indigo-200 bg-indigo-50/60"
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-extrabold">{recipe.creatorName}</span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                              {recipe.languages[0] || "Multi"}
                            </span>
                          </div>
                          <p className={clsx("text-xs mt-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                            {recipe.productionNotes}
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {recipe.structure.map((c, idx) => (
                              <span
                                key={idx}
                                className={clsx(
                                  "text-[10px] font-semibold px-2 py-0.5 rounded-md border",
                                  isDarkMode
                                    ? "bg-black/30 border-white/10 text-slate-300"
                                    : "bg-white border-slate-200 text-slate-700"
                                )}
                              >
                                {idx + 1}. {c.purpose.split(":")[0]} ({Math.round(c.weight * 100)}%)
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className={clsx("flex items-center justify-between pt-2.5 border-t", isDarkMode ? "border-white/10" : "border-slate-200")}>
                          {onSelectVoiceRecipe && (
                            <button
                              onClick={() => {
                                onSelectVoiceRecipe(recipe.creatorId);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" /> Use this voice
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteCustom(recipe.creatorId)}
                            className="text-xs font-semibold text-rose-500 hover:text-rose-400 flex items-center gap-1 ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                className={clsx(
                  "rounded-2xl border p-5 sm:p-6 space-y-4",
                  isDarkMode ? "border-white/10 bg-[#1e293b]/50" : "border-slate-200 bg-slate-50/70"
                )}
              >
                <div>
                  <h3 className="text-base font-extrabold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Build Your Own Channel Voice (Upload 3–5 Past Scripts)
                  </h3>
                  <p className={clsx("text-xs sm:text-sm mt-0.5", isDarkMode ? "text-slate-400" : "text-slate-600")}>
                    Paste or upload your past scripts below. We extract your hook style, chapter flow,
                    sentence rhythm, and transition phrases into a reusable voice recipe.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-500">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Channel or Voice Name
                    </label>
                    <input
                      type="text"
                      value={channelName}
                      onChange={e => setChannelName(e.target.value)}
                      placeholder="e.g., My Documentary Desk"
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1.5">
                      Primary Narration Language
                    </label>
                    <select
                      value={primaryLang}
                      onChange={e => setPrimaryLang(e.target.value)}
                      className={fieldCls}
                    >
                      <option value="Roman Urdu">Roman Urdu (Urdish)</option>
                      <option value="Hinglish (Roman)">Hinglish (Hindi + English)</option>
                      <option value="English">English</option>
                      <option value="Urdu (Proper)">Urdu (Nastaliq)</option>
                      <option value="Hindi (Devanagari)">Hindi (Devanagari)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    Channel Niches
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TOPIC_NICHES.map(niche => {
                      const active = selectedNiches.includes(niche);
                      return (
                        <button
                          key={niche}
                          type="button"
                          onClick={() => handleToggleNiche(niche)}
                          className={clsx(
                            "px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors",
                            active
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : isDarkMode
                              ? "bg-black/25 border-white/10 text-slate-300 hover:bg-white/10"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          {niche}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold">
                      Past Script Samples ({sampleScripts.filter(s => s.trim()).length} of{" "}
                      {sampleScripts.length} filled)
                    </label>
                    {sampleScripts.length < 5 && (
                      <button
                        type="button"
                        onClick={() => setSampleScripts(prev => [...prev, ""])}
                        className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add another script slot
                      </button>
                    )}
                  </div>

                  {sampleScripts.map((sample, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={clsx("text-xs font-bold flex items-center gap-1", isDarkMode ? "text-slate-300" : "text-slate-700")}>
                          <FileText className="w-3.5 h-3.5 text-indigo-500" /> Past Script #{idx + 1}
                        </span>
                        <label className="cursor-pointer text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1">
                          <Upload className="w-3.5 h-3.5" /> Upload .txt / .docx / .pdf
                          <input
                            type="file"
                            accept=".txt,.md,.docx,.pdf"
                            onChange={e => handleUploadSampleFile(e, idx)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <textarea
                        rows={3}
                        value={sample}
                        onChange={e => {
                          const val = e.target.value;
                          setSampleScripts(prev => {
                            const next = [...prev];
                            next[idx] = val;
                            return next;
                          });
                        }}
                        placeholder={`Paste script sample #${idx + 1} here...`}
                        className={fieldCls}
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={isExtracting}
                  onClick={handleBuildHouseStyle}
                  className="w-full min-h-[48px] py-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 disabled:opacity-50 text-sm font-extrabold text-white flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing your scripts &amp; building voice recipe...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Save to My Channel Style
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {QUOTES_LIBRARY.map((q, idx) => (
                <div
                  key={idx}
                  className={clsx(
                    "p-4 rounded-2xl border flex flex-col justify-between gap-2.5",
                    isDarkMode
                      ? "border-white/10 bg-[#1e293b]/60"
                      : "border-slate-200 bg-slate-50/70"
                  )}
                >
                  <div>
                    <p className="text-xs sm:text-sm italic font-medium">&ldquo;{q.quote}&rdquo;</p>
                    <p className="text-xs font-bold text-indigo-500 mt-2">
                      — {q.speaker} ({q.workOrContext})
                    </p>
                  </div>
                  <div className={clsx("flex items-center justify-between pt-2 border-t", isDarkMode ? "border-white/10" : "border-slate-200")}>
                    <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-md", isDarkMode ? "bg-white/10 text-slate-300" : "bg-white border border-slate-200 text-slate-600")}>
                      {q.workOrContext || "Verified Quote"}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`"${q.quote}" — ${q.speaker}`);
                        setCopiedQuoteId(String(idx));
                        setTimeout(() => setCopiedQuoteId(null), 1500);
                      }}
                      className="text-xs font-bold text-indigo-500 hover:underline"
                    >
                      {copiedQuoteId === String(idx) ? "Copied!" : "Copy quote"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
