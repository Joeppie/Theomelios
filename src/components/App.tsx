import { useState } from 'react'
import { BibleLibrary } from '../engine/BibleLibrary'
import { parseVpcJson } from '../engine/vpcParser'
import { convertVpcToUniform } from '../engine/bibleConverter'

function App() {
  const [library] = useState(() => new BibleLibrary())
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [bibleCount, setBibleCount] = useState(0)
  const [docCount, setDocCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setLoading(true)
    setError('')
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.name.endsWith('.vpc.json')) continue

        const content = await file.text()
        const raw = parseVpcJson(content)
        const bible = convertVpcToUniform(raw, file.name.replace('.vpc.json', ''))

        library.loadBible(bible)
        setBibleCount(library.getBibleCount())
        setDocCount(library.getDocumentCount())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file')
    }
    setLoading(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    const searchResults = library.search(query)
    const flattened = new Map<string, any>()

    for (const result of searchResults) {
      for (const match of result.matches) {
        const key = `${match.bibleId}|${match.testamentId}|${match.bookId}|${match.chapterId}:${match.verseId}`
        if (!flattened.has(key)) {
          flattened.set(key, {
            ...match,
            matchingTerms: match.matchingTerms || [],
            score: match.score ?? 0,
          })
        } else {
          const existing = flattened.get(key)
          const existingTerms = new Set(existing.matchingTerms)
          for (const term of (match.matchingTerms || [])) {
            existingTerms.add(term)
          }
          existing.matchingTerms = Array.from(existingTerms)
          existing.score! += match.score ?? 0
        }
      }
    }

    const sorted = Array.from(flattened.values())
      .sort((a, b) => b.score - a.score)

    setResults(sorted)
  }

  const handleLoadDemo = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('./data/bible.json')
      if (!response.ok) throw new Error('No demo data available')
      const content = await response.text()
      const raw = parseVpcJson(content)
      const bible = convertVpcToUniform(raw, 'demo')
      library.loadBible(bible)
      setBibleCount(library.getBibleCount())
      setDocCount(library.getDocumentCount())
    } catch {
      setError('No demo data available. Upload a .vpc.json file instead.')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Theomelios</h1>
      <p style={{ color: '#666' }}>Bible Search Engine</p>

      <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <strong>Loaded:</strong> {bibleCount} bibles, {docCount.toLocaleString()} indexed verses
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="file"
          multiple
          accept=".vpc.json,.json"
          onChange={handleFileSelect}
          style={{ display: 'block', marginBottom: '0.5rem' }}
        />
        <button onClick={handleLoadDemo} disabled={loading} style={{ padding: '0.5rem 1rem', background: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Load Demo Data
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for a word..."
          style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
        />
        <button type="submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <div>
          <h2>Results for "{query}" ({results.length} matches)</h2>
          {results.map((m: any, j: number) => (
            <div key={j} style={{ padding: '0.5rem', marginBottom: '0.5rem', background: '#f9f9f9', borderRadius: '4px', borderLeft: `4px solid ${m.matchingTerms.length > 1 ? '#0066cc' : '#999'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <strong>{m.bibleName}</strong> - {m.bookName} {m.chapterId}:{m.verseId}
                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                  terms: [{m.matchingTerms.join(', ')}]
                </span>
              </div>
              <p style={{ margin: '0', color: '#333' }}>{m.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
