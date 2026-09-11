import { promises as fs } from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import type { BibleData, BibleInfo, BookSummary, PassageResult, BibleVerse } from '../../schema/bible';

function resolveBiblesDir(): string {
  return path.join(app.getAppPath(), 'Bibles');
}

const BIBLES_DIR = resolveBiblesDir();

const allBookNames: { [key: string]: string } = {
  Gn: 'Genesis', Gen: 'Genesis',
  Ex: 'Exodus', Exo: 'Exodus',
  Lv: 'Leviticus', Lev: 'Leviticus',
  Nu: 'Numbers', Nb: 'Numbers', Num: 'Numbers',
  Dt: 'Deuteronomy', Deu: 'Deuteronomy',
  Js: 'Joshua', Jos: 'Joshua', Josh: 'Joshua',
  Jg: 'Judges', Jdg: 'Judges',
  Ru: 'Ruth', Rt: 'Ruth',
  '1S': '1 Samuel', '1Sa': '1 Samuel', '1Sam': '1 Samuel',
  '2S': '2 Samuel', '2Sa': '2 Samuel', '2Sam': '2 Samuel',
  '1K': '1 Kings', '1Ki': '1 Kings', '1Kgs': '1 Kings',
  '2K': '2 Kings', '2Ki': '2 Kings', '2Kgs': '2 Kings',
  '1Ch': '1 Chronicles', '1Chr': '1 Chronicles',
  '2Ch': '2 Chronicles', '2Chr': '2 Chronicles',
  Ezr: 'Ezra',
  Ne: 'Nehemiah', Neh: 'Nehemiah',
  Es: 'Esther', Est: 'Esther',
  Job: 'Job', Jb: 'Job',
  Ps: 'Psalms', Psalms: 'Psalms',
  Pr: 'Proverbs', Pro: 'Proverbs',
  Ec: 'Ecclesiastes', Ecc: 'Ecclesiastes',
  Sp: 'Song of Solomon', So: 'Song of Solomon', SOT: 'Song of Solomon', Song: 'Song of Solomon',
  Is: 'Isaiah', Isa: 'Isaiah',
  Jer: 'Jeremiah', Jr: 'Jeremiah',
  Lm: 'Lamentations', Lam: 'Lamentations',
  Ezk: 'Ezekiel', Eze: 'Ezekiel', Ezek: 'Ezekiel',
  Dn: 'Daniel', Dan: 'Daniel',
  Ho: 'Hosea',
  Jl: 'Joel',
  Am: 'Amos',
  Ob: 'Obadiah', Obad: 'Obadiah',
  Jon: 'Jonah',
  Mi: 'Micah',
  Na: 'Nahum',
  Hp: 'Habakkuk', Hab: 'Habakkuk',
  Zp: 'Zephaniah', Zep: 'Zephaniah',
  Hg: 'Haggai',
  Zc: 'Zechariah', Zech: 'Zechariah',
  Ml: 'Malachi',
  Mt: 'Matthew', Matt: 'Matthew',
  Mk: 'Mark', Mr: 'Mark', Mrk: 'Mark',
  Lk: 'Luke', Luk: 'Luke',
  Jn: 'John',
  Ac: 'Acts', Act: 'Acts',
  Rm: 'Romans', Rom: 'Romans',
  '1Co': '1 Corinthians', '1Cor': '1 Corinthians',
  '2Co': '2 Corinthians', '2Cor': '2 Corinthians',
  Gal: 'Galatians', Ga: 'Galatians',
  Ep: 'Ephesians', Eph: 'Ephesians',
  Php: 'Philippians', Phil: 'Philippians',
  Col: 'Colossians',
  '1Th': '1 Thessalonians', '1Thes': '1 Thessalonians',
  '2Th': '2 Thessalonians', '2Thes': '2 Thessalonians',
  '1Ti': '1 Timothy', '1Tim': '1 Timothy',
  '2Ti': '2 Timothy', '2Tim': '2 Timothy',
  Ti: 'Titus', Tit: 'Titus',
  Phm: 'Philemon', Philem: 'Philemon',
  He: 'Hebrews', Heb: 'Hebrews',
  Ja: 'James', Jm: 'James',
  '1Pe': '1 Peter', '1Pt': '1 Peter', '1Pet': '1 Peter',
  '2Pe': '2 Peter', '2Pt': '2 Peter', '2Pet': '2 Peter',
  '1Jn': '1 John',
  '2Jn': '2 John',
  '3Jn': '3 John',
  Ju: 'Jude', Jud: 'Jude',
  Rv: 'Revelation', Re: 'Revelation', Rev: 'Revelation',
};

function cleanJsonContent(raw: string): string {
  let result: string[] = [];
  let i = 0;
  const n = raw.length;
  let inString = false;

  while (i < n) {
    const c = raw[i];

    if (c === '"' && (i === 0 || raw[i - 1] !== '\\')) {
      inString = !inString;
      result.push(c);
      i++;
    } else if (!inString && c.charCodeAt(0) < 32 && c !== '\t') {
      i++;
    } else {
      result.push(c);
      i++;
    }
  }

  return result.join('').replace(/\n/g, ' ').replace(/\r/g, ' ');
}

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

