import type { BibleData, BookData } from '../types/bible'
import type { SelectorBook, SelectorChapter, SelectorVerse } from '../types/ui'
import { SearchIndex } from './search'
import { bookOrder } from '../constants/books'

export class BibleLibrary {
  private bibles = new Map<string, BibleData>()
  private index = new SearchIndex()
  private selectorCache = new Map<string, { bibleId: string; books: SelectorBook[] }>()
  private verseLookup = new Map<string, { text: string; bookName: string }>()

  loadBible(bible: BibleData): BibleData {
    if (this.bibles.has(bible.id)) {
      return this.bibles.get(bible.id)!
    }
    this.bibles.set(bible.id, bible)
    this.index.indexBible(bible)
    this.buildSelectorCache(bible)
    this.buildVerseIndex(bible)
    return bible
  }

  unloadBible(bibleId: string): void {
    this.bibles.delete(bibleId)
    this.index.removeBible(bibleId)
    this.selectorCache.delete(bibleId)
    this.clearVerseIndexForBible(bibleId)
  }

  getBible(bibleId: string): BibleData | undefined {
    return this.bibles.get(bibleId)
  }

  getAllBibles(): Map<string, BibleData> {
    return this.bibles
  }

  getBibleCount(): number {
    return this.bibles.size
  }

  getLoadedBibleIds(): string[] {
    return this.index.getLoadedBibleIds()
  }

  search(query: string) {
    return this.index.search(query)
  }

  searchSimple(query: string): boolean {
    return this.index.searchSimple(query)
  }

  getDocumentCount(): number {
    return this.index.getDocumentCount()
  }

  getSelectorBible(bibleId?: string): { bibleId: string; books: SelectorBook[] } | null {
    const id = bibleId || this.getLoadedBibleIds()[0]
    if (!id) return null
    const cached = this.selectorCache.get(id)
    if (cached) return cached
    const bible = this.bibles.get(id)
    if (!bible) return null
    this.buildSelectorCache(bible)
    return this.selectorCache.get(id) ?? null
  }

  findBookIndex(books: SelectorBook[], abbr: string): number {
    return books.findIndex(b => b.abbreviation === abbr)
  }

  getChaptersForBook(books: SelectorBook[], bookAbbr: string): SelectorChapter[] | null {
    const book = books.find(b => b.abbreviation === bookAbbr)
    return book?.chapters || null
  }

  findVerseByRef(bibleId: string, bookAbbr: string, chapterId: number, verseId: number, books: SelectorBook[]): SelectorVerse | null {
    const book = books.find(b => b.abbreviation === bookAbbr)
    if (!book) return null

    let verseText = ''
    const bible = this.bibles.get(bibleId)
    if (bible) {
      for (const testament of bible.testaments) {
        for (const b of testament.books) {
          if (b.abbreviation === bookAbbr) {
            const ch = b.chapters.find(c => c.id === chapterId)
            if (ch) {
              const verse = ch.verses.find(v => v.id === verseId)
              if (verse) verseText = verse.text
            }
          }
        }
      }
    }

    return {
      id: verseId,
      text: verseText,
      bookAbbreviation: bookAbbr,
      bookName: book.name,
      chapterId,
      chapterVerseId: verseId,
    }
  }

  getVersesForChapter(bibleId: string, bookAbbr: string, chapterId: number): SelectorVerse[] {
    const verses: SelectorVerse[] = []
    const bible = this.bibles.get(bibleId)
    if (!bible) return verses

    const book = this.findBookInBible(bible, bookAbbr)
    if (!book) return verses

    const chapter = book.chapters.find((c: { id: number }) => c.id === chapterId)
    if (!chapter) return verses

    for (const verse of chapter.verses) {
      verses.push({
        id: verse.id,
        text: verse.text,
        bookAbbreviation: bookAbbr,
        bookName: book.name,
        chapterId,
        chapterVerseId: verse.id,
        isSelected: false,
        isHighlighted: false,
      })
    }
    return verses
  }

  private findBookInBible(bible: BibleData, bookAbbr: string): BookData | null {
    for (const testament of bible.testaments) {
      for (const book of testament.books) {
        if (book.abbreviation === bookAbbr) {
          return book
        }
      }
    }
    return null
  }

  getAllBibleNames(): { id: string; name: string }[] {
    const result: { id: string; name: string }[] = []
    for (const [id, bible] of this.bibles) {
      result.push({ id, name: bible.metadata.name })
    }
    return result
  }

  private buildSelectorCache(bible: BibleData): void {
    const books: SelectorBook[] = []
    for (const testament of bible.testaments) {
      for (const book of testament.books) {
        books.push({
          abbreviation: book.abbreviation,
          name: book.name,
          chapters: book.chapters.map(ch => ({
            id: ch.id,
            verseCount: ch.verses.length,
          })),
        })
      }
    }
    books.sort((a, b) => (bookOrder[a.abbreviation] || 999) - (bookOrder[b.abbreviation] || 999))
    this.selectorCache.set(bible.id, { bibleId: bible.id, books })
  }

  private buildVerseIndex(bible: BibleData): void {
    for (const testament of bible.testaments) {
      for (const book of testament.books) {
        for (const chapter of book.chapters) {
          for (const verse of chapter.verses) {
            const key = `${bible.id}|${book.abbreviation}|${chapter.id}|${verse.id}`
            this.verseLookup.set(key, { text: verse.text, bookName: book.name })
          }
        }
      }
    }
  }

  private clearVerseIndexForBible(bibleId: string): void {
    for (const key of this.verseLookup.keys()) {
      if (key.startsWith(`${bibleId}|`)) {
        this.verseLookup.delete(key)
      }
    }
  }
}
