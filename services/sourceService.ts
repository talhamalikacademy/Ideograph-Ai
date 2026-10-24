import { Type, Schema } from "@google/genai";
import { FactCard, QuoteCard, BookRef, SourceRef, FactType } from "../types";
import { createGeminiClient, runGroundedJson } from "../llm";
import { ResearchStyle } from "../creator-research/types";

export interface ExtractedUserSourcesResult {
  facts: FactCard[];
  quotes: QuoteCard[];
}

export interface LibraryQuoteItem {
  id: string;
  quote: string;
  speaker: string;
  workOrContext: string;
  year?: string;
  tags: string[];
  usage: 'hook' | 'transition' | 'closing' | 'any';
}

export interface SourcePageChunk {
  page: number;
  text: string;
}

export interface SourceQuoteIdea {
  id: string;
  text: string;
  page?: string;
  suggestedUse: 'hook' | 'evidence' | 'counter' | 'closing';
  why: string;
  verified: boolean;
}

export interface SourceInsights {
  summary: string;
  keyIdeas: string[];
  quotes: SourceQuoteIdea[];
  numbers: { figure: string; unit?: string; year?: string; where: string }[];
  storiesAndParables: { story: string; whyItFits: string }[];
  termsAndNames: string[];
  fillsQuestions: number[];
  droppedUnverifiedQuotesCount: number;
}

export interface UserSource {
  id: string;
  title: string;
  author?: string;
  year?: string;
  url?: string;
  kind: 'user_file' | 'user_link' | 'user_paste' | 'book_text' | 'book_metadata';
  text?: string;
  pages?: SourcePageChunk[];
  useInScript: boolean;
  status: 'reading' | 'ready' | 'failed';
  errorReason?: string;
  insights?: SourceInsights;
  addedAt: string;
}

export interface SourceKeywordMatch {
  id: string;
  sourceId: string;
  sourceTitle: string;
  page?: number;
  surroundingSentence: string;
  matchedTerm: string;
}

export const QUOTES_LIBRARY: LibraryQuoteItem[] = [
  {
    id: 'LIB-Q1',
    quote: 'Power is not a means; it is an end.',
    speaker: 'George Orwell',
    workOrContext: '1984',
    year: '1949',
    tags: ['power', 'governance', 'history', 'control'],
    usage: 'hook'
  },
  {
    id: 'LIB-Q2',
    quote: 'Show me the incentive and I will show you the outcome.',
    speaker: 'Charlie Munger',
    workOrContext: 'Poor Charlie’s Almanack',
    year: '1995',
    tags: ['economy', 'money', 'systems', 'business'],
    usage: 'transition'
  },
  {
    id: 'LIB-Q3',
    quote: 'In a time of deceit, telling the truth is a revolutionary act.',
    speaker: 'Attributed to George Orwell',
    workOrContext: 'Political Essays',
    year: '1946',
    tags: ['truth', 'media', 'investigation'],
    usage: 'hook'
  },
  {
    id: 'LIB-Q4',
    quote: 'The first principle is that you must not fool yourself — and you are the easiest person to fool.',
    speaker: 'Richard Feynman',
    workOrContext: 'Caltech Commencement Address',
    year: '1974',
    tags: ['science', 'evidence', 'psychology', 'truth'],
    usage: 'hook'
  },
  {
    id: 'LIB-Q5',
    quote: 'Those who cannot remember the past are condemned to repeat it.',
    speaker: 'George Santayana',
    workOrContext: 'The Life of Reason',
    year: '1905',
    tags: ['history', 'lessons', 'policy'],
    usage: 'closing'
  },
  {
    id: 'LIB-Q6',
    quote: 'When a measure becomes a target, it ceases to be a good measure.',
    speaker: 'Charles Goodhart',
    workOrContext: 'Goodhart’s Law (Monetary Economics)',
    year: '1975',
    tags: ['data', 'systems', 'economy', 'policy'],
    usage: 'transition'
  },
  {
    id: 'LIB-Q7',
    quote: 'History doesn’t repeat itself, but it often rhymes.',
    speaker: 'Attributed to Mark Twain',
    workOrContext: 'Historical Commentary',
    year: '1900',
    tags: ['history', 'cycles', 'society'],
    usage: 'transition'
  },
  {
    id: 'LIB-Q8',
    quote: 'We shape our tools, and thereafter our tools shape us.',
    speaker: 'John Culkin / Marshall McLuhan',
    workOrContext: 'Media & Technology Studies',
    year: '1967',
    tags: ['technology', 'science', 'future', 'society'],
    usage: 'closing'
  },
  {
    id: 'LIB-Q9',
    quote: 'It is difficult to get a man to understand something, when his salary depends upon his not understanding it.',
    speaker: 'Upton Sinclair',
    workOrContext: 'I, Candidate for Governor',
    year: '1935',
    tags: ['money', 'corruption', 'systems', 'power'],
    usage: 'transition'
  },
  {
    id: 'LIB-Q10',
    quote: 'Compound interest is the eighth wonder of the world. He who understands it, earns it; he who doesn’t, pays it.',
    speaker: 'Popularly attributed to Albert Einstein',
    workOrContext: 'Financial & Mathematical Maxim',
    year: '1920s',
    tags: ['money', 'business', 'future'],
    usage: 'hook'
  }
];

