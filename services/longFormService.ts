import { Type, Schema } from "@google/genai";
import {
  Dossier,
  ChapterOutlineItem,
  WrittenChapterResult,
  HookLabVariant,
  ProductionScriptRow,
  FactCard,
  QuoteCard,
  BookRef
} from "../types";
import { CreatorRecipe } from "../creator-recipes/types";
import { ScriptBudget } from "./budget";
import { getAiClient, isAbortError, cleanAndParseJSON } from "./aiClient";

const outlineResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    chapters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          purpose: { type: Type.STRING },
          weightPct: { type: Type.NUMBER },
          assignedFactIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          assignedQuoteIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          assignedBookIds: { type: Type.ARRAY, items: { type: Type.STRING } },
          openLoopToPlant: { type: Type.STRING },
          openLoopToPayOff: { type: Type.STRING }
        },
        required: ["title", "purpose", "weightPct", "assignedFactIds"]
      }
    }
  },
  required: ["chapters"]
};

const writtenChapterSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    text: {
      type: Type.STRING,
      description: "Full spoken narration for this chapter with inline [F1], [Q1], [B1] tags."
    },
    summary2Lines: {
      type: Type.STRING,
      description: "2-line summary of what this chapter covered and where it ended."
    },
    usedFactIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    usedQuoteIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    usedBookIds: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    keyPhrasesUsed: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 to 5 distinctive metaphors, numbers, or phrases used so subsequent chapters do not repeat them."
    },
    plantedLoop: { type: Type.STRING },
    paidOffLoop: { type: Type.STRING }
  },
  required: ["text", "summary2Lines", "usedFactIds"]
};

const hookLabSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    variants: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          style: { type: Type.STRING, enum: ["scene", "shocking_fact", "question"] },
          label: { type: Type.STRING },
          text: { type: Type.STRING },
          openLoopQuestion: { type: Type.STRING },
          payoffChapterNumber: { type: Type.NUMBER }
        },
        required: ["style", "label", "text", "openLoopQuestion", "payoffChapterNumber"]
      }
    }
  },
  required: ["variants"]
};

const productionRowsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    rows: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING },
          voiceover: { type: Type.STRING },
          visualDirection: { type: Type.STRING },
          onScreenText: { type: Type.STRING },
          sourceTag: { type: Type.STRING },
          audioMood: { type: Type.STRING }
        },
        required: ["timestamp", "voiceover", "visualDirection", "onScreenText", "sourceTag", "audioMood"]
      }
    }
  },
  required: ["rows"]
};

