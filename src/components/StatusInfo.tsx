/**
 * StatusInfo — displays the count of loaded bibles and indexed verses.
 */
export function StatusInfo({ bibleCount, docCount }: {
  bibleCount: number
  docCount: number
}) {
  return (
    <div style={{ marginBottom: '0.5rem', padding: '0.75rem', background: '#f5f5f5', borderRadius: '6px', fontSize: '0.85rem' }}>
      <strong>Loaded:</strong> {bibleCount} bibles, {docCount.toLocaleString()} indexed verses
    </div>
  )
}
