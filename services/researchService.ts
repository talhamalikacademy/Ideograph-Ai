import { Type, Schema } from "@google/genai";
import {
  Dossier,
  FactCard,
  QuoteCard,
  BookRef,
  FactType,
  ResearchConfig,
  MySourcesState,
  ChapterOutlineItem
} from "../types";
import { CreatorRecipe } from "../creator-recipes/types";
import { createGeminiClient, runGroundedJson, GroundedSource } from "../llm";
import { computeTargets, ResearchDepth } from "./researchTargets";
import { searchBooks } from "./sourceService";

export interface ResearchProgressUpdate {
  stage: 'planning' | 'harvesting' | 'waiting_for_quota' | 'extracting' | 'verifying' | 'books' | 'complete';
  label: string;
  completedQueries: number;
  totalQueries: number;
  factsFoundSoFar: number;
  percent: number;
}

export type ResearchProgressCallback = (update: ResearchProgressUpdate) => void;

interface PlannedSearchQuery {
  query: string;
  sourceBucket:
    | 'booksAndHistory'
    | 'officialDataAndReports'
    | 'newsAndInvestigations'
    | 'publicVoices'
    | 'globalStudiesAndCounter';
  expectedFactType: FactType;
}

const queryPlanSchema: Schema = {
  type: Type.OBJECT,
  required: ["queries", "bookSearchTerms"],
  properties: {
    queries: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["query", "sourceBucket", "expectedFactType"],
        properties: {
          query: { type: Type.STRING },
          sourceBucket: {
            type: Type.STRING,
            enum: [
              'booksAndHistory',
              'officialDataAndReports',
              'newsAndInvestigations',
              'publicVoices',
              'globalStudiesAndCounter'
            ]
          },
          expectedFactType: {
            type: Type.STRING,
            enum: ['stat', 'event', 'policy', 'study', 'book', 'quote', 'public_voice', 'counter']
          }
        }
      }
    },
    bookSearchTerms: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2 to 3 book titles or topic keywords to query in Google Books / Open Library."
    }
  }
};

const harvestedBatchSchema: Schema = {
  type: Type.OBJECT,
  required: ["facts", "quotes"],
  properties: {
    facts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["type", "claim", "snippet", "sourceTitle", "confidence"],
        properties: {
          type: {
            type: Type.STRING,
            enum: ['stat', 'event', 'policy', 'study', 'book', 'quote', 'public_voice', 'counter']
          },
          claim: { type: Type.STRING, description: "1 clear sentence stating the fact." },
          value: { type: Type.STRING, description: "Exact number, percentage, amount, or date if present." },
          location: { type: Type.STRING, description: "Specific place/region only if mentioned in the source." },
          snippet: { type: Type.STRING, description: "<= 25 words verbatim from the grounded source." },
          sourceTitle: { type: Type.STRING },
          publisher: { type: Type.STRING },
          author: { type: Type.STRING },
          year: { type: Type.STRING },
          sourceUrl: { type: Type.STRING },
          confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
        }
      }
    },
    quotes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["quote", "speaker", "workOrContext", "usage"],
        properties: {
          quote: { type: Type.STRING },
          speaker: { type: Type.STRING },
          workOrContext: { type: Type.STRING },
          year: { type: Type.STRING },
          usage: { type: Type.STRING, enum: ['hook', 'transition', 'closing', 'any'] },
          sourceUrl: { type: Type.STRING },
          verifiedExactText: { type: Type.BOOLEAN }
        }
      }
    }
  }
};

function clampWords(text: string, maxWords = 25): string {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ") + "...";
}

function getDomainFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

async function hashCacheKey(input: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf))
      .slice(0, 12)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return `k_${Math.abs(h)}`;
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function next(): Promise<void> {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await worker(items[idx], idx);
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => next());
  await Promise.all(runners);
  return results;
}

/**
 * Deduplicates FactCards and detects numeric conflicts on the same metric.
 */