const IDB_NAME = 'ideograph_sources_db_v1';
const IDB_STORE = 'user_sources';

function openSourcesIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveUserSourcesToIDB(sources: UserSource[]): Promise<void> {
  try {
    const db = await openSourcesIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.clear();
    for (const s of sources) {
      store.put(s);
    }
  } catch {
    // Fallback to sessionStorage if IndexedDB fails
  }
}

export async function loadUserSourcesFromIDB(): Promise<UserSource[]> {
  try {
    const db = await openSourcesIDB();
    return await new Promise<UserSource[]>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

const userExtractionSchema: Schema = {
  type: Type.OBJECT,
  required: ["facts", "quotes"],
  properties: {
    facts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["type", "claim", "snippet"],
        properties: {
          type: {
            type: Type.STRING,
            enum: [
              'official_data',
              'official_documents',
              'news',
              'books_history',
              'global_studies',
              'expert_views',
              'public_voices',
              'user_material',
              'benchmarks',
              'stat',
              'event',
              'policy',
              'study',
              'book',
              'quote',
              'public_voice',
              'counter'
            ]
          },
          claim: { type: Type.STRING, description: "One clear, factual sentence." },
          value: { type: Type.STRING, description: "Exact number, percentage, amount, or date if present." },
          location: { type: Type.STRING, description: "City, country, or place if explicitly mentioned." },
          snippet: { type: Type.STRING, description: "Verbatim excerpt <= 25 words from the source text." }
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
          usage: { type: Type.STRING, enum: ['hook', 'transition', 'closing', 'any'] }
        }
      }
    }
  }
};

const sourceInsightsSchema: Schema = {
  type: Type.OBJECT,
  required: [
    "summary",
    "keyIdeas",
    "quotes",
    "numbers",
    "storiesAndParables",
    "termsAndNames",
    "fillsQuestions"
  ],
  properties: {
    summary: {
      type: Type.STRING,
      description: "Plain summary of the source in 120 words or fewer."
    },
    keyIdeas: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    quotes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["text", "suggestedUse", "why"],
        properties: {
          text: {
            type: Type.STRING,
            description: "Exact verbatim quote from the text, MUST be under 25 words."
          },
          page: { type: Type.STRING },
          suggestedUse: {
            type: Type.STRING,
            enum: ['hook', 'evidence', 'counter', 'closing']
          },
          why: { type: Type.STRING }
        }
      }
    },
    numbers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["figure", "where"],
        properties: {
          figure: { type: Type.STRING },
          unit: { type: Type.STRING },
          year: { type: Type.STRING },
          where: { type: Type.STRING }
        }
      }
    },
    storiesAndParables: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["story", "whyItFits"],
        properties: {
          story: { type: Type.STRING },
          whyItFits: { type: Type.STRING }
        }
      }
    },
    termsAndNames: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    fillsQuestions: {
      type: Type.ARRAY,
      items: { type: Type.NUMBER },
      description: "Zero-based indices of the research questions that this source helps answer."
    }
  }
};

