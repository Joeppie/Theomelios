import { bookCategories, bookCategoryMap } from '../constants/books'
import type { SelectorBook } from '../types/ui'

/**
 * BooksPane — displays book buttons grouped by category (Pentateuch, Historical,
 * etc.). Books are colored by category, selected book is highlighted.
 */
export function BooksPane({ books, selectedBook, onBookSelect, onContainerMouseDown }: {
  books: SelectorBook[]
  selectedBook: string | null
  onBookSelect: (abbr: string) => void
  onContainerMouseDown: () => void
}) {
  if (books.length === 0) {
    return (
      <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ padding: '0.5rem', background: '#f0f0f0', borderBottom: '1px solid #ddd', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Books
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.35rem' }}>
          <div style={{ padding: '0.5rem', fontSize: '0.75rem', color: '#999', textAlign: 'center' }}>
            No Bible loaded
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
      <div style={{ padding: '0.5rem', background: '#f0f0f0', borderBottom: '1px solid #ddd', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Books
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.35rem' }}>
        {bookCategories.map(category => {
          const visibleBooks = category.books.filter(abbr => books.some(b => b.abbreviation === abbr))
          if (visibleBooks.length === 0) return null
          return (
            <div key={category.id} style={{ marginBottom: '0.35rem' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 'bold', color: category.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px', paddingLeft: '1px' }}>
                {category.name}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                {visibleBooks.map(abbr => {
                  const book = books.find(b => b.abbreviation === abbr)
                  const isSelected = selectedBook === abbr
                  const cat = bookCategoryMap[abbr]
                  return (
                    <div
                      key={abbr}
                      onClick={() => onBookSelect(abbr)}
                      onMouseDown={onContainerMouseDown}
                      title={book?.name || abbr}
                      style={{
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.55rem',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        borderRadius: '2px',
                        background: isSelected
                          ? cat?.color || '#0066cc'
                          : (cat?.color || '#999') + 'cc',
                        color: isSelected ? 'white' : 'white',
                        border: isSelected ? `2px solid ${cat?.color || '#0066cc'}` : `2px solid ${cat?.color || '#999'}`,
                        transition: 'transform 0.08s',
                        transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {abbr}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
