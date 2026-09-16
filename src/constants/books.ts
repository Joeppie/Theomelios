export const bookOrder: Record<string, number> = {
  'Gn': 1, 'Ex': 2, 'Lv': 3, 'Nu': 4, 'Dt': 5, 'Jos': 6, 'Jdg': 7, 'Ru': 8,
  '1Sa': 9, '2Sa': 10, '1Ki': 11, '2Ki': 12, '1Ch': 13, '2Ch': 14, 'Ezr': 15,
  'Ne': 16, 'Est': 17, 'Job': 18, 'Ps': 19, 'Pr': 20, 'Ec': 21, 'So': 22,
  'Is': 23, 'Je': 24, 'La': 25, 'Ez': 26, 'Dn': 27, 'Ho': 28, 'Jl': 29,
  'Am': 30, 'Ob': 31, 'Jon': 32, 'Mi': 33, 'Na': 34, 'Hab': 35, 'Zp': 36,
  'Hg': 37, 'Zc': 38, 'Mal': 39, 'Mt': 40, 'Mr': 41, 'Lu': 42, 'Jn': 43,
  'Ac': 44, 'Ro': 45, '1Co': 46, '2Co': 47, 'Ga': 48, 'Eph': 49, 'Ph': 50,
  'Col': 51, '1Th': 52, '2Th': 53, '1Ti': 54, '2Ti': 55, 'Ti': 56, 'Phm': 57,
  'He': 58, 'Ja': 59, '1Pe': 60, '2Pe': 61, '1Jn': 62, '2Jn': 63, '3Jn': 64,
  'Ju': 65, 'Re': 66,
}

export const bookNameMap: Record<string, string> = {
  'Gn': 'Genesis', 'Ex': 'Exodus', 'Lv': 'Leviticus', 'Nu': 'Numbers', 'Dt': 'Deuteronomy',
  'Jos': 'Joshua', 'Jdg': 'Judges', 'Ru': 'Ruth', '1Sa': '1 Samuel', '2Sa': '2 Samuel',
  '1Ki': '1 Kings', '2Ki': '2 Kings', '1Ch': '1 Chronicles', '2Ch': '2 Chronicles',
  'Ezr': 'Ezra', 'Ne': 'Nehemiah', 'Est': 'Esther', 'Job': 'Job', 'Ps': 'Psalms',
  'Pr': 'Proverbs', 'Ec': 'Ecclesiastes', 'So': 'Song of Solomon',
  'Is': 'Isaiah', 'Je': 'Jeremiah', 'La': 'Lamentations', 'Ez': 'Ezekiel',
  'Dn': 'Daniel', 'Ho': 'Hosea', 'Jl': 'Joel', 'Am': 'Amos', 'Ob': 'Obadiah',
  'Jon': 'Jonah', 'Mi': 'Micah', 'Na': 'Nahum', 'Hab': 'Habakkuk', 'Zp': 'Zephaniah',
  'Hg': 'Haggai', 'Zc': 'Zechariah', 'Mal': 'Malachi',
  'Mt': 'Matthew', 'Mr': 'Mark', 'Lu': 'Luke', 'Jn': 'John', 'Ac': 'Acts',
  'Ro': 'Romans', '1Co': '1 Corinthians', '2Co': '2 Corinthians',
  'Ga': 'Galatians', 'Eph': 'Ephesians', 'Ph': 'Philippians', 'Col': 'Colossians',
  '1Th': '1 Thessalonians', '2Th': '2 Thessalonians', '1Ti': '1 Timothy',
  '2Ti': '2 Timothy', 'Ti': 'Titus', 'Phm': 'Philemon', 'He': 'Hebrews',
  'Ja': 'James', '1Pe': '1 Peter', '2Pe': '2 Peter', '1Jn': '1 John', '2Jn': '2 John',
  '3Jn': '3 John', 'Ju': 'Jude', 'Re': 'Revelation',
}

export const bookAbbrReverse: Record<string, string> = {}
for (const [abbr, name] of Object.entries(bookNameMap)) {
  bookAbbrReverse[name.toLowerCase()] = abbr
}