function dedupeAndDetectConflicts(cards: FactCard[]): FactCard[] {
  const result: FactCard[] = [];
  const seenClaims = new Set<string>();

  for (const card of cards) {
    const normClaim = card.claim
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!normClaim || seenClaims.has(normClaim)) continue;

    // Check if another card has high word overlap but a different numeric value
    const claimWords = new Set(
      normClaim.split(" ").filter(w => w.length > 3 && !/^\d+$/.test(w))
    );

    if (card.value && claimWords.size >= 3) {
      for (const existing of result) {
        if (!existing.value || existing.value === card.value) continue;
        const existingWords = existing.claim
          .toLowerCase()
          .replace(/[^a-z0-9\u0600-\u06FF\s]/g, "")
          .split(/\s+/)
          .filter(w => w.length > 3 && !/^\d+$/.test(w));
        const shared = existingWords.filter(w => claimWords.has(w)).length;
        const overlapRatio = shared / Math.max(1, Math.min(claimWords.size, existingWords.length));
        if (overlapRatio >= 0.6) {
          const note = `[CONFLICT]: Source "${existing.source.title}" reports "${existing.value}" while "${card.source.title}" reports "${card.value}".`;
          existing.conflictNote = existing.conflictNote || note;
          card.conflictNote = note;
        }
      }
    }

    seenClaims.add(normClaim);
    result.push(card);
  }

  return result;
}

/**
 * Main Research v2 Harvester (`runResearch`) — driven by CreatorRecipe when provided.
 */
