import { useState, useEffect } from 'react';
import type { BibleInfo, BookSummary, PassageResult } from '../schema/bible';
import './styles/global.css';

interface AppState {
  translations: string[];
  selectedTranslation: string | null;
  translationInfo: BibleInfo | null;
  selectedBook: BookSummary | null;
  selectedChapter: number | null;
  currentPassage: PassageResult | null;
  isLoading: boolean;
  error: string | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    translations: [],
    selectedTranslation: null,
    translationInfo: null,
    selectedBook: null,
    selectedChapter: null,
    currentPassage: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    loadTranslations();
  }, []);

  const loadTranslations = async () => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    try {
      const files = await (window as any).bibleApi.listTranslations();
      setState(s => ({ ...s, translations: files, isLoading: false }));
    } catch (err) {
      setState(s => ({ ...s, error: 'Failed to load translations', isLoading: false }));
    }
  };

  const loadTranslationInfo = async (translationFile: string) => {
    setState(s => ({ ...s, isLoading: true, error: null, selectedBook: null, selectedChapter: null }));
    try {
      const info = await (window as any).bibleApi.getTranslationInfo(translationFile);
      setState(s => ({ ...s, translationInfo: info, selectedTranslation: translationFile, isLoading: false }));
    } catch (err) {
      setState(s => ({ ...s, error: 'Failed to load translation info', isLoading: false }));
    }
  };

  const selectBook = (book: BookSummary) => {
    setState(s => ({ ...s, selectedBook: book, selectedChapter: null }));
  };

  const selectChapter = async (chapter: number) => {
    if (!state.selectedTranslation || !state.selectedBook) return;

    setState(s => ({ ...s, selectedChapter: chapter, isLoading: true, error: null, currentPassage: null }));
    try {
      const passage = await (window as any).bibleApi.getVerses({
        book: state.selectedBook.abbreviation,
        chapter,
        translationFile: state.selectedTranslation,
      });
      setState(s => ({ ...s, currentPassage: passage, isLoading: false }));
    } catch (err) {
      setState(s => ({ ...s, error: 'Failed to load passage', isLoading: false }));
    }
  };

  const openPresentation = async () => {
    if (!state.currentPassage) return;
    try {
      await (window as any).bibleApi.openPresentationWindow();
    } catch (err) {
      console.error('Failed to open presentation:', err);
    }
  };

  return (
    <div className="bible-researcher">
      <header className="header">
        <h1>Bible Researcher</h1>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={openPresentation}
            disabled={!state.currentPassage}
          >
            Open Presentation
          </button>
        </div>
      </header>

      <div className="content">
        <aside className="sidebar">
          <div className="sidebar-header">
            <label htmlFor="translation-select">Translation</label>
            <select
              id="translation-select"
              value={state.selectedTranslation || ''}
              onChange={e => loadTranslationInfo(e.target.value)}
            >
              <option value="">Select a translation...</option>
              {state.translations.map(file => (
                <option key={file} value={file}>
                  {file.replace('.vpc.json', '')}
                </option>
              ))}
            </select>
          </div>

          {state.translationInfo && (() => {
            const info = state.translationInfo;
            return (
              <div className="book-list">
                {info.books.map((book: BookSummary, idx: number) => {
                  const prevBook = info.books[idx - 1];
                  const showTestamentLabel = !prevBook || prevBook.testament !== book.testament;
                  return (
                    <div key={book.abbreviation}>
                      {showTestamentLabel && (
                        <div className="testament-label">
                          {book.testament === 'OT' ? 'Old Testament' : 'New Testament'}
                        </div>
                      )}
                      <div
                        className={`book-item ${state.selectedBook?.abbreviation === book.abbreviation ? 'active' : ''}`}
                        onClick={() => selectBook(book)}
                      >
                        <span>{book.name}</span>
                        <span style={{ fontSize: 12, color: '#666' }}>{book.chapterCount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {state.selectedBook && (
            <div className="chapter-grid">
              {Array.from({ length: state.selectedBook.chapterCount }, (_, i) => i + 1).map(ch => (
                <button
                  key={ch}
                  className={`chapter-btn ${state.selectedChapter === ch ? 'active' : ''}`}
                  onClick={() => selectChapter(ch)}
                >
                  {ch}
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="main-panel">
          {state.currentPassage ? (
            <>
              <div className="passage-header">
                <h2 className="passage-title">
                  {state.currentPassage.book} {state.currentPassage.chapter}
                </h2>
                <p className="passage-subtitle">
                  {state.currentPassage.verses.length} verses · {state.currentPassage.translation}
                </p>
              </div>
              <div className="passage-content">
                {state.currentPassage.verses.map((verse: { ID?: number; Text: string }) => (
                  <p key={verse.ID || verse.Text} className="verse">
                    <span className="verse-number">{verse.ID}</span>
                    {verse.Text}
                  </p>
                ))}
              </div>
            </>
          ) : state.isLoading ? (
            <div className="loading">Loading...</div>
          ) : state.error ? (
            <div className="error-state">{state.error}</div>
          ) : (
            <div className="empty-state">
              <h2>Select a Passage</h2>
              <p>Choose a translation, book, and chapter to begin reading.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
