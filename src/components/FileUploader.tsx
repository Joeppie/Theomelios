/**
 * FileUploader — file input for loading .zip and .vpc.json bible files,
 * a demo data button, and a dropdown for selecting among loaded bibles.
 */
export function FileUploader({ loading, error, bibleNames, selectedBibleId, onLoadFile, onLoadDemo, onSelectBible }: {
  loading: boolean
  error: string
  bibleNames: { id: string; name: string }[]
  selectedBibleId: string | null
  onLoadFile: (e: React.ChangeEvent<HTMLInputElement>) => void
  onLoadDemo: () => void
  onSelectBible: (bibleId: string) => void
}) {
  return (
    <>
      <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="file"
          multiple
          accept=".vpc.json,.json,.zip"
          onChange={onLoadFile}
          style={{ fontSize: '0.85rem' }}
        />
        <button onClick={onLoadDemo} disabled={loading} style={{ padding: '0.4rem 0.75rem', background: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
          Load Demo
        </button>
        {bibleNames.length > 0 && (
          <select
            value={selectedBibleId || ''}
            onChange={e => onSelectBible(e.target.value)}
            style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
          >
            {bibleNames.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>
      {error && <p style={{ color: 'red', margin: '0.5rem 0', fontSize: '0.85rem' }}>{error}</p>}
    </>
  )
}