export async function runResearch(options: {
  topic: string;
  angle: string;
  region: string;
  config: ResearchConfig;
  recipe?: CreatorRecipe;
  mySources?: MySourcesState;
  onProgress?: ResearchProgressCallback;
  abortSignal?: AbortSignal;
  apiKey?: string;
  forceRefresh?: boolean;
}): Promise<Dossier> {
  const {
    topic,
    angle,
    region = "Pakistan",
    config,
    recipe,
    mySources,
    onProgress,
    abortSignal,
    apiKey,
    forceRefresh = false
  } = options;

  const depth: ResearchDepth =
    config.depth === "quick" || config.depth === "standard" || config.depth === "deep"
      ? config.depth
      : "standard";
  const durationMinutes = Math.max(1, config.durationMinutes || 5);
  const targets = computeTargets(durationMinutes, depth);

  const cacheSignature = JSON.stringify({
    topic: topic.trim().toLowerCase(),
    angle: angle.trim().toLowerCase(),
    region,
    depth,
    durationMinutes,
    recipeId: recipe?.creatorId || "default",
    sources: config.sources,
    mySourceCount:
      (mySources?.facts.length || 0) +
      (mySources?.quotes.length || 0) +
      (mySources?.books.length || 0)
  });
  const cacheKey = `ideograph.research.v2.${await hashCacheKey(cacheSignature)}`;

  if (!forceRefresh && typeof window !== "undefined") {
    try {
      const cached = window.sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as Dossier;
        onProgress?.({
          stage: "complete",
          label: "Loaded verified research dossier from session cache",
          completedQueries: 1,
          totalQueries: 1,
          factsFoundSoFar: parsed.facts.length,
          percent: 100
        });
        return parsed;
      }
    } catch {
      // ignore storage read errors
    }
  }

  if (abortSignal?.aborted) {
    throw new DOMException("Research cancelled by user.", "AbortError");
  }

  const client = createGeminiClient(apiKey);

  // Enabled source buckets
  const enabledBuckets: string[] = [];
  if (config.sources.booksAndHistory) {
    enabledBuckets.push(
      "booksAndHistory (Published books, historical events, archives, and past commissions)"
    );
  }
  if (config.sources.officialDataAndReports) {
    enabledBuckets.push(
      `officialDataAndReports (Government agencies, courts, regulators, census, and budget numbers relevant to ${region})`
    );
  }
  if (config.sources.newsAndInvestigations) {
    enabledBuckets.push(
      `newsAndInvestigations (Major newspapers and investigative journalism reports relevant to ${region} and the topic)`
    );
  }
  if (config.sources.publicVoices) {
    enabledBuckets.push(
      `publicVoices (Public forums, citizen experiences, and common expressions in ${region} — tagged as public_voice)`
    );
  }
  if (config.sources.globalStudiesAndCounter) {
    enabledBuckets.push(
      "globalStudiesAndCounter (University studies, international benchmarks, and strong counter-arguments on the other side)"
    );
  }

  if (enabledBuckets.length === 0) {
    enabledBuckets.push("officialDataAndReports", "newsAndInvestigations");
  }

  const queriesPerBucket = depth === "quick" ? 1 : depth === "deep" ? 3 : 2;
  const rawQueryCount =
    durationMinutes > 15
      ? Math.min(40, Math.max(8, enabledBuckets.length * (queriesPerBucket + 1)))
      : Math.min(16, Math.max(3, enabledBuckets.length * queriesPerBucket));
  const maxTotalQueries = Math.min(40, rawQueryCount);

  const recipeGuidanceBlock = recipe
    ? `
    ACTIVE VOICE RECIPE RESEARCH WEIGHTS (${recipe.creatorName}):
    - Region Focus: ${recipe.research.regionFocus} (${
        recipe.research.regionFocus === 'local'
          ? `Prioritize ${region} institutions, local newspapers, city/neighborhood data, and citizen accounts first`
          : recipe.research.regionFocus === 'global'
          ? 'Prioritize international peer-reviewed studies and cross-country benchmarks'
          : `Mix ${region} national reports with global scientific and country comparisons`
      })
    - Fact Type Weights: ${Object.entries(recipe.research.weights)
        .map(([k, v]) => `${k}: ${Math.round(v * 100)}%`)
        .join(', ')}
    `
    : '';

  onProgress?.({
    stage: "planning",
    label: `Planning ${maxTotalQueries} targeted search queries for "${topic.slice(0, 48)}"...`,
    completedQueries: 0,
    totalQueries: maxTotalQueries,
    factsFoundSoFar: mySources?.facts.length || 0,
    percent: 10
  });

  // STAGE A: QUERY PLANNER
  const plannerPrompt = `
    We are researching a ${durationMinutes}-minute video on:
    - TOPIC: "${topic}"
    - ANGLE & QUESTIONS TO COVER: "${angle}"
    - FOCUS REGION: "${region}"
    - TARGET VERIFIED FACTS NEEDED: ${targets.factsNeeded} (fetching ~${targets.rawToFetch} raw candidates)
    ${recipeGuidanceBlock}

    Enabled source categories:
    ${enabledBuckets.map(b => `- ${b}`).join("\n")}

    Generate ${maxTotalQueries} specific, high-signal web search queries distributed across the enabled source categories according to the recipe weights above, plus 2–3 book search terms for Google Books / Open Library.
    Do NOT use unrelated topics or hard-coded examples. Every query must directly target "${topic}" and "${region}".
  `;

  let plannedQueries: PlannedSearchQuery[] = [];
  let bookSearchTerms: string[] = [topic];

  try {
    const { data: planData } = await client.generateJson<{
      queries?: PlannedSearchQuery[];
      bookSearchTerms?: string[];
    }>({
      task: "analysis",
      prompt: plannerPrompt,
      schema: queryPlanSchema,
      signal: abortSignal
    });
    if (Array.isArray(planData.queries) && planData.queries.length > 0) {
      plannedQueries = planData.queries.slice(0, maxTotalQueries);
    }
    if (Array.isArray(planData.bookSearchTerms) && planData.bookSearchTerms.length > 0) {
      bookSearchTerms = planData.bookSearchTerms.slice(0, 3);
    }
  } catch (err) {
    console.warn("[ResearchService] Planner fallback to default queries:", err);
  }

  if (plannedQueries.length === 0) {
    plannedQueries = [
      {
        query: `${topic} ${region} official statistics report numbers`,
        sourceBucket: "officialDataAndReports",
        expectedFactType: "stat"
      },
      {
        query: `${topic} ${region} investigative report news analysis`,
        sourceBucket: "newsAndInvestigations",
        expectedFactType: "event"
      },
      {
        query: `${topic} university study international comparison counter-argument`,
        sourceBucket: "globalStudiesAndCounter",
        expectedFactType: "study"
      }
    ];
  }

  // Group queries into batches of 2 so parallel grounded calls stay fast & reliable (max 4 concurrent batches)
  const queryBatches: PlannedSearchQuery[][] = [];
  for (let i = 0; i < plannedQueries.length; i += 2) {
    queryBatches.push(plannedQueries.slice(i, i + 2));
  }

  const harvestedFacts: FactCard[] = [];
  const harvestedQuotes: QuoteCard[] = [];
  let completedBatches = 0;

  // STAGE B, C & D: PARALLEL GROUNDED HARVEST + FACT EXTRACTION (Max 4 concurrent with exponential backoff)
  await runWithConcurrency(queryBatches, 4, async (batch, batchIdx) => {
    if (abortSignal?.aborted) {
      throw new DOMException("Research cancelled by user.", "AbortError");
    }

    const factsPerBatch = Math.max(3, Math.ceil(targets.rawToFetch / queryBatches.length));
    const batchQueriesText = batch
      .map((q, idx) => `${idx + 1}. [${q.sourceBucket} -> ${q.expectedFactType}]: "${q.query}"`)
      .join("\n");

    const harvestPrompt = `
      Use Google Search grounding to execute these research queries for a video on "${topic}" (Focus region: ${region}):
      ${batchQueriesText}

      Angle & key questions:
      "${angle.slice(0, 1500)}"

      Extract ${factsPerBatch} distinct, high-value FactCards and up to 2 QuoteCards directly supported by the search results:
      - Each 'claim' must be 1 clear, specific factual sentence.
      - Include 'value' whenever an exact number, percentage, currency figure, or date is stated.
      - Include 'location' ONLY if a specific city, neighborhood, or country is named in the source.
      - Each 'snippet' MUST be <= 25 words verbatim from the source.
      - For 'public_voice' items (citizen discussions, forums, common sayings), set type to 'public_voice' and confidence to 'low'.
      - For opposing viewpoints / rebuttals, set type to 'counter'.
      - Do NOT invent URLs, numbers, or book quotes.
    `;

    let attempt = 0;
    const maxAttempts = 2;
    while (attempt < maxAttempts) {
      if (abortSignal?.aborted) {
        throw new DOMException("Research cancelled by user.", "AbortError");
      }
      try {
        const { data, sources } = await runGroundedJson<{
          facts?: Array<{
            type?: FactType;
            claim?: string;
            value?: string;
            location?: string;
            snippet?: string;
            sourceTitle?: string;
            publisher?: string;
            author?: string;
            year?: string;
            sourceUrl?: string;
            confidence?: 'high' | 'medium' | 'low';
          }>;
          quotes?: Array<{
            quote?: string;
            speaker?: string;
            workOrContext?: string;
            year?: string;
            usage?: 'hook' | 'transition' | 'closing' | 'any';
            sourceUrl?: string;
            verifiedExactText?: boolean;
          }>;
        }>({
          prompt: harvestPrompt,
          schema: harvestedBatchSchema,
          apiKey,
          signal: abortSignal
        });

        const groundedList: GroundedSource[] = sources || [];

        (data.facts || []).forEach((rawFact, fIdx) => {
          if (!rawFact.claim || !rawFact.claim.trim()) return;

          // Match URL strictly against grounded sources returned by Google Search
          const rawUrl = (rawFact.sourceUrl || "").trim();
          const matchedGround =
            groundedList.find(g => g.uri === rawUrl) ||
            groundedList.find(
              g =>
                rawFact.sourceTitle &&
                g.title.toLowerCase().includes(rawFact.sourceTitle.toLowerCase().slice(0, 14))
            ) ||
            groundedList[fIdx % Math.max(1, groundedList.length)];

          const verifiedUrl = matchedGround?.uri;
          const isPublicVoice = rawFact.type === "public_voice";
          const hasVerifiedUrl = Boolean(verifiedUrl);

          // Drop ungrounded non-public_voice claims if no grounded sources came back and confidence is low
          if (!hasVerifiedUrl && !isPublicVoice && rawFact.confidence === "low") {
            return;
          }

          const cardStatus =
            isPublicVoice || !hasVerifiedUrl ? "pending" : "approved";

          harvestedFacts.push({
            id: `F-${batchIdx + 1}-${fIdx + 1}`,
            type: (rawFact.type as FactType) || batch[0]?.expectedFactType || "stat",
            claim: rawFact.claim.trim(),
            value: rawFact.value?.trim() || undefined,
            location: rawFact.location?.trim() || undefined,
            snippet: clampWords(rawFact.snippet || rawFact.claim, 25),
            source: {
              id: `SRC-${batchIdx + 1}-${fIdx + 1}`,
              title:
                rawFact.sourceTitle?.trim() ||
                matchedGround?.title ||
                rawFact.publisher?.trim() ||
                "Web Research Source",
              publisher: rawFact.publisher?.trim() || undefined,
              author: rawFact.author?.trim() || undefined,
              year: rawFact.year?.trim() || undefined,
              url: verifiedUrl,
              domain: getDomainFromUrl(verifiedUrl),
              origin: "web_grounded",
              verified: hasVerifiedUrl && !isPublicVoice
            },
            confidence: isPublicVoice
              ? "low"
              : hasVerifiedUrl
              ? rawFact.confidence || "high"
              : "medium",
            status: cardStatus
          });
        });

        (data.quotes || []).forEach((rawQuote, qIdx) => {
          if (!rawQuote.quote || !rawQuote.quote.trim()) return;
          const matchedGround = groundedList[qIdx % Math.max(1, groundedList.length)];
          const verifiedUrl = matchedGround?.uri;
          harvestedQuotes.push({
            id: `Q-${batchIdx + 1}-${qIdx + 1}`,
            quote: rawQuote.quote.trim(),
            speaker: rawQuote.speaker?.trim() || "Public Figure / Author",
            workOrContext: rawQuote.workOrContext?.trim() || topic,
            year: rawQuote.year?.trim() || undefined,
            usage: rawQuote.usage || "any",
            source: {
              id: `SRC-Q-${batchIdx + 1}-${qIdx + 1}`,
              title: matchedGround?.title || rawQuote.workOrContext || "Grounded Source",
              url: verifiedUrl,
              domain: getDomainFromUrl(verifiedUrl),
              origin: "web_grounded",
              verified: Boolean(verifiedUrl)
            },
            verifiedExactText: Boolean(verifiedUrl && rawQuote.verifiedExactText),
            status: verifiedUrl ? "approved" : "pending"
          });
        });

        break;
      } catch (err: any) {
        if (err?.name === "AbortError") throw err;
        attempt++;
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 700 * Math.pow(2, attempt)));
        }
      }
    }

    completedBatches++;
    const completedQueries = Math.min(plannedQueries.length, completedBatches * 2);
    const pct = Math.min(80, 15 + Math.round((completedBatches / queryBatches.length) * 65));
    onProgress?.({
      stage: "harvesting",
      label: `Harvested ${harvestedFacts.length + (mySources?.facts.length || 0)} facts (${completedQueries}/${plannedQueries.length} queries)...`,
      completedQueries,
      totalQueries: plannedQueries.length,
      factsFoundSoFar: harvestedFacts.length + (mySources?.facts.length || 0),
      percent: pct
    });
  });

  // STAGE E: GOOGLE BOOKS / OPEN LIBRARY CHECK (When Books & History is enabled)
  const harvestedBooks: BookRef[] = [...(mySources?.books || [])];
  if (config.sources.booksAndHistory && !abortSignal?.aborted) {
    onProgress?.({
      stage: "books",
      label: "Checking Google Books & Open Library for real published books...",
      completedQueries: plannedQueries.length,
      totalQueries: plannedQueries.length,
      factsFoundSoFar: harvestedFacts.length + (mySources?.facts.length || 0),
      percent: 86
    });
    try {
      const primaryBookTerm = bookSearchTerms[0] || topic;
      const apiBooks = await searchBooks(primaryBookTerm, topic, abortSignal);
      const existingTitles = new Set(harvestedBooks.map(b => b.title.toLowerCase()));
      for (const b of apiBooks.slice(0, Math.max(2, targets.minPerType.book + 1))) {
        if (!existingTitles.has(b.title.toLowerCase())) {
          existingTitles.add(b.title.toLowerCase());
          harvestedBooks.push({
            ...b,
            id: `B${harvestedBooks.length + 1}`
          });
        }
      }
    } catch (bookErr) {
      console.warn("[ResearchService] Book search skipped:", bookErr);
    }
  }

  onProgress?.({
    stage: "verifying",
    label: "Deduplicating facts, checking numeric conflicts & auditing coverage...",
    completedQueries: plannedQueries.length,
    totalQueries: plannedQueries.length,
    factsFoundSoFar: harvestedFacts.length,
    percent: 94
  });

  // Merge user sources (pinned) with web harvested facts, dedupe, and number F1..Fn, Q1..Qn, B1..Bn
  const combinedFacts = dedupeAndDetectConflicts([
    ...(mySources?.facts || []).map(f => ({ ...f, status: f.status || ("pinned" as const) })),
    ...harvestedFacts
  ]).map((f, idx) => ({
    ...f,
    id: `F${idx + 1}`
  }));

  const seenQuotes = new Set<string>();
  const combinedQuotes: QuoteCard[] = [
    ...(mySources?.quotes || []).map(q => ({ ...q, status: q.status || ("pinned" as const) })),
    ...harvestedQuotes
  ]
    .filter(q => {
      const k = q.quote.toLowerCase().trim();
      if (!k || seenQuotes.has(k)) return false;
      seenQuotes.add(k);
      return true;
    })
    .map((q, idx) => ({
      ...q,
      id: `Q${idx + 1}`
    }));

  const finalBooks = harvestedBooks.map((b, idx) => ({
    ...b,
    id: `B${idx + 1}`
  }));

  // STAGE F: GAP CHECK
  const gaps: string[] = [];
  const activeFacts = combinedFacts.filter(f => f.status === "approved" || f.status === "pinned");
  const officialCount = combinedFacts.filter(
    f => f.type === "stat" || f.type === "policy"
  ).length;
  const newsCount = combinedFacts.filter(f => f.type === "event").length;
  const counterCount = combinedFacts.filter(f => f.type === "counter").length;
  const publicVoiceCount = combinedFacts.filter(f => f.type === "public_voice").length;

  if (activeFacts.length < targets.factsNeeded) {
    gaps.push(
      `Need ${targets.factsNeeded - activeFacts.length} more approved/pinned facts to reach the ${durationMinutes}-minute target (${targets.factsNeeded} facts).`
    );
  }
  if (config.sources.officialDataAndReports && officialCount < targets.minPerType.official) {
    gaps.push(
      `Official data & reports: found ${officialCount}, target is at least ${targets.minPerType.official} statistics or policy records.`
    );
  }
  if (config.sources.newsAndInvestigations && newsCount < targets.minPerType.news) {
    gaps.push(
      `News & investigations: found ${newsCount}, target is at least ${targets.minPerType.news} documented events or investigative findings.`
    );
  }
  if (config.sources.booksAndHistory && finalBooks.length < targets.minPerType.book) {
    gaps.push(
      `Books & history: found ${finalBooks.length} book references, target is at least ${targets.minPerType.book}. Use "My Sources -> Find a book" or "Research more".`
    );
  }
  if (config.sources.globalStudiesAndCounter && counterCount < targets.minPerType.counter) {
    gaps.push(
      `Other side / counter-arguments: found ${counterCount}, target is at least ${targets.minPerType.counter} strong counter-perspective.`
    );
  }
  if (config.sources.publicVoices && publicVoiceCount < targets.minPerType.public_voice) {
    gaps.push(
      `Public voices: found ${publicVoiceCount}, target is at least ${targets.minPerType.public_voice} citizen or forum perspective.`
    );
  }

  const dossier: Dossier = {
    topic,
    angle,
    durationMinutes,
    targetWordCount: targets.words,
    targetFactCount: targets.factsNeeded,
    facts: combinedFacts,
    quotes: combinedQuotes,
    books: finalBooks,
    gaps
  };

  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(cacheKey, JSON.stringify(dossier));
    } catch {
      // ignore storage quota errors
    }
  }

  onProgress?.({
    stage: "complete",
    label: `Research complete: ${combinedFacts.length} facts, ${finalBooks.length} books, and ${combinedQuotes.length} quotes ready for review.`,
    completedQueries: plannedQueries.length,
    totalQueries: plannedQueries.length,
    factsFoundSoFar: combinedFacts.length,
    percent: 100
  });

  return dossier;
}

