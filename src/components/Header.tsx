/**
 * Header — application title and search/selection mode toggle.
 */
export function Header({ mode, setMode }: {
  mode: 'select' | 'search'
  setMode: (mode: 'select' | 'search') => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Theomelios</h1>
      <span style={{ color: '#666', fontSize: '0.85rem' }}>Bible Search Engine</span>
      <div style={{ display: 'flex', background: '#e8e8e8', borderRadius: '6px', overflow: 'hidden', border: '1px solid #ccc' }}>
        <button
          onClick={() => setMode('select')}
          style={{
            padding: '0.4rem 1rem', border: 'none', cursor: 'pointer',
            background: mode === 'select' ? '#0066cc' : 'transparent',
            color: mode === 'select' ? 'white' : '#333',
            fontWeight: mode === 'select' ? 'bold' : 'normal',
            fontSize: '0.85rem',
          }}
        >
          Select
        </button>
        <button
          onClick={() => setMode('search')}
          style={{
            padding: '0.4rem 1rem', border: 'none', cursor: 'pointer',
            background: mode === 'search' ? '#0066cc' : 'transparent',
            color: mode === 'search' ? 'white' : '#333',
            fontWeight: mode === 'search' ? 'bold' : 'normal',
            fontSize: '0.85rem',
          }}
        >
          Search
        </button>
      </div>
    </div>
  )
}
