import { describe, it, expect } from 'vitest'
import { bookOrder, bookNameMap } from '../constants/books'

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
