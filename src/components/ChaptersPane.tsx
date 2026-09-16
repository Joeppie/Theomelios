import type { SelectorChapter } from '../types/ui'

/**
 * ChaptersPane — displays chapter buttons for the selected book.
 */
export function ChaptersPane({ chapters, selectedChapter, selectedBook, onChapterSelect }: {
  chapters: SelectorChapter[]
  selectedChapter: number | null
  selectedBook: string | null
  onChapterSelect: (chapterId: number) => void
}) {
  return (
    <div style={{ flex: '0 0 165px', display: 'flex', flexDirection: 'column', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
      <div style={{ padding: '0.5rem', background: '#f0f0f0', borderBottom: '1px solid #ddd', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Chapters
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.35rem', userSelect: 'none' }}>
        {chapters.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
            {chapters.map((chapter) => {
              const isSelected = selectedChapter === chapter.id
              return (
                <div
                  key={chapter.id}
                  onClick={() => onChapterSelect(chapter.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  title={`Chapter ${chapter.id}`}
                  style={{
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    borderRadius: '2px',
                    background: isSelected ? '#0066cc' : '#555',
                    color: isSelected ? 'white' : 'white',
                    border: isSelected ? '2px solid #004499' : '2px solid #333',
                    transition: 'transform 0.08s',
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {chapter.id}
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
            {selectedBook ? 'No chapters' : 'Select a book'}
          </div>
        )}
      </div>
    </div>
  )
}
