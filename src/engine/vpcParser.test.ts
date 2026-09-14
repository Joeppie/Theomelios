import { describe, it, expect } from 'vitest'
import { findStringEnd, parseVpcJson } from '../engine/vpcParser'

describe('findStringEnd', () => {
  it('finds end of simple string', () => {
    // Called with pos+1 to skip opening quote
    expect(findStringEnd('"hello"', 1)).toBe(6)
  })

  it('handles escaped characters', () => {
    expect(findStringEnd('"hello\\\"world"', 1)).toBe(13)
  })

  it('handles escaped backslashes', () => {
    expect(findStringEnd('"path\\\\to\\\\file"', 1)).toBe(15)
  })

  it('returns full length for unterminated string', () => {
    expect(findStringEnd('"hello', 1)).toBe(6)
  })
})

describe('parseVpcJson', () => {
  it('parses simple object', () => {
    const result = parseVpcJson('{"key": "value"}')
    expect(result).toEqual({ key: 'value' })
  })

  it('parses nested objects', () => {
    const result = parseVpcJson('{"outer": {"inner": {"deep": true}}}')
    expect(result).toEqual({ outer: { inner: { deep: true } } })
  })

  it('parses arrays', () => {
    const result = parseVpcJson('{"items": [1, 2, 3]}')
    expect(result).toEqual({ items: [1, 2, 3] })
  })

  it('parses mixed types', () => {
    const result = parseVpcJson('{"str": "hello", "num": 42, "bool": true, "nil": null}')
    expect(result).toEqual({ str: 'hello', num: 42, bool: true, nil: null })
  })

  it('handles VPC-style structure', () => {
    const input = '{"Abbreviation": "KJV", "Language": "en", "Testaments": [{"Name": "Old Testament", "Books": []}]}'
    const result = parseVpcJson(input)
    expect(result.Abbreviation).toBe('KJV')
    expect(result.Language).toBe('en')
    expect(result.Testaments).toHaveLength(1)
    expect(result.Testaments[0].Name).toBe('Old Testament')
  })

  it('handles newlines in strings', () => {
    const input = '{"text": "line1\\nline2"}'
    const result = parseVpcJson(input)
    expect(result.text).toBe('line1\nline2')
  })

  it('handles Windows line endings', () => {
    const input = '{"key": "value"}\r\n{"other": "data"}'
    // Should parse the first object
    const result = parseVpcJson(input)
    expect(result.key).toBe('value')
  })

  it('parses empty object', () => {
    const result = parseVpcJson('{}')
    expect(result).toEqual({})
  })

  it('parses object with numbers including negatives and decimals', () => {
    const result = parseVpcJson('{"a": -5, "b": 3.14, "c": 1e10}')
    expect(result).toEqual({ a: -5, b: 3.14, c: 1e10 })
  })

  it('parses array of objects', () => {
    const input = '[{"id": 1}, {"id": 2}]'
    const result = parseVpcJson(input)
    expect(result).toEqual([{ id: 1 }, { id: 2 }])
  })
})
