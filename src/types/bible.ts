export interface VerseEntry {
  id: number
  text: string
}

export interface ChapterData {
  id: number
  verses: VerseEntry[]
}

export interface BookData {
  id: number
  abbreviation: string
  name: string
  chapters: ChapterData[]
}

export interface TestamentData {
  id: number
  name: string
  books: BookData[]
}

export interface BibleMetadata {
  abbreviation: string
  name: string
  language: string
  publisher?: string
  copyright?: string
  introduction?: string
  versionDate?: string
}

export interface BibleData {
  id: string
  metadata: BibleMetadata
  testaments: TestamentData[]
}

export interface SearchResult {
  word: string
  matches: {
    bibleId: string
    bibleName: string
    bookName: string
    testamentId: number
    bookId: number
    chapterId: number
    verseId: number
    text: string
    score?: number
    matchingTerms?: string[]
  }[]
}

export type VerseKey = {
  bibleId: string
  testamentId: number
  bookId: number
  chapterId: number
  verseId: number
}

export type SearchDocument = {
  bibleId: string
  testamentId: number
  bookId: number
  chapterId: number
  verseId: number
  text: string
  bookName: string
  bibleName: string
}

export interface SelectorBook {
  abbreviation: string
  name: string
  chapters: SelectorChapter[]
  isSelected?: boolean
}

export interface SelectorChapter {
  id: number
  verseCount: number
  isSelected?: boolean
  isHighlighted?: boolean
}

export interface SelectorVerse {
  id: number
  text: string
  bookAbbreviation: string
  bookName: string
  chapterId: number
  chapterVerseId: number
  isSelected?: boolean
  isHighlighted?: boolean
}

export type VerseRange = [number, number]

export interface ChapterRangeSelection {
  book: string
  chapter: number
  ranges: VerseRange[]
}

export interface SelectorState {
  mode: 'select' | 'search'
  selectedBook: string | null
  selectedChapter: number | null
  selectedVerses: Set<string>
  verseRangeSelections: ChapterRangeSelection[]
  chapterRangeSelections: ChapterRangeSelection[]
  highlightedVerse: { book: string; chapter: number; verse: number } | null
  bibleId: string | null
}
