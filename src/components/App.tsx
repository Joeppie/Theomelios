import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { BibleLibrary } from '../engine/BibleLibrary'
import { parseVpcJson } from '../engine/vpcParser'
import { convertVpcToUniform } from '../engine/bibleConverter'
import { loadBibleFromZipFile } from '../engine/zipLoader'
import { parseReference, findBookByName, bookNameToAbbr, findBookByPattern } from '../constants/books'
import type { SelectorBook, SelectorChapter, SelectorVerse } from '../types/ui'

// Component imports
import { Header } from './Header'
import { StatusInfo } from './StatusInfo'
import { FileUploader } from './FileUploader'
import { SearchBar } from './SearchBar'
import { SelectionSummary } from './SelectionSummary'
import { ResultsSummary } from './ResultsSummary'
import { BooksPane } from './BooksPane'
import { ChaptersPane } from './ChaptersPane'
import { VersesPane } from './VersesPane'
import { ResultsPane } from './ResultsPane'

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

function collapseRangesForMap(selections: Map<string, [number, number][]>): Map<string, [number, number][]> {
  const next = new Map(selections)
  for (const [key, ranges] of next) {
    next.set(key, collapseRanges(ranges))
  }
  return next
}

/**
 * App — top-level application component.
 * Manages state for Bible library, selection, search, and navigation.
 * Composes smaller components for header, file upload, search, book/chapter/verse panes, and results.
 */
