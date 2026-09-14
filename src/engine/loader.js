import fs from 'node:fs';
import path from 'node:path';
const bibleRoot = path.resolve(__dirname, '../../Bibles');
const bookNameMap = {
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
};
function normalizeBookAbbreviation(abbr) {
    if (bookNameMap[abbr])
        return abbr;
    const cleaned = abbr.replace(/[^a-zA-Z0-9]/g, '');
    if (bookNameMap[cleaned])
        return cleaned;
    return abbr;
}
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
        if (data[i] === '"') {
            return i;
        }
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
    if (char === '{') {
        return parseJsonObject(data, pos);
    }
    if (char === '[') {
        return parseJsonArray(data, pos);
    }
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
            while (keyEnd < data.length && data[keyEnd] !== ':' && !/\s/.test(data[keyEnd])) {
                keyEnd++;
            }
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
    let processed = content.replace(/(\r\n|\r)/g, '\\n');
    const result = parseJsonValue(processed, 0);
    return result.value;
}
export async function loadBibleFromFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const json = parseVpcJson(content);
    const id = path.basename(filePath, '.vpc.json');
    const metadata = {
        abbreviation: json.Abbreviation || path.basename(filePath),
        name: path.basename(filePath, '.vpc.json'),
        language: json.Language || 'en',
        publisher: json.Publisher,
        copyright: json.Copyright,
        introduction: json.Introduction,
        versionDate: json.VersionDate,
    };
    const testaments = [];
    if (json.Testaments) {
        for (let tIdx = 0; tIdx < json.Testaments.length; tIdx++) {
            const testamentRaw = json.Testaments[tIdx];
            const testamentId = (tIdx + 1);
            const books = [];
            if (testamentRaw.Books) {
                for (let bIdx = 0; bIdx < testamentRaw.Books.length; bIdx++) {
                    const bookRaw = testamentRaw.Books[bIdx];
                    const bookAbbr = normalizeBookAbbreviation(bookRaw.Abbreviation || '');
                    const bookName = bookNameMap[bookAbbr] || bookAbbr;
                    const chapters = [];
                    if (bookRaw.Chapters) {
                        for (let cIdx = 0; cIdx < bookRaw.Chapters.length; cIdx++) {
                            const chapterRaw = bookRaw.Chapters[cIdx];
                            const verses = [];
                            if (chapterRaw.Verses) {
                                for (const vRaw of chapterRaw.Verses) {
                                    verses.push({
                                        id: vRaw.ID || (verses.length + 1),
                                        text: vRaw.Text || '',
                                    });
                                }
                            }
                            chapters.push({
                                id: chapterRaw.ID || (cIdx + 1),
                                verses,
                            });
                        }
                    }
                    books.push({
                        id: bookRaw.ID || (bIdx + 1),
                        abbreviation: bookAbbr,
                        name: bookName,
                        chapters,
                    });
                }
            }
            testaments.push({
                id: testamentId,
                name: testamentRaw.Name || `Testament ${testamentId}`,
                books,
            });
        }
    }
    return {
        id,
        metadata,
        testaments,
    };
}
export async function getBibleFileList() {
    const entries = await fs.promises.readdir(bibleRoot);
    const files = [];
    for (const entry of entries) {
        if (entry.endsWith('.vpc.json') || entry.endsWith('.json')) {
            files.push(path.join(bibleRoot, entry));
        }
    }
    return files.sort();
}
export async function scanBibleInfo(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const json = parseVpcJson(content);
    return {
        abbreviation: json.Abbreviation || path.basename(filePath),
        name: path.basename(filePath, '.vpc.json'),
        language: json.Language || 'en',
        publisher: json.Publisher,
        copyright: json.Copyright,
        introduction: json.Introduction,
        versionDate: json.VersionDate,
    };
}
export async function scanAllBibles() {
    const files = await getBibleFileList();
    const infos = [];
    for (const file of files) {
        try {
            const info = await scanBibleInfo(file);
            infos.push(info);
        }
        catch {
            // skip unreadable files
        }
    }
    return infos;
}
