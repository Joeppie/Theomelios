import { useState, useEffect, useRef } from 'react';
import type { BibleInfo } from '../schema/bible';
import './styles/global.css';

interface AgendaItem {
  book: string;
  chapter: number;
  verses: number[];
  translationFile: string;
  translationName: string;
}

interface AppState {
  translations: string[];
  selectedTranslation: string | null;
  translationFile: string | null;
  translationInfo: BibleInfo | null;
  agenda: AgendaItem[];
  activeAgendaIndex: number | null;
  isLoading: boolean;
  error: string | null;
  selectedBook: string | null;
  selectedChapter: number | null;
  selectedVerses: number[];
  verseData: { ID: number; Text: string }[] | null;
  verseCache: Record<string, { ID: number; Text: string }[]>;
  verseDragStart: number | null;
  verseIsDragging: boolean;
  currentPassage: { book: string; chapter: number; translationFile: string } | null;
  readerVerseIndex: number;
  previewVerseIndex: number;
  readerHighlightedWord: number | null;
  previewHighlightedWord: number | null;
  readerCached: { ID: number; Text: string }[] | null;
  previewCached: { ID: number; Text: string }[] | null;
}

const CANONICAL_BOOK_ORDER = [
  'Gn', 'Ex', 'Lv', 'Nu', 'Dt',
  'Js', 'Jg', 'Ru', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch', 'Ezr', 'Ne', 'Es',
  'Job', 'Ps', 'Pr', 'Ec', 'So',
  'Isa', 'Jer', 'Lm', 'Ezk', 'Dn',
  'Ho', 'Jl', 'Am', 'Ob', 'Jon', 'Mi', 'Na', 'Hab', 'Zp', 'Hg', 'Zc', 'Ml',
  'Mt', 'Mk', 'Lk', 'Jn', 'Ac',
  'Rm', '1Co', '2Co', 'Gal', 'Eph', 'Php', 'Col', '1Th', '2Th', '1Ti', '2Ti', 'Ti', 'Phm',
  'He', 'Ja', '1Pe', '2Pe', '1Jn', '2Jn', '3Jn', 'Ju',
  'Rv'
];

// Maps all known alternate abbreviations to canonical ones
const ABBREV_ALIASES: Record<string, string> = {
  Nb: 'Nu', Num: 'Nu',
  Jos: 'Js', Josh: 'Js',
  Rt: 'Ru',
  '1S': '1Sa', '1Sam': '1Sa',
  '2S': '2Sa', '2Sam': '2Sa',
  '1K': '1Ki', '1Kgs': '1Ki',
  '2K': '2Ki', '2Kgs': '2Ki',
  '1Chr': '1Ch',
  '2Chr': '2Ch',
  Neh: 'Ne',
  Est: 'Es',
  Jb: 'Job',
  Psalms: 'Ps',
  Pro: 'Pr',
  Ecc: 'Ec',
  Sp: 'So', SOT: 'So', Song: 'So',
  Is: 'Isa',
  Jr: 'Jer',
  Lam: 'Lm',
  Eze: 'Ezk', Ezek: 'Ezk',
  Dan: 'Dn',
  Mic: 'Mi',
  Hp: 'Hab',
  Zep: 'Zp',
  Zech: 'Zc',
  Matt: 'Mt',
  Mr: 'Mk', Mrk: 'Mk',
  Luk: 'Lk',
  Act: 'Ac',
  Rom: 'Rm',
  '1Cor': '1Co',
  '2Cor': '2Co',
  Ga: 'Gal',
  Ep: 'Eph',
  Phil: 'Php',
  Tit: 'Ti',
  Philem: 'Phm',
  Heb: 'He',
  Jm: 'Ja',
  '1Pt': '1Pe', '1Pet': '1Pe',
  '2Pt': '2Pe', '2Pet': '2Pe',
  Jud: 'Ju',
  Re: 'Rv', Rev: 'Rv',
};

function resolveCanonicalAbbr(abbr: string): string {
  if (CANONICAL_BOOK_ORDER.includes(abbr)) return abbr;
  return ABBREV_ALIASES[abbr] || abbr;
}

