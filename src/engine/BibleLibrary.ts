import type { BibleData, SelectorBook, SelectorChapter, SelectorVerse } from '../types/bible'
import { SearchIndex } from './search'
import { bookOrder } from '../constants/books'

export class BibleLibrary {
  private bibles = new Map<string, BibleData>()
  private index = new SearchIndex()

  loadBible(bible: BibleData): BibleData {
    if (this.bibles.has(bible.id)) {
      return this.bibles.get(bible.id)!
    }
    this.bibles.set(bible.id, bible)
    this.index.indexBible(bible)
    return bible
  }

  unloadBible(bibleId: string): void {
    this.bibles.delete(bibleId)
    this.index.removeBible(bibleId)
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
    const bible = this.bibles.get(id)
    if (!bible) return null

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
    return { bibleId: id, books }
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
    const bible = this.bibles.get(bibleId)
    if (!bible) return []

    const verses: SelectorVerse[] = []
    for (const testament of bible.testaments) {
      for (const b of testament.books) {
        if (b.abbreviation === bookAbbr) {
          const ch = b.chapters.find(c => c.id === chapterId)
          if (ch) {
            for (const v of ch.verses) {
              verses.push({
                id: v.id,
                text: v.text,
                bookAbbreviation: bookAbbr,
                bookName: b.name,
                chapterId,
                chapterVerseId: v.id,
                isSelected: false,
                isHighlighted: false,
              })
            }
          }
        }
      }
    }
    return verses
  }

  getAllBibleNames(): { id: string; name: string }[] {
    const result: { id: string; name: string }[] = []
    for (const [id, bible] of this.bibles) {
      result.push({ id, name: bible.metadata.name })
    }
    return result
  }
}
