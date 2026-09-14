import { BibleData, BibleMetadata, BookData, ChapterData, TestamentData, VerseEntry } from '../types/bible'
import { bookNameMap } from '../constants/books'

export function normalizeBookAbbreviation(abbr: string): string {
  if (bookNameMap[abbr]) return abbr
  const cleaned = abbr.replace(/[^a-zA-Z0-9]/g, '')
  if (bookNameMap[cleaned]) return cleaned
  return abbr
}

export function createMetadata(
  abbr: string | undefined,
  filePathOrName: string,
  raw: Record<string, unknown>,
): BibleMetadata {
  return {
    abbreviation: abbr || filePathOrName,
    name: filePathOrName,
    language: (raw.Language as string) || 'en',
    publisher: (raw.Publisher as string) || undefined,
    copyright: (raw.Copyright as string) || undefined,
    introduction: (raw.Introduction as string) || undefined,
    versionDate: (raw.VersionDate as string) || undefined,
  }
}

export function buildBibleData(
  bibleId: string,
  metadata: BibleMetadata,
  testaments: TestamentData[],
): BibleData {
  return {
    id: bibleId,
    metadata,
    testaments,
  }
}

interface VpcTestament {
  Abbreviation?: string
  Text?: string
  Name?: string
  ID?: number
  Books?: VpcBook[]
}

interface VpcBook {
  Abbreviation?: string
  Text?: string
  ID?: number
  Chapters?: VpcChapter[]
}

interface VpcChapter {
  ID?: number
  Verses?: { Text: string; ID?: number }[]
}

function asArray<T>(arr: T[] | undefined): T[] {
  return arr || []
}

export function buildTestaments(raw: { Testaments?: VpcTestament[] }): TestamentData[] {
  const testaments: TestamentData[] = []
  for (const testamentRaw of asArray(raw.Testaments)) {
    const testamentId = testaments.length + 1

    const books: BookData[] = []
    const usedIds = new Set<number>()
    for (const bookRaw of asArray(testamentRaw.Books)) {
      const bookAbbr = normalizeBookAbbreviation(bookRaw.Abbreviation || '')
      const bookName = bookNameMap[bookAbbr] || bookAbbr
      let bookId = bookRaw.ID || (books.length + 1)
      while (usedIds.has(bookId)) {
        bookId++
      }
      usedIds.add(bookId)

      const chapters: ChapterData[] = []
      for (const chapterRaw of asArray(bookRaw.Chapters)) {
        const chapterId = chapterRaw.ID || (chapters.length + 1)

        const verses: VerseEntry[] = []
        for (const rawVerse of asArray(chapterRaw.Verses)) {
          verses.push({
            id: rawVerse.ID || (verses.length + 1),
            text: rawVerse.Text || '',
          })
        }
        chapters.push({
          id: chapterId,
          verses,
        })
      }

      books.push({
        id: bookId,
        abbreviation: bookAbbr,
        name: bookName,
        chapters,
      })
    }

    testaments.push({
      id: testamentId,
      name: testamentRaw.Text || (testaments.length === 0 ? 'Old Testament' : 'New Testament'),
      books,
    })
  }
  return testaments
}

export function convertVpcToUniform(raw: Record<string, unknown>, bibleId: string): BibleData {
  const bibleName = (raw.Text as string) || bibleId
  const metadata = createMetadata(
    raw.Abbreviation as string | undefined,
    bibleName,
    raw,
  )
  const testaments = buildTestaments(raw)
  return buildBibleData(bibleId, metadata, testaments)
}

export function buildBibleDataFromRaw(
  raw: Record<string, unknown>,
  bibleId: string,
): BibleData {
  const bibleName = bibleId
  const metadata = createMetadata(
    raw.Abbreviation as string | undefined,
    bibleName,
    raw,
  )
  const testaments = buildTestaments(raw)
  return buildBibleData(bibleId, metadata, testaments)
}