function clampSnippetWords(snippet: string, maxWords = 25): string {
  const words = (snippet || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}

/**
 * Normalizes text for strict in-code quote verification:
 * lowercases, normalizes curly quotes/apostrophes/dashes, and collapses whitespace.
 */
export function normalizeForQuoteCheck(input: string): string {
  return (input || "")
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B`']/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F"]/g, '"')
    .replace(/[\u2013\u2014\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Verifies in code that a quote is under 25 words AND appears word-for-word in the uploaded source text.
 */
export function verifyQuoteInSourceText(
  quoteText: string,
  fullSourceText: string,
  pages?: SourcePageChunk[]
): { verified: boolean; matchedPage?: string } {
  const words = (quoteText || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 25) {
    return { verified: false };
  }

  const normQuote = normalizeForQuoteCheck(quoteText).replace(/^["']+|["']+$/g, "").trim();
  if (normQuote.length < 8) return { verified: false };

  if (pages && pages.length > 0) {
    for (const p of pages) {
      const normPage = normalizeForQuoteCheck(p.text);
      if (normPage.includes(normQuote)) {
        return { verified: true, matchedPage: String(p.page) };
      }
    }
  }

  const normSource = normalizeForQuoteCheck(fullSourceText);
  if (normSource.includes(normQuote)) {
    return { verified: true };
  }

  return { verified: false };
}

/**
 * Reads plain text and page chunks from uploaded .txt, .md, .pdf, or .docx files on the client.
 */
export async function readUploadedFileWithPages(
  file: File
): Promise<{ text: string; pages: SourcePageChunk[] }> {
  const lower = file.name.toLowerCase();
  if (file.type === "application/pdf" || lower.endsWith(".pdf")) {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const maxPages = Math.min(pdf.numPages, 150);
    const pages: SourcePageChunk[] = [];
    let fullText = "";
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      const pageText = tc.items.map((item: any) => item.str || "").join(" ").trim();
      if (pageText) {
        pages.push({ page: i, text: pageText });
        fullText += `[Page ${i}]\n${pageText}\n\n`;
      }
    }
    return { text: fullText.trim(), pages };
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    const mammothModule = await import("mammoth");
    const mammothLib = mammothModule.default || mammothModule;
    const arrayBuffer = await file.arrayBuffer();
    const res = await mammothLib.extractRawText({ arrayBuffer });
    const raw = (res.value || "").trim();
    const words = raw.split(/\s+/);
    const pages: SourcePageChunk[] = [];
    const wordsPerPage = 350;
    for (let i = 0; i < words.length; i += wordsPerPage) {
      pages.push({
        page: Math.floor(i / wordsPerPage) + 1,
        text: words.slice(i, i + wordsPerPage).join(" ")
      });
    }
    return { text: raw, pages };
  }

  const raw = (await file.text()).trim();
  const words = raw.split(/\s+/);
  const pages: SourcePageChunk[] = [];
  const wordsPerPage = 350;
  for (let i = 0; i < words.length; i += wordsPerPage) {
    pages.push({
      page: Math.floor(i / wordsPerPage) + 1,
      text: words.slice(i, i + wordsPerPage).join(" ")
    });
  }
  return { text: raw, pages };
}

export async function readUploadedFileText(file: File): Promise<string> {
  const res = await readUploadedFileWithPages(file);
  return res.text;
}

/**
 * Phase R4: Analyzes a UserSource and enforces code-level quote verification (<25 words, exact substring in source).
 * A metadata-only book (with no uploaded text) gets ZERO quotes.
 */
export async function analyzeSource(options: {
  source: UserSource;
  topic: string;
  style?: ResearchStyle;
  questions?: string[];
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<SourceInsights> {
  const { source, topic, style, questions = [], apiKey, signal } = options;

  // Metadata-only books get zero quotes
  if (source.kind === 'book_metadata' || !source.text || !source.text.trim()) {
    return {
      summary: `Reference book: "${source.title}"${source.author ? ` by ${source.author}` : ''}. Text not available — used as a reference without direct quotes.`,
      keyIdeas: [`Reference work relevant to ${topic}`],
      quotes: [],
      numbers: [],
      storiesAndParables: [],
      termsAndNames: [source.title, ...(source.author ? [source.author] : [])],
      fillsQuestions: [],
      droppedUnverifiedQuotesCount: 0
    };
  }

  const client = createGeminiClient(apiKey);
  const questionsList = (questions.length > 0 ? questions : style?.questionSet || [])
    .map((q, idx) => `${idx}: ${q}`)
    .join('\n');

  const prompt = `
    Analyze this user-provided source for a video on "${topic}".
    SOURCE TITLE: "${source.title}"
    ${style ? `RESEARCH INTENT: ${style.intent}` : ''}

    RESEARCH QUESTIONS (0-indexed):
    ${questionsList || '0: Core facts and stories for this topic'}

    STRICT RULES:
    - Summary must be 120 words or fewer.
    - Extract up to 12 verbatim quotes from the text. EVERY quote MUST be under 25 words and copied word-for-word from the text below.
    - Extract concrete numbers/figures with their unit, year, and page/section.
    - Extract short stories or examples and explain why they fit.
    - List key terms and names from the source worth using.
    - Do NOT invent anything outside the provided source text.

    SOURCE TEXT:
    """
    ${source.text.slice(0, 42000)}
    """
  `;

  const { data } = await client.generateJson<{
    summary?: string;
    keyIdeas?: string[];
    quotes?: Array<{
      text?: string;
      page?: string;
      suggestedUse?: 'hook' | 'evidence' | 'counter' | 'closing';
      why?: string;
    }>;
    numbers?: Array<{
      figure?: string;
      unit?: string;
      year?: string;
      where?: string;
    }>;
    storiesAndParables?: Array<{
      story?: string;
      whyItFits?: string;
    }>;
    termsAndNames?: string[];
    fillsQuestions?: number[];
  }>({
    task: 'analysis',
    prompt,
    schema: sourceInsightsSchema,
    signal
  });

  const rawQuotes = data.quotes || [];
  const verifiedQuotes: SourceQuoteIdea[] = [];
  let droppedCount = 0;

  for (let i = 0; i < rawQuotes.length; i++) {
    const rq = rawQuotes[i];
    const qText = (rq.text || '').trim();
    if (!qText) continue;

    const check = verifyQuoteInSourceText(qText, source.text, source.pages);
    if (check.verified) {
      verifiedQuotes.push({
        id: `SQ-${source.id}-${verifiedQuotes.length + 1}`,
        text: qText,
        page: check.matchedPage || rq.page || undefined,
        suggestedUse: rq.suggestedUse || 'evidence',
        why: rq.why || `Verified quote from ${source.title}`,
        verified: true
      });
    } else {
      droppedCount++;
    }
  }

  const summaryWords = (data.summary || '').trim().split(/\s+/).filter(Boolean);
  const clampedSummary =
    summaryWords.length <= 120
      ? summaryWords.join(' ')
      : summaryWords.slice(0, 120).join(' ') + '...';

  return {
    summary: clampedSummary || `Extracted insights from ${source.title}.`,
    keyIdeas: (data.keyIdeas || []).slice(0, 8),
    quotes: verifiedQuotes,
    numbers: (data.numbers || [])
      .filter(n => n.figure)
      .map(n => ({
        figure: n.figure!,
        unit: n.unit,
        year: n.year,
        where: n.where || source.title
      })),
    storiesAndParables: (data.storiesAndParables || [])
      .filter(s => s.story)
      .map(s => ({
        story: s.story!,
        whyItFits: s.whyItFits || 'Supports the narrative'
      })),
    termsAndNames: (data.termsAndNames || []).slice(0, 15),
    fillsQuestions: Array.isArray(data.fillsQuestions) ? data.fillsQuestions : [],
    droppedUnverifiedQuotesCount: droppedCount
  };
}

/**
 * Phase R4: Searches inside uploaded user sources for a word or phrase, returning surrounding sentences and page numbers.
 */
export function searchInsideUserSources(
  query: string,
  sources: UserSource[]
): SourceKeywordMatch[] {
  const cleanQuery = (query || '').trim().toLowerCase();
  if (cleanQuery.length < 2) return [];

  const matches: SourceKeywordMatch[] = [];

  for (const src of sources) {
    if (!src.text) continue;
    const chunks: SourcePageChunk[] =
      src.pages && src.pages.length > 0 ? src.pages : [{ page: 1, text: src.text }];

    for (const chunk of chunks) {
      const sentences = chunk.text.split(/(?<=[.!?])\s+/);
      for (let i = 0; i < sentences.length; i++) {
        const s = sentences[i].trim();
        if (s.toLowerCase().includes(cleanQuery)) {
          const snippet = clampSnippetWords(s, 24);
          matches.push({
            id: `MATCH-${src.id}-${chunk.page}-${i}`,
            sourceId: src.id,
            sourceTitle: src.title,
            page: chunk.page,
            surroundingSentence: snippet,
            matchedTerm: query.trim()
          });
          if (matches.length >= 30) return matches;
        }
      }
    }
  }

  return matches;
}

/**
 * Converts a verified SourceQuoteIdea or SourceKeywordMatch into a FactCard for the research notes.
 */
export function createFactCardFromUserSource(options: {
  source: UserSource;
  statement: string;
  quoteText?: string;
  page?: string;
  figure?: { value: string | number; unit?: string; year?: number };
  existingCount: number;
}): FactCard {
  const { source, statement, quoteText, page, figure, existingCount } = options;
  const isBook = source.kind === 'book_text';
  const factType: FactType = isBook ? 'books_history' : 'user_material';

  return {
    id: `F${existingCount + 1}`,
    type: factType,
    claim: statement,
    statement,
    value: figure ? `${figure.value}${figure.unit ? ` ${figure.unit}` : ''}` : undefined,
    figure,
    snippet: clampSnippetWords(quoteText || statement, 25),
    evidenceText: clampSnippetWords(quoteText || statement, 25),
    source: {
      id: `SRC-${source.id}`,
      title: source.title,
      author: source.author,
      year: source.year,
      url: source.url || `user-source://${source.id}`,
      origin: source.kind === 'user_link' ? 'user_link' : source.kind === 'user_paste' ? 'user_paste' : 'user_upload',
      verified: true
    },
    sourceTitle: source.title,
    sourceUrl: source.url || `user-source://${source.id}`,
    sourceDomain: 'your-material',
    sourceKind: source.kind === 'book_metadata' ? 'book_text' : source.kind,
    quote: quoteText
      ? {
          text: clampSnippetWords(quoteText, 25),
          page,
          verified: true
        }
      : undefined,
    sub: { credibility: 0.95, novelty: 0.85, storyValue: 0.85, relevance: 0.95 },
    score: 0.92,
    strength: 'strong',
    stance: 'supports',
    confidence: 'high',
    status: 'approved'
  };
}