export const bookAlternatives: Record<string, string[]> = {
  'Gn': ['genesis', 'gen', 'gene', 'gn'],
  'Ex': ['exodus', 'exo', 'exod'],
  'Lv': ['leviticus', 'lev', 'levid'],
  'Nu': ['numbers', 'num', 'numb', 'nums'],
  'Dt': ['deuteronomy', 'deut', 'deuteron'],
  'Jos': ['joshua', 'jos', 'josh', 'josue'],
  'Jdg': ['judges', 'jdg', 'judge', 'jgdg'],
  'Ru': ['ruth', 'rut'],
  '1Sa': ['1 samuel', '1 sa', '1sam', '1samuel', '1sm', '1sam'],
  '2Sa': ['2 samuel', '2 sa', '2sam', '2samuel', '2sm', '2sam'],
  '1Ki': ['1 kings', '1 ki', '1kings', '1kng', '1kn'],
  '2Ki': ['2 kings', '2 ki', '2kings', '2kng', '2kn'],
  '1Ch': ['1 chronicles', '1 ch', '1ch', '1chron', '1chr', '1chronicles'],
  '2Ch': ['2 chronicles', '2 ch', '2ch', '2chron', '2chr', '2chronicles'],
  'Ezr': ['ezra', 'ez', 'ezras'],
  'Ne': ['nehemiah', 'ne', 'neh', 'nehem'],
  'Est': ['esther', 'es', 'est', 'esthera'],
  'Job': ['job', 'j'],
  'Ps': ['psalms', 'ps', 'psm', 'psalm'],
  'Pr': ['proverbs', 'pr', 'prov', 'prv'],
  'Ec': ['ecclesiastes', 'ec', 'ecc', 'co', 'cohe'],
  'So': ['song of solomon', 'song of songs', 'song', 'sst', 'songofsongs', 'songofsolomon'],
  'Is': ['isaiah', 'is', 'isa', 'esai'],
  'Je': ['jeremiah', 'je', 'jer', 'jerom'],
  'La': ['lamentations', 'la', 'lam', 'thren'],
  'Ez': ['ezekiel', 'ez', 'eze', 'ezeki'],
  'Dn': ['daniel', 'dn', 'dan', 'dani'],
  'Ho': ['hosea', 'ho', 'hos'],
  'Jl': ['joel', 'jo', 'joe'],
  'Am': ['amos', 'am'],
  'Ob': ['obadiah', 'ob', 'obad'],
  'Jon': ['jonah', 'jnh', 'jona'],
  'Mi': ['micah', 'mc'],
  'Na': ['nahum', 'na', 'nam'],
  'Hab': ['habakkuk', 'hab', 'haba'],
  'Zp': ['zephaniah', 'zp', 'zep', 'cfnyah'],
  'Hg': ['haggai', 'hg', 'hag', 'chg'],
  'Zc': ['zechariah', 'zc', 'zeh', 'zach'],
  'Mal': ['malachi', 'ml'],
  'Mt': ['matthew', 'mt', 'matt'],
  'Mr': ['mark', 'mr', 'mk', 'mrc'],
  'Lu': ['luke', 'lu', 'lk', 'luk'],
  'Jn': ['john', 'jn', 'joh'],
  'Ac': ['acts', 'act'],
  'Ro': ['romans', 'ro', 'rom', 'romn'],
  '1Co': ['1 corinthians', '1 co', '1cor', '1corinthians', '1cr', '1cor'],
  '2Co': ['2 corinthians', '2 co', '2cor', '2corinthians', '2cr', '2cor'],
  'Ga': ['galatians', 'ga', 'gal'],
  'Eph': ['ephesians', 'eph', 'ephes'],
  'Ph': ['philippians', 'php', 'phil'],
  'Col': ['colossians', 'col', 'coloss'],
  '1Th': ['1 thessalonians', '1 th', '1th', '1thess', '1thessalonians'],
  '2Th': ['2 thessalonians', '2 th', '2th', '2thess', '2thessalonians'],
  '1Ti': ['1 timothy', '1 ti', '1ti', '1tim', '1timothy'],
  '2Ti': ['2 timothy', '2 ti', '2ti', '2tim', '2timothy'],
  'Ti': ['titus', 'tt'],
  'Phm': ['philemon', 'phm', 'phile'],
  'He': ['hebrews', 'heb', 'hebr', 'hbrw'],
  'Ja': ['james', 'jamesa', 'jam', 'jas'],
  '1Pe': ['1 peter', '1 pe', '1pe', '1pet', '1peter', '1pt'],
  '2Pe': ['2 peter', '2 pe', '2pe', '2pet', '2peter', '2pt'],
  '1Jn': ['1 john', '1 jn', '1jn', '1john', '1j'],
  '2Jn': ['2 john', '2 jn', '2jn', '2john', '2j'],
  '3Jn': ['3 john', '3 jn', '3jn', '3john', '3j'],
  'Ju': ['jude', 'jud', 'judasa', 'jdh'],
  'Re': ['revelation', 're', 'rev', 'revl', 'appl', 'apocalypse'],
}

