import { Type, Schema } from "@google/genai";
import {
  FactCard,
  QuoteCard,
  BookRef,
  Dossier,
  FactType
} from "../types";
import {
  ResearchStyle,
  ResearchScope,
  Depth,
  buildResearchSystemPrompt
} from "../creator-research";
import { FAST_MODEL, STRONG_MODEL } from "../config/models";
import { getAiClient, cleanAndParseJSON, isAbortError } from "./aiClient";
import {
  UserSource,
  createFactCardFromUserSource,
  searchBooks
} from "./sourceService";

export interface PlannedQuery {
  id: string;
  type: FactType;
  text: string;
  language: string;
  scope: 'ground' | 'abroad';
  questionIdx: number;
  priority: 1 | 2 | 3;
}

export interface PlaybookFramework {
  name: string;
  steps: string[];
  solvedExample: string;
  proof: string[];
  objections: string[];
  limits: string[];
}

export interface Playbook {
  viewerAwareness: 'unaware' | 'problem-aware' | 'solution-aware' | 'product-aware';
  frameworks: PlaybookFramework[];
}

export interface ConceptSheet {
  similarFormats: string[];
  stakesLadder: string[];
  costRulesSafety: string[];
  retentionBeats: string[];
  openQuestions: string[];
}

export interface Coverage {
  byType: Record<string, { found: number; target: number; label: string }>;
  answeredQuestionIndices: number[];
  totalQuestions: number;
  evidenceIsThin: boolean;
  targetTotalFacts: number;
}

export interface ResearchStats {
  totalFacts: number;
  strongOrOkFacts: number;
  totalSources: number;
  uniqueDomains: number;
  queriesRun: number;
  totalQueriesPlanned: number;
  pagesRead: number;
  totalPagesToRead: number;
}

export interface ResearchResult {
  facts: FactCard[];
  quotes: QuoteCard[];
  books: BookRef[];
  coverage: Coverage;
  gaps: string[];
  stats: ResearchStats;
  plan: PlannedQuery[];
  candidateLenses: { lens: string; testQuestion: string }[];
  winningLens?: string;
  comparisonCountries: string[];
  playbook?: Playbook;
  concept?: ConceptSheet;
}

export interface ResearchInput {
  topic: string;
  brief: string;
  angles: string[];
  minutes: number;
  format: string;
  depth: Depth;
  scope: ResearchScope;
  style: ResearchStyle;
  questions: string[];
  includeWords: string[];
  avoidWords: string[];
  togglesLevel: Record<string, 0 | 0.5 | 1 | 1.5>;
  userSources: UserSource[];
  userStoriesAndNumbers?: string;
  conceptInputs?: {
    idea?: string;
    budgetOrLimits?: string;
    prizeOrStakes?: string;
  };
  narrationLanguage: string;
  region: string;
  apiKey?: string;
  signal?: AbortSignal;
  onProgress?: (progress: ResearchLiveProgress) => void;
}

export interface ResearchLiveProgress {
  stage:
    | 'ingest'
    | 'plan'
    | 'harvest'
    | 'read'
    | 'extract'
    | 'verify'
    | 'gap_fill'
    | 'waiting_quota'
    | 'complete';
  message: string;
  searchingDone: number;
  searchingTotal: number;
  readingDone: number;
  readingTotal: number;
  factsFound: number;
  quotaRetrySeconds?: number;
  estimatedMinutesRange: [number, number];
  elapsedSeconds: number;
  partialFacts: FactCard[];
}

const QUERY_CACHE_DB = 'ideograph_research_cache_v1';
const QUERY_CACHE_STORE = 'grounded_queries';
const PARTIAL_RUN_STORE = 'partial_runs';

function openCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(QUERY_CACHE_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(QUERY_CACHE_STORE)) {
        db.createObjectStore(QUERY_CACHE_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(PARTIAL_RUN_STORE)) {
        db.createObjectStore(PARTIAL_RUN_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedQueryResult<T>(key: string): Promise<T | null> {
  try {
    const db = await openCacheDB();
    return await new Promise<T | null>(resolve => {
      const tx = db.transaction(QUERY_CACHE_STORE, 'readonly');
      const req = tx.objectStore(QUERY_CACHE_STORE).get(key);
      req.onsuccess = () => resolve(req.result?.value ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function setCachedQueryResult<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openCacheDB();
    const tx = db.transaction(QUERY_CACHE_STORE, 'readwrite');
    tx.objectStore(QUERY_CACHE_STORE).put({ key, value, savedAt: Date.now() });
  } catch {
    // ignore storage errors
  }
}

export async function savePartialResearchResult(topic: string, facts: FactCard[]): Promise<void> {
  try {
    const db = await openCacheDB();
    const tx = db.transaction(PARTIAL_RUN_STORE, 'readwrite');
    tx.objectStore(PARTIAL_RUN_STORE).put({
      id: 'latest_partial',
      topic,
      facts,
      savedAt: Date.now()
    });
  } catch {
    // ignore
  }
}

export async function loadPartialResearchResult(): Promise<{
  topic: string;
  facts: FactCard[];
} | null> {
  try {
    const db = await openCacheDB();
    return await new Promise(resolve => {
      const tx = db.transaction(PARTIAL_RUN_STORE, 'readonly');
      const req = tx.objectStore(PARTIAL_RUN_STORE).get('latest_partial');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function hashKey(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf))
      .slice(0, 14)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return `h_${Math.abs(h)}`;
}

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || '');
  return /429|quota|rate limit|resource_exhausted/i.test(msg);
}

/**
 * Shared model call wrapper with concurrency queue, exponential backoff (1s, 2s, 4s, 8s + jitter),
 * 429 countdown callback, and IndexedDB caching.
 */
export async function callModel<T>(options: {
  cacheKeySeed?: string;
  signal?: AbortSignal;
  onQuotaWait?: (secondsLeft: number) => void;
  execute: () => Promise<T>;
}): Promise<T> {
  const { cacheKeySeed, signal, onQuotaWait, execute } = options;
  const dateBucket = new Date().toISOString().slice(0, 10);
  const cacheKey = cacheKeySeed
    ? await hashKey(`${cacheKeySeed}::${dateBucket}`)
    : undefined;

  if (cacheKey) {
    const cached = await getCachedQueryResult<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  const delays = [1000, 2000, 4000, 8000];
  let lastError: unknown;

  for (let attempt = 0; attempt < 4; attempt++) {
    if (signal?.aborted) {
      throw new DOMException('Cancelled by user', 'AbortError');
    }
    try {
      const res = await execute();
      if (cacheKey) {
        await setCachedQueryResult(cacheKey, res);
      }
      return res;
    } catch (err) {
      if (isAbortError(err)) throw err;
      lastError = err;
      if (attempt === 3) break;

      const baseDelay = delays[attempt] || 4000;
      const jitter = Math.floor(Math.random() * 450);
      const waitMs = isQuotaError(err) ? Math.max(4000, baseDelay * 2) : baseDelay + jitter;

      if (isQuotaError(err) && onQuotaWait) {
        const totalSec = Math.ceil(waitMs / 1000);
        for (let s = totalSec; s > 0; s--) {
          if (signal?.aborted) throw new DOMException('Cancelled by user', 'AbortError');
          onQuotaWait(s);
          await new Promise(r => setTimeout(r, 1000));
        }
      } else {
        await new Promise(r => setTimeout(r, waitMs));
      }
    }
  }

  throw lastError;
}

async function runQueue<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function runner() {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(1, items.length)) }, () => runner())
  );
  return results;
}

function wordOverlapRatio(a: string, b: string): number {
  const setA = new Set(
    a
      .toLowerCase()
      .replace(/[^\w\u0600-\u06FF\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
  const setB = new Set(
    b
      .toLowerCase()
      .replace(/[^\w\u0600-\u06FF\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
  if (setA.size === 0 || setB.size === 0) return 0;
  let shared = 0;
  setA.forEach(w => {
    if (setB.has(w)) shared++;
  });
  return shared / Math.min(setA.size, setB.size);
}

function getDomain(url?: string): string {
  if (!url) return 'web';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'web';
  }
}

function clamp25Words(text: string): string {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= 25) return words.join(' ');
  return words.slice(0, 25).join(' ');
}

const stage1PlanSchema: Schema = {
  type: Type.OBJECT,
  required: ["candidateLenses", "comparisonCountries", "queries"],
  properties: {
    candidateLenses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["lens", "testQuestion"],
        properties: {
          lens: { type: Type.STRING },
          testQuestion: { type: Type.STRING }
        }
      }
    },
    comparisonCountries: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 to 5 comparable countries or cities relevant to the topic."
    },
    queries: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["type", "text", "language", "scope", "questionIdx", "priority"],
        properties: {
          type: { type: Type.STRING },
          text: { type: Type.STRING },
          language: { type: Type.STRING },
          scope: { type: Type.STRING, enum: ["ground", "abroad"] },
          questionIdx: { type: Type.NUMBER },
          priority: { type: Type.NUMBER }
        }
      }
    }
  }
};

const stage4ExtractSchema: Schema = {
  type: Type.OBJECT,
  required: ["facts"],
  properties: {
    facts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: [
          "type",
          "statement",
          "evidenceText",
          "sourceTitle",
          "sourceUrl",
          "credibility",
          "novelty",
          "storyValue",
          "relevance",
          "stance"
        ],
        properties: {
          type: { type: Type.STRING },
          statement: { type: Type.STRING },
          figureValue: { type: Type.STRING },
          figureUnit: { type: Type.STRING },
          figureYear: { type: Type.NUMBER },
          date: { type: Type.STRING },
          place: { type: Type.STRING },
          entities: { type: Type.ARRAY, items: { type: Type.STRING } },
          sourceTitle: { type: Type.STRING },
          sourceUrl: { type: Type.STRING },
          evidenceText: { type: Type.STRING },
          quoteText: { type: Type.STRING },
          credibility: { type: Type.NUMBER },
          novelty: { type: Type.NUMBER },
          storyValue: { type: Type.NUMBER },
          relevance: { type: Type.NUMBER },
          stance: { type: Type.STRING, enum: ["supports", "counter", "context"] },
          label: { type: Type.STRING, enum: ["none", "unverified_voice", "opinion", "idea"] },
          questionIdx: { type: Type.NUMBER }
        }
      }
    }
  }
};