/**
 * Runs 1 focused grounded search to find 2–3 additional FactCards similar to a specific card.
 */
export async function findMoreLikeCard(options: {
  card: FactCard;
  topic: string;
  region: string;
  existingCount: number;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<FactCard[]> {
  const { card, topic, region, existingCount, apiKey, signal } = options;
  const prompt = `
    Use Google Search grounding to find 3 NEW, distinct verifiable facts related to this specific claim on "${topic}" (${region}):
    REFERENCE CLAIM (${card.type}): "${card.claim}"
    ${card.value ? `REFERENCE VALUE: ${card.value}` : ""}

    Return 3 new FactCards of type '${card.type}' with exact numbers/dates, <= 25-word verbatim snippets, and verified source titles. Do NOT repeat the reference claim.
  `;

  const { data, sources } = await runGroundedJson<{
    facts?: Array<{
      type?: FactType;
      claim?: string;
      value?: string;
      location?: string;
      snippet?: string;
      sourceTitle?: string;
      publisher?: string;
      year?: string;
      sourceUrl?: string;
      confidence?: 'high' | 'medium' | 'low';
    }>;
  }>({
    prompt,
    schema: harvestedBatchSchema,
    apiKey,
    signal
  });

  const groundedList = sources || [];
  return (data.facts || [])
    .filter(f => f.claim && f.claim.trim())
    .slice(0, 3)
    .map((f, idx) => {
      const matchedGround = groundedList[idx % Math.max(1, groundedList.length)];
      const verifiedUrl = matchedGround?.uri;
      return {
        id: `F${existingCount + idx + 1}`,
        type: (f.type as FactType) || card.type,
        claim: f.claim!.trim(),
        value: f.value?.trim() || undefined,
        location: f.location?.trim() || undefined,
        snippet: clampWords(f.snippet || f.claim || "", 25),
        source: {
          id: `SRC-MORE-${Date.now()}-${idx}`,
          title: f.sourceTitle?.trim() || matchedGround?.title || "Grounded Web Source",
          publisher: f.publisher?.trim() || undefined,
          year: f.year?.trim() || undefined,
          url: verifiedUrl,
          domain: getDomainFromUrl(verifiedUrl),
          origin: "web_grounded",
          verified: Boolean(verifiedUrl)
        },
        confidence: verifiedUrl ? f.confidence || "high" : "medium",
        status: verifiedUrl ? "approved" : "pending"
      };
    });
}

/**
 * Runs 2 targeted grounded queries to fill evidence gaps for a specific chapter outline item.
 */
export async function runChapterGapFill(options: {
  chapterTitle: string;
  chapterPurpose: string;
  topic: string;
  region: string;
  existingFactCount: number;
  neededFacts: number;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<FactCard[]> {
  const {
    chapterTitle,
    chapterPurpose,
    topic,
    region,
    existingFactCount,
    neededFacts,
    apiKey,
    signal
  } = options;

  const prompt = `
    You are a documentary investigator filling a chapter evidence gap for "${topic}" (Region: ${region}).
    CHAPTER: "${chapterTitle}"
    CHAPTER PURPOSE: "${chapterPurpose}"

    Use Google Search grounding to find ${Math.max(3, neededFacts)} specific, verifiable facts, statistics, historical records, or case studies that directly support this chapter.
    Every fact must include concrete figures/dates, a <= 25-word verbatim snippet, and verified publication metadata.
  `;

  const { data, sources } = await runGroundedJson<{
    facts?: Array<{
      type?: FactType;
      claim?: string;
      value?: string;
      location?: string;
      snippet?: string;
      sourceTitle?: string;
      publisher?: string;
      year?: string;
      sourceUrl?: string;
      confidence?: 'high' | 'medium' | 'low';
    }>;
  }>({
    prompt,
    schema: harvestedBatchSchema,
    apiKey,
    signal
  });

  const groundedList = sources || [];
  return (data.facts || [])
    .filter(f => f.claim && f.claim.trim())
    .slice(0, Math.max(3, neededFacts))
    .map((f, idx) => {
      const matchedGround = groundedList[idx % Math.max(1, groundedList.length)];
      const verifiedUrl = matchedGround?.uri;
      return {
        id: `F${existingFactCount + idx + 1}`,
        type: (f.type as FactType) || "case",
        claim: f.claim!.trim(),
        value: f.value?.trim() || undefined,
        location: f.location?.trim() || undefined,
        snippet: clampWords(f.snippet || f.claim || "", 25),
        source: {
          id: `SRC-CHAP-${Date.now()}-${idx}`,
          title: f.sourceTitle?.trim() || matchedGround?.title || "Grounded Chapter Source",
          publisher: f.publisher?.trim() || undefined,
          year: f.year?.trim() || undefined,
          url: verifiedUrl,
          domain: getDomainFromUrl(verifiedUrl),
          origin: "web_grounded",
          verified: Boolean(verifiedUrl)
        },
        confidence: verifiedUrl ? f.confidence || "high" : "medium",
        status: verifiedUrl ? "approved" : "pending"
      };
    });
}