export const alternateBookAbbreviations: Record<string, string> = {
  // Ezekiel variants
  'Eze': 'Ez', 'Ezek': 'Ez', 'Ezekiel': 'Ez',
  // 1 & 2 Chronicles variants
  '1Chr': '1Ch', '2Chr': '2Ch', '1Chronicles': '1Ch', '2Chronicles': '2Ch',
  // 1 & 2 Samuel variants (all forms)
  '1Sm': '1Sa', '2Sm': '2Sa', '1S': '1Sa', '2S': '2Sa', '1Sa': '1Sa', '2Sa': '2Sa',
  // 1 & 2 Kings variants (all forms)
  '1Kg': '1Ki', '2Kg': '2Ki', '1K': '1Ki', '2K': '2Ki', '1Ki': '1Ki', '2Ki': '2Ki',
  // Old Testament extra variants
  'Gen': 'Gn', 'Genesis': 'Gn',
  'Exod': 'Ex', 'Exodus': 'Ex',
  'Lev': 'Lv', 'Leviticus': 'Lv',
  'Num': 'Nu', 'Nm': 'Nu', 'Nb': 'Nu', 'Numbers': 'Nu',
  'Deut': 'Dt', 'Dtn': 'Dt', 'Deuteronomy': 'Dt',
  'Josh': 'Jos', 'Jsh': 'Jos', 'Joshua': 'Jos',
  'Jdgs': 'Jdg', 'Judges': 'Jdg', 'Jg': 'Jdg',
  'Rth': 'Ru', 'Rt': 'Ru', 'Ruth': 'Ru',
  'Psm': 'Ps', 'Psalms': 'Ps',
  'Prv': 'Pr', 'Prov': 'Pr', 'Proverbs': 'Pr',
  'Eccl': 'Ec', 'Eccles': 'Ec', 'Ecclesiastes': 'Ec',
  'Isa': 'Is', 'Isaiah': 'Is',
  'Jer': 'Je', 'Jeremiah': 'Je', 'Jr': 'Je',
  'La': 'La', 'Lam': 'La', 'Lamentations': 'La',
  'Dan': 'Dn', 'Daniel': 'Dn', 'Dani': 'Dn',
  'Hos': 'Ho', 'Hosea': 'Ho',
  'Joe': 'Jl', 'Joel': 'Jl',
  'Am': 'Am', 'Amos': 'Am',
  'Oba': 'Ob', 'Obadiah': 'Ob',
  'Jonah': 'Jon', 'Nah': 'Na', 'Nahum': 'Na',
  'Hab': 'Hab', 'Habakkuk': 'Hab',
  'Zeph': 'Zp', 'Zephaniah': 'Zp',
  'Zech': 'Zc', 'Zechariah': 'Zc',
  'Mal': 'Mal', 'Ml': 'Mal', 'Malachi': 'Mal',
  'Est': 'Est', 'Es': 'Est', 'Esther': 'Est',
  'Job': 'Job', 'Jb': 'Job',
  'Mi': 'Mi', 'Mic': 'Mi', 'Micah': 'Mi',
  // New Testament extra variants
  'Matt': 'Mt', 'Matthew': 'Mt',
  'Mk': 'Mr', 'Mc': 'Mr', 'Mark': 'Mr',
  'Lk': 'Lu', 'Luk': 'Lu', 'Luke': 'Lu',
  'Acts': 'Ac',
  'Rom': 'Ro', 'Romans': 'Ro', 'Rm': 'Ro',
  '1Cor': '1Co', '1Co': '1Co',
  '2Cor': '2Co', '2Co': '2Co',
  'Ga': 'Ga', 'Gal': 'Ga', 'Galatians': 'Ga',
  'Eph': 'Eph', 'Ephesians': 'Eph',
  'Php': 'Ph', 'Phil': 'Ph', 'Ph': 'Ph', 'Philippians': 'Ph',
  'Col': 'Col', 'Colossians': 'Col',
  '1Thes': '1Th', '2Thes': '2Th',
  '1Tim': '1Ti', '2Tim': '2Ti', '1Timothy': '1Ti', '2Timothy': '2Ti',
  'Ti': 'Ti', 'Tit': 'Ti', 'Titus': 'Ti',
  'Phm': 'Phm', 'Philem': 'Phm', 'Philemon': 'Phm',
  'Heb': 'He', 'Hebrews': 'He',
  'Ja': 'Ja', 'James': 'Ja', 'Jas': 'Ja', 'Jm': 'Ja',
  '1Pet': '1Pe', '2Pet': '2Pe',
  '1Pt': '1Pe', '2Pt': '2Pe',
  '1Joh': '1Jn', '2Joh': '2Jn', '3Joh': '3Jn',
  'Jude': 'Ju', 'Jud': 'Ju',
  'Rev': 'Re', 'Revelation': 'Re',
  'Apocalypse': 'Re',
}

