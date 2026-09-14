import { describe, it, expect } from 'vitest'
import { convertVpcToUniform, normalizeBookAbbreviation, buildTestaments, createMetadata } from '../engine/bibleConverter'

describe('normalizeBookAbbreviation', () => {
  it('returns abbreviation if it exists in the book map', () => {
    expect(normalizeBookAbbreviation('Gn')).toBe('Gn')
    expect(normalizeBookAbbreviation('Mt')).toBe('Mt')
    expect(normalizeBookAbbreviation('Jn')).toBe('Jn')
  })

  it('cleans non-alphanumeric characters from abbreviation', () => {
    expect(normalizeBookAbbreviation('Gn.')).toBe('Gn')
    expect(normalizeBookAbbreviation('  Mt  ')).toBe('Mt')
  })

  it('returns original if not found in book map', () => {
    expect(normalizeBookAbbreviation('Unknown')).toBe('Unknown')
  })
})

describe('createMetadata', () => {
  it('creates metadata with all fields', () => {
    const raw = { Language: 'en', Publisher: 'Test Pub', Copyright: 'Public Domain' }
    const meta = createMetadata('KJV', 'King James Version', raw)
    expect(meta).toEqual({
      abbreviation: 'KJV',
      name: 'King James Version',
      language: 'en',
      publisher: 'Test Pub',
      copyright: 'Public Domain',
      introduction: undefined,
      versionDate: undefined,
    })
  })

  it('uses default language when not provided', () => {
    const meta = createMetadata('KJV', 'King James Version', {})
    expect(meta.language).toBe('en')
  })

  it('uses provided name over default', () => {
    const meta = createMetadata('KJV', 'Custom Name', {})
    expect(meta.name).toBe('Custom Name')
  })
})

describe('buildTestaments', () => {
  it('builds old and new testament structure', () => {
    const raw = {
      Testaments: [
        { Text: 'Old Testament', Books: [
          { Abbreviation: 'Gn', Text: 'Genesis', ID: 1, Chapters: [
            { ID: 1, Verses: [
              { ID: 1, Text: 'In the beginning...' },
              { ID: 2, Text: 'And God...' },
            ]},
          ]},
        ]},
        { Text: 'New Testament', Books: [
          { Abbreviation: 'Mt', Text: 'Matthew', ID: 40, Chapters: [
            { ID: 1, Verses: [
              { ID: 1, Text: 'The book of the generation of Jesus Christ...' },
            ]},
          ]},
        ]},
      ],
    }
    const testaments = buildTestaments(raw as any)
    expect(testaments).toHaveLength(2)
    expect(testaments[0].id).toBe(1)
    expect(testaments[0].name).toBe('Old Testament')
    expect(testaments[0].books).toHaveLength(1)
    expect(testaments[0].books[0].abbreviation).toBe('Gn')
    expect(testaments[0].books[0].name).toBe('Genesis')
    expect(testaments[0].books[0].chapters).toHaveLength(1)
    expect(testaments[0].books[0].chapters[0].verses).toHaveLength(2)
  })

  it('handles empty testaments', () => {
    const result = buildTestaments({ Testaments: [] } as any)
    expect(result).toEqual([])
  })

  it('handles undefined testaments', () => {
    const result = buildTestaments({} as any)
    expect(result).toEqual([])
  })

  it('auto-generates testament names', () => {
    const raw = {
      Testaments: [
        { Books: [] },
        { Books: [] },
      ],
    }
    const result = buildTestaments(raw as any)
    expect(result[0].name).toBe('Old Testament')
    expect(result[1].name).toBe('New Testament')
  })

  it('respects book IDs from source', () => {
    const raw = {
      Testaments: [{
        Books: [
          { Abbreviation: 'Gn', ID: 99, Chapters: [] },
        ],
      }],
    }
    const result = buildTestaments(raw as any)
    expect(result[0].books[0].id).toBe(99)
  })

  it('auto-generates verse IDs when not present', () => {
    const raw = {
      Testaments: [{
        Books: [{
          Abbreviation: 'Gn',
          Chapters: [{
            Verses: [
              { Text: 'Verse 1' },
              { Text: 'Verse 2' },
            ],
          }],
        }],
      }],
    }
    const result = buildTestaments(raw as any)
    expect(result[0].books[0].chapters[0].verses[0].id).toBe(1)
    expect(result[0].books[0].chapters[0].verses[1].id).toBe(2)
  })
})

describe('convertVpcToUniform', () => {
  it('converts a full VPC JSON to BibleData', () => {
    const raw = {
      Abbreviation: 'KJV',
      Text: 'English King James Version',
      Language: 'en',
      Testaments: [
        {
          Text: 'Old Testament',
          Books: [
            {
              Abbreviation: 'Gn',
              Text: 'Genesis',
              ID: 1,
              Chapters: [
                { ID: 1, Verses: [{ ID: 1, Text: 'In the beginning God created the heaven and the earth.' }] },
              ],
            },
          ],
        },
      ],
    }
    const bible = convertVpcToUniform(raw as any, 'KJV')
    expect(bible.id).toBe('KJV')
    expect(bible.metadata.abbreviation).toBe('KJV')
    expect(bible.metadata.name).toBe('English King James Version')
    expect(bible.metadata.language).toBe('en')
    expect(bible.testaments).toHaveLength(1)
    expect(bible.testaments[0].name).toBe('Old Testament')
    expect(bible.testaments[0].books).toHaveLength(1)
    expect(bible.testaments[0].books[0].name).toBe('Genesis')
    expect(bible.testaments[0].books[0].chapters).toHaveLength(1)
    expect(bible.testaments[0].books[0].chapters[0].verses).toHaveLength(1)
    expect(bible.testaments[0].books[0].chapters[0].verses[0].text).toBe('In the beginning God created the heaven and the earth.')
  })

  it('handles minimal VPC JSON', () => {
    const raw = { Abbreviation: 'TEST' }
    const bible = convertVpcToUniform(raw as any, 'TEST')
    expect(bible.id).toBe('TEST')
    expect(bible.testaments).toHaveLength(0)
    expect(bible.metadata.abbreviation).toBe('TEST')
  })

  it('handles missing Text field for name', () => {
    const raw = { Abbreviation: 'KJV' }
    const bible = convertVpcToUniform(raw as any, 'KJV')
    expect(bible.metadata.name).toBe('KJV')
  })
})