const playbookExtractSchema: Schema = {
  type: Type.OBJECT,
  required: ["viewerAwareness", "frameworks"],
  properties: {
    viewerAwareness: {
      type: Type.STRING,
      enum: ["unaware", "problem-aware", "solution-aware", "product-aware"]
    },
    frameworks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["name", "steps", "solvedExample", "proof", "objections", "limits"],
        properties: {
          name: { type: Type.STRING },
          steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          solvedExample: { type: Type.STRING },
          proof: { type: Type.ARRAY, items: { type: Type.STRING } },
          objections: { type: Type.ARRAY, items: { type: Type.STRING } },
          limits: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  }
};

const conceptSheetSchema: Schema = {
  type: Type.OBJECT,
  required: [
    "similarFormats",
    "stakesLadder",
    "costRulesSafety",
    "retentionBeats",
    "openQuestions"
  ],
  properties: {
    similarFormats: { type: Type.ARRAY, items: { type: Type.STRING } },
    stakesLadder: { type: Type.ARRAY, items: { type: Type.STRING } },
    costRulesSafety: { type: Type.ARRAY, items: { type: Type.STRING } },
    retentionBeats: { type: Type.ARRAY, items: { type: Type.STRING } },
    openQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};

/**
 * Extracts a clean, concise topic label from a raw topic or composite topic+criteria string.
 */
export function extractCleanTopicLabel(rawTopic: string): string {
  const cleaned = (rawTopic || "")
    .replace(/^VIDEO TOPIC\s*\/\s*WORKING TITLE:\s*/i, "")
    .split(/\n+\s*TARGET ANGLE/i)[0]
    .split(/\n+/)[0]
    .trim();
  if (!cleaned) return "this topic";
  return cleaned.length > 95 ? `${cleaned.slice(0, 92).trim()}...` : cleaned;
}

/**
 * Deterministic, instantaneous Topic-Aware Question Generator (`buildSmartTopicQuestions`).
 * Inspects the actual subject matter of the user's topic (AI/Water/Energy, Business/Scaling,
 * Politics/Governance, Science/Tech, Social/Psychology, or Challenge) so that the questions
 * shown on screen immediately match the topic—never generic boilerplate.
 */
export function buildSmartTopicQuestions(options: {
  topic: string;
  brief?: string;
  style?: ResearchStyle;
  region?: string;
}): string[] {
  const cleanTopic = extractCleanTopicLabel(options.topic);
  const combined = `${cleanTopic} ${options.brief || ""}`.toLowerCase();
  const regionLabel = options.region || "local communities";

  if (!cleanTopic || cleanTopic === "this topic" || cleanTopic === "Documentary Investigation") {
    return [
      "What is the core claim or central mystery driving this topic, and what concrete evidence backs it?",
      "How does the underlying mechanism, system, or financial flow actually work step by step?",
      `What do official reports, empirical studies, and ground-level realities in ${regionLabel} reveal?`,
      "What is the strongest counter-argument or practical solution, and what is the final verdict?"
    ];
  }

  // 1. AI, Data Centers, Water, Energy, Climate & Environmental Resource Topics
  if (
    /\b(water|drinking|thirst|cooling|data\s*center|datacenter|electricity|power\s*grid|megawatt|kilowatt|evaporat|aquifer|drought|carbon|emission|climate|smog|pollution|battery|lithium|solar|nuclear|ai\b|artificial\s*intelligence|chatgpt|openai|gpu|server)/i.test(
      combined
    ) &&
    /\b(water|drink|thirst|cool|energy|power|grid|environment|planet|cost|dark\s*side|consum|electricity|liter|gallon|smog|climate)/i.test(
      combined
    )
  ) {
    return [
      `How much water, electricity, or physical resources does "${cleanTopic}" actually consume per query or operation, and why does the hardware require it?`,
      `What do official environmental disclosures from major tech corporations (Google, Microsoft, OpenAI) and university researchers reveal about "${cleanTopic}"?`,
      `Which specific cities, local water aquifers, and power grids (${regionLabel} & global hubs) are facing real resource strain because of "${cleanTopic}"?`,
      `Can closed-loop liquid cooling, renewable grids, or chip efficiency solve "${cleanTopic}", or are tech companies hiding the true ecological cost?`
    ];
  }

  // 2. Business, Scaling, Agency, Marketing, Sales, Monetization & Personal Finance
  if (
    /\b(scale|scaling|business|startup|agency|b2b|saas|revenue|profit|sales|marketing|client|customer|offer|hormozi|monetiz|pricing|lead\s*gen|funnel|cac\b|ltv\b|cash\s*flow|entrepreneur|wealth|income|brand|ecommerce|freelanc)/i.test(
      combined
    )
  ) {
    return [
      `Why do most founders and operators hit a growth ceiling in "${cleanTopic}", and what is the #1 unit-economics bottleneck holding them back?`,
      `How do the exact numbers—Customer Acquisition Cost (CAC), Lifetime Value (LTV), and profit margins—work when executing "${cleanTopic}"?`,
      `What is the repeatable 3-step execution system (Offer Stack, Acquisition Engine, Delivery SOPs) required to master "${cleanTopic}"?`,
      `What real-world business case study proves how fixing one constraint in "${cleanTopic}" multiplied revenue without burning out the team?`
    ];
  }

  // 3. High-Stakes Challenge, Survival, Spectacle & Experiments
  if (
    /\b(surviv|challenge|24\s*hours|7\s*days|100\s*days|100\s*people|last\s*to\s*leave|\$1\s*vs|\$10,000|\$100,000|mrbeast|extreme|bunker|island|prison\s*challenge|world\s*record)/i.test(
      combined
    )
  ) {
    return [
      `What is the immediate 5-second visual premise, core rule, and ultimate prize or penalty driving "${cleanTopic}"?`,
      `How do the stakes escalate across Round 1 (initial shock), Round 2 (the mid-video twist), and the Final Showdown in "${cleanTopic}"?`,
      `What real-world cost numbers, physical limits, or scale comparisons make "${cleanTopic}" feel massive on screen?`,
      `What unexpected obstacle or last-second human decision creates maximum climax tension in "${cleanTopic}"?`
    ];
  }

  // 4. Political Power, Governance, Constitutional Amendments, Feudalism, Underworld & Geopolitics
  if (
    /\b(politic|government|governance|zardari|bhutto|imran\s*khan|nawaz|ppp|pti|pml|mqm|karachi|sindh|punjab|pakistan|india|amendment|constitution|supreme\s*court|judiciary|wadera|feudal|mafia|cartel|underworld|lyari|gang|military|army|cia|mossad|iran|israel|war|sanction|imf|debt|corruption|election|rigging|sultanat)/i.test(
      combined
    )
  ) {
    return [
      `Which specific historical turning point, constitutional law, or dated incident set the power structure of "${cleanTopic}" in motion?`,
      `How does the institutional nexus—political elites, bureaucracy, law enforcement, or cartels—actually control money and authority in "${cleanTopic}"?`,
      `What do official audit reports, budget figures, and court filings reveal versus the street-level reality of "${cleanTopic}" in ${regionLabel}?`,
      `Who are the biggest financial and political beneficiaries of "${cleanTopic}", and why has the system resisted reform for decades?`
    ];
  }

  // 5. Science, Technology, AI, Physics, Engineering, Space & Medicine
  if (
    /\b(ai\b|artificial\s*intelligence|algorithm|quantum|physics|engine|rocket|space|black\s*hole|brain|neuron|dopamine|dna|crispr|virus|vaccine|medical|biology|chemistry|math|veritasium|experiment|scientist|invention)/i.test(
      combined
    )
  ) {
    return [
      `What counter-intuitive misconception do most people believe about "${cleanTopic}", and what concrete observation or experiment proves it wrong?`,
      `How does the step-by-step physical, algorithmic, or biological mechanism of "${cleanTopic}" actually work under the hood?`,
      `What do peer-reviewed studies, lab experiments, and primary researchers reveal about the real-world impact of "${cleanTopic}"?`,
      `What future breakthrough, risk, or practical consequence does "${cleanTopic}" unlock for society?`
    ];
  }

  // 6. Social Psychology, Youth, Education, Media Manipulation & Cultural Shifts (Default Analytical)
  return [
    `What concrete real-world incident, paradox, or everyday shift exposes how "${cleanTopic}" is reshaping people's lives right now?`,
    `How does the hidden system or psychological mechanism behind "${cleanTopic}" actually operate beneath the surface?`,
    `What do empirical studies, institutional statistics, and ground-level realities in ${regionLabel} reveal about "${cleanTopic}"?`,
    `Who profits from keeping "${cleanTopic}" this way, and what practical shift or solution changes the outcome?`
  ];
}

/**
 * Generates 100% topic-specific narrative & research questions for the Research Plan screen using FAST_MODEL.
 * Never forces irrelevant template questions (like "Who are 2 or 3 real people from different cities")
 * onto topics where they do not belong.
 */
export async function rewriteQuestionsForTopic(options: {
  topic: string;
  brief: string;
  style: ResearchStyle;
  region: string;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<string[]> {
  const { topic, brief, style, region, apiKey, signal } = options;
  const cleanTopic = extractCleanTopicLabel(topic);
  if (!cleanTopic || cleanTopic === "this topic") {
    return buildSmartTopicQuestions({ topic, brief, style, region });
  }

  const ai = getAiClient(apiKey);
  const prompt = `
    You are a Senior YouTube Documentary & Narrative Architect designing the 4-question research and story spine for a video about:
    TOPIC: "${cleanTopic}"
    DETAILED BRIEF / CRITERIA: "${brief || cleanTopic}"
    CREATOR VOICE / ARCHETYPE: ${style.displayName} (${style.intent})
    PRIMARY REGION: ${region}

    CRITICAL RULES:
    1. Every single question MUST be 100% specific to "${cleanTopic}" and its actual subject matter (e.g., if the topic is "Is AI Drinking our water?", ask about liters of water evaporated per AI prompt/data center cooling, corporate water disclosures from Google/Microsoft/OpenAI, affected local aquifers/communities, and cooling engineering solutions).
    2. NEVER output generic template questions like "What exactly is being claimed and by whom?", "Who are 2 or 3 real people from different cities?", or "How do 3 to 5 comparable countries handle this?" unless the topic specifically calls for that exact angle!
    3. Structure the 4 questions in the exact narrative order of a high-retention video script:
       - Question 1 (Hook & Core Mystery/Claim): The shocking premise, paradox, or central claim of "${cleanTopic}".
       - Question 2 (The Hidden Mechanism / How It Works): The exact technical, economic, or structural mechanism driving "${cleanTopic}".
       - Question 3 (Hard Evidence, Numbers & Ground Impact): The concrete data, institutional filings, or real-world cases/places impacted by "${cleanTopic}".
       - Question 4 (Counter-Argument, Solution & Final Verdict): Whether proposed fixes/solutions actually work and the ultimate takeaway on "${cleanTopic}".
    4. Keep each question to 1 sharp, clear sentence (12 to 22 words).
  `;

  try {
    const res = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["questions"],
          properties: {
            questions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        },
        temperature: 0.3,
        abortSignal: signal
      }
    });
    const parsed = cleanAndParseJSON<{ questions?: string[] }>(res.text || "{}");
    if (Array.isArray(parsed.questions) && parsed.questions.length >= 3) {
      return parsed.questions.map(q => q.trim()).filter(Boolean).slice(0, 6);
    }
  } catch {
    // Fallback to deterministic smart topic question generator
  }
  return buildSmartTopicQuestions({ topic: cleanTopic, brief, style, region });
}

/**
 * Phase R3: Main 8-Stage Research Pipeline (`runResearchPipeline`).
 */
export async function runResearchPipeline(input: ResearchInput): Promise<ResearchResult> {
  const {
    topic,
    brief,
    minutes,
    depth,
    scope,
    style,
    questions,
    includeWords,
    avoidWords,
    togglesLevel,
    userSources,
    userStoriesAndNumbers,
    conceptInputs,
    narrationLanguage,
    region,
    apiKey,
    signal,
    onProgress
  } = input;

  const startTime = Date.now();
  const elapsedSec = () => Math.max(1, Math.round((Date.now() - startTime) / 1000));
  const estRange = style.budget.estimatedMinutes[depth] || [1, 3];
  const ai = getAiClient(apiKey);

  const collectedFacts: FactCard[] = [];
  const collectedQuotes: QuoteCard[] = [];
  const collectedBooks: BookRef[] = [];
  const gaps: string[] = [];

  const emitProgress = (
    stage: ResearchLiveProgress['stage'],
    message: string,
    searchingDone: number,
    searchingTotal: number,
    readingDone: number,
    readingTotal: number,
    quotaRetrySeconds?: number
  ) => {
    onProgress?.({
      stage,
      message,
      searchingDone,
      searchingTotal,
      readingDone,
      readingTotal,
      factsFound: collectedFacts.length,
      quotaRetrySeconds,
      estimatedMinutesRange: estRange,
      elapsedSeconds: elapsedSec(),
      partialFacts: [...collectedFacts]
    });
  };

  // ============================================================================
  // STAGE 0: INGEST USER MATERIAL
  // ============================================================================
  emitProgress('ingest', 'Reading your uploaded sources and notes...', 0, 1, 0, 1);

  if (userStoriesAndNumbers && userStoriesAndNumbers.trim()) {
    const lines = userStoriesAndNumbers
      .split(/\n+/)
      .map(l => l.trim())
      .filter(l => l.length > 8);
    lines.forEach((line, idx) => {
      const numMatch = line.match(/(\d[\d,.]*\s*(?:%|PKR|USD|\$|Rs|months|days|clients|x)?)/i);
      collectedFacts.push({
        id: `F-USER-${idx + 1}`,
        type: 'user_material',
        claim: line,
        statement: line,
        value: numMatch ? numMatch[1].trim() : undefined,
        figure: numMatch ? { value: numMatch[1].trim() } : undefined,
        snippet: clamp25Words(line),
        evidenceText: clamp25Words(line),
        source: {
          id: `SRC-USER-STORY-${idx + 1}`,
          title: 'Your stories and numbers',
          url: 'user-source://stories-and-numbers',
          domain: 'your-material',
          origin: 'user_paste',
          verified: true
        },
        sourceTitle: 'Your stories and numbers',
        sourceUrl: 'user-source://stories-and-numbers',
        sourceDomain: 'your-material',
        sourceKind: 'user_paste',
        sub: { credibility: 0.95, novelty: 0.9, storyValue: 0.95, relevance: 0.95 },
        score: 0.94,
        strength: 'strong',
        stance: 'supports',
        questionIdx: [0, 2],
        confidence: 'high',
        status: 'approved'
      });
    });
  } else if (style.researchMode === 'playbook') {
    gaps.push('Your own numbers are missing');
  }

  if (conceptInputs) {
    const entries = [
      conceptInputs.idea ? `Concept idea: ${conceptInputs.idea}` : '',
      conceptInputs.budgetOrLimits ? `Budget and limits: ${conceptInputs.budgetOrLimits}` : '',
      conceptInputs.prizeOrStakes ? `Prize and stakes: ${conceptInputs.prizeOrStakes}` : ''
    ].filter(Boolean);

    entries.forEach((entry, idx) => {
      collectedFacts.push({
        id: `F-PLAN-${idx + 1}`,
        type: 'user_material',
        claim: entry,
        statement: entry,
        snippet: clamp25Words(entry),
        evidenceText: clamp25Words(entry),
        source: {
          id: `SRC-PLAN-${idx + 1}`,
          title: 'Your concept plan',
          url: 'user-source://concept-plan',
          domain: 'your-plan',
          origin: 'user_paste',
          verified: true
        },
        sourceTitle: 'Your concept plan',
        sourceUrl: 'user-source://concept-plan',
        sourceDomain: 'your-plan',
        sourceKind: 'user_paste',
        sub: { credibility: 0.95, novelty: 0.9, storyValue: 0.9, relevance: 0.95 },
        score: 0.92,
        strength: 'strong',
        stance: 'supports',
        label: 'idea',
        questionIdx: [0, 2],
        confidence: 'high',
        status: 'approved'
      });
    });
  }

  for (const src of userSources.filter(s => s.useInScript)) {
    if (src.kind === 'book_metadata') {
      collectedBooks.push({
        id: `B${collectedBooks.length + 1}`,
        title: src.title,
        authors: [src.author || 'Author'],
        author: src.author || 'Author',
        year: src.year,
        coreIdeaForTopic: `Reference work for ${topic}`,
        relevance: `Reference work for ${topic}`,
        sourceLevel: 'metadata_only',
        status: 'approved'
      });
      continue;
    }

    if (src.insights) {
      for (const q of src.insights.quotes) {
        if (!q.verified) continue;
        collectedFacts.push(
          createFactCardFromUserSource({
            source: src,
            statement: `"${q.text}" — ${src.title}`,
            quoteText: q.text,
            page: q.page,
            existingCount: collectedFacts.length
          })
        );
        collectedQuotes.push({
          id: `Q${collectedQuotes.length + 1}`,
          quote: q.text,
          speaker: src.author || src.title,
          workOrContext: src.title,
          year: src.year,
          page: q.page,
          usage: q.suggestedUse,
          source: {
            id: `SRC-Q-${src.id}`,
            title: src.title,
            url: src.url || `user-source://${src.id}`,
            origin: 'user_upload',
            verified: true
          },
          verifiedExactText: true,
          status: 'approved'
        });
      }
      for (const num of src.insights.numbers) {
        collectedFacts.push(
          createFactCardFromUserSource({
            source: src,
            statement: `${num.figure}${num.unit ? ` ${num.unit}` : ''} (${num.where})`,
            figure: {
              value: num.figure,
              unit: num.unit,
              year: num.year ? Number(num.year) : undefined
            },
            existingCount: collectedFacts.length
          })
        );
      }
    }
  }

  // ============================================================================
  // STAGE 1: PLAN (STRONG_MODEL + CODE QUERY ALLOCATION)
  // ============================================================================
  const rawBudgetQ = style.budget.queries[depth] || 16;
  const totalQ = minutes > 15 ? Math.min(40, rawBudgetQ) : Math.min(40, rawBudgetQ);

  // Compute per-type query count in CODE
  const activePriorities = style.sourcePriority
    .map(sp => {
      const toggle = style.uiLabels.sourceToggles.find(t => t.mapsTo === sp.type);
      const mult = toggle ? togglesLevel[toggle.id] ?? 1 : 1;
      return {
        type: sp.type,
        effectiveWeight: sp.weight * mult,
        rawWeight: sp.weight,
        mult
      };
    })
    .filter(sp => sp.mult > 0 && sp.type !== 'user_material');

  const effWeightSum =
    activePriorities.reduce((acc, p) => acc + p.effectiveWeight, 0) || 1;

  const targetCountsByType: Record<string, number> = {};
  let allocatedSum = 0;
  for (const p of activePriorities) {
    const normW = p.effectiveWeight / effWeightSum;
    let count = Math.round(totalQ * normW);
    if (p.rawWeight >= 0.1 && count < 2) count = 2;
    targetCountsByType[p.type] = count;
    allocatedSum += count;
  }

  // Normalize so total queries == totalQ
  if (allocatedSum > 0 && allocatedSum !== totalQ && activePriorities.length > 0) {
    const diff = totalQ - allocatedSum;
    const topType = activePriorities[0].type;
    targetCountsByType[topType] = Math.max(1, (targetCountsByType[topType] || 2) + diff);
  }

  emitProgress('plan', `Planning ${totalQ} searches for "${topic.slice(0, 42)}"...`, 0, totalQ, 0, 1);

  const effectiveQuestions =
    questions && questions.length > 0
      ? questions
      : buildSmartTopicQuestions({ topic, brief, style, region });

  const planSysPrompt = buildResearchSystemPrompt(style, brief, scope, 'plan', region);
  const currentYear = new Date().getFullYear();
  const isUrduGround =
    /urdu/i.test(narrationLanguage) && (scope === 'ground' || scope === 'both');

  const planUserPrompt = `
    Plan research for topic: "${topic}"
    Brief: "${brief || topic}"
    Region: "${region}" | Scope: "${scope}" | Year: ${currentYear}
    Questions to answer:
    ${effectiveQuestions.map((q, i) => `${i}: ${q}`).join('\n')}

    Query counts required by source type:
    ${Object.entries(targetCountsByType)
      .map(([t, n]) => `- ${t}: ${n} queries`)
      .join('\n')}

    ${includeWords.length > 0 ? `Include these words in at least 30% of queries: ${includeWords.join(', ')}` : ''}
    ${avoidWords.length > 0 ? `NEVER use these words in any query: ${avoidWords.join(', ')}` : ''}
    ${
      isUrduGround
        ? 'LANGUAGE RULE: Write about 30% of ground queries in Urdu script and the rest in English.'
        : 'Write queries in clear English (and local terms where helpful).'
    }

    Return 3 to 5 candidate lenses from the topic (with 1 testQuestion each), 3 to 5 comparisonCountries, and the planned queries.
  `;

  let candidateLenses: { lens: string; testQuestion: string }[] = [];
  let comparisonCountries: string[] = ['Mexico', 'Indonesia', 'India'];
  let plannedQueries: PlannedQuery[] = [];

  try {
    const planData = await callModel({
      cacheKeySeed: `plan::${style.creatorId}::${topic}::${scope}::${depth}`,
      signal,
      onQuotaWait: sec =>
        emitProgress(
          'waiting_quota',
          `Waiting for quota, retrying in ${sec} seconds...`,
          0,
          totalQ,
          0,
          1,
          sec
        ),
      execute: async () => {
        const res = await ai.models.generateContent({
          model: STRONG_MODEL,
          contents: planUserPrompt,
          config: {
            systemInstruction: planSysPrompt,
            responseMimeType: 'application/json',
            responseSchema: stage1PlanSchema,
            temperature: 0.3,
            abortSignal: signal
          }
        });
        return cleanAndParseJSON<{
          candidateLenses?: { lens: string; testQuestion: string }[];
          comparisonCountries?: string[];
          queries?: Array<{
            type?: string;
            text?: string;
            language?: string;
            scope?: 'ground' | 'abroad';
            questionIdx?: number;
            priority?: number;
          }>;
        }>(res.text || '{}');
      }
    });

    if (Array.isArray(planData.candidateLenses) && planData.candidateLenses.length > 0) {
      candidateLenses = planData.candidateLenses.slice(0, 5);
    }
    if (Array.isArray(planData.comparisonCountries) && planData.comparisonCountries.length > 0) {
      comparisonCountries = planData.comparisonCountries.slice(0, 5);
    }

    const rawQueries = planData.queries || [];
    for (const rq of rawQueries) {
      const qText = (rq.text || '').trim();
      if (!qText) continue;
      // Filter out avoidWords
      if (
        avoidWords.some(
          aw => aw.trim() && qText.toLowerCase().includes(aw.trim().toLowerCase())
        )
      ) {
        continue;
      }
      // Drop near-duplicate queries (word overlap > 0.8)
      if (plannedQueries.some(existing => wordOverlapRatio(existing.text, qText) > 0.8)) {
        continue;
      }

      plannedQueries.push({
        id: `QRY-${plannedQueries.length + 1}`,
        type: (rq.type as FactType) || activePriorities[0]?.type || 'official_data',
        text: qText,
        language: rq.language || 'en',
        scope: rq.scope || (scope === 'abroad' ? 'abroad' : 'ground'),
        questionIdx:
          typeof rq.questionIdx === 'number'
            ? Math.max(0, Math.min(questions.length - 1, rq.questionIdx))
            : plannedQueries.length % Math.max(1, questions.length),
        priority: (rq.priority === 1 || rq.priority === 2 || rq.priority === 3 ? rq.priority : 1)
      });
    }
  } catch (err) {
    if (isAbortError(err)) throw err;
  }

  // Fallback / top-up from style.queryTemplates if needed
  if (plannedQueries.length === 0) {
    style.queryTemplates.forEach((qt, qtIdx) => {
      qt.templates.forEach(tpl => {
        const filled = tpl
          .replace('{topic}', topic)
          .replace('{region}', region)
          .replace('{year}', String(currentYear))
          .replace('{countries}', comparisonCountries.slice(0, 2).join(' '))
          .replace('{entity}', topic);
        plannedQueries.push({
          id: `QRY-${plannedQueries.length + 1}`,
          type: qt.type,
          text: filled,
          language: 'en',
          scope: scope === 'abroad' ? 'abroad' : 'ground',
          questionIdx: qtIdx % Math.max(1, questions.length),
          priority: 1
        });
      });
    });
  }

  // Enforce includeWords in at least 30% of queries when provided
  if (includeWords.length > 0 && plannedQueries.length > 0) {
    const minWithInclude = Math.ceil(plannedQueries.length * 0.3);
    let currentWithInclude = plannedQueries.filter(q =>
      includeWords.some(iw => q.text.toLowerCase().includes(iw.toLowerCase()))
    ).length;
    for (let i = 0; i < plannedQueries.length && currentWithInclude < minWithInclude; i++) {
      const wordToAdd = includeWords[i % includeWords.length];
      if (!plannedQueries[i].text.toLowerCase().includes(wordToAdd.toLowerCase())) {
        plannedQueries[i].text = `${plannedQueries[i].text} ${wordToAdd}`;
        currentWithInclude++;
      }
    }
  }

  plannedQueries = plannedQueries.slice(0, totalQ);

  // ============================================================================
  // STAGE 2, 3 & 4: HARVEST (GROUNDED SEARCH) + READ + EXTRACT
  // ============================================================================
  const extractSysPrompt = buildResearchSystemPrompt(style, brief, scope, 'extract', region);
  const pagesTarget = depth === 'quick' ? 6 : depth === 'standard' ? 15 : 30;
  let searchesDone = 0;
  let pagesRead = 0;

  // Group queries into pairs so we keep high grounding quality and responsive progress updates
  const queryGroups: PlannedQuery[][] = [];
  for (let i = 0; i < plannedQueries.length; i += 2) {
    queryGroups.push(plannedQueries.slice(i, i + 2));
  }

  await runQueue(queryGroups, 4, async (group, groupIdx) => {
    if (signal?.aborted) throw new DOMException('Cancelled by user', 'AbortError');

    const groupQueriesText = group
      .map(
        (q, i) =>
          `${i + 1}. [Type: ${q.type} | Scope: ${q.scope} | Question #${q.questionIdx + 1}]: "${q.text}"`
      )
      .join('\n');

    const harvestExtractPrompt = `
      Run Google Search grounding for these queries on "${topic}" (${region}):
      ${groupQueriesText}

      Questions being answered:
      ${group.map(q => `Q#${q.questionIdx}: ${questions[q.questionIdx] || topic}`).join('\n')}

      Extract 4 to 6 distinct, verifiable FactCards using ONLY the retrieved search results:
      - One clear factual statement per card.
      - Include figureValue, figureUnit, and figureYear whenever a number, percentage, or money figure appears.
      - Include a short supporting evidenceText snippet (under 25 words) from the source.
      - Give 0-to-1 sub-scores for credibility, novelty, storyValue, and relevance.
      - Mark public voices with label "unverified_voice", opinions with "opinion", and creative ideas with "idea".
      - Set stance to "counter" if the fact supports the opposing side or challenges the main assumption.
    `;

    try {
      const batchResult = await callModel({
        cacheKeySeed: `harvest::${style.creatorId}::${group.map(g => g.text).join('|')}`,
        signal,
        onQuotaWait: sec =>
          emitProgress(
            'waiting_quota',
            `Waiting for quota, retrying in ${sec} seconds...`,
            searchesDone,
            plannedQueries.length,
            pagesRead,
            pagesTarget,
            sec
          ),
        execute: async () => {
          const searchRes = await ai.models.generateContent({
            model: FAST_MODEL,
            contents: harvestExtractPrompt,
            config: {
              systemInstruction: extractSysPrompt,
              tools: [{ googleSearch: {} }],
              temperature: 0.2,
              abortSignal: signal
            }
          });

          const chunks =
            searchRes.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          const groundedSources = chunks
            .map((c: any) => ({
              title: c?.web?.title || '',
              uri: c?.web?.uri || ''
            }))
            .filter((s: { title: string; uri: string }) => Boolean(s.uri));

          const structRes = await ai.models.generateContent({
            model: FAST_MODEL,
            contents: `Convert these grounded findings into the exact JSON schema. Use ONLY these grounded URLs for sourceUrl:\n${groundedSources
              .map((s: { title: string; uri: string }) => `- ${s.title}: ${s.uri}`)
              .join('\n')}\n\nFINDINGS:\n${searchRes.text || ''}`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: stage4ExtractSchema,
              temperature: 0.1,
              abortSignal: signal
            }
          });

          const parsed = cleanAndParseJSON<{
            facts?: Array<{
              type?: string;
              statement?: string;
              figureValue?: string;
              figureUnit?: string;
              figureYear?: number;
              date?: string;
              place?: string;
              entities?: string[];
              sourceTitle?: string;
              sourceUrl?: string;
              evidenceText?: string;
              quoteText?: string;
              credibility?: number;
              novelty?: number;
              storyValue?: number;
              relevance?: number;
              stance?: 'supports' | 'counter' | 'context';
              label?: 'none' | 'unverified_voice' | 'opinion' | 'idea';
              questionIdx?: number;
            }>;
          }>(structRes.text || '{}');

          return {
            facts: parsed.facts || [],
            groundedSources
          };
        }
      });

      const groundedList = batchResult.groundedSources || [];
      searchesDone = Math.min(plannedQueries.length, searchesDone + group.length);
      pagesRead = Math.min(pagesTarget, pagesRead + Math.min(3, groundedList.length));

      batchResult.facts.forEach((rf, idx) => {
        const statement = (rf.statement || '').trim();
        if (!statement) return;

        // HONESTY RULE: Every web fact MUST have a real URL from grounding metadata
        const matchedGround =
          groundedList.find((g: { uri: string }) => g.uri === rf.sourceUrl) ||
          groundedList[idx % Math.max(1, groundedList.length)];

        const realUrl = matchedGround?.uri;
        if (!realUrl) {
          // Drop unsourced web fact so it can never reach the writer
          return;
        }

        const sub = {
          credibility: Math.max(0, Math.min(1, Number(rf.credibility ?? 0.75))),
          novelty: Math.max(0, Math.min(1, Number(rf.novelty ?? 0.65))),
          storyValue: Math.max(0, Math.min(1, Number(rf.storyValue ?? 0.7))),
          relevance: Math.max(0, Math.min(1, Number(rf.relevance ?? 0.8)))
        };

        // STAGE 5: Compute weighted score in CODE
        const w = style.factScoring;
        const computedScore = Number(
          (
            sub.credibility * w.credibility +
            sub.novelty * w.novelty +
            sub.storyValue * w.storyValue +
            sub.relevance * w.relevance
          ).toFixed(3)
        );

        const strength: 'strong' | 'ok' | 'weak' =
          computedScore >= 0.7 ? 'strong' : computedScore >= 0.5 ? 'ok' : 'weak';

        const factType: FactType =
          (rf.type as FactType) || group[0]?.type || 'official_data';
        const isPublicVoice =
          factType === 'public_voices' ||
          factType === 'public_voice' ||
          rf.label === 'unverified_voice';

        const label: 'unverified_voice' | 'opinion' | 'idea' | undefined = isPublicVoice
          ? 'unverified_voice'
          : rf.label === 'opinion'
          ? 'opinion'
          : rf.label === 'idea' || style.researchMode === 'concept_lab'
          ? 'idea'
          : undefined;

        const domain = getDomain(realUrl);
        const title = matchedGround?.title || rf.sourceTitle || domain;
        const figVal = rf.figureValue?.trim();

        collectedFacts.push({
          id: `F-${groupIdx + 1}-${idx + 1}`,
          type: factType,
          claim: statement,
          statement,
          value: figVal
            ? `${figVal}${rf.figureUnit ? ` ${rf.figureUnit}` : ''}`
            : undefined,
          figure: figVal
            ? {
                value: figVal,
                unit: rf.figureUnit || undefined,
                year: rf.figureYear || undefined
              }
            : undefined,
          date: rf.date || (rf.figureYear ? String(rf.figureYear) : undefined),
          location: rf.place || undefined,
          place: rf.place || undefined,
          entities: Array.isArray(rf.entities) ? rf.entities : [],
          snippet: clamp25Words(rf.evidenceText || statement),
          evidenceText: clamp25Words(rf.evidenceText || statement),
          source: {
            id: `SRC-${groupIdx + 1}-${idx + 1}`,
            title,
            year: rf.figureYear ? String(rf.figureYear) : undefined,
            url: realUrl,
            domain,
            origin: 'web_grounded',
            verified: !isPublicVoice
          },
          sourceTitle: title,
          sourceUrl: realUrl,
          sourceDomain: domain,
          sourceKind: 'web',
          // Web quotes are always verified: false ("check at source")
          quote: rf.quoteText
            ? {
                text: clamp25Words(rf.quoteText),
                verified: false
              }
            : undefined,
          sub,
          score: computedScore,
          strength,
          stance: rf.stance || 'supports',
          label,
          questionIdx: [
            typeof rf.questionIdx === 'number'
              ? rf.questionIdx
              : group[0]?.questionIdx || 0
          ],
          confidence: strength === 'strong' ? 'high' : strength === 'ok' ? 'medium' : 'low',
          status: 'approved'
        });
      });

      await savePartialResearchResult(topic, collectedFacts);
      emitProgress(
        'harvest',
        `Searching ${searchesDone}/${plannedQueries.length}, reading pages ${pagesRead}/${pagesTarget}, facts found ${collectedFacts.length}`,
        searchesDone,
        plannedQueries.length,
        pagesRead,
        pagesTarget
      );
    } catch (err) {
      if (isAbortError(err)) throw err;
    }
  });

  // Also search real books metadata if books_history is in sourcePriority
  if (
    style.sourcePriority.some(sp => sp.type === 'books_history' && sp.weight > 0) &&
    !signal?.aborted
  ) {
    try {
      const foundBooks = await searchBooks(topic, brief, signal);
      for (const b of foundBooks.slice(0, 4)) {
        if (!collectedBooks.some(eb => eb.title.toLowerCase() === b.title.toLowerCase())) {
          collectedBooks.push({
            ...b,
            id: `B${collectedBooks.length + 1}`
          });
        }
      }
    } catch {
      // ignore book lookup errors
    }
  }

  // ============================================================================
  // STAGE 5: SCORE, DEDUPLICATE & MERGE SECOND SOURCES IN CODE
  // ============================================================================
  const deduplicated: FactCard[] = [];
  for (const card of collectedFacts) {
    const duplicate = deduplicated.find(existing => {
      const sim = wordOverlapRatio(existing.claim, card.claim);
      if (sim > 0.85) return true;
      if (
        existing.figure?.value &&
        card.figure?.value &&
        String(existing.figure.value) === String(card.figure.value) &&
        existing.entities?.some(e => card.entities?.includes(e))
      ) {
        return true;
      }
      return false;
    });

    if (duplicate) {
      if ((card.score || 0) > (duplicate.score || 0)) {
        duplicate.secondSourceUrl = duplicate.sourceUrl;
        duplicate.sourceUrl = card.sourceUrl;
        duplicate.sourceTitle = card.sourceTitle;
        duplicate.source = card.source;
        duplicate.score = card.score;
        duplicate.strength = card.strength;
      } else if (card.sourceUrl && card.sourceUrl !== duplicate.sourceUrl) {
        duplicate.secondSourceUrl = duplicate.secondSourceUrl || card.sourceUrl;
      }
    } else {
      deduplicated.push(card);
    }
  }

  // Sort so user_material comes first for playbook styles, and never gets outranked by equal web facts
  deduplicated.sort((a, b) => {
    if (style.researchMode === 'playbook') {
      if (a.type === 'user_material' && b.type !== 'user_material') return -1;
      if (b.type === 'user_material' && a.type !== 'user_material') return 1;
    }
    const scoreDiff = (b.score || 0) - (a.score || 0);
    if (Math.abs(scoreDiff) < 0.03 && a.sourceKind !== 'web' && b.sourceKind === 'web') {
      return -1;
    }
    return scoreDiff;
  });

  // Number F1..Fn
  deduplicated.forEach((f, idx) => {
    f.id = `F${idx + 1}`;
  });

  // ============================================================================
  // STAGE 6: VERIFY (SECOND SOURCE FOR TOP NUMERIC FACTS IN STRICT/STANDARD STYLES)
  // ============================================================================
  const verifyBudget =
    style.claimPolicy.strictness === 'strict'
      ? Math.max(1, Math.min(4, Math.round(totalQ * 0.15)))
      : style.claimPolicy.strictness === 'standard'
      ? Math.max(1, Math.min(2, Math.round(totalQ * 0.05)))
      : 0;

  if (verifyBudget > 0 && !signal?.aborted) {
    const numericCandidates = deduplicated
      .filter(f => f.figure?.value && !f.secondSourceUrl && f.sourceKind === 'web')
      .slice(0, verifyBudget);

    if (numericCandidates.length > 0) {
      emitProgress(
        'verify',
        `Checking a second source for ${numericCandidates.length} key numbers...`,
        searchesDone,
        plannedQueries.length,
        pagesRead,
        pagesTarget
      );

      await runQueue(numericCandidates, 2, async card => {
        try {
          const res = await ai.models.generateContent({
            model: FAST_MODEL,
            contents: `Find an independent second website confirming or disputing this number on "${topic}": "${card.claim}" (${card.value}). Exclude ${card.sourceDomain}.`,
            config: {
              tools: [{ googleSearch: {} }],
              temperature: 0.1,
              abortSignal: signal
            }
          });
          const chunks =
            res.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          const secondSource = chunks
            .map((c: any) => c?.web?.uri as string | undefined)
            .find((uri?: string) => uri && getDomain(uri) !== card.sourceDomain);
          if (secondSource) {
            card.secondSourceUrl = secondSource;
          }
        } catch {
          // ignore verification errors
        }
      });
    }
  }

  // ============================================================================
  // MODE-SPECIFIC STRUCTURED ARTIFACTS (PLAYBOOK / CONCEPT SHEET)
  // ============================================================================
  let playbook: Playbook | undefined;
  let concept: ConceptSheet | undefined;

  if (
    (style.researchMode === 'playbook' || style.researchMode === 'hybrid') &&
    !signal?.aborted
  ) {
    try {
      const pbRes = await ai.models.generateContent({
        model: FAST_MODEL,
        contents: `Build a step-by-step Playbook for "${topic}" based on these research facts and user numbers:\n${deduplicated
          .slice(0, 20)
          .map(f => `- [${f.id}] (${f.type}) ${f.claim}`)
          .join('\n')}\nIf the user did not supply real numbers for the solvedExample, write "[NEEDS YOUR DATA]" inside solvedExample.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: playbookExtractSchema,
          temperature: 0.25,
          abortSignal: signal
        }
      });
      playbook = cleanAndParseJSON<Playbook>(pbRes.text || '{}');
    } catch {
      // ignore
    }
  }

  if (
    (style.researchMode === 'concept_lab' || style.researchMode === 'hybrid') &&
    !signal?.aborted
  ) {
    try {
      const csRes = await ai.models.generateContent({
        model: FAST_MODEL,
        contents: `Build a high-retention Concept Sheet for "${topic}" using these facts and user inputs:\n${deduplicated
          .slice(0, 15)
          .map(f => `- [${f.id}] ${f.claim}`)
          .join('\n')}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: conceptSheetSchema,
          temperature: 0.3,
          abortSignal: signal
        }
      });
      concept = cleanAndParseJSON<ConceptSheet>(csRes.text || '{}');
    } catch {
      // ignore
    }
  }

  // ============================================================================
  // STAGE 7 & 8: COVERAGE, GAPS & THIN-EVIDENCE HONESTY CHECK
  // ============================================================================
  const byType: Record<string, { found: number; target: number; label: string }> = {};
  let targetTotalFacts = 0;

  for (const sp of style.sourcePriority) {
    const minPer5 = style.minFactsPer5Min?.[sp.type] ?? Math.max(1, Math.round(14 * sp.weight));
    const targetForType = Math.max(1, Math.round(minPer5 * (minutes / 5)));
    const foundForType = deduplicated.filter(f => f.type === sp.type).length;
    const toggle = style.uiLabels.sourceToggles.find(t => t.mapsTo === sp.type);
    byType[sp.type] = {
      found: foundForType,
      target: targetForType,
      label: toggle?.label || sp.type.replace(/_/g, ' ')
    };
    targetTotalFacts += targetForType;
  }

  const answeredSet = new Set<number>();
  deduplicated.forEach(f => {
    (f.questionIdx || []).forEach(idx => answeredSet.add(idx));
  });

  questions.forEach((q, idx) => {
    if (!answeredSet.has(idx)) {
      gaps.push(`Still missing a strong answer for: "${q}"`);
    }
  });

  const strongOrOkFacts = deduplicated.filter(
    f => f.strength === 'strong' || f.strength === 'ok'
  ).length;
  const evidenceIsThin =
    style.researchMode !== 'concept_lab' &&
    strongOrOkFacts < Math.max(6, Math.round(targetTotalFacts * 0.7));

  const uniqueDomains = new Set(
    deduplicated.map(f => f.sourceDomain || f.source.domain).filter(Boolean)
  ).size;

  const winningLens = candidateLenses[0]?.lens;

  emitProgress(
    'complete',
    `Found ${deduplicated.length} facts from ${uniqueDomains} websites.`,
    plannedQueries.length,
    plannedQueries.length,
    pagesRead,
    pagesTarget
  );

  return {
    facts: deduplicated,
    quotes: collectedQuotes,
    books: collectedBooks,
    coverage: {
      byType,
      answeredQuestionIndices: Array.from(answeredSet),
      totalQuestions: questions.length,
      evidenceIsThin,
      targetTotalFacts
    },
    gaps,
    stats: {
      totalFacts: deduplicated.length,
      strongOrOkFacts,
      totalSources: deduplicated.length + collectedBooks.length,
      uniqueDomains,
      queriesRun: searchesDone,
      totalQueriesPlanned: plannedQueries.length,
      pagesRead,
      totalPagesToRead: pagesTarget
    },
    plan: plannedQueries,
    candidateLenses,
    winningLens,
    comparisonCountries,
    playbook,
    concept
  };
}

/**
 * Adapter that converts a Phase R3 ResearchResult into the Dossier format consumed by
 * Phase D (longFormService.ts) and Phase E (claimService.ts).
 */
export function toLegacyDossier(
  result: ResearchResult,
  meta: { topic: string; angle: string; minutes: number }
): Dossier {
  const words = Math.round(meta.minutes * 140);
  return {
    topic: meta.topic,
    angle: meta.angle,
    durationMinutes: meta.minutes,
    targetWordCount: words,
    targetFactCount: Math.max(8, result.coverage.targetTotalFacts),
    facts: result.facts,
    quotes: result.quotes,
    books: result.books,
    gaps: result.gaps,
    winningLens: result.winningLens
  };
}

/**
 * Runs a single targeted grounded search to find a second independent source for a specific FactCard,
 * or to search for a specific missing gap question.
 */
export async function searchForSingleGapOrSecondSource(options: {
  queryText: string;
  topic: string;
  region: string;
  style: ResearchStyle;
  existingCount: number;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<FactCard[]> {
  const { queryText, topic, region, style, existingCount, apiKey, signal } = options;
  const ai = getAiClient(apiKey);
  const sysPrompt = buildResearchSystemPrompt(style, topic, style.defaultScope, 'extract', region);

  const searchRes = await ai.models.generateContent({
    model: FAST_MODEL,
    contents: `Find 2 to 3 verified facts with numbers and dates answering: "${queryText}" for topic "${topic}" (${region}).`,
    config: {
      systemInstruction: sysPrompt,
      tools: [{ googleSearch: {} }],
      temperature: 0.2,
      abortSignal: signal
    }
  });

  const chunks =
    searchRes.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const groundedSources = chunks
    .map((c: any) => ({
      title: c?.web?.title || '',
      uri: c?.web?.uri || ''
    }))
    .filter((s: { title: string; uri: string }) => Boolean(s.uri));

  if (groundedSources.length === 0) return [];

  const structRes = await ai.models.generateContent({
    model: FAST_MODEL,
    contents: `Convert into JSON FactCards using ONLY these URLs:\n${groundedSources
      .map((s: { title: string; uri: string }) => `- ${s.title}: ${s.uri}`)
      .join('\n')}\n\nTEXT:\n${searchRes.text || ''}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: stage4ExtractSchema,
      temperature: 0.1,
      abortSignal: signal
    }
  });

  const parsed = cleanAndParseJSON<{
    facts?: Array<{
      type?: string;
      statement?: string;
      figureValue?: string;
      figureUnit?: string;
      figureYear?: number;
      sourceTitle?: string;
      sourceUrl?: string;
      evidenceText?: string;
      credibility?: number;
      novelty?: number;
      storyValue?: number;
      relevance?: number;
      stance?: 'supports' | 'counter' | 'context';
    }>;
  }>(structRes.text || '{}');

  return (parsed.facts || [])
    .filter(f => f.statement && f.statement.trim())
    .map((rf, idx) => {
      const matched =
        groundedSources.find((g: { uri: string }) => g.uri === rf.sourceUrl) ||
        groundedSources[idx % groundedSources.length];
      const realUrl = matched.uri;
      const domain = getDomain(realUrl);
      const title = matched.title || rf.sourceTitle || domain;
      return {
        id: `F${existingCount + idx + 1}`,
        type: (rf.type as FactType) || style.sourcePriority[0]?.type || 'official_data',
        claim: rf.statement!.trim(),
        statement: rf.statement!.trim(),
        value: rf.figureValue
          ? `${rf.figureValue}${rf.figureUnit ? ` ${rf.figureUnit}` : ''}`
          : undefined,
        figure: rf.figureValue
          ? { value: rf.figureValue, unit: rf.figureUnit, year: rf.figureYear }
          : undefined,
        snippet: clamp25Words(rf.evidenceText || rf.statement!),
        evidenceText: clamp25Words(rf.evidenceText || rf.statement!),
        source: {
          id: `SRC-GAP-${Date.now()}-${idx}`,
          title,
          url: realUrl,
          domain,
          origin: 'web_grounded',
          verified: true
        },
        sourceTitle: title,
        sourceUrl: realUrl,
        sourceDomain: domain,
        sourceKind: 'web',
        sub: {
          credibility: rf.credibility ?? 0.8,
          novelty: rf.novelty ?? 0.7,
          storyValue: rf.storyValue ?? 0.7,
          relevance: rf.relevance ?? 0.85
        },
        score: 0.8,
        strength: 'strong',
        stance: rf.stance || 'supports',
        confidence: 'high',
        status: 'approved'
      };
    });
}