export const bookNameToAbbr: Record<string, string> = {}
for (const [abbr, name] of Object.entries(bookNameMap)) {
  bookNameToAbbr[name] = abbr
}

export type BookCategory = {
  id: string
  name: string
  color: string
  books: string[]
}

export const bookCategories: BookCategory[] = [
  {
    id: 'pentateuch',
    name: 'Pentateuch',
    color: '#e74c3c',
    books: ['Gn', 'Ex', 'Lv', 'Nu', 'Dt'],
  },
  {
    id: 'historical_ot',
    name: 'Historical Books',
    color: '#e67e22',
    books: ['Jos', 'Jdg', 'Ru', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch', 'Ezr', 'Ne', 'Est'],
  },
  {
    id: 'poetry_wisdom',
    name: 'Poetry & Wisdom',
    color: '#9b59b6',
    books: ['Job', 'Ps', 'Pr', 'Ec', 'So'],
  },
  {
    id: 'major_prophets',
    name: 'Major Prophets',
    color: '#3498db',
    books: ['Is', 'Je', 'La', 'Ez', 'Dn'],
  },
  {
    id: 'minor_prophets',
    name: 'Minor Prophets',
    color: '#2ecc71',
    books: ['Ho', 'Jl', 'Am', 'Ob', 'Jon', 'Mi', 'Na', 'Hab', 'Zp', 'Hg', 'Zc', 'Mal'],
  },
  {
    id: 'gospels',
    name: 'Gospels',
    color: '#1abc9c',
    books: ['Mt', 'Mr', 'Lu', 'Jn'],
  },
  {
    id: 'church',
    name: 'Church',
    color: '#f39c12',
    books: ['Ac'],
  },
  {
    id: 'pauline_epistles',
    name: 'Pauline Epistles',
    color: '#e74c3c',
    books: ['Ro', '1Co', '2Co', 'Ga', 'Eph', 'Ph', 'Col', '1Th', '2Th', '1Ti', '2Ti', 'Ti', 'Phm'],
  },
  {
    id: 'general_epistles',
    name: 'General Epistles',
    color: '#9b59b6',
    books: ['He', 'Ja', '1Pe', '2Pe', '1Jn', '2Jn', '3Jn', 'Ju'],
  },
  {
    id: 'prophecy',
    name: 'Prophecy',
    color: '#2ecc71',
    books: ['Re'],
  },
]

export const bookCategoryMap: Record<string, BookCategory> = {}
for (const cat of bookCategories) {
  for (const abbr of cat.books) {
    bookCategoryMap[abbr] = cat
  }
}

export function findBookByPattern(input: string): string | null {
  if (!input || !input.trim()) return null

  const cleaned = input.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '')
  const parts = cleaned.split(/\s+/)

  const candidates = new Map<string, number>()

  function normalizePrefix(token: string): string {
    return token.replace(/^1st\b/i, '1').replace(/^2nd\b/i, '2').replace(/^3rd\b/i, '3')
  }

  function tryMatch(token: string): void {
    if (!token) return

    const t = normalizePrefix(token.toLowerCase())

    for (const [abbr, alts] of Object.entries(bookAlternatives)) {
      for (const alt of alts) {
        if (alt === t) {
          candidates.set(abbr, (candidates.get(abbr) || 0) + 3)
        } else if (alt.startsWith(t) && t.length >= 2) {
          candidates.set(abbr, (candidates.get(abbr) || 0) + 1)
        }
      }
    }
  }

  if (parts.length === 1) {
    tryMatch(parts[0])
  }

  if (parts.length >= 2) {
    for (let i = 0; i < parts.length - 1; i++) {
      const combined = normalizePrefix(parts.slice(i, i + 2).join(' '))
      tryMatch(combined)
    }
  }

  for (let i = 0; i < parts.length; i++) {
    tryMatch(normalizePrefix(parts[i]))
  }

  if (candidates.size === 0) return null
  const sorted = Array.from(candidates.entries()).sort((a, b) => b[1] - a[1])
  return sorted[0][0]
}

