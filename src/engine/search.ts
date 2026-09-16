import type { SearchDocument, BibleData, SearchResult } from '../types/bible'

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'i', 'me', 'my', 'we', 'our',
  'you', 'your', 'he', 'she', 'they', 'them', 'their', 'this', 'that',
  'these', 'those', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
  'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might',
  'can', 'could', 'not', 'no', 'nor', 'so', 'if', 'then', 'than',
  'too', 'very', 'just', 'about', 'up', 'out', 'as', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'only',
  'own', 'same', 'also', 'back', 'down', 'over', 'its', 'her',
  'him', 'off', 'any', 'all', 's', 't', 'd', 'm', 're',
  'am', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
  'every', 'yet', 'still', 'well', 'even', 'make', 'made',
  'like', 'much', 'many', 'got', 'new', 'now', 'here', 'there',
])

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1)
}

export function simpleStem(word: string): string {
  const w = word.toLowerCase()
  if (w.length <= 3) return w

  let stemmed = w

  const suffixRules: [string, string][] = [
    ['ting', ''], ['ness', ''], ['less', ''], ['ful', ''],
    ['tion', ''], ['sion', ''], ['ment', ''], ['able', ''],
    ['ible', ''], ['ous', ''], ['ive', ''], ['ize', ''],
    ['ise', ''], ['ate', ''], ['ity', ''], ['ing', ''],
    ['est', ''], ['ism', ''], ['ist', ''], ['ies', 'y'],
    ['ses', ''], ['xes', ''], ['zes', ''], ['ches', ''],
    ['shes', ''], ['ths', ''], ['ves', 'v'], ['ces', ''],
  ]

  for (const [suffix, replacement] of suffixRules) {
    if (stemmed.endsWith(suffix) && stemmed.length - suffix.length >= 2) {
      stemmed = stemmed.slice(0, -suffix.length) + replacement
      break
    }
  }

  // final simple suffixes (single char or common)
  const simpleSuffixes = ['s', 'es', 'ed', 'ing']
  if (stemmed.length > 3) {
    for (const suff of simpleSuffixes) {
      if (stemmed.endsWith(suff) && stemmed.length - suff.length >= 3) {
        stemmed = stemmed.slice(0, -suff.length)
        break
      }
    }
  }

  return stemmed || w
}

export function shouldIgnoreWord(word: string): boolean {
  const lower = word.toLowerCase()
  if (STOP_WORDS.has(lower)) return true
  if (/^\d+$/.test(lower)) return true
  return false
}

export class SearchIndex {
  private index = new Map<string, Set<string>>()
  private docs = new Map<string, SearchDocument>()
  private versionBibleNames = new Map<string, string>()
  private bibleDocKeys = new Map<string, Set<string>>()
  private docToStems = new Map<string, string[]>()
  private docToPositions = new Map<string, number[]>()

  private docKey(doc: SearchDocument): string {
    return `${doc.bibleId}|${doc.testamentId}|${doc.bookId}|${doc.chapterId}|${doc.verseId}`
  }

