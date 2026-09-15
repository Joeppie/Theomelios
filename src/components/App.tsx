import { useState, useEffect, useCallback, useRef } from 'react'
import { BibleLibrary } from '../engine/BibleLibrary'
import { parseVpcJson } from '../engine/vpcParser'
import { convertVpcToUniform } from '../engine/bibleConverter'
import { parseReference, findBookByPattern, bookNameToAbbr, findBookByName } from '../constants/books'
import type { SelectorBook, SelectorChapter, SelectorVerse } from '../types/bible'

// Range helpers for verse selections
function addVerseRange(ranges: [number, number][], verseId: number): [number, number][] {
  if (ranges.length === 0) return [[verseId, verseId]]
  const merged: [number, number][] = []
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  let added = false
  for (const [start, end] of sorted) {
    if (!added && verseId <= end + 1 && verseId >= start - 1) {
      merged.push([Math.min(start, verseId), Math.max(end, verseId)])
      added = true
    } else if (added) {
      merged.push([start, end])
    } else {
      merged.push([start, end])
    }
  }
  if (!added) merged.push([verseId, verseId])
  return collapseRanges(merged)
}

function collapseRanges(ranges: [number, number][]): [number, number][] {
  if (ranges.length <= 1) return ranges
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const result: [number, number][] = [sorted[0]]
  for (let i = 1; i < sorted.length; i++) {
    const last = result[result.length - 1]
    if (sorted[i][0] <= last[1] + 1) {
      last[1] = Math.max(last[1], sorted[i][1])
    } else {
      result.push(sorted[i])
    }
  }
  return result
}

function verseRangesToKeySet(ranges: [number, number][], book: string, chapter: number): Set<string> {
  const keys = new Set<string>()
  for (const [start, end] of ranges) {
    for (let i = start; i <= end; i++) {
      keys.add(`${book}|${chapter}|${i}`)
    }
  }
  return keys
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.substring(0, maxLen) + '\u2026'
}

