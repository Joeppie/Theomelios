import { describe, it, expect, beforeAll } from 'vitest'
import { BibleLibrary } from '../engine/BibleLibrary'
import { loadTestBible } from '../engine/testUtils'
import { bookOrder } from '../constants/books'
import type { SelectorBook } from '../types/ui'

describe('KJV integration test', () => {
  let library: BibleLibrary
  let books: SelectorBook[]

  beforeAll(async () => {
    library = new BibleLibrary()
    const bible = await loadTestBible('English King James Version.vpc.json')
    library.loadBible(bible)
    const result = library.getSelectorBible()
    expect(result).not.toBeNull()
    books = result!.books
  })

  it('has all 66 standard books', () => {
    expect(books.length).toBe(66)
  })

  it('has all books from bookOrder', () => {
    const loaded = new Set(books.map(b => b.abbreviation))
    for (const abbr of Object.keys(bookOrder)) {
      expect(loaded.has(abbr)).toBe(true)
    }
  })

  it('has no unknown abbreviations (1Pt/2Pt fixed)', () => {
    const known = new Set(Object.keys(bookOrder))
    const unknown = books.map(b => b.abbreviation).filter(abbr => !known.has(abbr))
    expect(unknown).toEqual([])
  })

  it('places 1 Peter and 2 Peter correctly', () => {
    expect(books.find(b => b.abbreviation === '1Pe')).toBeDefined()
    expect(books.find(b => b.abbreviation === '2Pe')).toBeDefined()
  })

  it('sorts books in canonical order', () => {
    for (let i = 1; i < books.length; i++) {
      const prevIdx = bookOrder[books[i - 1].abbreviation]
      const currIdx = bookOrder[books[i].abbreviation]
      expect(prevIdx).toBeDefined()
      expect(currIdx).toBeDefined()
      expect(prevIdx!).toBeLessThan(currIdx!)
    }
  })

  it('maps every book abbreviation to a full name', () => {
    for (const book of books) {
      expect(book.name).toBeTruthy()
      expect(book.name.length).toBeGreaterThan(0)
    }
  })

  it('all books have chapters', () => {
    for (const book of books) {
      expect(book.chapters.length).toBeGreaterThan(0)
    }
  })
})
