/**
 * ResultsSummary — displays the count of search results with a clear button.
 */
export function ResultsSummary({ count, query, onClear }: {
  count: number
  query: string
  onClear: () => void
}) {
  if (count === 0) return null
  return (
    <div style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#f0f7ff', borderRadius: '4px', fontSize: '0.85rem' }}>
      <strong>Search Results:</strong> {count} matches for "{query}"
      <button onClick={onClear} style={{ marginLeft: '0.75rem', padding: '0.15rem 0.5rem', background: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem' }}>
        Clear
      </button>
    </div>
  )
}
