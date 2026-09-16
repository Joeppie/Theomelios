import type { SelectorVerse } from '../types/ui'

// Type for drag mouse-down state
interface DragMouseDownState {
  bookAbbreviation: string
  chapterId: number
  verseId: number
}

/**
 * VersesPane — displays verse text previews with stacked click-and-drag selection.
 * Manages inline refs and callbacks for drag selection (mousedown, mousemove, mouseup).
 */
export function VersesPane({
  verses,
  selectedVerses,
  highlightedVerse,
  books,
  selectedBook,
  selectedChapter,
  selectionDragRef,
  selectionMouseDownRef,
  selectionSnapshotRef,
  selectionTempRef,
  setVerseRangeSelections,
  setForceLiveDragUpdate,
  setHighlightedVerse,
}: {
  verses: SelectorVerse[]
  selectedVerses: Set<string>
  highlightedVerse: { book: string; chapter: number; verse: number } | null
  books: { abbreviation: string; name: string }[]
  selectedBook: string | null
  selectedChapter: number | null
  selectionDragRef: React.MutableRefObject<boolean>
  selectionMouseDownRef: React.MutableRefObject<DragMouseDownState | null>
  selectionSnapshotRef: React.MutableRefObject<string[]>
  selectionTempRef: React.MutableRefObject<Map<string, [number, number][]>>
  setVerseRangeSelections: (fn: (prev: Map<string, [number, number][]>) => Map<string, [number, number][]>) => void
  setForceLiveDragUpdate: (fn: (prev: number) => number) => void
  setHighlightedVerse: (v: { book: string; chapter: number; verse: number } | null) => void
}) {
  // Truncate text utility
  const truncateText = (text: string, maxLen: number): string => {
    if (text.length <= maxLen) return text
    return text.substring(0, maxLen) + '\u2026'
  }

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

  // Add verse to ranges
  const addVerseRange = (ranges: [number, number][], verseId: number): [number, number][] => {
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

  // Handle verse click
  const handleVerseClick = (verse: SelectorVerse, isSelected: boolean) => {
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
            if (otherRanges.length === 0) {
              next.delete(bookChapKey)
            } else {
              next.set(bookChapKey, otherRanges)
            }
          } else if (start === verse.id) {
            otherRanges.push([verse.id + 1, end])
            next.set(bookChapKey, collapseRanges(otherRanges))
          } else if (end === verse.id) {
            otherRanges.push([start, verse.id - 1])
            next.set(bookChapKey, collapseRanges(otherRanges))
          } else {
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
  }

  // Handle verse mousedown
  const handleVerseMouseDown = (verse: SelectorVerse, _idx: number) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      const key = `${verse.bookAbbreviation}|${verse.chapterId}|${verse.id}`
      if (!selectedVerses.has(key)) {
        selectionTempRef.current.delete(`${verse.bookAbbreviation}|${verse.chapterId}`)
        setForceLiveDragUpdate(prev => prev + 1)
      }
    }
  }

  // Handle container mousemove (for drag)
  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!selectionDragRef.current || !selectionMouseDownRef.current) return
    e.stopPropagation()
    const target = document.elementFromPoint(e.clientX, e.clientY)
    if (!target) return
    const verseDiv = target.closest('[data-verse-index]')
    if (!verseDiv) return
    const idx = parseInt(verseDiv.getAttribute('data-verse-index') || '-1', 10)
    if (idx < 0 || idx >= verses.length) return

    const startKey = `${selectionMouseDownRef.current.bookAbbreviation}|${selectionMouseDownRef.current.chapterId}|${selectionMouseDownRef.current.verseId}`
    const startSnapIdx = selectionSnapshotRef.current.indexOf(startKey)
    const currentKey = `${verses[idx].bookAbbreviation}|${verses[idx].chapterId}|${verses[idx].id}`
    const currentSnapIdx = selectionSnapshotRef.current.indexOf(currentKey)
    if (startSnapIdx < 0 || currentSnapIdx < 0) return

    const firstIdx = Math.min(startSnapIdx, currentSnapIdx)
    const lastIdx = Math.max(startSnapIdx, currentSnapIdx)
    const bookChapKey = `${verses[idx].bookAbbreviation}|${verses[idx].chapterId}`
    const minVerse = Math.min(...verses.slice(firstIdx, lastIdx + 1).map(v => v.id))
    const maxVerse = Math.max(...verses.slice(firstIdx, lastIdx + 1).map(v => v.id))

    selectionTempRef.current = new Map(selectionTempRef.current)
    const existing = selectionTempRef.current.get(bookChapKey) || []
    selectionTempRef.current.set(bookChapKey, collapseRanges([...existing, [minVerse, maxVerse]]))
    setForceLiveDragUpdate(prev => prev + 1)
  }

  // Check if a verse is currently being dragged (temporary ref)
  const isTempSelected = (verse: SelectorVerse): boolean => {
    if (!selectionDragRef.current) return false
    const ranges = selectionTempRef.current.get(`${verse.bookAbbreviation}|${verse.chapterId}`)
    if (!ranges) return false
    for (const [start, end] of ranges) {
      if (verse.id >= start && verse.id <= end) {
        return true
      }
    }
    return false
  }

  return (
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
        onMouseDown={e => {
          e.stopPropagation()
          const target = e.target as HTMLElement
          const verseDiv = target.closest('[data-verse-index]')
          if (verseDiv) {
            handleVerseMouseDown(
              verses[parseInt(verseDiv.getAttribute('data-verse-index') || '-1', 10)],
              parseInt(verseDiv.getAttribute('data-verse-index') || '-1', 10)
            )(e as any)
          }
        }}
        onMouseMove={handleContainerMouseMove}
      >
        {verses.map((verse, index) => {
          const key = `${verse.bookAbbreviation}|${verse.chapterId}|${verse.id}`
          let isSelected = selectedVerses.has(key)
          if (selectionDragRef.current) {
            isSelected = isTempSelected(verse)
          }
          const isHighlighted = highlightedVerse?.book === verse.bookAbbreviation &&
            highlightedVerse?.chapter === verse.chapterId &&
            highlightedVerse?.verse === verse.id

          return (
            <div
              key={key}
              data-verse-index={index}
              onClick={(e) => {
                e.stopPropagation()
                if (selectionDragRef.current) return
                handleVerseClick(verse, isSelected)
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
                {truncateText(verse.text, 80)}
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
  )
}