function App() {
  const [library] = useState(() => new BibleLibrary())
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [bibleCount, setBibleCount] = useState(0)
  const [docCount, setDocCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'select' | 'search'>('select')
  const [bibleNames, setBibleNames] = useState<{ id: string; name: string }[]>([])
  const [selectedBibleId, setSelectedBibleId] = useState<string | null>(null)

  const [books, setBooks] = useState<SelectorBook[]>([])
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [chapters, setChapters] = useState<SelectorChapter[]>([])
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [verses, setVerses] = useState<SelectorVerse[]>([])
  const [selectedVerses, setSelectedVerses] = useState<Set<string>>(new Set())
  const [highlightedVerse, setHighlightedVerse] = useState<{ book: string; chapter: number; verse: number } | null>(null)

  // Range-based selection state (source of truth)
  const [verseRangeSelections, setVerseRangeSelections] = useState<Map<string, [number, number][]>>(new Map())

  // Drag state refs
  const isMouseDownRef = useRef(false)
  const lastSelectedIndexRef = useRef<number | null>(null)
  const verseMouseDownRef = useRef<number | null>(null)
  const firstMouseEnterRef = useRef(true)
  const selectedVerseMouseDownRef = useRef<number | null>(null)

  // Existing refs
  const booksRef = useRef<SelectorBook[]>([])
  const selectedBookRef = useRef<string | null>(null)
  const selectedChapterRef = useRef<number | null>(null)
  const selectedBibleIdRef = useRef<string | null>(null)
  const versesRef = useRef<SelectorVerse[]>([])
  const selectedVersesRef = useRef<Set<string>>(new Set())
  const modeRef = useRef<'select' | 'search'>('select')
  const resultsRef = useRef<any[]>([])
  const verseRangeSelectionsRef = useRef<Map<string, [number, number][]>>(new Map())

  useEffect(() => { booksRef.current = books }, [books])
  useEffect(() => { selectedBookRef.current = selectedBook }, [selectedBook])
  useEffect(() => { selectedChapterRef.current = selectedChapter }, [selectedChapter])
  useEffect(() => { selectedBibleIdRef.current = selectedBibleId }, [selectedBibleId])
  useEffect(() => { versesRef.current = verses }, [verses])
  useEffect(() => { selectedVersesRef.current = selectedVerses }, [selectedVerses])
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { resultsRef.current = results }, [results])
  useEffect(() => { verseRangeSelectionsRef.current = verseRangeSelections }, [verseRangeSelections])

  // Compute selectedVerses from range selections (for display)
  useEffect(() => {
    const computed = new Set<string>()
    
    // From verse ranges - keys are formatted as "book|chapter"
    for (const [key, ranges] of verseRangeSelections) {
      const parts = key.split('|')
      if (parts.length === 2) {
        const book = parts[0]
        const chapter = parseInt(parts[1], 10)
        const verseKeys = verseRangesToKeySet(ranges, book, chapter)
        for (const vk of verseKeys) computed.add(vk)
      }
    }
    
    setSelectedVerses(computed)
  }, [verseRangeSelections, selectedBibleId, library])

  // Populate books when bible is loaded or selected
  useEffect(() => {
    if (selectedBibleId) {
      const structure = library.getSelectorBible(selectedBibleId)
      if (structure) {
        setBooks(structure.books.map(b => ({ ...b, isSelected: false })))
        setSelectedBook(null)
        setChapters([])
        setSelectedChapter(null)
        setVerses([])
        setHighlightedVerse(null)
      }
    }
  }, [selectedBibleId, library])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setLoading(true)
    setError('')
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.name.endsWith('.vpc.json')) continue
        const content = await file.text()
        const raw = parseVpcJson(content)
        const bible = convertVpcToUniform(raw, file.name.replace('.vpc.json', ''))
        library.loadBible(bible)
      }
      setBibleCount(library.getBibleCount())
      setDocCount(library.getDocumentCount())
      const names = library.getAllBibleNames()
      setBibleNames(names)
      setSelectedBibleId(prev => prev || (names.length > 0 ? names[0].id : null))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file')
    }
    setLoading(false)
  }

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    // Try to parse as verse/chapter reference first (bypasses mode)
    const ref = parseReference(query)
    if (ref && selectedBibleId) {
      const structure = library.getSelectorBible(selectedBibleId)
      if (structure) {
        const bookIdx = structure.books.findIndex(b => b.abbreviation === ref.book)
        if (bookIdx >= 0) {
          setSelectedBook(ref.book)
          setChapters(structure.books[bookIdx].chapters.map(c => ({ ...c, isSelected: false, isHighlighted: false })))
          setSelectedChapter(ref.chapter)
          const newVerses = library.getVersesForChapter(selectedBibleId, ref.book, ref.chapter)
          setVerses(newVerses)
          
          // Add the specific verse to selection
          const bookChapKey = `${ref.book}|${ref.chapter}`
          setVerseRangeSelections(prev => {
            const next = new Map(prev)
            const existing = next.get(bookChapKey) || []
            next.set(bookChapKey, addVerseRange(existing, ref.verse))
            return next
          })
          
          setHighlightedVerse({ book: ref.book, chapter: ref.chapter, verse: ref.verse })
        }
      }
      return
    }

    // Try to find as a standalone book name (bypasses mode)
    const bookName = findBookByName(query)
    if (bookName && selectedBibleId) {
      const structure = library.getSelectorBible(selectedBibleId)
      if (structure) {
        const bookIdx = structure.books.findIndex(b => b.abbreviation === bookName)
        if (bookIdx >= 0) {
          setSelectedBook(bookName)
          setChapters(structure.books[bookIdx].chapters.map(c => ({ ...c, isSelected: false, isHighlighted: false })))
          const firstChapter = structure.books[bookIdx].chapters[0]?.id || 1
          setSelectedChapter(firstChapter)
          const newVerses = library.getVersesForChapter(selectedBibleId, bookName, firstChapter)
          setVerses(newVerses)
          setHighlightedVerse({ book: bookName, chapter: firstChapter, verse: 1 })
        }
      }
      return
    }

    // Fall back to text search
    if (mode === 'search') {
      const searchResults = library.search(query)
      const flattened = new Map<string, any>()
      for (const result of searchResults) {
        for (const match of result.matches) {
          const key = `${match.bibleId}|${match.testamentId}|${match.bookId}|${match.chapterId}:${match.verseId}`
          if (!flattened.has(key)) {
            flattened.set(key, {
              bookAbbreviation: bookNameToAbbr[match.bookName] || findBookByPattern(match.bookName) || match.bookName,
              ...match,
              matchingTerms: match.matchingTerms || [],
              score: match.score ?? 0,
            })
          } else {
            const existing = flattened.get(key)
            const existingTerms = new Set(existing.matchingTerms)
            for (const term of (match.matchingTerms || [])) existingTerms.add(term)
            existing.matchingTerms = Array.from(existingTerms)
            existing.score! += match.score ?? 0
          }
        }
      }
      const sortedResults = Array.from(flattened.values()).sort((a: any, b: any) => b.score - a.score)
      setResults(sortedResults)

      // Auto-select matching verses (search can add non-consecutive verses)
      for (const m of sortedResults) {
        const bookChapKey = `${m.bookAbbreviation}|${m.chapterId}`
        setVerseRangeSelections(prev => {
          const next = new Map(prev)
          const existing = next.get(bookChapKey) || []
          const updated = addVerseRange(existing, m.verseId)
          next.set(bookChapKey, updated)
          return next
        })
      }
    }
  }, [query, mode, library, selectedBibleId])

  const goToReference = useCallback((ref: { book: string; chapter: number; verse: number }) => {
    if (!selectedBibleId) return
    const structure = library.getSelectorBible(selectedBibleId)
    if (!structure) return

    const bookIdx = structure.books.findIndex(b => b.abbreviation === ref.book)
    if (bookIdx < 0) return

    setSelectedBook(ref.book)
    setChapters(structure.books[bookIdx].chapters.map(c => ({ ...c, isSelected: false, isHighlighted: false })))
    setSelectedChapter(ref.chapter)
    verseMouseDownRef.current = null
    lastSelectedIndexRef.current = null
    firstMouseEnterRef.current = true

    const newVerses = library.getVersesForChapter(selectedBibleId, ref.book, ref.chapter)
    setVerses(newVerses)

    // Highlight the verse but DON'T clear/add to selection - just show current location
    setHighlightedVerse({ book: ref.book, chapter: ref.chapter, verse: ref.verse })
  }, [selectedBibleId, library])

  const navigateToVerse = useCallback((bookAbbr: string, chapterId: number, verseId: number) => {
    if (!selectedBibleId) return
    const structure = library.getSelectorBible(selectedBibleId)
    if (!structure) return

    const bookIdx = structure.books.findIndex(b => b.abbreviation === bookAbbr)
    if (bookIdx < 0) return

    setSelectedBook(bookAbbr)
    setChapters(structure.books[bookIdx].chapters.map(c => ({ ...c, isSelected: false, isHighlighted: false })))
    setSelectedChapter(chapterId)
    verseMouseDownRef.current = null
    lastSelectedIndexRef.current = null
    firstMouseEnterRef.current = true

    const newVerses = library.getVersesForChapter(selectedBibleId, bookAbbr, chapterId)
    setVerses(newVerses)

    // Just highlight - don't modify selection (it preserves context)
    setHighlightedVerse({ book: bookAbbr, chapter: chapterId, verse: verseId })
  }, [selectedBibleId, library])

  const handleBookSelect = useCallback((abbr: string) => {
    setSelectedBook(prev => {
      const newBook = prev === abbr ? null : abbr
      if (newBook && selectedBibleId) {
        const structure = library.getSelectorBible(selectedBibleId)
        if (structure) {
          const book = structure.books.find(b => b.abbreviation === abbr)
          if (book) {
            setChapters(book.chapters.map(c => ({ ...c, isSelected: false, isHighlighted: false })))
            setSelectedChapter(null)
            setVerses([])
          }
        }
      }
      return newBook
    })
  }, [selectedBibleId, library])

  const handleChapterSelect = useCallback((chapterId: number) => {
    setSelectedChapter(prev => {
      const newChapter = prev === chapterId ? null : chapterId
      if (newChapter && selectedBook && selectedBibleId) {
        const newVerses = library.getVersesForChapter(selectedBibleId, selectedBook, newChapter)
        setVerses(newVerses)
        verseMouseDownRef.current = null
        lastSelectedIndexRef.current = null
        firstMouseEnterRef.current = true
      } else {
        setVerses([])
      }
      return newChapter
    })
  }, [selectedBook, selectedBibleId, library])



  const handleResultsClick = useCallback((match: any) => {
    const bookAbbr = match.bookAbbreviation
    if (!bookAbbr) return
    const chapterId = match.chapterId
    const verseId = match.verseId

    navigateToVerse(bookAbbr, chapterId, verseId)
  }, [navigateToVerse])

  const handleBibleSelect = useCallback((bibleId: string) => {
    setSelectedBibleId(bibleId)
  }, [])

  const handleLoadDemo = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('./data/bible.json')
      if (!response.ok) throw new Error('No demo data available')
      const content = await response.text()
      const raw = parseVpcJson(content)
      const bible = convertVpcToUniform(raw, 'demo')
      library.loadBible(bible)
      setBibleCount(library.getBibleCount())
      setDocCount(library.getDocumentCount())
      const names = library.getAllBibleNames()
      setBibleNames(names)
      setSelectedBibleId(prev => prev || (names.length > 0 ? names[0].id : null))
    } catch {
      setError('No demo data available. Upload a .vpc.json file instead.')
    }
    setLoading(false)
  }

  const handleGlobalMouseUp = useCallback(() => {
    isMouseDownRef.current = false
    lastSelectedIndexRef.current = null
    verseMouseDownRef.current = null
    selectedVerseMouseDownRef.current = null
    firstMouseEnterRef.current = true
  }, [])

  const handleContainerMouseDown = useCallback(() => {
    isMouseDownRef.current = true
  }, [])

  const totalSelectedVerseCount = selectedVerses.size

  return (
    <div
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', fontFamily: 'system-ui, sans-serif', height: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}
      onMouseUp={handleGlobalMouseUp}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Theomelios</h1>
        <span style={{ color: '#666', fontSize: '0.85rem' }}>Bible Search Engine</span>
        <div style={{ display: 'flex', background: '#e8e8e8', borderRadius: '6px', overflow: 'hidden', border: '1px solid #ccc' }}>
          <button
            onClick={() => setMode('select')}
            style={{
              padding: '0.4rem 1rem', border: 'none', cursor: 'pointer',
              background: mode === 'select' ? '#0066cc' : 'transparent',
              color: mode === 'select' ? 'white' : '#333',
              fontWeight: mode === 'select' ? 'bold' : 'normal',
              fontSize: '0.85rem',
            }}
          >
            Select
          </button>
          <button
            onClick={() => setMode('search')}
            style={{
              padding: '0.4rem 1rem', border: 'none', cursor: 'pointer',
              background: mode === 'search' ? '#0066cc' : 'transparent',
              color: mode === 'search' ? 'white' : '#333',
              fontWeight: mode === 'search' ? 'bold' : 'normal',
              fontSize: '0.85rem',
            }}
          >
            Search
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '0.5rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: '6px', fontSize: '0.85rem' }}>
        <strong>Loaded:</strong> {bibleCount} bibles, {docCount.toLocaleString()} indexed verses
      </div>

      <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="file"
          multiple
          accept=".vpc.json,.json"
          onChange={handleFileSelect}
          style={{ fontSize: '0.85rem' }}
        />
        <button onClick={handleLoadDemo} disabled={loading} style={{ padding: '0.4rem 0.75rem', background: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
          Load Demo
        </button>
        {bibleNames.length > 0 && (
          <select
            value={selectedBibleId || ''}
            onChange={e => handleBibleSelect(e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
          >
            {bibleNames.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {error && <p style={{ color: 'red', margin: '0.5rem 0', fontSize: '0.85rem' }}>{error}</p>}

      <form onSubmit={handleSearch} style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={mode === 'select' ? 'e.g. "john 3:16" or "1 john 2:1"' : 'Search for a word...'}
          style={{ flex: 1, padding: '0.5rem', fontSize: '0.95rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', fontSize: '0.95rem', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {mode === 'select' ? 'Go' : loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {mode === 'select' && totalSelectedVerseCount > 0 && (
        <div style={{ marginBottom: '0.5rem', padding: '0.4rem 0.75rem', background: '#e8f0fe', borderRadius: '4px', fontSize: '0.8rem', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <strong>{totalSelectedVerseCount} verse{totalSelectedVerseCount > 1 ? 's' : ''} selected</strong>
          <button onClick={() => { setVerseRangeSelections(new Map()); setHighlightedVerse(null); }} style={{ padding: '0.15rem 0.5rem', background: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem' }}>
            Clear
          </button>
        </div>
      )}

      {results.length > 0 && mode === 'search' && (
        <div style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#f0f7ff', borderRadius: '4px', fontSize: '0.85rem' }}>
          <strong>Search Results:</strong> {results.length} matches for "{query}"
          <button onClick={() => setResults([])} style={{ marginLeft: '0.75rem', padding: '0.15rem 0.5rem', background: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem' }}>
            Clear
          </button>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', gap: '8px', minHeight: 0, overflow: 'hidden' }}>
        {/* Books Pane */}
        <div style={{ flex: '0 0 140px', display: 'flex', flexDirection: 'column', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ padding: '0.5rem', background: '#f0f0f0', borderBottom: '1px solid #ddd', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Books
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem' }}>
            {books.map(book => (
              <div
                key={book.abbreviation}
                onClick={() => handleBookSelect(book.abbreviation)}
                onMouseDown={handleContainerMouseDown}
                style={{
                  padding: '0.35rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem',
                  background: selectedBook === book.abbreviation ? '#0066cc' : 'transparent',
                  color: selectedBook === book.abbreviation ? 'white' : '#333',
                  borderRadius: '3px', marginBottom: '1px',
                  borderLeft: selectedBook === book.abbreviation ? '3px solid #004499' : '3px solid transparent',
                }}
                title={book.name}
              >
                {book.abbreviation}
              </div>
            ))}
            {books.length === 0 && (
              <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
                {selectedBibleId ? 'No books' : 'No Bible loaded'}
              </div>
            )}
          </div>
        </div>

        {/* Chapters Pane */}
        <div style={{ flex: '0 0 110px', display: 'flex', flexDirection: 'column', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ padding: '0.5rem', background: '#f0f0f0', borderBottom: '1px solid #ddd', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Chapters
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem', userSelect: 'none' }}>
            {chapters.map((chapter) => {
              const isSelected = selectedChapter === chapter.id
              return (
                <div
                  key={chapter.id}
                  onClick={() => handleChapterSelect(chapter.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    padding: '0.35rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem',
                    background: isSelected ? '#0066cc' : 'transparent',
                    color: isSelected ? 'white' : '#333',
                    borderRadius: '3px', marginBottom: '1px',
                    borderLeft: isSelected ? '3px solid #004499' : '3px solid transparent',
                  }}
                >
                  {chapter.id}
                </div>
              )
            })}
            {chapters.length === 0 && (
              <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
                {selectedBook ? 'No chapters' : 'Select a book'}
              </div>
            )}
          </div>
        </div>

        {/* Verses Pane - now shows verse text previews with stacked selection */}
        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ padding: '0.5rem', background: '#f0f0f0', borderBottom: '1px solid #ddd', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Verses
            {selectedBook && selectedChapter && (
              <span style={{ fontWeight: 'normal', textTransform: 'none', marginLeft: '0.5rem', color: '#666' }}>
                {books.find(b => b.abbreviation === selectedBook)?.name || ''} {selectedChapter}
              </span>
            )}
          </div>
          <div
            style={{ flex: 1, overflowY: 'auto', padding: '0.25rem', userSelect: 'none' }}
            onMouseDown={(e) => {
              isMouseDownRef.current = true
              const target = e.target as HTMLElement
              const verseDiv = target.closest('[data-verse-index]')
              if (verseDiv) {
                const idx = parseInt(verseDiv.getAttribute('data-verse-index') || '-1', 10)
                if (idx >= 0 && idx < verses.length) {
                  verseMouseDownRef.current = idx
                  lastSelectedIndexRef.current = idx
                  firstMouseEnterRef.current = true
                }
              }
            }}
            onMouseMove={(e) => {
              if (!isMouseDownRef.current || lastSelectedIndexRef.current === null || verseMouseDownRef.current === null) return
              const target = document.elementFromPoint(e.clientX, e.clientY)
              if (!target) return
              const verseDiv = target.closest('[data-verse-index]')
              if (!verseDiv) return
              const idx = parseInt(verseDiv.getAttribute('data-verse-index') || '-1', 10)
              if (idx < 0 || idx >= verses.length) return
              if (idx === lastSelectedIndexRef.current) return
              
              const currentVerses = versesRef.current
              const firstIdx = verseMouseDownRef.current
              const start = Math.min(firstIdx, idx)
              const end = Math.max(firstIdx, idx)
              
              setVerseRangeSelections(prev => {
                const next = new Map(prev)
                if (currentVerses[start] && currentVerses[end]) {
                  const bookChapKey = `${currentVerses[start].bookAbbreviation}|${currentVerses[start].chapterId}`
                  const existing = next.get(bookChapKey) || []
                  const minVerse = Math.min(...currentVerses.slice(start, end + 1).map(v => v.id))
                  const maxVerse = Math.max(...currentVerses.slice(start, end + 1).map(v => v.id))
                  next.set(bookChapKey, collapseRanges([...existing, [minVerse, maxVerse]]))
                }
                return next
              })
              lastSelectedIndexRef.current = idx
            }}
          >
            {verses.map((verse, index) => {
              const key = `${verse.bookAbbreviation}|${verse.chapterId}|${verse.id}`
              const isSelected = selectedVerses.has(key)
              const isHighlighted = highlightedVerse?.book === verse.bookAbbreviation &&
                highlightedVerse?.chapter === verse.chapterId &&
                highlightedVerse?.verse === verse.id
              
              // Get verse text preview (truncated)
              const textPreview = truncateText(verse.text, 80)
              
              return (
                <div
                  key={key}
                  data-verse-index={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    const bookChapKey = `${verse.bookAbbreviation}|${verse.chapterId}`
                    
                    if (isSelected) {
                      // Toggle off: try to remove this verse from the ranges
                      setVerseRangeSelections(prev => {
                        const next = new Map(prev)
                        const existing = next.get(bookChapKey) || []
                        if (existing.length === 0) return next
                        
                        // Check if this verse is a standalone single-verse range
                        const singleIdx = existing.findIndex(([s, e]) => s === verse.id && e === verse.id)
                        if (singleIdx >= 0) {
                          const filtered = existing.filter(([, e], i) => i !== singleIdx || !(e === verse.id))
                          if (filtered.length === 0) {
                            next.delete(bookChapKey)
                          } else {
                            next.set(bookChapKey, filtered)
                          }
                          return next
                        }
                        
                        // Check if verse is in a multi-verse range
                        const rangeIdx = existing.findIndex(([s, e]) => s <= verse.id && verse.id <= e)
                        if (rangeIdx >= 0) {
                          const [start, end] = existing[rangeIdx]
                          const otherRanges = existing.filter((_, i) => i !== rangeIdx)
                          
                          if (start === verse.id && end === verse.id) {
                            // Single verse in range - remove it
                            if (otherRanges.length === 0) {
                              next.delete(bookChapKey)
                            } else {
                              next.set(bookChapKey, otherRanges)
                            }
                          } else if (start === verse.id) {
                            // First verse - shrink range
                            otherRanges.push([verse.id + 1, end])
                            next.set(bookChapKey, collapseRanges(otherRanges))
                          } else if (end === verse.id) {
                            // Last verse - shrink range
                            otherRanges.push([start, verse.id - 1])
                            next.set(bookChapKey, collapseRanges(otherRanges))
                          } else {
                            // Middle of range - split into two ranges
                            otherRanges.push([start, verse.id - 1])
                            otherRanges.push([verse.id + 1, end])
                            next.set(bookChapKey, collapseRanges(otherRanges))
                          }
                        }
                        
                        return next
                      })
                    } else {
                      // Toggle on: add to range
                      setVerseRangeSelections(prev => {
                        const next = new Map(prev)
                        const existing = next.get(bookChapKey) || []
                        next.set(bookChapKey, addVerseRange(existing, verse.id))
                        return next
                      })
                    }
                    
                    setHighlightedVerse({ book: verse.bookAbbreviation, chapter: verse.chapterId, verse: verse.id })
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    padding: '3px 5px',
                    marginBottom: '1px',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    background: isSelected ? '#0066cc' : isHighlighted ? '#d0e0ff' : '#fafafa',
                    color: isSelected ? 'white' : isHighlighted ? '#333' : '#333',
                    borderRadius: '3px',
                    border: `1px solid ${isSelected ? '#0055aa' : isHighlighted ? '#a0c0ee' : '#eee'}`,
                    transition: 'background 0.08s',
                    lineHeight: 1.3,
                  }}
                >
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '22px',
                    height: '20px',
                    padding: '0 4px',
                    marginRight: '5px',
                    marginTop: '1px',
                    fontSize: '0.7rem',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    background: isSelected ? 'rgba(255,255,255,0.2)' : '#e8e8e8',
                    color: isSelected ? 'white' : '#666',
                    borderRadius: '3px',
                    flexShrink: 0,
                  }}>
                    {verse.id}
                  </span>
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: isSelected ? 'rgba(255,255,255,0.9)' : '#888',
                  }}>
                    {textPreview}
                  </span>
                </div>
              )
            })}
            {verses.length === 0 && (
              <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#999', textAlign: 'center', width: '100%' }}>
                {selectedChapter ? 'No verses' : 'Select a chapter'}
              </div>
            )}
          </div>
        </div>

        {/* Results Pane */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ padding: '0.5rem', background: '#f0f0f0', borderBottom: '1px solid #ddd', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {mode === 'select' ? 'Selected Verses' : 'Search Results'}
            {mode === 'select' && totalSelectedVerseCount > 0 && (
              <span style={{ fontWeight: 'normal', textTransform: 'none', marginLeft: '0.5rem', color: '#666' }}>
                ({totalSelectedVerseCount})
              </span>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem' }}>
            {mode === 'select' ? (
              totalSelectedVerseCount > 0 ? (
                Array.from(selectedVerses).sort((a, b) => {
                  const partsA = a.split('|')
                  const partsB = b.split('|')
                  if (partsA[0] !== partsB[0]) return partsA[0].localeCompare(partsB[0])
                  if (parseInt(partsA[1]) !== parseInt(partsB[1])) return parseInt(partsA[1]) - parseInt(partsB[1])
                  return parseInt(partsA[2]) - parseInt(partsB[2])
                }).map((key, idx) => {
                  const parts = key.split('|')
                  const bookAbbr = parts[0]
                  const chapterId = parseInt(parts[1], 10)
                  const verseId = parseInt(parts[2], 10)
                  const book = books.find(b => b.abbreviation === bookAbbr)
                  const verse = library.findVerseByRef(selectedBibleId || '', bookAbbr, chapterId, verseId, books)
                  const isHighlighted = highlightedVerse?.book === bookAbbr &&
                    highlightedVerse?.chapter === chapterId &&
                    highlightedVerse?.verse === verseId
                  return (
                    <div
                      key={key}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigateToVerse(bookAbbr, chapterId, verseId)
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        selectedVerseMouseDownRef.current = idx
                      }}
                      onMouseEnter={(e) => {
                        e.stopPropagation()
                        if (isMouseDownRef.current) {
                          navigateToVerse(bookAbbr, chapterId, verseId)
                        }
                      }}
                      style={{
                        padding: '0.4rem', marginBottom: '2px', borderRadius: '3px',
                        background: isHighlighted ? '#e0ecff' : '#f9f9f9',
                        borderLeft: isHighlighted ? '3px solid #0066cc' : '3px solid #ddd',
                        cursor: 'pointer', fontSize: '0.78rem', lineHeight: 1.4,
                      }}
                    >
                      <strong>{book?.name || bookAbbr} {chapterId}:{verseId}</strong>
                      {verse?.text && <div style={{ marginLeft: '0.5rem', color: '#555' }}>{truncateText(verse.text, 150)}</div>}
                    </div>
                  )
                })
              ) : (
                <div style={{ padding: '1rem', fontSize: '0.85rem', color: '#999', textAlign: 'center' }}>
                  Select verses using the verse pane or type a reference (e.g., "john 3:16")
                </div>
              )
            ) : (
              results.length > 0 ? (
                results.map((m: any, j: number) => (
                  <div
                    key={j}
                    onClick={() => handleResultsClick(m)}
                    style={{
                      padding: '0.5rem', marginBottom: '2px', background: '#f9f9f9', borderRadius: '4px',
                      borderLeft: `4px solid ${m.matchingTerms?.length > 1 ? '#0066cc' : '#999'}`,
                      cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1.4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong>{m.bibleName}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>
                        {m.bookName} {m.chapterId}:{m.verseId}
                      </span>
                    </div>
                    <p style={{ margin: '0', color: '#333' }}>{m.text}</p>
                    {m.matchingTerms && m.matchingTerms.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.25rem' }}>
                        terms: [{m.matchingTerms.join(', ')}]
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ padding: '1rem', fontSize: '0.85rem', color: '#999', textAlign: 'center' }}>
                  No results
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
