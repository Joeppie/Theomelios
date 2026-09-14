export function findStringEnd(data: string, pos: number): number {
  let i = pos
  let inEscape = false
  while (i < data.length) {
    if (inEscape) { inEscape = false; i++; continue }
    if (data[i] === '\\') { inEscape = true; i++; continue }
    if (data[i] === '"') return i
    i++
  }
  return i
}

function parseJsonValue(data: string, pos: number): { value: any; pos: number } {
  while (pos < data.length && /\s/.test(data[pos])) pos++
  if (pos >= data.length) return { value: null, pos }
  const char = data[pos]

  if (char === '"') {
    const end = findStringEnd(data, pos + 1)
    try {
      const value = JSON.parse(data.slice(pos, end + 1))
      return { value, pos: end + 1 }
    } catch {
      let s = data.slice(pos + 1, end)
      s = s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"')
      return { value: s, pos: end + 1 }
    }
  }
  if (char === '-' || (char >= '0' && char <= '9')) {
    let numStr = ''
    while (pos < data.length && (data[pos] >= '0' && data[pos] <= '9' || data[pos] === '.' || data[pos] === '-' || data[pos] === 'e' || data[pos] === 'E' || data[pos] === '+')) {
      numStr += data[pos]; pos++
    }
    const num = Number(numStr)
    return { value: isNaN(num) ? numStr : num, pos }
  }
  if (data.startsWith('true', pos)) return { value: true, pos: pos + 4 }
  if (data.startsWith('false', pos)) return { value: false, pos: pos + 5 }
  if (data.startsWith('null', pos)) return { value: null, pos: pos + 4 }
  if (char === '{') return parseJsonObject(data, pos)
  if (char === '[') return parseJsonArray(data, pos)
  return { value: null, pos: pos + 1 }
}

function parseJsonObject(data: string, pos: number): { value: Record<string, any>; pos: number } {
  const obj: Record<string, any> = {}
  pos++
  while (pos < data.length) {
    while (pos < data.length && /\s/.test(data[pos])) pos++
    if (pos >= data.length) break
    if (data[pos] === '}') { pos++; break }
    if (data[pos] === ',') { pos++; continue }

    let key: string
    if (data[pos] === '"') {
      const end = findStringEnd(data, pos + 1)
      try { key = JSON.parse(data.slice(pos, end + 1)) } catch { key = data.slice(pos + 1, end).replace(/\\n/g, '\n') }
      pos = end + 1
    } else {
      let keyEnd = pos
      while (keyEnd < data.length && data[keyEnd] !== ':' && !/\s/.test(data[keyEnd])) keyEnd++
      key = data.slice(pos, keyEnd)
      pos = keyEnd
    }

    while (pos < data.length && data[pos] !== ':') pos++
    pos++
    const result = parseJsonValue(data, pos)
    obj[key] = result.value
    pos = result.pos
  }
  return { value: obj, pos }
}

function parseJsonArray(data: string, pos: number): { value: any[]; pos: number } {
  const arr: any[] = []
  pos++
  while (pos < data.length) {
    while (pos < data.length && /\s/.test(data[pos])) pos++
    if (pos >= data.length) break
    if (data[pos] === ']') { pos++; break }
    if (data[pos] === ',') { pos++; continue }
    const result = parseJsonValue(data, pos)
    arr.push(result.value)
    pos = result.pos
  }
  return { value: arr, pos }
}

export function parseVpcJson(content: string): any {
  const processed = content.replace(/(\r\n|\r)/g, '\\n')
  const result = parseJsonValue(processed, 0)
  return result.value
}