export function parseReference(input: string): { book: string; chapter: number; verse: number } | null {
  if (!input || !input.trim()) return null

  // Pattern: <book> <chapter>:<verse> / <book> <chapter> <verse> / <book> <chapter>.<verse>
  const refPattern = /^(.+?)\s+(\d+)[:\s.](\d+)\s*$/
  const refMatch = input.trim().match(refPattern)

  if (refMatch) {
    const bookPattern = refMatch[1]
    const chapter = parseInt(refMatch[2], 10)
    const verse = parseInt(refMatch[3], 10)
    const book = findBookByPattern(bookPattern)
    if (book) {
      return { book, chapter, verse }
    }
  }

  // Pattern: <book> <chapter> (no verse)
  const chapterOnlyPattern = /^(.+?)\s+(\d+)\s*$/
  const chapterOnlyMatch = input.trim().match(chapterOnlyPattern)

  if (chapterOnlyMatch) {
    const bookPattern = chapterOnlyMatch[1]
    const chapter = parseInt(chapterOnlyMatch[2], 10)
    const book = findBookByPattern(bookPattern)
    if (book) {
      return { book, chapter, verse: 1 }
    }
  }

  return null
}

export function findBookByName(input: string): string | null {
  if (!input || !input.trim()) return null

  const cleaned = input.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '')
  const parts = cleaned.split(/\s+/)
  
  // Don't treat "word number" as just a book name — it could be chapter pattern
  if (parts.length >= 2 && /\d/.test(parts[parts.length - 1])) {
    return null
  }

  const book = findBookByPattern(input)
  if (book) {
    // Verify it's an exact match, not a partial/prefix match
    for (const alts of Object.values(bookAlternatives)) {
      for (const alt of alts) {
        if (alt === cleaned) {
          return book
        }
        // For multi-word books like "1 john", verify the exact combined form matches
        if (parts.length >= 2) {
          const combined = parts.join(' ')
          if (alt === combined) {
            return book
          }
        }
      }
    }
  }

  return null
}
