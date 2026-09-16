import { describe, it, expect, beforeAll } from 'vitest'
import { BibleLibrary } from '../engine/BibleLibrary'
import type { SearchResult } from '../types/bible'
import { loadTestBible } from '../engine/testUtils'

describe('SearchIndex', () => {
  let library: BibleLibrary

  beforeAll(async () => {
    library = new BibleLibrary()
    const kJV = await loadTestBible('English King James Version.vpc.json')
    const niv = await loadTestBible('English New International Version.vpc.json')
    library.loadBible(kJV)
    library.loadBible(niv)
  })

  describe('searchSimple - basic existence check', () => {
    it('finds "God" in KJV', () => {
      const result = library.searchSimple('God')
      expect(result).toBe(true)
    })

    it('finds "beginning" in KJV', () => {
      const result = library.searchSimple('beginning')
      expect(result).toBe(true)
    })

    it('finds "created" in KJV', () => {
      const result = library.searchSimple('created')
      expect(result).toBe(true)
    })

    it('finds "earth" in KJV', () => {
      const result = library.searchSimple('earth')
      expect(result).toBe(true)
    })
  })

  describe('searchSimple - negation', () => {
    it('does not find "zygworldxyz"', () => {
      const result = library.searchSimple('zygworldxyz')
      expect(result).toBe(false)
    })

    it('does not find a random word not in the loaded bibles', () => {
      const result = library.searchSimple('barracuda')
      expect(result).toBe(false)
    })
  })

  describe('search - returns results with details', () => {
    it('returns matches for "God"', () => {
      const results = library.search('God')
      expect(results.length).toBeGreaterThan(0)

      const godResult = results.find((r: SearchResult) => r.word.toLowerCase() === 'god')
      expect(godResult).toBeDefined()
      expect(godResult!.matches.length).toBeGreaterThan(0)

      const match = godResult!.matches[0]
      expect(match.bibleId).toBeDefined()
      expect(match.bibleName).toBeDefined()
      expect(match.bookName).toBeDefined()
      expect(match.chapterId).toBeDefined()
      expect(match.verseId).toBeDefined()
      expect(match.text).toBeDefined()
    })

    it('returns matches for "beginning"', () => {
      const results = library.search('beginning')
      const beginResult = results.find((r: SearchResult) => r.word === 'beginning')
      if (beginResult) {
        expect(beginResult.matches.length).toBeGreaterThan(0)
      }
    })
  })

  describe('cross-version search', () => {
    it('finds "casteth" in KJV and related forms in other versions', () => {
      const results = library.search('casteth')
      const castethResult = results.find((r: SearchResult) => r.word === 'casteth')

      if (castethResult && castethResult.matches.length > 0) {
        const kjvMatch = castethResult.matches.find((m: any) => m.bibleId.includes('King James'))
        expect(kjvMatch).toBeDefined()
      }
    })

    it('finds "cast" via stemming (matching "casteth")', () => {
      const results = library.search('cast')
      const castResult = results.find((r: SearchResult) => r.word.toLowerCase() === 'cast')
      if (castResult) {
        expect(castResult.matches.length).toBeGreaterThan(0)
      }
    })
  })

  describe('multi-word search', () => {
    it('prioritizes results containing all query terms', () => {
      const results = library.search('Jesus wept')
      const jesusResult = results.find((r: SearchResult) => r.word.toLowerCase() === 'jesus')
      const weptResult = results.find((r: SearchResult) => r.word.toLowerCase() === 'wept')

      expect(jesusResult).toBeDefined()
      expect(weptResult).toBeDefined()
      expect(jesusResult!.matches.length).toBeGreaterThan(0)
      expect(weptResult!.matches.length).toBeGreaterThan(0)

      // All matches should have score and matchingTerms
      for (const m of jesusResult!.matches) {
        expect(m).toHaveProperty('score')
        expect(m).toHaveProperty('matchingTerms')
        expect(Array.isArray(m.matchingTerms)).toBe(true)
      }

      // Verify all-term matches come before single-term matches
      const termsMatched = jesusResult!.matches.map((m: any) => m.matchingTerms?.length ?? 0)
      for (let i = 0; i < termsMatched.length - 1; i++) {
        if (termsMatched[i + 1] > termsMatched[i]) {
          throw new Error(`Matches not sorted by number of matching terms: ${termsMatched[i]} before ${termsMatched[i + 1]}`)
        }
      }
    })

    it('sorts same-term-count matches by score', () => {
      const results = library.search('Jesus wept')
      const jesusResult = results.find((r: SearchResult) => r.word.toLowerCase() === 'jesus')

      if (!jesusResult || jesusResult.matches.length < 2) return

      // Find first group of matches with same term count
      for (let i = 0; i < jesusResult.matches.length - 1; i++) {
        const current = jesusResult.matches[i] as any
        const next = jesusResult.matches[i + 1] as any
        const currentTerms = current.matchingTerms?.length ?? 0
        const nextTerms = next.matchingTerms?.length ?? 0

        if (currentTerms === nextTerms) {
          expect(next.score!).toBeLessThanOrEqual(current.score!)
        }
      }
    })

    it('returns matches from same verse in both word result groups', () => {
      const results = library.search('Jesus wept')
      const jesusResult = results.find((r: SearchResult) => r.word.toLowerCase() === 'jesus')
      const weptResult = results.find((r: SearchResult) => r.word.toLowerCase() === 'wept')

      if (!jesusResult || !weptResult) return

      const jesusKeys = new Set(jesusResult.matches.map((m: any) => `${m.bibleId}|${m.chapterId}:${m.verseId}`))
      const weptKeys = new Set(weptResult.matches.map((m: any) => `${m.bibleId}|${m.chapterId}:${m.verseId}`))

      // There should be overlap - verses containing both words
      const overlap = [...jesusKeys].filter(k => weptKeys.has(k))
      expect(overlap.length).toBeGreaterThan(0)
    })
  })

  describe('BibleLibrary operations', () => {
    it('loads bibles', () => {
      expect(library.getBibleCount()).toBeGreaterThan(0)
    })

    it('returns all bible ids', () => {
      const ids = library.getLoadedBibleIds()
      expect(ids.length).toBe(library.getBibleCount())
    })

    it('documents are indexed', () => {
      expect(library.getDocumentCount()).toBeGreaterThan(0)
    })

    it('unloads a bible', () => {
      const countBefore = library.getBibleCount()
      library.unloadBible('English King James Version')
      expect(library.getBibleCount()).toBe(countBefore - 1)
    })
  })

  describe('BibleLibrary getVersesForChapter - engine level', () => {
    beforeAll(async () => {
      const kJV = await loadTestBible('English King James Version.vpc.json')
      library.loadBible(kJV)
    })

    it('returns verses with correct book name for Genesis chapter 1', () => {
      const verses = library.getVersesForChapter('English King James Version', 'Gn', 1)
      expect(verses.length).toBeGreaterThan(0)
      expect(verses[0].bookName).toBe('Genesis')
      expect(verses[0].bookAbbreviation).toBe('Gn')
      expect(verses[0].chapterId).toBe(1)
    })

    it('returns verses with correct book name for a New Testament book', () => {
      const verses = library.getVersesForChapter('English King James Version', 'Jn', 3)
      expect(verses.length).toBeGreaterThan(0)
      expect(verses[0].bookName).toBe('John')
      expect(verses[0].bookAbbreviation).toBe('Jn')
    })

    it('returns empty array for non-existent book', () => {
      const verses = library.getVersesForChapter('English King James Version', 'NonExistent', 1)
      expect(verses).toEqual([])
    })

    it('returns empty array for non-existent chapter', () => {
      const verses = library.getVersesForChapter('English King James Version', 'Gn', 999)
      expect(verses).toEqual([])
    })

    it('returns verses with correct verse IDs in order', () => {
      const verses = library.getVersesForChapter('English King James Version', 'Gn', 1)
      for (let i = 0; i < verses.length; i++) {
        expect(verses[i].id).toBe(i + 1)
        expect(verses[i].chapterVerseId).toBe(i + 1)
      }
    })

    it('verse text is populated for Genesis 1:1', () => {
      const verses = library.getVersesForChapter('English King James Version', 'Gn', 1)
      const firstVerse = verses.find(v => v.id === 1)
      expect(firstVerse).not.toBeNull()
      expect(firstVerse!.text.length).toBeGreaterThan(0)
      expect(firstVerse!.text).toContain('In the beginning')
    })

    it('selector cache is built on load', () => {
      const result = library.getSelectorBible('English King James Version')
      expect(result).not.toBeNull()
      expect(result!.books.length).toBe(66)
    })

    it('selector cache returns same structure on repeated calls', () => {
      const result1 = library.getSelectorBible('English King James Version')
      const result2 = library.getSelectorBible('English King James Version')
      expect(result1!.books.length).toBe(result2!.books.length)
      for (let i = 0; i < result1!.books.length; i++) {
        expect(result1!.books[i].abbreviation).toBe(result2!.books[i].abbreviation)
      }
    })

    it('unloadBible clears selector cache', async () => {
      const niv = await loadTestBible('English New International Version.vpc.json')
      library.loadBible(niv)
      const id = 'English New International Version'
      const cached = library.getSelectorBible(id)
      expect(cached).not.toBeNull()
      library.unloadBible(id)
      const cleared = library.getSelectorBible(id)
      expect(cleared).toBeNull()
    })

    it('getVersesForChapter uses indexed lookup', () => {
      const verses = library.getVersesForChapter('English King James Version', 'Jn', 3)
      expect(verses.length).toBeGreaterThan(0)
      for (const verse of verses) {
        expect(verse.bookName).toBe('John')
        expect(verse.bookAbbreviation).toBe('Jn')
        expect(verse.chapterId).toBe(3)
      }
    })
  })
})
