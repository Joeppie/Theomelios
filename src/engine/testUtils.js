import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
const bookOrder = {
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
};
function findStringEnd(data, pos) {
    let i = pos;
    let inEscape = false;
    while (i < data.length) {
        if (inEscape) {
            inEscape = false;
            i++;
            continue;
        }
        if (data[i] === '\\') {
            inEscape = true;
            i++;
            continue;
        }
        if (data[i] === '"')
            return i;
        i++;
    }
    return i;
}
function parseJsonValue(data, pos) {
    while (pos < data.length && /\s/.test(data[pos]))
        pos++;
    if (pos >= data.length)
        return { value: null, pos };
    const char = data[pos];
    if (char === '"') {
        const end = findStringEnd(data, pos + 1);
        try {
            const value = JSON.parse(data.slice(pos, end + 1));
            return { value, pos: end + 1 };
        }
        catch {
            let s = data.slice(pos + 1, end);
            s = s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
            return { value: s, pos: end + 1 };
        }
    }
    if (char === '-' || (char >= '0' && char <= '9')) {
        let numStr = '';
        while (pos < data.length && (data[pos] >= '0' && data[pos] <= '9' || data[pos] === '.' || data[pos] === '-' || data[pos] === 'e' || data[pos] === 'E' || data[pos] === '+')) {
            numStr += data[pos];
            pos++;
        }
        const num = Number(numStr);
        return { value: isNaN(num) ? numStr : num, pos };
    }
    if (data.startsWith('true', pos))
        return { value: true, pos: pos + 4 };
    if (data.startsWith('false', pos))
        return { value: false, pos: pos + 5 };
    if (data.startsWith('null', pos))
        return { value: null, pos: pos + 4 };
    if (char === '{')
        return parseJsonObject(data, pos);
    if (char === '[')
        return parseJsonArray(data, pos);
    return { value: null, pos: pos + 1 };
}
function parseJsonObject(data, pos) {
    const obj = {};
    pos++;
    while (pos < data.length) {
        while (pos < data.length && /\s/.test(data[pos]))
            pos++;
        if (pos >= data.length)
            break;
        if (data[pos] === '}') {
            pos++;
            break;
        }
        if (data[pos] === ',') {
            pos++;
            continue;
        }
        let key;
        if (data[pos] === '"') {
            const end = findStringEnd(data, pos + 1);
            try {
                key = JSON.parse(data.slice(pos, end + 1));
            }
            catch {
                key = data.slice(pos + 1, end).replace(/\\n/g, '\n');
            }
            pos = end + 1;
        }
        else {
            let keyEnd = pos;
            while (keyEnd < data.length && data[keyEnd] !== ':' && !/\s/.test(data[keyEnd]))
                keyEnd++;
            key = data.slice(pos, keyEnd);
            pos = keyEnd;
        }
        while (pos < data.length && data[pos] !== ':')
            pos++;
        pos++;
        const result = parseJsonValue(data, pos);
        obj[key] = result.value;
        pos = result.pos;
    }
    return { value: obj, pos };
}
function parseJsonArray(data, pos) {
    const arr = [];
    pos++;
    while (pos < data.length) {
        while (pos < data.length && /\s/.test(data[pos]))
            pos++;
        if (pos >= data.length)
            break;
        if (data[pos] === ']') {
            pos++;
            break;
        }
        if (data[pos] === ',') {
            pos++;
            continue;
        }
        const result = parseJsonValue(data, pos);
        arr.push(result.value);
        pos = result.pos;
    }
    return { value: arr, pos };
}
function parseVpcJson(content) {
    const processed = content.replace(/(\r\n|\r)/g, '\\n');
    const result = parseJsonValue(processed, 0);
    return result.value;
}
function convertVpcToUniform(raw) {
    const testaments = [];
    if (raw.Testaments) {
        for (const rawTest of raw.Testaments) {
            const books = [];
            if (rawTest.Books) {
                for (let bIdx = 0; bIdx < rawTest.Books.length; bIdx++) {
                    const rawBook = rawTest.Books[bIdx];
                    const abbr = rawBook.Abbreviation || '';
                    const bookId = bookOrder[abbr] || (bIdx + 1);
                    const chapters = [];
                    if (rawBook.Chapters) {
                        for (let cIdx = 0; cIdx < rawBook.Chapters.length; cIdx++) {
                            const rawCh = rawBook.Chapters[cIdx];
                            const verses = [];
                            if (rawCh.Verses) {
                                for (let vIdx = 0; vIdx < rawCh.Verses.length; vIdx++) {
                                    const rawVerse = rawCh.Verses[vIdx];
                                    verses.push({
                                        id: rawVerse.ID || (vIdx + 1),
                                        text: rawVerse.Text || '',
                                    });
                                }
                            }
                            chapters.push({
                                id: rawCh.ID || (cIdx + 1),
                                verses,
                            });
                        }
                    }
                    books.push({
                        id: bookId,
                        abbreviation: abbr,
                        name: rawBook.Text || abbr,
                        chapters,
                    });
                }
            }
            testaments.push({
                id: testaments.length + 1,
                name: rawTest.Text || (testaments.length === 0 ? 'Old Testament' : 'New Testament'),
                books,
            });
        }
    }
    return {
        id: '',
        metadata: {
            abbreviation: raw.Abbreviation || '',
            name: raw.Text || '',
            language: raw.Language || 'en',
            publisher: raw.Publisher || '',
            copyright: raw.Copyright || '',
            introduction: raw.Introduction || '',
            versionDate: raw.VersionDate || '',
        },
        testaments,
    };
}
const bibleRoot = resolve(__dirname, '../../Bibles');
export async function loadTestBible(filePath) {
    const content = readFileSync(join(bibleRoot, filePath), 'utf-8');
    const raw = parseVpcJson(content);
    const bible = convertVpcToUniform(raw);
    bible.id = filePath.replace('.vpc.json', '');
    return bible;
}