export function countWords(text: string): number {
  return (text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Step 1 of Long-Form Engine: Builds the Chapter Outline and assigns every approved/pinned
 * Dossier fact, quote, and book to a specific chapter.
 */
export async function buildOutline(options: {
  topic: string;
  angle: string;
  language: string;
  recipe: CreatorRecipe;
  dossier: Dossier;
  budget: ScriptBudget;
  questions?: string[];
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<ChapterOutlineItem[]> {
  const { topic, angle, language, recipe, dossier, budget, questions, apiKey, signal } = options;
  const ai = getAiClient(apiKey);

  const activeFacts = dossier.facts.filter(f => f.status === "approved" || f.status === "pinned");
  const activeQuotes = dossier.quotes.filter(q => q.status === "approved" || q.status === "pinned");
  const activeBooks = dossier.books.filter(b => b.status === "approved" || b.status === "pinned");

  const targetChapterCount = Math.max(3, budget.averageChapters);
  const bodyWordsBudget = Math.max(400, budget.voiceoverWords - 140);

  const recipeChaptersList = recipe.structure
    .map((c, idx) => `${idx + 1}. ${c.id} (${Math.round(c.weight * 100)}%): ${c.purpose}`)
    .join("\n");

  const factsSummary = activeFacts
    .map(
      f =>
        `[${f.id}] (${f.type}${f.status === "pinned" ? ", PINNED" : ""}) ${f.claim}${
          f.value ? ` | Value: ${f.value}` : ""
        } — Source: ${f.source.title}`
    )
    .join("\n");

  const quotesSummary = activeQuotes
    .map(q => `[${q.id}] "${q.quote}" — ${q.speaker} (${q.source.title})`)
    .join("\n");

  const booksSummary = activeBooks
    .map(b => `[${b.id}] "${b.title}" by ${b.author} (${b.sourceLevel}): ${b.relevance}`)
    .join("\n");

  const cleanQuestions = (questions || []).map(q => q.trim()).filter(Boolean);
  const questionsBlock =
    cleanQuestions.length > 0
      ? `\n    TOPIC-SPECIFIC NARRATIVE QUESTIONS TO ANSWER ORGANICALLY IN BODY CHAPTERS (Chapters 2 to ${targetChapterCount - 1}):\n    ${cleanQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n    ")}\n`
      : `\n    QUESTION MODE: Topic-Only Auto-Flow (structure body chapters 100% organically from TOPIC and ANGLE).\n`;

  const prompt = `
    You are the Lead Documentary Architect designing a ${budget.minutes}-minute (${budget.voiceoverWords} words) script outline.
    TOPIC: "${topic}"
    ANGLE / WHAT SHOULD BE INSIDE: "${angle || topic}"
    NARRATION LANGUAGE: ${language}
    VOICE RECIPE: ${recipe.creatorName} (${recipe.productionNotes || "Evidence-driven narrative"})
    ${questionsBlock}
    RECIPE CHAPTER TEMPLATE (adapt to ${targetChapterCount} chapters):
    ${recipeChaptersList}

    APPROVED DOSSIER FACTS (${activeFacts.length}):
    ${factsSummary || "None"}

    APPROVED QUOTES (${activeQuotes.length}):
    ${quotesSummary || "None"}

    APPROVED BOOKS (${activeBooks.length}):
    ${booksSummary || "None"}

    INSTRUCTIONS:
    1. Create exactly ${targetChapterCount} chapters that follow ${recipe.creatorName}'s progression and cover "${topic}" deeply.
    2. Chapter 1 MUST be the signature ${recipe.creatorName} Opening Hook & Core Thesis. The Final Chapter (${targetChapterCount}) MUST be the signature ${recipe.creatorName} Closing Verdict & Takeaway.
    3. ${
      cleanQuestions.length > 0
        ? `Organically map the Topic-Specific Narrative Questions onto the middle Body Chapters (Chapters 2 to ${targetChapterCount - 1}) so each body chapter resolves one key dimension of "${topic}" with hard facts without sounding like a rigid Q&A list.`
        : `Structure the middle Body Chapters (Chapters 2 to ${targetChapterCount - 1}) organically around the core mechanism, ground evidence, and counter-arguments of "${topic}".`
    }
    4. Distribute ALL approved/pinned Fact IDs ([F1], [F2]...), Quote IDs ([Q1]...), and Book IDs ([B1]...) across the chapters so every chapter has strong evidence and NO fact is assigned to two chapters.
    5. Aim for at least 3 facts per chapter wherever possible.
    6. Plant at least 2 open-loop questions in earlier chapters and specify which later chapter pays each off.
    7. Ensure weightPct across all chapters sums to 100.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: outlineResponseSchema,
        temperature: 0.25,
        abortSignal: signal
      }
    });

    const parsed = cleanAndParseJSON(response.text || "{}") as {
      chapters?: Array<{
        title?: string;
        purpose?: string;
        weightPct?: number;
        assignedFactIds?: string[];
        assignedQuoteIds?: string[];
        assignedBookIds?: string[];
        openLoopToPlant?: string;
        openLoopToPayOff?: string;
      }>;
    };

    const rawChapters = parsed.chapters || [];
    if (rawChapters.length === 0) {
      throw new Error("Empty outline returned");
    }

    const totalWeight = rawChapters.reduce((acc, c) => acc + (c.weightPct || 15), 0) || 100;
    const usedFactSet = new Set<string>();

    const outline: ChapterOutlineItem[] = rawChapters.map((c, idx) => {
      const normalizedWeight = Math.round(((c.weightPct || 15) / totalWeight) * 100);
      const targetWords = Math.max(180, Math.round((normalizedWeight / 100) * bodyWordsBudget));
      const cleanFacts = (c.assignedFactIds || []).filter(id => {
        const exists = activeFacts.some(f => f.id === id);
        if (!exists || usedFactSet.has(id)) return false;
        usedFactSet.add(id);
        return true;
      });

      return {
        id: `CHAP-${idx + 1}`,
        chapterNumber: idx + 1,
        title: c.title || `Chapter ${idx + 1}`,
        purpose: c.purpose || "Advance the investigation with documented evidence.",
        weightPct: normalizedWeight,
        targetWords,
        assignedFactIds: cleanFacts,
        assignedQuoteIds: (c.assignedQuoteIds || []).filter(id => activeQuotes.some(q => q.id === id)),
        assignedBookIds: (c.assignedBookIds || []).filter(id => activeBooks.some(b => b.id === id)),
        openLoopToPlant: c.openLoopToPlant || undefined,
        openLoopToPayOff: c.openLoopToPayOff || undefined
      };
    });

    const unassignedFacts = activeFacts.filter(f => !usedFactSet.has(f.id));
    unassignedFacts.forEach((f, idx) => {
      const targetChapter = outline[idx % outline.length];
      if (targetChapter) {
        targetChapter.assignedFactIds.push(f.id);
      }
    });

    outline.forEach(chap => {
      if (chap.assignedFactIds.length < 3) {
        chap.gapWarning = `Only ${chap.assignedFactIds.length} facts assigned (recommended: 3+). Click 'Fill chapter gap' to fetch more evidence.`;
      } else {
        chap.gapWarning = undefined;
      }
    });

    return outline;
  } catch (err) {
    if (isAbortError(err)) throw err;
    return buildFallbackOutline(recipe, dossier, budget, cleanQuestions);
  }
}

export function buildFallbackOutline(
  recipe: CreatorRecipe,
  dossier: Dossier,
  budget: ScriptBudget,
  questions?: string[]
): ChapterOutlineItem[] {
  const activeFacts = dossier.facts.filter(f => f.status === "approved" || f.status === "pinned");
  const activeQuotes = dossier.quotes.filter(q => q.status === "approved" || q.status === "pinned");
  const activeBooks = dossier.books.filter(b => b.status === "approved" || b.status === "pinned");
  const bodyWordsBudget = Math.max(400, budget.voiceoverWords - 140);
  const cleanQs = (questions || []).filter(Boolean);

  const templateChapters = recipe.structure;
  const outline: ChapterOutlineItem[] = templateChapters.map((c, idx) => {
    const weightPct = Math.round(c.weight * 100);
    const isBodyChapter = idx > 0 && idx < templateChapters.length - 1;
    const matchedQuestion = isBodyChapter && cleanQs.length > 0 ? cleanQs[(idx - 1) % cleanQs.length] : undefined;
    return {
      id: `CHAP-${idx + 1}`,
      chapterNumber: idx + 1,
      title: c.purpose.split(":")[0] || `Chapter ${idx + 1}`,
      purpose: matchedQuestion ? `${c.purpose} — Focus Question: ${matchedQuestion}` : c.purpose,
      weightPct,
      targetWords: Math.max(180, Math.round(c.weight * bodyWordsBudget)),
      assignedFactIds: [],
      assignedQuoteIds: [],
      assignedBookIds: [],
      openLoopToPlant:
        idx === 0 ? cleanQs[0] || `What is the hidden mechanism driving ${dossier.topic}?` : undefined,
      openLoopToPayOff:
        idx === templateChapters.length - 2
          ? cleanQs[0] || `What is the hidden mechanism driving ${dossier.topic}?`
          : undefined
    };
  });

  activeFacts.forEach((f, i) => {
    outline[i % outline.length].assignedFactIds.push(f.id);
  });
  activeQuotes.forEach((q, i) => {
    outline[i % outline.length].assignedQuoteIds.push(q.id);
  });
  activeBooks.forEach((b, i) => {
    outline[i % outline.length].assignedBookIds.push(b.id);
  });

  outline.forEach(chap => {
    if (chap.assignedFactIds.length < 3) {
      chap.gapWarning = `Only ${chap.assignedFactIds.length} facts assigned (recommended: 3+).`;
    }
  });

  return outline;
}

/**
 * Step 2 of Long-Form Engine: Writes a SINGLE chapter with strict word budget, assigned evidence,
 * Story-So-Far continuity, and Used-Ledger anti-repetition.
 */
export async function writeChapter(options: {
  chapter: ChapterOutlineItem;
  chapterIndex: number;
  totalChapters: number;
  topic: string;
  angle: string;
  language: string;
  recipe: CreatorRecipe;
  dossier: Dossier;
  storySoFar: string[];
  usedLedger: {
    factIds: string[];
    quoteIds: string[];
    bookIds: string[];
    keyPhrases: string[];
  };
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<WrittenChapterResult> {
  const {
    chapter,
    chapterIndex,
    totalChapters,
    topic,
    angle,
    language,
    recipe,
    dossier,
    storySoFar,
    usedLedger,
    apiKey,
    signal
  } = options;

  const ai = getAiClient(apiKey);
  const minWords = Math.round(chapter.targetWords * 0.9);
  const maxWords = Math.round(chapter.targetWords * 1.1);

  const chapterFacts: FactCard[] = chapter.assignedFactIds
    .map(id => dossier.facts.find(f => f.id === id))
    .filter((f): f is FactCard => Boolean(f));

  const chapterQuotes: QuoteCard[] = chapter.assignedQuoteIds
    .map(id => dossier.quotes.find(q => q.id === id))
    .filter((q): q is QuoteCard => Boolean(q));

  const chapterBooks: BookRef[] = chapter.assignedBookIds
    .map(id => dossier.books.find(b => b.id === id))
    .filter((b): b is BookRef => Boolean(b));

  const factsBlock =
    chapterFacts.length > 0
      ? chapterFacts
          .map(
            f =>
              `- [${f.id}] (${f.type}) ${f.claim}${f.value ? ` | Exact Figure: ${f.value}` : ""} | Snippet: "${
                f.snippet
              }" (Source: ${f.source.title}${f.source.year ? `, ${f.source.year}` : ""})`
          )
          .join("\n")
      : "Use logical transitions based on the topic without inventing unverified statistics.";

  const quotesBlock =
    chapterQuotes.length > 0
      ? chapterQuotes
          .map(q => `- [${q.id}] "${q.quote}" — ${q.speaker} (${q.roleOrContext || q.source.title})`)
          .join("\n")
      : "None assigned to this chapter.";

  const booksBlock =
    chapterBooks.length > 0
      ? chapterBooks
          .map(
            b =>
              `- [${b.id}] "${b.title}" by ${b.author} (${b.year || "n.d."}) [Source Level: ${b.sourceLevel}] — ${
                b.relevance
              }${
                b.sourceLevel === "metadata_only"
                  ? " (CRITICAL: Reference ONLY book title, author, and core theme. Do NOT fabricate a verbatim page quote.)"
                  : b.verifiedPassage
                  ? ` | Verified Passage: "${b.verifiedPassage}"`
                  : ""
              }`
          )
          .join("\n")
      : "None assigned to this chapter.";

  const isFinalChapter = chapterIndex === totalChapters - 1;
  const avgSent = recipe.sentenceLengthRange
    ? Math.round((recipe.sentenceLengthRange[0] + recipe.sentenceLengthRange[1]) / 2)
    : 15;

  const prompt = `
    You are writing Chapter ${chapter.chapterNumber} of ${totalChapters}: "${chapter.title}" for a ${
    recipe.creatorName
  }-style documentary on "${topic}" (${angle || topic}).

    VOICE & LANGUAGE RULES:
    - Narration Language: ${language}
    - Production & Style Notes: ${recipe.productionNotes || "Investigative clarity"}
    - Target Sentence Length: ~${avgSent} words per sentence
    - Transition Phrases to weave naturally: ${(recipe.signaturePhrases || []).join(" | ")}
    - Rules: ${recipe.hook.rules.join(" | ")}
    ${
      recipe.creatorId.includes("thynkwhy")
        ? `- CRITICAL ANTI-POETRY & ANTI-RHYME LAW: DO NOT write rhyming poems, couplets, or flowery verses! ThynkWhy is an investigative documentary filmmaker (Muazzam Shah), NOT an Urdu poet. Write natural spoken Urdu/Roman Urdu with real evidence, dates, hospital reports, memoirs ('Shahab Nama'), and brotherly gravitas ("boss", "yaar", "oh bhai", "danke ki chot par", "apne hissay ka kaam").`
        : ""
    }

    WORD BUDGET (STRICT):
    - Write between ${minWords} and ${maxWords} words of spoken narration (Target: ${chapter.targetWords} words).
    - Do NOT pad with generic throat-clearing or repeat the same point in 4 sentences. Every paragraph must advance the argument with concrete evidence.

    CHAPTER PURPOSE:
    ${chapter.purpose}
    ${chapter.openLoopToPlant ? `- PLANT THIS OPEN LOOP QUESTION: "${chapter.openLoopToPlant}"` : ""}
    ${chapter.openLoopToPayOff ? `- PAY OFF THIS OPEN LOOP QUESTION: "${chapter.openLoopToPayOff}"` : ""}

    STORY SO FAR (Prior Chapters — continue seamlessly from here without re-introducing the topic):
    ${
      storySoFar.length > 0
        ? storySoFar.map((s, i) => `Chapter ${i + 1}: ${s}`).join("\n")
        : "This is Chapter 1 (immediately following the cold open hook)."
    }

    ALREADY USED LEDGER (FORBIDDEN TO REPEAT THESE FACTS OR PHRASES):
    - Already used Fact IDs: ${usedLedger.factIds.join(", ") || "None"}
    - Already used metaphors/phrases: ${usedLedger.keyPhrases.slice(-15).join(" | ") || "None"}

    ASSIGNED EVIDENCE FOR THIS CHAPTER ONLY (Cite inline with [F#], [Q#], [B#]):
    FACTS:
    ${factsBlock}

    QUOTES:
    ${quotesBlock}

    BOOKS:
    ${booksBlock}

    STRICT CHAPTER ENDING RULE:
    ${
      isFinalChapter
        ? "This is the FINAL chapter. End with a memorable structural takeaway or citizen question. Never say 'Don't forget to like and subscribe'."
        : "This is NOT the final chapter. Do NOT say 'In conclusion', 'To sum up', or wrap up the video. End on a sharp forward bridge into the next chapter."
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: writtenChapterSchema,
      temperature: 0.35,
      abortSignal: signal
    }
  });

  const parsed = cleanAndParseJSON(response.text || "{}") as {
    text?: string;
    summary2Lines?: string;
    usedFactIds?: string[];
    usedQuoteIds?: string[];
    usedBookIds?: string[];
    keyPhrasesUsed?: string[];
    plantedLoop?: string;
    paidOffLoop?: string;
  };

  const text = (parsed.text || "").trim();
  const actualWords = countWords(text);
  const ratio = actualWords / Math.max(1, chapter.targetWords);
  const lengthStatus: "on_target" | "under_budget" | "over_budget" =
    ratio < 0.85 ? "under_budget" : ratio > 1.15 ? "over_budget" : "on_target";

  const inlineFactMatches = Array.from(text.matchAll(/\[(F\d+)\]/g)).map(m => m[1]);
  const mergedUsedFacts = Array.from(new Set([...(parsed.usedFactIds || []), ...inlineFactMatches]));

  return {
    chapterId: chapter.id,
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    text,
    wordCount: actualWords,
    targetWords: chapter.targetWords,
    summary2Lines: parsed.summary2Lines || `${chapter.title}: ${chapter.purpose}`,
    usedFactIds: mergedUsedFacts,
    usedQuoteIds: parsed.usedQuoteIds || [],
    usedBookIds: parsed.usedBookIds || [],
    plantedLoop: parsed.plantedLoop || chapter.openLoopToPlant,
    paidOffLoop: parsed.paidOffLoop || chapter.openLoopToPayOff,
    lengthStatus
  };
}

/**
 * Step 3 of Long-Form Engine: Runs LAST after all body chapters are written so the Hook
 * only promises payoffs that actually exist in the finished script. Returns 3 Hook Lab variants.
 */
export async function writeHook(options: {
  topic: string;
  angle: string;
  language: string;
  recipe: CreatorRecipe;
  chapterResults: WrittenChapterResult[];
  dossier: Dossier;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<{ activeHookText: string; variants: HookLabVariant[] }> {
  const { topic, angle, language, recipe, chapterResults, dossier, apiKey, signal } = options;
  const ai = getAiClient(apiKey);

  const chapterSummaries = chapterResults
    .map(c => `Chapter ${c.chapterNumber} (${c.title}): ${c.summary2Lines}`)
    .join("\n");

  const topFacts = dossier.facts
    .filter(f => f.status === "pinned" || f.status === "approved")
    .slice(0, 6)
    .map(f => `[${f.id}] ${f.claim}${f.value ? ` (${f.value})` : ""}`)
    .join("\n");

  const hookSeconds = Math.round((recipe.hook.secondsMin + recipe.hook.secondsMax) / 2);
  const targetHookWords = Math.max(95, Math.round((hookSeconds / 60) * 140));

  const prompt = `
    You are writing the Cold Open Hook for a finished documentary on "${topic}" (${angle || topic}).
    NARRATION LANGUAGE: ${language}
    VOICE RECIPE: ${recipe.creatorName} — Preferred Hook Types: ${recipe.hook.types.join(" | ")}
    TARGET HOOK LENGTH: ~${targetHookWords} words (${hookSeconds} seconds of spoken audio).

    FINISHED CHAPTER SUMMARIES (Every promise in your hook MUST be paid off in one of these chapters):
    ${chapterSummaries}

    STRONGEST VERIFIED FACTS AVAILABLE:
    ${topFacts}

    GENERATE 3 DISTINCT HOOK VARIANTS (~${targetHookWords} words each):
    1. "scene": Drops the viewer directly into a vivid dated event, location, or human moment before revealing the systemic question.
    2. "shocking_fact": Opens with a striking, counter-intuitive verified number or paradox ([F#]) and immediately raises the stakes.
    3. "question": Opens with a provocative mystery or everyday contradiction the audience feels, then plants an open loop paid off in Chapter 2 or 3.

    RULES:
    - Never start with "Hello guys", "Welcome back", or "In today's video".
    - Every hook must end by planting a sharp open-loop question that is answered in a specific chapter.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: hookLabSchema,
        temperature: 0.4,
        abortSignal: signal
      }
    });

    const parsed = cleanAndParseJSON(response.text || "{}") as {
      variants?: Array<{
        style?: "scene" | "shocking_fact" | "question";
        label?: string;
        text?: string;
        openLoopQuestion?: string;
        payoffChapterNumber?: number;
      }>;
    };

    const variants: HookLabVariant[] = (parsed.variants || []).map((v, idx) => ({
      id: `HOOK-${idx + 1}`,
      style: v.style || (idx === 0 ? "scene" : idx === 1 ? "shocking_fact" : "question"),
      label:
        v.label ||
        (v.style === "scene"
          ? "Cinematic Scene Cold Open"
          : v.style === "shocking_fact"
          ? "Shocking Verified Stat"
          : "Mystery Question Hook"),
      text: (v.text || "").trim(),
      wordCount: countWords(v.text || ""),
      openLoopQuestion: v.openLoopQuestion || "What hidden mechanism connects these events?",
      payoffChapterNumber: v.payoffChapterNumber || Math.min(2, chapterResults.length)
    }));

    const preferred =
      variants[0] || {
        id: "HOOK-1",
        style: "scene",
        label: "Documentary Cold Open",
        text: chapterResults[0]?.text.split(".").slice(0, 4).join(". ") || topic,
        wordCount: 90,
        openLoopQuestion: "How did we get here?",
        payoffChapterNumber: 2
      };

    return {
      activeHookText: preferred.text,
      variants
    };
  } catch (err) {
    if (isAbortError(err)) throw err;
    const fallbackText = `Look closely at the numbers behind ${topic}. What appears on the surface as an isolated crisis is actually the result of a decades-long chain of decisions—and the real turning point is hidden inside Chapter 2.`;
    const fallbackVariant: HookLabVariant = {
      id: "HOOK-1",
      style: "scene",
      label: "Primary Cold Open",
      text: fallbackText,
      wordCount: countWords(fallbackText),
      openLoopQuestion: `What triggered the hidden turning point in ${topic}?`,
      payoffChapterNumber: Math.min(2, Math.max(1, chapterResults.length))
    };
    return {
      activeHookText: fallbackText,
      variants: [fallbackVariant]
    };
  }
}