/**
 * Extracts structured FactCards and QuoteCards from user-supplied text or uploaded file text.
 */
export async function extractCardsFromUserText(options: {
  text?: string;
  rawText?: string;
  sourceTitle?: string;
  title?: string;
  origin: 'user_upload' | 'user_paste';
  topic?: string;
  existingFactCount?: number;
  existingQuoteCount?: number;
  url?: string;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<ExtractedUserSourcesResult> {
  const cleanText = (options.text || options.rawText || "").trim();
  const resolvedTitle = options.sourceTitle || options.title || "User Provided Source";
  if (!cleanText) return { facts: [], quotes: [] };

  const client = createGeminiClient(options.apiKey);
  const prompt = `
    Extract up to 10 concrete, verifiable facts and up to 5 notable direct quotes from the user-provided source text below.
    SOURCE TITLE: "${resolvedTitle}"

    RULES:
    - Only extract facts, numbers, dates, events, policies, and quotes that explicitly appear in the text below.
    - Do NOT invent any numbers, names, or quotes outside the text.
    - Keep each 'snippet' and 'quote' under 25 words verbatim from the text.

    USER SOURCE TEXT:
    """
    ${cleanText.slice(0, 35000)}
    """
  `;

  const { data } = await client.generateJson<{
    facts?: Array<{
      type?: FactType;
      claim?: string;
      value?: string;
      location?: string;
      snippet?: string;
    }>;
    quotes?: Array<{
      quote?: string;
      speaker?: string;
      workOrContext?: string;
      year?: string;
      usage?: 'hook' | 'transition' | 'closing' | 'any';
    }>;
  }>({
    task: 'analysis',
    prompt,
    schema: userExtractionSchema,
    signal: options.signal
  });

  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  const baseSource: SourceRef = {
    id: `SRC-USER-${ts}`,
    title: resolvedTitle,
    url: options.url || `user-source://${ts}`,
    origin: options.origin,
    verified: true
  };

  const facts: FactCard[] = (data.facts || [])
    .filter(f => f.claim && f.claim.trim())
    .map((f, idx) => ({
      id: `FU-${ts}-${idx + 1}`,
      type: (f.type as FactType) || "user_material",
      claim: f.claim!.trim(),
      statement: f.claim!.trim(),
      value: f.value?.trim() || undefined,
      location: f.location?.trim() || undefined,
      place: f.location?.trim() || undefined,
      snippet: clampSnippetWords(f.snippet || f.claim || "", 25),
      evidenceText: clampSnippetWords(f.snippet || f.claim || "", 25),
      source: { ...baseSource, id: `${baseSource.id}-F${idx + 1}` },
      sourceTitle: resolvedTitle,
      sourceUrl: baseSource.url,
      sourceDomain: 'your-material',
      sourceKind: options.origin === 'user_paste' ? 'user_paste' : 'user_file',
      sub: { credibility: 0.9, novelty: 0.8, storyValue: 0.8, relevance: 0.9 },
      score: 0.88,
      strength: 'strong',
      stance: 'supports',
      confidence: "high",
      status: "approved"
    }));

  // Verify every extracted quote in code against cleanText
  const quotes: QuoteCard[] = (data.quotes || [])
    .filter(q => {
      if (!q.quote || !q.quote.trim()) return false;
      return verifyQuoteInSourceText(q.quote, cleanText).verified;
    })
    .map((q, idx) => ({
      id: `QU-${ts}-${idx + 1}`,
      quote: clampSnippetWords(q.quote!.trim(), 25),
      speaker: q.speaker?.trim() || resolvedTitle,
      workOrContext: q.workOrContext?.trim() || resolvedTitle,
      year: q.year?.trim() || undefined,
      usage: q.usage || "any",
      source: { ...baseSource, id: `${baseSource.id}-Q${idx + 1}` },
      verifiedExactText: true,
      status: "approved"
    }));

  return { facts, quotes };
}

/**
 * Extracts FactCards and QuoteCards from up to 5 user-pasted URLs using grounded web search.
 */
export async function extractCardsFromUrls(options: {
  urls: string[];
  topicContext?: string;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<ExtractedUserSourcesResult> {
  const validUrls = options.urls
    .map(u => u.trim())
    .filter(u => /^https?:\/\//i.test(u))
    .slice(0, 5);

  if (validUrls.length === 0) return { facts: [], quotes: [] };

  const prompt = `
    Read and verify the contents of these user-supplied URLs using Google Search grounding:
    ${validUrls.map((u, i) => `${i + 1}. ${u}`).join("\n")}
    ${options.topicContext ? `\nTopic context: "${options.topicContext}"` : ""}

    Extract concrete facts, statistics, dates, events, and direct quotes found on these pages.
    Keep each 'snippet' to <= 25 words verbatim from the page.
  `;

  const { data, sources } = await runGroundedJson<{
    facts?: Array<{
      type?: FactType;
      claim?: string;
      value?: string;
      location?: string;
      snippet?: string;
    }>;
    quotes?: Array<{
      quote?: string;
      speaker?: string;
      workOrContext?: string;
      year?: string;
      usage?: 'hook' | 'transition' | 'closing' | 'any';
    }>;
  }>({
    prompt,
    schema: userExtractionSchema,
    apiKey: options.apiKey,
    signal: options.signal
  });

  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  const primaryUrl = validUrls[0];
  let domain = "";
  try {
    domain = new URL(primaryUrl).hostname.replace(/^www\./, "");
  } catch {
    domain = "web-source";
  }

  const facts: FactCard[] = (data.facts || [])
    .filter(f => f.claim && f.claim.trim())
    .map((f, idx) => {
      const matchedSource = sources[idx % Math.max(1, sources.length)];
      const resolvedUrl = matchedSource?.uri || validUrls[idx % validUrls.length];
      return {
        id: `FL-${ts}-${idx + 1}`,
        type: (f.type as FactType) || "user_material",
        claim: f.claim!.trim(),
        statement: f.claim!.trim(),
        value: f.value?.trim() || undefined,
        location: f.location?.trim() || undefined,
        snippet: clampSnippetWords(f.snippet || f.claim || "", 25),
        evidenceText: clampSnippetWords(f.snippet || f.claim || "", 25),
        source: {
          id: `SRC-LINK-${ts}-${idx + 1}`,
          title: matchedSource?.title || `User Link (${domain})`,
          url: resolvedUrl,
          domain,
          origin: "user_link",
          verified: true
        },
        sourceTitle: matchedSource?.title || `User Link (${domain})`,
        sourceUrl: resolvedUrl,
        sourceDomain: domain,
        sourceKind: 'user_link',
        sub: { credibility: 0.85, novelty: 0.75, storyValue: 0.75, relevance: 0.85 },
        score: 0.82,
        strength: 'strong',
        stance: 'supports',
        confidence: "high",
        status: "approved"
      };
    });

  // Web quotes cannot be verified word-for-word against an uploaded file, so verifiedExactText is false ("check at source")
  const quotes: QuoteCard[] = (data.quotes || [])
    .filter(q => q.quote && q.quote.trim())
    .map((q, idx) => ({
      id: `QL-${ts}-${idx + 1}`,
      quote: clampSnippetWords(q.quote!.trim(), 25),
      speaker: q.speaker?.trim() || domain,
      workOrContext: q.workOrContext?.trim() || primaryUrl,
      year: q.year?.trim() || undefined,
      usage: q.usage || "any",
      source: {
        id: `SRC-LINK-Q-${ts}-${idx + 1}`,
        title: `User Link (${domain})`,
        url: primaryUrl,
        domain,
        origin: "user_link",
        verified: true
      },
      verifiedExactText: false,
      status: "approved"
    }));

  return { facts, quotes };
}

/**
 * Searches Google Books API and Open Library API in parallel and returns deduplicated BookRef items.
 * All API-discovered books default to `sourceLevel: 'metadata_only'` ("Text not available" — no quotes).
 */
export async function searchBooks(
  query: string,
  topicContext?: string,
  signal?: AbortSignal
): Promise<BookRef[]> {
  const cleanQuery = (query || "").trim();
  if (!cleanQuery) return [];

  const encoded = encodeURIComponent(cleanQuery);
  const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=${encoded}&maxResults=8`;
  const openLibraryUrl = `https://openlibrary.org/search.json?q=${encoded}&limit=6`;

  const [googleRes, openLibRes] = await Promise.allSettled([
    fetch(googleBooksUrl, { signal }).then(r => (r.ok ? r.json() : null)),
    fetch(openLibraryUrl, { signal }).then(r => (r.ok ? r.json() : null))
  ]);

  const books: BookRef[] = [];
  const seenKeys = new Set<string>();

  if (googleRes.status === "fulfilled" && googleRes.value?.items) {
    for (const item of googleRes.value.items) {
      const info = item.volumeInfo || {};
      const title = (info.title || "").trim();
      if (!title) continue;
      const authors: string[] =
        Array.isArray(info.authors) && info.authors.length > 0
          ? info.authors
          : ["Unknown Author"];
      const dedupeKey = `${title.toLowerCase()}::${authors[0].toLowerCase()}`;
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);

      const yearMatch = (info.publishedDate || "").match(/\b(1\d{3}|20\d{2})\b/);
      const description = (info.description || info.subtitle || "").trim();
      const idea = description
        ? description.slice(0, 200)
        : `Published book by ${authors.join(", ")}${topicContext ? ` relevant to ${topicContext}` : ""}.`;
      books.push({
        id: `B-${books.length + 1}`,
        title,
        authors,
        author: authors.join(", "),
        year: yearMatch ? yearMatch[1] : undefined,
        description: description ? description.slice(0, 320) : undefined,
        coreIdeaForTopic: idea,
        relevance: idea,
        previewLink: info.previewLink || info.infoLink || undefined,
        sourceLevel: "metadata_only",
        status: "approved"
      });
    }
  }

  if (openLibRes.status === "fulfilled" && Array.isArray(openLibRes.value?.docs)) {
    for (const doc of openLibRes.value.docs) {
      const title = (doc.title || "").trim();
      if (!title) continue;
      const authors: string[] =
        Array.isArray(doc.author_name) && doc.author_name.length > 0
          ? doc.author_name.slice(0, 3)
          : ["Unknown Author"];
      const dedupeKey = `${title.toLowerCase()}::${authors[0].toLowerCase()}`;
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);

      const year = doc.first_publish_year ? String(doc.first_publish_year) : undefined;
      const firstSentence = Array.isArray(doc.first_sentence)
        ? doc.first_sentence[0]
        : typeof doc.first_sentence === "string"
        ? doc.first_sentence
        : "";
      const idea = firstSentence
        ? String(firstSentence).slice(0, 200)
        : `Historical/literary work by ${authors.join(", ")}${year ? ` (${year})` : ""}.`;

      books.push({
        id: `B-${books.length + 1}`,
        title,
        authors,
        author: authors.join(", "),
        year,
        description: firstSentence ? String(firstSentence).slice(0, 280) : undefined,
        coreIdeaForTopic: idea,
        relevance: idea,
        previewLink: doc.key ? `https://openlibrary.org${doc.key}` : undefined,
        sourceLevel: "metadata_only",
        status: "approved"
      });
    }
  }

  return books.slice(0, 10);
}
