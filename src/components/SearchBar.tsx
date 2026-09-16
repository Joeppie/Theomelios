/**
 * SearchBar — text input for verse references, book names, or full-text search.
 */
export function SearchBar({ query, setQuery, onSubmit, loading, mode }: {
  query: string
  setQuery: (q: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  mode: 'select' | 'search'
}) {
  return (
    <form onSubmit={onSubmit} style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
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
  )
}