function App() {
  // Bible library instance (persistent across renders)
  const [library] = useState(() => new BibleLibrary())

  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])

  // Library state
  const [bibleCount, setBibleCount] = useState(0)
  const [docCount, setDocCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Mode toggle (select vs search)
  const [mode, setMode] = useState<'select' | 'search'>('select')

  // Bible selection
  const [bibleNames, setBibleNames] = useState<{ id: string; name: string }[]>([])
  const [selectedBibleId, setSelectedBibleId] = useState<string | null>(null)

  // Book/chapter/verse navigation state
  const [books, setBooks] = useState<SelectorBook[]>([])
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [chapters, setChapters] = useState<SelectorChapter[]>([])
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [verses, setVerses] = useState<SelectorVerse[]>([])
  const [highlightedVerse, setHighlightedVerse] = useState<{ book: string; chapter: number; verse: number } | null>(null)

  // Range-based selection state (source of truth)
  const [verseRangeSelections, setVerseRangeSelections] = useState<Map<string, [number, number][]>>(new Map())
  const [, setForceLiveDragUpdate] = useState(0)

  // Derived selection state — expanded from range selections for display
  const selectedVerses = useMemo(() => {
    const keys = new Set<string>()
    for (const [key, ranges] of verseRangeSelections) {
      const parts = key.split('|')
      if (parts.length === 2) {
        const book = parts[0]
        const chapter = parseInt(parts[1], 10)
        for (const [start, end] of ranges) {
          for (let i = start; i <= end; i++) {
            keys.add(`${book}|${chapter}|${i}`)
          }
        }
      }
    }
    return keys
  }, [verseRangeSelections])

  // Drag state refs (avoid re-renders during drag)
  const isMouseDownRef = useRef(false)
  const lastSelectedIndexRef = useRef<number | null>(null)
  const verseMouseDownRef = useRef<number | null>(null)
  const firstMouseEnterRef = useRef(true)
  const selectionDragRef = useRef(false)
  const selectionMouseDownRef = useRef<{ bookAbbreviation: string; chapterId: number; verseId: number } | null>(null)
  const selectionSnapshotRef = useRef<string[]>([])
  const selectionTempRef = useRef<Map<string, [number, number][]>>(new Map())

  // Refs to keep latest values for callbacks
  const booksRef = useRef<SelectorBook[]>([])
  const selectedBookRef = useRef<string | null>(null)
  const selectedChapterRef = useRef<number | null>(null)
  const selectedBibleIdRef = useRef<string | null>(null)
  const versesRef = useRef<SelectorVerse[]>([])
  const modeRef = useRef<'select' | 'search'>('select')
  const resultsRef = useRef<any[]>([])
  const verseRangeSelectionsRef = useRef<Map<string, [number, number][]>>(new Map())

  useEffect(() => { booksRef.current = books }, [books])
  useEffect(() => { selectedBookRef.current = selectedBook }, [selectedBook])
  useEffect(() => { selectedChapterRef.current = selectedChapter }, [selectedChapter])
  useEffect(() => { selectedBibleIdRef.current = selectedBibleId }, [selectedBibleId])
  useEffect(() => { versesRef.current = verses }, [verses])
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { resultsRef.current = results }, [results])
  useEffect(() => { verseRangeSelectionsRef.current = verseRangeSelections }, [verseRangeSelections])

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

  // File loading handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setLoading(true)
    setError('')
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.name.endsWith('.zip')) {
          const results = await loadBibleFromZipFile(file)
          for (const { bible } of results) {
            library.loadBible(bible)
          }
        } else if (file.name.endsWith('.vpc.json')) {
          const content = await file.text()
          const raw = parseVpcJson(content)
          const bible = convertVpcToUniform(raw, file.name.replace('.vpc.json', ''))
          library.loadBible(bible)
        } else {
          continue
        }
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

  // Search handler — supports verse reference, book name, and text search
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    // Try to parse as verse/chapter reference first
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

    // Try to find as a standalone book name
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

      // Auto-select matching verses
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

  // Navigate to a specific verse
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

    // Just highlight — don't modify selection (preserves context)
    setHighlightedVerse({ book: bookAbbr, chapter: chapterId, verse: verseId })
  }, [selectedBibleId, library])

  // Book/chapter/verse selection handlers
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

  // Demo data loader
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

  // Global mouse handlers for drag selection
  const handleGlobalMouseUp = useCallback(() => {
    if (selectionDragRef.current && selectionMouseDownRef.current) {
      setVerseRangeSelections(collapseRangesForMap(selectionTempRef.current))
    }
    isMouseDownRef.current = false
    selectionDragRef.current = false
    selectionMouseDownRef.current = null
    lastSelectedIndexRef.current = null
    verseMouseDownRef.current = null
    selectedVerseMouseDownRef.current = null
    firstMouseEnterRef.current = true
  }, [])

  const handleContainerMouseDown = useCallback(() => {
    isMouseDownRef.current = true
  }, [])

  // Selection refs needed by VersesPane and ResultsPane
  const selectedVerseMouseDownRef = useRef<number | null>(null)

  return (
    <div
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', fontFamily: 'system-ui, sans-serif', height: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}
      onMouseUp={handleGlobalMouseUp}
      onMouseDown={handleContainerMouseDown}
    >
      {/* Header with mode toggle */}
      <Header mode={mode} setMode={setMode} />

      {/* Status info */}
      <StatusInfo bibleCount={bibleCount} docCount={docCount} />

      {/* File upload and bible selection */}
      <FileUploader
        loading={loading}
        error={error}
        bibleNames={bibleNames}
        selectedBibleId={selectedBibleId}
        onLoadFile={handleFileSelect}
        onLoadDemo={handleLoadDemo}
        onSelectBible={handleBibleSelect}
      />

      {/* Search bar */}
      <SearchBar
        query={query}
        setQuery={setQuery}
        onSubmit={handleSearch}
        loading={loading}
        mode={mode}
      />

      {/* Selection summary */}
      <SelectionSummary
        count={selectedVerses.size}
        onClear={() => { setVerseRangeSelections(new Map()); setHighlightedVerse(null); }}
      />

      {/* Results summary */}
      <ResultsSummary
        count={results.length}
        query={query}
        onClear={() => setResults([])}
      />

      {/* Main content: book/chapter/verse panes + results */}
      <div style={{ flex: 1, display: 'flex', gap: '8px', minHeight: 0, overflow: 'hidden' }}>
        {/* Books pane */}
        <BooksPane
          books={books}
          selectedBook={selectedBook}
          onBookSelect={handleBookSelect}
          onContainerMouseDown={handleContainerMouseDown}
        />

        {/* Chapters pane */}
        <ChaptersPane
          chapters={chapters}
          selectedChapter={selectedChapter}
          selectedBook={selectedBook}
          onChapterSelect={handleChapterSelect}
        />

        {/* Verses pane */}
        <VersesPane
          verses={verses}
          selectedVerses={selectedVerses}
          highlightedVerse={highlightedVerse}
          books={books}
          selectedBook={selectedBook}
          selectedChapter={selectedChapter}
          selectionDragRef={selectionDragRef}
          selectionMouseDownRef={selectionMouseDownRef}
          selectionSnapshotRef={selectionSnapshotRef}
          selectionTempRef={selectionTempRef}
          setVerseRangeSelections={setVerseRangeSelections}
          setForceLiveDragUpdate={setForceLiveDragUpdate}
          setHighlightedVerse={setHighlightedVerse}
        />

        {/* Results pane */}
        <ResultsPane
          mode={mode}
          selectedVerses={selectedVerses}
          results={results}
          books={books}
          highlightedVerse={highlightedVerse}
          _verseRangeSelections={verseRangeSelections}
          selectionDragRef={selectionDragRef}
          selectionMouseDownRef={selectionMouseDownRef}
          selectionSnapshotRef={selectionSnapshotRef}
          selectionTempRef={selectionTempRef}
          onNavigate={navigateToVerse}
          onResultsClick={handleResultsClick}
          onContainerMouseDown={handleContainerMouseDown}
          setVerseRangeSelections={setVerseRangeSelections}
          setForceLiveDragUpdate={setForceLiveDragUpdate}
        />
      </div>
    </div>
  )
}

export default App