const BOOK_CATEGORIES: { name: string; color: string; books: string[] }[] = [
  { name: 'Law', color: '#e94560', books: ['Gn', 'Ex', 'Lv', 'Nu', 'Dt'] },
  { name: 'History', color: '#e9a545', books: ['Js', 'Jg', 'Ru', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch', 'Ezr', 'Ne', 'Es'] },
  { name: 'Poetry', color: '#c77dff', books: ['Job', 'Ps', 'Pr', 'Ec', 'So'] },
  { name: 'Major Prophets', color: '#4cc9f0', books: ['Isa', 'Jer', 'Lm', 'Ezk', 'Dn'] },
  { name: 'Minor Prophets', color: '#72efdd', books: ['Ho', 'Jl', 'Am', 'Ob', 'Jon', 'Mi', 'Na', 'Hab', 'Zp', 'Hg', 'Zc', 'Ml'] },
  { name: 'Gospels', color: '#f72585', books: ['Mt', 'Mk', 'Lk', 'Jn'] },
  { name: 'Church', color: '#4895ef', books: ['Ac'] },
  { name: 'Paul Letters', color: '#4361ee', books: ['Rm', '1Co', '2Co', 'Gal', 'Eph', 'Php', 'Col', '1Th', '2Th', '1Ti', '2Ti', 'Ti', 'Phm'] },
  { name: 'General Letters', color: '#7209b7', books: ['He', 'Ja', '1Pe', '2Pe', '1Jn', '2Jn', '3Jn', 'Ju'] },
  { name: 'Prophecy', color: '#ff006e', books: ['Rv'] },
];

function getBookFullName(bookAbbr: string): string {
  const fullNameMap: Record<string, string> = {
    Gn: 'Genesis', Gen: 'Genesis', Ex: 'Exodus', Exo: 'Exodus',
    Lv: 'Leviticus', Lev: 'Leviticus', Nu: 'Numbers', Nb: 'Numbers', Num: 'Numbers',
    Dt: 'Deuteronomy', Deu: 'Deuteronomy', Js: 'Joshua', Jos: 'Joshua', Josh: 'Joshua',
    Jg: 'Judges', Jdg: 'Judges', Ru: 'Ruth', Rt: 'Ruth',
    '1S': '1 Samuel', '1Sa': '1 Samuel', '1Sam': '1 Samuel',
    '2S': '2 Samuel', '2Sa': '2 Samuel', '2Sam': '2 Samuel',
    '1K': '1 Kings', '1Ki': '1 Kings', '1Kgs': '1 Kings',
    '2K': '2 Kings', '2Ki': '2 Kings', '2Kgs': '2 Kings',
    '1Ch': '1 Chronicles', '1Chr': '1 Chronicles',
    '2Ch': '2 Chronicles', '2Chr': '2 Chronicles',
    Ezr: 'Ezra', Ne: 'Nehemiah', Neh: 'Nehemiah',
    Es: 'Esther', Est: 'Esther', Job: 'Job', Jb: 'Job',
    Ps: 'Psalms', Psalms: 'Psalms',
    Pr: 'Proverbs', Pro: 'Proverbs',
    Ec: 'Ecclesiastes', Ecc: 'Ecclesiastes',
    Sp: 'Song of Solomon', So: 'Song of Solomon', SOT: 'Song of Solomon', Song: 'Song of Solomon',
    Is: 'Isaiah', Isa: 'Isaiah', Jer: 'Jeremiah', Jr: 'Jeremiah',
    Lm: 'Lamentations', Lam: 'Lamentations',
    Ezk: 'Ezekiel', Eze: 'Ezekiel', Ezek: 'Ezekiel',
    Dn: 'Daniel', Dan: 'Daniel',
    Ho: 'Hosea', Jl: 'Joel', Am: 'Amos',
    Ob: 'Obadiah', Obad: 'Obadiah',
    Jon: 'Jonah', Mi: 'Micah', Na: 'Nahum',
    Hp: 'Habakkuk', Hab: 'Habakkuk',
    Zp: 'Zephaniah', Zep: 'Zephaniah',
    Hg: 'Haggai', Zc: 'Zechariah', Zech: 'Zechariah',
    Ml: 'Malachi',
    Mt: 'Matthew', Matt: 'Matthew',
    Mk: 'Mark', Mr: 'Mark', Mrk: 'Mark',
    Lk: 'Luke', Luk: 'Luke',
    Jn: 'John',
    Ac: 'Acts', Act: 'Acts',
    Rm: 'Romans', Rom: 'Romans',
    '1Co': '1 Corinthians', '1Cor': '1 Corinthians',
    '2Co': '2 Corinthians', '2Cor': '2 Corinthians',
    Gal: 'Galatians', Ga: 'Galatians',
    Ep: 'Ephesians', Eph: 'Ephesians',
    Php: 'Philippians', Phil: 'Philippians',
    Col: 'Colossians',
    '1Th': '1 Thessalonians', '1Thes': '1 Thessalonians',
    '2Th': '2 Thessalonians', '2Thes': '2 Thessalonians',
    '1Ti': '1 Timothy', '1Tim': '1 Timothy',
    '2Ti': '2 Timothy', '2Tim': '2 Timothy',
    Ti: 'Titus', Tit: 'Titus',
    Phm: 'Philemon', Philem: 'Philemon',
    He: 'Hebrews', Heb: 'Hebrews',
    Ja: 'James', Jm: 'James',
    '1Pe': '1 Peter', '1Pt': '1 Peter', '1Pet': '1 Peter',
    '2Pe': '2 Peter', '2Pt': '2 Peter', '2Pet': '2 Peter',
    '1Jn': '1 John',
    '2Jn': '2 John',
    '3Jn': '3 John',
    Ju: 'Jude', Jud: 'Jude',
    Rv: 'Revelation', Re: 'Revelation', Rev: 'Revelation',
  };
  return fullNameMap[bookAbbr] || bookAbbr;
}

function formatAgendaRef(book: string, chapter: number, verses?: number[]): string {
  if (verses && verses.length > 0) {
    if (verses.length === 1) return `${book} ${chapter}:${verses[0]}`;
    return `${book} ${chapter}:${verses[0]}-${verses[verses.length - 1]}`;
  }
  return `${book} ${chapter}`;
}

function shortenAbbr(abbr: string): string {
  if (abbr.length <= 2) return abbr;
  if (abbr.startsWith('1') || abbr.startsWith('2') || abbr.startsWith('3')) {
    return abbr.substring(0, 3);
  }
  return abbr.substring(0, 2);
}

function App() {
  const verseDragRef = useRef<{ verse: number; started: boolean } | null>(null);
  const chapterDragRef = useRef<{ chapter: number; rect: DOMRect | null } | null>(null);
  const chapterGridRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<AppState>({
    translations: [],
    selectedTranslation: null,
    translationFile: null,
    translationInfo: null,
    agenda: [],
    activeAgendaIndex: null,
    isLoading: false,
    error: null,
    selectedBook: null,
    selectedChapter: null,
    selectedVerses: [],
    verseData: null,
    verseCache: {},
    verseDragStart: null,
    verseIsDragging: false,
    currentPassage: null,
    readerVerseIndex: 0,
    previewVerseIndex: 0,
    readerHighlightedWord: null,
    previewHighlightedWord: null,
    readerCached: null,
    previewCached: null,
  });

  const resolveTranslationAbbr = (canonical: string): string | null => {
    if (!state.translationInfo) return canonical;
    for (const book of state.translationInfo.books) {
      if (resolveCanonicalAbbr(book.abbreviation) === canonical) {
        return book.abbreviation;
      }
    }
    return null;
  };

  useEffect(() => {
    loadTranslations();
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      verseDragRef.current = null;
      chapterDragRef.current = null;
      setState(s => ({ ...s, verseIsDragging: false }));
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setState(s => ({ ...s, selectedVerses: [], readerHighlightedWord: null, previewHighlightedWord: null }));
        (window as any).bibleApi.sendWordHighlight(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const unsubscribe = (window as any).bibleApi.onWindowClosed(() => {
      setState(s => ({ ...s }));
    });
    return unsubscribe;
  }, []);

  const loadTranslations = async () => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const files = await (window as any).bibleApi.listTranslations();
      
      let selectedFile: string | null = null;
      const kjvFile = files.find((f: string) => 
        f.toLowerCase().includes('king james') && f.toLowerCase().includes('english')
      );
      
      if (kjvFile) {
        selectedFile = kjvFile;
      }
      
      setState(s => ({ ...s, translations: files, isLoading: false }));
      
      if (selectedFile) {
        loadTranslationInfo(selectedFile);
      }
    } catch (err) {
      setState(s => ({ ...s, error: 'Failed to load translations', isLoading: false }));
    }
  };

  const loadTranslationInfo = async (translationFile: string) => {
    setState(s => ({ ...s, isLoading: true, error: null, selectedBook: null, selectedChapter: null, selectedVerses: [], verseData: null, currentPassage: null, readerVerseIndex: 0, previewVerseIndex: 0, readerCached: null, previewCached: null }));
    try {
      const info = await (window as any).bibleApi.getTranslationInfo(translationFile);
      setState(s => ({
        ...s,
        translationInfo: info,
        translationFile,
        selectedTranslation: translationFile,
        isLoading: false,
      }));
    } catch (err) {
      setState(s => ({ ...s, error: 'Failed to load translation info', isLoading: false }));
    }
  };

  const selectBook = (bookAbbr: string) => {
    setState(s => ({
      ...s,
      selectedBook: bookAbbr,
      selectedChapter: null,
      selectedVerses: [],
      verseData: null,
      currentPassage: null,
      readerVerseIndex: 0,
      previewVerseIndex: 0,
      readerCached: null,
      previewCached: null,
    }));
  };

  const selectChapter = async (chapter: number) => {
    if (!state.translationFile || !state.selectedBook) return;

    const transAbbr = resolveTranslationAbbr(state.selectedBook);
    if (!transAbbr) return;

    setState(s => ({
      ...s,
      selectedChapter: chapter,
      selectedVerses: [],
      readerVerseIndex: 0,
      previewVerseIndex: 0,
      isLoading: true,
      error: null,
      currentPassage: { book: transAbbr, chapter, translationFile: s.translationFile! },
    }));

    try {
      const result = await (window as any).bibleApi.getVerses({
        book: transAbbr,
        chapter,
        translationFile: state.translationFile,
      });

      setState(s => ({
        ...s,
        verseData: result?.verses || [],
        selectedVerses: [],
        isLoading: false,
        error: result ? null : 'Failed to load verses',
      }));
    } catch (err) {
      setState(s => ({ ...s, error: 'Failed to load verses', isLoading: false }));
    }
  };

  const sendToPresentation = async (verses?: number[]) => {
    if (!state.translationFile) return;

    let book: string, chapter: number, translationFile: string;
    if (state.currentPassage) {
      ({ book, chapter, translationFile } = state.currentPassage);
    } else if (activeAgendaItem) {
      book = activeAgendaItem.book;
      chapter = activeAgendaItem.chapter;
      translationFile = activeAgendaItem.translationFile;
    } else {
      return;
    }

    try {
      await (window as any).bibleApi.sendToPresentation({ book, chapter, verses, translationFile });
    } catch (err) {
      console.error('Failed to send to presentation:', err);
    }
  };

  const addVersesToAgenda = () => {
    if (!state.selectedBook || !state.selectedChapter || state.selectedVerses.length === 0 || !state.translationFile) return;

    setState(s => {
      const newItem: AgendaItem = {
        book: s.selectedBook!,
        chapter: s.selectedChapter!,
        verses: [...s.selectedVerses].sort((a, b) => a - b),
        translationFile: s.translationFile!,
        translationName: s.selectedTranslation?.replace('.vpc.json', '') || '',
      };
      return {
        ...s,
        agenda: [...s.agenda, newItem],
        selectedVerses: [],
        readerVerseIndex: 0,
        previewVerseIndex: 0,
        readerCached: null,
        previewCached: null,
      };
    });
  };

  const selectAgendaItem = async (index: number) => {
    setState(s => ({ ...s, activeAgendaIndex: index, isLoading: true, error: null, readerVerseIndex: 0, previewVerseIndex: 0, readerCached: null, previewCached: null }));
    
    const item = state.agenda[index];
    if (!item) return;

    const cacheKey = `${item.book}_${item.chapter}_${item.verses.join(',')}_${item.translationFile}`;
    if (state.verseCache[cacheKey]) {
      setState(s => ({
        ...s,
        isLoading: false,
        readerCached: state.verseCache[cacheKey],
        previewCached: state.verseCache[cacheKey],
      }));
      return;
    }

    try {
      const result = await (window as any).bibleApi.getVerses({
        book: item.book,
        chapter: item.chapter,
        verses: item.verses[0] === item.verses[item.verses.length - 1] ? item.verses[0] : [item.verses[0], item.verses[item.verses.length - 1]],
        translationFile: item.translationFile,
      });

      if (result?.verses) {
        setState(s => ({
          ...s,
          verseCache: { ...s.verseCache, [cacheKey]: result.verses },
          readerCached: result.verses,
          previewCached: result.verses,
          isLoading: false,
        }));
      } else {
        setState(s => ({ ...s, isLoading: false, error: 'Failed to load verses' }));
      }
    } catch (err) {
      setState(s => ({ ...s, isLoading: false, error: 'Failed to load verses' }));
    }
  };

  const removeAgendaItem = (index: number) => {
    setState(s => {
      const newAgenda = s.agenda.filter((_, i) => i !== index);
      let newActiveIndex: number | null = null;
      if (s.activeAgendaIndex === index) {
        newActiveIndex = index < newAgenda.length ? index : newAgenda.length > 0 ? newAgenda.length - 1 : null;
      }
      return {
        ...s,
        agenda: newAgenda,
        activeAgendaIndex: newActiveIndex,
      };
    });
  };

  const renderVerseWithHighlight = (
    verse: { ID: number; Text: string },
    highlightIndex: number | null,
    onWordSelect: (wordIndex: number) => void
  ) => {
    const parts = verse.Text.split(/(\s+)/);
    let wordIndex = 0;
    return (
      <span>
        {parts.map((p, i) => {
          if (p.match(/^\s+$/)) {
            return <span key={i}>{p}</span>;
          }
          const isHighlighted = highlightIndex === wordIndex;
          const current = wordIndex;
          wordIndex++;
          return (
            <span
              key={i}
              onMouseDown={(e) => {
                e.stopPropagation();
                onWordSelect(current);
                (window as any).bibleApi.sendWordHighlight({ wordIndex: current, verseNum: verse.ID });
              }}
              style={{
                backgroundColor: isHighlighted ? 'rgba(255, 224, 102, 0.25)' : undefined,
              }}
            >
              {p}
            </span>
          );
        })}
      </span>
    );
  };

  const renderFullPassage = (
    verses: { ID: number; Text: string }[],
    highlightedWord: number | null,
    onWordSelect: (wordIdx: number) => void
  ) => {
    return (
      <div className="full-passage-corpus">
        {verses.map(verse => (
          <p key={verse.ID} className="corpus-verse">
            <span className="corpus-verse-number">{verse.ID}</span>{' '}
            {renderVerseWithHighlight(verse, highlightedWord, onWordSelect)}
          </p>
        ))}
      </div>
    );
  };

  const activeAgendaItem = state.activeAgendaIndex != null ? state.agenda[state.activeAgendaIndex] : null;

  const allBooks = (() => {
    const bookMap = new Map<string, number>();
    if (state.translationInfo) {
      state.translationInfo.books.forEach(b => {
        const canonical = resolveCanonicalAbbr(b.abbreviation);
        bookMap.set(canonical, b.chapterCount);
      });
    }
    return BOOK_CATEGORIES
      .map(category => ({
        ...category,
        books: category.books
          .filter(abbrev => CANONICAL_BOOK_ORDER.includes(abbrev))
          .sort((a, b) => CANONICAL_BOOK_ORDER.indexOf(a) - CANONICAL_BOOK_ORDER.indexOf(b))
          .map(abbrev => ({
            abbreviation: abbrev,
            name: getBookFullName(abbrev),
            chapterCount: bookMap.get(abbrev) || 0,
            category: category.color,
            available: bookMap.has(abbrev),
          })),
      }))
      .flatMap(cat => cat.books);
  })();

  const displayReaderCached = state.readerCached || state.verseData;
  const displayPreviewCached = state.previewCached || state.verseData;

  return (
    <div className="bible-researcher">
      <div className="app-wrapper">
        <div className="main-layout">
          {/* LEFT: Agenda */}
          <div className="panel agenda-panel">
            <div className="panel-header">
              <h2>Agenda</h2>
              <span className="agenda-count">{state.agenda.length}</span>
            </div>
            <div className="agenda-list">
              {state.agenda.map((item, index) => (
                <div
                  key={index}
                  className={`agenda-item ${index === state.activeAgendaIndex ? 'active' : ''}`}
                  onClick={() => selectAgendaItem(index)}
                >
                  <div className="agenda-item-main">
                    <span className="agenda-item-ref">{formatAgendaRef(item.book, item.chapter, item.verses)}</span>
                    <span className="agenda-item-translation">{item.translationName}</span>
                  </div>
                  <button
                    className="agenda-remove-btn"
                    onClick={e => { e.stopPropagation(); removeAgendaItem(index); }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {state.agenda.length === 0 && (
                <div className="agenda-empty">
                  Select passages to build your agenda
                </div>
              )}
            </div>
          </div>

          {/* CENTER: Main Reader */}
          <div className="panel main-panel">
            <div className="panel-header">
              <h2>Reader</h2>
            </div>
            <div className="main-content">
              {activeAgendaItem ? (
                <div className="passage-view">
                  <div className="passage-header">
                    <h3>
                      {getBookFullName(activeAgendaItem.book)} {activeAgendaItem.chapter}
                    </h3>
                    <p className="passage-meta">{activeAgendaItem.translationName}</p>
                  </div>
                  {(() => {
                    if (state.isLoading) return <div className="loading">Loading...</div>;
                    if (!displayReaderCached) return <div className="loading">Click to load passage...</div>;
                    return (
                      <div className="passage-reading">
                        {renderFullPassage(
                          displayReaderCached,
                          state.readerHighlightedWord,
                          (wordIdx) => setState(s => ({ ...s, readerHighlightedWord: wordIdx }))
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : state.error ? (
                <div className="error-state">{state.error}</div>
              ) : (
                <div className="empty-state">
                  <h2>Select an Agenda Item</h2>
                  <p>Click an item in the agenda to preview it here, or add passages from the bottom panel.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Preview */}
          <div className="panel preview-panel">
            <div className="panel-header">
              <h2>Preview</h2>
            </div>
            <div className="preview-content">
              {activeAgendaItem ? (
                <div className="passage-view">
                  <div className="passage-header">
                    <h3>
                      {getBookFullName(activeAgendaItem.book)} {activeAgendaItem.chapter}
                    </h3>
                    <p className="passage-meta">{activeAgendaItem.translationName}</p>
                  </div>
                  {(() => {
                    if (!displayPreviewCached) return <div className="loading">Loading...</div>;
                    return (
                      <div className="passage-reading">
                        {renderFullPassage(
                          displayPreviewCached,
                          state.previewHighlightedWord,
                          (wordIdx) => setState(s => ({ ...s, previewHighlightedWord: wordIdx }))
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="empty-state">
                  <h2>Preview</h2>
                  <p>Click an agenda item to see it here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="bottom-panel">
          {/* Bible selector toolbar */}
          <div className="bible-toolbar">
            <label className="bible-select-label">Bible:</label>
            <select
              value={state.translationFile || ''}
              onChange={e => {
                if (e.target.value) {
                  loadTranslationInfo(e.target.value);
                }
              }}
              className="bible-select"
            >
              <option value="">Select a Bible...</option>
              {state.translations
                .sort((a, b) => {
                  const aIsKJV = a.toLowerCase().includes('king james') ? 0 : 1;
                  const bIsKJV = b.toLowerCase().includes('king james') ? 0 : 1;
                  return aIsKJV - bIsKJV;
                })
                .map(file => (
                  <option key={file} value={file}>
                    {file.replace('.vpc.json', '')}
                  </option>
                ))}
            </select>
            <button
              className="btn btn-primary btn-present"
              onClick={() => sendToPresentation(state.selectedVerses.length > 0 ? state.selectedVerses : undefined)}
              disabled={!state.translationFile || !state.currentPassage}
            >
              Send to Presentation
            </button>
          </div>

          <div className="bottom-panel-content">
            {state.translationInfo ? (
              <>
                <div className="navigator-row">
                  {/* Books - column-first layout */}
                  <div className="navigator-section books-section">
                    <div className="section-label">Books</div>
                    <div className="books-column-grid">
                      {allBooks.map(book => (
                        <button
                          key={book.abbreviation}
                          className={`book-btn ${state.selectedBook === book.abbreviation ? 'active' : ''} ${!book.available ? 'book-unavailable' : ''}`}
                          onClick={() => selectBook(book.abbreviation)}
                          style={{ borderColor: book.category }}
                          title={book.available ? getBookFullName(book.abbreviation) : `${getBookFullName(book.abbreviation)} - not available in this translation`}
                        >
                          {shortenAbbr(book.abbreviation)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chapters */}
                  {state.selectedBook && (
                    <div className="navigator-section chapters-section">
                      <div className="section-label">
                        {getBookFullName(state.selectedBook)}
                      </div>
                      <div className="chapters-grid" ref={chapterGridRef}>
                        {(() => {
                          const bookInfo = allBooks.find(b => b.abbreviation === state.selectedBook);
                          if (!bookInfo || !bookInfo.available) return <div style={{padding: '12px', fontSize: '11px', color: '#8b949e', textAlign: 'center'}}>Not available</div>;
                          return Array.from({ length: bookInfo.chapterCount }, (_, i) => i + 1).map(ch => (
                            <button
                              key={ch}
                              className={`chapter-btn ${state.selectedChapter === ch ? 'active' : ''}`}
                              onClick={() => selectChapter(ch)}
                              onDoubleClick={() => sendToPresentation(undefined)}
                              onMouseDown={e => {
                                chapterDragRef.current = { chapter: ch, rect: (e.target as HTMLElement).getBoundingClientRect() };
                              }}
                              onMouseEnter={e => {
                                if (chapterDragRef.current && chapterDragRef.current.rect) {
                                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                                  const { chapter: _ch, rect: startRect } = chapterDragRef.current;
                                  if (startRect && rect.left === startRect.left && rect.top === startRect.top) return;
                                  
                                  const startY = Math.min(startRect.top, rect.top);
                                  const endY = Math.max(startRect.bottom, rect.bottom);
                                  const startX = Math.min(startRect.left, rect.left);
                                  const endX = Math.max(startRect.right, rect.right);
                                  
                                  const bookInfo = allBooks.find(b => b.abbreviation === state.selectedBook);
                                  if (!bookInfo) return;
                                  
                                  const chapters = Array.from({ length: bookInfo.chapterCount }, (_, i) => i + 1);
                                  const newSelected: number[] = [];
                                  
                                  for (const c of chapters) {
                                    const btn = (chapterGridRef.current?.querySelector(`[key="${c}"]`) as HTMLElement) || 
                                      chapterGridRef.current?.querySelector(`button:nth-child(${c})`);
                                    if (btn) {
                                      const r = btn.getBoundingClientRect();
                                      if (r.top >= startY - 5 && r.bottom <= endY + 5 && r.left >= startX - 5 && r.right <= endX + 5) {
                                        if (!newSelected.includes(c)) newSelected.push(c);
                                      }
                                    }
                                  }
                                  
                                  if (newSelected.length > 0) {
                                    setState(s => ({ ...s, selectedChapter: newSelected[0] }));
                                  }
                                }
                              }}
                            >
                              {ch}
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Verses */}
                  {state.selectedBook && state.selectedChapter && state.verseData && (
                    <div className="navigator-section verses-section">
                      <div className="section-label">
                        {getBookFullName(state.selectedBook)} {state.selectedChapter}
                      </div>
                      <div
                        className="verses-grid"
                        onMouseMove={e => {
                          if (!verseDragRef.current?.started) return;
                          const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
                          const verseBtn = target?.closest('.verse-btn');
                          if (verseBtn) {
                            const key = verseBtn.getAttribute('data-verse');
                            if (key) {
                              const verseNum = parseInt(key);
                              if (verseDragRef.current.verse !== verseNum) {
                                verseDragRef.current.verse = verseNum;
                                const allNums = state.verseData!.map(v => v.ID).filter((n): n is number => n != null).sort((a, b) => a - b);
                                const startIdx = allNums.indexOf(verseDragRef.current.verse);
                                const endIdx = allNums.indexOf(verseNum);
                                if (startIdx >= 0 && endIdx >= 0) {
                                  const start = Math.min(startIdx, endIdx);
                                  const end = Math.max(startIdx, endIdx);
                                  setState(s => ({ ...s, selectedVerses: allNums.slice(start, end + 1) }));
                                }
                              }
                            }
                          }
                        }}
                        onMouseLeave={() => {
                          verseDragRef.current = null;
                          setState(s => ({ ...s, verseIsDragging: false }));
                        }}
                      >
                        {state.verseData.map(verse => {
                          const num = verse.ID || 0;
                          const isSelected = state.selectedVerses.includes(num);
                          const isDragging = verseDragRef.current?.started && verseDragRef.current.verse === num;

                          return (
                            <button
                              key={num}
                              data-verse={num}
                              className={`verse-btn ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
                              onMouseDown={e => {
                                e.preventDefault();
                                if (e.shiftKey) {
                                  if (state.selectedVerses.length > 0) {
                                    const lastSelected = state.selectedVerses[state.selectedVerses.length - 1];
                                    const allNums = state.verseData!.map(v => v.ID).filter((n): n is number => n != null).sort((a, b) => a - b);
                                    const lastIdx = allNums.indexOf(lastSelected);
                                    const currIdx = allNums.indexOf(num);
                                    if (lastIdx >= 0 && currIdx >= 0) {
                                      const start = Math.min(lastIdx, currIdx);
                                      const end = Math.max(lastIdx, currIdx);
                                      setState(s => ({ ...s, selectedVerses: allNums.slice(start, end + 1) }));
                                    }
                                  }
                                } else {
                                  if (state.selectedVerses.includes(num)) {
                                    setState(s => ({ ...s, selectedVerses: s.selectedVerses.filter(v => v !== num) }));
                                    verseDragRef.current = { verse: num, started: true };
                                    setState(s => ({ ...s, verseIsDragging: true, verseDragStart: num }));
                                  } else {
                                    verseDragRef.current = { verse: num, started: true };
                                    setState(s => ({ ...s, verseIsDragging: true, verseDragStart: num, selectedVerses: [...s.selectedVerses, num] }));
                                  }
                                }
                              }}
                              onDoubleClick={() => {
                                if (!state.selectedVerses.includes(num)) {
                                  setState(s => ({ ...s, selectedVerses: [...s.selectedVerses, num] }));
                                }
                                sendToPresentation(state.selectedVerses);
                              }}
                            >
                              <span className="verse-num">{num}</span>
                              <span className="verse-text">{verse.Text}</span>
                            </button>
                          );
                        })}
                      </div>
                      {state.selectedVerses.length > 0 && (
                        <div className="verse-selection-controls">
                          <button
                            className="btn btn-small btn-add"
                            onClick={addVersesToAgenda}
                          >
                            + Add {state.selectedVerses.length} to Agenda
                          </button>
                          <button
                            className="btn btn-small btn-clear"
                            onClick={() => {
                              setState(s => ({ ...s, selectedVerses: [] }));
                              (window as any).bibleApi.sendWordHighlight(null);
                            }}
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