/**
 * Expands (<85% budget) or Trims (>115% budget) a single chapter without rewriting the whole script.
 */
export async function expandOrTrimChapter(options: {
  chapterResult: WrittenChapterResult;
  chapterOutline: ChapterOutlineItem;
  action: "expand" | "trim";
  language: string;
  recipe: CreatorRecipe;
  dossier: Dossier;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<WrittenChapterResult> {
  const { chapterResult, chapterOutline, action, language, recipe, dossier, apiKey, signal } = options;
  const ai = getAiClient(apiKey);

  const assignedFacts = chapterOutline.assignedFactIds
    .map(id => dossier.facts.find(f => f.id === id))
    .filter((f): f is FactCard => Boolean(f));

  const prompt = `
    You are editing Chapter ${chapterResult.chapterNumber} ("${chapterResult.title}") of a ${recipe.creatorName}-style script in ${language}.
    CURRENT WORD COUNT: ${chapterResult.wordCount} words
    TARGET WORD COUNT: ${chapterOutline.targetWords} words (Acceptable range: ${Math.round(
    chapterOutline.targetWords * 0.92
  )}–${Math.round(chapterOutline.targetWords * 1.08)} words)
    ACTION REQUIRED: ${
      action === "expand"
        ? `EXPAND this chapter to ~${chapterOutline.targetWords} words by unpacking the assigned evidence, adding concrete cause-and-effect explanation, and citing any unused assigned facts (${assignedFacts
            .map(f => `[${f.id}] ${f.claim}`)
            .join("; ")}). Do NOT add generic fluff.`
        : `TRIM this chapter down to ~${chapterOutline.targetWords} words by cutting repetitive sentences and tightening phrasing while keeping all [F#], [Q#], [B#] citations intact.`
    }

    CURRENT CHAPTER TEXT:
    ${chapterResult.text}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: writtenChapterSchema,
      temperature: 0.3,
      abortSignal: signal
    }
  });

  const parsed = cleanAndParseJSON(response.text || "{}") as {
    text?: string;
    summary2Lines?: string;
    usedFactIds?: string[];
  };

  const updatedText = (parsed.text || chapterResult.text).trim();
  const newWordCount = countWords(updatedText);
  const ratio = newWordCount / Math.max(1, chapterOutline.targetWords);

  return {
    ...chapterResult,
    text: updatedText,
    wordCount: newWordCount,
    summary2Lines: parsed.summary2Lines || chapterResult.summary2Lines,
    lengthStatus: ratio < 0.85 ? "under_budget" : ratio > 1.15 ? "over_budget" : "on_target"
  };
}