function parseJson(content: string): BibleData {
  const cleaned = cleanJsonContent(content);

  class Parser {
    i = 0;
    n = cleaned.length;

    ws() {
      while (this.i < this.n && ' \t\n\r'.includes(cleaned[this.i])) this.i++;
    }

    value(): unknown {
      this.ws();
      if (this.i >= this.n) return null;
      const c = cleaned[this.i];

      if (c === '"') {
        this.i++;
        let s = '';
        while (this.i < this.n) {
          const ch = cleaned[this.i];
          if (ch === '\\' && this.i + 1 < this.n) {
            s += cleaned.substring(this.i, this.i + 2);
            this.i += 2;
            continue;
          }
          if (ch === '"') { this.i++; return s; }
          s += ch;
          this.i++;
        }
        return s;
      }
      if (c === '{') {
        this.i++;
        const obj: Record<string, unknown> = {};
        this.ws();
        if (cleaned[this.i] === '}') { this.i++; return obj; }
        while (this.i < this.n) {
          this.ws();
          let key = '';
          while (this.i < this.n && cleaned[this.i] !== ':' && cleaned[this.i] !== ',') {
            if (!' \t\n\r'.includes(cleaned[this.i])) key += cleaned[this.i];
            this.i++;
          }
          this.ws();
          if (cleaned[this.i] === ':') this.i++;
          (obj as any)[key] = this.value();
          this.ws();
          if (cleaned[this.i] === ',') { this.i++; continue; }
          if (cleaned[this.i] === '}') { this.i++; break; }
        }
        return obj;
      }
      if (c === '[') {
        this.i++;
        const arr: unknown[] = [];
        this.ws();
        if (cleaned[this.i] === ']') { this.i++; return arr; }
        while (this.i < this.n) {
          arr.push(this.value());
          this.ws();
          if (cleaned[this.i] === ',') { this.i++; continue; }
          if (cleaned[this.i] === ']') { this.i++; break; }
        }
        return arr;
      }
      if (cleaned.substring(this.i, this.i + 4) === 'null') { this.i += 4; return null; }
      if (cleaned.substring(this.i, this.i + 4) === 'true') { this.i += 4; return true; }
      if (cleaned.substring(this.i, this.i + 5) === 'false') { this.i += 5; return false; }
      if (c === '-' || isDigit(c)) {
        let num = '';
        if (cleaned[this.i] === '-') { num += '-'; this.i++; }
        while (this.i < this.n && (isDigit(cleaned[this.i]) || 'eE+.+-'.includes(cleaned[this.i]))) {
          num += cleaned[this.i];
          this.i++;
        }
        return parseFloat(num);
      }
      return null;
    }
  }

  const parser = new Parser();
  return parser.value() as BibleData;
}

async function loadBibleFile(filePath: string): Promise<BibleInfo | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = parseJson(raw);

    if (!data || !data.Testaments) return null;

    const books: BookSummary[] = [];

    for (const testament of data.Testaments) {
      const isNT = testament.Text === 'New Testament';
      for (const book of testament.Books) {
        const abbr = book.Abbreviation;
        const name = allBookNames[abbr] || abbr;
        const chapterCount = book.Chapters?.length || 0;

        books.push({
          abbreviation: abbr,
          name,
          testament: isNT ? 'NT' : 'OT',
          chapterCount,
        });
      }
    }

    books.sort((a, b) => {
      if (a.testament !== b.testament) return a.testament === 'OT' ? -1 : 1;
      const bookOrder = Object.values(allBookNames);
      const nameA = a.name || a.abbreviation;
      const nameB = b.name || b.abbreviation;
      return bookOrder.indexOf(nameA) - bookOrder.indexOf(nameB);
    });

    return {
      abbreviation: data.Abbreviation || 'Unknown',
      name: data.Text || data.Abbreviation || 'Unknown',
      books,
    };
  } catch {
    return null;
  }
}

export async function listTranslations(): Promise<string[]> {
  try {
    const files = await fs.readdir(BIBLES_DIR);
    return files.filter(f => f.endsWith('.vpc.json'));
  } catch {
    return [];
  }
}

export async function getTranslationInfo(translationFile: string): Promise<BibleInfo | null> {
  return loadBibleFile(path.join(BIBLES_DIR, translationFile));
}

export async function getVerses(request: {
  book: string;
  chapter: number;
  verses?: [number, number] | number;
  translationFile: string;
}): Promise<PassageResult | null> {
  try {
    const filePath = path.join(BIBLES_DIR, request.translationFile);
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = parseJson(raw);

    if (!data || !data.Testaments) return null;

    let targetBook: { Abbreviation: string; Chapters: Array<{ Verses: BibleVerse[] }> } | undefined;
    let testament: 'OT' | 'NT' = 'OT';

    for (const testamentData of data.Testaments) {
      if (testamentData.Text === 'New Testament') {
        testament = 'NT';
      }
      const found = testamentData.Books?.find((b: { Abbreviation: string }) => b.Abbreviation === request.book);
      if (found) {
        targetBook = found;
        break;
      }
    }

    if (!targetBook) return null;

    const chapters = targetBook.Chapters;
    if (!chapters || request.chapter < 1 || request.chapter > chapters.length) return null;

    const chapter = chapters[request.chapter - 1];
    if (!chapter?.Verses) return null;

    let verses = chapter.Verses;

    if (request.verses) {
      if (Array.isArray(request.verses)) {
        const [start, end] = request.verses;
        verses = verses.filter(v => {
          const verseNum = v.ID || 0;
          return verseNum >= start && verseNum <= end;
        });
      } else {
        const singleVerse = request.verses;
        verses = verses.filter(v => (v.ID || 0) === singleVerse);
      }
    }

    return {
      book: allBookNames[request.book] || request.book,
      chapter: request.chapter,
      verses: verses.map(v => ({ ID: v.ID, Text: v.Text })),
      translation: data.Abbreviation || '',
      bookAbbreviation: request.book,
      testament,
    };
  } catch {
    return null;
  }
}
