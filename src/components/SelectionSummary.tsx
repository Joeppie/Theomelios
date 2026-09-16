/**
 * SelectionSummary — displays the count of selected verses with a clear button.
 */
export function SelectionSummary({ count, onClear }: {
  count: number
  onClear: () => void
}) {
  if (count === 0) return null
  return (
    <div style={{ marginBottom: '0.5rem', padding: '0.4rem 0.75rem', background: '#e8f0fe', borderRadius: '4px', fontSize: '0.8rem', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <strong>{count} verse{count > 1 ? 's' : ''} selected</strong>
      <button onClick={onClear} style={{ padding: '0.15rem 0.5rem', background: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '0.75rem' }}>
        Clear
      </button>
    </div>
  )
}
