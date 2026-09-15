import { describe, it, expect } from 'vitest'
import { bookOrder, bookNameMap, findBookByPattern, parseReference, findBookByName } from '../constants/books'

describe('bookOrder', () => {
  it('maps all 66 books to numeric IDs', () => {
    expect(Object.keys(bookOrder).length).toBe(66)
  })

  it('maps Genesis to 1', () => {
    expect(bookOrder['Gn']).toBe(1)
  })

  it('maps Revelation to 66', () => {
    expect(bookOrder['Re']).toBe(66)
  })

  it('maps Matthew to 40', () => {
    expect(bookOrder['Mt']).toBe(40)
  })

  it('returns undefined for unknown abbreviations', () => {
    expect(bookOrder['Unknown']).toBeUndefined()
  })
})

describe('bookNameMap', () => {
  it('maps all 66 book abbreviations to full names', () => {
    expect(Object.keys(bookNameMap).length).toBe(66)
  })

  it('maps Gn to Genesis', () => {
    expect(bookNameMap['Gn']).toBe('Genesis')
  })

  it('maps Re to Revelation', () => {
    expect(bookNameMap['Re']).toBe('Revelation')
  })

  it('maps Jn to John', () => {
    expect(bookNameMap['Jn']).toBe('John')
  })

  it('maps 1Sa to 1 Samuel', () => {
    expect(bookNameMap['1Sa']).toBe('1 Samuel')
  })

  it('maps 1Jn to 1 John', () => {
    expect(bookNameMap['1Jn']).toBe('1 John')
  })
})

describe('findBookByPattern', () => {
  it('matches full book name', () => {
    expect(findBookByPattern('John')).toBe('Jn')
    expect(findBookByPattern('Genesis')).toBe('Gn')
    expect(findBookByPattern('1 John')).toBe('1Jn')
  })

  it('matches abbreviation', () => {
    expect(findBookByPattern('Jn')).toBe('Jn')
    expect(findBookByPattern('Gn')).toBe('Gn')
  })

  it('matches alternative names', () => {
    expect(findBookByPattern('1st Peter')).toBe('1Pe')
    expect(findBookByPattern('1pet')).toBe('1Pe')
    expect(findBookByPattern('psalm')).toBe('Ps')
    expect(findBookByPattern('proverb')).toBe('Pr')
  })

  it('returns null for invalid input', () => {
    expect(findBookByPattern('')).toBeNull()
    expect(findBookByPattern('xyz')).toBeNull()
    expect(findBookByPattern(null as any)).toBeNull()
  })

  it('is case insensitive', () => {
    expect(findBookByPattern('JOHN')).toBe('Jn')
    expect(findBookByPattern('john')).toBe('Jn')
    expect(findBookByPattern('JoHn')).toBe('Jn')
  })
})

describe('parseReference', () => {
  it('parses standard reference with colon', () => {
    const result = parseReference('john 3:16')
    expect(result).toEqual({ book: 'Jn', chapter: 3, verse: 16 })
  })

  it('parses reference with space separator', () => {
    const result = parseReference('john 3 16')
    expect(result).toEqual({ book: 'Jn', chapter: 3, verse: 16 })
  })

  it('parses reference with dot separator', () => {
    const result = parseReference('john 3.16')
    expect(result).toEqual({ book: 'Jn', chapter: 3, verse: 16 })
  })

  it('parses book names with numbers', () => {
    const result = parseReference('1 john 2:5')
    expect(result).toEqual({ book: '1Jn', chapter: 2, verse: 5 })
  })

  it('parses OT book reference', () => {
    const result = parseReference('genesis 1:1')
    expect(result).toEqual({ book: 'Gn', chapter: 1, verse: 1 })
  })

  it('parses Matthew reference', () => {
    const result = parseReference('matthew 5:3')
    expect(result).toEqual({ book: 'Mt', chapter: 5, verse: 3 })
  })

  it('returns null for invalid references', () => {
    expect(parseReference('')).toBeNull()
    expect(parseReference(null as any)).toBeNull()
    expect(parseReference('xyz 1:1')).toBeNull()
    expect(parseReference('john')).toBeNull()
  })

  it('parses book chapter without verse', () => {
    const result = parseReference('john 3')
    expect(result).toEqual({ book: 'Jn', chapter: 3, verse: 1 })
  })

  it('parses book chapter without verse with dot', () => {
    const result = parseReference('genesis 1')
    expect(result).toEqual({ book: 'Gn', chapter: 1, verse: 1 })
  })

  it('parses Ezekiel with abbreviation "ez"', () => {
    expect(parseReference('ez 3:17')).toEqual({ book: 'Ez', chapter: 3, verse: 17 })
  })

  it('parses Ezekiel with abbreviation "eze"', () => {
    expect(parseReference('eze 3:17')).toEqual({ book: 'Ez', chapter: 3, verse: 17 })
  })

  it('parses Ezekiel with space separator', () => {
    expect(parseReference('eze 3 17')).toEqual({ book: 'Ez', chapter: 3, verse: 17 })
  })

  it('parses Ezekiel with dot separator', () => {
    expect(parseReference('eze 3.17')).toEqual({ book: 'Ez', chapter: 3, verse: 17 })
  })

  it('parses Ezekiel with full name', () => {
    expect(parseReference('ezekiel 3:17')).toEqual({ book: 'Ez', chapter: 3, verse: 17 })
  })
})

describe('findBookByName', () => {
  it('matches full book name', () => {
    expect(findBookByName('john')).toBe('Jn')
    expect(findBookByName('genesis')).toBe('Gn')
    expect(findBookByName('1 john')).toBe('1Jn')
  })

  it('matches abbreviation', () => {
    expect(findBookByName('Jn')).toBe('Jn')
    expect(findBookByName('Gn')).toBe('Gn')
  })

  it('returns null when input contains a number (chapter pattern)', () => {
    expect(findBookByName('john 3')).toBeNull()
    expect(findBookByName('genesis 1:1')).toBeNull()
  })

  it('returns null for non-book words', () => {
    expect(findBookByName('hello')).toBeNull()
    expect(findBookByName('love')).toBeNull()
  })

  it('is case insensitive', () => {
    expect(findBookByName('JOHN')).toBe('Jn')
    expect(findBookByName('John')).toBe('Jn')
  })
})