  indexDocument(doc: SearchDocument): void {
    const key = this.docKey(doc)
    this.docs.set(key, doc)
    this.versionBibleNames.set(doc.bibleId, doc.bibleName)

    if (!this.bibleDocKeys.has(doc.bibleId)) {
      this.bibleDocKeys.set(doc.bibleId, new Set())
    }
    this.bibleDocKeys.get(doc.bibleId)!.add(key)

    const tokens = tokenize(doc.text)
    const stemKeys: string[] = []
    const positions: number[] = []
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (shouldIgnoreWord(token)) continue
      const stem = simpleStem(token)
      if (!this.index.has(stem)) {
        this.index.set(stem, new Set())
      }
      this.index.get(stem)!.add(key)
      stemKeys.push(stem)
      positions.push(i)
    }
    this.docToStems.set(key, stemKeys)
    this.docToPositions.set(key, positions)
  }

  indexBible(bible: BibleData): void {
    for (const testament of bible.testaments) {
      for (const book of testament.books) {
        for (const chapter of book.chapters) {
          for (const verse of chapter.verses) {
            const doc: SearchDocument = {
              bibleId: bible.id,
              bibleName: bible.metadata.name,
              testamentId: testament.id,
              bookId: book.id,
              bookName: book.name,
              chapterId: chapter.id,
              verseId: verse.id,
              text: verse.text,
            }
            this.indexDocument(doc)
          }
        }
      }
    }
  }

  search(query: string): SearchResult[] {
    const tokens = tokenize(query).filter(t => !shouldIgnoreWord(t))
    if (tokens.length === 0) return []

    const stems = tokens.map(t => simpleStem(t))
    const stemMatches = new Map<string, Set<string>>()
    const stemFreq = new Map<string, number>()

    for (const stem of stems) {
      const matches = this.index.get(stem)
      if (!matches) continue
      stemMatches.set(stem, new Set(matches))
      stemFreq.set(stem, matches.size)
    }

    if (stemMatches.size === 0) return []

    // Collect all unique document keys
    const allKeys = new Set<string>()
    for (const matches of stemMatches.values()) {
      for (const key of matches) {
        allKeys.add(key)
      }
    }

    // For each document, calculate score and matching terms (by stem)
    type RankedDoc = {
      key: string
      score: number
      matchingTerms: Set<string>
    }

    const ranked: RankedDoc[] = []

    for (const key of allKeys) {
      const docStems = this.docToStems.get(key)
      const docPositions = this.docToPositions.get(key)
      if (!docStems || !docPositions) continue

      const matchingTerms = new Set<string>()
      let score = 0
      let positionBonus = 0

      // Track the last position we saw for ordering bonus
      let lastPosition = -1

      for (const [stemIdx, stem] of stems.entries()) {
        const stemSet = stemMatches.get(stem)
        if (!stemSet || !stemSet.has(key)) continue

        matchingTerms.add(stem)

        // Position weight: earlier terms in query weigh more
        const positionWeight = 1 / (stemIdx + 1)

        // IDF: always positive, higher for rarer terms
        const corpusFreq = stemFreq.get(stem) || 1
        const idf = Math.log(1 + (10000 / (corpusFreq + 1)))

        score += positionWeight * idf

        // Check if this stem appears after the last matched stem in the verse
        const stemPositions = docPositions.filter(p => docStems[p] === stem)
        if (stemPositions.length > 0) {
          const firstOccurrence = Math.min(...stemPositions)
          if (firstOccurrence > lastPosition) {
            // Stem appears after previous match in query order
            positionBonus += 0.5
          } else {
            // Stem appears out of order - significant penalty
            positionBonus -= 0.25
          }
          lastPosition = firstOccurrence
        }
      }

      if (matchingTerms.size === 0) continue

      // Partial match penalty: divide by total query terms
      score /= stems.length

      // Add position bonus
      score += positionBonus

      ranked.push({ key, score, matchingTerms })
    }

    ranked.sort((a, b) => b.score - a.score)

    // Map stem -> token
    const stemToToken = new Map<string, string>()
    for (let i = 0; i < stems.length; i++) {
      stemToToken.set(stems[i], tokens[i])
    }

    // Build results grouped by original token, preserving API shape
    const results = new Map<string, SearchResult>()
    for (const token of tokens) {
      results.set(token, { word: token, matches: [] })
    }

    for (const { key, matchingTerms, score } of ranked) {
      const doc = this.docs.get(key)
      if (!doc) continue

      const matchObj = {
        bibleId: doc.bibleId,
        bibleName: doc.bibleName,
        bookName: doc.bookName,
        testamentId: doc.testamentId,
        bookId: doc.bookId,
        chapterId: doc.chapterId,
        verseId: doc.verseId,
        text: doc.text,
        score,
        matchingTerms: Array.from(matchingTerms),
      }

      // Add to each result group that has matching stems
      const seen = new Set<SearchResult>()
      for (const stem of matchingTerms) {
        const token = stemToToken.get(stem)
        if (token) {
          const r = results.get(token)
          if (r && !seen.has(r)) {
            r.matches.push(matchObj)
            seen.add(r)
          }
        }
      }
    }

    return Array.from(results.values())
  }

  searchSimple(query: string): boolean {
    const tokens = tokenize(query)
    for (const token of tokens) {
      if (shouldIgnoreWord(token)) continue
      const stem = simpleStem(token)
      if (this.index.has(stem)) return true
    }
    return false
  }

  removeBible(bibleId: string): void {
    const docKeys = this.bibleDocKeys.get(bibleId)
    if (docKeys) {
      for (const key of docKeys) {
        this.docs.delete(key)
        const stems = this.docToStems.get(key)
        if (stems) {
          for (const stem of stems) {
            const set = this.index.get(stem)
            if (set) {
              set.delete(key)
              if (set.size === 0) {
                this.index.delete(stem)
              }
            }
          }
        }
        this.docToStems.delete(key)
        this.docToPositions.delete(key)
      }
      this.bibleDocKeys.delete(bibleId)
    }
    this.versionBibleNames.delete(bibleId)
  }

  getBibleCount(): number {
    return this.versionBibleNames.size
  }

  getDocumentCount(): number {
    return this.docs.size
  }

  getLoadedBibleIds(): string[] {
    return Array.from(this.versionBibleNames.keys())
  }
}
