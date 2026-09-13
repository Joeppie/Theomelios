import { useState } from 'react'
import { BibleLibrary } from '../engine/BibleLibrary'
import type { BibleData } from '../types/bible'

function App() {
  const [library] = useState(() => new BibleLibrary())
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [bibleCount, setBibleCount] = useState(0)
  const [docCount, setDocCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const bookOrder: Record<string, number> = {
    'Gn': 1, 'Ex': 2, 'Lv': 3, 'Nu': 4, 'Dt': 5, 'Jos': 6, 'Jdg': 7, 'Ru': 8,
    '1Sa': 9, '2Sa': 10, '1Ki': 11, '2Ki': 12, '1Ch': 13, '2Ch': 14, 'Ezr': 15,
    'Ne': 16, 'Est': 17, 'Job': 18, 'Ps': 19, 'Pr': 20, 'Ec': 21, 'So': 22,
    'Is': 23, 'Je': 24, 'La': 25, 'Ez': 26, 'Dn': 27, 'Ho': 28, 'Jl': 29,
    'Am': 30, 'Ob': 31, 'Jon': 32, 'Mi': 33, 'Na': 34, 'Hab': 35, 'Zp': 36,
    'Hg': 37, 'Zc': 38, 'Mal': 39, 'Mt': 40, 'Mr': 41, 'Lu': 42, 'Jn': 43,
    'Ac': 44, 'Ro': 45, '1Co': 46, '2Co': 47, 'Ga': 48, 'Eph': 49, 'Ph': 50,
    'Col': 51, '1Th': 52, '2Th': 53, '1Ti': 54, '2Ti': 55, 'Ti': 56, 'Phm': 57,
    'He': 58, 'Ja': 59, '1Pe': 60, '2Pe': 61, '1Jn': 62, '2Jn': 63, '3Jn': 64,
    'Ju': 65, 'Re': 66,
  }

  function parseVpcJson(content: string): BibleData {
    // Lightweight VPC JSON parser that works in the browser
    function findStringEnd(data: string, pos: number): number {
      let i = pos
      let inEscape = false
      while (i < data.length) {
        if (inEscape) { inEscape = false; i++; continue }
        if (data[i] === '\\') { inEscape = true; i++; continue }
        if (data[i] === '"') return i
        i++
      }
      return i
    }

    function parseJsonValue(data: string, pos: number): { value: any; pos: number } {
      while (pos < data.length && /\s/.test(data[pos])) pos++
      if (pos >= data.length) return { value: null, pos }
      const char = data[pos]

      if (char === '"') {
        const end = findStringEnd(data, pos + 1)
        try {
          const value = JSON.parse(data.slice(pos, end + 1))
          return { value, pos: end + 1 }
        } catch {
          let s = data.slice(pos + 1, end)
          s = s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"')
          return { value: s, pos: end + 1 }
        }
      }
      if (char === '-' || (char >= '0' && char <= '9')) {
        let numStr = ''
        while (pos < data.length && (data[pos] >= '0' && data[pos] <= '9' || data[pos] === '.' || data[pos] === '-' || data[pos] === 'e' || data[pos] === 'E' || data[pos] === '+')) {
          numStr += data[pos]; pos++
        }
        const num = Number(numStr)
        return { value: isNaN(num) ? numStr : num, pos }
      }
      if (data.startsWith('true', pos)) return { value: true, pos: pos + 4 }
      if (data.startsWith('false', pos)) return { value: false, pos: pos + 5 }
      if (data.startsWith('null', pos)) return { value: null, pos: pos + 4 }
      if (char === '{') return parseJsonObject(data, pos)
      if (char === '[') return parseJsonArray(data, pos)
      return { value: null, pos: pos + 1 }
    }

    function parseJsonObject(data: string, pos: number): { value: Record<string, any>; pos: number } {
      const obj: Record<string, any> = {}
      pos++
      while (pos < data.length) {
        while (pos < data.length && /\s/.test(data[pos])) pos++
        if (pos >= data.length) break
        if (data[pos] === '}') { pos++; break }
        if (data[pos] === ',') { pos++; continue }

        let key: string
        if (data[pos] === '"') {
          const end = findStringEnd(data, pos + 1)
          try { key = JSON.parse(data.slice(pos, end + 1)) } catch { key = data.slice(pos + 1, end).replace(/\\n/g, '\n') }
          pos = end + 1
        } else {
          let keyEnd = pos
          while (keyEnd < data.length && data[keyEnd] !== ':' && !/\s/.test(data[keyEnd])) keyEnd++
          key = data.slice(pos, keyEnd)
          pos = keyEnd
        }

        while (pos < data.length && data[pos] !== ':') pos++
        pos++
        const result = parseJsonValue(data, pos)
        obj[key] = result.value
        pos = result.pos
      }
      return { value: obj, pos }
    }

    function parseJsonArray(data: string, pos: number): { value: any[]; pos: number } {
      const arr: any[] = []
      pos++
      while (pos < data.length) {
        while (pos < data.length && /\s/.test(data[pos])) pos++
        if (pos >= data.length) break
        if (data[pos] === ']') { pos++; break }
        if (data[pos] === ',') { pos++; continue }
        const result = parseJsonValue(data, pos)
        arr.push(result.value)
        pos = result.pos
      }
      return { value: arr, pos }
    }

    const processed = content.replace(/(\r\n|\r)/g, '\\n')
    const result = parseJsonValue(processed, 0)
    return result.value as BibleData
  }

  function parseBookId(id: string): number {
    // Map common abbreviations to book IDs
    const bookOrder: Record<string, number> = {
      'Gn': 1, 'Ex': 2, 'Lv': 3, 'Nu': 4, 'Dt': 5, 'Jos': 6, 'Jdg': 7, 'Ru': 8,
      '1Sa': 9, '2Sa': 10, '1Ki': 11, '2Ki': 12, '1Ch': 13, '2Ch': 14, 'Ezr': 15,
      'Ne': 16, 'Est': 17, 'Job': 18, 'Ps': 19, 'Pr': 20, 'Ec': 21, 'So': 22,
      'Is': 23, 'Je': 24, 'La': 25, 'Ez': 26, 'Dn': 27, 'Ho': 28, 'Jl': 29,
      'Am': 30, 'Ob': 31, 'Jon': 32, 'Mi': 33, 'Na': 34, 'Hab': 35, 'Zp': 36,
      'Hg': 37, 'Zc': 38, 'Mal': 39, 'Mt': 40, 'Mr': 41, 'Lu': 42, 'Jn': 43,
      'Ac': 44, 'Ro': 45, '1Co': 46, '2Co': 47, 'Ga': 48, 'Eph': 49, 'Ph': 50,
      'Col': 51, '1Th': 52, '2Th': 53, '1Ti': 54, '2Ti': 55, 'Ti': 56, 'Phm': 57,
      'He': 58, 'Ja': 59, '1Pe': 60, '2Pe': 61, '1Jn': 62, '2Jn': 63, '3Jn': 64,
      'Ju': 65, 'Re': 66,
    }
    return bookOrder[id] || 1
  }

  const convertVpcToUniform = (raw: any): any => {
    const testaments: any[] = []
    if (raw.Testaments) {
      for (const rawTest of raw.Testaments) {
        const books: any[] = []
        if (rawTest.Books) {
          for (let bIdx = 0; bIdx < rawTest.Books.length; bIdx++) {
            const rawBook = rawTest.Books[bIdx]
            const abbr = rawBook.Abbreviation || ''
            const bookId = bookOrder[abbr] || (bIdx + 1)
            const chapters: any[] = []
            if (rawBook.Chapters) {
              for (let cIdx = 0; cIdx < rawBook.Chapters.length; cIdx++) {
                const rawCh = rawBook.Chapters[cIdx]
                const verses: any[] = []
                if (rawCh.Verses) {
                  for (let vIdx = 0; vIdx < rawCh.Verses.length; vIdx++) {
                    const rawVerse = rawCh.Verses[vIdx]
                    verses.push({
                      id: rawVerse.ID || (vIdx + 1),
                      text: rawVerse.Text || '',
                    })
                  }
                }
                chapters.push({
                  id: rawCh.ID || (cIdx + 1),
                  verses,
                })
              }
            }
            books.push({
              id: bookId,
              abbreviation: abbr,
              name: rawBook.Text || abbr,
              chapters,
            })
          }
        }
        testaments.push({
          id: testaments.length + 1,
          name: rawTest.Text || (testaments.length === 0 ? 'Old Testament' : 'New Testament'),
          books,
        })
      }
    }
    return {
      id: '',
      metadata: {
        abbreviation: raw.Abbreviation || '',
        name: raw.Text || '',
        language: raw.Language || 'en',
        publisher: raw.Publisher || '',
        copyright: raw.Copyright || '',
        introduction: raw.Introduction || '',
        versionDate: raw.VersionDate || '',
      },
      testaments,
    }
  }

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
        const bible = convertVpcToUniform(raw)
        bible.id = file.name.replace('.vpc.json', '')

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
        const key = `${match.bibleId}|${match.chapterId}:${match.verseId}`
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
      // Load a small test bible from a fetch
      const response = await fetch('./data/bible.json')
      if (!response.ok) throw new Error('No demo data available')
      const content = await response.text()
      const raw = parseVpcJson(content)
      const bible = convertVpcToUniform(raw)
      library.loadBible(bible)
      setBibleCount(library.getBibleCount())
      setDocCount(library.getDocumentCount())
    } catch (err) {
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
