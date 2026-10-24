import React, { useState, useRef } from 'react';
import {
  FactCard,
  QuoteCard,
  BookRef,
  MySourcesState
} from '../../types';
import {
  readUploadedFileWithPages,
  analyzeSource,
  extractCardsFromUrls,
  searchBooks,
  searchInsideUserSources,
  createFactCardFromUserSource,
  QUOTES_LIBRARY,
  LibraryQuoteItem,
  UserSource,
  SourceInsights
} from '../../services/sourceService';
import {
  Upload,
  Link2,
  FileText,
  BookOpen,
  Quote,
  Loader2,
  Plus,
  Check,
  Search,
  ExternalLink,
  Trash2,
  AlertCircle
} from 'lucide-react';
import clsx from 'clsx';

export interface MySourcesPanelProps {
  topic: string;
  mySources: MySourcesState;
  onChangeMySources: (next: MySourcesState) => void;
  isDarkMode?: boolean;
  apiKey?: string;
}

type SourceTab = 'upload' | 'links' | 'paste' | 'books' | 'quotes' | 'search_sources';

export const MySourcesPanel: React.FC<MySourcesPanelProps> = ({
  topic,
  mySources,
  onChangeMySources,
  isDarkMode = false,
  apiKey
}) => {
  const [activeTab, setActiveTab] = useState<SourceTab>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Analyzed sources state
  const [analyzedSources, setAnalyzedSources] = useState<
    Array<{ source: UserSource; insights: SourceInsights }>
  >([]);

  // Links tab state
  const [linksInput, setLinksInput] = useState('');

  // Paste text tab state
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');

  // Books tab state
  const [bookQuery, setBookQuery] = useState('');
  const [bookResults, setBookResults] = useState<BookRef[]>([]);
  const [isSearchingBooks, setIsSearchingBooks] = useState(false);
  const [excerptDrafts, setExcerptDrafts] = useState<Record<string, string>>({});
  const [openExcerptBookId, setOpenExcerptBookId] = useState<string | null>(null);

  // Quotes tab state
  const [quoteTagFilter, setQuoteTagFilter] = useState<string>('all');
  const [customQuoteText, setCustomQuoteText] = useState('');
  const [customQuoteSpeaker, setCustomQuoteSpeaker] = useState('');
  const [customQuoteWork, setCustomQuoteWork] = useState('');

  // Find words in my sources state
  const [sourceWordSearch, setSourceWordSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const factsList = mySources.facts || mySources.extractedFacts || [];
  const quotesList = mySources.quotes || mySources.selectedQuotes || [];
  const booksList = mySources.books || mySources.selectedBooks || [];

  const totalPinnedCount = factsList.length + quotesList.length + booksList.length;

  const updateSourcesLists = (
    nextFacts: FactCard[],
    nextQuotes: QuoteCard[],
    nextBooks: BookRef[]
  ) => {
    onChangeMySources({
      ...mySources,
      facts: nextFacts,
      extractedFacts: nextFacts,
      quotes: nextQuotes,
      selectedQuotes: nextQuotes,
      extractedQuotes: nextQuotes,
      books: nextBooks,
      selectedBooks: nextBooks
    });
  };

  const appendExtracted = (newFacts: FactCard[], newQuotes: QuoteCard[]) => {
    updateSourcesLists(
      [...factsList, ...newFacts],
      [...quotesList, ...newQuotes],
      booksList
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const parsedFile = await readUploadedFileWithPages(file);
      if (!parsedFile.text) {
        setStatusMessage({ type: 'error', text: `No readable text found in "${file.name}".` });
        return;
      }

      const userSrc: UserSource = {
        id: `USRC-${Date.now()}`,
        kind: 'pdf',
        title: file.name,
        text: parsedFile.text,
        pages: parsedFile.pages,
        textAvailable: true
      };

      const insights = await analyzeSource(userSrc, topic || file.name, apiKey);
      setAnalyzedSources(prev => [{ source: userSrc, insights }, ...prev]);

      // Convert extracted facts & verified quotes into pinned cards
      const newFacts: FactCard[] = insights.facts.map((f, i) => ({
        id: `F-USER-${factsList.length + i + 1}`,
        type: 'stat',
        claim: f.claim,
        value: f.number,
        snippet: f.claim.split(/\s+/).slice(0, 25).join(' '),
        source: {
          id: userSrc.id,
          title: userSrc.title,
          pageOrSection: f.pageOrSection,
          origin: 'user_upload',
          verified: true
        },
        confidence: 'high',
        strength: 'strong',
        status: 'pinned'
      }));

      const newQuotes: QuoteCard[] = insights.quoteIdeas.map((q, i) => ({
        id: `Q-USER-${quotesList.length + i + 1}`,
        quote: q.quote,
        speaker: q.speaker,
        workOrContext: `${userSrc.title}${q.pageOrSection ? ` (${q.pageOrSection})` : ''}`,
        usage: 'any',
        source: {
          id: userSrc.id,
          title: userSrc.title,
          pageOrSection: q.pageOrSection,
          origin: 'user_upload',
          verified: true
        },
        verifiedExactText: true,
        status: 'pinned'
      }));

      appendExtracted(newFacts, newQuotes);
      const droppedNote =
        insights.droppedUnverifiedQuotesCount > 0
          ? ` (${insights.droppedUnverifiedQuotesCount} unverified quote idea(s) dropped automatically)`
          : '';
      setStatusMessage({
        type: 'success',
        text: `Added ${newFacts.length} facts and ${newQuotes.length} verified quotes (<25 words) from "${file.name}"${droppedNote}.`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || `Could not extract facts from "${file.name}".`
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExtractLinks = async () => {
    const urls = linksInput
      .split(/\n|,/)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 5);

    if (urls.length === 0) return;
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const { facts, quotes } = await extractCardsFromUrls({
        urls,
        topicContext: topic,
        apiKey
      });
      appendExtracted(facts, quotes);
      setLinksInput('');
      setStatusMessage({
        type: 'success',
        text: `Added ${facts.length} facts and ${quotes.length} quotes from ${urls.length} link(s).`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to read links. Check URLs or API key.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtractPaste = async () => {
    if (!pasteText.trim()) return;
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const title = pasteTitle.trim() || 'Pasted Notes';
      const userSrc: UserSource = {
        id: `USRC-NOTE-${Date.now()}`,
        kind: 'note',
        title,
        text: pasteText.trim(),
        textAvailable: true
      };

      const insights = await analyzeSource(userSrc, topic || title, apiKey);
      setAnalyzedSources(prev => [{ source: userSrc, insights }, ...prev]);

      const newFacts: FactCard[] = insights.facts.map((f, i) => ({
        id: `F-NOTE-${factsList.length + i + 1}`,
        type: 'stat',
        claim: f.claim,
        value: f.number,
        snippet: f.claim.split(/\s+/).slice(0, 25).join(' '),
        source: {
          id: userSrc.id,
          title: userSrc.title,
          pageOrSection: f.pageOrSection,
          origin: 'user_paste',
          verified: true
        },
        confidence: 'high',
        strength: 'strong',
        status: 'pinned'
      }));

      const newQuotes: QuoteCard[] = insights.quoteIdeas.map((q, i) => ({
        id: `Q-NOTE-${quotesList.length + i + 1}`,
        quote: q.quote,
        speaker: q.speaker,
        workOrContext: userSrc.title,
        usage: 'any',
        source: {
          id: userSrc.id,
          title: userSrc.title,
          origin: 'user_paste',
          verified: true
        },
        verifiedExactText: true,
        status: 'pinned'
      }));

      appendExtracted(newFacts, newQuotes);
      setPasteText('');
      setPasteTitle('');
      const droppedNote =
        insights.droppedUnverifiedQuotesCount > 0
          ? ` (${insights.droppedUnverifiedQuotesCount} unverified quote(s) dropped)`
          : '';
      setStatusMessage({
        type: 'success',
        text: `Added ${newFacts.length} facts and ${newQuotes.length} verified quotes from your notes${droppedNote}.`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to extract facts from pasted text.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearchBooks = async () => {
    const q = (bookQuery || topic).trim();
    if (!q) return;
    setIsSearchingBooks(true);
    setStatusMessage(null);
    try {
      const results = await searchBooks(q, topic);
      setBookResults(results);
      if (results.length === 0) {
        setStatusMessage({ type: 'error', text: 'No matching books found. Try a broader title or author name.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Book search failed.' });
    } finally {
      setIsSearchingBooks(false);
    }
  };

  const handleAddBook = (book: BookRef, customExcerpt?: string) => {
    const cleanExcerpt = (customExcerpt || '').trim();
    const exists = booksList.some(
      b => b.title.toLowerCase() === book.title.toLowerCase()
    );
    if (exists && !cleanExcerpt) return;

    const bookToAdd: BookRef = {
      ...book,
      id: `B-USER-${booksList.length + 1}`,
      sourceLevel: cleanExcerpt ? 'user_text' : 'metadata_only',
      excerptText: cleanExcerpt || undefined,
      verifiedPassage: cleanExcerpt || undefined,
      status: 'pinned'
    };

    const nextBooks = exists
      ? booksList.map(b =>
          b.title.toLowerCase() === book.title.toLowerCase() ? bookToAdd : b
        )
      : [...booksList, bookToAdd];

    updateSourcesLists(factsList, quotesList, nextBooks);
    setOpenExcerptBookId(null);
    setStatusMessage({
      type: 'success',
      text: cleanExcerpt
        ? `Added "${book.title}" with your pasted passage (direct quotes <25 words allowed).`
        : `Added "${book.title}" (Text not available — script will reference title, author & idea without quoting).`
    });
  };

  const handleAddLibraryQuote = (item: LibraryQuoteItem) => {
    const exists = quotesList.some(
      q => q.quote.toLowerCase() === item.quote.toLowerCase()
    );
    if (exists) return;

    const newCard: QuoteCard = {
      id: `Q-LIB-${quotesList.length + 1}`,
      quote: item.quote,
      speaker: item.speaker,
      workOrContext: item.workOrContext,
      year: item.year,
      usage: item.usage,
      source: {
        id: `SRC-LIB-${item.id}`,
        title: `${item.speaker} — ${item.workOrContext}`,
        author: item.speaker,
        year: item.year,
        origin: 'user_paste',
        verified: true
      },
      verifiedExactText: true,
      status: 'pinned'
    };

    updateSourcesLists(factsList, [...quotesList, newCard], booksList);
    setStatusMessage({
      type: 'success',
      text: `Added quote by ${item.speaker} to your sources.`
    });
  };

  const handleAddCustomQuote = () => {
    if (!customQuoteText.trim() || !customQuoteSpeaker.trim()) return;
    const words = customQuoteText.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 25) {
      setStatusMessage({
        type: 'error',
        text: `Quotes must be under 25 words (currently ${words.length} words). Please shorten the quote.`
      });
      return;
    }

    const newCard: QuoteCard = {
      id: `Q-CUST-${quotesList.length + 1}`,
      quote: customQuoteText.trim(),
      speaker: customQuoteSpeaker.trim(),
      workOrContext: customQuoteWork.trim() || 'User Provided Quote',
      usage: 'any',
      source: {
        id: `SRC-CUST-${Date.now()}`,
        title: `${customQuoteSpeaker.trim()} (${customQuoteWork.trim() || 'Direct Quote'})`,
        author: customQuoteSpeaker.trim(),
        origin: 'user_paste',
        verified: true
      },
      verifiedExactText: true,
      status: 'pinned'
    };

    updateSourcesLists(factsList, [...quotesList, newCard], booksList);
    setCustomQuoteText('');
    setCustomQuoteSpeaker('');
    setCustomQuoteWork('');
    setStatusMessage({
      type: 'success',
      text: 'Added your custom quote (<25 words) to your sources.'
    });
  };

  const handleRemoveFact = (id: string) => {
    updateSourcesLists(
      factsList.filter(f => f.id !== id),
      quotesList,
      booksList
    );
  };

  const handleRemoveQuote = (id: string) => {
    updateSourcesLists(
      factsList,
      quotesList.filter(q => q.id !== id),
      booksList
    );
  };

  const handleRemoveBook = (id: string) => {
    updateSourcesLists(
      factsList,
      quotesList,
      booksList.filter(b => b.id !== id)
    );
  };

  const userSourcesForSearch = analyzedSources.map(a => a.source);
  const searchMatches = sourceWordSearch.trim()
    ? searchInsideUserSources(userSourcesForSearch, sourceWordSearch)
    : [];

  const allQuoteTags = ['all', 'power', 'economy', 'science', 'history', 'truth', 'technology'];
  const filteredQuotes =
    quoteTagFilter === 'all'
      ? QUOTES_LIBRARY
      : QUOTES_LIBRARY.filter(q => q.tags.includes(quoteTagFilter));

  return (
    <div
      className={clsx(
        'rounded-2xl border p-5 sm:p-6 space-y-5',
        isDarkMode ? 'bg-[#0f172a]/90 border-white/10' : 'bg-white border-slate-200'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className={clsx('font-display text-base sm:text-lg font-bold', isDarkMode ? 'text-white' : 'text-slate-900')}>
            My sources (optional — included in script)
          </h3>
          <p className={clsx('text-xs sm:text-sm', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
            Upload your own files, paste article links, search books, or pick quotes. Direct quotes are verified word-for-word and kept under 25 words.
          </p>
        </div>
        <div className={clsx('text-xs font-mono tabular-nums', isDarkMode ? 'text-indigo-300' : 'text-indigo-600')}>
          {totalPinnedCount} saved item{totalPinnedCount === 1 ? '' : 's'}
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div
        className={clsx(
          'flex flex-wrap items-center gap-1 p-1 rounded-xl border',
          isDarkMode ? 'bg-black/30 border-white/10' : 'bg-slate-100 border-slate-200'
        )}
      >
        {([
          { id: 'upload', label: 'Upload files', icon: Upload },
          { id: 'links', label: 'Paste links', icon: Link2 },
          { id: 'paste', label: 'Paste text', icon: FileText },
          { id: 'books', label: 'Find a book', icon: BookOpen },
          { id: 'quotes', label: 'Quotes library', icon: Quote },
          { id: 'search_sources', label: 'Find words in my sources', icon: Search }
        ] as const).map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors',
                active
                  ? isDarkMode
                    ? 'bg-[#1e293b] text-white shadow-sm'
                    : 'bg-white text-slate-900 shadow-sm'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {statusMessage && (
        <div
          className={clsx(
            'px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between gap-2',
            statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
          )}
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{statusMessage.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: UPLOAD FILES */}
      {activeTab === 'upload' && (
        <div className="space-y-3">
          <p className={clsx('text-xs sm:text-sm', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
            Upload a `.pdf`, `.docx`, `.txt`, or `.md` report or book chapter. We extract key points, numbers, and verified short quotes (&lt;25 words).
          </p>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              <span>{isProcessing ? 'Reading file & verifying quotes...' : 'Choose PDF, DOCX, TXT, or MD file'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      )}

      {/* TAB 2: PASTE LINKS */}
      {activeTab === 'links' && (
        <div className="space-y-3">
          <label className={clsx('block text-xs sm:text-sm font-medium', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
            Paste up to 5 article or report URLs (one per line)
          </label>
          <textarea
            rows={3}
            value={linksInput}
            onChange={e => setLinksInput(e.target.value)}
            placeholder="https://example.com/report-1&#10;https://example.org/study-2"
            className={clsx(
              'w-full rounded-xl border p-3 text-xs sm:text-sm outline-none',
              isDarkMode
                ? 'bg-black/25 border-white/15 text-white placeholder-slate-500 focus:border-indigo-400'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
            )}
          />
          <button
            type="button"
            onClick={handleExtractLinks}
            disabled={isProcessing || !linksInput.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
            <span>{isProcessing ? 'Reading links...' : 'Extract facts from links'}</span>
          </button>
        </div>
      )}

      {/* TAB 3: PASTE TEXT */}
      {activeTab === 'paste' && (
        <div className="space-y-3">
          <input
            type="text"
            value={pasteTitle}
            onChange={e => setPasteTitle(e.target.value)}
            placeholder="Source title (e.g., Audit Report 2025, Book Chapter 3, Personal Field Notes)"
            className={clsx(
              'w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none',
              isDarkMode
                ? 'bg-black/25 border-white/15 text-white placeholder-slate-500 focus:border-indigo-400'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
            )}
          />
          <textarea
            rows={4}
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder="Paste raw text, statistics, or book excerpts here..."
            className={clsx(
              'w-full rounded-xl border p-3.5 text-xs sm:text-sm outline-none',
              isDarkMode
                ? 'bg-black/25 border-white/15 text-white placeholder-slate-500 focus:border-indigo-400'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
            )}
          />
          <button
            type="button"
            onClick={handleExtractPaste}
            disabled={isProcessing || !pasteText.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            <span>{isProcessing ? 'Analyzing notes...' : 'Extract facts & verified quotes'}</span>
          </button>
        </div>
      )}

      {/* TAB 4: FIND A BOOK */}
      {activeTab === 'books' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={bookQuery}
              onChange={e => setBookQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchBooks()}
              placeholder={`Search Google Books & Open Library (e.g., "${topic || 'history, economics, science'}")`}
              className={clsx(
                'flex-1 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none',
                isDarkMode
                  ? 'bg-black/25 border-white/15 text-white placeholder-slate-500 focus:border-indigo-400'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
              )}
            />
            <button
              type="button"
              onClick={handleSearchBooks}
              disabled={isSearchingBooks}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {isSearchingBooks ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
              <span>Search Books</span>
            </button>
          </div>

          <p className={clsx('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
            Rule: Books added from search without pasted text are marked <strong>Text not available</strong> (mentions title, author, and core idea only; never invents page quotes).
          </p>

          {bookResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bookResults.map(book => {
                const alreadyAdded = booksList.some(
                  b => b.title.toLowerCase() === book.title.toLowerCase()
                );
                const isExcerptOpen = openExcerptBookId === book.id;
                return (
                  <div
                    key={book.id}
                    className={clsx(
                      'rounded-xl border p-3.5 flex flex-col justify-between gap-2.5',
                      isDarkMode ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className={clsx('text-sm font-bold', isDarkMode ? 'text-white' : 'text-slate-900')}>
                          {book.title}
                        </div>
                        {book.previewLink && (
                          <a
                            href={book.previewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-500 hover:underline shrink-0"
                            title="Open book preview"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                      <div className={clsx('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                        {(book.authors || [book.author]).filter(Boolean).join(', ')} {book.year ? `· ${book.year}` : ''} ·{' '}
                        <span className="text-amber-400 font-semibold">Text not available</span>
                      </div>
                      {book.description && (
                        <p className={clsx('text-xs line-clamp-2 mt-1', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
                          {book.description}
                        </p>
                      )}
                    </div>

                    {isExcerptOpen && (
                      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                        <textarea
                          rows={2}
                          value={excerptDrafts[book.id] || ''}
                          onChange={e =>
                            setExcerptDrafts(prev => ({ ...prev, [book.id]: e.target.value }))
                          }
                          placeholder="Paste exact passage from this book to allow direct quoting (<25 words)..."
                          className={clsx(
                            'w-full rounded-lg border p-2 text-xs outline-none',
                            isDarkMode
                              ? 'bg-black/30 border-white/15 text-white'
                              : 'bg-white border-slate-300 text-slate-900'
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddBook(book, excerptDrafts[book.id])}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                          Save with Verified Passage
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddBook(book)}
                        disabled={alreadyAdded}
                        className={clsx(
                          'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                          alreadyAdded
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500'
                        )}
                      >
                        {alreadyAdded ? <Check size={13} /> : <Plus size={13} />}
                        <span>{alreadyAdded ? 'Added' : 'Add Book (Idea Only)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenExcerptBookId(isExcerptOpen ? null : book.id)}
                        className={clsx(
                          'px-2.5 py-1.5 rounded-lg text-xs font-medium border',
                          isDarkMode
                            ? 'border-white/15 text-slate-300 hover:bg-white/5'
                            : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                        )}
                      >
                        {isExcerptOpen ? 'Cancel' : 'Paste passage from this book'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: QUOTES LIBRARY */}
      {activeTab === 'quotes' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {allQuoteTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setQuoteTagFilter(tag)}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors',
                  quoteTagFilter === tag
                    ? 'bg-indigo-600 text-white'
                    : isDarkMode
                    ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
            {filteredQuotes.map(item => {
              const added = quotesList.some(
                q => q.quote.toLowerCase() === item.quote.toLowerCase()
              );
              return (
                <div
                  key={item.id}
                  className={clsx(
                    'rounded-xl border p-3.5 flex flex-col justify-between gap-2',
                    isDarkMode ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-200'
                  )}
                >
                  <div>
                    <p className={clsx('text-xs sm:text-sm font-medium italic', isDarkMode ? 'text-white' : 'text-slate-900')}>
                      &ldquo;{item.quote}&rdquo;
                    </p>
                    <div className={clsx('text-xs mt-1', isDarkMode ? 'text-slate-400' : 'text-slate-600')}>
                      {item.speaker} · {item.workOrContext} {item.year ? `(${item.year})` : ''} · Best for {item.usage}
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleAddLibraryQuote(item)}
                      disabled={added}
                      className={clsx(
                        'inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold',
                        added
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500'
                      )}
                    >
                      {added ? <Check size={12} /> : <Plus size={12} />}
                      <span>{added ? 'Saved' : 'Use in Script'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Custom Quote */}
          <div className={clsx('pt-3 border-t space-y-2.5', isDarkMode ? 'border-white/10' : 'border-slate-200')}>
            <div className={clsx('text-xs font-bold', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
              Or add your own verified quote (&lt;25 words)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={customQuoteText}
                onChange={e => setCustomQuoteText(e.target.value)}
                placeholder="Exact quote text (<25 words)..."
                className={clsx(
                  'sm:col-span-2 rounded-lg border px-3 py-2 text-xs outline-none',
                  isDarkMode ? 'bg-black/25 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                )}
              />
              <input
                type="text"
                value={customQuoteSpeaker}
                onChange={e => setCustomQuoteSpeaker(e.target.value)}
                placeholder="Speaker / Author"
                className={clsx(
                  'rounded-lg border px-3 py-2 text-xs outline-none',
                  isDarkMode ? 'bg-black/25 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                )}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customQuoteWork}
                onChange={e => setCustomQuoteWork(e.target.value)}
                placeholder="Book, speech, or context (optional)"
                className={clsx(
                  'flex-1 rounded-lg border px-3 py-2 text-xs outline-none',
                  isDarkMode ? 'bg-black/25 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'
                )}
              />
              <button
                type="button"
                onClick={handleAddCustomQuote}
                disabled={!customQuoteText.trim() || !customQuoteSpeaker.trim()}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Add Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FIND WORDS IN MY SOURCES */}
      {activeTab === 'search_sources' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={sourceWordSearch}
              onChange={e => setSourceWordSearch(e.target.value)}
              placeholder="Search exact words or numbers inside your uploaded PDFs and pasted notes..."
              className={clsx(
                'flex-1 rounded-xl border px-3.5 py-2 text-xs sm:text-sm outline-none',
                isDarkMode
                  ? 'bg-black/25 border-white/15 text-white placeholder-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              )}
            />
          </div>

          {userSourcesForSearch.length === 0 ? (
            <p className={clsx('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
              Upload a file or paste notes first to search inside your sources.
            </p>
          ) : sourceWordSearch.trim() && searchMatches.length === 0 ? (
            <p className={clsx('text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
              No matching passages found for &ldquo;{sourceWordSearch}&rdquo;.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchMatches.map((m, idx) => (
                <div
                  key={idx}
                  className={clsx(
                    'rounded-xl border p-3 flex items-start justify-between gap-3 text-xs',
                    isDarkMode ? 'bg-black/25 border-white/10 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                  )}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-indigo-400">
                      {m.sourceTitle} · {m.pageOrSection}
                    </div>
                    <p className="italic">&ldquo;{m.snippet}&rdquo;</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newCard = createFactCardFromUserSource({
                        claim: m.snippet,
                        sourceTitle: m.sourceTitle,
                        pageOrSection: m.pageOrSection,
                        existingCount: factsList.length
                      });
                      appendExtracted([newCard], []);
                      setStatusMessage({
                        type: 'success',
                        text: `Added passage from ${m.sourceTitle} (${m.pageOrSection}) as a fact card.`
                      });
                    }}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500"
                  >
                    + Add as fact card
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analyzed Source Insights Summary */}
      {analyzedSources.length > 0 && (
        <div className={clsx('pt-3 border-t space-y-2', isDarkMode ? 'border-white/10' : 'border-slate-200')}>
          <div className={clsx('text-xs font-bold', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
            Analyzed source insights ({analyzedSources.length})
          </div>
          {analyzedSources.slice(0, 2).map(({ source, insights }) => (
            <div
              key={source.id}
              className={clsx(
                'rounded-xl border p-3 text-xs space-y-1.5',
                isDarkMode ? 'bg-black/20 border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              )}
            >
              <div className="font-bold text-indigo-400">{source.title}</div>
              <ul className="list-disc list-inside space-y-0.5">
                {insights.summaryBullets.slice(0, 3).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Summary of Currently Pinned User Sources */}
      {totalPinnedCount > 0 && (
        <div className={clsx('pt-4 border-t space-y-2', isDarkMode ? 'border-white/10' : 'border-slate-200')}>
          <div className={clsx('text-xs font-bold', isDarkMode ? 'text-slate-300' : 'text-slate-700')}>
            Saved items from My Sources ({totalPinnedCount})
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {factsList.map(f => (
              <div
                key={f.id}
                className={clsx(
                  'flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs',
                  isDarkMode ? 'bg-white/5 text-slate-200' : 'bg-slate-100 text-slate-800'
                )}
              >
                <span className="truncate">
                  <strong>[Fact]</strong> {f.claim}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFact(f.id)}
                  className="text-slate-400 hover:text-rose-500 shrink-0"
                  title="Remove"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {booksList.map(b => (
              <div
                key={b.id}
                className={clsx(
                  'flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs',
                  isDarkMode ? 'bg-white/5 text-slate-200' : 'bg-slate-100 text-slate-800'
                )}
              >
                <span className="truncate">
                  <strong>[Book]</strong> {b.title} ({(b.authors || [b.author]).filter(Boolean).join(', ')}) ·{' '}
                  {b.sourceLevel === 'user_text' ? 'Verified Passage' : 'Text not available'}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveBook(b.id)}
                  className="text-slate-400 hover:text-rose-500 shrink-0"
                  title="Remove"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {quotesList.map(q => (
              <div
                key={q.id}
                className={clsx(
                  'flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs',
                  isDarkMode ? 'bg-white/5 text-slate-200' : 'bg-slate-100 text-slate-800'
                )}
              >
                <span className="truncate">
                  <strong>[Quote]</strong> &ldquo;{q.quote}&rdquo; — {q.speaker}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveQuote(q.id)}
                  className="text-slate-400 hover:text-rose-500 shrink-0"
                  title="Remove"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MySourcesPanel;