/**
 * Checks for cross-chapter duplicate [F#] citations.
 */
export function auditCrossChapterRepetition(chapterResults: WrittenChapterResult[]): string[] {
  const warnings: string[] = [];
  const factFirstSeen = new Map<string, number>();

  for (const chap of chapterResults) {
    const matches = Array.from(chap.text.matchAll(/\[(F\d+)\]/g)).map(m => m[1]);
    const uniqueInChap = Array.from(new Set(matches));
    for (const fid of uniqueInChap) {
      const prevChap = factFirstSeen.get(fid);
      if (prevChap && prevChap !== chap.chapterNumber) {
        warnings.push(
          `Fact [${fid}] is cited in both Chapter ${prevChap} and Chapter ${chap.chapterNumber}.`
        );
      } else {
        factFirstSeen.set(fid, chap.chapterNumber);
      }
    }
  }

  return warnings;
}

/**
 * Stitches the Hook + Chapter results into a complete Voiceover Script and computes style & loop metrics.
 */
export function stitchChapters(options: {
  hookText: string;
  hookVariants: HookLabVariant[];
  chapterResults: WrittenChapterResult[];
  outline: ChapterOutlineItem[];
}): {
  fullVoiceoverText: string;
  totalWords: number;
  repetitionWarnings: string[];
  openLoopsSummary: Array<{
    question: string;
    plantedIn: string;
    paidOffIn: string;
    status: "resolved" | "unpaid";
  }>;
} {
  const { hookText, hookVariants, chapterResults, outline } = options;

  const sections: string[] = [];
  sections.push(`### [COLD OPEN HOOK]\n\n${hookText.trim()}`);

  for (const chap of chapterResults) {
    sections.push(`### Chapter ${chap.chapterNumber}: ${chap.title}\n\n${chap.text.trim()}`);
  }

  const fullVoiceoverText = sections.join("\n\n---\n\n");
  const totalWords = countWords(fullVoiceoverText);
  const repetitionWarnings = auditCrossChapterRepetition(chapterResults);

  const openLoopsSummary: Array<{
    question: string;
    plantedIn: string;
    paidOffIn: string;
    status: "resolved" | "unpaid";
  }> = [];

  const activeVariant = hookVariants.find(v => v.text === hookText) || hookVariants[0];
  if (activeVariant?.openLoopQuestion) {
    const payoffChap = chapterResults.find(c => c.chapterNumber === activeVariant.payoffChapterNumber);
    openLoopsSummary.push({
      question: activeVariant.openLoopQuestion,
      plantedIn: "Cold Open Hook",
      paidOffIn: payoffChap ? `Chapter ${payoffChap.chapterNumber}: ${payoffChap.title}` : "Chapter 2",
      status: "resolved"
    });
  }

  outline.forEach(item => {
    if (item.openLoopToPlant) {
      const payoffOwner = outline.find(
        other =>
          other.chapterNumber > item.chapterNumber &&
          (other.openLoopToPayOff || "").toLowerCase().includes(item.openLoopToPlant!.slice(0, 18).toLowerCase())
      );
      openLoopsSummary.push({
        question: item.openLoopToPlant,
        plantedIn: `Chapter ${item.chapterNumber}: ${item.title}`,
        paidOffIn: payoffOwner
          ? `Chapter ${payoffOwner.chapterNumber}: ${payoffOwner.title}`
          : `Chapter ${Math.min(outline.length, item.chapterNumber + 1)}`,
        status: "resolved"
      });
    }
  });

  return {
    fullVoiceoverText,
    totalWords,
    repetitionWarnings,
    openLoopsSummary
  };
}

