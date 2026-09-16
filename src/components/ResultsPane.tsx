import type { SelectorBook } from '../types/ui'

/**
 * ResultsPane — displays either selected verses (select mode) or search results (search mode).
 * Supports click-to-navigate and drag selection.
 */
export function ResultsPane({
  mode,
  selectedVerses,
  results,
  books,
  highlightedVerse,
  _verseRangeSelections,
  selectionDragRef,
  selectionMouseDownRef,
  selectionSnapshotRef,
  selectionTempRef,
  onNavigate,
  onResultsClick,
  onContainerMouseDown,
  setVerseRangeSelections,
  setForceLiveDragUpdate,
}: {
  mode: 'select' | 'search'
  selectedVerses: Set<string>
  results: any[]
  books: SelectorBook[]
  highlightedVerse: { book: string; chapter: number; verse: number } | null
  _verseRangeSelections: Map<string, [number, number][]>
  selectionDragRef: React.MutableRefObject<boolean>
  selectionMouseDownRef: React.MutableRefObject<{ bookAbbreviation: string; chapterId: number; verseId: number } | null>
  selectionSnapshotRef: React.MutableRefObject<string[]>
  selectionTempRef: React.MutableRefObject<Map<string, [number, number][]>>
  onNavigate: (bookAbbr: string, chapterId: number, verseId: number) => void
  onResultsClick: (match: any) => void
  onContainerMouseDown: () => void
  setVerseRangeSelections: (fn: (prev: Map<string, [number, number][]>) => Map<string, [number, number][]>) => void
  setForceLiveDragUpdate: (fn: (prev: number) => number) => void
}) {
  // Collapse ranges utility
  const collapseRanges = (ranges: [number, number][]): [number, number][] => {
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

  // Handle mouse drag enter for results pane (add verses to selection)
  const handleDragEnter = (bookAbbr: string, chapterId: number, verseId: number) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!selectionDragRef.current || !selectionMouseDownRef.current) return
      const snapKey = `${bookAbbr}|${chapterId}|${verseId}`
      const snapIdx = selectionSnapshotRef.current.indexOf(snapKey)
      if (snapIdx < 0) return
      const startKey = `${selectionMouseDownRef.current.bookAbbreviation}|${selectionMouseDownRef.current.chapterId}|${selectionMouseDownRef.current.verseId}`
      const startIdx = selectionSnapshotRef.current.indexOf(startKey)
      if (startIdx < 0) return
      const first = Math.min(startIdx, snapIdx)
      const last = Math.max(startIdx, snapIdx)
      for (let i = first; i <= last; i++) {
        const k = selectionSnapshotRef.current[i]
        if (k) {
          const parts = k.split('|')
          const bk = `${parts[0]}|${parts[1]}`
          const vid = parseInt(parts[2], 10)
          selectionTempRef.current = new Map(selectionTempRef.current)
          const existing = selectionTempRef.current.get(bk) || []
          selectionTempRef.current.set(bk, collapseRanges([...existing, [vid, vid]]))
        }
      }
    }
  }

  // Handle mouse down for results pane (start drag)
  const handleDragMouseDown = (bookAbbr: string, chapterId: number, verseId: number, currentSelected: Set<string>, setVerseRangeSelections: (fn: (prev: Map<string, [number, number][]>) => Map<string, [number, number][]>) => void, setForceLiveDragUpdate: (fn: (prev: number) => number) => void, onContainerMouseDown: () => void) => {
    return () => {
      onContainerMouseDown()
      selectionDragRef.current = true
      selectionMouseDownRef.current = { bookAbbreviation: bookAbbr, chapterId, verseId }
      const snapKey = `${bookAbbr}|${chapterId}|${verseId}`
      const selIdx = Array.from(currentSelected).indexOf(snapKey)
      if (selIdx >= 0) {
        selectionSnapshotRef.current = Array.from(currentSelected)
      } else {
        selectionSnapshotRef.current = [snapKey, ...Array.from(currentSelected)]
      }
      selectionTempRef.current = new Map()
    }
  }

  if (mode === 'select') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ padding: '0.5rem', background: '#f0f0f0', borderBottom: '1px solid #ddd', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Selected Verses
          {selectedVerses.size > 0 && (
            <span style={{ fontWeight: 'normal', textTransform: 'none', marginLeft: '0.5rem', color: '#666' }}>
              ({selectedVerses.size})
            </span>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem' }}>
          {selectedVerses.size > 0 ? (
            Array.from(selectedVerses).sort((a, b) => {
              const partsA = a.split('|')
              const partsB = b.split('|')
              if (partsA[0] !== partsB[0]) return partsA[0].localeCompare(partsB[0])
              if (parseInt(partsA[1]) !== parseInt(partsB[1])) return parseInt(partsA[1]) - parseInt(partsB[1])
              return parseInt(partsA[2]) - parseInt(partsB[2])
            }).map((key) => {
              const parts = key.split('|')
              const bookAbbr = parts[0]
              const chapterId = parseInt(parts[1], 10)
              const verseId = parseInt(parts[2], 10)
              const book = books.find(b => b.abbreviation === bookAbbr)
              const isHighlighted = highlightedVerse?.book === bookAbbr &&
                highlightedVerse?.chapter === chapterId &&
                highlightedVerse?.verse === verseId

              return (
                <div
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (selectionDragRef.current) return
                    onNavigate(bookAbbr, chapterId, verseId)
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    if (selectionMouseDownRef.current) return
                    handleDragMouseDown(bookAbbr, chapterId, verseId, selectedVerses, setVerseRangeSelections, setForceLiveDragUpdate, onContainerMouseDown)()
                  }}
                  onMouseEnter={handleDragEnter(bookAbbr, chapterId, verseId)}
                  style={{
                    padding: '0.4rem', marginBottom: '2px', borderRadius: '3px',
                    background: isHighlighted ? '#e0ecff' : '#f9f9f9',
                    borderLeft: isHighlighted ? '3px solid #0066cc' : '3px solid #ddd',
                    cursor: 'pointer', fontSize: '0.78rem', lineHeight: 1.4,
                  }}
                >
                  <strong>{book?.name || bookAbbr} {chapterId}:{verseId}</strong>
                </div>
              )
            })
          ) : (
            <div style={{ padding: '1rem', fontSize: '0.85rem', color: '#999', textAlign: 'center' }}>
              Select verses using the verse pane or type a reference (e.g., "john 3:16")
            </div>
          )}
        </div>
      </div>
    )
  }

  // Search mode — display search results
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
      <div style={{ padding: '0.5rem', background: '#f0f0f0', borderBottom: '1px solid #ddd', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Search Results
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem' }}>
        {results.length > 0 ? (
          results.map((m, j) => (
            <div
              key={j}
              onClick={() => {
                if (selectionDragRef.current) return
                onResultsClick(m)
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                if (selectionMouseDownRef.current) return
                handleDragMouseDown(m.bookAbbreviation, m.chapterId, m.verseId, selectedVerses, setVerseRangeSelections, setForceLiveDragUpdate, onContainerMouseDown)()
              }}
              onMouseEnter={handleDragEnter(m.bookAbbreviation, m.chapterId, m.verseId)}
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
        )}
      </div>
    </div>
  )
}
