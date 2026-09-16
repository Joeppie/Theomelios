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