/**
 * Generates the ~2.3x Production Script table (Visual directions, B-roll, On-screen text, Source tags, Audio cues)
 * from the finished Hook + Chapters.
 */
export async function buildProductionScript(options: {
  topic: string;
  language: string;
  hookText: string;
  chapterResults: WrittenChapterResult[];
  dossier: Dossier;
  recipe: CreatorRecipe;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<ProductionScriptRow[]> {
  const { topic, hookText, chapterResults, dossier, recipe, apiKey, signal } = options;
  const ai = getAiClient(apiKey);

  const allRows: ProductionScriptRow[] = [];
  let runningSeconds = 0;

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const segmentsToProcess = [
    { id: "HOOK", title: "Cold Open Hook", text: hookText },
    ...chapterResults.map(c => ({
      id: c.chapterId,
      title: `Chapter ${c.chapterNumber}: ${c.title}`,
      text: c.text
    }))
  ];

  for (const seg of segmentsToProcess) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const prompt = `
      Convert this finished documentary voiceover section ("${seg.title}") on "${topic}" into a detailed Production Script table (~2.3x total word density including visual direction, archival B-roll, animated charts/maps, on-screen text callouts, source citations, and music/SFX mood).

      VOICEOVER SECTION TEXT:
      ${seg.text}

      Break the narration into 4 to 7 sequential production beats. Keep the exact spoken narration in 'voiceover', and write rich, concrete editor instructions in 'visualDirection', 'onScreenText', 'sourceTag', and 'audioMood'.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: productionRowsSchema,
          temperature: 0.3,
          abortSignal: signal
        }
      });

      const parsed = cleanAndParseJSON(response.text || "{}") as {
        rows?: Array<{
          timestamp?: string;
          voiceover?: string;
          visualDirection?: string;
          onScreenText?: string;
          sourceTag?: string;
          audioMood?: string;
        }>;
      };

      const rows = parsed.rows || [];
      rows.forEach((r, idx) => {
        const voWords = countWords(r.voiceover || "");
        const durSec = Math.max(8, Math.round((voWords / 140) * 60));
        const startTs = formatSec(runningSeconds);
        runningSeconds += durSec;
        const endTs = formatSec(runningSeconds);

        allRows.push({
          id: `${seg.id}-ROW-${idx + 1}`,
          chapterNumber: seg.id === "HOOK" ? 0 : Number(seg.id.replace("CHAP-", "")) || 1,
          chapterTitle: seg.title,
          timestamp: `${startTs} - ${endTs}`,
          voiceover: r.voiceover || "",
          visualDirection:
            r.visualDirection ||
            "Archival B-roll + slow push-in on documentary evidence card with highlighted figures.",
          onScreenText: r.onScreenText || seg.title,
          sourceTag: r.sourceTag || "Verified Dossier Source",
          audioMood: r.audioMood || `${recipe.creatorName} investigative pulse + subtle riser`
        });
      });
    } catch (err) {
      if (isAbortError(err)) throw err;
      const paragraphs = seg.text
        .split(/\n+/)
        .map(p => p.trim())
        .filter(Boolean);
      paragraphs.forEach((p, idx) => {
        const voWords = countWords(p);
        const durSec = Math.max(10, Math.round((voWords / 140) * 60));
        const startTs = formatSec(runningSeconds);
        runningSeconds += durSec;
        const endTs = formatSec(runningSeconds);
        const factMatch = p.match(/\[(F\d+)\]/);
        const matchedFact = factMatch ? dossier.facts.find(f => f.id === factMatch[1]) : undefined;

        allRows.push({
          id: `${seg.id}-ROW-${idx + 1}`,
          chapterNumber: seg.id === "HOOK" ? 0 : Number(seg.id.replace("CHAP-", "")) || 1,
          chapterTitle: seg.title,
          timestamp: `${startTs} - ${endTs}`,
          voiceover: p,
          visualDirection: matchedFact
            ? `Full-screen data callout card highlighting ${matchedFact.value || matchedFact.claim} over archival B-roll.`
            : `Cinematic documentary B-roll and kinetic typography illustrating ${seg.title}.`,
          onScreenText: matchedFact?.value || seg.title,
          sourceTag: matchedFact ? `${matchedFact.id}: ${matchedFact.source.title}` : "Dossier Archive",
          audioMood: "Low investigative drone + subtle document paper SFX"
        });
      });
    }
  }

  return allRows;
}
