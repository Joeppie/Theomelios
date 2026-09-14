const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'it', 'i', 'me', 'my', 'we', 'our',
    'you', 'your', 'he', 'she', 'they', 'them', 'their', 'this', 'that',
    'these', 'those', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
    'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might',
    'can', 'could', 'not', 'no', 'nor', 'so', 'if', 'then', 'than',
    'too', 'very', 'just', 'about', 'up', 'out', 'as', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'between', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'only',
    'own', 'same', 'also', 'back', 'down', 'over', 'its', 'he', 'her',
    'his', 'him', 'on', 'off', 'any', 'all', 's', 't', 'd', 'm', 're',
    'am', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
    'all', 'every', 'yet', 'still', 'well', 'even', 'make', 'made',
    'like', 'much', 'many', 'got', 'new', 'now', 'here', 'there',
]);
export function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9'-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1);
}
export function simpleStem(word) {
    const w = word.toLowerCase();
    if (w.length <= 3)
        return w;
    let stemmed = w;
    const suffixRules = [
        ['ting', ''], ['ness', ''], ['less', ''], ['ful', ''],
        ['tion', ''], ['sion', ''], ['ment', ''], ['able', ''],
        ['ible', ''], ['ous', ''], ['ive', ''], ['ize', ''],
        ['ise', ''], ['ate', ''], ['ity', ''], ['ing', ''],
        ['est', ''], ['ism', ''], ['ist', ''], ['ies', 'y'],
        ['ses', ''], ['xes', ''], ['zes', ''], ['ches', ''],
        ['shes', ''], ['ths', ''], ['ves', 'v'], ['ces', ''],
    ];
    for (const [suffix, replacement] of suffixRules) {
        if (stemmed.endsWith(suffix) && stemmed.length - suffix.length >= 2) {
            stemmed = stemmed.slice(0, -suffix.length) + replacement;
            break;
        }
    }
    // final simple suffixes (single char or common)
    const simpleSuffixes = ['s', 'es', 'ed', 'ing'];
    if (stemmed.length > 3) {
        for (const suff of simpleSuffixes) {
            if (stemmed.endsWith(suff) && stemmed.length - suff.length >= 3) {
                stemmed = stemmed.slice(0, -suff.length);
                break;
            }
        }
    }
    return stemmed || w;
}
export function shouldIgnoreWord(word) {
    const lower = word.toLowerCase();
    if (STOP_WORDS.has(lower))
        return true;
    if (/^\d+$/.test(lower))
        return true;
    return false;
}
function stemCount(stems, stem) {
    return stems.filter(s => s === stem).length;
}
export class SearchIndex {
    index = new Map();
    docs = new Map();
    versionBibleNames = new Map();
    bibleDocKeys = new Map();
    docToStems = new Map();
    docKey(doc) {
        return `${doc.bibleId}|${doc.testamentId}|${doc.bookId}|${doc.chapterId}|${doc.verseId}`;
    }
    indexDocument(doc) {
        const key = this.docKey(doc);
        this.docs.set(key, doc);
        this.versionBibleNames.set(doc.bibleId, doc.bibleName);
        if (!this.bibleDocKeys.has(doc.bibleId)) {
            this.bibleDocKeys.set(doc.bibleId, new Set());
        }
        this.bibleDocKeys.get(doc.bibleId).add(key);
        const tokens = tokenize(doc.text);
        const stemKeys = [];
        for (const token of tokens) {
            if (shouldIgnoreWord(token))
                continue;
            const stem = simpleStem(token);
            if (!this.index.has(stem)) {
                this.index.set(stem, new Set());
            }
            this.index.get(stem).add(key);
            stemKeys.push(stem);
        }
        this.docToStems.set(key, stemKeys);
    }
    indexBible(bible) {
        for (const testament of bible.testaments) {
            for (const book of testament.books) {
                for (const chapter of book.chapters) {
                    for (const verse of chapter.verses) {
                        const doc = {
                            bibleId: bible.id,
                            bibleName: bible.metadata.name,
                            testamentId: testament.id,
                            bookId: book.id,
                            bookName: book.name,
                            chapterId: chapter.id,
                            verseId: verse.id,
                            text: verse.text,
                        };
                        this.indexDocument(doc);
                    }
                }
            }
        }
    }
    search(query) {
        const tokens = tokenize(query).filter(t => !shouldIgnoreWord(t));
        if (tokens.length === 0)
            return [];
        const stems = tokens.map(t => simpleStem(t));
        const stemMatches = new Map();
        const stemFreq = new Map();
        for (const stem of stems) {
            const matches = this.index.get(stem);
            if (!matches)
                continue;
            stemMatches.set(stem, new Set(matches));
            stemFreq.set(stem, matches.size);
        }
        if (stemMatches.size === 0)
            return [];
        // Collect all unique document keys
        const allKeys = new Set();
        for (const matches of stemMatches.values()) {
            for (const key of matches) {
                allKeys.add(key);
            }
        }
        const ranked = [];
        for (const key of allKeys) {
            const docStems = this.docToStems.get(key);
            if (!docStems)
                continue;
            const matchingTerms = new Set();
            let score = 0;
            for (const stem of stems) {
                const stemSet = stemMatches.get(stem);
                if (!stemSet || !stemSet.has(key))
                    continue;
                matchingTerms.add(stem);
                // Count how many times this stem appears in the document
                const docFreq = stemCount(docStems, stem);
                // Frequency in corpus (inverse document frequency style)
                const corpusFreq = stemFreq.get(stem) || 1;
                score += docFreq * (Math.log(1000 / corpusFreq) + 1);
            }
            if (matchingTerms.size === 0)
                continue;
            // Boost for matching more terms
            score *= (matchingTerms.size / stems.length);
            ranked.push({ key, score, matchingTerms });
        }
        ranked.sort((a, b) => {
            if (b.matchingTerms.size !== a.matchingTerms.size) {
                return b.matchingTerms.size - a.matchingTerms.size;
            }
            return b.score - a.score;
        });
        // Map stem -> token
        const stemToToken = new Map();
        for (let i = 0; i < stems.length; i++) {
            stemToToken.set(stems[i], tokens[i]);
        }
        // Build results grouped by original token, preserving API shape
        const results = new Map();
        for (const token of tokens) {
            results.set(token, { word: token, matches: [] });
        }
        for (const { key, matchingTerms, score } of ranked) {
            const doc = this.docs.get(key);
            if (!doc)
                continue;
            const matchObj = {
                bibleId: doc.bibleId,
                bibleName: doc.bibleName,
                bookName: doc.bookName,
                testamentId: doc.testamentId,
                bookId: doc.bookId,
                chapterId: doc.chapterId,
                verseId: doc.verseId,
                text: doc.text,
                score,
                matchingTerms: Array.from(matchingTerms),
            };
            // Add to each result group that has matching stems
            const seen = new Set();
            for (const stem of matchingTerms) {
                const token = stemToToken.get(stem);
                if (token) {
                    const r = results.get(token);
                    if (r && !seen.has(r)) {
                        r.matches.push(matchObj);
                        seen.add(r);
                    }
                }
            }
        }
        return Array.from(results.values());
    }
    searchSimple(query) {
        const tokens = tokenize(query);
        for (const token of tokens) {
            if (shouldIgnoreWord(token))
                continue;
            const stem = simpleStem(token);
            if (this.index.has(stem))
                return true;
        }
        return false;
    }
    removeBible(bibleId) {
        const docKeys = this.bibleDocKeys.get(bibleId);
        if (docKeys) {
            for (const key of docKeys) {
                this.docs.delete(key);
                const stems = this.docToStems.get(key);
                if (stems) {
                    for (const stem of stems) {
                        const set = this.index.get(stem);
                        if (set) {
                            set.delete(key);
                            if (set.size === 0) {
                                this.index.delete(stem);
                            }
                        }
                    }
                }
                this.docToStems.delete(key);
            }
            this.bibleDocKeys.delete(bibleId);
        }
        this.versionBibleNames.delete(bibleId);
    }
    getBibleCount() {
        return this.versionBibleNames.size;
    }
    getDocumentCount() {
        return this.docs.size;
    }
    getLoadedBibleIds() {
        return Array.from(this.versionBibleNames.keys());
    }
}
